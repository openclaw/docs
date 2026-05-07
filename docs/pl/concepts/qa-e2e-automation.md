---
read_when:
    - Zrozumienie, jak elementy stosu QA współpracują ze sobą
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportowego
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Tworzenie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportu na żywo, adaptery transportu i raportowanie.'
title: Przegląd QA
x-i18n:
    generated_at: "2026-05-07T13:15:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma ćwiczyć OpenClaw w bardziej realistyczny,
kanałowy sposób, niż pozwala na to pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe pluginy uruchamiające: adaptery transportu na żywo, które
  sterują prawdziwym kanałem w podrzędnym QA gateway.
- `qa/`: zasoby źródłowe z repozytorium dla zadania startowego i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja na żywo przed i po dla błędów, które
  wymagają prawdziwych transportów, zrzutów ekranu przeglądarki, stanu VM i dowodów PR.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele z nich ma aliasy skryptów `pnpm qa:*`;
obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Dołączony autotest QA; zapisuje raport Markdown.                                                                                                                                                                                                                        |
| `qa suite`                                          | Uruchom scenariusze z repozytorium względem ścieżki QA gateway. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej maszyny VM z Linuksem.                                                                                                             |
| `qa coverage`                                       | Wypisz markdownowy spis pokrycia scenariuszy (`--json` dla wyjścia maszynowego).                                                                                                                                                                                        |
| `qa parity-report`                                  | Porównaj dwa pliki `qa-suite-summary.json` i zapisz raport parytetu agentowego.                                                                                                                                                                                          |
| `qa character-eval`                                 | Uruchom scenariusz QA postaci na wielu modelach live z ocenianym raportem. Zobacz [Raportowanie](#reporting).                                                                                                                                                           |
| `qa manual`                                         | Uruchom jednorazowy prompt względem wybranej ścieżki dostawcy/modelu.                                                                                                                                                                                                    |
| `qa ui`                                             | Uruchom interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                        |
| `qa docker-build-image`                             | Zbuduj wstępnie przygotowany obraz Docker QA.                                                                                                                                                                                                                            |
| `qa docker-scaffold`                                | Zapisz szkielet docker-compose dla panelu QA + ścieżki gateway.                                                                                                                                                                                                          |
| `qa up`                                             | Zbuduj stronę QA, uruchom stos wsparty Dockerem, wypisz URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                     |
| `qa aimock`                                         | Uruchom tylko serwer dostawcy AIMock.                                                                                                                                                                                                                                    |
| `qa mock-openai`                                    | Uruchom tylko świadomy scenariuszy serwer dostawcy `mock-openai`.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządzaj współdzieloną pulą poświadczeń Convex.                                                                                                                                                                                                                         |
| `qa matrix`                                         | Ścieżka transportu live względem jednorazowego homeservera Tuwunel. Zobacz [Matrix QA](/pl/concepts/qa-matrix).                                                                                                                                                            |
| `qa telegram`                                       | Ścieżka transportu live względem prawdziwej prywatnej grupy Telegram.                                                                                                                                                                                                    |
| `qa discord`                                        | Ścieżka transportu live względem prawdziwego prywatnego kanału gildii Discord.                                                                                                                                                                                           |
| `qa slack`                                          | Ścieżka transportu live względem prawdziwego prywatnego kanału Slack.                                                                                                                                                                                                    |
| `qa mantis`                                         | Runner weryfikacji przed i po dla błędów transportu live, z dowodami w postaci reakcji statusu Discord, smoke testem pulpitu/przeglądarki Crabbox oraz smoke testem Slack-in-VNC. Zobacz [Mantis](/pl/concepts/mantis) i [Runbook Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook). |

## Przepływ operatora

Obecny przepływ operatora QA to dwupanelowa strona QA:

- Lewo: panel Gateway (Control UI) z agentem.
- Prawo: QA Lab, pokazujące transkrypt w stylu Slack i plan scenariusza.

Uruchom go przez:

```bash
pnpm qa:lab:up
```

To buduje stronę QA, uruchamia wspartą Dockerem ścieżkę gateway i udostępnia
stronę QA Lab, gdzie operator lub pętla automatyzacji może przekazać agentowi
misję QA, obserwować rzeczywiste zachowanie kanału i zapisać, co zadziałało, zawiodło lub
pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Docker za każdym razem,
uruchom stos z podmontowanym bindem pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i podmontowuje bindem
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet po zmianie, a przeglądarka automatycznie przeładowuje się, gdy zmieni się
hash zasobów QA Lab.

Dla lokalnego smoke testu śladu OpenTelemetry uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik śladów OTLP/HTTP, uruchamia scenariusz QA
`otel-trace-smoke` z włączonym pluginem `diagnostics-otel`, następnie
dekoduje wyeksportowane spany protobuf i sprawdza krytyczny dla wydania kształt:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` i `openclaw.message.delivery` muszą być obecne;
wywołania modelu nie mogą eksportować `StreamAbandoned` przy udanych turach; surowe identyfikatory diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza śladem. Skrypt zapisuje
`otel-smoke-summary.json` obok artefaktów zestawu QA.

QA obserwowalności pozostaje dostępne tylko z checkoutu źródeł. Tarball npm celowo pomija
QA Lab, więc ścieżki wydania pakietów Docker nie uruchamiają poleceń `qa`. Użyj
`pnpm qa:otel:smoke` ze zbudowanego checkoutu źródeł przy zmianie instrumentacji
diagnostycznej.

Dla ścieżki smoke Matrix z prawdziwym transportem uruchom:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Pełna referencja CLI, katalog profili/scenariuszy, zmienne env i układ artefaktów dla tej ścieżki znajdują się w [Matrix QA](/pl/concepts/qa-matrix). W skrócie: aprowizuje jednorazowy homeserver Tuwunel w Dockerze, rejestruje tymczasowych użytkowników driver/SUT/observer, uruchamia prawdziwy Plugin Matrix w podrzędnym QA gateway ograniczonym do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt zaobserwowanych zdarzeń i połączony log wyjścia pod `.artifacts/qa-e2e/matrix-<timestamp>/`.

Scenariusze obejmują zachowanie transportu, którego testy jednostkowe nie mogą udowodnić end to end: bramkowanie wzmianek, zasady allow-bot, listy dozwolonych, odpowiedzi najwyższego poziomu i w wątkach, routing DM, obsługę reakcji, tłumienie edycji przychodzących, deduplikację replay po restarcie, odzyskiwanie po przerwaniu homeservera, dostarczanie metadanych zatwierdzeń, obsługę mediów oraz przepływy rozruchu/odzyskiwania/weryfikacji Matrix E2EE. Profil CLI E2EE uruchamia także `openclaw matrix encryption setup` i polecenia weryfikacji przez ten sam jednorazowy homeserver przed sprawdzeniem odpowiedzi gateway.

Discord ma też scenariusze opt-in tylko dla Mantis do reprodukcji błędów. Użyj
`--scenario discord-status-reactions-tool-only` dla jawnej osi czasu reakcji statusu
albo `--scenario discord-thread-reply-filepath-attachment`, aby utworzyć
prawdziwy wątek Discord i zweryfikować, że `message.thread-reply` zachowuje
załącznik `filePath`. Te scenariusze pozostają poza domyślną ścieżką live Discord,
ponieważ są próbami reprodukcji przed/po, a nie szerokim pokryciem smoke.
Przepływ Mantis dla załączników w wątku może też dodać nagranie świadka w Discord Web
z zalogowaną sesją, gdy w środowisku QA skonfigurowano
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` lub
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Ten profil widza służy tylko do przechwytywania wizualnego; decyzja pass/fail
nadal pochodzi z wyroczni Discord REST.

CI używa tej samej powierzchni poleceń w `.github/workflows/qa-live-transports-convex.yml`. Zaplanowane i domyślne ręczne uruchomienia wykonują szybki profil Matrix z poświadczeniami live frontier, `--fast` i `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ręczne `matrix_profile=all` rozdziela się na pięć shardów profili, aby wyczerpujący katalog mógł działać równolegle, zachowując jeden katalog artefaktów na shard.

Dla ścieżek smoke z prawdziwym transportem Telegram, Discord i Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Celują one w istniejący prawdziwy kanał z dwoma botami (driver + SUT). Wymagane zmienne env, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane w [referencji QA Telegram, Discord i Slack](#telegram-discord-and-slack-qa-reference) poniżej.

Dla pełnego uruchomienia VM pulpitu Slack z ratunkiem przez VNC uruchom:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

To polecenie dzierżawi maszynę Crabbox z pulpitem/przeglądarką, uruchamia ścieżkę live Slack
wewnątrz VM, otwiera Slack Web w przeglądarce VNC, przechwytuje pulpit i
kopiuje `slack-qa/`, `slack-desktop-smoke.png` oraz `slack-desktop-smoke.mp4`
z powrotem do katalogu artefaktów Mantis, gdy przechwytywanie wideo jest dostępne. Dzierżawy Crabbox
z pulpitem/przeglądarką zapewniają z góry narzędzia przechwytywania oraz pakiety pomocnicze przeglądarki/natywnej kompilacji,
więc scenariusz powinien instalować rozwiązania awaryjne tylko na starszych
dzierżawach. Mantis raportuje łączne czasy oraz czasy poszczególnych faz w
`mantis-slack-desktop-smoke-report.md`, dzięki czemu przy wolnych uruchomieniach widać, czy czas został zużyty na
rozgrzanie dzierżawy, pozyskanie poświadczeń, zdalną konfigurację czy kopiowanie artefaktów. Użyj ponownie
`--lease-id <cbx_...>` po ręcznym zalogowaniu się do Slack Web przez VNC;
ponownie użyte dzierżawy utrzymują też rozgrzaną pamięć podręczną magazynu pnpm Crabbox. Domyślne
`--hydrate-mode source` weryfikuje z checkoutu źródeł i uruchamia instalację/kompilację
wewnątrz VM. Użyj `--hydrate-mode prehydrated` tylko wtedy, gdy ponownie używany zdalny
obszar roboczy ma już `node_modules` i zbudowany `dist/`; ten tryb pomija
kosztowny krok instalacji/kompilacji i zamyka się niepowodzeniem, gdy obszar roboczy nie jest gotowy.
Z `--gateway-setup` Mantis pozostawia trwały Gateway Slack OpenClaw
uruchomiony wewnątrz VM na porcie `38973`; bez tego polecenie uruchamia standardową
ścieżkę QA bot-do-bota Slack i kończy pracę po przechwyceniu artefaktów.

Lista kontrolna operatora, polecenie wywołania workflow GitHub, kontrakt komentarza z dowodami,
tabela decyzyjna trybu hydratacji, interpretacja czasów i kroki obsługi
awarii znajdują się w [Runbook Mantis Slack Desktop](/pl/concepts/mantis-slack-desktop-runbook).

Dla zadania pulpitu w stylu agenta/CV uruchom:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` dzierżawi lub ponownie używa maszyny Crabbox z pulpitem/przeglądarką, uruchamia
`crabbox record --while`, steruje widoczną przeglądarką przez zagnieżdżony
`visual-driver`, przechwytuje `visual-task.png`, uruchamia `openclaw infer image describe`
na zrzucie ekranu, gdy wybrano `--vision-mode image-describe`, oraz
zapisuje `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` i `mantis-visual-task-report.md`.
Gdy ustawiono `--expect-text`, prompt wizyjny prosi o ustrukturyzowany werdykt JSON
i przechodzi tylko wtedy, gdy model zgłasza pozytywny widoczny dowód; odpowiedź
negatywna, która jedynie cytuje tekst docelowy, nie spełnia asercji.
Użyj `--vision-mode metadata` do smoke bez modelu, który potwierdza działanie pulpitu,
przeglądarki, zrzutu ekranu i instalacji wideo bez wywoływania dostawcy
rozumienia obrazu. Nagranie jest wymaganym artefaktem dla `visual-task`; jeśli Crabbox nie nagra
niepustego `visual-task.mp4`, zadanie kończy się niepowodzeniem nawet wtedy, gdy sterownik wizyjny
przeszedł. Przy awarii Mantis zachowuje dzierżawę dla VNC, chyba że zadanie już
przeszło, a `--keep-lease` nie zostało ustawione.

Przed użyciem pulowanych poświadczeń live uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza env brokera Convex, waliduje ustawienia endpointu i weryfikuje osiągalność admin/list, gdy sekret maintenera jest obecny. Raportuje dla sekretów tylko stan ustawione/brakujące.

## Pokrycie transportu live

Ścieżki transportu live współdzielą jeden kontrakt, zamiast każda wymyślała własny kształt listy scenariuszy. `qa-channel` jest szerokim syntetycznym pakietem zachowań produktu i nie należy do macierzy pokrycia transportu live.

| Ścieżka | Kanarek | Bramkowanie wzmianek | Bot-do-bota | Blokada listy dozwolonych | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Dalsza odpowiedź w wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Rejestracja poleceń natywnych |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

To utrzymuje `qa-channel` jako szeroki pakiet zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe transporty live współdzielą jedną jawną listę kontrolną
kontraktu transportu.

Dla jednorazowej ścieżki VM Linux bez wprowadzania Docker do ścieżki QA uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje standardowy raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia pakietu na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi pracownikami Gateway. `qa-channel` domyślnie używa współbieżności
4, ograniczonej liczbą wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę pracowników, albo `--concurrency 1` dla wykonania szeregowego.
Polecenie kończy się kodem różnym od zera, gdy dowolny scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, gdy
chcesz artefakty bez nieudanego kodu wyjścia.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze dostawców z env, ścieżkę konfiguracji dostawcy QA live oraz
`CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowany obszar roboczy.

## Referencja QA dla Telegram, Discord i Slack

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) z powodu liczby scenariuszy i provisioningu homeservera opartego na Docker. Telegram, Discord i Slack są mniejsze - po kilka scenariuszy każdy, bez systemu profili, względem wcześniej istniejących prawdziwych kanałów - więc ich referencja znajduje się tutaj.

### Wspólne flagi CLI

Te ścieżki rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga | Domyślnie | Opis |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>` | - | Uruchom tylko ten scenariusz. Powtarzalne. |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Miejsce zapisu raportów/podsumowania/zaobserwowanych wiadomości oraz dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>` | `process.cwd()` | Katalog główny repozytorium przy wywołaniu z neutralnego cwd. |
| `--sut-account <id>` | `sut` | Tymczasowy identyfikator konta wewnątrz konfiguracji Gateway QA. |
| `--provider-mode <mode>` | `live-frontier` | `mock-openai` lub `live-frontier` (starsze `live-openai` nadal działa). |
| `--model <ref>` / `--alt-model <ref>` | domyślne dostawcy | Referencje modelu podstawowego/alternatywnego. |
| `--fast` | wyłączone | Tryb szybki dostawcy tam, gdzie jest obsługiwany. |
| `--credential-source <env\|convex>` | `env` | Zobacz [pula poświadczeń Convex](#convex-credential-pool). |
| `--credential-role <maintainer\|ci>` | `ci` w CI, w przeciwnym razie `maintainer` | Rola używana przy `--credential-source convex`. |

Każda ścieżka kończy się kodem różnym od zera przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania nieudanego kodu wyjścia.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną prawdziwą prywatną grupę Telegram z dwoma różnymi botami (sterownik + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-do-bota działa najlepiej, gdy oba boty mają włączony **Tryb komunikacji bot-do-bota** w `@BotFather`.

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
- `telegram-qa-summary.json` - zawiera RTT dla każdej odpowiedzi (wysłanie przez sterownik → zaobserwowana odpowiedź SUT), zaczynając od kanarka.
- `telegram-qa-observed-messages.json` - treści redagowane, chyba że `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Celuje w jeden prawdziwy prywatny kanał gildii Discord z dwoma botami: botem sterownika kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny Gateway OpenClaw przez dołączony Plugin Discord. Weryfikuje obsługę wzmianek w kanale, to, że bot SUT zarejestrował natywne polecenie `/help` w Discord, oraz opcjonalne scenariusze dowodów Mantis.

Wymagane env przy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - musi odpowiadać identyfikatorowi użytkownika bota SUT zwróconemu przez Discord (w przeciwnym razie ścieżka szybko kończy się niepowodzeniem).

Opcjonalne:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` wybiera kanał głosowy/sceniczny dla `discord-voice-autojoin`; bez tego scenariusz wybiera pierwszy widoczny kanał głosowy/sceniczny dla bota SUT.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opcjonalny scenariusz głosowy. Uruchamia się samodzielnie, włącza `channels.discord.voice.autoJoin` i sprawdza, czy bieżący stan głosowy bota SUT w Discord jest docelowym kanałem głosowym/scenicznym. Dane uwierzytelniające Convex Discord mogą zawierać opcjonalne `voiceChannelId`; w przeciwnym razie runner wykrywa pierwszy widoczny kanał głosowy/sceniczny w gildii.
- `discord-status-reactions-tool-only` - opcjonalny scenariusz Mantis. Uruchamia się samodzielnie, ponieważ przełącza SUT na stale włączone odpowiedzi w gildii wyłącznie z narzędziami z `messages.statusReactions.enabled=true`, a następnie przechwytuje oś czasu reakcji REST oraz artefakty wizualne HTML/PNG. Raporty Mantis przed/po zachowują także artefakty MP4 dostarczone przez scenariusz jako `baseline.mp4` i `candidate.mp4`.

Uruchom jawnie scenariusz automatycznego dołączania do kanału głosowego Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Uruchom jawnie scenariusz reakcji statusu Mantis:

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
- `discord-qa-reaction-timelines.json` i `discord-status-reactions-tool-only-timeline.png`, gdy uruchamiany jest scenariusz reakcji statusu.

### QA Slack

```bash
pnpm openclaw qa slack
```

Celuje w jeden rzeczywisty prywatny kanał Slack z dwoma odrębnymi botami: botem sterownika kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny Gateway OpenClaw za pośrednictwem dołączonego Pluginu Slack.

Wymagane zmienne środowiskowe przy `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcjonalnie:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach obserwowanych wiadomości.

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

#### Konfigurowanie obszaru roboczego Slack

Ta ścieżka wymaga dwóch odrębnych aplikacji Slack w jednym obszarze roboczym oraz kanału, którego członkami są oba boty:

- `channelId` - identyfikator `Cxxxxxxxxxx` kanału, do którego zaproszono oba boty. Użyj dedykowanego kanału; ścieżka publikuje w nim przy każdym uruchomieniu.
- `driverBotToken` - token bota (`xoxb-...`) aplikacji **Driver**.
- `sutBotToken` - token bota (`xoxb-...`) aplikacji **SUT**, która musi być oddzielną aplikacją Slack od sterownika, aby identyfikator użytkownika jej bota był odrębny.
- `sutAppToken` - token na poziomie aplikacji (`xapp-...`) aplikacji SUT z `connections:write`, używany przez Socket Mode, aby aplikacja SUT mogła odbierać zdarzenia.

Preferuj obszar roboczy Slack dedykowany QA zamiast ponownego użycia produkcyjnego obszaru roboczego.

Poniższy manifest SUT celowo zawęża produkcyjną instalację dołączonego Pluginu Slack (`extensions/slack/src/setup-shared.ts:10`) do uprawnień i zdarzeń objętych zestawem live QA Slack. Konfigurację kanału produkcyjnego widzianą przez użytkowników opisuje [szybka konfiguracja kanału Slack](/pl/channels/slack#quick-setup); para QA Driver/SUT jest celowo oddzielna, ponieważ ścieżka wymaga dwóch odrębnych identyfikatorów użytkowników botów w jednym obszarze roboczym.

**1. Utwórz aplikację Driver**

Przejdź do [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → wybierz obszar roboczy QA, wklej następujący manifest, a następnie _Install to Workspace_:

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

Skopiuj _Bot User OAuth Token_ (`xoxb-...`) - staje się on `driverBotToken`. Sterownik potrzebuje tylko publikować wiadomości i identyfikować siebie; bez zdarzeń, bez Socket Mode.

**2. Utwórz aplikację SUT**

Powtórz _Create New App → From a manifest_ w tym samym obszarze roboczym. Ta aplikacja QA celowo używa węższej wersji produkcyjnego manifestu dołączonego Pluginu Slack (`extensions/slack/src/setup-shared.ts:10`): zakresy i zdarzenia reakcji są pominięte, ponieważ zestaw live QA Slack nie obejmuje jeszcze obsługi reakcji.

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

- _Install to Workspace_ → skopiuj _Bot User OAuth Token_ → staje się on `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → dodaj zakres `connections:write` → zapisz → skopiuj wartość `xapp-...` → staje się ona `sutAppToken`.

Sprawdź, czy oba boty mają odrębne identyfikatory użytkowników, wywołując `auth.test` na każdym tokenie. Runtime rozróżnia sterownik i SUT według identyfikatora użytkownika; ponowne użycie jednej aplikacji dla obu spowoduje natychmiastową porażkę mention-gating.

**3. Utwórz kanał**

W obszarze roboczym QA utwórz kanał (np. `#openclaw-qa`) i zaproś oba boty z wnętrza kanału:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Skopiuj identyfikator `Cxxxxxxxxxx` z _channel info → About → Channel ID_ - staje się on `channelId`. Kanał publiczny działa; jeśli użyjesz kanału prywatnego, obie aplikacje już mają `groups:history`, więc odczyty historii przez harness nadal się powiodą.

**4. Zarejestruj dane uwierzytelniające**

Dwie opcje. Użyj zmiennych środowiskowych do debugowania na jednej maszynie (ustaw cztery zmienne `OPENCLAW_QA_SLACK_*` i przekaż `--credential-source env`) albo zasiej współdzieloną pulę Convex, aby CI i inni maintainerzy mogli je dzierżawić.

Dla puli Convex zapisz cztery pola do pliku JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Po wyeksportowaniu `OPENCLAW_QA_CONVEX_SITE_URL` i `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` w swojej powłoce zarejestruj i sprawdź:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Oczekuj `count: 1`, `status: "active"`, bez pola `lease`.

**5. Sprawdź end to end**

Uruchom ścieżkę lokalnie, aby potwierdzić, że oba boty mogą rozmawiać ze sobą przez brokera:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Zielone uruchomienie kończy się znacznie poniżej 30 sekund, a `slack-qa-report.md` pokazuje zarówno `slack-canary`, jak i `slack-mention-gating` ze statusem `pass`. Jeśli ścieżka zawiesza się na około 90 sekund i kończy komunikatem `Convex credential pool exhausted for kind "slack"`, pula jest pusta albo każdy wiersz jest wydzierżawiony - `qa credentials list --kind slack --status all --json` wskaże, która sytuacja zachodzi.

### Pula danych uwierzytelniających Convex

Ścieżki Telegram, Discord i Slack mogą dzierżawić dane uwierzytelniające ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne środowiskowe. Przekaż `--credential-source convex` (albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab pozyskuje wyłączną dzierżawę, wysyła Heartbeat przez czas trwania uruchomienia i zwalnia ją przy zamykaniu. Typy puli to `"telegram"`, `"discord"` i `"slack"`.

Kształty payloadów walidowane przez brokera przy `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` musi być liczbowym ciągiem identyfikatora czatu.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` musi pasować do `^[A-Z][A-Z0-9]+$` (identyfikator Slack taki jak `Cxxxxxxxxxx`). Zobacz [Konfigurowanie obszaru roboczego Slack](#setting-up-the-slack-workspace), aby poznać aprowizację aplikacji i zakresów.

Operacyjne zmienne środowiskowe i kontrakt endpointu brokera Convex znajdują się w [Testowanie → Współdzielone dane uwierzytelniające Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji poprzedza obsługę Discord; semantyka brokera jest identyczna dla obu typów).

## Seedy oparte na repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Są one celowo przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla agenta.

`qa-lab` powinien pozostać generycznym runnerem Markdown. Każdy plik Markdown scenariusza jest źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, możliwości, ścieżki i ryzyka
- odwołania do dokumentacji i kodu
- opcjonalne wymagania dotyczące Pluginu
- opcjonalną poprawkę konfiguracji Gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia runtime, która obsługuje `qa-flow`, może pozostać generyczna i przekrojowa. Na przykład scenariusze Markdown mogą łączyć helpery po stronie transportu z helperami po stronie przeglądarki, które sterują osadzonym Control UI przez szew Gateway `browser.request` bez dodawania runnera dla szczególnego przypadku.

Pliki scenariuszy powinny być grupowane według możliwości produktu, a nie folderu drzewa źródłowego. Zachowuj stabilne identyfikatory scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs` do śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania zwrotne Cron
- przywoływanie pamięci
- przełączanie modeli
- przekazywanie do subagenta
- czytanie repozytorium i dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Ścieżki mocków providerów

`qa suite` ma dwie lokalne ścieżki mocków providerów:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną deterministyczną ścieżką mocków dla QA opartego na repozytorium i bram parytetu.
- `aimock` uruchamia serwer providera oparty na AIMock do eksperymentalnego pokrycia protokołu, fixture, record/replay i chaos. Jest addytywny i nie zastępuje dyspozytora scenariuszy `mock-openai`.

Implementacja ścieżek providerów znajduje się w `extensions/qa-lab/src/providers/`. Każdy provider posiada swoje wartości domyślne, uruchamianie serwera lokalnego, konfigurację modelu Gateway, potrzeby stagingu auth-profile oraz flagi możliwości live/mock. Kod współdzielonego zestawu i Gateway powinien przechodzić przez rejestr providerów zamiast rozgałęziać się po nazwach providerów.

## Adaptery transportu

`qa-lab` odpowiada za ogólną warstwę transportu dla scenariuszy QA w Markdown. `qa-channel` jest pierwszym adapterem w tej warstwie, ale cel projektowy jest szerszy: przyszłe kanały rzeczywiste lub syntetyczne powinny wpinać się w ten sam runner pakietu zamiast dodawać transportowo specyficzny runner QA.

Na poziomie architektury podział wygląda tak:

- `qa-lab` odpowiada za ogólne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- Adapter transportu odpowiada za konfigurację Gateway, gotowość, obserwację ruchu przychodzącego i wychodzącego, akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy Markdown w `qa/scenarios/` definiują uruchomienie testu; `qa-lab` udostępnia wielokrotnego użytku powierzchnię runtime, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA opartego na Markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który sprawdza kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy współdzielony host `qa-lab` może odpowiadać za przepływ.

`qa-lab` odpowiada za współdzieloną mechanikę hosta:

- korzeń poleceń `openclaw qa`
- uruchamianie i sprzątanie pakietu
- współbieżność workerów
- zapisywanie artefaktów
- generowanie raportów
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów odpowiadają za kontrakt transportu:

- sposób montowania `openclaw qa <runner>` pod współdzielonym korzeniem `qa`
- sposób konfiguracji Gateway dla tego transportu
- sposób sprawdzania gotowości
- sposób wstrzykiwania zdarzeń przychodzących
- sposób obserwowania wiadomości wychodzących
- sposób udostępniania transkryptów i znormalizowanego stanu transportu
- sposób wykonywania akcji opartych na transporcie
- sposób obsługi resetu lub sprzątania specyficznego dla transportu

Minimalny próg wdrożenia dla nowego kanału:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonej warstwie hosta `qa-lab`.
3. Trzymaj mechanikę specyficzną dla transportu wewnątrz Pluginu runnera albo harnessu kanału.
4. Montuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie korzenia. Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` jako lekkie; leniwe CLI i wykonywanie runnera powinny pozostać za oddzielnymi punktami wejścia.
5. Utwórz lub dostosuj scenariusze Markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj ogólnych helperów scenariuszy dla nowych scenariuszy.
7. Utrzymuj działanie istniejących aliasów zgodności, chyba że repo wykonuje zamierzoną migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, trzymaj je w tym Pluginie runnera albo harnessie Pluginu.
- Jeśli scenariusz potrzebuje nowej możliwości, z której może korzystać więcej niż jeden kanał, dodaj ogólny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, utrzymaj scenariusz jako specyficzny dla transportu i jasno zaznacz to w kontrakcie scenariusza.

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

`qa-lab` eksportuje raport protokołu w Markdown z obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać inwentarz dostępnych scenariuszy - przydatny przy określaniu zakresu dalszych prac albo podłączaniu nowego transportu - uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać dane wyjściowe czytelne maszynowo).

Do sprawdzania charakteru i stylu uruchom ten sam scenariusz na wielu żywych referencjach modeli
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
powinny ustawiać personę przez `SOUL.md`, a następnie wykonywać zwykłe tury użytkownika,
takie jak czat, pomoc w workspace i małe zadania na plikach. Model kandydujący nie powinien
być informowany, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, zapisuje podstawowe statystyki uruchomienia, a następnie prosi modele sędziowskie w trybie szybkim z
rozumowaniem `xhigh`, tam gdzie jest obsługiwane, o uszeregowanie uruchomień według naturalności, vibe'u i humoru.
Użyj `--blind-judge-models` przy porównywaniu providerów: prompt sędziowski nadal otrzymuje
każdy transkrypt i status uruchomienia, ale referencje kandydatów są zastępowane neutralnymi
etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po
parsowaniu.
Uruchomienia kandydatów domyślnie używają `high` thinking, z `medium` dla GPT-5.5 i `xhigh`
dla starszych referencji ewaluacyjnych OpenAI, które je obsługują. Nadpisz konkretnego kandydata inline za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalny fallback, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu szybkiego, aby wykorzystywać przetwarzanie priorytetowe tam,
gdzie provider je obsługuje. Dodaj `,fast`, `,no-fast` albo `,fast=false` inline, gdy
pojedynczy kandydat lub sędzia potrzebuje nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb szybki dla każdego modelu kandydującego. Czasy trwania kandydatów i sędziów są
zapisywane w raporcie do analizy benchmarków, ale prompty sędziowskie wyraźnie mówią,
aby nie klasyfikować według szybkości.
Uruchomienia modeli kandydatów i sędziów domyślnie używają współbieżności 16. Obniż
`--concurrency` albo `--judge-concurrency`, gdy limity providera albo obciążenie lokalnego Gateway
powodują, że uruchomienie jest zbyt zaszumione.
Gdy nie zostanie przekazany żaden kandydat `--model`, ocena charakteru domyślnie używa
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` i
`google/gemini-3.1-pro-preview`, gdy nie przekazano żadnego `--model`.
Gdy nie zostanie przekazany żaden `--judge-model`, domyślnymi sędziami są
`openai/gpt-5.5,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Matrix QA](/pl/concepts/qa-matrix)
- [QA Channel](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Dashboard](/pl/web/dashboard)
