---
read_when:
    - Wyjaśnianie, jak działa strumieniowanie lub dzielenie na fragmenty w kanałach
    - Zmiana zachowania przesyłania strumieniowego bloków lub dzielenia kanału na fragmenty
    - Debugowanie zduplikowanych lub zbyt wczesnych odpowiedzi blokowych albo strumieniowania podglądu kanału
summary: Zachowanie strumieniowania i dzielenia na fragmenty (odpowiedzi blokowe, strumieniowanie podglądu kanału, mapowanie trybów)
title: Strumieniowanie i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-05-06T09:10:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ccf763c5904b9b01d127d6e9a914e73100137eba9d791654581a2ec7d4949ed
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ma dwie oddzielne warstwy strumieniowania:

- **Strumieniowanie blokowe (kanały):** emituje ukończone **bloki**, gdy asystent pisze. Są to zwykłe wiadomości kanału (nie delty tokenów).
- **Strumieniowanie podglądu (Telegram/Discord/Slack):** aktualizuje tymczasową **wiadomość podglądu** podczas generowania.

Obecnie **nie ma prawdziwego strumieniowania delt tokenów** do wiadomości kanału. Strumieniowanie podglądu jest oparte na wiadomościach (wysyłanie + edycje/dopisywanie).

## Strumieniowanie blokowe (wiadomości kanału)

Strumieniowanie blokowe wysyła odpowiedź asystenta w grubych fragmentach, gdy staje się dostępna.

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

- `text_delta/events`: zdarzenia strumienia modelu (mogą być rzadkie dla modeli niestrumieniowych).
- `chunker`: `EmbeddedBlockChunker` stosujący granice min./maks. + preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Ustawienia:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie wyłączone).
- Nadpisania kanałów: `*.blockStreaming` (oraz warianty dla kont), aby wymusić `"on"`/`"off"` dla kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` albo `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scala strumieniowane bloki przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb dzielenia kanału: `*.chunkMode` (`length` domyślnie, `newline` dzieli po pustych wierszach (granicach akapitów) przed dzieleniem według długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć przycinania w interfejsie.

**Semantyka granic:**

- `text_end`: strumieniuje bloki, gdy tylko emituje je chunker; opróżnia przy każdym `text_end`.
- `message_end`: czeka, aż wiadomość asystenta się zakończy, a następnie opróżnia zbuforowaną odpowiedź.

`message_end` nadal używa chunkera, jeśli zbuforowany tekst przekracza `maxChars`, więc może wyemitować wiele fragmentów na końcu.

### Dostarczanie multimediów ze strumieniowaniem blokowym

Dyrektywy `MEDIA:` są zwykłymi metadanymi dostarczania. Gdy strumieniowanie blokowe wcześnie wysyła blok multimediów, OpenClaw zapamiętuje to dostarczenie dla danej tury. Jeśli końcowy ładunek asystenta powtarza ten sam URL multimediów, końcowe dostarczenie usuwa zduplikowane multimedia zamiast ponownie wysyłać załącznik.

Dokładnie zduplikowane ładunki końcowe są pomijane. Jeśli ładunek końcowy dodaje odrębny tekst wokół multimediów, które zostały już przesłane strumieniowo, OpenClaw nadal wysyła nowy tekst, zachowując pojedyncze dostarczenie multimediów. Zapobiega to duplikowaniu notatek głosowych lub plików w kanałach takich jak Telegram, gdy agent emituje `MEDIA:` podczas strumieniowania, a dostawca uwzględnia je także w ukończonej odpowiedzi.

## Algorytm dzielenia (dolne/górne granice)

Dzielenie bloków jest implementowane przez `EmbeddedBlockChunker`:

- **Dolna granica:** nie emituj, dopóki bufor >= `minChars` (chyba że wymuszone).
- **Górna granica:** preferuj podziały przed `maxChars`; jeśli wymuszone, podziel przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Bloki kodu:** nigdy nie dziel wewnątrz bloków; przy wymuszonym podziale na `maxChars` zamknij i ponownie otwórz blok, aby zachować poprawny Markdown.

`maxChars` jest ograniczane do `textChunkLimit` kanału, więc nie można przekroczyć limitów poszczególnych kanałów.

## Scalanie (łączenie strumieniowanych bloków)

Gdy strumieniowanie blokowe jest włączone, OpenClaw może **scalać kolejne fragmenty bloków** przed ich wysłaniem. Ogranicza to „spam pojedynczych wierszy”, jednocześnie nadal zapewniając progresywną odpowiedź.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczane przez `maxChars` i zostaną opróżnione, jeśli go przekroczą.
- `minChars` zapobiega wysyłaniu drobnych fragmentów, dopóki nie zgromadzi się wystarczająco dużo tekstu (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Separator jest wyprowadzany z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanałów są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje dla kont).
- Domyślne `minChars` scalania jest podnoszone do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Naturalne tempo między blokami

Gdy strumieniowanie blokowe jest włączone, można dodać **losową pauzę** między odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi z wieloma dymkami sprawiają bardziej naturalne wrażenie.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie dla agenta przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślny), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, nie odpowiedzi końcowych ani podsumowań narzędzi.

## „Strumieniuj fragmenty albo wszystko”

Odwzorowuje się to na:

- **Strumieniuj fragmenty:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram wymagają też `*.blockStreaming: true`.
- **Strumieniuj wszystko na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, możliwie w wielu fragmentach, jeśli bardzo długie).
- **Brak strumieniowania blokowego:** `blockStreamingDefault: "off"` (tylko odpowiedź końcowa).

**Uwaga o kanale:** Strumieniowanie blokowe jest **wyłączone, chyba że**
`*.blockStreaming` jest jawnie ustawione na `true`. Kanały mogą strumieniować podgląd na żywo
(`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: wartości domyślne `blockStreaming*` znajdują się pod
`agents.defaults`, a nie w konfiguracji głównej.

## Tryby strumieniowania podglądu

Klucz kanoniczny: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącza strumieniowanie podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: podgląd aktualizowany w krokach dzielonych/dopisywanych.
- `progress`: podgląd postępu/statusu podczas generowania, końcowa odpowiedź po ukończeniu.

`streaming.mode: "block"` to tryb strumieniowania podglądu dla kanałów obsługujących edycję,
takich jak Discord i Telegram. Nie włącza tam blokowego dostarczania kanałem.
Użyj `streaming.block.enabled` albo starszego klucza kanału `blockStreaming`, gdy
chcesz zwykłych odpowiedzi blokowych. Microsoft Teams jest wyjątkiem: nie ma
transportu bloków podglądu roboczego, więc `streaming.mode: "block"` mapuje się na blokowe
dostarczanie Teams zamiast natywnego strumieniowania częściowego/postępu.

### Mapowanie kanałów

| Kanał      | `off` | `partial` | `block` | `progress`                    |
| ---------- | ----- | --------- | ------- | ----------------------------- |
| Telegram   | ✅    | ✅        | ✅      | edytowalna wersja robocza postępu |
| Discord    | ✅    | ✅        | ✅      | edytowalna wersja robocza postępu |
| Slack      | ✅    | ✅        | ✅      | ✅                            |
| Mattermost | ✅    | ✅        | ✅      | ✅                            |
| MS Teams   | ✅    | ✅        | ✅      | natywny strumień postępu      |

Tylko Slack:

- `channels.slack.streaming.nativeTransport` przełącza natywne wywołania API strumieniowania Slack, gdy `channels.slack.streaming.mode="partial"` (domyślnie: `true`).
- Natywne strumieniowanie Slack i status wątku asystenta Slack wymagają docelowego wątku odpowiedzi. Prywatne wiadomości najwyższego poziomu nie pokazują takiego podglądu w stylu wątku, ale nadal mogą używać roboczych postów podglądu Slack i edycji.

Migracja starszych kluczy:

- Telegram: starsze wartości `streamMode` oraz skalarne/logiczne wartości `streaming` są wykrywane i migrowane przez ścieżki zgodności doctor/konfiguracji do `streaming.mode`.
- Discord: `streamMode` + logiczne `streaming` automatycznie migrują do wyliczenia `streaming`.
- Slack: `streamMode` automatycznie migruje do `streaming.mode`; logiczne `streaming` automatycznie migruje do `streaming.mode` plus `streaming.nativeTransport`; starsze `nativeStreaming` automatycznie migruje do `streaming.nativeTransport`.

### Zachowanie w czasie działania

Telegram:

- Używa `sendMessage` + `editMessageText` do aktualizacji podglądu w prywatnych wiadomościach oraz grupach/tematach.
- Tekst końcowy edytuje aktywny podgląd w miejscu; długie odpowiedzi końcowe ponownie używają tej wiadomości dla pierwszego fragmentu i wysyłają tylko pozostałe fragmenty.
- Tryb `progress` utrzymuje postęp narzędzi w edytowalnej roboczej wiadomości statusu, czyści ją po ukończeniu i wysyła końcową odpowiedź normalną ścieżką dostarczania.
- Jeśli końcowa edycja nie powiedzie się, zanim ukończony tekst zostanie potwierdzony, OpenClaw używa normalnego końcowego dostarczenia i czyści przestarzały podgląd.
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie blokowe Telegram jest jawnie włączone (aby uniknąć podwójnego strumieniowania).
- `/reasoning stream` może zapisywać rozumowanie do przejściowego podglądu, który jest usuwany po końcowym dostarczeniu.

Discord:

- Używa wysyłania + edycji wiadomości podglądu.
- Tryb `block` używa dzielenia wersji roboczej (`draftChunk`).
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie blokowe Discord jest jawnie włączone.
- Końcowe ładunki multimediów, błędów i jawnych odpowiedzi anulują oczekujące podglądy bez opróżniania nowej wersji roboczej, a następnie używają normalnego dostarczania.

Slack:

- `partial` może używać natywnego strumieniowania Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępne.
- `block` używa roboczych podglądów w stylu dopisywania.
- `progress` używa tekstu podglądu statusu, a potem końcowej odpowiedzi.
- Prywatne wiadomości najwyższego poziomu bez wątku odpowiedzi używają roboczych postów podglądu i edycji zamiast natywnego strumieniowania Slack.
- Natywne i robocze strumieniowanie podglądu pomija odpowiedzi blokowe dla tej tury, więc odpowiedź Slack jest strumieniowana tylko jedną ścieżką dostarczania.
- Końcowe ładunki multimediów/błędów oraz końcowe odpowiedzi postępu nie tworzą jednorazowych wiadomości roboczych; tylko tekstowe/blokowe odpowiedzi końcowe, które mogą edytować podgląd, opróżniają oczekujący tekst roboczy.

Mattermost:

- Strumieniuje myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do pojedynczego roboczego posta podglądu, który finalizuje się w miejscu, gdy końcową odpowiedź można bezpiecznie wysłać.
- Wraca do wysłania nowego posta końcowego, jeśli post podglądu został usunięty albo jest inaczej niedostępny w momencie finalizacji.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed normalnym dostarczeniem zamiast opróżniać tymczasowy post podglądu.

Matrix:

- Robocze podglądy finalizują się w miejscu, gdy końcowy tekst może ponownie użyć zdarzenia podglądu.
- Końcowe odpowiedzi tylko z multimediami, błędami oraz z niezgodnym celem odpowiedzi anulują oczekujące aktualizacje podglądu przed normalnym dostarczeniem; już widoczny przestarzały podgląd zostaje zredagowany.

### Aktualizacje podglądu postępu narzędzi

Strumieniowanie podglądu może również zawierać aktualizacje **postępu narzędzi** - krótkie wiersze statusu, takie jak „wyszukiwanie w sieci”, „odczytywanie pliku” albo „wywoływanie narzędzia” - które pojawiają się w tej samej wiadomości podglądu, gdy narzędzia działają, przed końcową odpowiedzią. Dzięki temu wieloetapowe tury narzędzi pozostają wizualnie aktywne, zamiast milczeć między pierwszym podglądem myślenia a końcową odpowiedzią.

Obsługiwane powierzchnie:

- **Discord**, **Slack**, **Telegram** i **Matrix** domyślnie przesyłają postęp narzędzi do edycji podglądu na żywo, gdy strumieniowanie podglądu jest aktywne. Microsoft Teams używa swojego natywnego strumienia postępu w czatach osobistych.
- Telegram ma włączone aktualizacje podglądu postępu narzędzi od wersji `v2026.4.22`; pozostawienie ich włączonych zachowuje to wydane zachowanie.
- **Mattermost** już składa aktywność narzędzi w pojedynczy wpis podglądu wersji roboczej (zobacz wyżej).
- Edycje postępu narzędzi podążają za aktywnym trybem strumieniowania podglądu; są pomijane, gdy strumieniowanie podglądu ma wartość `off` albo gdy strumieniowanie blokowe przejęło wiadomość. W Telegramie `streaming.mode: "off"` oznacza tylko wynik końcowy: ogólne komunikaty postępu również są wyciszane zamiast dostarczania ich jako samodzielnych wiadomości statusu, natomiast monity zatwierdzeń, ładunki multimedialne i błędy nadal są kierowane normalnie.
- Aby zachować strumieniowanie podglądu, ale ukryć wiersze postępu narzędzi, ustaw `streaming.preview.toolProgress` na `false` dla tego kanału. Aby wiersze postępu narzędzi pozostały widoczne przy jednoczesnym ukryciu tekstu poleceń/wykonań, ustaw `streaming.preview.commandText` na `"status"` albo `streaming.progress.commandText` na `"status"`; wartością domyślną jest `"raw"`, aby zachować wydane zachowanie. Ta zasada jest współdzielona przez kanały wersji roboczej/postępu, które używają kompaktowego renderera postępu OpenClaw, w tym Discord, Matrix, Microsoft Teams, Mattermost, podglądy wersji roboczych Slack i Telegram. Aby całkowicie wyłączyć edycje podglądu, ustaw `streaming.mode` na `off`.
- Odpowiedzi Telegrama z wybranym cytatem są wyjątkiem: gdy `replyToMode` nie ma wartości `"off"` i obecny jest tekst wybranego cytatu, OpenClaw pomija strumień podglądu odpowiedzi dla tej tury, więc wiersze podglądu postępu narzędzi nie mogą się renderować. Odpowiedzi na bieżącą wiadomość bez tekstu wybranego cytatu nadal zachowują strumieniowanie podglądu. Szczegóły znajdziesz w [dokumentacji kanału Telegram](/pl/channels/telegram).

Zachowaj widoczność wierszy postępu, ale ukryj surowy tekst poleceń/wykonań:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

Użyj tego samego kształtu pod kluczem innego kompaktowego kanału postępu, na przykład `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` albo podglądów wersji roboczych Slack. Dla trybu wersji roboczej postępu umieść tę samą zasadę pod `streaming.progress`:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## Powiązane

- [Refaktoryzacja cyklu życia wiadomości](/pl/concepts/message-lifecycle-refactor) - docelowy współdzielony projekt podglądu, edycji, strumienia i finalizacji
- [Wersje robocze postępu](/pl/concepts/progress-drafts) - widoczne wiadomości o pracy w toku, które aktualizują się podczas długich tur
- [Wiadomości](/pl/concepts/messages) - cykl życia i dostarczanie wiadomości
- [Ponawianie](/pl/concepts/retry) - zachowanie ponawiania po niepowodzeniu dostarczenia
- [Kanały](/pl/channels) - obsługa strumieniowania dla poszczególnych kanałów
