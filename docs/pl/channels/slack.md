---
read_when:
    - Konfigurowanie Slack lub debugowanie trybu Socket/HTTP Slack
summary: Konfiguracja Slack i zachowanie środowiska uruchomieniowego (Socket Mode + URL-e żądań HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-24T08:59:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 906a4fcf00a51f4a9b8410f982abe1f068687b5aa9847a4894f489e57fa9e4dd
    source_path: channels/slack.md
    workflow: 15
---

Gotowe do użycia produkcyjnego dla DM i kanałów za pośrednictwem integracji aplikacji Slack. Domyślnym trybem jest Socket Mode; obsługiwane są także URL-e żądań HTTP.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    DM Slack domyślnie używają trybu parowania.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i instrukcje naprawcze.
  </Card>
</CardGroup>

## Szybka konfiguracja

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        W ustawieniach aplikacji Slack naciśnij przycisk **[Create New App](https://api.slack.com/apps/new)**:

        - wybierz **from a manifest** i wybierz workspace dla swojej aplikacji
        - wklej [przykładowy manifest](#manifest-and-scope-checklist) poniżej i kontynuuj tworzenie
        - wygeneruj **App-Level Token** (`xapp-...`) z `connections:write`
        - zainstaluj aplikację i skopiuj pokazany **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Fallback zmiennych środowiskowych (tylko konto domyślne):

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

        - wybierz **from a manifest** i wybierz workspace dla swojej aplikacji
        - wklej [przykładowy manifest](#manifest-and-scope-checklist) i zaktualizuj URL-e przed utworzeniem
        - zapisz **Signing Secret** do weryfikacji żądań
        - zainstaluj aplikację i skopiuj pokazany **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Używaj unikalnych ścieżek webhook dla wielokontowego HTTP

        Nadaj każdemu kontu odrębne `webhookPath` (domyślnie `/slack/events`), aby rejestracje nie kolidowały ze sobą.
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

## Lista kontrolna manifestu i scope’ów

Bazowy manifest aplikacji Slack jest taki sam dla Socket Mode i URL-i żądań HTTP. Różni się tylko blok `settings` (oraz `url` polecenia slash).

Bazowy manifest (domyślny Socket Mode):

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

Różne funkcje rozszerzające powyższe ustawienia domyślne.

<AccordionGroup>
  <Accordion title="Opcjonalne natywne polecenia slash">

    Można użyć wielu [natywnych poleceń slash](#commands-and-slash-behavior) zamiast jednego skonfigurowanego polecenia, z pewnymi niuansami:

    - Użyj `/agentstatus` zamiast `/status`, ponieważ polecenie `/status` jest zarezerwowane.
    - Jednocześnie można udostępnić nie więcej niż 25 poleceń slash.

    Zastąp istniejącą sekcję `features.slash_commands` podzbiorem [dostępnych poleceń](/pl/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

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
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
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
        Użyj tej samej listy `slash_commands`, co powyżej dla Socket Mode, i dodaj `"url": "https://gateway-host.example.com/slack/events"` do każdego wpisu. Przykład:

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
  <Accordion title="Opcjonalne scope’y autorstwa (operacje zapisu)">
    Dodaj scope bota `chat:write.customize`, jeśli chcesz, aby wiadomości wychodzące używały aktywnej tożsamości agenta (niestandardowa nazwa użytkownika i ikona) zamiast domyślnej tożsamości aplikacji Slack.

    Jeśli używasz ikony emoji, Slack oczekuje składni `:emoji_name:`.

  </Accordion>
  <Accordion title="Opcjonalne scope’y tokena użytkownika (operacje odczytu)">
    Jeśli skonfigurujesz `channels.slack.userToken`, typowe scope’y odczytu to:

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
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują zwykłe
  ciągi znaków lub obiekty SecretRef.
- Tokeny z konfiguracji mają pierwszeństwo przed fallbackiem środowiskowym.
- Fallback zmiennych środowiskowych `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` dotyczy tylko konta domyślnego.
- `userToken` (`xoxp-...`) jest dostępny tylko w konfiguracji (bez fallbacku środowiskowego) i domyślnie ma zachowanie tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki statusu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status`
  dla każdego poświadczenia (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status ma wartość `available`, `configured_unavailable` lub `missing`.
- `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef
  lub inne nieinline’owe źródło sekretów, ale bieżąca ścieżka polecenia/runtime
  nie mogła rozwiązać rzeczywistej wartości.
- W trybie HTTP uwzględniane jest `signingSecretStatus`; w Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
Dla akcji/odczytów katalogu można preferować token użytkownika, jeśli jest skonfigurowany. Dla zapisów nadal preferowany jest token bota; zapisy tokenem użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false`, a token bota jest niedostępny.
</Tip>

## Akcje i bramki

Akcje Slack są kontrolowane przez `channels.slack.actions.*`.

Dostępne grupy akcji w obecnym zestawie narzędzi Slack:

| Grupa      | Domyślnie |
| ---------- | --------- |
| messages   | włączone  |
| reactions  | włączone  |
| pins       | włączone  |
| memberInfo | włączone  |
| emojiList  | włączone  |

Obecne akcje wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` i `emoji-list`.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` kontroluje dostęp do DM (starsza forma: `channels.slack.dm.policy`):

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.slack.allowFrom` zawierało `"*"`; starsza forma: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flagi DM:

    - `dm.enabled` (domyślnie true)
    - `channels.slack.allowFrom` (preferowane)
    - `dm.allowFrom` (starsza forma)
    - `dm.groupEnabled` (grupowe DM domyślnie false)
    - `dm.groupChannels` (opcjonalna lista dozwolonych MPIM)

    Priorytet dla wielu kont:

    - `channels.slack.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Parowanie w DM używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` kontroluje obsługę kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Lista dozwolonych kanałów znajduje się w `channels.slack.channels` i powinna używać stabilnych identyfikatorów kanałów.

    Uwaga dotycząca runtime: jeśli `channels.slack` całkowicie nie istnieje (konfiguracja tylko przez zmienne środowiskowe), runtime przechodzi na `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logu (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozwiązywanie nazw/identyfikatorów:

    - wpisy listy dozwolonych kanałów i wpisy listy dozwolonych DM są rozwiązywane przy starcie, gdy dostęp tokena na to pozwala
    - nierozwiązane wpisy nazw kanałów są zachowywane zgodnie z konfiguracją, ale domyślnie ignorowane przy routingu
    - autoryzacja przychodząca i routing kanałów są domyślnie oparte najpierw na identyfikatorach; bezpośrednie dopasowanie nazwy użytkownika/slugu wymaga `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions and channel users">
    Wiadomości kanałowe są domyślnie objęte bramkowaniem wzmianek.

    Źródła wzmianek:

    - jawna wzmianka aplikacji (`<@botId>`)
    - wzorce regex wzmianek (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi w wątku do bota (wyłączone, gdy `thread.requireExplicitMention` ma wartość `true`)

    Kontrolki dla kanału (`channels.slack.channels.<id>`; nazwy tylko przez rozwiązywanie przy starcie lub `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista dozwolonych)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format kluczy `toolsBySender`: `id:`, `e164:`, `username:`, `name:` lub wildcard `"*"`
      (starsze klucze bez prefiksu nadal mapują tylko do `id:`)

  </Tab>
</Tabs>

## Wątki, sesje i tagi odpowiedzi

- DM są routowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Przy domyślnym `session.dmScope=main` DM Slack są zwijane do głównej sesji agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Odpowiedzi w wątkach mogą tworzyć sufiksy sesji wątku (`:thread:<threadTs>`), gdy ma to zastosowanie.
- Domyślną wartością `channels.slack.thread.historyScope` jest `thread`; domyślna wartość `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` kontroluje, ile istniejących wiadomości wątku jest pobieranych przy starcie nowej sesji wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).
- `channels.slack.thread.requireExplicitMention` (domyślnie `false`): gdy ma wartość `true`, wyłącza niejawne wzmianki w wątkach, tak aby bot odpowiadał tylko na jawne wzmianki `@bot` wewnątrz wątków, nawet gdy bot już uczestniczył w wątku. Bez tego odpowiedzi w wątku, w którym uczestniczy bot, omijają bramkowanie `requireMention`.

Kontrolki wątkowania odpowiedzi:

- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: dla każdego `direct|group|channel`
- starszy fallback dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Obsługiwane są ręczne tagi odpowiedzi:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Uwaga: `replyToMode="off"` wyłącza **całe** wątkowanie odpowiedzi w Slack, w tym jawne tagi `[[reply_to_*]]`. Różni się to od Telegram, gdzie jawne tagi są nadal honorowane w trybie `"off"` — wątki Slack ukrywają wiadomości z kanału, podczas gdy odpowiedzi Telegram pozostają widoczne inline.

## Reakcje potwierdzenia

`ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza przychodzącą wiadomość.

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback do emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

Uwagi:

- Slack oczekuje shortcode’ów (na przykład `"eyes"`).
- Użyj `""`, aby wyłączyć reakcję dla konta Slack lub globalnie.

## Strumieniowanie tekstu

`channels.slack.streaming` kontroluje zachowanie podglądu na żywo:

- `off`: wyłącza podgląd strumieniowania na żywo.
- `partial` (domyślnie): zastępuje tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołącza porcjowane aktualizacje podglądu.
- `progress`: pokazuje tekst statusu postępu podczas generowania, a następnie wysyła tekst końcowy.
- `streaming.preview.toolProgress`: gdy aktywny jest szkic podglądu, kieruje aktualizacje narzędzia/postępu do tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować oddzielne wiadomości narzędzia/postępu.

`channels.slack.streaming.nativeTransport` kontroluje natywne strumieniowanie tekstu Slack, gdy `channels.slack.streaming.mode` ma wartość `partial` (domyślnie: `true`).

- Aby pojawiło się natywne strumieniowanie tekstu i status wątku asystenta Slack, musi być dostępny wątek odpowiedzi. Wybór wątku nadal podlega `replyToMode`.
- Główne wiadomości czatów kanałowych i grupowych nadal mogą używać zwykłego szkicu podglądu, gdy natywne strumieniowanie jest niedostępne.
- Główne DM Slack domyślnie pozostają poza wątkiem, więc nie pokazują podglądu w stylu wątku; użyj odpowiedzi w wątku lub `typingReaction`, jeśli chcesz tam widocznego postępu.
- Media i ładunki inne niż tekst wracają do normalnego dostarczania.
- Końcowe odpowiedzi media/błąd anulują oczekujące edycje podglądu; kwalifikujące się końcowe odpowiedzi tekstowe/blokowe są opróżniane tylko wtedy, gdy mogą edytować podgląd w miejscu.
- Jeśli strumieniowanie nie powiedzie się w trakcie odpowiedzi, OpenClaw wraca do normalnego dostarczania dla pozostałych ładunków.

Użyj szkicu podglądu zamiast natywnego strumieniowania tekstu Slack:

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
- wartość boolowska `channels.slack.streaming` jest automatycznie migrowana do `channels.slack.streaming.mode` i `channels.slack.streaming.nativeTransport`.
- starsze `channels.slack.nativeStreaming` jest automatycznie migrowane do `channels.slack.streaming.nativeTransport`.

## Fallback reakcji pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu uruchomienia. Jest to najbardziej przydatne poza odpowiedziami w wątkach, które używają domyślnego wskaźnika statusu „is typing...”.

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje shortcode’ów (na przykład `"hourglass_flowing_sand"`).
- Reakcja jest typu best-effort, a po zakończeniu odpowiedzi lub ścieżki błędu automatycznie podejmowana jest próba jej usunięcia.

## Media, dzielenie na części i dostarczanie

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Załączniki plików Slack są pobierane z prywatnych URL-i hostowanych przez Slack (przepływ żądań uwierzytelnionych tokenem) i zapisywane w magazynie mediów, gdy pobranie się powiedzie, a limity rozmiaru na to pozwalają.

    Limit rozmiaru przychodzącego w runtime domyślnie wynosi `20MB`, chyba że zostanie nadpisany przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - fragmenty tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie najpierw według akapitów
    - wysyłanie plików używa API przesyłania Slack i może obejmować odpowiedzi w wątkach (`thread_ts`)
    - limit mediów wychodzących podlega `channels.slack.mediaMaxMb`, jeśli jest skonfigurowany; w przeciwnym razie wysyłki kanałowe używają domyślnych wartości typu MIME z potoku mediów
  </Accordion>

  <Accordion title="Delivery targets">
    Preferowane jawne cele:

    - `user:<id>` dla DM
    - `channel:<id>` dla kanałów

    DM Slack są otwierane przez API konwersacji Slack podczas wysyłania do celów użytkownika.

  </Accordion>
</AccordionGroup>

## Polecenia i zachowanie slash

Polecenia slash pojawiają się w Slack jako pojedyncze skonfigurowane polecenie albo wiele natywnych poleceń. Skonfiguruj `channels.slack.slashCommand`, aby zmienić domyślne ustawienia poleceń:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Natywne polecenia wymagają [dodatkowych ustawień manifestu](#additional-manifest-settings) w aplikacji Slack i są włączane przez `channels.slack.commands.native: true` lub zamiast tego `commands.native: true` w konfiguracjach globalnych.

- Tryb auto natywnych poleceń jest **wyłączony** dla Slack, więc `commands.native: "auto"` nie włącza natywnych poleceń Slack.

```txt
/help
```

Natywne menu argumentów używają adaptacyjnej strategii renderowania, która pokazuje modal potwierdzenia przed wysłaniem wybranej wartości opcji:

- do 5 opcji: bloki przycisków
- 6-100 opcji: statyczne menu wyboru
- ponad 100 opcji: zewnętrzny wybór z asynchronicznym filtrowaniem opcji, gdy dostępne są handlery opcji interaktywności
- przekroczone limity Slack: zakodowane wartości opcji wracają do przycisków

```txt
/think
```

Sesje slash używają izolowanych kluczy, takich jak `agent:<agentId>:slack:slash:<userId>`, i nadal kierują wykonania poleceń do docelowej sesji rozmowy za pomocą `CommandTargetSessionKey`.

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

Po włączeniu agenci mogą emitować dyrektywy odpowiedzi tylko dla Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Te dyrektywy są kompilowane do Slack Block Kit i kierują kliknięcia lub wybory z powrotem przez istniejącą ścieżkę zdarzeń interakcji Slack.

Uwagi:

- To interfejs specyficzny dla Slack. Inne kanały nie tłumaczą dyrektyw Slack Block Kit na własne systemy przycisków.
- Wartości interaktywnych callbacków to nieprzezroczyste tokeny generowane przez OpenClaw, a nie surowe wartości tworzone przez agenta.
- Jeśli wygenerowane interaktywne bloki przekroczyłyby limity Slack Block Kit, OpenClaw wraca do oryginalnej odpowiedzi tekstowej zamiast wysyłać nieprawidłowy ładunek blocks.

## Zatwierdzenia exec w Slack

Slack może działać jako natywny klient zatwierdzeń z interaktywnymi przyciskami i interakcjami, zamiast wracać do interfejsu Web UI lub terminala.

- Zatwierdzenia exec używają `channels.slack.execApprovals.*` do natywnego routingu DM/kanałów.
- Zatwierdzenia Plugin nadal mogą być rozwiązywane przez tę samą natywną powierzchnię przycisków Slack, gdy żądanie już trafia do Slack, a rodzaj identyfikatora zatwierdzenia to `plugin:`.
- Autoryzacja zatwierdzającego nadal jest egzekwowana: tylko użytkownicy zidentyfikowani jako zatwierdzający mogą zatwierdzać lub odrzucać żądania przez Slack.

Używa to tej samej współdzielonej powierzchni przycisków zatwierdzania co inne kanały. Gdy `interactivity` jest włączone w ustawieniach aplikacji Slack, prompty zatwierdzeń są renderowane jako przyciski Block Kit bezpośrednio w rozmowie.
Gdy te przyciski są obecne, są podstawowym UX zatwierdzania; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że
zatwierdzenia czatowe są niedostępne lub ręczne zatwierdzenie jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalne; jeśli to możliwe, fallback do `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i zostanie rozpoznany co najmniej jeden
zatwierdzający. Ustaw `enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzeń.
Ustaw `enabled: true`, aby wymusić natywne zatwierdzenia, gdy zatwierdzający zostaną rozpoznani.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzeń exec dla Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Jawna natywna konfiguracja Slack jest potrzebna tylko wtedy, gdy chcesz nadpisać zatwierdzających, dodać filtry lub
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

Współdzielone przekazywanie `approvals.exec` jest oddzielne. Używaj go tylko wtedy, gdy prompty zatwierdzeń exec muszą być również
kierowane do innych czatów lub jawnych celów poza pasmem. Współdzielone przekazywanie `approvals.plugin` także jest
oddzielne; natywne przyciski Slack nadal mogą rozwiązywać zatwierdzenia Plugin, gdy te żądania już trafiają
do Slack.

`/approve` w tym samym czacie działa także w kanałach i DM Slack, które już obsługują polecenia. Zobacz [Exec approvals](/pl/tools/exec-approvals), aby poznać pełny model przekazywania zatwierdzeń.

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości i rozgłoszenia wątków są mapowane na zdarzenia systemowe.
- Zdarzenia dodawania/usuwania reakcji są mapowane na zdarzenia systemowe.
- Zdarzenia dołączenia/opuszczenia członka, utworzenia/zmiany nazwy kanału oraz dodania/usunięcia przypięcia są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanału, gdy `configWrites` jest włączone.
- Metadane tematu/przeznaczenia kanału są traktowane jako niezaufany kontekst i mogą być wstrzykiwane do kontekstu routingu.
- Kontekst inicjujący wątek i początkowy kontekst historii wątku są filtrowane według skonfigurowanych list dozwolonych nadawców, gdy ma to zastosowanie.
- Akcje bloków i interakcje modalne emitują ustrukturyzowane zdarzenia systemowe `Slack interaction: ...` z bogatymi polami ładunku:
  - akcje bloków: wybrane wartości, etykiety, wartości wybieraków i metadane `workflow_*`
  - zdarzenia modalne `view_submission` i `view_closed` z routowanymi metadanymi kanału i danymi wejściowymi formularza

## Dokumentacja konfiguracji

Podstawowa dokumentacja: [Configuration reference - Slack](/pl/gateway/config-channels#slack).

<Accordion title="Pola Slack o wysokim znaczeniu">

- tryb/autoryzacja: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- dostęp DM: `dm.enabled`, `dmPolicy`, `allowFrom` (starsza forma: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- przełącznik zgodności: `dangerouslyAllowNameMatching` (awaryjny; pozostaw wyłączony, jeśli nie jest potrzebny)
- dostęp do kanałów: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- wątki/historia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operacje/funkcje: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak odpowiedzi w kanałach">
    Sprawdź po kolei:

    - `groupPolicy`
    - lista dozwolonych kanałów (`channels.slack.channels`)
    - `requireMention`
    - lista dozwolonych `users` dla kanału

    Przydatne polecenia:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Wiadomości DM są ignorowane">
    Sprawdź:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (lub starszą formę `channels.slack.dm.policy`)
    - zatwierdzenia parowania / wpisy listy dozwolonych

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Tryb socket nie łączy się">
    Sprawdź poprawność tokenów bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` lub
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżące środowisko runtime nie mogło rozwiązać wartości
    opartej na SecretRef.

  </Accordion>

  <Accordion title="Tryb HTTP nie odbiera zdarzeń">
    Sprawdź:

    - signing secret
    - ścieżkę webhook
    - URL-e żądań Slack (Events + Interactivity + Slash Commands)
    - unikalne `webhookPath` dla każdego konta HTTP

    Jeśli w migawkach konta pojawia się `signingSecretStatus: "configured_unavailable"`,
    konto HTTP jest skonfigurowane, ale bieżące środowisko runtime nie mogło
    rozwiązać signing secret opartego na SecretRef.

  </Accordion>

  <Accordion title="Natywne/polecenia slash nie działają">
    Sprawdź, czy chodziło Ci o:

    - tryb natywnych poleceń (`channels.slack.commands.native: true`) z pasującymi poleceniami slash zarejestrowanymi w Slack
    - czy o tryb pojedynczego polecenia slash (`channels.slack.slashCommand.enabled: true`)

    Sprawdź także `commands.useAccessGroups` oraz listy dozwolonych kanałów/użytkowników.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Slack z gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pl/channels/groups">
    Zachowanie kanałów i grupowych DM.
  </Card>
  <Card title="Channel routing" icon="route" href="/pl/channels/channel-routing">
    Kieruj przychodzące wiadomości do agentów.
  </Card>
  <Card title="Security" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i utwardzanie.
  </Card>
  <Card title="Configuration" icon="sliders" href="/pl/gateway/configuration">
    Układ konfiguracji i priorytet.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pl/tools/slash-commands">
    Katalog poleceń i zachowanie.
  </Card>
</CardGroup>
