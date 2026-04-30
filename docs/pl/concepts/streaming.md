---
read_when:
    - Wyjaśnianie, jak działa strumieniowanie lub dzielenie na fragmenty w kanałach
    - Zmiana zachowania strumieniowania bloków lub dzielenia kanału na fragmenty
    - Debugowanie zduplikowanych/przedwczesnych odpowiedzi blokowych lub strumieniowania podglądu kanału
summary: Zachowanie przesyłania strumieniowego i dzielenia na fragmenty (odpowiedzi blokowe, przesyłanie strumieniowe podglądu kanału, mapowanie trybów)
title: Strumieniowanie i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-04-30T09:50:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ma dwie oddzielne warstwy strumieniowania:

- **Strumieniowanie bloków (kanały):** emituje ukończone **bloki** w trakcie pisania przez asystenta. Są to zwykłe wiadomości kanału (nie delty tokenów).
- **Strumieniowanie podglądu (Telegram/Discord/Slack):** aktualizuje tymczasową **wiadomość podglądu** podczas generowania.

Obecnie **nie ma prawdziwego strumieniowania delt tokenów** do wiadomości kanałów. Strumieniowanie podglądu jest oparte na wiadomościach (wysyłanie + edycje/dopisywanie).

## Strumieniowanie bloków (wiadomości kanału)

Strumieniowanie bloków wysyła wynik asystenta w większych fragmentach, gdy stają się dostępne.

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
- `chunker`: `EmbeddedBlockChunker` stosujący granice min./maks. + preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Elementy sterujące:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie wyłączone).
- Nadpisania kanałów: `*.blockStreaming` (oraz warianty dla kont), aby wymusić `"on"`/`"off"` dla kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` lub `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scalanie strumieniowanych bloków przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb dzielenia kanału: `*.chunkMode` (domyślnie `length`, `newline` dzieli po pustych liniach (granicach akapitów) przed dzieleniem według długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć przycinania w interfejsie.

**Semantyka granic:**

- `text_end`: strumieniuj bloki, gdy tylko `chunker` je wyemituje; opróżniaj przy każdym `text_end`.
- `message_end`: poczekaj, aż wiadomość asystenta się zakończy, a następnie opróżnij zbuforowany wynik.

`message_end` nadal używa `chunker`, jeśli zbuforowany tekst przekracza `maxChars`, więc na końcu może wyemitować wiele fragmentów.

### Dostarczanie multimediów ze strumieniowaniem bloków

Dyrektywy `MEDIA:` są zwykłymi metadanymi dostarczania. Gdy strumieniowanie bloków wcześnie wysyła blok multimediów, OpenClaw zapamiętuje to dostarczenie dla danej tury. Jeśli końcowy ładunek asystenta powtarza ten sam URL multimediów, końcowe dostarczenie usuwa zduplikowane multimedia zamiast ponownie wysyłać załącznik.

Dokładnie zduplikowane końcowe ładunki są pomijane. Jeśli końcowy ładunek dodaje odrębny tekst wokół multimediów, które już zostały przesłane strumieniowo, OpenClaw nadal wysyła nowy tekst, zachowując pojedyncze dostarczenie multimediów. Zapobiega to duplikowaniu notatek głosowych lub plików w kanałach takich jak Telegram, gdy agent emituje `MEDIA:` podczas strumieniowania, a dostawca także uwzględnia je w ukończonej odpowiedzi.

## Algorytm dzielenia na fragmenty (dolne/górne granice)

Dzielenie bloków na fragmenty jest zaimplementowane przez `EmbeddedBlockChunker`:

- **Dolna granica:** nie emituj, dopóki bufor >= `minChars` (chyba że wymuszone).
- **Górna granica:** preferuj podziały przed `maxChars`; jeśli wymuszone, podziel przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Bloki kodu:** nigdy nie dziel wewnątrz bloków; przy wymuszeniu na `maxChars` zamknij i ponownie otwórz blok, aby Markdown pozostał poprawny.

`maxChars` jest ograniczane do kanałowego `textChunkLimit`, więc nie możesz przekroczyć limitów dla poszczególnych kanałów.

## Scalanie (łączenie strumieniowanych bloków)

Gdy strumieniowanie bloków jest włączone, OpenClaw może **łączyć kolejne fragmenty bloków** przed ich wysłaniem. Ogranicza to „spam pojedynczymi liniami”, jednocześnie nadal zapewniając progresywny wynik.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczone przez `maxChars` i zostaną opróżnione, jeśli go przekroczą.
- `minChars` zapobiega wysyłaniu drobnych fragmentów, dopóki nie zgromadzi się wystarczająco dużo tekstu (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Łącznik jest wyprowadzany z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanałów są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje dla poszczególnych kont).
- Domyślne scalające `minChars` jest podnoszone do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Ludzkie tempo między blokami

Gdy strumieniowanie bloków jest włączone, możesz dodać **losową pauzę** między odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi wielodymkowe sprawiają bardziej naturalne wrażenie.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie dla agenta przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślny), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, nie odpowiedzi końcowych ani podsumowań narzędzi.

## „Strumieniuj fragmenty albo całość”

To odpowiada:

- **Strumieniuj fragmenty:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram wymagają też `*.blockStreaming: true`.
- **Strumieniuj wszystko na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, potencjalnie w wielu fragmentach, jeśli odpowiedź jest bardzo długa).
- **Bez strumieniowania bloków:** `blockStreamingDefault: "off"` (tylko odpowiedź końcowa).

**Uwaga dotycząca kanału:** Strumieniowanie bloków jest **wyłączone, chyba że**
`*.blockStreaming` jest jawnie ustawione na `true`. Kanały mogą strumieniować podgląd na żywo
(`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: domyślne ustawienia `blockStreaming*` znajdują się w
`agents.defaults`, nie w konfiguracji głównej.

## Tryby strumieniowania podglądu

Klucz kanoniczny: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącza strumieniowanie podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: podgląd aktualizowany w krokach z fragmentami/dopiskami.
- `progress`: podgląd postępu/statusu podczas generowania, odpowiedź końcowa po ukończeniu.

### Mapowanie kanałów

| Kanał      | `off` | `partial` | `block` | `progress`             |
| ---------- | ----- | --------- | ------- | ---------------------- |
| Telegram   | ✅    | ✅        | ✅      | mapuje na `partial`    |
| Discord    | ✅    | ✅        | ✅      | mapuje na `partial`    |
| Slack      | ✅    | ✅        | ✅      | ✅                     |
| Mattermost | ✅    | ✅        | ✅      | ✅                     |

Tylko Slack:

- `channels.slack.streaming.nativeTransport` przełącza natywne wywołania API strumieniowania Slack, gdy `channels.slack.streaming.mode="partial"` (domyślnie: `true`).
- Natywne strumieniowanie Slack i status wątku asystenta Slack wymagają celu wątku odpowiedzi; DM-y najwyższego poziomu nie pokazują takiego podglądu w stylu wątku.

Migracja starszych kluczy:

- Telegram: starsze wartości `streamMode` oraz skalarne/logiczne wartości `streaming` są wykrywane i migrowane przez ścieżki zgodności doctor/konfiguracji do `streaming.mode`.
- Discord: `streamMode` + logiczne `streaming` automatycznie migrują do wyliczenia `streaming`.
- Slack: `streamMode` automatycznie migruje do `streaming.mode`; logiczne `streaming` automatycznie migruje do `streaming.mode` plus `streaming.nativeTransport`; starsze `nativeStreaming` automatycznie migruje do `streaming.nativeTransport`.

### Zachowanie w czasie wykonywania

Telegram:

- Używa aktualizacji podglądu `sendMessage` + `editMessageText` w DM-ach oraz grupach/tematach.
- Wysyła świeżą wiadomość końcową zamiast edytować w miejscu, gdy podgląd był widoczny przez około minutę, a następnie usuwa podgląd, aby znacznik czasu Telegram odzwierciedlał ukończenie odpowiedzi.
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Telegram jest jawnie włączone (aby uniknąć podwójnego strumieniowania).
- `/reasoning stream` może zapisywać rozumowanie do podglądu.

Discord:

- Używa wiadomości podglądu wysyłanych i edytowanych.
- Tryb `block` używa dzielenia wersji roboczej (`draftChunk`).
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Discord jest jawnie włączone.
- Końcowe multimedia, błędy i ładunki jawnych odpowiedzi anulują oczekujące podglądy bez opróżniania nowej wersji roboczej, a następnie używają normalnego dostarczania.

Slack:

- `partial` może używać natywnego strumieniowania Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępne.
- `block` używa podglądów wersji roboczej w stylu dopisywania.
- `progress` używa tekstu podglądu statusu, a następnie odpowiedzi końcowej.
- Natywne strumieniowanie i strumieniowanie podglądu wersji roboczej tłumią odpowiedzi blokowe w tej turze, więc odpowiedź Slack jest strumieniowana tylko jedną ścieżką dostarczania.
- Końcowe ładunki multimediów/błędów i końcowe postępy nie tworzą jednorazowych wiadomości wersji roboczej; tylko końcowe teksty/bloki, które mogą edytować podgląd, opróżniają oczekujący tekst wersji roboczej.

Mattermost:

- Strumieniuje myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do jednego posta podglądu wersji roboczej, który finalizuje się w miejscu, gdy odpowiedź końcową można bezpiecznie wysłać.
- Wysyła świeży post końcowy jako rozwiązanie awaryjne, jeśli post podglądu został usunięty lub jest w inny sposób niedostępny w czasie finalizacji.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed normalnym dostarczaniem zamiast opróżniać tymczasowy post podglądu.

Matrix:

- Podglądy wersji roboczej finalizują się w miejscu, gdy końcowy tekst może ponownie użyć zdarzenia podglądu.
- Końcowe odpowiedzi tylko z multimediami, błędami i niedopasowaniem celu odpowiedzi anulują oczekujące aktualizacje podglądu przed normalnym dostarczaniem; już widoczny nieaktualny podgląd jest redagowany.

### Aktualizacje podglądu postępu narzędzi

Strumieniowanie podglądu może też obejmować aktualizacje **postępu narzędzi** — krótkie linie statusu, takie jak „przeszukiwanie sieci”, „odczytywanie pliku” lub „wywoływanie narzędzia” — które pojawiają się w tej samej wiadomości podglądu podczas działania narzędzi, przed odpowiedzią końcową. Dzięki temu wieloetapowe tury narzędzi pozostają wizualnie aktywne zamiast milczeć między pierwszym podglądem myślenia a odpowiedzią końcową.

Obsługiwane powierzchnie:

- **Discord**, **Slack**, **Telegram** i **Matrix** domyślnie strumieniują postęp narzędzi do edycji podglądu na żywo, gdy strumieniowanie podglądu jest aktywne.
- Telegram jest dostarczany z włączonymi aktualizacjami podglądu postępu narzędzi od `v2026.4.22`; pozostawienie ich włączonych zachowuje to wydane zachowanie.
- **Mattermost** już włącza aktywność narzędzi do swojego pojedynczego posta podglądu wersji roboczej (patrz wyżej).
- Edycje postępu narzędzi podążają za aktywnym trybem strumieniowania podglądu; są pomijane, gdy strumieniowanie podglądu jest `off` albo gdy strumieniowanie bloków przejęło wiadomość. W Telegram `streaming.mode: "off"` oznacza tylko odpowiedź końcową: ogólne komunikaty o postępie są także tłumione zamiast dostarczania ich jako osobnych wiadomości „Pracuję...”, natomiast monity zatwierdzania, ładunki multimediów i błędy nadal są kierowane normalnie.
- Aby zachować strumieniowanie podglądu, ale ukryć linie postępu narzędzi, ustaw `streaming.preview.toolProgress` na `false` dla tego kanału. Aby całkowicie wyłączyć edycje podglądu, ustaw `streaming.mode` na `off`.

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
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania przy niepowodzeniu dostarczenia
- [Kanały](/pl/channels) — obsługa strumieniowania dla poszczególnych kanałów
