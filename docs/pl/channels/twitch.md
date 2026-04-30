---
read_when:
    - Konfigurowanie integracji czatu Twitch z OpenClaw
sidebarTitle: Twitch
summary: Konfiguracja i przygotowanie bota czatu Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-30T09:40:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

Obsługa czatu Twitch przez połączenie IRC. OpenClaw łączy się jako użytkownik Twitch (konto bota), aby odbierać i wysyłać wiadomości na kanałach.

## Dołączony Plugin

<Note>
Twitch jest dostarczany jako dołączony Plugin w obecnych wydaniach OpenClaw, więc normalne pakietowane kompilacje nie wymagają osobnej instalacji.
</Note>

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która wyklucza Twitch, zainstaluj aktualny pakiet npm, gdy zostanie opublikowany:

<Tabs>
  <Tab title="rejestr npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Lokalny checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały, użyj aktualnej pakietowanej kompilacji OpenClaw albo ścieżki lokalnego checkoutu, dopóki nie zostanie opublikowany nowszy pakiet npm.

Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja (dla początkujących)

<Steps>
  <Step title="Upewnij się, że Plugin jest dostępny">
    Obecne pakietowane wydania OpenClaw już go zawierają. Starsze lub niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
  </Step>
  <Step title="Utwórz konto bota Twitch">
    Utwórz dedykowane konto Twitch dla bota (albo użyj istniejącego konta).
  </Step>
  <Step title="Wygeneruj dane uwierzytelniające">
    Użyj [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Wybierz **Bot Token**
    - Sprawdź, czy zakresy `chat:read` i `chat:write` są wybrane
    - Skopiuj **Client ID** i **Access Token**

  </Step>
  <Step title="Znajdź swój identyfikator użytkownika Twitch">
    Użyj [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), aby przekonwertować nazwę użytkownika na identyfikator użytkownika Twitch.
  </Step>
  <Step title="Skonfiguruj token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (tylko konto domyślne)
    - Albo konfiguracja: `channels.twitch.accessToken`

    Jeśli ustawiono oba, konfiguracja ma pierwszeństwo (fallback env dotyczy tylko konta domyślnego).

  </Step>
  <Step title="Uruchom gateway">
    Uruchom gateway ze skonfigurowanym kanałem.
  </Step>
</Steps>

<Warning>
Dodaj kontrolę dostępu (`allowFrom` lub `allowedRoles`), aby uniemożliwić nieautoryzowanym użytkownikom wyzwalanie bota. `requireMention` domyślnie ma wartość `true`.
</Warning>

Minimalna konfiguracja:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Czym to jest

- Kanał Twitch należący do Gateway.
- Deterministyczne routowanie: odpowiedzi zawsze wracają do Twitch.
- Każde konto jest mapowane na izolowany klucz sesji `agent:<agentId>:twitch:<accountName>`.
- `username` to konto bota (które się uwierzytelnia), a `channel` wskazuje pokój czatu, do którego należy dołączyć.

## Konfiguracja (szczegółowa)

### Wygeneruj dane uwierzytelniające

Użyj [Twitch Token Generator](https://twitchtokengenerator.com/):

- Wybierz **Bot Token**
- Sprawdź, czy zakresy `chat:read` i `chat:write` są wybrane
- Skopiuj **Client ID** i **Access Token**

<Note>
Nie jest wymagana ręczna rejestracja aplikacji. Tokeny wygasają po kilku godzinach.
</Note>

### Skonfiguruj bota

<Tabs>
  <Tab title="Zmienna env (tylko konto domyślne)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Konfiguracja">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

Jeśli ustawiono zarówno env, jak i konfigurację, konfiguracja ma pierwszeństwo.

### Kontrola dostępu (zalecana)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Preferuj `allowFrom` jako twardą listę dozwolonych. Użyj zamiast tego `allowedRoles`, jeśli chcesz dostępu opartego na rolach.

**Dostępne role:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Dlaczego identyfikatory użytkowników?** Nazwy użytkowników mogą się zmieniać, co umożliwia podszywanie się. Identyfikatory użytkowników są trwałe.

Znajdź swój identyfikator użytkownika Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (przekonwertuj swoją nazwę użytkownika Twitch na identyfikator)
</Note>

## Odświeżanie tokenu (opcjonalne)

Tokenów z [Twitch Token Generator](https://twitchtokengenerator.com/) nie można automatycznie odświeżać - wygeneruj je ponownie po wygaśnięciu.

Aby automatycznie odświeżać token, utwórz własną aplikację Twitch w [Twitch Developer Console](https://dev.twitch.tv/console) i dodaj do konfiguracji:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Bot automatycznie odświeża tokeny przed wygaśnięciem i zapisuje zdarzenia odświeżenia w logach.

## Obsługa wielu kont

Użyj `channels.twitch.accounts` z tokenami przypisanymi do kont. Zobacz [Konfigurację](/pl/gateway/configuration), aby poznać wspólny wzorzec.

Przykład (jedno konto bota na dwóch kanałach):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
Każde konto wymaga własnego tokenu (jeden token na kanał).
</Note>

## Kontrola dostępu

<Tabs>
  <Tab title="Lista dozwolonych identyfikatorów użytkowników (najbezpieczniejsza)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Oparta na rolach">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom` to bezwzględna lista dozwolonych. Gdy jest ustawiona, dozwolone są tylko te identyfikatory użytkowników. Jeśli chcesz używać dostępu opartego na rolach, pozostaw `allowFrom` nieustawione i skonfiguruj zamiast tego `allowedRoles`.

  </Tab>
  <Tab title="Wyłącz wymaganie @wzmianki">
    Domyślnie `requireMention` ma wartość `true`. Aby je wyłączyć i odpowiadać na wszystkie wiadomości:

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Rozwiązywanie problemów

Najpierw uruchom polecenia diagnostyczne:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot nie odpowiada na wiadomości">
    - **Sprawdź kontrolę dostępu:** Upewnij się, że Twój identyfikator użytkownika znajduje się w `allowFrom`, albo tymczasowo usuń `allowFrom` i ustaw `allowedRoles: ["all"]`, aby przetestować.
    - **Sprawdź, czy bot jest na kanale:** Bot musi dołączyć do kanału określonego w `channel`.

  </Accordion>
  <Accordion title="Problemy z tokenem">
    Błędy „Failed to connect” lub błędy uwierzytelniania:

    - Sprawdź, czy `accessToken` jest wartością tokenu dostępu OAuth (zwykle zaczyna się od prefiksu `oauth:`)
    - Sprawdź, czy token ma zakresy `chat:read` i `chat:write`
    - Jeśli używasz odświeżania tokenu, sprawdź, czy ustawiono `clientSecret` i `refreshToken`

  </Accordion>
  <Accordion title="Odświeżanie tokenu nie działa">
    Sprawdź w logach zdarzenia odświeżania:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Jeśli widzisz „token refresh disabled (no refresh token)”:

    - Upewnij się, że podano `clientSecret`
    - Upewnij się, że podano `refreshToken`

  </Accordion>
</AccordionGroup>

## Konfiguracja

### Konfiguracja konta

<ParamField path="username" type="string">
  Nazwa użytkownika bota.
</ParamField>
<ParamField path="accessToken" type="string">
  Token dostępu OAuth z `chat:read` i `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Identyfikator klienta Twitch (z generatora tokenów lub Twojej aplikacji).
</ParamField>
<ParamField path="channel" type="string" required>
  Kanał, do którego należy dołączyć.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Włącz to konto.
</ParamField>
<ParamField path="clientSecret" type="string">
  Opcjonalnie: do automatycznego odświeżania tokenu.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opcjonalnie: do automatycznego odświeżania tokenu.
</ParamField>
<ParamField path="expiresIn" type="number">
  Wygaśnięcie tokenu w sekundach.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Znacznik czasu uzyskania tokenu.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Lista dozwolonych identyfikatorów użytkowników.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Kontrola dostępu oparta na rolach.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Wymagaj @wzmianki.
</ParamField>

### Opcje dostawcy

- `channels.twitch.enabled` - Włącz/wyłącz uruchamianie kanału
- `channels.twitch.username` - Nazwa użytkownika bota (uproszczona konfiguracja jednego konta)
- `channels.twitch.accessToken` - Token dostępu OAuth (uproszczona konfiguracja jednego konta)
- `channels.twitch.clientId` - Identyfikator klienta Twitch (uproszczona konfiguracja jednego konta)
- `channels.twitch.channel` - Kanał, do którego należy dołączyć (uproszczona konfiguracja jednego konta)
- `channels.twitch.accounts.<accountName>` - Konfiguracja wielu kont (wszystkie pola konta powyżej)

Pełny przykład:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Akcje narzędzia

Agent może wywołać `twitch` z akcją:

- `send` - Wyślij wiadomość do kanału

Przykład:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Bezpieczeństwo i operacje

- **Traktuj tokeny jak hasła** — Nigdy nie zapisuj tokenów w git.
- **Używaj automatycznego odświeżania tokenów** dla długo działających botów.
- **Używaj list dozwolonych identyfikatorów użytkowników** zamiast nazw użytkowników do kontroli dostępu.
- **Monitoruj logi** pod kątem zdarzeń odświeżania tokenów i stanu połączenia.
- **Minimalizuj zakresy tokenów** — Żądaj tylko `chat:read` i `chat:write`.
- **Jeśli utkniesz**: Uruchom ponownie Gateway po potwierdzeniu, że żaden inny proces nie posiada sesji.

## Limity

- **500 znaków** na wiadomość (automatycznie dzielone na fragmenty na granicach słów).
- Markdown jest usuwany przed dzieleniem na fragmenty.
- Brak ograniczania szybkości (używa wbudowanych limitów Twitch).

## Powiązane

- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i blokada wzmiankami
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
