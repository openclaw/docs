---
read_when:
    - Chcesz, aby OpenClaw odbierał wiadomości prywatne za pośrednictwem Nostr
    - Konfigurujesz zdecentralizowaną komunikację
summary: Kanał DM Nostr za pomocą wiadomości szyfrowanych NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-30T09:38:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**Status:** Opcjonalny dołączony plugin (domyślnie wyłączony do czasu skonfigurowania).

Nostr to zdecentralizowany protokół sieci społecznościowych. Ten kanał umożliwia OpenClaw odbieranie zaszyfrowanych wiadomości bezpośrednich (DM) i odpowiadanie na nie przez NIP-04.

## Dołączony plugin

Bieżące wydania OpenClaw dostarczają Nostr jako dołączony plugin, więc standardowe spakowane
buildy nie wymagają osobnej instalacji.

### Starsze/niestandardowe instalacje

- Onboarding (`openclaw onboard`) i `openclaw channels add` nadal pokazują
  Nostr ze współdzielonego katalogu kanałów.
- Jeśli Twój build wyklucza dołączony Nostr, zainstaluj bieżący pakiet npm, gdy
  zostanie opublikowany.

```bash
openclaw plugins install @openclaw/nostr
```

Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały, użyj bieżącego spakowanego
buildu OpenClaw albo lokalnego checkoutu, dopóki nowszy pakiet npm nie zostanie opublikowany.

Użyj lokalnego checkoutu (workflowy deweloperskie):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Uruchom ponownie Gateway po zainstalowaniu lub włączeniu pluginów.

### Konfiguracja nieinteraktywna

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Użyj `--use-env`, aby przechowywać `NOSTR_PRIVATE_KEY` w środowisku zamiast zapisywać klucz w konfiguracji.

## Szybka konfiguracja

1. Wygeneruj parę kluczy Nostr (jeśli potrzeba):

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

## Dokumentacja konfiguracji

| Klucz        | Typ      | Domyślne                                   | Opis                                   |
| ------------ | -------- | ------------------------------------------- | -------------------------------------- |
| `privateKey` | string   | wymagane                                   | Klucz prywatny w formacie `nsec` lub hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL-e relayów (WebSocket)              |
| `dmPolicy`   | string   | `pairing`                                  | Zasady dostępu do DM                   |
| `allowFrom`  | string[] | `[]`                                       | Dozwolone pubkeye nadawców             |
| `enabled`    | boolean  | `true`                                     | Włącz/wyłącz kanał                     |
| `name`       | string   | -                                          | Nazwa wyświetlana                      |
| `profile`    | object   | -                                          | Metadane profilu NIP-01                |

## Metadane profilu

Dane profilu są publikowane jako zdarzenie NIP-01 `kind:0`. Możesz zarządzać nimi z Control UI (Channels -> Nostr -> Profile) albo ustawić je bezpośrednio w konfiguracji.

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

- **pairing** (domyślne): nieznani nadawcy otrzymują kod parowania.
- **allowlist**: tylko pubkeye w `allowFrom` mogą wysyłać DM.
- **open**: publiczne przychodzące DM (wymaga `allowFrom: ["*"]`).
- **disabled**: ignoruj przychodzące DM.

Uwagi dotyczące egzekwowania:

- Podpisy zdarzeń przychodzących są weryfikowane przed zasadami nadawcy i odszyfrowaniem NIP-04, więc sfałszowane zdarzenia są odrzucane wcześnie.
- Odpowiedzi parowania są wysyłane bez przetwarzania oryginalnej treści DM.
- Przychodzące DM mają limit częstotliwości, a zbyt duże ładunki są odrzucane przed odszyfrowaniem.

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

Domyślne: `relay.damus.io` i `nos.lol`.

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

- Używaj 2-3 relayów dla redundancji.
- Unikaj zbyt wielu relayów (opóźnienia, duplikacja).
- Płatne relaye mogą poprawić niezawodność.
- Lokalne relaye nadają się do testów (`ws://localhost:7777`).

## Obsługa protokołu

| NIP    | Status       | Opis                                  |
| ------ | ------------ | ------------------------------------- |
| NIP-01 | Obsługiwane  | Podstawowy format zdarzeń + metadane profilu |
| NIP-04 | Obsługiwane  | Szyfrowane DM (`kind:4`)              |
| NIP-17 | Planowane    | DM w formie gift-wrap                 |
| NIP-44 | Planowane    | Wersjonowane szyfrowanie              |

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

1. Zanotuj pubkey bota (npub) z logów.
2. Otwórz klienta Nostr (Damus, Amethyst itd.).
3. Wyślij DM na pubkey bota.
4. Zweryfikuj odpowiedź.

## Rozwiązywanie problemów

### Wiadomości nie są odbierane

- Zweryfikuj, że klucz prywatny jest prawidłowy.
- Upewnij się, że URL-e relayów są osiągalne i używają `wss://` (albo `ws://` lokalnie).
- Potwierdź, że `enabled` nie ma wartości `false`.
- Sprawdź logi Gateway pod kątem błędów połączenia z relayem.

### Odpowiedzi nie są wysyłane

- Sprawdź, czy relay akceptuje zapisy.
- Zweryfikuj łączność wychodzącą.
- Obserwuj limity częstotliwości relayów.

### Zduplikowane odpowiedzi

- Oczekiwane przy używaniu wielu relayów.
- Wiadomości są deduplikowane według ID zdarzenia; tylko pierwsze dostarczenie wyzwala odpowiedź.

## Bezpieczeństwo

- Nigdy nie commituj kluczy prywatnych.
- Używaj zmiennych środowiskowych dla kluczy.
- Rozważ `allowlist` dla botów produkcyjnych.
- Podpisy są weryfikowane przed zasadami nadawcy, a zasady nadawcy są egzekwowane przed odszyfrowaniem, więc sfałszowane zdarzenia są odrzucane wcześnie, a nieznani nadawcy nie mogą wymusić pełnej pracy kryptograficznej.

## Ograniczenia (MVP)

- Tylko wiadomości bezpośrednie (bez czatów grupowych).
- Brak załączników multimedialnych.
- Tylko NIP-04 (planowany gift-wrap NIP-17).

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
