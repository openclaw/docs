---
read_when:
    - Chcesz połączyć OpenClaw z LINE
    - Wymagana konfiguracja Webhook LINE i danych uwierzytelniających
    - Chcesz opcji wiadomości specyficznych dla LINE
summary: Konfiguracja początkowa, ustawienia i użycie Pluginu LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-27T17:12:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE łączy się z OpenClaw przez LINE Messaging API. Plugin działa jako odbiornik webhook
w Gateway i używa tokena dostępu kanału oraz sekretu kanału do
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

## Konfiguracja początkowa

1. Utwórz konto LINE Developers i otwórz konsolę:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Utwórz (lub wybierz) Provider i dodaj kanał **Messaging API**.
3. Skopiuj **Channel access token** i **Channel secret** z ustawień kanału.
4. Włącz **Use webhook** w ustawieniach Messaging API.
5. Ustaw URL webhooka na punkt końcowy Gateway (wymagane HTTPS):

```
https://gateway-host/line/webhook
```

Gateway odpowiada na weryfikację webhooka LINE (GET) i potwierdza podpisane
zdarzenia przychodzące (POST) natychmiast po weryfikacji podpisu i ładunku; przetwarzanie przez agenta
jest kontynuowane asynchronicznie.
Jeśli potrzebujesz niestandardowej ścieżki, ustaw `channels.line.webhookPath` albo
`channels.line.accounts.<id>.webhookPath` i odpowiednio zaktualizuj URL.

Uwaga dotycząca bezpieczeństwa:

- Weryfikacja podpisu LINE zależy od treści żądania (HMAC po surowej treści), dlatego OpenClaw stosuje ścisłe limity treści przed uwierzytelnieniem oraz limit czasu przed weryfikacją.
- OpenClaw przetwarza zdarzenia webhooka ze zweryfikowanych surowych bajtów żądania. Wartości `req.body` przekształcone przez middleware wyżej w stosie są ignorowane w celu zachowania integralności podpisu.

## Konfiguracja

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

Pliki tokena/sekretu:

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
- Nadpisania dla grup: `channels.line.groups.<groupId>.allowFrom`
- Statyczne grupy dostępu nadawców mogą być przywoływane z `allowFrom`, `groupAllowFrom` i grupowego `allowFrom` za pomocą `accessGroup:<name>`.
- Uwaga dotycząca działania: jeśli całkowicie brakuje `channels.line`, środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` dla sprawdzania grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

Identyfikatory LINE rozróżniają wielkość liter. Prawidłowe identyfikatory wyglądają tak:

- Użytkownik: `U` + 32 znaki szesnastkowe
- Grupa: `C` + 32 znaki szesnastkowe
- Pokój: `R` + 32 znaki szesnastkowe

## Zachowanie wiadomości

- Tekst jest dzielony na fragmenty po 5000 znaków.
- Formatowanie Markdown jest usuwane; bloki kodu i tabele są w miarę możliwości konwertowane na karty Flex.
- Odpowiedzi strumieniowe są buforowane; LINE otrzymuje pełne fragmenty z animacją ładowania,
  gdy agent pracuje.
- Pobieranie multimediów jest ograniczone przez `channels.line.mediaMaxMb` (domyślnie 10).
- Multimedia przychodzące są zapisywane w `~/.openclaw/media/inbound/`, zanim zostaną przekazane
  agentowi, zgodnie ze wspólnym magazynem multimediów używanym przez inne dołączone
  Pluginy kanałów.

## Dane kanału (bogate wiadomości)

Użyj `channelData.line`, aby wysyłać szybkie odpowiedzi, lokalizacje, karty Flex albo wiadomości
szablonowe.

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

Plugin LINE zawiera też polecenie `/card` dla presetów wiadomości Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Obsługa ACP

LINE obsługuje powiązania konwersacji ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` wiąże bieżący czat LINE z sesją ACP bez tworzenia wątku podrzędnego.
- Skonfigurowane powiązania ACP i aktywne sesje ACP powiązane z konwersacją działają w LINE tak jak w innych kanałach konwersacji.

Szczegóły znajdziesz w [agentach ACP](/pl/tools/acp-agents).

## Multimedia wychodzące

Plugin LINE obsługuje wysyłanie obrazów, filmów i plików audio przez narzędzie wiadomości agenta. Multimedia są wysyłane ścieżką dostarczania specyficzną dla LINE, z odpowiednią obsługą podglądu i śledzenia:

- **Obrazy**: wysyłane jako wiadomości obrazów LINE z automatycznym generowaniem podglądu.
- **Filmy**: wysyłane z jawną obsługą podglądu i typu zawartości.
- **Audio**: wysyłane jako wiadomości audio LINE.

Adresy URL multimediów wychodzących muszą być publicznymi adresami URL HTTPS. OpenClaw weryfikuje docelową nazwę hosta przed przekazaniem URL do LINE i odrzuca cele local loopback, link-local oraz z sieci prywatnych.

Ogólne wysyłanie multimediów wraca do istniejącej trasy tylko dla obrazów, gdy ścieżka specyficzna dla LINE nie jest dostępna.

## Rozwiązywanie problemów

- **Weryfikacja webhooka kończy się niepowodzeniem:** upewnij się, że URL webhooka używa HTTPS, a
  `channelSecret` odpowiada wartości w konsoli LINE.
- **Brak zdarzeń przychodzących:** potwierdź, że ścieżka webhooka odpowiada `channels.line.webhookPath`
  i że Gateway jest osiągalny z LINE.
- **Błędy pobierania multimediów:** zwiększ `channels.line.mediaMaxMb`, jeśli multimedia przekraczają
  domyślny limit.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
