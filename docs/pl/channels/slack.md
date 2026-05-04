---
read_when:
    - Konfigurowanie Slack lub debugowanie trybu socket/HTTP Slack
summary: Konfiguracja Slacka i zachowanie w czasie działania (tryb Socket + adresy URL żądań HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-04T02:22:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2be45f03511a64373b1f4316c59800eeeef8baccb4c00454b49999258b2e546b
    source_path: channels/slack.md
    workflow: 16
---

Gotowo do produkcji dla wiadomości prywatnych i kanałów za pośrednictwem integracji aplikacji Slack. Domyślnym trybem jest Socket Mode; obsługiwane są także adresy URL żądań HTTP.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Slack domyślnie używają trybu parowania.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i scenariusze naprawcze.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        W ustawieniach aplikacji Slack naciśnij przycisk **[Create New App](https://api.slack.com/apps/new)**:

        - wybierz **from a manifest** i wybierz przestrzeń roboczą dla swojej aplikacji
        - wklej [przykładowy manifest](#manifest-and-scope-checklist) poniżej i kontynuuj tworzenie
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

        Awaryjna konfiguracja przez zmienne środowiskowe (tylko konto domyślne):

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

        - wybierz **from a manifest** i wybierz przestrzeń roboczą dla swojej aplikacji
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
        Używaj unikatowych ścieżek Webhook dla wielu kont HTTP

        Nadaj każdemu kontu odrębną wartość `webhookPath` (domyślnie `/slack/events`), aby rejestracje nie kolidowały.
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

## Dostrajanie transportu Socket Mode

OpenClaw domyślnie ustawia limit czasu pong klienta Slack SDK na 15 sekund dla Socket Mode. Nadpisuj ustawienia transportu tylko wtedy, gdy potrzebujesz dostrojenia specyficznego dla przestrzeni roboczej lub hosta:

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

Używaj tego tylko dla przestrzeni roboczych Socket Mode, które rejestrują przekroczenia limitu czasu pong websocket Slack lub pingów serwera, albo działają na hostach ze znanym głodzeniem pętli zdarzeń. `clientPingTimeout` to czas oczekiwania na pong po wysłaniu przez SDK pingu klienta; `serverPingTimeout` to czas oczekiwania na pingi serwera Slack. Wiadomości i zdarzenia aplikacji pozostają stanem aplikacji, a nie sygnałami żywotności transportu.

## Lista kontrolna manifestu i zakresów

Podstawowy manifest aplikacji Slack jest taki sam dla Socket Mode i adresów URL żądań HTTP. Różni się tylko blok `settings` (oraz `url` polecenia slash).

Manifest podstawowy (domyślnie Socket Mode):

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

Dla **trybu adresów URL żądań HTTP** zastąp `settings` wariantem HTTP i dodaj `url` do każdego polecenia slash. Wymagany jest publiczny adres URL:

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

Udostępnij różne funkcje rozszerzające powyższe wartości domyślne.

Domyślny manifest włącza kartę **Home** w Slack App Home i subskrybuje `app_home_opened`. Gdy członek przestrzeni roboczej otworzy kartę Home, OpenClaw publikuje bezpieczny domyślny widok Home za pomocą `views.publish`; nie są dołączane żadne dane konwersacji ani prywatna konfiguracja. Karta **Messages** pozostaje włączona dla wiadomości prywatnych Slack.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Zamiast jednego skonfigurowanego polecenia można używać wielu [natywnych poleceń slash](#commands-and-slash-behavior), z pewnymi niuansami:

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
        Użyj tej samej listy `slash_commands` co powyżej dla Socket Mode i dodaj `"url": "https://gateway-host.example.com/slack/events"` do każdego wpisu. Przykład:

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

- `botToken` + `appToken` są wymagane dla Socket Mode.
- Tryb HTTP wymaga `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują jawne
  ciągi tekstowe lub obiekty SecretRef.
- Tokeny z konfiguracji zastępują rezerwowe wartości ze zmiennych środowiskowych.
- Rezerwowe zmienne środowiskowe `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` dotyczą tylko konta domyślnego.
- `userToken` (`xoxp-...`) jest tylko konfiguracyjny (bez rezerwowej zmiennej środowiskowej) i domyślnie działa tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki statusu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status`
  dla poszczególnych poświadczeń (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status to `available`, `configured_unavailable` albo `missing`.
- `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef
  albo inne niewstawione bezpośrednio źródło sekretu, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego
  nie mogła ustalić rzeczywistej wartości.
- W trybie HTTP uwzględniany jest `signingSecretStatus`; w Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
W przypadku akcji/odczytów katalogu token użytkownika może być preferowany, gdy jest skonfigurowany. W przypadku zapisów nadal preferowany jest token bota; zapisy przez token użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false`, a token bota jest niedostępny.
</Tip>

## Akcje i bramki

Akcje Slack są kontrolowane przez `channels.slack.actions.*`.

Dostępne grupy akcji w bieżących narzędziach Slack:

| Grupa      | Domyślnie |
| ---------- | --------- |
| messages   | włączone  |
| reactions  | włączone  |
| pins       | włączone  |
| memberInfo | włączone  |
| emojiList  | włączone  |

Bieżące akcje wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` i `emoji-list`. `download-file` akceptuje identyfikatory plików Slack pokazywane w przychodzących placeholderach plików i zwraca podglądy obrazów dla obrazów albo lokalne metadane pliku dla innych typów plików.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasady DM">
    `channels.slack.dmPolicy` kontroluje dostęp do DM. `channels.slack.allowFrom` jest kanoniczną listą dozwolonych DM.

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

    Pierwszeństwo przy wielu kontach:

    - `channels.slack.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Starsze `channels.slack.dm.policy` i `channels.slack.dm.allowFrom` są nadal odczytywane ze względu na zgodność. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Parowanie w DM używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Zasady kanału">
    `channels.slack.groupPolicy` kontroluje obsługę kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Lista dozwolonych kanałów znajduje się pod `channels.slack.channels` i **musi używać stabilnych identyfikatorów kanałów Slack** (na przykład `C12345678`) jako kluczy konfiguracji.

    Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.slack` całkowicie brakuje (konfiguracja wyłącznie przez zmienne środowiskowe), środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` i rejestruje ostrzeżenie (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozpoznawanie nazwy/ID:

    - wpisy listy dozwolonych kanałów i wpisy listy dozwolonych DM są rozpoznawane podczas uruchamiania, gdy pozwala na to dostęp tokena
    - nierozpoznane wpisy nazw kanałów są zachowywane zgodnie z konfiguracją, ale domyślnie ignorowane przy routingu
    - autoryzacja przychodząca i routing kanałów domyślnie najpierw używają ID; bezpośrednie dopasowywanie nazwy użytkownika/sluga wymaga `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Klucze oparte na nazwie (`#channel-name` albo `channel-name`) **nie** pasują przy `groupPolicy: "allowlist"`. Wyszukiwanie kanału domyślnie najpierw używa ID, więc klucz oparty na nazwie nigdy nie zostanie poprawnie zrutowany, a wszystkie wiadomości w tym kanale będą po cichu blokowane. Różni się to od `groupPolicy: "open"`, gdzie klucz kanału nie jest wymagany do routingu i klucz oparty na nazwie wydaje się działać.

    Zawsze używaj ID kanału Slack jako klucza. Aby go znaleźć: kliknij kanał prawym przyciskiem w Slack → **Kopiuj link** — ID (`C...`) pojawia się na końcu adresu URL.

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

    Niepoprawnie (po cichu blokowane przy `groupPolicy: "allowlist"`):

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

  <Tab title="Wzmianki i użytkownicy kanału">
    Wiadomości kanału domyślnie wymagają wzmianki.

    Źródła wzmianki:

    - jawna wzmianka o aplikacji (`<@botId>`)
    - wzmianka o grupie użytkowników Slack (`<!subteam^S...>`), gdy użytkownik bota jest członkiem tej grupy użytkowników; wymaga `usergroups:read`
    - wzorce wyrażeń regularnych wzmianki (`agents.list[].groupChat.mentionPatterns`, rezerwowo `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie wątku jako odpowiedzi do bota (wyłączone, gdy `thread.requireExplicitMention` ma wartość `true`)

    Kontrole dla poszczególnych kanałów (`channels.slack.channels.<id>`; nazwy tylko przez rozpoznawanie przy uruchomieniu albo `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista dozwolonych)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `id:`, `e164:`, `username:`, `name:` albo symbol wieloznaczny `"*"`
      (starsze klucze bez prefiksu nadal mapują tylko na `id:`)

    `allowBots` jest zachowawcze dla kanałów i kanałów prywatnych: wiadomości w pokojach autorstwa botów są akceptowane tylko wtedy, gdy wysyłający bot jest jawnie wymieniony na liście dozwolonych `users` tego pokoju, albo gdy co najmniej jeden jawny ID właściciela Slack z `channels.slack.allowFrom` jest obecnie członkiem pokoju. Symbole wieloznaczne i wpisy właścicieli oparte na nazwie wyświetlanej nie spełniają warunku obecności właściciela. Obecność właściciela używa Slack `conversations.members`; upewnij się, że aplikacja ma odpowiedni zakres odczytu dla typu pokoju (`channels:read` dla kanałów publicznych, `groups:read` dla kanałów prywatnych). Jeśli wyszukiwanie członków się nie powiedzie, OpenClaw odrzuca wiadomość w pokoju autorstwa bota.

  </Tab>
</Tabs>

## Wątki, sesje i tagi odpowiedzi

- DM są routowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Powiązania tras Slack akceptują surowe ID peerów oraz formy celów Slack, takie jak `channel:C12345678`, `user:U12345678` i `<@U12345678>`.
- Przy domyślnym `session.dmScope=main` DM Slack zwijają się do głównej sesji agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Odpowiedzi w wątkach mogą tworzyć sufiksy sesji wątku (`:thread:<threadTs>`), gdy ma to zastosowanie.
- Domyślne `channels.slack.thread.historyScope` to `thread`; domyślne `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` kontroluje, ile istniejących wiadomości wątku jest pobieranych po rozpoczęciu nowej sesji wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).
- `channels.slack.thread.requireExplicitMention` (domyślnie `false`): gdy `true`, pomija niejawne wzmianki w wątku, aby bot odpowiadał tylko na jawne wzmianki `@bot` wewnątrz wątków, nawet jeśli bot już uczestniczył w wątku. Bez tego odpowiedzi w wątku, w którym uczestniczył bot, omijają bramkowanie `requireMention`.

Kontrole wątków odpowiedzi:

- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: dla każdego `direct|group|channel`
- starszy mechanizm rezerwowy dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Ręczne tagi odpowiedzi są obsługiwane:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` wyłącza **wszystkie** wątki odpowiedzi w Slack, w tym jawne tagi `[[reply_to_*]]`. Różni się to od Telegram, gdzie jawne tagi nadal są honorowane w trybie `"off"`. Wątki Slack ukrywają wiadomości przed kanałem, podczas gdy odpowiedzi Telegram pozostają widoczne w wierszu.
</Note>

## Reakcje potwierdzenia

`ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- rezerwowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"eyes"`).
- Użyj `""`, aby wyłączyć reakcję dla konta Slack albo globalnie.

## Strumieniowanie tekstu

`channels.slack.streaming` kontroluje zachowanie podglądu na żywo:

- `off`: wyłącza strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastępuje tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołącza fragmentaryczne aktualizacje podglądu.
- `progress`: pokazuje tekst statusu postępu podczas generowania, a następnie wysyła tekst końcowy.
- `streaming.preview.toolProgress`: gdy aktywny jest roboczy podgląd, kieruje aktualizacje narzędzi/postępu do tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.

`channels.slack.streaming.nativeTransport` kontroluje natywne strumieniowanie tekstu Slack, gdy `channels.slack.streaming.mode` ma wartość `partial` (domyślnie: `true`).

- Wątek odpowiedzi musi być dostępny, aby pojawiło się natywne strumieniowanie tekstu i status wątku asystenta Slack. Wybór wątku nadal wynika z `replyToMode`.
- Kanały, czaty grupowe i główne korzenie DM nadal mogą używać zwykłego roboczego podglądu, gdy natywne strumieniowanie jest niedostępne albo nie istnieje wątek odpowiedzi.
- Główne DM Slack domyślnie pozostają poza wątkiem, więc nie pokazują natywnego podglądu strumienia/statusu Slack w stylu wątku; zamiast tego OpenClaw publikuje i edytuje roboczy podgląd w DM.
- Media i ładunki nietekstowe wracają do zwykłego dostarczania.
- Końcowe media/błędy anulują oczekujące edycje podglądu; kwalifikujące się końcowe teksty/bloki są opróżniane tylko wtedy, gdy mogą edytować podgląd w miejscu.
- Jeśli strumieniowanie nie powiedzie się w trakcie odpowiedzi, OpenClaw wraca do zwykłego dostarczania pozostałych ładunków.

Użyj roboczego podglądu zamiast natywnego strumieniowania tekstu Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) jest automatycznie migrowane do `channels.slack.streaming.mode`.
- wartość logiczna `channels.slack.streaming` jest automatycznie migrowana do `channels.slack.streaming.mode` i `channels.slack.streaming.nativeTransport`.
- starsze `channels.slack.nativeStreaming` jest automatycznie migrowane do `channels.slack.streaming.nativeTransport`.

## Rezerwowa reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu uruchomienia. Jest to najbardziej przydatne poza odpowiedziami w wątkach, które używają domyślnego wskaźnika statusu „pisze...”.

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje skrótów (na przykład `"hourglass_flowing_sand"`).
- Reakcja działa w trybie best-effort, a czyszczenie jest podejmowane automatycznie po zakończeniu ścieżki odpowiedzi lub błędu.

## Multimedia, dzielenie na fragmenty i dostarczanie

<AccordionGroup>
  <Accordion title="Załączniki przychodzące">
    Załączniki plików Slack są pobierane z prywatnych adresów URL hostowanych przez Slack (przepływ żądań uwierzytelnianych tokenem) i zapisywane w magazynie multimediów, gdy pobieranie się powiedzie i pozwalają na to limity rozmiaru. Placeholdery plików zawierają Slack `fileId`, aby agenci mogli pobrać oryginalny plik za pomocą `download-file`.

    Pobieranie używa ograniczonych limitów czasu bezczynności i całkowitego czasu. Jeśli pobieranie pliku Slack zatrzyma się lub nie powiedzie, OpenClaw kontynuuje przetwarzanie wiadomości i wraca do placeholdera pliku.

    Domyślny limit rozmiaru przychodzących danych w czasie wykonywania to `20MB`, chyba że zostanie zastąpiony przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Tekst i pliki wychodzące">
    - fragmenty tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie z pierwszeństwem akapitów
    - wysyłanie plików używa API przesyłania Slack i może obejmować odpowiedzi w wątkach (`thread_ts`)
    - limit multimediów wychodzących stosuje `channels.slack.mediaMaxMb`, gdy jest skonfigurowany; w przeciwnym razie wysyłki kanału używają domyślnych wartości rodzaju MIME z potoku multimediów

  </Accordion>

  <Accordion title="Cele dostarczania">
    Preferowane jawne cele:

    - `user:<id>` dla DM
    - `channel:<id>` dla kanałów

    DM Slack zawierające tylko tekst/bloki mogą publikować bezpośrednio do identyfikatorów użytkowników; przesyłanie plików i wysyłki w wątkach najpierw otwierają DM przez API konwersacji Slack, ponieważ te ścieżki wymagają konkretnego identyfikatora konwersacji.

  </Accordion>
</AccordionGroup>

## Polecenia i zachowanie slash

Polecenia slash pojawiają się w Slack jako jedno skonfigurowane polecenie albo wiele poleceń natywnych. Skonfiguruj `channels.slack.slashCommand`, aby zmienić domyślne ustawienia polecenia:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Polecenia natywne wymagają [dodatkowych ustawień manifestu](#additional-manifest-settings) w aplikacji Slack i są włączane przez `channels.slack.commands.native: true` albo `commands.native: true` w konfiguracjach globalnych.

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

Slack może renderować kontrolki odpowiedzi interaktywnych tworzonych przez agenta, ale ta funkcja jest domyślnie wyłączona.

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

Lub włącz ją tylko dla jednego konta Slack:

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

Po włączeniu agenci mogą emitować dyrektywy odpowiedzi wyłącznie dla Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Te dyrektywy kompilują się do Slack Block Kit i kierują kliknięcia lub wybory z powrotem przez istniejącą ścieżkę zdarzeń interakcji Slack.

Uwagi:

- To jest interfejs specyficzny dla Slack. Inne kanały nie tłumaczą dyrektyw Slack Block Kit na własne systemy przycisków.
- Wartości callbacków interaktywnych są nieprzezroczystymi tokenami generowanymi przez OpenClaw, a nie surowymi wartościami tworzonymi przez agenta.
- Jeśli wygenerowane bloki interaktywne przekroczyłyby limity Slack Block Kit, OpenClaw wraca do oryginalnej odpowiedzi tekstowej zamiast wysyłać nieprawidłowy payload bloków.

## Zatwierdzenia exec w Slack

Slack może działać jako natywny klient zatwierdzania z interaktywnymi przyciskami i interakcjami, zamiast wracać do Web UI lub terminala.

- Zatwierdzenia exec używają `channels.slack.execApprovals.*` do natywnego routingu DM/kanałów.
- Zatwierdzenia Plugin nadal mogą być rozstrzygane przez tę samą natywną powierzchnię przycisków Slack, gdy żądanie już trafia do Slack, a rodzaj identyfikatora zatwierdzenia to `plugin:`.
- Autoryzacja zatwierdzającego jest nadal wymuszana: tylko użytkownicy zidentyfikowani jako zatwierdzający mogą zatwierdzać lub odrzucać żądania przez Slack.

Używa to tej samej współdzielonej powierzchni przycisków zatwierdzania co inne kanały. Gdy `interactivity` jest włączone w ustawieniach aplikacji Slack, monity o zatwierdzenie renderują się jako przyciski Block Kit bezpośrednio w konwersacji.
Gdy te przyciski są obecne, stanowią podstawowy UX zatwierdzania; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia
czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalne; gdy to możliwe, wraca do `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i zostanie rozpoznany co najmniej jeden
zatwierdzający. Ustaw `enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzania.
Ustaw `enabled: true`, aby wymusić natywne zatwierdzenia, gdy zatwierdzający zostaną rozpoznani.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzeń exec Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Jawna konfiguracja natywna dla Slack jest potrzebna tylko wtedy, gdy chcesz zastąpić zatwierdzających, dodać filtry albo
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

Wspólne przekazywanie `approvals.exec` jest oddzielne. Używaj go tylko wtedy, gdy monity zatwierdzania exec muszą również
trafiać do innych czatów lub jawnych celów poza pasmem. Wspólne przekazywanie `approvals.plugin` również jest
oddzielne; natywne przyciski Slack nadal mogą rozstrzygać zatwierdzenia Plugin, gdy te żądania już trafiają
do Slack.

`/approve` w tym samym czacie działa również w kanałach Slack i DM, które już obsługują polecenia. Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać pełny model przekazywania zatwierdzeń.

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości są mapowane na zdarzenia systemowe.
- Transmisje wątków (odpowiedzi w wątku z opcją „Wyślij również do kanału”) są przetwarzane jak zwykłe wiadomości użytkownika.
- Zdarzenia dodania/usunięcia reakcji są mapowane na zdarzenia systemowe.
- Zdarzenia dołączenia/opuszczenia przez członka, utworzenia/zmiany nazwy kanału oraz dodania/usunięcia przypięcia są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanału, gdy `configWrites` jest włączone.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą zostać wstrzyknięte do kontekstu routingu.
- Inicjator wątku i początkowe zasilanie kontekstu historii wątku są filtrowane przez skonfigurowane listy dozwolonych nadawców, gdy ma to zastosowanie.
- Akcje bloków i interakcje modalne emitują strukturalne zdarzenia systemowe `Slack interaction: ...` z bogatymi polami payloadu:
  - akcje bloków: wybrane wartości, etykiety, wartości selektorów i metadane `workflow_*`
  - zdarzenia modalne `view_submission` i `view_closed` z metadanymi routowanego kanału oraz danymi wejściowymi formularza

## Odniesienie konfiguracji

Podstawowe odniesienie: [Odniesienie konfiguracji - Slack](/pl/gateway/config-channels#slack).

<Accordion title="Pola Slack o wysokiej wartości sygnału">

- tryb/uwierzytelnianie: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- dostęp do DM: `dm.enabled`, `dmPolicy`, `allowFrom` (starsze: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- przełącznik zgodności: `dangerouslyAllowNameMatching` (awaryjny; pozostaw wyłączony, chyba że jest potrzebny)
- dostęp do kanału: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- wątki/historia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operacje/funkcje: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak odpowiedzi w kanałach">
    Sprawdź kolejno:

    - `groupPolicy`
    - lista dozwolonych kanałów (`channels.slack.channels`) — **klucze muszą być identyfikatorami kanałów** (`C12345678`), nie nazwami (`#channel-name`). Klucze oparte na nazwach po cichu zawodzą przy `groupPolicy: "allowlist"`, ponieważ routing kanałów domyślnie najpierw używa identyfikatorów. Aby znaleźć identyfikator: kliknij kanał w Slack prawym przyciskiem → **Kopiuj link** — wartość `C...` na końcu URL to identyfikator kanału.
    - `requireMention`
    - lista dozwolonych `users` dla kanału

    Przydatne polecenia:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Wiadomości DM ignorowane">
    Sprawdź:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (albo starsze `channels.slack.dm.policy`)
    - zatwierdzenia parowania / wpisy listy dozwolonych
    - zdarzenia DM Slack Assistant: szczegółowe logi wspominające `drop message_changed`
      zwykle oznaczają, że Slack wysłał zdarzenie edytowanego wątku Assistant bez
      możliwego do odzyskania nadawcy-człowieka w metadanych wiadomości

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode nie łączy się">
    Zweryfikuj tokeny bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` lub
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło rozpoznać wartości
    opartej na SecretRef.

  </Accordion>

  <Accordion title="Tryb HTTP nie odbiera zdarzeń">
    Zweryfikuj:

    - sekret podpisywania
    - ścieżkę Webhook
    - adresy Slack Request URLs (Events + Interactivity + Slash Commands)
    - unikalny `webhookPath` dla każdego konta HTTP

    Jeśli `signingSecretStatus: "configured_unavailable"` pojawia się w migawkach
    konta, konto HTTP jest skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło
    rozpoznać sekretu podpisywania opartego na SecretRef.

  </Accordion>

  <Accordion title="Polecenia natywne/slash nie uruchamiają się">
    Sprawdź, czy zamierzonym trybem był:

    - tryb poleceń natywnych (`channels.slack.commands.native: true`) z pasującymi poleceniami slash zarejestrowanymi w Slack
    - albo tryb pojedynczego polecenia slash (`channels.slack.slashCommand.enabled: true`)

    Sprawdź też `commands.useAccessGroups` oraz listy dozwolonych kanałów/użytkowników.

  </Accordion>
</AccordionGroup>

## Odniesienie do wizji załączników

Slack może dołączyć pobrane multimedia do tury agenta, gdy pobieranie plików Slack się powiedzie i pozwalają na to limity rozmiaru. Pliki obrazów mogą zostać przekazane przez ścieżkę rozumienia multimediów albo bezpośrednio do modelu odpowiedzi obsługującego wizję; inne pliki są zachowywane jako kontekst pliku do pobrania, a nie traktowane jako wejście obrazu.

### Obsługiwane typy multimediów

| Typ multimediów                  | Źródło                     | Bieżące zachowanie                                                                           | Uwagi                                                                     |
| -------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Obrazy JPEG / PNG / GIF / WebP   | URL pliku Slack            | Pobierane i dołączane do tury w celu obsługi przez mechanizmy obsługujące analizę obrazu     | Limit na plik: `channels.slack.mediaMaxMb` (domyślnie 20 MB)              |
| Pliki PDF                        | URL pliku Slack            | Pobierane i udostępniane jako kontekst pliku dla narzędzi takich jak `download-file` lub `pdf` | Dane przychodzące Slack nie konwertują automatycznie plików PDF na dane wejściowe analizy obrazu |
| Inne pliki                       | URL pliku Slack            | Pobierane, gdy to możliwe, i udostępniane jako kontekst pliku                                 | Pliki binarne nie są traktowane jako dane wejściowe obrazu                |
| Odpowiedzi w wątku               | Pliki wiadomości początkowej wątku | Pliki wiadomości głównej mogą zostać dołączone jako kontekst, gdy odpowiedź nie ma bezpośrednich multimediów | Wiadomości początkowe zawierające tylko pliki używają symbolu zastępczego załącznika |
| Wiadomości z wieloma obrazami    | Wiele plików Slack         | Każdy plik jest oceniany niezależnie                                                          | Przetwarzanie Slack jest ograniczone do ośmiu plików na wiadomość         |

### Potok przychodzący

Gdy przychodzi wiadomość Slack z załącznikami plików:

1. OpenClaw pobiera plik z prywatnego URL Slack przy użyciu tokena bota (`xoxb-...`).
2. Po powodzeniu plik jest zapisywany w magazynie multimediów.
3. Ścieżki pobranych multimediów i typy zawartości są dodawane do kontekstu przychodzącego.
4. Ścieżki modeli/narzędzi obsługujące obrazy mogą używać załączników obrazów z tego kontekstu.
5. Pliki niebędące obrazami pozostają dostępne jako metadane plików lub odwołania do multimediów dla narzędzi, które potrafią je obsłużyć.

### Dziedziczenie załączników z początku wątku

Gdy wiadomość przychodzi w wątku (ma element nadrzędny `thread_ts`):

- Jeśli sama odpowiedź nie ma bezpośrednich multimediów, a dołączona wiadomość główna ma pliki, Slack może dołączyć pliki główne jako kontekst wiadomości początkowej wątku.
- Bezpośrednie załączniki odpowiedzi mają pierwszeństwo przed załącznikami wiadomości głównej.
- Wiadomość główna, która ma tylko pliki i nie ma tekstu, jest reprezentowana przez symbol zastępczy załącznika, aby mechanizm awaryjny nadal mógł uwzględnić jej pliki.

### Obsługa wielu załączników

Gdy pojedyncza wiadomość Slack zawiera wiele załączników plików:

- Każdy załącznik jest przetwarzany niezależnie przez potok multimediów.
- Odwołania do pobranych multimediów są agregowane w kontekście wiadomości.
- Kolejność przetwarzania odpowiada kolejności plików Slack w ładunku zdarzenia.
- Niepowodzenie pobierania jednego załącznika nie blokuje innych.

### Limity rozmiaru, pobierania i modelu

- **Limit rozmiaru**: Domyślnie 20 MB na plik. Konfigurowalne przez `channels.slack.mediaMaxMb`.
- **Niepowodzenia pobierania**: Pliki, których Slack nie może udostępnić, wygasłe URL-e, niedostępne pliki, pliki przekraczające limit rozmiaru oraz odpowiedzi HTML autoryzacji/logowania Slack są pomijane zamiast zgłaszania ich jako nieobsługiwanych formatów.
- **Model wizyjny**: Analiza obrazu używa aktywnego modelu odpowiedzi, gdy obsługuje analizę obrazu, albo modelu obrazu skonfigurowanego w `agents.defaults.imageModel`.

### Znane ograniczenia

| Scenariusz                              | Bieżące zachowanie                                                              | Obejście                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Wygasły URL pliku Slack                 | Plik pominięty; nie jest wyświetlany żaden błąd                                 | Prześlij plik ponownie w Slack                                              |
| Model wizyjny nie jest skonfigurowany   | Załączniki obrazów są przechowywane jako odwołania do multimediów, ale nie są analizowane jako obrazy | Skonfiguruj `agents.defaults.imageModel` albo użyj modelu odpowiedzi obsługującego analizę obrazu |
| Bardzo duże obrazy (> 20 MB domyślnie)  | Pomijane zgodnie z limitem rozmiaru                                              | Zwiększ `channels.slack.mediaMaxMb`, jeśli Slack na to pozwala              |
| Przekazane/udostępnione załączniki      | Tekst oraz multimedia obrazów/plików hostowane przez Slack są obsługiwane na zasadzie best-effort | Udostępnij ponownie bezpośrednio w wątku OpenClaw                           |
| Załączniki PDF                          | Przechowywane jako kontekst pliku/multimediów, nie są automatycznie kierowane przez analizę obrazu | Użyj `download-file` do metadanych pliku albo narzędzia `pdf` do analizy PDF |

### Powiązana dokumentacja

- [Potok rozumienia multimediów](/pl/nodes/media-understanding)
- [Narzędzie PDF](/pl/tools/pdf)
- Epik: [#51349](https://github.com/openclaw/openclaw/issues/51349) — włączenie analizy obrazu załączników Slack
- Testy regresji: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Weryfikacja na żywo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Slack z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie kanału i grupowych DM.
  </Card>
  <Card title="Routing kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i wzmacnianie zabezpieczeń.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Układ konfiguracji i priorytety.
  </Card>
  <Card title="Polecenia ukośnikiem" icon="terminal" href="/pl/tools/slash-commands">
    Katalog poleceń i zachowanie.
  </Card>
</CardGroup>
