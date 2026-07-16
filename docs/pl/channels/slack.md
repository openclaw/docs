---
read_when:
    - Konfigurowanie Slacka lub debugowanie trybu gniazda, HTTP albo przekaźnika w Slacku
summary: Konfiguracja Slacka i zachowanie środowiska uruchomieniowego (Socket Mode, adresy URL żądań HTTP i tryb przekazywania)
title: Slack
x-i18n:
    generated_at: "2026-07-16T18:02:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Obsługa Slack obejmuje wiadomości prywatne i kanały za pośrednictwem integracji aplikacji Slack. Domyślnym transportem jest Socket Mode; obsługiwane są również adresy URL żądań HTTP. Tryb przekaźnikowy jest przeznaczony dla zarządzanych wdrożeń, w których zaufany router obsługuje ruch przychodzący ze Slack.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Wiadomości prywatne Slack domyślnie korzystają z trybu parowania.
  </Card>
  <Card title="Polecenia z ukośnikiem" icon="terminal" href="/pl/tools/slash-commands">
    Natywne działanie poleceń i katalog poleceń.
  </Card>
  <Card title="Rozwiązywanie problemów z kanałami" icon="wrench" href="/pl/channels/troubleshooting">
    Diagnostyka międzykanałowa i procedury naprawcze.
  </Card>
</CardGroup>

## Wybór transportu

Socket Mode i adresy URL żądań HTTP zapewniają taki sam zakres funkcji w przypadku obsługi wiadomości, poleceń z ukośnikiem, App Home i interakcji. Wybór powinien zależeć od architektury wdrożenia, a nie od funkcji.

| Kwestia                      | Socket Mode (domyślnie)                                                                                                                                | Adresy URL żądań HTTP                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Publiczny adres URL Gateway           | Niewymagany                                                                                                                                         | Wymagany (DNS, TLS, odwrotny serwer proxy lub tunel)                                                                   |
| Sieć wychodząca             | Musi być dostępne wychodzące połączenie WSS z `wss-primary.slack.com`                                                                                            | Brak wychodzącego WS; tylko przychodzący HTTPS                                                                             |
| Wymagane tokeny                | Token bota + token poziomu aplikacji z `connections:write`                                                                                                 | Token bota + sekret podpisywania                                                                                     |
| Laptop deweloperski / za zaporą sieciową | Działa bez dodatkowej konfiguracji                                                                                                                                          | Wymaga publicznego tunelu (ngrok, Cloudflare Tunnel, Tailscale Funnel) lub testowego Gateway                          |
| Skalowanie poziome           | Jedna sesja Socket Mode na aplikację i hosta; wiele instancji Gateway wymaga oddzielnych aplikacji Slack                                                                 | Bezstanowa obsługa POST; wiele replik Gateway może współdzielić jedną aplikację za modułem równoważenia obciążenia                     |
| Wiele kont w jednym Gateway | Obsługiwane; każde konto otwiera własne WS                                                                                                             | Obsługiwane; każde konto wymaga unikatowej wartości `webhookPath` (domyślnie `/slack/events`), aby rejestracje ze sobą nie kolidowały |
| Transport poleceń z ukośnikiem      | Dostarczane przez połączenie WS; `slash_commands[].url` jest ignorowane                                                                                  | Slack wysyła żądania POST do `slash_commands[].url`; pole jest wymagane do przekazania polecenia                           |
| Podpisywanie żądań              | Nieużywane (uwierzytelnianie odbywa się za pomocą tokenu poziomu aplikacji)                                                                                                               | Slack podpisuje każde żądanie; OpenClaw weryfikuje je za pomocą `signingSecret`                                              |
| Odzyskiwanie po zerwaniu połączenia  | Automatyczne ponowne łączenie zestawu SDK Slack jest włączone; OpenClaw również ponownie uruchamia nieudane sesje Socket Mode z ograniczonym wykładniczym opóźnieniem. Obowiązuje dostrajanie transportu związane z limitem czasu pong. | Brak trwałego połączenia, które można zerwać; ponowienia są wykonywane przez Slack dla poszczególnych żądań                                           |

<Note>
  **Socket Mode należy wybrać** w przypadku hostów z pojedynczym Gateway, laptopów deweloperskich i sieci lokalnych, które mogą nawiązywać połączenia wychodzące z `*.slack.com`, ale nie mogą przyjmować przychodzących połączeń HTTPS.

**Adresy URL żądań HTTP należy wybrać** w przypadku uruchamiania wielu replik Gateway za modułem równoważenia obciążenia, gdy wychodzące WSS jest zablokowane, ale przychodzące HTTPS jest dozwolone, lub gdy webhooki Slack są już terminowane na odwrotnym serwerze proxy.
</Note>

<Warning>
  Slack może utrzymywać wiele połączeń Socket Mode dla jednej aplikacji i dostarczać każde obciążenie do dowolnego połączenia. Oddzielne instancje OpenClaw Gateway współdzielące aplikację Slack wymagają zatem równoważnej konfiguracji routingu i autoryzacji. W przeciwnym razie należy użyć oddzielnej aplikacji Slack dla każdego Gateway, pojedynczego przekaźnika ruchu przychodzącego lub adresów URL żądań HTTP za modułem równoważenia obciążenia. Zobacz [Korzystanie z Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Tryb przekaźnikowy

Tryb przekaźnikowy oddziela ruch przychodzący ze Slack od OpenClaw Gateway. Zaufany router obsługuje pojedyncze połączenie Slack Socket Mode, wybiera docelowy Gateway i przekazuje typowane zdarzenie przez uwierzytelnione połączenie websocket. Gateway nadal używa własnego tokenu bota do wychodzących wywołań Slack Web API.

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

Adres URL przekaźnika musi używać `wss://`, chyba że wskazuje localhost. Token okaziciela i tabelę tras routera należy traktować jako część granicy autoryzacji Slack: kierowane zdarzenia trafiają do standardowej obsługi wiadomości Slack jako autoryzowane aktywacje. Dostarczona przez router wartość `slack_identity` w ramce websocket `hello` może ustawić domyślną wychodzącą nazwę użytkownika i ikonę; jawna tożsamość podana przez wywołującego nadal ma pierwszeństwo. Połączenie z przekaźnikiem jest ponownie nawiązywane z takim samym ograniczonym wykładniczym opóźnieniem jak Socket Mode i usuwa tożsamość dostarczoną przez router przy każdym rozłączeniu.

### Instalacje obejmujące całą organizację Enterprise Grid

Jedno konto Slack może odbierać wiadomości ze wszystkich obszarów roboczych objętych
instalacją obejmującą całą organizację Enterprise Grid. Należy wybrać bezpośredni Socket Mode lub adresy URL
żądań HTTP; tryb przekaźnikowy nie jest obsługiwany w przypadku kont korporacyjnych. Oba
poniższe manifesty o najmniejszych uprawnieniach włączają wyłącznie ścieżkę zdarzeń V1 `message` i `app_mention`,
natychmiastowe odpowiedzi oraz reakcje stanu obsługiwane przez odbiornik.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Administrator organizacji Enterprise Grid lub właściciel organizacji musi zatwierdzić aplikację, zainstalować ją na
poziomie organizacji i wybrać obszary robocze objęte instalacją.
Przed uruchomieniem OpenClaw należy potwierdzić, że aplikacja jest dostępna we wszystkich zamierzonych obszarach roboczych.
Następnie należy wygenerować token poziomu aplikacji z `connections:write` dla Socket Mode
i skopiować token bota z instalacji organizacyjnej. Należy skonfigurować konto
korzystające z tokenu bota zainstalowanego w organizacji:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### Adresy URL żądań HTTP

Trybu HTTP należy użyć, gdy Gateway ma publiczny punkt końcowy HTTPS i nie otwiera
połączenia Socket Mode. Przykładowy adres URL należy zastąpić publicznym adresem URL
`webhookPath` Gateway (domyślnie `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Administrator organizacji Enterprise Grid lub właściciel organizacji musi zatwierdzić aplikację, zainstalować ją na
poziomie organizacji i wybrać obszary robocze objęte instalacją.
Po zweryfikowaniu przez Slack adresu Request URL należy skopiować token bota instalacji organizacyjnej oraz
wartość **Basic Information -> App Credentials -> Signing Secret** aplikacji. Należy skonfigurować
konto korporacyjne z tą samą ścieżką Request URL:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

Podczas uruchamiania OpenClaw weryfikuje `enterpriseOrgInstall` za pomocą Slack `auth.test`.
Token zainstalowany w organizacji bez tej flagi lub token obszaru roboczego z tą flagą
powoduje niepowodzenie uruchomienia. Slack pozostaje źródłem prawdy określającym, które obszary robocze
udzieliły dostępu instalacji; OpenClaw następnie stosuje skonfigurowane zasady dotyczące kanałów, użytkowników,
wiadomości prywatnych i wzmianek do każdego dostarczonego zdarzenia. Enterprise V1 odrzuca wszystkie utworzone
przez boty zdarzenia `message` i `app_mention` przed przekazaniem, niezależnie od
`allowBots`, ponieważ instalacje organizacyjne nie zapewniają stabilnej tożsamości
bota kwalifikowanej przez obszar roboczy, potrzebnej do zapobiegania pętlom.

Obsługa Enterprise jest celowo ograniczona do bezpośrednich zdarzeń Socket Mode lub HTTP
`message` i `app_mention` oraz ich natychmiastowych odpowiedzi. Tryb przekaźnikowy,
polecenia z ukośnikiem, interakcje, App Home, odbiorniki zdarzeń reakcji, przypięcia, narzędzia
akcji Slack, natywne zatwierdzenia Slack, powiązania, dostarczanie kolejkowane lub zaplanowane
oraz wysyłanie proaktywne są niedostępne dla konta korporacyjnego. Wychodzące reakcje
potwierdzenia, pisania i stanu są obsługiwane przez klienta Slack należącego do
odbiornika i wymagają `reactions:write`; przychodzące powiadomienia o reakcjach
i narzędzia akcji reakcji pozostają niedostępne.

Natychmiastowe odpowiedzi korzystają ze standardowego mechanizmu dostarczania Slack dla fragmentów,
multimediów, metadanych, zastępczej tożsamości, podglądów linków i potwierdzeń, ale tylko wtedy, gdy
zweryfikowany klient należący do odbiornika pozostaje w aktywnym przebiegu zdarzenia. Kolejka wysyłania
w pamięci oraz rekordy uczestnictwa w wątkach są rozdzielone według obszaru roboczego danego
zdarzenia; sam klient nigdy nie jest serializowany ani utrwalany.

Klucze zasad kanałów i wpisy `dm.groupChannels` muszą używać nieprzetworzonych, stabilnych identyfikatorów kanałów Slack lub
formatu `channel:<id>`. OpenClaw normalizuje oba formaty do nieprzetworzonego identyfikatora kanału na potrzeby
dopasowywania w czasie działania; prefiksy `slack:`, `group:` i `mpim:` powodują błąd uruchamiania.
Wpisy zasad użytkowników muszą używać stabilnych identyfikatorów użytkowników Slack; nazwy, slugi, nazwy wyświetlane
i adresy e-mail powodują błąd uruchamiania. Identyfikatory muszą używać kanonicznego prefiksu i treści Slack zapisanych
wielkimi literami (na przykład `C0123456789` lub `U0123456789`); warianty pisane małymi literami i
krótkie, podobne identyfikatory powodują błąd uruchamiania. Konta Enterprise nie mogą włączyć
`dangerouslyAllowNameMatching`. Konta Enterprise mogą ustawić globalną wartość
`mentionPatterns.mode`, ale `mentionPatterns.allowIn` i
`mentionPatterns.denyIn` powodują błąd uruchamiania, ponieważ same identyfikatory kanałów Slack nie są
kwalifikowane obszarem roboczym i mogą być ponownie używane w różnych obszarach roboczych. Instalacje w obszarach roboczych
zachowują dotychczasowe zachowanie wzorców wzmianek o ograniczonym zakresie. Każdy zaakceptowany obszar roboczy
otrzymuje osobną tożsamość routingu, sesji, transkrypcji, deduplikacji, historii i pamięci podręcznej,
nawet gdy identyfikatory Slack się pokrywają. W strumieniu `message` obsługiwane są zwykłe wiadomości użytkowników
oraz tworzone przez użytkowników zdarzenia `file_share`; inne podtypy wiadomości są
odrzucane przed autoryzacją lub obsługą zdarzeń systemowych.

Wiadomości bezpośrednie Enterprise muszą być wyłączone (`dm.enabled=false` lub
`dmPolicy="disabled"`) albo jawnie otwarte za pomocą `dmPolicy="open"` oraz
obowiązującej dla konta wartości `allowFrom` zawierającej literał `"*"`. Pusta
lista dozwolonych lub identyfikatory konkretnych użytkowników bez `"*"` powodują błąd uruchamiania. Parowanie i
listy użytkowników dopuszczonych do wiadomości bezpośrednich są odrzucane, ponieważ identyfikatory użytkowników Slack nie są
kwalifikowane obszarem roboczym w tych magazynach autoryzacji. Zasady kanałów i nadawców
nadal mają zastosowanie do wiadomości na kanałach.

## Instalacja

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` rejestruje i włącza Plugin. Nie wykonuje żadnych działań, dopóki nie zostaną skonfigurowane aplikacja Slack i poniższe ustawienia kanału. Ogólne zasady instalowania pluginów opisano w sekcji [Pluginy](/pl/tools/plugin).

## Szybka konfiguracja

Manifesty w tej sekcji tworzą instalację ograniczoną do obszaru roboczego. W przypadku
instalacji w całej organizacji Enterprise Grid należy zamiast tego użyć dedykowanego
[manifestu i przepływu pracy dla całej organizacji](#enterprise-grid-org-wide-installs).

<Tabs>
  <Tab title="Socket Mode (domyślnie)">
    <Steps>
      <Step title="Utwórz nową aplikację Slack">
        Otwórz [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → wybierz obszar roboczy → wklej jeden z poniższych manifestów → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Łącznik Slack dla OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw łączy wątki asystenta Slack z agentami OpenClaw.",
      "suggested_prompts": [
        { "title": "Co potrafisz?", "message": "W czym możesz mi pomóc?" },
        {
          "title": "Podsumuj ten kanał",
          "message": "Podsumuj ostatnią aktywność na tym kanale."
        },
        { "title": "Przygotuj odpowiedź", "message": "Pomóż mi przygotować odpowiedź." }
      ]
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
    "description": "Łącznik Slack dla OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw łączy wątki asystenta Slack z agentami OpenClaw.",
      "suggested_prompts": [
        { "title": "Co potrafisz?", "message": "W czym możesz mi pomóc?" },
        {
          "title": "Podsumuj ten kanał",
          "message": "Podsumuj ostatnią aktywność na tym kanale."
        },
        { "title": "Przygotuj odpowiedź", "message": "Pomóż mi przygotować odpowiedź." }
      ]
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
          Wariant **Zalecany** odpowiada pełnemu zestawowi funkcji pluginu Slack: App Home, poleceniom ukośnikowym, plikom, reakcjom, przypięciom, grupowym wiadomościom bezpośrednim oraz odczytowi emoji i grup użytkowników. Wybierz wariant **Minimalny**, gdy zasady obszaru roboczego ograniczają zakresy — obejmuje on wiadomości bezpośrednie, historię kanałów i grup, wzmianki oraz polecenia ukośnikowe, ale pomija pliki, reakcje, przypięcia, grupowe wiadomości bezpośrednie (`mpim:*`), `emoji:read` i `usergroups:read`. Uzasadnienie poszczególnych zakresów i opcje rozszerzające, takie jak dodatkowe polecenia ukośnikowe, opisano w sekcji [Lista kontrolna manifestu i zakresów](#manifest-and-scope-checklist).
        </Note>

        Po utworzeniu aplikacji przez Slack:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: dodaj `connections:write`, zapisz i skopiuj token poziomu aplikacji.
        - **Install App -> Install to Workspace**: skopiuj token OAuth użytkownika bota.

      </Step>

      <Step title="Skonfiguruj OpenClaw">

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

        Zastępcze użycie zmiennych środowiskowych (tylko konto domyślne):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
        Otwórz [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → wybierz obszar roboczy → wklej jeden z poniższych manifestów → zastąp `https://gateway-host.example.com/slack/events` publicznym adresem URL Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Łącznik Slack dla OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw łączy wątki asystenta Slack z agentami OpenClaw.",
      "suggested_prompts": [
        { "title": "Co potrafisz?", "message": "W czym możesz mi pomóc?" },
        {
          "title": "Podsumuj ten kanał",
          "message": "Podsumuj ostatnią aktywność na tym kanale."
        },
        { "title": "Przygotuj odpowiedź", "message": "Pomóż mi przygotować odpowiedź." }
      ]
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
    "description": "Łącznik Slack dla OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw łączy wątki asystenta Slack z agentami OpenClaw.",
      "suggested_prompts": [
        { "title": "Co potrafisz?", "message": "W czym możesz mi pomóc?" },
        {
          "title": "Podsumuj ten kanał",
          "message": "Podsumuj ostatnią aktywność na tym kanale."
        },
        { "title": "Przygotuj odpowiedź", "message": "Pomóż mi przygotować odpowiedź." }
      ]
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
          Wariant **Zalecany** odpowiada pełnemu zestawowi funkcji pluginu Slack; wariant **Minimalny** pomija pliki, reakcje, przypięcia, grupowe wiadomości prywatne (`mpim:*`), `emoji:read` i `usergroups:read` na potrzeby restrykcyjnych obszarów roboczych. Uzasadnienie poszczególnych zakresów znajduje się w sekcji [Lista kontrolna manifestu i zakresów](#manifest-and-scope-checklist).
        </Note>

        <Info>
          Wszystkie trzy pola adresów URL (`slash_commands[].url`, `event_subscriptions.request_url` oraz `interactivity.request_url` / `message_menu_options_url`) wskazują ten sam punkt końcowy OpenClaw. Schemat manifestu Slack wymaga nadania im osobnych nazw, ale OpenClaw kieruje żądania według typu ładunku, więc wystarczy pojedynczy `webhookPath` (domyślnie `/slack/events`). Polecenia ukośnikowe bez `slash_commands[].url` w trybie HTTP po cichu nie wykonują żadnej operacji.
        </Info>

        Po utworzeniu aplikacji przez Slack:

        - **Basic Information → App Credentials**: skopiuj **Signing Secret** do weryfikacji żądań.
        - **Install App -> Install to Workspace**: skopiuj Bot User OAuth Token.

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
        Używaj unikatowych ścieżek webhooków dla konfiguracji HTTP z wieloma kontami

        Nadaj każdemu kontu odrębny `webhookPath` (domyślnie `/slack/events`), aby rejestracje nie powodowały kolizji.
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

OpenClaw domyślnie ustawia limit czasu oczekiwania klienta Slack SDK na odpowiedź pong w trybie Socket Mode na 15 sekund. Ustawienia transportu należy nadpisywać tylko wtedy, gdy potrzebne jest dostrojenie specyficzne dla obszaru roboczego lub hosta:

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

Należy używać tego wyłącznie w obszarach roboczych korzystających z Socket Mode, które rejestrują przekroczenia limitu czasu odpowiedzi pong lub pingów serwera websocket Slack, albo działają na hostach ze znanym problemem blokowania pętli zdarzeń. `clientPingTimeout` określa czas oczekiwania na pong po wysłaniu przez SDK pingu klienta; `serverPingTimeout` określa czas oczekiwania na pingi serwera Slack. Wiadomości i zdarzenia aplikacji pozostają stanem aplikacji, a nie sygnałami aktywności transportu.

Uwagi:

- `socketMode` jest ignorowany w trybie HTTP Request URL.
- Podstawowe ustawienia `channels.slack.socketMode` mają zastosowanie do wszystkich kont Slack, o ile nie zostaną nadpisane. Nadpisania dla poszczególnych kont używają `channels.slack.accounts.<accountId>.socketMode`; ponieważ jest to nadpisanie obiektu, należy uwzględnić każde pole dostrajania połączenia, które ma być używane przez dane konto.
- Tylko `clientPingTimeout` ma wartość domyślną OpenClaw (`15000`). `serverPingTimeout` i `pingPongLoggingEnabled` są przekazywane do Slack SDK tylko wtedy, gdy zostały skonfigurowane.
- Opóźnienie ponownego uruchomienia Socket Mode zaczyna się od około 2 sekund i jest ograniczone do około 30 sekund. Możliwe do odzyskania błędy uruchamiania, oczekiwania na uruchomienie i rozłączenia są ponawiane do czasu zatrzymania kanału. Trwałe błędy konta i danych uwierzytelniających, takie jak nieprawidłowe uwierzytelnianie, unieważnione tokeny lub brakujące zakresy, powodują natychmiastowe niepowodzenie zamiast ponawiania w nieskończoność.

## Lista kontrolna manifestu i zakresów

Podstawowy manifest aplikacji Slack jest taki sam dla Socket Mode i HTTP Request URLs. Różni się tylko blok `settings` (oraz `url` polecenia ukośnikowego).

Manifest podstawowy (domyślny Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Łącznik Slack dla OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw łączy wątki asystenta Slack z agentami OpenClaw.",
      "suggested_prompts": [
        { "title": "Co potrafisz?", "message": "W czym możesz mi pomóc?" },
        {
          "title": "Podsumuj ten kanał",
          "message": "Podsumuj ostatnią aktywność na tym kanale."
        },
        { "title": "Przygotuj odpowiedź", "message": "Pomóż mi przygotować odpowiedź." }
      ]
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

W przypadku **trybu HTTP Request URLs** zastąp `settings` wariantem HTTP i dodaj `url` do każdego polecenia ukośnikowego. Wymagany jest publiczny adres URL:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Wyślij wiadomość do OpenClaw",
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

Udostępnij dodatkowe funkcje rozszerzające powyższe ustawienia domyślne.

Domyślny manifest włącza kartę **Home** w Slack App Home i subskrybuje `app_home_opened`. Gdy członek obszaru roboczego otwiera kartę Home, OpenClaw publikuje bezpieczny domyślny widok strony głównej z `views.publish`; nie zawiera on ładunku rozmowy ani prywatnej konfiguracji. Gdy włączony jest tryb pojedynczego polecenia ukośnikowego, wskazówka dotycząca polecenia używa `channels.slack.slashCommand.name`; instalacje korzystające z poleceń natywnych lub bez poleceń ukośnikowych pomijają tę wskazówkę. Karta **Messages** pozostaje włączona dla wiadomości prywatnych Slack. Manifest włącza również wątki asystenta Slack za pomocą `features.assistant_view`, `assistant:write`, `assistant_thread_started` i `assistant_thread_context_changed`; wątki asystenta są kierowane do własnych sesji wątków OpenClaw i zachowują kontekst wątku dostarczony przez Slack, aby był dostępny dla agenta.

<AccordionGroup>
  <Accordion title="Opcjonalne natywne polecenia ukośnikowe">

    Zamiast pojedynczego skonfigurowanego polecenia można użyć wielu [natywnych poleceń ukośnikowych](#commands-and-slash-behavior), z następującymi zastrzeżeniami:

    - Użyj `/agentstatus` zamiast `/status`, ponieważ polecenie `/status` jest zarezerwowane.
    - W aplikacji Slack można jednocześnie zarejestrować maksymalnie 25 poleceń ukośnikowych (limit platformy Slack).

    Zastąp istniejącą sekcję `features.slash_commands` podzbiorem [dostępnych poleceń](/pl/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (domyślny)">

```json
{
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
      "description": "Skompaktuj kontekst sesji",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Zatrzymaj bieżące uruchomienie"
    },
    {
      "command": "/session",
      "description": "Zarządzaj wygaśnięciem powiązania wątku",
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
      "description": "Pokaż lub ustaw wartości domyślne wykonywania",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Zatwierdź lub odrzuć oczekujące prośby o zatwierdzenie",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Pokaż lub ustaw model",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Wyświetl dostawców/modele",
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
      "description": "Pokaż, z czego bieżący agent może teraz korzystać",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Pokaż stan środowiska uruchomieniowego, w tym wykorzystanie/limit dostawcy, jeśli są dostępne"
    },
    {
      "command": "/tasks",
      "description": "Wyświetl aktywne/niedawne zadania w tle dla bieżącej sesji"
    },
    {
      "command": "/context",
      "description": "Wyjaśnij sposób składania kontekstu",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Pokaż tożsamość nadawcy"
    },
    {
      "command": "/skill",
      "description": "Uruchom umiejętność według nazwy",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Zadaj pytanie poboczne bez zmiany kontekstu sesji",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Zadaj pytanie poboczne bez zmiany kontekstu sesji",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Steruj stopką wykorzystania lub pokaż podsumowanie kosztów",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="Adresy URL żądań HTTP">
        Użyj tej samej listy `slash_commands` co powyżej dla trybu Socket Mode i dodaj `"url": "https://gateway-host.example.com/slack/events"` do każdego wpisu. Przykład:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Rozpocznij nową sesję",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Pokaż krótkie podsumowanie pomocy",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Powtórz tę wartość `url` dla każdego polecenia na liście.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Opcjonalne zakresy autorstwa (operacje zapisu)">
    Dodaj zakres bota `chat:write.customize`, jeśli wiadomości wychodzące mają używać tożsamości aktywnego agenta (niestandardowej nazwy użytkownika i ikony) zamiast domyślnej tożsamości aplikacji Slack.

    Jeśli używana jest ikona emoji, Slack oczekuje składni `:emoji_name:`.

  </Accordion>
  <Accordion title="Opcjonalne zakresy tokenu użytkownika (operacje odczytu)">
    Jeśli skonfigurowano `channels.slack.userToken`, typowe zakresy odczytu to:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (jeśli używane są odczyty wyszukiwania Slack)

  </Accordion>
</AccordionGroup>

## Model tokenów

- `botToken` + `appToken` są wymagane w trybie Socket Mode.
- Tryb HTTP wymaga `botToken` + `signingSecret`.
- Tryb przekaźnika wymaga `botToken` oraz `relay.url`, `relay.authToken` i `relay.gatewayId`; nie używa tokenu aplikacji ani sekretu podpisywania.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` i `userToken` akceptują ciągi
  tekstowe w postaci jawnej lub obiekty SecretRef.
- Tokeny konfiguracji zastępują wartości rezerwowe ze środowiska.
- Wartości rezerwowe zmiennych środowiskowych `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` i `SLACK_USER_TOKEN` mają zastosowanie wyłącznie do konta domyślnego.
- `userToken` domyślnie działa tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki stanu:

- Inspekcja konta Slack śledzi dla każdego poświadczenia pola `*Source` i `*Status`
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Stan to `available`, `configured_unavailable` lub `missing`.
- `configured_unavailable` oznacza, że konto skonfigurowano za pomocą SecretRef
  lub innego źródła sekretu niewprowadzonego bezpośrednio, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego
  nie mogła rozpoznać rzeczywistej wartości.
- W trybie HTTP uwzględniany jest `signingSecretStatus`; w trybie Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
W przypadku akcji/odczytów katalogu token użytkownika może być preferowany, jeśli został skonfigurowany. W przypadku zapisów nadal preferowany jest token bota; zapisy z użyciem tokenu użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false`, a token bota jest niedostępny.
</Tip>

## Akcje i bramki

Akcjami Slack steruje `channels.slack.actions.*`.

Grupy akcji dostępne w bieżących narzędziach Slack:

| Grupa      | Domyślnie |
| ---------- | ------- |
| messages   | włączone |
| reactions  | włączone |
| pins       | włączone |
| memberInfo | włączone |
| emojiList  | włączone |

Bieżące akcje wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` i `emoji-list`. `download-file` akceptuje identyfikatory plików Slack widoczne w symbolach zastępczych plików przychodzących i zwraca podglądy obrazów lub lokalne metadane plików w przypadku innych typów plików.

## Kontrola dostępu i trasowanie

<Tabs>
  <Tab title="Zasady wiadomości bezpośrednich">
    `channels.slack.dmPolicy` steruje dostępem do wiadomości bezpośrednich. `channels.slack.allowFrom` jest kanoniczną listą dozwolonych wiadomości bezpośrednich.

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.slack.allowFrom` zawierał `"*"`)
    - `disabled`

    Flagi wiadomości bezpośrednich:

    - `dm.enabled` (domyślnie true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (starsza wersja)
    - `dm.groupEnabled` (domyślnie false dla grupowych wiadomości bezpośrednich)
    - `dm.groupChannels` (opcjonalna lista dozwolonych MPIM)

    Pierwszeństwo w konfiguracji wielu kont:

    - `channels.slack.accounts.default.allowFrom` ma zastosowanie wyłącznie do konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Starsze `channels.slack.dm.policy` i `channels.slack.dm.allowFrom` są nadal odczytywane w celu zachowania zgodności. `openclaw doctor --fix` migruje je do `dmPolicy` i `allowFrom`, gdy może to zrobić bez zmiany dostępu.

    Parowanie w wiadomościach bezpośrednich używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Zasady kanałów">
    `channels.slack.groupPolicy` steruje obsługą kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Lista dozwolonych kanałów znajduje się w `channels.slack.channels` i **musi używać stabilnych identyfikatorów kanałów Slack** (na przykład `C12345678`) jako kluczy konfiguracji.

    Uwaga dotycząca środowiska uruchomieniowego: jeśli całkowicie brakuje `channels.slack` (konfiguracja wyłącznie za pomocą środowiska), środowisko uruchomieniowe przechodzi awaryjnie na `groupPolicy="allowlist"` i rejestruje ostrzeżenie (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozpoznawanie nazwy/identyfikatora:

    - wpisy listy dozwolonych kanałów i listy dozwolonych wiadomości bezpośrednich są rozpoznawane podczas uruchamiania, gdy pozwala na to dostęp tokenu
    - nierozpoznane wpisy nazw kanałów są zachowywane zgodnie z konfiguracją, ale domyślnie ignorowane podczas trasowania
    - autoryzacja przychodząca i trasowanie kanałów domyślnie opierają się najpierw na identyfikatorze; bezpośrednie dopasowywanie nazwy użytkownika/identyfikatora tekstowego wymaga `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Klucze oparte na nazwach (`#channel-name` lub `channel-name`) **nie** są dopasowywane w ramach `groupPolicy: "allowlist"`. Wyszukiwanie kanału domyślnie opiera się najpierw na identyfikatorze, dlatego klucz oparty na nazwie nigdy nie zostanie pomyślnie przetrasowany, a wszystkie wiadomości na tym kanale zostaną po cichu zablokowane. Różni się to od `groupPolicy: "open"`, gdzie klucz kanału nie jest wymagany do trasowania i klucz oparty na nazwie pozornie działa.

    Zawsze używaj identyfikatora kanału Slack jako klucza. Aby go znaleźć: kliknij kanał prawym przyciskiem myszy w Slack → **Copy link** — identyfikator (`C...`) znajduje się na końcu adresu URL.

    Poprawnie:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    Niepoprawnie (po cichu blokowane w ramach `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Wzmianki i użytkownicy kanałów">
    Wiadomości na kanałach domyślnie wymagają wzmianki.

    Źródła wzmianek:

    - jawna wzmianka o aplikacji (`<@botId>`)
    - wzmianka o grupie użytkowników Slack (`<!subteam^S...>`), gdy użytkownik bota jest członkiem tej grupy użytkowników; wymaga `usergroups:read`
    - wzorce wyrażeń regularnych wzmianek (`agents.list[].groupChat.mentionPatterns`, wartość rezerwowa `messages.groupChat.mentionPatterns`)
    - niejawne odpowiadanie w wątku na wiadomość bota (wyłączone, gdy `thread.requireExplicitMention` ma wartość `true`)

    Ustawienia dla poszczególnych kanałów (`channels.slack.channels.<id>`; nazwy wyłącznie przez rozpoznawanie podczas uruchamiania lub `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; zastępuje tryb odpowiedzi konta/typu czatu dla tego kanału)
    - `users` (lista dozwolonych)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` lub symbol wieloznaczny `"*"`
      (starsze klucze bez prefiksu nadal są mapowane wyłącznie na `id:`)

    `ignoreOtherMentions` (domyślnie `false`) odrzuca wiadomości kanału, które wspominają innego użytkownika lub grupę użytkowników, ale nie tego bota. Nie ma to wpływu na wiadomości prywatne ani grupowe wiadomości prywatne (MPIM). Filtr wymaga rozpoznanego identyfikatora użytkownika bota z `auth.test`; jeśli ta tożsamość jest niedostępna (na przykład w przypadku tożsamości korzystającej wyłącznie z tokenu użytkownika), mechanizm przepuszcza wiadomości bez zmian.

    `allowBots` działa zachowawczo w przypadku kanałów i kanałów prywatnych: wiadomości w pomieszczeniu utworzone przez bota są akceptowane tylko wtedy, gdy wysyłający bot jest jawnie wymieniony na liście dozwolonych `users` tego pomieszczenia albo gdy co najmniej jeden jawny identyfikator właściciela Slack z `channels.slack.allowFrom` należy obecnie do tego pomieszczenia. Symbole wieloznaczne i wpisy właścicieli oparte na nazwach wyświetlanych nie potwierdzają obecności właściciela. Obecność właściciela wykorzystuje `conversations.members` Slack; należy upewnić się, że aplikacja ma odpowiedni zakres odczytu dla danego typu pomieszczenia (`channels:read` dla kanałów publicznych, `groups:read` dla kanałów prywatnych). Jeśli wyszukiwanie członków się nie powiedzie, OpenClaw odrzuca wiadomość w pomieszczeniu utworzoną przez bota.

    Zaakceptowane wiadomości Slack utworzone przez bota korzystają ze wspólnej [ochrony przed pętlami botów](/pl/channels/bot-loop-protection). Należy skonfigurować `channels.defaults.botLoopProtection` jako domyślny limit, a następnie nadpisać go za pomocą `channels.slack.botLoopProtection` lub `channels.slack.channels.<id>.botLoopProtection`, gdy obszar roboczy lub kanał wymaga innego limitu.

  </Tab>
</Tabs>

## Wątki, sesje i znaczniki odpowiedzi

- Wiadomości prywatne są kierowane jako `direct`; kanały jako `channel`; MPIM jako `group`.
- Powiązania tras Slack akceptują nieprzetworzone identyfikatory elementów równorzędnych oraz formy celów Slack, takie jak `channel:C12345678`, `user:U12345678` i `<@U12345678>`.
- Przy domyślnym ustawieniu `session.dmScope=main` wiadomości prywatne Slack są łączone z główną sesją agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Zwykłe wiadomości najwyższego poziomu w kanale pozostają w sesji przypisanej do kanału, nawet gdy `replyToMode` ma wartość inną niż `off`.
- Odpowiedzi w wątkach Slack używają nadrzędnego `thread_ts` Slack jako sufiksu sesji (`:thread:<threadTs>`), nawet gdy tworzenie wątków odpowiedzi wychodzących jest wyłączone przez `replyToMode="off"`.
- OpenClaw inicjuje kwalifikujący się główny wpis kanału w `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, gdy oczekuje się, że ten wpis rozpocznie widoczny wątek Slack, dzięki czemu wpis główny i późniejsze odpowiedzi w wątku współdzielą jedną sesję OpenClaw. Dotyczy to zdarzeń `app_mention`, jawnych dopasowań wzorców wzmianki o bocie lub skonfigurowanych wzorców wzmianek oraz kanałów `requireMention: false` z ustawieniem `replyToMode` innym niż `off`.
- Domyślna wartość `channels.slack.thread.historyScope` to `thread`; domyślna wartość `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` określa liczbę istniejących wiadomości wątku pobieranych przy rozpoczynaniu nowej sesji wątku (domyślnie `20`; ustawienie `0` wyłącza tę funkcję).
- `channels.slack.thread.requireExplicitMention` (domyślnie `false`): gdy ustawiono `true`, pomija niejawne wzmianki w wątkach, dzięki czemu bot odpowiada wyłącznie na jawne wzmianki `@bot` wewnątrz wątków, nawet jeśli wcześniej uczestniczył w danym wątku. Bez tego odpowiedzi w wątku, w którym uczestniczył bot, omijają kontrolę `requireMention`.

Ustawienia wątków odpowiedzi:

- `channels.slack.channels.<id>.replyToMode`: nadpisanie dla poszczególnych kanałów dotyczące wiadomości w kanałach i kanałach prywatnych Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: dla każdego `direct|group|channel`
- starsze ustawienie zastępcze dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Obsługiwane są ręczne znaczniki odpowiedzi:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

W przypadku jawnych odpowiedzi w wątkach Slack wysyłanych za pomocą narzędzia `message` należy ustawić `replyBroadcast: true` wraz z `action: "send"` oraz `threadId` lub `replyTo`, aby Slack również opublikował odpowiedź z wątku w kanale nadrzędnym. Odpowiada to fladze `reply_broadcast` elementu `chat.postMessage` Slack i jest obsługiwane wyłącznie w przypadku wysyłania tekstu lub Block Kit, a nie przesyłania multimediów.

Gdy wywołanie narzędzia `message` działa wewnątrz wątku Slack i wskazuje ten sam kanał, OpenClaw zwykle dziedziczy bieżący wątek Slack zgodnie z obowiązującym ustawieniem `replyToMode` konta, typu czatu lub kanału. Automatyczne odpowiedzi oraz wywołania `send` lub `upload-file` w tym samym kanale używają tego samego nadpisania dla kanału. Aby wymusić nową wiadomość w kanale nadrzędnym, należy ustawić `topLevel: true` w `action: "send"` lub `action: "upload-file"`. `threadId: null` jest akceptowane jako równoważna rezygnacja na najwyższym poziomie.

<Note>
`replyToMode="off"` wyłącza tworzenie wątków dla wychodzących odpowiedzi Slack, w tym jawne znaczniki `[[reply_to_*]]`. Nie spłaszcza jednak przychodzących sesji wątków Slack: wiadomości opublikowane już wewnątrz wątku Slack nadal są kierowane do sesji `:thread:<threadTs>`. Różni się to od Telegram, gdzie jawne znaczniki są nadal respektowane w trybie `"off"`. Wątki Slack ukrywają wiadomości w kanale, natomiast odpowiedzi Telegram pozostają widoczne bezpośrednio w rozmowie.
</Note>

## Reakcje potwierdzające

`ackReaction` wysyła emoji potwierdzenia podczas przetwarzania przez OpenClaw wiadomości przychodzącej. `ackReactionScope` określa, _kiedy_ to emoji jest faktycznie wysyłane.

Domyślnie potwierdzenie pozostaje statyczne, podczas gdy natywny stan wątku asystenta Slack pokazuje postęp za pomocą zmieniających się komunikatów ładowania. Aby zamiast tego włączyć cykl reakcji oczekiwanie/myślenie/narzędzie/gotowe/błąd, należy ustawić `messages.statusReactions.enabled: true`.

### Emoji (`ackReaction`)

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- zastępcze emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie `"eyes"` / 👀)

Uwagi:

- Slack oczekuje krótkich kodów (na przykład `"eyes"`).
- Aby wyłączyć reakcję dla konta Slack lub globalnie, należy użyć `""`.

### Zakres (`messages.ackReactionScope`)

Dostawca Slack odczytuje zakres z `messages.ackReactionScope` (domyślnie `"group-mentions"`). Obecnie nie ma nadpisania na poziomie konta ani kanału Slack; wartość jest globalna dla Gateway.

Wartości:

- `"all"`: reaguj w wiadomościach prywatnych i grupach, w tym na zdarzenia otoczenia w pomieszczeniu.
- `"direct"`: reaguj tylko w wiadomościach prywatnych.
- `"group-all"`: reaguj na każdą wiadomość grupową z wyjątkiem zdarzeń otoczenia w pomieszczeniu (bez wiadomości prywatnych).
- `"group-mentions"` (domyślnie): reaguj w grupach, ale tylko wtedy, gdy bot jest wspomniany (lub w elementach grupowych obsługujących wzmianki, które wyraziły zgodę). **Wiadomości prywatne są wykluczone.**
- `"off"` / `"none"`: nigdy nie reaguj.

<Note>
Domyślny zakres (`"group-mentions"`) nie uruchamia reakcji potwierdzających w wiadomościach bezpośrednich ani przy zdarzeniach otoczenia w pomieszczeniu. Aby skonfigurowane `ackReaction` (na przykład `"eyes"`) było widoczne przy przychodzących wiadomościach prywatnych Slack i cichych zdarzeniach w pomieszczeniu, należy ustawić `messages.ackReactionScope` na `"all"`. `messages.ackReactionScope` jest odczytywane podczas uruchamiania dostawcy Slack, dlatego zastosowanie zmiany wymaga ponownego uruchomienia Gateway.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // reaguj w wiadomościach prywatnych i grupach
  },
}
```

## Strumieniowanie tekstu

`channels.slack.streaming` steruje zachowaniem podglądu na żywo:

- `off`: wyłącz strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastępuj tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołączaj fragmentaryczne aktualizacje podglądu.
- `progress`: wyświetlaj tekst stanu postępu podczas generowania, a następnie wyślij tekst końcowy.
- `streaming.preview.toolProgress`: gdy podgląd wersji roboczej jest aktywny, kieruj aktualizacje narzędzi i postępu do tej samej edytowanej wiadomości podglądu (domyślnie: `true`). Ustaw `false`, aby zachować oddzielne wiadomości narzędzi i postępu.
- `streaming.preview.commandText` / `streaming.progress.commandText`: ustaw `status`, aby zachować zwięzłe wiersze postępu narzędzi, jednocześnie ukrywając nieprzetworzony tekst poleceń i wykonania (domyślnie: `raw`).

Ukrywanie nieprzetworzonego tekstu poleceń i wykonania przy zachowaniu zwięzłych wierszy postępu:

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

`channels.slack.streaming.nativeTransport` steruje natywnym strumieniowaniem tekstu Slack, gdy `channels.slack.streaming.mode` ma wartość `partial` (domyślnie: `true`).

Natywne karty zadań postępu Slack są opcjonalne w trybie postępu. Należy ustawić `channels.slack.streaming.progress.nativeTaskCards` na `true` wraz z `channels.slack.streaming.mode="progress"`, aby podczas wykonywania pracy wysyłać natywną kartę planu lub zadania Slack, a następnie zaktualizować tę samą kartę po zakończeniu. Bez tej flagi tryb postępu zachowuje przenośne działanie podglądu wersji roboczej.

- Aby natywne strumieniowanie tekstu i stan wątku asystenta Slack były widoczne, musi być dostępny wątek odpowiedzi. Wybór wątku nadal podlega `replyToMode`.
- Kanały, czaty grupowe i główne wpisy wiadomości prywatnych nadal mogą używać zwykłego podglądu wersji roboczej, gdy natywne strumieniowanie jest niedostępne lub nie istnieje wątek odpowiedzi.
- Wiadomości prywatne najwyższego poziomu Slack domyślnie pozostają poza wątkami, dlatego nie wyświetlają natywnego podglądu strumienia ani stanu w stylu wątku Slack; zamiast tego OpenClaw publikuje i edytuje podgląd wersji roboczej w wiadomości prywatnej.
- Multimedia i ładunki inne niż tekstowe korzystają ze zwykłego sposobu dostarczania.
- Końcowe multimedia lub błędy anulują oczekujące edycje podglądu; kwalifikujące się końcowe treści tekstowe lub blokowe są zatwierdzane tylko wtedy, gdy można edytować podgląd w miejscu.
- Jeśli strumieniowanie nie powiedzie się w trakcie odpowiedzi, OpenClaw przechodzi na zwykłe dostarczanie pozostałych ładunków.

Używanie podglądu wersji roboczej zamiast natywnego strumieniowania tekstu Slack:

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

Włączanie natywnych kart zadań postępu Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) jest starszym aliasem `channels.slack.streaming.mode`.
- wartość logiczna `channels.slack.streaming` jest starszym aliasem `channels.slack.streaming.mode` i `channels.slack.streaming.nativeTransport`.
- klucze najwyższego poziomu `channels.slack.chunkMode` i `channels.slack.nativeStreaming` są starszymi aliasami `channels.slack.streaming.chunkMode` i `channels.slack.streaming.nativeTransport`.
- Starsze aliasy nie są odczytywane w czasie działania; należy uruchomić `openclaw doctor --fix`, aby przepisać zapisaną konfigurację strumieniowania Slack na klucze kanoniczne.

## Zastępcza reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack podczas przetwarzania odpowiedzi przez OpenClaw, a następnie usuwa ją po zakończeniu przebiegu. Jest to najbardziej przydatne poza odpowiedziami w wątkach, które korzystają z domyślnego wskaźnika stanu „pisze...”.

Kolejność rozstrzygania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje krótkich kodów (na przykład `"hourglass_flowing_sand"`).
- Reakcja jest podejmowana w miarę możliwości, a próba jej usunięcia następuje automatycznie po zakończeniu odpowiedzi lub ścieżki błędu.

## Wprowadzanie głosowe

Aby obecnie mówić do OpenClaw w Slack, należy wysłać klip dźwiękowy Slack do aplikacji OpenClaw. Mikrofon dyktowania Slackbot jest oddzielną funkcją należącą do Slack, a nie interfejsem API aplikacji.

- **[Dyktowanie głosowe w Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** działa w prywatnej konwersacji użytkownika ze Slackbot. Slack przekształca nagranie w monit Slackbot, ale nie udostępnia aplikacjom Slack innych firm pliku audio, zdarzenia dyktowania, monitu ani znacznika źródła danych wejściowych za pośrednictwem Events API. Plugin Slack OpenClaw nie może go włączyć ani odbierać.
- **[Klipy audio Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** to pliki przechowywane w Slack, które można publikować w wiadomości prywatnej OpenClaw, kanale lub wątku. OpenClaw pobiera dostępny klip przy użyciu tokenu bota, normalizuje metadane MIME klipu ze Slack i przekazuje go do współdzielonego [potoku transkrypcji dźwięku](/pl/nodes/audio). Zalecany manifest aplikacji zawiera wymagany zakres `files:read`.

Klipy audio i dyktowanie w Slackbot mają inne zasady prywatności: klipy podlegają zasadom przechowywania plików Slack, a OpenClaw pobiera je do transkrypcji, natomiast według Slack dźwięk dyktowania nie jest przechowywany.

Na kanale z `requireMention: true` klip audio bez podpisu może spełnić warunek, jeśli zawiera wypowiedziany skonfigurowany wzorzec wzmianki (`agents.list[].groupChat.mentionPatterns`, z wartością rezerwową `messages.groupChat.mentionPatterns`). OpenClaw autoryzuje nadawcę przed pobraniem lub transkrypcją klipu, a następnie dopuszcza go tylko wtedy, gdy transkrypcja jest zgodna ze wzorcem. Nieudana lub niezgodna wstępna transkrypcja jest usuwana wraz z pobranym klipem; nie jest zachowywana w historii kanału. Natywnej tożsamości Slack `@bot` nie można wywnioskować z mowy, dlatego należy skonfigurować wzorzec wypowiadanego imienia lub dodać wpisaną wzmiankę. Jeśli włączono powtarzanie transkrypcji, jej treść jest wysyłana dopiero po dopuszczeniu.

## Multimedia, dzielenie i dostarczanie

<AccordionGroup>
  <Accordion title="Załączniki przychodzące">
    Załączniki plikowe Slack są pobierane z prywatnych adresów URL hostowanych przez Slack (przepływ żądań uwierzytelnianych tokenem) i zapisywane w magazynie multimediów, jeśli pobieranie się powiedzie i pozwalają na to limity rozmiaru. Symbole zastępcze plików zawierają `fileId` Slack, aby agenci mogli pobrać oryginalny plik za pomocą `download-file`.

    Pobieranie korzysta z ograniczonych limitów czasu bezczynności i całkowitego czasu. Jeśli pobieranie pliku ze Slack zatrzyma się lub nie powiedzie, OpenClaw kontynuuje przetwarzanie wiadomości i używa symbolu zastępczego pliku.

    Domyślny limit rozmiaru przychodzących danych środowiska uruchomieniowego wynosi `20MB`, chyba że zostanie zastąpiony przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Tekst i pliki wychodzące">
    - fragmenty tekstu używają `channels.slack.textChunkLimit` (domyślnie `8000`, z ograniczeniem do własnego limitu długości wiadomości Slack)
    - `channels.slack.streaming.chunkMode="newline"` włącza dzielenie w pierwszej kolejności według akapitów
    - wysyłanie plików korzysta z interfejsów API przesyłania Slack i może obejmować odpowiedzi w wątku (`thread_ts`)
    - w przypadku długich podpisów plików pierwszy fragment tekstu zgodny z ograniczeniami Slack jest używany jako komentarz do przesłanego pliku, a pozostałe fragmenty są wysyłane jako kolejne wiadomości
    - limit wychodzących multimediów jest zgodny z `channels.slack.mediaMaxMb`, jeśli skonfigurowano tę wartość; w przeciwnym razie wysyłanie kanałowe korzysta z wartości domyślnych zależnych od rodzaju MIME z potoku multimediów

  </Accordion>

  <Accordion title="Cele dostarczania">
    Preferowane cele jawne:

    - `user:<id>` dla wiadomości prywatnych
    - `channel:<id>` dla kanałów

    Wiadomości prywatne Slack zawierające tylko tekst lub bloki mogą być publikowane bezpośrednio przy użyciu identyfikatorów użytkowników; przesyłanie plików i wysyłanie w wątkach najpierw otwiera wiadomość prywatną za pomocą interfejsów API konwersacji Slack, ponieważ te ścieżki wymagają konkretnego identyfikatora konwersacji.

  </Accordion>
</AccordionGroup>

## Polecenia i działanie ukośnika

Polecenia z ukośnikiem pojawiają się w Slack jako jedno skonfigurowane polecenie lub wiele poleceń natywnych. Skonfiguruj `channels.slack.slashCommand`, aby zmienić ustawienia domyślne poleceń:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Polecenia natywne wymagają [dodatkowych ustawień manifestu](#additional-manifest-settings) w aplikacji Slack i są zamiast tego włączane za pomocą `channels.slack.commands.native: true` lub `commands.native: true` w konfiguracjach globalnych.

- Automatyczny tryb poleceń natywnych jest **wyłączony** dla Slack, dlatego `commands.native: "auto"` nie włącza natywnych poleceń Slack.

```txt
/help
```

Menu argumentów natywnych są renderowane w następujący sposób, według kolejności priorytetów:

- 3–5 wystarczająco krótkich opcji: menu przepełnienia („...”)
- więcej niż 100 opcji, gdy dostępne jest asynchroniczne filtrowanie opcji: wybór zewnętrzny
- 1–2 opcje lub dowolna opcja, której zakodowana wartość jest zbyt długa dla pola wyboru: bloki przycisków
- w pozostałych przypadkach (6–100 opcji lub więcej niż 100 bez filtrowania asynchronicznego): statyczne menu wyboru, dzielone po 100 opcji na menu

```txt
/think
```

Sesje ukośnika używają odizolowanych kluczy, takich jak `agent:<agentId>:slack:slash:<userId>`, i nadal kierują wykonania poleceń do sesji docelowej konwersacji przy użyciu `CommandTargetSessionKey`.

## Natywne wykresy

Publiczny blok Block Kit [`data_visualization`](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/) Slack
renderuje w wiadomościach wykresy liniowe, słupkowe, warstwowe i kołowe. OpenClaw mapuje przenośny
blok `presentation` `chart` na tę natywną postać; poza zwykłym dostępem do wiadomości
`chat:write` nie są wymagane żadne dodatkowe zakresy OAuth,
przesyłanie plików, mechanizm renderowania obrazów ani konfiguracja Slack.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Przychody kwartalne",
      "categories": ["I kw.", "II kw."],
      "series": [{ "name": "Przychody", "values": [120, 145] }],
      "xLabel": "Kwartał"
    }
  ]
}
```

Limity Slack są wymuszane przed renderowaniem natywnym:

- tytuł i opcjonalne etykiety osi: 50 znaków
- wykres kołowy: 1–12 dodatnich segmentów
- wykres liniowy/słupkowy/warstwowy: 1–12 serii o unikatowych nazwach i 1–20 wspólnych kategorii
- etykiety segmentów, kategorii i serii: 20 znaków
- każda seria musi zawierać po jednej skończonej wartości dla każdej kategorii; wartości wykresów innych niż kołowe
  mogą być ujemne

Każdy natywny wykres zawiera również reprezentację tekstową najwyższego poziomu dla czytników
ekranu, powiadomień, duplikowania sesji oraz klientów, które nie mogą renderować
bloku. Standardowe prezentacje wysyłane do innych kanałów OpenClaw otrzymują te same
deterministyczne dane wykresu w postaci tekstu, chyba że deklarują obsługę wykresów natywnych. Jeśli
podczas etapowego wdrażania Slack odrzuci wykres z błędem `invalid_blocks`, OpenClaw
usuwa odrzucone natywne bloki danych, zachowuje wszystkie sąsiadujące elementy sterujące i wysyła
pełną reprezentację wykresu jako widoczny tekst.

Slack akceptuje obecnie maksymalnie dwa bloki `data_visualization` na wiadomość. Gdy
prezentacja zawiera więcej niż dwa prawidłowe wykresy, OpenClaw zachowuje ich kolejność
i kontynuuje renderowanie natywne w kolejnych wiadomościach, umieszczając nie więcej niż dwa
wykresy w każdej wiadomości.

[Ogłoszenie dla deweloperów](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
Slack opisuje ten blok jako funkcję Block Kit przeznaczoną dla aplikacji i nie określa żadnego ograniczenia
zależnego od płatnego planu. Informacja o dostępności w planach Business+/Enterprise dotyczy
automatycznego generowania wykresów przez AI Slackbot, które jest odrębne od wysyłania przez aplikację
już ustrukturyzowanego wykresu Block Kit. Wykresy są blokami przeznaczonymi wyłącznie do wiadomości, a nie treścią App
Home, okna modalnego ani Canvas.

## Natywne tabele

Bieżący blok Block Kit [`data_table`](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
Slack renderuje w wiadomościach ustrukturyzowane wiersze i kolumny. OpenClaw mapuje jawny
przenośny blok `presentation` `table` na `data_table`; nie używa starszego
[bloku `table`](https://docs.slack.dev/reference/block-kit/blocks/table-block/) Slack.
Poza zwykłym dostępem do wiadomości `chat:write` nie jest wymagany żaden dodatkowy zakres OAuth ani konfiguracja Slack.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Otwarty lejek",
      "headers": ["Konto", "Etap", "ARR"],
      "rows": [
        ["Acme", "Wygrana", 125000],
        ["Globex", "Weryfikacja", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw mapuje komórki nagłówków i ciągów znaków na komórki `raw_text` Slack. Komórki liczbowe
są mapowane na `raw_number`, przy czym skończona wartość liczbowa zostaje zachowana na potrzeby natywnego sortowania
i filtrowania. `rowHeaderColumnIndex`, jeśli występuje, oznacza tę kolumnę numerowaną od zera
jako nagłówki wierszy Slack.

Opublikowane limity `data_table` Slack są wymuszane przed renderowaniem natywnym:

- 1–20 kolumn
- 1–100 wierszy danych oraz wiersz nagłówka
- taka sama liczba komórek w każdym wierszu
- maksymalnie 10 000 znaków łącznie we wszystkich komórkach tabel w jednej wiadomości

Wiele prawidłowych bloków tabel może być renderowanych natywnie, dopóki wiadomość
mieści się w łącznym limicie znaków. Tabela, której nie można wyrenderować w natywnych
ograniczeniach, jest przekształcana w kompletny deterministyczny tekst zamiast tracić wiersze lub
komórki. Jeśli tekst przekracza rozmiar jednej wiadomości Slack, wysyłanie i odpowiedzi na polecenia z ukośnikiem używają
uporządkowanych fragmentów tekstu. Edycja tabeli kończy się jawnym błędem rozmiaru zamiast
po cichu obcinać wiersze istniejącej wiadomości.

Każda natywna tabela utworzona z przenośnej prezentacji zawiera również reprezentację tekstową
najwyższego poziomu dla czytników ekranu, powiadomień, duplikowania sesji oraz
klientów, które nie mogą renderować bloku. Surowe wartości wykresów i tabel pozostają dosłowne
w reprezentacji rezerwowej, dlatego dane komórki takie jak `<@U123>` nie stają się wzmianką Slack.
Jeśli Slack odrzuci natywne bloki wykresów lub tabel z błędem `invalid_blocks`, OpenClaw
usuwa wszystkie natywne bloki danych w jednym ograniczonym kroku odzyskiwania, zachowuje prawidłowe
sąsiadujące bloki, takie jak przyciski i pola wyboru, oraz wysyła kompletny widoczny tekst wykresu
i tabeli z wyłączonym formatowaniem Slack. Dostarczanie poleceń z ukośnikiem
śledzi budżet pięciu wywołań `response_url` Slack dla całego polecenia. Przed każdą
partią odpowiedzi wybiera kompletny plan mieszczący się w pozostałej liczbie wywołań lub zgłasza błąd
przed opublikowaniem tej partii.

Tylko jawne bloki tabel `presentation` są przekształcane w tabele natywne.
Tabele potokowe Markdown pozostają tekstem w pierwotnej postaci; OpenClaw nie odgaduje struktury
tabeli ani typów komórek. Istniejący zaufani producenci natywnych bloków Slack mogą nadal
przekazywać surowe bloki przez `channelData.slack.blocks`; OpenClaw tworzy tekst rezerwowy
z prawidłowych surowych komórek `data_table`, natomiast nieprawidłowe bloki niestandardowe mogą
zostać zredukowane do podpisu lub ogólnej reprezentacji rezerwowej Block Kit. Przenośne dane wyjściowe agenta, CLI
i pluginu powinny używać `presentation`.

## Odpowiedzi interaktywne

Slack może renderować tworzone przez agenta interaktywne elementy sterujące odpowiedziami, ale ta funkcja jest domyślnie wyłączona.
W przypadku nowych danych wyjściowych agenta, CLI i pluginu zaleca się używanie współdzielonych
przycisków lub bloków wyboru `presentation`. Korzystają one z tej samej ścieżki interakcji Slack,
a jednocześnie mogą być upraszczane na innych kanałach.

Włączanie globalne:

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

Można też włączyć tę funkcję tylko dla jednego konta Slack:

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

Po włączeniu agenci mogą nadal emitować przestarzałe dyrektywy odpowiedzi przeznaczone wyłącznie dla Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Dyrektywy te są kompilowane do formatu Slack Block Kit, a kliknięcia lub wybory są kierowane
z powrotem przez istniejącą ścieżkę zdarzeń interakcji Slack. Należy je zachować dla starych
monitów i mechanizmów awaryjnych specyficznych dla Slack; w przypadku nowych
przenośnych elementów sterujących należy używać współdzielonej prezentacji.

Interfejsy API kompilatora dyrektyw również są przestarzałe dla nowego kodu producentów:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

W przypadku nowych elementów sterujących renderowanych w Slack należy używać ładunków `presentation` i `buildSlackPresentationBlocks(...)`.

Uwagi:

- To starszy interfejs użytkownika specyficzny dla Slacka. Inne kanały nie tłumaczą dyrektyw Slack Block
  Kit na własne systemy przycisków.
- Wartości interaktywnych wywołań zwrotnych to wygenerowane przez OpenClaw nieprzezroczyste tokeny, a nie nieprzetworzone wartości utworzone przez agenta.
- Jeśli wygenerowane interaktywne bloki przekroczyłyby limity Slack Block Kit, OpenClaw zamiast wysyłać nieprawidłowy ładunek bloków używa pierwotnej odpowiedzi tekstowej.

### Przesyłanie formularzy modalnych obsługiwane przez plugin

Pluginy Slacka, które rejestrują procedurę obsługi interakcji, mogą również odbierać zdarzenia cyklu życia
`view_submission` i `view_closed`, zanim OpenClaw skompaktuje
ładunek na potrzeby zdarzenia systemowego widocznego dla agenta. Podczas otwierania formularza modalnego Slacka należy użyć jednego z tych
wzorców routingu:

- Ustaw `callback_id` na `openclaw:<namespace>:<payload>`.
- Można też zachować istniejące `callback_id` i umieścić `pluginInteractiveData:
"<namespace>:<payload>"` w `private_metadata` formularza modalnego.

Procedura obsługi otrzymuje `ctx.interaction.kind` jako `view_submission` lub
`view_closed`, znormalizowane `inputs` oraz pełny, nieprzetworzony obiekt `stateValues` ze
Slacka. Routing wyłącznie według identyfikatora wywołania zwrotnego wystarcza do wywołania procedury obsługi pluginu; jeśli
formularz modalny powinien również wygenerować zdarzenie systemowe widoczne dla agenta, należy uwzględnić
istniejące pola routingu użytkownika/sesji `private_metadata` formularza modalnego. Agent otrzymuje
zwarte, zredagowane zdarzenie systemowe `Slack interaction: ...`. Jeśli procedura obsługi zwróci
`systemEvent.summary`, `systemEvent.reference` lub `systemEvent.data`, pola te
zostaną uwzględnione w tym zwartym zdarzeniu, dzięki czemu agent może odwołać się do
pamięci należącej do pluginu bez dostępu do pełnego ładunku formularza.

## Natywne zatwierdzenia w Slacku

Slack może działać jako natywny klient zatwierdzania z interaktywnymi przyciskami i interakcjami, zamiast korzystać awaryjnie z interfejsu WWW lub terminala.

- Zatwierdzenia wykonania i pluginów mogą być wyświetlane jako natywne monity Slack Block Kit.
- `channels.slack.execApprovals.*` nadal odpowiada za włączanie natywnego klienta zatwierdzania wykonania oraz konfigurację routingu wiadomości prywatnych/kanałów.
- Wiadomości prywatne dotyczące zatwierdzania wykonania używają `channels.slack.execApprovals.approvers` lub `commands.ownerAllowFrom`.
- Zatwierdzenia pluginów używają natywnych przycisków Slacka, gdy Slack jest włączony jako natywny klient zatwierdzania dla sesji źródłowej albo gdy `approvals.plugin` kieruje do źródłowej sesji Slacka lub miejsca docelowego w Slacku.
- Wiadomości prywatne dotyczące zatwierdzania pluginów korzystają z osób zatwierdzających pluginy Slacka z `channels.slack.allowFrom`, `allowFrom` nazwanego konta lub domyślnej trasy konta.
- Autoryzacja osoby zatwierdzającej jest nadal wymuszana: osoby uprawnione tylko do zatwierdzania wykonania nie mogą zatwierdzać żądań pluginów, chyba że są również osobami zatwierdzającymi pluginy.

Wykorzystuje to tę samą współdzieloną powierzchnię przycisków zatwierdzania co inne kanały. Gdy `interactivity` jest włączone w ustawieniach aplikacji Slack, monity o zatwierdzenie są wyświetlane jako przyciski Block Kit bezpośrednio w rozmowie.
Gdy te przyciski są dostępne, stanowią podstawowy interfejs zatwierdzania; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia wskazuje, że
zatwierdzanie na czacie jest niedostępne lub ręczne zatwierdzenie jest jedyną możliwością.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalne; w miarę możliwości używa awaryjnie `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzanie wykonania, gdy `enabled` nie jest ustawione lub ma wartość `"auto"` i uda się wskazać co najmniej jedną
osobę zatwierdzającą wykonanie. Slack może również obsługiwać natywne zatwierdzenia pluginów za pośrednictwem tej ścieżki
natywnego klienta, gdy uda się wskazać osoby zatwierdzające pluginy Slacka, a żądanie spełnia filtry natywnego klienta. Ustaw
`enabled: false`, aby jawnie wyłączyć Slacka jako natywnego klienta zatwierdzania. Ustaw `enabled: true`, aby
wymusić natywne zatwierdzenia, gdy uda się wskazać osoby zatwierdzające. Wyłączenie zatwierdzania wykonania w Slacku nie wyłącza
natywnego dostarczania zatwierdzeń pluginów w Slacku włączonego przez `approvals.plugin`; dostarczanie zatwierdzeń pluginów
korzysta zamiast tego z osób zatwierdzających pluginy Slacka.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzania wykonania w Slacku:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Jawna konfiguracja natywna dla Slacka jest potrzebna tylko w celu zastąpienia osób zatwierdzających, dodania filtrów lub
włączenia dostarczania na czacie źródłowym:

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

Współdzielone przekazywanie `approvals.exec` jest odrębne. Należy go używać tylko wtedy, gdy monity o zatwierdzenie wykonania muszą być również
kierowane do innych czatów lub jawnych zewnętrznych miejsc docelowych. Współdzielone przekazywanie `approvals.plugin` również jest
odrębne; natywne dostarczanie w Slacku pomija ten mechanizm awaryjny tylko wtedy, gdy Slack może natywnie obsłużyć żądanie
zatwierdzenia pluginu.

`/approve` na tym samym czacie działa również w kanałach i wiadomościach prywatnych Slacka, które już obsługują polecenia. Pełny model przekazywania zatwierdzeń opisano w sekcji [Zatwierdzanie wykonania](/pl/tools/exec-approvals).

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości są mapowane na zdarzenia systemowe.
- Transmisje wątku (odpowiedzi w wątku z opcją „Also send to channel”) są przetwarzane jako zwykłe wiadomości użytkownika.
- Zdarzenia dodania/usunięcia reakcji są mapowane na zdarzenia systemowe.
- Dołączenie/opuszczenie przez członka, utworzenie/zmiana nazwy kanału oraz dodanie/usunięcie przypięcia są mapowane na zdarzenia systemowe.
- Opcjonalne odpytywanie o obecność może zmapować zaobserwowane przejście ludzkiego uczestnika z `away` do `active` na ostatnio aktywną kwalifikującą się sesję Slacka tego uczestnika. Domyślnie jest wyłączone.
- `channel_id_changed` może migrować klucze konfiguracji kanałów, gdy włączone jest `configWrites`.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą zostać wstrzyknięte do kontekstu routingu.
- Wiadomość rozpoczynająca wątek i początkowe zasilanie kontekstu historią wątku są w stosownych przypadkach filtrowane według skonfigurowanych list dozwolonych nadawców.
- Działania bloków, skróty i interakcje z formularzami modalnymi emitują ustrukturyzowane zdarzenia systemowe `Slack interaction: ...` z rozbudowanymi polami ładunku:
  - działania bloków: wybrane wartości, etykiety, wartości selektorów i metadane `workflow_*`
  - skróty globalne: metadane wywołania zwrotnego i wykonawcy, kierowane do bezpośredniej sesji wykonawcy
  - skróty wiadomości: kontekst wywołania zwrotnego, wykonawcy, kanału, wątku i wybranej wiadomości
  - zdarzenia formularzy modalnych `view_submission` i `view_closed` z kierowanymi metadanymi kanału i danymi wejściowymi formularza

W konfiguracji aplikacji Slack należy zdefiniować skróty globalne lub skróty wiadomości i użyć dowolnego niepustego identyfikatora wywołania zwrotnego. OpenClaw potwierdza pasujące ładunki skrótów, stosuje te same zasady dotyczące nadawców wiadomości prywatnych/kanałów co w przypadku innych interakcji Slacka i umieszcza oczyszczone zdarzenie w kolejce kierowanej sesji agenta. Identyfikatory wyzwalaczy i adresy URL odpowiedzi są redagowane z kontekstu agenta.

### Zdarzenia obecności

Slack nie wysyła zmian obecności przez Events API ani Socket Mode. Zamiast tego OpenClaw może odpytywać [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) w przypadku ludzkich uczestników, których wiadomości przeszły standardowe kontrole dostępu i routingu Slacka.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (domyślnie): brak czasomierza obecności i wywołań API Slacka.
- `auto`: monitoruje wiadomości prywatne, MPIM-y i wątki Slacka aktywne w ciągu ostatnich 24 godzin, z maksymalnie 8 zaobserwowanymi ludzkimi uczestnikami. Sesje kanałów najwyższego poziomu są wykluczone.
- `on`: monitoruje te same rozmowy bez limitu uczestników i uwzględnia sesje kanałów najwyższego poziomu. Należy użyć nadpisania dla kanału, aby wymusić lub wyłączyć monitorowanie jednego kanału.

OpenClaw odpytuje najwyżej 45 unikatowych użytkowników na minutę na konto Slack, inicjuje stan na podstawie pierwszego wyniku bez wybudzania agenta i wybudza go tylko po zaobserwowaniu przejścia z `away` do `active`. Dla każdego konta Slack i użytkownika obowiązuje trwały 8-godzinny okres wyciszenia, nawet jeśli dana osoba uczestniczy w kilku wątkach. Zdarzenie jest kierowane wyłącznie do ostatnio aktywnej kwalifikującej się rozmowy tej osoby i nakazuje agentowi sprawdzić pamięć/wiki oraz znany kontekst strefy czasowej przed podjęciem decyzji o wysłaniu jednego krótkiego powitania. Agent może zachować milczenie.

Token bota wymaga `users:read`, które jest już uwzględnione w zalecanym manifeście. Zdarzenia obecności są niedostępne w instalacjach Enterprise Grid obejmujących całą organizację.

## Dokumentacja konfiguracji

Główna dokumentacja: [Dokumentacja konfiguracji — Slack](/pl/gateway/config-channels#slack).

<Accordion title="Najważniejsze pola Slacka">

- tryb/uwierzytelnianie: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- dostęp do wiadomości prywatnych: `dm.enabled`, `dmPolicy`, `allowFrom` (starsze: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- przełącznik zgodności: `dangerouslyAllowNameMatching` (awaryjny; pozostawić wyłączony, jeśli nie jest potrzebny)
- dostęp do kanałów: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- wątki/historia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- wybudzenia na podstawie obecności: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; domyślnie `off`)
- dostarczanie: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- rozwijanie: `unfurlLinks` (domyślnie: `false`), `unfurlMedia` do sterowania podglądem łączy/multimediów `chat.postMessage`; ustaw `unfurlLinks: true`, aby ponownie włączyć podglądy łączy
- operacje/funkcje: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak odpowiedzi w kanałach">
    Sprawdź kolejno:

    - `groupPolicy`
    - lista dozwolonych kanałów (`channels.slack.channels`) — **klucze muszą być identyfikatorami kanałów** (`C12345678`), a nie nazwami (`#channel-name`). Klucze oparte na nazwach zawodzą bez komunikatu przy `groupPolicy: "allowlist"`, ponieważ routing kanałów domyślnie opiera się przede wszystkim na identyfikatorach. Aby znaleźć identyfikator: kliknij kanał prawym przyciskiem myszy w Slacku → **Copy link** — wartość `C...` na końcu adresu URL jest identyfikatorem kanału.
    - `requireMention`
    - lista dozwolonych `users` dla kanału
    - `messages.groupChat.visibleReplies`: standardowe żądania grupowe/kanałowe mają domyślnie wartość `"automatic"`. Jeśli włączono `"message_tool"`, a dzienniki pokazują tekst asystenta bez wywołania `message(action=send)`, model pominął widoczną ścieżkę narzędzia wiadomości. Tekst końcowy pozostaje prywatny w tym trybie; należy sprawdzić szczegółowy dziennik Gateway pod kątem metadanych pominiętego ładunku albo ustawić wartość `"automatic"`, jeśli każda standardowa końcowa odpowiedź asystenta ma być publikowana za pośrednictwem starszej ścieżki.
    - `messages.groupChat.unmentionedInbound`: jeśli ma wartość `"room_event"`, niewspominane wypowiedzi na dozwolonym kanale stanowią kontekst otoczenia i pozostają bez odpowiedzi, chyba że agent wywoła narzędzie `message`. Zobacz [Zdarzenia otoczenia w pokoju](/pl/channels/ambient-room-events).

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

  <Accordion title="Ignorowanie wiadomości prywatnych">
    Sprawdź:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (lub starsze `channels.slack.dm.policy`)
    - zatwierdzenia parowania / wpisy na liście dozwolonych (`dmPolicy: "open"` nadal wymaga `channels.slack.allowFrom: ["*"]`)
    - grupowe wiadomości prywatne używają obsługi MPIM; włącz `channels.slack.dm.groupEnabled` i, jeśli skonfigurowano, uwzględnij MPIM w `channels.slack.dm.groupChannels`
    - zdarzenia wiadomości prywatnych Slack Assistant: szczegółowe logi zawierające `drop message_changed`
      zwykle oznaczają, że Slack wysłał zdarzenie edytowanego wątku Assistant bez
      możliwego do ustalenia nadawcy będącego człowiekiem w metadanych wiadomości

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Tryb Socket nie nawiązuje połączenia">
    Zweryfikuj tokeny bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.
    App-Level Token wymaga `connections:write`, a token bota Bot User OAuth Token
    musi należeć do tej samej aplikacji Slack i przestrzeni roboczej co token aplikacji.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` lub
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżące środowisko wykonawcze nie mogło rozpoznać wartości
    obsługiwanej przez SecretRef.

    Logi takie jak `slack socket mode failed to start; retry ...` oznaczają możliwe do usunięcia
    błędy uruchamiania. Brakujące zakresy, unieważnione tokeny i nieprawidłowe uwierzytelnianie
    powodują natomiast natychmiastowe niepowodzenie. Log `slack token mismatch ...` oznacza, że token bota i token aplikacji
    prawdopodobnie należą do różnych aplikacji Slack; popraw dane uwierzytelniające aplikacji Slack.

  </Accordion>

  <Accordion title="Tryb HTTP nie odbiera zdarzeń">
    Zweryfikuj:

    - sekret podpisujący
    - ścieżkę Webhooka
    - adresy Slack Request URLs (Events + Interactivity + Slash Commands)
    - unikalną wartość `webhookPath` dla każdego konta HTTP
    - czy publiczny adres URL kończy połączenie TLS i przekazuje żądania do ścieżki Gateway
    - czy ścieżka `request_url` aplikacji Slack dokładnie odpowiada `channels.slack.webhookPath` (domyślnie `/slack/events`)

    Jeśli `signingSecretStatus: "configured_unavailable"` pojawia się w migawkach
    konta, konto HTTP jest skonfigurowane, ale bieżące środowisko wykonawcze nie mogło
    rozpoznać sekretu podpisującego obsługiwanego przez SecretRef.

    Powtarzający się log `slack: webhook path ... already registered` oznacza, że dwa konta HTTP
    używają tej samej wartości `webhookPath`; przypisz każdemu kontu odrębną ścieżkę.

  </Accordion>

  <Accordion title="Polecenia natywne/ukośnikowe nie są wykonywane">
    Sprawdź, czy zamierzonym trybem jest:

    - tryb poleceń natywnych (`channels.slack.commands.native: true`) z odpowiadającymi poleceniami ukośnikowymi zarejestrowanymi w Slack
    - lub tryb pojedynczego polecenia ukośnikowego (`channels.slack.slashCommand.enabled: true`)

    Slack nie tworzy ani nie usuwa poleceń ukośnikowych automatycznie. `commands.native: "auto"` nie włącza natywnych poleceń Slack; użyj `true` i utwórz odpowiadające polecenia w aplikacji Slack. W trybie HTTP każde polecenie ukośnikowe Slack musi zawierać adres URL Gateway. W Socket Mode ładunki poleceń docierają przez websocket, a Slack ignoruje `slash_commands[].url`.

    Sprawdź również `commands.useAccessGroups`, autoryzację wiadomości prywatnych, listy dozwolonych kanałów
    oraz listy dozwolonych `users` dla poszczególnych kanałów. Slack zwraca błędy efemeryczne dla
    zablokowanych nadawców poleceń ukośnikowych, w tym:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Informacje o załącznikach multimedialnych

Slack może dołączyć pobrane multimedia do tury agenta, jeśli pobieranie plików ze Slack zakończy się powodzeniem i pozwalają na to limity rozmiaru. Klipy audio mogą zostać poddane transkrypcji, pliki obrazów mogą zostać przekazane ścieżką rozpoznawania multimediów lub bezpośrednio do modelu odpowiedzi obsługującego analizę obrazu, a pozostałe pliki pozostają dostępne jako kontekst plików możliwych do pobrania.

### Obsługiwane typy multimediów

| Typ multimediów                | Źródło               | Bieżące działanie                                                                  | Uwagi                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Klipy audio Slack              | Adres URL pliku Slack | Pobierane i kierowane przez współdzieloną transkrypcję audio                       | Wymaga `files:read` oraz działającego modelu lub CLI `tools.media.audio` |
| Obrazy JPEG / PNG / GIF / WebP | Adres URL pliku Slack | Pobierane i dołączane do tury w celu obsługi przez funkcje rozpoznawania obrazu    | Limit na plik: `channels.slack.mediaMaxMb` (domyślnie 20 MB)                       |
| Pliki PDF                      | Adres URL pliku Slack | Pobierane i udostępniane jako kontekst pliku dla narzędzi takich jak `download-file` lub `pdf` | Dane przychodzące ze Slack nie konwertują automatycznie plików PDF na dane wejściowe analizy obrazu |
| Inne pliki                     | Adres URL pliku Slack | Pobierane, gdy jest to możliwe, i udostępniane jako kontekst pliku                 | Pliki binarne nie są traktowane jako dane wejściowe obrazu                |
| Odpowiedzi w wątku             | Pliki wiadomości początkowej wątku | Pliki wiadomości głównej mogą zostać załadowane jako kontekst, gdy odpowiedź nie zawiera bezpośrednich multimediów | Wiadomości początkowe zawierające tylko pliki używają symbolu zastępczego załącznika |
| Wiadomości z wieloma plikami   | Wiele plików Slack    | Każdy plik jest oceniany niezależnie                                               | Przetwarzanie Slack jest ograniczone do ośmiu plików na wiadomość         |

### Potok danych przychodzących

Po nadejściu wiadomości Slack z załącznikami:

1. OpenClaw pobiera plik z prywatnego adresu URL Slack przy użyciu tokenu bota.
2. Po pomyślnym pobraniu plik zostaje zapisany w magazynie multimediów.
3. Ścieżki pobranych multimediów i typy zawartości są dodawane do kontekstu danych przychodzących.
4. Klipy audio są kierowane do współdzielonego potoku transkrypcji; ścieżki modeli i narzędzi obsługujących obrazy mogą korzystać z załączników obrazów z tego samego kontekstu.
5. Pozostałe pliki są dostępne jako metadane plików lub odwołania do multimediów dla narzędzi, które potrafią je obsłużyć.

### Dziedziczenie załączników z wiadomości głównej wątku

Gdy wiadomość nadchodzi w wątku (ma element nadrzędny `thread_ts`):

- Jeśli sama odpowiedź nie zawiera bezpośrednich multimediów, a dołączona wiadomość główna zawiera pliki, Slack może załadować pliki wiadomości głównej jako kontekst wiadomości rozpoczynającej wątek.
- Pliki wiadomości głównej są ładowane wyłącznie podczas inicjowania nowej lub zresetowanej sesji wątku. Późniejsze odpowiedzi zawierające tylko tekst ponownie wykorzystują istniejący kontekst sesji i nie dołączają ponownie plików wiadomości głównej jako nowych multimediów.
- Bezpośrednie załączniki odpowiedzi mają pierwszeństwo przed załącznikami wiadomości głównej.
- Wiadomość główna zawierająca wyłącznie pliki i bez tekstu jest reprezentowana przez symbol zastępczy załącznika, dzięki czemu mechanizm rezerwowy może nadal uwzględnić jej pliki.

### Obsługa wielu załączników

Gdy pojedyncza wiadomość Slack zawiera wiele załączników:

- Każdy załącznik jest przetwarzany niezależnie przez potok multimediów.
- Odwołania do pobranych multimediów są agregowane w kontekście wiadomości.
- Kolejność przetwarzania odpowiada kolejności plików Slack w ładunku zdarzenia.
- Niepowodzenie pobierania jednego załącznika nie blokuje pozostałych.

### Limity rozmiaru, pobierania i modeli

- **Limit rozmiaru**: domyślnie 20 MB na plik. Można go skonfigurować za pomocą `channels.slack.mediaMaxMb`.
- **Limit transkrypcji audio**: `tools.media.audio.maxBytes` obowiązuje również, gdy pobrany plik jest wysyłany do dostawcy transkrypcji lub CLI.
- **Niepowodzenia pobierania**: pliki, których Slack nie może udostępnić, wygasłe adresy URL, niedostępne pliki, pliki przekraczające limit rozmiaru oraz odpowiedzi HTML uwierzytelniania/logowania Slack są pomijane zamiast zgłaszania ich jako nieobsługiwanych formatów.
- **Model rozpoznawania obrazu**: analiza obrazów używa aktywnego modelu odpowiedzi, jeśli obsługuje on rozpoznawanie obrazu, lub modelu obrazu skonfigurowanego w `agents.defaults.imageModel`.

### Znane ograniczenia

| Scenariusz                                    | Bieżące działanie                                                                  | Obejście                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Wygasły adres URL pliku Slack                 | Plik jest pomijany; błąd nie jest wyświetlany                                      | Prześlij plik ponownie w Slack                                                |
| Transkrypcja audio jest niedostępna           | Klip pozostaje dołączony, ale transkrypcja nie jest tworzona                       | Skonfiguruj `tools.media.audio` lub zainstaluj obsługiwane lokalne CLI do transkrypcji |
| Klip bez podpisu nie przechodzi bramki wzmianki | Odrzucony po prywatnej transkrypcji spekulacyjnej; transkrypcja i pobrany plik są usuwane | Skonfiguruj wzorzec wzmianki wypowiedzianej nazwy, dodaj wpisaną wzmiankę o bocie lub użyj wiadomości prywatnej |
| Model rozpoznawania obrazu nie jest skonfigurowany | Załączniki obrazów są przechowywane jako odwołania do multimediów, ale nie są analizowane jako obrazy | Skonfiguruj `agents.defaults.imageModel` lub użyj modelu odpowiedzi obsługującego rozpoznawanie obrazu |
| Bardzo duże obrazy (> 20 MB domyślnie)        | Pomijane zgodnie z limitem rozmiaru                                                 | Zwiększ `channels.slack.mediaMaxMb`, jeśli Slack na to pozwala                         |
| Przekazane/udostępnione załączniki            | Tekst oraz multimedia obrazów/plików przechowywane w Slack są obsługiwane w miarę możliwości | Udostępnij ponownie bezpośrednio w wątku OpenClaw                             |
| Załączniki PDF                                | Przechowywane jako kontekst pliku/multimediów, bez automatycznego kierowania przez analizę obrazu | Użyj `download-file` do obsługi metadanych pliku lub narzędzia `pdf` do analizy PDF |

### Powiązana dokumentacja

- [Potok rozpoznawania multimediów](/pl/nodes/media-understanding)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Narzędzie PDF](/pl/tools/pdf)

## Powiązane

<CardGroup cols={2}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    Sparuj użytkownika Slack z Gateway.
  </Card>
  <Card title="Grupy" icon="users" href="/pl/channels/groups">
    Działanie kanałów i grupowych wiadomości prywatnych.
  </Card>
  <Card title="Trasowanie kanałów" icon="route" href="/pl/channels/channel-routing">
    Kieruj wiadomości przychodzące do agentów.
  </Card>
  <Card title="Bezpieczeństwo" icon="shield" href="/pl/gateway/security">
    Model zagrożeń i wzmacnianie zabezpieczeń.
  </Card>
  <Card title="Konfiguracja" icon="sliders" href="/pl/gateway/configuration">
    Układ konfiguracji i kolejność pierwszeństwa.
  </Card>
  <Card title="Polecenia ukośnikowe" icon="terminal" href="/pl/tools/slash-commands">
    Katalog poleceń i ich działanie.
  </Card>
</CardGroup>
