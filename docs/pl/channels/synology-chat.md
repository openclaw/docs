---
read_when:
    - Konfigurowanie Synology Chat z OpenClaw
    - Debugowanie routingu Webhook Synology Chat
summary: Konfiguracja Webhook dla Synology Chat i konfiguracji OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-30T09:39:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

Status: wbudowany Plugin kanału wiadomości bezpośrednich używający webhooków Synology Chat.
Plugin przyjmuje wiadomości przychodzące z webhooków wychodzących Synology Chat i wysyła odpowiedzi
przez webhook przychodzący Synology Chat.

## Wbudowany Plugin

Synology Chat jest dostarczany jako wbudowany Plugin w aktualnych wydaniach OpenClaw, więc standardowe
pakietowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która wyklucza Synology Chat,
zainstaluj go ręcznie:

Instalacja z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

1. Upewnij się, że Plugin Synology Chat jest dostępny.
   - Aktualne pakietowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie z checkoutu źródeł za pomocą powyższego polecenia.
   - `openclaw onboard` pokazuje teraz Synology Chat na tej samej liście konfiguracji kanałów co `openclaw channels add`.
   - Konfiguracja nieinteraktywna: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. W integracjach Synology Chat:
   - Utwórz webhook przychodzący i skopiuj jego adres URL.
   - Utwórz webhook wychodzący ze swoim tajnym tokenem.
3. Skieruj URL webhooka wychodzącego do swojego Gateway OpenClaw:
   - domyślnie `https://gateway-host/webhook/synology`.
   - Albo do własnego `channels.synology-chat.webhookPath`.
4. Dokończ konfigurację w OpenClaw.
   - Z przewodnikiem: `openclaw onboard`
   - Bezpośrednio: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Uruchom ponownie Gateway i wyślij DM do bota Synology Chat.

Szczegóły uwierzytelniania webhooka:

- OpenClaw akceptuje token webhooka wychodzącego z `body.token`, następnie
  `?token=...`, a następnie z nagłówków.
- Akceptowane formy nagłówków:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Puste lub brakujące tokeny kończą się bezpiecznym odrzuceniem.

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
- `SYNOLOGY_ALLOWED_USER_IDS` (oddzielone przecinkami)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Wartości konfiguracji zastępują zmienne środowiskowe.

`SYNOLOGY_CHAT_INCOMING_URL` nie może być ustawione z pliku `.env` obszaru roboczego; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

## Zasady DM i kontrola dostępu

- `dmPolicy: "allowlist"` to zalecana wartość domyślna.
- `allowedUserIds` przyjmuje listę (lub ciąg oddzielony przecinkami) identyfikatorów użytkowników Synology.
- W trybie `allowlist` pusta lista `allowedUserIds` jest traktowana jako błędna konfiguracja, a trasa webhooka nie zostanie uruchomiona (użyj `dmPolicy: "open"` z `allowedUserIds: ["*"]`, aby zezwolić wszystkim).
- `dmPolicy: "open"` zezwala na publiczne DM tylko wtedy, gdy `allowedUserIds` zawiera `"*"`; przy restrykcyjnych wpisach czatować mogą tylko pasujący użytkownicy.
- `dmPolicy: "disabled"` blokuje DM.
- Wiązanie odbiorcy odpowiedzi domyślnie pozostaje oparte na stabilnym numerycznym `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` to tryb zgodności awaryjnej, który ponownie włącza wyszukiwanie po zmiennej nazwie użytkownika/pseudonimie do dostarczania odpowiedzi.
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
Wychodzące adresy URL plików muszą używać `http` albo `https`, a prywatne lub w inny sposób zablokowane cele sieciowe są odrzucane, zanim OpenClaw przekaże URL do webhooka NAS.

## Wiele kont

Wiele kont Synology Chat jest obsługiwanych w `channels.synology-chat.accounts`.
Każde konto może nadpisać token, URL przychodzący, ścieżkę webhooka, zasady DM i limity.
Sesje wiadomości bezpośrednich są izolowane według konta i użytkownika, więc ten sam numeryczny `user_id`
na dwóch różnych kontach Synology nie współdzieli stanu transkrypcji.
Nadaj każdemu włączonemu kontu odrębny `webhookPath`. OpenClaw odrzuca teraz zduplikowane identyczne ścieżki
i odmawia uruchomienia nazwanych kont, które w konfiguracjach wielokontowych tylko dziedziczą współdzieloną ścieżkę webhooka.
Jeśli celowo potrzebujesz starszego dziedziczenia dla nazwanego konta, ustaw
`dangerouslyAllowInheritedWebhookPath: true` na tym koncie albo w `channels.synology-chat`,
ale zduplikowane identyczne ścieżki nadal są odrzucane bezpiecznie. Preferuj jawne ścieżki dla każdego konta.

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

- Zachowaj `token` w tajemnicy i rotuj go, jeśli wycieknie.
- Pozostaw `allowInsecureSsl: false`, chyba że jawnie ufasz samopodpisanemu lokalnemu certyfikatowi NAS.
- Przychodzące żądania webhooka są weryfikowane tokenem i ograniczane limitem szybkości dla każdego nadawcy.
- Sprawdzenia nieprawidłowego tokena używają porównania tajnych wartości w stałym czasie i kończą się bezpiecznym odrzuceniem.
- W środowisku produkcyjnym preferuj `dmPolicy: "allowlist"`.
- Pozostaw `dangerouslyAllowNameMatching` wyłączone, chyba że jawnie potrzebujesz starszego dostarczania odpowiedzi opartego na nazwie użytkownika.
- Pozostaw `dangerouslyAllowInheritedWebhookPath` wyłączone, chyba że jawnie akceptujesz ryzyko routingu współdzielonej ścieżki w konfiguracji wielokontowej.

## Rozwiązywanie problemów

- `Missing required fields (token, user_id, text)`:
  - w ładunku webhooka wychodzącego brakuje jednego z wymaganych pól
  - jeśli Synology wysyła token w nagłówkach, upewnij się, że Gateway/proxy zachowuje te nagłówki
- `Invalid token`:
  - sekret webhooka wychodzącego nie pasuje do `channels.synology-chat.token`
  - żądanie trafia na niewłaściwe konto/ścieżkę webhooka
  - reverse proxy usunęło nagłówek tokena, zanim żądanie dotarło do OpenClaw
- `Rate limit exceeded`:
  - zbyt wiele prób z nieprawidłowym tokenem z tego samego źródła może tymczasowo zablokować to źródło
  - uwierzytelnieni nadawcy mają także osobny limit wiadomości na użytkownika
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` jest włączone, ale nie skonfigurowano żadnych użytkowników
- `User not authorized`:
  - numeryczny `user_id` nadawcy nie znajduje się w `allowedUserIds`

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
