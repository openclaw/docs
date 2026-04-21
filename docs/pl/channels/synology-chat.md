---
read_when:
    - Konfigurowanie Synology Chat z OpenClaw
    - Debugowanie routingu webhooka Synology Chat
summary: Konfiguracja webhooka Synology Chat i konfiguracja OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-21T19:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7288e2aa873ee1a1f57861d839cfb44ff324e3d40a7f36da07c6ba43cbe1e6e6
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Status: dołączony Plugin kanału wiadomości bezpośrednich używający webhooków Synology Chat.
Plugin przyjmuje wiadomości przychodzące z webhooków wychodzących Synology Chat i wysyła odpowiedzi
przez webhook przychodzący Synology Chat.

## Dołączony Plugin

Synology Chat jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc zwykłe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera Synology Chat,
zainstaluj go ręcznie:

Zainstaluj z lokalnego checkoutu:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Szczegóły: [Plugins](/pl/tools/plugin)

## Szybka konfiguracja

1. Upewnij się, że Plugin Synology Chat jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie z checkoutu źródeł za pomocą powyższego polecenia.
   - `openclaw onboard` pokazuje teraz Synology Chat na tej samej liście konfiguracji kanałów co `openclaw channels add`.
   - Konfiguracja nieinteraktywna: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. W integracjach Synology Chat:
   - Utwórz webhook przychodzący i skopiuj jego URL.
   - Utwórz webhook wychodzący ze swoim tajnym tokenem.
3. Skieruj URL webhooka wychodzącego do swojego Gateway OpenClaw:
   - Domyślnie `https://gateway-host/webhook/synology`.
   - Albo do własnego `channels.synology-chat.webhookPath`.
4. Dokończ konfigurację w OpenClaw.
   - Z przewodnikiem: `openclaw onboard`
   - Bezpośrednio: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Uruchom ponownie Gateway i wyślij wiadomość bezpośrednią do bota Synology Chat.

Szczegóły uwierzytelniania webhooka:

- OpenClaw akceptuje token webhooka wychodzącego z `body.token`, następnie
  `?token=...`, a potem z nagłówków.
- Akceptowane formy nagłówków:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Puste lub brakujące tokeny powodują bezpieczne odrzucenie.

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

Wartości konfiguracji mają pierwszeństwo przed zmiennymi środowiskowymi.

## Polityka wiadomości bezpośrednich i kontrola dostępu

- `dmPolicy: "allowlist"` to zalecane ustawienie domyślne.
- `allowedUserIds` przyjmuje listę (lub ciąg rozdzielany przecinkami) identyfikatorów użytkowników Synology.
- W trybie `allowlist` pusta lista `allowedUserIds` jest traktowana jako błędna konfiguracja i trasa webhooka nie zostanie uruchomiona (użyj `dmPolicy: "open"` dla zezwolenia wszystkim).
- `dmPolicy: "open"` zezwala każdemu nadawcy.
- `dmPolicy: "disabled"` blokuje wiadomości bezpośrednie.
- Powiązanie odbiorcy odpowiedzi domyślnie pozostaje oparte na stabilnym numerycznym `user_id`. `channels.synology-chat.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza wyszukiwanie po zmiennej nazwie użytkownika/pseudonimie przy dostarczaniu odpowiedzi.
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
Wychodzące URL-e plików muszą używać `http` lub `https`, a prywatne lub w inny sposób zablokowane cele sieciowe są odrzucane, zanim OpenClaw przekaże URL do webhooka NAS.

## Wiele kont

Wiele kont Synology Chat jest obsługiwanych w `channels.synology-chat.accounts`.
Każde konto może nadpisywać token, URL przychodzący, ścieżkę webhooka, politykę wiadomości bezpośrednich i limity.
Sesje wiadomości bezpośrednich są izolowane per konto i użytkownik, więc ten sam numeryczny `user_id`
na dwóch różnych kontach Synology nie współdzieli stanu transkrypcji.
Nadaj każdemu włączonemu kontu odrębny `webhookPath`. OpenClaw odrzuca teraz zduplikowane identyczne ścieżki
i odmawia uruchomienia nazwanych kont, które dziedziczą tylko współdzieloną ścieżkę webhooka w konfiguracjach wielokontowych.
Jeśli celowo potrzebujesz starszego dziedziczenia dla nazwanego konta, ustaw
`dangerouslyAllowInheritedWebhookPath: true` dla tego konta albo w `channels.synology-chat`,
ale zduplikowane identyczne ścieżki nadal są odrzucane w trybie bezpiecznego domknięcia. Preferuj jawne ścieżki per konto.

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
- Zachowaj `allowInsecureSsl: false`, chyba że jawnie ufasz lokalnemu certyfikatowi NAS z podpisem własnym.
- Przychodzące żądania webhooka są weryfikowane tokenem i ograniczane szybkościowo per nadawca.
- Sprawdzanie nieprawidłowego tokena używa porównania sekretów w czasie stałym i bezpiecznie odrzuca.
- W środowisku produkcyjnym preferuj `dmPolicy: "allowlist"`.
- Pozostaw `dangerouslyAllowNameMatching` wyłączone, chyba że jawnie potrzebujesz starszego dostarczania odpowiedzi opartego na nazwie użytkownika.
- Pozostaw `dangerouslyAllowInheritedWebhookPath` wyłączone, chyba że jawnie akceptujesz ryzyko routingu po współdzielonej ścieżce w konfiguracji wielokontowej.

## Rozwiązywanie problemów

- `Missing required fields (token, user_id, text)`:
  - w ładunku webhooka wychodzącego brakuje jednego z wymaganych pól
  - jeśli Synology wysyła token w nagłówkach, upewnij się, że Gateway/proxy zachowuje te nagłówki
- `Invalid token`:
  - sekret webhooka wychodzącego nie pasuje do `channels.synology-chat.token`
  - żądanie trafia do niewłaściwego konta/ścieżki webhooka
  - reverse proxy usunęło nagłówek tokena, zanim żądanie dotarło do OpenClaw
- `Rate limit exceeded`:
  - zbyt wiele prób z nieprawidłowym tokenem z tego samego źródła może tymczasowo zablokować to źródło
  - uwierzytelnieni nadawcy mają też osobny limit szybkości wiadomości per użytkownik
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` jest włączone, ale nie skonfigurowano żadnych użytkowników
- `User not authorized`:
  - numeryczny `user_id` nadawcy nie znajduje się w `allowedUserIds`

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane kanały
- [Pairing](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i przepływ parowania
- [Groups](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Channel Routing](/pl/channels/channel-routing) — routowanie sesji dla wiadomości
- [Security](/pl/gateway/security) — model dostępu i utwardzanie
