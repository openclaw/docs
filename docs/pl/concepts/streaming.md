---
read_when:
    - Wyjaśnianie, jak działa przesyłanie strumieniowe lub dzielenie na fragmenty w kanałach
    - Zmiana zachowania strumieniowania blokowego lub dzielenia na fragmenty w kanałach
    - Debugowanie zduplikowanych/przedwczesnych odpowiedzi blokowych lub strumieniowania podglądu kanału
summary: Zachowanie przesyłania strumieniowego i dzielenia na fragmenty (odpowiedzi blokowe, strumieniowanie podglądu kanału, mapowanie trybów)
title: Streaming and Chunking
x-i18n:
    generated_at: "2026-04-05T13:51:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44b0d08c7eafcb32030ef7c8d5719c2ea2d34e4bac5fdad8cc8b3f4e9e9fad97
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

OpenClaw ma dwie oddzielne warstwy przesyłania strumieniowego:

- **Strumieniowanie blokowe (kanały):** emituje ukończone **bloki** podczas pisania przez asystenta. Są to zwykłe wiadomości kanału (nie delty tokenów).
- **Strumieniowanie podglądu (Telegram/Discord/Slack):** aktualizuje tymczasową **wiadomość podglądu** podczas generowania.

Obecnie nie ma **prawdziwego przesyłania strumieniowego delt tokenów** do wiadomości kanału. Strumieniowanie podglądu jest oparte na wiadomościach (wysyłanie + edycje/dopisywanie).

## Strumieniowanie blokowe (wiadomości kanału)

Strumieniowanie blokowe wysyła dane wyjściowe asystenta w większych fragmentach, gdy stają się dostępne.

```
Dane wyjściowe modelu
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emituje bloki w miarę wzrostu bufora
       └─ (blockStreamingBreak=message_end)
            └─ chunker opróżnia przy message_end
                   └─ wysyłka kanału (odpowiedzi blokowe)
```

Legenda:

- `text_delta/events`: zdarzenia strumienia modelu (mogą być rzadkie dla modeli bez strumieniowania).
- `chunker`: `EmbeddedBlockChunker` stosujący dolne/górne granice + preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Ustawienia:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie wyłączone).
- Nadpisania kanałów: `*.blockStreaming` (oraz warianty per konto), aby wymusić `"on"`/`"off"` dla kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` lub `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scala strumieniowane bloki przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb dzielenia kanału na fragmenty: `*.chunkMode` (`length` domyślnie, `newline` dzieli po pustych liniach (granice akapitów) przed dzieleniem według długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć obcięcia w UI.

**Semantyka granic:**

- `text_end`: przesyłaj bloki, gdy tylko chunker je wyemituje; opróżniaj przy każdym `text_end`.
- `message_end`: czekaj, aż wiadomość asystenta się zakończy, a następnie opróżnij zbuforowane dane wyjściowe.

`message_end` nadal używa chunkera, jeśli zbuforowany tekst przekracza `maxChars`, więc może wyemitować wiele fragmentów na końcu.

## Algorytm dzielenia na fragmenty (dolne/górne granice)

Dzielenie bloków na fragmenty jest implementowane przez `EmbeddedBlockChunker`:

- **Dolna granica:** nie emituj, dopóki bufor nie osiągnie >= `minChars` (chyba że wymuszono).
- **Górna granica:** preferuj podziały przed `maxChars`; jeśli wymuszono, podziel przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Bloki kodu:** nigdy nie dziel wewnątrz bloków; przy wymuszeniu przy `maxChars` zamknij i otwórz ponownie blok, aby zachować poprawność Markdown.

`maxChars` jest ograniczane do `textChunkLimit` kanału, więc nie można przekroczyć limitów per kanał.

## Scalanie (łączenie strumieniowanych bloków)

Gdy strumieniowanie blokowe jest włączone, OpenClaw może **scalać kolejne fragmenty bloków**
przed ich wysłaniem. Zmniejsza to „spam pojedynczymi liniami”, a jednocześnie nadal zapewnia
progresywne dane wyjściowe.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczane przez `maxChars` i zostaną opróżnione po przekroczeniu tego limitu.
- `minChars` zapobiega wysyłaniu małych fragmentów, dopóki nie zbierze się wystarczająco dużo tekstu
  (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Łącznik jest wyprowadzany z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanałów są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje per konto).
- Domyślne `minChars` dla scalania jest zwiększane do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Bardziej naturalne tempo między blokami

Gdy strumieniowanie blokowe jest włączone, możesz dodać **losową pauzę** między
odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi wielobąbelkowe wydają się
bardziej naturalne.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie per agent przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślnie), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, a nie odpowiedzi końcowych ani podsumowań narzędzi.

## „Przesyłaj fragmenty strumieniowo albo wszystko”

Mapuje się to następująco:

- **Przesyłaj fragmenty strumieniowo:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram wymagają także `*.blockStreaming: true`.
- **Przesyłaj wszystko na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, ewentualnie w wielu fragmentach, jeśli odpowiedź jest bardzo długa).
- **Brak strumieniowania blokowego:** `blockStreamingDefault: "off"` (tylko odpowiedź końcowa).

**Uwaga dotycząca kanałów:** Strumieniowanie blokowe jest **wyłączone, chyba że**
`*.blockStreaming` jest jawnie ustawione na `true`. Kanały mogą przesyłać na żywo podgląd
(`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: ustawienia domyślne `blockStreaming*` znajdują się w
`agents.defaults`, a nie w głównej konfiguracji.

## Tryby strumieniowania podglądu

Klucz kanoniczny: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącz strumieniowanie podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: aktualizacje podglądu w krokach dzielonych na fragmenty/dopisywanych.
- `progress`: podgląd postępu/stanu podczas generowania, końcowa odpowiedź po zakończeniu.

### Mapowanie kanałów

| Kanał    | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | mapuje się na `partial` |
| Discord  | ✅    | ✅        | ✅      | mapuje się na `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Tylko dla Slack:

- `channels.slack.nativeStreaming` przełącza natywne wywołania API strumieniowania Slack, gdy `streaming=partial` (domyślnie: `true`).

Migracja starszych kluczy:

- Telegram: `streamMode` + logiczne `streaming` są automatycznie migrowane do enum `streaming`.
- Discord: `streamMode` + logiczne `streaming` są automatycznie migrowane do enum `streaming`.
- Slack: `streamMode` jest automatycznie migrowane do enum `streaming`; logiczne `streaming` jest automatycznie migrowane do `nativeStreaming`.

### Zachowanie w czasie działania

Telegram:

- Używa aktualizacji podglądu `sendMessage` + `editMessageText` w wiadomościach prywatnych i grupach/tematach.
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie blokowe Telegram jest jawnie włączone (aby uniknąć podwójnego strumieniowania).
- `/reasoning stream` może zapisywać rozumowanie do podglądu.

Discord:

- Używa wysyłania + edycji wiadomości podglądu.
- Tryb `block` używa dzielenia szkicu na fragmenty (`draftChunk`).
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie blokowe Discord jest jawnie włączone.

Slack:

- `partial` może używać natywnego strumieniowania Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępne.
- `block` używa podglądów szkicu w stylu dopisywania.
- `progress` używa tekstu podglądu stanu, a następnie końcowej odpowiedzi.

## Powiązane

- [Messages](/concepts/messages) — cykl życia wiadomości i dostarczanie
- [Retry](/concepts/retry) — zachowanie przy ponowieniu po błędzie dostarczenia
- [Channels](/pl/channels) — obsługa strumieniowania per kanał
