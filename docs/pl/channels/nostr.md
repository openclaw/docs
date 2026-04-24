---
read_when:
    - Chcesz, aby OpenClaw odbierał wiadomości DM przez Nostr
    - Konfigurujesz zdecentralizowaną komunikację
summary: Kanał Nostr DM przez wiadomości szyfrowane NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-24T08:59:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f722bb4e1c5f2b3a9c1d58f5597aad2826a809cba3d165af7bf2faf72b68a0f
    source_path: channels/nostr.md
    workflow: 15
---

**Status:** Opcjonalny dołączony Plugin (domyślnie wyłączony do czasu skonfigurowania).

Nostr to zdecentralizowany protokół do sieci społecznościowych. Ten kanał umożliwia OpenClaw odbieranie i odpowiadanie na zaszyfrowane wiadomości bezpośrednie (DM) przez NIP-04.

## Dołączony Plugin

Obecne wydania OpenClaw dostarczają Nostr jako dołączony Plugin, więc zwykłe spakowane kompilacje nie wymagają osobnej instalacji.

### Starsze/niestandardowe instalacje

- Onboarding (`openclaw onboard`) i `openclaw channels add` nadal udostępniają
  Nostr ze współdzielonego katalogu kanałów.
- Jeśli Twoja kompilacja nie zawiera dołączonego Nostr, zainstaluj go ręcznie.

```bash
openclaw plugins install @openclaw/nostr
```

Użyj lokalnego checkoutu (przepływy pracy deweloperskiej):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Po zainstalowaniu lub włączeniu Pluginów uruchom ponownie Gateway.

### Konfiguracja nieinteraktywna

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Użyj `--use-env`, aby pozostawić `NOSTR_PRIVATE_KEY` w środowisku zamiast zapisywać klucz w konfiguracji.

## Szybka konfiguracja

1. Wygeneruj parę kluczy Nostr (jeśli to konieczne):

```bash
# Using nak
nak key generate
```

2. Dodaj do konfiguracji:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Wyeksportuj klucz:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Uruchom ponownie Gateway.

## Odwołanie do konfiguracji

| Klucz        | Typ      | Domyślnie                                  | Opis                                  |
| ------------ | -------- | ------------------------------------------ | ------------------------------------- |
| `privateKey` | string   | wymagane                                   | Klucz prywatny w formacie `nsec` lub hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL-e relayów (WebSocket)             |
| `dmPolicy`   | string   | `pairing`                                  | Zasada dostępu DM                     |
| `allowFrom`  | string[] | `[]`                                       | Dozwolone klucze publiczne nadawców   |
| `enabled`    | boolean  | `true`                                     | Włączanie/wyłączanie kanału           |
| `name`       | string   | -                                          | Nazwa wyświetlana                     |
| `profile`    | object   | -                                          | Metadane profilu NIP-01               |

## Metadane profilu

Dane profilu są publikowane jako zdarzenie NIP-01 `kind:0`. Możesz zarządzać nimi z interfejsu Control UI (Channels -> Nostr -> Profile) albo ustawić je bezpośrednio w konfiguracji.

Przykład:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Uwagi:

- URL-e profilu muszą używać `https://`.
- Importowanie z relayów scala pola i zachowuje lokalne nadpisania.

## Kontrola dostępu

### Zasady DM

- **pairing** (domyślnie): nieznani nadawcy otrzymują kod pairingu.
- **allowlist**: DM mogą wysyłać tylko klucze publiczne z `allowFrom`.
- **open**: publiczne przychodzące wiadomości DM (wymaga `allowFrom: ["*"]`).
- **disabled**: ignoruje przychodzące wiadomości DM.

Uwagi dotyczące egzekwowania:

- Podpisy zdarzeń przychodzących są weryfikowane przed zasadą nadawcy i odszyfrowaniem NIP-04, więc sfałszowane zdarzenia są wcześnie odrzucane.
- Odpowiedzi pairingu są wysyłane bez przetwarzania oryginalnej treści DM.
- Przychodzące wiadomości DM są ograniczane limitem szybkości, a zbyt duże ładunki są odrzucane przed odszyfrowaniem.

### Przykład listy dozwolonych

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Formaty kluczy

Akceptowane formaty:

- **Klucz prywatny:** `nsec...` lub 64-znakowy hex
- **Klucze publiczne (`allowFrom`):** `npub...` lub hex

## Relaye

Domyślnie: `relay.damus.io` i `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Wskazówki:

- Używaj 2–3 relayów dla nadmiarowości.
- Unikaj zbyt wielu relayów (opóźnienia, duplikacja).
- Płatne relaye mogą poprawić niezawodność.
- Lokalne relaye są odpowiednie do testów (`ws://localhost:7777`).

## Obsługa protokołu

| NIP    | Status      | Opis                                 |
| ------ | ----------- | ------------------------------------ |
| NIP-01 | Obsługiwane | Podstawowy format zdarzeń + metadane profilu |
| NIP-04 | Obsługiwane | Zaszyfrowane wiadomości DM (`kind:4`) |
| NIP-17 | Planowane   | Wiadomości DM w opakowaniu gift-wrap |
| NIP-44 | Planowane   | Wersjonowane szyfrowanie             |

## Testowanie

### Lokalny relay

```bash
# Start strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Test ręczny

1. Zanotuj klucz publiczny bota (npub) z logów.
2. Otwórz klienta Nostr (Damus, Amethyst itp.).
3. Wyślij DM do klucza publicznego bota.
4. Zweryfikuj odpowiedź.

## Rozwiązywanie problemów

### Wiadomości nie są odbierane

- Sprawdź, czy klucz prywatny jest prawidłowy.
- Upewnij się, że URL-e relayów są osiągalne i używają `wss://` (lub `ws://` lokalnie).
- Potwierdź, że `enabled` nie ma wartości `false`.
- Sprawdź logi Gateway pod kątem błędów połączenia z relayami.

### Odpowiedzi nie są wysyłane

- Sprawdź, czy relay akceptuje zapisy.
- Zweryfikuj łączność wychodzącą.
- Obserwuj limity szybkości relayów.

### Zduplikowane odpowiedzi

- To oczekiwane przy użyciu wielu relayów.
- Wiadomości są deduplikowane według identyfikatora zdarzenia; tylko pierwsze dostarczenie wyzwala odpowiedź.

## Security

- Nigdy nie commituj kluczy prywatnych.
- Używaj zmiennych środowiskowych dla kluczy.
- Rozważ `allowlist` dla botów produkcyjnych.
- Podpisy są weryfikowane przed zasadą nadawcy, a zasada nadawcy jest egzekwowana przed odszyfrowaniem, więc sfałszowane zdarzenia są wcześnie odrzucane, a nieznani nadawcy nie mogą wymusić pełnej pracy kryptograficznej.

## Ograniczenia (MVP)

- Tylko wiadomości bezpośrednie (bez czatów grupowych).
- Brak załączników multimedialnych.
- Tylko NIP-04 (NIP-17 gift-wrap jest planowany).

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ pairingu
- [Groups](/pl/channels/groups) — zachowanie czatu grupowego i ograniczanie wzmianek
- [Channel Routing](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
