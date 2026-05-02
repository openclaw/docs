---
read_when:
    - Konfigurowanie integracji czatu Twitch z OpenClaw
sidebarTitle: Twitch
summary: Konfiguracja i uruchomienie bota czatu Twitch
title: Twitch
x-i18n:
    generated_at: "2026-05-02T22:16:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
---

Obsługa czatu Twitch przez połączenie IRC. OpenClaw łączy się jako użytkownik Twitch (konto bota), aby odbierać i wysyłać wiadomości na kanałach.

## Dołączony Plugin

<Note>
Twitch jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe kompilacje pakietowe nie wymagają osobnej instalacji.
</Note>

Jeśli używasz starszej kompilacji albo instalacji niestandardowej, która wyklucza Twitch, zainstaluj pakiet npm bezpośrednio:

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

Użyj samego pakietu, aby podążać za bieżącym oficjalnym tagiem wydania. Przypnij dokładną
wersję tylko wtedy, gdy potrzebujesz odtwarzalnej instalacji.

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja (dla początkujących)

<Steps>
  <Step title="Upewnij się, że Plugin jest dostępny">
    Bieżące pakietowe wydania OpenClaw już go zawierają. Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
  </Step>
  <Step title="Utwórz konto bota Twitch">
    Utwórz dedykowane konto Twitch dla bota (albo użyj istniejącego konta).
  </Step>
  <Step title="Wygeneruj dane uwierzytelniające">
    Użyj [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Wybierz **Bot Token**
    - Sprawdź, czy wybrane są zakresy `chat:read` i `chat:write`
    - Skopiuj **Client ID** i **Access Token**

  </Step>
  <Step title="Znajdź swój identyfikator użytkownika Twitch">
    Użyj [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), aby przekonwertować nazwę użytkownika na identyfikator użytkownika Twitch.
  </Step>
  <Step title="Skonfiguruj token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (tylko konto domyślne)
    - Albo konfiguracja: `channels.twitch.accessToken`

    Jeśli ustawiono oba, konfiguracja ma pierwszeństwo (awaryjne użycie env dotyczy tylko konta domyślnego).

  </Step>
  <Step title="Uruchom gateway">
    Uruchom gateway ze skonfigurowanym kanałem.
  </Step>
</Steps>

<Warning>
Dodaj kontrolę dostępu (`allowFrom` lub `allowedRoles`), aby uniemożliwić nieuprawnionym użytkownikom wyzwalanie bota. `requireMention` domyślnie ma wartość `true`.
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
- Deterministyczne kierowanie: odpowiedzi zawsze wracają do Twitch.
- Każde konto mapuje się na izolowany klucz sesji `agent:<agentId>:twitch:<accountName>`.
- `username` to konto bota (to, które się uwierzytelnia), a `channel` to pokój czatu, do którego należy dołączyć.

## Konfiguracja (szczegółowa)

### Wygeneruj dane uwierzytelniające

Użyj [Twitch Token Generator](https://twitchtokengenerator.com/):

- Wybierz **Bot Token**
- Sprawdź, czy wybrane są zakresy `chat:read` i `chat:write`
- Skopiuj **Client ID** i **Access Token**

<Note>
Ręczna rejestracja aplikacji nie jest potrzebna. Tokeny wygasają po kilku godzinach.
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

Preferuj `allowFrom` jako ścisłą listę dozwolonych. Zamiast tego użyj `allowedRoles`, jeśli chcesz kontroli dostępu opartej na rolach.

**Dostępne role:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Dlaczego identyfikatory użytkowników?** Nazwy użytkowników mogą się zmieniać, co umożliwia podszywanie się. Identyfikatory użytkowników są stałe.

Znajdź swój identyfikator użytkownika Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (przekonwertuj swoją nazwę użytkownika Twitch na identyfikator)
</Note>

## Odświeżanie tokenu (opcjonalne)

Tokenów z [Twitch Token Generator](https://twitchtokengenerator.com/) nie można odświeżać automatycznie - wygeneruj je ponownie po wygaśnięciu.

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

Bot automatycznie odświeża tokeny przed wygaśnięciem i zapisuje zdarzenia odświeżania w logach.

## Obsługa wielu kont

Użyj `channels.twitch.accounts` z tokenami dla poszczególnych kont. Wspólny wzorzec opisano w sekcji [Konfiguracja](/pl/gateway/configuration).

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
Każde konto potrzebuje własnego tokenu (jeden token na kanał).
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

    `allowFrom` to ścisła lista dozwolonych. Gdy jest ustawiona, dozwolone są tylko te identyfikatory użytkowników. Jeśli chcesz dostępu opartego na rolach, pozostaw `allowFrom` nieustawione i zamiast tego skonfiguruj `allowedRoles`.

  </Tab>
  <Tab title="Wyłącz wymaganie @wzmianki">
    Domyślnie `requireMention` ma wartość `true`. Aby wyłączyć to ustawienie i odpowiadać na wszystkie wiadomości:

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
    "Nie udało się połączyć" lub błędy uwierzytelniania:

    - Sprawdź, czy `accessToken` jest wartością tokenu dostępu OAuth (zwykle zaczyna się od prefiksu `oauth:`)
    - Sprawdź, czy token ma zakresy `chat:read` i `chat:write`
    - Jeśli używasz odświeżania tokenu, sprawdź, czy ustawiono `clientSecret` i `refreshToken`

  </Accordion>
  <Accordion title="Odświeżanie tokenu nie działa">
    Sprawdź logi pod kątem zdarzeń odświeżania:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Jeśli widzisz "token refresh disabled (no refresh token)":

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
  Twitch Client ID (z Token Generator lub Twojej aplikacji).
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
- `channels.twitch.clientId` - Twitch Client ID (uproszczona konfiguracja jednego konta)
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

- **Traktuj tokeny jak hasła** — nigdy nie commituj tokenów do git.
- **Używaj automatycznego odświeżania tokenów** dla długo działających botów.
- **Używaj list dozwolonych identyfikatorów użytkowników** zamiast nazw użytkowników do kontroli dostępu.
- **Monitoruj logi** pod kątem zdarzeń odświeżania tokenu i stanu połączenia.
- **Ogranicz zakres tokenów do minimum** — żądaj tylko `chat:read` i `chat:write`.
- **Jeśli utkniesz**: uruchom ponownie gateway po potwierdzeniu, że żaden inny proces nie jest właścicielem sesji.

## Limity

- **500 znaków** na wiadomość (automatycznie dzielone na fragmenty na granicach słów).
- Markdown jest usuwany przed dzieleniem na fragmenty.
- Brak ograniczania częstotliwości (używa wbudowanych limitów Twitch).

## Powiązane

- [Kierowanie kanałów](/pl/channels/channel-routing) — kierowanie sesji dla wiadomości
- [Omówienie kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
