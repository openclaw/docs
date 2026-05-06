---
read_when:
    - Wyjaśnienie, jak przesyłanie strumieniowe lub dzielenie na fragmenty działa w kanałach
    - Zmiana zachowania strumieniowania bloków lub fragmentowania kanałów
    - Debugowanie zduplikowanych/zbyt wczesnych odpowiedzi blokowych lub strumieniowania podglądu kanału
summary: Zachowanie strumieniowania + dzielenia na fragmenty (odpowiedzi blokowe, strumieniowanie podglądu kanału, mapowanie trybów)
title: Strumieniowanie i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-05-06T17:55:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: e43dc87211e764f9721c4e6c0aa69088441344e1f7c34084fd711a780a852a17
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ma dwie oddzielne warstwy strumieniowania:

- **Strumieniowanie bloków (kanały):** emituje ukończone **bloki** podczas pisania przez asystenta. Są to zwykłe wiadomości kanału (nie delty tokenów).
- **Strumieniowanie podglądu (Telegram/Discord/Slack):** aktualizuje tymczasową **wiadomość podglądu** podczas generowania.

Obecnie **nie ma prawdziwego strumieniowania delt tokenów** do wiadomości kanału. Strumieniowanie podglądu jest oparte na wiadomościach (wysyłanie + edycje/dopisywanie).

## Strumieniowanie bloków (wiadomości kanału)

Strumieniowanie bloków wysyła dane wyjściowe asystenta w większych fragmentach, gdy stają się dostępne.

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

- `text_delta/events`: zdarzenia strumienia modelu (mogą być sporadyczne w przypadku modeli niestrumieniujących).
- `chunker`: `EmbeddedBlockChunker` stosujący granice min./maks. + preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Sterowanie:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie wyłączone).
- Nadpisania kanałów: `*.blockStreaming` (oraz warianty per konto), aby wymusić `"on"`/`"off"` dla danego kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` lub `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scala strumieniowane bloki przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb fragmentowania kanału: `*.chunkMode` (domyślnie `length`, `newline` dzieli po pustych liniach (granicach akapitów) przed fragmentowaniem według długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć przycinania w interfejsie.

**Semantyka granic:**

- `text_end`: strumieniuje bloki natychmiast po wyemitowaniu przez chunker; opróżnia bufor przy każdym `text_end`.
- `message_end`: czeka do zakończenia wiadomości asystenta, a następnie opróżnia zbuforowane dane wyjściowe.

`message_end` nadal używa chunkera, jeśli zbuforowany tekst przekracza `maxChars`, więc może wyemitować wiele fragmentów na końcu.

### Dostarczanie multimediów ze strumieniowaniem bloków

Dyrektywy `MEDIA:` są zwykłymi metadanymi dostarczania. Gdy strumieniowanie bloków wyśle blok multimediów wcześniej, OpenClaw zapamiętuje to dostarczenie dla danej tury. Jeśli końcowy ładunek asystenta powtarza ten sam URL multimediów, końcowe dostarczenie usuwa duplikat multimediów zamiast ponownie wysyłać załącznik.

Dokładne duplikaty końcowych ładunków są pomijane. Jeśli końcowy ładunek dodaje odrębny tekst wokół multimediów, które już zostały przesłane strumieniowo, OpenClaw nadal wysyła nowy tekst, zachowując jednorazowe dostarczenie multimediów. Zapobiega to duplikowaniu notatek głosowych lub plików w kanałach takich jak Telegram, gdy agent emituje `MEDIA:` podczas strumieniowania, a dostawca również uwzględnia je w ukończonej odpowiedzi.

## Algorytm fragmentowania (dolne/górne granice)

Fragmentowanie bloków jest implementowane przez `EmbeddedBlockChunker`:

- **Dolna granica:** nie emituj, dopóki bufor >= `minChars` (chyba że wymuszone).
- **Górna granica:** preferuj podziały przed `maxChars`; jeśli wymuszone, dziel przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Bloki kodu:** nigdy nie dziel wewnątrz bloków; przy wymuszeniu na `maxChars` zamknij + otwórz ponownie blok, aby zachować poprawny Markdown.

`maxChars` jest ograniczane do kanałowego `textChunkLimit`, więc nie można przekroczyć limitów poszczególnych kanałów.

## Scalanie (łączenie strumieniowanych bloków)

Gdy strumieniowanie bloków jest włączone, OpenClaw może **scalać kolejne fragmenty bloków** przed ich wysłaniem. Ogranicza to „spam pojedynczych linii”, jednocześnie nadal zapewniając progresywne dane wyjściowe.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem bufora.
- Bufory są ograniczone przez `maxChars` i zostaną opróżnione, jeśli je przekroczą.
- `minChars` zapobiega wysyłaniu drobnych fragmentów, dopóki nie zgromadzi się wystarczająco dużo tekstu (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Łącznik jest wyprowadzany z `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanałów są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje per konto).
- Domyślne `minChars` scalania jest podnoszone do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Ludzkie tempo między blokami

Gdy strumieniowanie bloków jest włączone, możesz dodać **losową pauzę** między odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi w wielu dymkach sprawiają bardziej naturalne wrażenie.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie per agent przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślnie), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, a nie końcowych odpowiedzi ani podsumowań narzędzi.

## „Strumieniuj fragmenty albo wszystko”

To mapuje się na:

- **Strumieniuj fragmenty:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram wymagają też `*.blockStreaming: true`.
- **Strumieniuj wszystko na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, możliwie w wielu fragmentach, jeśli bardzo długie).
- **Bez strumieniowania bloków:** `blockStreamingDefault: "off"` (tylko końcowa odpowiedź).

**Uwaga dotycząca kanału:** Strumieniowanie bloków jest **wyłączone, chyba że** `*.blockStreaming` jest jawnie ustawione na `true`. Kanały mogą strumieniować podgląd na żywo (`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: wartości domyślne `blockStreaming*` znajdują się pod `agents.defaults`, a nie w konfiguracji głównej.

## Tryby strumieniowania podglądu

Kanoniczny klucz: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącza strumieniowanie podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: podgląd aktualizowany krokami fragmentowanymi/dopisywanymi.
- `progress`: podgląd postępu/statusu podczas generowania, końcowa odpowiedź po zakończeniu.

`streaming.mode: "block"` to tryb strumieniowania podglądu dla kanałów obsługujących edycję, takich jak Discord i Telegram. Nie włącza tam dostarczania bloków kanału. Użyj `streaming.block.enabled` albo starszego klucza kanału `blockStreaming`, gdy chcesz zwykłych odpowiedzi blokowych. Microsoft Teams jest wyjątkiem: nie ma transportu blokowego podglądu wersji roboczej, więc `streaming.mode: "block"` mapuje się na dostarczanie bloków Teams zamiast natywnego strumieniowania częściowego/postępu.

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
- Natywne strumieniowanie Slack i status wątku asystenta Slack wymagają docelowego wątku odpowiedzi. Wiadomości prywatne najwyższego poziomu nie pokazują takiego podglądu w stylu wątku, ale nadal mogą używać postów podglądu wersji roboczej Slack i edycji.

Migracja starszych kluczy:

- Telegram: starszy `streamMode` oraz skalarne/logiczne wartości `streaming` są wykrywane i migrowane przez ścieżki zgodności doctor/konfiguracji do `streaming.mode`.
- Discord: `streamMode` + logiczne `streaming` pozostają aliasami czasu wykonywania dla wyliczenia `streaming`; uruchom `openclaw doctor --fix`, aby przepisać zapisaną konfigurację.
- Slack: `streamMode` pozostaje aliasem czasu wykonywania dla `streaming.mode`; logiczne `streaming` pozostaje aliasem czasu wykonywania dla `streaming.mode` plus `streaming.nativeTransport`; starsze `nativeStreaming` pozostaje aliasem czasu wykonywania dla `streaming.nativeTransport`. Uruchom `openclaw doctor --fix`, aby przepisać zapisaną konfigurację.

### Zachowanie w czasie wykonywania

Telegram:

- Używa `sendMessage` + `editMessageText` do aktualizacji podglądu w wiadomościach prywatnych i grupach/tematach.
- Końcowy tekst edytuje aktywny podgląd w miejscu; długie finały ponownie używają tej wiadomości dla pierwszego fragmentu i wysyłają tylko pozostałe fragmenty.
- Tryb `progress` utrzymuje postęp narzędzi w edytowalnej wersji roboczej statusu, czyści tę wersję roboczą po zakończeniu i wysyła końcową odpowiedź przez zwykłe dostarczanie.
- Jeśli końcowa edycja nie powiedzie się przed potwierdzeniem ukończonego tekstu, OpenClaw używa zwykłego końcowego dostarczania i czyści nieaktualny podgląd.
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Telegram jest jawnie włączone (aby uniknąć podwójnego strumieniowania).
- `/reasoning stream` może zapisywać rozumowanie do przejściowego podglądu, który jest usuwany po końcowym dostarczeniu.

Discord:

- Używa wysyłania + edycji wiadomości podglądu.
- Tryb `block` używa fragmentowania wersji roboczej (`draftChunk`).
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Discord jest jawnie włączone.
- Końcowe multimedia, błąd i ładunki z jawną odpowiedzią anulują oczekujące podglądy bez opróżniania nowej wersji roboczej, a następnie używają zwykłego dostarczania.

Slack:

- `partial` może używać natywnego strumieniowania Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępne.
- `block` używa podglądów wersji roboczej w stylu dopisywania.
- `progress` używa tekstu podglądu statusu, a następnie końcowej odpowiedzi.
- Wiadomości prywatne najwyższego poziomu bez wątku odpowiedzi używają postów podglądu wersji roboczej i edycji zamiast natywnego strumieniowania Slack.
- Natywne i robocze strumieniowanie podglądu tłumi odpowiedzi blokowe dla tej tury, więc odpowiedź Slack jest strumieniowana tylko jedną ścieżką dostarczania.
- Końcowe ładunki multimediów/błędów i finały postępu nie tworzą jednorazowych wiadomości wersji roboczej; tylko finały tekstowe/blokowe, które mogą edytować podgląd, opróżniają oczekujący tekst wersji roboczej.

Mattermost:

- Strumieniuje myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do jednego posta podglądu wersji roboczej, który finalizuje się w miejscu, gdy można bezpiecznie wysłać końcową odpowiedź.
- Wraca do wysłania nowego posta końcowego, jeśli post podglądu został usunięty albo jest w inny sposób niedostępny w momencie finalizacji.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed zwykłym dostarczeniem zamiast opróżniać tymczasowy post podglądu.

Matrix:

- Podglądy wersji roboczej finalizują się w miejscu, gdy końcowy tekst może ponownie użyć zdarzenia podglądu.
- Finały zawierające tylko multimedia, błędy oraz finały z niedopasowanym celem odpowiedzi anulują oczekujące aktualizacje podglądu przed zwykłym dostarczeniem; już widoczny nieaktualny podgląd zostaje zredagowany.

### Aktualizacje podglądu postępu narzędzi

Strumieniowanie podglądu może także obejmować aktualizacje **postępu narzędzi** - krótkie linie statusu, takie jak „przeszukiwanie sieci”, „czytanie pliku” albo „wywoływanie narzędzia” - które pojawiają się w tej samej wiadomości podglądu podczas działania narzędzi, przed końcową odpowiedzią. Dzięki temu wieloetapowe tury z narzędziami pozostają wizualnie aktywne, zamiast milczeć między pierwszym podglądem myślenia a końcową odpowiedzią.

Obsługiwane powierzchnie:

- **Discord**, **Slack**, **Telegram** i **Matrix** domyślnie przesyłają postęp narzędzi do edycji podglądu na żywo, gdy aktywne jest strumieniowanie podglądu. Microsoft Teams używa swojego natywnego strumienia postępu w czatach osobistych.
- Telegram ma włączone aktualizacje podglądu postępu narzędzi od wersji `v2026.4.22`; pozostawienie ich włączonych zachowuje to wydane zachowanie.
- **Mattermost** już składa aktywność narzędzi w swoim pojedynczym wpisie roboczego podglądu (patrz wyżej).
- Edycje postępu narzędzi podążają za aktywnym trybem strumieniowania podglądu; są pomijane, gdy strumieniowanie podglądu ma wartość `off` albo gdy strumieniowanie blokowe przejęło wiadomość. W Telegram ustawienie `streaming.mode: "off"` oznacza wyłącznie wiadomość końcową: ogólne komunikaty o postępie również są tłumione zamiast dostarczania ich jako osobnych wiadomości statusu, natomiast prośby o zatwierdzenie, ładunki multimedialne i błędy nadal są kierowane normalnie.
- Aby zachować strumieniowanie podglądu, ale ukryć wiersze postępu narzędzi, ustaw `streaming.preview.toolProgress` na `false` dla tego kanału. Aby zachować widoczność wierszy postępu narzędzi, ale ukryć tekst polecenia/wykonania, ustaw `streaming.preview.commandText` na `"status"` albo `streaming.progress.commandText` na `"status"`; wartość domyślna to `"raw"`, aby zachować wydane zachowanie. Ta polityka jest współdzielona przez kanały szkiców/postępu, które używają kompaktowego renderera postępu OpenClaw, w tym Discord, Matrix, Microsoft Teams, Mattermost, podglądy szkiców Slack i Telegram. Aby całkowicie wyłączyć edycje podglądu, ustaw `streaming.mode` na `off`.
- Odpowiedzi Telegram na wybrane cytaty są wyjątkiem: gdy `replyToMode` nie ma wartości `"off"` i obecny jest tekst wybranego cytatu, OpenClaw pomija strumień podglądu odpowiedzi dla tej tury, więc wiersze podglądu postępu narzędzi nie mogą być renderowane. Odpowiedzi na bieżące wiadomości bez tekstu wybranego cytatu nadal zachowują strumieniowanie podglądu. Szczegóły znajdziesz w [dokumentacji kanału Telegram](/pl/channels/telegram).

Zachowaj widoczność wierszy postępu, ale ukryj surowy tekst polecenia/wykonania:

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

Użyj tego samego kształtu pod kluczem innego kanału z kompaktowym postępem, na przykład `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` albo w podglądach szkiców Slack. W trybie szkicu postępu umieść tę samą politykę pod `streaming.progress`:

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

- [Refaktoryzacja cyklu życia wiadomości](/pl/concepts/message-lifecycle-refactor) - docelowy projekt współdzielonego podglądu, edycji, strumienia i finalizacji
- [Szkice postępu](/pl/concepts/progress-drafts) - widoczne wiadomości o pracy w toku, które aktualizują się podczas długich tur
- [Wiadomości](/pl/concepts/messages) - cykl życia i dostarczanie wiadomości
- [Ponawianie](/pl/concepts/retry) - zachowanie ponawiania po niepowodzeniu dostarczenia
- [Kanały](/pl/channels) - obsługa strumieniowania dla poszczególnych kanałów
