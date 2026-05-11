---
read_when:
    - Konfigurowanie Slack lub debugowanie trybu gniazda/HTTP w Slack
summary: Konfiguracja Slack i zachowanie w czasie działania (Socket Mode + adresy URL żądań HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-11T20:21:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34e740fd5cb0ca936edce1843316cde17570d77778bdf4fc761cad77c51ee9cf
    source_path: channels/slack.md
    workflow: 16
---

Gotowe do produkcyjnego użycia w wiadomościach prywatnych i kanałach dzięki integracjom aplikacji Slack. Domyślnym trybem jest Socket Mode; obsługiwane są także HTTP Request URLs.

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

## Wybór Socket Mode albo HTTP Request URLs

Oba transporty są gotowe do użycia produkcyjnego i osiągają równoważność funkcji dla wiadomości, poleceń slash, App Home oraz interaktywności. Wybierz na podstawie kształtu wdrożenia, a nie funkcji.

| Kwestia                      | Socket Mode (domyślnie)                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Publiczny URL Gateway           | Niewymagany                                                                         | Wymagany (DNS, TLS, reverse proxy albo tunel)                                                                   |
| Sieć wychodząca             | Wychodzące WSS do `wss-primary.slack.com` musi być osiągalne                            | Brak wychodzącego WS; tylko przychodzące HTTPS                                                                             |
| Wymagane tokeny                | Token bota (`xoxb-...`) + App-Level Token (`xapp-...`) z `connections:write`       | Token bota (`xoxb-...`) + Signing Secret                                                                        |
| Laptop deweloperski / za firewallem | Działa bez dodatkowej konfiguracji                                                                          | Wymaga publicznego tunelu (ngrok, Cloudflare Tunnel, Tailscale Funnel) albo stagingowego Gateway                          |
| Skalowanie poziome           | Jedna sesja Socket Mode na aplikację na host; wiele Gateway wymaga osobnych aplikacji Slack | Bezstanowy handler POST; wiele replik Gateway może współdzielić jedną aplikację za load balancerem                     |
| Wiele kont na jednym Gateway | Obsługiwane; każde konto otwiera własne WS                                             | Obsługiwane; każde konto potrzebuje unikalnego `webhookPath` (domyślnie `/slack/events`), aby rejestracje się nie kolidowały |
| Transport poleceń slash      | Dostarczane przez połączenie WS; `slash_commands[].url` jest ignorowane                  | Slack wysyła POST do `slash_commands[].url`; pole jest wymagane, aby polecenie zostało wysłane                           |
| Podpisywanie żądań              | Nieużywane (uwierzytelnianiem jest App-Level Token)                                               | Slack podpisuje każde żądanie; OpenClaw weryfikuje je za pomocą `signingSecret`                                              |
| Odzyskiwanie po zerwaniu połączenia  | Slack SDK automatycznie ponownie nawiązuje połączenie; obowiązuje strojenie transportu pong-timeout Gateway       | Brak trwałego połączenia do zerwania; ponowienia są wykonywane dla każdego żądania przez Slack                                           |

<Note>
  **Wybierz Socket Mode** dla hostów z pojedynczym Gateway, laptopów deweloperskich i sieci on-prem, które mogą łączyć się wychodząco z `*.slack.com`, ale nie mogą przyjmować przychodzącego HTTPS.

**Wybierz HTTP Request URLs**, gdy uruchamiasz wiele replik Gateway za load balancerem, gdy wychodzące WSS jest blokowane, ale przychodzące HTTPS jest dozwolone, albo gdy już kończysz webhooki Slack na reverse proxy.
</Note>

## Szybka konfiguracja

<Tabs>
  <Tab title="Socket Mode (domyślnie)">
    <Steps>
      <Step title="Utwórz nową aplikację Slack">
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
          **Recommended** odpowiada pełnemu zestawowi funkcji dołączonego Plugin Slack: App Home, polecenia slash, pliki, reakcje, przypięcia, grupowe wiadomości prywatne oraz odczyt emoji/grup użytkowników. Wybierz **Minimal**, gdy zasady workspace ograniczają zakresy — obejmuje wiadomości prywatne, historię kanałów/grup, wzmianki i polecenia slash, ale pomija pliki, reakcje, przypięcia, grupowe wiadomości prywatne (`mpim:*`), `emoji:read` oraz `usergroups:read`. Zobacz [lista kontrolna manifestu i zakresów](#manifest-and-scope-checklist), aby poznać uzasadnienie każdego zakresu oraz opcje addytywne, takie jak dodatkowe polecenia slash.
        </Note>

        Po utworzeniu aplikacji przez Slack:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: dodaj `connections:write`, zapisz, skopiuj wartość `xapp-...`.
        - **Install App → Install to Workspace**: skopiuj `xoxb-...` Bot User OAuth Token.

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

        Fallback env (tylko konto domyślne):

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
        Otwórz [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → wybierz swój workspace → wklej jeden z poniższych manifestów → zastąp `https://gateway-host.example.com/slack/events` publicznym adresem URL Gateway → **Next** → **Create**.

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
          **Zalecane** odpowiada pełnemu zestawowi funkcji dołączonego Pluginu Slack; **Minimalne** pomija pliki, reakcje, przypięcia, grupowe DM (`mpim:*`), `emoji:read` i `usergroups:read` dla restrykcyjnych obszarów roboczych. Zobacz [listę kontrolną manifestu i zakresów](#manifest-and-scope-checklist), aby poznać uzasadnienie dla każdego zakresu.
        </Note>

        <Info>
          Trzy pola URL (`slash_commands[].url`, `event_subscriptions.request_url` oraz `interactivity.request_url` / `message_menu_options_url`) wskazują ten sam endpoint OpenClaw. Schemat manifestu Slack wymaga ich osobnego nazwania, ale OpenClaw trasuje według typu payloadu, więc wystarczy pojedynczy `webhookPath` (domyślnie `/slack/events`). Polecenia slash bez `slash_commands[].url` w trybie HTTP po cichu nie wykonają żadnej operacji.
        </Info>

        Po utworzeniu aplikacji przez Slack:

        - **Basic Information → App Credentials**: skopiuj **Signing Secret** do weryfikacji żądań.
        - **Install App → Install to Workspace**: skopiuj token `xoxb-...` Bot User OAuth Token.

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
        Używaj unikalnych ścieżek Webhook dla HTTP z wieloma kontami

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

OpenClaw domyślnie ustawia limit czasu odpowiedzi pong klienta Slack SDK na 15 sekund dla Socket Mode. Nadpisuj ustawienia transportu tylko wtedy, gdy potrzebujesz dostrojenia specyficznego dla obszaru roboczego lub hosta:

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

Używaj tego tylko w obszarach roboczych Socket Mode, które logują przekroczenia limitu czasu pong/websocket server-ping Slack albo działają na hostach ze znanym głodzeniem pętli zdarzeń. `clientPingTimeout` to czas oczekiwania na pong po wysłaniu przez SDK pingu klienta; `serverPingTimeout` to czas oczekiwania na pingi serwera Slack. Wiadomości i zdarzenia aplikacji pozostają stanem aplikacji, a nie sygnałami żywotności transportu.

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

W **trybie HTTP Request URLs** zastąp `settings` wariantem HTTP i dodaj `url` do każdego polecenia slash. Wymagany publiczny URL:

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

Udostępnij różne funkcje, które rozszerzają powyższe wartości domyślne.

Domyślny manifest włącza kartę **Home** Slack App Home i subskrybuje `app_home_opened`. Gdy członek obszaru roboczego otworzy kartę Home, OpenClaw publikuje bezpieczny domyślny widok Home za pomocą `views.publish`; nie zawiera on payloadu konwersacji ani prywatnej konfiguracji. Karta **Messages** pozostaje włączona dla DM Slack.

<AccordionGroup>
  <Accordion title="Opcjonalne natywne polecenia slash">

    Zamiast jednego skonfigurowanego polecenia można używać wielu [natywnych poleceń slash](#commands-and-slash-behavior), z pewnymi niuansami:

    - Używaj `/agentstatus` zamiast `/status`, ponieważ polecenie `/status` jest zarezerwowane.
    - Jednocześnie można udostępnić nie więcej niż 25 poleceń slash.

    Zastąp istniejącą sekcję `features.slash_commands` podzbiorem [dostępnych poleceń](/pl/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (domyślnie)">

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

- `botToken` + `appToken` są wymagane dla Socket Mode.
- Tryb HTTP wymaga `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` i `userToken` przyjmują jawny tekst
  ciągi znaków albo obiekty SecretRef.
- Tokeny z konfiguracji zastępują rezerwowe wartości env.
- Rezerwowe wartości env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` dotyczą tylko konta domyślnego.
- `userToken` (`xoxp-...`) jest dostępny wyłącznie w konfiguracji (bez rezerwowej wartości env) i domyślnie ma zachowanie tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki stanu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status`
  dla poszczególnych poświadczeń (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Stan to `available`, `configured_unavailable` albo `missing`.
- `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef
  lub inne niejawne źródło sekretu, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego
  nie mogła rozwiązać rzeczywistej wartości.
- W trybie HTTP uwzględniane jest `signingSecretStatus`; w Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
W przypadku akcji/odczytów katalogu token użytkownika może być preferowany, gdy jest skonfigurowany. W przypadku zapisów token bota pozostaje preferowany; zapisy z tokenem użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false` i token bota jest niedostępny.
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

Bieżące akcje wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` i `emoji-list`. `download-file` przyjmuje identyfikatory plików Slack widoczne w przychodzących placeholderach plików i zwraca podglądy obrazów dla obrazów albo metadane plików lokalnych dla innych typów plików.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasady DM">
    `channels.slack.dmPolicy` kontroluje dostęp DM. `channels.slack.allowFrom` jest kanoniczną listą dozwolonych DM.

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.slack.allowFrom` zawierało `"*"`)
    - `disabled`

    Flagi DM:

    - `dm.enabled` (domyślnie true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (starsze)
    - `dm.groupEnabled` (DM grupowe domyślnie false)
    - `dm.groupChannels` (opcjonalna lista dozwolonych MPIM)

    Priorytet wielu kont:

    - `channels.slack.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Starsze `channels.slack.dm.policy` i `channels.slack.dm.allowFrom` są nadal odczytywane dla zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Parowanie w DM używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Zasady kanału">
    `channels.slack.groupPolicy` kontroluje obsługę kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Lista dozwolonych kanałów znajduje się pod `channels.slack.channels` i **musi używać stabilnych identyfikatorów kanałów Slack** (na przykład `C12345678`) jako kluczy konfiguracji.

    Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.slack` całkowicie brakuje (konfiguracja tylko przez env), środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie w logu (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozwiązywanie nazw/ID:

    - wpisy listy dozwolonych kanałów i wpisy listy dozwolonych DM są rozwiązywane przy uruchamianiu, gdy pozwala na to dostęp tokena
    - nierozwiązane wpisy nazw kanałów są zachowywane zgodnie z konfiguracją, ale domyślnie ignorowane przy routingu
    - autoryzacja przychodząca i routing kanałów domyślnie zaczynają od ID; bezpośrednie dopasowanie nazwy użytkownika/sluga wymaga `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Klucze oparte na nazwach (`#channel-name` albo `channel-name`) **nie** pasują przy `groupPolicy: "allowlist"`. Wyszukiwanie kanału domyślnie zaczyna od ID, więc klucz oparty na nazwie nigdy nie zostanie poprawnie zroute'owany, a wszystkie wiadomości w tym kanale zostaną cicho zablokowane. Różni się to od `groupPolicy: "open"`, gdzie klucz kanału nie jest wymagany do routingu, a klucz oparty na nazwie wydaje się działać.

    Zawsze używaj identyfikatora kanału Slack jako klucza. Aby go znaleźć: kliknij kanał w Slack prawym przyciskiem myszy → **Kopiuj link** — ID (`C...`) pojawia się na końcu URL.

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
    Wiadomości kanałowe są domyślnie przepuszczane przez bramkę wzmianek.

    Źródła wzmianek:

    - jawna wzmianka o aplikacji (`<@botId>`)
    - wzmianka o grupie użytkowników Slack (`<!subteam^S...>`), gdy użytkownik bota jest członkiem tej grupy użytkowników; wymaga `usergroups:read`
    - wzorce wyrażeń regularnych wzmianek (`agents.list[].groupChat.mentionPatterns`, rezerwowo `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie odpowiedzi w wątku do bota (wyłączone, gdy `thread.requireExplicitMention` ma wartość `true`)

    Kontrole dla poszczególnych kanałów (`channels.slack.channels.<id>`; nazwy tylko przez rozwiązywanie przy uruchamianiu albo `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista dozwolonych)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` albo wildcard `"*"`
      (starsze klucze bez prefiksu nadal mapują tylko na `id:`)

    `allowBots` jest konserwatywne dla kanałów i kanałów prywatnych: wiadomości w pokoju autorstwa botów są akceptowane tylko wtedy, gdy wysyłający bot jest jawnie wymieniony na liście dozwolonych `users` tego pokoju albo gdy co najmniej jeden jawny identyfikator właściciela Slack z `channels.slack.allowFrom` jest obecnie członkiem pokoju. Wildcardy i wpisy właścicieli oparte na nazwach wyświetlanych nie spełniają warunku obecności właściciela. Obecność właściciela używa Slack `conversations.members`; upewnij się, że aplikacja ma pasujący zakres odczytu dla typu pokoju (`channels:read` dla kanałów publicznych, `groups:read` dla kanałów prywatnych). Jeśli wyszukiwanie członków się nie powiedzie, OpenClaw odrzuca wiadomość w pokoju autorstwa bota.

  </Tab>
</Tabs>

## Wątki, sesje i tagi odpowiedzi

- DM są routowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Wiązania tras Slack przyjmują surowe identyfikatory peerów oraz formy celów Slack, takie jak `channel:C12345678`, `user:U12345678` i `<@U12345678>`.
- Przy domyślnym `session.dmScope=main` DM Slack są zwijane do głównej sesji agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Odpowiedzi w wątkach mogą tworzyć sufiksy sesji wątku (`:thread:<threadTs>`), gdy ma to zastosowanie.
- W kanałach, w których OpenClaw obsługuje wiadomości najwyższego poziomu bez wymagania jawnej wzmianki, `replyToMode` inne niż `off` routuje każdy obsłużony korzeń do `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, dzięki czemu widoczny wątek Slack mapuje się na jedną sesję OpenClaw od pierwszej tury.
- Domyślna wartość `channels.slack.thread.historyScope` to `thread`; domyślna wartość `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` kontroluje, ile istniejących wiadomości wątku jest pobieranych po rozpoczęciu nowej sesji wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).
- `channels.slack.thread.requireExplicitMention` (domyślnie `false`): gdy `true`, tłumi niejawne wzmianki w wątku, aby bot odpowiadał tylko na jawne wzmianki `@bot` w wątkach, nawet jeśli bot już uczestniczył w wątku. Bez tego odpowiedzi w wątku, w którym uczestniczył bot, omijają bramkę `requireMention`.

Kontrole wątkowania odpowiedzi:

- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: dla poszczególnych `direct|group|channel`
- starsza wartość rezerwowa dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Obsługiwane są ręczne tagi odpowiedzi:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Dla jawnych odpowiedzi w wątku Slack z narzędzia `message` ustaw `replyBroadcast: true` z `action: "send"` oraz `threadId` albo `replyTo`, aby poprosić Slack o dodatkowe nadanie odpowiedzi w wątku do kanału nadrzędnego. Mapuje się to na flagę `reply_broadcast` Slack `chat.postMessage` i jest obsługiwane tylko dla wysyłek tekstu albo Block Kit, a nie dla przesyłania mediów.

Gdy wywołanie narzędzia `message` działa wewnątrz wątku Slack i celuje w ten sam kanał, OpenClaw zwykle dziedziczy bieżący wątek Slack zgodnie z `replyToMode`. Ustaw `topLevel: true` przy `action: "send"` albo `action: "upload-file"`, aby wymusić nową wiadomość w kanale nadrzędnym. `threadId: null` jest akceptowane jako ten sam wybór najwyższego poziomu.

<Note>
`replyToMode="off"` wyłącza **całe** wątkowanie odpowiedzi w Slack, w tym jawne tagi `[[reply_to_*]]`. Różni się to od Telegram, gdzie jawne tagi są nadal respektowane w trybie `"off"`. Wątki Slack ukrywają wiadomości w kanale, natomiast odpowiedzi Telegram pozostają widoczne w treści.
</Note>

## Reakcje potwierdzenia

`ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

Kolejność rozwiązywania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- rezerwowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"eyes"`).
- Użyj `""`, aby wyłączyć reakcję dla konta Slack albo globalnie.

## Strumieniowanie tekstu

`channels.slack.streaming` kontroluje zachowanie podglądu na żywo:

- `off`: wyłącz strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastępuj tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołączaj porcjowane aktualizacje podglądu.
- `progress`: pokazuj tekst stanu postępu podczas generowania, a następnie wyślij tekst końcowy.
- `streaming.preview.toolProgress`: gdy podgląd wersji roboczej jest aktywny, kieruj aktualizacje narzędzi/postępu do tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować oddzielne wiadomości narzędzi/postępu.
- `streaming.preview.commandText` / `streaming.progress.commandText`: ustaw na `status`, aby zachować zwięzłe wiersze postępu narzędzi, ukrywając surowy tekst polecenia/wykonania (domyślnie: `raw`).

Ukryj surowy tekst polecenia/wykonania, zachowując zwięzłe wiersze postępu:

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

- Wątek odpowiedzi musi być dostępny, aby pojawiło się natywne strumieniowanie tekstu i status wątku asystenta Slack. Wybór wątku nadal odbywa się zgodnie z `replyToMode`.
- Korzenie kanałów, czatów grupowych i DM najwyższego poziomu mogą nadal używać normalnego podglądu szkicu, gdy natywne strumieniowanie jest niedostępne albo nie istnieje żaden wątek odpowiedzi.
- DM Slack najwyższego poziomu domyślnie pozostają poza wątkiem, więc nie pokazują natywnego podglądu strumienia/statusu w stylu wątku Slack; zamiast tego OpenClaw publikuje i edytuje podgląd szkicu w DM.
- Media i ładunki nietekstowe wracają do normalnego dostarczania.
- Finalne komunikaty mediów/błędów anulują oczekujące edycje podglądu; kwalifikujące się finalne komunikaty tekstowe/blokowe są opróżniane tylko wtedy, gdy mogą edytować podgląd w miejscu.
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

- `channels.slack.streamMode` (`replace | status_final | append`) jest starszym aliasem środowiska uruchomieniowego dla `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` jest starszym aliasem środowiska uruchomieniowego dla `channels.slack.streaming.mode` i `channels.slack.streaming.nativeTransport`.
- starszy `channels.slack.nativeStreaming` jest aliasem środowiska uruchomieniowego dla `channels.slack.streaming.nativeTransport`.
- Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację strumieniowania Slack na kanoniczne klucze.

## Awaryjna reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu uruchomienia. Jest to najbardziej przydatne poza odpowiedziami w wątku, które używają domyślnego wskaźnika statusu „pisze...”.

Kolejność rozwiązywania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje shortcodes, na przykład `"hourglass_flowing_sand"`.
- Reakcja działa w trybie best-effort, a czyszczenie jest podejmowane automatycznie po zakończeniu ścieżki odpowiedzi lub niepowodzenia.

## Media, dzielenie na fragmenty i dostarczanie

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Załączniki plików Slack są pobierane z prywatnych adresów URL hostowanych przez Slack (przepływ żądań uwierzytelnianych tokenem) i zapisywane w magazynie mediów, gdy pobieranie się powiedzie i pozwalają na to limity rozmiaru. Placeholdery plików zawierają Slack `fileId`, aby agenci mogli pobrać oryginalny plik za pomocą `download-file`.

    Pobieranie używa ograniczonych limitów czasu bezczynności i całkowitego czasu. Jeśli pobieranie pliku Slack zatrzyma się lub nie powiedzie, OpenClaw nadal przetwarza wiadomość i wraca do placeholdera pliku.

    Limit rozmiaru przychodzącego w środowisku uruchomieniowym domyślnie wynosi `20MB`, chyba że zostanie nadpisany przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - fragmenty tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie najpierw według akapitów
    - wysyłanie plików używa API przesyłania Slack i może obejmować odpowiedzi w wątku (`thread_ts`)
    - limit mediów wychodzących podąża za `channels.slack.mediaMaxMb`, gdy jest skonfigurowany; w przeciwnym razie wysyłki kanału używają domyślnych wartości rodzaju MIME z potoku mediów

  </Accordion>

  <Accordion title="Delivery targets">
    Preferowane jawne cele:

    - `user:<id>` dla DM
    - `channel:<id>` dla kanałów

    DM Slack zawierające tylko tekst/bloki mogą publikować bezpośrednio do identyfikatorów użytkowników; przesyłanie plików i wysyłki w wątkach najpierw otwierają DM przez API konwersacji Slack, ponieważ te ścieżki wymagają konkretnego identyfikatora konwersacji.

  </Accordion>
</AccordionGroup>

## Polecenia i zachowanie slash

Polecenia slash pojawiają się w Slack jako jedno skonfigurowane polecenie albo wiele natywnych poleceń. Skonfiguruj `channels.slack.slashCommand`, aby zmienić domyślne ustawienia poleceń:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Natywne polecenia wymagają [dodatkowych ustawień manifestu](#additional-manifest-settings) w aplikacji Slack i zamiast tego są włączane przez `channels.slack.commands.native: true` albo `commands.native: true` w konfiguracjach globalnych.

- Tryb automatyczny natywnych poleceń jest **wyłączony** dla Slack, więc `commands.native: "auto"` nie włącza natywnych poleceń Slack.

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

Sesje slash używają izolowanych kluczy, takich jak `agent:<agentId>:slack:slash:<userId>`, i nadal kierują wykonania poleceń do sesji konwersacji docelowej przy użyciu `CommandTargetSessionKey`.

## Interaktywne odpowiedzi

Slack może renderować kontrolki interaktywnych odpowiedzi tworzone przez agenta, ale ta funkcja jest domyślnie wyłączona.

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

Te dyrektywy kompilują się do Slack Block Kit i kierują kliknięcia albo wybory z powrotem przez istniejącą ścieżkę zdarzeń interakcji Slack.

Uwagi:

- To jest interfejs użytkownika specyficzny dla Slack. Inne kanały nie tłumaczą dyrektyw Slack Block Kit na własne systemy przycisków.
- Wartości wywołań zwrotnych interakcji są nieprzezroczystymi tokenami generowanymi przez OpenClaw, a nie surowymi wartościami tworzonymi przez agenta.
- Jeśli wygenerowane interaktywne bloki przekroczyłyby limity Slack Block Kit, OpenClaw wraca do oryginalnej odpowiedzi tekstowej zamiast wysyłać nieprawidłowy ładunek bloków.

## Zatwierdzenia exec w Slack

Slack może działać jako natywny klient zatwierdzeń z interaktywnymi przyciskami i interakcjami, zamiast wracać do Web UI albo terminala.

- Zatwierdzenia exec używają `channels.slack.execApprovals.*` do natywnego routingu DM/kanału.
- Zatwierdzenia Plugin mogą nadal być rozwiązywane przez tę samą natywną powierzchnię przycisków Slack, gdy żądanie już trafia do Slack, a rodzaj identyfikatora zatwierdzenia to `plugin:`.
- Autoryzacja zatwierdzającego nadal jest egzekwowana: tylko użytkownicy zidentyfikowani jako zatwierdzający mogą zatwierdzać lub odrzucać żądania przez Slack.

Używa to tej samej współdzielonej powierzchni przycisków zatwierdzeń co inne kanały. Gdy `interactivity` jest włączone w ustawieniach aplikacji Slack, monity zatwierdzeń renderują się jako przyciski Block Kit bezpośrednio w konwersacji.
Gdy te przyciski są obecne, stanowią podstawowy UX zatwierdzania; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia
czatu są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalne; wraca do `commands.ownerAllowFrom`, gdy to możliwe)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` jest nieustawione albo ma wartość `"auto"` i co najmniej jeden
zatwierdzający zostanie rozwiązany. Ustaw `enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzeń.
Ustaw `enabled: true`, aby wymusić natywne zatwierdzenia, gdy zatwierdzający zostaną rozwiązani.

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

Współdzielone przekazywanie `approvals.exec` jest osobne. Używaj go tylko wtedy, gdy monity zatwierdzeń exec muszą także
kierować do innych czatów albo jawnych celów poza pasmem. Współdzielone przekazywanie `approvals.plugin` również jest
osobne; natywne przyciski Slack mogą nadal rozwiązywać zatwierdzenia Plugin, gdy te żądania już trafiają
do Slack.

`/approve` w tym samym czacie działa również w kanałach Slack i DM, które już obsługują polecenia. Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać pełny model przekazywania zatwierdzeń.

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości są mapowane na zdarzenia systemowe.
- Emisje wątków („Wyślij także do kanału” dla odpowiedzi w wątku) są przetwarzane jako normalne wiadomości użytkownika.
- Zdarzenia dodania/usunięcia reakcji są mapowane na zdarzenia systemowe.
- Dołączenie/opuszczenie przez członka, utworzenie/zmiana nazwy kanału oraz zdarzenia dodania/usunięcia przypięcia są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanału, gdy `configWrites` jest włączone.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą zostać wstrzyknięte do kontekstu routingu.
- Kontekst startującego wątku i początkowej historii wątku jest filtrowany według skonfigurowanych list dozwolonych nadawców, gdy ma to zastosowanie.
- Akcje bloków i interakcje modalne emitują ustrukturyzowane zdarzenia systemowe `Slack interaction: ...` z bogatymi polami ładunku:
  - akcje bloków: wybrane wartości, etykiety, wartości pickerów oraz metadane `workflow_*`
  - zdarzenia modalne `view_submission` i `view_closed` z routowanymi metadanymi kanału i danymi wejściowymi formularza

## Odniesienie konfiguracji

Główne odniesienie: [Odniesienie konfiguracji - Slack](/pl/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- tryb/uwierzytelnianie: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- dostęp do DM: `dm.enabled`, `dmPolicy`, `allowFrom` (starsze: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- przełącznik zgodności: `dangerouslyAllowNameMatching` (tryb awaryjny; pozostaw wyłączony, chyba że jest potrzebny)
- dostęp do kanału: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- wątki/historia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- podglądy linków: `unfurlLinks`, `unfurlMedia` do kontroli podglądu linków/mediów `chat.postMessage`
- operacje/funkcje: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="No replies in channels">
    Sprawdź po kolei:

    - `groupPolicy`
    - lista dozwolonych kanałów (`channels.slack.channels`) — **klucze muszą być identyfikatorami kanałów** (`C12345678`), a nie nazwami (`#channel-name`). Klucze oparte na nazwach po cichu zawodzą przy `groupPolicy: "allowlist"`, ponieważ routing kanału domyślnie najpierw używa identyfikatora. Aby znaleźć identyfikator: kliknij kanał prawym przyciskiem w Slack → **Copy link** — wartość `C...` na końcu adresu URL to identyfikator kanału.
    - `requireMention`
    - lista dozwolonych `users` dla kanału

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
    - `channels.slack.dmPolicy` (albo starsze `channels.slack.dm.policy`)
    - zatwierdzenia parowania / wpisy na liście dozwolonych
    - zdarzenia DM Slack Assistant: szczegółowe logi wspominające `drop message_changed`
      zwykle oznaczają, że Slack wysłał edytowane zdarzenie wątku Assistant bez
      możliwego do odzyskania nadawcy-człowieka w metadanych wiadomości

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Zweryfikuj tokeny bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` albo
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło rozwiązać wartości
    opartej na SecretRef.

  </Accordion>

  <Accordion title="Tryb HTTP nie odbiera zdarzeń">
    Sprawdź:

    - sekret podpisywania
    - ścieżkę webhooka
    - adresy URL żądań Slack (Events + Interactivity + Slash Commands)
    - unikatowy `webhookPath` dla każdego konta HTTP

    Jeśli `signingSecretStatus: "configured_unavailable"` pojawia się w migawkach
    konta, konto HTTP jest skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło
    rozwiązać sekretu podpisywania opartego na SecretRef.

  </Accordion>

  <Accordion title="Polecenia natywne/slash się nie uruchamiają">
    Sprawdź, czy zamierzono użyć:

    - trybu poleceń natywnych (`channels.slack.commands.native: true`) z pasującymi poleceniami slash zarejestrowanymi w Slack
    - albo trybu pojedynczego polecenia slash (`channels.slack.slashCommand.enabled: true`)

    Sprawdź też `commands.useAccessGroups` oraz listy dozwolonych kanałów/użytkowników.

  </Accordion>
</AccordionGroup>

## Odniesienie do wizji dla załączników

Slack może dołączyć pobrane multimedia do tury agenta, gdy pobieranie plików Slack się powiedzie i pozwalają na to limity rozmiaru. Pliki obrazów mogą zostać przekazane przez ścieżkę rozumienia multimediów albo bezpośrednio do modelu odpowiedzi obsługującego wizję; inne pliki są zachowywane jako kontekst plików do pobrania, a nie traktowane jako dane wejściowe obrazu.

### Obsługiwane typy multimediów

| Typ multimediów                | Źródło              | Bieżące zachowanie                                                              | Uwagi                                                                            |
| ------------------------------ | ------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Obrazy JPEG / PNG / GIF / WebP | Adres URL pliku Slack | Pobrane i dołączone do tury w celu obsługi z użyciem modelu obsługującego wizję | Limit na plik: `channels.slack.mediaMaxMb` (domyślnie 20 MB)                    |
| Pliki PDF                      | Adres URL pliku Slack | Pobrane i udostępnione jako kontekst pliku dla narzędzi takich jak `download-file` lub `pdf` | Wejście Slack nie konwertuje automatycznie PDF-ów na dane wejściowe wizji obrazu |
| Inne pliki                     | Adres URL pliku Slack | Pobierane, gdy to możliwe, i udostępniane jako kontekst pliku                   | Pliki binarne nie są traktowane jako dane wejściowe obrazu                       |
| Odpowiedzi w wątku             | Pliki wiadomości rozpoczynającej wątek | Pliki wiadomości głównej mogą zostać uzupełnione jako kontekst, gdy odpowiedź nie ma bezpośrednich multimediów | Wiadomości rozpoczynające zawierające tylko pliki używają placeholdera załącznika |
| Wiadomości z wieloma obrazami  | Wiele plików Slack  | Każdy plik jest oceniany niezależnie                                            | Przetwarzanie Slack jest ograniczone do ośmiu plików na wiadomość               |

### Potok wejściowy

Gdy przychodzi wiadomość Slack z załącznikami plików:

1. OpenClaw pobiera plik z prywatnego adresu URL Slack przy użyciu tokenu bota (`xoxb-...`).
2. Po powodzeniu plik jest zapisywany w magazynie multimediów.
3. Pobrane ścieżki multimediów i typy treści są dodawane do kontekstu wejściowego.
4. Ścieżki modeli/narzędzi obsługujące obrazy mogą używać załączników obrazów z tego kontekstu.
5. Pliki niebędące obrazami pozostają dostępne jako metadane plików lub odwołania do multimediów dla narzędzi, które potrafią je obsłużyć.

### Dziedziczenie załączników z korzenia wątku

Gdy wiadomość przychodzi w wątku (ma nadrzędny `thread_ts`):

- Jeśli sama odpowiedź nie ma bezpośrednich multimediów, a dołączona wiadomość główna ma pliki, Slack może uzupełnić pliki główne jako kontekst rozpoczęcia wątku.
- Bezpośrednie załączniki odpowiedzi mają pierwszeństwo przed załącznikami wiadomości głównej.
- Wiadomość główna, która ma tylko pliki i nie ma tekstu, jest reprezentowana przez placeholder załącznika, aby mechanizm awaryjny nadal mógł uwzględnić jej pliki.

### Obsługa wielu załączników

Gdy pojedyncza wiadomość Slack zawiera wiele załączników plików:

- Każdy załącznik jest przetwarzany niezależnie przez potok multimediów.
- Odwołania do pobranych multimediów są agregowane w kontekście wiadomości.
- Kolejność przetwarzania odpowiada kolejności plików Slack w ładunku zdarzenia.
- Niepowodzenie pobierania jednego załącznika nie blokuje pozostałych.

### Limity rozmiaru, pobierania i modelu

- **Limit rozmiaru**: Domyślnie 20 MB na plik. Konfigurowalne przez `channels.slack.mediaMaxMb`.
- **Niepowodzenia pobierania**: Pliki, których Slack nie może udostępnić, wygasłe adresy URL, niedostępne pliki, zbyt duże pliki oraz odpowiedzi HTML uwierzytelniania/logowania Slack są pomijane zamiast zgłaszania ich jako nieobsługiwane formaty.
- **Model wizji**: Analiza obrazów używa aktywnego modelu odpowiedzi, gdy obsługuje on wizję, albo modelu obrazu skonfigurowanego w `agents.defaults.imageModel`.

### Znane ograniczenia

| Scenariusz                            | Bieżące zachowanie                                                          | Obejście                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Wygasły adres URL pliku Slack         | Plik pominięty; brak wyświetlonego błędu                                    | Prześlij plik ponownie w Slack                                                |
| Model wizji nieskonfigurowany         | Załączniki obrazów są przechowywane jako odwołania do multimediów, ale nie są analizowane jako obrazy | Skonfiguruj `agents.defaults.imageModel` albo użyj modelu odpowiedzi obsługującego wizję |
| Bardzo duże obrazy (> 20 MB domyślnie) | Pomijane zgodnie z limitem rozmiaru                                         | Zwiększ `channels.slack.mediaMaxMb`, jeśli Slack na to pozwala                |
| Przekazane/udostępnione załączniki    | Tekst oraz multimedia obrazów/plików hostowane przez Slack są obsługiwane w miarę możliwości | Udostępnij ponownie bezpośrednio w wątku OpenClaw                             |
| Załączniki PDF                        | Przechowywane jako kontekst pliku/multimediów, nie są automatycznie kierowane przez wizję obrazu | Użyj `download-file` dla metadanych pliku albo narzędzia `pdf` do analizy PDF |

### Powiązana dokumentacja

- [Potok rozumienia multimediów](/pl/nodes/media-understanding)
- [Narzędzie PDF](/pl/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — włączenie wizji dla załączników Slack
- Testy regresji: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Weryfikacja na żywo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Slack z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Zachowanie kanałów i grupowych wiadomości bezpośrednich.
  </Card>
  <Card title="Routing kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i wzmacnianie zabezpieczeń.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Układ konfiguracji i pierwszeństwo.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
    Katalog poleceń i zachowanie.
  </Card>
</CardGroup>
