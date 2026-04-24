---
read_when:
    - Konfigurowanie Synology Chat z OpenClaw
    - Debugowanie routingu Webhooka Synology Chat
summary: Konfiguracja Webhook Synology Chat i ustawień OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-24T09:00:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

Status: dołączony Plugin kanału wiadomości bezpośrednich używający Webhooków Synology Chat.
Plugin przyjmuje wiadomości przychodzące z wychodzących Webhooków Synology Chat i wysyła odpowiedzi
przez przychodzący Webhook Synology Chat.

## Dołączony Plugin

Synology Chat jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Synology Chat,
zainstaluj go ręcznie:

Zainstaluj z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

1. Upewnij się, że Plugin Synology Chat jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie z checkoutu źródeł za pomocą powyższego polecenia.
   - `openclaw onboard` pokazuje teraz Synology Chat na tej samej liście konfiguracji kanałów co `openclaw channels add`.
   - Konfiguracja nieinteraktywna: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. W integracjach Synology Chat:
   - Utwórz przychodzący Webhook i skopiuj jego URL.
   - Utwórz wychodzący Webhook z własnym sekretnym tokenem.
3. Skieruj URL wychodzącego Webhooka na swój gateway OpenClaw:
   - Domyślnie `https://gateway-host/webhook/synology`.
   - Lub na niestandardowe `channels.synology-chat.webhookPath`.
4. Dokończ konfigurację w OpenClaw.
   - Prowadzona: `openclaw onboard`
   - Bezpośrednia: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Uruchom ponownie gateway i wyślij wiadomość bezpośrednią do bota Synology Chat.

Szczegóły uwierzytelniania Webhooka:

- OpenClaw akceptuje token wychodzącego Webhooka najpierw z `body.token`, potem
  z `?token=...`, a następnie z nagłówków.
- Akceptowane formy nagłówków:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Puste lub brakujące tokeny kończą się odmową dostępu.

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

Wartości konfiguracji nadpisują zmienne środowiskowe.

`SYNOLOGY_CHAT_INCOMING_URL` nie może być ustawione z obszaru roboczego `.env`; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

## Zasady wiadomości bezpośrednich i kontrola dostępu

- `dmPolicy: "allowlist"` to zalecana wartość domyślna.
- `allowedUserIds` przyjmuje listę (lub ciąg rozdzielany przecinkami) identyfikatorów użytkowników Synology.
- W trybie `allowlist` pusta lista `allowedUserIds` jest traktowana jako błędna konfiguracja i trasa Webhooka nie zostanie uruchomiona (użyj `dmPolicy: "open"` dla trybu zezwalającego wszystkim).
- `dmPolicy: "open"` pozwala każdemu nadawcy.
- `dmPolicy: "disabled"` blokuje wiadomości bezpośrednie.
- Powiązanie odbiorcy odpowiedzi domyślnie pozostaje oparte na stabilnym numerycznym `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza wyszukiwanie po zmiennej nazwie użytkownika/pseudonimie do dostarczania odpowiedzi.
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

Wysyłanie multimediów jest obsługiwane przez dostarczanie plików na podstawie URL.
Wychodzące URL-e plików muszą używać `http` lub `https`, a cele w sieciach prywatnych lub w inny sposób zablokowane są odrzucane, zanim OpenClaw przekaże URL do Webhooka NAS.

## Wiele kont

Wiele kont Synology Chat jest obsługiwanych w `channels.synology-chat.accounts`.
Każde konto może nadpisywać token, przychodzący URL, ścieżkę Webhooka, zasady wiadomości bezpośrednich i limity.
Sesje wiadomości bezpośrednich są izolowane dla każdego konta i użytkownika, więc ten sam numeryczny `user_id`
na dwóch różnych kontach Synology nie współdzieli stanu transkrypcji.
Nadaj każdemu włączonemu kontu odrębne `webhookPath`. OpenClaw odrzuca teraz duplikaty identycznych ścieżek
i odmawia uruchomienia nazwanych kont, które dziedziczą tylko współdzieloną ścieżkę Webhooka w konfiguracjach wielokontowych.
Jeśli celowo potrzebujesz starszego dziedziczenia dla nazwanego konta, ustaw
`dangerouslyAllowInheritedWebhookPath: true` na tym koncie lub w `channels.synology-chat`,
ale duplikaty identycznych ścieżek nadal są odrzucane w trybie fail-closed. Preferuj jawne ścieżki dla każdego konta.

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

- Zachowaj `token` w tajemnicy i obróć go, jeśli wycieknie.
- Pozostaw `allowInsecureSsl: false`, chyba że jawnie ufasz lokalnemu certyfikatowi self-signed NAS.
- Przychodzące żądania Webhooka są weryfikowane tokenem i ograniczane szybkością na nadawcę.
- Sprawdzanie nieprawidłowych tokenów używa porównania sekretów w czasie stałym i działa w trybie fail-closed.
- W środowisku produkcyjnym preferuj `dmPolicy: "allowlist"`.
- Pozostaw `dangerouslyAllowNameMatching` wyłączone, chyba że jawnie potrzebujesz starszego dostarczania odpowiedzi opartego na nazwie użytkownika.
- Pozostaw `dangerouslyAllowInheritedWebhookPath` wyłączone, chyba że jawnie akceptujesz ryzyko routingu ze współdzieloną ścieżką w konfiguracji wielokontowej.

## Rozwiązywanie problemów

- `Missing required fields (token, user_id, text)`:
  - w ładunku wychodzącego Webhooka brakuje jednego z wymaganych pól
  - jeśli Synology wysyła token w nagłówkach, upewnij się, że gateway/proxy zachowuje te nagłówki
- `Invalid token`:
  - sekret wychodzącego Webhooka nie zgadza się z `channels.synology-chat.token`
  - żądanie trafia do niewłaściwego konta/ścieżki Webhooka
  - reverse proxy usunęło nagłówek tokenu, zanim żądanie dotarło do OpenClaw
- `Rate limit exceeded`:
  - zbyt wiele prób z nieprawidłowym tokenem z tego samego źródła może tymczasowo zablokować to źródło
  - uwierzytelnieni nadawcy mają również oddzielny limit szybkości wiadomości na użytkownika
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` jest włączone, ale nie skonfigurowano żadnych użytkowników
- `User not authorized`:
  - numeryczny `user_id` nadawcy nie znajduje się w `allowedUserIds`

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
