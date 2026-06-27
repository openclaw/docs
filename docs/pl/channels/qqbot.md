---
read_when:
    - Chcesz połączyć OpenClaw z QQ
    - Wymagana jest konfiguracja poświadczeń QQ Bot
    - Chcesz obsługi czatu grupowego lub prywatnego QQ Bot
summary: Konfiguracja początkowa, ustawienia i użycie QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-06-27T17:13:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot łączy się z OpenClaw przez oficjalne API QQ Bot (Gateway WebSocket). Plugin obsługuje prywatny czat C2C, grupowe @wiadomości oraz wiadomości w kanałach gildii z multimediami rozszerzonymi (obrazy, głos, wideo, pliki).

Status: Plugin do pobrania. Obsługiwane są wiadomości bezpośrednie, czaty grupowe, kanały gildii i multimedia. Reakcje i wątki nie są obsługiwane.

## Instalacja

Zainstaluj QQ Bot przed konfiguracją:

```bash
openclaw plugins install @openclaw/qqbot
```

## Konfiguracja

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR swoim
   telefonem z QQ, aby się zarejestrować / zalogować.
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

AppSecret jako SecretRef ze środowiska:

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

- Awaryjne użycie środowiska dotyczy tylko domyślnego konta QQ Bot.
- `openclaw channels add --channel qqbot --token-file ...` dostarcza tylko
  AppSecret; AppID musi być już ustawiony w konfiguracji albo w `QQBOT_APP_ID`.
- `clientSecret` akceptuje także dane wejściowe SecretRef, nie tylko zwykły ciąg tekstowy.
- Starsze ciągi znaczników `secretref:/...` nie są prawidłowymi wartościami `clientSecret`;
  użyj strukturalnych obiektów SecretRef, jak w przykładzie powyżej.

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
pamięć podręczną tokenów (izolowaną przez `appId`).

Dodaj drugiego bota przez CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Czaty grupowe

Obsługa czatów grupowych QQ Bot używa grupowych OpenID QQ, a nie nazw wyświetlanych. Dodaj bota
do grupy, a następnie wspomnij go albo skonfiguruj grupę tak, aby działała bez wzmianki.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` ustawia wartości domyślne dla każdej grupy, a konkretna
pozycja `groups.GROUP_OPENID` zastępuje te wartości domyślne dla jednej grupy. Ustawienia
grupy obejmują:

- `requireMention`: wymaga @wzmianki, zanim bot odpowie. Domyślnie: `true`.
- `commandLevel`: kontroluje, które wbudowane polecenia ukośnika mogą działać w grupach.
  Domyślnie: `all`, co zachowuje wcześniejsze zachowanie grupowe QQBot, gdy
  ustawienie jest pominięte.
- `ignoreOtherMentions`: odrzuca wiadomości, które wspominają kogoś innego, ale nie bota.
- `historyLimit`: zachowuje ostatnie grupowe wiadomości bez wzmianki jako kontekst dla następnej tury ze wzmianką. Ustaw `0`, aby wyłączyć.
- `tools`: zezwala na narzędzia lub ich zabrania dla całej grupy.
- `toolsBySender`: grupowe nadpisania narzędzi dla poszczególnych nadawców; zobacz [Grupy](/pl/channels/groups#groupchannel-tool-restrictions-optional).
- `name`: przyjazna etykieta używana w logach i kontekście grupy.
- `prompt`: prompt zachowania dla grupy dołączany do kontekstu agenta.

`commandLevel` akceptuje:

- `all`: zachowuje rozpoznane wbudowane polecenia jako dostępne jak wcześniej. Niektóre polecenia mogą
  pozostawać ukryte w menu, ale autoryzowani użytkownicy nadal mogą uruchamiać je w grupie.
- `safety`: zezwala na typowe polecenia współpracy, takie jak `/help`, `/btw` i
  `/stop`; prosi użytkowników o uruchamianie wrażliwych poleceń, takich jak `/config`, `/tools` i
  `/bash`, w prywatnym czacie.
- `strict`: zezwala tylko na kontrolki sesji grupowej potrzebne do ścisłego działania
  grupy. `/stop` nadal pozostaje pilne, aby autoryzowany nadawca mógł przerwać
  aktywne uruchomienie.

Stare wpisy QQBot `toolPolicy` są wycofane. Uruchom `openclaw doctor --fix`, aby zmigrować je do `tools`.

Tryby aktywacji to `mention` i `always`. `requireMention: true` mapuje się na
`mention`; `requireMention: false` mapuje się na `always`. Nadpisanie aktywacji
na poziomie sesji, jeśli istnieje, ma pierwszeństwo przed konfiguracją.

Kolejka przychodząca jest przypisana do peera. Peery grupowe otrzymują większy limit kolejki, utrzymują
wiadomości ludzkie przed rozmową autorstwa bota, gdy kolejka jest pełna, i scalają serie zwykłych
wiadomości grupowych w jedną przypisaną turę. Polecenia ukośnika nadal uruchamiają się pojedynczo.

### Głos (STT / TTS)

Obsługa STT i TTS używa dwupoziomowej konfiguracji z priorytetowym mechanizmem awaryjnym:

| Ustawienie | Specyficzne dla Pluginu                                    | Awaryjna konfiguracja frameworka |
| ---------- | ---------------------------------------------------------- | -------------------------------- |
| STT        | `channels.qqbot.stt`                                       | `tools.media.audio.models[0]`    |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`   | `messages.tts`                   |

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

Ustaw `enabled: false` na dowolnym z nich, aby wyłączyć.
Nadpisania TTS na poziomie konta używają tego samego kształtu co `messages.tts` i głęboko scalają się
z konfiguracją TTS kanału/globalną.

Przychodzące załączniki głosowe QQ są udostępniane agentom jako metadane multimediów audio, jednocześnie
utrzymując surowe pliki głosowe poza ogólnymi `MediaPaths`. Odpowiedzi zwykłym tekstem `[[audio_as_voice]]`
syntetyzują TTS i wysyłają natywną wiadomość głosową QQ, gdy TTS jest
skonfigurowane.

Zachowanie wysyłania/transkodowania audio wychodzącego można także dostroić za pomocą
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

> Każdy bot ma własny zestaw OpenID użytkowników. OpenID otrzymany przez Bota A **nie może**
> być użyty do wysyłania wiadomości przez Bota B.

## Polecenia ukośnika

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie      | Opis                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test opóźnienia                                                                                                        |
| `/bot-version` | Pokazuje wersję frameworka OpenClaw                                                                                    |
| `/bot-help`    | Wyświetla wszystkie polecenia                                                                                          |
| `/bot-me`      | Pokazuje identyfikator użytkownika QQ nadawcy (openid) do konfiguracji `allowFrom`/`groupAllowFrom`                    |
| `/bot-upgrade` | Pokazuje link do przewodnika aktualizacji QQBot                                                                        |
| `/bot-logs`    | Eksportuje ostatnie logi gateway jako plik                                                                              |
| `/bot-approve` | Zatwierdza oczekującą akcję QQ Bot (na przykład potwierdzenie wysyłania C2C lub grupowego) przez natywny przepływ.      |

Dodaj `?` do dowolnego polecenia, aby uzyskać pomoc użycia (na przykład `/bot-upgrade ?`).

Polecenia administratora (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) są dostępne tylko w wiadomościach bezpośrednich i wymagają openid nadawcy na jawnej liście `allowFrom` bez symbolu wieloznacznego. Symbol wieloznaczny `allowFrom: ["*"]` zezwala na czat, ale nie przyznaje dostępu do poleceń administratora. Wiadomości grupowe są najpierw dopasowywane względem `groupAllowFrom`, a następnie awaryjnie względem `allowFrom`. Uruchomienie polecenia administratora w grupie zwraca wskazówkę zamiast cicho je odrzucać.

Gdy zatwierdzenia exec QQ Bot używają domyślnego awaryjnego mechanizmu tego samego czatu, kliknięcia natywnego
przycisku zatwierdzenia stosują tę samą jawną listę dozwolonych poleceń bez symboli wieloznacznych. Aby przyznać
dostęp tylko do zatwierdzania bez szerszego dostępu do poleceń, skonfiguruj
`channels.qqbot.execApprovals.approvers`.

## Architektura silnika

QQ Bot jest dostarczany jako samodzielny silnik wewnątrz Pluginu:

- Każde konto posiada izolowany stos zasobów (połączenie WebSocket, klient API, pamięć podręczna tokenów, główny katalog magazynu multimediów) identyfikowany przez `appId`. Konta nigdy nie współdzielą stanu przychodzącego/wychodzącego.
- Logger wielu kont oznacza wiersze logów kontem właściciela, aby diagnostyka pozostawała rozdzielna, gdy uruchamiasz kilka botów pod jednym Gateway.
- Ścieżki przychodzące, wychodzące i mostu Gateway współdzielą jeden główny katalog ładunków multimedialnych w `~/.openclaw/media`, więc wysyłanie, pobieranie i pamięci podręczne transkodowania trafiają do jednego chronionego katalogu zamiast drzewa dla każdego podsystemu.
- Dostarczanie multimediów rozszerzonych przechodzi przez jedną ścieżkę `sendMedia` dla celów C2C i grupowych. Pliki lokalne i bufory powyżej progu dużych plików używają punktów końcowych porcjowanego wysyłania QQ, a mniejsze ładunki używają jednorazowego API multimediów.
- Dane uwierzytelniające mogą być tworzone w kopii zapasowej i odtwarzane jako część standardowych migawek danych uwierzytelniających OpenClaw; silnik ponownie podłącza stos zasobów każdego konta po odtworzeniu bez konieczności świeżej pary kodu QR.

## Wdrażanie za pomocą kodu QR

Jako alternatywę dla ręcznego wklejania `AppID:AppSecret`, silnik obsługuje przepływ wdrażania za pomocą kodu QR do łączenia QQ Bot z OpenClaw:

1. Uruchom ścieżkę konfiguracji QQ Bot (na przykład `openclaw channels add --channel qqbot`) i wybierz przepływ kodu QR po wyświetleniu monitu.
2. Zeskanuj wygenerowany kod QR aplikacją telefonu powiązaną z docelowym QQ Bot.
3. Zatwierdź parowanie na telefonie. OpenClaw zapisuje zwrócone dane uwierzytelniające w `credentials/` we właściwym zakresie konta.

Monity zatwierdzeń wygenerowane przez samego bota (na przykład przepływy „zezwolić na tę akcję?” udostępniane przez API QQ Bot) pojawiają się jako natywne monity OpenClaw, które możesz zaakceptować za pomocą `/bot-approve`, zamiast odpowiadać przez surowego klienta QQ.

## Rozwiązywanie problemów

- **Bot odpowiada „poleciał na Marsa”:** poświadczenia nie są skonfigurowane albo Gateway nie został uruchomiony.
- **Brak wiadomości przychodzących:** sprawdź, czy `appId` i `clientSecret` są poprawne oraz czy
  bot jest włączony na QQ Open Platform.
- **Powtarzające się odpowiedzi do samego siebie:** OpenClaw zapisuje indeksy referencji wychodzących QQ jako
  utworzone przez bota i ignoruje zdarzenia przychodzące, których bieżące `msgIdx` pasuje do
  tego samego konta bota. Zapobiega to pętlom echa platformy, a jednocześnie nadal pozwala użytkownikom
  cytować poprzednie wiadomości bota lub na nie odpowiadać.
- **Konfiguracja z `--token-file` nadal pokazuje brak konfiguracji:** `--token-file` ustawia tylko
  AppSecret. Nadal potrzebujesz `appId` w konfiguracji albo `QQBOT_APP_ID`.
- **Wiadomości proaktywne nie docierają:** QQ może przechwytywać wiadomości inicjowane przez bota, jeśli
  użytkownik nie wchodził ostatnio w interakcję.
- **Głos nie jest transkrybowany:** upewnij się, że STT jest skonfigurowane, a dostawca jest osiągalny.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Rozwiązywanie problemów z kanałem](/pl/channels/troubleshooting)
