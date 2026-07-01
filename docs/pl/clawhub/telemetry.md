---
read_when:
    - Prace nad kontrolkami telemetrii / prywatności
    - Pytania dotyczące tego, jakie dane są zbierane
summary: Telemetria instalacji zbierana przez CLI ClawHub i sposób rezygnacji z jej przesyłania.
x-i18n:
    generated_at: "2026-07-01T13:24:40Z"
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

Przy każdym raportowanym `clawhub install` CLI wysyła jedno zdarzenie instalacji na zasadzie best effort.

Zdarzenie obejmuje:

- `slug`: slug zainstalowanej umiejętności.
- `version`: zainstalowaną wersję, jeśli jest znana.

### Czego _nie_ zbieramy

- Żadnych ścieżek folderów ani identyfikatorów pochodzących od folderów.
- Żadnej zawartości plików.
- Żadnych logów z poszczególnych uruchomień, promptów ani innych danych wyjściowych CLI.

## Liczniki instalacji

ClawHub utrzymuje zagregowane liczniki dla każdej umiejętności:

- `installsAllTime`: unikalni użytkownicy, którzy zgłosili co najmniej jedną instalację umiejętności przez CLI.
- `installsCurrent`: unikalni użytkownicy, którzy zgłosili instalację i nie usunęli swojej
  telemetrii.

## Przejrzystość + kontrola użytkownika

Wszyscy widzą tylko **zagregowane liczniki instalacji**.

Usunięcie konta usuwa również Twoje dane telemetryczne.

## Jak wyłączyć telemetrię

Ustaw zmienną środowiskową:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Po jej ustawieniu CLI nie będzie wysyłać telemetrii instalacji.
