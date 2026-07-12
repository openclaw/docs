---
read_when:
    - Prace nad telemetrią / mechanizmami kontroli prywatności
    - Pytania dotyczące gromadzonych danych
summary: Dane telemetryczne dotyczące instalacji zbierane przez CLI ClawHub oraz sposób rezygnacji z ich przesyłania.
x-i18n:
    generated_at: "2026-07-12T14:59:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub korzysta z minimalnej telemetrii CLI do obliczania zbiorczych liczb instalacji.

## Kiedy telemetria jest zbierana

Telemetria jest wysyłana tylko wtedy, gdy:

- Użytkownik jest zalogowany w CLI.
- Użytkownik uruchamia `clawhub install <slug>`.
- Telemetria **nie jest wyłączona** (zobacz „Jak wyłączyć telemetrię” poniżej).

Jeśli użytkownik nie jest zalogowany, żadne dane nie są przesyłane.

## Jakie dane zbieramy

Przy każdym raportowanym wywołaniu `clawhub install` CLI podejmuje jedną próbę wysłania zdarzenia instalacji.

Zdarzenie obejmuje:

- `slug`: identyfikator slug zainstalowanej umiejętności.
- `version`: zainstalowaną wersję, jeśli jest znana.

### Czego _nie_ zbieramy

- Ścieżek folderów ani identyfikatorów utworzonych na ich podstawie.
- Zawartości plików.
- Dzienników poszczególnych uruchomień, promptów ani innych danych wyjściowych CLI.

## Liczby instalacji

ClawHub przechowuje zbiorcze liczniki dla poszczególnych umiejętności:

- `installsAllTime`: unikalni użytkownicy, którzy zgłosili co najmniej jedną instalację umiejętności za pomocą CLI.
- `installsCurrent`: unikalni użytkownicy, którzy zgłosili instalację i nie usunęli swoich
  danych telemetrycznych.

## Przejrzystość i kontrola użytkownika

Wszyscy widzą wyłącznie **zbiorcze liczniki instalacji**.

Usunięcie konta powoduje również usunięcie danych telemetrycznych użytkownika.

## Jak wyłączyć telemetrię

Ustaw zmienną środowiskową:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Po jej ustawieniu CLI nie będzie wysyłać telemetrii instalacji.
