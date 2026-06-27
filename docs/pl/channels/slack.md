---
read_when:
    - Konfigurowanie Slack lub debugowanie trybu gniazda Slack, HTTP albo relay
summary: Konfiguracja Slack i zachowanie w czasie wykonywania (tryb Socket, adresy URL żądań HTTP i tryb przekaźnika)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:14:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Gotowe do produkcji dla wiadomości prywatnych i kanałów przez integracje aplikacji Slack. Domyślnym trybem jest Socket Mode; obsługiwane są też adresy URL żądań HTTP. Tryb przekaźnika jest przeznaczony do zarządzanych wdrożeń, w których zaufany router odpowiada za wejście Slack.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Slack domyślnie używają trybu parowania.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pl/tools/slash-commands">
    Natywne zachowanie poleceń i katalog poleceń.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i instrukcje naprawcze.
  </Card>
</CardGroup>

## Wybór Socket Mode albo adresów URL żądań HTTP

Oba transporty są gotowe do produkcji i zapewniają równoważność funkcji dla wiadomości, poleceń ukośnikiem, App Home oraz interaktywności. Wybieraj według kształtu wdrożenia, a nie funkcji.

| Kwestia                      | Socket Mode (domyślnie)                                                                                                                                | Adresy URL żądań HTTP                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Publiczny URL Gateway           | Nie jest wymagany                                                                                                                                         | Wymagany (DNS, TLS, reverse proxy lub tunel)                                                                   |
| Sieć wychodząca             | Wychodzące WSS do `wss-primary.slack.com` musi być osiągalne                                                                                            | Bez wychodzącego WS; tylko przychodzący HTTPS                                                                             |
| Wymagane tokeny                | Token bota + App-Level Token z `connections:write`                                                                                                 | Token bota + Signing Secret                                                                                     |
| Laptop deweloperski / za zaporą | Działa bez zmian                                                                                                                                          | Wymaga publicznego tunelu (ngrok, Cloudflare Tunnel, Tailscale Funnel) albo stagingowego Gateway                          |
| Skalowanie poziome           | Jedna sesja Socket Mode na aplikację na host; wiele Gateway wymaga osobnych aplikacji Slack                                                                 | Bezstanowy handler POST; wiele replik Gateway może współdzielić jedną aplikację za load balancerem                     |
| Wiele kont na jednym Gateway | Obsługiwane; każde konto otwiera własne WS                                                                                                             | Obsługiwane; każde konto potrzebuje unikalnego `webhookPath` (domyślnie `/slack/events`), aby rejestracje nie kolidowały |
| Transport poleceń ukośnikiem      | Dostarczane przez połączenie WS; `slash_commands[].url` jest ignorowane                                                                                  | Slack wysyła POST do `slash_commands[].url`; pole jest wymagane, aby polecenie zostało obsłużone                           |
| Podpisywanie żądań              | Nie jest używane (uwierzytelnianiem jest App-Level Token)                                                                                                               | Slack podpisuje każde żądanie; OpenClaw weryfikuje je za pomocą `signingSecret`                                              |
| Odzyskiwanie po zerwaniu połączenia  | Automatyczne ponowne łączenie Slack SDK jest włączone; OpenClaw ponownie uruchamia też nieudane sesje Socket Mode z ograniczonym backoffem. Obowiązuje strojenie transportu dla timeoutu pong. | Brak trwałego połączenia do zerwania; ponowienia są wykonywane dla każdego żądania przez Slack                                           |

<Note>
  **Wybierz Socket Mode** dla hostów z jednym Gateway, laptopów deweloperskich i sieci lokalnych, które mogą łączyć się wychodząco z `*.slack.com`, ale nie mogą przyjmować przychodzącego HTTPS.

**Wybierz adresy URL żądań HTTP**, gdy uruchamiasz wiele replik Gateway za load balancerem, gdy wychodzące WSS jest zablokowane, ale przychodzące HTTPS jest dozwolone, albo gdy już kończysz Webhooki Slack na reverse proxy.
</Note>

### Tryb przekaźnika

Tryb przekaźnika oddziela wejście Slack od Gateway OpenClaw. Zaufany router utrzymuje
pojedyncze połączenie Slack Socket Mode, wybiera docelowy Gateway i przekazuje typowane
zdarzenie przez uwierzytelniony websocket. Gateway nadal używa swojego tokena bota do
wychodzących wywołań Slack Web API.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

URL przekaźnika musi używać `wss://`, chyba że wskazuje localhost. Traktuj token bearer i
tablicę tras routera jako część granicy autoryzacji Slack: kierowane zdarzenia trafiają do
standardowego handlera wiadomości Slack jako autoryzowane aktywacje. Dostarczone przez router `slack_identity`
w ramce websocket `hello` może ustawić domyślną nazwę użytkownika i ikonę dla ruchu wychodzącego; jawna
tożsamość przekazana przez wywołującego nadal ma pierwszeństwo. Połączenie przekaźnika łączy się ponownie z tym samym
ograniczonym czasem backoffu używanym przez Socket Mode i czyści tożsamość dostarczoną przez router za każdym razem,
gdy się rozłączy.

## Instalacja

Zainstaluj Slack przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` rejestruje i włącza Plugin. Plugin nadal nic nie robi, dopóki nie skonfigurujesz aplikacji Slack i ustawień kanału poniżej. Zobacz [Pluginy](/pl/tools/plugin), aby poznać ogólne zachowanie Pluginów i reguły instalacji.

## Szybka konfiguracja

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Otwórz [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → wybierz swój workspace → wklej jeden z poniższych manifestów → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** odpowiada pełnemu zestawowi funkcji Pluginu Slack: App Home, poleceniom ukośnikiem, plikom, reakcjom, pinom, grupowym wiadomościom prywatnym oraz odczytom emoji/usergroup. Wybierz **Minimal**, gdy polityka workspace ogranicza zakresy — obejmuje wiadomości prywatne, historię kanałów/grup, wzmianki i polecenia ukośnikiem, ale usuwa pliki, reakcje, piny, grupowe wiadomości prywatne (`mpim:*`), `emoji:read` i `usergroups:read`. Zobacz [listę kontrolną manifestu i zakresów](#manifest-and-scope-checklist), aby poznać uzasadnienie każdego zakresu i opcje addytywne, takie jak dodatkowe polecenia ukośnikiem.
        </Note>

        Po utworzeniu aplikacji przez Slack:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: dodaj `connections:write`, zapisz, skopiuj App-Level Token.
        - **Install App -> Install to Workspace**: skopiuj Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Zalecana konfiguracja SecretRef:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        Zapasowy wariant env (tylko konto domyślne):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="Adresy URL żądań HTTP">
    <Steps>
      <Step title="Utwórz nową aplikację Slack">
        Otwórz [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → wybierz swój obszar roboczy → wklej jeden z poniższych manifestów → zastąp `https://gateway-host.example.com/slack/events` publicznym adresem URL Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **Recommended** odpowiada pełnemu zestawowi funkcji Plugin Slack; **Minimal** pomija pliki, reakcje, przypięcia, grupowe wiadomości bezpośrednie (`mpim:*`), `emoji:read` i `usergroups:read` dla restrykcyjnych obszarów roboczych. Zobacz [listę kontrolną manifestu i zakresów](#manifest-and-scope-checklist), aby poznać uzasadnienie poszczególnych zakresów.
        </Note>

        <Info>
          Trzy pola URL (`slash_commands[].url`, `event_subscriptions.request_url` oraz `interactivity.request_url` / `message_menu_options_url`) wskazują ten sam punkt końcowy OpenClaw. Schemat manifestu Slack wymaga nadania im oddzielnych nazw, ale OpenClaw wyznacza trasy według typu ładunku, więc wystarczy jeden `webhookPath` (domyślnie `/slack/events`). Polecenia slash bez `slash_commands[].url` będą po cichu nic nie robić w trybie HTTP.
        </Info>

        Po utworzeniu aplikacji przez Slack:

        - **Basic Information → App Credentials**: skopiuj **Signing Secret** do weryfikacji żądań.
        - **Install App -> Install to Workspace**: skopiuj token OAuth użytkownika bota.

      </Step>

      <Step title="Skonfiguruj OpenClaw">

        Zalecana konfiguracja SecretRef:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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
        Używaj unikalnych ścieżek Webhook dla HTTP z wieloma kontami

        Nadaj każdemu kontu odrębny `webhookPath` (domyślnie `/slack/events`), aby rejestracje nie kolidowały.
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

## Strojenie transportu trybu Socket Mode

OpenClaw domyślnie ustawia limit czasu oczekiwania na pong klienta Slack SDK na 15 sekund dla trybu Socket Mode. Nadpisuj ustawienia transportu tylko wtedy, gdy potrzebujesz strojenia specyficznego dla obszaru roboczego lub hosta:

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

Używaj tego tylko dla obszarów roboczych w trybie Socket Mode, które rejestrują przekroczenia limitu czasu pong websocketu Slack lub pingów serwera, albo działają na hostach ze znanym głodzeniem pętli zdarzeń. `clientPingTimeout` to czas oczekiwania na pong po wysłaniu przez SDK pingu klienta; `serverPingTimeout` to czas oczekiwania na pingi serwera Slack. Wiadomości i zdarzenia aplikacji pozostają stanem aplikacji, a nie sygnałami żywotności transportu.

Uwagi:

- `socketMode` jest ignorowane w trybie HTTP Request URL.
- Bazowe ustawienia `channels.slack.socketMode` mają zastosowanie do wszystkich kont Slack, chyba że zostaną nadpisane. Nadpisania dla poszczególnych kont używają `channels.slack.accounts.<accountId>.socketMode`; ponieważ jest to nadpisanie obiektu, uwzględnij każde pole strojenia gniazda, którego chcesz użyć dla tego konta.
- Tylko `clientPingTimeout` ma wartość domyślną OpenClaw (`15000`). `serverPingTimeout` i `pingPongLoggingEnabled` są przekazywane do Slack SDK tylko wtedy, gdy zostały skonfigurowane.
- Opóźnienie ponownego uruchomienia trybu Socket Mode zaczyna się od około 2 sekund i jest ograniczone do około 30 sekund. Odzyskiwalne błędy uruchamiania, oczekiwania na uruchomienie i rozłączenia są ponawiane, dopóki kanał się nie zatrzyma. Trwałe błędy konta i poświadczeń, takie jak nieprawidłowe uwierzytelnienie, unieważnione tokeny lub brakujące zakresy, kończą się szybko zamiast ponawiać próby bez końca.

## Lista kontrolna manifestu i zakresów

Bazowy manifest aplikacji Slack jest taki sam dla trybu Socket Mode i HTTP Request URLs. Różni się tylko blok `settings` (oraz `url` polecenia ukośnikowego).

Bazowy manifest (domyślny tryb Socket Mode):

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Dla **trybu HTTP Request URLs** zastąp `settings` wariantem HTTP i dodaj `url` do każdego polecenia ukośnikowego. Wymagany jest publiczny URL:

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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Udostępnij różne funkcje, które rozszerzają powyższe ustawienia domyślne.

Domyślny manifest włącza kartę **Home** w Slack App Home i subskrybuje `app_home_opened`. Gdy członek workspace otwiera kartę Home, OpenClaw publikuje bezpieczny domyślny widok Home za pomocą `views.publish`; nie zawiera on żadnego payloadu konwersacji ani prywatnej konfiguracji. Karta **Messages** pozostaje włączona dla wiadomości prywatnych Slack. Manifest włącza też wątki asystenta Slack za pomocą `features.assistant_view`, `assistant:write`, `assistant_thread_started` i `assistant_thread_context_changed`; wątki asystenta są kierowane do własnych sesji wątków OpenClaw i utrzymują kontekst wątku dostarczony przez Slack dostępny dla agenta.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Zamiast jednego skonfigurowanego polecenia można używać wielu [natywnych poleceń slash](#commands-and-slash-behavior), z pewnymi zastrzeżeniami:

    - Używaj `/agentstatus` zamiast `/status`, ponieważ polecenie `/status` jest zarezerwowane.
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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
  <Accordion title="Optional authorship scopes (write operations)">
    Dodaj zakres bota `chat:write.customize`, jeśli chcesz, aby wiadomości wychodzące używały tożsamości aktywnego agenta (niestandardowej nazwy użytkownika i ikony) zamiast domyślnej tożsamości aplikacji Slack.

    Jeśli używasz ikony emoji, Slack oczekuje składni `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
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

- `botToken` + `appToken` są wymagane dla Socket Mode.
- Tryb HTTP wymaga `botToken` + `signingSecret`.
- Tryb relay wymaga `botToken` oraz `relay.url`, `relay.authToken` i `relay.gatewayId`; nie używa tokenu aplikacji ani sekretu podpisywania.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` i `userToken` akceptują zwykłe ciągi tekstowe
  albo obiekty SecretRef.
- Tokeny z konfiguracji zastępują fallback env.
- Fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ma zastosowanie tylko do konta domyślnego.
- `userToken` jest dostępny tylko w konfiguracji (bez fallbacku env) i domyślnie działa tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki statusu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status`
  dla poszczególnych poświadczeń (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status to `available`, `configured_unavailable` albo `missing`.
- `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef
  lub inne nieosadzone źródło sekretu, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego
  nie mogła rozwiązać rzeczywistej wartości.
- W trybie HTTP uwzględniany jest `signingSecretStatus`; w Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
W przypadku akcji/odczytów katalogu token użytkownika może być preferowany, gdy jest skonfigurowany. Do zapisów preferowany pozostaje token bota; zapisy z użyciem tokenu użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false`, a token bota jest niedostępny.
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

Bieżące akcje wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` i `emoji-list`. `download-file` akceptuje identyfikatory plików Slack pokazywane w placeholderach plików przychodzących i zwraca podglądy obrazów dla obrazów albo lokalne metadane pliku dla innych typów plików.

## Kontrola dostępu i routing

  <Tabs>
  <Tab title="Zasady DM">
    `channels.slack.dmPolicy` kontroluje dostęp do DM. `channels.slack.allowFrom` jest kanoniczną listą dozwolonych DM.

    - `pairing` (domyślne)
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

    - `channels.slack.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Starsze `channels.slack.dm.policy` i `channels.slack.dm.allowFrom` nadal są odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Parowanie w DM używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Zasady kanału">
    `channels.slack.groupPolicy` kontroluje obsługę kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Lista dozwolonych kanałów znajduje się pod `channels.slack.channels` i **musi używać stabilnych identyfikatorów kanałów Slack** (na przykład `C12345678`) jako kluczy konfiguracji.

    Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.slack` całkowicie brakuje (konfiguracja tylko przez env), środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logu (nawet jeśli `channels.defaults.groupPolicy` jest ustawione).

    Rozpoznawanie nazw/ID:

    - wpisy listy dozwolonych kanałów i wpisy listy dozwolonych DM są rozpoznawane podczas uruchamiania, gdy dostęp tokena na to pozwala
    - nierozpoznane wpisy nazw kanałów są zachowywane zgodnie z konfiguracją, ale domyślnie ignorowane przy routingu
    - autoryzacja przychodząca i routing kanałów domyślnie najpierw używają ID; bezpośrednie dopasowanie nazwy użytkownika/sluga wymaga `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Klucze oparte na nazwach (`#channel-name` lub `channel-name`) **nie** pasują przy `groupPolicy: "allowlist"`. Wyszukiwanie kanału domyślnie najpierw używa ID, więc klucz oparty na nazwie nigdy nie zostanie poprawnie skierowany, a wszystkie wiadomości w tym kanale będą cicho blokowane. Różni się to od `groupPolicy: "open"`, gdzie klucz kanału nie jest wymagany do routingu, a klucz oparty na nazwie wydaje się działać.

    Zawsze używaj ID kanału Slack jako klucza. Aby go znaleźć: kliknij kanał w Slack prawym przyciskiem myszy → **Copy link** — ID (`C...`) pojawia się na końcu URL.

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

  <Tab title="Wzmianki i użytkownicy kanału">
    Wiadomości w kanałach domyślnie wymagają wzmianki.

    Źródła wzmianek:

    - jawna wzmianka o aplikacji (`<@botId>`)
    - wzmianka o grupie użytkowników Slack (`<!subteam^S...>`), gdy użytkownik bota jest członkiem tej grupy użytkowników; wymaga `usergroups:read`
    - wzorce regex wzmianek (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie wątku odpowiedzi do bota (wyłączone, gdy `thread.requireExplicitMention` ma wartość `true`)

    Kontrole dla kanału (`channels.slack.channels.<id>`; nazwy tylko przez rozpoznawanie podczas uruchamiania lub `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista dozwolonych)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` lub symbol wieloznaczny `"*"`
      (starsze klucze bez prefiksu nadal mapują tylko do `id:`)

    `allowBots` jest zachowawcze dla kanałów i kanałów prywatnych: wiadomości w pokojach utworzone przez boty są akceptowane tylko wtedy, gdy wysyłający bot jest jawnie wymieniony na liście dozwolonych `users` tego pokoju, albo gdy co najmniej jeden jawny identyfikator właściciela Slack z `channels.slack.allowFrom` jest obecnie członkiem pokoju. Symbole wieloznaczne i wpisy właścicieli oparte na nazwie wyświetlanej nie spełniają warunku obecności właściciela. Obecność właściciela używa Slack `conversations.members`; upewnij się, że aplikacja ma odpowiedni zakres odczytu dla typu pokoju (`channels:read` dla kanałów publicznych, `groups:read` dla kanałów prywatnych). Jeśli wyszukiwanie członków się nie powiedzie, OpenClaw odrzuca wiadomość w pokoju utworzoną przez bota.

    Akceptowane wiadomości Slack utworzone przez boty używają wspólnej [ochrony przed pętlą bota](/pl/channels/bot-loop-protection). Skonfiguruj `channels.defaults.botLoopProtection` dla domyślnego budżetu, a następnie nadpisz go za pomocą `channels.slack.botLoopProtection` lub `channels.slack.channels.<id>.botLoopProtection`, gdy obszar roboczy lub kanał potrzebuje innego limitu.

  </Tab>
</Tabs>

## Wątki, sesje i znaczniki odpowiedzi

- Wiadomości prywatne są trasowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Powiązania tras Slack akceptują surowe identyfikatory peerów oraz formy celu Slack, takie jak `channel:C12345678`, `user:U12345678` i `<@U12345678>`.
- Przy domyślnym `session.dmScope=main` wiadomości prywatne Slack są łączone z główną sesją agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Zwykłe wiadomości najwyższego poziomu w kanale pozostają w sesji przypisanej do kanału, nawet gdy `replyToMode` nie jest ustawione na `off`.
- Odpowiedzi w wątkach Slack używają nadrzędnego Slack `thread_ts` jako sufiksów sesji (`:thread:<threadTs>`), nawet gdy wychodzące wątkowanie odpowiedzi jest wyłączone przez `replyToMode="off"`.
- OpenClaw zasila kwalifikujący się korzeń najwyższego poziomu kanału do `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, gdy oczekuje się, że ten korzeń rozpocznie widoczny wątek Slack, dzięki czemu korzeń i późniejsze odpowiedzi w wątku współdzielą jedną sesję OpenClaw. Dotyczy to zdarzeń `app_mention`, jawnych dopasowań bota lub skonfigurowanego wzorca wzmianek oraz kanałów `requireMention: false` z `replyToMode` innym niż `off`.
- Domyślna wartość `channels.slack.thread.historyScope` to `thread`; domyślna wartość `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` kontroluje, ile istniejących wiadomości wątku jest pobieranych, gdy zaczyna się nowa sesja wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).
- `channels.slack.thread.requireExplicitMention` (domyślnie `false`): gdy `true`, tłumi niejawne wzmianki w wątku, aby bot odpowiadał tylko na jawne wzmianki `@bot` wewnątrz wątków, nawet gdy bot już uczestniczył w wątku. Bez tego odpowiedzi w wątku, w którym uczestniczył bot, omijają bramkowanie `requireMention`.

Elementy sterujące wątkowaniem odpowiedzi:

- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: dla każdego `direct|group|channel`
- starsze rozwiązanie awaryjne dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Obsługiwane są ręczne znaczniki odpowiedzi:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

W przypadku jawnych odpowiedzi w wątku Slack z narzędzia `message` ustaw `replyBroadcast: true` z `action: "send"` oraz `threadId` lub `replyTo`, aby poprosić Slack o dodatkowe nadanie odpowiedzi w wątku do kanału nadrzędnego. To odwzorowuje flagę Slack `chat.postMessage` `reply_broadcast` i jest obsługiwane tylko dla wysyłek tekstu lub Block Kit, nie dla przesyłania multimediów.

Gdy wywołanie narzędzia `message` działa wewnątrz wątku Slack i celuje w ten sam kanał, OpenClaw zwykle dziedziczy bieżący wątek Slack zgodnie z `replyToMode`. Ustaw `topLevel: true` dla `action: "send"` lub `action: "upload-file"`, aby wymusić nową wiadomość w kanale nadrzędnym. `threadId: null` jest akceptowane jako to samo wycofanie do poziomu najwyższego.

<Note>
`replyToMode="off"` wyłącza wychodzące wątkowanie odpowiedzi Slack, w tym jawne znaczniki `[[reply_to_*]]`. Nie spłaszcza ono przychodzących sesji wątków Slack: wiadomości już opublikowane wewnątrz wątku Slack nadal są trasowane do sesji `:thread:<threadTs>`. Różni się to od Telegram, gdzie jawne znaczniki są nadal respektowane w trybie `"off"`. Wątki Slack ukrywają wiadomości przed kanałem, podczas gdy odpowiedzi Telegram pozostają widoczne w treści.
</Note>

## Reakcje potwierdzenia

`ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą. `ackReactionScope` decyduje, _kiedy_ to emoji faktycznie jest wysyłane.

### Emoji (`ackReaction`)

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- awaryjne emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie `"eyes"` / 👀)

Uwagi:

- Slack oczekuje krótkich kodów (na przykład `"eyes"`).
- Użyj `""`, aby wyłączyć reakcję dla konta Slack lub globalnie.

### Zakres (`messages.ackReactionScope`)

Dostawca Slack odczytuje zakres z `messages.ackReactionScope` (domyślnie `"group-mentions"`). Obecnie nie ma nadpisania na poziomie konta Slack ani kanału Slack; wartość jest globalna dla Gateway.

Wartości:

- `"all"`: reaguj w wiadomościach prywatnych i grupach.
- `"direct"`: reaguj tylko w wiadomościach prywatnych.
- `"group-all"`: reaguj na każdą wiadomość grupową (bez wiadomości prywatnych).
- `"group-mentions"` (domyślnie): reaguj w grupach, ale tylko wtedy, gdy bot jest wspomniany (lub w grupowych elementach wzmiankowalnych, które wyraziły zgodę). **Wiadomości prywatne są wykluczone.**
- `"off"` / `"none"`: nigdy nie reaguj.

<Note>
Domyślny zakres (`"group-mentions"`) nie uruchamia reakcji potwierdzenia w wiadomościach bezpośrednich. Aby zobaczyć skonfigurowane `ackReaction` (na przykład `"eyes"`) przy przychodzących wiadomościach prywatnych Slack, ustaw `messages.ackReactionScope` na `"direct"` lub `"all"`. `messages.ackReactionScope` jest odczytywane podczas uruchamiania dostawcy Slack, więc do zastosowania zmiany potrzebne jest ponowne uruchomienie Gateway.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## Strumieniowanie tekstu

`channels.slack.streaming` kontroluje zachowanie podglądu na żywo:

- `off`: wyłącz strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastępuj tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołączaj porcjowane aktualizacje podglądu.
- `progress`: pokazuj tekst statusu postępu podczas generowania, a następnie wyślij tekst końcowy.
- `streaming.preview.toolProgress`: gdy podgląd wersji roboczej jest aktywny, trasuj aktualizacje narzędzi/postępu do tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować osobne wiadomości narzędzi/postępu.
- `streaming.preview.commandText` / `streaming.progress.commandText`: ustaw na `status`, aby zachować kompaktowe wiersze postępu narzędzi, ukrywając surowy tekst polecenia/wykonania (domyślnie: `raw`).

Ukryj surowy tekst polecenia/wykonania, zachowując kompaktowe wiersze postępu:

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

`channels.slack.streaming.nativeTransport` kontroluje natywne strumieniowanie tekstu Slack, gdy `channels.slack.streaming.mode` to `partial` (domyślnie: `true`).

Natywne karty zadań postępu Slack są opcjonalne dla trybu postępu. Ustaw `channels.slack.streaming.progress.nativeTaskCards` na `true` z `channels.slack.streaming.mode="progress"`, aby wysłać natywną dla Slack kartę planu/zadania, gdy praca jest w toku, a następnie zaktualizować tę samą kartę zadania po ukończeniu. Bez tej flagi tryb postępu zachowuje przenośne działanie podglądu wersji roboczej.

- Wątek odpowiedzi musi być dostępny, aby pojawiły się natywne strumieniowanie tekstu i status wątku asystenta Slack. Wybór wątku nadal podąża za `replyToMode`.
- Kanały, czaty grupowe i korzenie wiadomości prywatnych najwyższego poziomu nadal mogą używać zwykłego podglądu wersji roboczej, gdy natywne strumieniowanie jest niedostępne lub nie istnieje wątek odpowiedzi.
- Wiadomości prywatne Slack najwyższego poziomu domyślnie pozostają poza wątkiem, więc nie pokazują natywnego podglądu strumienia/statusu w stylu wątku Slack; zamiast tego OpenClaw publikuje i edytuje podgląd wersji roboczej w wiadomości prywatnej.
- Multimedia i ładunki nietekstowe wracają do zwykłego dostarczania.
- Końcowe multimedia/błędy anulują oczekujące edycje podglądu; kwalifikujące się końcowe teksty/bloki są opróżniane tylko wtedy, gdy mogą edytować podgląd w miejscu.
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

Włącz natywne karty zadań postępu Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Starsze klucze:

- `channels.slack.streamMode` (`replace | status_final | append`) jest starszym aliasem uruchomieniowym dla `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` jest starszym aliasem uruchomieniowym dla `channels.slack.streaming.mode` i `channels.slack.streaming.nativeTransport`.
- starsze `channels.slack.nativeStreaming` jest aliasem uruchomieniowym dla `channels.slack.streaming.nativeTransport`.
- Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację strumieniowania Slack na klucze kanoniczne.

## Awaryjna reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu przebiegu. Jest to najbardziej przydatne poza odpowiedziami w wątkach, które używają domyślnego wskaźnika statusu „pisze...”.

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje krótkich kodów (na przykład `"hourglass_flowing_sand"`).
- Reakcja jest typu best-effort, a czyszczenie jest próbowane automatycznie po zakończeniu odpowiedzi lub ścieżki błędu.

## Multimedia, dzielenie na fragmenty i dostarczanie

<AccordionGroup>
  <Accordion title="Załączniki przychodzące">
    Załączniki plików Slack są pobierane z prywatnych adresów URL hostowanych przez Slack (przepływ żądania uwierzytelnianego tokenem) i zapisywane w magazynie multimediów, gdy pobieranie się powiedzie i pozwalają na to limity rozmiaru. Symbole zastępcze plików zawierają Slack `fileId`, aby agenci mogli pobrać oryginalny plik za pomocą `download-file`.

    Pobieranie używa ograniczonych limitów czasu bezczynności i całkowitych. Jeśli pobieranie pliku Slack się zatrzyma lub nie powiedzie, OpenClaw kontynuuje przetwarzanie wiadomości i wraca do symbolu zastępczego pliku.

    Limit rozmiaru przychodzącego w czasie wykonywania domyślnie wynosi `20MB`, chyba że zostanie nadpisany przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Tekst wychodzący i pliki">
    - fragmenty tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie najpierw według akapitów
    - wysyłki plików używają API przesyłania Slack i mogą zawierać odpowiedzi w wątku (`thread_ts`)
    - limit wychodzących multimediów podąża za `channels.slack.mediaMaxMb`, gdy jest skonfigurowany; w przeciwnym razie wysyłki kanału używają domyślnych wartości rodzaju MIME z potoku multimediów

  </Accordion>

  <Accordion title="Cele dostarczania">
    Preferowane jawne cele:

    - `user:<id>` dla wiadomości prywatnych
    - `channel:<id>` dla kanałów

    Wiadomości prywatne Slack zawierające tylko tekst/bloki mogą publikować bezpośrednio do identyfikatorów użytkowników; przesyłanie plików i wysyłki wątkowane najpierw otwierają wiadomość prywatną przez API konwersacji Slack, ponieważ te ścieżki wymagają konkretnego identyfikatora konwersacji.

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

Natywne polecenia wymagają [dodatkowych ustawień manifestu](#additional-manifest-settings) w aplikacji Slack i są zamiast tego włączane przez `channels.slack.commands.native: true` albo `commands.native: true` w konfiguracjach globalnych.

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

Sesje slash używają izolowanych kluczy, takich jak `agent:<agentId>:slack:slash:<userId>`, i nadal kierują wykonania poleceń do docelowej sesji konwersacji za pomocą `CommandTargetSessionKey`.

## Interaktywne odpowiedzi

Slack może renderować tworzone przez agenta interaktywne elementy sterujące odpowiedziami, ale ta funkcja jest domyślnie wyłączona.
W przypadku nowych wyników agenta, CLI i pluginu preferuj współdzielone przyciski
`presentation` lub bloki wyboru. Używają tej samej ścieżki interakcji Slack,
a jednocześnie degradują się poprawnie na innych kanałach.

Włącz globalnie:

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

Lub włącz tylko dla jednego konta Slack:

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

Po włączeniu agenci nadal mogą emitować przestarzałe dyrektywy odpowiedzi tylko dla Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Te dyrektywy kompilują się do Slack Block Kit i kierują kliknięcia lub wybory
z powrotem przez istniejącą ścieżkę zdarzeń interakcji Slack. Zachowaj je dla starych
promptów i awaryjnych ścieżek specyficznych dla Slack; dla nowych przenośnych
elementów sterujących używaj współdzielonej prezentacji.

Interfejsy API kompilatora dyrektyw są również przestarzałe dla nowego kodu producenta:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Dla nowych elementów sterujących renderowanych w Slack używaj ładunków
`presentation` oraz `buildSlackPresentationBlocks(...)`.

Uwagi:

- To jest starszy interfejs UI specyficzny dla Slack. Inne kanały nie tłumaczą dyrektyw Slack Block
  Kit na własne systemy przycisków.
- Wartości wywołań zwrotnych interakcji to nieprzezroczyste tokeny generowane przez OpenClaw, a nie surowe wartości tworzone przez agenta.
- Jeśli wygenerowane bloki interaktywne przekroczyłyby limity Slack Block Kit, OpenClaw wraca do oryginalnej odpowiedzi tekstowej zamiast wysyłać nieprawidłowy ładunek bloków.

### Przesyłanie modali należących do pluginu

Pluginy Slack, które rejestrują obsługę interakcji, mogą też otrzymywać zdarzenia cyklu życia modala
`view_submission` i `view_closed`, zanim OpenClaw skompaktuje
ładunek do widocznego dla agenta zdarzenia systemowego. Podczas otwierania modala Slack użyj jednego z tych wzorców routingu:

- Ustaw `callback_id` na `openclaw:<namespace>:<payload>`.
- Albo zachowaj istniejące `callback_id` i umieść `pluginInteractiveData:
"<namespace>:<payload>"` w `private_metadata` modala.

Handler otrzymuje `ctx.interaction.kind` jako `view_submission` lub
`view_closed`, znormalizowane `inputs` oraz pełny surowy obiekt `stateValues` ze
Slack. Routing oparty wyłącznie na identyfikatorze callback wystarcza, aby wywołać handler pluginu; dołącz
istniejące pola routingu użytkownika/sesji z `private_metadata` modala, gdy
modal ma również utworzyć widoczne dla agenta zdarzenie systemowe. Agent otrzymuje
zwarte, zredagowane zdarzenie systemowe `Slack interaction: ...`. Jeśli handler zwróci
`systemEvent.summary`, `systemEvent.reference` lub `systemEvent.data`, te
pola zostaną dołączone do tego zwartego zdarzenia, aby agent mógł odwołać się do
pamięci należącej do pluginu bez oglądania pełnego ładunku formularza.

## Natywne zatwierdzenia w Slack

Slack może działać jako natywny klient zatwierdzeń z interaktywnymi przyciskami i interakcjami, zamiast wracać do Web UI lub terminala.

- Zatwierdzenia exec i pluginu mogą renderować się jako natywne prompty Slack Block Kit.
- `channels.slack.execApprovals.*` pozostaje konfiguracją włączania natywnego klienta zatwierdzeń exec oraz routingu DM/kanału.
- DM zatwierdzeń exec używają `channels.slack.execApprovals.approvers` lub `commands.ownerAllowFrom`.
- Zatwierdzenia pluginu używają natywnych przycisków Slack, gdy Slack jest włączony jako natywny klient zatwierdzeń dla sesji źródłowej albo gdy `approvals.plugin` kieruje do źródłowej sesji Slack lub celu Slack.
- DM zatwierdzeń pluginu używają zatwierdzających pluginu Slack z `channels.slack.allowFrom`, `allowFrom` nazwanego konta lub domyślnej trasy konta.
- Autoryzacja zatwierdzającego nadal jest egzekwowana: zatwierdzający tylko exec nie mogą zatwierdzać żądań pluginu, chyba że są również zatwierdzającymi pluginu.

Używa to tej samej współdzielonej powierzchni przycisków zatwierdzania co inne kanały. Gdy `interactivity` jest włączone w ustawieniach aplikacji Slack, prompty zatwierdzeń renderują się jako przyciski Block Kit bezpośrednio w konwersacji.
Gdy te przyciski są obecne, stanowią podstawowy UX zatwierdzania; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia wskazuje, że zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalne; gdy to możliwe, wraca do `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i rozpoznano co najmniej jednego
zatwierdzającego exec. Slack może także obsługiwać natywne zatwierdzenia pluginu przez tę ścieżkę natywnego klienta,
gdy zatwierdzający pluginu Slack zostaną rozpoznani, a żądanie pasuje do filtrów natywnego klienta. Ustaw
`enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzeń. Ustaw `enabled: true`, aby
wymusić natywne zatwierdzenia po rozpoznaniu zatwierdzających. Wyłączenie zatwierdzeń exec Slack nie wyłącza
dostarczania natywnych zatwierdzeń pluginu Slack włączonego przez `approvals.plugin`; dostarczanie zatwierdzeń pluginu
używa zamiast tego zatwierdzających pluginu Slack.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzeń exec Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Jawna konfiguracja natywna Slack jest potrzebna tylko wtedy, gdy chcesz nadpisać zatwierdzających, dodać filtry albo
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

Współdzielone przekazywanie `approvals.exec` jest osobne. Używaj go tylko wtedy, gdy prompty zatwierdzeń exec muszą być również
kierowane do innych czatów lub jawnych celów poza pasmem. Współdzielone przekazywanie `approvals.plugin` także jest
osobne; natywne dostarczanie Slack tłumi ten fallback tylko wtedy, gdy Slack może obsłużyć żądanie zatwierdzenia pluginu
natywnie.

To samo czatowe `/approve` działa również w kanałach Slack i DM, które już obsługują polecenia. Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać pełny model przekazywania zatwierdzeń.

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości są mapowane na zdarzenia systemowe.
- Transmisje wątków (odpowiedzi w wątku z opcją „Wyślij również do kanału”) są przetwarzane jako zwykłe wiadomości użytkownika.
- Zdarzenia dodania/usunięcia reakcji są mapowane na zdarzenia systemowe.
- Zdarzenia dołączenia/opuszczenia przez członka, utworzenia/zmiany nazwy kanału oraz dodania/usunięcia przypięcia są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanału, gdy `configWrites` jest włączone.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą być wstrzykiwane do kontekstu routingu.
- Rozpoczynający wątek oraz początkowe zasiewanie kontekstu historii wątku są filtrowane przez skonfigurowane listy dozwolonych nadawców, gdy ma to zastosowanie.
- Akcje bloków, skróty i interakcje modali emitują strukturalne zdarzenia systemowe `Slack interaction: ...` z bogatymi polami ładunku:
  - akcje bloków: wybrane wartości, etykiety, wartości selektorów oraz metadane `workflow_*`
  - skróty globalne: metadane callback i aktora, kierowane do bezpośredniej sesji aktora
  - skróty wiadomości: callback, aktor, kanał, wątek oraz kontekst wybranej wiadomości
  - zdarzenia modalne `view_submission` i `view_closed` z kierowanymi metadanymi kanału oraz danymi wejściowymi formularza

Zdefiniuj skróty globalne lub wiadomości w konfiguracji aplikacji Slack i użyj dowolnego niepustego identyfikatora callback. OpenClaw potwierdza pasujące ładunki skrótów, stosuje tę samą politykę nadawców DM/kanału co inne interakcje Slack i kolejkuje oczyszczone zdarzenie dla kierowanej sesji agenta. Identyfikatory wyzwalaczy i adresy URL odpowiedzi są redagowane z kontekstu agenta.

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji - Slack](/pl/gateway/config-channels#slack).

<Accordion title="Najważniejsze pola Slack">

- tryb/uwierzytelnianie: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- dostęp DM: `dm.enabled`, `dmPolicy`, `allowFrom` (starsze: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- przełącznik zgodności: `dangerouslyAllowNameMatching` (awaryjny; pozostaw wyłączony, jeśli nie jest potrzebny)
- dostęp do kanału: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- wątki/historia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- rozwijanie linków: `unfurlLinks` (domyślnie: `false`), `unfurlMedia` do kontroli podglądu linków/mediów w `chat.postMessage`; ustaw `unfurlLinks: true`, aby ponownie włączyć podglądy linków
- operacje/funkcje: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak odpowiedzi w kanałach">
    Sprawdź kolejno:

    - `groupPolicy`
    - lista dozwolonych kanałów (`channels.slack.channels`) — **klucze muszą być identyfikatorami kanałów** (`C12345678`), a nie nazwami (`#channel-name`). Klucze oparte na nazwach po cichu zawodzą przy `groupPolicy: "allowlist"`, ponieważ routing kanału jest domyślnie oparty najpierw na identyfikatorze. Aby znaleźć identyfikator: kliknij kanał w Slack prawym przyciskiem myszy → **Copy link** — wartość `C...` na końcu adresu URL to identyfikator kanału.
    - `requireMention`
    - lista dozwolonych `users` dla kanału
    - `messages.groupChat.visibleReplies`: zwykłe żądania grupy/kanału domyślnie używają `"automatic"`. Jeśli wybrano `"message_tool"`, a logi pokazują tekst asystenta bez wywołania `message(action=send)`, model pominął widoczną ścieżkę narzędzia wiadomości. Tekst końcowy pozostaje prywatny w tym trybie; sprawdź szczegółowy log Gateway pod kątem stłumionych metadanych ładunku albo ustaw wartość na `"automatic"`, jeśli chcesz, aby każda normalna końcowa odpowiedź asystenta była publikowana przez starszą ścieżkę.
    - `messages.groupChat.unmentionedInbound`: jeśli ma wartość `"room_event"`, dozwolona rozmowa w kanale bez wzmianki jest kontekstem otoczenia i pozostaje cicha, chyba że agent wywoła narzędzie `message`. Zobacz [Zdarzenia otoczenia pokoju](/pl/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - `channels.slack.dmPolicy` (lub starsze `channels.slack.dm.policy`)
    - zatwierdzenia parowania / wpisy listy dozwolonych (`dmPolicy: "open"` nadal wymaga `channels.slack.allowFrom: ["*"]`)
    - grupowe DM używają obsługi MPIM; włącz `channels.slack.dm.groupEnabled` i, jeśli skonfigurowano, dołącz MPIM w `channels.slack.dm.groupChannels`
    - zdarzenia DM Slack Assistant: szczegółowe logi wspominające `drop message_changed`
      zwykle oznaczają, że Slack wysłał edytowane zdarzenie wątku Assistant bez
      możliwego do odzyskania ludzkiego nadawcy w metadanych wiadomości

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode nie łączy się">
    Zweryfikuj tokeny bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.
    App-Level Token wymaga `connections:write`, a token bota Bot User OAuth Token
    musi należeć do tej samej aplikacji/przestrzeni roboczej Slack co token aplikacji.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` lub
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło rozwiązać wartości
    opartej na SecretRef.

    Dzienniki takie jak `slack socket mode failed to start; retry ...` oznaczają możliwe do odzyskania
    błędy uruchomienia. Brakujące zakresy, unieważnione tokeny i nieprawidłowe uwierzytelnianie kończą się
    natychmiastowym niepowodzeniem. Dziennik `slack token mismatch ...` oznacza, że token bota i token aplikacji
    wydają się należeć do różnych aplikacji Slack; popraw dane uwierzytelniające aplikacji Slack.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Sprawdź:

    - sekret podpisywania
    - ścieżkę Webhook
    - adresy Slack Request URLs (Events + Interactivity + Slash Commands)
    - unikatowe `webhookPath` dla każdego konta HTTP
    - publiczny URL kończy TLS i przekazuje żądania do ścieżki Gateway
    - ścieżka `request_url` aplikacji Slack dokładnie odpowiada `channels.slack.webhookPath` (domyślnie `/slack/events`)

    Jeśli w migawkach kont pojawia się `signingSecretStatus: "configured_unavailable"`,
    konto HTTP jest skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło
    rozwiązać sekretu podpisywania opartego na SecretRef.

    Powtarzający się dziennik `slack: webhook path ... already registered` oznacza, że dwa konta HTTP
    używają tego samego `webhookPath`; nadaj każdemu kontu osobną ścieżkę.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Sprawdź, czy chodziło Ci o:

    - tryb poleceń natywnych (`channels.slack.commands.native: true`) z pasującymi poleceniami slash zarejestrowanymi w Slack
    - albo tryb pojedynczego polecenia slash (`channels.slack.slashCommand.enabled: true`)

    Slack nie tworzy ani nie usuwa poleceń slash automatycznie. `commands.native: "auto"` nie włącza natywnych poleceń Slack; użyj `true` i utwórz pasujące polecenia w aplikacji Slack. W trybie HTTP każde polecenie slash Slack musi zawierać URL Gateway. W trybie Socket Mode ładunki poleceń przychodzą przez websocket, a Slack ignoruje `slash_commands[].url`.

    Sprawdź także `commands.useAccessGroups`, autoryzację DM, listy dozwolonych kanałów
    oraz listy dozwolonych `users` dla poszczególnych kanałów. Slack zwraca błędy efemeryczne dla
    zablokowanych nadawców poleceń slash, w tym:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Dokumentacja obsługi obrazu w załącznikach

Slack może dołączyć pobrane multimedia do tury agenta, gdy pobieranie plików Slack powiedzie się i pozwalają na to limity rozmiaru. Pliki obrazów mogą przejść przez ścieżkę rozumienia multimediów albo bezpośrednio do modelu odpowiedzi obsługującego obraz; inne pliki są zachowywane jako kontekst pliku możliwy do pobrania, zamiast być traktowane jako wejście obrazu.

### Obsługiwane typy multimediów

| Typ multimediów               | Źródło              | Bieżące zachowanie                                                             | Uwagi                                                                     |
| ----------------------------- | ------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Obrazy JPEG / PNG / GIF / WebP | URL pliku Slack     | Pobierane i dołączane do tury w celu obsługi przez ścieżki obsługujące obraz   | Limit na plik: `channels.slack.mediaMaxMb` (domyślnie 20 MB)              |
| Pliki PDF                     | URL pliku Slack     | Pobierane i udostępniane jako kontekst pliku dla narzędzi takich jak `download-file` lub `pdf` | Dane przychodzące Slack nie konwertują automatycznie PDF-ów na wejście obrazu |
| Inne pliki                    | URL pliku Slack     | Pobierane, gdy to możliwe, i udostępniane jako kontekst pliku                  | Pliki binarne nie są traktowane jako wejście obrazu                       |
| Odpowiedzi w wątku            | Pliki wiadomości początkowej wątku | Pliki wiadomości głównej mogą zostać dołączone jako kontekst, gdy odpowiedź nie ma bezpośrednich multimediów | Wiadomości początkowe zawierające tylko pliki używają symbolu zastępczego załącznika |
| Wiadomości z wieloma obrazami | Wiele plików Slack  | Każdy plik jest oceniany niezależnie                                           | Przetwarzanie Slack jest ograniczone do ośmiu plików na wiadomość         |

### Potok danych przychodzących

Gdy przychodzi wiadomość Slack z załącznikami plików:

1. OpenClaw pobiera plik z prywatnego URL Slack przy użyciu tokena bota.
2. Po powodzeniu plik jest zapisywany w magazynie multimediów.
3. Pobrane ścieżki multimediów i typy zawartości są dodawane do kontekstu przychodzącego.
4. Ścieżki modelu/narzędzia obsługujące obrazy mogą używać załączników obrazów z tego kontekstu.
5. Pliki niebędące obrazami pozostają dostępne jako metadane pliku lub odniesienia do multimediów dla narzędzi, które potrafią je obsłużyć.

### Dziedziczenie załączników z początku wątku

Gdy wiadomość przychodzi w wątku (ma nadrzędny `thread_ts`):

- Jeśli sama odpowiedź nie ma bezpośrednich multimediów, a dołączona wiadomość główna ma pliki, Slack może dołączyć pliki główne jako kontekst początku wątku.
- Bezpośrednie załączniki odpowiedzi mają pierwszeństwo przed załącznikami wiadomości głównej.
- Wiadomość główna, która ma tylko pliki i nie ma tekstu, jest reprezentowana symbolem zastępczym załącznika, aby mechanizm awaryjny nadal mógł uwzględnić jej pliki.

### Obsługa wielu załączników

Gdy pojedyncza wiadomość Slack zawiera wiele załączników plików:

- Każdy załącznik jest przetwarzany niezależnie przez potok multimediów.
- Pobrane odniesienia do multimediów są agregowane w kontekście wiadomości.
- Kolejność przetwarzania odpowiada kolejności plików Slack w ładunku zdarzenia.
- Niepowodzenie pobrania jednego załącznika nie blokuje pozostałych.

### Limity rozmiaru, pobierania i modelu

- **Limit rozmiaru**: Domyślnie 20 MB na plik. Konfigurowalne przez `channels.slack.mediaMaxMb`.
- **Niepowodzenia pobierania**: Pliki, których Slack nie może udostępnić, wygasłe URL-e, niedostępne pliki, pliki przekraczające limit oraz odpowiedzi HTML uwierzytelniania/logowania Slack są pomijane, zamiast być zgłaszane jako nieobsługiwane formaty.
- **Model obsługujący obraz**: Analiza obrazu używa aktywnego modelu odpowiedzi, gdy obsługuje on obraz, albo modelu obrazu skonfigurowanego w `agents.defaults.imageModel`.

### Znane ograniczenia

| Scenariusz                            | Bieżące zachowanie                                                       | Obejście                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Wygasły URL pliku Slack               | Plik pominięty; nie pokazuje się błąd                                    | Prześlij plik ponownie w Slack                                             |
| Model obsługujący obraz nieskonfigurowany | Załączniki obrazów są przechowywane jako odniesienia do multimediów, ale nie są analizowane jako obrazy | Skonfiguruj `agents.defaults.imageModel` albo użyj modelu odpowiedzi obsługującego obraz |
| Bardzo duże obrazy (> 20 MB domyślnie) | Pomijane zgodnie z limitem rozmiaru                                      | Zwiększ `channels.slack.mediaMaxMb`, jeśli Slack pozwala                    |
| Przekazane/udostępnione załączniki     | Tekst i multimedia obrazu/pliku hostowane przez Slack są obsługiwane w miarę możliwości | Udostępnij ponownie bezpośrednio w wątku OpenClaw                           |
| Załączniki PDF                         | Przechowywane jako kontekst pliku/multimediów, nie są automatycznie kierowane przez analizę obrazu | Użyj `download-file` dla metadanych pliku albo narzędzia `pdf` do analizy PDF |

### Powiązana dokumentacja

- [Potok rozumienia multimediów](/pl/nodes/media-understanding)
- [Narzędzie PDF](/pl/tools/pdf)
- Epik: [#51349](https://github.com/openclaw/openclaw/issues/51349) — włączenie obsługi obrazu w załącznikach Slack
- Testy regresji: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Weryfikacja na żywo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Powiązane

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Slack z Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pl/channels/groups">
    Zachowanie kanałów i grupowych DM.
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
