---
read_when:
    - Dostrajasz interfejs menu na Macu lub logikę statusu
summary: Logika statusu paska menu i to, co jest pokazywane użytkownikom
title: Pasek menu
x-i18n:
    generated_at: "2026-04-05T13:59:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8eb73c0e671a76aae4ebb653c65147610bf3e6d3c9c0943d150e292e7761d16d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Logika statusu paska menu

## Co jest wyświetlane

- W ikonie paska menu i w pierwszym wierszu statusu w menu pokazujemy bieżący stan pracy agenta.
- Status kondycji jest ukrywany podczas aktywnej pracy; wraca, gdy wszystkie sesje są bezczynne.
- Blok „Nodes” w menu pokazuje tylko **urządzenia** (sparowane nodes przez `node.list`), a nie wpisy klienta/obecności.
- Sekcja „Usage” pojawia się pod Context, gdy dostępne są migawki użycia providerów.

## Model stanu

- Sesje: zdarzenia przychodzą z `runId` (per uruchomienie) oraz `sessionKey` w payloadzie. Sesja „main” to klucz `main`; jeśli go nie ma, wracamy do ostatnio zaktualizowanej sesji.
- Priorytet: main zawsze wygrywa. Jeśli main jest aktywna, jej stan jest pokazywany natychmiast. Jeśli main jest bezczynna, pokazywana jest ostatnio aktywna sesja nie-main. Nie przełączamy się tam i z powrotem w trakcie aktywności; przełączamy dopiero, gdy bieżąca sesja przejdzie w bezczynność albo main stanie się aktywna.
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

- `idle`: zwykły stworek.
- `workingMain`: odznaka z glifem, pełne tint, animacja „pracujących” nóg.
- `workingOther`: odznaka z glifem, przytłumione tint, bez szurania.
- `overridden`: używa wybranego glifu/tint niezależnie od aktywności.

## Tekst wiersza statusu (menu)

- Gdy praca jest aktywna: `<Rola sesji> · <etykieta aktywności>`
  - Przykłady: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- W stanie bezczynności: wraca do podsumowania kondycji.

## Przetwarzanie zdarzeń

- Źródło: zdarzenia `agent` kanału sterowania (`ControlChannel.handleAgentEvent`).
- Parsowane pola:
  - `stream: "job"` z `data.state` dla start/stop.
  - `stream: "tool"` z `data.phase`, `name`, opcjonalnym `meta`/`args`.
- Etykiety:
  - `exec`: pierwsza linia `args.command`.
  - `read`/`write`: skrócona ścieżka.
  - `edit`: ścieżka plus wywnioskowany rodzaj zmiany z `meta`/liczników diff.
  - fallback: nazwa narzędzia.

## Nadpisanie debug

- Settings ▸ Debug ▸ selektor „Icon override”:
  - `System (auto)` (domyślnie)
  - `Working: main` (per rodzaj narzędzia)
  - `Working: other` (per rodzaj narzędzia)
  - `Idle`
- Przechowywane przez `@AppStorage("iconOverride")`; mapowane do `IconState.overridden`.

## Lista kontrolna testów

- Wywołaj job sesji main: sprawdź, czy ikona przełącza się natychmiast i czy wiersz statusu pokazuje etykietę main.
- Wywołaj job sesji nie-main, gdy main jest bezczynna: ikona/status pokazuje nie-main; pozostaje stabilne do końca.
- Uruchom main, gdy aktywna jest inna sesja: ikona natychmiast przełącza się na main.
- Szybkie serie narzędzi: upewnij się, że odznaka nie migocze (okres TTL grace przy wynikach narzędzi).
- Wiersz kondycji pojawia się ponownie, gdy wszystkie sesje są bezczynne.
