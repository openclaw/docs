---
read_when:
    - Chcesz połączyć OpenClaw z QQ
    - Wymagana jest konfiguracja danych uwierzytelniających QQ Bot
    - Chcesz obsługi czatów grupowych lub prywatnych w QQ Bot
summary: Konfiguracja, ustawienia i użycie bota QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-04-30T09:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 964a92021acc534b7ec2749670fedd0e8caa47d5edf67ced80f0a8fb3eda7600
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot łączy się z OpenClaw przez oficjalne QQ Bot API (WebSocket gateway). Plugin obsługuje prywatny czat C2C, grupowe @wiadomości oraz wiadomości w kanałach gildii z multimediami (obrazy, głos, wideo, pliki).

Status: dołączony Plugin. Wiadomości bezpośrednie, czaty grupowe, kanały gildii i multimedia są obsługiwane. Reakcje i wątki nie są obsługiwane.

## Dołączony Plugin

Bieżące wydania OpenClaw zawierają QQ Bot, więc zwykłe kompilacje pakietowe nie wymagają osobnego kroku `openclaw plugins install`.

## Konfiguracja

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR za pomocą QQ na telefonie, aby się zarejestrować / zalogować.
2. Kliknij **Create Bot**, aby utworzyć nowego bota QQ.
3. Znajdź **AppID** i **AppSecret** na stronie ustawień bota i skopiuj je.

> AppSecret nie jest przechowywany w postaci zwykłego tekstu — jeśli opuścisz stronę bez jego zapisania,
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

- Rezerwowe użycie zmiennych środowiskowych dotyczy tylko domyślnego konta QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` przekazuje tylko AppSecret; AppID musi już być ustawiony w konfiguracji albo w `QQBOT_APP_ID`.
- `clientSecret` akceptuje także wejście SecretRef, nie tylko zwykły ciąg tekstowy.

### Konfiguracja wielu kont

Uruchom wiele botów QQ w jednej instancji OpenClaw:

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

`groups["*"]` ustawia wartości domyślne dla każdej grupy, a konkretna pozycja `groups.GROUP_OPENID` nadpisuje te wartości domyślne dla jednej grupy. Ustawienia grup obejmują:

- `requireMention`: wymagaj @wzmianki, zanim bot odpowie. Domyślnie: `true`.
- `ignoreOtherMentions`: odrzucaj wiadomości, które wspominają kogoś innego, ale nie bota.
- `historyLimit`: zachowuj ostatnie wiadomości grupowe bez wzmianek jako kontekst dla następnej tury ze wzmianką. Ustaw `0`, aby wyłączyć.
- `toolPolicy`: `full`, `restricted` albo `none` dla narzędzi o zakresie grupy.
- `name`: przyjazna etykieta używana w logach i kontekście grupy.
- `prompt`: prompt zachowania dla danej grupy dołączany do kontekstu agenta.

Tryby aktywacji to `mention` i `always`. `requireMention: true` mapuje się na `mention`; `requireMention: false` mapuje się na `always`. Nadpisanie aktywacji na poziomie sesji, jeśli jest obecne, ma pierwszeństwo przed konfiguracją.

Kolejka przychodząca jest osobna dla każdego peera. Peery grupowe otrzymują większy limit kolejki, przy pełnej kolejce utrzymują wiadomości od ludzi przed komunikatami autorstwa bota i scalają serie zwykłych wiadomości grupowych w jedną przypisaną turę. Polecenia slash nadal uruchamiają się pojedynczo.

### Głos (STT / TTS)

Obsługa STT i TTS ma dwupoziomową konfigurację z priorytetowym mechanizmem zapasowym:

| Ustawienie | Specyficzne dla Plugin                                  | Mechanizm zapasowy frameworka |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

Ustaw `enabled: false` na dowolnym z nich, aby wyłączyć.
Nadpisania TTS na poziomie konta używają tego samego kształtu co `messages.tts` i są głęboko scalane z konfiguracją TTS kanału/globalną.

Przychodzące załączniki głosowe QQ są udostępniane agentom jako metadane multimediów audio, przy jednoczesnym utrzymaniu surowych plików głosowych poza ogólnymi `MediaPaths`. Odpowiedzi tekstowe `[[audio_as_voice]]` syntetyzują TTS i wysyłają natywną wiadomość głosową QQ, gdy TTS jest skonfigurowane.

Zachowanie wysyłania/transkodowania wychodzącego audio można też dostroić za pomocą `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formaty docelowe

| Format                     | Opis               |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Czat prywatny (C2C) |
| `qqbot:group:GROUP_OPENID` | Czat grupowy       |
| `qqbot:channel:CHANNEL_ID` | Kanał gildii       |

> Każdy bot ma własny zestaw OpenID użytkowników. OpenID otrzymany przez Bota A **nie może**
> być użyty do wysyłania wiadomości przez Bota B.

## Polecenia slash

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie      | Opis                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test opóźnienia                                                                                          |
| `/bot-version` | Pokaż wersję frameworka OpenClaw                                                                         |
| `/bot-help`    | Wyświetl wszystkie polecenia                                                                             |
| `/bot-me`      | Pokaż identyfikator użytkownika QQ nadawcy (openid) do konfiguracji `allowFrom`/`groupAllowFrom`         |
| `/bot-upgrade` | Pokaż link do przewodnika aktualizacji QQBot                                                             |
| `/bot-logs`    | Eksportuj ostatnie logi Gateway jako plik                                                                |
| `/bot-approve` | Zatwierdź oczekującą akcję QQ Bot (na przykład potwierdzenie wysłania C2C lub grupowego) przez natywny przepływ. |

Dodaj `?` do dowolnego polecenia, aby uzyskać pomoc użycia (na przykład `/bot-upgrade ?`).

Polecenia administratora (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) są dostępne tylko w wiadomościach bezpośrednich i wymagają openid nadawcy w jawnej, niezawierającej wieloznacznika liście `allowFrom`. Wieloznacznik `allowFrom: ["*"]` zezwala na czat, ale nie przyznaje dostępu do poleceń administratora. Wiadomości grupowe są najpierw dopasowywane względem `groupAllowFrom`, a następnie używają rezerwowo `allowFrom`. Uruchomienie polecenia administratora w grupie zwraca wskazówkę zamiast po cichu je odrzucać.

## Architektura silnika

QQ Bot jest dostarczany jako samodzielny silnik wewnątrz Plugin:

- Każde konto ma izolowany stos zasobów (połączenie WebSocket, klient API, pamięć podręczna tokenów, główny katalog przechowywania multimediów) kluczowany przez `appId`. Konta nigdy nie współdzielą stanu przychodzącego/wychodzącego.
- Rejestrator wielu kont oznacza wiersze logów właścicielskim kontem, dzięki czemu diagnostyka pozostaje rozdzielna, gdy uruchamiasz kilka botów pod jednym Gateway.
- Ścieżki przychodzące, wychodzące i mostka Gateway współdzielą jeden główny katalog ładunków multimedialnych pod `~/.openclaw/media`, więc wysyłki, pobrania i pamięci podręczne transkodowania trafiają do jednego chronionego katalogu zamiast do drzewa osobnego dla każdego podsystemu.
- Dostarczanie multimediów przechodzi przez jedną ścieżkę `sendMedia` dla celów C2C i grupowych. Pliki lokalne i bufory powyżej progu dużych plików używają segmentowych punktów końcowych wysyłania QQ, a mniejsze ładunki używają jednorazowego API multimediów.
- Poświadczenia mogą być kopiowane zapasowo i przywracane jako część standardowych migawek poświadczeń OpenClaw; silnik ponownie podłącza stos zasobów każdego konta przy przywracaniu bez wymagania świeżego parowania kodem QR.

## Wdrażanie kodem QR

Jako alternatywę dla ręcznego wklejania `AppID:AppSecret` silnik obsługuje przepływ wdrażania kodem QR do łączenia QQ Bot z OpenClaw:

1. Uruchom ścieżkę konfiguracji QQ Bot (na przykład `openclaw channels add --channel qqbot`) i wybierz przepływ z kodem QR po wyświetleniu monitu.
2. Zeskanuj wygenerowany kod QR aplikacją telefonu powiązaną z docelowym QQ Bot.
3. Zatwierdź parowanie na telefonie. OpenClaw utrwali zwrócone poświadczenia w `credentials/` w odpowiednim zakresie konta.

Monity zatwierdzania generowane przez samego bota (na przykład przepływy „zezwolić na tę akcję?” udostępniane przez QQ Bot API) pojawiają się jako natywne monity OpenClaw, które można zaakceptować za pomocą `/bot-approve`, zamiast odpowiadać przez surowego klienta QQ.

## Rozwiązywanie problemów

- **Bot odpowiada „gone to Mars”:** poświadczenia nie są skonfigurowane albo Gateway nie został uruchomiony.
- **Brak wiadomości przychodzących:** sprawdź, czy `appId` i `clientSecret` są poprawne, oraz czy bot jest włączony na QQ Open Platform.
- **Powtarzające się samoodpowiedzi:** OpenClaw zapisuje indeksy referencji wychodzących QQ jako autorstwa bota i ignoruje zdarzenia przychodzące, których bieżący `msgIdx` odpowiada temu samemu kontu bota. Zapobiega to pętlom echa platformy, jednocześnie nadal pozwalając użytkownikom cytować wcześniejsze wiadomości bota lub odpowiadać na nie.
- **Konfiguracja z `--token-file` nadal pokazuje brak konfiguracji:** `--token-file` ustawia tylko AppSecret. Nadal potrzebujesz `appId` w konfiguracji albo `QQBOT_APP_ID`.
- **Wiadomości proaktywne nie docierają:** QQ może przechwytywać wiadomości zainicjowane przez bota, jeśli użytkownik nie wchodził ostatnio w interakcję.
- **Głos nie jest transkrybowany:** upewnij się, że STT jest skonfigurowane, a dostawca jest osiągalny.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
