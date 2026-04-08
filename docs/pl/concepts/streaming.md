---
read_when:
    - Wyjaśnianie, jak działa strumieniowanie lub dzielenie na fragmenty w kanałach
    - Zmiana zachowania strumieniowania bloków lub dzielenia kanału na fragmenty
    - Debugowanie zduplikowanych/przedwczesnych odpowiedzi blokowych lub strumieniowania podglądu kanału
summary: Zachowanie strumieniowania + dzielenia na fragmenty (odpowiedzi blokowe, strumieniowanie podglądu kanału, mapowanie trybów)
title: Strumieniowanie i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-04-08T06:01:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8e847bb7da890818cd79dec7777f6ae488e6d6c0468e948e56b6b6c598e0000
    source_path: concepts/streaming.md
    workflow: 15
---

# Strumieniowanie + dzielenie na fragmenty

OpenClaw ma dwie oddzielne warstwy strumieniowania:

- **Strumieniowanie bloków (kanały):** emituje ukończone **bloki**, gdy asystent pisze. Są to zwykłe wiadomości kanału (nie delty tokenów).
- **Strumieniowanie podglądu (Telegram/Discord/Slack):** aktualizuje tymczasową **wiadomość podglądu** podczas generowania.

Obecnie **nie ma prawdziwego strumieniowania delt tokenów** do wiadomości kanału. Strumieniowanie podglądu jest oparte na wiadomościach (wysyłanie + edycje/dodawanie).

## Strumieniowanie bloków (wiadomości kanału)

Strumieniowanie bloków wysyła dane wyjściowe asystenta w większych fragmentach, gdy tylko stają się dostępne.

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

- `text_delta/events`: zdarzenia strumienia modelu (mogą być rzadkie dla modeli bez strumieniowania).
- `chunker`: `EmbeddedBlockChunker` stosujący minimalne/maksymalne granice + preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Elementy sterujące:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie off).
- Nadpisania kanałów: `*.blockStreaming` (oraz warianty per konto), aby wymusić `"on"`/`"off"` dla każdego kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` lub `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scala strumieniowane bloki przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb dzielenia kanału na fragmenty: `*.chunkMode` (`length` domyślnie, `newline` dzieli po pustych liniach (granice akapitów) przed dzieleniem według długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli długie odpowiedzi, aby uniknąć przycinania w interfejsie.

**Semantyka granic:**

- `text_end`: strumieniuje bloki, gdy tylko chunker je wyemituje; opróżnia przy każdym `text_end`.
- `message_end`: czeka, aż wiadomość asystenta zostanie ukończona, a następnie opróżnia zbuforowane dane wyjściowe.

`message_end` nadal używa chunkera, jeśli zbuforowany tekst przekracza `maxChars`, więc na końcu może wyemitować wiele fragmentów.

## Algorytm dzielenia na fragmenty (dolna/górna granica)

Dzielenie bloków na fragmenty jest implementowane przez `EmbeddedBlockChunker`:

- **Dolna granica:** nie emituje, dopóki bufor nie osiągnie `minChars` (chyba że zostanie wymuszone).
- **Górna granica:** preferuje podziały przed `maxChars`; jeśli wymuszone, dzieli przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Bloki kodu:** nigdy nie dzieli wewnątrz bloków; przy wymuszeniu na `maxChars` zamyka i ponownie otwiera blok, aby zachować poprawność Markdown.

`maxChars` jest ograniczane do `textChunkLimit` kanału, więc nie można przekroczyć limitów dla danego kanału.

## Scalanie (łączenie strumieniowanych bloków)

Gdy strumieniowanie bloków jest włączone, OpenClaw może **scalać kolejne fragmenty bloków**
przed ich wysłaniem. Zmniejsza to „spam pojedynczymi liniami”, nadal zapewniając
postępowe wyjście.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczone przez `maxChars` i zostaną opróżnione, jeśli go przekroczą.
- `minChars` zapobiega wysyłaniu bardzo małych fragmentów, dopóki nie zgromadzi się wystarczająco dużo tekstu
  (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Separator łączenia jest wyprowadzany z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanałów są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje per konto).
- Domyślne `minChars` dla scalania jest zwiększane do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Tempo zbliżone do ludzkiego między blokami

Gdy strumieniowanie bloków jest włączone, możesz dodać **losową przerwę** między
odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi w wielu dymkach
wydają się bardziej naturalne.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie per agent przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślnie), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, nie odpowiedzi końcowych ani podsumowań narzędzi.

## "Strumieniuj fragmenty albo wszystko"

To mapuje się na:

- **Strumieniuj fragmenty:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram wymagają także `*.blockStreaming: true`.
- **Strumieniuj wszystko na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, ewentualnie w wielu fragmentach, jeśli odpowiedź jest bardzo długa).
- **Brak strumieniowania bloków:** `blockStreamingDefault: "off"` (tylko odpowiedź końcowa).

**Uwaga dotycząca kanałów:** Strumieniowanie bloków jest **wyłączone, chyba że**
`*.blockStreaming` zostanie jawnie ustawione na `true`. Kanały mogą strumieniować podgląd na żywo
(`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: domyślne ustawienia `blockStreaming*` znajdują się w
`agents.defaults`, a nie w głównej konfiguracji.

## Tryby strumieniowania podglądu

Klucz kanoniczny: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącza strumieniowanie podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: aktualizacje podglądu wykonywane krokowo przez dzielenie na fragmenty/dodawanie.
- `progress`: podgląd postępu/statusu podczas generowania, odpowiedź końcowa po zakończeniu.

### Mapowanie kanałów

| Kanał    | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | mapuje do `partial` |
| Discord  | ✅    | ✅        | ✅      | mapuje do `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Tylko Slack:

- `channels.slack.streaming.nativeTransport` przełącza natywne wywołania API strumieniowania Slacka, gdy `channels.slack.streaming.mode="partial"` (domyślnie: `true`).
- Natywne strumieniowanie Slacka i status wątku asystenta Slack wymagają docelowego wątku odpowiedzi; wiadomości prywatne najwyższego poziomu nie pokazują takiego podglądu w stylu wątku.

Migracja starszych kluczy:

- Telegram: `streamMode` + logiczne `streaming` są automatycznie migrowane do enuma `streaming`.
- Discord: `streamMode` + logiczne `streaming` są automatycznie migrowane do enuma `streaming`.
- Slack: `streamMode` jest automatycznie migrowane do `streaming.mode`; logiczne `streaming` jest automatycznie migrowane do `streaming.mode` plus `streaming.nativeTransport`; starsze `nativeStreaming` jest automatycznie migrowane do `streaming.nativeTransport`.

### Zachowanie w czasie działania

Telegram:

- Używa aktualizacji podglądu `sendMessage` + `editMessageText` w wiadomościach prywatnych oraz grupach/tematach.
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Telegrama jest jawnie włączone (aby uniknąć podwójnego strumieniowania).
- `/reasoning stream` może zapisywać rozumowanie do podglądu.

Discord:

- Używa wiadomości podglądu send + edit.
- Tryb `block` używa roboczego dzielenia na fragmenty (`draftChunk`).
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Discorda jest jawnie włączone.

Slack:

- `partial` może używać natywnego strumieniowania Slacka (`chat.startStream`/`append`/`stop`), gdy jest dostępne.
- `block` używa podglądów roboczych w stylu dodawania.
- `progress` używa tekstu podglądu statusu, a następnie odpowiedzi końcowej.

## Powiązane

- [Wiadomości](/pl/concepts/messages) — cykl życia i dostarczanie wiadomości
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania przy błędzie dostarczenia
- [Kanały](/pl/channels) — obsługa strumieniowania per kanał
