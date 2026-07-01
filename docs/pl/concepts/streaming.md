---
read_when:
    - Wyjaśnianie, jak działa strumieniowanie lub dzielenie na fragmenty w kanałach
    - Zmiana zachowania strumieniowania bloków lub dzielenia kanału na fragmenty
    - Debugowanie zduplikowanych/wczesnych odpowiedzi blokowych lub strumieniowania podglądu kanału
summary: Zachowanie streamingu i porcjowania (odpowiedzi blokowe, streaming podglądu kanału, mapowanie trybów)
title: Strumieniowanie i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-07-01T08:32:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2724c21414dd470780f0c7f634380bef3feeb54a08bd0da3e944173340df1c80
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ma dwie oddzielne warstwy strumieniowania:

- **Strumieniowanie bloków (kanały):** emituje ukończone **bloki** podczas pisania przez asystenta. Są to zwykłe wiadomości kanału (nie delty tokenów).
- **Strumieniowanie podglądu (Telegram/Discord/Slack):** aktualizuje tymczasową **wiadomość podglądu** podczas generowania.

Obecnie nie ma **prawdziwego strumieniowania delt tokenów** do wiadomości kanałów. Strumieniowanie podglądu jest oparte na wiadomościach (wysyłanie + edycje/dołączanie).

## Strumieniowanie bloków (wiadomości kanału)

Strumieniowanie bloków wysyła odpowiedź asystenta w większych fragmentach, gdy staje się dostępna.

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
- `chunker`: `EmbeddedBlockChunker` stosujący minimalne/maksymalne limity + preferencję przerwania.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Elementy sterujące:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie wyłączone).
- Nadpisania kanałów: `*.blockStreaming` (oraz warianty dla kont), aby wymusić `"on"`/`"off"` dla kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` albo `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scala strumieniowane bloki przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb dzielenia kanału: `*.chunkMode` (domyślnie `length`, `newline` dzieli po pustych wierszach (granicach akapitów) przed dzieleniem według długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć przycinania w UI.

**Semantyka granic:**

- `text_end`: strumieniuj bloki, gdy tylko chunker je wyemituje; opróżniaj przy każdym `text_end`.
- `message_end`: poczekaj, aż wiadomość asystenta się zakończy, a następnie opróżnij zbuforowaną odpowiedź.

`message_end` nadal używa chunkera, jeśli zbuforowany tekst przekracza `maxChars`, więc na końcu może wyemitować wiele fragmentów.

### Dostarczanie multimediów ze strumieniowaniem bloków

Strumieniowane multimedia muszą używać pól ustrukturyzowanego ładunku, takich jak `mediaUrl` lub
`mediaUrls`; strumieniowany tekst nie jest analizowany jako polecenie załącznika. Gdy strumieniowanie
bloków wysyła multimedia wcześnie, OpenClaw zapamiętuje to dostarczenie dla danej tury. Jeśli
końcowy ładunek asystenta powtarza ten sam URL multimediów, końcowe dostarczenie
usuwa zduplikowane multimedia zamiast ponownie wysyłać załącznik.

Dokładnie zduplikowane końcowe ładunki są pomijane. Jeśli końcowy ładunek dodaje
odrębny tekst wokół multimediów, które zostały już przesłane strumieniowo, OpenClaw nadal wysyła
nowy tekst, utrzymując jednorazowe dostarczenie multimediów. Zapobiega to duplikowaniu notatek głosowych
lub plików w kanałach takich jak Telegram.

## Algorytm dzielenia na fragmenty (dolne/górne limity)

Dzielenie bloków na fragmenty jest zaimplementowane przez `EmbeddedBlockChunker`:

- **Dolny limit:** nie emituj, dopóki bufor >= `minChars` (chyba że wymuszone).
- **Górny limit:** preferuj podziały przed `maxChars`; jeśli wymuszone, podziel przy `maxChars`.
- **Preferencja przerwania:** `paragraph` → `newline` → `sentence` → `whitespace` → twarde przerwanie.
- **Bloki kodu:** nigdy nie dziel wewnątrz bloków; przy wymuszeniu na `maxChars` zamknij + ponownie otwórz blok, aby zachować poprawność Markdown.

`maxChars` jest ograniczane do kanałowego `textChunkLimit`, więc nie można przekroczyć limitów poszczególnych kanałów.

## Scalanie (łączenie strumieniowanych bloków)

Gdy strumieniowanie bloków jest włączone, OpenClaw może **łączyć kolejne fragmenty bloków**
przed ich wysłaniem. Ogranicza to „spam pojedynczymi wierszami”, jednocześnie nadal zapewniając
progresywną odpowiedź.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczone przez `maxChars` i zostaną opróżnione, jeśli go przekroczą.
- `minChars` zapobiega wysyłaniu drobnych fragmentów, dopóki nie zbierze się wystarczająco dużo tekstu
  (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Łącznik jest wyprowadzany z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanałów są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje dla kont).
- Domyślne `minChars` scalania jest podnoszone do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Ludzkie tempo między blokami

Gdy strumieniowanie bloków jest włączone, można dodać **losową pauzę** między
odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi składające się z wielu dymków wydają się
bardziej naturalne.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie dla agenta przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślny), `natural` (800-2500 ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, nie odpowiedzi końcowych ani podsumowań narzędzi.

## „Strumieniuj fragmenty albo wszystko”

Odwzorowanie:

- **Strumieniuj fragmenty:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram wymagają także `*.blockStreaming: true`.
- **Strumieniuj wszystko na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, możliwie w wielu fragmentach, jeśli bardzo długie).
- **Bez strumieniowania bloków:** `blockStreamingDefault: "off"` (tylko odpowiedź końcowa).

**Uwaga dotycząca kanału:** strumieniowanie bloków jest **wyłączone, chyba że**
`*.blockStreaming` jest jawnie ustawione na `true`. Kanały mogą strumieniować podgląd na żywo
(`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie lokalizacji konfiguracji: wartości domyślne `blockStreaming*` znajdują się w
`agents.defaults`, a nie w konfiguracji głównej.

## Tryby strumieniowania podglądu

Klucz kanoniczny: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącz strumieniowanie podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: podgląd aktualizowany krokami fragmentowanymi/dołączanymi.
- `progress`: podgląd postępu/statusu podczas generowania, końcowa odpowiedź po ukończeniu.

`streaming.mode: "block"` to tryb strumieniowania podglądu dla kanałów obsługujących edycję,
takich jak Discord i Telegram. Nie włącza tam dostarczania bloków kanału.
Użyj `streaming.block.enabled` albo starszego klucza kanału `blockStreaming`, gdy
chcesz zwykłych odpowiedzi blokowych. Microsoft Teams jest wyjątkiem: nie ma
transportu bloków podglądu roboczego, więc `streaming.mode: "block"` mapuje się na dostarczanie bloków Teams
zamiast natywnego strumieniowania częściowego/postępu.

### Mapowanie kanałów

| Kanał      | `off` | `partial` | `block` | `progress`                 |
| ---------- | ----- | --------- | ------- | -------------------------- |
| Telegram   | ✅    | ✅        | ✅      | edytowalny szkic postępu   |
| Discord    | ✅    | ✅        | ✅      | edytowalny szkic postępu   |
| Slack      | ✅    | ✅        | ✅      | ✅                         |
| Mattermost | ✅    | ✅        | ✅      | ✅                         |
| MS Teams   | ✅    | ✅        | ✅      | natywny strumień postępu   |

Tylko Slack:

- `channels.slack.streaming.nativeTransport` przełącza natywne wywołania API strumieniowania Slack, gdy `channels.slack.streaming.mode="partial"` (domyślnie: `true`).
- Natywne strumieniowanie Slack i status wątku asystenta Slack wymagają docelowego wątku odpowiedzi. DM-y najwyższego poziomu nie pokazują tego podglądu w stylu wątku, ale nadal mogą używać roboczych postów podglądu Slack i edycji.

Migracja starszych kluczy:

- Telegram: starsze wartości `streamMode` oraz skalarne/logiczne wartości `streaming` są wykrywane i migrowane przez ścieżki zgodności doctor/konfiguracji do `streaming.mode`.
- Discord: `streamMode` + logiczne `streaming` pozostają aliasami runtime dla wyliczenia `streaming`; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- Slack: `streamMode` pozostaje aliasem runtime dla `streaming.mode`; logiczne `streaming` pozostaje aliasem runtime dla `streaming.mode` oraz `streaming.nativeTransport`; starsze `nativeStreaming` pozostaje aliasem runtime dla `streaming.nativeTransport`. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.

### Zachowanie runtime

Telegram:

- Używa aktualizacji podglądu `sendMessage` + `editMessageText` w DM-ach oraz grupach/tematach.
- Krótkie początkowe podglądy nadal są opóźniane dla lepszego UX powiadomień push, ale Telegram teraz materializuje je po ograniczonym opóźnieniu, aby aktywne uruchomienia nie pozostawały wizualnie ciche.
- Końcowy tekst edytuje aktywny podgląd w miejscu; długie odpowiedzi końcowe ponownie używają tej wiadomości dla pierwszego fragmentu i wysyłają tylko pozostałe fragmenty.
- Tryb `block` obraca podgląd do nowej wiadomości przy `streaming.preview.chunk.maxChars` (domyślnie 800, ograniczone limitem edycji Telegram wynoszącym 4096); inne tryby powiększają jeden podgląd do 4096 znaków.
- Tryb `progress` utrzymuje postęp narzędzi w edytowalnym szkicu statusu, materializuje etykietę statusu, gdy strumieniowanie odpowiedzi jest aktywne, ale nie ma jeszcze dostępnej linii narzędzia, czyści ten szkic po ukończeniu i wysyła końcową odpowiedź przez zwykłe dostarczanie.
- Jeśli końcowa edycja nie powiedzie się przed potwierdzeniem ukończonego tekstu, OpenClaw używa zwykłego końcowego dostarczania i czyści nieaktualny podgląd.
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Telegram jest jawnie włączone (aby uniknąć podwójnego strumieniowania).
- `/reasoning stream` może zapisywać rozumowanie do przejściowego podglądu, który jest usuwany po końcowym dostarczeniu.

Discord:

- Używa wysyłania + edycji wiadomości podglądu.
- Tryb `block` używa dzielenia szkicu (`draftChunk`).
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Discord jest jawnie włączone.
- Końcowe ładunki multimediów, błędów i jawnych odpowiedzi anulują oczekujące podglądy bez opróżniania nowego szkicu, a następnie używają zwykłego dostarczania.

Slack:

- `partial` może używać natywnego strumieniowania Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępne.
- `block` używa roboczych podglądów w stylu dołączania.
- `progress` używa tekstu podglądu statusu, a następnie odpowiedzi końcowej.
- DM-y najwyższego poziomu bez wątku odpowiedzi używają roboczych postów podglądu i edycji zamiast natywnego strumieniowania Slack.
- Natywne i robocze strumieniowanie podglądu tłumi odpowiedzi blokowe dla tej tury, więc odpowiedź Slack jest strumieniowana tylko jedną ścieżką dostarczania.
- Końcowe ładunki multimediów/błędów oraz końcowe postępy nie tworzą jednorazowych wiadomości roboczych; tylko końcowe teksty/bloki, które mogą edytować podgląd, opróżniają oczekujący tekst szkicu.

Mattermost:

- Strumieniuje myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do jednego roboczego posta podglądu, który finalizuje się w miejscu, gdy końcową odpowiedź można bezpiecznie wysłać.
- Wraca do wysłania świeżego końcowego posta, jeśli post podglądu został usunięty lub jest inaczej niedostępny w czasie finalizacji.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed zwykłym dostarczaniem zamiast opróżniać tymczasowy post podglądu.

Matrix:

- Robocze podglądy finalizują się w miejscu, gdy końcowy tekst może ponownie użyć zdarzenia podglądu.
- Odpowiedzi końcowe zawierające tylko multimedia, błędy i niedopasowanie celu odpowiedzi anulują oczekujące aktualizacje podglądu przed zwykłym dostarczaniem; już widoczny nieaktualny podgląd jest redagowany.

### Aktualizacje podglądu postępu narzędzi

Strumieniowanie podglądu może także obejmować aktualizacje **postępu narzędzi** - krótkie linie statusu, takie jak „wyszukiwanie w sieci”, „odczytywanie pliku” albo „wywoływanie narzędzia” - które pojawiają się w tej samej wiadomości podglądu podczas działania narzędzi, przed odpowiedzią końcową. W trybie serwera aplikacji Codex komunikaty preambuły/komentarza Codex używają tej samej ścieżki podglądu, więc krótkie notatki postępu „Sprawdzam...” mogą strumieniować do edytowalnego szkicu bez stawania się częścią końcowej odpowiedzi. Dzięki temu wieloetapowe tury z narzędziami pozostają wizualnie aktywne zamiast ciche między pierwszym podglądem myślenia a końcową odpowiedzią.

Długotrwałe narzędzia mogą emitować typowany postęp przed zwróceniem wyniku. Na przykład
`web_fetch` uzbraja pięciosekundowy timer przy starcie: jeśli pobieranie nadal
trwa, podgląd może pokazać `Fetching page content...`; jeśli pobieranie zakończy się
lub zostanie wcześniej anulowane, linia postępu nie jest emitowana. Późniejszy końcowy wynik
narzędzia nadal jest normalnie dostarczany do modelu.

Obsługiwane powierzchnie:

- **Discord**, **Slack**, **Telegram** i **Matrix** domyślnie strumieniują postęp narzędzi oraz aktualizacje preambuły Codex do edytowanego podglądu na żywo, gdy strumieniowanie podglądu jest aktywne. Microsoft Teams używa natywnego strumienia postępu w czatach osobistych.
- Telegram ma włączone aktualizacje podglądu postępu narzędzi od `v2026.4.22`; pozostawienie ich włączonych zachowuje to wydane zachowanie.
- **Mattermost** już składa aktywność narzędzi w pojedynczym poście podglądu szkicu (patrz wyżej).
- Edycje postępu narzędzi podążają za aktywnym trybem strumieniowania podglądu; są pomijane, gdy strumieniowanie podglądu jest `off` albo gdy strumieniowanie blokowe przejęło wiadomość. W Telegram `streaming.mode: "off"` oznacza tylko wynik końcowy: ogólne komunikaty o postępie są również wyciszane zamiast dostarczania ich jako samodzielnych wiadomości statusowych, natomiast monity zatwierdzeń, ładunki multimedialne i błędy nadal są kierowane normalnie.
- Aby zachować strumieniowanie podglądu, ale ukryć wiersze postępu narzędzi, ustaw `streaming.preview.toolProgress` na `false` dla tego kanału. Aby pozostawić widoczne wiersze postępu narzędzi, a ukryć tekst poleceń/wykonania, ustaw `streaming.preview.commandText` na `"status"` albo `streaming.progress.commandText` na `"status"`; wartość domyślna to `"raw"`, aby zachować wydane zachowanie. Ta polityka jest współdzielona przez kanały szkicu/postępu, które używają kompaktowego renderera postępu OpenClaw, w tym Discord, Matrix, Microsoft Teams, Mattermost, podglądy szkiców Slack i Telegram. Aby całkowicie wyłączyć edycje podglądu, ustaw `streaming.mode` na `off`.
- Odpowiedzi Telegram z wybranym cytatem są wyjątkiem: gdy `replyToMode` nie jest `"off"` i obecny jest tekst wybranego cytatu, OpenClaw pomija strumień podglądu odpowiedzi dla tej tury, więc wiersze podglądu postępu narzędzi nie mogą się renderować. Odpowiedzi na bieżącą wiadomość bez tekstu wybranego cytatu nadal zachowują strumieniowanie podglądu. Szczegóły znajdziesz w [dokumentacji kanału Telegram](/pl/channels/telegram).

### Tor postępu komentarzy

Poza postępem narzędzi kompaktowy renderer postępu może pokazać w szkicu jeszcze jeden tor:

- **`streaming.progress.commentary`** — renderuj przednarzędziowy **komentarz** modelu (💬) — krótką narrację „Sprawdzę… potem…” — przeplataną z wierszami narzędzi w szkicu postępu.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Pozostaw widoczne wiersze postępu, ale ukryj surowy tekst poleceń/wykonania:

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

Użyj tego samego kształtu pod innym kluczem kompaktowego kanału postępu, na przykład `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` albo podglądami szkiców Slack. W trybie szkicu postępu umieść tę samą politykę pod `streaming.progress`:

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

- [Refaktoryzacja cyklu życia wiadomości](/pl/concepts/message-lifecycle-refactor) - docelowy współdzielony projekt podglądu, edycji, strumieniowania i finalizacji
- [Szkice postępu](/pl/concepts/progress-drafts) - widoczne wiadomości o pracy w toku, które aktualizują się podczas długich tur
- [Wiadomości](/pl/concepts/messages) - cykl życia i dostarczanie wiadomości
- [Ponawianie](/pl/concepts/retry) - zachowanie ponawiania po niepowodzeniu dostarczenia
- [Kanały](/pl/channels) - obsługa strumieniowania dla poszczególnych kanałów
