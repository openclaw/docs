---
read_when:
    - Zrozumienie, jak elementy stosu zapewniania jakości współdziałają
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportowego
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Tworzenie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: 'Omówienie stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu na żywo, adaptery transportu i raportowanie.'
title: Przegląd QA
x-i18n:
    generated_at: "2026-05-02T20:43:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma ćwiczyć OpenClaw w bardziej realistyczny sposób,
ukształtowany jak kanał, niż może to zrobić pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe pluginy uruchamiające: adaptery transportu na żywo, które
  sterują prawdziwym kanałem wewnątrz podrzędnego QA gateway.
- `qa/`: zasoby startowe wspierane przez repozytorium dla zadania początkowego i bazowych
  scenariuszy QA.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele z nich ma aliasy skryptów `pnpm qa:*`;
obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | Dołączona samokontrola QA; zapisuje raport Markdown.                                                                                                                     |
| `qa suite`                                          | Uruchom scenariusze wspierane przez repozytorium względem ścieżki QA gateway. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej maszyny wirtualnej Linux. |
| `qa coverage`                                       | Wypisz inwentarz pokrycia scenariuszy w markdown (`--json` dla wyjścia maszynowego).                                                                                      |
| `qa parity-report`                                  | Porównaj dwa pliki `qa-suite-summary.json` i zapisz agentowy raport parytetu.                                                                                            |
| `qa character-eval`                                 | Uruchom scenariusz QA postaci na wielu modelach na żywo z ocenionym raportem. Zobacz [Raportowanie](#reporting).                                                        |
| `qa manual`                                         | Uruchom jednorazowy prompt względem wybranej ścieżki dostawcy/modelu.                                                                                                    |
| `qa ui`                                             | Uruchom interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                        |
| `qa docker-build-image`                             | Zbuduj wstępnie przygotowany obraz Docker QA.                                                                                                                            |
| `qa docker-scaffold`                                | Zapisz szkielet docker-compose dla panelu QA i ścieżki gateway.                                                                                                          |
| `qa up`                                             | Zbuduj witrynę QA, uruchom stos wspierany przez Docker i wypisz URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Uruchom tylko serwer dostawcy AIMock.                                                                                                                                    |
| `qa mock-openai`                                    | Uruchom tylko świadomy scenariuszy serwer dostawcy `mock-openai`.                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządzaj wspólną pulą poświadczeń Convex.                                                                                                                               |
| `qa matrix`                                         | Ścieżka transportu na żywo względem jednorazowego homeservera Tuwunel. Zobacz [QA Matrix](/pl/concepts/qa-matrix).                                                        |
| `qa telegram`                                       | Ścieżka transportu na żywo względem prawdziwej prywatnej grupy Telegram.                                                                                                 |
| `qa discord`                                        | Ścieżka transportu na żywo względem prawdziwego prywatnego kanału gildii Discord.                                                                                        |

## Przepływ operatora

Obecny przepływ operatora QA to dwupanelowa witryna QA:

- Po lewej: panel Gateway (Control UI) z agentem.
- Po prawej: QA Lab, pokazujący transkrypt podobny do Slacka i plan scenariusza.

Uruchom go za pomocą:

```bash
pnpm qa:lab:up
```

Buduje to witrynę QA, uruchamia ścieżkę gateway wspieraną przez Docker i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może przekazać agentowi
misję QA, obserwować prawdziwe zachowanie kanału oraz zapisać, co zadziałało, nie powiodło się lub
pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez każdorazowego przebudowywania obrazu Docker,
uruchom stos z podmontowanym pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i podmontowuje
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet po zmianie, a przeglądarka automatycznie przeładowuje się, gdy zmienia się hash
zasobu QA Lab.

Aby wykonać lokalny smoke test śladu OpenTelemetry, uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik śladów OTLP/HTTP, uruchamia scenariusz QA
`otel-trace-smoke` z włączonym pluginem `diagnostics-otel`, następnie
dekoduje wyeksportowane zakresy protobuf i potwierdza krytyczny dla wydania kształt:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` i `openclaw.message.delivery` muszą być obecne;
wywołania modelu nie mogą eksportować `StreamAbandoned` w udanych turach; surowe identyfikatory diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza śladem. Zapisuje
`otel-smoke-summary.json` obok artefaktów zestawu QA.

QA obserwowalności pozostaje dostępne tylko z checkoutu źródeł. Paczka npm celowo pomija
QA Lab, więc ścieżki wydania pakietu Docker nie uruchamiają poleceń `qa`. Użyj
`pnpm qa:otel:smoke` ze zbudowanego checkoutu źródeł podczas zmieniania instrumentacji
diagnostycznej.

Aby uruchomić ścieżkę smoke Matrix z prawdziwym transportem, uruchom:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Pełna dokumentacja referencyjna CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów dla tej ścieżki znajdują się w [QA Matrix](/pl/concepts/qa-matrix). W skrócie: provisionuje jednorazowy homeserver Tuwunel w Docker, rejestruje tymczasowych użytkowników driver/SUT/observer, uruchamia prawdziwy plugin Matrix wewnątrz podrzędnego QA gateway ograniczonego do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt obserwowanych zdarzeń i połączony dziennik wyjścia w `.artifacts/qa-e2e/matrix-<timestamp>/`.

Dla ścieżek smoke Telegram i Discord z prawdziwym transportem:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Obie celują w istniejący prawdziwy kanał z dwoma botami (driver + SUT). Wymagane zmienne env, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane w sekcji [Dokumentacja referencyjna QA dla Telegram i Discord](#telegram-and-discord-qa-reference) poniżej.

Przed użyciem poświadczeń na żywo z puli uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza env brokera Convex, waliduje ustawienia endpointu i weryfikuje osiągalność admin/list, gdy obecny jest sekret maintainera. Raportuje tylko status ustawione/brakujące dla sekretów.

## Pokrycie transportu na żywo

Ścieżki transportu na żywo współdzielą jedną umowę zamiast każda wymyślać własny kształt listy scenariuszy. `qa-channel` jest szerokim syntetycznym zestawem zachowań produktu i nie jest częścią macierzy pokrycia transportu na żywo.

| Ścieżka  | Canary | Bramkowanie wzmianki | Bot-do-bota | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Rejestracja poleceń natywnych |
| -------- | ------ | -------------------- | ----------- | ----------------- | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | ---------------- | ----------------------------- |
| Matrix   | x      | x                    | x           | x                 | x                             | x                       | x                 | x              | x                  |                  |                               |
| Telegram | x      | x                    | x           |                   |                               |                         |                   |                |                    | x                |                               |
| Discord  | x      | x                    | x           |                   |                               |                         |                   |                |                    |                  | x                             |

Dzięki temu `qa-channel` pozostaje szerokim zestawem zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe transporty na żywo współdzielą jedną jawną checklistę umowy
transportowej.

Aby uruchomić ścieżkę jednorazowej maszyny wirtualnej Linux bez wprowadzania Docker do ścieżki QA, uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Uruchamia to świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje normalny raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Ponownie używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia zestawu na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami gateway. `qa-channel` domyślnie używa współbieżności
4, ograniczonej liczbą wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, lub `--concurrency 1` dla wykonania szeregowego.
Polecenie kończy się kodem niezerowym, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez nieudanego kodu wyjścia.
Uruchomienia na żywo przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze dostawcy oparte na env, ścieżkę konfiguracji dostawcy QA live oraz
`CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod korzeniem repozytorium, aby gość
mógł zapisywać z powrotem przez podmontowany workspace.

## Dokumentacja referencyjna QA dla Telegram i Discord

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) ze względu na liczbę scenariuszy i provisionowanie homeservera wspierane przez Docker. Telegram i Discord są mniejsze — po kilka scenariuszy każdy, bez systemu profili, względem istniejących prawdziwych kanałów — więc ich dokumentacja referencyjna znajduje się tutaj.

### Wspólne flagi CLI

Obie ścieżki rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                 | Domyślna                                                 | Opis                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Uruchom tylko ten scenariusz. Można powtarzać.                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Miejsce zapisu raportów/podsumowania/zaobserwowanych wiadomości oraz dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Katalog główny repozytorium przy uruchamianiu z neutralnego cwd.                                                      |
| `--sut-account <id>`                  | `sut`                                                     | Identyfikator konta tymczasowego w konfiguracji QA gateway.                                                           |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` albo `live-frontier` (starsze `live-openai` nadal działa).                                              |
| `--model <ref>` / `--alt-model <ref>` | domyślne ustawienie providera                             | Referencje modelu podstawowego/alternatywnego.                                                                        |
| `--fast`                              | wyłączone                                                 | Szybki tryb providera, jeśli jest obsługiwany.                                                                        |
| `--credential-source <env\|convex>`   | `env`                                                     | Zobacz [pulę poświadczeń Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`                | Rola używana, gdy `--credential-source convex`.                                                                       |

Oba kończą się kodem różnym od zera przy każdym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania kodu wyjścia oznaczającego błąd.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną prawdziwą prywatną grupę Telegram z dwoma różnymi botami (driver + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-bot działa najlepiej, gdy oba boty mają włączony **Bot-to-Bot Communication Mode** w `@BotFather`.

Wymagane zmienne środowiskowe, gdy `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numeryczny identyfikator czatu (ciąg znaków).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcjonalne:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości (domyślnie są redagowane).

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
- `telegram-qa-summary.json` — zawiera RTT dla każdej odpowiedzi (wysłanie przez driver → zaobserwowana odpowiedź SUT), zaczynając od canary.
- `telegram-qa-observed-messages.json` — treści są redagowane, chyba że ustawiono `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Celuje w jeden prawdziwy prywatny kanał gildii Discord z dwoma botami: botem driver kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny OpenClaw gateway przez dołączony Discord plugin. Weryfikuje obsługę wzmianek kanału oraz to, że bot SUT zarejestrował natywną komendę `/help` w Discord.

Wymagane zmienne środowiskowe, gdy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — musi pasować do identyfikatora użytkownika bota SUT zwróconego przez Discord (w przeciwnym razie lane szybko kończy się błędem).

Opcjonalne:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Artefakty wyjściowe:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — treści są redagowane, chyba że ustawiono `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Pula poświadczeń Convex

Obie lanes, Telegram i Discord, mogą dzierżawić poświadczenia ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne środowiskowe. Przekaż `--credential-source convex` (albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab pozyskuje wyłączną dzierżawę, wysyła dla niej Heartbeat przez czas działania i zwalnia ją przy zamykaniu. Typy puli to `"telegram"` i `"discord"`.

Kształty payloadów, które broker waliduje przy `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` musi być numerycznym ciągiem chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operacyjne zmienne środowiskowe i kontrakt endpointu brokera Convex znajdują się w [Testowanie → Współdzielone poświadczenia Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji pochodzi sprzed obsługi Discord; semantyka brokera jest identyczna dla obu typów).

## Seedy oparte na repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Celowo znajdują się w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta.

`qa-lab` powinien pozostać ogólnym runnerem markdown. Każdy plik markdown scenariusza jest
źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- metadane scenariusza
- opcjonalną kategorię oraz metadane capability, lane i ryzyka
- referencje do dokumentacji i kodu
- opcjonalne wymagania pluginów
- opcjonalną poprawkę konfiguracji gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia runtime, która wspiera `qa-flow`, może pozostać ogólna
i przekrojowa. Na przykład scenariusze markdown mogą łączyć pomocniki po stronie transportu
z pomocnikami po stronie przeglądarki, które sterują osadzonym Control UI przez
seam Gateway `browser.request`, bez dodawania specjalnego runnera dla tego przypadku.

Pliki scenariuszy powinny być grupowane według capability produktu, a nie według folderu
drzewa źródeł. Zachowuj stabilne identyfikatory scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs`
do śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanału
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania zwrotne cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie subagentowi
- czytanie repozytorium i czytanie dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Mock lanes providera

`qa suite` ma dwie lokalne lanes mock providera:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną
  deterministyczną lane mock dla QA opartego na repozytorium i bramek parytetu.
- `aimock` uruchamia serwer providera oparty na AIMock na potrzeby eksperymentalnego protokołu,
  fixture, record/replay i pokrycia chaos. Jest dodatkiem i nie
  zastępuje dyspozytora scenariuszy `mock-openai`.

Implementacja lane providera znajduje się w `extensions/qa-lab/src/providers/`.
Każdy provider jest właścicielem swoich wartości domyślnych, uruchamiania lokalnego serwera, konfiguracji modelu gateway,
potrzeb etapowania auth-profile oraz flag capability live/mock. Wspólny kod suite i
gateway powinien kierować przez rejestr providerów zamiast rozgałęziać się po
nazwach providerów.

## Adaptery transportu

`qa-lab` jest właścicielem ogólnego seamu transportu dla scenariuszy QA markdown. `qa-channel` jest pierwszym adapterem na tym seamie, ale docelowy projekt jest szerszy: przyszłe prawdziwe lub syntetyczne kanały powinny podłączać się do tego samego runnera suite zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział wygląda tak:

- `qa-lab` jest właścicielem ogólnego wykonywania scenariuszy, współbieżności workerów, zapisu artefaktów i raportowania.
- Adapter transportu jest właścicielem konfiguracji gateway, gotowości, obserwacji inbound i outbound, akcji transportu oraz znormalizowanego stanu transportu.
- Pliki scenariuszy markdown w `qa/scenarios/` definiują uruchomienie testu; `qa-lab` zapewnia wielokrotnego użytku powierzchnię runtime, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który ćwiczy kontrakt kanału.

Nie dodawaj nowego najwyższego korzenia komend QA, gdy współdzielony host `qa-lab` może być właścicielem przepływu.

`qa-lab` jest właścicielem współdzielonej mechaniki hosta:

- korzenia komendy `openclaw qa`
- uruchamiania i zamykania suite
- współbieżności workerów
- zapisu artefaktów
- generowania raportu
- wykonywania scenariuszy
- aliasów zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnera są właścicielami kontraktu transportu:

- sposobu montowania `openclaw qa <runner>` pod współdzielonym korzeniem `qa`
- sposobu konfigurowania gateway dla tego transportu
- sposobu sprawdzania gotowości
- sposobu wstrzykiwania zdarzeń inbound
- sposobu obserwowania wiadomości outbound
- sposobu udostępniania transkrypcji i znormalizowanego stanu transportu
- sposobu wykonywania akcji opartych na transporcie
- sposobu obsługi resetu lub czyszczenia specyficznego dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Pozostaw `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym seamie hosta `qa-lab`.
3. Zachowaj mechanikę specyficzną dla transportu wewnątrz pluginu runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjną komendę korzenia. Pluginy runnera powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` lekki; leniwe CLI i wykonywanie runnera powinny pozostać za osobnymi entrypointami.
5. Utwórz lub dostosuj scenariusze markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj ogólnych pomocników scenariuszy dla nowych scenariuszy.
7. Zachowaj działanie istniejących aliasów zgodności, chyba że repozytorium wykonuje celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, zachowaj je w tym pluginie runnera lub harnessie pluginu.
- Jeśli scenariusz potrzebuje nowej capability, z której może skorzystać więcej niż jeden kanał, dodaj ogólny pomocnik zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, pozostaw scenariusz specyficzny dla transportu i wyraźnie zaznacz to w kontrakcie scenariusza.

### Nazwy pomocników scenariuszy

Preferowane ogólne pomocniki dla nowych scenariuszy:

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ale tworzenie nowych scenariuszy powinno używać ogólnych nazw. Aliasy istnieją po to, aby uniknąć migracji typu flag-day, a nie jako model na przyszłość.

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z zaobserwowanej osi czasu bus.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać inwentarz dostępnych scenariuszy — przydatny podczas szacowania dalszych prac lub podłączania nowego transportu — uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać dane wyjściowe możliwe do odczytu maszynowego).

W przypadku kontroli charakteru i stylu uruchom ten sam scenariusz na wielu referencjach modeli live
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

Polecenie uruchamia lokalne procesy potomne Gateway QA, a nie Docker. Scenariusze oceny charakteru
powinny ustawiać personę przez `SOUL.md`, a następnie uruchamiać zwykłe tury użytkownika,
takie jak czat, pomoc z obszarem roboczym i małe zadania na plikach. Model kandydujący
nie powinien być informowany, że jest oceniany. Polecenie zachowuje każdą pełną
transkrypcję, zapisuje podstawowe statystyki uruchomienia, a następnie prosi modele oceniające w trybie fast z
rozumowaniem `xhigh`, gdy jest obsługiwane, o uszeregowanie uruchomień według naturalności, klimatu i humoru.
Użyj `--blind-judge-models` podczas porównywania dostawców: prompt oceniający nadal otrzymuje
każdą transkrypcję i status uruchomienia, ale referencje kandydatów są zastępowane neutralnymi
etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po
parsowaniu.
Uruchomienia kandydatów domyślnie używają poziomu thinking `high`, z `medium` dla GPT-5.5 i `xhigh`
dla starszych referencji ewaluacyjnych OpenAI, które go obsługują. Nadpisz konkretnego kandydata w wierszu polecenia za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalną wartość fallback, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu fast, aby korzystać z przetwarzania priorytetowego tam,
gdzie dostawca je obsługuje. Dodaj `,fast`, `,no-fast` lub `,fast=false` w wierszu polecenia, gdy
pojedynczy kandydat lub oceniający wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb fast dla każdego modelu kandydującego. Czasy trwania kandydatów i oceniających są
zapisywane w raporcie na potrzeby analizy benchmarków, ale prompty oceniające wyraźnie wskazują,
aby nie klasyfikować według szybkości.
Uruchomienia modeli kandydujących i oceniających domyślnie używają współbieżności 16. Obniż
`--concurrency` lub `--judge-concurrency`, gdy limity dostawcy albo obciążenie lokalnego Gateway
sprawiają, że uruchomienie jest zbyt zaszumione.
Gdy nie przekazano żadnego `--model` kandydata, ocena charakteru domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie przekazano żadnego `--model`.
Gdy nie przekazano `--judge-model`, oceniający domyślnie używają
`openai/gpt-5.5,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Macierz QA](/pl/concepts/qa-matrix)
- [Kanał QA](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Panel](/pl/web/dashboard)
