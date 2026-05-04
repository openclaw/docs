---
read_when:
    - Zrozumienie, jak stos QA składa się w całość
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportu
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Tworzenie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu na żywo, adaptery transportu i raportowanie.'
title: Omówienie QA
x-i18n:
    generated_at: "2026-05-04T07:04:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma sprawdzać OpenClaw w bardziej realistyczny,
ukształtowany przez kanały sposób niż pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkrypcji,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe pluginy runnera: adaptery transportu live, które
  sterują prawdziwym kanałem w podrzędnym Gateway QA.
- `qa/`: zasoby seed oparte na repozytorium dla zadania startowego i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja live przed i po dla błędów, które
  wymagają prawdziwych transportów, zrzutów ekranu przeglądarki, stanu VM i dowodów PR.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele ma aliasy skryptów `pnpm qa:*`;
obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Wbudowany samosprawdzian QA; zapisuje raport Markdown.                                                                                                                                      |
| `qa suite`                                          | Uruchom scenariusze oparte na repozytorium względem ścieżki Gateway QA. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej VM z Linuksem.                                |
| `qa coverage`                                       | Wypisz inwentarz pokrycia scenariuszy w markdown (`--json` dla wyjścia maszynowego).                                                                                                       |
| `qa parity-report`                                  | Porównaj dwa pliki `qa-suite-summary.json` i zapisz agentowy raport parytetu.                                                                                                              |
| `qa character-eval`                                 | Uruchom scenariusz QA postaci na wielu modelach live z ocenionym raportem. Zobacz [Raportowanie](#reporting).                                                                              |
| `qa manual`                                         | Uruchom jednorazowy prompt względem wybranej ścieżki dostawcy/modelu.                                                                                                                      |
| `qa ui`                                             | Uruchom interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                                          |
| `qa docker-build-image`                             | Zbuduj wstępnie przygotowany obraz Docker QA.                                                                                                                                               |
| `qa docker-scaffold`                                | Zapisz szkielet docker-compose dla dashboardu QA + ścieżki Gateway.                                                                                                                        |
| `qa up`                                             | Zbuduj witrynę QA, uruchom stos oparty na Dockerze, wypisz URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                    |
| `qa aimock`                                         | Uruchom tylko serwer dostawcy AIMock.                                                                                                                                                       |
| `qa mock-openai`                                    | Uruchom tylko świadomy scenariuszy serwer dostawcy `mock-openai`.                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządzaj współdzieloną pulą poświadczeń Convex.                                                                                                                                            |
| `qa matrix`                                         | Ścieżka transportu live względem jednorazowego homeservera Tuwunel. Zobacz [Matrix QA](/pl/concepts/qa-matrix).                                                                               |
| `qa telegram`                                       | Ścieżka transportu live względem prawdziwej prywatnej grupy Telegram.                                                                                                                      |
| `qa discord`                                        | Ścieżka transportu live względem prawdziwego prywatnego kanału gildii Discord.                                                                                                             |
| `qa slack`                                          | Ścieżka transportu live względem prawdziwego prywatnego kanału Slack.                                                                                                                      |
| `qa mantis`                                         | Runner weryfikacji przed i po dla błędów transportu live, z dowodami reakcji statusowych Discord, smoke Crabbox desktop/browser i smoke Slack w VNC. Zobacz [Mantis](/pl/concepts/mantis).    |

## Przepływ operatora

Obecny przepływ operatora QA to dwupanelowa witryna QA:

- Po lewej: dashboard Gateway (Control UI) z agentem.
- Po prawej: QA Lab, pokazujący transkrypcję w stylu Slack i plan scenariusza.

Uruchom ją przez:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia ścieżkę Gateway opartą na Dockerze i udostępnia
stronę QA Lab, gdzie operator lub pętla automatyzacji może przekazać agentowi
misję QA, obserwować prawdziwe zachowanie kanału oraz zapisać, co zadziałało, co się
nie powiodło albo pozostało zablokowane.

Dla szybszej iteracji interfejsu QA Lab bez przebudowywania obrazu Docker za każdym razem
uruchom stos z podmontowanym pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i montuje
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet po zmianie, a przeglądarka automatycznie przeładowuje się, gdy zmienia się hash
zasobu QA Lab.

Dla lokalnego smoke śladu OpenTelemetry uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik śladów OTLP/HTTP, uruchamia scenariusz QA
`otel-trace-smoke` z włączonym pluginem `diagnostics-otel`, następnie
dekoduje wyeksportowane spany protobuf i sprawdza krytyczny dla wydania kształt:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` i `openclaw.message.delivery` muszą być obecne;
wywołania modeli nie mogą eksportować `StreamAbandoned` przy udanych turach; surowe identyfikatory diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza śladem. Zapisuje
`otel-smoke-summary.json` obok artefaktów zestawu QA.

QA obserwowalności pozostaje wyłącznie dla checkoutu źródeł. Tarball npm celowo pomija
QA Lab, więc ścieżki wydania Docker pakietu nie uruchamiają poleceń `qa`. Używaj
`pnpm qa:otel:smoke` ze zbudowanego checkoutu źródeł przy zmianach instrumentacji
diagnostycznej.

Dla ścieżki smoke Matrix z prawdziwym transportem uruchom:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Pełna dokumentacja CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów dla tej ścieżki znajdują się w [Matrix QA](/pl/concepts/qa-matrix). W skrócie: aprowizuje jednorazowy homeserver Tuwunel w Dockerze, rejestruje tymczasowych użytkowników driver/SUT/observer, uruchamia prawdziwy Plugin Matrix w podrzędnym Gateway QA ograniczonym do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt zaobserwowanych zdarzeń i połączony dziennik wyjściowy w `.artifacts/qa-e2e/matrix-<timestamp>/`.

Dla ścieżek smoke Telegram, Discord i Slack z prawdziwym transportem:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Celują one w istniejący wcześniej prawdziwy kanał z dwoma botami (driver + SUT). Wymagane zmienne env, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane w [Dokumentacji QA Telegram, Discord i Slack](#telegram-discord-and-slack-qa-reference) poniżej.

Dla pełnego uruchomienia desktopowej VM Slack z ratunkowym VNC uruchom:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

To polecenie dzierżawi maszynę desktop/browser Crabbox, uruchamia ścieżkę live Slack
wewnątrz VM, otwiera Slack Web w przeglądarce VNC, przechwytuje pulpit i
kopiuje `slack-qa/` oraz `slack-desktop-smoke.png` z powrotem do katalogu artefaktów
Mantis. Użyj ponownie `--lease-id <cbx_...>` po ręcznym zalogowaniu do Slack Web
przez VNC. Z `--gateway-setup` Mantis pozostawia trwały Gateway Slack OpenClaw
działający wewnątrz VM na porcie `38973`; bez tego polecenie uruchamia
normalną ścieżkę QA Slack bot-do-bota i kończy po przechwyceniu artefaktów.

Przed użyciem poświadczeń live z puli uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza env brokera Convex, waliduje ustawienia endpointu i weryfikuje osiągalność admin/list, gdy obecny jest sekret maintenera. Raportuje tylko status ustawione/brakujące dla sekretów.

## Pokrycie transportu live

Ścieżki transportu live współdzielą jeden kontrakt zamiast tworzyć własny kształt listy scenariuszy. `qa-channel` to szeroki syntetyczny zestaw zachowań produktu i nie jest częścią macierzy pokrycia transportu live.

| Ścieżka  | Canary | Bramka wzmianki | Bot-do-bota | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Rejestracja natywnego polecenia |
| -------- | ------ | --------------- | ----------- | ----------------- | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | ---------------- | -------------------------------- |
| Matrix   | x      | x               | x           | x                 | x                             | x                       | x                 | x              | x                  |                  |                                  |
| Telegram | x      | x               | x           |                   |                               |                         |                   |                |                    | x                |                                  |
| Discord  | x      | x               | x           |                   |                               |                         |                   |                |                    |                  | x                                |
| Slack    | x      | x               | x           |                   |                               |                         |                   |                |                    |                  |                                  |

To utrzymuje `qa-channel` jako szeroki zestaw zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe transporty live współdzielą jedną wyraźną checklistę kontraktu
transportu.

Dla jednorazowej ścieżki VM z Linuksem bez wprowadzania Dockera do ścieżki QA uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje standardowy raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia zestawu na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami Gateway. `qa-channel` domyślnie używa współbieżności
4, ograniczonej liczbą wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, albo `--concurrency 1` do wykonania szeregowego.
Polecenie kończy się kodem niezerowym, gdy którykolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez kodu wyjścia oznaczającego błąd.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz
`CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod katalogiem głównym repo, aby gość
mógł zapisywać z powrotem przez zamontowany workspace.

## Dokumentacja QA dla Telegram, Discord i Slack

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) ze względu na liczbę scenariuszy i provisionowanie homeservera oparte na Dockerze. Telegram, Discord i Slack są mniejsze — po kilka scenariuszy każdy, bez systemu profili, wobec istniejących wcześniej prawdziwych kanałów — więc ich dokumentacja znajduje się tutaj.

### Wspólne flagi CLI

Te ścieżki rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                 | Domyślnie                                                      | Opis                                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                              | Uruchom tylko ten scenariusz. Można powtarzać.                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Miejsce zapisu raportów/podsumowania/zaobserwowanych wiadomości i logu wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Katalog główny repozytorium przy wywołaniu z neutralnego cwd.                                                         |
| `--sut-account <id>`                  | `sut`                                                          | Tymczasowy identyfikator konta w konfiguracji QA Gateway.                                                             |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` albo `live-frontier` (starsze `live-openai` nadal działa).                                              |
| `--model <ref>` / `--alt-model <ref>` | domyślne dostawcy                                              | Referencje modelu podstawowego/alternatywnego.                                                                        |
| `--fast`                              | wyłączone                                                      | Tryb szybki dostawcy tam, gdzie jest obsługiwany.                                                                     |
| `--credential-source <env\|convex>`   | `env`                                                          | Zobacz [Pula poświadczeń Convex](#convex-credential-pool).                                                            |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`                     | Rola używana, gdy `--credential-source convex`.                                                                       |

Każda ścieżka kończy się kodem niezerowym przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania kodu wyjścia oznaczającego błąd.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną prawdziwą prywatną grupę Telegram z dwoma różnymi botami (driver + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-bot działa najlepiej, gdy oba boty mają włączony **Bot-to-Bot Communication Mode** w `@BotFather`.

Wymagane env, gdy `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numeryczny identyfikator czatu (ciąg znaków).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcjonalne:

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
- `telegram-qa-summary.json` — zawiera RTT dla każdej odpowiedzi (wysłanie drivera → zaobserwowana odpowiedź SUT), zaczynając od canary.
- `telegram-qa-observed-messages.json` — treści redagowane, chyba że `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Celuje w jeden prawdziwy prywatny kanał gildii Discord z dwoma botami: botem drivera kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny OpenClaw Gateway przez dołączony Plugin Discord. Weryfikuje obsługę wzmianek kanału, to, że bot SUT zarejestrował natywne polecenie `/help` w Discord, oraz opcjonalne scenariusze dowodowe Mantis.

Wymagane env, gdy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — musi pasować do identyfikatora użytkownika bota SUT zwróconego przez Discord (w przeciwnym razie ścieżka szybko kończy się błędem).

Opcjonalne:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treść wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opcjonalny scenariusz Mantis. Działa samodzielnie, ponieważ przełącza SUT na zawsze włączone odpowiedzi gildii wyłącznie narzędziowe z `messages.statusReactions.enabled=true`, a następnie przechwytuje oś czasu reakcji REST oraz artefakt wizualny HTML/PNG.

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
- `discord-qa-observed-messages.json` — treści redagowane, chyba że `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` i `discord-status-reactions-tool-only-timeline.png`, gdy uruchamiany jest scenariusz reakcji statusu.

### QA Slack

```bash
pnpm openclaw qa slack
```

Celuje w jeden prawdziwy prywatny kanał Slack z dwoma różnymi botami: botem drivera kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny OpenClaw Gateway przez dołączony Plugin Slack.

Wymagane env, gdy `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcjonalne:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` zachowuje treść wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artefakty wyjściowe:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — treści redagowane, chyba że `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Pula poświadczeń Convex

Ścieżki Telegram, Discord i Slack mogą dzierżawić poświadczenia ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne env. Przekaż `--credential-source convex` (albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab uzyskuje wyłączną dzierżawę, wysyła Heartbeat przez czas trwania uruchomienia i zwalnia ją przy zamykaniu. Rodzaje puli to `"telegram"`, `"discord"` i `"slack"`.

Kształty payloadów, które broker waliduje przy `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` musi być numerycznym ciągiem chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operacyjne zmienne env i kontrakt endpointu brokera Convex znajdują się w [Testowanie → Współdzielone poświadczenia Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji poprzedza obsługę Discord; semantyka brokera jest identyczna dla obu rodzajów).

## Seedy oparte na repo

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Są celowo trzymane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta.

`qa-lab` powinien pozostać generycznym runnerem markdown. Każdy plik markdown scenariusza jest
źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, capability, ścieżki i ryzyka
- referencje dokumentacji i kodu
- opcjonalne wymagania Plugin
- opcjonalną poprawkę konfiguracji Gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia runtime, która obsługuje `qa-flow`, może pozostać generyczna
i przekrojowa. Na przykład scenariusze markdown mogą łączyć pomocniki po stronie transportu
z pomocnikami po stronie przeglądarki, które sterują osadzonym Control UI przez
seam Gateway `browser.request`, bez dodawania runnera do przypadku szczególnego.

Pliki scenariuszy powinny być grupowane według capability produktu, a nie folderu
drzewa źródłowego. Utrzymuj stabilne identyfikatory scenariuszy, gdy pliki są przenoszone; używaj `docsRefs` i `codeRefs`
do śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- DM i czat kanału
- zachowanie wątków
- cykl życia akcji wiadomości
- callbacki cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie subagentowi
- czytanie repo i czytanie dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Ścieżki mock dostawców

`qa suite` ma dwie lokalne ścieżki mock dostawców:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną
  deterministyczną ścieżką mock dla QA opartego na repo i bramek parzystości.
- `aimock` uruchamia serwer dostawcy oparty na AIMock dla eksperymentalnego pokrycia protokołu,
  fixture, record/replay i chaos. Jest addytywny i nie
  zastępuje dyspozytora scenariuszy `mock-openai`.

Implementacja ścieżek dostawców znajduje się pod `extensions/qa-lab/src/providers/`.
Każdy dostawca posiada swoje wartości domyślne, uruchamianie lokalnego serwera, konfigurację modelu Gateway,
potrzeby przygotowania profilu uwierzytelniania oraz flagi capability live/mock. Współdzielony zestaw i
kod Gateway powinny routować przez rejestr dostawców zamiast rozgałęziać się po
nazwach dostawców.

## Adaptery transportu

`qa-lab` posiada generyczny seam transportu dla scenariuszy QA markdown. `qa-channel` jest pierwszym adapterem na tym seamie, ale cel projektowy jest szerszy: przyszłe kanały prawdziwe lub syntetyczne powinny wpinać się do tego samego runnera zestawu zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział jest następujący:

- `qa-lab` odpowiada za generyczne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- Adapter transportu odpowiada za konfigurację Gateway, gotowość, obserwację wejściową i wyjściową, akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy markdown pod `qa/scenarios/` definiują uruchomienie testu; `qa-lab` zapewnia wielokrotnego użytku powierzchnię runtime, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który sprawdza kontrakt kanału.

Nie dodawaj nowego katalogu głównego poleceń QA najwyższego poziomu, gdy współdzielony host `qa-lab` może być właścicielem przepływu.

`qa-lab` odpowiada za współdzieloną mechanikę hosta:

- korzeń polecenia `openclaw qa`
- uruchamianie i zamykanie zestawu
- współbieżność workerów
- zapisywanie artefaktów
- generowanie raportów
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów odpowiadają za kontrakt transportu:

- sposób montowania `openclaw qa <runner>` pod współdzielonym korzeniem `qa`
- sposób konfigurowania gatewaya dla tego transportu
- sposób sprawdzania gotowości
- sposób wstrzykiwania zdarzeń przychodzących
- sposób obserwowania wiadomości wychodzących
- sposób udostępniania transkrypcji i znormalizowanego stanu transportu
- sposób wykonywania akcji wspieranych przez transport
- sposób obsługi resetowania lub czyszczenia specyficznego dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym styku hosta `qa-lab`.
3. Trzymaj mechanikę specyficzną dla transportu wewnątrz plugina runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie główne. Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` jako lekki plik; leniwe CLI i wykonywanie runnera powinny pozostać za osobnymi punktami wejścia.
5. Utwórz lub dostosuj scenariusze Markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj ogólnych helperów scenariuszy dla nowych scenariuszy.
7. Zachowaj działanie istniejących aliasów zgodności, chyba że repozytorium przeprowadza celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, trzymaj je w tym pluginie runnera lub harnessie plugina.
- Jeśli scenariusz potrzebuje nowej możliwości, której może użyć więcej niż jeden kanał, dodaj ogólny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla transportu i jasno zaznacz to w kontrakcie scenariusza.

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ale przy tworzeniu nowych scenariuszy należy używać nazw ogólnych. Aliasy istnieją po to, aby uniknąć jednorazowej migracji, a nie jako model na przyszłość.

## Raportowanie

`qa-lab` eksportuje raport protokołu w Markdown z obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać inwentarz dostępnych scenariuszy — przydatny przy szacowaniu dalszych prac lub podłączaniu nowego transportu — uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać dane wyjściowe czytelne maszynowo).

W przypadku kontroli charakteru i stylu uruchom ten sam scenariusz na wielu żywych referencjach modeli
i zapisz oceniony raport Markdown:

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

Polecenie uruchamia lokalne procesy potomne gatewaya QA, nie Docker. Scenariusze oceny charakteru
powinny ustawiać personę przez `SOUL.md`, a następnie wykonywać zwykłe tury użytkownika,
takie jak czat, pomoc w obszarze roboczym i małe zadania na plikach. Model kandydacki nie powinien
być informowany, że jest oceniany. Polecenie zachowuje każdą pełną
transkrypcję, zapisuje podstawowe statystyki uruchomienia, a następnie prosi modele oceniające w trybie szybkim z
rozumowaniem `xhigh`, tam gdzie jest obsługiwane, o uszeregowanie uruchomień według naturalności, klimatu i humoru.
Użyj `--blind-judge-models` podczas porównywania dostawców: prompt oceniającego nadal otrzymuje
każdą transkrypcję i status uruchomienia, ale referencje kandydatów są zastępowane neutralnymi
etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po
parsowaniu.
Uruchomienia kandydatów domyślnie używają myślenia `high`, z `medium` dla GPT-5.5 i `xhigh`
dla starszych referencji ewaluacyjnych OpenAI, które je obsługują. Nadpisz konkretnego kandydata inline za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalną wartość zapasową, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu szybkiego, dzięki czemu przetwarzanie priorytetowe jest używane tam,
gdzie dostawca je obsługuje. Dodaj inline `,fast`, `,no-fast` lub `,fast=false`, gdy
pojedynczy kandydat lub oceniający wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb szybki dla każdego modelu kandydackiego. Czasy trwania kandydatów i oceniających są
zapisywane w raporcie do analizy porównawczej, ale prompty oceniających wyraźnie wskazują,
aby nie klasyfikować według szybkości.
Uruchomienia modeli kandydackich i oceniających domyślnie używają współbieżności 16. Obniż
`--concurrency` lub `--judge-concurrency`, gdy limity dostawcy lub lokalne obciążenie gatewaya
sprawiają, że uruchomienie jest zbyt zaszumione.
Gdy nie podano kandydata `--model`, ocena charakteru domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie podano `--model`.
Gdy nie podano `--judge-model`, domyślnymi oceniającymi są
`openai/gpt-5.5,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Matrix QA](/pl/concepts/qa-matrix)
- [QA Channel](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Dashboard](/pl/web/dashboard)
