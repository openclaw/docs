---
read_when:
    - Wyjaśnianie, jak działa streaming lub dzielenie na fragmenty na kanałach
    - Zmiana zachowania block streaming lub dzielenia kanału na fragmenty
    - Debugowanie zduplikowanych/przedwczesnych odpowiedzi blokowych lub podglądu streamingu kanału
summary: Zachowanie streamingu i dzielenia na fragmenty (odpowiedzi blokowe, podgląd streamingu kanału, mapowanie trybów)
title: Streaming i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-04-22T04:22:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6b246025ea1b1be57705bde60c0cdb485ffda727392cf00ea5a165571e37fce
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming i dzielenie na fragmenty

OpenClaw ma dwie osobne warstwy streamingu:

- **Block streaming (kanały):** emituje ukończone **bloki**, gdy asystent pisze. Są to zwykłe wiadomości kanałowe (nie delty tokenów).
- **Preview streaming (Telegram/Discord/Slack):** aktualizuje tymczasową **wiadomość podglądu** podczas generowania.

Obecnie **nie ma prawdziwego streamingu delt tokenów** do wiadomości kanałowych. Preview streaming jest oparty na wiadomościach (wysłanie + edycje/dopisania).

## Block streaming (wiadomości kanałowe)

Block streaming wysyła dane wyjściowe asystenta w większych fragmentach, gdy stają się dostępne.

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

- `text_delta/events`: zdarzenia strumienia modelu (mogą być rzadkie dla modeli bez streamingu).
- `chunker`: `EmbeddedBlockChunker` stosujący minimalne/maksymalne granice + preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Elementy sterujące:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie off).
- Nadpisania kanału: `*.blockStreaming` (oraz warianty per konto), aby wymusić `"on"`/`"off"` dla kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` lub `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scala streamowane bloki przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (na przykład `channels.whatsapp.textChunkLimit`).
- Tryb dzielenia kanału na fragmenty: `*.chunkMode` (`length` domyślnie, `newline` dzieli po pustych liniach (granicach akapitów) przed dzieleniem po długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć przycinania w UI.

**Semantyka granic:**

- `text_end`: streamuje bloki, gdy tylko chunker je wyemituje; opróżnia przy każdym `text_end`.
- `message_end`: czeka, aż wiadomość asystenta się zakończy, a następnie opróżnia zbuforowane dane wyjściowe.

`message_end` nadal używa chunkera, jeśli zbuforowany tekst przekracza `maxChars`, więc na końcu może wyemitować wiele fragmentów.

## Algorytm dzielenia na fragmenty (granice dolne/górne)

Dzielenie bloków na fragmenty jest zaimplementowane przez `EmbeddedBlockChunker`:

- **Granica dolna:** nie emituj, dopóki bufor < `minChars` (chyba że wymuszone).
- **Granica górna:** preferuj podziały przed `maxChars`; jeśli wymuszone, dziel przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Code fences:** nigdy nie dziel wewnątrz ogrodzeń; przy wymuszeniu przy `maxChars` zamknij i otwórz fence ponownie, aby zachować poprawność Markdown.

`maxChars` jest ograniczane do kanałowego `textChunkLimit`, więc nie można przekroczyć limitów per kanał.

## Scalanie (łączenie streamowanych bloków)

Gdy block streaming jest włączony, OpenClaw może **scalać kolejne fragmenty bloków**
przed ich wysłaniem. Ogranicza to „spam pojedynczymi liniami”, a jednocześnie nadal zapewnia
postępowe dane wyjściowe.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczone przez `maxChars` i zostaną opróżnione po jego przekroczeniu.
- `minChars` zapobiega wysyłaniu bardzo małych fragmentów, dopóki nie zgromadzi się wystarczająca ilość tekstu
  (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Łącznik jest wyprowadzany z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanału są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje per konto).
- Domyślne `minChars` dla scalania jest podnoszone do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Naturalne tempo między blokami

Gdy block streaming jest włączony, można dodać **losową pauzę** między
odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi wielobąbelkowe wydają się
bardziej naturalne.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie per agent przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślnie), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, nie odpowiedzi końcowych ani podsumowań narzędzi.

## „Streamuj fragmenty albo wszystko”

To mapuje się na:

- **Streamuj fragmenty:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram wymagają również `*.blockStreaming: true`.
- **Streamuj wszystko na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, ewentualnie w wielu fragmentach, jeśli odpowiedź jest bardzo długa).
- **Brak block streaming:** `blockStreamingDefault: "off"` (tylko odpowiedź końcowa).

**Uwaga dotycząca kanałów:** Block streaming jest **wyłączony, dopóki**
`*.blockStreaming` nie zostanie jawnie ustawione na `true`. Kanały mogą streamować podgląd na żywo
(`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: domyślne wartości `blockStreaming*` znajdują się w
`agents.defaults`, a nie w głównej konfiguracji.

## Tryby preview streaming

Klucz kanoniczny: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącza preview streaming.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: aktualizacje podglądu w krokach dzielonych na fragmenty/dopisywanych.
- `progress`: podgląd postępu/statusu podczas generowania, końcowa odpowiedź po zakończeniu.

### Mapowanie kanałów

| Kanał      | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | mapuje się na `partial` |
| Discord    | ✅    | ✅        | ✅      | mapuje się na `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Tylko Slack:

- `channels.slack.streaming.nativeTransport` przełącza natywne wywołania API streamingu Slack, gdy `channels.slack.streaming.mode="partial"` (domyślnie: `true`).
- Natywny streaming Slack i status wątku asystenta Slack wymagają celu odpowiedzi w wątku; DM najwyższego poziomu nie pokazują tego podglądu w stylu wątku.

Migracja starszych kluczy:

- Telegram: `streamMode` + boolean `streaming` są automatycznie migrowane do enum `streaming`.
- Discord: `streamMode` + boolean `streaming` są automatycznie migrowane do enum `streaming`.
- Slack: `streamMode` jest automatycznie migrowane do `streaming.mode`; boolean `streaming` jest automatycznie migrowane do `streaming.mode` plus `streaming.nativeTransport`; starsze `nativeStreaming` jest automatycznie migrowane do `streaming.nativeTransport`.

### Zachowanie środowiska uruchomieniowego

Telegram:

- Używa aktualizacji podglądu `sendMessage` + `editMessageText` w DM oraz grupach/tematach.
- Preview streaming jest pomijany, gdy block streaming Telegram jest jawnie włączony (aby uniknąć podwójnego streamingu).
- `/reasoning stream` może zapisywać tok rozumowania do podglądu.

Discord:

- Używa wiadomości podglądu send + edit.
- Tryb `block` używa dzielenia wersji roboczej na fragmenty (`draftChunk`).
- Preview streaming jest pomijany, gdy block streaming Discord jest jawnie włączony.
- Końcowe ładunki multimediów, błędów i jawnych odpowiedzi anulują oczekujące podglądy bez opróżniania nowej wersji roboczej, a następnie używają zwykłego dostarczania.

Slack:

- `partial` może używać natywnego streamingu Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępny.
- `block` używa podglądów roboczych w stylu dopisywania.
- `progress` używa tekstu podglądu statusu, a następnie odpowiedzi końcowej.
- Końcowe ładunki multimediów/błędów i finalizacje `progress` nie tworzą jednorazowych wiadomości roboczych; tylko finalizacje tekstowe/blokowe, które mogą edytować podgląd, opróżniają oczekujący tekst roboczy.

Mattermost:

- Streamuje tok rozumowania, aktywność narzędzi i częściowy tekst odpowiedzi do jednego posta roboczego podglądu, który jest finalizowany w miejscu, gdy końcowa odpowiedź nadaje się do wysłania.
- Przechodzi do wysłania nowego posta końcowego, jeśli post podglądu został usunięty lub jest w inny sposób niedostępny w momencie finalizacji.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed zwykłym dostarczeniem zamiast opróżniać tymczasowy post podglądu.

Macierz:

- Podglądy robocze są finalizowane w miejscu, gdy końcowy tekst może ponownie użyć zdarzenia podglądu.
- Finalizacje tylko z multimediami, błędów i z niedopasowaniem celu odpowiedzi anulują oczekujące aktualizacje podglądu przed zwykłym dostarczeniem; już widoczny nieaktualny podgląd jest redagowany.

### Aktualizacje podglądu postępu narzędzi

Preview streaming może również zawierać aktualizacje **tool-progress** — krótkie linie statusu, takie jak „searching the web”, „reading file” lub „calling tool” — które pojawiają się w tej samej wiadomości podglądu, gdy narzędzia są uruchomione, przed odpowiedzią końcową. Dzięki temu wieloetapowe tury narzędzi pozostają wizualnie aktywne zamiast milczeć między pierwszym podglądem toku rozumowania a odpowiedzią końcową.

Obsługiwane powierzchnie:

- **Discord**, **Slack** i **Telegram** streamują tool-progress do edycji podglądu na żywo.
- **Mattermost** już łączy aktywność narzędzi w swoim pojedynczym poście roboczym podglądu (zobacz wyżej).
- Edycje tool-progress podążają za aktywnym trybem preview streaming; są pomijane, gdy preview streaming ma wartość `off` lub gdy block streaming przejął wiadomość.

## Powiązane

- [Wiadomości](/pl/concepts/messages) — cykl życia wiadomości i dostarczanie
- [Retry](/pl/concepts/retry) — zachowanie ponowień przy błędzie dostarczania
- [Kanały](/pl/channels) — obsługa streamingu per kanał
