---
read_when:
    - Konfigurowanie Synology Chat z OpenClaw
    - Debugowanie routingu webhooków Synology Chat
summary: Konfiguracja webhooków Synology Chat i OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-05T13:45:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb25fc6b53f896f15f43b4936d69ea071a29a91838a5b662819377271e89d81
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Status: dołączony plugin kanału wiadomości bezpośrednich używający webhooków Synology Chat.
Plugin przyjmuje wiadomości przychodzące z webhooków wychodzących Synology Chat i wysyła odpowiedzi
przez webhook przychodzący Synology Chat.

## Dołączony plugin

Synology Chat jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw, więc zwykłe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Synology Chat,
zainstaluj go ręcznie:

Zainstaluj z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Szczegóły: [Plugins](/tools/plugin)

## Szybka konfiguracja

1. Upewnij się, że plugin Synology Chat jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie z checkoutu źródeł za pomocą powyższego polecenia.
   - `openclaw onboard` wyświetla teraz Synology Chat na tej samej liście konfiguracji kanałów co `openclaw channels add`.
   - Konfiguracja nieinteraktywna: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. W integracjach Synology Chat:
   - Utwórz webhook przychodzący i skopiuj jego URL.
   - Utwórz webhook wychodzący z tajnym tokenem.
3. Skieruj URL webhooka wychodzącego do swojej bramy OpenClaw:
   - Domyślnie `https://gateway-host/webhook/synology`.
   - Lub do niestandardowego `channels.synology-chat.webhookPath`.
4. Dokończ konfigurację w OpenClaw.
   - Z przewodnikiem: `openclaw onboard`
   - Bezpośrednio: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Uruchom ponownie bramę i wyślij DM do bota Synology Chat.

Szczegóły uwierzytelniania webhooka:

- OpenClaw akceptuje token webhooka wychodzącego z `body.token`, następnie
  `?token=...`, a potem z nagłówków.
- Akceptowane formy nagłówków:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Puste lub brakujące tokeny są odrzucane w trybie fail-closed.

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

Dla konta domyślnego możesz użyć zmiennych środowiskowych:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (rozdzielane przecinkami)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Wartości konfiguracyjne zastępują zmienne środowiskowe.

## Zasady DM i kontrola dostępu

- `dmPolicy: "allowlist"` to zalecana wartość domyślna.
- `allowedUserIds` akceptuje listę (lub ciąg rozdzielany przecinkami) identyfikatorów użytkowników Synology.
- W trybie `allowlist` pusta lista `allowedUserIds` jest traktowana jako błędna konfiguracja i trasa webhooka nie zostanie uruchomiona (użyj `dmPolicy: "open"` dla zezwolenia wszystkim).
- `dmPolicy: "open"` pozwala każdemu nadawcy.
- `dmPolicy: "disabled"` blokuje DM.
- Powiązanie odbiorcy odpowiedzi domyślnie pozostaje oparte na stabilnym numerycznym `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza wyszukiwanie po zmiennej nazwie użytkownika/pseudonimie na potrzeby dostarczania odpowiedzi.
- Zatwierdzanie parowania działa z:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Dostarczanie wychodzące

Używaj numerycznych identyfikatorów użytkowników Synology Chat jako celów.

Przykłady:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Wysyłanie multimediów jest obsługiwane przez dostarczanie plików oparte na URL.

## Wiele kont

Wiele kont Synology Chat jest obsługiwanych w `channels.synology-chat.accounts`.
Każde konto może nadpisać token, URL przychodzący, ścieżkę webhooka, zasady DM i limity.
Sesje wiadomości bezpośrednich są izolowane dla każdego konta i użytkownika, więc ten sam numeryczny `user_id`
na dwóch różnych kontach Synology nie współdzieli stanu transkrypcji.
Nadaj każdemu włączonemu kontu odrębny `webhookPath`. OpenClaw odrzuca teraz zduplikowane dokładne ścieżki
i odmawia uruchomienia nazwanych kont, które w konfiguracjach wielokontowych dziedziczą wyłącznie wspólną ścieżkę webhooka.
Jeśli celowo potrzebujesz starszego dziedziczenia dla nazwanego konta, ustaw
`dangerouslyAllowInheritedWebhookPath: true` na tym koncie lub w `channels.synology-chat`,
ale zduplikowane dokładne ścieżki nadal są odrzucane w trybie fail-closed. Preferuj jawne ścieżki dla każdego konta.

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

- Zachowaj `token` w tajemnicy i zmień go, jeśli wycieknie.
- Pozostaw `allowInsecureSsl: false`, chyba że wyraźnie ufasz lokalnemu certyfikatowi self-signed NAS.
- Żądania przychodzących webhooków są weryfikowane tokenem i ograniczane szybkością na nadawcę.
- Kontrole nieprawidłowych tokenów używają porównywania sekretów w stałym czasie i działają w trybie fail-closed.
- W środowisku produkcyjnym preferuj `dmPolicy: "allowlist"`.
- Pozostaw `dangerouslyAllowNameMatching` wyłączone, chyba że wyraźnie potrzebujesz starszego dostarczania odpowiedzi opartego na nazwie użytkownika.
- Pozostaw `dangerouslyAllowInheritedWebhookPath` wyłączone, chyba że wyraźnie akceptujesz ryzyko routingu współdzielonej ścieżki w konfiguracji wielokontowej.

## Rozwiązywanie problemów

- `Missing required fields (token, user_id, text)`:
  - w ładunku webhooka wychodzącego brakuje jednego z wymaganych pól
  - jeśli Synology wysyła token w nagłówkach, upewnij się, że brama/proxy zachowuje te nagłówki
- `Invalid token`:
  - sekret webhooka wychodzącego nie pasuje do `channels.synology-chat.token`
  - żądanie trafia do niewłaściwego konta/ścieżki webhooka
  - reverse proxy usunęło nagłówek tokena, zanim żądanie dotarło do OpenClaw
- `Rate limit exceeded`:
  - zbyt wiele prób z nieprawidłowym tokenem z tego samego źródła może tymczasowo zablokować to źródło
  - uwierzytelnieni nadawcy mają też oddzielny limit szybkości wiadomości na użytkownika
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` jest włączone, ale nie skonfigurowano żadnych użytkowników
- `User not authorized`:
  - numeryczny `user_id` nadawcy nie znajduje się w `allowedUserIds`

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Channel Routing](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Security](/gateway/security) — model dostępu i utwardzanie
