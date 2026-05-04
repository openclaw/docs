---
read_when:
    - Chcesz połączyć OpenClaw z QQ
    - Wymagana jest konfiguracja danych uwierzytelniających QQ Bot
    - Potrzebujesz obsługi czatów grupowych lub prywatnych w QQ Bot
summary: Konfiguracja wstępna, ustawienia i użycie QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-05-04T02:21:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e17fa0da2f6939ed28cac5f13b3e37e6c63b87a10250ff213f7a86685a6141d6
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot łączy się z OpenClaw przez oficjalne API QQ Bot (brama WebSocket). Plugin obsługuje prywatny czat C2C, @wiadomości grupowe oraz wiadomości w kanałach gildii z bogatymi multimediami (obrazy, głos, wideo, pliki).

Status: Plugin do pobrania. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, kanały gildii i multimedia. Reakcje i wątki nie są obsługiwane.

## Instalacja

Zainstaluj QQ Bot przed konfiguracją:

```bash
openclaw plugins install @openclaw/qqbot
```

## Konfiguracja

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR za pomocą
   QQ na telefonie, aby się zarejestrować / zalogować.
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

AppSecret Env SecretRef:

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

- Fallback środowiskowy dotyczy tylko domyślnego konta QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` udostępnia tylko
  AppSecret; AppID musi być już ustawiony w konfiguracji lub `QQBOT_APP_ID`.
- `clientSecret` akceptuje też dane wejściowe SecretRef, nie tylko zwykły ciąg tekstowy.
- Starsze ciągi znaczników `secretref:/...` nie są prawidłowymi wartościami `clientSecret`;
  użyj strukturalnych obiektów SecretRef, takich jak w powyższym przykładzie.

### Konfiguracja wielu kont

Uruchom kilka botów QQ w ramach jednej instancji OpenClaw:

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
pamięć podręczną tokenów (izolowaną według `appId`).

Dodaj drugiego bota przez CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Czaty grupowe

Obsługa czatów grupowych QQ Bot używa OpenID grup QQ, a nie nazw wyświetlanych. Dodaj bota
do grupy, a następnie wspomnij o nim lub skonfiguruj grupę tak, aby działała bez wzmianki.

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
`groups.GROUP_OPENID` zastępuje te wartości domyślne dla jednej grupy. Ustawienia grupy
obejmują:

- `requireMention`: wymaga @wzmianki, zanim bot odpowie. Domyślnie: `true`.
- `ignoreOtherMentions`: odrzuca wiadomości, które wspominają kogoś innego, ale nie bota.
- `historyLimit`: zachowuje najnowsze wiadomości grupowe bez wzmianki jako kontekst dla następnej tury ze wzmianką. Ustaw `0`, aby wyłączyć.
- `toolPolicy`: `full`, `restricted` lub `none` dla narzędzi o zakresie grupy.
- `name`: przyjazna etykieta używana w logach i kontekście grupy.
- `prompt`: prompt zachowania dla danej grupy dołączany do kontekstu agenta.

Tryby aktywacji to `mention` i `always`. `requireMention: true` mapuje się na
`mention`; `requireMention: false` mapuje się na `always`. Nadpisanie aktywacji
na poziomie sesji, jeśli istnieje, ma pierwszeństwo przed konfiguracją.

Kolejka przychodząca jest osobna dla każdego peera. Peery grupowe otrzymują większy limit kolejki, utrzymują wiadomości
od ludzi przed treściami autorstwa bota, gdy kolejka jest pełna, i scalają serie zwykłych
wiadomości grupowych w jedną przypisaną turę. Polecenia ukośnikiem nadal uruchamiają się pojedynczo.

### Głos (STT / TTS)

Obsługa STT i TTS ma dwupoziomową konfigurację z priorytetowym fallbackiem:

| Ustawienie | Specyficzne dla Pluginu                                   | Fallback frameworka           |
| ---------- | --------------------------------------------------------- | ----------------------------- |
| STT        | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`  | `messages.tts`                |

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
        "qq-main": {
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

Ustaw `enabled: false` dla dowolnego z nich, aby wyłączyć.
Nadpisania TTS na poziomie konta używają tego samego kształtu co `messages.tts` i są głęboko scalane
z konfiguracją TTS kanału/globalną.

Przychodzące załączniki głosowe QQ są udostępniane agentom jako metadane multimediów audio, jednocześnie
nie trafiając jako surowe pliki głosowe do ogólnych `MediaPaths`. Odpowiedzi tekstowe zwykłe `[[audio_as_voice]]`
syntetyzują TTS i wysyłają natywną wiadomość głosową QQ, gdy TTS jest
skonfigurowane.

Zachowanie wysyłania/transkodowania wychodzącego audio można też dostroić przez
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formaty docelowe

| Format                     | Opis                 |
| -------------------------- | -------------------- |
| `qqbot:c2c:OPENID`         | Czat prywatny (C2C)  |
| `qqbot:group:GROUP_OPENID` | Czat grupowy         |
| `qqbot:channel:CHANNEL_ID` | Kanał gildii         |

> Każdy bot ma własny zestaw OpenID użytkowników. OpenID otrzymanego przez Bota A **nie można**
> użyć do wysyłania wiadomości przez Bota B.

## Polecenia ukośnikiem

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie      | Opis                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test opóźnienia                                                                                           |
| `/bot-version` | Pokazuje wersję frameworka OpenClaw                                                                        |
| `/bot-help`    | Wyświetla wszystkie polecenia                                                                              |
| `/bot-me`      | Pokazuje identyfikator użytkownika QQ nadawcy (openid) do konfiguracji `allowFrom`/`groupAllowFrom`       |
| `/bot-upgrade` | Pokazuje link do przewodnika aktualizacji QQBot                                                            |
| `/bot-logs`    | Eksportuje najnowsze logi Gateway jako plik                                                                |
| `/bot-approve` | Zatwierdza oczekującą akcję QQ Bot (na przykład potwierdzenie wysyłania C2C lub grupowego) przez natywny przepływ. |

Dodaj `?` do dowolnego polecenia, aby uzyskać pomoc dotyczącą użycia (na przykład `/bot-upgrade ?`).

Polecenia administratora (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) działają tylko w wiadomościach bezpośrednich i wymagają openid nadawcy na jawnej liście `allowFrom` bez symbolu wieloznacznego. Symbol wieloznaczny `allowFrom: ["*"]` zezwala na czat, ale nie przyznaje dostępu do poleceń administratora. Wiadomości grupowe są najpierw dopasowywane względem `groupAllowFrom`, a potem przechodzą fallback do `allowFrom`. Uruchomienie polecenia administratora w grupie zwraca wskazówkę zamiast cicho je odrzucać.

## Architektura silnika

QQ Bot jest dostarczany jako samodzielny silnik wewnątrz Pluginu:

- Każde konto ma własny izolowany stos zasobów (połączenie WebSocket, klient API, pamięć podręczna tokenów, główny katalog przechowywania multimediów) kluczowany przez `appId`. Konta nigdy nie współdzielą stanu przychodzącego/wychodzącego.
- Logger wielu kont oznacza linie logów kontem właściciela, dzięki czemu diagnostyka pozostaje rozdzielna, gdy uruchamiasz kilka botów w ramach jednego gateway.
- Ścieżki przychodzące, wychodzące i mostka gateway współdzielą jeden główny katalog ładunków multimedialnych pod `~/.openclaw/media`, więc wysyłki, pobrania i pamięci podręczne transkodowania trafiają do jednego chronionego katalogu zamiast drzewa osobnego dla każdego podsystemu.
- Dostarczanie bogatych multimediów przechodzi przez jedną ścieżkę `sendMedia` dla celów C2C i grupowych. Pliki lokalne i bufory powyżej progu dużego pliku używają segmentowanych punktów końcowych wysyłania QQ, a mniejsze ładunki używają jednorazowego API multimediów.
- Dane uwierzytelniające mogą być tworzone w kopii zapasowej i przywracane jako część standardowych migawek danych uwierzytelniających OpenClaw; silnik ponownie podłącza stos zasobów każdego konta po przywróceniu bez potrzeby nowego parowania kodem QR.

## Wdrażanie kodem QR

Jako alternatywę dla ręcznego wklejania `AppID:AppSecret` silnik obsługuje przepływ wdrażania kodem QR do łączenia QQ Bot z OpenClaw:

1. Uruchom ścieżkę konfiguracji QQ Bot (na przykład `openclaw channels add --channel qqbot`) i wybierz przepływ kodu QR po wyświetleniu monitu.
2. Zeskanuj wygenerowany kod QR aplikacją na telefonie powiązaną z docelowym QQ Bot.
3. Zatwierdź parowanie na telefonie. OpenClaw zapisuje zwrócone dane uwierzytelniające w `credentials/` w odpowiednim zakresie konta.

Monity zatwierdzania generowane przez samego bota (na przykład przepływy „zezwolić na tę akcję?” udostępniane przez API QQ Bot) pojawiają się jako natywne monity OpenClaw, które możesz zaakceptować przez `/bot-approve` zamiast odpowiadać przez surowego klienta QQ.

## Rozwiązywanie problemów

- **Bot odpowiada „gone to Mars”:** dane uwierzytelniające nie są skonfigurowane lub Gateway nie został uruchomiony.
- **Brak wiadomości przychodzących:** sprawdź, czy `appId` i `clientSecret` są poprawne oraz czy
  bot jest włączony na QQ Open Platform.
- **Powtarzające się odpowiedzi do samego siebie:** OpenClaw zapisuje indeksy referencji wychodzących QQ jako
  autorstwa bota i ignoruje zdarzenia przychodzące, których bieżący `msgIdx` pasuje do tego
  samego konta bota. Zapobiega to pętlom echa platformy, jednocześnie nadal pozwalając użytkownikom
  cytować poprzednie wiadomości bota lub na nie odpowiadać.
- **Konfiguracja z `--token-file` nadal pokazuje brak konfiguracji:** `--token-file` ustawia tylko
  AppSecret. Nadal potrzebujesz `appId` w konfiguracji lub `QQBOT_APP_ID`.
- **Wiadomości proaktywne nie docierają:** QQ może przechwytywać wiadomości inicjowane przez bota, jeśli
  użytkownik nie wchodził ostatnio w interakcję.
- **Głos nie jest transkrybowany:** upewnij się, że STT jest skonfigurowane, a dostawca jest osiągalny.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
