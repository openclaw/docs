---
read_when:
    - Dostosowywanie interfejsu mac menu lub logiki statusu
summary: Logika statusu paska menu i to, co jest pokazywane użytkownikom
title: Pasek menu
x-i18n:
    generated_at: "2026-04-24T09:21:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Logika statusu paska menu

## Co jest pokazywane

- W ikonie paska menu i w pierwszym wierszu statusu menu pokazujemy bieżący stan pracy agenta.
- Status kondycji jest ukrywany podczas aktywnej pracy; wraca, gdy wszystkie sesje są bezczynne.
- Blok „Nodes” w menu pokazuje tylko **urządzenia** (sparowane Node przez `node.list`), a nie wpisy klienta/presence.
- Sekcja „Usage” pojawia się pod Context, gdy dostępne są snapshoty użycia dostawcy.

## Model stanu

- Sesje: zdarzenia przychodzą z `runId` (per przebieg) oraz `sessionKey` w ładunku. Sesja „main” ma klucz `main`; jeśli go brak, wracamy do ostatnio zaktualizowanej sesji.
- Priorytet: main zawsze wygrywa. Jeśli main jest aktywna, jej stan jest pokazywany natychmiast. Jeśli main jest bezczynna, pokazywana jest ostatnio aktywna sesja niebędąca main. Nie przełączamy się nerwowo w trakcie aktywności; przełączamy się dopiero wtedy, gdy bieżąca sesja przejdzie w bezczynność albo main stanie się aktywna.
- Rodzaje aktywności:
  - `job`: wykonywanie polecenia wysokiego poziomu (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` z `toolName` i `meta/args`.

## Enum `IconState` (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (nadpisanie debug)

### `ActivityKind` → glif

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- domyślnie → 🛠️

### Mapowanie wizualne

- `idle`: normalny stworek.
- `workingMain`: plakietka z glifem, pełne zabarwienie, animacja „pracujących” nóg.
- `workingOther`: plakietka z glifem, stonowane zabarwienie, bez ruchu.
- `overridden`: używa wybranego glifu/zabarwienia niezależnie od aktywności.

## Tekst w wierszu statusu (menu)

- Podczas aktywnej pracy: `<Session role> · <activity label>`
  - Przykłady: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- W stanie bezczynności: wraca do podsumowania kondycji.

## Pobieranie zdarzeń

- Źródło: zdarzenia `agent` kanału control (`ControlChannel.handleAgentEvent`).
- Parsowane pola:
  - `stream: "job"` z `data.state` dla uruchomienia/zatrzymania.
  - `stream: "tool"` z `data.phase`, `name`, opcjonalnym `meta`/`args`.
- Etykiety:
  - `exec`: pierwszy wiersz z `args.command`.
  - `read`/`write`: skrócona ścieżka.
  - `edit`: ścieżka plus wywnioskowany rodzaj zmiany z `meta`/liczby różnic.
  - fallback: nazwa narzędzia.

## Nadpisanie debug

- Settings ▸ Debug ▸ wybór „Icon override”:
  - `System (auto)` (domyślnie)
  - `Working: main` (per rodzaj narzędzia)
  - `Working: other` (per rodzaj narzędzia)
  - `Idle`
- Przechowywane przez `@AppStorage("iconOverride")`; mapowane do `IconState.overridden`.

## Lista kontrolna testów

- Wywołaj job sesji main: sprawdź, czy ikona przełącza się natychmiast, a wiersz statusu pokazuje etykietę main.
- Wywołaj job sesji niebędącej main, gdy main jest bezczynna: ikona/status pokazują sesję niebędącą main; pozostaje stabilna aż do zakończenia.
- Uruchom main, gdy aktywna jest inna sesja: ikona natychmiast przełącza się na main.
- Szybkie serie narzędzi: upewnij się, że plakietka nie miga (okres karencji TTL dla wyników narzędzi).
- Wiersz kondycji pojawia się ponownie, gdy wszystkie sesje są bezczynne.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Ikona paska menu](/pl/platforms/mac/icon)
