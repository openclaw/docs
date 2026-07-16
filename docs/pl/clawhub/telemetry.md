---
read_when:
    - Prace nad telemetrią / mechanizmami kontroli prywatności
    - Pytania dotyczące gromadzonych danych
summary: Dane telemetryczne instalacji zbierane przez CLI ClawHub oraz sposób rezygnacji z ich przesyłania.
x-i18n:
    generated_at: "2026-07-16T18:24:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub używa minimalnej telemetrii CLI do obliczania zagregowanej liczby instalacji.

## Kiedy telemetria jest zbierana

Telemetria jest wysyłana tylko wtedy, gdy:

- Nastąpiło zalogowanie w CLI.
- Uruchomiono `clawhub install <slug>`.
- Telemetria **nie jest wyłączona** (zobacz „Jak wyłączyć telemetrię” poniżej).

Jeśli nie nastąpiło zalogowanie, żadne dane nie są raportowane.

## Jakie dane zbieramy

Przy każdym raportowanym `clawhub install` CLI wysyła jedno zdarzenie instalacji w trybie best effort.

Zdarzenie obejmuje:

- `slug`: identyfikator slug zainstalowanego skillu.
- `version`: zainstalowaną wersję, jeśli jest znana.

### Jakich danych _nie_ zbieramy

- Żadnych ścieżek folderów ani identyfikatorów utworzonych na ich podstawie.
- Żadnej zawartości plików.
- Żadnych dzienników poszczególnych uruchomień, promptów ani innych danych wyjściowych CLI.

## Liczba instalacji

ClawHub przechowuje zagregowane liczniki dla każdego skillu:

- `installsAllTime`: unikalni użytkownicy, którzy zgłosili co najmniej jedną instalację skillu za pomocą CLI.
- `installsCurrent`: unikalni użytkownicy, którzy zgłosili instalację i nie usunęli swoich
  danych telemetrycznych.

## Przejrzystość i kontrola użytkownika

Wszyscy widzą tylko **zagregowane liczniki instalacji**.

Usunięcie konta powoduje również usunięcie danych telemetrycznych.

## Jak wyłączyć telemetrię

Ustaw zmienną środowiskową:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Po jej ustawieniu CLI nie będzie wysyłać telemetrii instalacji.
