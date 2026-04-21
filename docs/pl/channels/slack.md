---
read_when:
    - Konfigurowanie Slack lub debugowanie trybu gniazda/HTTP Slack
summary: Konfiguracja Slack i zachowanie w czasie działania (Socket Mode + adresy URL żądań HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-21T17:45:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30b372a3ae10b7b649532181306e42792aca76b41422516e9633eb79f73f009
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: gotowe do produkcji dla wiadomości DM i kanałów przez integracje aplikacji Slack. Trybem domyślnym jest Socket Mode; obsługiwane są także adresy URL żądań HTTP.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości DM Slack domyślnie używają trybu parowania.
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
        - wklej [przykładowy manifest](#manifest-and-scope-checklist) poniżej i kontynuuj tworzenie
        - wygeneruj **App-Level Token** (`xapp-...`) z uprawnieniem `connections:write`
        - zainstaluj aplikację i skopiuj wyświetlony **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Skonfiguruj OpenClaw">

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

        Zmienna środowiskowa awaryjnie (tylko konto domyślne):

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

  <Tab title="Adresy URL żądań HTTP">
    <Steps>
      <Step title="Utwórz nową aplikację Slack">
        W ustawieniach aplikacji Slack naciśnij przycisk **[Create New App](https://api.slack.com/apps/new)**:

        - wybierz **from a manifest** i wybierz obszar roboczy dla swojej aplikacji
        - wklej [przykładowy manifest](#manifest-and-scope-checklist) i zaktualizuj adresy URL przed utworzeniem
        - zapisz **Signing Secret** do weryfikacji żądań
        - zainstaluj aplikację i skopiuj wyświetlony **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Skonfiguruj OpenClaw">

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
        Używaj unikalnych ścieżek webhooków dla wielu kont HTTP

        Nadaj każdemu kontu odrębny `webhookPath` (domyślnie `/slack/events`), aby rejestracje nie kolidowały ze sobą.
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

## Lista kontrolna manifestu i zakresów

<Tabs>
  <Tab title="Socket Mode (domyślnie)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Łącznik Slack dla OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Wyślij wiadomość do OpenClaw",
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

  </Tab>

  <Tab title="Adresy URL żądań HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Łącznik Slack dla OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Wyślij wiadomość do OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### Dodatkowe ustawienia manifestu

Udostępnij różne funkcje rozszerzające powyższe ustawienia domyślne.

<AccordionGroup>
  <Accordion title="Opcjonalne natywne polecenia ukośnikowe">

    Można używać wielu [natywnych poleceń ukośnikowych](#commands-and-slash-behavior) zamiast jednego skonfigurowanego polecenia, z pewnymi niuansami:

    - Użyj `/agentstatus` zamiast `/status`, ponieważ polecenie `/status` jest zarezerwowane.
    - Jednocześnie można udostępnić nie więcej niż 25 poleceń ukośnikowych.

    Zastąp istniejącą sekcję `features.slash_commands` podzbiorem [dostępnych poleceń](/pl/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (domyślnie)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Rozpocznij nową sesję",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Zresetuj bieżącą sesję"
      },
      {
        "command": "/compact",
        "description": "Wykonaj Compaction kontekstu sesji",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Zatrzymaj bieżące uruchomienie"
      },
      {
        "command": "/session",
        "description": "Zarządzaj wygaśnięciem powiązania z wątkiem",
        "usage_hint": "idle <duration|off> lub max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Ustaw poziom myślenia",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Przełącz szczegółowe dane wyjściowe",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Pokaż lub ustaw tryb szybki",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Przełącz widoczność rozumowania",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Przełącz tryb podwyższonych uprawnień",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Pokaż lub ustaw domyślne wartości exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Pokaż lub ustaw model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "Wyświetl dostawców lub modele dla dostawcy",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Pokaż krótkie podsumowanie pomocy"
      },
      {
        "command": "/commands",
        "description": "Pokaż wygenerowany katalog poleceń"
      },
      {
        "command": "/tools",
        "description": "Pokaż, czego bieżący agent może teraz używać",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Pokaż stan środowiska uruchomieniowego, w tym użycie/limit dostawcy, jeśli dostępne"
      },
      {
        "command": "/tasks",
        "description": "Wyświetl aktywne/ostatnie zadania w tle dla bieżącej sesji"
      },
      {
        "command": "/context",
        "description": "Wyjaśnij, jak składany jest kontekst",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Pokaż tożsamość nadawcy"
      },
      {
        "command": "/skill",
        "description": "Uruchom Skill według nazwy",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Zadaj poboczne pytanie bez zmiany kontekstu sesji",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Steruj stopką użycia lub pokaż podsumowanie kosztów",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="Adresy URL żądań HTTP">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Rozpocznij nową sesję",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Zresetuj bieżącą sesję",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Wykonaj Compaction kontekstu sesji",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Zatrzymaj bieżące uruchomienie",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Zarządzaj wygaśnięciem powiązania z wątkiem",
        "usage_hint": "idle <duration|off> lub max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Ustaw poziom myślenia",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Przełącz szczegółowe dane wyjściowe",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Pokaż lub ustaw tryb szybki",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Przełącz widoczność rozumowania",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Przełącz tryb podwyższonych uprawnień",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Pokaż lub ustaw domyślne wartości exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Pokaż lub ustaw model",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Wyświetl dostawców lub modele dla dostawcy",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Pokaż krótkie podsumowanie pomocy",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Pokaż wygenerowany katalog poleceń",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Pokaż, czego bieżący agent może teraz używać",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Pokaż stan środowiska uruchomieniowego, w tym użycie/limit dostawcy, jeśli dostępne",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Wyświetl aktywne/ostatnie zadania w tle dla bieżącej sesji",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Wyjaśnij, jak składany jest kontekst",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Pokaż tożsamość nadawcy",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Uruchom Skill według nazwy",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Zadaj poboczne pytanie bez zmiany kontekstu sesji",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Steruj stopką użycia lub pokaż podsumowanie kosztów",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Opcjonalne zakresy autorstwa (operacje zapisu)">
    Dodaj zakres bota `chat:write.customize`, jeśli chcesz, aby wiadomości wychodzące używały tożsamości aktywnego agenta (niestandardowa nazwa użytkownika i ikona) zamiast domyślnej tożsamości aplikacji Slack.

    Jeśli używasz ikony emoji, Slack oczekuje składni `:nazwa_emoji:`.

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
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują zwykłe
  ciągi znaków lub obiekty SecretRef.
- Tokeny w konfiguracji zastępują awaryjne wartości ze środowiska.
- Awaryjne wartości środowiskowe `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` dotyczą tylko konta domyślnego.
- `userToken` (`xoxp-...`) jest dostępny tylko w konfiguracji (bez awaryjnej wartości ze środowiska) i domyślnie działa tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki stanu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status` dla każdego poświadczenia
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Stan ma wartość `available`, `configured_unavailable` lub `missing`.
- `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef
  lub inne niejawne źródło sekretu, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego
  nie mogła rozwiązać rzeczywistej wartości.
- W trybie HTTP uwzględniane jest `signingSecretStatus`; w Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
W przypadku działań/odczytów katalogu preferowany może być token użytkownika, jeśli jest skonfigurowany. Przy zapisie nadal preferowany jest token bota; zapis tokenem użytkownika jest dozwolony tylko wtedy, gdy `userTokenReadOnly: false` i token bota jest niedostępny.
</Tip>

## Działania i bramki

Działania Slack są kontrolowane przez `channels.slack.actions.*`.

Dostępne grupy działań w bieżących narzędziach Slack:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Bieżące działania na wiadomościach Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` oraz `emoji-list`.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasady wiadomości DM">
    `channels.slack.dmPolicy` kontroluje dostęp do wiadomości DM (starsza nazwa: `channels.slack.dm.policy`):

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.slack.allowFrom` zawierało `"*"`; starsza nazwa: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flagi DM:

    - `dm.enabled` (domyślnie true)
    - `channels.slack.allowFrom` (zalecane)
    - `dm.allowFrom` (starsze)
    - `dm.groupEnabled` (grupowe DM domyślnie false)
    - `dm.groupChannels` (opcjonalna lista dozwolonych MPIM)

    Priorytet dla wielu kont:

    - `channels.slack.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Parowanie w wiadomościach DM używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Zasady kanałów">
    `channels.slack.groupPolicy` kontroluje obsługę kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Lista dozwolonych kanałów znajduje się pod `channels.slack.channels` i powinna używać stabilnych identyfikatorów kanałów.

    Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.slack` całkowicie nie istnieje (konfiguracja tylko przez env), środowisko uruchomieniowe używa awaryjnie `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logach (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozwiązywanie nazw/ID:

    - wpisy listy dozwolonych kanałów i listy dozwolonych DM są rozwiązywane przy starcie, gdy dostęp tokena na to pozwala
    - nierozwiązane wpisy nazw kanałów są zachowywane zgodnie z konfiguracją, ale domyślnie ignorowane przy routingu
    - autoryzacja przychodząca i routing kanałów domyślnie używają najpierw ID; bezpośrednie dopasowanie nazwy użytkownika/sluga wymaga `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Wzmianki i użytkownicy kanałów">
    Wiadomości kanałowe są domyślnie ograniczane przez wzmianki.

    Źródła wzmianek:

    - jawna wzmianka o aplikacji (`<@botId>`)
    - wzorce regex dla wzmianek (`agents.list[].groupChat.mentionPatterns`, awaryjnie `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi w wątku do bota (wyłączone, gdy `thread.requireExplicitMention` ma wartość `true`)

    Kontrolki dla kanału (`channels.slack.channels.<id>`; nazwy tylko przez rozwiązywanie przy starcie lub `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista dozwolonych)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `id:`, `e164:`, `username:`, `name:` lub wildcard `"*"`
      (starsze klucze bez prefiksu nadal mapują się tylko do `id:`)

  </Tab>
</Tabs>

## Wątki, sesje i znaczniki odpowiedzi

- Wiadomości DM są routowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Przy domyślnym `session.dmScope=main` wiadomości DM Slack zwijają się do głównej sesji agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Odpowiedzi w wątku mogą tworzyć sufiksy sesji wątku (`:thread:<threadTs>`), gdy ma to zastosowanie.
- Wartość domyślna `channels.slack.thread.historyScope` to `thread`; wartość domyślna `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` kontroluje, ile istniejących wiadomości w wątku jest pobieranych przy rozpoczęciu nowej sesji wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).
- `channels.slack.thread.requireExplicitMention` (domyślnie `false`): gdy ma wartość `true`, wycisza niejawne wzmianki w wątku, aby bot odpowiadał tylko na jawne wzmianki `@bot` wewnątrz wątków, nawet jeśli bot już uczestniczył w wątku. Bez tego odpowiedzi w wątku, w którym uczestniczył bot, omijają bramkowanie `requireMention`.

Kontrolki wątkowania odpowiedzi:

- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: dla każdego `direct|group|channel`
- starsza awaryjna wartość dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Obsługiwane są ręczne znaczniki odpowiedzi:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Uwaga: `replyToMode="off"` wyłącza **całe** wątkowanie odpowiedzi w Slack, w tym jawne znaczniki `[[reply_to_*]]`. To różni się od Telegram, gdzie jawne znaczniki są nadal respektowane w trybie `"off"`. Różnica odzwierciedla modele wątków platform: wątki Slack ukrywają wiadomości przed kanałem, podczas gdy odpowiedzi Telegram pozostają widoczne w głównym przepływie czatu.

## Reakcje ack

`ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

Kolejność rozwiązywania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- awaryjna wartość emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie `"👀"`)

Uwagi:

- Slack oczekuje shortcode’ów (na przykład `"eyes"`).
- Użyj `""`, aby wyłączyć reakcję dla konta Slack lub globalnie.

## Strumieniowanie tekstu

`channels.slack.streaming` kontroluje zachowanie podglądu na żywo:

- `off`: wyłącz strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastąp tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołącz porcjowane aktualizacje podglądu.
- `progress`: pokazuj tekst stanu postępu podczas generowania, a następnie wyślij tekst końcowy.
- `streaming.preview.toolProgress`: gdy aktywny jest roboczy podgląd, kieruj aktualizacje narzędzi/postępu do tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować oddzielne wiadomości narzędzi/postępu.

`channels.slack.streaming.nativeTransport` kontroluje natywne strumieniowanie tekstu Slack, gdy `channels.slack.streaming.mode` ma wartość `partial` (domyślnie: `true`).

- Wątek odpowiedzi musi być dostępny, aby pojawiło się natywne strumieniowanie tekstu i stan wątku asystenta Slack. Wybór wątku nadal odbywa się zgodnie z `replyToMode`.
- Główne wiadomości w kanałach i czatach grupowych nadal mogą używać zwykłego roboczego podglądu, gdy natywne strumieniowanie jest niedostępne.
- Wiadomości DM Slack najwyższego poziomu domyślnie pozostają poza wątkiem, więc nie pokazują podglądu w stylu wątku; użyj odpowiedzi w wątku lub `typingReaction`, jeśli chcesz tam widocznego postępu.
- Media i ładunki inne niż tekst wracają do zwykłego dostarczania.
- Jeśli strumieniowanie nie powiedzie się w trakcie odpowiedzi, OpenClaw wraca do zwykłego dostarczania dla pozostałych ładunków.

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
- boolean `channels.slack.streaming` jest automatycznie migrowany do `channels.slack.streaming.mode` i `channels.slack.streaming.nativeTransport`.
- starsze `channels.slack.nativeStreaming` jest automatycznie migrowane do `channels.slack.streaming.nativeTransport`.

## Awaryjna reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu uruchomienia. Jest to najbardziej przydatne poza odpowiedziami w wątku, które używają domyślnego wskaźnika stanu „pisze...”.

Kolejność rozwiązywania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje shortcode’ów (na przykład `"hourglass_flowing_sand"`).
- Reakcja jest best-effort, a po zakończeniu odpowiedzi lub ścieżki błędu automatycznie podejmowana jest próba jej wyczyszczenia.

## Media, dzielenie na fragmenty i dostarczanie

<AccordionGroup>
  <Accordion title="Załączniki przychodzące">
    Załączniki plików Slack są pobierane z prywatnych adresów URL hostowanych przez Slack (przepływ żądań uwierzytelnianych tokenem) i zapisywane w magazynie mediów, gdy pobranie się powiedzie i pozwalają na to limity rozmiaru.

    Domyślny limit rozmiaru przychodzącego w środowisku uruchomieniowym to `20MB`, chyba że zostanie nadpisany przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Tekst wychodzący i pliki">
    - fragmenty tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie najpierw po akapitach
    - wysyłanie plików używa API przesyłania Slack i może obejmować odpowiedzi w wątku (`thread_ts`)
    - limit mediów wychodzących jest zgodny z `channels.slack.mediaMaxMb`, gdy jest skonfigurowany; w przeciwnym razie wysyłki kanałowe używają domyślnych wartości rodzaju MIME z potoku mediów
  </Accordion>

  <Accordion title="Cele dostarczania">
    Preferowane jawne cele:

    - `user:<id>` dla wiadomości DM
    - `channel:<id>` dla kanałów

    Wiadomości DM Slack są otwierane przez API konwersacji Slack podczas wysyłania do celów użytkownika.

  </Accordion>
</AccordionGroup>

## Polecenia i zachowanie poleceń ukośnikowych

Polecenia ukośnikowe pojawiają się w Slack jako pojedyncze skonfigurowane polecenie lub wiele natywnych poleceń. Skonfiguruj `channels.slack.slashCommand`, aby zmienić domyślne ustawienia poleceń:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Natywne polecenia wymagają [dodatkowych ustawień manifestu](#additional-manifest-settings) w aplikacji Slack i są włączane przez `channels.slack.commands.native: true` lub zamiast tego przez `commands.native: true` w konfiguracjach globalnych.

- Automatyczny tryb natywnych poleceń jest **wyłączony** dla Slack, więc `commands.native: "auto"` nie włącza natywnych poleceń Slack.

```txt
/help
```

Natywne menu argumentów używają adaptacyjnej strategii renderowania, która pokazuje modal potwierdzenia przed wysłaniem wybranej wartości opcji:

- do 5 opcji: bloki przycisków
- 6-100 opcji: statyczne menu wyboru
- więcej niż 100 opcji: zewnętrzny wybór z asynchronicznym filtrowaniem opcji, gdy dostępne są handlery opcji interaktywności
- przekroczone limity Slack: zakodowane wartości opcji wracają do przycisków

```txt
/think
```

Sesje poleceń ukośnikowych używają odizolowanych kluczy, takich jak `agent:<agentId>:slack:slash:<userId>`, i nadal kierują wykonania poleceń do docelowej sesji konwersacji przy użyciu `CommandTargetSessionKey`.

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

- To jest interfejs specyficzny dla Slack. Inne kanały nie tłumaczą dyrektyw Slack Block Kit na własne systemy przycisków.
- Wartości interaktywnego callbacka to nieprzezroczyste tokeny generowane przez OpenClaw, a nie surowe wartości tworzone przez agenta.
- Jeśli wygenerowane bloki interaktywne przekroczyłyby limity Slack Block Kit, OpenClaw wraca do oryginalnej odpowiedzi tekstowej zamiast wysyłać nieprawidłowy ładunek blocks.

## Zatwierdzenia exec w Slack

Slack może działać jako natywny klient zatwierdzeń z interaktywnymi przyciskami i interakcjami, zamiast wracać do Web UI lub terminala.

- Zatwierdzenia exec używają `channels.slack.execApprovals.*` do natywnego routingu DM/kanału.
- Zatwierdzenia Plugin nadal mogą być rozwiązywane przez tę samą natywną powierzchnię przycisków Slack, gdy żądanie już trafia do Slack, a rodzaj identyfikatora zatwierdzenia to `plugin:`.
- Autoryzacja zatwierdzającego jest nadal egzekwowana: tylko użytkownicy zidentyfikowani jako zatwierdzający mogą zatwierdzać lub odrzucać żądania przez Slack.

Używa to tej samej współdzielonej powierzchni przycisków zatwierdzeń co inne kanały. Gdy `interactivity` jest włączone w ustawieniach aplikacji Slack, prompty zatwierdzeń są renderowane jako przyciski Block Kit bezpośrednio w konwersacji.
Gdy te przyciski są obecne, stanowią podstawowy UX zatwierdzeń; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie
są niedostępne lub ręczne zatwierdzenie jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalnie; w miarę możliwości wraca do `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i rozwiązuje się co najmniej jeden
zatwierdzający. Ustaw `enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzeń.
Ustaw `enabled: true`, aby wymusić włączenie natywnych zatwierdzeń, gdy rozwiążą się zatwierdzający.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzeń exec dla Slack:

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

Współdzielone przekazywanie `approvals.exec` jest oddzielne. Używaj go tylko wtedy, gdy prompty zatwierdzeń exec muszą być także
kierowane do innych czatów lub jawnych celów poza pasmem. Współdzielone przekazywanie `approvals.plugin` jest również
oddzielne; natywne przyciski Slack nadal mogą rozwiązywać zatwierdzenia pluginów, gdy te żądania już trafiają
do Slack.

Polecenie `/approve` w tym samym czacie działa także w kanałach i wiadomościach DM Slack, które już obsługują polecenia. Pełny model przekazywania zatwierdzeń znajduje się w [Zatwierdzenia exec](/pl/tools/exec-approvals).

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości/transmisje wątków są mapowane na zdarzenia systemowe.
- Zdarzenia dodania/usunięcia reakcji są mapowane na zdarzenia systemowe.
- Zdarzenia dołączenia/opuszczenia członka, utworzenia/zmiany nazwy kanału oraz dodania/usunięcia przypięcia są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanału, gdy `configWrites` jest włączone.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą być wstrzykiwane do kontekstu routingu.
- Inicjator wątku i początkowe zasianie kontekstu historii wątku są filtrowane przez skonfigurowane listy dozwolonych nadawców, gdy ma to zastosowanie.
- Akcje bloków i interakcje modalne emitują ustrukturyzowane zdarzenia systemowe `Slack interaction: ...` z bogatymi polami ładunku:
  - akcje bloków: wybrane wartości, etykiety, wartości selektorów i metadane `workflow_*`
  - zdarzenia modalne `view_submission` i `view_closed` z kierowanymi metadanymi kanału i danymi wejściowymi formularza

## Wskaźniki do dokumentacji referencyjnej konfiguracji

Główna dokumentacja referencyjna:

- [Dokumentacja referencyjna konfiguracji - Slack](/pl/gateway/configuration-reference#slack)

  Kluczowe pola Slack:
  - tryb/uwierzytelnianie: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - dostęp do DM: `dm.enabled`, `dmPolicy`, `allowFrom` (starsze: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - przełącznik zgodności: `dangerouslyAllowNameMatching` (tylko awaryjnie; pozostaw wyłączone, jeśli nie jest potrzebne)
  - dostęp do kanałów: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - wątki/historia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - operacje/funkcje: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak odpowiedzi w kanałach">
    Sprawdź, po kolei:

    - `groupPolicy`
    - listę dozwolonych kanałów (`channels.slack.channels`)
    - `requireMention`
    - listę dozwolonych `users` dla kanału

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
    - `channels.slack.dmPolicy` (lub starsze `channels.slack.dm.policy`)
    - zatwierdzenia parowania / wpisy listy dozwolonych

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Tryb Socket nie łączy się">
    Zweryfikuj tokeny bota + aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` lub
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło rozwiązać wartości
    opartej na SecretRef.

  </Accordion>

  <Accordion title="Tryb HTTP nie odbiera zdarzeń">
    Zweryfikuj:

    - signing secret
    - ścieżkę webhooka
    - adresy URL żądań Slack (Events + Interactivity + Slash Commands)
    - unikalny `webhookPath` dla każdego konta HTTP

    Jeśli w migawkach konta pojawia się `signingSecretStatus: "configured_unavailable"`,
    konto HTTP jest skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło
    rozwiązać signing secret opartego na SecretRef.

  </Accordion>

  <Accordion title="Natywne/polecenia ukośnikowe nie uruchamiają się">
    Sprawdź, czy chodziło Ci o:

    - natywny tryb poleceń (`channels.slack.commands.native: true`) z odpowiadającymi poleceniami ukośnikowymi zarejestrowanymi w Slack
    - albo tryb pojedynczego polecenia ukośnikowego (`channels.slack.slashCommand.enabled: true`)

    Sprawdź też `commands.useAccessGroups` oraz listy dozwolonych kanałów/użytkowników.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Bezpieczeństwo](/pl/gateway/security)
- [Routing kanałów](/pl/channels/channel-routing)
- [Rozwiązywanie problemów](/pl/channels/troubleshooting)
- [Konfiguracja](/pl/gateway/configuration)
- [Polecenia ukośnikowe](/pl/tools/slash-commands)
