---
read_when:
    - Konfigurowanie Slack lub debugowanie trybu socket/HTTP w Slack
summary: Konfiguracja Slack i zachowanie podczas działania (Socket Mode + adresy URL żądań HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-02T09:43:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60e06b138e1579156ccd07bb6db1a25009be970d072ba500b61810c5b78fd01d
    source_path: channels/slack.md
    workflow: 16
---

Gotowe do produkcji dla wiadomości DM i kanałów dzięki integracjom aplikacji Slack. Domyślnym trybem jest Socket Mode; obsługiwane są także HTTP Request URLs.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości DM w Slack domyślnie używają trybu parowania.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Tabs>
  <Tab title="Socket Mode (domyślnie)">
    <Steps>
      <Step title="Utwórz nową aplikację Slack">
        W ustawieniach aplikacji Slack naciśnij przycisk **[Create New App](https://api.slack.com/apps/new)**:

        - wybierz **from a manifest** i wybierz obszar roboczy dla swojej aplikacji
        - wklej poniższy [przykładowy manifest](#manifest-and-scope-checklist) i kontynuuj tworzenie
        - wygeneruj **App-Level Token** (`xapp-...`) z `connections:write`
        - zainstaluj aplikację i skopiuj wyświetlony **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Skonfiguruj OpenClaw">

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

        Zapasowa konfiguracja przez zmienne środowiskowe (tylko konto domyślne):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Uruchom Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Utwórz nową aplikację Slack">
        W ustawieniach aplikacji Slack naciśnij przycisk **[Create New App](https://api.slack.com/apps/new)**:

        - wybierz **from a manifest** i wybierz obszar roboczy dla swojej aplikacji
        - wklej [przykładowy manifest](#manifest-and-scope-checklist) i zaktualizuj adresy URL przed utworzeniem
        - zapisz **Signing Secret** do weryfikacji żądań
        - zainstaluj aplikację i skopiuj wyświetlony **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Skonfiguruj OpenClaw">

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
        Używaj unikalnych ścieżek Webhook dla wielokontowego HTTP

        Nadaj każdemu kontu odrębny `webhookPath` (domyślnie `/slack/events`), aby rejestracje nie kolidowały.
        </Note>

      </Step>

      <Step title="Uruchom Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Dostrajanie transportu Socket Mode

OpenClaw domyślnie ustawia limit czasu oczekiwania klienta Slack SDK na pong na 15 sekund dla Socket Mode. Zastępuj ustawienia transportu tylko wtedy, gdy potrzebujesz dostrajania specyficznego dla obszaru roboczego lub hosta:

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

Używaj tego tylko dla obszarów roboczych Socket Mode, które rejestrują limity czasu pong/websocket lub server-ping Slack, albo działają na hostach ze znanym głodzeniem pętli zdarzeń. `clientPingTimeout` to czas oczekiwania na pong po wysłaniu przez SDK pingu klienta; `serverPingTimeout` to czas oczekiwania na pingi serwera Slack. Wiadomości i zdarzenia aplikacji pozostają stanem aplikacji, a nie sygnałami żywotności transportu.

## Lista kontrolna manifestu i zakresów

Podstawowy manifest aplikacji Slack jest taki sam dla Socket Mode i HTTP Request URLs. Różni się tylko blok `settings` (oraz `url` polecenia ukośnikowego).

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

Dla trybu **HTTP Request URLs** zastąp `settings` wariantem HTTP i dodaj `url` do każdego polecenia ukośnikowego. Wymagany jest publiczny adres URL:

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
        /* same as Socket Mode */
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

Ujawnij różne funkcje, które rozszerzają powyższe ustawienia domyślne.

Domyślny manifest włącza kartę Slack App Home **Home** i subskrybuje `app_home_opened`. Gdy członek obszaru roboczego otworzy kartę Home, OpenClaw publikuje bezpieczny domyślny widok Home za pomocą `views.publish`; nie są dołączane żadne dane konwersacji ani prywatna konfiguracja. Karta **Messages** pozostaje włączona dla wiadomości DM w Slack.

<AccordionGroup>
  <Accordion title="Opcjonalne natywne polecenia ukośnikowe">

    Zamiast jednego skonfigurowanego polecenia można używać wielu [natywnych poleceń ukośnikowych](#commands-and-slash-behavior), z następującymi zastrzeżeniami:

    - Używaj `/agentstatus` zamiast `/status`, ponieważ polecenie `/status` jest zarezerwowane.
    - Jednocześnie można udostępnić nie więcej niż 25 poleceń ukośnikowych.

    Zastąp istniejącą sekcję `features.slash_commands` podzbiorem [dostępnych poleceń](/pl/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (domyślnie)">

```json
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
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Użyj tej samej listy `slash_commands` co w powyższym Socket Mode i dodaj `"url": "https://gateway-host.example.com/slack/events"` do każdego wpisu. Przykład:

```json
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
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Opcjonalne zakresy autorstwa (operacje zapisu)">
    Dodaj zakres bota `chat:write.customize`, jeśli chcesz, aby wiadomości wychodzące używały tożsamości aktywnego agenta (niestandardowa nazwa użytkownika i ikona) zamiast domyślnej tożsamości aplikacji Slack.

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
- `botToken`, `appToken`, `signingSecret` i `userToken` przyjmują zwykłe
  ciągi tekstowe albo obiekty SecretRef.
- Tokeny z konfiguracji zastępują awaryjne wartości ze zmiennych środowiskowych.
- Awaryjne zmienne środowiskowe `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` mają zastosowanie tylko do konta domyślnego.
- `userToken` (`xoxp-...`) jest dostępny tylko w konfiguracji (bez awaryjnej wartości ze zmiennych środowiskowych) i domyślnie działa tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki statusu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status`
  dla poszczególnych poświadczeń (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status to `available`, `configured_unavailable` albo `missing`.
- `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef
  albo inne nieosadzone źródło sekretu, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego
  nie mogła rozwiązać faktycznej wartości.
- W trybie HTTP uwzględniany jest `signingSecretStatus`; w Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
W przypadku akcji/odczytów katalogu token użytkownika może być preferowany, gdy jest skonfigurowany. Do zapisów nadal preferowany jest token bota; zapisy z tokenem użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false`, a token bota jest niedostępny.
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

Bieżące akcje wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` i `emoji-list`. `download-file` przyjmuje identyfikatory plików Slack widoczne w przychodzących symbolach zastępczych plików i zwraca podglądy obrazów dla obrazów albo metadane plików lokalnych dla innych typów plików.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasady wiadomości bezpośrednich">
    `channels.slack.dmPolicy` kontroluje dostęp do wiadomości bezpośrednich. `channels.slack.allowFrom` jest kanoniczną listą dozwolonych nadawców wiadomości bezpośrednich.

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.slack.allowFrom` zawierało `"*"`)
    - `disabled`

    Flagi wiadomości bezpośrednich:

    - `dm.enabled` (domyślnie true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (starsze)
    - `dm.groupEnabled` (grupowe wiadomości bezpośrednie domyślnie false)
    - `dm.groupChannels` (opcjonalna lista dozwolonych MPIM)

    Kolejność pierwszeństwa dla wielu kont:

    - `channels.slack.accounts.default.allowFrom` ma zastosowanie tylko do konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Starsze `channels.slack.dm.policy` i `channels.slack.dm.allowFrom` są nadal odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Parowanie w wiadomościach bezpośrednich używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Zasady kanałów">
    `channels.slack.groupPolicy` kontroluje obsługę kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Lista dozwolonych kanałów znajduje się pod `channels.slack.channels` i **musi używać stabilnych identyfikatorów kanałów Slack** (na przykład `C12345678`) jako kluczy konfiguracji.

    Uwaga o środowisku uruchomieniowym: jeśli `channels.slack` całkowicie brakuje (konfiguracja tylko ze zmiennych środowiskowych), środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logu (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozwiązywanie nazw/identyfikatorów:

    - wpisy listy dozwolonych kanałów i wpisy listy dozwolonych wiadomości bezpośrednich są rozwiązywane podczas uruchamiania, gdy pozwala na to dostęp tokena
    - nierozwiązane wpisy nazw kanałów są zachowywane zgodnie z konfiguracją, ale domyślnie ignorowane przy routingu
    - autoryzacja przychodząca i routing kanałów domyślnie najpierw używają identyfikatorów; bezpośrednie dopasowanie nazwy użytkownika/sluga wymaga `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Klucze oparte na nazwach (`#channel-name` albo `channel-name`) **nie** są dopasowywane przy `groupPolicy: "allowlist"`. Wyszukiwanie kanału domyślnie najpierw używa identyfikatora, więc klucz oparty na nazwie nigdy nie zostanie skutecznie skierowany, a wszystkie wiadomości w tym kanale zostaną po cichu zablokowane. Różni się to od `groupPolicy: "open"`, gdzie klucz kanału nie jest wymagany do routingu i klucz oparty na nazwie wydaje się działać.

    Zawsze używaj identyfikatora kanału Slack jako klucza. Aby go znaleźć: kliknij kanał w Slack prawym przyciskiem myszy → **Kopiuj link** — identyfikator (`C...`) znajduje się na końcu URL.

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
    Wiadomości kanałowe domyślnie wymagają wzmianki.

    Źródła wzmianek:

    - jawna wzmianka o aplikacji (`<@botId>`)
    - wzmianka o grupie użytkowników Slack (`<!subteam^S...>`), gdy użytkownik bota jest członkiem tej grupy użytkowników; wymaga `usergroups:read`
    - wzorce wyrażeń regularnych wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi w wątku do bota (wyłączone, gdy `thread.requireExplicitMention` ma wartość `true`)

    Kontrolki per kanał (`channels.slack.channels.<id>`; nazwy tylko przez rozwiązywanie przy starcie albo `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista dozwolonych)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `id:`, `e164:`, `username:`, `name:` albo symbol wieloznaczny `"*"`
      (starsze klucze bez prefiksu nadal mapują tylko do `id:`)

    `allowBots` jest konserwatywne dla kanałów i kanałów prywatnych: wiadomości w pokoju autorstwa botów są akceptowane tylko wtedy, gdy wysyłający bot jest jawnie wymieniony na liście dozwolonych `users` tego pokoju albo gdy co najmniej jeden jawny identyfikator właściciela Slack z `channels.slack.allowFrom` jest obecnie członkiem pokoju. Symbole wieloznaczne i wpisy właścicieli z nazwą wyświetlaną nie spełniają warunku obecności właściciela. Obecność właściciela używa `conversations.members` Slack; upewnij się, że aplikacja ma odpowiedni zakres odczytu dla typu pokoju (`channels:read` dla kanałów publicznych, `groups:read` dla kanałów prywatnych). Jeśli wyszukiwanie członków się nie powiedzie, OpenClaw odrzuca wiadomość w pokoju autorstwa bota.

  </Tab>
</Tabs>

## Wątki, sesje i znaczniki odpowiedzi

- Wiadomości bezpośrednie są routowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Powiązania tras Slack przyjmują surowe identyfikatory peerów oraz formy celu Slack, takie jak `channel:C12345678`, `user:U12345678` i `<@U12345678>`.
- Przy domyślnym `session.dmScope=main` wiadomości bezpośrednie Slack zwijają się do głównej sesji agenta.
- Sesje kanału: `agent:<agentId>:slack:channel:<channelId>`.
- Odpowiedzi w wątku mogą tworzyć sufiksy sesji wątku (`:thread:<threadTs>`), gdy ma to zastosowanie.
- Domyślne `channels.slack.thread.historyScope` to `thread`; domyślne `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` kontroluje, ile istniejących wiadomości wątku jest pobieranych przy uruchamianiu nowej sesji wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).
- `channels.slack.thread.requireExplicitMention` (domyślnie `false`): gdy `true`, tłumi niejawne wzmianki w wątku, więc bot odpowiada tylko na jawne wzmianki `@bot` w wątkach, nawet jeśli bot już uczestniczył w wątku. Bez tego odpowiedzi w wątku, w którym uczestniczył bot, omijają bramkowanie `requireMention`.

Kontrolki odpowiedzi w wątkach:

- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- starsze awaryjne ustawienie dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Ręczne znaczniki odpowiedzi są obsługiwane:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` wyłącza **wszystkie** odpowiedzi w wątkach w Slack, w tym jawne znaczniki `[[reply_to_*]]`. Różni się to od Telegram, gdzie jawne znaczniki są nadal honorowane w trybie `"off"`. Wątki Slack ukrywają wiadomości przed kanałem, podczas gdy odpowiedzi Telegram pozostają widoczne w treści.
</Note>

## Reakcje potwierdzenia

`ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

Kolejność rozwiązywania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- awaryjne emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"eyes"`).
- Użyj `""`, aby wyłączyć reakcję dla konta Slack albo globalnie.

## Strumieniowanie tekstu

`channels.slack.streaming` kontroluje zachowanie podglądu na żywo:

- `off`: wyłącz strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastąp tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołączaj porcjowane aktualizacje podglądu.
- `progress`: pokazuj tekst statusu postępu podczas generowania, a następnie wyślij tekst końcowy.
- `streaming.preview.toolProgress`: gdy podgląd wersji roboczej jest aktywny, kieruj aktualizacje narzędzi/postępu do tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.

`channels.slack.streaming.nativeTransport` kontroluje natywne strumieniowanie tekstu Slack, gdy `channels.slack.streaming.mode` ma wartość `partial` (domyślnie: `true`).

- Wątek odpowiedzi musi być dostępny, aby pojawiły się natywne strumieniowanie tekstu i status wątku asystenta Slack. Wybór wątku nadal jest zgodny z `replyToMode`.
- Korzenie kanałów i czatów grupowych nadal mogą używać zwykłego podglądu wersji roboczej, gdy natywne strumieniowanie jest niedostępne.
- Wiadomości bezpośrednie Slack najwyższego poziomu domyślnie pozostają poza wątkiem, więc nie pokazują podglądu w stylu wątku; użyj odpowiedzi w wątkach albo `typingReaction`, jeśli chcesz tam widoczny postęp.
- Media i ładunki nietekstowe wracają do zwykłego dostarczania.
- Końcowe media/błędy anulują oczekujące edycje podglądu; kwalifikujące się końcowe teksty/bloki są opróżniane tylko wtedy, gdy mogą edytować podgląd w miejscu.
- Jeśli strumieniowanie zawiedzie w trakcie odpowiedzi, OpenClaw wraca do zwykłego dostarczania pozostałych ładunków.

Użyj podglądu wersji roboczej zamiast natywnego strumieniowania tekstu Slack:

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

## Awaryjna reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu przebiegu. Jest to najbardziej przydatne poza odpowiedziami w wątkach, które używają domyślnego wskaźnika statusu "is typing...".

Kolejność rozwiązywania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"hourglass_flowing_sand"`).
- Reakcja jest realizowana na zasadzie best-effort, a czyszczenie jest podejmowane automatycznie po ukończeniu ścieżki odpowiedzi albo błędu.

## Media, porcjowanie i dostarczanie

<AccordionGroup>
  <Accordion title="Załączniki przychodzące">
    Załączniki plików Slack są pobierane z prywatnych adresów URL hostowanych przez Slack (przepływ żądania uwierzytelnianego tokenem) i zapisywane w magazynie multimediów, gdy pobieranie się powiedzie, a limity rozmiaru na to pozwalają. Symbole zastępcze plików zawierają `fileId` Slack, aby agenci mogli pobrać oryginalny plik za pomocą `download-file`.

    Pobieranie używa ograniczonych limitów czasu bezczynności i całkowitego czasu. Jeśli pobieranie pliku Slack się zatrzyma lub nie powiedzie, OpenClaw kontynuuje przetwarzanie wiadomości i wraca do symbolu zastępczego pliku.

    Domyślny limit rozmiaru przychodzącego w runtime to `20MB`, chyba że zostanie nadpisany przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Tekst i pliki wychodzące">
    - fragmenty tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie z pierwszeństwem akapitów
    - wysyłanie plików używa API przesyłania Slack i może obejmować odpowiedzi w wątkach (`thread_ts`)
    - limit multimediów wychodzących stosuje `channels.slack.mediaMaxMb`, gdy jest skonfigurowany; w przeciwnym razie wysyłanie w kanale używa domyślnych wartości rodzaju MIME z potoku multimediów

  </Accordion>

  <Accordion title="Cele dostarczania">
    Preferowane jawne cele:

    - `user:<id>` dla wiadomości prywatnych
    - `channel:<id>` dla kanałów

    Wiadomości prywatne Slack zawierające tylko tekst/bloki mogą publikować bezpośrednio do identyfikatorów użytkowników; przesyłanie plików i wysyłanie w wątkach najpierw otwierają wiadomość prywatną przez API konwersacji Slack, ponieważ te ścieżki wymagają konkretnego identyfikatora konwersacji.

  </Accordion>
</AccordionGroup>

## Polecenia i zachowanie ukośnika

Polecenia ukośnikowe pojawiają się w Slack jako jedno skonfigurowane polecenie albo wiele poleceń natywnych. Skonfiguruj `channels.slack.slashCommand`, aby zmienić domyślne wartości poleceń:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Polecenia natywne wymagają [dodatkowych ustawień manifestu](#additional-manifest-settings) w aplikacji Slack i są zamiast tego włączane przez `channels.slack.commands.native: true` albo `commands.native: true` w konfiguracjach globalnych.

- Tryb automatyczny poleceń natywnych jest **wyłączony** dla Slack, więc `commands.native: "auto"` nie włącza natywnych poleceń Slack.

```txt
/help
```

Menu argumentów natywnych używają adaptacyjnej strategii renderowania, która pokazuje modal potwierdzenia przed przekazaniem wybranej wartości opcji:

- do 5 opcji: bloki przycisków
- 6-100 opcji: statyczne menu wyboru
- więcej niż 100 opcji: zewnętrzny wybór z asynchronicznym filtrowaniem opcji, gdy dostępne są programy obsługi opcji interaktywności
- przekroczone limity Slack: zakodowane wartości opcji wracają do przycisków

```txt
/think
```

Sesje ukośnikowe używają izolowanych kluczy, takich jak `agent:<agentId>:slack:slash:<userId>`, i nadal kierują wykonania poleceń do docelowej sesji konwersacji za pomocą `CommandTargetSessionKey`.

## Odpowiedzi interaktywne

Slack może renderować interaktywne kontrolki odpowiedzi tworzone przez agenta, ale ta funkcja jest domyślnie wyłączona.

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

- To jest interfejs użytkownika specyficzny dla Slack. Inne kanały nie tłumaczą dyrektyw Slack Block Kit na własne systemy przycisków.
- Wartości wywołań zwrotnych interakcji są nieprzezroczystymi tokenami wygenerowanymi przez OpenClaw, a nie surowymi wartościami tworzonymi przez agenta.
- Jeśli wygenerowane bloki interaktywne przekroczyłyby limity Slack Block Kit, OpenClaw wraca do oryginalnej odpowiedzi tekstowej zamiast wysyłać nieprawidłowy ładunek bloków.

## Zatwierdzenia exec w Slack

Slack może działać jako natywny klient zatwierdzeń z interaktywnymi przyciskami i interakcjami, zamiast wracać do interfejsu Web UI lub terminala.

- Zatwierdzenia exec używają `channels.slack.execApprovals.*` do natywnego routingu wiadomości prywatnych/kanałów.
- Zatwierdzenia Plugin mogą nadal być rozstrzygane przez tę samą natywną powierzchnię przycisków Slack, gdy żądanie już trafia do Slack, a rodzaj identyfikatora zatwierdzenia to `plugin:`.
- Autoryzacja zatwierdzającego jest nadal egzekwowana: tylko użytkownicy zidentyfikowani jako zatwierdzający mogą zatwierdzać lub odrzucać żądania przez Slack.

Używa to tej samej współdzielonej powierzchni przycisku zatwierdzenia co inne kanały. Gdy `interactivity` jest włączone w ustawieniach aplikacji Slack, monity zatwierdzeń renderują się jako przyciski Block Kit bezpośrednio w konwersacji.
Gdy te przyciski są obecne, są podstawowym interfejsem zatwierdzania; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia
czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalne; wraca do `commands.ownerAllowFrom`, gdy to możliwe)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i co najmniej jeden
zatwierdzający zostanie rozpoznany. Ustaw `enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzeń.
Ustaw `enabled: true`, aby wymusić natywne zatwierdzenia, gdy zatwierdzający zostaną rozpoznani.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzeń exec Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Jawna konfiguracja natywna Slack jest potrzebna tylko wtedy, gdy chcesz nadpisać zatwierdzających, dodać filtry lub
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

Wspólne przekazywanie `approvals.exec` jest oddzielne. Używaj go tylko wtedy, gdy monity zatwierdzeń exec muszą też
być kierowane do innych czatów lub jawnych celów poza pasmem. Wspólne przekazywanie `approvals.plugin` również jest
oddzielne; natywne przyciski Slack nadal mogą rozstrzygać zatwierdzenia Plugin, gdy te żądania już trafiają
do Slack.

`/approve` w tym samym czacie działa też w kanałach i wiadomościach prywatnych Slack, które już obsługują polecenia. Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać pełny model przekazywania zatwierdzeń.

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości są mapowane na zdarzenia systemowe.
- Transmisje wątków (odpowiedzi w wątku „Wyślij także do kanału”) są przetwarzane jako zwykłe wiadomości użytkownika.
- Zdarzenia dodania/usunięcia reakcji są mapowane na zdarzenia systemowe.
- Zdarzenia dołączenia/opuszczenia przez członka, utworzenia/zmiany nazwy kanału oraz dodania/usunięcia przypięcia są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanału, gdy `configWrites` jest włączone.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą zostać wstrzyknięte do kontekstu routingu.
- Inicjator wątku i początkowe zasilanie kontekstu historii wątku są filtrowane przez skonfigurowane listy dozwolonych nadawców, gdy ma to zastosowanie.
- Akcje bloków i interakcje modalne emitują ustrukturyzowane zdarzenia systemowe `Slack interaction: ...` z bogatymi polami ładunku:
  - akcje bloków: wybrane wartości, etykiety, wartości selektorów i metadane `workflow_*`
  - zdarzenia modalne `view_submission` i `view_closed` z metadanymi kierowanego kanału i danymi wejściowymi formularza

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji - Slack](/pl/gateway/config-channels#slack).

<Accordion title="Najważniejsze pola Slack">

- tryb/uwierzytelnianie: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- dostęp do wiadomości prywatnych: `dm.enabled`, `dmPolicy`, `allowFrom` (starsze: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
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
    - lista dozwolonych kanałów (`channels.slack.channels`) — **klucze muszą być identyfikatorami kanałów** (`C12345678`), a nie nazwami (`#channel-name`). Klucze oparte na nazwach po cichu zawodzą przy `groupPolicy: "allowlist"`, ponieważ routing kanałów domyślnie zaczyna od identyfikatora. Aby znaleźć identyfikator: kliknij kanał prawym przyciskiem myszy w Slack → **Copy link** — wartość `C...` na końcu adresu URL to identyfikator kanału.
    - `requireMention`
    - lista dozwolonych `users` dla kanału

    Przydatne polecenia:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Wiadomości prywatne ignorowane">
    Sprawdź:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (albo starsze `channels.slack.dm.policy`)
    - zatwierdzenia parowania / wpisy listy dozwolonych
    - zdarzenia wiadomości prywatnych Slack Assistant: szczegółowe logi wspominające `drop message_changed`
      zwykle oznaczają, że Slack wysłał edytowane zdarzenie wątku Assistant bez
      możliwego do odzyskania ludzkiego nadawcy w metadanych wiadomości

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode nie łączy się">
    Zweryfikuj tokeny bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` albo
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżący runtime nie mógł rozpoznać wartości opartej na SecretRef.

  </Accordion>

  <Accordion title="Tryb HTTP nie odbiera zdarzeń">
    Zweryfikuj:

    - sekret podpisywania
    - ścieżkę Webhook
    - adresy URL żądań Slack (Zdarzenia + Interaktywność + Polecenia ukośnikowe)
    - unikalny `webhookPath` dla każdego konta HTTP

    Jeśli `signingSecretStatus: "configured_unavailable"` pojawia się w migawkach
    kont, konto HTTP jest skonfigurowane, ale bieżący runtime nie mógł
    rozpoznać sekretu podpisywania opartego na SecretRef.

  </Accordion>

  <Accordion title="Polecenia natywne/ukośnikowe się nie uruchamiają">
    Zweryfikuj, czy zamierzony był:

    - tryb poleceń natywnych (`channels.slack.commands.native: true`) z pasującymi poleceniami ukośnikowymi zarejestrowanymi w Slack
    - albo tryb pojedynczego polecenia ukośnikowego (`channels.slack.slashCommand.enabled: true`)

    Sprawdź także `commands.useAccessGroups` oraz listy dozwolonych kanałów/użytkowników.

  </Accordion>
</AccordionGroup>

## Dokumentacja obsługi obrazu w załącznikach

Slack może dołączyć pobrane multimedia do tury agenta, gdy pobieranie plików Slack się powiedzie, a limity rozmiaru na to pozwalają. Pliki obrazów mogą zostać przekazane przez ścieżkę rozumienia multimediów albo bezpośrednio do modelu odpowiedzi obsługującego obraz; inne pliki są zachowywane jako kontekst pliku do pobrania, a nie traktowane jako wejście obrazu.

### Obsługiwane typy multimediów

| Typ multimediów                | Źródło               | Bieżące zachowanie                                                             | Uwagi                                                                       |
| ------------------------------ | -------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Obrazy JPEG / PNG / GIF / WebP | URL pliku Slack      | Pobierane i dołączane do tury do obsługi z użyciem funkcji widzenia           | Limit na plik: `channels.slack.mediaMaxMb` (domyślnie 20 MB)                |
| Pliki PDF                      | URL pliku Slack      | Pobierane i udostępniane jako kontekst pliku dla narzędzi takich jak `download-file` lub `pdf` | Ruch przychodzący Slack nie konwertuje automatycznie plików PDF na wejście wizyjne obrazu |
| Inne pliki                     | URL pliku Slack      | Pobierane, gdy to możliwe, i udostępniane jako kontekst pliku                  | Pliki binarne nie są traktowane jako wejście obrazu                         |
| Odpowiedzi w wątku             | Pliki wiadomości początkowej wątku | Pliki wiadomości głównej mogą zostać uzupełnione jako kontekst, gdy odpowiedź nie ma bezpośrednich multimediów | Wiadomości początkowe zawierające tylko pliki używają symbolu zastępczego załącznika |
| Wiadomości z wieloma obrazami  | Wiele plików Slack   | Każdy plik jest oceniany niezależnie                                           | Przetwarzanie Slack jest ograniczone do ośmiu plików na wiadomość           |

### Potok przychodzący

Gdy nadejdzie wiadomość Slack z załącznikami plików:

1. OpenClaw pobiera plik z prywatnego URL Slack przy użyciu tokenu bota (`xoxb-...`).
2. Po powodzeniu plik jest zapisywany w magazynie multimediów.
3. Pobrane ścieżki multimediów i typy zawartości są dodawane do kontekstu przychodzącego.
4. Ścieżki modelu/narzędzi obsługujące obrazy mogą używać załączników obrazów z tego kontekstu.
5. Pliki niebędące obrazami pozostają dostępne jako metadane plików lub odwołania do multimediów dla narzędzi, które potrafią je obsłużyć.

### Dziedziczenie załączników z początku wątku

Gdy wiadomość nadejdzie w wątku (ma nadrzędne `thread_ts`):

- Jeśli sama odpowiedź nie ma bezpośrednich multimediów, a dołączona wiadomość główna ma pliki, Slack może uzupełnić pliki główne jako kontekst wiadomości początkowej wątku.
- Bezpośrednie załączniki odpowiedzi mają pierwszeństwo przed załącznikami wiadomości głównej.
- Wiadomość główna, która ma tylko pliki i nie ma tekstu, jest reprezentowana przez symbol zastępczy załącznika, aby mechanizm fallback nadal mógł uwzględnić jej pliki.

### Obsługa wielu załączników

Gdy jedna wiadomość Slack zawiera wiele załączników plików:

- Każdy załącznik jest przetwarzany niezależnie przez potok multimediów.
- Pobrane odwołania do multimediów są agregowane w kontekście wiadomości.
- Kolejność przetwarzania odpowiada kolejności plików Slack w ładunku zdarzenia.
- Niepowodzenie pobrania jednego załącznika nie blokuje pozostałych.

### Limity rozmiaru, pobierania i modelu

- **Limit rozmiaru**: Domyślnie 20 MB na plik. Konfigurowalne przez `channels.slack.mediaMaxMb`.
- **Niepowodzenia pobierania**: Pliki, których Slack nie może udostępnić, wygasłe URL, niedostępne pliki, pliki przekraczające limit oraz odpowiedzi HTML uwierzytelniania/logowania Slack są pomijane zamiast zgłaszania ich jako nieobsługiwanych formatów.
- **Model wizyjny**: Analiza obrazów używa aktywnego modelu odpowiedzi, gdy obsługuje widzenie, albo modelu obrazu skonfigurowanego w `agents.defaults.imageModel`.

### Znane ograniczenia

| Scenariusz                            | Bieżące zachowanie                                                         | Obejście                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Wygasły URL pliku Slack               | Plik pominięty; nie pokazano błędu                                         | Prześlij plik ponownie w Slack                                                |
| Model wizyjny nie jest skonfigurowany | Załączniki obrazów są przechowywane jako odwołania do multimediów, ale nie są analizowane jako obrazy | Skonfiguruj `agents.defaults.imageModel` albo użyj modelu odpowiedzi obsługującego widzenie |
| Bardzo duże obrazy (> domyślnie 20 MB) | Pomijane zgodnie z limitem rozmiaru                                        | Zwiększ `channels.slack.mediaMaxMb`, jeśli Slack na to pozwala                |
| Przekazane/udostępnione załączniki    | Tekst oraz multimedia obrazów/plików hostowane przez Slack są obsługiwane w miarę możliwości | Udostępnij ponownie bezpośrednio w wątku OpenClaw                             |
| Załączniki PDF                        | Przechowywane jako kontekst pliku/multimediów, bez automatycznego kierowania przez widzenie obrazu | Użyj `download-file` do metadanych pliku albo narzędzia `pdf` do analizy PDF  |

### Powiązana dokumentacja

- [Potok rozumienia multimediów](/pl/nodes/media-understanding)
- [Narzędzie PDF](/pl/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — włączenie widzenia załączników Slack
- Testy regresji: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Weryfikacja live: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Powiązane

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Slack z Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pl/channels/groups">
    Zachowanie kanałów i grupowych wiadomości prywatnych.
  </Card>
  <Card title="Channel routing" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Security" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Configuration" icon="sliders" href="/pl/gateway/configuration">
    Układ konfiguracji i pierwszeństwo.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pl/tools/slash-commands">
    Katalog poleceń i zachowanie.
  </Card>
</CardGroup>
