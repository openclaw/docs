---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresyjnych dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw testowy: zestawy testów jednostkowych/e2e/na żywo, runnery Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-05-11T20:32:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw ma trzy zestawy testów Vitest (unit/integration, e2e, live) oraz niewielki zestaw
runnerów Docker. Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje).
- Które polecenia uruchamiać w typowych workflow (lokalnie, przed push, podczas debugowania).
- Jak testy live wykrywają dane uwierzytelniające i wybierają modele/providery.
- Jak dodawać regresje dla rzeczywistych problemów z modelami/providerami.

<Note>
**Stos QA (qa-lab, qa-channel, ścieżki transportu live)** jest udokumentowany osobno:

- [Omówienie QA](/pl/concepts/qa-e2e-automation) - architektura, powierzchnia poleceń, tworzenie scenariuszy.
- [Matrix QA](/pl/concepts/qa-matrix) - dokumentacja referencyjna dla `pnpm openclaw qa matrix`.
- [Kanał QA](/pl/channels/qa-channel) - syntetyczny Plugin transportu używany przez scenariusze oparte na repozytorium.

Ta strona opisuje uruchamianie zwykłych zestawów testów oraz runnerów Docker/Parallels. Sekcja runnerów specyficznych dla QA poniżej ([Runnery specyficzne dla QA](#qa-specific-runners)) wymienia konkretne wywołania `qa` i odsyła do powyższych materiałów referencyjnych.
</Note>

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na pojemnej maszynie: `pnpm test:max`
- Bezpośrednia pętla watch Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Podczas iteracji nad pojedynczą awarią najpierw preferuj uruchomienia ukierunkowane.
- Witryna QA oparta na Dockerze: `pnpm qa:lab:up`
- Ścieżka QA oparta na maszynie wirtualnej Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów albo chcesz większej pewności:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych providerów/modeli (wymaga prawdziwych danych uwierzytelniających):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Raporty wydajności runtime: wyślij `OpenClaw Performance` z
  `live_gpt54=true` dla rzeczywistej tury agenta `openai/gpt-5.4` albo
  `deep_profile=true` dla artefaktów CPU/sterty/trace Kova. Codzienne zaplanowane uruchomienia
  publikują artefakty ścieżek mock-provider, deep-profile i GPT 5.4 do
  `openclaw/clawgrit-reports`, gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`. Raport
  mock-provider zawiera także źródłowe pomiary uruchamiania Gateway, pamięci,
  obciążenia Pluginami, powtarzanej pętli hello-loop z fake-model oraz startu CLI.
- Przegląd modeli live w Dockerze: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową oraz małą sondę w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają także niewielką turę obrazową.
    Wyłącz dodatkowe sondy za pomocą `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` podczas izolowania awarii providera.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` oraz ręczne
    `OpenClaw Release Checks` wywołują wielorazowy workflow live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy modeli live w Dockerze
    shardowane według providera.
  - Dla ukierunkowanych ponowień w CI wyślij `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodawaj nowe, wartościowe sekrety providerów do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    wywołań zaplanowanych/release.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Uruchamia ścieżkę live Docker względem ścieżki app-server Codex, wiąże syntetyczną
    wiadomość prywatną Slack za pomocą `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź i załącznik obrazu
    przechodzą przez natywne wiązanie Pluginu zamiast ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Uruchamia tury agenta Gateway przez należący do Pluginu harness app-server Codex,
    weryfikuje `/codex status` i `/codex models`, a domyślnie wykonuje sondy obrazu,
    Cron MCP, podagenta i Guardian. Wyłącz sondę podagenta za pomocą
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` podczas izolowania innych awarii
    app-server Codex. Dla ukierunkowanego sprawdzenia podagenta wyłącz pozostałe sondy:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    To kończy działanie po sondzie podagenta, chyba że ustawiono
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Instaluje spakowany tarball OpenClaw w Dockerze, uruchamia onboarding z kluczem API OpenAI
    i weryfikuje, że Plugin Codex oraz zależność `@openai/codex`
    zostały pobrane do zarządzanego katalogu głównego npm na żądanie.
- Live plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - Pakuje testowy Plugin z prawdziwą zależnością `slugify`, instaluje go przez
    `npm-pack:`, weryfikuje zależność w zarządzanym katalogu głównym npm, a następnie prosi
    model live OpenAI o wywołanie narzędzia Pluginu i zwrócenie ukrytego slug.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opcjonalne, dodatkowe sprawdzenie powierzchni polecenia ratunkowego message-channel.
    Wykonuje `/crestodian status`, kolejkuje trwałą zmianę modelu,
    odpowiada `/crestodian yes` i weryfikuje ścieżkę zapisu audytu/konfiguracji.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Uruchamia Crestodian w kontenerze bez konfiguracji z fałszywym Claude CLI w `PATH`
    i weryfikuje, że fallback fuzzy planner przekłada się na audytowany, typowany
    zapis konfiguracji.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Startuje z pustego katalogu stanu OpenClaw, kieruje zwykłe `openclaw` do
    Crestodian, stosuje zapisy setup/model/agent/Plugin Discord + SecretRef,
    waliduje konfigurację i weryfikuje wpisy audytu. Ta sama ścieżka konfiguracji Ring 0 jest
    także pokryta w QA Lab przez
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: z ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6, a
  transkrypcja asystenta zapisuje znormalizowane `usage.cost`.

<Tip>
Gdy potrzebujesz tylko jednego przypadku awarii, preferuj zawężanie testów live za pomocą zmiennych środowiskowych allowlist opisanych poniżej.
</Tip>

## Runnery specyficzne dla QA

Te polecenia znajdują się obok głównych zestawów testów, gdy potrzebujesz realizmu QA Lab:

CI uruchamia QA Lab w dedykowanych workflow. Parzystość agentowa jest zagnieżdżona pod
`QA-Lab - All Lanes` i walidacją release, a nie w samodzielnym workflow PR.
Szeroka walidacja powinna używać `Full Release Validation` z
`rerun_group=qa-parity` albo grupy QA release-checks. Stabilne/domyślne kontrole release
trzymają wyczerpujący live/Docker soak za `run_release_soak=true`; profil
`full` wymusza soak. `QA-Lab - All Lanes`
uruchamia się nocą na `main` oraz z ręcznego dispatch z lane mock parity, lane live
Matrix, zarządzaną przez Convex lane live Telegram i zarządzaną przez Convex lane live Discord
jako zadaniami równoległymi. Zaplanowane QA i kontrole release jawnie przekazują Matrix
`--profile fast`, podczas gdy domyślne wartości CLI Matrix i wejścia ręcznego workflow
pozostają `all`; ręczny dispatch może shardować `all` na zadania `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`. `OpenClaw Release
Checks` uruchamia parity oraz szybkie lane Matrix i Telegram przed zatwierdzeniem release,
używając `mock-openai/gpt-5.5` do kontroli transportu release, aby pozostały
deterministyczne i uniknęły normalnego startu Pluginu providera. Te Gatewaye transportu live
wyłączają wyszukiwanie pamięci; zachowanie pamięci pozostaje pokryte przez zestawy QA parity.

Pełne shardy release live media używają
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, który ma już
`ffmpeg` i `ffprobe`. Shardy modeli/backendu live Docker używają współdzielonego obrazu
`ghcr.io/openclaw/openclaw-live-test:<sha>` zbudowanego raz dla wybranego
commitu, a następnie pobierają go z `OPENCLAW_SKIP_DOCKER_BUILD=1` zamiast przebudowywać
w każdym shardzie.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej
    liczbą wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić
    liczbę workerów, albo `--concurrency 1` dla starszej ścieżki szeregowej.
  - Kończy działanie kodem różnym od zera, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz artefakty bez błędnego kodu wyjścia.
  - Obsługuje tryby dostawcy `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego
    pokrycia fixture i makiet protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm test:plugins:kitchen-sink-live`
  - Uruchamia zestaw prób live pluginu OpenAI Kitchen Sink przez QA Lab. Instaluje
    zewnętrzny pakiet Kitchen Sink, weryfikuje inwentarz powierzchni plugin SDK,
    sonduje `/healthz` i `/readyz`, zapisuje dowody CPU/RSS gateway,
    uruchamia turę live OpenAI i sprawdza diagnostykę adwersarialną.
    Wymaga autoryzacji live OpenAI, takiej jak `OPENAI_API_KEY`. W uwodnionych sesjach Testbox
    automatycznie ładuje profil autoryzacji live Testbox, gdy obecny jest helper
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Uruchamia benchmark startu gateway oraz mały pakiet scenariuszy mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) i zapisuje połączone podsumowanie obserwacji CPU
    w `.artifacts/gateway-cpu-scenarios/`.
  - Domyślnie flaguje tylko utrzymujące się obserwacje wysokiego CPU (`--cpu-core-warn`
    oraz `--hot-wall-warn-ms`), więc krótkie skoki podczas startu są zapisywane jako metryki
    bez wyglądania jak regresja wielominutowego zablokowania gateway.
  - Używa zbudowanych artefaktów `dist`; najpierw uruchom build, gdy checkout nie ma
    jeszcze świeżego wyjścia runtime.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam pakiet QA wewnątrz jednorazowej maszyny wirtualnej Multipass Linux.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia autoryzacji QA, które są praktyczne dla gościa:
    klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz `CODEX_HOME`,
    gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod korzeniem repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje zwykły raport QA i podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia wspieraną przez Docker stronę QA do pracy QA w stylu operatorskim.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Docker, uruchamia nieinteraktywne wdrożenie z kluczem API OpenAI, domyślnie konfiguruje Telegram,
    weryfikuje, że spakowany runtime pluginu ładuje się bez naprawy zależności
    podczas startu, uruchamia doctor i wykonuje jedną lokalną turę agenta wobec
    zamockowanego endpointu OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą ścieżkę instalacji pakietowej
    z Discord.
- `pnpm test:docker:session-runtime-context`
  - Uruchamia deterministyczny smoke Docker zbudowanej aplikacji dla osadzonych transkryptów kontekstu runtime.
    Weryfikuje, że ukryty kontekst runtime OpenClaw jest utrwalany jako
    niewyświetlana wiadomość niestandardowa zamiast wyciekać do widocznej tury użytkownika,
    następnie zasiewa dotknięty problemem uszkodzony JSONL sesji i weryfikuje, że
    `openclaw doctor --fix` przepisuje go na aktywną gałąź z kopią zapasową.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje kandydujący pakiet OpenClaw w Docker, uruchamia wdrożenie zainstalowanego pakietu,
    konfiguruje Telegram przez zainstalowany CLI, a następnie ponownie używa
    ścieżki QA live Telegram z tym zainstalowanym pakietem jako Gateway SUT.
  - Wrapper montuje tylko źródło harnessa `qa-lab` z checkoutu; zainstalowany
    pakiet jest właścicielem `dist`, `openclaw/plugin-sdk` i dołączonego runtime pluginu,
    więc ścieżka nie miesza pluginów z bieżącego checkoutu z testowanym pakietem.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; ustaw
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` lub
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, aby zamiast instalacji z rejestru przetestować rozwiązany lokalny tarball.
  - Używa tych samych poświadczeń env Telegram lub źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/wydania ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` oraz
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli Convex są obecne w CI,
    wrapper Docker automatycznie wybiera Convex.
  - Wrapper weryfikuje env poświadczeń Telegram lub Convex na hoście przed
    pracą Docker build/install. Ustaw `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    tylko przy celowym debugowaniu konfiguracji przed poświadczeniami.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej ścieżki.
  - GitHub Actions udostępnia tę ścieżkę jako ręczny workflow maintainerów
    `NPM Telegram Beta E2E`. Nie uruchamia się przy scaleniu. Workflow używa
    środowiska `qa-live-shared` i dzierżaw poświadczeń CI Convex.
- GitHub Actions udostępnia także `Package Acceptance` jako poboczny dowód produktowy
  wobec jednego kandydującego pakietu. Przyjmuje zaufany ref, opublikowany spec npm,
  URL tarballa HTTPS plus SHA-256 albo artefakt tarballa z innego uruchomienia, przesyła
  znormalizowany `openclaw-current.tgz` jako `package-under-test`, a następnie uruchamia
  istniejący scheduler Docker E2E z profilami ścieżek smoke, package, product, full lub custom.
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

- Dowód dokładnego URL tarballa wymaga digestu:

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
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/pluginy przez edycje konfiguracji.
  - Weryfikuje, że wykrywanie konfiguracji pozostawia nieskonfigurowane pobieralne pluginy nieobecne,
    pierwsza skonfigurowana naprawa doctor instaluje każdy brakujący pobieralny
    plugin jawnie, a drugi restart nie uruchamia ukrytej naprawy zależności.
  - Instaluje także znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor kandydata po aktualizacji
    czyści pozostałości zależności legacy pluginów bez naprawy postinstall po stronie harnessa.
- `pnpm test:parallels:npm-update`
  - Uruchamia natywny smoke aktualizacji instalacji pakietowej na gościach Parallels. Każda
    wybrana platforma najpierw instaluje żądany pakiet bazowy, następnie uruchamia
    zainstalowaną komendę `openclaw update` w tym samym gościu i weryfikuje
    zainstalowaną wersję, status aktualizacji, gotowość gateway oraz jedną lokalną turę agenta.
  - Użyj `--platform macos`, `--platform windows` albo `--platform linux` podczas
    iteracji na jednym gościu. Użyj `--json`, aby uzyskać ścieżkę artefaktu podsumowania i
    status dla każdej ścieżki.
  - Ścieżka OpenAI domyślnie używa `openai/gpt-5.5` do dowodu tury agenta live.
    Przekaż `--model <provider/model>` albo ustaw
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, gdy celowo walidujesz inny
    model OpenAI.
  - Owiń długie lokalne uruchomienia timeoutem hosta, aby zacięcia transportu Parallels nie mogły
    zużyć reszty okna testowego:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrypt zapisuje zagnieżdżone logi ścieżek w `/tmp/openclaw-parallels-npm-update.*`.
    Sprawdź `windows-update.log`, `macos-update.log` albo `linux-update.log`
    przed założeniem, że zewnętrzny wrapper się zawiesił.
  - Aktualizacja Windows może spędzić od 10 do 15 minut na doctorze po aktualizacji i pracy
    aktualizacji pakietu na zimnym gościu; nadal jest to zdrowe, gdy zagnieżdżony log debug npm
    postępuje.
  - Nie uruchamiaj tego zbiorczego wrappera równolegle z pojedynczymi ścieżkami smoke Parallels
    macOS, Windows lub Linux. Współdzielą stan VM i mogą kolidować przy
    przywracaniu snapshotu, serwowaniu pakietu lub stanie gateway gościa.
  - Dowód po aktualizacji uruchamia zwykłą powierzchnię dołączonych pluginów, ponieważ
    fasady możliwości, takie jak mowa, generowanie obrazów i rozumienie mediów,
    są ładowane przez dołączone API runtime, nawet gdy sama tura agenta
    sprawdza tylko prostą odpowiedź tekstową.

- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośrednich testów smoke protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę QA live Matrix wobec jednorazowego homeservera Tuwunel opartego na Docker. Tylko checkout źródeł - instalacje pakietowe nie zawierają `qa-lab`.
  - Pełny CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów: [Matrix QA](/pl/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę QA live Telegram wobec prawdziwej grupy prywatnej, używając tokenów bota drivera i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych pul poświadczeń. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć dzierżawy z puli.
  - Domyślne ustawienia obejmują canary, bramkowanie wzmiankami, adresowanie komend, `/status`, wspomniane odpowiedzi bot-do-bota i odpowiedzi natywnych komend core. Domyślne ustawienia `mock-openai` obejmują także deterministyczne regresje łańcucha odpowiedzi i streamingu final-message Telegram. Użyj `--list-scenarios` dla opcjonalnych sond, takich jak `session_status`.
  - Kończy działanie kodem różnym od zera, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz artefakty bez błędnego kodu wyjścia.
  - Wymaga dwóch odrębnych botów w tej samej grupie prywatnej, z botem SUT udostępniającym nazwę użytkownika Telegram.
  - Dla stabilnej obserwacji bot-do-bota włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot drivera może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt obserwowanych wiadomości w `.artifacts/qa-e2e/...`. Scenariusze z odpowiedziami obejmują RTT od żądania wysłania drivera do zaobserwowanej odpowiedzi SUT.

`Mantis Telegram Live` to wrapper dowodowy PR wokół tej ścieżki. Uruchamia
kandydujący ref z poświadczeniami Telegram dzierżawionymi z Convex, renderuje zredagowany
transkrypt obserwowanych wiadomości w przeglądarce desktopowej Crabbox, nagrywa dowód MP4,
generuje GIF przycięty do ruchu, przesyła pakiet artefaktów i publikuje wbudowany dowód PR
przez Mantis GitHub App, gdy ustawiono `pr_number`. Maintainerzy mogą
uruchomić go z UI Actions przez `Mantis Scenario` (`scenario_id:
telegram-live`) albo bezpośrednio z komentarza pull requesta:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` to agentowy natywny wrapper Telegram Desktop
przed/po dla wizualnego dowodu PR. Uruchom go z UI Actions z
dowolnymi `instructions`, przez `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) albo z komentarza PR:

```text
@Mantis telegram desktop proof
```

Agent Mantis odczytuje PR, decyduje, jakie zachowanie widoczne w Telegram potwierdza
zmianę, uruchamia ścieżkę dowodową Crabbox Telegram Desktop z rzeczywistym użytkownikiem na referencjach bazowej i
kandydującej, iteruje, aż natywne GIF-y są użyteczne, zapisuje sparowany
manifest `motionPreview` i publikuje tę samą 2-kolumnową tabelę GIF-ów przez
Mantis GitHub App, gdy ustawiono `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Dzierżawi lub ponownie używa pulpitu Crabbox Linux, instaluje natywny Telegram Desktop, konfiguruje OpenClaw z dzierżawionym tokenem bota SUT Telegram, uruchamia gateway i nagrywa dowody w postaci zrzutów ekranu/MP4 z widocznego pulpitu VNC.
  - Domyślnie używa `--credential-source convex`, więc przepływy pracy potrzebują tylko sekretu brokera Convex. Użyj `--credential-source env` z tymi samymi zmiennymi `OPENCLAW_QA_TELEGRAM_*` co `pnpm openclaw qa telegram`.
  - Telegram Desktop nadal wymaga logowania/profilu użytkownika. Token bota konfiguruje tylko OpenClaw. Użyj `--telegram-profile-archive-env <name>` dla archiwum profilu `.tgz` w base64 albo użyj `--keep-lease` i zaloguj się raz ręcznie przez VNC.
  - Zapisuje `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` i `telegram-desktop-builder.mp4` w katalogu wyjściowym.

Ścieżki transportu live współdzielą jeden standardowy kontrakt, aby nowe transporty się nie rozjeżdżały; macierz pokrycia dla poszczególnych ścieżek znajduje się w [Przegląd QA → Pokrycie transportu live](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` to szeroki syntetyczny zestaw testów i nie jest częścią tej macierzy.

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
QA transportu live, QA lab uzyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat dla tej
dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamykaniu. Nazwa sekcji powstała przed
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
  - Domyślna wartość środowiskowa: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` pozwala na adresy URL Convex z loopback `http://` wyłącznie do lokalnego developmentu.

`OPENCLAW_QA_CONVEX_SITE_URL` powinno używać `https://` podczas normalnej pracy.

Polecenia administracyjne maintainerów (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `doctor` przed uruchomieniami live, aby sprawdzić adres URL witryny Convex, sekrety brokera,
prefiks punktu końcowego, limit czasu HTTP oraz osiągalność admin/list bez drukowania
wartości sekretów. Użyj `--json` dla wyjścia czytelnego maszynowo w skryptach i narzędziach
CI.

Domyślny kontrakt punktu końcowego (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpane/możliwe do ponowienia: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca zniekształcone payloady.

Kształt payloadu dla rodzaju Telegram z rzeczywistym użytkownikiem:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` i `telegramApiId` muszą być numerycznymi ciągami.
- `tdlibArchiveSha256` i `desktopTdataArchiveSha256` muszą być ciągami hex SHA-256.
- `kind: "telegram-user"` reprezentuje jedno testowe konto Telegram. Traktuj dzierżawę jako obejmującą całe konto: sterownik CLI TDLib i wizualny świadek Telegram Desktop odtwarzają stan z tego samego payloadu, a dzierżawę powinno utrzymywać jednocześnie tylko jedno zadanie.

Odtwarzanie dzierżawy Telegram z rzeczywistym użytkownikiem:

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

Użyj odtworzonego profilu Desktop z `Telegram -workdir "$tmp/desktop"`, gdy potrzebne jest nagranie wizualne. W lokalnych środowiskach operatora `scripts/e2e/telegram-user-credential.ts` domyślnie odczytuje `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env`, jeśli zmienne środowiskowe procesu są nieobecne.

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

`start` dzierżawi poświadczenie `telegram-user`, odtwarza to samo konto w
TDLib i Telegram Desktop na pulpicie Crabbox Linux, uruchamia lokalny mock SUT
gateway z bieżącego checkoutu, otwiera widoczny czat Telegram, rozpoczyna
nagrywanie pulpitu i zapisuje prywatny plik `session.json`. Gdy sesja jest
aktywna, agent może testować aż do uzyskania satysfakcjonującego wyniku:

- `send --session <file> --text <message>` wysyła przez rzeczywistego użytkownika TDLib i czeka na odpowiedź SUT.
- `run --session <file> -- <remote command>` uruchamia dowolne polecenie w Crabbox i zapisuje jego wyjście, na przykład `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` przechwytuje aktualnie widoczny pulpit.
- `status --session <file>` drukuje dzierżawę i polecenie WebVNC.
- `finish --session <file>` zatrzymuje rejestrator, przechwytuje zrzut ekranu/wideo/artefakty przycięte do ruchu, zwalnia poświadczenie Convex, zatrzymuje lokalne procesy SUT i zatrzymuje dzierżawę Crabbox, chyba że przekazano `--keep-box`.
- `publish --session <file> --pr <number>` domyślnie publikuje komentarz PR tylko z GIF-ami. Przekaż `--full-artifacts` tylko wtedy, gdy logi lub artefakty JSON są celowo potrzebne.

Aby uzyskać deterministyczne wizualne repro, przekaż `--mock-response-file <path>` do `start`
albo do skrótu jednopoleceniowego `probe`. Runner domyślnie używa standardowej
klasy Crabbox, nagrywania 24 kl./s, podglądów GIF ruchu 24 kl./s i szerokości GIF
1920 px. Nadpisuj za pomocą `--class`, `--record-fps`, `--preview-fps` i
`--preview-width` tylko wtedy, gdy dowód wymaga innych ustawień przechwytywania.

Jednopoleceniowy dowód Crabbox:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Domyślne polecenie `probe` jest skrótem dla jednego cyklu start/send/finish. Użyj
go do szybkiego smoke `/status`. Użyj poleceń sesji do przeglądu PR,
odtwarzania błędów albo każdego przypadku, w którym agent potrzebuje kilku minut dowolnego
eksperymentowania przed uznaniem dowodu za kompletny. Użyj `--id <cbx_...>`, aby
ponownie użyć rozgrzanej dzierżawy pulpitu, `--keep-box`, aby pozostawić VNC otwarte po finish,
`--desktop-chat-title <name>`, aby wybrać widoczny czat, oraz `--tdlib-url <tgz>`,
gdy używasz wstępnie zbudowanego archiwum Linux `libtdjson.so` zamiast budować TDLib na
świeżym boksie. Runner weryfikuje `--tdlib-url` za pomocą `--tdlib-sha256 <hex>` albo,
domyślnie, sąsiedniego pliku `<url>.sha256`.

Payloady wielokanałowe walidowane przez brokera:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Ścieżki Slack również mogą dzierżawić z puli, ale walidacja payloadów Slack obecnie
znajduje się w runnerze QA Slack, a nie w brokerze. Użyj
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
dla wierszy Slack.

### Dodawanie kanału do QA

Architektura i nazwy helperów scenariuszy dla nowych adapterów kanałów znajdują się w [Przegląd QA → Dodawanie kanału](/pl/concepts/qa-e2e-automation#adding-a-channel). Minimalny próg: zaimplementuj runner transportu na współdzielonej seam hosta `qa-lab`, zadeklaruj `qaRunners` w manifeście Plugin, zamontuj jako `openclaw qa <runner>` i utwórz scenariusze w `qa/scenarios/`.

## Zestawy testów (co uruchamia się gdzie)

Traktuj zestawy jako „rosnący realizm” (oraz rosnącą niestabilność/koszt):

### Unit / integracja (domyślnie)

- Polecenie: `pnpm test`
- Konfiguracja: nieukierunkowane uruchomienia używają zestawu shardów `vitest.full-*.config.ts` i mogą rozszerzać shardy wieloprojektowe do konfiguracji per projekt na potrzeby harmonogramowania równoległego
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts` i `test/**/*.test.ts`; testy jednostkowe UI działają w dedykowanym shardzie `unit-ui`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (uwierzytelnianie gateway, routing, tooling, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Uruchamiane w CI
  - Nie wymagają prawdziwych kluczy
  - Powinny być szybkie i stabilne
  - Testy resolvera i loadera powierzchni publicznej muszą potwierdzać szerokie zachowanie fallback
    `api.js` i `runtime-api.js` z wygenerowanymi małymi fixture’ami Plugin, a nie
    z prawdziwymi API źródłowymi bundled Plugin. Rzeczywiste ładowania API Plugin należą do
    zestawów kontraktowych/integracyjnych należących do Plugin.

Polityka zależności natywnych:

- Domyślne instalacje testowe pomijają opcjonalne natywne kompilacje opus dla Discord. Odbiór głosu Discord używa dekodera pure-JS `opusscript`, a `@discordjs/opus` pozostaje wyłączony w `allowBuilds`, aby lokalne testy i ścieżki Testbox nie kompilowały natywnego dodatku.
- Użyj dedykowanej ścieżki wydajności Discord voice albo ścieżki live, jeśli celowo musisz porównać natywną kompilację opus. Nie ustawiaj `@discordjs/opus` na `true` w domyślnym `allowBuilds`; sprawia to, że niepowiązane pętle instalacji/testów kompilują kod natywny.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Nieukierunkowane `pnpm test` uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego dużego natywnego procesu projektu głównego. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega zagłodzeniu niepowiązanych zestawów testów przez zadania auto-reply/extension.
    - `pnpm test --watch` nadal używa natywnego głównego grafu projektów `vitest.config.ts`, ponieważ pętla watch z wieloma shardami nie jest praktyczna.
    - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` kierują jawne cele plików/katalogów najpierw przez ścieżki zakresowe, dzięki czemu `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika pełnego kosztu startu projektu głównego.
    - `pnpm test:changed` domyślnie rozwija zmienione ścieżki git w tanie ścieżki zakresowe: bezpośrednie edycje testów, siostrzane pliki `*.test.ts`, jawne mapowania źródeł i lokalne zależności grafu importów. Edycje konfiguracji/setupu/pakietów nie uruchamiają szerokich testów, chyba że jawnie użyjesz `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` to normalna inteligentna lokalna bramka sprawdzeń dla wąskich zmian. Klasyfikuje diff na core, testy core, plugins, testy Plugin, aplikacje, dokumentację, metadane wydania, narzędzia live Docker i tooling, a następnie uruchamia pasujące polecenia typecheck, lint i guard. Nie uruchamia testów Vitest; wywołaj `pnpm test:changed` albo jawne `pnpm test <target>` jako dowód testowy. Zmiany wersji dotyczące tylko metadanych wydania uruchamiają ukierunkowane sprawdzenia wersji/konfiguracji/zależności głównych, z guardem odrzucającym zmiany pakietów poza polem wersji najwyższego poziomu.
    - Edycje live Docker ACP harness uruchamiają ukierunkowane sprawdzenia: składnię shell dla skryptów uwierzytelniania live Docker oraz dry-run harmonogramu live Docker. Zmiany `package.json` są uwzględniane tylko wtedy, gdy diff ogranicza się do `scripts["test:docker:live-*"]`; edycje zależności, eksportów, wersji i innych powierzchni pakietu nadal używają szerszych guardów.
    - Lekkie importowo testy jednostkowe z agentów, poleceń, plugins, helperów auto-reply, `plugin-sdk` i podobnych czystych obszarów narzędziowych trafiają do ścieżki `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/runtime-heavy pozostają na istniejących ścieżkach.
    - Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` również mapują uruchomienia w trybie changed na jawne siostrzane testy w tych lekkich ścieżkach, dzięki czemu edycje helperów unikają ponownego uruchamiania pełnego ciężkiego zestawu dla danego katalogu.
    - `auto-reply` ma dedykowane bucket'y dla helperów core najwyższego poziomu, integracyjnych testów `reply.*` najwyższego poziomu oraz poddrzewa `src/auto-reply/reply/**`. CI dodatkowo dzieli poddrzewo reply na shardy agent-runner, dispatch oraz commands/state-routing, aby jeden import-heavy bucket nie obejmował całego ogona Node.
    - Normalne CI PR/main celowo pomija seryjny sweep plugins i shard `agentic-plugins` tylko dla wydań. Pełna walidacja wydania uruchamia osobny podrzędny workflow `Plugin Prerelease` dla tych zestawów mocno obciążonych plugins/extensions na kandydatach wydania.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Gdy zmieniasz dane wejściowe wykrywania message-tool albo kontekst runtime
      Compaction, zachowaj oba poziomy pokrycia.
    - Dodaj ukierunkowane regresje helperów dla granic czystego routingu i normalizacji.
    - Utrzymuj zestawy integracyjne embedded runner w dobrym stanie:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Te zestawy weryfikują, że identyfikatory zakresowe i zachowanie Compaction nadal przepływają
      przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy wyłącznie helperów
      nie są wystarczającym zamiennikiem tych ścieżek integracyjnych.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Bazowa konfiguracja Vitest domyślnie używa `threads`.
    - Współdzielona konfiguracja Vitest ustawia `isolate: false` i używa
      nieizolowanego runnera w projektach głównych, konfiguracjach e2e i live.
    - Główna ścieżka UI zachowuje swój setup `jsdom` i optymalizator, ale również działa na
      współdzielonym nieizolowanym runnerze.
    - Każdy shard `pnpm test` dziedziczy te same ustawienia domyślne `threads` + `isolate: false`
      ze współdzielonej konfiguracji Vitest.
    - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów potomnych Node
      Vitest, aby ograniczyć narzut kompilacji V8 podczas dużych lokalnych uruchomień.
      Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze standardowym zachowaniem V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne uruchamia diff.
    - Hook pre-commit wykonuje tylko formatowanie. Ponownie stage'uje sformatowane pliki i
      nie uruchamia lint, typecheck ani testów.
    - Uruchom jawnie `pnpm check:changed` przed przekazaniem albo wypchnięciem, gdy
      potrzebujesz inteligentnej lokalnej bramki sprawdzeń.
    - `pnpm test:changed` domyślnie kieruje przez tanie ścieżki zakresowe. Używaj
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy agent
      uzna, że edycja harnessa, konfiguracji, pakietu albo kontraktu naprawdę wymaga szerszego
      pokrycia Vitest.
    - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu,
      tylko z wyższym limitem workerów.
    - Lokalne automatyczne skalowanie workerów jest celowo konserwatywne i wycofuje się,
      gdy średnie obciążenie hosta jest już wysokie, więc wiele równoczesnych uruchomień
      Vitest domyślnie powoduje mniej szkód.
    - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracji jako
      `forceRerunTriggers`, aby ponowne uruchomienia w trybie changed pozostały poprawne, gdy zmienia się
      okablowanie testów.
    - Konfiguracja utrzymuje `OPENCLAW_VITEST_FS_MODULE_CACHE` włączone na obsługiwanych
      hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
      jedną jawną lokalizację cache do bezpośredniego profilowania.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` włącza raportowanie czasu trwania importów Vitest oraz
      dane wyjściowe import-breakdown.
    - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do
      plików zmienionych od `origin/main`.
    - Dane czasów shardów są zapisywane do `.artifacts/vitest-shard-timings.json`.
      Uruchomienia całej konfiguracji używają ścieżki konfiguracji jako klucza; shardy CI z
      include-pattern dopisują nazwę sharda, aby filtrowane shardy można było śledzić
      osobno.
    - Gdy jeden gorący test nadal spędza większość czasu na importach startowych,
      trzymaj ciężkie zależności za wąską lokalną granicą `*.runtime.ts` i
      mockuj tę granicę bezpośrednio, zamiast głęboko importować helpery runtime tylko po to,
      by przekazać je przez `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane
      `test:changed` z natywną ścieżką projektu głównego dla tego zatwierdzonego
      diffu i wypisuje czas ścienny oraz maksymalne RSS na macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące
      brudne drzewo, kierując listę zmienionych plików przez
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
  - Uruchamia rzeczywisty loopback Gateway z diagnostyką włączoną domyślnie
  - Przepuszcza syntetyczne obciążenie wiadomości Gateway, pamięci i dużych payloadów przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje helpery utrwalania pakietu stabilności diagnostycznej
  - Sprawdza, że rejestrator pozostaje ograniczony, syntetyczne próbki RSS mieszczą się w budżecie presji, a głębokości kolejek per sesja wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska ścieżka do follow-upów regresji stabilności, nie zamiennik pełnego zestawu Gateway

### E2E (smoke test Gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` oraz testy E2E bundled-plugin pod `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repo.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie silent, aby ograniczyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end Gateway z wieloma instancjami
  - Powierzchnie WebSocket/HTTP, parowanie Node i cięższe sieciowanie
- Oczekiwania:
  - Działa w CI (gdy jest włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż testy jednostkowe (może być wolniejsze)

### E2E: smoke test backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany Gateway OpenShell na hoście przez Docker
  - Tworzy piaskownicę z tymczasowego lokalnego Dockerfile
  - Testuje backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje zachowanie zdalnie kanonicznego systemu plików przez most sandbox fs
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy Gateway i piaskownicę
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test podczas ręcznego uruchamiania szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowy binarny CLI albo skrypt wrappera

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych pluginów w `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model faktycznie działa _dzisiaj_ z prawdziwymi danymi uwierzytelniającymi?”
  - Wykrywanie zmian formatu dostawcy, osobliwości wywoływania narzędzi, problemów z uwierzytelnianiem i zachowania limitów szybkości
- Oczekiwania:
  - Z założenia nie jest stabilne dla CI (prawdziwe sieci, prawdziwe zasady dostawców, limity, awarie)
  - Kosztuje pieniądze / zużywa limity szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live wczytują `~/.profile`, aby pobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiały konfiguracyjne/uwierzytelniające do tymczasowego katalogu domowego testu, aby fixtury jednostkowe nie mogły zmodyfikować Twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały Twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz w cichszym trybie: zachowuje wyjście postępu `[live] ...`, ale ukrywa dodatkową informację o `~/.profile` i wycisza logi startowe gatewaya/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz przywrócić pełne logi uruchamiania.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` z formatem rozdzielanym przecinkami/średnikami albo `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie dla live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próbę przy odpowiedziach limitu szybkości.
- Wyjście postępu/Heartbeat:
  - Pakiety live emitują teraz wiersze postępu do stderr, dzięki czemu długie wywołania dostawców są widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, aby wiersze postępu dostawcy/gatewaya były strumieniowane natychmiast podczas uruchomień live.
  - Dostrój Heartbeat bezpośredniego modelu za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostrój Heartbeat gatewaya/probe za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który pakiet mam uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniono dużo)
- Dotykanie sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Informacje o macierzy modeli live, testach dymnych backendu CLI, testach dymnych ACP, uprzęży
serwera aplikacji Codex oraz wszystkich testach live dostawców mediów (Deepgram, BytePlus, ComfyUI, obraz,
muzyka, wideo, uprząż mediów) — a także o obsłudze danych uwierzytelniających dla uruchomień live — znajdziesz w
[Testowanie pakietów live](/pl/help/testing-live). Dedykowaną listę kontrolną aktualizacji i
walidacji pluginów znajdziesz w
[Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

## Runnery Docker (opcjonalne sprawdzenia „czy działa w Linuksie”)

Te runnery Docker dzielą się na dwie grupy:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczami profili wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i workspace (oraz wczytując `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu testów dymnych, aby pełny przebieg Docker pozostał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne środowiskowe, gdy
  wyraźnie chcesz większy, wyczerpujący skan.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, pakuje OpenClaw raz jako tarball npm przez `scripts/package-openclaw-for-docker.mjs`, a następnie buduje/ponownie używa dwóch obrazów `scripts/e2e/Dockerfile`. Obraz bazowy jest tylko runnerem Node/Git dla ścieżek instalacji/aktualizacji/zależności pluginów; te ścieżki montują wstępnie zbudowany tarball. Obraz funkcjonalny instaluje ten sam tarball w `/app` dla ścieżek funkcjonalności zbudowanej aplikacji. Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`; logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` wykonuje wybrany plan. Agregat używa ważonego lokalnego harmonogramu: `OPENCLAW_DOCKER_ALL_PARALLELISM` kontroluje sloty procesów, a limity zasobów powstrzymują ciężkie ścieżki live, instalacji npm i wielousługowe przed jednoczesnym startem. Jeśli pojedyncza ścieżka jest cięższa niż aktywne limity, harmonogram nadal może ją uruchomić, gdy pula jest pusta, a potem utrzymuje ją jako jedyną działającą do czasu ponownej dostępności pojemności. Domyślne wartości to 10 slotów, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` i `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; dostrajaj `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` lub `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` tylko wtedy, gdy host Docker ma większy zapas. Runner domyślnie wykonuje preflight Docker, usuwa nieaktualne kontenery OpenClaw E2E, wypisuje status co 30 sekund, zapisuje czasy udanych ścieżek w `.artifacts/docker-tests/lane-timings.json` i używa tych czasów, aby przy późniejszych uruchomieniach zaczynać od dłuższych ścieżek. Użyj `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, aby wypisać ważony manifest ścieżek bez budowania ani uruchamiania Docker, albo `node scripts/test-docker-all.mjs --plan-json`, aby wypisać plan CI dla wybranych ścieżek, potrzeb pakietu/obrazu i danych uwierzytelniających.
- `Package Acceptance` to natywna dla GitHub bramka pakietu sprawdzająca „czy ten instalowalny tarball działa jako produkt?”. Rozwiązuje jeden pakiet kandydujący z `source=npm`, `source=ref`, `source=url` albo `source=artifact`, przesyła go jako `package-under-test`, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E wobec dokładnie tego tarballa zamiast ponownie pakować wybrany ref. Profile są uporządkowane według szerokości: `smoke`, `package`, `product` i `full`. Zobacz [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins), aby poznać kontrakt pakietu/aktualizacji/pluginu, macierz przetrwania opublikowanych aktualizacji, domyślne ustawienia wydań i triage awarii.
- Kontrole kompilacji i wydania uruchamiają `scripts/check-cli-bootstrap-imports.mjs` po tsdown. Strażnik przechodzi po statycznym zbudowanym grafie od `dist/entry.js` i `dist/cli/run-main.js` i kończy się niepowodzeniem, jeśli start przed dyspozycją importuje zależności pakietów, takie jak Commander, UI promptów, undici albo logowanie, przed dyspozycją polecenia; utrzymuje też dołączony fragment uruchamiania Gateway poniżej budżetu i odrzuca statyczne importy znanych zimnych ścieżek Gateway. Test dymny spakowanego CLI obejmuje także pomoc główną, pomoc onboard, pomoc doctor, status, schemat konfiguracji i polecenie listy modeli.
- Zgodność wsteczna Package Acceptance jest ograniczona do `2026.4.25` (w tym `2026.4.25-beta.*`). Do tego punktu granicznego uprząż toleruje tylko luki metadanych wysłanych pakietów: pominięte prywatne wpisy inwentarza QA, brak `gateway install --wrapper`, brakujące pliki łatek w fixturze git pochodzącej z tarballa, brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji pluginów, brak utrwalania rekordów instalacji marketplace oraz migrację metadanych konfiguracji podczas `plugins update`. Dla pakietów po `2026.4.25` te ścieżki są ścisłymi awariami.
- Runnery testów dymnych kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` i `test:docker:config-reload` uruchamiają co najmniej jeden prawdziwy kontener i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker modeli live montują też tylko potrzebne katalogi domowe uwierzytelniania CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby OAuth zewnętrznego CLI mógł odświeżać tokeny bez modyfikowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke test wiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`; domyślnie obejmuje Claude, Codex i Gemini, ze ścisłym pokryciem Droid/OpenCode przez `pnpm test:docker:live-acp-bind:droid` i `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test uprzęży serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent deweloperski: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test obserwowalności: `pnpm qa:otel:smoke` to prywatna ścieżka QA dla checkoutu źródeł. Celowo nie jest częścią ścieżek wydań pakietów Docker, ponieważ tarball npm pomija QA Lab.
- Smoke test Open WebUI na żywo: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne szkieletowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke test onboardingu/kanału/agenta z tarballa npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Docker, konfiguruje OpenAI przez onboarding z referencją env oraz domyślnie Telegram, uruchamia doctor i wykonuje jedną zamockowaną turę agenta OpenAI. Użyj ponownie wcześniej zbudowanego tarballa z `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta za pomocą `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` albo zmień kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` lub `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke test instalacji Skills: `pnpm test:docker:skill-install` instaluje spakowany tarball OpenClaw globalnie w Docker, wyłącza w konfiguracji instalacje przesłanych archiwów, rozwiązuje bieżący slug Skills ClawHub na żywo z wyszukiwania, instaluje go za pomocą `openclaw skills install` i weryfikuje zainstalowane Skills oraz metadane pochodzenia/blokady `.clawhub`.
- Smoke test przełączania kanału aktualizacji: `pnpm test:docker:update-channel-switch` instaluje spakowany tarball OpenClaw globalnie w Docker, przełącza z pakietu `stable` na git `dev`, weryfikuje utrwalony kanał i działanie Plugin po aktualizacji, a następnie przełącza z powrotem na pakiet `stable` i sprawdza status aktualizacji.
- Smoke test przetrwania aktualizacji: `pnpm test:docker:upgrade-survivor` instaluje spakowany tarball OpenClaw na brudnej fiksturze starego użytkownika z agentami, konfiguracją kanałów, listami dozwolonych Plugin, nieaktualnym stanem zależności Plugin oraz istniejącymi plikami workspace/sesji. Uruchamia aktualizację pakietu oraz nieinteraktywny doctor bez kluczy dostawcy na żywo ani kanału, następnie uruchamia Gateway loopback i sprawdza zachowanie konfiguracji/stanu oraz budżety uruchomienia/statusu.
- Smoke test przetrwania opublikowanej aktualizacji: `pnpm test:docker:published-upgrade-survivor` domyślnie instaluje `openclaw@latest`, zasila realistyczne pliki istniejącego użytkownika, konfiguruje tę bazę za pomocą wbudowanej receptury poleceń, waliduje wynikową konfigurację, aktualizuje tę opublikowaną instalację do tarballa kandydata, uruchamia nieinteraktywny doctor, zapisuje `.artifacts/upgrade-survivor/summary.json`, następnie uruchamia Gateway loopback i sprawdza skonfigurowane intencje, zachowanie stanu, uruchomienie, `/healthz`, `/readyz` oraz budżety statusu RPC. Nadpisz jedną bazę za pomocą `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, poproś agregujący harmonogram o rozwinięcie dokładnych lokalnych baz przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, takich jak `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, i rozwiń fikstury w kształcie zgłoszeń przez `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, takie jak `reported-issues`; zestaw reported-issues obejmuje `configured-plugin-installs` do automatycznej naprawy instalacji zewnętrznych Plugin OpenClaw. Package Acceptance udostępnia je jako `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` i `published_upgrade_survivor_scenarios`, rozwiązuje metatokeny baz, takie jak `last-stable-4` lub `all-since-2026.4.23`, a Full Release Validation rozszerza bramkę pakietu release-soak do `last-stable-4 2026.4.23 2026.5.2 2026.4.15` oraz `reported-issues`.
- Smoke test kontekstu runtime sesji: `pnpm test:docker:session-runtime-context` weryfikuje utrwalanie transkryptu ukrytego kontekstu runtime oraz naprawę doctor dla dotkniętych zduplikowanych gałęzi przepisywania promptów.
- Smoke test globalnej instalacji Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je za pomocą `bun install -g` w izolowanym home i weryfikuje, że `openclaw infer image providers --json` zwraca dołączonych dostawców obrazów zamiast się zawieszać. Użyj ponownie wcześniej zbudowanego tarballa z `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń build hosta przez `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` ze zbudowanego obrazu Docker przez `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jedną pamięć podręczną npm między kontenerami root, update i direct-npm. Smoke test aktualizacji domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do tarballa kandydata. Nadpisz lokalnie za pomocą `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` albo wejściem `update_baseline_version` workflow Install Smoke na GitHub. Kontrole instalatora bez roota zachowują izolowaną pamięć podręczną npm, aby wpisy cache należące do roota nie maskowały zachowania lokalnej instalacji użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie używać cache root/update/direct-npm przy lokalnych ponownych uruchomieniach.
- Install Smoke CI pomija zduplikowaną bezpośrednią globalną aktualizację npm za pomocą `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tego env, gdy potrzebne jest pokrycie bezpośredniego `npm install -g`.
- Smoke test CLI usuwania współdzielonego workspace agentów: `pnpm test:docker:agents-delete-shared-workspace` (skrypt: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) domyślnie buduje obraz z głównego Dockerfile, zasila dwóch agentów jednym workspace w izolowanym home kontenera, uruchamia `agents delete --json` i weryfikuje poprawny JSON oraz zachowanie zachowanego workspace. Użyj ponownie obrazu install-smoke za pomocą `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Sieć Gateway (dwa kontenery, uwierzytelnianie WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test zrzutu CDP przeglądarki: `pnpm test:docker:browser-cdp-snapshot` (skrypt: `scripts/e2e/browser-cdp-snapshot-docker.sh`) buduje źródłowy obraz E2E oraz warstwę Chromium, uruchamia Chromium z surowym CDP, uruchamia `browser doctor --deep` i weryfikuje, że zrzuty ról CDP obejmują URL-e linków, klikalne elementy promowane kursorem, referencje iframe i metadane ramek.
- Regresja minimalnego rozumowania OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia zamockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, następnie wymusza odrzucenie schematu dostawcy i sprawdza, że surowy szczegół pojawia się w logach Gateway.
- Most kanału MCP (zasiany Gateway + most stdio + surowy smoke test ramki powiadomienia Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia MCP pakietu Pi (rzeczywisty serwer MCP stdio + smoke test allow/deny osadzonego profilu Pi): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie MCP Cron/subagenta (rzeczywisty Gateway + porządkowanie procesu potomnego MCP stdio po izolowanych uruchomieniach cron i jednorazowego subagenta): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Pluginy (smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych refów git, kitchen-sink ClawHub, aktualizacji marketplace oraz włączenia/inspekcji pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby pominąć blok ClawHub, albo nadpisz domyślną parę pakiet/runtime kitchen-sink przez `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` i `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Bez `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` test używa hermetycznego lokalnego serwera fikstur ClawHub.
- Smoke test niezmienionej aktualizacji Plugin: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test macierzy cyklu życia Plugin: `pnpm test:docker:plugin-lifecycle-matrix` instaluje spakowany tarball OpenClaw w gołym kontenerze, instaluje Plugin npm, przełącza włączenie/wyłączenie, aktualizuje go i obniża jego wersję przez lokalny rejestr npm, usuwa zainstalowany kod, a następnie weryfikuje, że odinstalowanie nadal usuwa nieaktualny stan, logując metryki RSS/CPU dla każdej fazy cyklu życia.
- Smoke test metadanych przeładowania konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Pluginy: `pnpm test:docker:plugins` obejmuje smoke test instalacji/aktualizacji dla ścieżki lokalnej, `file:`, rejestru npm z wyniesionymi zależnościami, ruchomych refów git, fikstur ClawHub, aktualizacji marketplace oraz włączenia/inspekcji pakietu Claude. `pnpm test:docker:plugin-update` obejmuje zachowanie niezmienionej aktualizacji dla zainstalowanych Plugin. `pnpm test:docker:plugin-lifecycle-matrix` obejmuje śledzone zasobowo instalowanie, włączanie, wyłączanie, aktualizowanie, obniżanie wersji i odinstalowanie przy brakującym kodzie Plugin npm.

Aby ręcznie wstępnie zbudować i ponownie użyć współdzielonego obrazu funkcjonalnego:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazów specyficzne dla suite, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje na zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest jeszcze lokalny. Testy QR i instalatora Docker zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielony runtime zbudowanej aplikacji.

Runnery Docker live-modeli montują też bieżący checkout tylko do odczytu i
przygotowują go w tymczasowym katalogu roboczym wewnątrz kontenera. Dzięki temu obraz
runtime pozostaje niewielki, a Vitest nadal działa na dokładnie Twoim lokalnym źródle/konfiguracji.
Krok przygotowania pomija duże, wyłącznie lokalne pamięci podręczne i wyjścia buildów aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi wyjściowe `.build` lub
Gradle, aby uruchomienia live w Dockerze nie traciły minut na kopiowanie
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby sondy live Gateway nie uruchamiały
prawdziwych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekazuj również
`OPENCLAW_LIVE_GATEWAY_*`, gdy musisz zawęzić lub wykluczyć pokrycie live Gateway
z tej ścieżki Docker.
`test:docker:openwebui` to wyższego poziomu smoke test zgodności: uruchamia
kontener Gateway OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
prawdziwe żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Ustaw `OPENWEBUI_SMOKE_MODE=models` dla kontroli CI w ścieżce wydania, które powinny zatrzymać się
po logowaniu do Open WebUI i wykryciu modelu, bez czekania na ukończenie live modelu.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może musieć pobrać
obraz Open WebUI, a Open WebUI może musieć dokończyć własną konfigurację zimnego startu.
Ta ścieżka oczekuje używalnego klucza live modelu, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest głównym sposobem jego podania w uruchomieniach w Dockerze.
Udane uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
prawdziwego konta Telegram, Discord ani iMessage. Uruchamia zaszczepiony kontener
Gateway, startuje drugi kontener, który spawnuję `openclaw mcp serve`, a następnie
weryfikuje routowane wykrywanie konwersacji, odczyty transkrypcji, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłki wychodzącej oraz powiadomienia kanałów +
uprawnień w stylu Claude przez prawdziwy most stdio MCP. Kontrola powiadomień
bezpośrednio sprawdza surowe ramki stdio MCP, więc smoke test waliduje to, co
most faktycznie emituje, a nie tylko to, co akurat pokazuje konkretny SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza live modelu.
Buduje obraz Docker repozytorium, uruchamia prawdziwy serwer sondy stdio MCP
wewnątrz kontenera, materializuje ten serwer przez wbudowany runtime MCP pakietu Pi,
wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` oraz `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza live modelu.
Uruchamia zaszczepiony Gateway z prawdziwym serwerem sondy stdio MCP, wykonuje
izolowaną turę cron oraz jednorazową turę potomną `/subagents spawn`, a następnie weryfikuje,
że proces potomny MCP kończy działanie po każdym uruchomieniu.

Ręczny smoke test wątku ACP w języku naturalnym (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla workflow regresji/debugowania. Może być ponownie potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i wczytywane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` aby zweryfikować tylko zmienne środowiskowe wczytane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów konfiguracji/workspace i bez zewnętrznych montowań auth CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla cache’owanych instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki auth CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia providerów montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie za pomocą `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` lub listy rozdzielonej przecinkami, takiej jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` aby filtrować providerów w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1` aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają rebuildu
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` aby zapewnić, że dane uwierzytelniające pochodzą z magazynu profilu (nie z env)
- `OPENCLAW_OPENWEBUI_MODEL=...` aby wybrać model udostępniany przez Gateway dla smoke testu Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` aby nadpisać prompt kontroli nonce używany przez smoke test Open WebUI
- `OPENWEBUI_IMAGE=...` aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchom kontrole dokumentacji po edycjach docs: `pnpm check:docs`.
Uruchom pełną walidację anchorów Mintlify, gdy potrzebujesz także kontroli nagłówków na stronie: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „prawdziwego pipeline’u” bez prawdziwych providerów:

- Wywoływanie narzędzi Gateway (mock OpenAI, prawdziwy gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + wymuszone auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewaluacje niezawodności agentów (skills)

Mamy już kilka testów bezpiecznych dla CI, które zachowują się jak „ewaluacje niezawodności agentów”:

- Mockowe wywoływanie narzędzi przez prawdziwy gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują połączenia sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy skills są wymienione w prompcie, czy agent wybiera właściwy skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty workflow:** scenariusze wieloturowe, które asertują kolejność narzędzi, przeniesienie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowych providerów do asercji wywołań narzędzi + kolejności, odczytów plików skill i połączeń sesji.
- Mały zestaw scenariuszy skupionych na skillach (użyj vs unikaj, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, bramkowane env) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginu i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji kształtu i zachowania. Domyślna ścieżka jednostkowa `pnpm test` celowo
pomija te współdzielone pliki seams i smoke; uruchamiaj komendy kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanału lub providera.

### Komendy

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty providerów: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt pluginu (id, nazwa, capabilities)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie wiązania sesji
- **outbound-payload** - Struktura payloadu wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/roster
- **group-policy** - Egzekwowanie polityki grupy

### Kontrakty statusu providera

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
- **registry** - Kształt rejestru pluginów

### Kontrakty providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu auth
- **auth-choice** - Wybór/selekcja auth
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie pluginów
- **loader** - Ładowanie pluginów
- **runtime** - Runtime providera
- **shape** - Kształt/interfejs pluginu
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów plugin-sdk lub subpathów
- Po dodaniu lub modyfikacji kanału albo pluginu providera
- Po refaktoryzacji rejestracji lub wykrywania pluginów

Testy kontraktowe działają w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem providera/modelu wykryty live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub providera albo uchwycenie dokładnej transformacji kształtu żądania)
- Jeśli jest to z natury tylko live (limity szybkości, polityki auth), utrzymaj test live wąski i opt-in przez zmienne env
- Preferuj celowanie w najmniejszą warstwę, która łapie błąd:
  - błąd konwersji/odtworzenia żądania providera → bezpośredni test modeli
  - błąd pipeline’u sesji/historii/narzędzi Gateway → smoke live Gateway lub bezpieczny dla CI mock test Gateway
- Bariera ochronna przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden próbkowany cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie asertuje, że identyfikatory exec z segmentami przechodzenia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem dla niesklasyfikowanych identyfikatorów celów, aby nowe klasy nie mogły zostać pominięte po cichu.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins)
- [CI](/pl/ci)
