---
read_when:
    - Praca nad kontrolami telemetrii / prywatności
    - Pytania o to, jakie dane są zbierane
summary: Telemetria instalacji zbierana przez CLI ClawHub oraz sposób rezygnacji z niej.
x-i18n:
    generated_at: "2026-07-02T08:55:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub używa minimalnej telemetrii CLI do obliczania zagregowanej liczby instalacji.

## Kiedy telemetria jest zbierana

Telemetria jest wysyłana tylko wtedy, gdy:

- Jesteś zalogowany w CLI.
- Uruchamiasz `clawhub install <slug>`.
- Telemetria **nie jest wyłączona** (zobacz „Jak wyłączyć” poniżej).

Jeśli nie jesteś zalogowany, nic nie jest zgłaszane.

## Co zbieramy

Przy każdym zgłoszonym `clawhub install` CLI wysyła jedno zdarzenie instalacji na zasadzie najlepszych starań.

Zdarzenie zawiera:

- `slug`: slug zainstalowanego skill.
- `version`: zainstalowana wersja, jeśli jest znana.

### Czego _nie_ zbieramy

- Brak ścieżek folderów ani identyfikatorów pochodzących z folderów.
- Brak zawartości plików.
- Brak dzienników poszczególnych uruchomień, promptów ani innych danych wyjściowych CLI.

## Liczba instalacji

ClawHub utrzymuje zagregowane liczniki dla każdego skill:

- `installsAllTime`: unikalni użytkownicy, którzy zgłosili co najmniej jedną instalację skill przez CLI.
- `installsCurrent`: unikalni użytkownicy, którzy zgłosili instalację i nie usunęli swojej
  telemetrii.

## Przejrzystość + kontrola użytkownika

Wszyscy widzą tylko **zagregowane liczniki instalacji**.

Usunięcie konta usuwa również dane telemetrii.

## Jak wyłączyć telemetrię

Ustaw zmienną środowiskową:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Po jej ustawieniu CLI nie będzie wysyłać telemetrii instalacji.
