---
read_when:
    - Chcesz, aby OpenClaw odbierał wiadomości prywatne przez Nostr
    - Konfigurujesz zdecentralizowaną komunikację wiadomościową
summary: Kanał wiadomości prywatnych Nostr wykorzystujący szyfrowane wiadomości NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-07-12T14:55:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr to pobieralny plugin kanału (`@openclaw/nostr`), który umożliwia OpenClaw odbieranie zaszyfrowanych wiadomości bezpośrednich NIP-04 i odpowiadanie na nie za pośrednictwem przekaźników Nostr. Jedno konto na Gateway; tylko wiadomości bezpośrednie.

## Instalacja

```bash
openclaw plugins install @openclaw/nostr
```

Użyj samej specyfikacji pakietu, aby korzystać z bieżącego oficjalnego znacznika wydania. Przypnij dokładną wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji.

Z lokalnego katalogu roboczego (przepływy deweloperskie):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Po zainstalowaniu lub włączeniu pluginów uruchom ponownie Gateway. Po zainstalowaniu pluginu proces wprowadzający (`openclaw onboard`) i polecenie `openclaw channels add` udostępniają Nostr ze współdzielonego katalogu kanałów.

### Konfiguracja nieinteraktywna

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Użyj `--use-env`, aby zachować `NOSTR_PRIVATE_KEY` w środowisku zamiast zapisywać klucz w konfiguracji (tylko konto domyślne).

## Szybka konfiguracja

1. Wygeneruj parę kluczy Nostr (jeśli jest potrzebna):

```bash
# Przy użyciu nak
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

| Klucz        | Typ      | Wartość domyślna                           | Opis                                                        |
| ------------ | -------- | ------------------------------------------- | ----------------------------------------------------------- |
| `privateKey` | string   | wymagany                                    | Klucz prywatny w formacie `nsec` lub szesnastkowym; dozwolone odwołania do sekretów |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Adresy URL przekaźników (WebSocket)                          |
| `dmPolicy`   | string   | `pairing`                                   | Zasady dostępu do wiadomości bezpośrednich                   |
| `allowFrom`  | string[] | `[]`                                        | Dozwolone klucze publiczne nadawców                          |
| `enabled`    | boolean  | `true`                                      | Włączanie lub wyłączanie kanału                              |
| `name`       | string   | -                                           | Nazwa wyświetlana                                            |
| `profile`    | object   | -                                           | Metadane profilu NIP-01                                      |

## Metadane profilu

Dane profilu są publikowane jako zdarzenie NIP-01 `kind:0`. Możesz nimi zarządzać w interfejsie Control UI (Channels -> Nostr -> Profile) lub ustawić je bezpośrednio w konfiguracji.

Przykład:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Bot wiadomości bezpośrednich pełniący funkcję osobistego asystenta",
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

- Adresy URL profilu muszą używać protokołu `https://`.
- Importowanie z przekaźników scala pola i zachowuje lokalne nadpisania.

## Kontrola dostępu

### Zasady wiadomości bezpośrednich

- **pairing** (domyślnie): nieznani nadawcy otrzymują kod parowania.
- **allowlist**: wiadomości bezpośrednie mogą wysyłać tylko klucze publiczne wymienione w `allowFrom`.
- **open**: publicznie dostępne przychodzące wiadomości bezpośrednie (wymaga `allowFrom: ["*"]`).
- **disabled**: ignorowanie przychodzących wiadomości bezpośrednich.

Uwagi dotyczące egzekwowania zasad:

- Podpisy zdarzeń przychodzących są weryfikowane przed zastosowaniem zasad nadawcy i odszyfrowaniem NIP-04, dlatego sfałszowane zdarzenia są wcześnie odrzucane.
- Odpowiedzi dotyczące parowania są wysyłane bez odszyfrowywania ani przetwarzania treści pierwotnej wiadomości bezpośredniej.
- Przychodzące wiadomości bezpośrednie podlegają ograniczeniom częstotliwości (globalnie i dla każdego nadawcy), a zbyt duże ładunki są odrzucane przed odszyfrowaniem.

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

- **Klucz prywatny:** `nsec...` lub 64-znakowy zapis szesnastkowy
- **Klucze publiczne (`allowFrom`):** `npub...` lub zapis szesnastkowy

## Przekaźniki

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

- Używaj 2–3 przekaźników, aby zapewnić nadmiarowość.
- Unikaj zbyt wielu przekaźników (opóźnienia, duplikowanie).
- Płatne przekaźniki mogą zwiększyć niezawodność.
- Lokalne przekaźniki dobrze nadają się do testowania (`ws://localhost:7777`).

## Obsługa protokołów

| NIP    | Stan        | Opis                                         |
| ------ | ----------- | -------------------------------------------- |
| NIP-01 | Obsługiwany | Podstawowy format zdarzeń i metadane profilu |
| NIP-04 | Obsługiwany | Szyfrowane wiadomości bezpośrednie (`kind:4`) |
| NIP-17 | Planowany   | Wiadomości bezpośrednie w opakowaniu prezentowym |
| NIP-44 | Planowany   | Szyfrowanie z obsługą wersji                 |

## Testowanie

### Lokalny przekaźnik

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

1. Zanotuj klucz publiczny bota z dzienników Gateway lub polecenia `openclaw channels status` (zapis szesnastkowy; w razie potrzeby przekonwertuj go na npub w swoim kliencie).
2. Otwórz klienta Nostr (Amethyst, Damus itp.).
3. Wyślij wiadomość bezpośrednią na klucz publiczny bota.
4. Sprawdź odpowiedź.

## Rozwiązywanie problemów

### Brak odbieranych wiadomości

- Sprawdź, czy klucz prywatny jest prawidłowy.
- Upewnij się, że adresy URL przekaźników są osiągalne i używają protokołu `wss://` (lub `ws://` lokalnie).
- Potwierdź, że `enabled` nie ma wartości `false`.
- Sprawdź dzienniki Gateway pod kątem błędów połączenia z przekaźnikami.

### Brak wysyłanych odpowiedzi

- Sprawdź, czy przekaźnik akceptuje zapisy.
- Sprawdź łączność wychodzącą.
- Zwróć uwagę na ograniczenia częstotliwości przekaźnika.

### Zduplikowane odpowiedzi

- Jest to oczekiwane podczas korzystania z wielu przekaźników.
- Wiadomości są deduplikowane według identyfikatora zdarzenia; tylko pierwsze dostarczenie wywołuje odpowiedź.

## Bezpieczeństwo

- Nigdy nie zatwierdzaj kluczy prywatnych w repozytorium.
- Używaj zmiennych środowiskowych do przechowywania kluczy.
- Rozważ użycie `allowlist` dla botów produkcyjnych.
- Podpisy są weryfikowane przed zastosowaniem zasad nadawcy, a zasady nadawcy są egzekwowane przed odszyfrowaniem, dlatego sfałszowane zdarzenia są wcześnie odrzucane, a nieznani nadawcy nie mogą wymusić wykonania pełnych operacji kryptograficznych.

## Ograniczenia (MVP)

- Tylko wiadomości bezpośrednie (bez czatów grupowych).
- Brak załączników multimedialnych.
- Tylko NIP-04 (planowana obsługa opakowania prezentowego NIP-17).

## Powiązane materiały

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i przebieg parowania
- [Grupy](/pl/channels/groups) — działanie czatów grupowych i ograniczanie na podstawie wzmianek
- [Trasowanie kanałów](/pl/channels/channel-routing) — trasowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
