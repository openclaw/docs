---
read_when:
    - Chcesz połączyć OpenClaw z QQ
    - Musisz skonfigurować dane uwierzytelniające bota QQ
    - Potrzebujesz obsługi czatów grupowych lub prywatnych QQ Bot
summary: Konfiguracja, ustawienia i użytkowanie QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-07-12T14:55:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot łączy się z OpenClaw za pośrednictwem oficjalnego API QQ Bot (Gateway WebSocket).
Podstawowymi typami czatu są prywatne rozmowy C2C oraz wzmianki `@` w grupach, z obsługą multimediów
(obrazów, wiadomości głosowych, filmów i plików). Wiadomości w kanałach gildii obsługują wyłącznie
tekst i obrazy ze zdalnych adresów URL; wiadomości głosowe, filmy, przesyłanie plików oraz obrazy
lokalne/Base64 nie są dostępne w kanałach gildii. Reakcje i wątki nie są nigdzie obsługiwane.

Status: oficjalny Plugin do pobrania.

## Instalacja

```bash
openclaw plugins install @openclaw/qqbot
```

## Konfiguracja początkowa

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR za pomocą
   aplikacji QQ na telefonie, aby się zarejestrować lub zalogować.
2. Kliknij **Create Bot**, aby utworzyć nowego bota QQ.
3. Znajdź **AppID** i **AppSecret** na stronie ustawień bota, a następnie je skopiuj.

<Note>
AppSecret nie jest przechowywany w postaci zwykłego tekstu. Jeśli opuścisz stronę bez zapisania go, konieczne będzie wygenerowanie nowego.
</Note>

4. Dodaj kanał:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Uruchom ponownie Gateway.

Konfiguracja interaktywna:

```bash
openclaw channels add
```

Kreator umożliwia również powiązanie za pomocą kodu QR zamiast ręcznego wpisywania
AppID/AppSecret: zeskanuj kod aplikacją na telefonie powiązaną z docelowym QQ Bot,
aby ukończyć powiązanie. OpenClaw zapisuje zwrócone dane uwierzytelniające
w zakresie konfiguracji konta.

## Konfiguracja

Konfiguracja minimalna:

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

Zmienne środowiskowe konta domyślnego (tylko konto najwyższego poziomu):

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

- `openclaw channels add --channel qqbot --token-file ...` ustawia wyłącznie
  AppSecret; `appId` musi być już ustawiony w konfiguracji lub w `QQBOT_APP_ID`.
- `clientSecret` przyjmuje ciąg tekstowy w postaci jawnej, ścieżkę do pliku
  (`clientSecretFile`) albo strukturalny obiekt SecretRef.
- Starsze ciągi znaczników `secretref:...` / `secretref-env:...` są odrzucane
  dla `clientSecret`; zamiast nich użyj strukturalnego obiektu SecretRef.

### Zasady dostępu

- `allowFrom` / `groupAllowFrom` określają, kto może rozmawiać z botem w kontekście
  C2C / grupowym. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  sterują trybem egzekwowania zasad. Domyślną wartością `dmPolicy` staje się
  `allowlist`, gdy `allowFrom` zawiera konkretny wpis (bez symbolu wieloznacznego);
  w przeciwnym razie jest nią `open`. Domyślną wartością `groupPolicy` staje się
  `allowlist`, gdy `groupAllowFrom` lub `allowFrom` zawiera konkretny wpis;
  w przeciwnym razie jest nią `open`.
- Polecenia z ukośnikiem wymagające „Uwierzytelniania: lista dozwolonych” wymagają
  jawnego wpisu bez symbolu wieloznacznego w `allowFrom` (lub `groupAllowFrom`
  w przypadku wywołań grupowych), niezależnie od `dmPolicy` / `groupPolicy` —
  zobacz [Polecenia z ukośnikiem](#slash-commands).

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

Każde konto ma odizolowane połączenie WebSocket, klienta API i pamięć podręczną
tokenów, identyfikowane przez `appId`. Wiersze dziennika są oznaczane identyfikatorem
konta właściciela, dzięki czemu diagnostyka pozostaje rozdzielona podczas uruchamiania
kilku botów w jednym Gateway.

Dodaj drugiego bota za pomocą CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Czaty grupowe

Obsługa grup korzysta z identyfikatorów OpenID grup QQ, a nie z nazw wyświetlanych.
Dodaj bota do grupy, a następnie wspomnij o nim lub skonfiguruj grupę tak, aby działała
bez wzmianki.

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

`groups["*"]` ustawia wartości domyślne dla każdej grupy; konkretny wpis
`groups.GROUP_OPENID` zastępuje te wartości domyślne dla jednej grupy. Ustawienia grup:

| Pole                  | Wartość domyślna       | Opis                                                                                                            |
| --------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`                 | Wymaga wzmianki `@`, zanim bot odpowie.                                                                         |
| `commandLevel`        | `all`                  | Określa, które wbudowane polecenia z ukośnikiem mogą działać w grupie (zobacz niżej).                            |
| `ignoreOtherMentions` | `false`                | Odrzuca wiadomości, które wspominają kogoś innego, ale nie bota.                                                |
| `historyLimit`        | `50`                   | Ostatnie wiadomości bez wzmianki zachowywane jako kontekst dla następnej tury ze wzmianką. `0` wyłącza historię. |
| `tools`               | —                      | Zezwala na narzędzia lub ich zabrania dla całej grupy.                                                         |
| `toolsBySender`       | —                      | Nadpisania narzędzi dla poszczególnych nadawców; zobacz [Grupy](/pl/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefiks openid         | Przyjazna etykieta używana w dziennikach i kontekście grupy.                                                   |
| `prompt`              | wbudowana wartość domyślna | Monit zachowania dla danej grupy, dołączany do kontekstu agenta.                                            |

`commandLevel` przyjmuje następujące wartości:

| Poziom   | Zachowanie                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Istniejące wbudowane polecenia pozostają dostępne. Niektóre są ukryte w menu, ale upoważnieni użytkownicy nadal mogą uruchamiać je w grupie.                         |
| `safety` | `/help`, `/btw`, `/stop` pozostają widoczne w grupie; poufne polecenia (`/config`, `/tools`, `/bash` itd.) muszą być uruchamiane w prywatnym czacie.                |
| `strict` | Dozwolone są tylko funkcje sterowania sesją grupową wymagane do działania w trybie ścisłym. `/stop` nadal działa, aby upoważniony nadawca mógł przerwać aktywne wykonanie. |

Stare wpisy QQBot `toolPolicy` zostały wycofane. Uruchom `openclaw doctor --fix`, aby przenieść je do `tools`.

Tryby aktywacji to `mention` i `always`. `requireMention: true` odpowiada
`mention`, a `requireMention: false` odpowiada `always`. Nadpisanie aktywacji
na poziomie sesji, jeśli istnieje, ma pierwszeństwo przed konfiguracją.

Kolejka przychodząca jest oddzielna dla każdego uczestnika. Uczestnicy grupowi
mają większy limit kolejki (50 zamiast 20 dla uczestników bezpośrednich); po
zapełnieniu wiadomości autorstwa bota są usuwane przed wiadomościami ludzi,
a serie zwykłych wiadomości grupowych są scalane w jedną turę z przypisanym
autorstwem. Polecenia z ukośnikiem są wykonywane pojedynczo, niezależnie od
wszelkich partii scalania.

### Głos (STT / TTS)

STT i TTS obsługują konfigurację dwupoziomową z priorytetowym mechanizmem rezerwowym:

| Ustawienie | Specyficzne dla Pluginu                                  | Mechanizm rezerwowy frameworka |
| ---------- | -------------------------------------------------------- | ------------------------------ |
| STT        | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]`  |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                 |

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

Ustaw `enabled: false` dla dowolnej z tych funkcji, aby ją wyłączyć. Nadpisania
TTS na poziomie konta mają ten sam kształt co `messages.tts` i są głęboko scalane
z konfiguracją TTS kanału/globalną.

Domyślnie żądania STT przekraczają limit czasu po 60 sekundach. STT specyficzne
dla Pluginu korzysta z nadpisania `models.providers.<id>.timeoutSeconds` wybranego
dostawcy. STT audio frameworka korzysta kolejno z `tools.media.audio.models[0].timeoutSeconds`,
`tools.media.audio.timeoutSeconds`, a następnie z nadpisania wybranego dostawcy.

Przychodzące załączniki głosowe QQ są udostępniane agentom jako metadane multimediów
audio, natomiast surowe pliki głosowe nie trafiają do ogólnego `MediaPaths`.
`[[audio_as_voice]]` w odpowiedzi w postaci zwykłego tekstu syntetyzuje TTS
i wysyła natywną wiadomość głosową QQ, gdy TTS jest skonfigurowane.

Zachowanie przesyłania/transkodowania wychodzącego dźwięku można także dostosować
za pomocą `channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formaty docelowe

| Format                     | Opis                 |
| -------------------------- | -------------------- |
| `qqbot:c2c:OPENID`         | Prywatny czat (C2C)  |
| `qqbot:group:GROUP_OPENID` | Czat grupowy         |
| `qqbot:channel:CHANNEL_ID` | Kanał gildii         |

<Note>
Każdy bot ma własny zestaw identyfikatorów OpenID użytkowników. Identyfikatora OpenID otrzymanego przez Bota A **nie można** użyć do wysyłania wiadomości za pośrednictwem Bota B.
</Note>

## Polecenia z ukośnikiem

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie            | Uwierzytelnianie   | Zakres               | Opis                                                                                           |
| -------------------- | ------------------ | -------------------- | ---------------------------------------------------------------------------------------------- |
| `/bot-ping`          | —                  | dowolny              | Test opóźnienia                                                                                |
| `/bot-help`          | —                  | dowolny              | Wyświetla wszystkie polecenia                                                                  |
| `/bot-me`            | —                  | tylko prywatny czat  | Wyświetla identyfikator użytkownika QQ nadawcy (openid) do konfiguracji `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —                  | tylko prywatny czat  | Wyświetla wersję frameworka OpenClaw i wersję Pluginu                                           |
| `/bot-upgrade`       | —                  | tylko prywatny czat  | Wyświetla odnośnik do przewodnika aktualizacji QQBot                                            |
| `/bot-approve`       | lista dozwolonych  | tylko prywatny czat  | Zarządza konfiguracją zatwierdzania wykonywania poleceń (włączone / wyłączone / zawsze / resetuj / stan) |
| `/bot-logs`          | lista dozwolonych  | tylko prywatny czat  | Eksportuje ostatnie dzienniki Gateway jako plik                                                 |
| `/bot-clear-storage` | lista dozwolonych  | tylko prywatny czat  | Usuwa pobrane pliki z pamięci podręcznej w katalogu multimediów QQBot                            |
| `/bot-streaming`     | lista dozwolonych  | tylko prywatny czat  | Przełącza strumieniowe odpowiedzi C2C                                                           |
| `/bot-group-allways` | lista dozwolonych  | tylko prywatny czat  | Przełącza domyślny tryb aktywacji grupy (wymagana wzmianka lub zawsze aktywny)                   |

Dodaj `?` do dowolnego polecenia, aby uzyskać pomoc dotyczącą użycia (na przykład `/bot-upgrade ?`).

Polecenia wymagające „Uwierzytelniania: lista dozwolonych” dodatkowo wymagają,
aby openid nadawcy znajdował się na jawnej liście `allowFrom` bez symbolu
wieloznacznego (`groupAllowFrom` ma pierwszeństwo dla poleceń wydawanych w grupie,
a w razie braku wpisu używane jest `allowFrom`). Symbol wieloznaczny
`allowFrom: ["*"]` zezwala na czat, ale nie na te polecenia. Uruchomienie jednego
z nich poza prywatnym czatem lub bez upoważnienia zwraca wskazówkę zamiast
po cichu odrzucać wiadomość.

`/bot-me`, `/bot-version` i `/bot-upgrade` są dostępne tylko w czatach prywatnych, ale nie
wymagają listy dozwolonych — może je uruchomić każdy nadawca C2C.

Gdy zatwierdzenia wykonania QQ Bot korzystają z domyślnego mechanizmu rezerwowego w tym samym czacie, kliknięcia
natywnych przycisków zatwierdzania podlegają tej samej jawnej liście dozwolonych poleceń bez symboli wieloznacznych. Aby
przyznać dostęp wyłącznie do zatwierdzania bez szerszego dostępu do poleceń, skonfiguruj
`channels.qqbot.execApprovals.approvers`. Natywne zatwierdzenia wykonania są domyślnie
włączone.

## Multimedia i pamięć masowa

- Przychodzące i wychodzące multimedia oraz multimedia mostu Gateway współdzielą jeden katalog główny danych w
  `~/.openclaw/media/qqbot` (z uwzględnieniem `OPENCLAW_HOME`, gdy jest ustawiona), dzięki czemu wysyłane
  i pobierane pliki oraz pamięci podręczne transkodowania pozostają w jednym chronionym katalogu.
- Dostarczanie multimediów rozszerzonych do odbiorców C2C i grupowych odbywa się jedną ścieżką `sendMedia`.
  Pliki lokalne i bufory w pamięci o rozmiarze co najmniej 5&nbsp;MiB korzystają z punktów końcowych QQ
  do przesyłania fragmentami; mniejsze dane oraz źródła w postaci zdalnych adresów URL lub Base64 korzystają
  z interfejsu API jednorazowego przesyłania.
- Jeśli aktualizacja na gorąco przerwie działanie Gateway przed zakończeniem zapisu
  `openclaw.json`, przy następnym uruchomieniu Plugin przywróci ostatnie znane wartości `appId` / `clientSecret`
  tego konta z wewnętrznej migawki (nigdy nie nadpisując celowej zmiany konfiguracji), dzięki czemu ponowne
  skanowanie kodu QR nie jest wymagane.

## Rozwiązywanie problemów

- **Gateway nie uruchamia się / brak wiadomości przychodzących:** sprawdź, czy `appId` i
  `clientSecret` są poprawne oraz czy bot jest włączony na platformie QQ Open Platform.
  Brakujące dane uwierzytelniające powodują wyświetlenie komunikatu „QQBot nie jest skonfigurowany (brak appId lub
  clientSecret)”.
- **Konfiguracja z `--token-file` nadal jest wyświetlana jako nieskonfigurowana:** `--token-file`
  ustawia wyłącznie AppSecret. `appId` nadal musi być ustawione w konfiguracji lub w `QQBOT_APP_ID`.
- **Serie odpowiedzi grupowych kolidują ze sobą:** gdy kolejka danego uczestnika się zapełnia, kolejka przychodząca usuwa
  wiadomości utworzone przez boty przed wiadomościami od ludzi oraz scala
  serie zwykłych wiadomości grupowych (niebędących poleceniami) w jedną turę z przypisanym autorstwem, dzięki czemu
  zalew komunikatów botów nie powinien blokować wiadomości od ludzi.
- **Wiadomości proaktywne nie docierają:** QQ może blokować wiadomości inicjowane przez bota, jeśli
  użytkownik nie wchodził ostatnio z nim w interakcję.
- **Głos nie jest transkrybowany:** upewnij się, że STT jest skonfigurowane, a dostawca jest
  osiągalny.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
