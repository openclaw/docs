---
read_when:
    - Chcesz połączyć OpenClaw z LINE
    - Potrzebujesz Webhook LINE + konfiguracji danych uwierzytelniających
    - Potrzebujesz opcji wiadomości specyficznych dla LINE
summary: 'Plugin LINE Messaging API: instalacja, konfiguracja i użycie'
title: WIERSZ
x-i18n:
    generated_at: "2026-04-30T09:37:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE łączy się z OpenClaw przez LINE Messaging API. Plugin działa jako odbiornik webhooka
na Gateway i używa tokenu dostępu kanału + sekretu kanału do
uwierzytelniania.

Status: wbudowany Plugin. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, multimedia, lokalizacje, wiadomości Flex,
wiadomości szablonowe i szybkie odpowiedzi. Reakcje i wątki
nie są obsługiwane.

## Wbudowany Plugin

LINE jest dostarczany jako wbudowany Plugin w obecnych wydaniach OpenClaw, więc standardowe
pakietowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która wyklucza LINE, zainstaluj
aktualny pakiet npm, gdy zostanie opublikowany:

```bash
openclaw plugins install @openclaw/line
```

Jeśli npm zgłasza, że pakiet należący do OpenClaw jest przestarzały lub go brakuje, użyj
aktualnej pakietowanej kompilacji OpenClaw albo lokalnego checkoutu, dopóki ciąg pakietów npm
nie nadrobi zaległości.

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
5. Ustaw adres URL webhooka na endpoint swojego Gateway (wymagane HTTPS):

```
https://gateway-host/line/webhook
```

Gateway odpowiada na weryfikację webhooka LINE (GET) i zdarzenia przychodzące (POST).
Jeśli potrzebujesz niestandardowej ścieżki, ustaw `channels.line.webhookPath` lub
`channels.line.accounts.<id>.webhookPath` i odpowiednio zaktualizuj URL.

Uwaga dotycząca bezpieczeństwa:

- Weryfikacja podpisu LINE zależy od treści żądania (HMAC po surowej treści), więc OpenClaw stosuje ścisłe limity treści przed uwierzytelnieniem oraz limit czasu przed weryfikacją.
- OpenClaw przetwarza zdarzenia webhooka ze zweryfikowanych surowych bajtów żądania. Wartości `req.body` przekształcone przez upstream middleware są ignorowane ze względu na bezpieczeństwo integralności podpisu.

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
- `channels.line.allowFrom`: dozwolone identyfikatory użytkowników LINE dla wiadomości bezpośrednich
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: dozwolone identyfikatory użytkowników LINE dla grup
- Nadpisania dla poszczególnych grup: `channels.line.groups.<groupId>.allowFrom`
- Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.line` całkowicie nie istnieje, środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` przy sprawdzaniu grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

Identyfikatory LINE rozróżniają wielkość liter. Prawidłowe identyfikatory wyglądają tak:

- Użytkownik: `U` + 32 znaki szesnastkowe
- Grupa: `C` + 32 znaki szesnastkowe
- Pokój: `R` + 32 znaki szesnastkowe

## Zachowanie wiadomości

- Tekst jest dzielony na fragmenty po 5000 znaków.
- Formatowanie Markdown jest usuwane; bloki kodu i tabele są w miarę możliwości konwertowane na karty Flex.
- Odpowiedzi przesyłane strumieniowo są buforowane; LINE otrzymuje pełne fragmenty z animacją ładowania,
  gdy agent pracuje.
- Pobieranie multimediów jest ograniczone przez `channels.line.mediaMaxMb` (domyślnie 10).
- Multimedia przychodzące są zapisywane w `~/.openclaw/media/inbound/`, zanim zostaną przekazane
  agentowi, zgodnie ze wspólnym magazynem multimediów używanym przez inne wbudowane
  pluginy kanałów.

## Dane kanału (bogate wiadomości)

Użyj `channelData.line`, aby wysyłać szybkie odpowiedzi, lokalizacje, karty Flex lub wiadomości
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

Plugin LINE zawiera także polecenie `/card` dla presetów wiadomości Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Obsługa ACP

LINE obsługuje powiązania konwersacji ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` wiąże bieżący czat LINE z sesją ACP bez tworzenia wątku potomnego.
- Skonfigurowane powiązania ACP i aktywne sesje ACP powiązane z konwersacją działają w LINE tak jak w innych kanałach konwersacji.

Szczegóły znajdziesz w [agentach ACP](/pl/tools/acp-agents).

## Multimedia wychodzące

Plugin LINE obsługuje wysyłanie obrazów, filmów i plików audio przez narzędzie wiadomości agenta. Multimedia są wysyłane ścieżką dostarczania specyficzną dla LINE z odpowiednią obsługą podglądu i śledzenia:

- **Obrazy**: wysyłane jako wiadomości obrazów LINE z automatycznym generowaniem podglądu.
- **Filmy**: wysyłane z jawną obsługą podglądu i typu zawartości.
- **Audio**: wysyłane jako wiadomości audio LINE.

Adresy URL multimediów wychodzących muszą być publicznymi adresami HTTPS. OpenClaw sprawdza poprawność docelowej nazwy hosta przed przekazaniem adresu URL do LINE i odrzuca cele typu local loopback, link-local oraz sieci prywatnej.

Ogólne wysyłanie multimediów wraca do istniejącej trasy tylko dla obrazów, gdy ścieżka specyficzna dla LINE nie jest dostępna.

## Rozwiązywanie problemów

- **Weryfikacja webhooka kończy się niepowodzeniem:** upewnij się, że adres URL webhooka używa HTTPS i że
  `channelSecret` pasuje do konsoli LINE.
- **Brak zdarzeń przychodzących:** potwierdź, że ścieżka webhooka odpowiada `channels.line.webhookPath`
  i że Gateway jest osiągalny z LINE.
- **Błędy pobierania multimediów:** zwiększ `channels.line.mediaMaxMb`, jeśli multimedia przekraczają
  domyślny limit.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
