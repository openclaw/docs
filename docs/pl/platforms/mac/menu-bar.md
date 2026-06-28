---
read_when:
    - Dostosowywanie interfejsu menu Maca lub logiki stanu
summary: Logika stanu paska menu i informacje prezentowane użytkownikom
title: Pasek menu
x-i18n:
    generated_at: "2026-05-06T09:21:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Co jest wyświetlane

- Pokazujemy bieżący stan pracy agenta w ikonie paska menu oraz w pierwszym wierszu stanu menu.
- Stan kondycji jest ukryty, gdy praca jest aktywna; wraca, gdy wszystkie sesje są bezczynne.
- Główne podmenu „Kontekst” zawiera ostatnie sesje zamiast rozwijać je bezpośrednio w menu głównym.
- Blok „Nodes” w menu głównym zawiera tylko **urządzenia** (sparowane węzły przez `node.list`), a nie wpisy klienta/obecności.
- Główna sekcja „Użycie” pojawia się pod Kontekstem, gdy dostępne są migawki użycia dostawcy, a po niej szczegóły kosztów użycia, gdy są dostępne.

## Model stanu

- Sesje: zdarzenia przychodzą z `runId` (dla każdego uruchomienia) oraz `sessionKey` w ładunku. Sesja „główna” ma klucz `main`; jeśli go brakuje, wracamy do ostatnio zaktualizowanej sesji.
- Priorytet: główna zawsze wygrywa. Jeśli główna jest aktywna, jej stan jest pokazywany natychmiast. Jeśli główna jest bezczynna, pokazywana jest ostatnio aktywna sesja inna niż główna. Nie przełączamy się tam i z powrotem w trakcie aktywności; przełączamy się tylko wtedy, gdy bieżąca sesja przejdzie w bezczynność albo główna stanie się aktywna.
- Rodzaje aktywności:
  - `job`: wykonywanie polecenia wysokiego poziomu (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` z `toolName` oraz `meta/args`.

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
- domyślnie → 🛠️

### Mapowanie wizualne

- `idle`: zwykłe stworzenie.
- `workingMain`: odznaka z glifem, pełne zabarwienie, animacja „pracy” nóg.
- `workingOther`: odznaka z glifem, stłumione zabarwienie, bez przemykania.
- `overridden`: używa wybranego glifu/zabarwienia niezależnie od aktywności.

## Podmenu kontekstu

- Menu główne pokazuje jeden wiersz „Kontekst” z liczbą/statusem sesji i otwiera podmenu.
- Nagłówek podmenu Kontekst pokazuje liczbę aktywnych sesji z ostatnich 24 godzin.
- Każdy wiersz sesji zachowuje pasek tokenów, wiek, podgląd, akcje myślenia/trybu szczegółowego, resetowania, kompaktowania i usuwania.
- Komunikaty ładowania, rozłączenia i błędu ładowania sesji pojawiają się w podmenu Kontekst.
- Szczegóły użycia providera i kosztów użycia pozostają na poziomie głównym poniżej Kontekstu, aby nadal były widoczne na pierwszy rzut oka bez otwierania podmenu.

## Tekst wiersza statusu (menu)

- Gdy praca jest aktywna: `<Session role> · <activity label>`
  - Przykłady: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Gdy jest bezczynnie: wraca do podsumowania stanu.

## Pobieranie zdarzeń

- Źródło: zdarzenia control-channel `agent` (`ControlChannel.handleAgentEvent`).
- Parsowane pola:
  - `stream: "job"` z `data.state` dla startu/zatrzymania.
  - `stream: "tool"` z `data.phase`, `name`, opcjonalnymi `meta`/`args`.
- Etykiety:
  - `exec`: pierwszy wiersz `args.command`.
  - `read`/`write`: skrócona ścieżka.
  - `edit`: ścieżka plus wywnioskowany typ zmiany z `meta`/liczników diff.
  - awaryjnie: nazwa narzędzia.

## Nadpisanie debugowania

- Ustawienia ▸ Debugowanie ▸ selektor „Nadpisanie ikony”:
  - `System (auto)` (domyślnie)
  - `Working: main` (według typu narzędzia)
  - `Working: other` (według typu narzędzia)
  - `Idle`
- Przechowywane przez `@AppStorage("iconOverride")`; mapowane na `IconState.overridden`.

## Lista kontrolna testowania

- Uruchom zadanie sesji głównej: sprawdź, czy ikona przełącza się natychmiast, a wiersz statusu pokazuje etykietę główną.
- Uruchom zadanie sesji innej niż główna, gdy główna jest bezczynna: ikona/status pokazuje sesję inną niż główna; pozostaje stabilny do czasu jej zakończenia.
- Uruchom główną sesję, gdy inna jest aktywna: ikona natychmiast przełącza się na główną.
- Szybkie serie narzędzi: upewnij się, że odznaka nie migocze (karencja TTL dla wyników narzędzi).
- Wiersz stanu pojawia się ponownie, gdy wszystkie sesje są bezczynne.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [Ikona paska menu](/pl/platforms/mac/icon)
