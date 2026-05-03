---
read_when:
    - Chcesz połączyć OpenClaw z QQ
    - Potrzebujesz konfiguracji danych uwierzytelniających QQ Bot
    - Potrzebujesz obsługi czatów grupowych lub prywatnych w QQ Bot
summary: Instalacja, konfiguracja i użycie bota QQ
title: bot QQ
x-i18n:
    generated_at: "2026-05-03T21:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 471c24110bf0ab8896d22f5bb5932ac4e03ff5169560c99ba6b9d1ca4025d9a8
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot łączy się z OpenClaw przez oficjalne API QQ Bot (Gateway WebSocket). Plugin obsługuje prywatny czat C2C, @wiadomości grupowe oraz wiadomości w kanałach gildii z bogatymi multimediami (obrazy, głos, wideo, pliki).

Status: Plugin do pobrania. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, kanały gildii oraz multimedia. Reakcje i wątki nie są obsługiwane.

## Instalacja

Zainstaluj QQ Bot przed konfiguracją:

```bash
openclaw plugins install @openclaw/qqbot
```

## Konfiguracja

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR telefonem z QQ, aby się zarejestrować / zalogować.
2. Kliknij **Create Bot**, aby utworzyć nowego bota QQ.
3. Znajdź **AppID** i **AppSecret** na stronie ustawień bota i skopiuj je.

> AppSecret nie jest przechowywany w postaci zwykłego tekstu — jeśli opuścisz stronę bez zapisania go,
> trzeba będzie wygenerować nowy.

4. Dodaj kanał:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Uruchom ponownie Gateway.

Interaktywne ścieżki konfiguracji:

```bash
openclaw channels add
openclaw configure --section channels
```

## Konfigurowanie

Minimalna konfiguracja:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Zmienne środowiskowe konta domyślnego:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret oparty na pliku:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

AppSecret jako SecretRef ze zmiennej środowiskowej:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

Uwagi:

- Rezerwowe użycie zmiennych środowiskowych dotyczy tylko domyślnego konta QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` udostępnia tylko
  AppSecret; AppID musi być już ustawiony w konfiguracji albo w `QQBOT_APP_ID`.
- `clientSecret` przyjmuje też dane wejściowe SecretRef, nie tylko ciąg zwykłego tekstu.
- Starsze ciągi znaczników `secretref:/...` nie są prawidłowymi wartościami `clientSecret`;
  używaj strukturalnych obiektów SecretRef, jak w przykładzie powyżej.

### Konfiguracja wielu kont

Uruchamiaj wiele botów QQ w jednej instancji OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Każde konto uruchamia własne połączenie WebSocket i utrzymuje niezależną pamięć podręczną tokenów (izolowaną według `appId`).

Dodaj drugiego bota przez CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Czaty grupowe

Obsługa czatów grupowych QQ Bot używa grupowych OpenID QQ, a nie nazw wyświetlanych. Dodaj bota do grupy, a następnie wspomnij o nim albo skonfiguruj grupę tak, aby działała bez wzmianki.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` ustawia wartości domyślne dla każdej grupy, a konkretna pozycja
`groups.GROUP_OPENID` zastępuje te wartości domyślne dla jednej grupy. Ustawienia grup obejmują:

- `requireMention`: wymaga @wzmianki, zanim bot odpowie. Domyślnie: `true`.
- `ignoreOtherMentions`: odrzuca wiadomości, które wspominają kogoś innego, ale nie bota.
- `historyLimit`: zachowuje ostatnie wiadomości grupowe bez wzmianki jako kontekst dla następnej tury ze wzmianką. Ustaw `0`, aby wyłączyć.
- `toolPolicy`: `full`, `restricted` albo `none` dla narzędzi w zakresie grupy.
- `name`: przyjazna etykieta używana w dziennikach i kontekście grupy.
- `prompt`: prompt zachowania dla grupy dodawany do kontekstu agenta.

Tryby aktywacji to `mention` i `always`. `requireMention: true` mapuje na
`mention`; `requireMention: false` mapuje na `always`. Jeśli istnieje zastąpienie aktywacji na poziomie sesji, ma ono pierwszeństwo przed konfiguracją.

Kolejka przychodząca jest osobna dla każdego peera. Peery grupowe dostają większy limit kolejki, zachowują wiadomości od ludzi przed treściami botów, gdy kolejka jest pełna, oraz łączą serie zwykłych wiadomości grupowych w jedną przypisaną turę. Polecenia z ukośnikiem nadal uruchamiają się pojedynczo.

### Głos (STT / TTS)

Obsługa STT i TTS używa dwupoziomowej konfiguracji z priorytetowym mechanizmem rezerwowym:

| Ustawienie | Specyficzne dla Pluginu                                  | Rezerwowe ustawienie frameworka |
| ---------- | -------------------------------------------------------- | -------------------------------- |
| STT        | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]`    |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                   |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        qq-main: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Ustaw `enabled: false` na dowolnym z nich, aby go wyłączyć.
Zastąpienia TTS na poziomie konta używają tego samego kształtu co `messages.tts` i są głęboko scalane z konfiguracją TTS kanału/globalną.

Przychodzące załączniki głosowe QQ są udostępniane agentom jako metadane multimediów audio, a surowe pliki głosowe pozostają poza ogólnymi `MediaPaths`. Odpowiedzi zwykłym tekstem `[[audio_as_voice]]` syntetyzują TTS i wysyłają natywną wiadomość głosową QQ, gdy TTS jest skonfigurowany.

Zachowanie wysyłania/transkodowania dźwięku wychodzącego można też dostroić za pomocą
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formaty docelowe

| Format                     | Opis                 |
| -------------------------- | -------------------- |
| `qqbot:c2c:OPENID`         | Prywatny czat (C2C)  |
| `qqbot:group:GROUP_OPENID` | Czat grupowy         |
| `qqbot:channel:CHANNEL_ID` | Kanał gildii         |

> Każdy bot ma własny zestaw OpenID użytkowników. OpenID otrzymanego przez Bota A **nie można**
> użyć do wysyłania wiadomości przez Bota B.

## Polecenia z ukośnikiem

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie      | Opis                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test opóźnienia                                                                                           |
| `/bot-version` | Pokazuje wersję frameworka OpenClaw                                                                        |
| `/bot-help`    | Wyświetla wszystkie polecenia                                                                             |
| `/bot-me`      | Pokazuje identyfikator użytkownika QQ nadawcy (openid) do konfiguracji `allowFrom`/`groupAllowFrom`       |
| `/bot-upgrade` | Pokazuje link do przewodnika aktualizacji QQBot                                                           |
| `/bot-logs`    | Eksportuje ostatnie dzienniki Gateway jako plik                                                           |
| `/bot-approve` | Zatwierdza oczekującą akcję QQ Bot (na przykład potwierdzenie przesłania C2C lub grupowego) przez natywny przepływ. |

Dodaj `?` do dowolnego polecenia, aby uzyskać pomoc użycia (na przykład `/bot-upgrade ?`).

Polecenia administratora (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) są dostępne tylko w wiadomościach bezpośrednich i wymagają `openid` nadawcy na jawnej liście `allowFrom` bez symbolu wieloznacznego. Symbol wieloznaczny `allowFrom: ["*"]` zezwala na czat, ale nie przyznaje dostępu do poleceń administratora. Wiadomości grupowe są najpierw dopasowywane względem `groupAllowFrom`, a potem rezerwowo względem `allowFrom`. Uruchomienie polecenia administratora w grupie zwraca wskazówkę zamiast cicho je odrzucać.

## Architektura silnika

QQ Bot jest dostarczany jako samodzielny silnik wewnątrz Pluginu:

- Każde konto ma izolowany stos zasobów (połączenie WebSocket, klient API, pamięć podręczna tokenów, główny katalog przechowywania multimediów) z kluczem według `appId`. Konta nigdy nie współdzielą stanu przychodzącego/wychodzącego.
- Rejestrator wielu kont oznacza wiersze dziennika kontem właściciela, aby diagnostyka pozostawała rozdzielna podczas uruchamiania kilku botów pod jednym gatewayem.
- Ścieżki przychodzące, wychodzące i mostka Gateway współdzielą jeden główny katalog ładunków multimediów pod `~/.openclaw/media`, dzięki czemu wysyłki, pobrania i pamięci podręczne transkodowania trafiają do jednego chronionego katalogu zamiast do drzewa osobnego dla każdego podsystemu.
- Dostarczanie bogatych multimediów przechodzi przez jedną ścieżkę `sendMedia` dla celów C2C i grupowych. Pliki lokalne i bufory powyżej progu dużych plików używają segmentowanych punktów końcowych wysyłania QQ, a mniejsze ładunki używają jednorazowego API multimediów.
- Dane uwierzytelniające można tworzyć jako kopię zapasową i przywracać jako część standardowych migawek danych uwierzytelniających OpenClaw; silnik ponownie dołącza stos zasobów każdego konta po przywróceniu bez wymagania świeżej pary kodu QR.

## Wdrażanie kodem QR

Jako alternatywę dla ręcznego wklejania `AppID:AppSecret` silnik obsługuje przepływ wdrażania kodem QR do łączenia QQ Bot z OpenClaw:

1. Uruchom ścieżkę konfiguracji QQ Bot (na przykład `openclaw channels add --channel qqbot`) i wybierz przepływ kodu QR, gdy pojawi się monit.
2. Zeskanuj wygenerowany kod QR aplikacją w telefonie powiązaną z docelowym QQ Bot.
3. Zatwierdź parowanie w telefonie. OpenClaw zapisze zwrócone dane uwierzytelniające w `credentials/` we właściwym zakresie konta.

Monity zatwierdzenia generowane przez samego bota (na przykład przepływy „zezwolić na tę akcję?” udostępniane przez API QQ Bot) pojawiają się jako natywne monity OpenClaw, które można zaakceptować za pomocą `/bot-approve` zamiast odpowiadać przez surowego klienta QQ.

## Rozwiązywanie problemów

- **Bot odpowiada „gone to Mars”:** dane uwierzytelniające nie są skonfigurowane albo Gateway nie został uruchomiony.
- **Brak wiadomości przychodzących:** sprawdź, czy `appId` i `clientSecret` są poprawne oraz czy bot jest włączony na QQ Open Platform.
- **Powtarzające się samoodpowiedzi:** OpenClaw zapisuje indeksy odwołań wychodzących QQ jako utworzone przez bota i ignoruje zdarzenia przychodzące, których bieżące `msgIdx` pasuje do tego samego konta bota. Zapobiega to pętlom echa platformy, nadal pozwalając użytkownikom cytować poprzednie wiadomości bota lub na nie odpowiadać.
- **Konfiguracja z `--token-file` nadal pokazuje brak konfiguracji:** `--token-file` ustawia tylko AppSecret. Nadal potrzebujesz `appId` w konfiguracji albo `QQBOT_APP_ID`.
- **Wiadomości proaktywne nie docierają:** QQ może przechwytywać wiadomości inicjowane przez bota, jeśli użytkownik nie wchodził ostatnio w interakcję.
- **Głos nie jest transkrybowany:** upewnij się, że STT jest skonfigurowane, a dostawca jest osiągalny.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
