---
read_when:
    - Chcesz połączyć OpenClaw z QQ
    - Potrzebujesz konfiguracji danych uwierzytelniających bota QQ
    - Chcesz obsługi grup bota QQ lub czatów prywatnych
summary: Konfiguracja, ustawienia i użycie bota QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-04-22T04:20:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49a5ae5615935a435a69748a3c4465ae8c33d3ab84db5e37fd8beec70506ce36
    source_path: channels/qqbot.md
    workflow: 15
---

# Bot QQ

Bot QQ łączy się z OpenClaw przez oficjalne API QQ Bot (brama WebSocket). Ten
plugin obsługuje prywatne czaty C2C, grupowe wiadomości @ oraz wiadomości kanałów guild z
rozbudowanymi multimediami (obrazy, głos, wideo, pliki).

Status: plugin dołączony. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, kanały guild oraz
multimedia. Reakcje i wątki nie są obsługiwane.

## Plugin dołączony

Aktualne wydania OpenClaw zawierają bota QQ, więc standardowe spakowane kompilacje nie wymagają
osobnego kroku `openclaw plugins install`.

## Konfiguracja

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR swoim
   telefonem z QQ, aby się zarejestrować / zalogować.
2. Kliknij **Create Bot**, aby utworzyć nowego bota QQ.
3. Znajdź **AppID** i **AppSecret** na stronie ustawień bota i skopiuj je.

> AppSecret nie jest przechowywany w postaci jawnego tekstu — jeśli opuścisz stronę bez zapisania go,
> konieczne będzie wygenerowanie nowego.

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

## Skonfiguruj

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

AppSecret z pliku:

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

Uwagi:

- Zmienne środowiskowe jako mechanizm zapasowy dotyczą tylko domyślnego konta QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` dostarcza tylko
  AppSecret; AppID musi już być ustawione w konfiguracji lub w `QQBOT_APP_ID`.
- `clientSecret` akceptuje także dane wejściowe SecretRef, a nie tylko ciąg tekstowy w postaci jawnej.

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

Każde konto uruchamia własne połączenie WebSocket i utrzymuje niezależną
pamięć podręczną tokenów (izolowaną przez `appId`).

Dodaj drugiego bota przez CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Głos (STT / TTS)

Obsługa STT i TTS ma dwupoziomową konfigurację z zapasowym mechanizmem priorytetowym:

| Ustawienie | Specyficzne dla pluginu | Zapasowe ustawienie frameworka |
| ---------- | ----------------------- | ------------------------------ |
| STT        | `channels.qqbot.stt`    | `tools.media.audio.models[0]`  |
| TTS        | `channels.qqbot.tts`    | `messages.tts`                 |

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
    },
  },
}
```

Ustaw `enabled: false` dla któregoś z nich, aby go wyłączyć.

Zachowanie wysyłania/przekształcania wychodzącego audio można także dostroić za pomocą
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formaty docelowe

| Format                     | Opis                 |
| -------------------------- | -------------------- |
| `qqbot:c2c:OPENID`         | Prywatny czat (C2C)  |
| `qqbot:group:GROUP_OPENID` | Czat grupowy         |
| `qqbot:channel:CHANNEL_ID` | Kanał guild          |

> Każdy bot ma własny zestaw OpenID użytkowników. OpenID otrzymany przez Bota A **nie może**
> być użyty do wysyłania wiadomości przez Bota B.

## Polecenia ukośnikowe

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie      | Opis                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test opóźnienia                                                                                                     |
| `/bot-version` | Pokaż wersję frameworka OpenClaw                                                                                    |
| `/bot-help`    | Wyświetl listę wszystkich poleceń                                                                                   |
| `/bot-upgrade` | Pokaż link do przewodnika aktualizacji QQBot                                                                        |
| `/bot-logs`    | Wyeksportuj ostatnie logi Gateway jako plik                                                                         |
| `/bot-approve` | Zatwierdź oczekujące działanie QQ Bot (na przykład potwierdzenie wysyłania w C2C lub grupie) przez natywny przepływ. |

Dodaj `?` do dowolnego polecenia, aby uzyskać pomoc dotyczącą użycia (na przykład `/bot-upgrade ?`).

## Architektura silnika

QQ Bot jest dostarczany jako samodzielny silnik wewnątrz pluginu:

- Każde konto ma własny izolowany stos zasobów (połączenie WebSocket, klient API, pamięć podręczną tokenów, katalog główny przechowywania multimediów) powiązany z `appId`. Konta nigdy nie współdzielą stanu przychodzącego/wychodzącego.
- Rejestrator dla wielu kont oznacza linie logów właścicielem konta, dzięki czemu diagnostyka pozostaje rozdzielona, gdy uruchamiasz kilka botów w jednej bramie.
- Ścieżki przychodzące, wychodzące i mostu Gateway współdzielą jeden katalog główny ładunków multimedialnych w `~/.openclaw/media`, więc wysyłanie, pobieranie i pamięci podręczne transkodowania trafiają do jednego chronionego katalogu zamiast do drzewa dla każdego podsystemu osobno.
- Dane uwierzytelniające można archiwizować i przywracać w ramach standardowych migawek danych uwierzytelniających OpenClaw; po przywróceniu silnik ponownie dołącza stos zasobów każdego konta bez konieczności ponownego parowania kodem QR.

## Onboarding z kodem QR

Jako alternatywę dla ręcznego wklejania `AppID:AppSecret`, silnik obsługuje przepływ onboardingu z kodem QR do łączenia QQ Bot z OpenClaw:

1. Uruchom ścieżkę konfiguracji QQ Bot (na przykład `openclaw channels add --channel qqbot`) i po wyświetleniu monitu wybierz przepływ z kodem QR.
2. Zeskanuj wygenerowany kod QR aplikacją telefonu powiązaną z docelowym QQ Bot.
3. Zatwierdź parowanie na telefonie. OpenClaw zapisze zwrócone dane uwierzytelniające w `credentials/` we właściwym zakresie konta.

Monity o zatwierdzenie generowane przez samego bota (na przykład przepływy „zezwolić na to działanie?” udostępniane przez API QQ Bot) są wyświetlane jako natywne monity OpenClaw, które możesz zaakceptować poleceniem `/bot-approve` zamiast odpowiadać przez surowego klienta QQ.

## Rozwiązywanie problemów

- **Bot odpowiada „gone to Mars”:** dane uwierzytelniające nie są skonfigurowane albo Gateway nie został uruchomiony.
- **Brak wiadomości przychodzących:** sprawdź, czy `appId` i `clientSecret` są poprawne oraz czy
  bot jest włączony na QQ Open Platform.
- **Konfiguracja z `--token-file` nadal pokazuje brak konfiguracji:** `--token-file` ustawia tylko
  AppSecret. Nadal potrzebujesz `appId` w konfiguracji lub `QQBOT_APP_ID`.
- **Wiadomości proaktywne nie docierają:** QQ może przechwytywać wiadomości inicjowane przez bota, jeśli
  użytkownik nie wchodził ostatnio w interakcję.
- **Głos nie jest transkrybowany:** upewnij się, że STT jest skonfigurowane i że dostawca jest osiągalny.
