---
read_when:
    - Konfigurowanie integracji czatu Twitch dla OpenClaw
sidebarTitle: Twitch
summary: Konfiguracja i konfiguracja bota czatu Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

Obsługa czatu Twitch przez połączenie IRC. OpenClaw łączy się jako użytkownik Twitch (konto bota), aby odbierać i wysyłać wiadomości na kanałach.

## Bundled Plugin

<Note>
Twitch jest dostarczany jako bundled Plugin w aktualnych wydaniach OpenClaw, więc zwykłe spakowane buildy nie wymagają osobnej instalacji.
</Note>

Jeśli używasz starszego buildu lub niestandardowej instalacji, która nie zawiera Twitch, zainstaluj go ręcznie:

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

Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja (dla początkujących)

<Steps>
  <Step title="Upewnij się, że Plugin jest dostępny">
    Aktualne spakowane wydania OpenClaw już go zawierają. Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
  </Step>
  <Step title="Utwórz konto bota Twitch">
    Utwórz dedykowane konto Twitch dla bota (lub użyj istniejącego konta).
  </Step>
  <Step title="Wygeneruj poświadczenia">
    Użyj [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Wybierz **Bot Token**
    - Upewnij się, że zaznaczono zakresy `chat:read` i `chat:write`
    - Skopiuj **Client ID** i **Access Token**

  </Step>
  <Step title="Znajdź swój identyfikator użytkownika Twitch">
    Użyj [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), aby przekonwertować nazwę użytkownika na identyfikator użytkownika Twitch.
  </Step>
  <Step title="Skonfiguruj token">
    - Zmienna env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (tylko konto domyślne)
    - Lub konfiguracja: `channels.twitch.accessToken`

    Jeśli ustawione są oba, konfiguracja ma pierwszeństwo (fallback do env działa tylko dla konta domyślnego).

  </Step>
  <Step title="Uruchom Gateway">
    Uruchom Gateway z skonfigurowanym kanałem.
  </Step>
</Steps>

<Warning>
Dodaj kontrolę dostępu (`allowFrom` lub `allowedRoles`), aby zapobiec uruchamianiu bota przez nieautoryzowanych użytkowników. `requireMention` domyślnie ma wartość `true`.
</Warning>

Minimalna konfiguracja:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Konto Twitch bota
      accessToken: "oauth:abc123...", // OAuth Access Token (lub użyj zmiennej env OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID z Token Generator
      channel: "vevisk", // Do którego kanału czatu Twitch dołączyć (wymagane)
      allowFrom: ["123456789"], // (zalecane) Tylko Twój identyfikator użytkownika Twitch - pobierz go z https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Czym to jest

- Kanał Twitch należący do Gateway.
- Deterministyczne routowanie: odpowiedzi zawsze wracają do Twitch.
- Każde konto jest mapowane do izolowanego klucza sesji `agent:<agentId>:twitch:<accountName>`.
- `username` to konto bota (które się uwierzytelnia), a `channel` to pokój czatu, do którego ma dołączyć.

## Konfiguracja (szczegółowo)

### Wygeneruj poświadczenia

Użyj [Twitch Token Generator](https://twitchtokengenerator.com/):

- Wybierz **Bot Token**
- Upewnij się, że zaznaczono zakresy `chat:read` i `chat:write`
- Skopiuj **Client ID** i **Access Token**

<Note>
Ręczna rejestracja aplikacji nie jest wymagana. Tokeny wygasają po kilku godzinach.
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

Jeśli ustawione są zarówno env, jak i konfiguracja, konfiguracja ma pierwszeństwo.

### Kontrola dostępu (zalecane)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (zalecane) Tylko Twój identyfikator użytkownika Twitch
    },
  },
}
```

Preferuj `allowFrom` dla twardej listy dozwolonych. Użyj zamiast tego `allowedRoles`, jeśli chcesz dostępu opartego na rolach.

**Dostępne role:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Dlaczego identyfikatory użytkownika?** Nazwy użytkownika mogą się zmieniać, co umożliwia podszywanie się. Identyfikatory użytkownika są trwałe.

Znajdź swój identyfikator użytkownika Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Przekonwertuj swoją nazwę użytkownika Twitch na ID)
</Note>

## Odświeżanie tokena (opcjonalne)

Tokenów z [Twitch Token Generator](https://twitchtokengenerator.com/) nie można automatycznie odświeżać — wygeneruj je ponownie po wygaśnięciu.

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

Użyj `channels.twitch.accounts` z tokenami per konto. Zobacz [Configuration](/pl/gateway/configuration), aby poznać wspólny wzorzec.

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
Każde konto potrzebuje własnego tokena (jeden token na kanał).
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

    `allowFrom` to twarda lista dozwolonych. Gdy jest ustawione, dozwolone są tylko te identyfikatory użytkowników. Jeśli chcesz dostępu opartego na rolach, pozostaw `allowFrom` bez ustawienia i zamiast tego skonfiguruj `allowedRoles`.

  </Tab>
  <Tab title="Wyłącz wymaganie @mention">
    Domyślnie `requireMention` ma wartość `true`. Aby to wyłączyć i odpowiadać na wszystkie wiadomości:

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
    „Nie udało się połączyć” lub błędy uwierzytelniania:

    - Upewnij się, że `accessToken` jest wartością OAuth access tokena (zwykle zaczyna się od prefiksu `oauth:`)
    - Sprawdź, czy token ma zakresy `chat:read` i `chat:write`
    - Jeśli używasz odświeżania tokena, upewnij się, że ustawiono `clientSecret` i `refreshToken`

  </Accordion>
  <Accordion title="Odświeżanie tokena nie działa">
    Sprawdź logi pod kątem zdarzeń odświeżania:

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
  OAuth access token z zakresami `chat:read` i `chat:write`.
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
  Opcjonalne: do automatycznego odświeżania tokena.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opcjonalne: do automatycznego odświeżania tokena.
</ParamField>
<ParamField path="expiresIn" type="number">
  Czas wygaśnięcia tokena w sekundach.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Znacznik czasu uzyskania tokena.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Lista dozwolonych identyfikatorów użytkowników.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Kontrola dostępu oparta na rolach.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Wymagaj @mention.
</ParamField>

### Opcje dostawcy

- `channels.twitch.enabled` - Włącz/wyłącz uruchamianie kanału
- `channels.twitch.username` - Nazwa użytkownika bota (uproszczona konfiguracja pojedynczego konta)
- `channels.twitch.accessToken` - OAuth access token (uproszczona konfiguracja pojedynczego konta)
- `channels.twitch.clientId` - Twitch Client ID (uproszczona konfiguracja pojedynczego konta)
- `channels.twitch.channel` - Kanał, do którego należy dołączyć (uproszczona konfiguracja pojedynczego konta)
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

## Działania narzędzia

Agent może wywołać `twitch` z akcją:

- `send` - Wyślij wiadomość na kanał

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

- **Traktuj tokeny jak hasła** — Nigdy nie commituj tokenów do git.
- **Używaj automatycznego odświeżania tokena** w przypadku długo działających botów.
- **Używaj list dozwolonych identyfikatorów użytkowników** zamiast nazw użytkowników do kontroli dostępu.
- **Monitoruj logi** pod kątem zdarzeń odświeżania tokena i stanu połączenia.
- **Ogranicz zakresy tokena do minimum** — żądaj tylko `chat:read` i `chat:write`.
- **Jeśli utkniesz**: uruchom ponownie Gateway po potwierdzeniu, że żaden inny proces nie jest właścicielem sesji.

## Ograniczenia

- **500 znaków** na wiadomość (automatyczny podział na granicach słów).
- Markdown jest usuwany przed podziałem.
- Brak ograniczania szybkości (używane są wbudowane limity szybkości Twitch).

## Powiązane

- [Channel Routing](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Groups](/pl/channels/groups) — zachowanie czatu grupowego i blokowanie przez wzmianki
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
