---
read_when:
    - Zrozumienie, jak współdziała stos QA
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportowego
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Tworzenie bardziej realistycznej automatyzacji QA wokół pulpitu Gateway
summary: 'Omówienie stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu na żywo, adaptery transportu i raportowanie.'
title: Przegląd QA
x-i18n:
    generated_at: "2026-05-04T02:23:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b376767b967a51cc8a45ca5ce420f78067b52e6368d2abe921ffed533f6f9ba
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma służyć do testowania OpenClaw w bardziej realistyczny,
kanałowy sposób, niż pozwala na to pojedynczy test jednostkowy.

Bieżące elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami wiadomości prywatnych, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkrypcji,
  wstrzykiwania wiadomości przychodzących oraz eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe Pluginy runnerów: adaptery transportu live, które
  sterują rzeczywistym kanałem wewnątrz podrzędnego Gateway QA.
- `qa/`: zasoby początkowe oparte na repozytorium dla zadania startowego i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja live przed i po dla błędów, które
  wymagają rzeczywistych transportów, zrzutów ekranu z przeglądarki, stanu VM i dowodów PR.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele z nich ma aliasy skryptów `pnpm qa:*`;
obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Wbudowany samotest QA; zapisuje raport Markdown.                                                                                                                          |
| `qa suite`                                          | Uruchom scenariusze oparte na repozytorium względem toru Gateway QA. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej VM z Linuksem.                 |
| `qa coverage`                                       | Wypisz markdownowy inwentarz pokrycia scenariuszy (`--json` dla wyjścia maszynowego).                                                                                     |
| `qa parity-report`                                  | Porównaj dwa pliki `qa-suite-summary.json` i zapisz agentowy raport parzystości.                                                                                          |
| `qa character-eval`                                 | Uruchom scenariusz QA postaci na wielu modelach live z ocenianym raportem. Zobacz [Raportowanie](#reporting).                                                             |
| `qa manual`                                         | Uruchom jednorazowy prompt względem wybranego toru providera/modelu.                                                                                                      |
| `qa ui`                                             | Uruchom interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                         |
| `qa docker-build-image`                             | Zbuduj wstępnie przygotowany obraz Docker QA.                                                                                                                             |
| `qa docker-scaffold`                                | Zapisz szkielet docker-compose dla dashboardu QA + toru Gateway.                                                                                                          |
| `qa up`                                             | Zbuduj witrynę QA, uruchom stos oparty na Dockerze, wypisz URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Uruchom tylko serwer providera AIMock.                                                                                                                                    |
| `qa mock-openai`                                    | Uruchom tylko świadomy scenariuszy serwer providera `mock-openai`.                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządzaj współdzieloną pulą poświadczeń Convex.                                                                                                                          |
| `qa matrix`                                         | Tor transportu live względem jednorazowego homeservera Tuwunel. Zobacz [Matrix QA](/pl/concepts/qa-matrix).                                                                  |
| `qa telegram`                                       | Tor transportu live względem rzeczywistej prywatnej grupy Telegram.                                                                                                       |
| `qa discord`                                        | Tor transportu live względem rzeczywistego prywatnego kanału gildii Discord.                                                                                              |
| `qa slack`                                          | Tor transportu live względem rzeczywistego prywatnego kanału Slack.                                                                                                       |
| `qa mantis`                                         | Runner weryfikacji przed i po dla błędów transportu live, z dowodami w postaci reakcji statusowych Discord i smoke testem pulpitu/przeglądarki Crabbox. Zobacz [Mantis](/pl/concepts/mantis). |

## Przepływ operatora

Obecny przepływ operatora QA to dwupanelowa witryna QA:

- Lewy panel: dashboard Gateway (Control UI) z agentem.
- Prawy panel: QA Lab, pokazujący transkrypcję w stylu Slacka i plan scenariusza.

Uruchom go za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia tor Gateway oparty na Dockerze i udostępnia stronę
QA Lab, na której operator lub pętla automatyzacji może przekazać agentowi misję QA,
obserwować rzeczywiste zachowanie kanału oraz zapisywać, co zadziałało, co się nie powiodło lub
pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez każdorazowego przebudowywania obrazu Docker,
uruchom stos z podmontowanym przez bind bundlem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i podmontowuje przez bind
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten bundle przy zmianie, a przeglądarka automatycznie przeładowuje się, gdy zmienia się hash zasobów QA Lab.

Aby wykonać lokalny smoke test śladu OpenTelemetry, uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik śladów OTLP/HTTP, uruchamia scenariusz QA
`otel-trace-smoke` z włączonym Pluginem `diagnostics-otel`, a następnie
dekoduje wyeksportowane spany protobuf i sprawdza krytyczny dla wydania kształt:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` i `openclaw.message.delivery` muszą być obecne;
wywołania modeli nie mogą eksportować `StreamAbandoned` przy udanych turach; surowe identyfikatory diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza śladem. Zapisuje
`otel-smoke-summary.json` obok artefaktów pakietu QA.

QA obserwowalności pozostaje dostępne tylko z checkoutu źródeł. Paczka npm celowo pomija
QA Lab, więc tory wydań pakietów Docker nie uruchamiają poleceń `qa`. Użyj
`pnpm qa:otel:smoke` ze zbudowanego checkoutu źródeł podczas zmieniania instrumentacji
diagnostycznej.

Aby uruchomić tor smoke Matrix z rzeczywistym transportem, użyj:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Pełna dokumentacja CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ artefaktów dla tego toru znajdują się w [Matrix QA](/pl/concepts/qa-matrix). W skrócie: provisionuje jednorazowy homeserver Tuwunel w Dockerze, rejestruje tymczasowych użytkowników driver/SUT/observer, uruchamia rzeczywisty Plugin Matrix wewnątrz podrzędnego Gateway QA ograniczonego do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt obserwowanych zdarzeń i połączony log wyjścia w `.artifacts/qa-e2e/matrix-<timestamp>/`.

Dla torów smoke Telegram, Discord i Slack z rzeczywistym transportem:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Celują one w istniejący wcześniej rzeczywisty kanał z dwoma botami (driver + SUT). Wymagane zmienne środowiskowe, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane poniżej w [Dokumentacja QA Telegram, Discord i Slack](#telegram-discord-and-slack-qa-reference).

Przed użyciem poświadczeń live z puli uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza środowisko brokera Convex, weryfikuje ustawienia endpointów i sprawdza osiągalność admin/list, gdy sekret maintenera jest obecny. Raportuje tylko status ustawione/brakujące dla sekretów.

## Pokrycie transportu live

Tory transportu live współdzielą jeden kontrakt zamiast wymyślać własny kształt listy scenariuszy. `qa-channel` to szeroki syntetyczny pakiet zachowań produktu i nie jest częścią macierzy pokrycia transportu live.

| Tor      | Canary | Bramkowanie wzmianek | Bot-do-bota | Blokada allowlisty | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Rejestracja natywnego polecenia |
| -------- | ------ | -------------------- | ----------- | ------------------ | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | ---------------- | ------------------------------- |
| Matrix   | x      | x                    | x           | x                  | x                             | x                       | x                 | x              | x                  |                  |                                 |
| Telegram | x      | x                    | x           |                    |                               |                         |                   |                |                    | x                |                                 |
| Discord  | x      | x                    | x           |                    |                               |                         |                   |                |                    |                  | x                               |
| Slack    | x      | x                    | x           |                    |                               |                         |                   |                |                    |                  |                                 |

To utrzymuje `qa-channel` jako szeroki pakiet zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe transporty live współdzielą jedną jawną listę kontrolną kontraktu transportu.

Aby uruchomić jednorazowy tor VM z Linuksem bez wprowadzania Dockera do ścieżki QA, użyj:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje normalny raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Wykorzystuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia pakietu na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami Gateway. `qa-channel` domyślnie używa współbieżności
4, ograniczonej liczbą wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, albo `--concurrency 1` dla wykonania szeregowego.
Polecenie kończy się kodem niezerowym, gdy jakikolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez błędnego kodu wyjścia.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze providerów oparte na env, ścieżkę konfiguracji providera QA live oraz
`CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez podmontowany workspace.

## Dokumentacja QA Telegram, Discord i Slack

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) ze względu na liczbę scenariuszy i provisionowanie homeservera oparte na Dockerze. Telegram, Discord i Slack są mniejsze — po kilka scenariuszy każdy, bez systemu profili, względem istniejących wcześniej rzeczywistych kanałów — dlatego ich dokumentacja znajduje się tutaj.

### Wspólne flagi CLI

Te tory rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                 | Domyślnie                                                       | Opis                                                                                                                         |
| ------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Uruchom tylko ten scenariusz. Można powtarzać.                                                                               |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Miejsce zapisu raportów/podsumowania/zaobserwowanych wiadomości oraz dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Katalog główny repozytorium przy wywołaniu z neutralnego cwd.                                                                 |
| `--sut-account <id>`                  | `sut`                                                           | Tymczasowy identyfikator konta w konfiguracji Gateway QA.                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` albo `live-frontier` (starsze `live-openai` nadal działa).                                                      |
| `--model <ref>` / `--alt-model <ref>` | domyślne ustawienie dostawcy                                    | Referencje modelu podstawowego/alternatywnego.                                                                                |
| `--fast`                              | wyłączone                                                       | Tryb szybki dostawcy tam, gdzie jest obsługiwany.                                                                             |
| `--credential-source <env\|convex>`   | `env`                                                           | Zobacz [pulę poświadczeń Convex](#convex-credential-pool).                                                                    |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`                      | Rola używana, gdy `--credential-source convex`.                                                                               |

Każda ścieżka kończy działanie kodem różnym od zera przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania kodu wyjścia oznaczającego błąd.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną rzeczywistą prywatną grupę Telegram z dwoma różnymi botami (sterownik + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-do-bota działa najlepiej, gdy oba boty mają włączony **Bot-to-Bot Communication Mode** w `@BotFather`.

Wymagane zmienne środowiskowe, gdy `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numeryczny identyfikator czatu (ciąg znaków).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcjonalnie:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` zachowuje treść wiadomości w artefaktach zaobserwowanych wiadomości (domyślnie redaguje).

Scenariusze (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Artefakty wyjściowe:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — zawiera RTT dla każdej odpowiedzi (wysłanie przez sterownik → zaobserwowana odpowiedź SUT), zaczynając od canary.
- `telegram-qa-observed-messages.json` — treści są redagowane, chyba że `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Celuje w jeden rzeczywisty prywatny kanał gildii Discord z dwoma botami: botem sterownika kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny OpenClaw Gateway za pośrednictwem dołączonego Plugin Discord. Weryfikuje obsługę wzmianki kanału, to, że bot SUT zarejestrował natywne polecenie `/help` w Discord, oraz scenariusze dowodowe Mantis wymagające świadomego włączenia.

Wymagane zmienne środowiskowe, gdy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — musi odpowiadać identyfikatorowi użytkownika bota SUT zwróconemu przez Discord (w przeciwnym razie ścieżka szybko kończy się niepowodzeniem).

Opcjonalnie:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treść wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scenariusz Mantis wymagający świadomego włączenia. Uruchamia się samodzielnie, ponieważ przełącza SUT na stale włączone odpowiedzi gildii wyłącznie narzędziowe z `messages.statusReactions.enabled=true`, a następnie przechwytuje oś czasu reakcji REST oraz artefakt wizualny HTML/PNG.

Jawne uruchomienie scenariusza reakcji statusu Mantis:

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
- `discord-qa-observed-messages.json` — treści są redagowane, chyba że `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` i `discord-status-reactions-tool-only-timeline.png`, gdy działa scenariusz reakcji statusu.

### QA Slack

```bash
pnpm openclaw qa slack
```

Celuje w jeden rzeczywisty prywatny kanał Slack z dwoma różnymi botami: botem sterownika kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny OpenClaw Gateway za pośrednictwem dołączonego Plugin Slack.

Wymagane zmienne środowiskowe, gdy `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcjonalnie:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` zachowuje treść wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artefakty wyjściowe:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — treści są redagowane, chyba że `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Pula poświadczeń Convex

Ścieżki Telegram, Discord i Slack mogą dzierżawić poświadczenia ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne środowiskowe. Przekaż `--credential-source convex` (albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab uzyskuje wyłączną dzierżawę, wysyła jej Heartbeat przez czas trwania uruchomienia i zwalnia ją przy zamykaniu. Rodzaje puli to `"telegram"`, `"discord"` i `"slack"`.

Kształty payloadu walidowane przez broker w `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` musi być numerycznym ciągiem identyfikatora czatu.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operacyjne zmienne środowiskowe i kontrakt punktu końcowego brokera Convex znajdują się w [Testowanie → Współdzielone poświadczenia Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji jest starsza niż obsługa Discord; semantyka brokera jest identyczna dla obu rodzajów).

## Seedy oparte na repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Są celowo przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta.

`qa-lab` powinien pozostać ogólnym runnerem markdown. Każdy plik markdown scenariusza jest
źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, capability, ścieżki i ryzyka
- odwołania do dokumentacji i kodu
- opcjonalne wymagania Plugin
- opcjonalną łatkę konfiguracji Gateway
- wykonywalny `qa-flow`

Wielokrotnego użycia powierzchnia runtime obsługująca `qa-flow` może pozostać ogólna
i przekrojowa. Na przykład scenariusze markdown mogą łączyć helpery po stronie transportu
z helperami po stronie przeglądarki, które sterują osadzonym Control UI przez
seam Gateway `browser.request` bez dodawania runnera dla specjalnego przypadku.

Pliki scenariuszy powinny być grupowane według capability produktu, a nie według folderu
drzewa źródeł. Utrzymuj stabilne identyfikatory scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs`
do śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątku
- cykl życia akcji wiadomości
- callbacki cron
- przypominanie z pamięci
- przełączanie modeli
- przekazanie do subagenta
- czytanie repozytorium i dokumentacji
- jedno małe zadanie kompilacji, takie jak Lobster Invaders

## Ścieżki mock dostawcy

`qa suite` ma dwie lokalne ścieżki mock dostawcy:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną
  deterministyczną ścieżką mock dla QA opartego na repozytorium i bramek parytetu.
- `aimock` uruchamia serwer dostawcy oparty na AIMock dla eksperymentalnego protokołu,
  fixture, record/replay i pokrycia chaos. Jest addytywny i nie zastępuje
  dyspozytora scenariuszy `mock-openai`.

Implementacja ścieżek dostawcy znajduje się pod `extensions/qa-lab/src/providers/`.
Każdy dostawca jest właścicielem swoich wartości domyślnych, uruchamiania lokalnego serwera, konfiguracji modelu Gateway,
potrzeb stagingu profilu uwierzytelniania oraz flag capability live/mock. Wspólny kod suite i
Gateway powinien kierować przez rejestr dostawców zamiast rozgałęziać się według
nazw dostawców.

## Adaptery transportu

`qa-lab` jest właścicielem ogólnego seam transportu dla scenariuszy QA markdown. `qa-channel` jest pierwszym adapterem na tym seam, ale cel projektowy jest szerszy: przyszłe rzeczywiste lub syntetyczne kanały powinny wpinać się do tego samego runnera suite zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział jest następujący:

- `qa-lab` jest właścicielem ogólnego wykonywania scenariuszy, współbieżności workerów, zapisu artefaktów i raportowania.
- Adapter transportu jest właścicielem konfiguracji Gateway, gotowości, obserwacji przychodzącej i wychodzącej, akcji transportu oraz znormalizowanego stanu transportu.
- Pliki scenariuszy markdown pod `qa/scenarios/` definiują uruchomienie testu; `qa-lab` udostępnia wielokrotnego użycia powierzchnię runtime, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który sprawdza kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA najwyższego poziomu, gdy współdzielony host `qa-lab` może być właścicielem przepływu.

`qa-lab` jest właścicielem współdzielonej mechaniki hosta:

- korzenia poleceń `openclaw qa`
- uruchamiania i zamykania suite
- współbieżności workerów
- zapisu artefaktów
- generowania raportów
- wykonywania scenariuszy
- aliasów zgodności dla starszych scenariuszy `qa-channel`

Plugin runnera są właścicielami kontraktu transportu:

- sposobu montowania `openclaw qa <runner>` pod współdzielonym korzeniem `qa`
- sposobu konfigurowania Gateway dla tego transportu
- sposobu sprawdzania gotowości
- sposobu wstrzykiwania zdarzeń przychodzących
- sposobu obserwowania wiadomości wychodzących
- sposobu udostępniania transkryptów i znormalizowanego stanu transportu
- sposobu wykonywania akcji opartych na transporcie
- sposobu obsługi resetu lub czyszczenia specyficznego dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym seamie hosta `qa-lab`.
3. Zachowaj mechanikę specyficzną dla transportu wewnątrz pluginu runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie główne. Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` lekkim; leniwe wykonywanie CLI i runnera powinno pozostać za oddzielnymi punktami wejścia.
5. Utwórz lub dostosuj scenariusze markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj ogólnych helperów scenariuszy dla nowych scenariuszy.
7. Utrzymuj istniejące aliasy zgodności, chyba że repo wykonuje zamierzoną migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, zachowaj je w tym pluginie runnera lub harnessie pluginu.
- Jeśli scenariusz potrzebuje nowej możliwości, której może użyć więcej niż jeden kanał, dodaj ogólny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla transportu i wyraźnie zaznacz to w kontrakcie scenariusza.

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ale nowe scenariusze powinny używać ogólnych nazw. Aliasy istnieją po to, aby uniknąć migracji typu flag day, a nie jako docelowy model.

## Raportowanie

`qa-lab` eksportuje raport protokołu w Markdown z obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać inwentarz dostępnych scenariuszy — przydatny przy szacowaniu prac uzupełniających lub podłączaniu nowego transportu — uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać wynik czytelny maszynowo).

W przypadku kontroli charakteru i stylu uruchom ten sam scenariusz dla wielu żywych
referencji modeli i zapisz oceniony raport Markdown:

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

Polecenie uruchamia lokalne procesy potomne Gateway QA, a nie Docker. Scenariusze character eval
powinny ustawiać personę przez `SOUL.md`, a następnie uruchamiać zwykłe tury użytkownika,
takie jak czat, pomoc w workspace i małe zadania na plikach. Model kandydujący
nie powinien być informowany, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, zapisuje podstawowe statystyki uruchomienia, a następnie prosi modele oceniające w trybie fast z
rozumowaniem `xhigh`, gdzie jest obsługiwane, o uszeregowanie uruchomień według naturalności, vibe’u i humoru.
Użyj `--blind-judge-models` podczas porównywania providerów: prompt oceniający nadal otrzymuje
każdy transkrypt i status uruchomienia, ale referencje kandydatów są zastępowane neutralnymi
etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po
parsowaniu.
Uruchomienia kandydatów domyślnie używają myślenia `high`, z `medium` dla GPT-5.5 i `xhigh`
dla starszych referencji ewaluacyjnych OpenAI, które je obsługują. Nadpisz konkretnego kandydata inline za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalny fallback, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu fast, aby korzystać z przetwarzania priorytetowego tam,
gdzie provider je obsługuje. Dodaj `,fast`, `,no-fast` lub `,fast=false` inline, gdy
pojedynczy kandydat lub oceniający wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb fast dla każdego modelu kandydującego. Czasy trwania kandydatów i oceniających są
zapisywane w raporcie do analizy benchmarków, ale prompty oceniające wyraźnie mówią,
aby nie ustalać rankingu według szybkości.
Uruchomienia modeli kandydatów i oceniających domyślnie używają współbieżności 16. Obniż
`--concurrency` lub `--judge-concurrency`, gdy limity providera lub lokalne obciążenie Gateway
sprawiają, że uruchomienie jest zbyt zaszumione.
Gdy nie przekazano żadnego kandydującego `--model`, character eval domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` i
`google/gemini-3.1-pro-preview`, gdy nie przekazano żadnego `--model`.
Gdy nie przekazano `--judge-model`, domyślni oceniający to
`openai/gpt-5.5,thinking=xhigh,fast` i
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [QA Matrix](/pl/concepts/qa-matrix)
- [Kanał QA](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Dashboard](/pl/web/dashboard)
