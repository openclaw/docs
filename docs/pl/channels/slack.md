---
read_when:
    - Konfigurowanie Slack lub debugowanie trybu Slack socket/HTTP
summary: Konfiguracja Slack i zachowanie w czasie działania (Socket Mode + adresy URL żądań HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-06T09:46:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11571e7e10cfbf4de91dc1b1ed6582cd94afdcf6c3356fdd3ccc770096c6dd31
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: gotowe do użycia produkcyjnego dla DM-ów i kanałów przez integracje aplikacji Slack. Domyślnym trybem jest Socket Mode; obsługiwane są również adresy URL żądań HTTP.

<CardGroup cols={3}>
  <Card title="Parowanie" icon="link" href="/pl/channels/pairing">
    DM-y Slack domyślnie działają w trybie parowania.
  </Card>
  <Card title="Polecenia slash" icon="terminal" href="/pl/tools/slash-commands">
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
        - wklej [przykładowy manifest](#manifest-and-scope-checklist) z sekcji poniżej i kontynuuj tworzenie
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

        Zmienna środowiskowa jako zapasowa konfiguracja (tylko konto domyślne):

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
        Używaj unikalnych ścieżek webhook dla wielu kont HTTP

        Nadaj każdemu kontu odrębny `webhookPath` (domyślnie `/slack/events`), aby rejestracje się nie kolidowały.
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

## Lista kontrolna manifestu i zakresów

<Tabs>
  <Tab title="Socket Mode (domyślnie)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

  </Tab>

  <Tab title="Adresy URL żądań HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

<AccordionGroup>
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
    - `search:read` (jeśli korzystasz z odczytów wyszukiwania Slack)

  </Accordion>
</AccordionGroup>

## Model tokenów

- `botToken` + `appToken` są wymagane dla Socket Mode.
- Tryb HTTP wymaga `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` i `userToken` akceptują jawne
  ciągi znaków albo obiekty SecretRef.
- Tokeny z konfiguracji mają pierwszeństwo przed zapasową konfiguracją ze zmiennych środowiskowych.
- Zapasowa konfiguracja z `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` ze zmiennych środowiskowych dotyczy tylko konta domyślnego.
- `userToken` (`xoxp-...`) jest dostępny tylko w konfiguracji (bez zapasowej konfiguracji ze zmiennych środowiskowych) i domyślnie działa w trybie tylko do odczytu (`userTokenReadOnly: true`).

Zachowanie migawki statusu:

- Inspekcja konta Slack śledzi pola `*Source` i `*Status`
  dla każdego poświadczenia (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status ma wartość `available`, `configured_unavailable` albo `missing`.
- `configured_unavailable` oznacza, że konto jest skonfigurowane przez SecretRef
  albo inne źródło sekretu nieinline, ale bieżąca ścieżka polecenia/środowiska uruchomieniowego
  nie mogła rozwiązać rzeczywistej wartości.
- W trybie HTTP uwzględniane jest `signingSecretStatus`; w Socket Mode
  wymagana para to `botTokenStatus` + `appTokenStatus`.

<Tip>
Do odczytów działań/katalogu preferowany może być token użytkownika, jeśli jest skonfigurowany. Przy zapisach nadal preferowany jest token bota; zapisy tokenem użytkownika są dozwolone tylko wtedy, gdy `userTokenReadOnly: false` i token bota jest niedostępny.
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

Bieżące działania wiadomości Slack obejmują `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` i `emoji-list`.

## Kontrola dostępu i routing

<Tabs>
  <Tab title="Zasada DM">
    `channels.slack.dmPolicy` kontroluje dostęp do DM-ów (starsza nazwa: `channels.slack.dm.policy`):

    - `pairing` (domyślnie)
    - `allowlist`
    - `open` (wymaga, aby `channels.slack.allowFrom` zawierało `"*"`; starsza nazwa: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flagi DM:

    - `dm.enabled` (domyślnie true)
    - `channels.slack.allowFrom` (zalecane)
    - `dm.allowFrom` (starsza nazwa)
    - `dm.groupEnabled` (DM-y grupowe domyślnie false)
    - `dm.groupChannels` (opcjonalna lista dozwolonych MPIM)

    Priorytet dla wielu kont:

    - `channels.slack.accounts.default.allowFrom` dotyczy tylko konta `default`.
    - Nazwane konta dziedziczą `channels.slack.allowFrom`, gdy ich własne `allowFrom` nie jest ustawione.
    - Nazwane konta nie dziedziczą `channels.slack.accounts.default.allowFrom`.

    Parowanie w DM-ach używa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Zasada kanału">
    `channels.slack.groupPolicy` kontroluje obsługę kanałów:

    - `open`
    - `allowlist`
    - `disabled`

    Lista dozwolonych kanałów znajduje się pod `channels.slack.channels` i powinna używać stabilnych identyfikatorów kanałów.

    Uwaga dotycząca działania w czasie wykonywania: jeśli `channels.slack` całkowicie nie istnieje (konfiguracja tylko przez zmienne środowiskowe), środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` i zapisuje ostrzeżenie do logów (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

    Rozwiązywanie nazw/identyfikatorów:

    - wpisy listy dozwolonych kanałów i wpisy listy dozwolonych DM są rozwiązywane przy starcie, gdy dostęp tokena na to pozwala
    - nierozwiązane wpisy nazw kanałów pozostają w konfiguracji, ale są domyślnie ignorowane przez routing
    - autoryzacja przychodząca i routing kanałów domyślnie są oparte najpierw na identyfikatorach; bezpośrednie dopasowanie nazw użytkowników/slugów wymaga `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Wzmianki i użytkownicy kanału">
    Wiadomości na kanałach są domyślnie ograniczane przez wzmianki.

    Źródła wzmianki:

    - jawna wzmianka o aplikacji (`<@botId>`)
    - wzorce regex wzmianki (`agents.list[].groupChat.mentionPatterns`, zapasowo `messages.groupChat.mentionPatterns`)
    - niejawne zachowanie wątku odpowiedzi do bota

    Kontrolki per kanał (`channels.slack.channels.<id>`; nazwy tylko przez rozwiązywanie przy starcie lub `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista dozwolonych)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format klucza `toolsBySender`: `id:`, `e164:`, `username:`, `name:` albo symbol wieloznaczny `"*"`
      (starsze klucze bez prefiksu nadal są mapowane tylko do `id:`)

  </Tab>
</Tabs>

## Wątki, sesje i tagi odpowiedzi

- DM-y są routowane jako `direct`; kanały jako `channel`; MPIM-y jako `group`.
- Przy domyślnym `session.dmScope=main` DM-y Slack są zwijane do głównej sesji agenta.
- Sesje kanałów: `agent:<agentId>:slack:channel:<channelId>`.
- Odpowiedzi w wątku mogą tworzyć sufiksy sesji wątku (`:thread:<threadTs>`) tam, gdzie ma to zastosowanie.
- Domyślna wartość `channels.slack.thread.historyScope` to `thread`; domyślna wartość `thread.inheritParent` to `false`.
- `channels.slack.thread.initialHistoryLimit` kontroluje liczbę istniejących wiadomości w wątku pobieranych przy rozpoczęciu nowej sesji wątku (domyślnie `20`; ustaw `0`, aby wyłączyć).

Kontrolki wątkowania odpowiedzi:

- `channels.slack.replyToMode`: `off|first|all|batched` (domyślnie `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- starsza zapasowa nazwa dla czatów bezpośrednich: `channels.slack.dm.replyToMode`

Obsługiwane są ręczne tagi odpowiedzi:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Uwaga: `replyToMode="off"` wyłącza **całe** wątkowanie odpowiedzi w Slack, w tym jawne tagi `[[reply_to_*]]`. Różni się to od Telegram, gdzie jawne tagi są nadal honorowane w trybie `"off"`. Różnica wynika z modeli wątków platform: w Slack wątki ukrywają wiadomości przed kanałem, podczas gdy w Telegram odpowiedzi pozostają widoczne w głównym przepływie czatu.

## Reakcje potwierdzające

`ackReaction` wysyła emoji potwierdzenia, gdy OpenClaw przetwarza wiadomość przychodzącą.

Kolejność rozwiązywania:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- zapasowe emoji tożsamości agenta (`agents.list[].identity.emoji`, w przeciwnym razie "👀")

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"eyes"`).
- Użyj `""`, aby wyłączyć reakcję dla konta Slack lub globalnie.

## Strumieniowanie tekstu

`channels.slack.streaming` kontroluje zachowanie podglądu na żywo:

- `off`: wyłącza strumieniowanie podglądu na żywo.
- `partial` (domyślnie): zastępuje tekst podglądu najnowszym częściowym wynikiem.
- `block`: dołącza porcjowane aktualizacje podglądu.
- `progress`: pokazuje tekst statusu postępu podczas generowania, a następnie wysyła tekst końcowy.

`channels.slack.nativeStreaming` kontroluje natywne strumieniowanie tekstu Slack, gdy `streaming` ma wartość `partial` (domyślnie: `true`).

- Aby natywne strumieniowanie tekstu było widoczne, musi być dostępny wątek odpowiedzi. Wybór wątku nadal podąża za `replyToMode`. Bez tego używany jest zwykły podgląd szkicu.
- Media i ładunki inne niż tekst wracają do zwykłego dostarczania.
- Jeśli strumieniowanie nie powiedzie się w połowie odpowiedzi, OpenClaw wraca do zwykłego dostarczania dla pozostałych ładunków.

Użyj podglądu szkicu zamiast natywnego strumieniowania tekstu Slack:

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

Starsze klucze:

- `channels.slack.streamMode` (`replace | status_final | append`) jest automatycznie migrowany do `channels.slack.streaming`.
- wartość logiczna `channels.slack.streaming` jest automatycznie migrowana do `channels.slack.nativeStreaming`.

## Zapasowa reakcja pisania

`typingReaction` dodaje tymczasową reakcję do przychodzącej wiadomości Slack, gdy OpenClaw przetwarza odpowiedź, a następnie usuwa ją po zakończeniu działania. Jest to najbardziej przydatne poza odpowiedziami w wątkach, które używają domyślnego wskaźnika statusu „pisze...”.

Kolejność rozwiązywania:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Uwagi:

- Slack oczekuje shortcode'ów (na przykład `"hourglass_flowing_sand"`).
- Reakcja jest wykonywana w trybie best-effort, a próba jej usunięcia jest podejmowana automatycznie po odpowiedzi lub po zakończeniu ścieżki błędu.

## Media, dzielenie na części i dostarczanie

<AccordionGroup>
  <Accordion title="Załączniki przychodzące">
    Załączniki plików Slack są pobierane z prywatnych adresów URL hostowanych przez Slack (przepływ żądań uwierzytelnianych tokenem) i zapisywane w magazynie mediów, gdy pobieranie się powiedzie i pozwalają na to limity rozmiaru.

    Domyślny limit rozmiaru wejściowego w czasie działania to `20MB`, chyba że zostanie nadpisany przez `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Tekst i pliki wychodzące">
    - fragmenty tekstu używają `channels.slack.textChunkLimit` (domyślnie 4000)
    - `channels.slack.chunkMode="newline"` włącza dzielenie z priorytetem akapitów
    - wysyłanie plików używa API przesyłania Slack i może obejmować odpowiedzi w wątku (`thread_ts`)
    - limit mediów wychodzących podąża za `channels.slack.mediaMaxMb`, jeśli jest skonfigurowany; w przeciwnym razie wysyłki kanałowe używają domyślnych wartości typu MIME z potoku mediów
  </Accordion>

  <Accordion title="Cele dostarczania">
    Preferowane jawne cele:

    - `user:<id>` dla DM-ów
    - `channel:<id>` dla kanałów

    DM-y Slack są otwierane przez API konwersacji Slack podczas wysyłania do celów użytkownika.

  </Accordion>
</AccordionGroup>

## Polecenia i zachowanie slash

- Natywny automatyczny tryb poleceń jest **wyłączony** dla Slack (`commands.native: "auto"` nie włącza natywnych poleceń Slack).
- Włącz natywne handlery poleceń Slack przez `channels.slack.commands.native: true` (lub globalne `commands.native: true`).
- Gdy natywne polecenia są włączone, zarejestruj pasujące polecenia slash w Slack (`/<command>`), z jednym wyjątkiem:
  - zarejestruj `/agentstatus` dla polecenia statusu (Slack rezerwuje `/status`)
- Jeśli natywne polecenia nie są włączone, możesz uruchomić pojedyncze skonfigurowane polecenie slash przez `channels.slack.slashCommand`.
- Natywne menu argumentów dostosowują teraz strategię renderowania:
  - do 5 opcji: bloki przycisków
  - 6-100 opcji: statyczne menu wyboru
  - więcej niż 100 opcji: zewnętrzny wybór z asynchronicznym filtrowaniem opcji, gdy dostępne są handlery opcji interaktywności
  - jeśli zakodowane wartości opcji przekraczają limity Slack, przepływ wraca do przycisków
- Dla długich ładunków opcji menu argumentów poleceń slash używają dialogu potwierdzenia przed wysłaniem wybranej wartości.

Domyślne ustawienia polecenia slash:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Sesje slash używają izolowanych kluczy:

- `agent:<agentId>:slack:slash:<userId>`

i nadal kierują wykonanie polecenia względem sesji docelowej konwersacji (`CommandTargetSessionKey`).

## Interaktywne odpowiedzi

Slack może renderować interaktywne kontrolki odpowiedzi autorstwa agenta, ale ta funkcja jest domyślnie wyłączona.

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

Te dyrektywy są kompilowane do Slack Block Kit i kierują kliknięcia lub wybory z powrotem przez istniejącą ścieżkę zdarzeń interakcji Slack.

Uwagi:

- To interfejs specyficzny dla Slack. Inne kanały nie tłumaczą dyrektyw Slack Block Kit na własne systemy przycisków.
- Wartości interaktywnego callbacka to nieprzezroczyste tokeny generowane przez OpenClaw, a nie surowe wartości utworzone przez agenta.
- Jeśli wygenerowane interaktywne bloki przekroczyłyby limity Slack Block Kit, OpenClaw wraca do oryginalnej odpowiedzi tekstowej zamiast wysyłać nieprawidłowy ładunek blocks.

## Zatwierdzenia exec w Slack

Slack może działać jako natywny klient zatwierdzeń z interaktywnymi przyciskami i interakcjami, zamiast wracać do interfejsu Web UI lub terminala.

- Zatwierdzenia exec używają `channels.slack.execApprovals.*` do natywnego routingu DM/kanału.
- Zatwierdzenia pluginów nadal mogą być rozwiązywane przez tę samą natywną powierzchnię przycisków Slack, gdy żądanie już trafia do Slack, a rodzaj identyfikatora zatwierdzenia to `plugin:`.
- Autoryzacja zatwierdzającego nadal jest wymuszana: tylko użytkownicy zidentyfikowani jako zatwierdzający mogą zatwierdzać lub odrzucać żądania przez Slack.

Korzysta to z tej samej współdzielonej powierzchni przycisków zatwierdzeń co inne kanały. Gdy `interactivity` jest włączone w ustawieniach aplikacji Slack, prompty zatwierdzeń są renderowane jako przyciski Block Kit bezpośrednio w konwersacji.
Gdy te przyciski są obecne, stanowią podstawowy UX zatwierdzania; OpenClaw
powinien dołączać ręczne polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że
zatwierdzenia na czacie są niedostępne albo ręczne zatwierdzenie jest jedyną ścieżką.

Ścieżka konfiguracji:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcjonalne; w miarę możliwości wraca do `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, domyślnie: `dm`)
- `agentFilter`, `sessionFilter`

Slack automatycznie włącza natywne zatwierdzenia exec, gdy `enabled` nie jest ustawione albo ma wartość `"auto"` i zostanie rozwiązany co najmniej jeden
zatwierdzający. Ustaw `enabled: false`, aby jawnie wyłączyć Slack jako natywnego klienta zatwierdzeń.
Ustaw `enabled: true`, aby wymusić natywne zatwierdzenia, gdy zatwierdzający zostaną rozwiązani.

Domyślne zachowanie bez jawnej konfiguracji zatwierdzeń exec dla Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Jawna konfiguracja natywna Slack jest potrzebna tylko wtedy, gdy chcesz zastąpić zatwierdzających, dodać filtry lub
włączyć dostarczanie do czatu pochodzenia:

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

Współdzielone przekazywanie `approvals.exec` jest osobne. Używaj go tylko wtedy, gdy prompty zatwierdzeń exec muszą być także
kierowane do innych czatów lub jawnych celów poza pasmem. Współdzielone przekazywanie `approvals.plugin` jest również
osobne; natywne przyciski Slack nadal mogą rozwiązywać zatwierdzenia pluginów, gdy te żądania już trafiają
do Slack.

Polecenie `/approve` w tym samym czacie działa również w kanałach i DM-ach Slack, które już obsługują polecenia. Zobacz [Zatwierdzenia exec](/pl/tools/exec-approvals), aby poznać pełny model przekazywania zatwierdzeń.

## Zdarzenia i zachowanie operacyjne

- Edycje/usunięcia wiadomości oraz rozgłoszenia wątków są mapowane na zdarzenia systemowe.
- Zdarzenia dodania/usunięcia reakcji są mapowane na zdarzenia systemowe.
- Zdarzenia dołączenia/opuszczenia członka, utworzenia/zmiany nazwy kanału oraz dodania/usunięcia przypięcia są mapowane na zdarzenia systemowe.
- `channel_id_changed` może migrować klucze konfiguracji kanału, gdy włączone jest `configWrites`.
- Metadane tematu/celu kanału są traktowane jako niezaufany kontekst i mogą być wstrzykiwane do kontekstu routingu.
- Inicjator wątku i początkowe zasianie kontekstu historii wątku są filtrowane przez skonfigurowane listy dozwolonych nadawców, gdy ma to zastosowanie.
- Akcje bloków i interakcje modalne emitują ustrukturyzowane zdarzenia systemowe `Slack interaction: ...` z bogatymi polami ładunku:
  - akcje bloków: wybrane wartości, etykiety, wartości selektora i metadane `workflow_*`
  - zdarzenia modalne `view_submission` i `view_closed` z kierowanymi metadanymi kanału i danymi wejściowymi formularza

## Wskaźniki do dokumentacji referencyjnej konfiguracji

Główna dokumentacja referencyjna:

- [Dokumentacja referencyjna konfiguracji - Slack](/pl/gateway/configuration-reference#slack)

  Kluczowe pola Slack:
  - tryb/uwierzytelnianie: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - dostęp DM: `dm.enabled`, `dmPolicy`, `allowFrom` (starsze nazwy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - przełącznik zgodności: `dangerouslyAllowNameMatching` (tylko awaryjnie; pozostaw wyłączone, jeśli nie jest potrzebne)
  - dostęp do kanałów: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - wątki/historia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - dostarczanie: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - operacje/funkcje: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak odpowiedzi na kanałach">
    Sprawdź po kolei:

    - `groupPolicy`
    - lista dozwolonych kanałów (`channels.slack.channels`)
    - `requireMention`
    - lista dozwolonych `users` per kanał

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
    - `channels.slack.dmPolicy` (albo starsze `channels.slack.dm.policy`)
    - zatwierdzenia parowania / wpisy listy dozwolonych

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Tryb socket się nie łączy">
    Zweryfikuj tokeny bota i aplikacji oraz włączenie Socket Mode w ustawieniach aplikacji Slack.

    Jeśli `openclaw channels status --probe --json` pokazuje `botTokenStatus` albo
    `appTokenStatus: "configured_unavailable"`, konto Slack jest
    skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło rozwiązać wartości
    opartej na SecretRef.

  </Accordion>

  <Accordion title="Tryb HTTP nie odbiera zdarzeń">
    Zweryfikuj:

    - signing secret
    - ścieżkę webhook
    - adresy URL żądań Slack (Events + Interactivity + Slash Commands)
    - unikalny `webhookPath` dla każdego konta HTTP

    Jeśli `signingSecretStatus: "configured_unavailable"` pojawia się w migawkach
    konta, konto HTTP jest skonfigurowane, ale bieżące środowisko uruchomieniowe nie mogło
    rozwiązać signing secret opartego na SecretRef.

  </Accordion>

  <Accordion title="Natywne/polecenia slash nie działają">
    Sprawdź, czy zamierzałeś użyć:

    - natywnego trybu poleceń (`channels.slack.commands.native: true`) z pasującymi poleceniami slash zarejestrowanymi w Slack
    - albo trybu pojedynczego polecenia slash (`channels.slack.slashCommand.enabled: true`)

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
- [Polecenia slash](/pl/tools/slash-commands)
