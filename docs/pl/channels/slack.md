---
read_when:
    - Konfigurowanie Slack lub debugowanie trybu socket/HTTP Slack
summary: Konfiguracja Slack i zachowanie w czasie działania (Socket Mode + adresy URL żądań HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-04T07:02:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4a91fc1ae5f1e03f714308be54e164ef204809e74efabed8dc75c3035c14228
    source_path: channels/slack.md
    workflow: 16
---

Gotowe produkcyjnie dla wiadomości prywatnych i kanałów przez integracje aplikacji Slack. Domyślnym trybem jest Socket Mode; obsługiwane są też HTTP Request URLs.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Slack domyślnie używają trybu parowania.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        W ustawieniach aplikacji Slack naciśnij przycisk **[Create New App](https://api.slack.com/apps/new)**:

        - wybierz **from a manifest** i wybierz obszar roboczy dla swojej aplikacji
        - wklej poniższy [przykładowy manifest](#manifest-and-scope-checklist) i kontynuuj tworzenie
        - wygeneruj **App-Level Token** (`xapp-...`) z `connections:write`
        - zainstaluj aplikację i skopiuj wyświetlony **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

        Zalecana konfiguracja SecretRef:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Rezerwowa konfiguracja env (tylko konto domyślne):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        W ustawieniach aplikacji Slack naciśnij przycisk **[Create New App](https://api.slack.com/apps/new)**:

        - wybierz **from a manifest** i wybierz obszar roboczy dla swojej aplikacji
        - wklej [przykładowy manifest](#manifest-and-scope-checklist) i zaktualizuj adresy URL przed utworzeniem
        - zapisz **Signing Secret** do weryfikacji żądań
        - zainstaluj aplikację i skopiuj wyświetlony **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

        Zalecana konfiguracja SecretRef:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Używaj unikalnych ścieżek webhook dla HTTP z wieloma kontami

        Nadaj każdemu kontu odrębny `webhookPath` (domyślnie `/slack/events`), aby rejestracje nie kolidowały.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Dostosowywanie transportu Socket Mode

OpenClaw domyślnie ustawia limit czasu pong klienta Slack SDK na 15 sekund dla Socket Mode. Nadpisuj ustawienia transportu tylko wtedy, gdy potrzebujesz dostosowania specyficznego dla obszaru roboczego lub hosta:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Używaj tego tylko dla obszarów roboczych Socket Mode, które rejestrują limity czasu pong websocket Slack albo server-ping, lub działają na hostach ze znanym głodzeniem pętli zdarzeń. `clientPingTimeout` to czas oczekiwania na pong po wysłaniu przez SDK pingu klienta; `serverPingTimeout` to czas oczekiwania na pingi serwera Slack. Wiadomości i zdarzenia aplikacji pozostają stanem aplikacji, a nie sygnałami żywotności transportu.

## Lista kontrolna manifestu i zakresów

Podstawowy manifest aplikacji Slack jest taki sam dla Socket Mode i HTTP Request URLs. Różni się tylko blok `settings` (oraz `url` polecenia slash).

Podstawowy manifest (domyślny Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
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

W trybie **HTTP Request URLs** zastąp `settings` wariantem HTTP i dodaj `url` do każdego polecenia slash. Wymagany publiczny URL:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Dodatkowe ustawienia manifestu

Udostępnij różne funkcje rozszerzające powyższe ustawienia domyślne.

Domyślny manifest włącza kartę **Home** w Slack App Home i subskrybuje `app_home_opened`. Gdy członek obszaru roboczego otworzy kartę Home, OpenClaw publikuje bezpieczny domyślny widok Home za pomocą `views.publish`; nie są dołączane żadne dane rozmowy ani prywatna konfiguracja. Karta **Messages** pozostaje włączona dla wiadomości prywatnych Slack.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Zamiast pojedynczego skonfigurowanego polecenia można użyć wielu [natywnych poleceń slash](#commands-and-slash-behavior), z pewnymi niuansami:

    - Użyj `/agentstatus` zamiast `/status`, ponieważ polecenie `/status` jest zarezerwowane.
    - Jednocześnie można udostępnić nie więcej niż 25 poleceń slash.

    Zastąp istniejącą sekcję `features.slash_commands` podzbiorem [dostępnych poleceń](/pl/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Reset the current session"
    },
    {
      "command": "/compact",
      "description": "Compact the session context",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Stop the current run"
    },
    {
      "command": "/session",
      "description": "Manage thread-binding expiry",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Set the thinking level",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Toggle verbose output",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Show or set fast mode",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Toggle reasoning visibility",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Toggle elevated mode",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Show or set exec defaults",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/model",
      "description": "Show or set the model",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "List providers/models",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Show the short help summary"
    },
    {
      "command": "/commands",
      "description": "Show the generated command catalog"
    },
    {
      "command": "/tools",
      "description": "Show what the current agent can use right now",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Show runtime status, including provider usage/quota when available"
    },
    {
      "command": "/tasks",
      "description": "List active/recent background tasks for the current session"
    },
    {
      "command": "/context",
      "description": "Explain how context is assembled",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Show your sender identity"
    },
    {
      "command": "/skill",
      "description": "Run a skill by name",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Użyj tej samej listy `slash_commands` co w Socket Mode powyżej i dodaj `"url": "https://gateway-host.example.com/slack/events"` do każdego wpisu. Przykład:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Show the short help summary",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Powtórz tę wartość `url` przy każdym poleceniu na liście.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Opcjonalne zakresy autorstwa (operacje zapisu)">
    Dodaj zakres bota `chat:write.customize`, jeśli chcesz, aby wiadomości wychodzące używały aktywnej tożsamości agenta (niestandardowej nazwy użytkownika i ikony) zamiast domyślnej tożsamości aplikacji Slack.

    Jeśli używasz ikony emoji, Slack oczekuje składni `:emoji_name:`.

  </Accordion>
  <Accordion title="Opcjonalne zakresy tokena użytkownika (operacje odczytu)">
    Jeśli skonfigurujesz `channels.slack.userToken`, typowe zakresy odczytu to:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (jeśli polegasz na odczytach wyszukiwania Slack)

  </Accordion>
</AccordionGroup>

## Model tokenów

- `botToken` + `appToken` są wymagane w trybie Socket Mode.
- Tryb HTTP wymaga `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` i `userToken` przyjmują jawne
  ciągi tekstowe lub obiekty SecretRef.
- Tokeny z konfiguracji zastępują awaryjne wartości z env.
- Awaryjne wartości env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` mają zastosowanie tylko do konta domyślnego.
- `userToken` (`xoxp-...`) jest dostępny tylko w konfiguracji (bez awaryjnej wartości env) i domyślnie działa tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki stanu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status`
  dla poszczególnych poświadczeń (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Stan to `available`, `configured_unavailable` albo `missing`.
- `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef
  lub inne źródło sekretu spoza konfiguracji inline, ale bieżąca ścieżka polecenia/uruchomienia
  nie mogła rozwiązać rzeczywistej wartości.
- W trybie HTTP uwzględniane jest `signingSecretStatus`; w trybie Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
W przypadku akcji/odczytów katalogu token użytkownika może być preferowany, gdy jest skonfigurowany. W przypadku zapisów preferowany pozostaje token bota; zapisy z użyciem tokena użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false`, a token bota jest niedostępny.
</Tip>

## Akcje i bramki

Akcje Slack są kontrolowane przez `channels.slack.actions.*`.

Dostępne grupy akcji w bieżących narzędziach Slack:

| Grupa      | Domyślnie |
| ---------- | ------- |
| messages   | włączone |
| reactions  | włączone |
| pins       | włączone |
| memberInfo | włączone |
| emojiList  | włączone |

Bieżące akcje wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` i `emoji-list`. `download-file` przyjmuje identyfikatory plików Slack widoczne w placeholderach plików przychodzących i zwraca podglądy obrazów dla obrazów albo metadane pliku lokalnego dla innych typów plików.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Polityka DM">
    `channels.slack.dmPolicy` kontroluje dostęp DM. `channels.slack.allowFrom` jest kanoniczną listą dozwolonych DM.

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.slack.allowFrom` zawierało `"*"`)
    - `disabled`

    Flagi DM:

    - `dm.enabled` (domyślnie true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (starsze)
    - `dm.groupEnabled` (grupowe DM domyślnie false)
    - `dm.groupChannels` (opcjonalna lista dozwolonych MPIM)

    Priorytet wielu kont:

    - `channels.slack.accounts.default.allowFrom` ma zastosowanie tylko do konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Starsze `channels.slack.dm.policy` i `channels.slack.dm.allowFrom` są nadal odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Parowanie w DM używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Polityka kanału">
    `channels.slack.groupPolicy` kontroluje obsługę kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Lista dozwolonych kanałów znajduje się pod `channels.slack.channels` i **musi używać stabilnych identyfikatorów kanałów Slack** (na przykład `C12345678`) jako kluczy konfiguracji.

    Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.slack` całkowicie brakuje (konfiguracja tylko z env), środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logu (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozwiązywanie nazw/identyfikatorów:

    - wpisy listy dozwolonych kanałów i wpisy listy dozwolonych DM są rozwiązywane przy starcie, gdy dostęp tokena na to pozwala
    - nierozwiązane wpisy nazw kanałów są zachowywane zgodnie z konfiguracją, ale domyślnie ignorowane przy routingu
    - autoryzacja przychodząca i routing kanałów domyślnie w pierwszej kolejności używają identyfikatorów; bezpośrednie dopasowywanie nazwy użytkownika/sluga wymaga `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Klucze oparte na nazwach (`#channel-name` lub `channel-name`) **nie** pasują przy `groupPolicy: "allowlist"`. Wyszukiwanie kanałów domyślnie w pierwszej kolejności używa identyfikatorów, więc klucz oparty na nazwie nigdy nie zostanie poprawnie obsłużony przez routing, a wszystkie wiadomości w tym kanale zostaną po cichu zablokowane. Różni się to od `groupPolicy: "open"`, gdzie klucz kanału nie jest wymagany do routingu i klucz oparty na nazwie wydaje się działać.

    Zawsze używaj identyfikatora kanału Slack jako klucza. Aby go znaleźć: kliknij kanał prawym przyciskiem myszy w Slack → **Copy link** — identyfikator (`C...`) pojawi się na końcu URL-a.

    Poprawnie:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    Nieprawidłowo (cicho blokowane przy `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    Wiadomości w kanałach domyślnie wymagają wzmianki.

    Źródła wzmianek:

    - jawna wzmianka o aplikacji (`<@botId>`)
    - wzmianka o grupie użytkowników Slack (`<!subteam^S...>`), gdy użytkownik bota jest członkiem tej grupy użytkowników; wymaga `usergroups:read`
    - wzorce wyrażeń regularnych wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie wątków odpowiadających botowi (wyłączone, gdy `thread.requireExplicitMention` ma wartość `true`)

    Kontrole dla poszczególnych kanałów (`channels.slack.channels.<id>`; nazwy tylko przez rozpoznawanie przy starcie lub `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista dozwolonych)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `id:`, `e164:`, `username:`, `name:` lub symbol wieloznaczny `"*"`
      (starsze klucze bez prefiksu nadal mapują tylko na `id:`)

    `allowBots` działa konserwatywnie dla kanałów i kanałów prywatnych: wiadomości w pokoju napisane przez bota są akceptowane tylko wtedy, gdy wysyłający bot jest jawnie wymieniony na liście dozwolonych `users` tego pokoju albo gdy co najmniej jeden jawny identyfikator właściciela Slack z `channels.slack.allowFrom` jest obecnie członkiem pokoju. Symbole wieloznaczne i wpisy właścicieli oparte na nazwie wyświetlanej nie spełniają warunku obecności właściciela. Obecność właściciela używa Slack `conversations.members`; upewnij się, że aplikacja ma odpowiedni zakres odczytu dla typu pokoju (`channels:read` dla kanałów publicznych, `groups:read` dla kanałów prywatnych). Jeśli wyszukiwanie członków się nie powiedzie, OpenClaw odrzuca wiadomość w pokoju napisaną przez bota.

  </Tab>
</Tabs>

## Wątki, sesje i tagi odpowiedzi

- DM są kierowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Powiązania tras Slack akceptują surowe identyfikatory uczestników oraz formy celów Slack, takie jak `channel:C12345678`, `user:U12345678` i `<@U12345678>`.
- Przy domyślnym `session.dmScope=main` DM Slack są scalane z główną sesją agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Odpowiedzi w wątku mogą tworzyć sufiksy sesji wątku (`:thread:<threadTs>`), gdy ma to zastosowanie.
- Domyślną wartością `channels.slack.thread.historyScope` jest `thread`; domyślną wartością `thread.inheritParent` jest `false`.
- `channels.slack.thread.initialHistoryLimit` kontroluje, ile istniejących wiadomości wątku jest pobieranych po rozpoczęciu nowej sesji wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).
- `channels.slack.thread.requireExplicitMention` (domyślnie `false`): gdy ma wartość `true`, tłumi niejawne wzmianki w wątku, aby bot odpowiadał tylko na jawne wzmianki `@bot` w wątkach, nawet jeśli bot już uczestniczył w wątku. Bez tego odpowiedzi w wątku, w którym uczestniczył bot, omijają bramkowanie `requireMention`.

Kontrole wątków odpowiedzi:

- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: dla każdego `direct|group|channel`
- starszy mechanizm awaryjny dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Obsługiwane są ręczne tagi odpowiedzi:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` wyłącza **wszystkie** wątki odpowiedzi w Slack, w tym jawne tagi `[[reply_to_*]]`. Różni się to od Telegram, gdzie jawne tagi nadal są respektowane w trybie `"off"`. Wątki Slack ukrywają wiadomości przed kanałem, natomiast odpowiedzi Telegram pozostają widoczne w treści.
</Note>

## Reakcje potwierdzenia

`ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- awaryjne emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

Uwagi:

- Slack oczekuje krótkich kodów (na przykład `"eyes"`).
- Użyj `""`, aby wyłączyć reakcję dla konta Slack lub globalnie.

## Strumieniowanie tekstu

`channels.slack.streaming` kontroluje zachowanie podglądu na żywo:

- `off`: wyłącz strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastępuj tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołączaj porcjowane aktualizacje podglądu.
- `progress`: pokazuj tekst statusu postępu podczas generowania, a następnie wyślij tekst końcowy.
- `streaming.preview.toolProgress`: gdy podgląd roboczy jest aktywny, kieruj aktualizacje narzędzi/postępu do tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować oddzielne wiadomości narzędzi/postępu.
- `streaming.preview.commandText` / `streaming.progress.commandText`: ustaw na `status`, aby zachować zwarte wiersze postępu narzędzi, ukrywając surowy tekst polecenia/wykonania (domyślnie: `raw`).

Ukryj surowy tekst polecenia/wykonania, zachowując zwarte wiersze postępu:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` kontroluje natywne strumieniowanie tekstu Slack, gdy `channels.slack.streaming.mode` ma wartość `partial` (domyślnie: `true`).

- Wątek odpowiedzi musi być dostępny, aby pojawiły się natywne strumieniowanie tekstu i status wątku asystenta Slack. Wybór wątku nadal przestrzega `replyToMode`.
- Kanały, czaty grupowe i główne korzenie DM nadal mogą używać zwykłego podglądu roboczego, gdy natywne strumieniowanie jest niedostępne albo nie istnieje żaden wątek odpowiedzi.
- Główne DM Slack domyślnie pozostają poza wątkiem, więc nie pokazują natywnego podglądu strumienia/statusu w stylu wątku Slack; OpenClaw zamiast tego publikuje i edytuje podgląd roboczy w DM.
- Multimedia i ładunki nietekstowe przechodzą awaryjnie do zwykłego dostarczania.
- Końcowe multimedia/błędy anulują oczekujące edycje podglądu; kwalifikujące się końcowe teksty/bloki są opróżniane tylko wtedy, gdy mogą edytować podgląd w miejscu.
- Jeśli strumieniowanie nie powiedzie się w trakcie odpowiedzi, OpenClaw przechodzi awaryjnie do zwykłego dostarczania pozostałych ładunków.

Użyj podglądu roboczego zamiast natywnego strumieniowania tekstu Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Starsze klucze:

- `channels.slack.streamMode` (`replace | status_final | append`) jest automatycznie migrowany do `channels.slack.streaming.mode`.
- wartość logiczna `channels.slack.streaming` jest automatycznie migrowana do `channels.slack.streaming.mode` i `channels.slack.streaming.nativeTransport`.
- starszy `channels.slack.nativeStreaming` jest automatycznie migrowany do `channels.slack.streaming.nativeTransport`.

## Awaryjna reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu przebiegu. Jest to najbardziej przydatne poza odpowiedziami w wątkach, które używają domyślnego wskaźnika stanu „pisze...”.

Kolejność rozwiązywania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"hourglass_flowing_sand"`).
- Reakcja działa w trybie best-effort, a czyszczenie jest podejmowane automatycznie po zakończeniu ścieżki odpowiedzi lub błędu.

## Multimedia, dzielenie na fragmenty i dostarczanie

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Załączniki plików Slack są pobierane z prywatnych adresów URL hostowanych przez Slack (przepływ żądań uwierzytelnianych tokenem) i zapisywane w magazynie multimediów, gdy pobieranie się powiedzie i pozwalają na to limity rozmiaru. Placeholdery plików zawierają Slack `fileId`, aby agenci mogli pobrać oryginalny plik za pomocą `download-file`.

    Pobieranie używa ograniczonych timeoutów bezczynności i całkowitego czasu. Jeśli pobieranie pliku ze Slack zatrzyma się lub nie powiedzie, OpenClaw kontynuuje przetwarzanie wiadomości i wraca do placeholdera pliku.

    Domyślny limit rozmiaru przychodzących danych w czasie działania to `20MB`, chyba że zostanie nadpisany przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - fragmenty tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie najpierw według akapitów
    - wysyłanie plików używa API przesyłania Slack i może obejmować odpowiedzi w wątkach (`thread_ts`)
    - limit multimediów wychodzących podąża za `channels.slack.mediaMaxMb`, gdy jest skonfigurowany; w przeciwnym razie wysyłanie kanałowe używa domyślnych wartości typu MIME z pipeline'u multimediów

  </Accordion>

  <Accordion title="Delivery targets">
    Preferowane jawne cele:

    - `user:<id>` dla DM
    - `channel:<id>` dla kanałów

    Slack DM zawierające tylko tekst/bloki mogą publikować bezpośrednio do identyfikatorów użytkowników; przesyłanie plików i wysyłanie w wątkach najpierw otwierają DM przez API konwersacji Slack, ponieważ te ścieżki wymagają konkretnego identyfikatora konwersacji.

  </Accordion>
</AccordionGroup>

## Polecenia i zachowanie slash

Polecenia slash pojawiają się w Slack jako pojedyncze skonfigurowane polecenie albo wiele poleceń natywnych. Skonfiguruj `channels.slack.slashCommand`, aby zmienić wartości domyślne poleceń:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Polecenia natywne wymagają [dodatkowych ustawień manifestu](#additional-manifest-settings) w aplikacji Slack i są zamiast tego włączane przez `channels.slack.commands.native: true` albo `commands.native: true` w konfiguracjach globalnych.

- Tryb automatyczny poleceń natywnych jest dla Slack **wyłączony**, więc `commands.native: "auto"` nie włącza natywnych poleceń Slack.

```txt
/help
```

Menu argumentów natywnych używają adaptacyjnej strategii renderowania, która pokazuje modal potwierdzenia przed wysłaniem wybranej wartości opcji:

- do 5 opcji: bloki przycisków
- 6-100 opcji: statyczne menu wyboru
- więcej niż 100 opcji: zewnętrzny wybór z asynchronicznym filtrowaniem opcji, gdy dostępne są handlery opcji interaktywności
- przekroczone limity Slack: zakodowane wartości opcji wracają do przycisków

```txt
/think
```

Sesje slash używają izolowanych kluczy, takich jak `agent:<agentId>:slack:slash:<userId>`, i nadal kierują wykonania poleceń do docelowej sesji konwersacji za pomocą `CommandTargetSessionKey`.

## Odpowiedzi interaktywne

Slack może renderować interaktywne kontrolki odpowiedzi utworzone przez agentów, ale ta funkcja jest domyślnie wyłączona.

Włącz ją globalnie:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Albo włącz ją tylko dla jednego konta Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Po włączeniu agenci mogą emitować dyrektywy odpowiedzi tylko dla Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Te dyrektywy kompilują się do Slack Block Kit i kierują kliknięcia lub wybory z powrotem przez istniejącą ścieżkę zdarzeń interakcji Slack.

Uwagi:

- To interfejs użytkownika specyficzny dla Slack. Inne kanały nie tłumaczą dyrektyw Slack Block Kit na własne systemy przycisków.
- Wartości callbacków interaktywnych to nieprzezroczyste tokeny generowane przez OpenClaw, a nie surowe wartości utworzone przez agenta.
- Jeśli wygenerowane bloki interaktywne przekroczyłyby limity Slack Block Kit, OpenClaw wraca do oryginalnej odpowiedzi tekstowej zamiast wysyłać nieprawidłowy payload bloków.

## Zatwierdzenia exec w Slack

Slack może działać jako natywny klient zatwierdzeń z interaktywnymi przyciskami i interakcjami, zamiast wracać do Web UI lub terminala.

- Zatwierdzenia exec używają `channels.slack.execApprovals.*` do natywnego routingu DM/kanałów.
- Zatwierdzenia Plugin nadal mogą rozwiązywać się przez tę samą natywną powierzchnię przycisków Slack, gdy żądanie już trafia do Slack, a rodzaj identyfikatora zatwierdzenia to `plugin:`.
- Autoryzacja zatwierdzającego nadal jest wymuszana: tylko użytkownicy zidentyfikowani jako zatwierdzający mogą zatwierdzać lub odrzucać żądania przez Slack.

Używa to tej samej współdzielonej powierzchni przycisków zatwierdzania co inne kanały. Gdy `interactivity` jest włączone w ustawieniach aplikacji Slack, monity zatwierdzeń renderują się jako przyciski Block Kit bezpośrednio w konwersacji.
Gdy te przyciski są obecne, są podstawowym UX zatwierdzania; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia czatu
są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalnie; wraca do `commands.ownerAllowFrom`, gdy to możliwe)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` jest nieustawione lub `"auto"` i co najmniej jeden
zatwierdzający zostanie rozwiązany. Ustaw `enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzeń.
Ustaw `enabled: true`, aby wymusić włączenie natywnych zatwierdzeń, gdy zatwierdzający zostaną rozwiązani.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzeń exec Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Jawna konfiguracja natywna dla Slack jest potrzebna tylko wtedy, gdy chcesz nadpisać zatwierdzających, dodać filtry albo
włączyć dostarczanie do czatu źródłowego:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Współdzielone przekazywanie `approvals.exec` jest oddzielne. Używaj go tylko wtedy, gdy monity zatwierdzeń exec muszą także
trafiać do innych czatów lub jawnych celów poza pasmem. Współdzielone przekazywanie `approvals.plugin` również jest
oddzielne; natywne przyciski Slack nadal mogą rozwiązywać zatwierdzenia Plugin, gdy te żądania już trafiają
do Slack.

`/approve` w tym samym czacie działa także w kanałach Slack i DM, które już obsługują polecenia. Zobacz [zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać pełny model przekazywania zatwierdzeń.

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości są mapowane na zdarzenia systemowe.
- Rozgłaszanie wątków (odpowiedzi w wątku „Wyślij także do kanału”) jest przetwarzane jak zwykłe wiadomości użytkowników.
- Zdarzenia dodania/usunięcia reakcji są mapowane na zdarzenia systemowe.
- Zdarzenia dołączenia/opuszczenia przez członka, utworzenia/zmiany nazwy kanału oraz dodania/usunięcia przypięcia są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanału, gdy `configWrites` jest włączone.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą zostać wstrzyknięte do kontekstu routingu.
- Inicjator wątku i początkowe zasilenie kontekstu historią wątku są filtrowane według skonfigurowanych allowlist nadawców, gdy ma to zastosowanie.
- Akcje bloków i interakcje modalne emitują strukturalne zdarzenia systemowe `Slack interaction: ...` z bogatymi polami payloadu:
  - akcje bloków: wybrane wartości, etykiety, wartości pickerów i metadane `workflow_*`
  - zdarzenia modalne `view_submission` i `view_closed` z routowanymi metadanymi kanału oraz danymi formularzy

## Dokumentacja konfiguracji

Główne odniesienie: [Dokumentacja konfiguracji - Slack](/pl/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- tryb/uwierzytelnianie: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- dostęp DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- przełącznik zgodności: `dangerouslyAllowNameMatching` (break-glass; pozostaw wyłączone, chyba że jest potrzebne)
- dostęp kanału: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- wątki/historia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operacje/funkcje: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="No replies in channels">
    Sprawdź po kolei:

    - `groupPolicy`
    - allowlist kanałów (`channels.slack.channels`) — **klucze muszą być identyfikatorami kanałów** (`C12345678`), a nie nazwami (`#channel-name`). Klucze oparte na nazwach po cichu zawodzą przy `groupPolicy: "allowlist"`, ponieważ routing kanałów jest domyślnie najpierw oparty na identyfikatorze. Aby znaleźć identyfikator: kliknij kanał w Slack prawym przyciskiem myszy → **Copy link** — wartość `C...` na końcu adresu URL to identyfikator kanału.
    - `requireMention`
    - allowlist `users` dla kanału

    Przydatne polecenia:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    Sprawdź:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (albo legacy `channels.slack.dm.policy`)
    - zatwierdzenia parowania / wpisy allowlist
    - zdarzenia DM Slack Assistant: szczegółowe logi wspominające `drop message_changed`
      zwykle oznaczają, że Slack wysłał edytowane zdarzenie wątku Assistant bez
      możliwego do odzyskania ludzkiego nadawcy w metadanych wiadomości

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Zweryfikuj tokeny bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` albo
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżący runtime nie mógł rozwiązać wartości
    opartej na SecretRef.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Zweryfikuj:

    - signing secret
    - ścieżkę Webhook
    - adresy URL żądań Slack (zdarzenia + interaktywność + polecenia slash)
    - unikalny `webhookPath` dla każdego konta HTTP

    Jeśli `signingSecretStatus: "configured_unavailable"` pojawia się w snapshotach
    kont, konto HTTP jest skonfigurowane, ale bieżący runtime nie mógł
    rozwiązać signing secret opartego na SecretRef.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Sprawdź, czy zamierzony był:

    - tryb poleceń natywnych (`channels.slack.commands.native: true`) z pasującymi poleceniami slash zarejestrowanymi w Slack
    - albo tryb pojedynczego polecenia slash (`channels.slack.slashCommand.enabled: true`)

    Sprawdź także `commands.useAccessGroups` oraz allowlisty kanałów/użytkowników.

  </Accordion>
</AccordionGroup>

## Odniesienie do wizji dla załączników

Slack może dołączyć pobrane multimedia do tury agenta, gdy pobieranie plików Slack się powiedzie i pozwalają na to limity rozmiaru. Pliki obrazów mogą być przekazywane przez ścieżkę rozumienia multimediów albo bezpośrednio do modelu odpowiedzi obsługującego wizję; inne pliki są zachowywane jako kontekst plików do pobrania, a nie traktowane jako wejście obrazu.

### Obsługiwane typy multimediów

| Typ multimediów                 | Źródło                       | Obecne zachowanie                                                                  | Uwagi                                                                              |
| ------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Obrazy JPEG / PNG / GIF / WebP  | Adres URL pliku Slack        | Pobierane i dołączane do tury na potrzeby obsługi z użyciem obrazu                 | Limit na plik: `channels.slack.mediaMaxMb` (domyślnie 20 MB)                       |
| Pliki PDF                       | Adres URL pliku Slack        | Pobierane i udostępniane jako kontekst pliku dla narzędzi takich jak `download-file` lub `pdf` | Przychodzące wiadomości Slack nie konwertują automatycznie PDF-ów na wejście obrazu |
| Inne pliki                      | Adres URL pliku Slack        | Pobierane, gdy to możliwe, i udostępniane jako kontekst pliku                      | Pliki binarne nie są traktowane jako wejście obrazu                                |
| Odpowiedzi w wątku              | Pliki wiadomości rozpoczynającej wątek | Pliki wiadomości głównej mogą zostać wczytane jako kontekst, gdy odpowiedź nie ma bezpośrednich multimediów | Wiadomości rozpoczynające zawierające tylko pliki używają zastępczego załącznika    |
| Wiadomości z wieloma obrazami   | Wiele plików Slack           | Każdy plik jest oceniany niezależnie                                                | Przetwarzanie Slack jest ograniczone do ośmiu plików na wiadomość                  |

### Potok przychodzący

Gdy przychodzi wiadomość Slack z załącznikami plików:

1. OpenClaw pobiera plik z prywatnego adresu URL Slack przy użyciu tokenu bota (`xoxb-...`).
2. Po powodzeniu plik jest zapisywany w magazynie multimediów.
3. Pobrane ścieżki multimediów i typy treści są dodawane do kontekstu przychodzącego.
4. Ścieżki modelu/narzędzia obsługujące obrazy mogą używać załączników obrazów z tego kontekstu.
5. Pliki niebędące obrazami pozostają dostępne jako metadane pliku lub odwołania do multimediów dla narzędzi, które potrafią je obsłużyć.

### Dziedziczenie załączników z głównej wiadomości wątku

Gdy wiadomość przychodzi w wątku (ma nadrzędne `thread_ts`):

- Jeśli sama odpowiedź nie ma bezpośrednich multimediów, a dołączona wiadomość główna ma pliki, Slack może wczytać pliki główne jako kontekst wiadomości rozpoczynającej wątek.
- Bezpośrednie załączniki odpowiedzi mają pierwszeństwo przed załącznikami wiadomości głównej.
- Wiadomość główna, która ma tylko pliki i nie ma tekstu, jest reprezentowana przez zastępczy załącznik, aby mechanizm awaryjny nadal mógł uwzględnić jej pliki.

### Obsługa wielu załączników

Gdy pojedyncza wiadomość Slack zawiera wiele załączników plików:

- Każdy załącznik jest przetwarzany niezależnie przez potok multimediów.
- Pobrane odwołania do multimediów są agregowane w kontekście wiadomości.
- Kolejność przetwarzania odpowiada kolejności plików Slack w ładunku zdarzenia.
- Niepowodzenie pobierania jednego załącznika nie blokuje pozostałych.

### Limity rozmiaru, pobierania i modelu

- **Limit rozmiaru**: Domyślnie 20 MB na plik. Konfigurowalny przez `channels.slack.mediaMaxMb`.
- **Niepowodzenia pobierania**: Pliki, których Slack nie może udostępnić, wygasłe adresy URL, niedostępne pliki, zbyt duże pliki oraz odpowiedzi HTML uwierzytelniania/logowania Slack są pomijane zamiast zgłaszania ich jako nieobsługiwanych formatów.
- **Model obrazu**: Analiza obrazów używa aktywnego modelu odpowiedzi, gdy obsługuje obraz, albo modelu obrazu skonfigurowanego w `agents.defaults.imageModel`.

### Znane ograniczenia

| Scenariusz                              | Obecne zachowanie                                                            | Obejście                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Wygasły adres URL pliku Slack           | Plik pominięty; nie jest wyświetlany żaden błąd                              | Prześlij plik ponownie w Slack                                                 |
| Model obrazu nie jest skonfigurowany    | Załączniki obrazów są przechowywane jako odwołania do multimediów, ale nie są analizowane jako obrazy | Skonfiguruj `agents.defaults.imageModel` albo użyj modelu odpowiedzi obsługującego obraz |
| Bardzo duże obrazy (> 20 MB domyślnie)  | Pomijane zgodnie z limitem rozmiaru                                           | Zwiększ `channels.slack.mediaMaxMb`, jeśli Slack na to pozwala                 |
| Przekazane/udostępnione załączniki      | Tekst oraz multimedia obrazów/plików hostowane przez Slack są obsługiwane w trybie najlepszych starań | Udostępnij ponownie bezpośrednio w wątku OpenClaw                              |
| Załączniki PDF                          | Przechowywane jako kontekst pliku/multimediów, nie są automatycznie kierowane przez analizę obrazu | Użyj `download-file` dla metadanych pliku albo narzędzia `pdf` do analizy PDF  |

### Powiązana dokumentacja

- [Potok rozumienia multimediów](/pl/nodes/media-understanding)
- [Narzędzie PDF](/pl/tools/pdf)
- Epik: [#51349](https://github.com/openclaw/openclaw/issues/51349) — włączenie obsługi obrazów z załączników Slack
- Testy regresji: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Weryfikacja na żywo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Powiązane

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Slack z Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pl/channels/groups">
    Zachowanie kanałów i grupowych wiadomości bezpośrednich.
  </Card>
  <Card title="Channel routing" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Security" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Configuration" icon="sliders" href="/pl/gateway/configuration">
    Układ konfiguracji i priorytety.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pl/tools/slash-commands">
    Katalog poleceń i zachowanie.
  </Card>
</CardGroup>
