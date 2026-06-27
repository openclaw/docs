---
read_when:
    - Wyjaśnianie, jak działa strumieniowanie lub dzielenie na fragmenty w kanałach
    - Zmiana zachowania strumieniowania bloków lub porcjowania kanału
    - Debugowanie zduplikowanych/wczesnych odpowiedzi blokowych lub strumieniowania podglądu kanału
summary: Zachowanie strumieniowania i dzielenia na fragmenty (odpowiedzi blokowe, strumieniowanie podglądu kanału, mapowanie trybów)
title: Przesyłanie strumieniowe i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-06-27T17:30:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ma dwie oddzielne warstwy strumieniowania:

- **Strumieniowanie bloków (kanały):** emituje ukończone **bloki** w trakcie pisania przez asystenta. Są to zwykłe wiadomości kanału (nie delty tokenów).
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

- `text_delta/events`: zdarzenia strumienia modelu (mogą być rzadkie dla modeli niestrumieniujących).
- `chunker`: `EmbeddedBlockChunker` stosujący dolne/górne limity + preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Elementy sterujące:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie wyłączone).
- Nadpisania kanałów: `*.blockStreaming` (oraz warianty dla kont), aby wymusić `"on"`/`"off"` dla kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` lub `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scala strumieniowane bloki przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb dzielenia kanału: `*.chunkMode` (`length` domyślnie, `newline` dzieli po pustych wierszach (granicach akapitów) przed dzieleniem według długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć przycinania w interfejsie.

**Semantyka granic:**

- `text_end`: strumieniuj bloki, gdy tylko chunker je emituje; opróżniaj przy każdym `text_end`.
- `message_end`: czekaj do zakończenia wiadomości asystenta, a następnie opróżnij buforowane dane wyjściowe.

`message_end` nadal używa chunkera, jeśli buforowany tekst przekracza `maxChars`, więc na końcu może wyemitować wiele fragmentów.

### Dostarczanie multimediów ze strumieniowaniem bloków

Strumieniowane multimedia muszą używać ustrukturyzowanych pól ładunku, takich jak `mediaUrl` lub
`mediaUrls`; strumieniowany tekst nie jest analizowany jako polecenie załącznika. Gdy strumieniowanie bloków
wysyła multimedia wcześnie, OpenClaw zapamiętuje tę dostawę dla danej tury. Jeśli
końcowy ładunek asystenta powtarza ten sam URL multimediów, końcowa dostawa
usuwa zduplikowane multimedia zamiast ponownie wysyłać załącznik.

Dokładnie zduplikowane końcowe ładunki są tłumione. Jeśli końcowy ładunek dodaje
odrębny tekst wokół multimediów, które zostały już przesłane strumieniowo, OpenClaw nadal wysyła
nowy tekst, zachowując pojedynczą dostawę multimediów. Zapobiega to duplikowaniu notatek głosowych
lub plików w kanałach takich jak Telegram.

## Algorytm dzielenia (dolne/górne limity)

Dzielenie bloków implementuje `EmbeddedBlockChunker`:

- **Dolny limit:** nie emituj, dopóki bufor >= `minChars` (chyba że wymuszone).
- **Górny limit:** preferuj podziały przed `maxChars`; jeśli wymuszone, podziel przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Bloki kodu:** nigdy nie dziel wewnątrz bloków; przy wymuszeniu na `maxChars` zamknij + ponownie otwórz blok, aby Markdown pozostał poprawny.

`maxChars` jest ograniczane do kanałowego `textChunkLimit`, więc nie można przekroczyć limitów poszczególnych kanałów.

## Scalanie (łączenie strumieniowanych bloków)

Gdy strumieniowanie bloków jest włączone, OpenClaw może **scalać kolejne fragmenty bloków**
przed ich wysłaniem. Ogranicza to „spam pojedynczymi wierszami”, jednocześnie nadal zapewniając
progresywne dane wyjściowe.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczone przez `maxChars` i zostaną opróżnione, jeśli go przekroczą.
- `minChars` zapobiega wysyłaniu drobnych fragmentów, dopóki nie zgromadzi się wystarczająco dużo tekstu
  (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Łącznik jest wyprowadzany z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanałów są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje dla kont).
- Domyślne scalanie `minChars` jest podnoszone do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Ludzkie tempo między blokami

Gdy strumieniowanie bloków jest włączone, można dodać **losową pauzę** między
odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi w wielu dymkach sprawiają
bardziej naturalne wrażenie.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisywanie dla agenta przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślnie), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, nie odpowiedzi końcowych ani podsumowań narzędzi.

## „Strumieniuj fragmenty albo wszystko”

Odwzorowanie:

- **Strumieniuj fragmenty:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram również wymagają `*.blockStreaming: true`.
- **Strumieniuj wszystko na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, potencjalnie jako wiele fragmentów, jeśli bardzo długie).
- **Bez strumieniowania bloków:** `blockStreamingDefault: "off"` (tylko odpowiedź końcowa).

**Uwaga dotycząca kanału:** Strumieniowanie bloków jest **wyłączone, chyba że**
`*.blockStreaming` zostanie jawnie ustawione na `true`. Kanały mogą strumieniować podgląd na żywo
(`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: wartości domyślne `blockStreaming*` znajdują się pod
`agents.defaults`, a nie w konfiguracji głównej.

## Tryby strumieniowania podglądu

Klucz kanoniczny: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącz strumieniowanie podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: podgląd aktualizowany w podzielonych/dopisywanych krokach.
- `progress`: podgląd postępu/statusu podczas generowania, odpowiedź końcowa po zakończeniu.

`streaming.mode: "block"` jest trybem strumieniowania podglądu dla kanałów obsługujących edycję,
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
- Natywne strumieniowanie Slack i status wątku asystenta Slack wymagają docelowego wątku odpowiedzi. DM-y najwyższego poziomu nie pokazują takiego podglądu w stylu wątku, ale nadal mogą używać postów podglądu roboczego Slack i edycji.

Migracja starszych kluczy:

- Telegram: starsze wartości `streamMode` oraz skalarne/logiczne wartości `streaming` są wykrywane i migrowane przez ścieżki doctor/zgodności konfiguracji do `streaming.mode`.
- Discord: `streamMode` + logiczne `streaming` pozostają aliasami runtime dla enumu `streaming`; uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.
- Slack: `streamMode` pozostaje aliasem runtime dla `streaming.mode`; logiczne `streaming` pozostaje aliasem runtime dla `streaming.mode` plus `streaming.nativeTransport`; starsze `nativeStreaming` pozostaje aliasem runtime dla `streaming.nativeTransport`. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację.

### Zachowanie runtime

Telegram:

- Używa aktualizacji podglądu `sendMessage` + `editMessageText` w DM-ach oraz grupach/tematach.
- Krótkie początkowe podglądy są nadal opóźniane dla lepszego UX powiadomień push, ale Telegram teraz materializuje je po ograniczonym opóźnieniu, aby aktywne uruchomienia nie pozostawały wizualnie ciche.
- Końcowy tekst edytuje aktywny podgląd w miejscu; długie odpowiedzi końcowe ponownie używają tej wiadomości dla pierwszego fragmentu i wysyłają tylko pozostałe fragmenty.
- Tryb `block` obraca podgląd do nowej wiadomości przy `streaming.preview.chunk.maxChars` (domyślnie 800, ograniczone limitem edycji Telegram wynoszącym 4096); inne tryby powiększają jeden podgląd do 4096 znaków.
- Tryb `progress` utrzymuje postęp narzędzia w edytowalnym szkicu statusu, materializuje etykietę statusu, gdy strumieniowanie odpowiedzi jest aktywne, ale nie ma jeszcze dostępnego wiersza narzędzia, czyści ten szkic po zakończeniu i wysyła odpowiedź końcową przez normalne dostarczanie.
- Jeśli końcowa edycja nie powiedzie się przed potwierdzeniem ukończonego tekstu, OpenClaw używa normalnego końcowego dostarczania i czyści nieaktualny podgląd.
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Telegram jest jawnie włączone (aby uniknąć podwójnego strumieniowania).
- `/reasoning stream` może zapisywać rozumowanie do przejściowego podglądu, który jest usuwany po końcowym dostarczeniu.

Discord:

- Używa wiadomości podglądu wysyłanych + edytowanych.
- Tryb `block` używa dzielenia szkicu (`draftChunk`).
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie bloków Discord jest jawnie włączone.
- Końcowe multimedia, błędy i ładunki jawnej odpowiedzi anulują oczekujące podglądy bez opróżniania nowego szkicu, a następnie używają normalnego dostarczania.

Slack:

- `partial` może używać natywnego strumieniowania Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępne.
- `block` używa podglądów roboczych w stylu dopisywania.
- `progress` używa tekstu podglądu statusu, a następnie odpowiedzi końcowej.
- DM-y najwyższego poziomu bez wątku odpowiedzi używają postów podglądu roboczego i edycji zamiast natywnego strumieniowania Slack.
- Natywne i robocze strumieniowanie podglądu tłumi odpowiedzi blokowe dla tej tury, więc odpowiedź Slack jest strumieniowana tylko jedną ścieżką dostarczania.
- Końcowe ładunki multimediów/błędów i końcowe postępy nie tworzą jednorazowych wiadomości roboczych; tylko tekstowe/blokowe odpowiedzi końcowe, które mogą edytować podgląd, opróżniają oczekujący tekst roboczy.

Mattermost:

- Strumieniuje rozumowanie, aktywność narzędzi i częściowy tekst odpowiedzi do pojedynczego posta podglądu roboczego, który jest finalizowany w miejscu, gdy odpowiedź końcowa jest bezpieczna do wysłania.
- Awaryjnie wysyła świeży post końcowy, jeśli post podglądu został usunięty lub jest inaczej niedostępny w czasie finalizacji.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed normalnym dostarczaniem zamiast opróżniać tymczasowy post podglądu.

Matrix:

- Podglądy robocze finalizują się w miejscu, gdy tekst końcowy może ponownie użyć zdarzenia podglądu.
- Odpowiedzi końcowe tylko z multimediami, błędem oraz z niezgodnością celu odpowiedzi anulują oczekujące aktualizacje podglądu przed normalnym dostarczaniem; już widoczny nieaktualny podgląd jest redagowany.

### Aktualizacje podglądu postępu narzędzi

Strumieniowanie podglądu może też zawierać aktualizacje **postępu narzędzi** - krótkie wiersze statusu, takie jak „wyszukiwanie w sieci”, „odczytywanie pliku” lub „wywoływanie narzędzia” - które pojawiają się w tej samej wiadomości podglądu podczas działania narzędzi, przed odpowiedzią końcową. W trybie app-server Codex wiadomości preambuły/komentarza Codex używają tej samej ścieżki podglądu, więc krótkie notatki postępu typu „Sprawdzam...” mogą strumieniować do edytowalnego szkicu, nie stając się częścią odpowiedzi końcowej. Dzięki temu wieloetapowe tury z narzędziami pozostają wizualnie aktywne zamiast milczeć między pierwszym podglądem rozumowania a odpowiedzią końcową.

Długo działające narzędzia mogą emitować typowany postęp przed zwróceniem wyniku. Na przykład
`web_fetch` uzbraja pięciosekundowy timer przy starcie: jeśli pobieranie nadal
oczekuje, podgląd może pokazać `Fetching page content...`; jeśli pobieranie zakończy się
lub zostanie anulowane wcześniej, żaden wiersz postępu nie zostanie wyemitowany. Późniejszy końcowy wynik narzędzia
nadal jest normalnie dostarczany do modelu.

Obsługiwane obszary:

- **Discord**, **Slack**, **Telegram** i **Matrix** domyślnie strumieniują aktualizacje postępu narzędzi i preambuły Codex do edycji podglądu na żywo, gdy strumieniowanie podglądu jest aktywne. Microsoft Teams używa swojego natywnego strumienia postępu w czatach osobistych.
- Telegram jest dostarczany z włączonymi aktualizacjami podglądu postępu narzędzi od wersji `v2026.4.22`; pozostawienie ich włączonych zachowuje to wydane zachowanie.
- **Mattermost** już składa aktywność narzędzi w swoim pojedynczym poście podglądu szkicu (patrz wyżej).
- Edycje postępu narzędzi podążają za aktywnym trybem strumieniowania podglądu; są pomijane, gdy strumieniowanie podglądu ma wartość `off` albo gdy strumieniowanie blokowe przejęło wiadomość. W Telegram, `streaming.mode: "off"` oznacza tylko wynik końcowy: ogólny szum postępu jest również wyciszany, zamiast być dostarczany jako samodzielne komunikaty statusu, natomiast monity zatwierdzania, ładunki multimedialne i błędy nadal są kierowane normalnie.
- Aby zachować strumieniowanie podglądu, ale ukryć wiersze postępu narzędzi, ustaw `streaming.preview.toolProgress` na `false` dla tego kanału. Aby pozostawić widoczne wiersze postępu narzędzi, a ukryć tekst poleceń/wykonań, ustaw `streaming.preview.commandText` na `"status"` albo `streaming.progress.commandText` na `"status"`; domyślna wartość to `"raw"`, aby zachować wydane zachowanie. Ta polityka jest współdzielona przez kanały szkicu/postępu, które używają kompaktowego renderera postępu OpenClaw, w tym Discord, Matrix, Microsoft Teams, Mattermost, podglądy szkiców Slack i Telegram. Aby całkowicie wyłączyć edycje podglądu, ustaw `streaming.mode` na `off`.
- Wybrane odpowiedzi z cytatem w Telegram są wyjątkiem: gdy `replyToMode` nie ma wartości `"off"` i obecny jest tekst wybranego cytatu, OpenClaw pomija strumień podglądu odpowiedzi dla tej tury, więc wiersze podglądu postępu narzędzi nie mogą się renderować. Odpowiedzi na bieżącą wiadomość bez tekstu wybranego cytatu nadal zachowują strumieniowanie podglądu. Szczegóły znajdziesz w [dokumentacji kanału Telegram](/pl/channels/telegram).

Pozostaw widoczne wiersze postępu, ale ukryj surowy tekst poleceń/wykonań:

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

Użyj tego samego kształtu pod kluczem innego kanału kompaktowego postępu, na przykład `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` albo podglądów szkiców Slack. W trybie szkicu postępu umieść tę samą politykę pod `streaming.progress`:

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
- [Szkice postępu](/pl/concepts/progress-drafts) - widoczne wiadomości pracy w toku, które aktualizują się podczas długich tur
- [Wiadomości](/pl/concepts/messages) - cykl życia i dostarczanie wiadomości
- [Ponawianie](/pl/concepts/retry) - zachowanie ponawiania po niepowodzeniu dostarczenia
- [Kanały](/pl/channels) - obsługa strumieniowania dla poszczególnych kanałów
