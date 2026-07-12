---
read_when:
    - Ręczne inicjowanie przestrzeni roboczej
summary: Szablon obszaru roboczego dla HEARTBEAT.md
title: Szablon HEARTBEAT.md
x-i18n:
    generated_at: "2026-07-12T15:35:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Szablon HEARTBEAT.md

Plik `HEARTBEAT.md` znajduje się w przestrzeni roboczej agenta i zawiera listę kontrolną okresowych Heartbeatów. Pozostaw go pustym albo zawierającym wyłącznie białe znaki, komentarze Markdown, nagłówki ATX, puste elementy list (`- `, `* [ ]`) lub znaczniki bloków kodu, aby OpenClaw całkowicie pomijał wywołanie modelu Heartbeat (`reason=empty-heartbeat-file`).

Domyślna dostarczana zawartość:

```markdown
<!-- Szablon Heartbeat; zawartość składająca się wyłącznie z komentarzy zapobiega zaplanowanym wywołaniom API Heartbeat. -->

# Pozostaw ten plik pusty (lub zawierający wyłącznie komentarze), aby pominąć wywołania API Heartbeat.

# Dodaj zadania poniżej, gdy chcesz, aby agent okresowo coś sprawdzał.
```

Dodawaj krótkie zadania poniżej wierszy komentarzy tylko wtedy, gdy potrzebujesz okresowych kontroli. Zachowaj zwięzłość: przy każdym takcie Heartbeat odczytuje ten plik (domyślnie co 30 minut), więc rozbudowane instrukcje zużywają tokeny przy każdym wybudzeniu.

Aby zamiast zwykłej listy kontrolnej wykonywać wyłącznie zadania, których termin przypada w danym momencie, użyj ustrukturyzowanego bloku `tasks:` z polami `interval` i `prompt` dla każdego zadania; format i sposób działania opisano w sekcji [HEARTBEAT.md](/pl/gateway/heartbeat#heartbeatmd-optional).

## Powiązane

- [Heartbeat](/pl/gateway/heartbeat)
- [Konfiguracja Heartbeat](/pl/gateway/config-agents)
