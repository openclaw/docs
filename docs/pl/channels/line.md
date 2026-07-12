---
read_when:
    - Chcesz połączyć OpenClaw z LINE
    - Potrzebujesz konfiguracji Webhook LINE i danych uwierzytelniających
    - Potrzebujesz opcji wiadomości specyficznych dla LINE
summary: Konfiguracja, ustawienia i użycie pluginu LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-12T14:53:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE łączy się z OpenClaw za pośrednictwem LINE Messaging API. Plugin działa jako odbiornik webhooków
na Gateway i używa tokenu dostępu do kanału oraz sekretu kanału do
uwierzytelniania.

Status: oficjalny Plugin, instalowany oddzielnie. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, multimedia,
lokalizacje, wiadomości Flex, wiadomości szablonowe i szybkie odpowiedzi.
Reakcje i wątki nie są obsługiwane.

## Instalacja

Zainstaluj LINE przed skonfigurowaniem kanału:

```bash
openclaw plugins install @openclaw/line
```

Lokalna kopia robocza (podczas uruchamiania z repozytorium git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Konfiguracja początkowa

1. Utwórz konto LINE Developers i otwórz konsolę:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Utwórz (lub wybierz) dostawcę i dodaj kanał **Messaging API**.
3. Skopiuj **Channel access token** i **Channel secret** z ustawień kanału.
4. Włącz **Use webhook** w ustawieniach Messaging API.
5. Ustaw adres URL webhooka na punkt końcowy Gateway (wymagany HTTPS):

```text
https://gateway-host/line/webhook
```

Gateway odpowiada na weryfikację webhooka LINE (GET) i potwierdza podpisane
zdarzenia przychodzące (POST) natychmiast po zweryfikowaniu podpisu i ładunku; przetwarzanie przez agenta
jest kontynuowane asynchronicznie.
Jeśli potrzebujesz niestandardowej ścieżki, ustaw `channels.line.webhookPath` lub
`channels.line.accounts.<id>.webhookPath` i odpowiednio zaktualizuj adres URL.

Uwagi dotyczące bezpieczeństwa:

- Weryfikacja podpisu LINE zależy od treści żądania (HMAC obliczany na podstawie nieprzetworzonej treści), dlatego OpenClaw stosuje przed uwierzytelnieniem ścisły limit rozmiaru treści (64 KB) oraz limit czasu odczytu.
- OpenClaw przetwarza zdarzenia webhooka na podstawie zweryfikowanych, nieprzetworzonych bajtów żądania. Wartości `req.body` przekształcone przez nadrzędne oprogramowanie pośredniczące są ignorowane w celu ochrony integralności podpisu.

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

Pliki tokenu i sekretu:

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
Wartości wpisane bezpośrednio w konfiguracji mają pierwszeństwo przed plikami; zmienne środowiskowe stanowią ostatnią opcję awaryjną dla konta domyślnego.

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

Listy dozwolonych i zasady:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie `pairing`)
- `channels.line.allowFrom`: identyfikatory użytkowników LINE dozwolone dla wiadomości bezpośrednich; `dmPolicy: "open"` wymaga `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (domyślnie `allowlist`)
- `channels.line.groupAllowFrom`: identyfikatory użytkowników LINE dozwolone w grupach
- Ustawienia nadpisujące dla poszczególnych grup: `channels.line.groups.<groupId>.allowFrom` (oraz `enabled`, `requireMention`, `systemPrompt`, `skills`)
- Do statycznych grup dostępu nadawców można odwoływać się z `allowFrom`, `groupAllowFrom` i ustawienia `allowFrom` poszczególnych grup za pomocą `accessGroup:<name>`; zobacz [Grupy dostępu](/pl/channels/access-groups).
- Uwaga dotycząca środowiska uruchomieniowego: jeśli całkowicie brakuje `channels.line`, podczas sprawdzania grup środowisko uruchomieniowe używa awaryjnie `groupPolicy="allowlist"` (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

W identyfikatorach LINE wielkość liter ma znaczenie. Prawidłowe identyfikatory wyglądają następująco:

- Użytkownik: `U` + 32 znaki szesnastkowe
- Grupa: `C` + 32 znaki szesnastkowe
- Pokój: `R` + 32 znaki szesnastkowe

## Obsługa wiadomości

- Tekst jest dzielony na fragmenty po 5000 znaków.
- Formatowanie Markdown jest usuwane; bloki kodu i tabele są w miarę możliwości przekształcane w
  karty Flex.
- Odpowiedzi przesyłane strumieniowo są buforowane; LINE otrzymuje pełne fragmenty z animacją
  ładowania podczas pracy agenta.
- Rozmiar pobieranych multimediów jest ograniczony przez `channels.line.mediaMaxMb` (domyślnie 10).
- Przychodzące multimedia są zapisywane w `~/.openclaw/media/inbound/` przed przekazaniem
  do agenta, zgodnie ze współdzielonym magazynem multimediów używanym przez inne Pluginy kanałów.

## Dane kanału (wiadomości rozszerzone)

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
        contents: {/* Flex payload */},
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

Plugin LINE udostępnia również polecenie `/card` dla gotowych ustawień wiadomości Flex:

```text
/card info "Welcome" "Thanks for joining!"
```

## Obsługa ACP

LINE obsługuje powiązania konwersacji ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` wiąże bieżący czat LINE z sesją ACP bez tworzenia wątku podrzędnego.
- Skonfigurowane powiązania ACP i aktywne sesje ACP powiązane z konwersacją działają w LINE tak samo jak w innych kanałach konwersacyjnych.

Szczegółowe informacje znajdziesz w sekcji [Agenci ACP](/pl/tools/acp-agents).

## Multimedia wychodzące

Plugin LINE wysyła obrazy, filmy i dźwięk za pośrednictwem narzędzia wiadomości agenta:

- **Obrazy**: wysyłane jako wiadomości obrazkowe LINE; domyślnie obraz podglądu pochodzi z adresu URL multimediów.
- **Filmy**: wymagają obrazu podglądu; ustaw `channelData.line.previewImageUrl` na adres URL obrazu.
- **Dźwięk**: wysyłany jako wiadomości dźwiękowe LINE; domyślny czas trwania wynosi 60 sekund, chyba że ustawiono `channelData.line.durationMs`.

Rodzaj multimediów jest pobierany z `channelData.line.mediaKind`, jeśli ta wartość jest ustawiona; w przeciwnym razie jest określany
na podstawie innych opcji LINE lub rozszerzenia pliku w adresie URL, a domyślnym rodzajem jest obraz.

Adresy URL wychodzących multimediów muszą być publicznymi adresami HTTPS o długości nieprzekraczającej 2000 znaków. OpenClaw
weryfikuje nazwę hosta docelowego przed przekazaniem adresu URL do LINE i odrzuca cele typu local loopback,
link-local oraz znajdujące się w sieci prywatnej.

Ogólne wysyłanie multimediów bez opcji specyficznych dla LINE korzysta ze ścieżki obrazów.

## Rozwiązywanie problemów

- **Weryfikacja webhooka nie powiedzie się:** upewnij się, że adres URL webhooka korzysta z HTTPS, a
  `channelSecret` odpowiada wartości w konsoli LINE.
- **Brak zdarzeń przychodzących:** sprawdź, czy ścieżka webhooka odpowiada `channels.line.webhookPath`
  i czy Gateway jest osiągalny z LINE.
- **Błędy pobierania multimediów:** zwiększ `channels.line.mediaMaxMb`, jeśli multimedia przekraczają
  domyślny limit.

## Powiązane materiały

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i proces parowania
- [Grupy](/pl/channels/groups) — działanie czatów grupowych i wymóg wzmianki
- [Trasowanie kanałów](/pl/channels/channel-routing) — trasowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
