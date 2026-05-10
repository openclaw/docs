---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresyjnych dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw testowy: pakiety testów jednostkowych/e2e/live, runnery Docker oraz zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-05-10T19:41:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy pakiety Vitest (jednostkowe/integracyjne, e2e, na żywo) oraz niewielki zestaw
runnerów Docker. Ten dokument jest przewodnikiem „jak testujemy”:

- Co obejmuje każdy pakiet (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed wysłaniem zmian, podczas debugowania).
- Jak testy na żywo wykrywają poświadczenia i wybierają modele/dostawców.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/dostawcami.

<Note>
**Stos QA (qa-lab, qa-channel, ścieżki transportu na żywo)** jest udokumentowany osobno:

- [Omówienie QA](/pl/concepts/qa-e2e-automation) - architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [QA macierzy](/pl/concepts/qa-matrix) - dokumentacja referencyjna dla `pnpm openclaw qa matrix`.
- [Kanał QA](/pl/channels/qa-channel) - syntetyczny Plugin transportowy używany przez scenariusze oparte na repozytorium.

Ta strona obejmuje uruchamianie zwykłych pakietów testów oraz runnerów Docker/Parallels. Poniższa sekcja dotycząca runnerów specyficznych dla QA ([runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większości dni:

- Pełna bramka (oczekiwana przed wysłaniem zmian): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego pakietu na maszynie z dużymi zasobami: `pnpm test:max`
- Bezpośrednia pętla obserwacji Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw preferuj uruchomienia ukierunkowane.
- Witryna QA oparta na Docker: `pnpm qa:lab:up`
- Ścieżka QA oparta na maszynie wirtualnej Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów lub chcesz większej pewności:

- Bramka pokrycia: `pnpm test:coverage`
- Pakiet E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych poświadczeń):

- Pakiet na żywo (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku na żywo: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Raporty wydajności środowiska uruchomieniowego: uruchom `OpenClaw Performance` z
  `live_gpt54=true` dla rzeczywistej tury agenta `openai/gpt-5.4` albo
  `deep_profile=true` dla artefaktów CPU/sterty/śladu Kova. Codzienne zaplanowane uruchomienia
  publikują artefakty ścieżek mock-provider, deep-profile oraz GPT 5.4 do
  `openclaw/clawgrit-reports`, gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`. Raport
  mock-provider zawiera także liczby na poziomie źródła dotyczące uruchamiania Gateway, pamięci,
  obciążenia Pluginami, powtarzanej pętli hello-loop fałszywego modelu oraz startu CLI.
- Przegląd modeli na żywo w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają także małą turę obrazową.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` albo
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii dostawcy.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` oraz ręczne
    `OpenClaw Release Checks` wywołują wielokrotnego użytku przepływ pracy live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy modeli na żywo Docker
    podzielone według dostawcy.
  - Dla ukierunkowanych ponownych uruchomień CI uruchom `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodaj nowe, wysokosygnałowe sekrety dostawców do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    zaplanowanych/release’owych wywołań.
- Test dymny natywnego powiązanego czatu Codex: `pnpm test:docker:live-codex-bind`
  - Uruchamia ścieżkę Docker na żywo względem ścieżki serwera aplikacji Codex, wiąże syntetyczną
    wiadomość prywatną Slack za pomocą `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź i załącznik obrazowy
    przechodzą przez natywne powiązanie Pluginu zamiast ACP.
- Test dymny uprzęży serwera aplikacji Codex: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agenta Gateway przez należącą do Pluginu uprząż serwera aplikacji Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie wykonuje sondy obrazu,
    cron MCP, podagenta oraz Guardian. Wyłącz sondę podagenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii serwera
    aplikacji Codex. Aby wykonać ukierunkowane sprawdzenie podagenta, wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    To kończy działanie po sondzie podagenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Test dymny instalacji Codex na żądanie: `pnpm test:docker:codex-on-demand`
  - Instaluje spakowany tarball OpenClaw w Docker, uruchamia onboarding z kluczem OpenAI API
    i weryfikuje, że Plugin Codex oraz zależność `@openai/codex`
    zostały pobrane do zarządzanego katalogu głównego npm na żądanie.
- Test dymny zależności narzędzia Pluginu na żywo: `pnpm test:docker:live-plugin-tool`
  - Pakuje przykładowy Plugin z prawdziwą zależnością `slugify`, instaluje go przez
    `npm-pack:`, weryfikuje zależność pod zarządzanym katalogiem głównym npm, a następnie prosi
    model OpenAI na żywo o wywołanie narzędzia Pluginu i zwrócenie ukrytego sluga.
- Test dymny polecenia ratunkowego Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalne sprawdzenie zabezpieczające powierzchni polecenia ratunkowego kanału wiadomości.
    Wykonuje `/crestodian status`, kolejkuje trwałą zmianę modelu, odpowiada `/crestodian yes`
    i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Test dymny planera Crestodian w Docker: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że rozmyte awaryjne planowanie przekłada się na audytowany, typowany
    zapis konfiguracji.
- Test dymny pierwszego uruchomienia Crestodian w Docker: `pnpm test:docker:crestodian-first-run`
  - Startuje od pustego katalogu stanu OpenClaw, kieruje gołe `openclaw` do
    Crestodian, stosuje zapisy setup/model/agent/Plugin Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0 jest
    także pokryta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Test dymny kosztów Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6, a transkrypt
  asystenta zapisuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego przypadku zakończonego niepowodzeniem, preferuj zawężanie testów na żywo za pomocą zmiennych środowiskowych listy dozwolonych opisanych poniżej.
</Tip>

## Runnery specyficzne dla QA

Te polecenia znajdują się obok głównych pakietów testów, gdy potrzebujesz realizmu QA-lab:

CI uruchamia QA Lab w dedykowanych przepływach pracy. Parzystość agentowa jest zagnieżdżona pod
`QA-Lab - All Lanes` oraz walidacją release’u, a nie jako samodzielny przepływ PR.
Szeroka walidacja powinna używać `Full Release Validation` z
`rerun_group=qa-parity` albo grupy QA kontroli release’u. Stabilne/domyślne kontrole release’u
trzymają wyczerpujący soak na żywo/Docker za `run_release_soak=true`; profil
`full` wymusza włączenie soak. `QA-Lab - All Lanes`
uruchamia się co noc na `main` oraz z ręcznego wywołania ze ścieżką parzystości mock,
ścieżką Matrix na żywo, zarządzaną przez Convex ścieżką Telegram na żywo oraz zarządzaną przez Convex
ścieżką Discord na żywo jako zadaniami równoległymi. Zaplanowane QA i kontrole release’u przekazują Matrix
`--profile fast` jawnie, podczas gdy CLI Matrix i ręczne wejście przepływu pracy
domyślnie pozostają `all`; ręczne wywołanie może podzielić `all` na zadania `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`. `OpenClaw Release
Checks` uruchamia parzystość oraz szybkie ścieżki Matrix i Telegram przed zatwierdzeniem release’u,
używając `mock-openai/gpt-5.5` dla kontroli transportu release’u, aby pozostały
deterministyczne i unikały normalnego startu Pluginu dostawcy. Te transportowe
Gatewaye na żywo wyłączają wyszukiwanie pamięci; zachowanie pamięci pozostaje pokryte przez pakiety
parzystości QA.

Pełne release’owe shardy mediów na żywo używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który już ma
`ffmpeg` i `ffprobe`. Shardy modeli/backendów na żywo Docker używają współdzielonego obrazu
`ghcr.io/openclaw/openclaw-live-test:<sha>` zbudowanego raz dla wybranego
commita, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
w każdym shardzie.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    procesami roboczymi Gateway. `qa-channel` domyślnie używa współbieżności 4
    (ograniczonej liczbą wybranych scenariuszy). Użyj `--concurrency <count>`,
    aby dostroić liczbę procesów roboczych, albo `--concurrency 1` dla starszej
    ścieżki szeregowej.
  - Kończy się kodem niezerowym, gdy którykolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez kodu wyjścia oznaczającego błąd.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego
    pokrycia fixture i atrap protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm test:plugins:kitchen-sink-live`
  - Uruchamia gauntlet aktywnego OpenAI Kitchen Sink Plugin przez QA Lab.
    Instaluje zewnętrzny pakiet Kitchen Sink, weryfikuje inwentarz powierzchni
    plugin SDK, sonduje `/healthz` i `/readyz`, zapisuje dowody CPU/RSS Gateway,
    uruchamia aktywną turę OpenAI i sprawdza diagnostykę adwersarialną.
    Wymaga aktywnego uwierzytelnienia OpenAI, takiego jak `OPENAI_API_KEY`. W nawodnionych sesjach Testbox
    automatycznie ładuje profil aktywnego uwierzytelnienia Testbox, gdy obecny jest
    pomocnik `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia benchmark startu Gateway oraz mały pakiet scenariuszy mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    pod `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie flaguje tylko utrzymujące się obserwacje wysokiego CPU (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), więc krótkie skoki podczas startu są zapisywane jako metryki
    bez wyglądania jak wielominutowa regresja obciążenia Gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma
    jeszcze świeżych wyników runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA w jednorazowej maszynie wirtualnej Linux Multipass.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Aktywne uruchomienia przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla gościa:
    klucze dostawców z env, ścieżkę konfiguracji aktywnego dostawcy QA oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje normalny raport QA i podsumowanie oraz logi Multipass pod
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia witrynę QA opartą na Dockerze do operatorskiej pracy QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Dockerze, uruchamia nieinteraktywny onboarding klucza API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że spakowany runtime plugin ładuje się bez naprawy zależności podczas startu,
    uruchamia doctor i wykonuje jedną lokalną turę agenta względem
    zamockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę instalacji pakietowej
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny smoke Docker zbudowanej aplikacji dla osadzonych transkrypcji kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niestandardowy komunikat niewyświetlany zamiast wyciekać do widocznej tury użytkownika,
    a następnie zasiewa uszkodzony JSONL dotkniętej sesji i weryfikuje, że
    `openclaw doctor --fix` przepisuje go do aktywnej gałęzi z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydata pakietu OpenClaw w Dockerze, uruchamia onboarding zainstalowanego pakietu,
    konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    aktywnej ścieżki QA Telegram z tym zainstalowanym pakietem jako Gateway SUT.
  - Wrapper montuje tylko źródło harnessa `qa-lab` z checkoutu; zainstalowany
    pakiet jest właścicielem `dist`, `openclaw/plugin-sdk` oraz bundlowanego runtime plugin,
    więc ścieżka nie miesza bieżących plugins z checkoutu z testowanym pakietem.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` albo
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby przetestować rozwiązany lokalny tarball zamiast
    instalować z rejestru.
  - Używa tych samych poświadczeń env Telegram albo źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/release ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Docker automatycznie wybiera Convex.
  - Wrapper waliduje env poświadczeń Telegram lub Convex na hoście przed
    pracą Docker build/install. Ustaw `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    tylko przy celowym debugowaniu konfiguracji przed poświadczeniami.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow maintainerów
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Workflow używa
    środowiska `qa-live-shared` i dzierżaw poświadczeń Convex CI.
- GitHub Actions udostępnia też `Package Acceptance` do pobocznego uruchamiania dowodu produktu
  względem jednego pakietu kandydującego. Przyjmuje zaufany ref, opublikowaną specyfikację npm,
  URL tarballa HTTPS plus SHA-256 albo artefakt tarballa z innego uruchomienia, przesyła
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
    ze skonfigurowanym OpenAI, a następnie włącza bundlowany channel/plugins przez edycje konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieskonfigurowane pobieralne plugins nieobecne,
    pierwsza skonfigurowana naprawa doctor instaluje jawnie każdy brakujący pobieralny
    plugin, a drugi restart nie uruchamia ukrytej naprawy zależności.
  - Instaluje też znany starszy baseline npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor kandydata po aktualizacji
    czyści pozostałości zależności starszego plugin bez naprawy postinstall po stronie harnessa.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny smoke aktualizacji instalacji pakietowej na gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet baseline, potem uruchamia
    zainstalowane polecenie `openclaw update` w tym samym gościu i weryfikuje
    zainstalowaną wersję, status aktualizacji, gotowość Gateway oraz jedną lokalną turę agenta.
  - Użyj `--platform macos`, `--platform windows` albo `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json` dla ścieżki artefaktu podsumowania i
    statusu poszczególnych ścieżek.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` dla dowodu aktywnej tury agenta.
    Przekaż `--model <provider/model>` albo ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny
    model OpenAI.
  - Owiń długie lokalne uruchomienia timeoutem hosta, aby zastoje transportu Parallels nie mogły
    zużyć reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek pod `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` albo `linux-update.log`
    przed uznaniem, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić 10 do 15 minut w doctorze po aktualizacji i pracy
    aktualizacji pakietów na zimnym gościu; to nadal jest prawidłowe, gdy zagnieżdżony log debug npm
    postępuje.
  - Nie uruchamiaj tego zbiorczego wrappera równolegle z pojedynczymi ścieżkami smoke Parallels
    macOS, Windows albo Linux. Współdzielą stan VM i mogą kolidować przy
    przywracaniu snapshotu, serwowaniu pakietów albo stanie Gateway gościa.
  - Dowód po aktualizacji uruchamia normalną powierzchnię bundlowanych plugin, ponieważ
    fasady możliwości, takie jak speech, image generation i media
    understanding, są ładowane przez bundlowane API runtime nawet wtedy, gdy sama tura agenta
    sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośredniego testowania smoke protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia aktywną ścieżkę QA Matrix względem jednorazowego homeservera Tuwunel opartego na Dockerze. Tylko checkout źródłowy - instalacje pakietowe nie dostarczają `qa-lab`.
  - Pełne CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów: [Matrix QA](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia aktywną ścieżkę QA Telegram względem prawdziwej prywatnej grupy, używając tokenów drivera i bota SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych pulowanych poświadczeń. Domyślnie użyj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć pulowane dzierżawy.
  - Domyślne ustawienia obejmują canary, bramkowanie wzmianek, adresowanie poleceń, `/status`, odpowiedzi bot-do-bota ze wzmianką oraz odpowiedzi natywnych poleceń core. Domyślne ustawienia `mock-openai` obejmują też deterministyczne regresje łańcucha odpowiedzi i strumieniowania finalnej wiadomości Telegram. Użyj `--list-scenarios` dla opcjonalnych sond, takich jak `session_status`.
  - Kończy się kodem niezerowym, gdy którykolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz uzyskać artefakty bez kodu wyjścia oznaczającego błąd.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, z botem SUT udostępniającym nazwę użytkownika Telegram.
  - Aby uzyskać stabilną obserwację bot-do-bota, włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot drivera może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt observed-messages pod `.artifacts/qa-e2e/...`. Scenariusze z odpowiedzią obejmują RTT od żądania wysłania drivera do zaobserwowanej odpowiedzi SUT.

`Mantis Telegram Live` to wrapper dowodowy PR wokół tej ścieżki. Uruchamia
ref kandydata z poświadczeniami Telegram dzierżawionymi z Convex, renderuje zredagowaną
transkrypcję observed-message w przeglądarce desktopowej Crabbox, nagrywa dowód MP4,
generuje GIF przycięty do ruchu, przesyła pakiet artefaktów i publikuje inline dowód PR
przez Mantis GitHub App, gdy ustawione jest `pr_number`. Maintainerzy mogą
uruchomić go z UI Actions przez `Mantis Scenario` (`scenario_id:
telegram-live`) albo bezpośrednio z komentarza pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Dzierżawi lub ponownie używa pulpitu Linux Crabbox, instaluje natywny Telegram Desktop, konfiguruje OpenClaw z dzierżawionym tokenem bota Telegram SUT, uruchamia Gateway i rejestruje dowody w postaci zrzutów ekranu/MP4 z widocznego pulpitu VNC.
  - Domyślnie używa `--credential-source convex`, więc przepływy pracy potrzebują tylko sekretu brokera Convex. Użyj `--credential-source env` z tymi samymi zmiennymi `OPENCLAW_QA_TELEGRAM_*` co `pnpm openclaw qa telegram`.
  - Telegram Desktop nadal wymaga logowania/profilu użytkownika. Token bota konfiguruje tylko OpenClaw. Użyj `--telegram-profile-archive-env <name>` dla archiwum profilu `.tgz` zakodowanego w base64 albo użyj `--keep-lease` i zaloguj się ręcznie raz przez VNC.
  - Zapisuje `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` oraz `telegram-desktop-builder.mp4` w katalogu wyjściowym.

Ścieżki transportu live współdzielą jeden standardowy kontrakt, aby nowe transporty nie rozbiegały się; macierz pokrycia dla poszczególnych ścieżek znajduje się w [przeglądzie QA → Pokrycie transportu live](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` to szeroki syntetyczny zestaw testów i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
QA transportu live, QA lab pozyskuje wyłączną dzierżawę z puli obsługiwanej przez Convex, wysyła Heartbeat dla tej
dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamknięciu. Nazwa sekcji powstała przed
obsługą Discord, Slack i WhatsApp; kontrakt dzierżawy jest współdzielony między rodzajami.

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` zezwala na adresy URL Convex w loopback `http://` wyłącznie do programowania lokalnego.

`OPENCLAW_QA_CONVEX_SITE_URL` powinno używać `https://` w normalnym działaniu.

Polecenia administracyjne maintainerów (dodawanie/usuwanie/listowanie puli) wymagają konkretnie
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocniki CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami live, aby sprawdzić adres URL witryny Convex, sekrety brokera,
prefiks endpointu, limit czasu HTTP oraz osiągalność admin/list bez drukowania
wartości sekretów. Użyj `--json` dla wyjścia czytelnego maszynowo w skryptach i narzędziach
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
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca źle sformowane payloady.

Kształt payloadu dla rodzaju rzeczywistego użytkownika Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` i `telegramApiId` muszą być ciągami numerycznymi.
- `tdlibArchiveSha256` i `desktopTdataArchiveSha256` muszą być szesnastkowymi ciągami SHA-256.
- `kind: "telegram-user"` reprezentuje jedno jednorazowe konto Telegram. Traktuj dzierżawę jako obejmującą całe konto: sterownik CLI TDLib i wizualny świadek Telegram Desktop odtwarzają stan z tego samego payloadu, a tylko jedno zadanie powinno utrzymywać dzierżawę naraz.

Przywracanie dzierżawy rzeczywistego użytkownika Telegram:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

Użyj przywróconego profilu Desktop z `Telegram -workdir "$tmp/desktop"`, gdy potrzebne jest nagranie wizualne. W lokalnych środowiskach operatorskich `scripts/e2e/telegram-user-credential.ts` domyślnie odczytuje `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env`, jeśli zmienne środowiskowe procesu są nieobecne.

Sesja Crabbox sterowana przez agenta:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` dzierżawi poświadczenie `telegram-user`, przywraca to samo konto do
TDLib i Telegram Desktop na pulpicie Linux Crabbox, uruchamia lokalny mock SUT
Gateway z bieżącego checkoutu, otwiera widoczny czat Telegram, uruchamia
nagrywanie pulpitu i zapisuje prywatny `session.json`. Gdy sesja jest
aktywna, agent może kontynuować testowanie, aż uzna wynik za zadowalający:

- `send --session <file> --text <message>` wysyła przez rzeczywistego użytkownika TDLib i czeka na odpowiedź SUT.
- `run --session <file> -- <remote command>` uruchamia dowolne polecenie na Crabbox i zapisuje jego wyjście, na przykład `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` przechwytuje aktualnie widoczny pulpit.
- `status --session <file>` drukuje dzierżawę i polecenie WebVNC.
- `finish --session <file>` zatrzymuje rejestrator, przechwytuje zrzut ekranu/wideo/artefakty przycięcia ruchu, zwalnia poświadczenie Convex, zatrzymuje lokalne procesy SUT i zatrzymuje dzierżawę Crabbox, chyba że przekazano `--keep-box`.
- `publish --session <file> --pr <number>` domyślnie publikuje komentarz PR tylko z GIF-em. Przekaż `--full-artifacts` tylko wtedy, gdy logi lub artefakty JSON są celowo potrzebne.

Dla deterministycznych wizualnych reprodukcji przekaż `--mock-response-file <path>` do `start`
lub do skrótu jednopoleceniowego `probe`. Runner domyślnie używa standardowej
klasy Crabbox, nagrywania 24 fps, podglądów GIF ruchu 24 fps i szerokości GIF
1920 px. Nadpisuj za pomocą `--class`, `--record-fps`, `--preview-fps` i
`--preview-width` tylko wtedy, gdy dowód wymaga innych ustawień przechwytywania.

Jednopoleceniowy dowód Crabbox:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Domyślne polecenie `probe` jest skrótem dla jednego cyklu start/send/finish. Użyj
go do szybkiego smoke `/status`. Użyj poleceń sesji do przeglądu PR,
reprodukcji błędów lub każdego przypadku, w którym agent potrzebuje minut dowolnego
eksperymentowania przed uznaniem dowodu za kompletny. Użyj `--id <cbx_...>`, aby
ponownie użyć rozgrzanej dzierżawy pulpitu, `--keep-box`, aby pozostawić VNC otwarte po finish,
`--desktop-chat-title <name>`, aby wybrać widoczny czat, oraz `--tdlib-url <tgz>`,
gdy używasz wcześniej przygotowanego archiwum Linux `libtdjson.so` zamiast budować TDLib na
świeżym pudełku. Runner weryfikuje `--tdlib-url` za pomocą `--tdlib-sha256 <hex>` albo,
domyślnie, sąsiedniego pliku `<url>.sha256`.

Payloady wielokanałowe walidowane przez brokera:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Ścieżki Slack także mogą dzierżawić z puli, ale walidacja payloadu Slack obecnie
znajduje się w runnerze QA Slack, a nie w brokerze. Użyj
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
dla wierszy Slack.

### Dodawanie kanału do QA

Architektura i nazwy pomocników scenariuszy dla nowych adapterów kanałów znajdują się w [przeglądzie QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonym styku hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście Plugin, zamontuj jako `openclaw qa <runner>` i utwórz scenariusze w `qa/scenarios/`.

## Zestawy testów (co działa gdzie)

Traktuj zestawy jako „rosnący realizm” (oraz rosnącą niestabilność/koszt):

### Jednostkowe / integracyjne (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: nieukierunkowane uruchomienia używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać shardy wieloprojektowe do konfiguracji per projekt na potrzeby równoległego planowania
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI działają w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie Gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje znanych błędów
- Oczekiwania:
  - Działa w CI
  - Nie wymaga prawdziwych kluczy
  - Powinien być szybki i stabilny
  - Testy resolvera i loadera powierzchni publicznej muszą potwierdzać szerokie zachowanie fallback `api.js` i
    `runtime-api.js` przy użyciu wygenerowanych małych fikstur Plugin, a nie
    rzeczywistych źródłowych API dołączonego Plugin. Rzeczywiste ładowania API Plugin należą do
    zestawów kontraktowych/integracyjnych należących do Plugin.

Zasady natywnych zależności:

- Domyślne instalacje testowe pomijają opcjonalne natywne kompilacje Discord opus. Odbiór głosu Discord używa dekodera pure-JS `opusscript`, a `@discordjs/opus` pozostaje w `ignoredBuiltDependencies`, aby lokalne testy i ścieżki Testbox nie kompilowały natywnego dodatku.
- Użyj dedykowanej ścieżki wydajnościowej lub live dla głosu Discord, jeśli celowo musisz porównać natywną kompilację opus. Nie dodawaj `@discordjs/opus` z powrotem do domyślnego `onlyBuiltDependencies`; sprawia to, że niepowiązane pętle instalacji/testów kompilują kod natywny.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Niekierunkowe `pnpm test` uruchamia dwanaście mniejszych konfiguracji fragmentów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu projektu głównego. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega temu, by prace auto-reply/rozszerzeń zagłuszały niepowiązane zestawy testów.
    - `pnpm test --watch` nadal używa natywnego grafu projektu głównego `vitest.config.ts`, ponieważ pętla obserwowania wielu fragmentów nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez zakresowe pasy, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika pełnego kosztu uruchomienia projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git w tanie zakresowe pasy: bezpośrednie edycje testów, sąsiednie pliki `*.test.ts`, jawne mapowania źródeł oraz lokalne zależności grafu importów. Edycje konfiguracji/setupu/pakietu nie uruchamiają testów szeroko, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka sprawdzająca dla wąskich zmian. Klasyfikuje diff na core, testy core, rozszerzenia, testy rozszerzeń, aplikacje, dokumentację, metadane wydania, narzędzia live Docker i narzędzia, a następnie uruchamia pasujące polecenia typecheck, lint i guard. Nie uruchamia testów Vitest; dla dowodu testowego wywołaj `pnpm test:changed` albo jawne `pnpm test <target>`. Zmiany wersji dotyczące tylko metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych, z guardem odrzucającym zmiany pakietu poza polem wersji najwyższego poziomu.
    - Edycje live Docker ACP harness uruchamiają ukierunkowane kontrole: składnię powłoki dla skryptów uwierzytelniania live Docker oraz przebieg próbny harmonogramu live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff ogranicza się do `scripts["test:docker:live-*"]`; zależności, eksporty, wersje i inne edycje powierzchni pakietu nadal używają szerszych guardów.
    - Lekkie pod względem importów testy jednostkowe z agentów, poleceń, Pluginów, helperów auto-reply, `plugin-sdk` i podobnych obszarów czysto narzędziowych są kierowane przez pas `unit-fast`, który pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie runtime pozostają na istniejących pasach.
    - Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` również mapują uruchomienia w trybie changed na jawne sąsiednie testy w tych lekkich pasach, więc edycje helperów unikają ponownego uruchamiania całego ciężkiego zestawu dla tego katalogu.
    - `auto-reply` ma dedykowane koszyki dla helperów core najwyższego poziomu, integracyjnych testów `reply.*` najwyższego poziomu oraz poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na fragmenty agent-runner, dispatch i commands/state-routing, aby jeden koszyk ciężki od importów nie przejmował całego końcowego obciążenia Node.
    - Normalne CI dla PR/main celowo pomija zbiorcze przejście rozszerzeń i shard `agentic-plugins` wyłącznie dla wydań. Pełna walidacja wydania uruchamia osobny workflow podrzędny `Plugin Prerelease` dla tych zestawów ciężkich od Pluginów/rozszerzeń na kandydatach do wydania.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Gdy zmieniasz wejścia wykrywania message-tool albo kontekst runtime compaction,
      zachowaj oba poziomy pokrycia.
    - Dodaj ukierunkowane regresje helperów dla granic czystego routingu i normalizacji.
    - Utrzymuj zdrowe integracyjne zestawy wbudowanego runnera:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy weryfikują, że identyfikatory zakresowe i zachowanie compaction nadal przepływają
      przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy wyłącznie helperów
      nie są wystarczającym zamiennikiem tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Wspólna konfiguracja Vitest ustawia `isolate: false` i używa
      nieizolowanego runnera w projektach głównych, konfiguracjach e2e i live.
    - Główny pas UI zachowuje setup i optymalizator `jsdom`, ale także działa na
      wspólnym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same ustawienia domyślne `threads` + `isolate: false`
      ze wspólnej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów podrzędnych Node
      Vitest, aby zmniejszyć narzut kompilacji V8 podczas dużych lokalnych uruchomień.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze standardowym
      zachowaniem V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` pokazuje, które pasy architektoniczne wyzwala diff.
    - Hook pre-commit wykonuje tylko formatowanie. Ponownie dodaje sformatowane pliki do stage
      i nie uruchamia lint, typecheck ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem lub wypchnięciem, gdy
      potrzebujesz inteligentnej lokalnej bramki sprawdzającej.
    - `pnpm test:changed` domyślnie kieruje przez tanie zakresowe pasy. Używaj
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent
      uzna, że edycja harness, konfiguracji, pakietu lub kontraktu naprawdę wymaga szerszego
      pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu,
      tylko z wyższym limitem workerów.
    - Lokalne automatyczne skalowanie workerów jest celowo konserwatywne i cofa się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele równoległych
      uruchomień Vitest domyślnie wyrządza mniej szkód.
    - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracyjne jako
      `forceRerunTriggers`, więc ponowne uruchomienia w trybie changed pozostają poprawne, gdy zmienia się
      okablowanie testów.
    - Konfiguracja utrzymuje `OPENCLAW_VITEST_FS_MODULE_CACHE` włączone na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jedną jawną lokalizację cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz
      wyjście rozbicia importów.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Uruchomienia całych konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI z wzorcem include
      dopisują nazwę sharda, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu w importach startowych,
      trzymaj ciężkie zależności za wąskim lokalnym szwem `*.runtime.ts` i
      mockuj ten szew bezpośrednio zamiast wykonywać głębokie importy helperów runtime tylko
      po to, by przekazać je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane
      `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego
      diffu i wypisuje czas zegarowy oraz maksymalne RSS na macOS.
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
- Konfiguracja: `vitest.gateway.config.ts`, wymuszona na jednego workera
- Zakres:
  - Uruchamia prawdziwy loopback Gateway z domyślnie włączoną diagnostyką
  - Przepuszcza syntetyczny churn wiadomości gateway, pamięci i dużych ładunków przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje helpery utrwalania diagnostycznego pakietu stabilności
  - Asercje sprawdzają, że rejestrator pozostaje ograniczony, syntetyczne próbki RSS mieszczą się w budżecie presji, a głębokości kolejek na sesję wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąski pas do działań następczych po regresjach stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (gateway smoke)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E dołączonych Pluginów pod `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie silent, aby ograniczyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>` wymusza liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1` ponownie włącza szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end gateway w wielu instancjach
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
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Ćwiczy backend OpenShell OpenClaw przez prawdziwe `sandbox ssh-config` + SSH exec
  - Weryfikuje zdalnie kanoniczne zachowanie systemu plików przez most sandbox fs
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test przy ręcznym uruchamianiu szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowy binarny plik CLI lub skrypt opakowujący

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Pluginów pod `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model faktycznie działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wyłapuje zmiany formatów dostawców, osobliwości tool-calling, problemy z auth i zachowanie limitów szybkości
- Oczekiwania:
  - Z założenia niestabilne dla CI (prawdziwe sieci, prawdziwe polityki dostawców, limity, awarie)
  - Kosztuje pieniądze / używa limitów szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live wczytują `~/.profile`, aby pobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał konfiguracji/auth do tymczasowego testowego home, aby fixture’y jednostkowe nie mogły zmodyfikować twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały twojego prawdziwego katalogu home.
- `pnpm test:live` domyślnie działa teraz w cichszym trybie: zachowuje wyjście postępu `[live] ...`, ale tłumi dodatkową informację `~/.profile` i wycisza logi bootstrapu gateway/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie z przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per-live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają przy odpowiedziach z limitem szybkości.
- Wyjście postępu/Heartbeat:
  - Zestawy live emitują teraz linie postępu do stderr, więc długie wywołania dostawców są widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, więc linie postępu dostawcy/gateway są strumieniowane natychmiast podczas uruchomień live.
  - Dostrój bezpośrednie Heartbeat modeli za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostrój Heartbeat gateway/probe za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw mam uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniłeś dużo)
- Dotykanie sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Informacje o macierzy modeli live, smoke testach backendu CLI, smoke testach ACP, harnessie serwera aplikacji Codex oraz wszystkich testach live dostawców mediów (Deepgram, BytePlus, ComfyUI, obraz, muzyka, wideo, harness mediów) - a także o obsłudze poświadczeń dla uruchomień live - znajdziesz w
[Testowanie zestawów live](/pl/help/testing-live). Dedykowaną listę kontrolną aktualizacji i walidacji pluginów znajdziesz w
[Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

## Runnery Docker (opcjonalne kontrole „działa w Linux”)

Te runnery Docker dzielą się na dwie grupy:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live klucza profilu wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i workspace (oraz wczytując `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie mają mniejszy limit smoke testów, aby pełny przebieg Docker pozostał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne środowiskowe, gdy
  jawnie chcesz wykonać większe, wyczerpujące skanowanie.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Obraz podstawowy jest tylko runnerem Node/Git dla ścieżek instalacji/aktualizacji/zależności pluginów; te ścieżki montują wcześniej zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego harmonogramu: `OPENCLAW_DOCKER_ALL_PARALLELISM` kontroluje sloty procesów, a limity zasobów zapobiegają jednoczesnemu startowi ciężkich ścieżek live, instalacji npm i wielousługowych. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, scheduler nadal może ją uruchomić, gdy pula jest pusta, a następnie utrzymuje ją jako jedyną uruchomioną, dopóki pojemność znów nie będzie dostępna. Wartości domyślne to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas zasobów. Runner domyślnie wykonuje preflight Docker, usuwa przestarzałe kontenery E2E OpenClaw, wypisuje status co 30 sekund, zapisuje czasy udanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby w późniejszych uruchomieniach zaczynać od dłuższych ścieżek. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać ważony manifest ścieżek bez budowania ani uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wypisać plan CI dla wybranych ścieżek, potrzeb pakietów/obrazów i poświadczeń.
- `Package Acceptance` to natywna dla GitHub bramka pakietu dla pytania „czy ten instalowalny tarball działa jako produkt?”. Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` lub `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie tego tarballa zamiast ponownie pakować wybrany ref. Profile są uporządkowane według zakresu: `smoke`, `package`, `product` i `full`. Zobacz [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins), aby poznać kontrakt pakietu/aktualizacji/pluginu, macierz przetrwania opublikowanych aktualizacji, domyślne ustawienia wydań i triage awarii.
- Kontrole builda i wydania uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Guard przechodzi statyczny zbudowany graf od `dist/entry.js` i `dist/cli/run-main.js` i kończy się niepowodzeniem, jeśli uruchamianie przed dispatch importuje zależności pakietu, takie jak Commander, UI promptów, undici lub logowanie przed dispatch komendy; utrzymuje też spakowany chunk uruchamiania Gateway poniżej budżetu i odrzuca statyczne importy znanych zimnych ścieżek Gateway. Smoke test spakowanego CLI obejmuje też główną pomoc, pomoc onboard, pomoc doctor, status, schemat konfiguracji i komendę listy modeli.
- Zgodność wsteczna Package Acceptance jest ograniczona do `2026.4.25` (włącznie z `2026.4.25-beta.*`). Do tego punktu odcięcia harness toleruje tylko luki metadanych wysłanych pakietów: pominięte prywatne wpisy inwentarza QA, brak `gateway install --wrapper`, brak plików patchy w fixture git pochodzącym z tarballa, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji pluginów, brak utrwalania rekordów instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi awariami.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` i `test:docker:config-reload` uruchamiają jeden lub więcej rzeczywistych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker modeli live podłączają też przez bind mount tylko potrzebne katalogi domowe uwierzytelniania CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez mutowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke test wiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test uprzęży serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test obserwowalności: `pnpm qa:otel:smoke` to prywatna ścieżka QA z checkoutu źródeł. Celowo nie jest częścią ścieżek wydań pakietów Docker, ponieważ tarball npm pomija QA Lab.
- Smoke test na żywo Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator wdrażania (TTY, pełne szkieletowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke test tarballa npm dla wdrażania/kanału/agenta: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Dockerze, konfiguruje OpenAI przez wdrażanie z odwołaniem do zmiennych środowiskowych oraz domyślnie Telegram, uruchamia doctor i wykonuje jedną zamockowaną turę agenta OpenAI. Użyj ponownie wstępnie zbudowanego tarballa za pomocą `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta za pomocą `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo przełącz kanał za pomocą `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` lub `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke test instalacji Skills: `pnpm test:docker:skill-install` instaluje spakowany tarball OpenClaw globalnie w Dockerze, wyłącza instalacje przesłanych archiwów w konfiguracji, ustala aktualny slug Skills z ClawHub na żywo na podstawie wyszukiwania, instaluje go za pomocą `openclaw skills install` i weryfikuje zainstalowany Skills oraz metadane źródła/blokady `.clawhub`.
- Smoke test przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Dockerze, przełącza z pakietu `stable` na git `dev`, weryfikuje utrwalony kanał i działanie Plugin po aktualizacji, następnie przełącza z powrotem na pakiet `stable` i sprawdza status aktualizacji.
- Smoke test przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowany tarball OpenClaw na zabrudzonym fixture starego użytkownika z agentami, konfiguracją kanałów, listami dozwolonych Plugin, przestarzałym stanem zależności Plugin oraz istniejącymi plikami przestrzeni roboczej/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez kluczy dostawcy ani kanału na żywo, następnie uruchamia Gateway na local loopback i sprawdza zachowanie konfiguracji/stanu oraz budżety uruchamiania/statusu.
- Smoke test przetrwania opublikowanej aktualizacji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika, konfiguruje tę bazę za pomocą wbudowanej receptury poleceń, weryfikuje wynikową konfigurację, aktualizuje tę opublikowaną instalację do kandydującego tarballa, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway na local loopback i sprawdza skonfigurowane intencje, zachowanie stanu, uruchamianie, `/healthz`, `/readyz` oraz budżety statusu RPC. Nadpisz jedną bazę za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, poproś harmonogram agregujący o rozwinięcie dokładnych lokalnych baz za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, takich jak `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, i rozwiń fixture w kształcie zgłoszeń za pomocą `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, takich jak `reported-issues`; zestaw reported-issues zawiera `configured-plugin-installs` do automatycznej naprawy instalacji zewnętrznych Plugin OpenClaw. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`, rozwiązuje metatokeny bazowe, takie jak `last-stable-4` lub `all-since-2026.4.23`, a Full Release Validation rozwija bramkę pakietu release-soak do `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke test kontekstu runtime sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie ukrytego kontekstu runtime w transkrypcie oraz naprawę przez doctor dotkniętych zduplikowanych gałęzi przepisywania promptów.
- Smoke test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je za pomocą `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca wbudowanych dostawców obrazów zamiast się zawieszać. Użyj ponownie wstępnie zbudowanego tarballa za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń budowanie na hoście za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker za pomocą `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami root, update i direct-npm. Smoke test aktualizacji domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do kandydującego tarballa. Nadpisz lokalnie za pomocą `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo przez wejście `update_baseline_version` przepływu pracy Install Smoke na GitHubie. Kontrole instalatora bez roota zachowują izolowaną pamięć podręczną npm, aby wpisy pamięci podręcznej należące do roota nie maskowały zachowania lokalnej instalacji użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie używać pamięci podręcznej root/update/direct-npm przy lokalnych ponownych uruchomieniach.
- Install Smoke CI pomija zduplikowaną globalną aktualizację direct-npm za pomocą `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tej zmiennej środowiskowej, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke test CLI usuwania współdzielonej przestrzeni roboczej agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasila dwóch agentów jedną przestrzenią roboczą w izolowanym katalogu domowym kontenera, uruchamia `agents delete --json` i weryfikuje poprawny JSON oraz zachowanie zachowanej przestrzeni roboczej. Użyj ponownie obrazu install-smoke za pomocą `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, uwierzytelnianie WS + stan zdrowia): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test migawki Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje obraz źródłowy E2E oraz warstwę Chromium, uruchamia Chromium z surowym CDP, uruchamia `browser doctor --deep` i weryfikuje, że migawki ról CDP obejmują adresy URL linków, elementy klikalne promowane kursorem, referencje iframe i metadane ramek.
- Regresja minimalnego reasoning OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia zamockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, że surowe szczegóły pojawiają się w logach Gateway.
- Most kanału MCP (zasilony Gateway + most stdio + smoke test surowej ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (rzeczywisty serwer MCP stdio + smoke test osadzonego profilu Pi allow/deny): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagent (rzeczywisty Gateway + rozbiórka procesu potomnego MCP stdio po izolowanych uruchomieniach cron i jednorazowego subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, ClawHub kitchen-sink, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/runtime kitchen-sink za pomocą `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fixture ClawHub.
- Smoke test niezmienionej aktualizacji Plugin: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test macierzy cyklu życia Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instaluje spakowany tarball OpenClaw w pustym kontenerze, instaluje Plugin npm, przełącza włączanie/wyłączanie, aktualizuje i cofa go przez lokalny rejestr npm, usuwa zainstalowany kod, a następnie weryfikuje, że odinstalowanie nadal usuwa przestarzały stan, logując metryki RSS/CPU dla każdej fazy cyklu życia.
- Smoke test metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginy: `pnpm test:docker:plugins` obejmuje smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych referencji git, fixture ClawHub, aktualizacji marketplace oraz włączania/inspekcji pakietu Claude. `pnpm test:docker:plugin-update` obejmuje zachowanie niezmienionej aktualizacji dla zainstalowanych Plugin. `pnpm test:docker:plugin-lifecycle-matrix` obejmuje śledzone zasobowo instalowanie, włączanie, wyłączanie, aktualizowanie, cofanie i odinstalowanie przy brakującym kodzie Plugin npm.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazów specyficzne dla pakietu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest jeszcze lokalny. Testy Docker QR i instalatora zachowują własne Dockerfile, ponieważ weryfikują zachowanie pakietu/instalacji, a nie współdzielony runtime zbudowanej aplikacji.

Runnery Dockera dla modeli na żywo także montują bieżący checkout tylko do odczytu i
przenoszą go etapowo do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz
uruchomieniowy pozostaje lekki, a Vitest nadal działa na dokładnie Twoim lokalnym źródle/konfiguracji.
Krok etapowania pomija duże lokalne pamięci podręczne i wyjścia kompilacji aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi wyjściowe `.build` lub
Gradle, aby uruchomienia Dockera na żywo nie spędzały minut na kopiowaniu
artefaktów specyficznych dla maszyny.
Ustawiają także `OPENCLAW_SKIP_CHANNELS=1`, aby sondy Gateway na żywo nie uruchamiały
prawdziwych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż również
`OPENCLAW_LIVE_GATEWAY_*`, gdy musisz zawęzić lub wykluczyć pokrycie Gateway
na żywo z tej ścieżki Dockera.
`test:docker:openwebui` to wyższego poziomu test dymny zgodności: uruchamia kontener
Gateway OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
prawdziwe żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Ustaw `OPENWEBUI_SMOKE_MODE=models` dla kontroli CI ścieżki wydania, które powinny zakończyć się
po zalogowaniu w Open WebUI i wykryciu modeli, bez czekania na ukończenie modelu na żywo.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może musieć pobrać
obraz Open WebUI, a Open WebUI może musieć zakończyć własną konfigurację zimnego startu.
Ta ścieżka oczekuje używalnego klucza modelu na żywo, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest podstawowym sposobem dostarczenia go w uruchomieniach zdockeryzowanych.
Udane uruchomienia wypisują mały ładunek JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
prawdziwego konta Telegram, Discord ani iMessage. Uruchamia zasiany kontener Gateway,
uruchamia drugi kontener, który wywołuje `openclaw mcp serve`, a następnie
weryfikuje routowane wykrywanie konwersacji, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń na żywo, routing wysyłania wychodzącego oraz powiadomienia kanału +
uprawnień w stylu Claude przez prawdziwy most MCP stdio. Kontrola powiadomień
sprawdza bezpośrednio surowe ramki MCP stdio, więc test dymny weryfikuje to, co
most faktycznie emituje, a nie tylko to, co akurat ujawnia konkretny SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza modelu na żywo.
Buduje obraz Dockera repozytorium, uruchamia prawdziwy serwer sondy MCP stdio
wewnątrz kontenera, materializuje ten serwer przez osadzone środowisko uruchomieniowe Pi bundle
MCP, wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu na żywo.
Uruchamia zasiany Gateway z prawdziwym serwerem sondy MCP stdio, wykonuje
izolowaną turę Cron i jednorazową turę potomną `/subagents spawn`, a następnie weryfikuje,
że proces potomny MCP kończy działanie po każdym uruchomieniu.

Ręczny test dymny wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może być ponownie potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i źródłowane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować tylko zmienne środowiskowe źródłowane z `OPENCLAW_PROFILE_FILE`, przy użyciu tymczasowych katalogów konfiguracji/przestrzeni roboczej i bez zewnętrznych montowań uwierzytelnienia CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki uwierzytelnienia CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed rozpoczęciem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie za pomocą `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listy rozdzielonej przecinkami, takiej jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowania
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby zapewnić, że dane uwierzytelniające pochodzą z magazynu profilu (nie ze środowiska)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez Gateway dla testu dymnego Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt kontroli nonce używany przez test dymny Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchom kontrole dokumentacji po edycjach dokumentacji: `pnpm check:docs`.
Uruchom pełną walidację anchorów Mintlify, gdy potrzebujesz także kontroli nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To regresje „prawdziwego potoku” bez prawdziwych dostawców:

- Wywoływanie narzędzi Gateway (mock OpenAI, prawdziwy Gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: „uruchamia wywołanie narzędzia mock OpenAI od końca do końca przez pętlę agenta Gateway”)
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + wymusza uwierzytelnianie): `src/gateway/gateway.test.ts` (przypadek: „uruchamia kreator przez ws i zapisuje konfigurację tokenu uwierzytelniania”)

## Ewaluacje niezawodności agenta (Skills)

Mamy już kilka bezpiecznych dla CI testów, które zachowują się jak „ewaluacje niezawodności agenta”:

- Wywoływanie narzędzi na mockach przez prawdziwy Gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora od końca do końca, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwy skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które asercyjnie sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający dostawców mock, aby asercyjnie sprawdzać wywołania narzędzi + kolejność, odczyty plików skill i okablowanie sesji.
- Mały zestaw scenariuszy skupionych na skillach (użyć vs unikać, bramkowanie, wstrzyknięcie promptu).
- Opcjonalne ewaluacje na żywo (opt-in, bramkowane zmiennymi środowiskowymi) dopiero po przygotowaniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginu i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji kształtu i zachowania. Domyślna jednostkowa ścieżka `pnpm test` celowo
pomija te współdzielone pliki styku i testów dymnych; uruchamiaj polecenia kontraktowe jawnie,
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
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/listy
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
- **runtime** - Środowisko uruchomieniowe dostawcy
- **shape** - Kształt/interfejs pluginu
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu lub zmodyfikowaniu kanału albo pluginu dostawcy
- Po refaktoryzacji rejestracji lub wykrywania pluginów

Testy kontraktowe działają w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty na żywo:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (dostawca mock/stub albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli jest z natury tylko na żywo (limity szybkości, polityki uwierzytelniania), utrzymaj test na żywo jako wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która wyłapuje błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → bezpośredni test modeli
  - błąd potoku sesji/historii/narzędzi Gateway → test dymny Gateway na żywo albo bezpieczny dla CI test mock Gateway
- Bariera ochronna przechodzenia po SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza po jednym próbkowanym celu dla każdej klasy SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie asercyjnie sprawdza, że exec id z segmentami przechodzenia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo zawodzi na niesklasyfikowanych ID celów, aby nowe klasy nie mogły zostać po cichu pominięte.

## Powiązane

- [Testowanie na żywo](/pl/help/testing-live)
- [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)
- [CI](/pl/ci)
