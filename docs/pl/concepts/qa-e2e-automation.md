---
read_when:
    - Zrozumienie, jak stos QA składa się w całość
    - Rozszerzanie qa-lab, qa-channel lub adaptera transportu
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Tworzenie bardziej realistycznej automatyzacji QA dla panelu Gateway
summary: 'Przegląd stosu QA: qa-lab, qa-channel, scenariusze oparte na repozytorium, ścieżki transportowe na żywo, adaptery transportu i raportowanie.'
title: Omówienie QA
x-i18n:
    generated_at: "2026-05-05T01:45:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Prywatny stos QA ma testować OpenClaw w bardziej realistyczny,
kanałowy sposób niż pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami wiadomości prywatnych, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkrypcji,
  wstrzykiwania wiadomości przychodzących oraz eksportowania raportu Markdown.
- `extensions/qa-matrix`, przyszłe Pluginy uruchamiające: adaptery transportu na żywo, które
  sterują prawdziwym kanałem wewnątrz podrzędnego Gateway QA.
- `qa/`: zasoby początkowe przechowywane w repozytorium dla zadania startowego i bazowych
  scenariuszy QA.
- [Mantis](/pl/concepts/mantis): weryfikacja przed i po na żywo dla błędów, które
  wymagają prawdziwych transportów, zrzutów ekranu przeglądarki, stanu maszyny wirtualnej i dowodów PR.

## Powierzchnia poleceń

Każdy przepływ QA działa pod `pnpm openclaw qa <subcommand>`. Wiele z nich ma aliasy skryptów `pnpm qa:*`;
obsługiwane są obie formy.

| Polecenie                                           | Cel                                                                                                                                                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Wbudowany autotest QA; zapisuje raport Markdown.                                                                                                                                             |
| `qa suite`                                          | Uruchom scenariusze z repozytorium wobec ścieżki Gateway QA. Aliasy: `pnpm openclaw qa suite --runner multipass` dla jednorazowej maszyny wirtualnej Linux.                                  |
| `qa coverage`                                       | Wypisz inwentarz pokrycia scenariuszy w formacie markdown (`--json` dla wyjścia maszynowego).                                                                                                |
| `qa parity-report`                                  | Porównaj dwa pliki `qa-suite-summary.json` i zapisz agentowy raport parytetu.                                                                                                                |
| `qa character-eval`                                 | Uruchom scenariusz QA postaci na wielu modelach na żywo z ocenianym raportem. Zobacz [Raportowanie](#reporting).                                                                             |
| `qa manual`                                         | Uruchom jednorazowy prompt wobec wybranej ścieżki dostawcy/modelu.                                                                                                                           |
| `qa ui`                                             | Uruchom interfejs debuggera QA i lokalną magistralę QA (alias: `pnpm qa:lab:ui`).                                                                                                             |
| `qa docker-build-image`                             | Zbuduj gotowy obraz Docker QA.                                                                                                                                                               |
| `qa docker-scaffold`                                | Zapisz szkielet docker-compose dla panelu QA + ścieżki Gateway.                                                                                                                              |
| `qa up`                                             | Zbuduj witrynę QA, uruchom stos oparty na Dockerze, wypisz URL (alias: `pnpm qa:lab:up`; wariant `:fast` dodaje `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                      |
| `qa aimock`                                         | Uruchom tylko serwer dostawcy AIMock.                                                                                                                                                        |
| `qa mock-openai`                                    | Uruchom tylko świadomy scenariuszy serwer dostawcy `mock-openai`.                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Zarządzaj współdzieloną pulą poświadczeń Convex.                                                                                                                                             |
| `qa matrix`                                         | Ścieżka transportu na żywo wobec jednorazowego serwera domowego Tuwunel. Zobacz [QA Matrix](/pl/concepts/qa-matrix).                                                                            |
| `qa telegram`                                       | Ścieżka transportu na żywo wobec prawdziwej prywatnej grupy Telegram.                                                                                                                        |
| `qa discord`                                        | Ścieżka transportu na żywo wobec prawdziwego prywatnego kanału gildii Discord.                                                                                                               |
| `qa slack`                                          | Ścieżka transportu na żywo wobec prawdziwego prywatnego kanału Slack.                                                                                                                        |
| `qa mantis`                                         | Runner weryfikacji przed i po dla błędów transportu na żywo, z dowodami reakcji statusu Discord, smoke testem pulpitu/przeglądarki Crabbox i smoke testem Slack w VNC. Zobacz [Mantis](/pl/concepts/mantis). |

## Przepływ operatora

Obecny przepływ operatora QA to dwupanelowa witryna QA:

- Lewy: panel Gateway (Control UI) z agentem.
- Prawy: QA Lab, pokazujący transkrypcję w stylu Slacka i plan scenariusza.

Uruchom go poleceniem:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia ścieżkę Gateway opartą na Dockerze i udostępnia
stronę QA Lab, gdzie operator lub pętla automatyzacji może dać agentowi
misję QA, obserwować prawdziwe zachowanie kanału oraz zapisać, co zadziałało, zawiodło lub
pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez każdorazowego przebudowywania obrazu Docker,
uruchom stos z podmontowanym pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wcześniej zbudowanym obrazie i podmontowuje
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet po zmianie, a przeglądarka automatycznie przeładowuje się, gdy zmieni się hash
zasobu QA Lab.

Aby uruchomić lokalny smoke test śladu OpenTelemetry, wykonaj:

```bash
pnpm qa:otel:smoke
```

Ten skrypt uruchamia lokalny odbiornik śladów OTLP/HTTP, uruchamia
scenariusz QA `otel-trace-smoke` z włączonym Pluginem `diagnostics-otel`, następnie
dekoduje wyeksportowane spany protobuf i sprawdza kształt krytyczny dla wydania:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` oraz `openclaw.message.delivery` muszą być obecne;
wywołania modelu nie mogą eksportować `StreamAbandoned` w udanych turach; surowe identyfikatory diagnostyczne i
atrybuty `openclaw.content.*` muszą pozostać poza śladem. Zapisuje
`otel-smoke-summary.json` obok artefaktów pakietu QA.

QA obserwowalności pozostaje dostępne tylko z checkoutu źródeł. Paczka npm celowo pomija
QA Lab, więc ścieżki wydania pakietu Docker nie uruchamiają poleceń `qa`. Użyj
`pnpm qa:otel:smoke` ze zbudowanego checkoutu źródeł przy zmianie instrumentacji
diagnostycznej.

Dla ścieżki smoke Matrix z prawdziwym transportem uruchom:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Pełna referencja CLI, katalog profili/scenariuszy, zmienne środowiskowe i układ artefaktów dla tej ścieżki znajdują się w [QA Matrix](/pl/concepts/qa-matrix). W skrócie: tworzy jednorazowy serwer domowy Tuwunel w Dockerze, rejestruje tymczasowych użytkowników driver/SUT/observer, uruchamia prawdziwy Plugin Matrix wewnątrz podrzędnego Gateway QA ograniczonego do tego transportu (bez `qa-channel`), a następnie zapisuje raport Markdown, podsumowanie JSON, artefakt obserwowanych zdarzeń oraz połączony log wyjścia w `.artifacts/qa-e2e/matrix-<timestamp>/`.

Dla ścieżek smoke Telegram, Discord i Slack z prawdziwym transportem:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Celują one w istniejący wcześniej prawdziwy kanał z dwoma botami (driver + SUT). Wymagane zmienne środowiskowe, listy scenariuszy, artefakty wyjściowe i pula poświadczeń Convex są udokumentowane poniżej w [referencji QA Telegram, Discord i Slack](#telegram-discord-and-slack-qa-reference).

Dla pełnego uruchomienia maszyny wirtualnej pulpitu Slack z ratunkowym VNC uruchom:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

To polecenie dzierżawi maszynę Crabbox z pulpitem/przeglądarką, uruchamia ścieżkę Slack na żywo
wewnątrz maszyny wirtualnej, otwiera Slack Web w przeglądarce VNC, przechwytuje pulpit i
kopiuje `slack-qa/` oraz `slack-desktop-smoke.png` z powrotem do katalogu artefaktów
Mantis. Użyj ponownie `--lease-id <cbx_...>` po ręcznym zalogowaniu się do Slack Web
przez VNC. Z `--gateway-setup` Mantis pozostawia trwały Gateway OpenClaw Slack
działający wewnątrz maszyny wirtualnej na porcie `38973`; bez tej opcji polecenie uruchamia
zwykłą ścieżkę QA Slack bot-do-bota i kończy działanie po przechwyceniu artefaktów.

Przed użyciem współdzielonych poświadczeń na żywo uruchom:

```bash
pnpm openclaw qa credentials doctor
```

Doctor sprawdza środowisko brokera Convex, weryfikuje ustawienia endpointów i sprawdza osiągalność admin/list, gdy obecny jest sekret utrzymaniowy. Raportuje tylko status ustawione/brakujące dla sekretów.

## Pokrycie transportu na żywo

Ścieżki transportu na żywo współdzielą jeden kontrakt, zamiast każda wymyślać własny kształt listy scenariuszy. `qa-channel` jest szerokim syntetycznym pakietem zachowań produktu i nie jest częścią macierzy pokrycia transportu na żywo.

| Ścieżka  | Canary | Bramkowanie wzmianką | Bot-do-bota | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy | Rejestracja polecenia natywnego |
| -------- | ------ | -------------------- | ----------- | ----------------- | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | ---------------- | ------------------------------ |
| Matrix   | x      | x                    | x           | x                 | x                             | x                       | x                 | x              | x                  |                  |                                |
| Telegram | x      | x                    | x           |                   |                               |                         |                   |                |                    | x                |                                |
| Discord  | x      | x                    | x           |                   |                               |                         |                   |                |                    |                  | x                              |
| Slack    | x      | x                    | x           |                   |                               |                         |                   |                |                    |                  |                                |

To utrzymuje `qa-channel` jako szeroki pakiet zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe transporty na żywo współdzielą jedną jawną listę kontrolną
kontraktu transportu.

Dla jednorazowej ścieżki maszyny wirtualnej Linux bez wprowadzania Dockera do ścieżki QA uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje standardowy raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Wykorzystuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia pakietów testów na hoście i w Multipass domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami gateway. `qa-channel` domyślnie używa współbieżności
4, ograniczonej liczbą wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, albo `--concurrency 1` do wykonania szeregowego.
Polecenie kończy się kodem różnym od zera, gdy jakikolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez błędnego kodu wyjścia.
Uruchomienia live przekazują obsługiwane dane uwierzytelniające QA, które są praktyczne dla
gościa: klucze providerów oparte na env, ścieżkę konfiguracji providera QA live oraz
`CODEX_HOME`, gdy jest obecne. Trzymaj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowany workspace.

## Dokumentacja referencyjna QA dla Telegram, Discord i Slack

Matrix ma [dedykowaną stronę](/pl/concepts/qa-matrix) ze względu na liczbę scenariuszy i provisionowanie homeservera oparte na Dockerze. Telegram, Discord i Slack są mniejsze — po kilka scenariuszy każdy, bez systemu profili, względem istniejących wcześniej rzeczywistych kanałów — więc ich dokumentacja referencyjna znajduje się tutaj.

### Wspólne flagi CLI

Te ścieżki rejestrują się przez `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` i akceptują te same flagi:

| Flaga                                 | Domyślna wartość                                               | Opis                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Uruchom tylko ten scenariusz. Powtarzalna.                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Miejsce zapisu raportów/podsumowania/zaobserwowanych wiadomości i logu wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Katalog główny repozytorium podczas wywoływania z neutralnego cwd.                                                    |
| `--sut-account <id>`                  | `sut`                                                           | Tymczasowy identyfikator konta w konfiguracji gateway QA.                                                             |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` albo `live-frontier` (starsze `live-openai` nadal działa).                                              |
| `--model <ref>` / `--alt-model <ref>` | domyślna wartość providera                                      | Referencje modelu podstawowego/alternatywnego.                                                                        |
| `--fast`                              | wyłączone                                                       | Szybki tryb providera tam, gdzie jest obsługiwany.                                                                    |
| `--credential-source <env\|convex>`   | `env`                                                           | Zobacz [pulę poświadczeń Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` w CI, w przeciwnym razie `maintainer`                      | Rola używana, gdy `--credential-source convex`.                                                                       |

Każda ścieżka kończy się kodem różnym od zera przy dowolnym nieudanym scenariuszu. `--allow-failures` zapisuje artefakty bez ustawiania błędnego kodu wyjścia.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Celuje w jedną rzeczywistą prywatną grupę Telegram z dwoma różnymi botami (sterujący + SUT). Bot SUT musi mieć nazwę użytkownika Telegram; obserwacja bot-bot działa najlepiej, gdy oba boty mają włączony **Bot-to-Bot Communication Mode** w `@BotFather`.

Wymagane env przy `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — numeryczny identyfikator czatu (string).
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

Artefakty wyjściowe:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — zawiera RTT dla każdej odpowiedzi (wysłanie przez sterującego → zaobserwowana odpowiedź SUT), zaczynając od canary.
- `telegram-qa-observed-messages.json` — treści redagowane, chyba że `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Celuje w jeden rzeczywisty prywatny kanał gildii Discord z dwoma botami: botem sterującym kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny OpenClaw gateway przez dołączony Plugin Discord. Weryfikuje obsługę wzmianek kanału, to, że bot SUT zarejestrował natywne polecenie `/help` w Discord, oraz scenariusze dowodowe Mantis opt-in.

Wymagane env przy `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — musi odpowiadać identyfikatorowi użytkownika bota SUT zwróconemu przez Discord (w przeciwnym razie ścieżka szybko kończy się błędem).

Opcjonalne:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` zachowuje treści wiadomości w artefaktach zaobserwowanych wiadomości.

Scenariusze (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scenariusz Mantis opt-in. Uruchamia się samodzielnie, ponieważ przełącza SUT na zawsze włączone odpowiedzi gildii wyłącznie przez narzędzia z `messages.statusReactions.enabled=true`, a następnie przechwytuje oś czasu reakcji REST oraz artefakt wizualny HTML/PNG.

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
- `discord-qa-reaction-timelines.json` i `discord-status-reactions-tool-only-timeline.png`, gdy uruchamia się scenariusz reakcji statusu.

### QA Slack

```bash
pnpm openclaw qa slack
```

Celuje w jeden rzeczywisty prywatny kanał Slack z dwoma różnymi botami: botem sterującym kontrolowanym przez harness oraz botem SUT uruchamianym przez podrzędny OpenClaw gateway przez dołączony Plugin Slack.

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
- `slack-qa-observed-messages.json` — treści redagowane, chyba że `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Konfigurowanie workspace Slack

Ścieżka wymaga dwóch różnych aplikacji Slack w jednym workspace oraz kanału, którego członkami są oba boty:

- `channelId` — identyfikator `Cxxxxxxxxxx` kanału, do którego zaproszono oba boty. Użyj dedykowanego kanału; ścieżka publikuje wpisy przy każdym uruchomieniu.
- `driverBotToken` — token bota (`xoxb-...`) aplikacji **Driver**.
- `sutBotToken` — token bota (`xoxb-...`) aplikacji **SUT**, która musi być osobną aplikacją Slack względem sterującego, aby jej identyfikator użytkownika bota był odrębny.
- `sutAppToken` — token na poziomie aplikacji (`xapp-...`) aplikacji SUT z `connections:write`, używany przez Socket Mode, aby aplikacja SUT mogła odbierać zdarzenia.

Preferuj workspace Slack dedykowany QA zamiast ponownego używania workspace produkcyjnego.

Poniższy manifest SUT odzwierciedla produkcyjną instalację dołączonego Plugin Slack (`extensions/slack/src/setup-shared.ts:10`). Konfiguracja kanału produkcyjnego widoczna dla użytkowników znajduje się w [szybkiej konfiguracji kanału Slack](/pl/channels/slack#quick-setup); para QA Driver/SUT jest celowo oddzielna, ponieważ ścieżka wymaga dwóch różnych identyfikatorów użytkowników botów w jednym workspace.

**1. Utwórz aplikację Driver**

Przejdź do [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → wybierz workspace QA, wklej następujący manifest, a następnie _Install to Workspace_:

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

Skopiuj _Bot User OAuth Token_ (`xoxb-...`) — staje się on `driverBotToken`. Sterujący musi tylko publikować wiadomości i identyfikować siebie; bez zdarzeń, bez Socket Mode.

**2. Utwórz aplikację SUT**

Powtórz _Create New App → From a manifest_ w tym samym workspace. Zestaw zakresów odzwierciedla produkcyjną instalację dołączonego Plugin Slack (`extensions/slack/src/setup-shared.ts:10`):

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

Po utworzeniu aplikacji przez Slack wykonaj dwie czynności na jej stronie ustawień:

- _Install to Workspace_ → skopiuj _Bot User OAuth Token_ → staje się on `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → dodaj zakres `connections:write` → zapisz → skopiuj wartość `xapp-...` → staje się ona `sutAppToken`.

Zweryfikuj, że dwa boty mają różne identyfikatory użytkowników, wywołując `auth.test` dla każdego tokenu. Runtime rozróżnia sterownik i SUT według identyfikatora użytkownika; ponowne użycie jednej aplikacji dla obu ról natychmiast spowoduje niepowodzenie bramkowania wzmianek.

**3. Utwórz kanał**

W obszarze roboczym QA utwórz kanał (np. `#openclaw-qa`) i zaproś oba boty z wnętrza kanału:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Skopiuj identyfikator `Cxxxxxxxxxx` z _informacje o kanale → Informacje → Channel ID_ — staje się on `channelId`. Kanał publiczny działa; jeśli użyjesz kanału prywatnego, obie aplikacje już mają `groups:history`, więc odczyty historii przez harness nadal się powiodą.

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

Po wyeksportowaniu `OPENCLAW_QA_CONVEX_SITE_URL` i `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` w powłoce zarejestruj i zweryfikuj:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Oczekuj `count: 1`, `status: "active"`, bez pola `lease`.

**5. Zweryfikuj od końca do końca**

Uruchom lane lokalnie, aby potwierdzić, że oba boty mogą komunikować się ze sobą przez brokera:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Zielone uruchomienie kończy się znacznie poniżej 30 sekund, a `slack-qa-report.md` pokazuje zarówno `slack-canary`, jak i `slack-mention-gating` ze statusem `pass`. Jeśli lane zawiesza się na około 90 sekund i kończy komunikatem `Convex credential pool exhausted for kind "slack"`, pula jest pusta albo każdy wiersz jest dzierżawiony — `qa credentials list --kind slack --status all --json` pokaże, który przypadek zachodzi.

### Pula danych uwierzytelniających Convex

Lane'y Telegram, Discord i Slack mogą dzierżawić dane uwierzytelniające ze współdzielonej puli Convex zamiast odczytywać powyższe zmienne środowiskowe. Przekaż `--credential-source convex` (albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab pozyskuje wyłączną dzierżawę, wysyła dla niej Heartbeat przez czas trwania uruchomienia i zwalnia ją przy zamykaniu. Rodzaje puli to `"telegram"`, `"discord"` i `"slack"`.

Kształty payloadów, które broker waliduje w `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` musi być numerycznym ciągiem identyfikatora czatu.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` musi pasować do `^[A-Z][A-Z0-9]+$` (identyfikator Slack, taki jak `Cxxxxxxxxxx`). Zobacz [Konfigurowanie obszaru roboczego Slack](#setting-up-the-slack-workspace), aby przygotować aplikację i zakresy.

Operacyjne zmienne środowiskowe i kontrakt endpointu brokera Convex znajdują się w [Testowanie → Współdzielone dane uwierzytelniające Telegram przez Convex](/pl/help/testing#shared-telegram-credentials-via-convex-v1) (nazwa sekcji powstała przed obsługą Discord; semantyka brokera jest identyczna dla obu rodzajów).

## Seedy oparte na repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Celowo są w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla agenta.

`qa-lab` powinien pozostać generycznym runnerem Markdown. Każdy plik scenariusza Markdown jest źródłem prawdy dla jednego uruchomienia testu i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, możliwości, lane'u i ryzyka
- referencje do dokumentacji i kodu
- opcjonalne wymagania Plugin
- opcjonalną łatkę konfiguracji Gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia runtime, która obsługuje `qa-flow`, może pozostać generyczna i przekrojowa. Na przykład scenariusze Markdown mogą łączyć helpery po stronie transportu z helperami po stronie przeglądarki, które sterują osadzonym Control UI przez seam `browser.request` w Gateway, bez dodawania runnera dla szczególnego przypadku.

Pliki scenariuszy powinny być grupowane według możliwości produktu, a nie folderu drzewa źródłowego. Zachowuj stabilne identyfikatory scenariuszy podczas przenoszenia plików; używaj `docsRefs` i `codeRefs` do śledzenia implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania zwrotne cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie subagentowi
- czytanie repozytorium i dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Lane'y mock providerów

`qa suite` ma dwa lokalne lane'y mock providerów:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślnym deterministycznym lane'em mock dla QA opartego na repozytorium i bramek zgodności.
- `aimock` uruchamia serwer providera oparty na AIMock do eksperymentalnego pokrycia protokołu, fixture'ów, record/replay i chaosu. Jest dodatkiem i nie zastępuje dyspozytora scenariuszy `mock-openai`.

Implementacja lane'ów providerów znajduje się w `extensions/qa-lab/src/providers/`. Każdy provider posiada swoje wartości domyślne, uruchamianie lokalnego serwera, konfigurację modelu Gateway, potrzeby stagingu profilu uwierzytelniania oraz flagi możliwości live/mock. Wspólny kod suite i Gateway powinien przechodzić przez rejestr providerów zamiast rozgałęziać się po nazwach providerów.

## Adaptery transportu

`qa-lab` posiada generyczny seam transportu dla scenariuszy QA Markdown. `qa-channel` jest pierwszym adapterem na tym seamie, ale cel projektowy jest szerszy: przyszłe rzeczywiste lub syntetyczne kanały powinny podłączać się do tego samego runnera suite zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział wygląda tak:

- `qa-lab` posiada generyczne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- Adapter transportu posiada konfigurację Gateway, gotowość, obserwację przychodzącą i wychodzącą, akcje transportu oraz znormalizowany stan transportu.
- Pliki scenariuszy Markdown w `qa/scenarios/` definiują uruchomienie testu; `qa-lab` dostarcza wielokrotnego użytku powierzchnię runtime, która je wykonuje.

### Dodawanie kanału

Dodanie kanału do systemu QA Markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który ćwiczy kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy współdzielony host `qa-lab` może posiadać przepływ.

`qa-lab` posiada współdzieloną mechanikę hosta:

- korzeń polecenia `openclaw qa`
- uruchamianie i zamykanie suite
- współbieżność workerów
- zapisywanie artefaktów
- generowanie raportu
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów posiadają kontrakt transportu:

- jak `openclaw qa <runner>` jest montowany pod współdzielonym korzeniem `qa`
- jak Gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypty i znormalizowany stan transportu
- jak wykonywane są akcje oparte na transporcie
- jak obsługiwany jest reset lub cleanup specyficzny dla transportu

Minimalny próg adopcji dla nowego kanału:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym seamie hosta `qa-lab`.
3. Trzymaj mechanikę specyficzną dla transportu wewnątrz Pluginu runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne polecenie główne. Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować odpowiadającą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`. Utrzymuj `runtime-api.ts` jako lekki; leniwe CLI i wykonywanie runnera powinny pozostać za oddzielnymi punktami wejścia.
5. Utwórz albo dostosuj scenariusze Markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj generycznych helperów scenariuszy dla nowych scenariuszy.
7. Utrzymuj istniejące aliasy zgodności, chyba że repozytorium przeprowadza intencjonalną migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, trzymaj je w tym Pluginie runnera lub harnessie Pluginu.
- Jeśli scenariusz potrzebuje nowej możliwości, której może użyć więcej niż jeden kanał, dodaj generyczny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla transportu i zaznacz to wyraźnie w kontrakcie scenariusza.

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

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ale nowe scenariusze powinny używać nazw generycznych. Aliasy istnieją, aby uniknąć migracji typu flag day, a nie jako model na przyszłość.

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z obserwowanej osi czasu magistrali.
Raport powinien odpowiadać:

- Co zadziałało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby uzyskać inwentarz dostępnych scenariuszy — przydatny przy szacowaniu prac uzupełniających lub podłączaniu nowego transportu — uruchom `pnpm openclaw qa coverage` (dodaj `--json`, aby uzyskać wyjście czytelne maszynowo).

Dla kontroli charakteru i stylu uruchom ten sam scenariusz na wielu referencjach modeli live i zapisz oceniony raport Markdown:

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
ewaluacji postaci powinny ustawiać personę przez `SOUL.md`, a następnie uruchamiać
zwykłe tury użytkownika, takie jak czat, pomoc w obszarze roboczym i małe zadania
na plikach. Model kandydujący nie powinien być informowany, że jest oceniany.
Polecenie zachowuje każdy pełny transkrypt, zapisuje podstawowe statystyki
uruchomienia, a następnie prosi modele oceniające w trybie szybkim z rozumowaniem
`xhigh`, jeśli jest obsługiwane, o uszeregowanie uruchomień według naturalności,
klimatu i humoru. Użyj `--blind-judge-models` podczas porównywania dostawców:
prompt oceniający nadal otrzymuje każdy transkrypt i status uruchomienia, ale
referencje kandydatów są zastępowane neutralnymi etykietami, takimi jak
`candidate-01`; raport po parsowaniu mapuje rankingi z powrotem na rzeczywiste
referencje.
Uruchomienia kandydatów domyślnie używają myślenia `high`, z `medium` dla GPT-5.5
i `xhigh` dla starszych referencji ewaluacyjnych OpenAI, które je obsługują.
Nadpisz konkretnego kandydata w wierszu polecenia za pomocą
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalną wartość zapasową, a starsza forma `--model-thinking <provider/model=level>`
jest zachowana dla zgodności.
Referencje kandydatów OpenAI domyślnie używają trybu szybkiego, aby tam, gdzie
dostawca go obsługuje, wykorzystywać przetwarzanie priorytetowe. Dodaj w wierszu
polecenia `,fast`, `,no-fast` lub `,fast=false`, gdy pojedynczy kandydat albo
model oceniający wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb szybki dla każdego modelu kandydującego. Czasy trwania kandydatów i
modeli oceniających są zapisywane w raporcie na potrzeby analizy benchmarków, ale
prompty oceniające wyraźnie mówią, aby nie klasyfikować według szybkości.
Uruchomienia modeli kandydujących i oceniających domyślnie używają współbieżności
16. Zmniejsz `--concurrency` lub `--judge-concurrency`, gdy limity dostawcy albo
obciążenie lokalnego Gateway powodują zbyt zaszumione uruchomienie.
Gdy nie przekazano żadnego kandydującego `--model`, ewaluacja postaci domyślnie
używa `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` i `google/gemini-3.1-pro-preview`, gdy nie przekazano
`--model`.
Gdy nie przekazano `--judge-model`, modele oceniające domyślnie używają
`openai/gpt-5.5,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Macierz QA](/pl/concepts/qa-matrix)
- [Kanał QA](/pl/channels/qa-channel)
- [Testowanie](/pl/help/testing)
- [Panel](/pl/web/dashboard)
