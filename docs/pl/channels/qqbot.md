---
read_when:
    - Chcesz połączyć OpenClaw z QQ
    - Wymagana konfiguracja danych uwierzytelniających QQ Bot
    - Potrzebujesz obsługi czatów grupowych lub prywatnych w QQ Bot
summary: Konfiguracja, ustawienia i użycie bota QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-05-02T09:43:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d37dd5846ecf07b1e3e8729faa23877780abdd40577b8dab61ea1ac9399885a
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot łączy się z OpenClaw przez oficjalne API QQ Bot (Gateway WebSocket). Plugin
obsługuje prywatny czat C2C, grupowe @wiadomości oraz wiadomości w kanałach gildii z
multimediami rozszerzonymi (obrazy, głos, wideo, pliki).

Status: Plugin do pobrania. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, kanały gildii oraz
multimedia. Reakcje i wątki nie są obsługiwane.

## Instalacja

Zainstaluj QQ Bot przed konfiguracją:

```bash
openclaw plugins install @openclaw/qqbot
```

## Konfiguracja

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR swoim
   telefonem QQ, aby się zarejestrować / zalogować.
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

Uwagi:

- Zapasowa konfiguracja ze zmiennych środowiskowych dotyczy tylko domyślnego konta QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` dostarcza tylko
  AppSecret; AppID musi być już ustawione w konfiguracji albo w `QQBOT_APP_ID`.
- `clientSecret` akceptuje także wejście SecretRef, nie tylko ciąg zwykłego tekstu.

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

Każde konto uruchamia własne połączenie WebSocket i utrzymuje niezależną
pamięć podręczną tokenów (izolowaną według `appId`).

Dodaj drugiego bota przez CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Czaty grupowe

Obsługa czatów grupowych QQ Bot używa grupowych OpenID QQ, a nie nazw wyświetlanych. Dodaj bota
do grupy, a następnie wspomnij o nim albo skonfiguruj grupę tak, aby działała bez wzmianki.

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
- `historyLimit`: zachowuje ostatnie grupowe wiadomości bez wzmianek jako kontekst dla następnej tury ze wzmianką. Ustaw `0`, aby wyłączyć.
- `toolPolicy`: `full`, `restricted` albo `none` dla narzędzi ograniczonych do grupy.
- `name`: przyjazna etykieta używana w logach i kontekście grupy.
- `prompt`: prompt zachowania dla danej grupy, dołączany do kontekstu agenta.

Tryby aktywacji to `mention` i `always`. `requireMention: true` mapuje się na
`mention`; `requireMention: false` mapuje się na `always`. Nadpisanie aktywacji
na poziomie sesji, jeśli występuje, ma pierwszeństwo przed konfiguracją.

Kolejka przychodząca jest osobna dla każdego peera. Peery grupowe otrzymują większy limit kolejki, zachowują wiadomości
ludzi przed wypowiedziami autorstwa bota, gdy kolejka jest pełna, i scalają serie zwykłych
wiadomości grupowych w jedną przypisaną turę. Polecenia slash nadal działają pojedynczo.

### Głos (STT / TTS)

Obsługa STT i TTS ma dwupoziomową konfigurację z priorytetowym mechanizmem zapasowym:

| Ustawienie | Specyficzne dla Pluginu                                   | Zapasowe ustawienie frameworka |
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

Ustaw `enabled: false` na którymkolwiek z nich, aby go wyłączyć.
Nadpisania TTS na poziomie konta używają tego samego kształtu co `messages.tts` i są głęboko scalane
z konfiguracją TTS kanału/globalną.

Przychodzące załączniki głosowe QQ są udostępniane agentom jako metadane multimediów audio, przy jednoczesnym
trzymaniu surowych plików głosowych poza ogólnymi `MediaPaths`. Odpowiedzi zwykłym tekstem
`[[audio_as_voice]]` syntetyzują TTS i wysyłają natywną wiadomość głosową QQ, gdy TTS jest
skonfigurowane.

Zachowanie wysyłania/transkodowania dźwięku wychodzącego można także dostroić za pomocą
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formaty docelowe

| Format                     | Opis               |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Czat prywatny (C2C) |
| `qqbot:group:GROUP_OPENID` | Czat grupowy       |
| `qqbot:channel:CHANNEL_ID` | Kanał gildii       |

> Każdy bot ma własny zestaw OpenID użytkowników. OpenID odebranego przez Bota A **nie można**
> użyć do wysyłania wiadomości przez Bota B.

## Polecenia slash

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie      | Opis                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test opóźnienia                                                                                          |
| `/bot-version` | Pokaż wersję frameworka OpenClaw                                                                         |
| `/bot-help`    | Wyświetl wszystkie polecenia                                                                             |
| `/bot-me`      | Pokaż ID użytkownika QQ nadawcy (openid) na potrzeby konfiguracji `allowFrom`/`groupAllowFrom`           |
| `/bot-upgrade` | Pokaż link do przewodnika aktualizacji QQBot                                                             |
| `/bot-logs`    | Wyeksportuj ostatnie logi Gateway jako plik                                                              |
| `/bot-approve` | Zatwierdź oczekującą akcję QQ Bot (na przykład potwierdzenie wysyłki C2C lub grupowej) przez natywny przepływ. |

Dodaj `?` do dowolnego polecenia, aby uzyskać pomoc dotyczącą użycia (na przykład `/bot-upgrade ?`).

Polecenia administratora (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) są dostępne tylko w wiadomościach bezpośrednich i wymagają openid nadawcy na jawnej, nie-wieloznacznej liście `allowFrom`. Wieloznaczne `allowFrom: ["*"]` pozwala na czat, ale nie przyznaje dostępu do poleceń administratora. Wiadomości grupowe są najpierw dopasowywane względem `groupAllowFrom`, a potem zapasowo względem `allowFrom`. Uruchomienie polecenia administratora w grupie zwraca wskazówkę zamiast dyskretnie je odrzucać.

## Architektura silnika

QQ Bot jest dostarczany jako samodzielny silnik wewnątrz Pluginu:

- Każde konto posiada izolowany stos zasobów (połączenie WebSocket, klient API, pamięć podręczna tokenów, katalog główny magazynu multimediów) identyfikowany przez `appId`. Konta nigdy nie współdzielą stanu przychodzącego/wychodzącego.
- Logger wielu kont oznacza linie logów kontem właściciela, dzięki czemu diagnostyka pozostaje rozdzielna, gdy uruchamiasz kilka botów pod jednym Gateway.
- Ścieżki przychodzące, wychodzące i pomostu Gateway współdzielą jeden katalog główny ładunków multimedialnych pod `~/.openclaw/media`, więc wysyłki, pobrania i pamięci podręczne transkodowania trafiają do jednego chronionego katalogu zamiast do drzewa osobnego dla każdego podsystemu.
- Dostarczanie multimediów rozszerzonych przechodzi przez jedną ścieżkę `sendMedia` dla celów C2C i grupowych. Pliki lokalne i bufory powyżej progu dużego pliku używają punktów końcowych QQ do wysyłania w częściach, a mniejsze ładunki używają jednorazowego API multimediów.
- Dane uwierzytelniające można tworzyć i przywracać jako część standardowych migawek danych uwierzytelniających OpenClaw; silnik ponownie podłącza stos zasobów każdego konta po przywróceniu bez wymagania świeżej pary kodu QR.

## Onboarding kodem QR

Jako alternatywę dla ręcznego wklejania `AppID:AppSecret`, silnik obsługuje przepływ onboardingu kodem QR do łączenia QQ Bot z OpenClaw:

1. Uruchom ścieżkę konfiguracji QQ Bot (na przykład `openclaw channels add --channel qqbot`) i wybierz przepływ kodu QR, gdy pojawi się monit.
2. Zeskanuj wygenerowany kod QR aplikacją na telefonie powiązaną z docelowym QQ Bot.
3. Zatwierdź parowanie na telefonie. OpenClaw zapisuje zwrócone dane uwierzytelniające w `credentials/` w odpowiednim zakresie konta.

Monity zatwierdzania generowane przez samego bota (na przykład przepływy „zezwolić na tę akcję?” udostępniane przez API QQ Bot) pojawiają się jako natywne monity OpenClaw, które możesz zaakceptować za pomocą `/bot-approve` zamiast odpowiadać przez surowego klienta QQ.

## Rozwiązywanie problemów

- **Bot odpowiada „gone to Mars”:** dane uwierzytelniające nie są skonfigurowane albo Gateway nie został uruchomiony.
- **Brak wiadomości przychodzących:** sprawdź, czy `appId` i `clientSecret` są poprawne oraz czy
  bot jest włączony w QQ Open Platform.
- **Powtarzające się auto-odpowiedzi:** OpenClaw zapisuje indeksy referencji wychodzących QQ jako
  autorstwa bota i ignoruje zdarzenia przychodzące, których bieżące `msgIdx` odpowiada temu
  samemu kontu bota. Zapobiega to pętlom echa platformy, a jednocześnie pozwala użytkownikom
  cytować poprzednie wiadomości bota lub odpowiadać na nie.
- **Konfiguracja z `--token-file` nadal pokazuje brak konfiguracji:** `--token-file` ustawia tylko
  AppSecret. Nadal potrzebujesz `appId` w konfiguracji albo `QQBOT_APP_ID`.
- **Wiadomości proaktywne nie docierają:** QQ może przechwytywać wiadomości inicjowane przez bota, jeśli
  użytkownik nie wchodził ostatnio w interakcję.
- **Głos nie jest transkrybowany:** upewnij się, że STT jest skonfigurowane, a dostawca jest osiągalny.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Rozwiązywanie problemów z kanałem](/pl/channels/troubleshooting)
