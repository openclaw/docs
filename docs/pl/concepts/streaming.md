---
read_when:
    - Wyjaśnianie, jak działa przesyłanie strumieniowe lub dzielenie na fragmenty w kanałach
    - Zmiana zachowania strumieniowania bloków lub dzielenia kanału na fragmenty
    - Debugowanie zduplikowanych/zbyt wczesnych odpowiedzi blokowych lub strumieniowania podglądu kanału
summary: Zachowanie strumieniowania + dzielenia na fragmenty (odpowiedzi blokowe, strumieniowanie podglądu kanału, mapowanie trybu)
title: Strumieniowanie i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-05-04T07:04:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ma dwie oddzielne warstwy strumieniowania:

- **Strumieniowanie blokowe (kanały):** emituje ukończone **bloki** podczas pisania przez asystenta. Są to zwykłe wiadomości kanału (nie delty tokenów).
- **Strumieniowanie podglądu (Telegram/Discord/Slack):** aktualizuje tymczasową **wiadomość podglądu** podczas generowania.

Obecnie **nie ma prawdziwego strumieniowania delt tokenów** do wiadomości kanału. Strumieniowanie podglądu działa na poziomie wiadomości (wysyłanie + edycje/dołączanie).

## Strumieniowanie blokowe (wiadomości kanału)

Strumieniowanie blokowe wysyła wynik asystenta w większych fragmentach, gdy tylko stają się dostępne.

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
- `channel send`: faktyczne wiadomości wychodzące (odpowiedzi blokowe).

**Kontrolki:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (domyślnie wyłączone).
- Nadpisania kanałów: `*.blockStreaming` (oraz warianty per konto), aby wymusić `"on"`/`"off"` dla kanału.
- `agents.defaults.blockStreamingBreak`: `"text_end"` albo `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (scala strumieniowane bloki przed wysłaniem).
- Twardy limit kanału: `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`).
- Tryb dzielenia kanału: `*.chunkMode` (`length` domyślnie, `newline` dzieli po pustych wierszach (granicach akapitów) przed dzieleniem według długości).
- Miękki limit Discord: `channels.discord.maxLinesPerMessage` (domyślnie 17) dzieli wysokie odpowiedzi, aby uniknąć przycinania w UI.

**Semantyka granic:**

- `text_end`: strumieniuje bloki, gdy tylko emituje je dzielnik; opróżnia przy każdym `text_end`.
- `message_end`: czeka do zakończenia wiadomości asystenta, a następnie opróżnia buforowany wynik.

`message_end` nadal używa dzielnika, jeśli buforowany tekst przekracza `maxChars`, więc może wyemitować kilka fragmentów na końcu.

### Dostarczanie multimediów ze strumieniowaniem blokowym

Dyrektywy `MEDIA:` są zwykłymi metadanymi dostarczania. Gdy strumieniowanie blokowe wcześnie wyśle blok multimediów, OpenClaw zapamiętuje to dostarczenie dla danej tury. Jeśli końcowy ładunek asystenta powtarza ten sam URL multimediów, końcowe dostarczenie usuwa zduplikowane multimedia zamiast ponownie wysyłać załącznik.

Dokładne duplikaty końcowych ładunków są pomijane. Jeśli końcowy ładunek dodaje odrębny tekst wokół multimediów, które zostały już przesłane strumieniowo, OpenClaw nadal wysyła nowy tekst, zachowując jednokrotne dostarczenie multimediów. Zapobiega to duplikowaniu wiadomości głosowych lub plików w kanałach takich jak Telegram, gdy agent emituje `MEDIA:` podczas strumieniowania, a dostawca uwzględnia je także w ukończonej odpowiedzi.

## Algorytm dzielenia (dolne/górne granice)

Dzielenie bloków jest implementowane przez `EmbeddedBlockChunker`:

- **Dolna granica:** nie emituj, dopóki bufor >= `minChars` (chyba że wymuszone).
- **Górna granica:** preferuj podziały przed `maxChars`; jeśli wymuszone, podziel przy `maxChars`.
- **Preferencja podziału:** `paragraph` → `newline` → `sentence` → `whitespace` → twardy podział.
- **Bloki kodu:** nigdy nie dziel wewnątrz bloków; po wymuszeniu przy `maxChars` zamknij + ponownie otwórz blok, aby Markdown pozostał poprawny.

`maxChars` jest ograniczane do kanałowego `textChunkLimit`, więc nie można przekroczyć limitów per kanał.

## Scalanie (łączenie strumieniowanych bloków)

Gdy strumieniowanie blokowe jest włączone, OpenClaw może **scalać kolejne fragmenty bloków** przed ich wysłaniem. Ogranicza to „spam pojedynczymi wierszami”, nadal zapewniając progresywny wynik.

- Scalanie czeka na **przerwy bezczynności** (`idleMs`) przed opróżnieniem.
- Bufory są ograniczane przez `maxChars` i zostaną opróżnione po jego przekroczeniu.
- `minChars` zapobiega wysyłaniu drobnych fragmentów, dopóki nie nagromadzi się wystarczająco dużo tekstu (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Łącznik pochodzi z `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spacja).
- Nadpisania kanałów są dostępne przez `*.blockStreamingCoalesce` (w tym konfiguracje per konto).
- Domyślne `minChars` scalania jest podnoszone do 1500 dla Signal/Slack/Discord, chyba że zostanie nadpisane.

## Ludzkie tempo między blokami

Gdy strumieniowanie blokowe jest włączone, można dodać **losową pauzę** między odpowiedziami blokowymi (po pierwszym bloku). Dzięki temu odpowiedzi w wielu dymkach sprawiają bardziej naturalne wrażenie.

- Konfiguracja: `agents.defaults.humanDelay` (nadpisanie per agent przez `agents.list[].humanDelay`).
- Tryby: `off` (domyślny), `natural` (800–2500 ms), `custom` (`minMs`/`maxMs`).
- Dotyczy tylko **odpowiedzi blokowych**, nie odpowiedzi końcowych ani podsumowań narzędzi.

## „Strumieniuj fragmenty albo wszystko”

Odpowiada to następującym ustawieniom:

- **Strumieniuj fragmenty:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emituj na bieżąco). Kanały inne niż Telegram również wymagają `*.blockStreaming: true`.
- **Strumieniuj wszystko na końcu:** `blockStreamingBreak: "message_end"` (opróżnij raz, potencjalnie w wielu fragmentach, jeśli bardzo długie).
- **Bez strumieniowania blokowego:** `blockStreamingDefault: "off"` (tylko odpowiedź końcowa).

**Uwaga o kanałach:** Strumieniowanie blokowe jest **wyłączone, chyba że** `*.blockStreaming` jest jawnie ustawione na `true`. Kanały mogą strumieniować podgląd na żywo (`channels.<channel>.streaming`) bez odpowiedzi blokowych.

Przypomnienie o lokalizacji konfiguracji: ustawienia domyślne `blockStreaming*` znajdują się w `agents.defaults`, a nie w konfiguracji głównej.

## Tryby strumieniowania podglądu

Klucz kanoniczny: `channels.<channel>.streaming`

Tryby:

- `off`: wyłącza strumieniowanie podglądu.
- `partial`: pojedynczy podgląd zastępowany najnowszym tekstem.
- `block`: podgląd aktualizowany w krokach dzielonych/dołączanych.
- `progress`: podgląd postępu/statusu podczas generowania, końcowa odpowiedź po ukończeniu.

`streaming.mode: "block"` jest trybem strumieniowania podglądu dla kanałów obsługujących edycję, takich jak Discord i Telegram. Nie włącza tam blokowego dostarczania w kanale. Użyj `streaming.block.enabled` albo starszego klucza kanału `blockStreaming`, gdy chcesz zwykłych odpowiedzi blokowych. Microsoft Teams jest wyjątkiem: nie ma transportu bloków podglądu roboczego, więc `streaming.mode: "block"` mapuje się na dostarczanie blokowe Teams zamiast natywnego strumieniowania częściowego/postępu.

### Mapowanie kanałów

| Kanał      | `off` | `partial` | `block` | `progress`                 |
| ---------- | ----- | --------- | ------- | -------------------------- |
| Telegram   | ✅    | ✅        | ✅      | edytowalna wersja robocza postępu |
| Discord    | ✅    | ✅        | ✅      | edytowalna wersja robocza postępu |
| Slack      | ✅    | ✅        | ✅      | ✅                         |
| Mattermost | ✅    | ✅        | ✅      | ✅                         |
| MS Teams   | ✅    | ✅        | ✅      | natywny strumień postępu   |

Tylko Slack:

- `channels.slack.streaming.nativeTransport` przełącza natywne wywołania API strumieniowania Slack, gdy `channels.slack.streaming.mode="partial"` (domyślnie: `true`).
- Natywne strumieniowanie Slack i status wątku asystenta Slack wymagają docelowego wątku odpowiedzi. DM najwyższego poziomu nie pokazują tego podglądu w stylu wątku, ale nadal mogą używać roboczych postów podglądu Slack i edycji.

Migracja starszych kluczy:

- Telegram: starsze wartości `streamMode` oraz skalarne/logiczne wartości `streaming` są wykrywane i migrowane przez ścieżki zgodności doctor/konfiguracji do `streaming.mode`.
- Discord: `streamMode` + logiczne `streaming` automatycznie migrują do wyliczenia `streaming`.
- Slack: `streamMode` automatycznie migruje do `streaming.mode`; logiczne `streaming` automatycznie migruje do `streaming.mode` plus `streaming.nativeTransport`; starsze `nativeStreaming` automatycznie migruje do `streaming.nativeTransport`.

### Zachowanie w czasie wykonywania

Telegram:

- Używa `sendMessage` + `editMessageText` do aktualizacji podglądu w DM i grupach/tematach.
- Wysyła świeżą wiadomość końcową zamiast edytować w miejscu, gdy podgląd był widoczny przez około minutę, a następnie czyści podgląd, aby znacznik czasu Telegram odzwierciedlał ukończenie odpowiedzi.
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie blokowe Telegram jest jawnie włączone (aby uniknąć podwójnego strumieniowania).
- `/reasoning stream` może zapisywać rozumowanie do przejściowego podglądu, który jest usuwany po końcowym dostarczeniu.

Discord:

- Używa wysyłania + edycji wiadomości podglądu.
- Tryb `block` używa dzielenia wersji roboczej (`draftChunk`).
- Strumieniowanie podglądu jest pomijane, gdy strumieniowanie blokowe Discord jest jawnie włączone.
- Końcowe multimedia, błędy i ładunki jawnej odpowiedzi anulują oczekujące podglądy bez opróżniania nowej wersji roboczej, a następnie używają zwykłego dostarczania.

Slack:

- `partial` może używać natywnego strumieniowania Slack (`chat.startStream`/`append`/`stop`), gdy jest dostępne.
- `block` używa podglądów wersji roboczych w stylu dołączania.
- `progress` używa tekstu podglądu statusu, a następnie końcowej odpowiedzi.
- DM najwyższego poziomu bez wątku odpowiedzi używają roboczych postów podglądu i edycji zamiast natywnego strumieniowania Slack.
- Natywne i robocze strumieniowanie podglądu tłumią odpowiedzi blokowe dla tej tury, więc odpowiedź Slack jest strumieniowana tylko jedną ścieżką dostarczania.
- Końcowe ładunki multimediów/błędów i końcowe wyniki postępu nie tworzą tymczasowych wiadomości roboczych; tylko końcowe teksty/bloki, które mogą edytować podgląd, opróżniają oczekujący tekst roboczy.

Mattermost:

- Strumieniuje myślenie, aktywność narzędzi i częściowy tekst odpowiedzi do pojedynczego roboczego posta podglądu, który finalizuje się w miejscu, gdy końcowa odpowiedź jest bezpieczna do wysłania.
- Przechodzi na wysłanie świeżego posta końcowego, jeśli post podglądu został usunięty lub z innego powodu jest niedostępny w czasie finalizacji.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed zwykłym dostarczeniem zamiast opróżniać tymczasowy post podglądu.

Matrix:

- Podglądy robocze finalizują się w miejscu, gdy tekst końcowy może ponownie użyć zdarzenia podglądu.
- Końcowe ładunki tylko z multimediami, błędy i odpowiedzi z niezgodnym celem odpowiedzi anulują oczekujące aktualizacje podglądu przed zwykłym dostarczeniem; już widoczny nieaktualny podgląd jest redagowany.

### Aktualizacje podglądu postępu narzędzi

Strumieniowanie podglądu może również obejmować aktualizacje **postępu narzędzi** — krótkie wiersze statusu, takie jak „przeszukiwanie sieci”, „odczytywanie pliku” albo „wywoływanie narzędzia” — które pojawiają się w tej samej wiadomości podglądu podczas działania narzędzi, przed końcową odpowiedzią. Dzięki temu wieloetapowe tury narzędzi pozostają wizualnie aktywne zamiast milczeć między pierwszym podglądem myślenia a końcową odpowiedzią.

Obsługiwane powierzchnie:

- **Discord**, **Slack**, **Telegram** i **Matrix** domyślnie strumieniują postęp narzędzi do edycji podglądu na żywo, gdy strumieniowanie podglądu jest aktywne. Microsoft Teams używa natywnego strumienia postępu w czatach osobistych.
- Telegram jest dostarczany z włączonymi aktualizacjami podglądu postępu narzędzi od `v2026.4.22`; pozostawienie ich włączonych zachowuje to wydane zachowanie.
- **Mattermost** już włącza aktywność narzędzi do swojego pojedynczego roboczego posta podglądu (zobacz wyżej).
- Edycje postępu narzędzi podążają za aktywnym trybem strumieniowania podglądu; są pomijane, gdy strumieniowanie podglądu jest `off` albo gdy strumieniowanie blokowe przejęło wiadomość. W Telegram `streaming.mode: "off"` oznacza tylko wynik końcowy: ogólne komunikaty postępu również są tłumione zamiast być dostarczane jako samodzielne wiadomości statusu, natomiast prośby o zatwierdzenie, ładunki multimediów i błędy nadal są kierowane normalnie.
- Aby zachować strumieniowanie podglądu, ale ukryć wiersze postępu narzędzi, ustaw `streaming.preview.toolProgress` na `false` dla tego kanału. Aby pozostawić widoczne wiersze postępu narzędzi, ukrywając tekst poleceń/wykonań, ustaw `streaming.preview.commandText` na `"status"` albo `streaming.progress.commandText` na `"status"`; domyślnie jest `"raw"`, aby zachować wydane zachowanie. Ta polityka jest współdzielona przez kanały robocze/postępu używające zwartego renderera postępu OpenClaw, w tym Discord, Matrix, Microsoft Teams, Mattermost, robocze podglądy Slack i Telegram. Aby całkowicie wyłączyć edycje podglądu, ustaw `streaming.mode` na `off`.
- Wybrane odpowiedzi cytatem w Telegram są wyjątkiem: gdy `replyToMode` nie jest `"off"` i obecny jest wybrany tekst cytatu, OpenClaw pomija strumień podglądu odpowiedzi dla tej tury, więc wiersze podglądu postępu narzędzi nie mogą się renderować. Odpowiedzi do bieżącej wiadomości bez wybranego tekstu cytatu nadal zachowują strumieniowanie podglądu. Szczegóły znajdziesz w [dokumentacji kanału Telegram](/pl/channels/telegram).

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

Użyj tej samej struktury pod innym kluczem kanału kompaktowego postępu, na przykład `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` albo podglądami szkiców Slack. W trybie szkicu postępu umieść tę samą zasadę pod `streaming.progress`:

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

- [Szkice postępu](/pl/concepts/progress-drafts) — widoczne komunikaty o pracy w toku, które aktualizują się podczas długich tur
- [Wiadomości](/pl/concepts/messages) — cykl życia i dostarczanie wiadomości
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania po niepowodzeniu dostarczenia
- [Kanały](/pl/channels) — obsługa strumieniowania dla poszczególnych kanałów
