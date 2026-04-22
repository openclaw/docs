---
read_when:
    - Chcesz połączyć OpenClaw z LINE
    - Potrzebujesz konfiguracji Webhooka LINE i danych uwierzytelniających
    - Chcesz opcji wiadomości specyficznych dla LINE
summary: Konfiguracja, ustawienia i użycie pluginu LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-22T04:20:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a64c18e47d22d0629ec4956f88746620923e72faae6c01f7ab353eede7345d
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE łączy się z OpenClaw przez LINE Messaging API. Plugin działa jako odbiornik
Webhooków na Gateway i używa tokenu dostępu kanału oraz sekretu kanału do
uwierzytelniania.

Status: plugin dołączony. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, multimedia, lokalizacje, wiadomości Flex,
wiadomości szablonów i szybkie odpowiedzi. Reakcje i wątki
nie są obsługiwane.

## Plugin dołączony

LINE jest dostarczany jako dołączony plugin w aktualnych wydaniach OpenClaw, więc standardowe
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która nie zawiera LINE, zainstaluj go
ręcznie:

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
5. Ustaw adres URL Webhooka na punkt końcowy Gateway (wymagany HTTPS):

```
https://gateway-host/line/webhook
```

Gateway odpowiada na weryfikację Webhooka LINE (GET) i zdarzenia przychodzące (POST).
Jeśli potrzebujesz niestandardowej ścieżki, ustaw `channels.line.webhookPath` lub
`channels.line.accounts.<id>.webhookPath` i odpowiednio zaktualizuj URL.

Uwaga dotycząca bezpieczeństwa:

- Weryfikacja sygnatury LINE zależy od treści żądania (HMAC po surowej treści), więc OpenClaw stosuje ścisłe limity rozmiaru treści przed uwierzytelnieniem oraz limit czasu przed weryfikacją.
- OpenClaw przetwarza zdarzenia Webhooka na podstawie zweryfikowanych surowych bajtów żądania. Wartości `req.body` przekształcone przez pośrednie middleware wyższego poziomu są ignorowane ze względów bezpieczeństwa integralności sygnatury.

## Skonfiguruj

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

`tokenFile` i `secretFile` muszą wskazywać na zwykłe pliki. Dowiązania symboliczne są odrzucane.

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

Listy dozwolonych i polityki:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: dozwolone identyfikatory użytkowników LINE dla wiadomości bezpośrednich
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: dozwolone identyfikatory użytkowników LINE dla grup
- Nadpisania dla poszczególnych grup: `channels.line.groups.<groupId>.allowFrom`
- Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.line` jest całkowicie nieobecne, środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` przy sprawdzaniu grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

Identyfikatory LINE rozróżniają wielkość liter. Prawidłowe identyfikatory wyglądają tak:

- Użytkownik: `U` + 32 znaki szesnastkowe
- Grupa: `C` + 32 znaki szesnastkowe
- Pokój: `R` + 32 znaki szesnastkowe

## Zachowanie wiadomości

- Tekst jest dzielony na fragmenty po 5000 znaków.
- Formatowanie Markdown jest usuwane; bloki kodu i tabele są konwertowane do kart Flex
  tam, gdzie to możliwe.
- Odpowiedzi strumieniowane są buforowane; LINE otrzymuje pełne fragmenty z animacją
  ładowania, podczas gdy agent pracuje.
- Pobieranie multimediów jest ograniczone przez `channels.line.mediaMaxMb` (domyślnie 10).

## Dane kanału (wiadomości rozbudowane)

Użyj `channelData.line`, aby wysyłać szybkie odpowiedzi, lokalizacje, karty Flex lub
wiadomości szablonów.

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

Plugin LINE zawiera też polecenie `/card` dla gotowych ustawień wiadomości Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Obsługa ACP

LINE obsługuje powiązania konwersacji ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` wiąże bieżący czat LINE z sesją ACP bez tworzenia podrzędnego wątku.
- Skonfigurowane powiązania ACP i aktywne sesje ACP powiązane z konwersacją działają w LINE tak samo jak w innych kanałach konwersacji.

Szczegóły znajdziesz w [agentach ACP](/pl/tools/acp-agents).

## Multimedia wychodzące

Plugin LINE obsługuje wysyłanie obrazów, filmów i plików audio przez narzędzie wiadomości agenta. Multimedia są wysyłane przez ścieżkę dostarczania specyficzną dla LINE z odpowiednią obsługą podglądu i śledzenia:

- **Obrazy**: wysyłane jako wiadomości obrazowe LINE z automatycznym generowaniem podglądu.
- **Filmy**: wysyłane z jawną obsługą podglądu i typu treści.
- **Audio**: wysyłane jako wiadomości audio LINE.

Wychodzące adresy URL multimediów muszą być publicznymi adresami HTTPS. OpenClaw sprawdza nazwę hosta docelowego przed przekazaniem URL do LINE i odrzuca cele loopback, link-local oraz cele w sieciach prywatnych.

Ogólne wysyłanie multimediów wraca do istniejącej ścieżki tylko dla obrazów, gdy ścieżka specyficzna dla LINE nie jest dostępna.

## Rozwiązywanie problemów

- **Weryfikacja Webhooka nie działa:** upewnij się, że URL Webhooka używa HTTPS i że
  `channelSecret` odpowiada wartości w konsoli LINE.
- **Brak zdarzeń przychodzących:** potwierdź, że ścieżka Webhooka odpowiada `channels.line.webhookPath`
  i że Gateway jest osiągalny z LINE.
- **Błędy pobierania multimediów:** zwiększ `channels.line.mediaMaxMb`, jeśli multimedia przekraczają
  domyślny limit.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i ograniczanie odpowiedzi do wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie
