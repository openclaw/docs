---
read_when:
    - Wyjaśnianie, jak działa streaming lub dzielenie na fragmenty w kanałach
    - Zmiana zachowania streamingu bloków lub dzielenia kanałów na fragmenty
    - Debugowanie zduplikowanych/przedwczesnych odpowiedzi blokowych lub streamingu podglądu kanału
summary: Zachowanie streamingu + dzielenia na fragmenty (odpowiedzi blokowe, streaming podglądu kanału, mapowanie trybów)
title: Streaming i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-04-24T09:07:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + dzielenie na fragmenty

OpenClaw ma dwie oddzielne warstwy streamingu:

- **Streaming bloków (kanały):** emituje ukończone **bloki** podczas pisania przez asystenta. Są to zwykłe wiadomości kanałowe (nie delty tokenów).
- **Streaming podglądu (Telegram/Discord/Slack):** aktualizuje tymczasową **wiadomość podglądu** podczas generowania.

Obecnie nie ma **prawdziwego streamingu delt tokenów** do wiadomości kanałowych. Streaming podglądu jest oparty na wiadomościach (wysłanie + edycje/dopisania).

## Streaming bloków (wiadomości kanałowe)

Streaming bloków wysyła dane wyjściowe asystenta w większych fragmentach, gdy stają się dostępne.

```
Dane wyjściowe modelu
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emituje bloki w miarę wzrostu bufora
       └─ (blockStreamingBreak=message_end)
            └─ chunker opróżnia przy message_end
                   └─ wysłanie do kanału (odpowiedzi blokowe)
```

Legenda:

- `text_delta/events`: zdarzenia strumienia modelu (mogą być rzadkie dla modeli bez streamingu).
- `chunker`: `EmbeddedBlockChunker` stosujący minimalne/maksymalne granice + preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Kontrole:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie off).
- Nadpisania kanałów: `*.blockStreaming` (oraz warianty per konto), aby wymusić `"on"`/`"off"` dla kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` lub `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scalanie streamowanych bloków przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb dzielenia kanału: `*.chunkMode` (`length` domyślnie, `newline` dzieli po pustych liniach (granice akapitów) przed dzieleniem według długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć obcinania w UI.

**Semantyka granic:**

- `text_end`: streamuj bloki, gdy tylko chunker je wyemituje; opróżniaj przy każdym `text_end`.
- `message_end`: poczekaj, aż wiadomość asystenta się zakończy, a następnie opróżnij zbuforowane dane wyjściowe.

`message_end` nadal używa chunkera, jeśli zbuforowany tekst przekracza `maxChars`, więc może wyemitować wiele fragmentów na końcu.

## Algorytm dzielenia na fragmenty (niskie/wysokie granice)

Dzielenie bloków na fragmenty jest zaimplementowane przez `EmbeddedBlockChunker`:

- **Dolna granica:** nie emituj, dopóki bufor nie osiągnie `minChars` (chyba że wymuszone).
- **Górna granica:** preferuj podziały przed `maxChars`; jeśli wymuszone, dziel przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Bloki kodu:** nigdy nie dziel wewnątrz bloków; przy wymuszeniu przy `maxChars` zamknij i ponownie otwórz blok, aby zachować poprawny Markdown.

`maxChars` jest ograniczane do `textChunkLimit` kanału, więc nie można przekroczyć limitów per kanał.

## Scalanie (łączenie streamowanych bloków)

Gdy streaming bloków jest włączony, OpenClaw może **scalać kolejne fragmenty bloków**
przed ich wysłaniem. Zmniejsza to „spam pojedynczymi liniami”, a jednocześnie zapewnia
progresywne dane wyjściowe.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczane przez `maxChars` i zostaną opróżnione po jego przekroczeniu.
- `minChars` zapobiega wysyłaniu drobnych fragmentów, dopóki nie zbierze się wystarczająco dużo tekstu
  (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Łącznik jest wyprowadzany z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanałów są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje per konto).
- Domyślne `minChars` dla scalenia jest podbijane do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Naturalne opóźnienie między blokami

Gdy streaming bloków jest włączony, możesz dodać **losową pauzę** między
odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi wielobąbelkowe wydają się
bardziej naturalne.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie per agent przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślnie), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, nie odpowiedzi końcowych ani podsumowań narzędzi.

## „Streamuj fragmenty czy wszystko”

Mapuje się to na:

- **Streamuj fragmenty:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram wymagają też `*.blockStreaming: true`.
- **Streamuj wszystko na końcu:** `blockStreamingBreak: "message_end"` (jedno opróżnienie, ewentualnie wiele fragmentów, jeśli odpowiedź jest bardzo długa).
- **Brak streamingu bloków:** `blockStreamingDefault: "off"` (tylko odpowiedź końcowa).

**Uwaga o kanałach:** Streaming bloków jest **wyłączony, chyba że**
`*.blockStreaming` jest jawnie ustawione na `true`. Kanały mogą streamować aktywny podgląd
(`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: domyślne wartości `blockStreaming*` znajdują się w
`agents.defaults`, a nie w głównej konfiguracji.

## Tryby streamingu podglądu

Klucz kanoniczny: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącza streaming podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: aktualizacje podglądu w krokach dzielonych na fragmenty/dopisywanych.
- `progress`: podgląd postępu/statusu podczas generowania, odpowiedź końcowa po zakończeniu.

### Mapowanie kanałów

| Kanał      | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | mapuje się do `partial` |
| Discord    | ✅    | ✅        | ✅      | mapuje się do `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Tylko Slack:

- `channels.slack.streaming.nativeTransport` przełącza natywne wywołania Slack streaming API, gdy `channels.slack.streaming.mode="partial"` (domyślnie: `true`).
- Natywny streaming Slack i status wątku asystenta Slack wymagają docelowego wątku odpowiedzi; wiadomości bezpośrednie najwyższego poziomu nie pokazują tego rodzaju podglądu wątku.

Migracja starszych kluczy:

- Telegram: `streamMode` + boolowski `streaming` są automatycznie migrowane do wyliczenia `streaming`.
- Discord: `streamMode` + boolowski `streaming` są automatycznie migrowane do wyliczenia `streaming`.
- Slack: `streamMode` jest automatycznie migrowane do `streaming.mode`; boolowski `streaming` jest automatycznie migrowany do `streaming.mode` plus `streaming.nativeTransport`; starszy `nativeStreaming` jest automatycznie migrowany do `streaming.nativeTransport`.

### Zachowanie runtime

Telegram:

- Używa `sendMessage` + aktualizacji podglądu `editMessageText` w wiadomościach bezpośrednich i grupach/tematach.
- Streaming podglądu jest pomijany, gdy streaming bloków Telegram jest jawnie włączony (aby uniknąć podwójnego streamingu).
- `/reasoning stream` może zapisywać reasoning do podglądu.

Discord:

- Używa wiadomości podglądu typu send + edit.
- Tryb `block` używa dzielenia szkicu na fragmenty (`draftChunk`).
- Streaming podglądu jest pomijany, gdy streaming bloków Discord jest jawnie włączony.
- Końcowe ładunki multimediów, błędów i jawnych odpowiedzi anulują oczekujące podglądy bez opróżniania nowego szkicu, a następnie używają zwykłego dostarczania.

Slack:

- `partial` może używać natywnego streamingu Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępny.
- `block` używa podglądów szkiców w stylu dopisywania.
- `progress` używa tekstu podglądu statusu, a następnie odpowiedzi końcowej.
- Końcowe ładunki multimediów/błędów i końce progress nie tworzą jednorazowych wiadomości szkicu; tylko końce tekstowe/blokowe, które mogą edytować podgląd, opróżniają oczekujący tekst szkicu.

Mattermost:

- Streamuje thinking, aktywność narzędzi i częściowy tekst odpowiedzi do jednego posta szkicu podglądu, który finalizuje się na miejscu, gdy odpowiedź końcowa jest bezpieczna do wysłania.
- Wraca do wysłania nowego końcowego posta, jeśli post podglądu został usunięty lub jest w inny sposób niedostępny przy finalizacji.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed zwykłym dostarczaniem zamiast opróżniać tymczasowy post podglądu.

Matrix:

- Szkice podglądu finalizują się na miejscu, gdy końcowy tekst może ponownie użyć zdarzenia podglądu.
- Końce tylko z multimediami, błędami i z niedopasowaniem celu odpowiedzi anulują oczekujące aktualizacje podglądu przed zwykłym dostarczaniem; już widoczny nieaktualny podgląd jest redagowany.

### Aktualizacje podglądu postępu narzędzi

Streaming podglądu może również obejmować aktualizacje **postępu narzędzi** — krótkie linie statusu, takie jak „searching the web”, „reading file” lub „calling tool” — które pojawiają się w tej samej wiadomości podglądu podczas działania narzędzi, przed odpowiedzią końcową. Dzięki temu wieloetapowe tury narzędzi pozostają wizualnie aktywne zamiast milczeć między pierwszym podglądem thinking a odpowiedzią końcową.

Obsługiwane powierzchnie:

- **Discord**, **Slack** i **Telegram** streamują postęp narzędzi do edycji aktywnego podglądu.
- **Mattermost** już scala aktywność narzędzi do swojego pojedynczego posta szkicu podglądu (zobacz wyżej).
- Edycje postępu narzędzi podążają za aktywnym trybem streamingu podglądu; są pomijane, gdy streaming podglądu ma wartość `off` lub gdy streaming bloków przejął wiadomość.

## Powiązane

- [Wiadomości](/pl/concepts/messages) — cykl życia wiadomości i dostarczanie
- [Retry](/pl/concepts/retry) — zachowanie ponawiania przy błędzie dostarczania
- [Kanały](/pl/channels) — obsługa streamingu per kanał
