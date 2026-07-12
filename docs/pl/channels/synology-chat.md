---
read_when:
    - Konfigurowanie Synology Chat z OpenClaw
    - Debugowanie routingu Webhooka Synology Chat
summary: Konfiguracja webhooka Synology Chat i OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T14:49:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat łączy się z OpenClaw za pomocą pary webhooków: wychodzący webhook Synology Chat przesyła przychodzące wiadomości bezpośrednie do Gateway, a odpowiedzi wracają przez przychodzący webhook Synology Chat.

Status: oficjalny plugin, instalowany oddzielnie. Obsługiwane są wyłącznie wiadomości bezpośrednie; możliwe jest wysyłanie tekstu i plików za pośrednictwem adresów URL.

## Instalacja

```bash
openclaw plugins install @openclaw/synology-chat
```

Lokalna kopia robocza (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

1. Zainstaluj plugin (jak wyżej).
2. W integracjach Synology Chat:
   - Utwórz przychodzący webhook i skopiuj jego adres URL.
   - Utwórz wychodzący webhook z tajnym tokenem.
3. Ustaw adres URL wychodzącego webhooka na Gateway OpenClaw:
   - Domyślnie `https://gateway-host/webhook/synology`.
   - Lub własną ścieżkę `channels.synology-chat.webhookPath`.
4. Dokończ konfigurację w OpenClaw. Synology Chat pojawia się na tej samej liście konfiguracji kanałów w obu trybach:
   - Z przewodnikiem: `openclaw onboard` lub `openclaw channels add`
   - Bezpośrednio: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Uruchom ponownie Gateway i wyślij wiadomość bezpośrednią do bota Synology Chat.

Szczegóły uwierzytelniania webhooka:

- OpenClaw przyjmuje token wychodzącego webhooka kolejno z `body.token`,
  `?token=...`, a następnie z nagłówków.
- Akceptowane postacie nagłówków:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Puste lub brakujące tokeny powodują bezpieczne odrzucenie żądania.
- Dane mogą mieć typ `application/x-www-form-urlencoded` lub `application/json`; pola `token`, `user_id` i `text` są wymagane.

Minimalna konfiguracja:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Zmienne środowiskowe

Dla domyślnego konta można użyć zmiennych środowiskowych:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (wartości rozdzielone przecinkami)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Wartości konfiguracji zastępują zmienne środowiskowe.

Zmienne `SYNOLOGY_CHAT_INCOMING_URL` i `SYNOLOGY_NAS_HOST` nie mogą być ustawiane w pliku `.env` obszaru roboczego; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security#workspace-env-files).

## Zasady wiadomości bezpośrednich i kontrola dostępu

- Obsługiwane wartości `dmPolicy`: `allowlist` (domyślna), `open` i `disabled`. Synology Chat nie obsługuje procesu parowania; zezwól nadawcom, dodając ich numeryczne identyfikatory użytkowników Synology do `allowedUserIds`.
- `allowedUserIds` przyjmuje listę (lub ciąg wartości rozdzielonych przecinkami) identyfikatorów użytkowników Synology.
- W trybie `allowlist` pusta lista `allowedUserIds` jest traktowana jako błędna konfiguracja i trasa webhooka nie zostanie uruchomiona.
- `dmPolicy: "open"` zezwala na publiczne wiadomości bezpośrednie tylko wtedy, gdy `allowedUserIds` zawiera `"*"`; przy wpisach ograniczających rozmawiać mogą wyłącznie pasujący użytkownicy. Tryb `open` z pustą listą `allowedUserIds` również uniemożliwia uruchomienie trasy.
- `dmPolicy: "disabled"` blokuje wiadomości bezpośrednie.
- Domyślnie powiązanie odbiorcy odpowiedzi opiera się na stabilnym numerycznym identyfikatorze `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza wyszukiwanie na podstawie zmiennych nazw użytkowników lub pseudonimów podczas dostarczania odpowiedzi.

## Dostarczanie wiadomości wychodzących

Jako odbiorców używaj numerycznych identyfikatorów użytkowników Synology Chat. Akceptowane są prefiksy `synology-chat:`, `synology_chat:` i `synology:`.

Przykłady:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

Tekst wychodzący jest dzielony na fragmenty o długości do 2000 znaków. Wysyłanie multimediów jest obsługiwane poprzez dostarczanie plików za pomocą adresów URL: serwer NAS pobiera i załącza plik (maksymalnie 32 MB). Adresy URL plików wychodzących muszą używać protokołu `http` lub `https`, a prywatne lub w inny sposób zablokowane cele sieciowe są odrzucane, zanim OpenClaw przekaże adres URL do webhooka serwera NAS.

## Wiele kont

Wiele kont Synology Chat jest obsługiwanych w `channels.synology-chat.accounts`.
Każde konto może zastąpić token, adres URL przychodzącego webhooka, ścieżkę webhooka, zasady wiadomości bezpośrednich i limity.
Sesje wiadomości bezpośrednich są izolowane według konta i użytkownika, dlatego ten sam numeryczny `user_id`
na dwóch różnych kontach Synology nie współdzieli stanu transkrypcji.
Każdemu włączonemu kontu przypisz odrębną wartość `webhookPath`. OpenClaw odrzuca identyczne, zduplikowane ścieżki
i nie uruchamia nazwanych kont, które w konfiguracji wielokontowej jedynie dziedziczą współdzieloną ścieżkę webhooka.
Jeśli celowo potrzebujesz starszego mechanizmu dziedziczenia dla nazwanego konta, ustaw
`dangerouslyAllowInheritedWebhookPath: true` dla tego konta lub w `channels.synology-chat`,
jednak identyczne, zduplikowane ścieżki nadal są bezpiecznie odrzucane. Preferuj jawne ścieżki dla poszczególnych kont.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Uwagi dotyczące bezpieczeństwa

- Zachowaj `token` w tajemnicy i zmień go w razie ujawnienia.
- Zachowaj `allowInsecureSsl: false`, chyba że jednoznacznie ufasz samopodpisanemu lokalnemu certyfikatowi serwera NAS.
- Żądania przychodzącego webhooka są weryfikowane za pomocą tokena i ograniczane częstotliwościowo dla każdego nadawcy (`rateLimitPerMinute`, domyślnie 30).
- Weryfikacja nieprawidłowych tokenów korzysta z porównywania tajnych wartości w stałym czasie i bezpiecznie odrzuca żądania; powtarzające się próby użycia nieprawidłowego tokena tymczasowo blokują źródłowy adres IP.
- Tekst wiadomości przychodzących jest oczyszczany ze znanych wzorców wstrzykiwania poleceń i skracany do 4000 znaków.
- W środowisku produkcyjnym preferuj `dmPolicy: "allowlist"`.
- Pozostaw `dangerouslyAllowNameMatching` wyłączone, chyba że jednoznacznie potrzebujesz starszego mechanizmu dostarczania odpowiedzi na podstawie nazwy użytkownika.
- Pozostaw `dangerouslyAllowInheritedWebhookPath` wyłączone, chyba że jednoznacznie akceptujesz ryzyko routingu po współdzielonej ścieżce w konfiguracji wielokontowej.

## Rozwiązywanie problemów

- `Missing required fields (token, user_id, text)`:
  - w danych wychodzącego webhooka brakuje jednego z wymaganych pól
  - jeśli Synology wysyła token w nagłówkach, upewnij się, że gateway lub serwer proxy zachowuje te nagłówki
- `Invalid token`:
  - tajny token wychodzącego webhooka nie jest zgodny z `channels.synology-chat.token`
  - żądanie trafia do niewłaściwego konta lub niewłaściwej ścieżki webhooka
  - odwrotny serwer proxy usunął nagłówek tokena, zanim żądanie dotarło do OpenClaw
- `Rate limit exceeded`:
  - zbyt wiele prób użycia nieprawidłowego tokena z tego samego źródła może tymczasowo zablokować to źródło
  - uwierzytelnieni nadawcy podlegają również osobnemu limitowi częstotliwości wiadomości dla każdego użytkownika
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - włączono `dmPolicy="allowlist"`, ale nie skonfigurowano żadnych użytkowników
- `User not authorized`:
  - numeryczny identyfikator `user_id` nadawcy nie znajduje się w `allowedUserIds`

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) — działanie czatu grupowego i wymóg wzmianki
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
