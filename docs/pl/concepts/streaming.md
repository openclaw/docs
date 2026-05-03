---
read_when:
    - Wyjaśnienie, jak działa strumieniowanie lub dzielenie na fragmenty w kanałach
    - Zmiana zachowania strumieniowania bloków lub dzielenia kanału na fragmenty
    - Debugowanie zduplikowanych/przedwczesnych odpowiedzi blokowych lub strumieniowania podglądu kanału
summary: Zachowanie przesyłania strumieniowego + dzielenia na fragmenty (odpowiedzi blokowe, przesyłanie strumieniowe podglądu kanału, mapowanie trybów)
title: Strumieniowanie i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-05-03T21:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ma dwie oddzielne warstwy strumieniowania:

- **Strumieniowanie bloków (kanały):** emitowanie ukończonych **bloków** podczas pisania przez asystenta. Są to normalne wiadomości kanału (nie delty tokenów).
- **Strumieniowanie podglądu (Telegram/Discord/Slack):** aktualizowanie tymczasowej **wiadomości podglądu** podczas generowania.

Obecnie nie ma **prawdziwego strumieniowania delt tokenów** do wiadomości kanału. Strumieniowanie podglądu opiera się na wiadomościach (wysyłanie + edycje/dopisania).

## Strumieniowanie bloków (wiadomości kanału)

Strumieniowanie bloków wysyła odpowiedź asystenta w większych fragmentach, gdy stają się dostępne.

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

- `text_delta/events`: zdarzenia strumienia modelu (mogą być rzadkie dla modeli niestrumieniujących).
- `chunker`: `EmbeddedBlockChunker` stosujący minimalne/maksymalne limity + preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Elementy sterujące:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie wyłączone).
- Nadpisania kanałów: `*.blockStreaming` (oraz warianty per konto), aby wymusić `"on"`/`"off"` dla kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` albo `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scalanie strumieniowanych bloków przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb fragmentowania kanału: `*.chunkMode` (domyślnie `length`, `newline` dzieli po pustych wierszach (granicach akapitów) przed dzieleniem według długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć obcinania w interfejsie.

**Semantyka granic:**

- `text_end`: strumieniuj bloki, gdy tylko chunker je wyemituje; opróżniaj przy każdym `text_end`.
- `message_end`: poczekaj, aż wiadomość asystenta się zakończy, a następnie opróżnij zbuforowaną odpowiedź.

`message_end` nadal używa chunkera, jeśli zbuforowany tekst przekracza `maxChars`, więc na końcu może wyemitować wiele fragmentów.

### Dostarczanie mediów ze strumieniowaniem bloków

Dyrektywy `MEDIA:` są zwykłymi metadanymi dostarczania. Gdy strumieniowanie bloków wyśle blok multimedialny wcześniej, OpenClaw zapamiętuje to dostarczenie dla danej tury. Jeśli końcowy ładunek asystenta powtórzy ten sam URL multimediów, końcowe dostarczenie usuwa zduplikowane multimedia zamiast ponownie wysyłać załącznik.

Dokładne duplikaty końcowych ładunków są pomijane. Jeśli końcowy ładunek dodaje odrębny tekst wokół multimediów, które zostały już zestrumieniowane, OpenClaw nadal wysyła nowy tekst, zachowując jednokrotne dostarczenie multimediów. Zapobiega to duplikowaniu notatek głosowych lub plików w kanałach takich jak Telegram, gdy agent emituje `MEDIA:` podczas strumieniowania, a dostawca uwzględnia je także w ukończonej odpowiedzi.

## Algorytm fragmentowania (dolne/górne granice)

Fragmentowanie bloków implementuje `EmbeddedBlockChunker`:

- **Dolna granica:** nie emituj, dopóki bufor >= `minChars` (chyba że wymuszone).
- **Górna granica:** preferuj podziały przed `maxChars`; jeśli wymuszone, podziel przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Bloki kodu:** nigdy nie dziel wewnątrz bloków; przy wymuszeniu w `maxChars` zamknij + ponownie otwórz blok, aby zachować poprawny Markdown.

`maxChars` jest ograniczane do kanałowego `textChunkLimit`, więc nie można przekroczyć limitów per kanał.

## Scalanie (łączenie strumieniowanych bloków)

Gdy strumieniowanie bloków jest włączone, OpenClaw może **scalać kolejne fragmenty bloków** przed ich wysłaniem. Ogranicza to „spam pojedynczymi wierszami”, a jednocześnie nadal zapewnia progresywne odpowiedzi.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczone przez `maxChars` i zostaną opróżnione, jeśli go przekroczą.
- `minChars` zapobiega wysyłaniu drobnych fragmentów, dopóki nie zbierze się wystarczająco dużo tekstu (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Łącznik jest wyprowadzany z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanałów są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje per konto).
- Domyślne `minChars` dla scalania jest podniesione do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Naturalne tempo między blokami

Gdy strumieniowanie bloków jest włączone, można dodać **losową pauzę** między odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi w wielu dymkach sprawiają bardziej naturalne wrażenie.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie per agent przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślny), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Dotyczy wyłącznie **odpowiedzi blokowych**, nie odpowiedzi końcowych ani podsumowań narzędzi.

## „Strumieniuj fragmenty albo całość”

Odpowiada to:

- **Strumieniuj fragmenty:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram wymagają także `*.blockStreaming: true`.
- **Strumieniuj całość na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, potencjalnie w wielu fragmentach, jeśli odpowiedź jest bardzo długa).
- **Bez strumieniowania bloków:** `blockStreamingDefault: "off"` (tylko odpowiedź końcowa).

**Uwaga dotycząca kanałów:** strumieniowanie bloków jest **wyłączone, chyba że**
`*.blockStreaming` zostanie jawnie ustawione na `true`. Kanały mogą strumieniować podgląd na żywo (`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: domyślne ustawienia `blockStreaming*` znajdują się w `agents.defaults`, a nie w konfiguracji głównej.

## Tryby strumieniowania podglądu

Klucz kanoniczny: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącza strumieniowanie podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: podgląd aktualizowany krokami fragmentowanymi/dopisywanymi.
- `progress`: podgląd postępu/statusu podczas generowania, odpowiedź końcowa po zakończeniu.

`streaming.mode: "block"` jest trybem strumieniowania podglądu dla kanałów obsługujących edycję, takich jak Discord i Telegram. Nie włącza tam dostarczania bloków kanału. Użyj `streaming.block.enabled` albo starszego klucza kanału `blockStreaming`, gdy potrzebujesz normalnych odpowiedzi blokowych. Microsoft Teams jest wyjątkiem: nie ma transportu bloków podglądu roboczego, więc `streaming.mode: "block"` mapuje się na dostarczanie bloków Teams zamiast natywnego strumieniowania częściowego/postępu.

### Mapowanie kanałów

| Kanał      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | edytowalny szkic postępu |
| Discord    | ✅    | ✅        | ✅      | edytowalny szkic postępu |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | natywny strumień postępu |

Tylko Slack:

- `channels.slack.streaming.nativeTransport` przełącza natywne wywołania API strumieniowania Slack, gdy `channels.slack.streaming.mode="partial"` (domyślnie: `true`).
- Natywne strumieniowanie Slack i status wątku asystenta Slack wymagają docelowego wątku odpowiedzi. DM-y najwyższego poziomu nie pokazują tego podglądu w stylu wątku, ale nadal mogą używać postów i edycji szkicu podglądu Slack.

Migracja starszych kluczy:

- Telegram: starsze wartości `streamMode` oraz skalarne/logiczne wartości `streaming` są wykrywane i migrowane przez ścieżki zgodności doctor/konfiguracji do `streaming.mode`.
- Discord: `streamMode` + logiczne `streaming` automatycznie migrują do wyliczenia `streaming`.
- Slack: `streamMode` automatycznie migruje do `streaming.mode`; logiczne `streaming` automatycznie migruje do `streaming.mode` plus `streaming.nativeTransport`; starsze `nativeStreaming` automatycznie migruje do `streaming.nativeTransport`.

### Zachowanie w czasie działania

Telegram:

- Używa `sendMessage` + `editMessageText` do aktualizacji podglądu w DM-ach oraz grupach/tematach.
- Wysyła świeżą wiadomość końcową zamiast edytować w miejscu, gdy podgląd był widoczny przez około minutę, a następnie usuwa podgląd, aby znacznik czasu Telegram odzwierciedlał ukończenie odpowiedzi.
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Telegram jest jawnie włączone (aby uniknąć podwójnego strumieniowania).
- `/reasoning stream` może zapisywać rozumowanie do podglądu.

Discord:

- Używa wysyłania + edycji wiadomości podglądu.
- Tryb `block` używa fragmentowania szkicu (`draftChunk`).
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Discord jest jawnie włączone.
- Końcowe ładunki multimediów, błędów i jawnych odpowiedzi anulują oczekujące podglądy bez opróżniania nowego szkicu, a następnie używają normalnego dostarczania.

Slack:

- `partial` może używać natywnego strumieniowania Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępne.
- `block` używa podglądów szkicu w stylu dopisywania.
- `progress` używa tekstu podglądu statusu, a następnie odpowiedzi końcowej.
- DM-y najwyższego poziomu bez wątku odpowiedzi używają postów i edycji szkicu podglądu zamiast natywnego strumieniowania Slack.
- Natywne strumieniowanie i strumieniowanie podglądu szkicu pomijają odpowiedzi blokowe dla tej tury, więc odpowiedź Slack jest strumieniowana tylko jedną ścieżką dostarczania.
- Końcowe ładunki multimediów/błędów oraz końcowe wiadomości postępu nie tworzą jednorazowych wiadomości szkicu; tylko końcowe teksty/bloki, które mogą edytować podgląd, opróżniają oczekujący tekst szkicu.

Mattermost:

- Strumieniuje myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do pojedynczego posta szkicu podglądu, który finalizuje się w miejscu, gdy odpowiedź końcowa może zostać bezpiecznie wysłana.
- W razie usunięcia posta podglądu lub jego niedostępności w momencie finalizacji wraca do wysłania świeżego posta końcowego.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed normalnym dostarczeniem zamiast opróżniać tymczasowy post podglądu.

Matrix:

- Podglądy szkicu finalizują się w miejscu, gdy tekst końcowy może ponownie użyć zdarzenia podglądu.
- Końcowe wiadomości tylko z multimediami, błędami oraz z niezgodnym celem odpowiedzi anulują oczekujące aktualizacje podglądu przed normalnym dostarczeniem; już widoczny nieaktualny podgląd jest redagowany.

### Aktualizacje podglądu postępu narzędzi

Strumieniowanie podglądu może także obejmować aktualizacje **postępu narzędzi** — krótkie wiersze statusu, takie jak „wyszukiwanie w sieci”, „czytanie pliku” albo „wywoływanie narzędzia” — które pojawiają się w tej samej wiadomości podglądu podczas działania narzędzi, przed odpowiedzią końcową. Dzięki temu wieloetapowe tury narzędzi pozostają wizualnie aktywne, zamiast milczeć między pierwszym podglądem myślenia a odpowiedzią końcową.

Obsługiwane powierzchnie:

- **Discord**, **Slack**, **Telegram** i **Matrix** domyślnie strumieniują postęp narzędzi do edycji podglądu na żywo, gdy strumieniowanie podglądu jest aktywne. Microsoft Teams używa natywnego strumienia postępu w czatach osobistych.
- Telegram ma aktualizacje podglądu postępu narzędzi włączone od `v2026.4.22`; pozostawienie ich włączonych zachowuje to wydane zachowanie.
- **Mattermost** już włącza aktywność narzędzi do pojedynczego posta szkicu podglądu (patrz wyżej).
- Edycje postępu narzędzi podążają za aktywnym trybem strumieniowania podglądu; są pomijane, gdy strumieniowanie podglądu jest `off` albo gdy strumieniowanie bloków przejęło wiadomość. W Telegram, `streaming.mode: "off"` oznacza tylko odpowiedź końcową: ogólne komunikaty o postępie są także tłumione zamiast być dostarczane jako samodzielne wiadomości statusu, natomiast prośby o zatwierdzenie, ładunki multimediów i błędy nadal są kierowane normalnie.
- Aby zachować strumieniowanie podglądu, ale ukryć wiersze postępu narzędzi, ustaw `streaming.preview.toolProgress` na `false` dla tego kanału. Aby całkowicie wyłączyć edycje podglądu, ustaw `streaming.mode` na `off`.
- Wybrane odpowiedzi z cytatem w Telegram są wyjątkiem: gdy `replyToMode` nie jest `"off"` i obecny jest tekst wybranego cytatu, OpenClaw pomija strumień podglądu odpowiedzi dla tej tury, więc wiersze podglądu postępu narzędzi nie mogą się renderować. Odpowiedzi do bieżącej wiadomości bez tekstu wybranego cytatu nadal zachowują strumieniowanie podglądu. Szczegóły znajdziesz w [dokumentacji kanału Telegram](/pl/channels/telegram).

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

- [Szkice postępu](/pl/concepts/progress-drafts) — widoczne wiadomości o pracy w toku, aktualizowane podczas długich tur
- [Wiadomości](/pl/concepts/messages) — cykl życia wiadomości i dostarczanie
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania po niepowodzeniu dostarczenia
- [Kanały](/pl/channels) — obsługa strumieniowania per kanał
