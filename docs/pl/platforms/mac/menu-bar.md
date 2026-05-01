---
read_when:
    - Dostosowywanie interfejsu menu Maca lub logiki statusu
summary: Logika stanu paska menu i informacje prezentowane użytkownikom
title: Pasek menu
x-i18n:
    generated_at: "2026-05-01T10:00:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Logika stanu paska menu

## Co jest wyświetlane

- Pokazujemy bieżący stan pracy agenta w ikonie paska menu oraz w pierwszym wierszu stanu menu.
- Stan kondycji jest ukryty, gdy praca jest aktywna; wraca, gdy wszystkie sesje są bezczynne.
- Główne podmenu „Kontekst” zawiera ostatnie sesje zamiast rozwijania ich bezpośrednio w menu głównym.
- Blok „Nodes” w menu głównym wyświetla tylko **urządzenia** (sparowane węzły przez `node.list`), a nie wpisy klientów/obecności.
- Główna sekcja „Użycie” pojawia się pod Kontekstem, gdy dostępne są migawki użycia dostawcy, a po niej szczegóły kosztów użycia, gdy są dostępne.

## Model stanu

- Sesje: zdarzenia przychodzą z `runId` (dla danego uruchomienia) oraz `sessionKey` w ładunku. Sesja „main” ma klucz `main`; jeśli go nie ma, wracamy do ostatnio zaktualizowanej sesji.
- Priorytet: main zawsze wygrywa. Jeśli main jest aktywna, jej stan jest pokazywany natychmiast. Jeśli main jest bezczynna, pokazywana jest ostatnio aktywna sesja inna niż main. Nie przełączamy się tam i z powrotem w trakcie aktywności; przełączamy tylko wtedy, gdy bieżąca sesja staje się bezczynna albo main staje się aktywna.
- Rodzaje aktywności:
  - `job`: wykonywanie polecenia wysokiego poziomu (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` z `toolName` i `meta/args`.

## Wyliczenie IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (nadpisanie debugowania)

### ActivityKind → glif

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- domyślne → 🛠️

### Mapowanie wizualne

- `idle`: normalne stworzenie.
- `workingMain`: odznaka z glifem, pełne zabarwienie, animacja „pracy” nóg.
- `workingOther`: odznaka z glifem, przytłumione zabarwienie, bez przebiegania.
- `overridden`: używa wybranego glifu/zabarwienia niezależnie od aktywności.

## Podmenu Kontekst

- Menu główne pokazuje jeden wiersz „Kontekst” z liczbą/stanem sesji i otwiera podmenu.
- Nagłówek podmenu Kontekst pokazuje liczbę aktywnych sesji z ostatnich 24 godzin.
- Każdy wiersz sesji zachowuje pasek tokenów, wiek, podgląd, myślenie/szczegółowość, resetowanie, kompaktowanie i akcje usuwania.
- Komunikaty ładowania, rozłączenia i błędów ładowania sesji pojawiają się w podmenu Kontekst.
- Użycie dostawcy i szczegóły kosztów użycia pozostają na poziomie głównym pod Kontekstem, aby były widoczne od razu bez otwierania podmenu.

## Tekst wiersza stanu (menu)

- Gdy praca jest aktywna: `<Session role> · <activity label>`
  - Przykłady: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Gdy bezczynne: wraca do podsumowania kondycji.

## Pobieranie zdarzeń

- Źródło: zdarzenia `agent` kanału kontrolnego (`ControlChannel.handleAgentEvent`).
- Parsowane pola:
  - `stream: "job"` z `data.state` dla startu/zatrzymania.
  - `stream: "tool"` z `data.phase`, `name`, opcjonalnie `meta`/`args`.
- Etykiety:
  - `exec`: pierwszy wiersz `args.command`.
  - `read`/`write`: skrócona ścieżka.
  - `edit`: ścieżka oraz wywnioskowany rodzaj zmiany z `meta`/liczników diff.
  - awaryjnie: nazwa narzędzia.

## Nadpisanie debugowania

- Ustawienia ▸ Debugowanie ▸ selektor „Nadpisanie ikony”:
  - `System (auto)` (domyślne)
  - `Working: main` (dla rodzaju narzędzia)
  - `Working: other` (dla rodzaju narzędzia)
  - `Idle`
- Przechowywane przez `@AppStorage("iconOverride")`; mapowane na `IconState.overridden`.

## Lista kontrolna testowania

- Wywołaj zadanie sesji main: sprawdź, czy ikona przełącza się natychmiast, a wiersz stanu pokazuje etykietę main.
- Wywołaj zadanie sesji innej niż main, gdy main jest bezczynna: ikona/stan pokazuje sesję inną niż main; pozostaje stabilne do jej zakończenia.
- Uruchom main, gdy inna sesja jest aktywna: ikona natychmiast przełącza się na main.
- Szybkie serie narzędzi: upewnij się, że odznaka nie migocze (okres karencji TTL przy wynikach narzędzi).
- Wiersz kondycji pojawia się ponownie, gdy wszystkie sesje są bezczynne.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [Ikona paska menu](/pl/platforms/mac/icon)
