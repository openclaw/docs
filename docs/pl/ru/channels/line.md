---
read_when:
    - Chcesz połączyć OpenClaw z LINE
    - Musisz skonfigurować Webhook LINE i dane uwierzytelniające
    - Potrzebujesz parametrów wiadomości specyficznych dla LINE
summary: Konfiguracja, ustawienia i używanie Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE łączy się z OpenClaw przez LINE Messaging API. Plugin działa jako odbiornik Webhook
na Gateway i używa Twojego channel access token + channel secret do
uwierzytelniania.

Status: ładowalny Plugin. Obsługiwane są wiadomości prywatne, czaty grupowe, multimedia, lokalizacje, Flex
messages, template messages i szybkie odpowiedzi. Reakcje i wątki
nie są obsługiwane.

## Instalacja

Zainstaluj LINE przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/line
```

Lokalna kopia robocza (przy uruchamianiu z repozytorium git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Konfiguracja

1. Utwórz konto LINE Developers i otwórz Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Utwórz (lub wybierz) Provider i dodaj kanał **Messaging API**.
3. Skopiuj **Channel access token** i **Channel secret** z ustawień kanału.
4. Włącz **Use webhook** w ustawieniach Messaging API.
5. Ustaw URL Webhook dla swojej końcówki Gateway (wymagany HTTPS):

```
https://gateway-host/line/webhook
```

Gateway odpowiada na weryfikację Webhook od LINE (GET) i potwierdza podpisane
zdarzenia przychodzące (POST) natychmiast po sprawdzeniu podpisu i ładunku; przetwarzanie
przez agenta jest kontynuowane asynchronicznie.
Jeśli potrzebna jest niestandardowa ścieżka, ustaw `channels.line.webhookPath` lub
`channels.line.accounts.<id>.webhookPath` i odpowiednio zaktualizuj URL.

Uwaga dotycząca bezpieczeństwa:

- Weryfikacja podpisu LINE zależy od treści żądania (HMAC na nieprzetworzonej treści), dlatego OpenClaw stosuje ścisłe limity rozmiaru treści i limit czasu przed uwierzytelnieniem przed weryfikacją.
- OpenClaw przetwarza zdarzenia Webhook ze zweryfikowanych nieprzetworzonych bajtów żądania. Wartości `req.body` przekształcone przez oprogramowanie pośredniczące wyżej w łańcuchu są ignorowane, aby zachować integralność podpisu.

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

Konfiguracja otwartych wiadomości prywatnych:

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

Wiadomości prywatne domyślnie wymagają parowania. Nieznani nadawcy otrzymują kod parowania, a ich
wiadomości są ignorowane do czasu zatwierdzenia.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listy zezwoleń i zasady:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: dozwolone ID użytkowników LINE dla wiadomości prywatnych; `dmPolicy: "open"` wymaga `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: dozwolone ID użytkowników LINE dla grup
- Nadpisania dla poszczególnych grup: `channels.line.groups.<groupId>.allowFrom`
- Statyczne grupy dostępu nadawców można wskazywać z `allowFrom`, `groupAllowFrom` i grupowego `allowFrom` przez `accessGroup:<name>`.
- Uwaga dotycząca runtime: jeśli `channels.line` całkowicie nie istnieje, runtime wraca do `groupPolicy="allowlist"` dla kontroli grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

ID LINE rozróżniają wielkość liter. Prawidłowe ID wyglądają tak:

- Użytkownik: `U` + 32 znaki szesnastkowe
- Grupa: `C` + 32 znaki szesnastkowe
- Pokój: `R` + 32 znaki szesnastkowe

## Zachowanie wiadomości

- Tekst jest dzielony na fragmenty po 5000 znaków.
- Formatowanie Markdown jest usuwane; bloki kodu i tabele są w miarę możliwości przekształcane w Flex
  cards.
- Odpowiedzi strumieniowe są buforowane; LINE otrzymuje pełne fragmenty z animacją ładowania,
  gdy agent pracuje.
- Pobieranie multimediów jest ograniczone przez `channels.line.mediaMaxMb` (domyślnie 10).
- Przychodzące multimedia są zapisywane w `~/.openclaw/media/inbound/` przed przekazaniem
  agentowi, zgodnie ze wspólnym magazynem multimediów używanym przez inne wbudowane kanały
  Plugin.

## Dane kanału (wiadomości rozszerzone)

Użyj `channelData.line`, aby wysyłać szybkie odpowiedzi, lokalizacje, Flex cards lub template
messages.

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

Plugin LINE zawiera także polecenie `/card` dla presetów Flex messages:

```
/card info "Welcome" "Thanks for joining!"
```

## Obsługa ACP

LINE obsługuje powiązania rozmów ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` wiąże bieżący czat LINE z sesją ACP bez tworzenia wątku podrzędnego.
- Skonfigurowane powiązania ACP i aktywne sesje ACP powiązane z rozmową działają w LINE tak samo jak w innych kanałach rozmów.

Zobacz [agenci ACP](/pl/tools/acp-agents), aby poznać szczegóły.

## Multimedia wychodzące

Plugin LINE obsługuje wysyłanie obrazów, wideo i plików audio przez narzędzie wiadomości agenta. Multimedia są wysyłane przez ścieżkę dostarczania specyficzną dla LINE z odpowiednią obsługą podglądu i śledzenia:

- **Obrazy**: wysyłane jako wiadomości obrazów LINE z automatycznym generowaniem podglądu.
- **Wideo**: wysyłane z jawną obsługą podglądu i typu zawartości.
- **Audio**: wysyłane jako wiadomości audio LINE.

URL wychodzących multimediów muszą być publicznymi URL HTTPS. OpenClaw sprawdza docelową nazwę hosta przed przekazaniem URL do LINE i odrzuca local loopback, link-local oraz cele w sieciach prywatnych.

Ogólne wysyłki multimediów wracają do istniejącej trasy tylko dla obrazów, gdy ścieżka specyficzna dla LINE jest niedostępna.

## Rozwiązywanie problemów

- **Weryfikacja Webhook nie przechodzi:** upewnij się, że URL Webhook używa HTTPS i
  `channelSecret` jest zgodny z LINE console.
- **Brak zdarzeń przychodzących:** potwierdź, że ścieżka Webhook jest zgodna z `channels.line.webhookPath`
  i że Gateway jest dostępny z LINE.
- **Błędy pobierania multimediów:** zwiększ `channels.line.mediaMaxMb`, jeśli multimedia przekraczają
  domyślny limit.

## Zobacz też

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości prywatnych i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i ograniczenie według wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie ochrony
