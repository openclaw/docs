---
read_when:
    - Zrozumienie, jak współdziała stos QA
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportu
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Budowanie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu na żywo, adaptery transportu i raportowanie.'
title: Przegląd QA
x-i18n:
    generated_at: "2026-05-06T09:09:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma testować OpenClaw w bardziej realistyczny,
kanałowy sposób niż pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkrypcji,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe pluginy runnerów: adaptery transportu live,
  które sterują rzeczywistym kanałem wewnątrz podrzędnego Gateway QA.
- `qa/`: zasoby startowe z repozytorium dla zadania kickoff i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja live przed i po dla błędów, które
  wymagają rzeczywistych transportów, zrzutów ekranu z przeglądarki, stanu VM i dowodów PR.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele z nich ma aliasy skryptów `pnpm qa:*`;
obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Dołączona samokontrola QA; zapisuje raport Markdown.                                                                                                                                                                                                                    |
| `qa suite`                                          | Uruchamia scenariusze z repozytorium względem ścieżki Gateway QA. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej VM z Linuksem.                                                                                                                   |
| `qa coverage`                                       | Wypisuje markdownowy inwentarz pokrycia scenariuszy (`--json` dla wyjścia maszynowego).                                                                                                                                                                                 |
| `qa parity-report`                                  | Porównuje dwa pliki `qa-suite-summary.json` i zapisuje raport parytetu agentowego.                                                                                                                                                                                      |
| `qa character-eval`                                 | Uruchamia scenariusz QA charakteru na wielu modelach live z ocenianym raportem. Zobacz [Raportowanie](#reporting).                                                                                                                                                      |
| `qa manual`                                         | Uruchamia jednorazowy prompt względem wybranej ścieżki dostawcy/modelu.                                                                                                                                                                                                 |
| `qa ui`                                             | Uruchamia interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                      |
| `qa docker-build-image`                             | Buduje wstępnie przygotowany obraz Docker QA.                                                                                                                                                                                                                           |
| `qa docker-scaffold`                                | Zapisuje szkielet docker-compose dla panelu QA + ścieżki Gateway.                                                                                                                                                                                                       |
| `qa up`                                             | Buduje witrynę QA, uruchamia stos oparty na Dockerze, wypisuje URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                            |
| `qa aimock`                                         | Uruchamia tylko serwer dostawcy AIMock.                                                                                                                                                                                                                                 |
| `qa mock-openai`                                    | Uruchamia tylko świadomy scenariuszy serwer dostawcy `mock-openai`.                                                                                                                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządza współdzieloną pulą poświadczeń Convex.                                                                                                                                                                                                                         |
| `qa matrix`                                         | Ścieżka transportu live względem jednorazowego homeservera Tuwunel. Zobacz [Matrix QA](/pl/concepts/qa-matrix).                                                                                                                                                            |
| `qa telegram`                                       | Ścieżka transportu live względem rzeczywistej prywatnej grupy Telegram.                                                                                                                                                                                                 |
| `qa discord`                                        | Ścieżka transportu live względem rzeczywistego prywatnego kanału gildii Discord.                                                                                                                                                                                        |
| `qa slack`                                          | Ścieżka transportu live względem rzeczywistego prywatnego kanału Slack.                                                                                                                                                                                                 |
| `qa mantis`                                         | Runner weryfikacji przed i po dla błędów transportu live, z dowodami reakcji statusowych Discord, smoke Crabbox desktop/browser i smoke Slack-in-VNC. Zobacz [Mantis](/pl/concepts/mantis) oraz [Runbook Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook). |

## Przepływ operatora

Obecny przepływ operatora QA to dwupanelowa witryna QA:

- Lewo: panel Gateway (Control UI) z agentem.
- Prawo: QA Lab, pokazujący transkrypcję w stylu Slack i plan scenariusza.

Uruchom go za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia ścieżkę Gateway opartą na Dockerze i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może przekazać agentowi
misję QA, obserwować rzeczywiste zachowanie kanału i zapisać, co zadziałało, zawiodło lub
pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez każdorazowej przebudowywania obrazu Docker,
uruchom stos z podmontowanym przez bind pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i montuje przez bind
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet przy zmianie, a przeglądarka automatycznie przeładowuje się, gdy zmienia się hash zasobu QA Lab.

Dla lokalnego smoke śledzenia OpenTelemetry uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik śladów OTLP/HTTP, uruchamia
scenariusz QA `otel-trace-smoke` z włączonym pluginem `diagnostics-otel`, a następnie
dekoduje wyeksportowane spany protobuf i sprawdza krytyczny dla wydania kształt:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` i `openclaw.message.delivery` muszą być obecne;
wywołania modelu nie mogą eksportować `StreamAbandoned` przy udanych turach; surowe identyfikatory diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza śladem. Zapisuje
`otel-smoke-summary.json` obok artefaktów zestawu QA.

QA obserwowalności pozostaje dostępne tylko z checkoutu źródeł. Tarball npm celowo pomija
QA Lab, więc ścieżki wydania pakietu Docker nie uruchamiają poleceń `qa`. Użyj
`pnpm qa:otel:smoke` z zbudowanego checkoutu źródeł podczas zmiany instrumentacji
diagnostycznej.

Dla ścieżki smoke Matrix z rzeczywistym transportem uruchom:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Pełna dokumentacja CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów dla tej ścieżki znajdują się w [Matrix QA](/pl/concepts/qa-matrix). W skrócie: provisionuje jednorazowy homeserver Tuwunel w Dockerze, rejestruje tymczasowych użytkowników driver/SUT/observer, uruchamia rzeczywisty plugin Matrix wewnątrz podrzędnego Gateway QA ograniczonego do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt obserwowanych zdarzeń i połączony dziennik wyjścia pod `.artifacts/qa-e2e/matrix-<timestamp>/`.

Scenariusze obejmują zachowanie transportu, którego testy jednostkowe nie mogą udowodnić end-to-end: bramkowanie wzmianek, zasady allow-bot, listy dozwolonych, odpowiedzi najwyższego poziomu i wątkowe, routing DM, obsługę reakcji, tłumienie edycji przychodzących, deduplikację odtwarzania po restarcie, odzyskiwanie po przerwaniu homeservera, dostarczanie metadanych zatwierdzeń, obsługę mediów oraz przepływy bootstrap/odzyskiwania/weryfikacji Matrix E2EE. Profil CLI E2EE steruje też poleceniami `openclaw matrix encryption setup` i weryfikacji przez ten sam jednorazowy homeserver przed sprawdzeniem odpowiedzi Gateway.

Discord ma również scenariusze opt-in tylko dla Mantis do reprodukcji błędów. Użyj
`--scenario discord-status-reactions-tool-only` dla jawnej osi czasu reakcji statusowych
albo `--scenario discord-thread-reply-filepath-attachment`, aby utworzyć
rzeczywisty wątek Discord i zweryfikować, że `message.thread-reply` zachowuje
załącznik `filePath`. Te scenariusze pozostają poza domyślną ścieżką live Discord,
ponieważ są sondami reprodukcji przed/po, a nie szerokim pokryciem smoke.
Przepływ Mantis dla załącznika wątku może też dodać nagrane wideo świadka z zalogowanego Discord Web,
gdy `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` lub
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` jest skonfigurowane w środowisku QA.
Ten profil podglądu służy tylko do przechwytywania wizualnego; decyzja pass/fail
nadal pochodzi z wyroczni REST Discord.

CI używa tej samej powierzchni poleceń w `.github/workflows/qa-live-transports-convex.yml`. Zaplanowane i domyślne uruchomienia ręczne wykonują szybki profil Matrix z poświadczeniami frontier live, `--fast` i `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ręczne `matrix_profile=all` rozdziela zadanie na pięć shardów profili, aby wyczerpujący katalog mógł działać równolegle, zachowując jeden katalog artefaktów na shard.

Dla ścieżek smoke Telegram, Discord i Slack z rzeczywistym transportem:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Celują one w istniejący wcześniej rzeczywisty kanał z dwoma botami (driver + SUT). Wymagane zmienne env, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane w sekcji [Dokumentacja referencyjna QA Telegram, Discord i Slack](#telegram-discord-and-slack-qa-reference) poniżej.

Aby uruchomić pełny przebieg Slack desktop VM z ratunkowym dostępem przez VNC, uruchom:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

To polecenie dzierżawi maszynę Crabbox desktop/browser, uruchamia ścieżkę live Slack
wewnątrz VM, otwiera Slack Web w przeglądarce VNC, przechwytuje pulpit oraz
kopiuje `slack-qa/`, `slack-desktop-smoke.png` i `slack-desktop-smoke.mp4`,
gdy przechwytywanie wideo jest dostępne, z powrotem do katalogu artefaktów Mantis. Dzierżawy Crabbox
desktop/browser od razu zapewniają narzędzia przechwytywania i pakiety pomocnicze
przeglądarki/natywnego buildu, więc scenariusz powinien instalować zamienniki tylko na starszych
dzierżawach. Mantis raportuje czasy całkowite i dla poszczególnych faz w
`mantis-slack-desktop-smoke-report.md`, dzięki czemu powolne przebiegi pokazują, czy czas został poświęcony na
rozgrzewanie dzierżawy, pozyskiwanie poświadczeń, zdalną konfigurację czy kopiowanie artefaktów. Użyj ponownie
`--lease-id <cbx_...>` po ręcznym zalogowaniu się do Slack Web przez VNC;
ponownie użyte dzierżawy utrzymują też ciepłą pamięć podręczną pnpm store Crabbox. Domyślny tryb
`--hydrate-mode source` weryfikuje z checkoutu źródłowego i uruchamia instalację/build
wewnątrz VM. Użyj `--hydrate-mode prehydrated` tylko wtedy, gdy ponownie używany zdalny
workspace ma już `node_modules` i zbudowany `dist/`; ten tryb pomija
kosztowny krok instalacji/buildu i kończy się bezpieczną porażką, gdy workspace nie jest gotowy.
Z `--gateway-setup` Mantis pozostawia trwały OpenClaw Slack gateway
działający wewnątrz VM na porcie `38973`; bez tego polecenie uruchamia normalną
ścieżkę bot-to-bot Slack QA i kończy działanie po przechwyceniu artefaktów.

Lista kontrolna operatora, polecenie dispatch workflow GitHub, kontrakt komentarza z dowodami,
tabela decyzyjna hydrate-mode, interpretacja czasów i kroki obsługi awarii
znajdują się w [Runbooku Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook).

Dla zadania desktopowego w stylu agenta/CV uruchom:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` dzierżawi albo ponownie używa maszyny Crabbox desktop/browser, uruchamia
`crabbox record --while`, steruje widoczną przeglądarką przez zagnieżdżony
`visual-driver`, przechwytuje `visual-task.png`, uruchamia `openclaw infer image describe`
na zrzucie ekranu, gdy wybrano `--vision-mode image-describe`, oraz
zapisuje `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` i `mantis-visual-task-report.md`.
Gdy ustawiono `--expect-text`, prompt wizyjny prosi o ustrukturyzowany werdykt JSON
i przechodzi tylko wtedy, gdy model zgłasza pozytywne widoczne dowody; negatywna
odpowiedź, która jedynie cytuje docelowy tekst, powoduje niepowodzenie asercji.
Użyj `--vision-mode metadata` do smoke bez modelu, który potwierdza działanie pulpitu,
przeglądarki, zrzutu ekranu i potoku wideo bez wywoływania providera rozumienia obrazów.
Nagranie jest wymaganym artefaktem dla `visual-task`; jeśli Crabbox nie nagra
niepustego `visual-task.mp4`, zadanie kończy się niepowodzeniem nawet wtedy, gdy visual driver
przeszedł. W razie niepowodzenia Mantis zachowuje dzierżawę dla VNC, chyba że zadanie już
przeszło i nie ustawiono `--keep-lease`.

Przed użyciem pulowanych poświadczeń live uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza env brokera Convex, waliduje ustawienia endpointu i weryfikuje osiągalność admin/list, gdy obecny jest sekret maintainer. Raportuje dla sekretów tylko status ustawione/brakujące.

## Pokrycie transportu live

Ścieżki transportu live współdzielą jeden kontrakt, zamiast każda wymyślać własny kształt listy scenariuszy. `qa-channel` jest szerokim syntetycznym zestawem zachowania produktu i nie jest częścią macierzy pokrycia transportu live.

| Ścieżka  | Canary | Bramkowanie wzmianki | Bot-to-bot | Blokada allowlisty | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie help | Rejestracja polecenia natywnego |
| -------- | ------ | -------------------- | ---------- | ------------------ | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | -------------- | -------------------------------- |
| Matrix   | x      | x                    | x          | x                  | x                             | x                       | x                 | x              | x                  |                |                                  |
| Telegram | x      | x                    | x          |                    |                               |                         |                   |                |                    | x              |                                  |
| Discord  | x      | x                    | x          |                    |                               |                         |                   |                |                    |                | x                                |
| Slack    | x      | x                    | x          | x                  | x                             | x                       | x                 | x              |                    |                |                                  |

To utrzymuje `qa-channel` jako szeroki zestaw zachowania produktu, a Matrix,
Telegram i przyszłe transporty live współdzielą jedną jawną listę kontrolną
kontraktu transportu.

Dla jednorazowej ścieżki Linux VM bez wprowadzania Docker do ścieżki QA uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje normalny raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Przebiegi zestawu na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami Gateway. `qa-channel` domyślnie używa współbieżności
4, ograniczonej przez liczbę wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, albo `--concurrency 1` dla wykonania szeregowego.
Polecenie kończy się kodem różnym od zera, gdy jakikolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez nieudanego kodu wyjścia.
Przebiegi live przekazują obsługiwane wejścia auth QA, które są praktyczne dla
gościa: klucze providerów oparte na env, ścieżkę konfiguracji providera QA live oraz
`CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod korzeniem repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowany workspace.

## Referencja QA dla Telegram, Discord i Slack

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) z powodu liczby scenariuszy i provisioningu homeservera opartego na Docker. Telegram, Discord i Slack są mniejsze - po kilka scenariuszy, bez systemu profili, względem wcześniej istniejących rzeczywistych kanałów - więc ich referencja znajduje się tutaj.

### Wspólne flagi CLI

Te ścieżki rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                 | Domyślnie                                                       | Opis                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Uruchom tylko ten scenariusz. Powtarzalne.                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Miejsce zapisu raportów/podsumowania/zaobserwowanych wiadomości i logu wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Korzeń repozytorium przy wywołaniu z neutralnego cwd.                                                                 |
| `--sut-account <id>`                  | `sut`                                                           | Tymczasowy identyfikator konta wewnątrz konfiguracji QA Gateway.                                                      |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` lub `live-frontier` (starsze `live-openai` nadal działa).                                               |
| `--model <ref>` / `--alt-model <ref>` | domyślny provider                                               | Referencje modelu podstawowego/alternatywnego.                                                                        |
| `--fast`                              | wyłączone                                                       | Szybki tryb providera tam, gdzie jest obsługiwany.                                                                    |
| `--credential-source <env\|convex>`   | `env`                                                           | Zobacz [pulę poświadczeń Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`                      | Rola używana, gdy `--credential-source convex`.                                                                       |

Każda ścieżka kończy się kodem różnym od zera przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania nieudanego kodu wyjścia.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Celuje w jedną rzeczywistą prywatną grupę Telegram z dwoma różnymi botami (driver + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-to-bot działa najlepiej, gdy oba boty mają włączony **Bot-to-Bot Communication Mode** w `@BotFather`.

Wymagane env przy `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numeryczny identyfikator czatu (ciąg znaków).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcjonalne:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości (domyślnie redaguje).

Scenariusze (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Artefakty wyjściowe:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - zawiera RTT dla każdej odpowiedzi (wysłanie przez driver → zaobserwowana odpowiedź SUT), zaczynając od canary.
- `telegram-qa-observed-messages.json` - treści redagowane, chyba że `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Celuje w jeden rzeczywisty prywatny kanał guild Discord z dwoma botami: botem driver kontrolowanym przez harness oraz botem SUT uruchamianym przez potomny OpenClaw gateway przez wbudowany plugin Discord. Weryfikuje obsługę wzmianki kanału, to, że bot SUT zarejestrował natywne polecenie `/help` w Discord, oraz scenariusze dowodowe Mantis typu opt-in.

Wymagane env przy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - musi pasować do identyfikatora użytkownika bota SUT zwróconego przez Discord (w przeciwnym razie ścieżka szybko kończy się niepowodzeniem).

Opcjonalne:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - scenariusz Mantis typu opt-in. Uruchamia się samodzielnie, ponieważ przełącza SUT na zawsze włączone odpowiedzi guild tylko narzędziowe z `messages.statusReactions.enabled=true`, a następnie przechwytuje oś czasu reakcji REST oraz artefakty wizualne HTML/PNG. Raporty Mantis przed/po zachowują też artefakty MP4 dostarczone przez scenariusz jako `baseline.mp4` i `candidate.mp4`.

Uruchom scenariusz reakcji statusu Mantis jawnie:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artefakty wyjściowe:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - treści zredagowane, chyba że ustawiono `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` i `discord-status-reactions-tool-only-timeline.png`, gdy działa scenariusz reakcji statusu.

### QA Slack

```bash
pnpm openclaw qa slack
```

Celuje w jeden rzeczywisty prywatny kanał Slack z dwoma odrębnymi botami: botem sterownika kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny Gateway OpenClaw przez dołączony Plugin Slack.

Wymagane zmienne środowiskowe przy `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcjonalnie:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Artefakty wyjściowe:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - treści zredagowane, chyba że ustawiono `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Konfigurowanie przestrzeni roboczej Slack

Ta ścieżka wymaga dwóch odrębnych aplikacji Slack w jednej przestrzeni roboczej oraz kanału, którego członkami są oba boty:

- `channelId` - identyfikator `Cxxxxxxxxxx` kanału, do którego zaproszono oba boty. Użyj dedykowanego kanału; ścieżka publikuje wiadomości przy każdym uruchomieniu.
- `driverBotToken` - token bota (`xoxb-...`) aplikacji **Driver**.
- `sutBotToken` - token bota (`xoxb-...`) aplikacji **SUT**, która musi być oddzielną aplikacją Slack od sterownika, aby identyfikator jej użytkownika bota był odrębny.
- `sutAppToken` - token na poziomie aplikacji (`xapp-...`) aplikacji SUT z `connections:write`, używany przez Socket Mode, aby aplikacja SUT mogła odbierać zdarzenia.

Preferuj przestrzeń roboczą Slack dedykowaną do QA zamiast ponownego używania przestrzeni produkcyjnej.

Poniższy manifest SUT celowo zawęża produkcyjną instalację dołączonego Plugin Slack (`extensions/slack/src/setup-shared.ts:10`) do uprawnień i zdarzeń pokrywanych przez pakiet live Slack QA. Konfigurację kanału produkcyjnego widzianą przez użytkowników opisuje [Szybka konfiguracja kanału Slack](/pl/channels/slack#quick-setup); para QA Driver/SUT jest celowo oddzielna, ponieważ ścieżka wymaga dwóch odrębnych identyfikatorów użytkowników botów w jednej przestrzeni roboczej.

**1. Utwórz aplikację Driver**

Przejdź do [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → wybierz przestrzeń roboczą QA, wklej poniższy manifest, a następnie _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Skopiuj _Bot User OAuth Token_ (`xoxb-...`) - stanie się on `driverBotToken`. Sterownik musi tylko publikować wiadomości i identyfikować siebie; bez zdarzeń, bez Socket Mode.

**2. Utwórz aplikację SUT**

Powtórz _Create New App → From a manifest_ w tej samej przestrzeni roboczej. Ta aplikacja QA celowo używa węższej wersji manifestu produkcyjnego dołączonego Plugin Slack (`extensions/slack/src/setup-shared.ts:10`): zakresy i zdarzenia reakcji są pominięte, ponieważ pakiet live Slack QA nie obejmuje jeszcze obsługi reakcji.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Po utworzeniu aplikacji przez Slack wykonaj dwie czynności na jej stronie ustawień:

- _Install to Workspace_ → skopiuj _Bot User OAuth Token_ → stanie się on `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → dodaj zakres `connections:write` → zapisz → skopiuj wartość `xapp-...` → stanie się ona `sutAppToken`.

Zweryfikuj, że oba boty mają odrębne identyfikatory użytkowników, wywołując `auth.test` dla każdego tokenu. Runtime rozróżnia sterownik i SUT według identyfikatora użytkownika; ponowne użycie jednej aplikacji dla obu ról natychmiast przerwie mention-gating.

**3. Utwórz kanał**

W przestrzeni roboczej QA utwórz kanał, np. `#openclaw-qa`, i zaproś oba boty z poziomu kanału:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Skopiuj identyfikator `Cxxxxxxxxxx` z _channel info → About → Channel ID_ - stanie się on `channelId`. Kanał publiczny działa; jeśli użyjesz kanału prywatnego, obie aplikacje mają już `groups:history`, więc odczyty historii przez harness nadal się powiodą.

**4. Zarejestruj poświadczenia**

Dwie opcje. Użyj zmiennych środowiskowych do debugowania na pojedynczej maszynie (ustaw cztery zmienne `OPENCLAW_QA_SLACK_*` i przekaż `--credential-source env`) albo zasiej współdzieloną pulę Convex, aby CI i inni maintainerzy mogli je dzierżawić.

Dla puli Convex zapisz cztery pola do pliku JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Po wyeksportowaniu `OPENCLAW_QA_CONVEX_SITE_URL` i `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` w powłoce zarejestruj i zweryfikuj:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Oczekuj `count: 1`, `status: "active"`, bez pola `lease`.

**5. Zweryfikuj end to end**

Uruchom ścieżkę lokalnie, aby potwierdzić, że oba boty mogą komunikować się ze sobą przez brokera:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Zielone uruchomienie kończy się znacznie poniżej 30 sekund, a `slack-qa-report.md` pokazuje zarówno `slack-canary`, jak i `slack-mention-gating` ze statusem `pass`. Jeśli ścieżka zawiesi się na około 90 sekund i zakończy z `Convex credential pool exhausted for kind "slack"`, pula jest pusta albo każdy wiersz jest dzierżawiony - `qa credentials list --kind slack --status all --json` pokaże, która sytuacja występuje.

### Pula poświadczeń Convex

Ścieżki Telegram, Discord i Slack mogą dzierżawić poświadczenia ze współdzielonej puli Convex zamiast czytać powyższe zmienne środowiskowe. Przekaż `--credential-source convex` (albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab pozyskuje wyłączną dzierżawę, wysyła dla niej Heartbeat przez czas trwania uruchomienia i zwalnia ją przy zamykaniu. Rodzaje puli to `"telegram"`, `"discord"` i `"slack"`.

Kształty payloadów walidowane przez brokera przy `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` musi być numerycznym ciągiem identyfikatora czatu.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` musi pasować do `^[A-Z][A-Z0-9]+$` (identyfikator Slack taki jak `Cxxxxxxxxxx`). Zobacz [Konfigurowanie przestrzeni roboczej Slack](#setting-up-the-slack-workspace), aby przygotować aplikację i zakresy.

Operacyjne zmienne środowiskowe i kontrakt endpointu brokera Convex znajdują się w [Testowanie → Współdzielone poświadczenia Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji pochodzi sprzed obsługi Discord; semantyka brokera jest identyczna dla obu rodzajów).

## Seedy oparte na repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Celowo znajdują się w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla agenta.

`qa-lab` powinien pozostać ogólnym runnerem Markdown. Każdy plik Markdown scenariusza jest źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, możliwości, ścieżki i ryzyka
- odwołania do dokumentacji i kodu
- opcjonalne wymagania dotyczące Plugin
- opcjonalną poprawkę konfiguracji Gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia runtime, która obsługuje `qa-flow`, może pozostać ogólna i przekrojowa. Na przykład scenariusze Markdown mogą łączyć helpery po stronie transportu z helperami po stronie przeglądarki, które sterują osadzonym Control UI przez szew `browser.request` Gateway bez dodawania runnera dla szczególnego przypadku.

Pliki scenariuszy powinny być grupowane według możliwości produktu, a nie folderu drzewa źródłowego. Zachowuj stabilne identyfikatory scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs` do śledzenia implementacji.

Lista bazowa powinna pozostać na tyle szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania zwrotne Cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- czytanie repozytorium i dokumentacji
- jedno małe zadanie budowania, takie jak Lobster Invaders

## Ścieżki mock providerów

`qa suite` ma dwie lokalne ścieżki mock providerów:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną deterministyczną ścieżką mock dla QA opartego na repozytorium i bramek parzystości.
- `aimock` uruchamia serwer providera oparty na AIMock dla eksperymentalnego protokołu, fixture, record/replay i pokrycia chaos. Jest dodatkiem i nie zastępuje dispatchera scenariuszy `mock-openai`.

Implementacja ścieżki providera znajduje się pod `extensions/qa-lab/src/providers/`. Każdy provider posiada swoje ustawienia domyślne, uruchamianie lokalnego serwera, konfigurację modelu Gateway, potrzeby stagingu auth-profile oraz flagi możliwości live/mock. Współdzielony kod pakietu i Gateway powinien przechodzić przez rejestr providerów zamiast rozgałęziać się po nazwach providerów.

## Adaptery transportu

`qa-lab` posiada ogólny szew transportu dla scenariuszy QA Markdown. `qa-channel` jest pierwszym adapterem na tym szwie, ale cel projektowy jest szerszy: przyszłe rzeczywiste lub syntetyczne kanały powinny podłączać się do tego samego runnera pakietu zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział wygląda tak:

- `qa-lab` posiada ogólne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- Adapter transportu posiada konfigurację Gateway, gotowość, obserwację przychodzącą i wychodzącą, akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy Markdown pod `qa/scenarios/` definiują uruchomienie testu; `qa-lab` zapewnia wielokrotnego użytku powierzchnię runtime, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA Markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który ćwiczy kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy współdzielony host `qa-lab` może posiadać przepływ.

`qa-lab` posiada mechanikę współdzielonego hosta:

- główny punkt polecenia `openclaw qa`
- uruchamianie i zamykanie zestawu
- współbieżność workerów
- zapisywanie artefaktów
- generowanie raportów
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów są właścicielami kontraktu transportu:

- jak `openclaw qa <runner>` jest montowane pod współdzielonym głównym punktem `qa`
- jak Gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypty i znormalizowany stan transportu
- jak wykonywane są akcje oparte na transporcie
- jak obsługiwane jest resetowanie lub sprzątanie specyficzne dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Zachowaj `qa-lab` jako właściciela współdzielonego głównego punktu `qa`.
2. Zaimplementuj runner transportu na współdzielonym seamie hosta `qa-lab`.
3. Zachowaj mechanikę specyficzną dla transportu wewnątrz pluginu runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie główne. Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` lekkim; leniwe CLI i wykonywanie runnera powinny pozostać za osobnymi punktami wejścia.
5. Utwórz lub dostosuj scenariusze Markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj ogólnych helperów scenariuszy dla nowych scenariuszy.
7. Utrzymuj działanie istniejących aliasów zgodności, chyba że repozytorium przeprowadza zamierzoną migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, zachowaj je w tym pluginie runnera lub harnessie pluginu.
- Jeśli scenariusz potrzebuje nowej funkcji, z której może korzystać więcej niż jeden kanał, dodaj ogólny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, pozostaw scenariusz specyficzny dla transportu i wyraźnie wskaż to w kontrakcie scenariusza.

### Nazwy helperów scenariuszy

Preferowane ogólne helpery dla nowych scenariuszy:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ale nowe scenariusze powinny używać nazw ogólnych. Aliasy istnieją po to, aby uniknąć migracji typu flag-day, a nie jako docelowy model.

## Raportowanie

`qa-lab` eksportuje raport protokołu w Markdown z obserwowanej osi czasu szyny.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co zawiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać inwentarz dostępnych scenariuszy - przydatny podczas szacowania pracy uzupełniającej lub podłączania nowego transportu - uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać dane wyjściowe czytelne maszynowo).

Do sprawdzania charakteru i stylu uruchom ten sam scenariusz na wielu żywych
referencjach modeli i zapisz oceniony raport Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Polecenie uruchamia lokalne procesy potomne Gateway QA, a nie Docker. Scenariusze oceny charakteru
powinny ustawiać personę przez `SOUL.md`, a następnie wykonywać zwykłe tury użytkownika,
takie jak czat, pomoc z workspace i małe zadania plikowe. Model kandydujący nie powinien
otrzymać informacji, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, zapisuje podstawowe statystyki uruchomienia, a następnie prosi modele sędziowskie w trybie szybkim z
wnioskowaniem `xhigh`, gdzie jest obsługiwane, o uszeregowanie uruchomień według naturalności, klimatu i humoru.
Użyj `--blind-judge-models` podczas porównywania providerów: prompt sędziego nadal otrzymuje
każdy transkrypt i status uruchomienia, ale referencje kandydatów są zastępowane neutralnymi
etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po
parsowaniu.
Uruchomienia kandydatów domyślnie używają myślenia `high`, z `medium` dla GPT-5.5 i `xhigh`
dla starszych referencji ewaluacyjnych OpenAI, które je obsługują. Nadpisz konkretnego kandydata inline za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalną wartość fallback, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu szybkiego, aby tam, gdzie provider
go obsługuje, używać przetwarzania priorytetowego. Dodaj inline `,fast`, `,no-fast` lub `,fast=false`, gdy
pojedynczy kandydat lub sędzia potrzebuje nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb szybki dla każdego modelu kandydującego. Czasy trwania kandydatów i sędziów są
zapisywane w raporcie na potrzeby analizy benchmarków, ale prompty sędziów wyraźnie mówią,
aby nie szeregować według szybkości.
Uruchomienia modeli kandydatów i sędziów domyślnie używają współbieżności 16. Obniż
`--concurrency` lub `--judge-concurrency`, gdy limity providera lub presja lokalnego Gateway
sprawiają, że uruchomienie staje się zbyt zaszumione.
Gdy nie przekazano kandydata `--model`, ocena charakteru domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie przekazano `--model`.
Gdy nie przekazano `--judge-model`, domyślnymi sędziami są
`openai/gpt-5.5,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Matrix QA](/pl/concepts/qa-matrix)
- [Kanał QA](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Dashboard](/pl/web/dashboard)
