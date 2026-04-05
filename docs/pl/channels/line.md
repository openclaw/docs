---
read_when:
    - Chcesz połączyć OpenClaw z LINE
    - Potrzebujesz konfiguracji webhooka i poświadczeń LINE
    - Chcesz używać opcji wiadomości specyficznych dla LINE
summary: Konfiguracja, ustawienia i użycie pluginu LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-05T13:43:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4782b2aa3e8654505d7f1fd6fc112adf125b5010fc84d655d033688ded37414
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE łączy się z OpenClaw przez LINE Messaging API. Plugin działa jako odbiornik
webhooków na gatewayu i używa tokenu dostępu kanału oraz sekretu kanału do
uwierzytelniania.

Status: dołączony plugin. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, media, lokalizacje, wiadomości Flex,
wiadomości szablonowe i szybkie odpowiedzi. Reakcje i wątki
nie są obsługiwane.

## Dołączony plugin

LINE jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw, więc zwykłe
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
5. Ustaw URL webhooka na punkt końcowy gatewaya (wymagane HTTPS):

```
https://gateway-host/line/webhook
```

Gateway odpowiada na weryfikację webhooka LINE (GET) i zdarzenia przychodzące (POST).
Jeśli potrzebujesz niestandardowej ścieżki, ustaw `channels.line.webhookPath` lub
`channels.line.accounts.<id>.webhookPath` i odpowiednio zaktualizuj URL.

Uwaga dotycząca bezpieczeństwa:

- Weryfikacja podpisu LINE zależy od treści żądania (HMAC na surowej treści), więc OpenClaw stosuje ścisłe limity rozmiaru treści przed uwierzytelnieniem oraz limit czasu przed weryfikacją.
- OpenClaw przetwarza zdarzenia webhooka na podstawie zweryfikowanych surowych bajtów żądania. Przekształcone przez middleware wartości `req.body` są ignorowane ze względu na bezpieczeństwo integralności podpisu.

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
wiadomości są ignorowane do momentu zatwierdzenia.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listy dozwolonych i zasady:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: lista dozwolonych identyfikatorów użytkowników LINE dla DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: lista dozwolonych identyfikatorów użytkowników LINE dla grup
- Nadpisania per grupa: `channels.line.groups.<groupId>.allowFrom`
- Uwaga dotycząca środowiska uruchomieniowego: jeśli `channels.line` jest całkowicie pominięte, środowisko uruchomieniowe wraca do `groupPolicy="allowlist"` przy sprawdzaniu grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

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
- Pobieranie mediów jest ograniczone przez `channels.line.mediaMaxMb` (domyślnie 10).

## Dane kanału (bogate wiadomości)

Użyj `channelData.line`, aby wysyłać szybkie odpowiedzi, lokalizacje, karty Flex lub
wiadomości szablonowe.

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
- Skonfigurowane powiązania ACP i aktywne sesje ACP powiązane z konwersacją działają w LINE tak samo jak w innych kanałach konwersacyjnych.

Szczegóły znajdziesz w [agenci ACP](/tools/acp-agents).

## Media wychodzące

Plugin LINE obsługuje wysyłanie obrazów, filmów i plików audio przez narzędzie wiadomości agenta. Media są wysyłane przez ścieżkę dostarczania specyficzną dla LINE z odpowiednią obsługą podglądu i śledzenia:

- **Obrazy**: wysyłane jako wiadomości obrazkowe LINE z automatycznym generowaniem podglądu.
- **Filmy**: wysyłane z jawną obsługą podglądu i typu treści.
- **Audio**: wysyłane jako wiadomości audio LINE.

Ogólne wysyłanie mediów wraca do istniejącej ścieżki tylko dla obrazów, gdy ścieżka specyficzna dla LINE nie jest dostępna.

## Rozwiązywanie problemów

- **Weryfikacja webhooka nie działa:** upewnij się, że URL webhooka używa HTTPS i że
  `channelSecret` odpowiada wartości w konsoli LINE.
- **Brak zdarzeń przychodzących:** potwierdź, że ścieżka webhooka odpowiada `channels.line.webhookPath`
  i że gateway jest osiągalny z LINE.
- **Błędy pobierania mediów:** zwiększ `channels.line.mediaMaxMb`, jeśli media przekraczają
  domyślny limit.

## Powiązane

- [Przegląd kanałów](/channels) — wszystkie obsługiwane kanały
- [Parowanie](/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Routing kanałów](/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/gateway/security) — model dostępu i utwardzanie
