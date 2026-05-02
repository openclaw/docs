---
read_when:
    - Konfigurowanie Synology Chat z OpenClaw
    - Debugowanie trasowania Webhook Synology Chat
summary: Konfiguracja Webhook w Synology Chat i konfiguracja OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T09:43:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

Status: dołączony Plugin kanału wiadomości bezpośrednich używający Webhooków Synology Chat.
Plugin przyjmuje wiadomości przychodzące z wychodzących Webhooków Synology Chat i wysyła odpowiedzi
przez przychodzący Webhook Synology Chat.

## Dołączony Plugin

Synology Chat jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc normalne
pakietowane kompilacje nie wymagają oddzielnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która wyklucza Synology Chat,
zainstaluj go ręcznie:

Instalacja z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

1. Upewnij się, że Plugin Synology Chat jest dostępny.
   - Bieżące pakietowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie z checkoutu źródeł za pomocą powyższego polecenia.
   - `openclaw onboard` pokazuje teraz Synology Chat na tej samej liście konfiguracji kanałów co `openclaw channels add`.
   - Konfiguracja nieinteraktywna: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. W integracjach Synology Chat:
   - Utwórz przychodzący Webhook i skopiuj jego URL.
   - Utwórz wychodzący Webhook z tajnym tokenem.
3. Skieruj URL wychodzącego Webhooka do Gateway OpenClaw:
   - Domyślnie `https://gateway-host/webhook/synology`.
   - Albo własny `channels.synology-chat.webhookPath`.
4. Dokończ konfigurację w OpenClaw.
   - Z przewodnikiem: `openclaw onboard`
   - Bezpośrednio: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Uruchom ponownie Gateway i wyślij DM do bota Synology Chat.

Szczegóły uwierzytelniania Webhooka:

- OpenClaw akceptuje token wychodzącego Webhooka z `body.token`, następnie
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
- `SYNOLOGY_ALLOWED_USER_IDS` (rozdzielone przecinkami)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Wartości konfiguracji zastępują zmienne środowiskowe.

`SYNOLOGY_CHAT_INCOMING_URL` nie można ustawić z pliku `.env` w obszarze roboczym; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

## Zasady DM i kontrola dostępu

- `dmPolicy: "allowlist"` to zalecana wartość domyślna.
- `allowedUserIds` przyjmuje listę (lub ciąg rozdzielony przecinkami) identyfikatorów użytkowników Synology.
- W trybie `allowlist` pusta lista `allowedUserIds` jest traktowana jako błędna konfiguracja i trasa Webhooka nie zostanie uruchomiona (użyj `dmPolicy: "open"` z `allowedUserIds: ["*"]`, aby zezwolić wszystkim).
- `dmPolicy: "open"` zezwala na publiczne DM tylko wtedy, gdy `allowedUserIds` zawiera `"*"`; przy wpisach ograniczających tylko pasujący użytkownicy mogą rozmawiać.
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
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

Wysyłanie multimediów jest obsługiwane przez dostarczanie plików na podstawie URL.
Adresy URL plików wychodzących muszą używać `http` lub `https`, a prywatne lub inaczej zablokowane cele sieciowe są odrzucane, zanim OpenClaw przekaże URL do Webhooka NAS.

## Wiele kont

Wiele kont Synology Chat jest obsługiwanych w `channels.synology-chat.accounts`.
Każde konto może zastąpić token, przychodzący URL, ścieżkę Webhooka, zasady DM i limity.
Sesje wiadomości bezpośrednich są izolowane według konta i użytkownika, więc ten sam numeryczny `user_id`
na dwóch różnych kontach Synology nie współdzieli stanu transkrypcji.
Nadaj każdemu włączonemu kontu odrębny `webhookPath`. OpenClaw odrzuca teraz zduplikowane dokładne ścieżki
i odmawia uruchomienia nazwanych kont, które w konfiguracjach wielokontowych tylko dziedziczą współdzieloną ścieżkę Webhooka.
Jeśli celowo potrzebujesz starszego dziedziczenia dla nazwanego konta, ustaw
`dangerouslyAllowInheritedWebhookPath: true` na tym koncie albo w `channels.synology-chat`,
ale zduplikowane dokładne ścieżki nadal są odrzucane w trybie fail-closed. Preferuj jawne ścieżki dla poszczególnych kont.

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
- Pozostaw `allowInsecureSsl: false`, chyba że wyraźnie ufasz samopodpisanemu lokalnemu certyfikatowi NAS.
- Przychodzące żądania Webhooka są weryfikowane tokenem i limitowane według nadawcy.
- Kontrole nieprawidłowego tokenu używają porównania sekretów w stałym czasie i odrzucają w trybie fail-closed.
- W środowisku produkcyjnym preferuj `dmPolicy: "allowlist"`.
- Pozostaw `dangerouslyAllowNameMatching` wyłączone, chyba że wyraźnie potrzebujesz starszego dostarczania odpowiedzi na podstawie nazwy użytkownika.
- Pozostaw `dangerouslyAllowInheritedWebhookPath` wyłączone, chyba że wyraźnie akceptujesz ryzyko routingu po współdzielonej ścieżce w konfiguracji wielokontowej.

## Rozwiązywanie problemów

- `Missing required fields (token, user_id, text)`:
  - ładunek wychodzącego Webhooka nie zawiera jednego z wymaganych pól
  - jeśli Synology wysyła token w nagłówkach, upewnij się, że Gateway/proxy zachowuje te nagłówki
- `Invalid token`:
  - sekret wychodzącego Webhooka nie pasuje do `channels.synology-chat.token`
  - żądanie trafia na niewłaściwe konto/ścieżkę Webhooka
  - reverse proxy usunęło nagłówek tokenu, zanim żądanie dotarło do OpenClaw
- `Rate limit exceeded`:
  - zbyt wiele prób z nieprawidłowym tokenem z tego samego źródła może tymczasowo zablokować to źródło
  - uwierzytelnieni nadawcy mają też osobny limit szybkości wiadomości na użytkownika
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
