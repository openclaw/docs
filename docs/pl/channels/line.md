---
read_when:
    - Chcesz połączyć OpenClaw z LINE
    - Potrzebna jest konfiguracja Webhooka LINE i danych uwierzytelniających
    - Potrzebne są opcje wiadomości specyficzne dla LINE
summary: Konfiguracja, ustawienia i użycie pluginu LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-16T18:12:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31004467bc227b3a4e18168d1aa8b7f60d59e58994aeb890ac257beb2dbe8449
    source_path: channels/line.md
    workflow: 16
---

LINE łączy się z OpenClaw za pośrednictwem LINE Messaging API. Plugin działa jako odbiornik webhooków
w Gateway i używa tokenu dostępu do kanału oraz sekretu kanału
do uwierzytelniania.

Status: oficjalny Plugin, instalowany oddzielnie. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, multimedia,
lokalizacje, wiadomości Flex, wiadomości szablonowe i szybkie odpowiedzi.
Reakcje i wątki nie są obsługiwane.

## Instalacja

Przed skonfigurowaniem kanału zainstaluj LINE:

```bash
openclaw plugins install @openclaw/line
```

Lokalne repozytorium (w przypadku uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Konfiguracja początkowa

1. Utwórz konto LINE Developers i otwórz Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Utwórz (lub wybierz) Provider i dodaj kanał **Messaging API**.
3. Skopiuj **Channel access token** i **Channel secret** z ustawień kanału.
4. Włącz **Use webhook** w ustawieniach Messaging API.
5. Ustaw adres URL webhooka na punkt końcowy Gateway (wymagany HTTPS):

```text
https://gateway-host/line/webhook
```

Gateway odpowiada na weryfikację webhooka LINE (GET) i natychmiast potwierdza podpisane
zdarzenia przychodzące (POST) po zweryfikowaniu podpisu i ładunku; przetwarzanie przez agenta
jest kontynuowane asynchronicznie.
Jeśli potrzebna jest niestandardowa ścieżka, ustaw `channels.line.webhookPath` lub
`channels.line.accounts.<id>.webhookPath` i odpowiednio zaktualizuj adres URL.

Uwagi dotyczące bezpieczeństwa:

- Weryfikacja podpisu LINE zależy od treści żądania (HMAC obliczany na podstawie nieprzetworzonej treści), dlatego OpenClaw przed uwierzytelnieniem stosuje ścisły limit rozmiaru treści (64 KB) i limit czasu odczytu.
- OpenClaw przetwarza zdarzenia webhooka na podstawie zweryfikowanych, nieprzetworzonych bajtów żądania. Wartości `req.body` przekształcone przez nadrzędne oprogramowanie pośredniczące są ignorowane w celu zapewnienia integralności podpisu.

## Konfiguracja

Konfiguracja minimalna:

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

Konfiguracja publicznych wiadomości bezpośrednich:

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
Wartości konfiguracji wbudowane bezpośrednio mają pierwszeństwo przed plikami; zmienne środowiskowe stanowią ostatnią opcję rezerwową dla konta domyślnego.

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

Wiadomości bezpośrednie domyślnie wymagają parowania. Nieznani nadawcy otrzymują kod parowania, a ich
wiadomości są ignorowane do czasu zatwierdzenia:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listy dozwolonych nadawców i zasady:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie `pairing`)
- `channels.line.allowFrom`: dozwolone identyfikatory użytkowników LINE dla wiadomości bezpośrednich; `dmPolicy: "open"` wymaga `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (domyślnie `allowlist`)
- `channels.line.groupAllowFrom`: dozwolone identyfikatory użytkowników LINE dla grup; wpisy `allowFrom` dotyczące wiadomości bezpośrednich nie dopuszczają nadawców grupowych
- Nadpisania dla poszczególnych grup: `channels.line.groups.<groupId>.allowFrom` (oraz `enabled`, `requireMention`, `systemPrompt`, `skills`). W przypadku
  `groupPolicy: "allowlist"` ustaw `groupAllowFrom` lub `allowFrom` dla danej grupy; pusta lista dozwolonych nadawców grupy blokuje wiadomości grupowe nawet wtedy, gdy wiadomości bezpośrednie są otwarte.
- Do statycznych grup dostępu nadawców można odwoływać się z poziomu `allowFrom`, `groupAllowFrom` oraz `allowFrom` dla poszczególnych grup za pomocą `accessGroup:<name>`; zobacz [Grupy dostępu](/pl/channels/access-groups).
- Uwaga dotycząca środowiska uruchomieniowego: jeśli całkowicie brakuje `channels.line`, środowisko uruchomieniowe używa zastępczo `groupPolicy="allowlist"` do sprawdzania grup (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

W identyfikatorach LINE rozróżniana jest wielkość liter. Prawidłowe identyfikatory mają następującą postać:

- Użytkownik: `U` + 32 znaki szesnastkowe
- Grupa: `C` + 32 znaki szesnastkowe
- Pokój: `R` + 32 znaki szesnastkowe

## Obsługa wiadomości

- Tekst jest dzielony na fragmenty po 5000 znaków.
- Formatowanie Markdown jest usuwane; bloki kodu i tabele są w miarę możliwości konwertowane
  na karty Flex.
- Odpowiedzi strumieniowe są buforowane; LINE otrzymuje pełne fragmenty wraz z animacją
  ładowania podczas pracy agenta.
- Rozmiar pobieranych multimediów jest ograniczony przez `channels.line.mediaMaxMb` (domyślnie 10).
- Przychodzące multimedia są zapisywane w `~/.openclaw/media/inbound/` przed przekazaniem
  ich agentowi, zgodnie ze współdzielonym magazynem multimediów używanym przez inne Pluginy kanałów.

## Dane kanału (wiadomości rozszerzone)

Użyj `channelData.line`, aby wysyłać szybkie odpowiedzi, lokalizacje, karty Flex lub wiadomości
szablonowe.

```json5
{
  text: "Proszę bardzo",
  channelData: {
    line: {
      quickReplies: ["Status", "Pomoc"],
      location: {
        title: "Biuro",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Karta statusu",
        contents: {/* Ładunek Flex */},
      },
      templateMessage: {
        type: "confirm",
        text: "Kontynuować?",
        confirmLabel: "Tak",
        confirmData: "yes",
        cancelLabel: "Nie",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE zawiera również polecenie `/card` do używania ustawień wstępnych wiadomości Flex:

```text
/card info "Witamy" "Dziękujemy za dołączenie!"
```

## Obsługa ACP

LINE obsługuje powiązania konwersacji ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` wiąże bieżący czat LINE z sesją ACP bez tworzenia wątku podrzędnego.
- Skonfigurowane powiązania ACP i aktywne sesje ACP powiązane z konwersacją działają w LINE tak samo jak w innych kanałach konwersacji.

Szczegółowe informacje zawiera strona [Agenci ACP](/pl/tools/acp-agents).

## Multimedia wychodzące

Plugin LINE wysyła obrazy, filmy i dźwięk za pośrednictwem narzędzia wiadomości agenta:

- **Obrazy**: wysyłane jako wiadomości graficzne LINE; obraz podglądu domyślnie używa adresu URL multimediów.
- **Filmy**: wymagają obrazu podglądu; ustaw `channelData.line.previewImageUrl` na adres URL obrazu.
- **Dźwięk**: wysyłany jako wiadomości dźwiękowe LINE; czas trwania domyślnie wynosi 60 sekund, chyba że ustawiono `channelData.line.durationMs`.

Rodzaj multimediów jest pobierany z `channelData.line.mediaKind`, jeśli ta wartość jest ustawiona; w przeciwnym razie jest ustalany
na podstawie innych opcji LINE lub rozszerzenia pliku w adresie URL, z obrazem jako wartością domyślną.

Adresy URL wychodzących multimediów muszą być publicznymi adresami HTTPS o długości nieprzekraczającej 2000 znaków. OpenClaw
weryfikuje docelową nazwę hosta przed przekazaniem adresu URL do LINE i odrzuca adresy pętli zwrotnej,
łącza lokalnego oraz sieci prywatnych.

Ogólne wysyłanie multimediów bez opcji specyficznych dla LINE korzysta ze ścieżki obrazów.

## Rozwiązywanie problemów

- **Weryfikacja webhooka nie powiodła się:** upewnij się, że adres URL webhooka używa HTTPS, a
  `channelSecret` odpowiada wartości w LINE Console.
- **Brak zdarzeń przychodzących:** potwierdź, że ścieżka webhooka odpowiada `channels.line.webhookPath`
  i że Gateway jest dostępny z LINE.
- **Błędy pobierania multimediów:** zwiększ `channels.line.mediaMaxMb`, jeśli multimedia przekraczają
  domyślny limit.

## Powiązane materiały

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i proces parowania
- [Grupy](/pl/channels/groups) — obsługa czatów grupowych i wymóg wzmianki
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
