---
read_when:
    - Wyjaśnianie, jak działa przesyłanie strumieniowe lub dzielenie na fragmenty w kanałach
    - Zmiana zachowania strumieniowania bloków lub dzielenia kanałów na fragmenty
    - Debugowanie zduplikowanych/zbyt wczesnych odpowiedzi blokowych lub strumieniowania podglądu kanału
summary: Zachowanie strumieniowania i dzielenia na fragmenty (odpowiedzi blokowe, strumieniowanie podglądu kanału, mapowanie trybów)
title: Strumieniowanie i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-05-03T09:44:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85f6cb33031a6c818bb709e0ed14d8dd0f8c30a3dd90468a40396b3a515b5e65
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ma dwie oddzielne warstwy przesyłania strumieniowego:

- **Przesyłanie strumieniowe bloków (kanały):** emituje ukończone **bloki** w trakcie pisania przez asystenta. Są to zwykłe wiadomości kanału (nie delty tokenów).
- **Przesyłanie strumieniowe podglądu (Telegram/Discord/Slack):** aktualizuje tymczasową **wiadomość podglądu** podczas generowania.

Obecnie **nie ma prawdziwego przesyłania strumieniowego delt tokenów** do wiadomości kanałów. Przesyłanie strumieniowe podglądu jest oparte na wiadomościach (wysyłanie + edycje/dołączanie).

## Przesyłanie strumieniowe bloków (wiadomości kanału)

Przesyłanie strumieniowe bloków wysyła dane wyjściowe asystenta w większych fragmentach, gdy stają się dostępne.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legenda:

- `text_delta/events`: zdarzenia strumienia modelu (mogą być rzadkie w przypadku modeli bez przesyłania strumieniowego).
- `chunker`: `EmbeddedBlockChunker` stosujący minimalne/maksymalne ograniczenia + preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Elementy sterujące:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie wyłączone).
- Nadpisania kanałów: `*.blockStreaming` (oraz warianty dla kont) wymuszające `"on"`/`"off"` dla kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` albo `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scalanie przesyłanych bloków przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb dzielenia kanału: `*.chunkMode` (domyślnie `length`, `newline` dzieli po pustych wierszach (granicach akapitów) przed dzieleniem według długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć przycinania w interfejsie.

**Semantyka granic:**

- `text_end`: przesyłaj bloki, gdy tylko `chunker` je wyemituje; opróżniaj przy każdym `text_end`.
- `message_end`: poczekaj, aż wiadomość asystenta się zakończy, a następnie opróżnij zbuforowane dane wyjściowe.

`message_end` nadal używa `chunker`, jeśli zbuforowany tekst przekracza `maxChars`, więc na końcu może wyemitować wiele fragmentów.

### Dostarczanie multimediów z przesyłaniem strumieniowym bloków

Dyrektywy `MEDIA:` są zwykłymi metadanymi dostarczania. Gdy przesyłanie strumieniowe bloków wcześnie wyśle blok multimedialny, OpenClaw zapamiętuje to dostarczenie dla danej tury. Jeśli końcowy ładunek asystenta powtarza ten sam adres URL multimediów, końcowe dostarczenie usuwa zduplikowane multimedia zamiast ponownie wysyłać załącznik.

Dokładnie zduplikowane końcowe ładunki są pomijane. Jeśli końcowy ładunek dodaje odrębny tekst wokół multimediów, które zostały już przesłane strumieniowo, OpenClaw nadal wysyła nowy tekst, zachowując jednorazowe dostarczenie multimediów. Zapobiega to duplikowaniu notatek głosowych lub plików w kanałach takich jak Telegram, gdy agent emituje `MEDIA:` podczas przesyłania strumieniowego, a dostawca uwzględnia je również w ukończonej odpowiedzi.

## Algorytm dzielenia (dolne/górne granice)

Dzielenie bloków jest implementowane przez `EmbeddedBlockChunker`:

- **Dolna granica:** nie emituj, dopóki bufor >= `minChars` (chyba że wymuszone).
- **Górna granica:** preferuj podziały przed `maxChars`; jeśli wymuszone, dziel przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Bloki kodu:** nigdy nie dziel wewnątrz bloków; przy wymuszonym podziale na `maxChars` zamknij i ponownie otwórz blok, aby Markdown pozostał poprawny.

`maxChars` jest ograniczane do kanałowego `textChunkLimit`, więc nie można przekroczyć limitów dla danego kanału.

## Scalanie (łączenie przesyłanych bloków)

Gdy przesyłanie strumieniowe bloków jest włączone, OpenClaw może **scalać kolejne fragmenty bloków** przed ich wysłaniem. Zmniejsza to „spam pojedynczymi wierszami”, nadal zapewniając progresywne dane wyjściowe.

- Scalanie czeka na **okresy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczone przez `maxChars` i zostaną opróżnione, jeśli go przekroczą.
- `minChars` zapobiega wysyłaniu drobnych fragmentów, dopóki nie zgromadzi się wystarczająco dużo tekstu (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Łącznik jest wyprowadzany z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanałów są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje dla kont).
- Domyślne `minChars` scalania jest podnoszone do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Ludzkie tempo między blokami

Gdy przesyłanie strumieniowe bloków jest włączone, możesz dodać **losową pauzę** między odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi składające się z wielu dymków wydają się bardziej naturalne.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie dla agenta przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślny), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, nie końcowych odpowiedzi ani podsumowań narzędzi.

## „Przesyłaj fragmenty strumieniowo albo wszystko”

Odpowiada to:

- **Przesyłaj fragmenty strumieniowo:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram wymagają też `*.blockStreaming: true`.
- **Prześlij wszystko na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, ewentualnie w wielu fragmentach, jeśli bardzo długie).
- **Bez przesyłania strumieniowego bloków:** `blockStreamingDefault: "off"` (tylko końcowa odpowiedź).

**Uwaga dotycząca kanałów:** Przesyłanie strumieniowe bloków jest **wyłączone, chyba że**
`*.blockStreaming` jest jawnie ustawione na `true`. Kanały mogą przesyłać strumieniowo podgląd na żywo (`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: wartości domyślne `blockStreaming*` znajdują się w
`agents.defaults`, a nie w konfiguracji głównej.

## Tryby przesyłania strumieniowego podglądu

Klucz kanoniczny: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącz przesyłanie strumieniowe podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: podgląd aktualizowany fragmentami/dołączanymi krokami.
- `progress`: podgląd postępu/statusu podczas generowania, końcowa odpowiedź po zakończeniu.

### Mapowanie kanałów

| Kanał      | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | ✅    | ✅        | ✅      | mapuje na `partial` |
| Discord    | ✅    | ✅        | ✅      | mapuje na `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                  |
| Mattermost | ✅    | ✅        | ✅      | ✅                  |

Tylko Slack:

- `channels.slack.streaming.nativeTransport` przełącza natywne wywołania API przesyłania strumieniowego Slack, gdy `channels.slack.streaming.mode="partial"` (domyślnie: `true`).
- Natywne przesyłanie strumieniowe Slack i status wątku asystenta Slack wymagają docelowego wątku odpowiedzi. Wiadomości prywatne najwyższego poziomu nie pokazują tego podglądu w stylu wątku, ale nadal mogą używać roboczych postów podglądu Slack i edycji.

Migracja starszych kluczy:

- Telegram: starsze wartości `streamMode` oraz skalarne/logiczne wartości `streaming` są wykrywane i migrowane przez ścieżki zgodności doctor/konfiguracji do `streaming.mode`.
- Discord: `streamMode` + logiczne `streaming` migrują automatycznie do wyliczenia `streaming`.
- Slack: `streamMode` migruje automatycznie do `streaming.mode`; logiczne `streaming` migruje automatycznie do `streaming.mode` oraz `streaming.nativeTransport`; starsze `nativeStreaming` migruje automatycznie do `streaming.nativeTransport`.

### Zachowanie w czasie działania

Telegram:

- Używa `sendMessage` + `editMessageText` do aktualizacji podglądu w wiadomościach prywatnych oraz grupach/tematach.
- Wysyła nową wiadomość końcową zamiast edytować w miejscu, gdy podgląd był widoczny przez około jedną minutę, a następnie usuwa podgląd, aby znacznik czasu Telegram odzwierciedlał zakończenie odpowiedzi.
- Przesyłanie strumieniowe podglądu jest pomijane, gdy przesyłanie strumieniowe bloków Telegram jest jawnie włączone (aby uniknąć podwójnego przesyłania strumieniowego).
- `/reasoning stream` może zapisywać rozumowanie w podglądzie.

Discord:

- Używa wysyłania + edycji wiadomości podglądu.
- Tryb `block` używa roboczego dzielenia (`draftChunk`).
- Przesyłanie strumieniowe podglądu jest pomijane, gdy przesyłanie strumieniowe bloków Discord jest jawnie włączone.
- Końcowe ładunki multimediów, błędów i jawnych odpowiedzi anulują oczekujące podglądy bez opróżniania nowego szkicu, a następnie używają zwykłego dostarczania.

Slack:

- `partial` może używać natywnego przesyłania strumieniowego Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępne.
- `block` używa roboczych podglądów w stylu dołączania.
- `progress` używa tekstu podglądu statusu, a następnie końcowej odpowiedzi.
- Wiadomości prywatne najwyższego poziomu bez wątku odpowiedzi używają roboczych postów podglądu i edycji zamiast natywnego przesyłania strumieniowego Slack.
- Natywne i robocze przesyłanie strumieniowe podglądu tłumi odpowiedzi blokowe w tej turze, więc odpowiedź Slack jest przesyłana tylko jedną ścieżką dostarczania.
- Końcowe ładunki multimediów/błędów i końcowe odpowiedzi postępu nie tworzą jednorazowych wiadomości roboczych; tylko końcowe odpowiedzi tekstowe/blokowe, które mogą edytować podgląd, opróżniają oczekujący tekst roboczy.

Mattermost:

- Przesyła myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do pojedynczego roboczego postu podglądu, który jest finalizowany w miejscu, gdy końcową odpowiedź można bezpiecznie wysłać.
- Przechodzi na wysłanie nowego końcowego postu, jeśli post podglądu został usunięty lub jest inaczej niedostępny w czasie finalizacji.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed zwykłym dostarczeniem zamiast opróżniać tymczasowy post podglądu.

Matrix:

- Robocze podglądy są finalizowane w miejscu, gdy tekst końcowy może ponownie użyć zdarzenia podglądu.
- Końcowe odpowiedzi tylko z multimediami, błędem i niedopasowaniem celu odpowiedzi anulują oczekujące aktualizacje podglądu przed zwykłym dostarczeniem; już widoczny przestarzały podgląd jest redagowany.

### Aktualizacje podglądu postępu narzędzi

Przesyłanie strumieniowe podglądu może również obejmować aktualizacje **postępu narzędzi** — krótkie wiersze statusu, takie jak „przeszukiwanie internetu”, „odczytywanie pliku” albo „wywoływanie narzędzia” — które pojawiają się w tej samej wiadomości podglądu, gdy narzędzia działają, przed końcową odpowiedzią. Dzięki temu wieloetapowe tury narzędzi pozostają wizualnie aktywne, zamiast milczeć między pierwszym podglądem myślenia a końcową odpowiedzią.

Obsługiwane powierzchnie:

- **Discord**, **Slack**, **Telegram** i **Matrix** domyślnie przesyłają postęp narzędzi do edycji podglądu na żywo, gdy przesyłanie strumieniowe podglądu jest aktywne.
- Telegram ma dostarczone aktualizacje podglądu postępu narzędzi włączone od `v2026.4.22`; pozostawienie ich włączonych zachowuje to wydane zachowanie.
- **Mattermost** już włącza aktywność narzędzi do pojedynczego roboczego postu podglądu (patrz wyżej).
- Edycje postępu narzędzi podążają za aktywnym trybem przesyłania strumieniowego podglądu; są pomijane, gdy przesyłanie strumieniowe podglądu jest `off` albo gdy przesyłanie strumieniowe bloków przejęło wiadomość. W Telegram `streaming.mode: "off"` oznacza tylko odpowiedzi końcowe: ogólne komunikaty o postępie są również tłumione zamiast dostarczania ich jako samodzielnych wiadomości „Working...”, podczas gdy prośby o zatwierdzenie, ładunki multimediów i błędy nadal są kierowane normalnie.
- Aby zachować przesyłanie strumieniowe podglądu, ale ukryć wiersze postępu narzędzi, ustaw `streaming.preview.toolProgress` na `false` dla tego kanału. Aby całkowicie wyłączyć edycje podglądu, ustaw `streaming.mode` na `off`.

Przykład:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Powiązane

- [Wiadomości](/pl/concepts/messages) — cykl życia wiadomości i dostarczanie
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania po niepowodzeniu dostarczania
- [Kanały](/pl/channels) — obsługa przesyłania strumieniowego dla poszczególnych kanałów
