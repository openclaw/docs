---
read_when:
    - Konfiguracja Slack lub debugowanie trybu Socket/HTTP w Slack
summary: Konfiguracja Slack i zachowanie w czasie działania (Socket Mode + adresy URL żądań HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-30T09:39:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08024bd947ddeb00a1ab3aaa3864cf31817303bbc0523902acdc539fc662e127
    source_path: channels/slack.md
    workflow: 16
---

Gotowe do produkcji dla wiadomości prywatnych i kanałów przez integracje aplikacji Slack. Domyślnym trybem jest Socket Mode; obsługiwane są też HTTP Request URLs.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Slack domyślnie używają trybu parowania.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Natywne działanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka między kanałami i scenariusze naprawy.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Tabs>
  <Tab title="Socket Mode (domyślnie)">
    <Steps>
      <Step title="Utwórz nową aplikację Slack">
        W ustawieniach aplikacji Slack naciśnij przycisk **[Create New App](https://api.slack.com/apps/new)**:

        - wybierz **from a manifest** i wskaż obszar roboczy dla swojej aplikacji
        - wklej poniższy [przykładowy manifest](#manifest-and-scope-checklist) i kontynuuj tworzenie
        - wygeneruj **App-Level Token** (`xapp-...`) z `connections:write`
        - zainstaluj aplikację i skopiuj pokazany **Bot Token** (`xoxb-...`)

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

        Rezerwowa konfiguracja env (tylko konto domyślne):

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

        - wybierz **from a manifest** i wskaż obszar roboczy dla swojej aplikacji
        - wklej [przykładowy manifest](#manifest-and-scope-checklist) i zaktualizuj URL-e przed utworzeniem
        - zapisz **Signing Secret** do weryfikacji żądań
        - zainstaluj aplikację i skopiuj pokazany **Bot Token** (`xoxb-...`)

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
        Używaj unikatowych ścieżek Webhook dla HTTP z wieloma kontami

        Nadaj każdemu kontu odrębny `webhookPath` (domyślnie `/slack/events`), aby rejestracje ze sobą nie kolidowały.
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

OpenClaw domyślnie ustawia limit czasu pong klienta Slack SDK na 15 sekund dla Socket Mode. Nadpisuj ustawienia transportu tylko wtedy, gdy potrzebujesz dostrojenia specyficznego dla obszaru roboczego lub hosta:

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

Używaj tego tylko w obszarach roboczych Socket Mode, które rejestrują limity czasu Slack websocket pong/server-ping, albo działają na hostach ze znanym wygłodzeniem pętli zdarzeń. `clientPingTimeout` to czas oczekiwania na pong po wysłaniu przez SDK pingu klienta; `serverPingTimeout` to czas oczekiwania na pingi serwera Slack. Wiadomości i zdarzenia aplikacji pozostają stanem aplikacji, a nie sygnałami żywotności transportu.

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
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
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

Dla trybu **HTTP Request URLs** zastąp `settings` wariantem HTTP i dodaj `url` do każdego polecenia slash. Wymagany jest publiczny URL:

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

Udostępnij różne funkcje, które rozszerzają powyższe wartości domyślne.

<AccordionGroup>
  <Accordion title="Opcjonalne natywne polecenia slash">

    Można używać wielu [natywnych poleceń slash](#commands-and-slash-behavior) zamiast jednego skonfigurowanego polecenia, z uwzględnieniem niuansów:

    - Używaj `/agentstatus` zamiast `/status`, ponieważ polecenie `/status` jest zarezerwowane.
    - Jednocześnie można udostępnić nie więcej niż 25 poleceń slash.

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
        Użyj tej samej listy `slash_commands` co w Socket Mode powyżej i dodaj `"url": "https://gateway-host.example.com/slack/events"` do każdego wpisu. Przykład:

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
    Dodaj zakres bota `chat:write.customize`, jeśli chcesz, aby wiadomości wychodzące używały tożsamości aktywnego agenta (niestandardowej nazwy użytkownika i ikony) zamiast domyślnej tożsamości aplikacji Slack.

    Jeśli używasz ikony emoji, Slack oczekuje składni `:emoji_name:`.

  </Accordion>
  <Accordion title="Opcjonalne zakresy tokenu użytkownika (operacje odczytu)">
    Jeśli konfigurujesz `channels.slack.userToken`, typowe zakresy odczytu to:

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
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują jawne
  ciągi tekstowe lub obiekty SecretRef.
- Tokeny konfiguracji nadpisują zapasowe wartości env.
- Zapasowe wartości env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` mają zastosowanie tylko do konta domyślnego.
- `userToken` (`xoxp-...`) jest dostępny tylko w konfiguracji (bez zapasowej wartości env) i domyślnie działa w trybie tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki statusu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status`
  dla poszczególnych poświadczeń (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status to `available`, `configured_unavailable` albo `missing`.
- `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef
  lub inne nieosadzone źródło sekretu, ale bieżąca ścieżka polecenia/środowiska wykonawczego
  nie mogła rozwiązać faktycznej wartości.
- W trybie HTTP uwzględniany jest `signingSecretStatus`; w trybie Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
W przypadku akcji/odczytów katalogu token użytkownika może być preferowany, gdy jest skonfigurowany. Przy zapisach nadal preferowany jest token bota; zapisy tokenem użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false`, a token bota jest niedostępny.
</Tip>

## Akcje i bramki

Akcjami Slack steruje `channels.slack.actions.*`.

Dostępne grupy akcji w bieżących narzędziach Slack:

| Grupa      | Domyślnie |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Bieżące akcje wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` i `emoji-list`. `download-file` akceptuje identyfikatory plików Slack pokazane w zastępnikach plików przychodzących i zwraca podglądy obrazów dla obrazów albo metadane pliku lokalnego dla innych typów plików.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` steruje dostępem do DM. `channels.slack.allowFrom` jest kanoniczną listą dozwolonych DM.

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

    Starsze `channels.slack.dm.policy` i `channels.slack.dm.allowFrom` nadal są odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Parowanie w DM używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` steruje obsługą kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Lista dozwolonych kanałów znajduje się pod `channels.slack.channels` i **musi używać stabilnych identyfikatorów kanałów Slack** (na przykład `C12345678`) jako kluczy konfiguracji.

    Uwaga dotycząca środowiska wykonawczego: jeśli `channels.slack` całkowicie brakuje (konfiguracja tylko przez env), środowisko wykonawcze używa zapasowo `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logach (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozwiązywanie nazw/identyfikatorów:

    - wpisy listy dozwolonych kanałów i wpisy listy dozwolonych DM są rozwiązywane przy uruchomieniu, gdy pozwala na to dostęp tokena
    - nierozwiązane wpisy nazw kanałów są zachowywane zgodnie z konfiguracją, ale domyślnie ignorowane przy routingu
    - autoryzacja przychodząca i routing kanałów są domyślnie najpierw oparte na identyfikatorach; bezpośrednie dopasowanie nazwy użytkownika/sluga wymaga `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Klucze oparte na nazwie (`#channel-name` albo `channel-name`) **nie** pasują przy `groupPolicy: "allowlist"`. Wyszukiwanie kanału jest domyślnie najpierw oparte na identyfikatorze, więc klucz oparty na nazwie nigdy nie zostanie poprawnie skierowany, a wszystkie wiadomości w tym kanale zostaną cicho zablokowane. Różni się to od `groupPolicy: "open"`, gdzie klucz kanału nie jest wymagany do routingu i klucz oparty na nazwie wydaje się działać.

    Zawsze używaj identyfikatora kanału Slack jako klucza. Aby go znaleźć: kliknij kanał w Slack prawym przyciskiem myszy → **Copy link** — identyfikator (`C...`) znajduje się na końcu URL.

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

    Niepoprawnie (cicho blokowane przy `groupPolicy: "allowlist"`):

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
    Wiadomości kanałowe domyślnie wymagają wzmianki.

    Źródła wzmianek:

    - jawna wzmianka o aplikacji (`<@botId>`)
    - wzorce regex wzmianek (`agents.list[].groupChat.mentionPatterns`, zapasowo `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie wątku odpowiedzi do bota (wyłączone, gdy `thread.requireExplicitMention` ma wartość `true`)

    Kontrole per kanał (`channels.slack.channels.<id>`; nazwy tylko przez rozwiązywanie przy uruchomieniu albo `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista dozwolonych)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `id:`, `e164:`, `username:`, `name:` albo symbol wieloznaczny `"*"`
      (starsze klucze bez prefiksu nadal mapują tylko na `id:`)

  </Tab>
</Tabs>

## Wątki, sesje i znaczniki odpowiedzi

- DM są routowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Przy domyślnym `session.dmScope=main`, DM Slack zwijają się do głównej sesji agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Odpowiedzi w wątku mogą tworzyć sufiksy sesji wątku (`:thread:<threadTs>`), gdy ma to zastosowanie.
- Domyślna wartość `channels.slack.thread.historyScope` to `thread`; domyślna wartość `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` steruje liczbą istniejących wiadomości wątku pobieranych przy uruchomieniu nowej sesji wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).
- `channels.slack.thread.requireExplicitMention` (domyślnie `false`): gdy `true`, wycisza niejawne wzmianki w wątku, aby bot odpowiadał tylko na jawne wzmianki `@bot` wewnątrz wątków, nawet jeśli bot już uczestniczył w wątku. Bez tego odpowiedzi w wątku, w którym uczestniczył bot, omijają bramkowanie `requireMention`.

Kontrole wątków odpowiedzi:

- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- starsza wartość zapasowa dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Obsługiwane są ręczne znaczniki odpowiedzi:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` wyłącza **wszystkie** wątki odpowiedzi w Slack, w tym jawne znaczniki `[[reply_to_*]]`. Różni się to od Telegram, gdzie jawne znaczniki nadal są honorowane w trybie `"off"`. Wątki Slack ukrywają wiadomości przed kanałem, podczas gdy odpowiedzi Telegram pozostają widoczne w tekście.
</Note>

## Reakcje potwierdzenia

`ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

Kolejność rozwiązywania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- zapasowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"eyes"`).
- Użyj `""`, aby wyłączyć reakcję dla konta Slack albo globalnie.

## Strumieniowanie tekstu

`channels.slack.streaming` steruje zachowaniem podglądu na żywo:

- `off`: wyłącz strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastępuj tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołączaj porcjowane aktualizacje podglądu.
- `progress`: pokazuj tekst statusu postępu podczas generowania, a następnie wyślij tekst finalny.
- `streaming.preview.toolProgress`: gdy wersja robocza podglądu jest aktywna, kieruj aktualizacje narzędzi/postępu do tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.

`channels.slack.streaming.nativeTransport` steruje natywnym strumieniowaniem tekstu Slack, gdy `channels.slack.streaming.mode` ma wartość `partial` (domyślnie: `true`).

- Wątek odpowiedzi musi być dostępny, aby pojawiły się natywne strumieniowanie tekstu i status wątku asystenta Slack. Wybór wątku nadal podąża za `replyToMode`.
- Korzenie kanałów i czatów grupowych nadal mogą używać normalnej wersji roboczej podglądu, gdy natywne strumieniowanie jest niedostępne.
- DM najwyższego poziomu w Slack domyślnie pozostają poza wątkiem, więc nie pokazują podglądu w stylu wątku; użyj odpowiedzi w wątku albo `typingReaction`, jeśli chcesz widzieć tam postęp.
- Media i ładunki nietekstowe wracają do normalnego dostarczania.
- Finalne media/błędy anulują oczekujące edycje podglądu; kwalifikujące się finalne teksty/bloki opróżniają się tylko wtedy, gdy mogą edytować podgląd w miejscu.
- Jeśli strumieniowanie nie powiedzie się w trakcie odpowiedzi, OpenClaw wraca do normalnego dostarczania pozostałych ładunków.

Użyj wersji roboczej podglądu zamiast natywnego strumieniowania tekstu Slack:

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

## Zapasowa reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu uruchomienia. Jest to najbardziej przydatne poza odpowiedziami w wątkach, które używają domyślnego wskaźnika statusu „is typing...”.

Kolejność rozwiązywania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"hourglass_flowing_sand"`).
- Reakcja działa w trybie najlepszej próby, a czyszczenie jest podejmowane automatycznie po zakończeniu odpowiedzi albo ścieżki błędu.

## Media, porcjowanie i dostarczanie

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Załączniki plików Slack są pobierane z prywatnych URL hostowanych przez Slack (przepływ żądania uwierzytelnianego tokenem) i zapisywane w magazynie mediów, gdy pobieranie się powiedzie i pozwalają na to limity rozmiaru. Zastępniki plików zawierają `fileId` Slack, aby agenci mogli pobrać oryginalny plik za pomocą `download-file`.

    Pobrania używają ograniczonych limitów czasu bezczynności i całkowitego czasu. Jeśli pobieranie pliku Slack zatrzyma się albo nie powiedzie, OpenClaw nadal przetwarza wiadomość i używa zastępnika pliku jako ścieżki zapasowej.

    Limit rozmiaru przychodzącego w środowisku wykonawczym domyślnie wynosi `20MB`, chyba że zostanie nadpisany przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - porcje tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie najpierw po akapitach
    - wysyłki plików używają API przesyłania Slack i mogą obejmować odpowiedzi w wątkach (`thread_ts`)
    - limit mediów wychodzących podąża za `channels.slack.mediaMaxMb`, gdy jest skonfigurowany; w przeciwnym razie wysyłki kanałowe używają wartości domyślnych rodzaju MIME z potoku mediów

  </Accordion>

  <Accordion title="Delivery targets">
    Preferowane jawne cele:

    - `user:<id>` dla DM
    - `channel:<id>` dla kanałów

    DM Slack są otwierane przez API konwersacji Slack podczas wysyłania do celów użytkowników.

  </Accordion>
</AccordionGroup>

## Polecenia i zachowanie slash

Polecenia slash pojawiają się w Slack jako pojedyncze skonfigurowane polecenie albo wiele natywnych poleceń. Skonfiguruj `channels.slack.slashCommand`, aby zmienić domyślne wartości poleceń:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Natywne polecenia wymagają [dodatkowych ustawień manifestu](#additional-manifest-settings) w Twojej aplikacji Slack i zamiast tego są włączane przez `channels.slack.commands.native: true` albo `commands.native: true` w konfiguracjach globalnych.

- Tryb automatyczny natywnych poleceń jest **wyłączony** dla Slack, więc `commands.native: "auto"` nie włącza natywnych poleceń Slack.

```txt
/help
```

Natywne menu argumentów używają adaptacyjnej strategii renderowania, która pokazuje modal potwierdzenia przed wysłaniem wybranej wartości opcji:

- do 5 opcji: bloki przycisków
- 6-100 opcji: statyczne menu wyboru
- ponad 100 opcji: zewnętrzny wybór z asynchronicznym filtrowaniem opcji, gdy dostępne są procedury obsługi opcji interaktywności
- przekroczone limity Slack: zakodowane wartości opcji przechodzą awaryjnie na przyciski

```txt
/think
```

Sesje poleceń z ukośnikiem używają izolowanych kluczy, takich jak `agent:<agentId>:slack:slash:<userId>`, i nadal kierują wykonania poleceń do docelowej sesji konwersacji przy użyciu `CommandTargetSessionKey`.

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

Po włączeniu agenci mogą emitować dyrektywy odpowiedzi wyłącznie dla Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Te dyrektywy kompilują się do Slack Block Kit i kierują kliknięcia lub wybory z powrotem przez istniejącą ścieżkę zdarzeń interakcji Slack.

Uwagi:

- To jest interfejs użytkownika specyficzny dla Slack. Inne kanały nie tłumaczą dyrektyw Slack Block Kit na własne systemy przycisków.
- Wartości wywołań zwrotnych interakcji są nieprzezroczystymi tokenami generowanymi przez OpenClaw, a nie surowymi wartościami tworzonymi przez agenta.
- Jeśli wygenerowane bloki interaktywne przekroczyłyby limity Slack Block Kit, OpenClaw przechodzi awaryjnie na oryginalną odpowiedź tekstową zamiast wysyłać nieprawidłowy ładunek bloków.

## Zatwierdzenia wykonania w Slack

Slack może działać jako natywny klient zatwierdzeń z przyciskami interaktywnymi i interakcjami, zamiast przechodzić awaryjnie na interfejs WWW lub terminal.

- Zatwierdzenia wykonania używają `channels.slack.execApprovals.*` do natywnego routingu DM/kanału.
- Zatwierdzenia Pluginów nadal mogą być rozstrzygane przez tę samą natywną powierzchnię przycisków Slack, gdy żądanie już trafia do Slack, a rodzaj identyfikatora zatwierdzenia to `plugin:`.
- Autoryzacja zatwierdzających nadal jest egzekwowana: tylko użytkownicy zidentyfikowani jako zatwierdzający mogą zatwierdzać lub odrzucać żądania przez Slack.

Używa to tej samej współdzielonej powierzchni przycisków zatwierdzania co inne kanały. Gdy `interactivity` jest włączone w ustawieniach Twojej aplikacji Slack, monity zatwierdzeń renderują się jako przyciski Block Kit bezpośrednio w konwersacji.
Gdy te przyciski są obecne, są podstawowym UX zatwierdzania; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że
zatwierdzenia czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalne; gdy to możliwe, przechodzi awaryjnie na `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia wykonania, gdy `enabled` jest nieustawione albo ma wartość `"auto"` i
uda się rozwiązać co najmniej jednego zatwierdzającego. Ustaw `enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzeń.
Ustaw `enabled: true`, aby wymusić natywne zatwierdzenia, gdy zatwierdzający zostaną rozwiązani.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzeń wykonania Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Jawna natywna konfiguracja Slack jest potrzebna tylko wtedy, gdy chcesz nadpisać zatwierdzających, dodać filtry albo
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

Współdzielone przekazywanie `approvals.exec` jest oddzielne. Używaj go tylko wtedy, gdy monity zatwierdzeń wykonania muszą także
trafiać do innych czatów albo jawnych celów poza pasmem. Współdzielone przekazywanie `approvals.plugin` także jest
oddzielne; natywne przyciski Slack nadal mogą rozstrzygać zatwierdzenia Pluginów, gdy te żądania już trafiają
do Slack.

`/approve` w tym samym czacie działa też w kanałach Slack i DM, które już obsługują polecenia. Zobacz [Zatwierdzenia wykonania](/pl/tools/exec-approvals), aby poznać pełny model przekazywania zatwierdzeń.

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości są mapowane na zdarzenia systemowe.
- Transmisje wątków (odpowiedzi w wątku „Wyślij także do kanału”) są przetwarzane jako zwykłe wiadomości użytkownika.
- Zdarzenia dodania/usunięcia reakcji są mapowane na zdarzenia systemowe.
- Zdarzenia dołączenia/opuszczenia przez członka, utworzenia/zmiany nazwy kanału oraz dodania/usunięcia przypięcia są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanałów, gdy `configWrites` jest włączone.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą zostać wstrzyknięte do kontekstu routingu.
- Rozpoczynający wątek i początkowe zasiewanie kontekstu historii wątku są filtrowane przez skonfigurowane listy dozwolonych nadawców, gdy ma to zastosowanie.
- Akcje bloków i interakcje modalne emitują ustrukturyzowane zdarzenia systemowe `Slack interaction: ...` z bogatymi polami ładunku:
  - akcje bloków: wybrane wartości, etykiety, wartości selektora i metadane `workflow_*`
  - zdarzenia modalne `view_submission` i `view_closed` z metadanymi routowanego kanału oraz danymi wejściowymi formularza

## Informacje referencyjne konfiguracji

Główne informacje referencyjne: [Informacje referencyjne konfiguracji - Slack](/pl/gateway/config-channels#slack).

<Accordion title="Pola Slack o wysokiej wartości sygnału">

- tryb/uwierzytelnianie: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- dostęp DM: `dm.enabled`, `dmPolicy`, `allowFrom` (starsze: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
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
    - lista dozwolonych kanałów (`channels.slack.channels`) — **kluczami muszą być identyfikatory kanałów** (`C12345678`), a nie nazwy (`#channel-name`). Klucze oparte na nazwach zawodzą po cichu przy `groupPolicy: "allowlist"`, ponieważ routing kanałów jest domyślnie oparty najpierw na identyfikatorach. Aby znaleźć identyfikator: kliknij kanał prawym przyciskiem w Slack → **Copy link** — wartość `C...` na końcu adresu URL to identyfikator kanału.
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
      zwykle oznaczają, że Slack wysłał edytowane zdarzenie wątku Assistant bez
      możliwego do odzyskania ludzkiego nadawcy w metadanych wiadomości

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode nie łączy się">
    Zweryfikuj tokeny bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` albo
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło rozwiązać wartości opartej na SecretRef.

  </Accordion>

  <Accordion title="Tryb HTTP nie odbiera zdarzeń">
    Zweryfikuj:

    - sekret podpisu
    - ścieżkę Webhook
    - adresy URL żądań Slack (zdarzenia + interaktywność + polecenia z ukośnikiem)
    - unikalny `webhookPath` dla każdego konta HTTP

    Jeśli `signingSecretStatus: "configured_unavailable"` pojawia się w migawkach kont,
    konto HTTP jest skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło
    rozwiązać sekretu podpisu opartego na SecretRef.

  </Accordion>

  <Accordion title="Natywne polecenia / polecenia z ukośnikiem nie uruchamiają się">
    Zweryfikuj, czy chodziło Ci o:

    - tryb natywnych poleceń (`channels.slack.commands.native: true`) z pasującymi poleceniami z ukośnikiem zarejestrowanymi w Slack
    - albo tryb pojedynczego polecenia z ukośnikiem (`channels.slack.slashCommand.enabled: true`)

    Sprawdź także `commands.useAccessGroups` oraz listy dozwolonych kanałów/użytkowników.

  </Accordion>
</AccordionGroup>

## Informacje referencyjne dla vision załączników

Slack może dołączać pobrane multimedia do tury agenta, gdy pobieranie plików Slack powiedzie się i pozwalają na to limity rozmiaru. Pliki obrazów mogą być przekazywane przez ścieżkę rozumienia mediów albo bezpośrednio do modelu odpowiedzi obsługującego vision; inne pliki są zachowywane jako kontekst plików do pobrania, a nie traktowane jako dane wejściowe obrazu.

### Obsługiwane typy mediów

| Typ mediów                     | Źródło              | Bieżące zachowanie                                                              | Uwagi                                                                     |
| ------------------------------ | ------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Obrazy JPEG / PNG / GIF / WebP | Adres URL pliku Slack | Pobrane i dołączone do tury do obsługi przez ścieżki obsługujące vision         | Limit na plik: `channels.slack.mediaMaxMb` (domyślnie 20 MB)              |
| Pliki PDF                      | Adres URL pliku Slack | Pobrane i udostępnione jako kontekst pliku dla narzędzi takich jak `download-file` lub `pdf` | Dane przychodzące Slack nie konwertują automatycznie PDF-ów na dane wejściowe image-vision |
| Inne pliki                     | Adres URL pliku Slack | Pobrane, gdy to możliwe, i udostępnione jako kontekst pliku                     | Pliki binarne nie są traktowane jako dane wejściowe obrazu                |
| Odpowiedzi w wątku             | Pliki rozpoczynającego wątek | Pliki wiadomości głównej mogą zostać uwodnione jako kontekst, gdy odpowiedź nie ma bezpośrednich mediów | Wątki rozpoczynające się tylko od plików używają symbolu zastępczego załącznika |
| Wiadomości wieloobrazowe       | Wiele plików Slack  | Każdy plik jest oceniany niezależnie                                            | Przetwarzanie Slack jest ograniczone do ośmiu plików na wiadomość         |

### Potok przychodzący

Gdy przychodzi wiadomość Slack z załącznikami plików:

1. OpenClaw pobiera plik z prywatnego adresu URL Slack przy użyciu tokena bota (`xoxb-...`).
2. Plik jest zapisywany w magazynie mediów po powodzeniu.
3. Ścieżki pobranych mediów i typy treści są dodawane do kontekstu przychodzącego.
4. Ścieżki modeli/narzędzi obsługujące obrazy mogą używać załączników obrazów z tego kontekstu.
5. Pliki niebędące obrazami pozostają dostępne jako metadane plików albo referencje mediów dla narzędzi, które potrafią je obsłużyć.

### Dziedziczenie załączników z korzenia wątku

Gdy wiadomość przychodzi w wątku (ma rodzica `thread_ts`):

- Jeśli sama odpowiedź nie ma bezpośrednich mediów, a dołączona wiadomość główna ma pliki, Slack może uwodnić pliki główne jako kontekst rozpoczynającego wątek.
- Bezpośrednie załączniki odpowiedzi mają pierwszeństwo przed załącznikami wiadomości głównej.
- Wiadomość główna, która ma tylko pliki i nie ma tekstu, jest reprezentowana przez symbol zastępczy załącznika, aby mechanizm awaryjny nadal mógł uwzględnić jej pliki.

### Obsługa wielu załączników

Gdy jedna wiadomość Slack zawiera wiele załączników plików:

- Każdy załącznik jest przetwarzany niezależnie przez potok multimediów.
- Odniesienia do pobranych multimediów są agregowane w kontekście wiadomości.
- Kolejność przetwarzania odpowiada kolejności plików Slack w ładunku zdarzenia.
- Błąd pobierania jednego załącznika nie blokuje pozostałych.

### Limity rozmiaru, pobierania i modelu

- **Limit rozmiaru**: Domyślnie 20 MB na plik. Konfigurowalne przez `channels.slack.mediaMaxMb`.
- **Błędy pobierania**: Pliki, których Slack nie może udostępnić, wygasłe URL-e, niedostępne pliki, zbyt duże pliki oraz odpowiedzi HTML autoryzacji/logowania Slack są pomijane zamiast zgłaszania ich jako nieobsługiwane formaty.
- **Model wizyjny**: Analiza obrazów używa aktywnego modelu odpowiedzi, gdy obsługuje on wizję, albo modelu obrazów skonfigurowanego w `agents.defaults.imageModel`.

### Znane ograniczenia

| Scenariusz                            | Obecne zachowanie                                                           | Obejście                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Wygasły URL pliku Slack                | Plik pominięty; nie pokazano błędu                                           | Prześlij plik ponownie w Slack                                                |
| Model wizyjny nie jest skonfigurowany  | Załączniki obrazów są przechowywane jako odniesienia do multimediów, ale nie są analizowane jako obrazy | Skonfiguruj `agents.defaults.imageModel` lub użyj modelu odpowiedzi obsługującego wizję |
| Bardzo duże obrazy (> 20 MB domyślnie) | Pomijane zgodnie z limitem rozmiaru                                          | Zwiększ `channels.slack.mediaMaxMb`, jeśli Slack na to pozwala                |
| Przekazane/udostępnione załączniki     | Tekst i multimedia obrazów/plików hostowane przez Slack są obsługiwane w trybie najlepszej próby | Udostępnij ponownie bezpośrednio w wątku OpenClaw                             |
| Załączniki PDF                         | Przechowywane jako kontekst pliku/multimediów, bez automatycznego kierowania przez wizję obrazów | Użyj `download-file` dla metadanych pliku lub narzędzia `pdf` do analizy PDF  |

### Powiązana dokumentacja

- [Potok rozumienia multimediów](/pl/nodes/media-understanding)
- [Narzędzie PDF](/pl/tools/pdf)
- Epik: [#51349](https://github.com/openclaw/openclaw/issues/51349) — włączenie wizji załączników Slack
- Testy regresji: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Weryfikacja na żywo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Slack z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie kanałów i grupowych wiadomości DM.
  </Card>
  <Card title="Routing kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Układ konfiguracji i kolejność pierwszeństwa.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Katalog poleceń i zachowanie.
  </Card>
</CardGroup>
