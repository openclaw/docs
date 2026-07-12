---
read_when:
    - Dostosowywanie interfejsu menu macOS lub logiki stanu
summary: Logika stanu paska menu i informacje wyświetlane użytkownikom
title: Pasek menu
x-i18n:
    generated_at: "2026-07-12T15:20:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Co jest wyświetlane

- Bieżący stan pracy agenta jest przedstawiany na ikonie paska menu oraz w pierwszym wierszu stanu w menu.
- Stan kondycji jest ukryty podczas aktywnej pracy; pojawia się ponownie, gdy wszystkie sesje są bezczynne.
- Główny element „Kontekst” otwiera podmenu z ostatnimi sesjami zamiast rozwijać je w menu głównym.
- Blok „Węzły” w menu głównym zawiera tylko sparowane **urządzenia** (z `node.list`), bez wpisów klientów ani obecności.
- Sekcja „Użycie” pojawia się w menu głównym poniżej sekcji Kontekst, gdy dostępne są migawki użycia dostawcy, a po niej wyświetlane są szczegóły kosztów, jeśli są dostępne.

## Model stanu

- Źródło: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Zdarzenia docierają jako `ControlAgentEvent` z identyfikatorem `runId`; procedura obsługi (`ControlChannel.routeWorkActivity`) odczytuje `sessionKey` z ładunku zdarzenia i w razie jego braku przyjmuje domyślnie `"main"`.
- Priorytet: sesja główna (domyślnie `sessionKey == "main"`) zawsze ma pierwszeństwo. Jeśli jest aktywna, jej stan jest wyświetlany natychmiast. Jeśli jest bezczynna, wyświetlana jest zamiast niej ostatnio aktywna sesja inna niż główna. Magazyn nie przełącza sesji w trakcie aktywności; robi to dopiero wtedy, gdy bieżąca sesja stanie się bezczynna lub sesja główna stanie się aktywna.
- Rodzaje aktywności:
  - `job`: wykonywanie polecenia wysokiego poziomu (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` z `name` oraz opcjonalnymi `meta`/`args`.

## Wyliczenie IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (nadpisanie na potrzeby debugowania)

### ActivityKind -> symbol odznaki

`ActivityKind` opakowuje `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) lub samodzielne `job`. Każdemu rodzajowi odpowiada symbol SF wyświetlany jako odznaka na ikonie stworzonka (`IconState.badgeSymbolName`):

| Rodzaj          | Symbol                             |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Odwzorowanie wizualne

- `idle`: zwykłe stworzonko, bez odznaki.
- `workingMain`: odznaka z symbolem, pełne zabarwienie (wyróżnienie `.primary`), animacja „pracy” odnóży.
- `workingOther`: odznaka z symbolem, stonowane zabarwienie (wyróżnienie `.secondary`), bez animacji biegania.
- `overridden`: używa wybranego symbolu i zabarwienia niezależnie od rzeczywistej aktywności.

## Podmenu kontekstu

- Menu główne wyświetla jeden wiersz „Kontekst” z liczbą i stanem sesji; otwiera on podmenu (`MenuSessionsInjector`).
- Nagłówek podmenu wyświetla liczbę aktywnych sesji z ostatnich 24 godzin.
- Każdy wiersz sesji zachowuje pasek tokenów, wiek, podgląd, przełącznik trybu rozumowania/szczegółowości oraz działania resetowania, kompaktowania i usuwania.
- Komunikaty o ładowaniu, rozłączeniu i błędzie wczytywania sesji są wyświetlane w podmenu kontekstu.
- Sekcje użycia i kosztów pozostają na poziomie głównym poniżej pozycji „Kontekst”, aby można je było szybko sprawdzić bez otwierania podmenu.

## Tekst wiersza stanu (menu)

- Gdy praca jest aktywna: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` w `MenuContentView`), gdzie etykieta roli to `Main` lub `Other`.
- W stanie bezczynności: powraca do podsumowania stanu.

## Pozyskiwanie zdarzeń

- Źródło: zdarzenia `agent` kanału sterowania, kierowane przez `ControlChannel.routeWorkActivity(from:)`.
- Analizowane pola:
  - `stream: "job"` z `data.state` dla rozpoczęcia/zatrzymania.
  - `stream: "tool"` z `data.phase`, `data.name` oraz opcjonalnymi `data.meta`/`data.args`.
- Etykiety narzędzi pochodzą z `ToolDisplayRegistry.resolve(name:args:meta:)`; w przypadku nierozpoznanych nazw używana jest nieprzetworzona nazwa narzędzia.

## Nadpisanie debugowania

- Ustawienia > Debugowanie > selektor „Nadpisanie ikony”:
  - `System (auto)` (domyślnie)
  - `Working: main` / `Working: other` (według rodzaju narzędzia: bash, odczyt, zapis, edycja, inne)
  - `Idle`
- Przechowywane pod kluczem `UserDefaults` `openclaw.iconOverride`; mapowane na `IconState.overridden`.

## Lista kontrolna testów

- Uruchom zadanie sesji głównej: ikona przełącza się natychmiast, a wiersz stanu wyświetla etykietę sesji głównej.
- Uruchom zadanie sesji innej niż główna, gdy sesja główna jest bezczynna: ikona i stan wskazują sesję inną niż główna; pozostają stabilne aż do jej zakończenia.
- Uruchom sesję główną, gdy aktywna jest inna sesja: ikona natychmiast przełącza się na sesję główną.
- Szybkie serie wywołań narzędzi: plakietka nie miga (2-sekundowy okres karencji przed usunięciem zakończonego narzędzia, `WorkActivityStore.toolResultGrace`).
- Wiersz kondycji pojawia się ponownie, gdy wszystkie sesje są bezczynne.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Ikona paska menu](/pl/platforms/mac/icon)
