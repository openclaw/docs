---
read_when:
    - Konfigurowanie integracji czatu Twitch dla OpenClaw
summary: Konfiguracja i ustawienia bota czatu Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-24T09:00:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

Obsługa czatu Twitch przez połączenie IRC. OpenClaw łączy się jako użytkownik Twitch (konto bota), aby odbierać i wysyłać wiadomości na kanałach.

## Dołączony Plugin

Twitch jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Twitch, zainstaluj
go ręcznie:

Instalacja przez CLI (rejestr npm):

```bash
openclaw plugins install @openclaw/twitch
```

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że Plugin Twitch jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Utwórz dedykowane konto Twitch dla bota (lub użyj istniejącego konta).
3. Wygeneruj poświadczenia: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Wybierz **Bot Token**
   - Sprawdź, czy zaznaczone są zakresy `chat:read` i `chat:write`
   - Skopiuj **Client ID** i **Access Token**
4. Znajdź swój identyfikator użytkownika Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Skonfiguruj token:
   - Zmienna środowiskowa: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (tylko konto domyślne)
   - Albo konfiguracja: `channels.twitch.accessToken`
   - Jeśli ustawione są oba, konfiguracja ma pierwszeństwo (fallback do zmiennej środowiskowej dotyczy tylko konta domyślnego).
6. Uruchom gateway.

**⚠️ Ważne:** Dodaj kontrolę dostępu (`allowFrom` lub `allowedRoles`), aby zapobiec wyzwalaniu bota przez nieuprawnionych użytkowników. `requireMention` domyślnie ma wartość `true`.

Minimalna konfiguracja:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Konto Twitch bota
      accessToken: "oauth:abc123...", // Token dostępu OAuth (lub użyj zmiennej środowiskowej OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID z Token Generator
      channel: "vevisk", // Z którym czatem kanału Twitch się połączyć (wymagane)
      allowFrom: ["123456789"], // (zalecane) tylko Twój identyfikator użytkownika Twitch — pobierz go z https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Czym to jest

- Kanał Twitch należący do Gateway.
- Deterministyczny routing: odpowiedzi zawsze wracają do Twitch.
- Każde konto mapuje się na izolowany klucz sesji `agent:<agentId>:twitch:<accountName>`.
- `username` to konto bota (które się uwierzytelnia), a `channel` to czat, do którego ma dołączyć.

## Konfiguracja (szczegółowo)

### Generowanie poświadczeń

Użyj [Twitch Token Generator](https://twitchtokengenerator.com/):

- Wybierz **Bot Token**
- Sprawdź, czy zaznaczone są zakresy `chat:read` i `chat:write`
- Skopiuj **Client ID** i **Access Token**

Ręczna rejestracja aplikacji nie jest wymagana. Tokeny wygasają po kilku godzinach.

### Konfigurowanie bota

**Zmienna środowiskowa (tylko konto domyślne):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Albo konfiguracja:**

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

Jeśli ustawione są zarówno zmienna środowiskowa, jak i konfiguracja, konfiguracja ma pierwszeństwo.

### Kontrola dostępu (zalecane)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (zalecane) tylko Twój identyfikator użytkownika Twitch
    },
  },
}
```

W przypadku twardej listy dozwolonych preferuj `allowFrom`. Użyj zamiast tego `allowedRoles`, jeśli chcesz dostępu opartego na rolach.

**Dostępne role:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Dlaczego identyfikatory użytkowników?** Nazwy użytkowników mogą się zmieniać, co umożliwia podszywanie się. Identyfikatory użytkowników są stałe.

Znajdź swój identyfikator użytkownika Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (zamień swoją nazwę użytkownika Twitch na ID)

## Odświeżanie tokenu (opcjonalnie)

Tokenów z [Twitch Token Generator](https://twitchtokengenerator.com/) nie można automatycznie odświeżać — wygeneruj je ponownie po wygaśnięciu.

Aby mieć automatyczne odświeżanie tokenu, utwórz własną aplikację Twitch w [Twitch Developer Console](https://dev.twitch.tv/console) i dodaj do konfiguracji:

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

Użyj `channels.twitch.accounts` z tokenami dla poszczególnych kont. Wspólny wzorzec znajdziesz w [`gateway/configuration`](/pl/gateway/configuration).

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

**Uwaga:** Każde konto potrzebuje własnego tokenu (jeden token na kanał).

## Kontrola dostępu

### Ograniczenia oparte na rolach

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

### Lista dozwolonych według identyfikatora użytkownika (najbezpieczniejsza)

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

### Dostęp oparty na rolach (alternatywa)

`allowFrom` to twarda lista dozwolonych. Gdy jest ustawione, dozwolone są tylko te identyfikatory użytkowników.
Jeśli chcesz dostępu opartego na rolach, pozostaw `allowFrom` nieustawione i skonfiguruj zamiast tego `allowedRoles`:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### Wyłączenie wymagania @wzmianki

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

## Rozwiązywanie problemów

Najpierw uruchom polecenia diagnostyczne:

```bash
openclaw doctor
openclaw channels status --probe
```

### Bot nie odpowiada na wiadomości

**Sprawdź kontrolę dostępu:** upewnij się, że Twój identyfikator użytkownika jest w `allowFrom`, albo tymczasowo usuń
`allowFrom` i ustaw `allowedRoles: ["all"]`, aby przetestować.

**Sprawdź, czy bot jest na kanale:** bot musi dołączyć do kanału określonego w `channel`.

### Problemy z tokenem

**„Failed to connect” lub błędy uwierzytelniania:**

- Sprawdź, czy `accessToken` to wartość tokenu dostępu OAuth (zwykle zaczyna się od prefiksu `oauth:`)
- Sprawdź, czy token ma zakresy `chat:read` i `chat:write`
- Jeśli używasz odświeżania tokenu, sprawdź, czy ustawiono `clientSecret` i `refreshToken`

### Odświeżanie tokenu nie działa

**Sprawdź logi pod kątem zdarzeń odświeżania:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Jeśli widzisz „token refresh disabled (no refresh token)”:

- Upewnij się, że podano `clientSecret`
- Upewnij się, że podano `refreshToken`

## Konfiguracja

**Konfiguracja konta:**

- `username` - nazwa użytkownika bota
- `accessToken` - token dostępu OAuth z `chat:read` i `chat:write`
- `clientId` - Twitch Client ID (z Token Generator lub Twojej aplikacji)
- `channel` - kanał, do którego ma dołączyć (wymagane)
- `enabled` - włącza to konto (domyślnie: `true`)
- `clientSecret` - opcjonalne: do automatycznego odświeżania tokenu
- `refreshToken` - opcjonalne: do automatycznego odświeżania tokenu
- `expiresIn` - czas wygaśnięcia tokenu w sekundach
- `obtainmentTimestamp` - znacznik czasu uzyskania tokenu
- `allowFrom` - lista dozwolonych identyfikatorów użytkowników
- `allowedRoles` - kontrola dostępu oparta na rolach (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - wymaga @wzmianki (domyślnie: `true`)

**Opcje providera:**

- `channels.twitch.enabled` - włącza/wyłącza uruchamianie kanału
- `channels.twitch.username` - nazwa użytkownika bota (uproszczona konfiguracja jednego konta)
- `channels.twitch.accessToken` - token dostępu OAuth (uproszczona konfiguracja jednego konta)
- `channels.twitch.clientId` - Twitch Client ID (uproszczona konfiguracja jednego konta)
- `channels.twitch.channel` - kanał, do którego ma dołączyć (uproszczona konfiguracja jednego konta)
- `channels.twitch.accounts.<accountName>` - konfiguracja wielu kont (wszystkie pola konta powyżej)

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

- `send` - wysyłanie wiadomości na kanał

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

- **Traktuj tokeny jak hasła** - nigdy nie commituj tokenów do git
- **Używaj automatycznego odświeżania tokenu** dla długo działających botów
- **Używaj list dozwolonych według identyfikatora użytkownika** zamiast nazw użytkowników do kontroli dostępu
- **Monitoruj logi** pod kątem zdarzeń odświeżania tokenu i stanu połączenia
- **Minimalizuj zakresy tokenów** - żądaj tylko `chat:read` i `chat:write`
- **Jeśli utkniesz**: uruchom ponownie gateway po potwierdzeniu, że żaden inny proces nie posiada sesji

## Limity

- **500 znaków** na wiadomość (automatyczny podział na granicach słów)
- Markdown jest usuwany przed podziałem
- Brak ograniczania szybkości (używa wbudowanych limitów szybkości Twitch)

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
