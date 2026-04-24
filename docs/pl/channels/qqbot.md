---
read_when:
    - Chcesz połączyć OpenClaw z QQ
    - Potrzebujesz konfiguracji poświadczeń bota QQ
    - Chcesz obsługi bota QQ dla grup lub czatów prywatnych
summary: Konfiguracja, ustawienia i użycie bota QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-04-24T08:59:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8127ec59d3a17222e7fe883e77aa1c7d384b231b7d479385421df51c995f7dc2
    source_path: channels/qqbot.md
    workflow: 15
---

Bot QQ łączy się z OpenClaw przez oficjalne API QQ Bot (bramka WebSocket). Ten
Plugin obsługuje prywatne czaty C2C, grupowe @messages oraz wiadomości kanałów guild z
multimediami rozszerzonymi (obrazy, głos, wideo, pliki).

Status: dołączony Plugin. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, kanały guild oraz
multimedia. Reakcje i wątki nie są obsługiwane.

## Dołączony Plugin

Obecne wydania OpenClaw zawierają QQ Bot, więc zwykłe spakowane kompilacje nie wymagają
oddzielnego kroku `openclaw plugins install`.

## Konfiguracja

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR swoim
   telefonem z QQ, aby się zarejestrować / zalogować.
2. Kliknij **Create Bot**, aby utworzyć nowego bota QQ.
3. Znajdź **AppID** i **AppSecret** na stronie ustawień bota i skopiuj je.

> AppSecret nie jest przechowywany w postaci jawnego tekstu — jeśli opuścisz stronę bez jego zapisania,
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

## Konfiguracja

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

Uwagi:

- Rezerwa do zmiennych środowiskowych dotyczy tylko domyślnego konta QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` udostępnia tylko
  AppSecret; AppID musi już być ustawione w konfiguracji lub w `QQBOT_APP_ID`.
- `clientSecret` akceptuje także dane wejściowe SecretRef, nie tylko ciąg znaków w postaci jawnego tekstu.

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

Każde konto uruchamia własne połączenie WebSocket i utrzymuje niezależną pamięć podręczną
tokenów (odizolowaną przez `appId`).

Dodaj drugiego bota przez CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Głos (STT / TTS)

Obsługa STT i TTS ma dwupoziomową konfigurację z rezerwą priorytetów:

| Ustawienie | Specyficzne dla Pluginu | Rezerwa frameworka            |
| ---------- | ----------------------- | ----------------------------- |
| STT        | `channels.qqbot.stt`    | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`    | `messages.tts`                |

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

Ustaw `enabled: false` dla dowolnego z nich, aby go wyłączyć.

Zachowanie przesyłania/transkodowania dźwięku wychodzącego można też dostroić za pomocą
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formaty celu

| Format                     | Opis                 |
| -------------------------- | -------------------- |
| `qqbot:c2c:OPENID`         | Czat prywatny (C2C)  |
| `qqbot:group:GROUP_OPENID` | Czat grupowy         |
| `qqbot:channel:CHANNEL_ID` | Kanał guild          |

> Każdy bot ma własny zestaw OpenID użytkowników. OpenID otrzymany przez bota A **nie może**
> zostać użyty do wysyłania wiadomości przez bota B.

## Polecenia slash

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie      | Opis                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test opóźnienia                                                                                               |
| `/bot-version` | Pokazuje wersję frameworka OpenClaw                                                                           |
| `/bot-help`    | Wyświetla wszystkie polecenia                                                                                 |
| `/bot-upgrade` | Pokazuje link do przewodnika aktualizacji QQBot                                                               |
| `/bot-logs`    | Eksportuje ostatnie logi Gateway jako plik                                                                    |
| `/bot-approve` | Zatwierdza oczekujące działanie QQ Bot (na przykład potwierdzenie przesłania C2C lub grupowego) przez natywny przepływ. |

Dodaj `?` do dowolnego polecenia, aby wyświetlić pomoc użycia (na przykład `/bot-upgrade ?`).

## Architektura silnika

QQ Bot jest dostarczany jako samowystarczalny silnik wewnątrz Pluginu:

- Każde konto ma własny odizolowany stos zasobów (połączenie WebSocket, klient API, pamięć podręczna tokenów, katalog główny przechowywania multimediów) kluczowany przez `appId`. Konta nigdy nie współdzielą stanu ruchu przychodzącego/wychodzącego.
- Logger wielu kont oznacza linie logów właścicielem konta, dzięki czemu diagnostyka pozostaje rozdzielna, gdy uruchamiasz kilka botów pod jednym Gateway.
- Ścieżki przychodzące, wychodzące i mostka Gateway współdzielą jeden katalog główny ładunków multimedialnych w `~/.openclaw/media`, więc przesyłanie, pobieranie i pamięci podręczne transkodowania trafiają do jednego chronionego katalogu zamiast do drzewa per podsystem.
- Poświadczenia można tworzyć w kopii zapasowej i przywracać jako część standardowych migawek poświadczeń OpenClaw; po przywróceniu silnik ponownie dołącza stos zasobów każdego konta bez potrzeby ponownego parowania kodem QR.

## Onboarding kodem QR

Jako alternatywę dla ręcznego wklejania `AppID:AppSecret`, silnik obsługuje przepływ onboardingu kodem QR do połączenia QQ Bot z OpenClaw:

1. Uruchom ścieżkę konfiguracji QQ Bot (na przykład `openclaw channels add --channel qqbot`) i po wyświetleniu monitu wybierz przepływ kodu QR.
2. Zeskanuj wygenerowany kod QR aplikacją telefonu powiązaną z docelowym QQ Bot.
3. Zatwierdź parowanie na telefonie. OpenClaw zapisuje zwrócone poświadczenia w `credentials/` w odpowiednim zakresie konta.

Monity o zatwierdzenie generowane przez samego bota (na przykład przepływy „zezwolić na to działanie?” udostępniane przez API QQ Bot) są wyświetlane jako natywne monity OpenClaw, które możesz zaakceptować przez `/bot-approve`, zamiast odpowiadać przez surowego klienta QQ.

## Rozwiązywanie problemów

- **Bot odpowiada „gone to Mars”:** poświadczenia nie są skonfigurowane lub Gateway nie został uruchomiony.
- **Brak wiadomości przychodzących:** sprawdź, czy `appId` i `clientSecret` są poprawne oraz czy
  bot jest włączony na QQ Open Platform.
- **Konfiguracja z `--token-file` nadal pokazuje brak konfiguracji:** `--token-file` ustawia tylko
  AppSecret. Nadal potrzebujesz `appId` w konfiguracji lub `QQBOT_APP_ID`.
- **Wiadomości proaktywne nie docierają:** QQ może przechwytywać wiadomości inicjowane przez bota, jeśli
  użytkownik nie wchodził ostatnio w interakcję.
- **Głos nie jest transkrybowany:** upewnij się, że STT jest skonfigurowane i dostawca jest osiągalny.

## Powiązane

- [Pairing](/pl/channels/pairing)
- [Groups](/pl/channels/groups)
- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
