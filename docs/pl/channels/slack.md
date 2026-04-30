---
read_when:
    - Konfigurowanie Slack lub debugowanie trybu socket/HTTP w Slack
summary: Konfiguracja Slack i zachowanie w czasie wykonywania (tryb Socket + adresy URL żądań HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-30T16:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55beddb43a6b91c6853dcf053eab713322de4da5beced7c107d73e1c066fded6
    source_path: channels/slack.md
    workflow: 16
---

Gotowe do produkcji dla wiadomości prywatnych i kanałów za pośrednictwem integracji aplikacji Slack. Domyślnym trybem jest Socket Mode; obsługiwane są także adresy HTTP Request URLs.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Slack domyślnie używają trybu parowania.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Natywne działanie poleceń i katalog poleceń.
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

      <Step title="Uruchom gateway">

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
        Używaj unikatowych ścieżek webhook dla HTTP z wieloma kontami

        Nadaj każdemu kontu odrębny `webhookPath` (domyślnie `/slack/events`), aby rejestracje ze sobą nie kolidowały.
        </Note>

      </Step>

      <Step title="Uruchom gateway">

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

Używaj tego tylko w obszarach roboczych Socket Mode, które rejestrują limity czasu Slack websocket pong/server-ping, albo działają na hostach ze znanym głodzeniem pętli zdarzeń. `clientPingTimeout` to czas oczekiwania na pong po wysłaniu przez SDK pingu klienta; `serverPingTimeout` to czas oczekiwania na pingi serwera Slack. Wiadomości i zdarzenia aplikacji pozostają stanem aplikacji, a nie sygnałami żywotności transportu.

## Lista kontrolna manifestu i zakresów

Podstawowy manifest aplikacji Slack jest taki sam dla Socket Mode i HTTP Request URLs. Różni się tylko blok `settings` (oraz `url` polecenia slash).

Podstawowy manifest (domyślnie Socket Mode):

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

W trybie **HTTP Request URLs** zastąp `settings` wariantem HTTP i dodaj `url` do każdego polecenia slash. Wymagany jest publiczny URL:

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

Udostępnij różne funkcje, które rozszerzają powyższe ustawienia domyślne.

<AccordionGroup>
  <Accordion title="Opcjonalne natywne polecenia slash">

    Można użyć wielu [natywnych poleceń slash](#commands-and-slash-behavior) zamiast jednego skonfigurowanego polecenia, z następującymi zastrzeżeniami:

    - Użyj `/agentstatus` zamiast `/status`, ponieważ polecenie `/status` jest zarezerwowane.
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
    Dodaj zakres bota `chat:write.customize`, jeśli chcesz, aby wiadomości wychodzące używały aktywnej tożsamości agenta (niestandardowej nazwy użytkownika i ikony) zamiast domyślnej tożsamości aplikacji Slack.

    Jeśli używasz ikony emoji, Slack oczekuje składni `:emoji_name:`.

  </Accordion>
  <Accordion title="Opcjonalne zakresy tokena użytkownika (operacje odczytu)">
    Jeśli konfigurujesz `channels.slack.userToken`, typowe zakresy odczytu to:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (jeśli zależysz od odczytów wyszukiwania Slack)

  </Accordion>
</AccordionGroup>

## Model tokenów

- `botToken` + `appToken` są wymagane dla Socket Mode.
- Tryb HTTP wymaga `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują jawne
  ciągi znaków lub obiekty SecretRef.
- Tokeny z konfiguracji zastępują rezerwowe wartości z env.
- Rezerwowe wartości env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` dotyczą tylko konta domyślnego.
- `userToken` (`xoxp-...`) jest dostępny tylko w konfiguracji (bez rezerwowej wartości env) i domyślnie działa w trybie tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki statusu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status` dla poszczególnych
  poświadczeń (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status to `available`, `configured_unavailable` albo `missing`.
- `configured_unavailable` oznacza, że konto skonfigurowano przez SecretRef
  lub inne nieosadzone źródło sekretu, ale bieżąca ścieżka polecenia/środowiska
  uruchomieniowego nie mogła odczytać rzeczywistej wartości.
- W trybie HTTP uwzględniany jest `signingSecretStatus`; w Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
Dla akcji/odczytów katalogu token użytkownika może być preferowany, gdy jest skonfigurowany. Dla zapisów nadal preferowany jest token bota; zapisy tokenem użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false`, a token bota jest niedostępny.
</Tip>

## Akcje i bramki

Akcjami Slack steruje `channels.slack.actions.*`.

Dostępne grupy akcji w bieżących narzędziach Slack:

| Grupa      | Domyślnie |
| ---------- | --------- |
| messages   | włączone  |
| reactions  | włączone  |
| pins       | włączone  |
| memberInfo | włączone  |
| emojiList  | włączone  |

Bieżące akcje wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` i `emoji-list`. `download-file` akceptuje identyfikatory plików Slack widoczne w placeholderach plików przychodzących i zwraca podglądy obrazów dla obrazów albo metadane pliku lokalnego dla innych typów plików.

## Kontrola dostępu i trasowanie

<Tabs>
  <Tab title="Zasady DM">
    `channels.slack.dmPolicy` steruje dostępem przez DM. `channels.slack.allowFrom` to kanoniczna allowlista DM.

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.slack.allowFrom` zawierało `"*"`)
    - `disabled`

    Flagi DM:

    - `dm.enabled` (domyślnie true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (starsze)
    - `dm.groupEnabled` (grupowe DM domyślnie false)
    - `dm.groupChannels` (opcjonalna allowlista MPIM)

    Priorytet przy wielu kontach:

    - `channels.slack.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Starsze `channels.slack.dm.policy` i `channels.slack.dm.allowFrom` nadal są odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Parowanie w DM używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Zasady kanałów">
    `channels.slack.groupPolicy` steruje obsługą kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlista kanałów znajduje się pod `channels.slack.channels` i **musi używać stabilnych identyfikatorów kanałów Slack** (na przykład `C12345678`) jako kluczy konfiguracji.

    Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.slack` całkowicie brakuje (konfiguracja tylko przez env), środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logu (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozpoznawanie nazw/identyfikatorów:

    - wpisy allowlisty kanałów i wpisy allowlisty DM są rozpoznawane przy uruchomieniu, gdy pozwala na to dostęp tokena
    - nierozpoznane wpisy nazw kanałów pozostają w konfiguracji, ale domyślnie są ignorowane przy trasowaniu
    - autoryzacja przychodząca i trasowanie kanałów domyślnie najpierw używają identyfikatorów; bezpośrednie dopasowanie nazwy użytkownika/sluga wymaga `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Klucze oparte na nazwie (`#channel-name` lub `channel-name`) **nie** pasują przy `groupPolicy: "allowlist"`. Wyszukiwanie kanału domyślnie najpierw używa identyfikatora, więc klucz oparty na nazwie nigdy nie zostanie poprawnie wytrasowany, a wszystkie wiadomości w tym kanale zostaną po cichu zablokowane. Różni się to od `groupPolicy: "open"`, gdzie klucz kanału nie jest wymagany do trasowania, a klucz oparty na nazwie wydaje się działać.

    Zawsze używaj identyfikatora kanału Slack jako klucza. Aby go znaleźć: kliknij kanał w Slack prawym przyciskiem → **Kopiuj link** — identyfikator (`C...`) pojawia się na końcu adresu URL.

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
    Wiadomości w kanałach domyślnie wymagają wzmianki.

    Źródła wzmianek:

    - jawna wzmianka o aplikacji (`<@botId>`)
    - wzorce regex wzmianek (`agents.list[].groupChat.mentionPatterns`, rezerwowo `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi w wątku do bota (wyłączone, gdy `thread.requireExplicitMention` ma wartość `true`)

    Kontrole dla kanału (`channels.slack.channels.<id>`; nazwy tylko przez rozpoznawanie przy uruchomieniu albo `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlista)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `id:`, `e164:`, `username:`, `name:` albo wildcard `"*"`
      (starsze klucze bez prefiksu nadal mapują tylko do `id:`)

    `allowBots` jest konserwatywne dla kanałów i kanałów prywatnych: wiadomości w pokoju autorstwa bota są akceptowane tylko wtedy, gdy wysyłający bot jest jawnie wymieniony na allowliście `users` tego pokoju albo gdy co najmniej jeden jawny identyfikator właściciela Slack z `channels.slack.allowFrom` jest obecnie członkiem pokoju. Wildcardy i wpisy właściciela oparte na nazwie wyświetlanej nie spełniają warunku obecności właściciela. Obecność właściciela używa Slack `conversations.members`; upewnij się, że aplikacja ma odpowiedni zakres odczytu dla typu pokoju (`channels:read` dla kanałów publicznych, `groups:read` dla kanałów prywatnych). Jeśli wyszukiwanie członków się nie powiedzie, OpenClaw odrzuca wiadomość w pokoju autorstwa bota.

  </Tab>
</Tabs>

## Wątki, sesje i znaczniki odpowiedzi

- DM są trasowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Przy domyślnym `session.dmScope=main` DM Slack są zwijane do głównej sesji agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Odpowiedzi w wątku mogą tworzyć sufiksy sesji wątku (`:thread:<threadTs>`), gdy ma to zastosowanie.
- Domyślna wartość `channels.slack.thread.historyScope` to `thread`; domyślna wartość `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` kontroluje, ile istniejących wiadomości wątku jest pobieranych przy starcie nowej sesji wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).
- `channels.slack.thread.requireExplicitMention` (domyślnie `false`): gdy `true`, tłumi niejawne wzmianki wątku, aby bot odpowiadał tylko na jawne wzmianki `@bot` w wątkach, nawet jeśli bot już uczestniczył w wątku. Bez tego odpowiedzi w wątku, w którym uczestniczył bot, omijają bramkowanie `requireMention`.

Kontrole wątkowania odpowiedzi:

- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: dla poszczególnych `direct|group|channel`
- starsza rezerwowa wartość dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Obsługiwane są ręczne znaczniki odpowiedzi:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` wyłącza **całe** wątkowanie odpowiedzi w Slack, w tym jawne znaczniki `[[reply_to_*]]`. Różni się to od Telegram, gdzie jawne znaczniki są nadal honorowane w trybie `"off"`. Wątki Slack ukrywają wiadomości przed kanałem, natomiast odpowiedzi Telegram pozostają widoczne w linii.
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
- Użyj `""`, aby wyłączyć reakcję dla konta Slack lub globalnie.

## Strumieniowanie tekstu

`channels.slack.streaming` kontroluje zachowanie podglądu na żywo:

- `off`: wyłącz strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastępuj tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołączaj fragmentaryczne aktualizacje podglądu.
- `progress`: pokazuj tekst statusu postępu podczas generowania, a następnie wyślij tekst końcowy.
- `streaming.preview.toolProgress`: gdy podgląd szkicu jest aktywny, trasuj aktualizacje narzędzi/postępu do tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować oddzielne wiadomości narzędzi/postępu.

`channels.slack.streaming.nativeTransport` kontroluje natywne strumieniowanie tekstu Slack, gdy `channels.slack.streaming.mode` ma wartość `partial` (domyślnie: `true`).

- Wątek odpowiedzi musi być dostępny, aby pojawiły się natywne strumieniowanie tekstu i status wątku asystenta Slack. Wybór wątku nadal podąża za `replyToMode`.
- Korzenie kanałów i czatów grupowych nadal mogą używać zwykłego podglądu szkicu, gdy natywne strumieniowanie jest niedostępne.
- Najwyższego poziomu DM Slack domyślnie pozostają poza wątkiem, więc nie pokazują podglądu w stylu wątku; użyj odpowiedzi w wątku albo `typingReaction`, jeśli chcesz mieć tam widoczny postęp.
- Media i ładunki nietekstowe wracają do normalnego dostarczania.
- Końcowe media/błędy anulują oczekujące edycje podglądu; kwalifikujące się końcowe teksty/bloki są opróżniane tylko wtedy, gdy mogą edytować podgląd w miejscu.
- Jeśli strumieniowanie nie powiedzie się w trakcie odpowiedzi, OpenClaw wraca do normalnego dostarczania pozostałych ładunków.

Użyj podglądu szkicu zamiast natywnego strumieniowania tekstu Slack:

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
- boolean `channels.slack.streaming` jest automatycznie migrowany do `channels.slack.streaming.mode` i `channels.slack.streaming.nativeTransport`.
- starsze `channels.slack.nativeStreaming` jest automatycznie migrowane do `channels.slack.streaming.nativeTransport`.

## Rezerwowa reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu przebiegu. Jest to najbardziej przydatne poza odpowiedziami w wątkach, które używają domyślnego wskaźnika statusu „pisze...”.

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"hourglass_flowing_sand"`).
- Reakcja jest wykonywana w miarę możliwości, a czyszczenie jest automatycznie podejmowane po zakończeniu ścieżki odpowiedzi lub błędu.

## Media, dzielenie na fragmenty i dostarczanie

<AccordionGroup>
  <Accordion title="Załączniki przychodzące">
    Załączniki plików Slack są pobierane z prywatnych adresów URL hostowanych przez Slack (przepływ żądania uwierzytelniany tokenem) i zapisywane w magazynie mediów, gdy pobieranie się powiedzie i pozwalają na to limity rozmiaru. Placeholdery plików zawierają Slack `fileId`, aby agenci mogli pobrać oryginalny plik za pomocą `download-file`.

    Pobrania używają ograniczonych limitów czasu bezczynności i całkowitego czasu. Jeśli pobieranie pliku Slack zatrzyma się lub nie powiedzie, OpenClaw kontynuuje przetwarzanie wiadomości i wraca do placeholdera pliku.

    Domyślny limit rozmiaru przychodzących danych w środowisku uruchomieniowym to `20MB`, chyba że zostanie zastąpiony przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Tekst wychodzący i pliki">
    - fragmenty tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie z priorytetem akapitów
    - wysyłanie plików używa interfejsów API przesyłania Slack i może obejmować odpowiedzi w wątku (`thread_ts`)
    - limit mediów wychodzących używa `channels.slack.mediaMaxMb`, gdy jest skonfigurowany; w przeciwnym razie wysyłki kanału używają domyślnych wartości rodzaju MIME z potoku mediów

  </Accordion>

  <Accordion title="Cele dostarczania">
    Preferowane jawne cele:

    - `user:<id>` dla wiadomości prywatnych
    - `channel:<id>` dla kanałów

    Wiadomości prywatne Slack są otwierane przez interfejsy API konwersacji Slack podczas wysyłania do celów użytkownika.

  </Accordion>
</AccordionGroup>

## Polecenia i zachowanie ukośnika

Polecenia ukośnikowe pojawiają się w Slack jako jedno skonfigurowane polecenie albo wiele poleceń natywnych. Skonfiguruj `channels.slack.slashCommand`, aby zmienić domyślne ustawienia polecenia:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Polecenia natywne wymagają [dodatkowych ustawień manifestu](#additional-manifest-settings) w Twojej aplikacji Slack i zamiast tego są włączane przez `channels.slack.commands.native: true` albo `commands.native: true` w konfiguracjach globalnych.

- Automatyczny tryb poleceń natywnych jest **wyłączony** dla Slack, więc `commands.native: "auto"` nie włącza natywnych poleceń Slack.

```txt
/help
```

Menu argumentów natywnych używają adaptacyjnej strategii renderowania, która wyświetla modal potwierdzenia przed przekazaniem wybranej wartości opcji:

- do 5 opcji: bloki przycisków
- 6-100 opcji: statyczne menu wyboru
- więcej niż 100 opcji: zewnętrzny wybór z asynchronicznym filtrowaniem opcji, gdy dostępne są procedury obsługi opcji interaktywności
- przekroczone limity Slack: zakodowane wartości opcji wracają do przycisków

```txt
/think
```

Sesje ukośnikowe używają izolowanych kluczy, takich jak `agent:<agentId>:slack:slash:<userId>`, i nadal kierują wykonania poleceń do docelowej sesji konwersacji przy użyciu `CommandTargetSessionKey`.

## Interaktywne odpowiedzi

Slack może renderować kontrolki interaktywnej odpowiedzi utworzone przez agenta, ale ta funkcja jest domyślnie wyłączona.

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

Po włączeniu agenci mogą emitować dyrektywy odpowiedzi przeznaczone tylko dla Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Te dyrektywy kompilują się do Slack Block Kit i kierują kliknięcia lub wybory z powrotem przez istniejącą ścieżkę zdarzeń interakcji Slack.

Uwagi:

- To interfejs użytkownika specyficzny dla Slack. Inne kanały nie tłumaczą dyrektyw Slack Block Kit na własne systemy przycisków.
- Wartości interaktywnych wywołań zwrotnych to nieprzezroczyste tokeny generowane przez OpenClaw, a nie surowe wartości utworzone przez agenta.
- Jeśli wygenerowane bloki interaktywne przekroczyłyby limity Slack Block Kit, OpenClaw wraca do oryginalnej odpowiedzi tekstowej zamiast wysyłać nieprawidłowy ładunek bloków.

## Zatwierdzenia Exec w Slack

Slack może działać jako natywny klient zatwierdzania z interaktywnymi przyciskami i interakcjami, zamiast wracać do interfejsu Web UI lub terminala.

- Zatwierdzenia Exec używają `channels.slack.execApprovals.*` do natywnego routingu wiadomości prywatnych/kanałów.
- Zatwierdzenia Plugin nadal mogą być rozstrzygane przez tę samą natywną dla Slack powierzchnię przycisków, gdy żądanie już trafia do Slack, a rodzaj identyfikatora zatwierdzenia to `plugin:`.
- Autoryzacja zatwierdzającego nadal jest egzekwowana: tylko użytkownicy zidentyfikowani jako zatwierdzający mogą zatwierdzać lub odrzucać żądania przez Slack.

Używa to tej samej współdzielonej powierzchni przycisków zatwierdzania co inne kanały. Gdy `interactivity` jest włączone w ustawieniach aplikacji Slack, monity o zatwierdzenie są renderowane jako przyciski Block Kit bezpośrednio w konwersacji.
Gdy te przyciski są obecne, są podstawowym interfejsem zatwierdzania; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia
czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalnie; wraca do `commands.ownerAllowFrom`, gdy to możliwe)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia Exec, gdy `enabled` jest nieustawione albo ma wartość `"auto"` i rozpoznany zostanie co najmniej jeden
zatwierdzający. Ustaw `enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzania.
Ustaw `enabled: true`, aby wymusić włączenie natywnych zatwierdzeń, gdy zatwierdzający zostaną rozpoznani.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzeń Exec dla Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Jawna natywna konfiguracja Slack jest potrzebna tylko wtedy, gdy chcesz zastąpić zatwierdzających, dodać filtry albo
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

Współdzielone przekazywanie `approvals.exec` jest oddzielne. Używaj go tylko wtedy, gdy monity zatwierdzeń Exec muszą także
trafiać do innych czatów lub jawnych celów poza pasmem. Współdzielone przekazywanie `approvals.plugin` również jest
oddzielne; natywne przyciski Slack nadal mogą rozstrzygać zatwierdzenia Plugin, gdy te żądania już trafiają
do Slack.

`/approve` w tym samym czacie działa również w kanałach Slack i wiadomościach prywatnych, które już obsługują polecenia. Zobacz [Zatwierdzenia Exec](/pl/tools/exec-approvals), aby poznać pełny model przekazywania zatwierdzeń.

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości są mapowane na zdarzenia systemowe.
- Transmisje wątków (odpowiedzi w wątku typu „Wyślij też do kanału”) są przetwarzane jako zwykłe wiadomości użytkownika.
- Zdarzenia dodania/usunięcia reakcji są mapowane na zdarzenia systemowe.
- Dołączenie/opuszczenie przez członka, utworzenie/zmiana nazwy kanału oraz dodanie/usunięcie przypięcia są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanału, gdy `configWrites` jest włączone.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą zostać wstrzyknięte do kontekstu routingu.
- Inicjator wątku i początkowe zasilanie kontekstu historią wątku są filtrowane według skonfigurowanych list dozwolonych nadawców, gdy ma to zastosowanie.
- Akcje bloków i interakcje modalne emitują ustrukturyzowane zdarzenia systemowe `Slack interaction: ...` z bogatymi polami ładunku:
  - akcje bloków: wybrane wartości, etykiety, wartości selektorów oraz metadane `workflow_*`
  - zdarzenia modalne `view_submission` i `view_closed` z kierowanymi metadanymi kanału i danymi wejściowymi formularza

## Odwołanie konfiguracji

Główne odwołanie: [Odwołanie konfiguracji - Slack](/pl/gateway/config-channels#slack).

<Accordion title="Pola Slack o wysokiej wartości sygnału">

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
    Sprawdź po kolei:

    - `groupPolicy`
    - lista dozwolonych kanałów (`channels.slack.channels`) — **klucze muszą być identyfikatorami kanałów** (`C12345678`), a nie nazwami (`#channel-name`). Klucze oparte na nazwach po cichu zawodzą przy `groupPolicy: "allowlist"`, ponieważ routing kanałów domyślnie najpierw używa identyfikatorów. Aby znaleźć identyfikator: kliknij kanał w Slack prawym przyciskiem myszy → **Kopiuj link** — wartość `C...` na końcu URL to identyfikator kanału.
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

  <Accordion title="Tryb Socket mode nie łączy się">
    Sprawdź tokeny bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` albo
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło rozpoznać wartości
    opartej na SecretRef.

  </Accordion>

  <Accordion title="Tryb HTTP nie odbiera zdarzeń">
    Sprawdź:

    - sekret podpisywania
    - ścieżkę Webhook
    - adresy URL żądań Slack (zdarzenia + interaktywność + polecenia ukośnikowe)
    - unikalne `webhookPath` dla każdego konta HTTP

    Jeśli `signingSecretStatus: "configured_unavailable"` pojawia się w migawkach
    konta, konto HTTP jest skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło
    rozpoznać sekretu podpisywania opartego na SecretRef.

  </Accordion>

  <Accordion title="Polecenia natywne/ukośnikowe nie uruchamiają się">
    Zweryfikuj, czy zamierzony był:

    - tryb poleceń natywnych (`channels.slack.commands.native: true`) z pasującymi poleceniami ukośnikowymi zarejestrowanymi w Slack
    - albo tryb pojedynczego polecenia ukośnikowego (`channels.slack.slashCommand.enabled: true`)

    Sprawdź też `commands.useAccessGroups` oraz listy dozwolonych kanałów/użytkowników.

  </Accordion>
</AccordionGroup>

## Odwołanie dotyczące wizji załączników

Slack może dołączać pobrane media do tury agenta, gdy pobieranie plików Slack się powiedzie i pozwalają na to limity rozmiaru. Pliki obrazów mogą być przekazywane przez ścieżkę rozumienia mediów albo bezpośrednio do modelu odpowiedzi obsługującego wizję; inne pliki są zachowywane jako kontekst pliku do pobrania, a nie traktowane jako dane wejściowe obrazu.

### Obsługiwane typy mediów

| Typ mediów                     | Źródło              | Bieżące zachowanie                                                               | Uwagi                                                                     |
| ------------------------------ | ------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Obrazy JPEG / PNG / GIF / WebP | URL pliku Slack     | Pobierane i dołączane do tury do obsługi z obsługą wizji                         | Limit na plik: `channels.slack.mediaMaxMb` (domyślnie 20 MB)              |
| Pliki PDF                      | URL pliku Slack     | Pobierane i udostępniane jako kontekst pliku dla narzędzi takich jak `download-file` lub `pdf` | Dane przychodzące Slack nie konwertują automatycznie PDF-ów na wejście wizji obrazu |
| Inne pliki                     | URL pliku Slack     | Pobierane, gdy to możliwe, i udostępniane jako kontekst pliku                    | Pliki binarne nie są traktowane jako dane wejściowe obrazu                |
| Odpowiedzi w wątku             | Pliki inicjatora wątku | Pliki wiadomości głównej mogą zostać nawodnione jako kontekst, gdy odpowiedź nie ma bezpośrednich mediów | Inicjatory zawierające tylko pliki używają symbolu zastępczego załącznika |
| Wiadomości wieloobrazowe       | Wiele plików Slack  | Każdy plik jest oceniany niezależnie                                             | Przetwarzanie Slack jest ograniczone do ośmiu plików na wiadomość         |

### Potok przychodzący

Gdy przychodzi wiadomość Slack z załącznikami plików:

1. OpenClaw pobiera plik z prywatnego adresu URL Slacka przy użyciu tokena bota (`xoxb-...`).
2. Po powodzeniu plik jest zapisywany w magazynie multimediów.
3. Ścieżki pobranych multimediów i typy zawartości są dodawane do kontekstu przychodzącego.
4. Ścieżki modeli/narzędzi obsługujące obrazy mogą używać załączników obrazów z tego kontekstu.
5. Pliki niebędące obrazami pozostają dostępne jako metadane plików lub odwołania do multimediów dla narzędzi, które potrafią je obsłużyć.

### Dziedziczenie załączników z głównego wątku

Gdy wiadomość przychodzi w wątku (ma element nadrzędny `thread_ts`):

- Jeśli sama odpowiedź nie ma bezpośrednich multimediów, a dołączona wiadomość główna ma pliki, Slack może uzupełnić pliki główne jako kontekst inicjujący wątek.
- Bezpośrednie załączniki odpowiedzi mają pierwszeństwo przed załącznikami wiadomości głównej.
- Wiadomość główna, która ma tylko pliki i nie ma tekstu, jest reprezentowana przez placeholder załącznika, aby mechanizm zapasowy nadal mógł uwzględnić jej pliki.

### Obsługa wielu załączników

Gdy pojedyncza wiadomość Slack zawiera wiele załączników plików:

- Każdy załącznik jest przetwarzany niezależnie przez potok multimediów.
- Odwołania do pobranych multimediów są agregowane w kontekście wiadomości.
- Kolejność przetwarzania jest zgodna z kolejnością plików Slacka w ładunku zdarzenia.
- Niepowodzenie pobierania jednego załącznika nie blokuje pozostałych.

### Limity rozmiaru, pobierania i modelu

- **Limit rozmiaru**: Domyślnie 20 MB na plik. Konfigurowalne przez `channels.slack.mediaMaxMb`.
- **Niepowodzenia pobierania**: Pliki, których Slack nie może udostępnić, wygasłe adresy URL, niedostępne pliki, pliki zbyt duże oraz odpowiedzi HTML uwierzytelniania/logowania Slacka są pomijane zamiast zgłaszania ich jako nieobsługiwanych formatów.
- **Model wizyjny**: Analiza obrazów używa aktywnego modelu odpowiedzi, gdy obsługuje on widzenie, albo modelu obrazu skonfigurowanego w `agents.defaults.imageModel`.

### Znane ograniczenia

| Scenariusz                             | Obecne zachowanie                                                           | Obejście                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Wygasły adres URL pliku Slack          | Plik pominięty; błąd nie jest wyświetlany                                    | Prześlij plik ponownie w Slacku                                             |
| Model wizyjny nie jest skonfigurowany  | Załączniki obrazów są przechowywane jako odwołania do multimediów, ale nie są analizowane jako obrazy | Skonfiguruj `agents.defaults.imageModel` albo użyj modelu odpowiedzi obsługującego widzenie |
| Bardzo duże obrazy (> 20 MB domyślnie) | Pomijane zgodnie z limitem rozmiaru                                          | Zwiększ `channels.slack.mediaMaxMb`, jeśli Slack na to pozwala              |
| Przekazane/udostępnione załączniki     | Tekst oraz multimedia obrazów/plików hostowane przez Slack są obsługiwane w miarę możliwości | Udostępnij ponownie bezpośrednio w wątku OpenClaw                           |
| Załączniki PDF                         | Przechowywane jako kontekst pliku/multimediów, bez automatycznego kierowania przez widzenie obrazów | Użyj `download-file` dla metadanych pliku albo narzędzia `pdf` do analizy PDF |

### Powiązana dokumentacja

- [Potok rozumienia multimediów](/pl/nodes/media-understanding)
- [Narzędzie PDF](/pl/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — włączenie obsługi widzenia dla załączników Slacka
- Testy regresji: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Weryfikacja na żywo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Powiązane

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Slacka z Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pl/channels/groups">
    Zachowanie kanału i grupowych DM.
  </Card>
  <Card title="Channel routing" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Security" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i wzmacnianie zabezpieczeń.
  </Card>
  <Card title="Configuration" icon="sliders" href="/pl/gateway/configuration">
    Układ konfiguracji i pierwszeństwo.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pl/tools/slash-commands">
    Katalog poleceń i zachowanie.
  </Card>
</CardGroup>
