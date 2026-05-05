---
read_when:
    - Zrozumienie, jak stos QA składa się w całość
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportu
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Tworzenie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, aktywne ścieżki transportu, adaptery transportu i raportowanie.'
title: Przegląd QA
x-i18n:
    generated_at: "2026-05-05T06:17:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma testować OpenClaw w bardziej realistyczny sposób,
odwzorowujący kanały, niż pozwala na to pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących oraz eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe pluginy runnera: adaptery transportu live, które
  sterują prawdziwym kanałem wewnątrz podrzędnego QA Gateway.
- `qa/`: zasoby startowe oparte na repozytorium dla zadania inicjującego i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja live przed i po dla błędów, które
  wymagają prawdziwych transportów, zrzutów ekranu z przeglądarki, stanu maszyny wirtualnej i dowodów PR.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele z nich ma aliasy skryptów `pnpm qa:*`;
obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Wbudowany autotest QA; zapisuje raport Markdown.                                                                                                                                             |
| `qa suite`                                          | Uruchamia scenariusze oparte na repozytorium względem pasa QA Gateway. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej maszyny VM z Linuksem.                          |
| `qa coverage`                                       | Wypisuje inwentarz pokrycia scenariuszy w markdownie (`--json` dla danych wyjściowych dla maszyn).                                                                                           |
| `qa parity-report`                                  | Porównuje dwa pliki `qa-suite-summary.json` i zapisuje agentowy raport parytetu.                                                                                                             |
| `qa character-eval`                                 | Uruchamia scenariusz QA charakteru na wielu modelach live z ocenionym raportem. Zobacz [Raportowanie](#reporting).                                                                          |
| `qa manual`                                         | Uruchamia jednorazowy prompt względem wybranego pasa dostawcy/modelu.                                                                                                                       |
| `qa ui`                                             | Uruchamia interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                                          |
| `qa docker-build-image`                             | Buduje wstępnie przygotowany obraz Docker QA.                                                                                                                                                |
| `qa docker-scaffold`                                | Zapisuje szkielet docker-compose dla dashboardu QA + pasa Gateway.                                                                                                                           |
| `qa up`                                             | Buduje witrynę QA, uruchamia stos oparty na Dockerze, wypisuje URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                 |
| `qa aimock`                                         | Uruchamia tylko serwer dostawcy AIMock.                                                                                                                                                      |
| `qa mock-openai`                                    | Uruchamia tylko świadomy scenariuszy serwer dostawcy `mock-openai`.                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządza współdzieloną pulą danych uwierzytelniających Convex.                                                                                                                               |
| `qa matrix`                                         | Pas transportu live względem jednorazowego homeservera Tuwunel. Zobacz [Matrix QA](/pl/concepts/qa-matrix).                                                                                     |
| `qa telegram`                                       | Pas transportu live względem prawdziwej prywatnej grupy Telegram.                                                                                                                            |
| `qa discord`                                        | Pas transportu live względem prawdziwego prywatnego kanału gildii Discord.                                                                                                                   |
| `qa slack`                                          | Pas transportu live względem prawdziwego prywatnego kanału Slack.                                                                                                                            |
| `qa mantis`                                         | Runner weryfikacji przed i po dla błędów transportu live, z dowodami reakcji statusu Discord, smoke Crabbox na pulpicie/przeglądarce oraz smoke Slack w VNC. Zobacz [Mantis](/pl/concepts/mantis). |

## Przepływ operatora

Obecny przepływ operatora QA to dwupanelowa witryna QA:

- Lewo: dashboard Gateway (Control UI) z agentem.
- Prawo: QA Lab, pokazujący transkrypt w stylu Slacka i plan scenariusza.

Uruchom go poleceniem:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia pas Gateway oparty na Dockerze i udostępnia
stronę QA Lab, gdzie operator lub pętla automatyzacji może przekazać agentowi
misję QA, obserwować prawdziwe zachowanie kanału i zapisać, co zadziałało, co się nie powiodło lub
pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez każdorazowego przebudowywania obrazu Docker,
uruchom stos z podmontowanym pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i montuje
`extensions/qa-lab/web/dist` w kontenerze `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet przy zmianach, a przeglądarka automatycznie przeładowuje się, gdy zmieni się hash zasobów QA Lab.

Aby wykonać lokalny smoke trace OpenTelemetry, uruchom:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik trace OTLP/HTTP, uruchamia scenariusz QA
`otel-trace-smoke` z włączonym pluginem `diagnostics-otel`, a następnie
dekoduje wyeksportowane spany protobuf i sprawdza krytyczny dla wydania kształt:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` i `openclaw.message.delivery` muszą być obecne;
wywołania modelu nie mogą eksportować `StreamAbandoned` w udanych turach; surowe identyfikatory diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza trace. Skrypt zapisuje
`otel-smoke-summary.json` obok artefaktów pakietu QA.

QA obserwowalności pozostaje dostępne tylko z checkoutu źródeł. Tarball npm celowo pomija
QA Lab, więc pasy wydania pakietu Docker nie uruchamiają poleceń `qa`. Użyj
`pnpm qa:otel:smoke` ze zbudowanego checkoutu źródeł podczas zmiany instrumentacji diagnostycznej.

Aby uruchomić pas smoke Matrix z prawdziwym transportem, wykonaj:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Pełna referencja CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ artefaktów dla tego pasa znajdują się w [Matrix QA](/pl/concepts/qa-matrix). W skrócie: provisionuje jednorazowy homeserver Tuwunel w Dockerze, rejestruje tymczasowych użytkowników driver/SUT/observer, uruchamia prawdziwy plugin Matrix wewnątrz podrzędnego QA Gateway ograniczonego do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt zaobserwowanych zdarzeń i połączony dziennik wyjściowy w `.artifacts/qa-e2e/matrix-<timestamp>/`.

Dla pasów smoke z prawdziwym transportem Telegram, Discord i Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Celują one w istniejący wcześniej prawdziwy kanał z dwoma botami (driver + SUT). Wymagane zmienne środowiskowe, listy scenariuszy, artefakty wyjściowe i pula danych uwierzytelniających Convex są udokumentowane w [referencji QA dla Telegram, Discord i Slack](#telegram-discord-and-slack-qa-reference) poniżej.

Aby uruchomić pełny przebieg VM pulpitu Slack z ratunkowym VNC, wykonaj:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

To polecenie dzierżawi maszynę Crabbox desktop/browser, uruchamia pas Slack live
wewnątrz VM, otwiera Slack Web w przeglądarce VNC, przechwytuje pulpit oraz
kopiuje `slack-qa/`, `slack-desktop-smoke.png` i `slack-desktop-smoke.mp4`,
gdy przechwytywanie wideo jest dostępne, z powrotem do katalogu artefaktów Mantis. Użyj ponownie `--lease-id <cbx_...>` po ręcznym zalogowaniu się do Slack Web
przez VNC. Z `--gateway-setup` Mantis pozostawia trwały OpenClaw Slack
Gateway działający wewnątrz VM na porcie `38973`; bez tej opcji polecenie uruchamia
normalny pas QA Slack bot-do-bota i kończy działanie po przechwyceniu artefaktów.

Aby uruchomić zadanie pulpitu w stylu agent/CV, wykonaj:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` dzierżawi lub używa ponownie maszyny Crabbox desktop/browser, uruchamia
`crabbox record --while`, steruje widoczną przeglądarką przez zagnieżdżony
`visual-driver`, przechwytuje `visual-task.png`, uruchamia `openclaw infer image describe`
względem zrzutu ekranu, gdy wybrano `--vision-mode image-describe`, oraz
zapisuje `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` i `mantis-visual-task-report.md`.
Gdy ustawiono `--expect-text`, prompt wizyjny prosi o ustrukturyzowany werdykt JSON
i przechodzi tylko wtedy, gdy model zgłasza pozytywny widoczny dowód; odpowiedź
negatywna, która jedynie cytuje tekst docelowy, powoduje niepowodzenie asercji.
Użyj `--vision-mode metadata` dla smoke bez modelu, który potwierdza działanie pulpitu,
przeglądarki, zrzutu ekranu i infrastruktury wideo bez wywoływania dostawcy
rozumienia obrazu. Nagranie jest wymaganym artefaktem dla `visual-task`; jeśli Crabbox nie nagra
niepustego `visual-task.mp4`, zadanie kończy się niepowodzeniem, nawet jeśli visual driver
przeszedł. W razie niepowodzenia Mantis zachowuje dzierżawę dla VNC, chyba że zadanie już
przeszło i nie ustawiono `--keep-lease`.

Przed użyciem połączonych danych uwierzytelniających live uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza środowisko brokera Convex, weryfikuje ustawienia endpointu i potwierdza osiągalność admin/list, gdy obecny jest sekret maintainer. Raportuje tylko status ustawione/brakujące dla sekretów.

## Pokrycie transportu live

Pasy transportu live współdzielą jeden kontrakt zamiast wymyślać osobny kształt listy scenariuszy dla każdego z nich. `qa-channel` jest szerokim syntetycznym zestawem zachowań produktowych i nie należy do macierzy pokrycia transportu live.

| Tor     | Canary | Bramkowanie wzmianką | Bot-do-bota | Blokada listy dozwolonych | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Natywna rejestracja poleceń |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Dzięki temu `qa-channel` pozostaje szerokim zestawem testów zachowania produktu, a Matrix,
Telegram i przyszłe transporty live współdzielą jedną jawną listę kontrolną
kontraktu transportu.

Aby uruchomić jednorazowy tor maszyny wirtualnej Linux bez wprowadzania Dockera do ścieżki QA, uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje standardowy raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia zestawu na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami Gateway. `qa-channel` domyślnie używa współbieżności
4, ograniczonej liczbą wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, albo `--concurrency 1` dla wykonania szeregowego.
Polecenie kończy się kodem niezerowym, gdy dowolny scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez kończenia polecenia kodem błędu.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz
`CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowany workspace.

## Dokumentacja referencyjna QA dla Telegram, Discord i Slack

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) ze względu na liczbę scenariuszy i provisionowanie homeservera oparte na Dockerze. Telegram, Discord i Slack są mniejsze — po kilka scenariuszy każdy, bez systemu profili, względem istniejących wcześniej rzeczywistych kanałów — dlatego ich dokumentacja referencyjna znajduje się tutaj.

### Wspólne flagi CLI

Te tory rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                  | Domyślnie                                                        | Opis                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Uruchom tylko ten scenariusz. Można powtarzać.                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Miejsce zapisu raportów/podsumowania/zaobserwowanych wiadomości oraz dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Katalog główny repozytorium przy wywołaniu z neutralnego cwd.                                                         |
| `--sut-account <id>`                  | `sut`                                                           | Tymczasowy identyfikator konta w konfiguracji QA Gateway.                                                             |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` lub `live-frontier` (starsze `live-openai` nadal działa).                                               |
| `--model <ref>` / `--alt-model <ref>` | domyślny dostawcy                                               | Referencje modelu podstawowego/alternatywnego.                                                                        |
| `--fast`                              | wyłączone                                                       | Tryb szybki dostawcy, tam gdzie jest obsługiwany.                                                                     |
| `--credential-source <env\|convex>`   | `env`                                                           | Zobacz [pulę poświadczeń Convex](#convex-credential-pool).                                                            |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`                      | Rola używana, gdy `--credential-source convex`.                                                                       |

Każdy tor kończy się kodem niezerowym przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania kodu błędu.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną rzeczywistą prywatną grupę Telegram z dwoma odrębnymi botami (driver + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-do-bota działa najlepiej, gdy oba boty mają włączony **Bot-to-Bot Communication Mode** w `@BotFather`.

Wymagane env przy `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numeryczny identyfikator czatu (ciąg znaków).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opcjonalne:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości (domyślnie redagowane).

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
- `telegram-qa-summary.json` — zawiera RTT dla każdej odpowiedzi (wysłanie przez driver → zaobserwowana odpowiedź SUT), zaczynając od canary.
- `telegram-qa-observed-messages.json` — treści redagowane, chyba że ustawiono `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Celuje w jeden rzeczywisty prywatny kanał gildii Discord z dwoma botami: botem driver kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny OpenClaw Gateway przez dołączony Plugin Discord. Weryfikuje obsługę wzmianek na kanale, to, że bot SUT zarejestrował natywne polecenie `/help` w Discord, oraz opcjonalne scenariusze dowodowe Mantis.

Wymagane env przy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — musi odpowiadać identyfikatorowi użytkownika bota SUT zwróconemu przez Discord (w przeciwnym razie tor szybko kończy się błędem).

Opcjonalne:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opcjonalny scenariusz Mantis. Działa samodzielnie, ponieważ przełącza SUT na zawsze włączone odpowiedzi gildii wyłącznie przez narzędzia z `messages.statusReactions.enabled=true`, a następnie przechwytuje oś czasu reakcji REST oraz artefakty wizualne HTML/PNG. Raporty Mantis przed/po zachowują także dostarczone przez scenariusz artefakty MP4 jako `baseline.mp4` i `candidate.mp4`.

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
- `discord-qa-observed-messages.json` — treści redagowane, chyba że ustawiono `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` i `discord-status-reactions-tool-only-timeline.png`, gdy uruchamiany jest scenariusz reakcji statusu.

### QA Slack

```bash
pnpm openclaw qa slack
```

Celuje w jeden rzeczywisty prywatny kanał Slack z dwoma odrębnymi botami: botem driver kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny OpenClaw Gateway przez dołączony Plugin Slack.

Wymagane env przy `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcjonalne:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artefakty wyjściowe:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — treści redagowane, chyba że ustawiono `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Konfigurowanie workspace Slack

Tor wymaga dwóch odrębnych aplikacji Slack w jednym workspace oraz kanału, którego członkami są oba boty:

- `channelId` — identyfikator `Cxxxxxxxxxx` kanału, do którego zaproszono oba boty. Użyj dedykowanego kanału; tor publikuje przy każdym uruchomieniu.
- `driverBotToken` — token bota (`xoxb-...`) aplikacji **Driver**.
- `sutBotToken` — token bota (`xoxb-...`) aplikacji **SUT**, która musi być oddzielną aplikacją Slack od drivera, aby jej identyfikator użytkownika bota był odrębny.
- `sutAppToken` — token na poziomie aplikacji (`xapp-...`) aplikacji SUT z `connections:write`, używany przez Socket Mode, aby aplikacja SUT mogła odbierać zdarzenia.

Preferuj workspace Slack dedykowany do QA zamiast ponownego używania workspace produkcyjnego.

Poniższy manifest SUT odzwierciedla instalację produkcyjną dołączonego Plugin Slack (`extensions/slack/src/setup-shared.ts:10`). Konfigurację kanału produkcyjnego widzianą przez użytkowników opisuje [szybka konfiguracja kanału Slack](/pl/channels/slack#quick-setup); para QA Driver/SUT jest celowo oddzielna, ponieważ tor wymaga dwóch odrębnych identyfikatorów użytkowników botów w jednym workspace.

**1. Utwórz aplikację Driver**

Przejdź do [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → wybierz workspace QA, wklej poniższy manifest, a następnie _Install to Workspace_:

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

Skopiuj _Bot User OAuth Token_ (`xoxb-...`) — stanie się on `driverBotToken`. Driver musi tylko publikować wiadomości i identyfikować siebie; bez zdarzeń, bez Socket Mode.

**2. Utwórz aplikację SUT**

Powtórz _Create New App → From a manifest_ w tym samym workspace. Zestaw zakresów odzwierciedla instalację produkcyjną dołączonego Plugin Slack (`extensions/slack/src/setup-shared.ts:10`):

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
        "reactions:read",
        "reactions:write",
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
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Gdy Slack utworzy aplikację, wykonaj dwie czynności na jej stronie ustawień:

- _Install to Workspace_ → skopiuj _Bot User OAuth Token_ → to stanie się `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → dodaj zakres `connections:write` → zapisz → skopiuj wartość `xapp-...` → to stanie się `sutAppToken`.

Sprawdź, czy oba boty mają różne identyfikatory użytkownika, wywołując `auth.test` dla każdego tokenu. Środowisko uruchomieniowe odróżnia sterownik od SUT po identyfikatorze użytkownika; ponowne użycie jednej aplikacji dla obu spowoduje natychmiastową awarię bramkowania wzmianek.

**3. Utwórz kanał**

W obszarze roboczym QA utwórz kanał (np. `#openclaw-qa`) i zaproś oba boty z poziomu kanału:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Skopiuj identyfikator `Cxxxxxxxxxx` z _informacje o kanale → Informacje → Identyfikator kanału_ — to stanie się `channelId`. Kanał publiczny działa; jeśli użyjesz kanału prywatnego, obie aplikacje mają już `groups:history`, więc odczyty historii przez harness nadal się powiodą.

**4. Zarejestruj dane uwierzytelniające**

Dwie opcje. Użyj zmiennych środowiskowych do debugowania na jednej maszynie (ustaw cztery zmienne `OPENCLAW_QA_SLACK_*` i przekaż `--credential-source env`) albo zasiej współdzieloną pulę Convex, aby CI i inni opiekunowie mogli je dzierżawić.

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

Uruchom pas lokalnie, aby potwierdzić, że oba boty mogą komunikować się ze sobą przez broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Zielony przebieg kończy się znacznie poniżej 30 sekund, a `slack-qa-report.md` pokazuje zarówno `slack-canary`, jak i `slack-mention-gating` ze statusem `pass`. Jeśli pas zawiesza się na około 90 sekund i kończy z `Convex credential pool exhausted for kind "slack"`, pula jest pusta albo każdy wiersz jest dzierżawiony — `qa credentials list --kind slack --status all --json` pokaże, która sytuacja ma miejsce.

### Pula danych uwierzytelniających Convex

Pasy Telegram, Discord i Slack mogą dzierżawić dane uwierzytelniające ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne środowiskowe. Przekaż `--credential-source convex` (albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab uzyskuje wyłączną dzierżawę, wysyła dla niej Heartbeat przez czas trwania przebiegu i zwalnia ją przy zamykaniu. Rodzaje puli to `"telegram"`, `"discord"` i `"slack"`.

Kształty ładunku weryfikowane przez broker przy `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` musi być liczbowym ciągiem identyfikatora czatu.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` musi pasować do `^[A-Z][A-Z0-9]+$` (identyfikator Slack taki jak `Cxxxxxxxxxx`). Zobacz [Konfigurowanie obszaru roboczego Slack](#setting-up-the-slack-workspace), aby przygotować aplikację i zakresy.

Operacyjne zmienne środowiskowe i kontrakt punktu końcowego brokera Convex znajdują się w [Testowanie → Współdzielone dane uwierzytelniające Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji pochodzi sprzed obsługi Discord; semantyka brokera jest identyczna dla obu rodzajów).

## Ziarna wspierane przez repozytorium

Zasoby ziarna znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Są one celowo przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla agenta.

`qa-lab` powinien pozostać generycznym runnerem Markdown. Każdy plik scenariusza Markdown jest źródłem prawdy dla jednego przebiegu testowego i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, możliwości, pasa i ryzyka
- odwołania do dokumentacji i kodu
- opcjonalne wymagania dotyczące pluginów
- opcjonalną łatkę konfiguracji Gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia środowiska uruchomieniowego, która obsługuje `qa-flow`, może pozostać generyczna i przekrojowa. Na przykład scenariusze Markdown mogą łączyć helpery po stronie transportu z helperami po stronie przeglądarki, które sterują osadzonym Control UI przez szew Gateway `browser.request` bez dodawania runnera dla szczególnego przypadku.

Pliki scenariuszy powinny być grupowane według możliwości produktu, a nie folderu drzewa źródeł. Zachowuj stabilne identyfikatory scenariuszy podczas przenoszenia plików; używaj `docsRefs` i `codeRefs` dla śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania zwrotne cron
- przywoływanie pamięci
- przełączanie modeli
- przekazywanie do podagenta
- odczytywanie repozytorium i dokumentacji
- jedno małe zadanie kompilacji, takie jak Lobster Invaders

## Pasy mocków dostawcy

`qa suite` ma dwa lokalne pasy mocków dostawcy:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślnym deterministycznym pasem mocków dla QA wspieranego przez repozytorium i bramek parytetu.
- `aimock` uruchamia serwer dostawcy oparty na AIMock do eksperymentalnego pokrycia protokołu, fixture, nagrywania/odtwarzania i chaosu. Jest dodatkiem i nie zastępuje dyspozytora scenariuszy `mock-openai`.

Implementacja pasa dostawcy znajduje się w `extensions/qa-lab/src/providers/`. Każdy dostawca posiada własne wartości domyślne, uruchamianie lokalnego serwera, konfigurację modelu Gateway, potrzeby przygotowania profilu uwierzytelniania oraz flagi możliwości live/mock. Wspólny kod suite i Gateway powinien przechodzić przez rejestr dostawców zamiast rozgałęziać się po nazwach dostawców.

## Adaptery transportu

`qa-lab` posiada generyczny szew transportu dla scenariuszy QA Markdown. `qa-channel` jest pierwszym adapterem na tym szwie, ale cel projektowy jest szerszy: przyszłe rzeczywiste lub syntetyczne kanały powinny podłączać się do tego samego runnera suite zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział jest następujący:

- `qa-lab` posiada generyczne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- Adapter transportu posiada konfigurację Gateway, gotowość, obserwację przychodzącą i wychodzącą, akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy Markdown w `qa/scenarios/` definiują przebieg testu; `qa-lab` udostępnia wielokrotnego użytku powierzchnię środowiska uruchomieniowego, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA Markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który ćwiczy kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy współdzielony host `qa-lab` może posiadać ten przepływ.

`qa-lab` posiada współdzielone mechanizmy hosta:

- korzeń poleceń `openclaw qa`
- uruchamianie i zamykanie suite
- współbieżność workerów
- zapisywanie artefaktów
- generowanie raportu
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnera posiadają kontrakt transportu:

- jak `openclaw qa <runner>` jest montowane pod współdzielonym korzeniem `qa`
- jak Gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak eksponowane są transkrypty i znormalizowany stan transportu
- jak wykonywane są akcje oparte na transporcie
- jak obsługiwane jest resetowanie lub sprzątanie specyficzne dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym szwie hosta `qa-lab`.
3. Trzymaj mechanikę specyficzną dla transportu wewnątrz pluginu runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie korzenia. Pluginy runnera powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` lekki; leniwe wykonywanie CLI i runnera powinno pozostać za osobnymi punktami wejścia.
5. Utwórz lub dostosuj scenariusze Markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj generycznych helperów scenariuszy dla nowych scenariuszy.
7. Zachowaj działanie istniejących aliasów zgodności, chyba że repozytorium wykonuje celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, trzymaj je w tym pluginie runnera lub harnessie pluginu.
- Jeśli scenariusz potrzebuje nowej możliwości, której może użyć więcej niż jeden kanał, dodaj generyczny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla transportu i jasno określ to w kontrakcie scenariusza.

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ale tworzenie nowych scenariuszy powinno używać nazw generycznych. Aliasy istnieją po to, aby uniknąć migracji typu flag day, a nie jako model na przyszłość.

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z obserwowanej osi czasu bus.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać spis dostępnych scenariuszy — przydatny przy szacowaniu pracy uzupełniającej lub podłączaniu nowego transportu — uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać wyjście do odczytu maszynowego).

Na potrzeby sprawdzania charakteru i stylu uruchom ten sam scenariusz dla wielu referencji modeli live i zapisz oceniony raport Markdown:

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

Polecenie uruchamia lokalne procesy potomne Gateway QA, a nie Docker. Scenariusze ewaluacji charakteru powinny ustawiać personę przez `SOUL.md`, a następnie uruchamiać zwykłe tury użytkownika, takie jak czat, pomoc w obszarze roboczym i małe zadania na plikach. Model kandydujący nie powinien być informowany, że jest oceniany. Polecenie zachowuje każdy pełny transkrypt, zapisuje podstawowe statystyki uruchomienia, a następnie prosi modele oceniające w trybie szybkim, z rozumowaniem `xhigh` tam, gdzie jest obsługiwane, o uszeregowanie uruchomień według naturalności, klimatu i humoru.
Użyj `--blind-judge-models` podczas porównywania dostawców: prompt oceniający nadal otrzymuje każdy transkrypt i status uruchomienia, ale referencje kandydatów są zastępowane neutralnymi etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po parsowaniu.
Uruchomienia kandydatów domyślnie używają poziomu myślenia `high`, z `medium` dla GPT-5.5 i `xhigh` dla starszych referencji ewaluacyjnych OpenAI, które go obsługują. Nadpisz konkretnego kandydata w linii poleceniem `--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia globalną wartość awaryjną, a starsza forma `--model-thinking <provider/model=level>` jest zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu szybkiego, aby priorytetowe przetwarzanie było używane tam, gdzie dostawca je obsługuje. Dodaj w linii `,fast`, `,no-fast` lub `,fast=false`, gdy pojedynczy kandydat lub model oceniający wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz wymusić tryb szybki dla każdego modelu kandydującego. Czasy trwania kandydatów i modeli oceniających są zapisywane w raporcie do analizy benchmarków, ale prompty oceniające wyraźnie mówią, aby nie tworzyć rankingu według szybkości.
Uruchomienia modeli kandydatów i modeli oceniających domyślnie używają współbieżności 16. Zmniejsz `--concurrency` lub `--judge-concurrency`, gdy limity dostawcy lub obciążenie lokalnego Gateway sprawiają, że uruchomienie jest zbyt zaszumione.
Gdy nie przekazano żadnego kandydata `--model`, ewaluacja charakteru domyślnie używa `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` oraz `google/gemini-3.1-pro-preview`, gdy nie przekazano żadnego `--model`.
Gdy nie przekazano `--judge-model`, modele oceniające domyślnie używają `openai/gpt-5.5,thinking=xhigh,fast` oraz `anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Macierz QA](/pl/concepts/qa-matrix)
- [Kanał QA](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Panel](/pl/web/dashboard)
