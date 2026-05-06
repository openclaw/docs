---
read_when:
    - Chcesz połączyć OpenClaw z LINE
    - Potrzebujesz konfiguracji Webhook LINE + poświadczeń
    - Potrzebujesz opcji wiadomości specyficznych dla LINE
summary: Konfiguracja początkowa, konfiguracja i użycie Plugin LINE Messaging API
title: WIERSZ
x-i18n:
    generated_at: "2026-05-06T09:03:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

LINE łączy się z OpenClaw przez LINE Messaging API. Plugin działa jako odbiornik Webhook
w Gateway i używa tokenu dostępu kanału oraz sekretu kanału do
uwierzytelniania.

Status: Plugin do pobrania. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, multimedia, lokalizacje, wiadomości Flex,
wiadomości szablonowe i szybkie odpowiedzi. Reakcje i wątki
nie są obsługiwane.

## Instalacja

Zainstaluj LINE przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/line
```

Lokalny checkout (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Konfiguracja

1. Utwórz konto LINE Developers i otwórz Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Utwórz (lub wybierz) Provider i dodaj kanał **Messaging API**.
3. Skopiuj **Channel access token** i **Channel secret** z ustawień kanału.
4. Włącz **Use webhook** w ustawieniach Messaging API.
5. Ustaw adres URL Webhook na punkt końcowy Gateway (wymagany HTTPS):

```
https://gateway-host/line/webhook
```

Gateway odpowiada na weryfikację Webhook LINE (GET) i zdarzenia przychodzące (POST).
Jeśli potrzebujesz niestandardowej ścieżki, ustaw `channels.line.webhookPath` lub
`channels.line.accounts.<id>.webhookPath` i odpowiednio zaktualizuj adres URL.

Uwaga dotycząca zabezpieczeń:

- Weryfikacja podpisu LINE zależy od treści żądania (HMAC na surowej treści), więc OpenClaw stosuje ścisłe limity treści przed uwierzytelnieniem i limit czasu przed weryfikacją.
- OpenClaw przetwarza zdarzenia Webhook ze zweryfikowanych surowych bajtów żądania. Wartości `req.body` przekształcone przez pośrednie oprogramowanie upstream są ignorowane dla bezpieczeństwa integralności podpisu.

## Konfigurowanie

Minimalna konfiguracja:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Publiczna konfiguracja DM:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Zmienne środowiskowe (tylko konto domyślne):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Pliki tokenu/sekretu:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` i `secretFile` muszą wskazywać zwykłe pliki. Dowiązania symboliczne są odrzucane.

Wiele kont:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Kontrola dostępu

Wiadomości bezpośrednie domyślnie używają parowania. Nieznani nadawcy otrzymują kod parowania, a ich
wiadomości są ignorowane do czasu zatwierdzenia.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listy dozwolonych i zasady:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: dozwolone identyfikatory użytkowników LINE dla DM; `dmPolicy: "open"` wymaga `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: dozwolone identyfikatory użytkowników LINE dla grup
- Nadpisania dla poszczególnych grup: `channels.line.groups.<groupId>.allowFrom`
- Uwaga dotycząca działania: jeśli `channels.line` całkowicie brakuje, runtime wraca do `groupPolicy="allowlist"` dla kontroli grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

Identyfikatory LINE rozróżniają wielkość liter. Prawidłowe identyfikatory wyglądają tak:

- Użytkownik: `U` + 32 znaki szesnastkowe
- Grupa: `C` + 32 znaki szesnastkowe
- Pokój: `R` + 32 znaki szesnastkowe

## Zachowanie wiadomości

- Tekst jest dzielony na fragmenty po 5000 znaków.
- Formatowanie Markdown jest usuwane; bloki kodu i tabele są konwertowane na karty Flex,
  gdy to możliwe.
- Odpowiedzi strumieniowe są buforowane; LINE otrzymuje pełne fragmenty z animacją
  ładowania, gdy agent pracuje.
- Pobieranie multimediów jest ograniczone przez `channels.line.mediaMaxMb` (domyślnie 10).
- Przychodzące multimedia są zapisywane w `~/.openclaw/media/inbound/` przed przekazaniem
  agentowi, zgodnie ze współdzielonym magazynem multimediów używanym przez inne dołączone kanałowe
  Plugin.

## Dane kanału (wiadomości wzbogacone)

Użyj `channelData.line`, aby wysyłać szybkie odpowiedzi, lokalizacje, karty Flex lub wiadomości szablonowe.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE dostarcza także polecenie `/card` dla presetów wiadomości Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Obsługa ACP

LINE obsługuje powiązania konwersacji ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` wiąże bieżący czat LINE z sesją ACP bez tworzenia wątku podrzędnego.
- Skonfigurowane powiązania ACP i aktywne sesje ACP powiązane z konwersacją działają w LINE tak jak w innych kanałach konwersacyjnych.

Szczegóły znajdziesz w [agenci ACP](/pl/tools/acp-agents).

## Multimedia wychodzące

Plugin LINE obsługuje wysyłanie obrazów, filmów i plików audio przez narzędzie wiadomości agenta. Multimedia są wysyłane przez ścieżkę dostarczania specyficzną dla LINE z odpowiednią obsługą podglądu i śledzenia:

- **Obrazy**: wysyłane jako wiadomości obrazów LINE z automatycznym generowaniem podglądu.
- **Filmy**: wysyłane z jawną obsługą podglądu i typu zawartości.
- **Audio**: wysyłane jako wiadomości audio LINE.

Adresy URL multimediów wychodzących muszą być publicznymi adresami HTTPS. OpenClaw weryfikuje nazwę hosta docelowego przed przekazaniem adresu URL do LINE i odrzuca cele local loopback, link-local oraz sieci prywatnych.

Ogólne wysyłki multimediów wracają do istniejącej trasy tylko dla obrazów, gdy ścieżka specyficzna dla LINE nie jest dostępna.

## Rozwiązywanie problemów

- **Weryfikacja Webhook nie powiodła się:** upewnij się, że adres URL Webhook używa HTTPS, a
  `channelSecret` odpowiada LINE console.
- **Brak zdarzeń przychodzących:** potwierdź, że ścieżka Webhook odpowiada `channels.line.webhookPath`
  i że Gateway jest osiągalny z LINE.
- **Błędy pobierania multimediów:** zwiększ `channels.line.mediaMaxMb`, jeśli multimedia przekraczają
  domyślny limit.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
