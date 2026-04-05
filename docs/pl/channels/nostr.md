---
read_when:
    - Chcesz, aby OpenClaw odbierał wiadomości DM przez Nostr
    - Konfigurujesz zdecentralizowaną komunikację
summary: Kanał DM Nostr przez szyfrowane wiadomości NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-05T13:44:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82829ee66fbeb3367007af343797140049ea49f2e842a695fa56acea0c80728
    source_path: channels/nostr.md
    workflow: 15
---

# Nostr

**Status:** Opcjonalna wbudowana wtyczka (domyślnie wyłączona do czasu konfiguracji).

Nostr to zdecentralizowany protokół do sieci społecznościowych. Ten kanał umożliwia OpenClaw odbieranie i wysyłanie odpowiedzi na szyfrowane wiadomości bezpośrednie (DM) przez NIP-04.

## Wbudowana wtyczka

Aktualne wydania OpenClaw zawierają Nostr jako wbudowaną wtyczkę, więc zwykłe
spakowane kompilacje nie wymagają osobnej instalacji.

### Starsze/niestandardowe instalacje

- Onboarding (`openclaw onboard`) i `openclaw channels add` nadal pokazują
  Nostr ze współdzielonego katalogu kanałów.
- Jeśli Twoja kompilacja nie zawiera wbudowanego Nostr, zainstaluj go ręcznie.

```bash
openclaw plugins install @openclaw/nostr
```

Użyj lokalnego checkoutu (przepływy pracy deweloperskiej):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Po zainstalowaniu lub włączeniu wtyczek uruchom ponownie Gateway.

### Konfiguracja nieinteraktywna

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Użyj `--use-env`, aby pozostawić `NOSTR_PRIVATE_KEY` w zmiennych środowiskowych zamiast zapisywać klucz w konfiguracji.

## Szybka konfiguracja

1. Wygeneruj parę kluczy Nostr (w razie potrzeby):

```bash
# Używając nak
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

## Dokumentacja konfiguracji

| Klucz        | Typ      | Domyślnie                                   | Opis                                  |
| ------------ | -------- | ------------------------------------------- | ------------------------------------- |
| `privateKey` | string   | wymagane                                    | Klucz prywatny w formacie `nsec` lub hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL-e relayów (WebSocket)             |
| `dmPolicy`   | string   | `pairing`                                   | Polityka dostępu do DM                |
| `allowFrom`  | string[] | `[]`                                        | Dozwolone pubkeye nadawców            |
| `enabled`    | boolean  | `true`                                      | Włączenie/wyłączenie kanału           |
| `name`       | string   | -                                           | Nazwa wyświetlana                     |
| `profile`    | object   | -                                           | Metadane profilu NIP-01               |

## Metadane profilu

Dane profilu są publikowane jako zdarzenie NIP-01 `kind:0`. Możesz nimi zarządzać z interfejsu Control UI (Channels -> Nostr -> Profile) albo ustawić je bezpośrednio w konfiguracji.

Przykład:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Osobisty bot asystenta do wiadomości DM",
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

### Polityki DM

- **pairing** (domyślnie): nieznani nadawcy otrzymują kod parowania.
- **allowlist**: tylko pubkeye z `allowFrom` mogą wysyłać DM.
- **open**: publiczne przychodzące DM (wymaga `allowFrom: ["*"]`).
- **disabled**: ignoruj przychodzące DM.

Uwagi dotyczące egzekwowania:

- Podpisy zdarzeń przychodzących są weryfikowane przed polityką nadawcy i odszyfrowaniem NIP-04, więc sfałszowane zdarzenia są odrzucane wcześnie.
- Odpowiedzi parowania są wysyłane bez przetwarzania oryginalnej treści wiadomości DM.
- Przychodzące DM są ograniczane limitami szybkości, a zbyt duże payloady są odrzucane przed odszyfrowaniem.

### Przykład allowlisty

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
- **Pubkeye (`allowFrom`):** `npub...` lub hex

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

- Używaj 2–3 relayów dla redundancji.
- Unikaj zbyt wielu relayów (opóźnienia, duplikacja).
- Płatne relaye mogą poprawić niezawodność.
- Lokalne relaye nadają się do testów (`ws://localhost:7777`).

## Obsługa protokołu

| NIP    | Status      | Opis                                   |
| ------ | ----------- | -------------------------------------- |
| NIP-01 | Obsługiwane | Podstawowy format zdarzeń + metadane profilu |
| NIP-04 | Obsługiwane | Szyfrowane DM (`kind:4`)               |
| NIP-17 | Planowane   | DM opakowane jako gift-wrap            |
| NIP-44 | Planowane   | Wersjonowane szyfrowanie               |

## Testowanie

### Lokalny relay

```bash
# Uruchom strfry
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

1. Zanotuj pubkey bota (npub) z logów.
2. Otwórz klienta Nostr (Damus, Amethyst itp.).
3. Wyślij DM do pubkeya bota.
4. Zweryfikuj odpowiedź.

## Rozwiązywanie problemów

### Nie odbiera wiadomości

- Sprawdź, czy klucz prywatny jest prawidłowy.
- Upewnij się, że URL-e relayów są osiągalne i używają `wss://` (lub `ws://` lokalnie).
- Potwierdź, że `enabled` nie ma wartości `false`.
- Sprawdź logi Gateway pod kątem błędów połączenia z relayami.

### Nie wysyła odpowiedzi

- Sprawdź, czy relay akceptuje zapisy.
- Zweryfikuj łączność wychodzącą.
- Obserwuj limity szybkości narzucane przez relaye.

### Zduplikowane odpowiedzi

- To oczekiwane przy użyciu wielu relayów.
- Wiadomości są deduplikowane według identyfikatora zdarzenia; tylko pierwsze dostarczenie wywołuje odpowiedź.

## Bezpieczeństwo

- Nigdy nie commituj kluczy prywatnych.
- Używaj zmiennych środowiskowych dla kluczy.
- Rozważ `allowlist` dla botów produkcyjnych.
- Podpisy są weryfikowane przed polityką nadawcy, a polityka nadawcy jest egzekwowana przed odszyfrowaniem, więc sfałszowane zdarzenia są wcześnie odrzucane, a nieznani nadawcy nie mogą wymusić pełnej pracy kryptograficznej.

## Ograniczenia (MVP)

- Tylko wiadomości bezpośrednie (bez czatów grupowych).
- Brak załączników multimedialnych.
- Tylko NIP-04 (NIP-17 gift-wrap jest planowany).

## Powiązane

- [Channels Overview](/channels) — wszystkie obsługiwane kanały
- [Pairing](/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Groups](/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Channel Routing](/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/gateway/security) — model dostępu i utwardzanie
