---
read_when:
    - Praca nad kontrolami telemetrii / prywatności
    - Pytania dotyczące tego, jakie dane są zbierane
summary: Telemetria instalacji zbierana przez CLI ClawHub oraz sposób rezygnacji z niej.
x-i18n:
    generated_at: "2026-07-03T01:05:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub używa minimalnej telemetrii CLI do obliczania zagregowanych liczników instalacji.

## Kiedy telemetria jest zbierana

Telemetria jest wysyłana tylko wtedy, gdy:

- Jesteś zalogowany w CLI.
- Uruchamiasz `clawhub install <slug>`.
- Telemetria **nie jest wyłączona** (zobacz „Jak wyłączyć” poniżej).

Jeśli nie jesteś zalogowany, nic nie jest raportowane.

## Co zbieramy

Przy każdym raportowanym `clawhub install` CLI wysyła jedno zdarzenie instalacji w trybie best-effort.

Zdarzenie zawiera:

- `slug`: slug zainstalowanej umiejętności.
- `version`: zainstalowana wersja, jeśli jest znana.

### Czego _nie_ zbieramy

- Brak ścieżek folderów ani identyfikatorów pochodzących z folderów.
- Brak zawartości plików.
- Brak dzienników poszczególnych uruchomień, promptów ani innych danych wyjściowych CLI.

## Liczniki instalacji

ClawHub utrzymuje zagregowane liczniki dla każdej umiejętności:

- `installsAllTime`: unikalni użytkownicy, którzy zgłosili co najmniej jedną instalację CLI tej umiejętności.
- `installsCurrent`: unikalni użytkownicy, którzy zgłosili instalację i nie usunęli swoich
  danych telemetrii.

## Przejrzystość + kontrola użytkownika

Wszyscy widzą tylko **zagregowane liczniki instalacji**.

Usunięcie konta usuwa również Twoje dane telemetrii.

## Jak wyłączyć telemetrię

Ustaw zmienną środowiskową:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Po jej ustawieniu CLI nie będzie wysyłać telemetrii instalacji.
