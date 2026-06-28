---
read_when:
    - Chcesz połączyć OpenClaw z LINE
    - Wymagana jest konfiguracja LINE Webhook i poświadczeń
    - Chcesz opcji wiadomości specyficznych dla LINE
summary: Konfigurowanie, konfiguracja i użycie Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:43:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE łączy się z OpenClaw przez LINE Messaging API. Plugin działa w Gateway jako odbiornik Webhook
i używa do uwierzytelniania tokenu dostępu kanału + sekretu kanału.

Status: Plugin do pobrania. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, multimedia, lokalizacje, wiadomości Flex,
wiadomości szablonowe i szybkie odpowiedzi. Reakcje i wątki
nie są obsługiwane.

## Instalacja

Zainstaluj LINE przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/line
```

Lokalny checkout (gdy uruchamiasz z repozytorium git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Konfiguracja

1. Utwórz konto LINE Developers i otwórz konsolę:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Utwórz (lub wybierz) Provider i dodaj kanał **Messaging API**.
3. Skopiuj **Channel access token** i **Channel secret** z ustawień kanału.
4. W ustawieniach Messaging API włącz **Use webhook**.
5. Ustaw Webhook URL na endpoint Gateway (wymagane HTTPS):

```
https://gateway-host/line/webhook
```

Gateway odpowiada na weryfikację Webhook LINE (GET) i akceptuje podpisane
zdarzenia przychodzące (POST) natychmiast po walidacji podpisu i payloadu; przetwarzanie
agenta trwa dalej asynchronicznie.
Jeśli potrzebujesz niestandardowej ścieżki, ustaw `channels.line.webhookPath` albo
`channels.line.accounts.<id>.webhookPath` i odpowiednio zaktualizuj URL.

Uwagi dotyczące bezpieczeństwa:

- Weryfikacja podpisu LINE zależy od body (HMAC na raw body), dlatego OpenClaw przed weryfikacją stosuje ścisłe limity body przed uwierzytelnieniem oraz timeout.
- OpenClaw przetwarza zdarzenia Webhook ze zweryfikowanych raw request bytes. Dla bezpieczeństwa integralności podpisu wartości `req.body` przekształcone przez upstream middleware są ignorowane.

## Konfiguracja pliku

Minimalna config:

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

Publiczna config DM:

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

Zmienne env (tylko konto domyślne):

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

`tokenFile` i `secretFile` powinny wskazywać zwykłe pliki. Dowiązania symboliczne są odrzucane.

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
- `channels.line.allowFrom`: dozwolone identyfikatory użytkowników LINE dla DM; dla `dmPolicy: "open"` wymagane jest `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: dozwolone identyfikatory użytkowników LINE dla grup
- Nadpisania per grupa: `channels.line.groups.<groupId>.allowFrom`
- Statyczne grupy dostępu nadawców można wskazywać w `allowFrom`, `groupAllowFrom` i per-grupowym `allowFrom` za pomocą `accessGroup:<name>`.
- Uwaga runtime: jeśli całkowicie brakuje `channels.line`, runtime cofa się do `groupPolicy="allowlist"` dla sprawdzeń grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

Identyfikatory LINE rozróżniają wielkość liter. Poprawne identyfikatory wyglądają tak:

- Użytkownik: `U` + 32 znaki hex
- Grupa: `C` + 32 znaki hex
- Pokój: `R` + 32 znaki hex

## Zachowanie wiadomości

- Tekst jest dzielony na fragmenty po 5000 znaków.
- Formatowanie Markdown jest usuwane; bloki kodu i tabele są w miarę możliwości zamieniane na karty Flex.
- Odpowiedzi strumieniowe są buforowane; gdy agent pracuje, LINE otrzymuje pełne fragmenty z animacją ładowania.
- Pobieranie multimediów jest ograniczone przez `channels.line.mediaMaxMb` (domyślnie 10).
- Multimedia przychodzące są zapisywane pod `~/.openclaw/media/inbound/` przed przekazaniem do agenta,
  zgodnie ze współdzielonym magazynem multimediów używanym przez inne bundled channel
  plugins.

## Dane kanału (wiadomości rozszerzone)

Użyj `channelData.line`, aby wysyłać szybkie odpowiedzi, lokalizacje, karty Flex albo wiadomości szablonowe.

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

LINE Plugin dostarcza też polecenie `/card` dla presetów wiadomości Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Obsługa ACP

LINE obsługuje powiązania konwersacji ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` wiąże bieżący czat LINE z sesją ACP bez tworzenia wątku podrzędnego.
- Skonfigurowane powiązania ACP i aktywne sesje ACP powiązane z konwersacją działają w LINE tak jak w innych kanałach konwersacji.

Szczegóły znajdziesz w [agentach ACP](/pl/tools/acp-agents).

## Multimedia wychodzące

LINE Plugin obsługuje wysyłanie obrazów, filmów i plików audio przez narzędzie wiadomości agenta. Multimedia są wysyłane ścieżką dostarczania specyficzną dla LINE z odpowiednią obsługą podglądu i śledzenia:

- **Obrazy**: wysyłane jako wiadomości obrazów LINE z automatycznym generowaniem podglądu.
- **Filmy**: wysyłane z jawną obsługą podglądu i content-type.
- **Audio**: wysyłane jako wiadomości audio LINE.

Adresy URL multimediów wychodzących muszą być publicznymi adresami HTTPS. OpenClaw waliduje docelową nazwę hosta przed przekazaniem URL do LINE i odrzuca cele local loopback, link-local oraz sieci prywatne.

Ogólne wysyłki multimediów cofają się do istniejącej trasy tylko dla obrazów, gdy ścieżka specyficzna dla LINE nie jest dostępna.

## Rozwiązywanie problemów

- **Weryfikacja Webhook nie powiodła się:** upewnij się, że Webhook URL używa HTTPS i
  `channelSecret` zgadza się z konsolą LINE.
- **Brak zdarzeń przychodzących:** potwierdź, że ścieżka Webhook odpowiada `channels.line.webhookPath`
  i Gateway jest osiągalny z LINE.
- **Błędy pobierania multimediów:** jeśli multimedia przekraczają domyślny limit, zwiększ `channels.line.mediaMaxMb`.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
