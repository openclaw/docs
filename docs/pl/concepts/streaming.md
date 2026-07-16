---
read_when:
    - Wyjaśnienie działania strumieniowania lub dzielenia na fragmenty w kanałach
    - Zmiana działania strumieniowania bloków lub dzielenia na fragmenty w kanale
    - Debugowanie zduplikowanych/przedwczesnych odpowiedzi blokowych lub strumieniowego przesyłania podglądu kanału
summary: Zachowanie przesyłania strumieniowego i dzielenia na fragmenty (odpowiedzi blokowe, strumieniowe podglądy w kanałach, mapowanie trybów)
title: Strumieniowanie i dzielenie na fragmenty
x-i18n:
    generated_at: "2026-07-16T18:22:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b91d2143e59d9eb0271732adf8bc87482ef0d18fe664bfa46ed375c20fdc3d93
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw ma dwie niezależne warstwy strumieniowania i obecnie **nie ma
rzeczywistego strumieniowania różnic tokenów** do wiadomości kanału:

- **Strumieniowanie bloków (kanały):** emituje ukończone **bloki** w miarę
  generowania treści przez asystenta. Są to zwykłe wiadomości kanału, a nie różnice tokenów.
- **Strumieniowanie podglądu (Telegram/Discord/Slack/Matrix/Mattermost/MS Teams):**
  aktualizuje tymczasową **wiadomość podglądu** podczas generowania (wysyłanie + edycje/dołączanie).

## Strumieniowanie bloków (wiadomości kanału)

Strumieniowanie bloków wysyła dane wyjściowe asystenta w większych fragmentach, gdy tylko stają się dostępne.

```text
Dane wyjściowe modelu
  └─ text_delta/zdarzenia
       ├─ (blockStreamingBreak=text_end)
       │    └─ mechanizm dzielenia emituje bloki w miarę wzrostu bufora
       └─ (blockStreamingBreak=message_end)
            └─ mechanizm dzielenia opróżnia bufor przy message_end
                   └─ wysłanie do kanału (odpowiedzi blokowe)
```

- `text_delta/events`: zdarzenia strumienia modelu (mogą być sporadyczne w przypadku modeli niestrumieniowych).
- `chunker`: `EmbeddedBlockChunker` stosujący granice min./maks. oraz preferencję podziału.
- `channel send`: rzeczywiste wiadomości wychodzące (odpowiedzi blokowe).

**Ustawienia** (wszystkie w `agents.defaults`, o ile nie zaznaczono inaczej):

| Klucz                                                        | Wartości / struktura                                                     | Domyślnie  |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------- |
| `blockStreamingDefault`                                      | `"on"` / `"off"`                                                        | `"off"`    |
| `blockStreamingBreak`                                        | `"text_end"` / `"message_end"`                                          | -          |
| `blockStreamingChunk`                                        | `{ minChars, maxChars, breakPreference? }`                              | -          |
| `blockStreamingCoalesce`                                     | `{ minChars?, maxChars?, idleMs? }` (scalanie strumieniowanych bloków przed wysłaniem) | -          |
| `*.streaming.block.enabled` (nadpisanie dla kanału)               | `true` / `false`, wymusza strumieniowanie bloków dla kanału (oraz konta)  | -          |
| `*.textChunkLimit` (np. `channels.whatsapp.textChunkLimit`) | liczba, limit bezwzględny                                               | 4000       |
| `*.streaming.chunkMode`                                      | `"length"` / `"newline"`                                                | `"length"` |
| `channels.discord.maxLinesPerMessage`                        | liczba, miękki limit wierszy dzielący wysokie odpowiedzi, aby uniknąć przycięcia w interfejsie | 17         |

`streaming.chunkMode: "newline"` dzieli tekst przy pustych wierszach (granicach akapitów),
a nie przy każdym znaku nowego wiersza, po czym, gdy tekst przekroczy limit,
korzysta z dzielenia według długości.

Kanały wbudowane zapisują te nadpisania jako
`channels.<id>.streaming.{chunkMode,block.enabled,block.coalesce}`. Płaskie
zapisy `*.chunkMode` / `*.blockStreaming` / `*.blockStreamingCoalesce` są
przestarzałe we wszystkich kanałach wbudowanych: `openclaw doctor --fix` migruje je
do struktury zagnieżdżonej, a schematy kanałów je odrzucają. Konfiguracje
zewnętrznych pluginów SDK, które nadal używają płaskich zapisów, działają dzięki
przestarzałemu mechanizmowi awaryjnemu (z ostrzeżeniem w czasie działania) do
następnego cyklu wydawniczego.

**Semantyka granic** dla `blockStreamingBreak`:

- `text_end`: strumieniuje bloki natychmiast po ich wyemitowaniu przez mechanizm dzielenia; opróżnia bufor przy każdym `text_end`.
- `message_end`: czeka na zakończenie wiadomości asystenta, a następnie opróżnia zbuforowane
  dane wyjściowe. Nadal używa mechanizmu dzielenia, jeśli zbuforowany tekst przekracza `maxChars`, dlatego
  na końcu może wyemitować wiele fragmentów.

### Dostarczanie multimediów podczas strumieniowania bloków

Strumieniowanie multimediów musi używać pól ustrukturyzowanego ładunku, takich jak `mediaUrl` lub
`mediaUrls`; strumieniowany tekst nie jest analizowany jako polecenie załącznika. Gdy podczas
strumieniowania bloków multimedia zostaną wysłane wcześniej, OpenClaw zapamiętuje to dostarczenie dla danej tury. Jeśli
końcowy ładunek asystenta powtarza ten sam adres URL multimediów, podczas końcowego dostarczania
duplikat multimediów jest usuwany zamiast ponownego wysyłania załącznika.

Dokładnie zduplikowane ładunki końcowe są pomijane. Jeśli końcowy ładunek dodaje
odrębny tekst wokół multimediów, które zostały już przesłane strumieniowo, OpenClaw nadal wysyła
nowy tekst, zachowując jednokrotne dostarczenie multimediów. Zapobiega to duplikowaniu wiadomości
głosowych lub plików w kanałach takich jak Telegram.

## Algorytm dzielenia (dolna/górna granica)

Dzielenie na bloki jest implementowane przez `EmbeddedBlockChunker`:

- **Dolna granica:** nie emituje, dopóki bufor nie osiągnie >= `minChars` (chyba że zostanie to wymuszone).
- **Górna granica:** preferuje podział przed `maxChars`; po wymuszeniu dzieli przy `maxChars`.
- **Łańcuch preferencji podziału:** `paragraph` -> `newline` -> `sentence` ->
  biały znak -> podział bezwzględny.
- **Bloki kodu:** nigdy nie dzieli wewnątrz bloków; przy wymuszeniu na `maxChars` zamyka
  i ponownie otwiera blok, aby zachować poprawność Markdown.

`maxChars` jest ograniczany do wartości `textChunkLimit` kanału, dlatego nie można przekroczyć
limitów poszczególnych kanałów.

## Scalanie (łączenie strumieniowanych bloków)

Gdy strumieniowanie bloków jest włączone, OpenClaw może **scalać kolejne
fragmenty bloków** przed ich wysłaniem, ograniczając zalew jednowierszowych wiadomości,
a jednocześnie nadal stopniowo przekazując dane wyjściowe.

- Scalanie czeka na **okresy bezczynności** (`idleMs`) przed opróżnieniem bufora.
- Bufory są ograniczone przez `maxChars` i opróżniane po przekroczeniu tej wartości.
- `minChars` zapobiega wysyłaniu niewielkich fragmentów, dopóki nie zgromadzi się wystarczająco dużo tekstu
  (końcowe opróżnienie zawsze wysyła pozostały tekst).
- Separator wynika z `blockStreamingChunk.breakPreference`: `paragraph` ->
  `\n\n`, `newline` -> `\n`, `sentence` -> spacja.
- Nadpisania dla kanałów są dostępne przez `*.streaming.block.coalesce` (w tym
  konfiguracje dla poszczególnych kont).
- Discord, Signal i Slack domyślnie scalają do `{ minChars: 1500, idleMs: 1000 }`,
  o ile nie zostanie to nadpisane.

## Naturalne opóźnienia między blokami

Gdy strumieniowanie bloków jest włączone, po pierwszym bloku dodawana jest
**losowa pauza** między odpowiedziami blokowymi, aby odpowiedzi składające się
z wielu dymków wyglądały bardziej naturalnie.

| `agents.defaults.humanDelay.mode` | Zachowanie              |
| --------------------------------- | ----------------------- |
| `off` (domyślnie)                   | Bez pauzy               |
| `natural`                         | Losowa pauza 800-2500ms |
| `custom`                          | `minMs`/`maxMs`         |

Można nadpisać dla każdego agenta za pomocą `agents.list[].humanDelay`. Dotyczy tylko **odpowiedzi
blokowych**, a nie odpowiedzi końcowych ani podsumowań narzędzi.

## „Strumieniuj fragmenty albo wszystko”

- **Strumieniowanie fragmentów:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`
  (emitowanie na bieżąco). Kanały inne niż Telegram wymagają również
  `*.streaming.block.enabled: true`.
- **Strumieniowanie wszystkiego na końcu:** `blockStreamingBreak: "message_end"` (jednokrotne
  opróżnienie, ewentualnie wiele fragmentów, jeśli tekst jest bardzo długi).
- **Bez strumieniowania bloków:** `blockStreamingDefault: "off"` (tylko odpowiedź końcowa).

Strumieniowanie bloków jest **wyłączone, chyba że** `*.streaming.block.enabled` zostanie jawnie
ustawione na `true` (wyjątek: QQ Bot nie ma kluczy `streaming.block` i strumieniuje
odpowiedzi blokowe, chyba że `channels.qqbot.streaming.mode` ma wartość `"off"`). Kanały mogą
strumieniować podgląd na żywo (`channels.<channel>.streaming.mode`) bez odpowiedzi
blokowych. Wartości domyślne `blockStreaming*` znajdują się w `agents.defaults`, a nie w
katalogu głównym konfiguracji.

## Tryby strumieniowania podglądu

Klucz kanoniczny: `channels.<channel>.streaming` (zagnieżdżony `{ mode, ... }`; starsze
zapisy wartości logicznej/ciągu znaków najwyższego poziomu są przepisywane przez `openclaw doctor --fix`).

| Tryb       | Zachowanie                                                            |
| ---------- | --------------------------------------------------------------------- |
| `off`      | Wyłącza strumieniowanie podglądu                                      |
| `partial`  | Pojedynczy podgląd zastępowany najnowszym tekstem                      |
| `block`    | Aktualizacje podglądu w krokach polegających na dzieleniu/dołączaniu   |
| `progress` | Podgląd postępu/stanu podczas generowania, odpowiedź końcowa po ukończeniu |

`streaming.mode: "block"` to tryb strumieniowania podglądu przeznaczony dla kanałów
obsługujących edycję, takich jak Discord i Telegram; sam w sobie nie włącza tam
dostarczania bloków do kanału. Do zwykłych odpowiedzi blokowych należy używać `streaming.block.enabled`.
Microsoft Teams stanowi
wyjątek: nie ma transportu blokowego dla wersji roboczej podglądu, dlatego `streaming.mode:
"block"` całkowicie wyłącza natywne strumieniowanie, a odpowiedź jest dostarczana jako zwykły
blok zamiast natywnego strumieniowania częściowego/postępu. Mattermost także
działa inaczej: w trybie `block` przełącza podgląd między ukończonym tekstem a
blokami aktywności narzędzi, dzięki czemu wcześniejsze bloki pozostają widoczne jako osobne wpisy,
zamiast być zastępowane w jednej edytowalnej wersji roboczej.

### Mapowanie kanałów

| Kanał      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | Tak   | Tak       | Tak     | edytowalna wersja robocza postępu |
| Discord    | Tak   | Tak       | Tak     | edytowalna wersja robocza postępu |
| Slack      | Tak   | Tak       | Tak     | Tak                     |
| Mattermost | Tak   | Tak       | Tak     | Tak                     |
| MS Teams   | Tak   | Tak       | Tak     | natywny strumień postępu |

Konfiguracja fragmentów podglądu (`streaming.preview.chunk.*`, np. w
`channels.discord.streaming` lub `channels.telegram.streaming`) ma domyślne wartości
`minChars: 200`, `maxChars: 800` (ograniczone do `textChunkLimit` kanału) oraz
`breakPreference: "paragraph"`.

Tylko Slack:

- `channels.slack.streaming.nativeTransport` przełącza wywołania natywnego interfejsu API strumieniowania Slack
  (`chat.startStream`/`chat.appendStream`/`chat.stopStream`), gdy
  `channels.slack.streaming.mode="partial"` (domyślnie: `true`).
- Natywne strumieniowanie Slack i stan wątku asystenta Slack wymagają docelowego
  wątku odpowiedzi. Wiadomości prywatne najwyższego poziomu nie wyświetlają podglądu w stylu wątku, ale mogą
  nadal używać wpisów wersji roboczych podglądu Slack i ich edycji.

### Migracja starszych kluczy

| Kanał    | Starsze klucze                                              | Stan                                                                                                                                                 |
| -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram | `streamMode`, skalarna/logiczna wartość `streaming`         | Przepisywane na `streaming.mode` przez `openclaw doctor --fix`; nie są odczytywane w czasie działania                                                 |
| Discord  | `streamMode`, logiczna wartość `streaming`                  | Przepisywane na `streaming.mode` przez `openclaw doctor --fix`; nie są odczytywane w czasie działania                                                 |
| Slack    | `streamMode`; logiczna wartość `streaming`; starszy klucz `nativeStreaming` | Przepisywane na `streaming.mode` (oraz `streaming.nativeTransport` dla form logicznych/starszych) przez `openclaw doctor --fix`; nie są odczytywane w czasie działania |
| Matrix   | skalarna/logiczna wartość `streaming`                         | Przepisywane na `streaming.mode` (w tym tryb `"quiet"` Matrix) przez `openclaw doctor --fix`; nie są odczytywane w czasie działania                 |
| Feishu   | logiczna wartość `streaming`                                   | Przepisywane na `streaming.mode` przez `openclaw doctor --fix`; nie są odczytywane w czasie działania                                                 |
| QQ Bot   | logiczna wartość `streaming`; `streaming.c2cStreamApi`        | Przepisywane na `streaming.mode` (oraz `streaming.nativeTransport` dla form logicznych/`c2cStreamApi`) przez `openclaw doctor --fix`; nie są odczytywane w czasie działania |

## Zachowanie w czasie działania

### Telegram

- Używa aktualizacji podglądu `sendMessage` + `editMessageText` w wiadomościach prywatnych oraz
  grupach/tematach; tekst końcowy zastępuje aktywny podgląd w miejscu. Efemeryczne
  30-sekundowe wersje robocze „pisania” Telegrama (`sendMessageDraft`) nie są używane do
  strumieniowania odpowiedzi.
- Krótkie podglądy początkowe nadal mają opóźnienie eliminujące nadmiarowe aktualizacje ze względu na UX powiadomień push, ale
  pojawiają się po ograniczonym czasie, aby aktywne przebiegi nie pozostawały wizualnie bezczynne.
- Długie odpowiedzi końcowe ponownie wykorzystują wiadomość podglądu na pierwszy fragment i wysyłają tylko
  pozostałe fragmenty.
- Tryb `block` przenosi podgląd do nowej wiadomości po osiągnięciu
  `streaming.preview.chunk.maxChars` (domyślnie 800, maksymalnie do limitu edycji Telegrama wynoszącego 4096);
  inne tryby rozszerzają jeden podgląd do 4096 znaków.
- Tryb `progress` przechowuje postęp narzędzi w edytowalnej wersji roboczej statusu, wyświetla
  etykietę statusu, gdy strumieniowanie odpowiedzi jest aktywne, ale nie jest jeszcze
  dostępny żaden wiersz narzędzia, czyści wersję roboczą po zakończeniu i wysyła odpowiedź końcową
  standardową ścieżką dostarczania.
- Jeśli końcowa edycja nie powiedzie się przed potwierdzeniem kompletnego tekstu, OpenClaw używa
  standardowego dostarczania odpowiedzi końcowej i usuwa nieaktualny podgląd.
- Strumieniowanie podglądu jest pomijane, gdy jawnie włączono strumieniowanie blokowe Telegrama,
  aby uniknąć podwójnego strumieniowania.
- `/reasoning stream` może zapisywać rozumowanie w tymczasowym podglądzie, który jest
  usuwany po dostarczeniu odpowiedzi końcowej.
- Odpowiedzi Telegrama z wybranym cytatem stanowią wyjątek: gdy `replyToMode` nie ma wartości
  `"off"` i występuje tekst wybranego cytatu, OpenClaw pomija strumień podglądu odpowiedzi
  dla tej tury (odpowiedź końcowa musi zostać wysłana przez natywną ścieżkę odpowiedzi
  z cytatem), dlatego wiersze podglądu postępu narzędzi nie mogą się wyświetlić. Odpowiedzi
  na bieżącą wiadomość bez tekstu wybranego cytatu nadal zachowują strumieniowanie podglądu. Szczegóły zawiera
  [dokumentacja kanału Telegram](/pl/channels/telegram).

### Discord

- Używa wysyłania i edytowania wiadomości podglądu.
- Tryb `block` używa dzielenia wersji roboczej na fragmenty (`draftChunk`).
- Strumieniowanie podglądu jest pomijane, gdy jawnie włączono strumieniowanie blokowe Discorda.
- Tryb `progress` dołącza do odpowiedzi końcowej małe potwierdzenie aktywności `-#` (liczba
  myśli/wywołań narzędzi oraz czas trwania) i usuwa wersję roboczą statusu
  po dostarczeniu tej odpowiedzi, dzięki czemu w aktywnych kanałach nad odpowiedzią nie pozostaje osierocony dziennik
  narzędzi. W przypadku błędnej odpowiedzi końcowej wersja robocza pozostaje jako zapis nieudanej
  tury.
- Końcowe ładunki multimediów, błędów i jawnych odpowiedzi anulują oczekujące podglądy
  bez opróżniania nowej wersji roboczej, a następnie korzystają ze standardowego dostarczania.

### Slack

- `partial` może używać natywnego strumieniowania Slacka (`chat.startStream`/`append`/`stop`),
  gdy jest ono dostępne.
- `block` używa podglądów wersji roboczych rozszerzanych przez dołączanie.
- `progress` używa tekstu podglądu statusu, a następnie odpowiedzi końcowej.
- Wiadomości prywatne najwyższego poziomu bez wątku odpowiedzi używają wpisów podglądu wersji roboczej i ich edycji
  zamiast natywnego strumieniowania Slacka.
- Natywne strumieniowanie i strumieniowanie podglądu wersji roboczej wyłączają odpowiedzi blokowe w tej turze, dzięki czemu
  odpowiedź Slacka jest strumieniowana tylko jedną ścieżką dostarczania.
- Końcowe ładunki multimediów/błędów oraz końcowe komunikaty postępu nie tworzą jednorazowych wiadomości
  wersji roboczych; oczekujący tekst wersji roboczej opróżniają tylko końcowe treści tekstowe/blokowe, które mogą edytować podgląd.

### Mattermost

- W trybie `partial` strumieniuje rozumowanie i częściowy tekst odpowiedzi do pojedynczego wpisu
  podglądu wersji roboczej, który jest finalizowany w miejscu, gdy można bezpiecznie wysłać odpowiedź końcową.
- W trybie `progress` strumieniuje rozumowanie i aktywność narzędzi do pojedynczego
  podglądu statusu, który jest finalizowany w miejscu, gdy można bezpiecznie wysłać odpowiedź końcową.
- W trybie `block` przełącza się między wpisami ukończonego tekstu a wpisami aktywności narzędzi;
  równoległe i kolejne aktualizacje narzędzi współdzielą bieżący wpis aktywności narzędzi.
- Jeśli wpis podglądu został usunięty lub jest z innego powodu niedostępny w chwili finalizacji,
  używane jest awaryjnie wysłanie nowego wpisu końcowego.
- Końcowe ładunki multimediów/błędów anulują oczekujące aktualizacje podglądu przed standardowym
  dostarczeniem, zamiast opróżniać tymczasowy wpis podglądu.

### Matrix

- Podglądy wersji roboczych są finalizowane w miejscu, gdy tekst końcowy może ponownie wykorzystać zdarzenie
  podglądu.
- Końcowe treści zawierające tylko multimedia, błędy lub niezgodny cel odpowiedzi anulują oczekujące aktualizacje podglądu
  przed standardowym dostarczeniem; już widoczny nieaktualny podgląd jest redagowany.

## Aktualizacje podglądu postępu narzędzi

Strumieniowanie podglądu może również obejmować aktualizacje **postępu narzędzi**: krótkie wiersze
statusu, takie jak „przeszukiwanie internetu”, „odczytywanie pliku” lub „wywoływanie narzędzia”, które pojawiają się
w tej samej wiadomości podglądu podczas działania narzędzi, przed odpowiedzią końcową.
W trybie serwera aplikacji Codex komunikaty wstępne/komentarze Codex korzystają z tej samej
ścieżki podglądu, dzięki czemu krótkie informacje o postępie, takie jak „Sprawdzam...”, mogą być strumieniowane do
edytowalnej wersji roboczej bez stawania się częścią odpowiedzi końcowej. Dzięki temu
wieloetapowe tury narzędzi pozostają wizualnie aktywne, zamiast milczeć między pierwszym
podglądem rozumowania a odpowiedzią końcową.

Długotrwałe narzędzia mogą przed zakończeniem emitować typowane informacje o postępie. Na przykład
`web_fetch` uruchamia po rozpoczęciu pięciosekundowy licznik czasu: jeśli pobieranie nadal
trwa, podgląd pokazuje `Fetching page content...`; jeśli pobieranie zakończy się lub
zostanie anulowane wcześniej, wiersz postępu nie jest emitowany. Późniejszy końcowy wynik narzędzia
jest nadal standardowo przekazywany do modelu.

Obsługiwane powierzchnie:

- **Discord**, **Slack**, **Telegram** i **Matrix** domyślnie strumieniują postęp narzędzi oraz
  aktualizacje wstępne Codex do edytowanego podglądu na żywo, gdy strumieniowanie podglądu
  jest aktywne. Microsoft Teams używa natywnego strumienia postępu w
  czatach osobistych.
- Telegram jest dostarczany z włączonymi aktualizacjami podglądu postępu narzędzi od wersji
  `v2026.4.22`; pozostawienie ich włączonych zachowuje opublikowane zachowanie.
- **Mattermost** łączy aktywność narzędzi w jednym wpisie podglądu w trybach `partial` i
  `progress` lub w jednym wpisie aktywności narzędzi między blokami tekstu w trybie `block`
  (patrz wyżej).
- Edycje postępu narzędzi są zgodne z aktywnym trybem strumieniowania podglądu; są
  pomijane, gdy strumieniowanie podglądu ma wartość `off` lub gdy strumieniowanie blokowe przejęło
  obsługę wiadomości. W Telegramie `streaming.mode: "off"` dotyczy tylko treści końcowej: ogólne
  komunikaty o postępie również są pomijane, zamiast być dostarczane jako osobne wiadomości
  statusu, natomiast monity zatwierdzania, ładunki multimediów i błędy nadal są kierowane
  standardowo.
- Aby zachować strumieniowanie podglądu, ale ukryć wiersze postępu narzędzi, należy ustawić
  `streaming.preview.toolProgress` na `false` dla danego kanału (domyślnie
  `true`). Aby pozostawić widoczne wiersze postępu narzędzi, jednocześnie ukrywając tekst poleceń/wykonania,
  należy ustawić `streaming.preview.commandText` na `"status"` lub
  `streaming.progress.commandText` na `"status"`; wartość domyślna to `"raw"`,
  aby zachować opublikowane zachowanie. Te zasady są współdzielone przez kanały wersji roboczych/postępu,
  które używają kompaktowego mechanizmu renderowania postępu OpenClaw, w tym Discord, Matrix,
  Microsoft Teams, Mattermost, podglądy wersji roboczych Slacka oraz Telegram. Aby całkowicie wyłączyć
  edycje podglądu, należy ustawić `streaming.mode` na `off`.

## Renderowanie wersji roboczej postępu

Wersje robocze w trybie postępu (`streaming.progress.*`) mają ograniczony rozmiar i można je konfigurować osobno dla każdego
kanału:

| Klucz                             | Wartość domyślna | Zachowanie                                                     |
| --------------------------------- | ---------------- | -------------------------------------------------------------- |
| `streaming.progress.maxLines`     | `8`           | Maksymalna liczba kompaktowych wierszy postępu przechowywanych pod etykietą wersji roboczej |
| `streaming.progress.maxLineChars` | `120`         | Maksymalna liczba znaków w kompaktowym wierszu przed skróceniem (z uwzględnieniem słów) |
| `streaming.progress.label`        | `"auto"`      | Tytuł wersji roboczej; niestandardowy ciąg lub `false`, aby go ukryć |
| `streaming.progress.labels`       | wbudowana pula | Etykiety kandydujące używane, gdy `label: "auto"`            |

### Ścieżka postępu komentarzy

Oprócz postępu narzędzi kompaktowy mechanizm renderowania postępu może wyświetlać w wersji roboczej
jeszcze jedną ścieżkę:

- **`streaming.progress.commentary`** — renderuje przed użyciem narzędzi
  **komentarz** modelu (krótką narrację „Sprawdzę... a następnie...”) przeplataną
  z wierszami narzędzi w wersji roboczej postępu. W Discordzie i Telegramie w trybie postępu
  ten sam komunikat wstępny stanowi nagłówek statusu nawet wtedy, gdy ta opcjonalna ścieżka
  jest wyłączona; inne kanały zachowują swoje dotychczasowe działanie postępu. Zobacz
  [Wersje robocze postępu](/pl/concepts/progress-drafts#status-headline).

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Pozostaw wiersze postępu widoczne, ale ukryj nieprzetworzony tekst poleceń/wykonania:

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

Użyj tego samego kształtu pod kluczem innego kanału kompaktowego postępu, na przykład
`channels.discord`, `channels.matrix`, `channels.msteams`,
`channels.mattermost` lub podglądów wersji roboczych Slacka. W trybie wersji roboczej postępu umieść
te same zasady w `streaming.progress`:

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

- [Refaktoryzacja cyklu życia wiadomości](/pl/concepts/message-lifecycle-refactor) — docelowy wspólny projekt podglądu, edycji, strumieniowania i finalizacji
- [Wersje robocze postępu](/pl/concepts/progress-drafts) — widoczne komunikaty o trwającej pracy, które aktualizują się podczas długich tur
- [Wiadomości](/pl/concepts/messages) — cykl życia i dostarczanie wiadomości
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania po niepowodzeniu dostarczania
- [Kanały](/pl/channels) — obsługa strumieniowania dla poszczególnych kanałów
