---
read_when:
    - Zrozumienie, jak stos QA łączy się w całość
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportu
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Budowanie bardziej realistycznej automatyzacji QA wokół pulpitu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu na żywo, adaptery transportu i raportowanie.'
title: Przegląd QA
x-i18n:
    generated_at: "2026-05-03T21:30:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma ćwiczyć OpenClaw w sposób bardziej realistyczny,
ukształtowany jak kanał, niż może to zrobić pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkrypcji,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe pluginy uruchamiające: adaptery transportu live, które
  sterują prawdziwym kanałem wewnątrz podrzędnego QA gateway.
- `qa/`: zasoby startowe przechowywane w repozytorium dla zadania początkowego i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja live przed i po dla błędów, które
  wymagają prawdziwych transportów, zrzutów ekranu przeglądarki, stanu VM i dowodów PR.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele ma aliasy
skryptów `pnpm qa:*`; obie formy są obsługiwane.

| Polecenie                                           | Cel                                                                                                                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Wbudowany autotest QA; zapisuje raport Markdown.                                                                                                                      |
| `qa suite`                                          | Uruchom scenariusze z repozytorium względem ścieżki QA gateway. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej VM Linux.                       |
| `qa coverage`                                       | Wypisz inwentarz pokrycia scenariuszy w formacie markdown (`--json` dla danych maszynowych).                                                                          |
| `qa parity-report`                                  | Porównaj dwa pliki `qa-suite-summary.json` i zapisz agentowy raport parytetu.                                                                                         |
| `qa character-eval`                                 | Uruchom scenariusz QA postaci na wielu modelach live z ocenionym raportem. Zobacz [Raportowanie](#reporting).                                                        |
| `qa manual`                                         | Uruchom jednorazowy prompt względem wybranej ścieżki dostawcy/modelu.                                                                                                |
| `qa ui`                                             | Uruchom interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                     |
| `qa docker-build-image`                             | Zbuduj wstępnie przygotowany obraz QA Docker.                                                                                                                         |
| `qa docker-scaffold`                                | Zapisz szkielet docker-compose dla pulpitu QA + ścieżki Gateway.                                                                                                      |
| `qa up`                                             | Zbuduj witrynę QA, uruchom stos wspierany przez Docker, wypisz URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Uruchom tylko serwer dostawcy AIMock.                                                                                                                                |
| `qa mock-openai`                                    | Uruchom tylko świadomy scenariuszy serwer dostawcy `mock-openai`.                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządzaj współdzieloną pulą poświadczeń Convex.                                                                                                                      |
| `qa matrix`                                         | Ścieżka transportu live względem jednorazowego homeservera Tuwunel. Zobacz [Matrix QA](/pl/concepts/qa-matrix).                                                         |
| `qa telegram`                                       | Ścieżka transportu live względem prawdziwej prywatnej grupy Telegram.                                                                                                 |
| `qa discord`                                        | Ścieżka transportu live względem prawdziwego prywatnego kanału guild Discord.                                                                                         |
| `qa mantis`                                         | Runner weryfikacji przed i po dla błędów transportu live, z pierwszym scenariuszem reakcji statusu Discord. Zobacz [Mantis](/pl/concepts/mantis).                        |

## Przepływ operatora

Obecny przepływ operatora QA to dwupanelowa witryna QA:

- Lewy: pulpit Gateway (Control UI) z agentem.
- Prawy: QA Lab, pokazujący transkrypcję w stylu Slack i plan scenariusza.

Uruchom go za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia ścieżkę gateway wspieraną przez Docker i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może dać agentowi misję QA,
obserwować rzeczywiste zachowanie kanału oraz zapisywać, co zadziałało, co zawiodło albo
co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez każdorazowej przebudowy obrazu Docker,
uruchom stos z podmontowanym pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i podmontowuje
`extensions/qa-lab/web/dist` w kontenerze `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet przy zmianach, a przeglądarka automatycznie przeładowuje się, gdy zmienia się hash zasobu QA Lab.

Aby wykonać lokalny smoke trace OpenTelemetry, uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik trace OTLP/HTTP, uruchamia
scenariusz QA `otel-trace-smoke` z włączonym pluginem `diagnostics-otel`, a następnie
dekoduje wyeksportowane spany protobuf i potwierdza krytyczny dla wydania kształt:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` i `openclaw.message.delivery` muszą być obecne;
wywołania modelu nie mogą eksportować `StreamAbandoned` w udanych turach; surowe identyfikatory diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza trace. Zapisuje
`otel-smoke-summary.json` obok artefaktów pakietu QA.

QA obserwowalności pozostaje dostępne tylko z checkoutu źródeł. Archiwum npm celowo pomija
QA Lab, więc ścieżki wydania pakietu Docker nie uruchamiają poleceń `qa`. Użyj
`pnpm qa:otel:smoke` ze zbudowanego checkoutu źródeł podczas zmieniania instrumentacji diagnostycznej.

Dla ścieżki smoke Matrix z prawdziwym transportem uruchom:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Pełna referencja CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ artefaktów dla tej ścieżki znajdują się w [Matrix QA](/pl/concepts/qa-matrix). W skrócie: aprowizuje jednorazowy homeserver Tuwunel w Docker, rejestruje tymczasowych użytkowników driver/SUT/observer, uruchamia prawdziwy plugin Matrix wewnątrz podrzędnego QA gateway ograniczonego do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt obserwowanych zdarzeń i połączony dziennik wyjścia pod `.artifacts/qa-e2e/matrix-<timestamp>/`.

Dla ścieżek smoke Telegram i Discord z prawdziwym transportem:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Obie celują w istniejący prawdziwy kanał z dwoma botami (driver + SUT). Wymagane zmienne środowiskowe, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane w [referencji QA Telegram i Discord](#telegram-and-discord-qa-reference) poniżej.

Przed użyciem współdzielonych poświadczeń live uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza środowisko brokera Convex, waliduje ustawienia endpointów i weryfikuje osiągalność admin/list, gdy sekret maintainer jest obecny. Raportuje tylko stan ustawione/brakujące dla sekretów.

## Pokrycie transportu live

Ścieżki transportu live współdzielą jeden kontrakt zamiast wymyślać własny kształt listy scenariuszy. `qa-channel` jest szerokim syntetycznym pakietem zachowania produktu i nie jest częścią macierzy pokrycia transportu live.

| Ścieżka  | Canary | Bramkowanie wzmianki | Bot-do-bota | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Natywna rejestracja poleceń |
| -------- | ------ | -------------------- | ----------- | ----------------- | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | ---------------- | ---------------------------- |
| Matrix   | x      | x                    | x           | x                 | x                             | x                       | x                 | x              | x                  |                  |                              |
| Telegram | x      | x                    | x           |                   |                               |                         |                   |                |                    | x                |                              |
| Discord  | x      | x                    | x           |                   |                               |                         |                   |                |                    |                  | x                            |

To utrzymuje `qa-channel` jako szeroki pakiet zachowania produktu, podczas gdy Matrix,
Telegram i przyszłe transporty live współdzielą jedną jawną listę kontrolną kontraktu transportu.

Dla jednorazowej ścieżki VM Linux bez włączania Docker w ścieżkę QA uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje zwykły raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia pakietu na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami gateway. `qa-channel` domyślnie używa współbieżności
4, ograniczonej liczbą wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostosować
liczbę workerów, albo `--concurrency 1` dla wykonania szeregowego.
Polecenie kończy się kodem różnym od zera, gdy jakikolwiek scenariusz zawiedzie. Użyj `--allow-failures`, gdy
chcesz artefakty bez kodu wyjścia oznaczającego błąd.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze dostawcy oparte na env, ścieżkę konfiguracji dostawcy QA live oraz
`CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez podmontowany workspace.

## Referencja QA Telegram i Discord

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) ze względu na liczbę scenariuszy i aprowizowanie homeservera wspierane przez Docker. Telegram i Discord są mniejsze — po kilka scenariuszy, bez systemu profili, względem istniejących prawdziwych kanałów — więc ich referencja znajduje się tutaj.

### Współdzielone flagi CLI

Obie ścieżki rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                 | Domyślnie                                                | Opis                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Uruchom tylko ten scenariusz. Można powtarzać.                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Miejsce zapisu raportów/podsumowania/zaobserwowanych wiadomości oraz dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Katalog główny repozytorium przy uruchamianiu z neutralnego cwd.                                                      |
| `--sut-account <id>`                  | `sut`                                                     | Tymczasowy identyfikator konta w konfiguracji Gateway QA.                                                             |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` lub `live-frontier` (starsze `live-openai` nadal działa).                                               |
| `--model <ref>` / `--alt-model <ref>` | domyślne ustawienie dostawcy                              | Referencje modelu głównego/zapasowego.                                                                                |
| `--fast`                              | wyłączone                                                 | Szybki tryb dostawcy, jeśli jest obsługiwany.                                                                         |
| `--credential-source <env\|convex>`   | `env`                                                     | Zobacz [pulę poświadczeń Convex](#convex-credential-pool).                                                            |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w innym przypadku `maintainer`                 | Rola używana, gdy `--credential-source convex`.                                                                       |

Oba polecenia kończą się kodem niezerowym przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania kodu zakończenia oznaczającego błąd.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Celuje w jedną rzeczywistą prywatną grupę Telegram z dwoma odrębnymi botami (sterownik + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-do-bota działa najlepiej, gdy oba boty mają włączony **Bot-to-Bot Communication Mode** w `@BotFather`.

Wymagane zmienne środowiskowe, gdy `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numeryczny identyfikator czatu (ciąg znaków).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcjonalnie:

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

Artefakty wyjściowe:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — zawiera RTT dla każdej odpowiedzi (wysłanie przez sterownik → zaobserwowana odpowiedź SUT), zaczynając od kanarka.
- `telegram-qa-observed-messages.json` — treści są zredagowane, chyba że ustawiono `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Celuje w jeden rzeczywisty prywatny kanał gildii Discord z dwoma botami: botem sterującym kontrolowanym przez uprząż oraz botem SUT uruchamianym przez podrzędny Gateway OpenClaw za pośrednictwem dołączonego Plugin Discord. Weryfikuje obsługę wzmianek kanału, to, że bot SUT zarejestrował natywne polecenie `/help` w Discord, oraz scenariusze dowodowe Mantis wymagające zgody.

Wymagane zmienne środowiskowe, gdy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — musi odpowiadać identyfikatorowi użytkownika bota SUT zwróconemu przez Discord (w przeciwnym razie ścieżka szybko zakończy się błędem).

Opcjonalnie:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opcjonalny scenariusz Mantis. Uruchamia się samodzielnie, ponieważ przełącza SUT na stale włączone odpowiedzi gildii wyłącznie narzędziowe z `messages.statusReactions.enabled=true`, a następnie przechwytuje oś czasu reakcji REST oraz artefakt wizualny HTML/PNG.

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
- `discord-qa-observed-messages.json` — treści są zredagowane, chyba że ustawiono `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` oraz `discord-status-reactions-tool-only-timeline.png`, gdy uruchamiany jest scenariusz reakcji statusu.

### Pula poświadczeń Convex

Ścieżki Telegram i Discord mogą dzierżawić poświadczenia ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne środowiskowe. Przekaż `--credential-source convex` (lub ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab pozyskuje wyłączną dzierżawę, utrzymuje jej Heartbeat przez czas trwania uruchomienia i zwalnia ją przy zamknięciu. Rodzaje puli to `"telegram"` i `"discord"`.

Kształty ładunku walidowane przez brokera w `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` musi być ciągiem numerycznego identyfikatora czatu.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operacyjne zmienne środowiskowe i kontrakt punktu końcowego brokera Convex znajdują się w [Testowanie → Współdzielone poświadczenia Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji poprzedza obsługę Discord; semantyka brokera jest identyczna dla obu rodzajów).

## Seedy wspierane przez repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Celowo znajdują się one w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla agenta.

`qa-lab` powinien pozostać generycznym runnerem Markdown. Każdy plik Markdown scenariusza jest źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, możliwości, ścieżki i ryzyka
- referencje do dokumentacji i kodu
- opcjonalne wymagania Plugin
- opcjonalną poprawkę konfiguracji Gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia uruchomieniowa wspierająca `qa-flow` może pozostać generyczna i przekrojowa. Na przykład scenariusze Markdown mogą łączyć pomocniki po stronie transportu z pomocnikami po stronie przeglądarki, które sterują osadzonym Control UI przez seam Gateway `browser.request` bez dodawania runnera dla przypadku specjalnego.

Pliki scenariuszy powinny być grupowane według możliwości produktu, a nie folderu drzewa źródłowego. Zachowuj stabilne identyfikatory scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs` do śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania zwrotne Cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie subagentowi
- czytanie repozytorium i dokumentacji
- jedno małe zadanie budowania, takie jak Lobster Invaders

## Ścieżki mocków dostawcy

`qa suite` ma dwie lokalne ścieżki mocków dostawcy:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną deterministyczną ścieżką mocków dla QA wspieranego przez repozytorium i bramek parytetu.
- `aimock` uruchamia serwer dostawcy oparty na AIMock dla eksperymentalnego protokołu, fixture, nagrywania/odtwarzania i pokrycia chaosu. Jest addytywny i nie zastępuje dyspozytora scenariuszy `mock-openai`.

Implementacja ścieżki dostawcy znajduje się pod `extensions/qa-lab/src/providers/`. Każdy dostawca posiada swoje wartości domyślne, uruchamianie lokalnego serwera, konfigurację modelu Gateway, potrzeby stagingu profilu uwierzytelniania oraz flagi możliwości live/mock. Wspólny kod pakietu i Gateway powinien przechodzić przez rejestr dostawców zamiast rozgałęziać się po nazwach dostawców.

## Adaptery transportu

`qa-lab` posiada generyczny seam transportu dla scenariuszy QA Markdown. `qa-channel` jest pierwszym adapterem na tym seamie, ale cel projektowy jest szerszy: przyszłe rzeczywiste lub syntetyczne kanały powinny podłączać się do tego samego runnera pakietu zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział wygląda tak:

- `qa-lab` posiada generyczne wykonywanie scenariuszy, współbieżność workerów, zapis artefaktów i raportowanie.
- Adapter transportu posiada konfigurację Gateway, gotowość, obserwację wejściową i wyjściową, akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy Markdown pod `qa/scenarios/` definiują uruchomienie testu; `qa-lab` zapewnia wielokrotnego użytku powierzchnię uruchomieniową, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA Markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który ćwiczy kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy współdzielony host `qa-lab` może posiadać przepływ.

`qa-lab` posiada wspólną mechanikę hosta:

- korzeń polecenia `openclaw qa`
- uruchamianie i zamykanie pakietu
- współbieżność workerów
- zapis artefaktów
- generowanie raportu
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnera posiadają kontrakt transportu:

- jak `openclaw qa <runner>` jest montowane pod współdzielonym korzeniem `qa`
- jak Gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypcje i znormalizowany stan transportu
- jak wykonywane są akcje wspierane przez transport
- jak obsługiwany jest reset lub czyszczenie specyficzne dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym seamie hosta `qa-lab`.
3. Zachowaj mechanikę specyficzną dla transportu wewnątrz Plugin runnera lub uprzęży kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie główne. Pluginy runnera powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` lekkim; leniwe CLI i wykonywanie runnera powinny pozostać za oddzielnymi punktami wejścia.
5. Utwórz lub dostosuj scenariusze Markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj generycznych pomocników scenariuszy dla nowych scenariuszy.
7. Zachowaj działanie istniejących aliasów zgodności, chyba że repozytorium przeprowadza celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, zachowaj je w tym Plugin runnera lub uprzęży Plugin.
- Jeśli scenariusz potrzebuje nowej możliwości, której może użyć więcej niż jeden kanał, dodaj generycznego pomocnika zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla transportu i wyraźnie zaznacz to w kontrakcie scenariusza.

### Nazwy pomocników scenariuszy

Preferowane generyczne pomocniki dla nowych scenariuszy:

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ale przy tworzeniu nowych scenariuszy należy używać nazw ogólnych. Aliasy istnieją po to, aby uniknąć migracji w jednym przełomowym momencie, a nie jako model na przyszłość.

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z zaobserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać spis dostępnych scenariuszy — przydatny przy szacowaniu dalszych prac lub podłączaniu nowego transportu — uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać dane wyjściowe czytelne maszynowo).

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

Polecenie uruchamia lokalne procesy podrzędne QA Gateway, a nie Docker. Scenariusze
oceny charakteru powinny ustawiać personę przez `SOUL.md`, a następnie wykonywać
zwykłe tury użytkownika, takie jak czat, pomoc w obszarze roboczym i małe zadania
na plikach. Model kandydujący nie powinien być informowany, że jest oceniany.
Polecenie zachowuje każdą pełną transkrypcję, rejestruje podstawowe statystyki
uruchomienia, a następnie prosi modele oceniające w trybie fast z wnioskowaniem
`xhigh`, tam gdzie jest obsługiwane, o uszeregowanie uruchomień według naturalności,
klimatu i humoru. Użyj `--blind-judge-models` podczas porównywania dostawców:
prompt oceniający nadal otrzymuje każdą transkrypcję i status uruchomienia, ale
referencje kandydatów są zastępowane neutralnymi etykietami, takimi jak
`candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po
parsowaniu.
Uruchomienia kandydatów domyślnie używają poziomu `high` dla thinking, z `medium`
dla GPT-5.5 i `xhigh` dla starszych referencji ewaluacyjnych OpenAI, które go
obsługują. Nadpisz konkretnego kandydata w linii polecenia za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalną wartość zapasową, a starsza forma `--model-thinking <provider/model=level>`
jest zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu fast, aby tam, gdzie dostawca
go obsługuje, używane było przetwarzanie priorytetowe. Dodaj `,fast`, `,no-fast`
lub `,fast=false` w linii polecenia, gdy pojedynczy kandydat lub oceniający wymaga
nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz wymusić tryb fast dla każdego
modelu kandydującego. Czasy trwania kandydatów i oceniających są rejestrowane w
raporcie na potrzeby analizy porównawczej, ale prompty oceniające wyraźnie mówią,
aby nie klasyfikować według szybkości.
Uruchomienia modeli kandydujących i oceniających domyślnie używają współbieżności
16. Obniż `--concurrency` lub `--judge-concurrency`, gdy limity dostawcy lub
obciążenie lokalnego Gateway powodują zbyt duży szum w uruchomieniu.
Gdy nie przekazano kandydującego `--model`, ocena charakteru domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie przekazano `--model`.
Gdy nie przekazano `--judge-model`, oceniający domyślnie używają
`openai/gpt-5.5,thinking=xhigh,fast` i
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Matrix QA](/pl/concepts/qa-matrix)
- [QA Channel](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Panel](/pl/web/dashboard)
