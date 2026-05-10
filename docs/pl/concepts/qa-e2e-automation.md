---
read_when:
    - Zrozumienie, jak elementy stosu QA współpracują ze sobą
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportu
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Budowanie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu na żywo, adaptery transportu i raportowanie.'
title: Przegląd QA
x-i18n:
    generated_at: "2026-05-10T19:34:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma testować OpenClaw w sposób bardziej realistyczny,
ukształtowany przez kanały, niż pozwala na to pojedynczy test jednostkowy.

Bieżące elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących oraz eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe pluginy uruchamiające: adaptery transportu live, które
  sterują rzeczywistym kanałem wewnątrz podrzędnego Gateway QA.
- `qa/`: zasoby początkowe z repozytorium dla zadania startowego i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja live przed i po dla błędów, które
  wymagają rzeczywistych transportów, zrzutów ekranu przeglądarki, stanu VM i dowodów PR.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele ma aliasy skryptów `pnpm qa:*`;
obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Dołączona samokontrola QA; zapisuje raport Markdown.                                                                                                                                                                                                                    |
| `qa suite`                                          | Uruchom scenariusze z repozytorium wobec ścieżki Gateway QA. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej VM Linux.                                                                                                                            |
| `qa coverage`                                       | Wypisz inwentarz pokrycia scenariuszy w markdown (`--json` dla danych wyjściowych maszynowych).                                                                                                                                                                         |
| `qa parity-report`                                  | Porównaj dwa pliki `qa-suite-summary.json` i zapisz agentowy raport parytetu.                                                                                                                                                                                           |
| `qa character-eval`                                 | Uruchom scenariusz QA postaci na wielu modelach live z ocenianym raportem. Zobacz [Raportowanie](#reporting).                                                                                                                                                          |
| `qa manual`                                         | Uruchom jednorazowy prompt wobec wybranej ścieżki dostawcy/modelu.                                                                                                                                                                                                      |
| `qa ui`                                             | Uruchom interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                       |
| `qa docker-build-image`                             | Zbuduj wstępnie przygotowany obraz Docker QA.                                                                                                                                                                                                                           |
| `qa docker-scaffold`                                | Zapisz szkielet docker-compose dla panelu QA + ścieżki Gateway.                                                                                                                                                                                                         |
| `qa up`                                             | Zbuduj witrynę QA, uruchom stos oparty na Dockerze, wypisz URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                |
| `qa aimock`                                         | Uruchom tylko serwer dostawcy AIMock.                                                                                                                                                                                                                                   |
| `qa mock-openai`                                    | Uruchom tylko świadomy scenariuszy serwer dostawcy `mock-openai`.                                                                                                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządzaj współdzieloną pulą poświadczeń Convex.                                                                                                                                                                                                                        |
| `qa matrix`                                         | Ścieżka transportu live wobec jednorazowego homeservera Tuwunel. Zobacz [Matrix QA](/pl/concepts/qa-matrix).                                                                                                                                                              |
| `qa telegram`                                       | Ścieżka transportu live wobec rzeczywistej prywatnej grupy Telegram.                                                                                                                                                                                                    |
| `qa discord`                                        | Ścieżka transportu live wobec rzeczywistego prywatnego kanału gildii Discord.                                                                                                                                                                                           |
| `qa slack`                                          | Ścieżka transportu live wobec rzeczywistego prywatnego kanału Slack.                                                                                                                                                                                                    |
| `qa mantis`                                         | Runner weryfikacji przed i po dla błędów transportu live, z dowodami reakcji statusu Discord, smoke testem pulpitu/przeglądarki Crabbox oraz smoke testem Slack-in-VNC. Zobacz [Mantis](/pl/concepts/mantis) i [Runbook Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook). |

## Przepływ operatora

Bieżący przepływ operatora QA to dwupanelowa witryna QA:

- Lewo: panel Gateway (Control UI) z agentem.
- Prawo: QA Lab, pokazujące transkrypt podobny do Slack i plan scenariusza.

Uruchom go za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia opartą na Dockerze ścieżkę Gateway i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może przekazać agentowi
misję QA, obserwować rzeczywiste zachowanie kanału oraz zarejestrować, co zadziałało, nie powiodło się lub
pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Docker za każdym razem,
uruchom stos z podmontowanym pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i montuje
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet przy zmianie, a przeglądarka automatycznie odświeża się, gdy zmienia się
hash zasobu QA Lab.

Aby wykonać lokalny smoke test śladu OpenTelemetry, uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik śladów OTLP/HTTP, uruchamia scenariusz QA
`otel-trace-smoke` z włączonym pluginem `diagnostics-otel`, a następnie
dekoduje wyeksportowane spany protobuf i asercjami sprawdza krytyczny dla wydania kształt:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` i `openclaw.message.delivery` muszą być obecne;
wywołania modeli nie mogą eksportować `StreamAbandoned` przy udanych turach; surowe identyfikatory diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza śladem. Zapisuje
`otel-smoke-summary.json` obok artefaktów zestawu QA.

QA obserwowalności pozostaje dostępne tylko z checkoutu źródeł. Paczka npm celowo pomija
QA Lab, więc ścieżki wydania pakietów Docker nie uruchamiają poleceń `qa`. Użyj
`pnpm qa:otel:smoke` ze zbudowanego checkoutu źródeł podczas zmieniania instrumentacji
diagnostycznej.

Aby uruchomić ścieżkę smoke Matrix z rzeczywistym transportem, uruchom:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Pełna dokumentacja CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów dla tej ścieżki znajdują się w [Matrix QA](/pl/concepts/qa-matrix). W skrócie: aprowizuje jednorazowy homeserver Tuwunel w Dockerze, rejestruje tymczasowych użytkowników driver/SUT/observer, uruchamia rzeczywisty plugin Matrix wewnątrz podrzędnego Gateway QA ograniczonego do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt observed-events i połączony log wyjściowy w `.artifacts/qa-e2e/matrix-<timestamp>/`.

Scenariusze obejmują zachowania transportu, których testy jednostkowe nie mogą udowodnić end to end: bramkowanie wzmianek, zasady allow-bot, allowlisty, odpowiedzi najwyższego poziomu i w wątkach, trasowanie DM, obsługę reakcji, tłumienie edycji przychodzących, deduplikację replay po restarcie, odzyskiwanie po przerwaniu homeservera, dostarczanie metadanych zatwierdzenia, obsługę multimediów oraz przepływy uruchamiania/odzyskiwania/weryfikacji Matrix E2EE. Profil CLI E2EE uruchamia też `openclaw matrix encryption setup` i polecenia weryfikacji przez ten sam jednorazowy homeserver przed sprawdzeniem odpowiedzi Gateway.

Discord ma również scenariusze opt-in tylko dla Mantis do odtwarzania błędów. Użyj
`--scenario discord-status-reactions-tool-only` dla jawnej osi czasu reakcji statusu
albo `--scenario discord-thread-reply-filepath-attachment`, aby utworzyć
rzeczywisty wątek Discord i zweryfikować, że `message.thread-reply` zachowuje
załącznik `filePath`. Te scenariusze pozostają poza domyślną ścieżką live Discord,
ponieważ są sondami odtworzeniowymi przed/po, a nie szerokim pokryciem smoke.
Przepływ Mantis dla załączników w wątku może też dodać nagranie świadka Web
z zalogowanego Discord, gdy `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` lub
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` jest skonfigurowane w środowisku QA.
Ten profil widza służy wyłącznie do przechwytywania wizualnego; decyzja pass/fail
nadal pochodzi z orakla Discord REST.

CI używa tej samej powierzchni poleceń w `.github/workflows/qa-live-transports-convex.yml`. Zaplanowane i domyślne uruchomienia ręczne wykonują szybki profil Matrix z poświadczeniami live frontier, `--fast` i `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ręczne `matrix_profile=all` rozdziela pracę na pięć shardów profili, aby wyczerpujący katalog mógł działać równolegle przy zachowaniu jednego katalogu artefaktów na shard.

Dla ścieżek smoke Telegram, Discord i Slack z rzeczywistym transportem:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Celują one w istniejący wcześniej rzeczywisty kanał z dwoma botami (driver + SUT). Wymagane zmienne env, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane w [Dokumentacji QA Telegram, Discord i Slack](#telegram-discord-and-slack-qa-reference) poniżej.

Aby uruchomić pełny przebieg Slack desktop VM z awaryjnym dostępem VNC, uruchom:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

To polecenie dzierżawi maszynę desktop/browser Crabbox, uruchamia ścieżkę live Slack
wewnątrz VM, otwiera Slack Web w przeglądarce VNC, przechwytuje pulpit i
kopiuje `slack-qa/`, `slack-desktop-smoke.png` oraz `slack-desktop-smoke.mp4`,
gdy przechwytywanie wideo jest dostępne, z powrotem do katalogu artefaktów Mantis. Dzierżawy
desktop/browser Crabbox zapewniają narzędzia przechwytywania oraz pakiety pomocnicze
przeglądarki/natywnej kompilacji z góry, więc scenariusz powinien instalować rozwiązania awaryjne tylko na starszych
dzierżawach. Mantis raportuje łączne czasy oraz czasy poszczególnych faz w
`mantis-slack-desktop-smoke-report.md`, więc wolne przebiegi pokazują, czy czas został poświęcony na
rozgrzewanie dzierżawy, pozyskanie poświadczeń, konfigurację zdalną czy kopiowanie artefaktów. Użyj ponownie
`--lease-id <cbx_...>` po ręcznym zalogowaniu się do Slack Web przez VNC;
ponownie używane dzierżawy utrzymują też ciepłą pamięć podręczną sklepu pnpm Crabbox. Domyślne
`--hydrate-mode source` weryfikuje z checkoutu źródłowego i uruchamia install/build
wewnątrz VM. Użyj `--hydrate-mode prehydrated` tylko wtedy, gdy ponownie używany zdalny
obszar roboczy ma już `node_modules` i zbudowany `dist/`; ten tryb pomija
kosztowny krok install/build i kończy się niepowodzeniem w sposób zamknięty, gdy obszar roboczy nie jest gotowy.
Z `--gateway-setup` Mantis pozostawia trwały OpenClaw Slack gateway
działający wewnątrz VM na porcie `38973`; bez tego polecenie uruchamia normalną
ścieżkę QA Slack bot-do-bota i kończy działanie po przechwyceniu artefaktów.

Lista kontrolna operatora, polecenie dispatch workflow GitHub, kontrakt komentarza dowodowego,
tabela decyzji hydrate-mode, interpretacja czasów i kroki obsługi awarii
znajdują się w [Runbooku Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook).

Aby wykonać zadanie desktopowe w stylu agent/CV, uruchom:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` dzierżawi lub ponownie używa maszyny desktop/browser Crabbox, uruchamia
`crabbox record --while`, steruje widoczną przeglądarką przez zagnieżdżony
`visual-driver`, przechwytuje `visual-task.png`, uruchamia `openclaw infer image describe`
na zrzucie ekranu, gdy wybrano `--vision-mode image-describe`, i
zapisuje `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` oraz `mantis-visual-task-report.md`.
Gdy ustawiono `--expect-text`, prompt vision prosi o ustrukturyzowany werdykt JSON
i przechodzi tylko wtedy, gdy model zgłasza pozytywne widoczne dowody; odpowiedź
negatywna, która jedynie cytuje tekst docelowy, powoduje niepowodzenie asercji.
Użyj `--vision-mode metadata` do smoke testu bez modelu, który potwierdza działanie pulpitu,
przeglądarki, zrzutu ekranu i instalacji wideo bez wywoływania providera
rozumienia obrazów. Nagranie jest wymaganym artefaktem dla `visual-task`; jeśli Crabbox nagra
pusty lub brakujący `visual-task.mp4`, zadanie kończy się niepowodzeniem nawet wtedy, gdy visual driver
przeszedł. W razie niepowodzenia Mantis zachowuje dzierżawę dla VNC, chyba że zadanie już
przeszło i `--keep-lease` nie zostało ustawione.

Przed użyciem pulowanych poświadczeń live uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza env brokera Convex, waliduje ustawienia endpointów i weryfikuje osiągalność admin/list, gdy obecny jest sekret maintainer. Raportuje tylko status ustawione/brakujące dla sekretów.

## Pokrycie transportu live

Ścieżki transportu live współdzielą jeden kontrakt zamiast wymyślać własny kształt listy scenariuszy. `qa-channel` jest szerokim syntetycznym zestawem zachowań produktu i nie jest częścią macierzy pokrycia transportu live.

| Ścieżka | Canary | Bramkowanie wzmianek | Bot-do-bota | Blokada listy dozwolonych | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja w wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Rejestracja natywnego polecenia |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

Dzięki temu `qa-channel` pozostaje szerokim zestawem zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe transporty live współdzielą jedną jawną listę kontrolną
kontraktu transportowego.

Aby uruchomić jednorazową ścieżkę Linux VM bez wprowadzania Docker do ścieżki QA, uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Uruchamia to świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje normalny raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Przebiegi zestawu na hoście i Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami Gateway. `qa-channel` domyślnie używa współbieżności
4, ograniczonej przez liczbę wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, albo `--concurrency 1` do wykonania szeregowego.
Polecenie kończy się kodem niezerowym, gdy którykolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez nieudanego kodu wyjścia.
Przebiegi live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze providera oparte na env, ścieżkę konfiguracji providera QA live oraz
`CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowany obszar roboczy.

## Odniesienie QA dla Telegram, Discord i Slack

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) ze względu na liczbę scenariuszy i provisionowanie homeservera wspierane przez Docker. Telegram, Discord i Slack są mniejsze - po kilka scenariuszy, bez systemu profili, wobec istniejących wcześniej prawdziwych kanałów - więc ich dokumentacja referencyjna znajduje się tutaj.

### Wspólne flagi CLI

Te ścieżki rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                 | Domyślna                                                       | Opis                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Uruchom tylko ten scenariusz. Można powtarzać.                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Gdzie zapisywane są raporty/podsumowanie/zaobserwowane wiadomości i log wyjściowy. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Katalog główny repozytorium przy wywołaniu z neutralnego cwd.                                                        |
| `--sut-account <id>`                  | `sut`                                                           | Tymczasowy identyfikator konta w konfiguracji Gateway QA.                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` lub `live-frontier` (starsze `live-openai` nadal działa).                                               |
| `--model <ref>` / `--alt-model <ref>` | domyślna wartość providera                                      | Referencje modelu podstawowego/alternatywnego.                                                                        |
| `--fast`                              | wyłączone                                                       | Szybki tryb providera tam, gdzie jest obsługiwany.                                                                    |
| `--credential-source <env\|convex>`   | `env`                                                           | Zobacz [pulę poświadczeń Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`                      | Rola używana, gdy `--credential-source convex`.                                                                       |

Każda ścieżka kończy się kodem niezerowym przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania nieudanego kodu wyjścia.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną prawdziwą prywatną grupę Telegram z dwoma odrębnymi botami (driver + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-do-bota działa najlepiej, gdy oba boty mają włączony **Bot-to-Bot Communication Mode** w `@BotFather`.

Wymagane env przy `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - numeryczny identyfikator czatu (ciąg znaków).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcjonalne:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości (domyślnie redaguje).

Scenariusze (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Niejawny domyślny zestaw zawsze pokrywa canary, bramkowanie wzmianek, odpowiedzi natywnych poleceń, adresowanie poleceń i odpowiedzi grupowe bot-do-bota. Domyślne ustawienia `mock-openai` obejmują też deterministyczne sprawdzenia łańcucha odpowiedzi i streamingu wiadomości końcowej. `telegram-current-session-status-tool` pozostaje opcjonalne, ponieważ jest stabilne tylko wtedy, gdy jest wątkowane bezpośrednio po canary, a nie po dowolnych odpowiedziach natywnych poleceń. Użyj `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, aby wypisać bieżący podział domyślne/opcjonalne z referencjami regresji.

Artefakty wyjściowe:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - zawiera RTT dla każdej odpowiedzi (wysłanie przez driver → zaobserwowana odpowiedź SUT), zaczynając od canary.
- `telegram-qa-observed-messages.json` - treści redagowane, chyba że `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Celuje w jeden prawdziwy prywatny kanał gildii Discord z dwoma botami: botem driver kontrolowanym przez harness i botem SUT uruchamianym przez podrzędny OpenClaw Gateway przez dołączony Plugin Discord. Weryfikuje obsługę wzmianek na kanale, to, że bot SUT zarejestrował natywne polecenie `/help` w Discord, oraz opcjonalne scenariusze dowodowe Mantis.

Wymagane env przy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - musi odpowiadać identyfikatorowi użytkownika bota SUT zwróconemu przez Discord (w przeciwnym razie ścieżka szybko zakończy się niepowodzeniem).

Opcjonalne:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wybiera kanał głosowy/sceniczny dla `discord-voice-autojoin`; bez tego scenariusz wybiera pierwszy widoczny kanał głosowy/sceniczny dla bota SUT.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scenariusz głosowy włączany jawnie. Działa samodzielnie, włącza `channels.discord.voice.autoJoin` i weryfikuje, że bieżący stan głosowy bota SUT w Discord to docelowy kanał głosowy/sceniczny. Dane uwierzytelniające Convex Discord mogą zawierać opcjonalne `voiceChannelId`; w przeciwnym razie runner wykrywa pierwszy widoczny kanał głosowy/sceniczny w gildii.
- `discord-status-reactions-tool-only` - scenariusz Mantis włączany jawnie. Działa samodzielnie, ponieważ przełącza SUT na zawsze aktywne odpowiedzi w gildii wyłącznie przez narzędzia z `messages.statusReactions.enabled=true`, a następnie zapisuje oś czasu reakcji REST oraz artefakty wizualne HTML/PNG. Raporty Mantis przed/po zachowują też dostarczone przez scenariusz artefakty MP4 jako `baseline.mp4` i `candidate.mp4`.

Uruchom jawnie scenariusz automatycznego dołączania do głosu w Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Uruchom jawnie scenariusz reakcji statusowych Mantis:

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
- `discord-qa-observed-messages.json` - treści są redagowane, chyba że ustawiono `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` i `discord-status-reactions-tool-only-timeline.png`, gdy uruchamiany jest scenariusz reakcji statusowych.

### QA Slack

```bash
pnpm openclaw qa slack
```

Celuje w jeden rzeczywisty prywatny kanał Slack z dwoma odrębnymi botami: botem sterującym kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny OpenClaw Gateway przez dołączony Slack Plugin.

Wymagane zmienne środowiskowe przy `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcjonalne:

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
- `slack-qa-observed-messages.json` - treści są redagowane, chyba że ustawiono `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Konfigurowanie przestrzeni roboczej Slack

Ścieżka wymaga dwóch odrębnych aplikacji Slack w jednej przestrzeni roboczej oraz kanału, którego członkami są oba boty:

- `channelId` - identyfikator `Cxxxxxxxxxx` kanału, do którego zaproszono oba boty. Użyj dedykowanego kanału; ścieżka publikuje wiadomości przy każdym uruchomieniu.
- `driverBotToken` - token bota (`xoxb-...`) aplikacji **Driver**.
- `sutBotToken` - token bota (`xoxb-...`) aplikacji **SUT**, która musi być oddzielną aplikacją Slack od drivera, aby jej identyfikator użytkownika bota był odrębny.
- `sutAppToken` - token na poziomie aplikacji (`xapp-...`) aplikacji SUT z `connections:write`, używany przez Socket Mode, aby aplikacja SUT mogła odbierać zdarzenia.

Preferuj przestrzeń roboczą Slack dedykowaną do QA zamiast ponownego używania przestrzeni produkcyjnej.

Poniższy manifest SUT celowo zawęża produkcyjną instalację dołączonego Slack Plugin (`extensions/slack/src/setup-shared.ts:10`) do uprawnień i zdarzeń objętych zestawem testów live Slack QA. Konfigurację kanału produkcyjnego widoczną dla użytkowników opisuje [szybka konfiguracja kanału Slack](/pl/channels/slack#quick-setup); para QA Driver/SUT jest celowo oddzielna, ponieważ ścieżka wymaga dwóch odrębnych identyfikatorów użytkowników botów w jednej przestrzeni roboczej.

**1. Utwórz aplikację Driver**

Przejdź do [api.slack.com/apps](https://api.slack.com/apps) → _Utwórz nową aplikację_ → _Z manifestu_ → wybierz przestrzeń roboczą QA, wklej poniższy manifest, a następnie _Zainstaluj w przestrzeni roboczej_:

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

Skopiuj _Bot User OAuth Token_ (`xoxb-...`) - staje się on `driverBotToken`. Driver musi tylko publikować wiadomości i identyfikować siebie; bez zdarzeń, bez Socket Mode.

**2. Utwórz aplikację SUT**

Powtórz _Utwórz nową aplikację → Z manifestu_ w tej samej przestrzeni roboczej. Ta aplikacja QA celowo używa węższej wersji produkcyjnego manifestu dołączonego Slack Plugin (`extensions/slack/src/setup-shared.ts:10`): zakresy i zdarzenia reakcji są pominięte, ponieważ zestaw testów live Slack QA nie obejmuje jeszcze obsługi reakcji.

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

- _Zainstaluj w przestrzeni roboczej_ → skopiuj _Bot User OAuth Token_ → staje się on `sutBotToken`.
- _Podstawowe informacje → Tokeny na poziomie aplikacji → Wygeneruj token i zakresy_ → dodaj zakres `connections:write` → zapisz → skopiuj wartość `xapp-...` → staje się ona `sutAppToken`.

Zweryfikuj, że oba boty mają odrębne identyfikatory użytkowników, wywołując `auth.test` dla każdego tokena. Runtime rozróżnia drivera i SUT po identyfikatorze użytkownika; ponowne użycie jednej aplikacji dla obu spowoduje natychmiastowe niepowodzenie mention-gating.

**3. Utwórz kanał**

W przestrzeni roboczej QA utwórz kanał (np. `#openclaw-qa`) i zaproś oba boty z poziomu kanału:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Skopiuj identyfikator `Cxxxxxxxxxx` z _informacje o kanale → Informacje → Identyfikator kanału_ - staje się on `channelId`. Kanał publiczny działa; jeśli użyjesz kanału prywatnego, obie aplikacje mają już `groups:history`, więc odczyty historii przez harness nadal się powiodą.

**4. Zarejestruj dane uwierzytelniające**

Są dwie opcje. Użyj zmiennych środowiskowych do debugowania na jednej maszynie (ustaw cztery zmienne `OPENCLAW_QA_SLACK_*` i przekaż `--credential-source env`) albo zasil współdzieloną pulę Convex, aby CI i inni maintainerzy mogli je dzierżawić.

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

**5. Zweryfikuj end-to-end**

Uruchom ścieżkę lokalnie, aby potwierdzić, że oba boty mogą komunikować się ze sobą przez brokera:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Zielone uruchomienie kończy się znacznie poniżej 30 sekund, a `slack-qa-report.md` pokazuje zarówno `slack-canary`, jak i `slack-mention-gating` ze statusem `pass`. Jeśli ścieżka zawiesza się na około 90 sekund i kończy komunikatem `Convex credential pool exhausted for kind "slack"`, pula jest pusta albo wszystkie wiersze są dzierżawione - `qa credentials list --kind slack --status all --json` wskaże, która sytuacja zachodzi.

### Pula danych uwierzytelniających Convex

Ścieżki Telegram, Discord, Slack i WhatsApp mogą dzierżawić dane uwierzytelniające ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne środowiskowe. Przekaż `--credential-source convex` (albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab uzyskuje wyłączną dzierżawę, wysyła Heartbeat przez czas trwania uruchomienia i zwalnia ją przy zamykaniu. Rodzaje puli to `"telegram"`, `"discord"`, `"slack"` i `"whatsapp"`.

Kształty payloadów walidowane przez brokera przy `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` musi być numerycznym ciągiem identyfikatora czatu.
- Rzeczywisty użytkownik Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - jedna wyłączna dzierżawa konta jednorazowego używana zarówno przez driver CLI TDLib, jak i wizualnego świadka Telegram Desktop.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - numery telefonów muszą być odrębnymi ciągami E.164.

Dla wizualnego dowodu z rzeczywistym użytkownikiem Telegram preferuj utrzymywaną sesję Crabbox:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` utrzymuje jedną wyłączną dzierżawę Convex `telegram-user` zarówno dla drivera CLI TDLib, jak i świadka Telegram Desktop, uruchamia nagrywanie pulpitu i pozostawia Crabbox działający dla dowolnych kroków repro sterowanych przez agenta. Agenci mogą używać `send`, `run`, `screenshot` i `status`, dopóki nie będą usatysfakcjonowani, a potem `finish` zbiera zrzut ekranu, wideo, przycięte według ruchu wideo/GIF, wyniki sond TDLib oraz logi przed zwolnieniem danych uwierzytelniających. `publish --session <file> --pr <number>` domyślnie komentuje tylko GIF z ruchem; `--full-artifacts` to jawne włączenie logów i wyjścia JSON. Domyślne polecenie `probe` pozostaje jednokomendowym skrótem do szybkich kontroli smoke `/status`.

Użyj `--mock-response-file <path>`, gdy PR potrzebuje deterministycznego wizualnego diffu:
ta sama zamockowana odpowiedź modelu może zostać uruchomiona na `main` i na głowicy PR, gdy zmienia się
formatter Telegram lub warstwa dostarczania. Domyślne ustawienia przechwytywania są dostrojone do komentarzy PR:
standardowa klasa Crabbox, nagranie pulpitu 24 fps, ruchomy GIF 24 fps oraz
szerokość podglądu 1920 px. Komentarze przed/po powinny publikować czysty pakiet,
który zawiera tylko zamierzone GIF-y.

Ścieżki Slack również mogą używać puli. Sprawdzenia kształtu payloadu Slack obecnie znajdują się w runnerze QA Slack, a nie w brokerze; użyj `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, z identyfikatorem kanału Slack takim jak `Cxxxxxxxxxx`. Zobacz [Konfigurowanie obszaru roboczego Slack](#setting-up-the-slack-workspace), aby przygotować aplikację i zakresy.

Operacyjne zmienne env i kontrakt endpointu brokera Convex znajdują się w [Testowanie → Współdzielone dane uwierzytelniające Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji pochodzi sprzed puli wielokanałowej; semantyka dzierżawy jest wspólna dla wszystkich rodzajów).

## Seedy wspierane przez repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Celowo są w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta.

`qa-lab` powinien pozostać generycznym runnerem Markdown. Każdy plik scenariusza Markdown jest
źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, capability, ścieżki i ryzyka
- odwołania do dokumentacji i kodu
- opcjonalne wymagania dotyczące pluginów
- opcjonalną poprawkę konfiguracji Gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia runtime, która wspiera `qa-flow`, może pozostać generyczna
i przekrojowa. Na przykład scenariusze Markdown mogą łączyć helpery po stronie transportu
z helperami po stronie przeglądarki, które sterują osadzonym Control UI przez
seam Gateway `browser.request`, bez dodawania runnera dla szczególnego przypadku.

Pliki scenariuszy powinny być grupowane według capability produktu, a nie folderu drzewa źródeł.
Zachowuj stabilne ID scenariuszy, gdy pliki są przenoszone; używaj `docsRefs` i `codeRefs`
do śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- callbacki cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- czytanie repozytorium i dokumentacji
- jedno małe zadanie budowania, takie jak Lobster Invaders

## Ścieżki mocków providerów

`qa suite` ma dwie lokalne ścieżki mocków providerów:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną
  deterministyczną ścieżką mocków dla QA wspieranego przez repozytorium i bramek parzystości.
- `aimock` uruchamia serwer providera oparty na AIMock dla eksperymentalnego pokrycia protokołu,
  fixture, record/replay i chaos. Jest dodatkiem i nie zastępuje
  dispatcher’a scenariuszy `mock-openai`.

Implementacja ścieżek providerów znajduje się w `extensions/qa-lab/src/providers/`.
Każdy provider posiada własne ustawienia domyślne, uruchamianie lokalnego serwera, konfigurację modelu Gateway,
potrzeby stagingu profilu uwierzytelniania oraz flagi capability live/mock. Wspólny kod suite i
Gateway powinien trasować przez rejestr providerów zamiast rozgałęziać się po
nazwach providerów.

## Adaptery transportu

`qa-lab` posiada generyczny seam transportu dla scenariuszy QA Markdown. `qa-channel` jest pierwszym adapterem na tym seamie, ale cel projektowy jest szerszy: przyszłe rzeczywiste lub syntetyczne kanały powinny podłączać się do tego samego runnera suite zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział jest następujący:

- `qa-lab` posiada generyczne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- Adapter transportu posiada konfigurację Gateway, gotowość, obserwację przychodzącą i wychodzącą, akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy Markdown w `qa/scenarios/` definiują uruchomienie testu; `qa-lab` udostępnia wielokrotnego użytku powierzchnię runtime, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA Markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który ćwiczy kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy współdzielony host `qa-lab` może posiadać ten przepływ.

`qa-lab` posiada współdzielone mechanizmy hosta:

- korzeń polecenia `openclaw qa`
- uruchamianie i teardown suite
- współbieżność workerów
- zapisywanie artefaktów
- generowanie raportów
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów posiadają kontrakt transportu:

- jak `openclaw qa <runner>` jest montowane pod współdzielonym korzeniem `qa`
- jak Gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypty i znormalizowany stan transportu
- jak wykonywane są akcje wspierane przez transport
- jak obsługiwany jest reset lub czyszczenie specyficzne dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym seamie hosta `qa-lab`.
3. Trzymaj mechanikę specyficzną dla transportu w pluginie runnera lub harnessie kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie korzenia. Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` lekkim; leniwe CLI i wykonywanie runnera powinny pozostać za osobnymi entrypointami.
5. Utwórz lub dostosuj scenariusze Markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj generycznych helperów scenariuszy dla nowych scenariuszy.
7. Utrzymuj istniejące aliasy zgodności, chyba że repozytorium wykonuje celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, trzymaj je w tym pluginie runnera lub harnessie pluginu.
- Jeśli scenariusz potrzebuje nowej capability, z której może korzystać więcej niż jeden kanał, dodaj generyczny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, utrzymaj scenariusz jako specyficzny dla transportu i zaznacz to jawnie w kontrakcie scenariusza.

### Nazwy helperów scenariuszy

Preferowane generyczne helpery dla nowych scenariuszy:

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ale nowe scenariusze powinny używać nazw generycznych. Aliasy istnieją, aby uniknąć migracji flag-day, a nie jako model na przyszłość.

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z obserwowanej osi czasu busa.
Raport powinien odpowiadać na pytania:

- Co działało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać inwentarz dostępnych scenariuszy - przydatny podczas szacowania pracy uzupełniającej lub podłączania nowego transportu - uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać wyjście czytelne maszynowo).

Do sprawdzeń charakteru i stylu uruchom ten sam scenariusz na wielu live refach modeli
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

Polecenie uruchamia lokalne procesy potomne Gateway QA, nie Docker. Scenariusze oceny charakteru
powinny ustawiać personę przez `SOUL.md`, a następnie uruchamiać zwykłe tury użytkownika,
takie jak czat, pomoc w workspace i małe zadania na plikach. Model kandydacki nie powinien
być informowany, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, rejestruje podstawowe statystyki uruchomienia, a następnie prosi modele sędziowskie w trybie fast z
rozumowaniem `xhigh`, gdy jest obsługiwane, o uszeregowanie uruchomień według naturalności, vibe’u i humoru.
Użyj `--blind-judge-models` podczas porównywania providerów: prompt sędziego nadal otrzymuje
każdy transkrypt i status uruchomienia, ale refy kandydatów są zastępowane neutralnymi
etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste refy po
parsowaniu.
Uruchomienia kandydatów domyślnie używają myślenia `high`, z `medium` dla GPT-5.5 oraz `xhigh`
dla starszych refów ewaluacyjnych OpenAI, które je obsługują. Nadpisz konkretnego kandydata inline za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalny fallback, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla zgodności.
Refy kandydatów OpenAI domyślnie używają trybu fast, aby użyć przetwarzania priorytetowego tam,
gdzie provider je obsługuje. Dodaj `,fast`, `,no-fast` lub `,fast=false` inline, gdy
pojedynczy kandydat lub sędzia potrzebuje nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb fast dla każdego modelu kandydackiego. Czasy trwania kandydatów i sędziów są
rejestrowane w raporcie do analizy benchmarków, ale prompty sędziów jawnie mówią,
aby nie klasyfikować według szybkości.
Uruchomienia modeli kandydackich i sędziowskich domyślnie używają współbieżności 16. Obniż
`--concurrency` lub `--judge-concurrency`, gdy limity providerów albo lokalne obciążenie Gateway
czynią uruchomienie zbyt zaszumionym.
Gdy nie przekazano żadnego kandydata `--model`, ocena charakteru domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie przekazano żadnego `--model`.
Gdy nie przekazano `--judge-model`, sędziowie domyślnie używają
`openai/gpt-5.5,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Macierz QA](/pl/concepts/qa-matrix)
- [QA Channel](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Dashboard](/pl/web/dashboard)
