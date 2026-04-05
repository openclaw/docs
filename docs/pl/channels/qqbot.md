---
read_when:
    - Chcesz połączyć OpenClaw z QQ
    - Potrzebujesz skonfigurować poświadczenia QQ Bot
    - Chcesz korzystać z obsługi grup lub czatów prywatnych w QQ Bot
summary: Konfiguracja, ustawienia i użycie QQ Bot
title: QQ Bot
x-i18n:
    generated_at: "2026-04-05T13:44:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e58fb7b07c59ecbf80a1276368c4a007b45d84e296ed40cffe9845e0953696c
    source_path: channels/qqbot.md
    workflow: 15
---

# QQ Bot

QQ Bot łączy się z OpenClaw przez oficjalne API QQ Bot (bramka WebSocket). Wtyczka
obsługuje prywatne czaty C2C, grupowe @wiadomości oraz wiadomości na kanałach guild z
multimediami rozszerzonymi (obrazy, głos, wideo, pliki).

Status: wtyczka dołączona do pakietu. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, kanały guild oraz
multimedia. Reakcje i wątki nie są obsługiwane.

## Wtyczka dołączona do pakietu

Obecne wydania OpenClaw zawierają QQ Bot, więc normalne skompilowane buildy nie wymagają
osobnego kroku `openclaw plugins install`.

## Konfiguracja

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR telefonem z QQ,
   aby się zarejestrować / zalogować.
2. Kliknij **Create Bot**, aby utworzyć nowego bota QQ.
3. Znajdź **AppID** i **AppSecret** na stronie ustawień bota i skopiuj je.

> AppSecret nie jest przechowywany w postaci jawnego tekstu — jeśli opuścisz stronę bez zapisania go,
> konieczne będzie wygenerowanie nowego.

4. Dodaj kanał:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Uruchom ponownie gateway.

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

AppSecret przechowywany w pliku:

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

- Zmienna środowiskowa jako fallback dotyczy tylko domyślnego konta QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` przekazuje tylko
  AppSecret; AppID musi już być ustawione w konfiguracji lub w `QQBOT_APP_ID`.
- `clientSecret` akceptuje również dane wejściowe SecretRef, a nie tylko ciąg jawnego tekstu.

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
tokenów (izolowaną przez `appId`).

Dodaj drugiego bota przez CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Głos (STT / TTS)

Obsługa STT i TTS używa dwupoziomowej konfiguracji z fallbackiem priorytetów:

| Ustawienie | Specyficzne dla wtyczki | Fallback frameworka           |
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

Zachowanie przesyłania/transkodowania dźwięku wychodzącego można również dostroić za pomocą
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formaty docelowe

| Format                     | Opis                |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | Czat prywatny (C2C) |
| `qqbot:group:GROUP_OPENID` | Czat grupowy        |
| `qqbot:channel:CHANNEL_ID` | Kanał guild         |

> Każdy bot ma własny zestaw OpenID użytkowników. OpenID otrzymany przez Bota A **nie może**
> zostać użyty do wysyłania wiadomości przez Bota B.

## Polecenia slash

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie     | Opis                                      |
| ------------- | ----------------------------------------- |
| `/bot-ping`    | Test opóźnienia                          |
| `/bot-version` | Pokazuje wersję frameworka OpenClaw      |
| `/bot-help`    | Wyświetla listę wszystkich poleceń       |
| `/bot-upgrade` | Pokazuje link do przewodnika aktualizacji QQBot |
| `/bot-logs`    | Eksportuje ostatnie logi gateway jako plik |

Dodaj `?` do dowolnego polecenia, aby wyświetlić pomoc użycia (na przykład `/bot-upgrade ?`).

## Rozwiązywanie problemów

- **Bot odpowiada „gone to Mars”:** poświadczenia nie są skonfigurowane lub gateway nie został uruchomiony.
- **Brak wiadomości przychodzących:** sprawdź, czy `appId` i `clientSecret` są poprawne oraz czy
  bot jest włączony na QQ Open Platform.
- **Konfiguracja z `--token-file` nadal pokazuje brak konfiguracji:** `--token-file` ustawia tylko
  AppSecret. Nadal potrzebujesz `appId` w konfiguracji lub `QQBOT_APP_ID`.
- **Wiadomości proaktywne nie docierają:** QQ może przechwytywać wiadomości inicjowane przez bota, jeśli
  użytkownik nie wchodził ostatnio w interakcję.
- **Głos nie jest transkrybowany:** upewnij się, że STT jest skonfigurowane i że dostawca jest osiągalny.
