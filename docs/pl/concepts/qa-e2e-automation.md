---
read_when:
    - Zrozumienie, jak stos QA składa się w całość
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportu
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Tworzenie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu na żywo, adaptery transportu i raportowanie.'
title: Przegląd QA
x-i18n:
    generated_at: "2026-04-30T09:49:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma testować OpenClaw w sposób bardziej realistyczny,
ukształtowany przez kanały, niż pozwala na to pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkrypcji,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe pluginy runnera: adaptery transportu live, które
  sterują rzeczywistym kanałem w podrzędnym Gateway QA.
- `qa/`: zasoby początkowe przechowywane w repozytorium dla zadania startowego i bazowych
  scenariuszy QA.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele z nich ma aliasy skryptów `pnpm qa:*`;
obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Wbudowany autotest QA; zapisuje raport Markdown.                                                                                                                       |
| `qa suite`                                          | Uruchamia scenariusze z repozytorium względem ścieżki Gateway QA. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej maszyny VM z Linuksem.         |
| `qa coverage`                                       | Wypisuje inwentarz pokrycia scenariuszy w Markdown (`--json` dla danych maszynowych).                                                                                  |
| `qa parity-report`                                  | Porównuje dwa pliki `qa-suite-summary.json` i zapisuje agentowy raport bramki parytetu.                                                                                |
| `qa character-eval`                                 | Uruchamia scenariusz QA postaci na wielu modelach live z ocenianym raportem. Zobacz [Raportowanie](#reporting).                                                        |
| `qa manual`                                         | Uruchamia jednorazowy prompt względem wybranej ścieżki dostawcy/modelu.                                                                                                |
| `qa ui`                                             | Uruchamia interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                    |
| `qa docker-build-image`                             | Buduje wstępnie przygotowany obraz Docker QA.                                                                                                                          |
| `qa docker-scaffold`                                | Zapisuje szkielet docker-compose dla panelu QA + ścieżki Gateway.                                                                                                      |
| `qa up`                                             | Buduje witrynę QA, uruchamia stos wspierany przez Docker, wypisuje URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Uruchamia tylko serwer dostawcy AIMock.                                                                                                                                |
| `qa mock-openai`                                    | Uruchamia tylko serwer dostawcy `mock-openai` świadomy scenariuszy.                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządza współdzieloną pulą poświadczeń Convex.                                                                                                                        |
| `qa matrix`                                         | Ścieżka transportu live względem jednorazowego homeservera Tuwunel. Zobacz [QA Matrix](/pl/concepts/qa-matrix).                                                           |
| `qa telegram`                                       | Ścieżka transportu live względem rzeczywistej prywatnej grupy Telegram.                                                                                                |
| `qa discord`                                        | Ścieżka transportu live względem rzeczywistego prywatnego kanału gildii Discord.                                                                                       |

## Przepływ operatora

Obecny przepływ operatora QA to dwupanelowa witryna QA:

- Lewo: panel Gateway (Control UI) z agentem.
- Prawo: QA Lab pokazujący transkrypcję podobną do Slacka i plan scenariusza.

Uruchom go poleceniem:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia ścieżkę Gateway wspieraną przez Docker i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może przekazać agentowi misję QA,
obserwować rzeczywiste zachowanie kanału i zapisać, co zadziałało, co się nie powiodło lub
co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Docker za każdym razem,
uruchom stos z podmontowanym pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i montuje przez bind mount
`extensions/qa-lab/web/dist` w kontenerze `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet po zmianie, a przeglądarka automatycznie przeładowuje się, gdy zmieni się hash zasobów QA Lab.

Aby wykonać lokalny smoke trace OpenTelemetry, uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik śladów OTLP/HTTP, wykonuje scenariusz QA
`otel-trace-smoke` z włączonym Plugin `diagnostics-otel`, następnie dekoduje
wyeksportowane spany protobuf i sprawdza kształt krytyczny dla wydania:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` i `openclaw.message.delivery` muszą być obecne;
wywołania modelu nie mogą eksportować `StreamAbandoned` przy udanych turach; surowe identyfikatory diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza śladem. Zapisuje
`otel-smoke-summary.json` obok artefaktów pakietu QA.

QA obserwowalności pozostaje dostępne tylko z checkoutu źródeł. Paczka npm celowo pomija
QA Lab, więc ścieżki wydania Docker dla pakietu nie uruchamiają poleceń `qa`. Używaj
`pnpm qa:otel:smoke` ze zbudowanego checkoutu źródeł przy zmianie instrumentacji diagnostycznej.

Aby wykonać ścieżkę smoke transport-real Matrix, uruchom:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Pełna referencja CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów dla tej ścieżki znajdują się w [QA Matrix](/pl/concepts/qa-matrix). W skrócie: tworzy jednorazowy homeserver Tuwunel w Dockerze, rejestruje tymczasowych użytkowników driver/SUT/observer, uruchamia rzeczywisty plugin Matrix wewnątrz podrzędnego Gateway QA ograniczonego do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt observed-events i połączony log wyjściowy w `.artifacts/qa-e2e/matrix-<timestamp>/`.

Dla ścieżek smoke transport-real Telegram i Discord:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Obie celują w istniejący wcześniej rzeczywisty kanał z dwoma botami (driver + SUT). Wymagane zmienne env, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane poniżej w [Referencji QA Telegram i Discord](#telegram-and-discord-qa-reference).

Przed użyciem pooled live credentials uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza env brokera Convex, weryfikuje ustawienia endpointów i sprawdza osiągalność admin/list, gdy obecny jest sekret maintainera. Raportuje tylko stan ustawione/brakujące dla sekretów.

## Pokrycie transportu live

Ścieżki transportu live współdzielą jeden kontrakt zamiast wymyślać osobny kształt listy scenariuszy. `qa-channel` jest szerokim syntetycznym pakietem zachowań produktu i nie jest częścią macierzy pokrycia transportu live.

| Ścieżka  | Canary | Bramkowanie wzmianką | Bot-do-bota | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Natywna rejestracja poleceń |
| -------- | ------ | -------------------- | ----------- | ----------------- | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | ---------------- | ---------------------------- |
| Matrix   | x      | x                    | x           | x                 | x                             | x                       | x                 | x              | x                  |                  |                              |
| Telegram | x      | x                    | x           |                   |                               |                         |                   |                |                    | x                |                              |
| Discord  | x      | x                    | x           |                   |                               |                         |                   |                |                    |                  | x                            |

To zachowuje `qa-channel` jako szeroki pakiet zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe transporty live współdzielą jedną jawną checklistę kontraktu transportu.

Aby uruchomić jednorazową ścieżkę VM z Linuksem bez wprowadzania Dockera do ścieżki QA, uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje normalny raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia pakietu na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami Gateway. `qa-channel` domyślnie używa współbieżności
4, ograniczonej przez liczbę wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, lub `--concurrency 1` do wykonania szeregowego.
Polecenie kończy się kodem niezerowym, gdy dowolny scenariusz zawiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez kodu wyjścia oznaczającego błąd.
Uruchomienia live przekazują obsługiwane wejścia auth QA, które są praktyczne dla
gościa: klucze dostawców z env, ścieżkę konfiguracji dostawcy QA live i
`CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowany workspace.

## Referencja QA Telegram i Discord

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) z powodu liczby scenariuszy i provisioningu homeservera wspieranego przez Docker. Telegram i Discord są mniejsze — po kilka scenariuszy, bez systemu profili, względem istniejących wcześniej rzeczywistych kanałów — więc ich referencja znajduje się tutaj.

### Wspólne flagi CLI

Obie ścieżki rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                 | Domyślne                                                 | Opis                                                                                                                         |
| ------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Uruchom tylko ten scenariusz. Można powtarzać.                                                                               |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Miejsce zapisu raportów/podsumowania/zaobserwowanych wiadomości i dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Katalog główny repozytorium przy wywołaniu z neutralnego cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                     | Tymczasowy identyfikator konta w konfiguracji QA gateway.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` lub `live-frontier` (starsze `live-openai` nadal działa).                                                      |
| `--model <ref>` / `--alt-model <ref>` | domyślne providera                                        | Referencje modelu podstawowego/alternatywnego.                                                                               |
| `--fast`                              | wyłączone                                                 | Tryb szybki providera tam, gdzie jest obsługiwany.                                                                           |
| `--credential-source <env\|convex>`   | `env`                                                     | Zobacz [pulę poświadczeń Convex](#convex-credential-pool).                                                                   |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`                | Rola używana, gdy ustawiono `--credential-source convex`.                                                                    |

Oba kończą się kodem niezerowym przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania kodu wyjścia oznaczającego błąd.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną rzeczywistą prywatną grupę Telegram z dwoma różnymi botami (driver + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-do-bota działa najlepiej, gdy oba boty mają włączony tryb **Bot-to-Bot Communication Mode** w `@BotFather`.

Wymagane zmienne env przy `--credential-source env`:

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
- `telegram-qa-summary.json` — zawiera RTT dla każdej odpowiedzi (wysłanie przez drivera → zaobserwowana odpowiedź SUT), zaczynając od canary.
- `telegram-qa-observed-messages.json` — treści są redagowane, chyba że ustawiono `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Celuje w jeden rzeczywisty prywatny kanał gildii Discord z dwoma botami: botem drivera kontrolowanym przez harness i botem SUT uruchamianym przez podrzędny gateway OpenClaw przez dołączony Plugin Discord. Weryfikuje obsługę wzmianek w kanale oraz to, że bot SUT zarejestrował natywne polecenie `/help` w Discord.

Wymagane zmienne env przy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — musi odpowiadać identyfikatorowi użytkownika bota SUT zwracanemu przez Discord (w przeciwnym razie lane szybko zakończy się błędem).

Opcjonalnie:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treść wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Artefakty wyjściowe:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — treści są redagowane, chyba że ustawiono `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Pula poświadczeń Convex

Zarówno lane Telegram, jak i Discord mogą dzierżawić poświadczenia ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne env. Przekaż `--credential-source convex` (lub ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab pozyskuje wyłączną dzierżawę, wysyła Heartbeat przez czas trwania uruchomienia i zwalnia ją przy zamknięciu. Rodzaje puli to `"telegram"` i `"discord"`.

Kształty payloadów walidowane przez brokera w `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` musi być numerycznym ciągiem chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Operacyjne zmienne env i kontrakt endpointu brokera Convex znajdują się w [Testowanie → współdzielone poświadczenia Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji pochodzi sprzed obsługi Discord; semantyka brokera jest identyczna dla obu rodzajów).

## Seedy oparte na repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Celowo są przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta.

`qa-lab` powinien pozostać ogólnym runnerem markdown. Każdy plik scenariusza markdown jest
źródłem prawdy dla jednego uruchomienia testowego i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, capability, lane i ryzyka
- odwołania do dokumentacji i kodu
- opcjonalne wymagania Plugin
- opcjonalną łatę konfiguracji gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia runtime wspierająca `qa-flow` może pozostać ogólna
i przekrojowa. Na przykład scenariusze markdown mogą łączyć helpery po stronie transportu
z helperami po stronie przeglądarki, które sterują osadzonym Control UI przez seam
Gateway `browser.request` bez dodawania runnera dla szczególnego przypadku.

Pliki scenariuszy powinny być grupowane według capability produktu, a nie według
folderu drzewa źródłowego. Zachowuj stabilne identyfikatory scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs`
dla śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- wiadomości prywatne i czat w kanale
- zachowanie wątków
- cykl życia akcji wiadomości
- callbacki Cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- czytanie repozytorium i dokumentacji
- małe zadanie build, takie jak Lobster Invaders

## Lane mock providera

`qa suite` ma dwa lokalne lane mock providera:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślnym
  deterministycznym lane mock dla QA opartego na repozytorium i bramek parity.
- `aimock` uruchamia serwer providera oparty na AIMock dla eksperymentalnego protokołu,
  fixture, record/replay i pokrycia chaos. Jest dodatkiem i nie zastępuje
  dyspozytora scenariuszy `mock-openai`.

Implementacja lane providera znajduje się w `extensions/qa-lab/src/providers/`.
Każdy provider posiada własne wartości domyślne, uruchamianie lokalnego serwera, konfigurację modeli gateway,
potrzeby stagingu profilu auth oraz flagi capability live/mock. Wspólny kod suite i
gateway powinien przechodzić przez rejestr providerów zamiast rozgałęziać się po
nazwach providerów.

## Adaptery transportu

`qa-lab` posiada ogólny seam transportu dla scenariuszy QA markdown. `qa-channel` jest pierwszym adapterem na tym seam, ale cel projektu jest szerszy: przyszłe rzeczywiste lub syntetyczne kanały powinny wpinać się w ten sam runner suite zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział wygląda tak:

- `qa-lab` odpowiada za ogólne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- Adapter transportu odpowiada za konfigurację gateway, gotowość, obserwację wejścia i wyjścia, akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy markdown w `qa/scenarios/` definiują uruchomienie testowe; `qa-lab` dostarcza wielokrotnego użytku powierzchnię runtime, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który ćwiczy kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy współdzielony host `qa-lab` może posiadać flow.

`qa-lab` posiada współdzieloną mechanikę hosta:

- korzeń poleceń `openclaw qa`
- start i zamykanie suite
- współbieżność workerów
- zapisywanie artefaktów
- generowanie raportów
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów posiadają kontrakt transportu:

- jak `openclaw qa <runner>` jest montowane pod współdzielonym korzeniem `qa`
- jak gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypty i znormalizowany stan transportu
- jak wykonywane są akcje wspierane przez transport
- jak obsługiwany jest reset lub czyszczenie specyficzne dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym seam hosta `qa-lab`.
3. Trzymaj mechanikę specyficzną dla transportu wewnątrz Plugin runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie korzenia. Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` lekkim; leniwe CLI i wykonywanie runnera powinny pozostać za osobnymi punktami wejścia.
5. Utwórz lub dostosuj scenariusze markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj ogólnych helperów scenariuszy dla nowych scenariuszy.
7. Utrzymuj działanie istniejących aliasów zgodności, chyba że repozytorium wykonuje celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, trzymaj je w tym Plugin runnera lub harnessie Plugin.
- Jeśli scenariusz potrzebuje nowej capability, której może używać więcej niż jeden kanał, dodaj ogólny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, utrzymaj scenariusz jako specyficzny dla transportu i zaznacz to wprost w kontrakcie scenariusza.

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ale nowe scenariusze powinny używać nazw ogólnych. Aliasy istnieją, aby uniknąć migracji flag-day, a nie jako przyszły model.

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z zaobserwowanej osi czasu bus.
Raport powinien odpowiadać na pytania:

- Co działało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze follow-up warto dodać

Aby uzyskać inwentarz dostępnych scenariuszy — przydatny podczas szacowania dalszych prac lub podłączania nowego transportu — uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać wynik czytelny maszynowo).

Do kontroli charakteru i stylu uruchom ten sam scenariusz na wielu aktywnych
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

Polecenie uruchamia lokalne procesy potomne Gateway QA, a nie Docker. Scenariusze
oceny charakteru powinny ustawiać personę przez `SOUL.md`, a następnie uruchamiać
zwykłe tury użytkownika, takie jak czat, pomoc w obszarze roboczym i małe zadania
na plikach. Model kandydujący nie powinien być informowany, że jest oceniany.
Polecenie zachowuje każdą pełną transkrypcję, zapisuje podstawowe statystyki
uruchomienia, a następnie prosi modele oceniające w trybie szybkim, z rozumowaniem
`xhigh` tam, gdzie jest obsługiwane, o uszeregowanie uruchomień według naturalności,
klimatu i humoru.
Użyj `--blind-judge-models` podczas porównywania dostawców: prompt oceniający nadal
otrzymuje każdą transkrypcję i status uruchomienia, ale referencje kandydatów są
zastępowane neutralnymi etykietami, takimi jak `candidate-01`; raport mapuje rankingi
z powrotem na rzeczywiste referencje po parsowaniu.
Uruchomienia kandydatów domyślnie używają myślenia `high`, z `medium` dla GPT-5.5
i `xhigh` dla starszych referencji ewaluacyjnych OpenAI, które je obsługują.
Nadpisz konkretnego kandydata w wierszu polecenia za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalną wartość zapasową, a starsza forma `--model-thinking <provider/model=level>`
jest zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu szybkiego, aby wykorzystywać
priorytetowe przetwarzanie tam, gdzie dostawca je obsługuje. Dodaj w wierszu polecenia
`,fast`, `,no-fast` albo `,fast=false`, gdy pojedynczy kandydat lub oceniający
wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz wymusić tryb szybki
dla każdego modelu kandydującego. Czasy trwania kandydatów i modeli oceniających
są zapisywane w raporcie do analizy benchmarków, ale prompty oceniające wyraźnie
mówią, aby nie tworzyć rankingu według szybkości.
Uruchomienia modeli kandydatów i oceniających domyślnie używają współbieżności 16.
Zmniejsz `--concurrency` lub `--judge-concurrency`, gdy limity dostawcy albo
obciążenie lokalnego Gateway powodują zbyt duży szum w uruchomieniu.
Gdy nie podano żadnego kandydata przez `--model`, ocena charakteru domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie podano `--model`.
Gdy nie podano `--judge-model`, modele oceniające domyślnie używają
`openai/gpt-5.5,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Matrix QA](/pl/concepts/qa-matrix)
- [QA Channel](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Dashboard](/pl/web/dashboard)
