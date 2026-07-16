---
read_when:
    - Chcesz połączyć OpenClaw z QQ
    - Należy skonfigurować dane uwierzytelniające QQ Bot
    - Potrzebujesz obsługi czatów grupowych lub prywatnych QQ Bot
summary: Konfiguracja, ustawienia i użycie QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-07-16T18:01:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71b0909e28e28d7f88e93b6f022f9aa2a4421d1381bb1ab4b706f381585ba476
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot łączy się z OpenClaw za pośrednictwem oficjalnego API QQ Bot (Gateway WebSocket).
Prywatne czaty C2C i `@`-wzmianki w grupach są podstawowymi typami czatów, z obsługą multimediów
(obrazów, głosu, wideo i plików). Wiadomości w kanałach gildii obsługują tylko
tekst i obrazy ze zdalnych adresów URL; głos, wideo, przesyłanie plików oraz obrazy
lokalne/Base64 nie są dostępne w kanałach gildii. Reakcje i wątki nie są
nigdzie obsługiwane.

Status: oficjalny Plugin do pobrania.

## Instalacja

```bash
openclaw plugins install @openclaw/qqbot
```

## Konfiguracja początkowa

1. Przejdź do [QQ Open Platform](https://q.qq.com/) i zeskanuj kod QR za pomocą
   aplikacji QQ na telefonie, aby się zarejestrować / zalogować.
2. Kliknij **Create Bot**, aby utworzyć nowego bota QQ.
3. Znajdź **AppID** i **AppSecret** na stronie ustawień bota i skopiuj je.

<Note>
AppSecret nie jest przechowywany w postaci zwykłego tekstu. W przypadku opuszczenia strony bez zapisania trzeba wygenerować nowy.
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

Kreator umożliwia również powiązanie za pomocą kodu QR zamiast ręcznego
wprowadzania AppID/AppSecret: zeskanuj kod aplikacją na telefonie powiązaną
z docelowym QQ Bot, aby zakończyć powiązanie. OpenClaw zapisuje zwrócone
dane uwierzytelniające w zakresie konfiguracji konta.

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

- `openclaw channels add --channel qqbot --token-file ...` ustawia tylko AppSecret;
  `appId` musi już być ustawione w konfiguracji lub `QQBOT_APP_ID`.
- `clientSecret` przyjmuje ciąg zwykłego tekstu, ścieżkę pliku (`clientSecretFile`)
  albo ustrukturyzowany obiekt SecretRef.
- Starsze ciągi znaczników `secretref:...` / `secretref-env:...` są odrzucane dla
  `clientSecret`; zamiast nich należy użyć ustrukturyzowanego obiektu SecretRef.

### Strumieniowanie

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // strumieniowanie bloków: "partial" (domyślnie) lub "off"
        nativeTransport: true, // użyj oficjalnego API stream_messages QQ dla wiadomości prywatnych C2C
      },
    },
  },
}
```

- `streaming.mode: "off"` wyłącza strumieniowanie bloków dla konta.
- `streaming.nativeTransport: true` przesyła odpowiedzi C2C (wiadomości prywatne) strumieniowo przez
  oficjalne API `stream_messages` QQ; nie wpływa to na cele grupowe/kanałowe.
- Starsze wartości skalarne `streaming: true|false` i klucz `streaming.c2cStreamApi`
  są migrowane do tej struktury za pomocą `openclaw doctor --fix`.
- `/bot-streaming on|off` przełącza tę samą konfigurację z poziomu wiadomości prywatnej.

### Zasady dostępu

- `allowFrom` / `groupAllowFrom` określają, kto może rozmawiać z botem w kontekście C2C /
  grupy. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  sterują trybem egzekwowania. `dmPolicy` ma domyślnie wartość `allowlist`, gdy
  `allowFrom` zawiera konkretny wpis (bez symbolu wieloznacznego), a w przeciwnym razie `open`.
  `groupPolicy` ma domyślnie wartość `allowlist`, gdy `groupAllowFrom` lub
  `allowFrom` zawiera konkretny wpis, a w przeciwnym razie `open`.
- Polecenia ukośnikowe „Auth: allowlist” wymagają jawnego wpisu bez symbolu wieloznacznego w
  `allowFrom` (lub `groupAllowFrom` w przypadku wywołań grupowych), niezależnie od
  `dmPolicy` / `groupPolicy` — zobacz [Polecenia ukośnikowe](#slash-commands).

### Konfiguracja wielu kont

Uruchamianie wielu botów QQ w jednej instancji OpenClaw:

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

Każde konto ma osobne połączenie WebSocket, klienta API i pamięć podręczną
tokenów, identyfikowane przez `appId`. Wiersze dziennika są oznaczane identyfikatorem konta właściciela,
dzięki czemu diagnostyka pozostaje rozdzielona podczas uruchamiania kilku botów w jednym Gateway.

Dodawanie drugiego bota za pomocą CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Czaty grupowe

Obsługa grup używa identyfikatorów OpenID grup QQ, a nie nazw wyświetlanych. Dodaj bota do
grupy, a następnie wspomnij o nim lub skonfiguruj grupę tak, aby działała bez wzmianki.

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

`groups["*"]` ustawia wartości domyślne dla każdej grupy; konkretny wpis `groups.GROUP_OPENID`
zastępuje te wartości domyślne dla jednej grupy. Ustawienia grupy:

| Pole                  | Wartość domyślna | Opis                                                                                               |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Wymagaj `@`-wzmianki, zanim bot odpowie.                                                     |
| `commandLevel`        | `all`            | Określa, które wbudowane polecenia ukośnikowe mogą działać w grupie (patrz niżej).                                    |
| `ignoreOtherMentions` | `false`          | Odrzucaj wiadomości, które wspominają kogoś innego, ale nie bota.                                           |
| `historyLimit`        | `50`             | Ostatnie wiadomości bez wzmianki zachowywane jako kontekst dla kolejnej tury ze wzmianką. `0` wyłącza historię.     |
| `tools`               | —                | Zezwalaj na narzędzia lub odmawiaj dostępu do nich dla całej grupy.                                                              |
| `toolsBySender`       | —                | Nadpisania narzędzi dla poszczególnych nadawców; zobacz [Grupy](/pl/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefiks openid    | Przyjazna etykieta używana w dziennikach i kontekście grupy.                                                     |
| `prompt`              | wbudowana wartość domyślna | Monit zachowania dla danej grupy dołączany do kontekstu agenta.                                           |

`commandLevel` przyjmuje:

| Poziom   | Zachowanie                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | Istniejące wbudowane polecenia pozostają dostępne. Niektóre pozostają ukryte w menu, ale upoważnieni użytkownicy nadal mogą je uruchamiać w grupie.                  |
| `safety` | `/help`, `/btw`, `/stop` pozostają widoczne w grupie; poufne polecenia (`/config`, `/tools`, `/bash` itd.) muszą być uruchamiane na czacie prywatnym.      |
| `strict` | Dozwolone są tylko mechanizmy sterowania sesją grupową niezbędne do ścisłego działania. `/stop` nadal działa, dzięki czemu upoważniony nadawca może przerwać aktywne uruchomienie. |

Stare wpisy QQBot `toolPolicy` zostały wycofane. Uruchom `openclaw doctor --fix`, aby zmigrować je do `tools`.

Tryby aktywacji to `mention` i `always`. `requireMention: true` odpowiada
`mention`; `requireMention: false` odpowiada `always`. Nadpisanie aktywacji
na poziomie sesji, jeśli istnieje, ma pierwszeństwo przed konfiguracją.

Kolejka przychodząca jest oddzielna dla każdego uczestnika. Uczestnicy grupowi mają większy limit kolejki (50 zamiast 20
dla uczestników bezpośrednich); po zapełnieniu kolejki wiadomości utworzone przez bota są usuwane przed wiadomościami
ludzi, a serie zwykłych wiadomości grupowych są scalane w jedną turę z przypisanym autorstwem. Polecenia
ukośnikowe są wykonywane pojedynczo, niezależnie od partii scalania.

### Głos (STT / TTS)

STT i TTS obsługują dwupoziomową konfigurację z rezerwowym wyborem według priorytetu:

| Ustawienie | Specyficzne dla Pluginu                                | Rezerwowa konfiguracja frameworka |
| ---------- | ------------------------------------------------------ | --------------------------------- |
| STT        | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS        | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

Ustaw `enabled: false` dla dowolnego z nich, aby go wyłączyć. Nadpisania TTS na poziomie konta używają
tej samej struktury co `messages.tts` i są głęboko scalane z konfiguracją TTS kanału/globalną.

Domyślny limit czasu żądań STT wynosi 60 sekund. STT specyficzne dla Pluginu używa
wybranego nadpisania `models.providers.<id>.timeoutSeconds`. STT dźwięku frameworka
używa kolejno `tools.media.audio.models[0].timeoutSeconds`,
`tools.media.audio.timeoutSeconds`, a następnie nadpisania wybranego dostawcy.

Przychodzące załączniki głosowe QQ są udostępniane agentom jako metadane multimediów audio,
a surowe pliki głosowe pozostają poza ogólnym `MediaPaths`. `[[audio_as_voice]]`
w odpowiedzi w postaci zwykłego tekstu syntetyzuje TTS i wysyła natywną wiadomość głosową QQ, gdy
TTS jest skonfigurowane.

Zachowanie przesyłania/transkodowania wychodzącego dźwięku można również dostosować za pomocą
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formaty celów

| Format                     | Opis                |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | Czat prywatny (C2C) |
| `qqbot:group:GROUP_OPENID` | Czat grupowy         |
| `qqbot:channel:CHANNEL_ID` | Kanał gildii         |

<Note>
Każdy bot ma własny zestaw identyfikatorów OpenID użytkowników. Identyfikatora OpenID otrzymanego przez Bota A **nie można** używać do wysyłania wiadomości za pośrednictwem Bota B.
</Note>

## Polecenia ukośnikowe

Wbudowane polecenia przechwytywane przed kolejką AI:

| Polecenie              | Autoryzacja      | Zakres        | Opis                                                                    |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | dowolny          | Test opóźnienia                                                                   |
| `/bot-help`          | —         | dowolny          | Wyświetla wszystkie polecenia                                                              |
| `/bot-me`            | —         | tylko prywatny | Wyświetla identyfikator użytkownika QQ nadawcy (openid) na potrzeby konfiguracji `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —         | tylko prywatny | Wyświetla wersję frameworka OpenClaw i wersję pluginu                         |
| `/bot-upgrade`       | —         | tylko prywatny | Wyświetla link do przewodnika aktualizacji QQBot                                              |
| `/bot-approve`       | lista dozwolonych | tylko prywatny | Zarządza konfiguracją zatwierdzania wykonywania poleceń (włączone / wyłączone / zawsze / reset / status)  |
| `/bot-logs`          | lista dozwolonych | tylko prywatny | Eksportuje ostatnie logi Gateway jako plik                                           |
| `/bot-clear-storage` | lista dozwolonych | tylko prywatny | Usuwa pobrane pliki z pamięci podręcznej w katalogu multimediów QQBot                        |
| `/bot-streaming`     | lista dozwolonych | tylko prywatny | Przełącza strumieniowe odpowiedzi C2C                                                   |
| `/bot-group-allways` | lista dozwolonych | tylko prywatny | Przełącza domyślny tryb aktywacji grupowej (wymagana wzmianka lub zawsze aktywny)      |

Do dowolnego polecenia można dodać `?`, aby uzyskać pomoc dotyczącą jego użycia (na przykład `/bot-upgrade ?`).

Polecenia z „Autoryzacja: lista dozwolonych” wymagają ponadto, aby openid nadawcy znajdował się na
jawnej liście `allowFrom` bez symbolu wieloznacznego (`groupAllowFrom` ma pierwszeństwo dla
poleceń wydawanych w grupie, a w razie braku używane jest `allowFrom`). Symbol wieloznaczny
`allowFrom: ["*"]` zezwala na czat, ale nie na te polecenia. Uruchomienie jednego z nich
poza czatem prywatnym lub bez autoryzacji zwraca wskazówkę zamiast
po cichu odrzucać wiadomość.

`/bot-me`, `/bot-version` i `/bot-upgrade` są dostępne wyłącznie w czacie prywatnym, ale nie
wymagają listy dozwolonych — może je uruchomić dowolny nadawca C2C.

Gdy zatwierdzenia wykonywania poleceń QQ Bot korzystają z domyślnego mechanizmu rezerwowego w tym samym czacie, kliknięcia natywnych
przycisków zatwierdzania podlegają tej samej jawnej liście dozwolonych poleceń bez symbolu wieloznacznego. Aby
przyznać dostęp wyłącznie do zatwierdzania bez szerszego dostępu do poleceń, należy skonfigurować
`channels.qqbot.execApprovals.approvers`. Natywne zatwierdzanie wykonywania poleceń jest domyślnie
włączone.

## Multimedia i pamięć masowa

- Przychodzące, wychodzące i przekazywane przez Gateway multimedia współdzielą jeden katalog główny ładunków w
  `~/.openclaw/media/qqbot` (z uwzględnieniem `OPENCLAW_HOME`, jeśli jest ustawione), dzięki czemu wysyłane pliki,
  pobierane pliki i pamięci podręczne transkodowania pozostają w jednym chronionym katalogu.
- Dostarczanie multimediów wzbogaconych do odbiorców C2C i grupowych odbywa się przez jedną ścieżkę `sendMedia`.
  Pliki lokalne i bufory w pamięci o rozmiarze co najmniej 5&nbsp;MiB korzystają z
  punktów końcowych QQ do przesyłania fragmentami; mniejsze ładunki oraz źródła w postaci zdalnych adresów URL/Base64 korzystają
  z jednorazowego interfejsu API przesyłania.
- Jeśli aktualizacja na gorąco przerwie działanie Gateway przed zakończeniem zapisu
  `openclaw.json`, przy następnym uruchomieniu plugin przywróci ostatnie znane `appId` / `clientSecret`
  dla tego konta z wewnętrznej migawki (nigdy nie
  zastępując celowej zmiany konfiguracji), dzięki czemu ponowne skanowanie kodu QR nie jest
  wymagane.

## Rozwiązywanie problemów

- **Gateway nie uruchamia się / brak wiadomości przychodzących:** należy sprawdzić, czy `appId` i
  `clientSecret` są prawidłowe oraz czy bot jest włączony na platformie QQ Open Platform.
  Brak danych uwierzytelniających jest zgłaszany jako „QQBot nie jest skonfigurowany (brak appId lub
  clientSecret)”.
- **Konfiguracja za pomocą `--token-file` nadal jest wyświetlana jako nieskonfigurowana:** `--token-file` ustawia tylko
  AppSecret. `appId` nadal musi być ustawione w konfiguracji lub `QQBOT_APP_ID`.
- **Serie odpowiedzi grupowych kolidują ze sobą:** gdy kolejka uczestnika się zapełnia, kolejka przychodząca usuwa wiadomości
  utworzone przez bota przed wiadomościami utworzonymi przez ludzi i scala
  serie zwykłych (niebędących poleceniami) wiadomości grupowych w jedną turę z przypisanym autorstwem, dzięki czemu
  zalew komunikatów botów nie powinien blokować wiadomości od ludzi.
- **Wiadomości proaktywne nie docierają:** QQ może blokować wiadomości inicjowane przez bota, jeśli
  użytkownik nie nawiązał ostatnio interakcji.
- **Głos nie jest transkrybowany:** należy upewnić się, że STT jest skonfigurowane, a dostawca jest
  osiągalny.

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Rozwiązywanie problemów z kanałami](/pl/channels/troubleshooting)
