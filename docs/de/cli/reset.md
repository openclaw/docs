---
read_when:
    - Sie möchten den lokalen Zustand löschen, während die CLI installiert bleibt
    - Sie möchten einen Probelauf durchführen, um zu sehen, was entfernt würde.
summary: CLI-Referenz für `openclaw reset` (lokalen Zustand/lokale Konfiguration zurücksetzen)
title: Zurücksetzen
x-i18n:
    generated_at: "2026-07-12T01:33:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Setzt die lokale Konfiguration und den lokalen Zustand zurück (die CLI bleibt installiert).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Optionen

- `--scope <scope>`: `config`, `config+creds+sessions` oder `full`
- `--yes`: Bestätigungsabfragen überspringen
- `--non-interactive`: Eingabeaufforderungen deaktivieren; erfordert `--scope` und `--yes`
- `--dry-run`: Aktionen ausgeben, ohne Dateien zu entfernen

## Bereiche

| Bereich                 | Entfernt                                                                                                              | Stoppt zuerst den Gateway |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `config`                | nur die Konfigurationsdatei                                                                                           | nein                      |
| `config+creds+sessions` | Konfigurationsdatei, OAuth-/Anmeldedatenverzeichnis und sitzungsspezifische Verzeichnisse pro Agent                   | ja                        |
| `full`                  | Zustandsverzeichnis (einschließlich Konfiguration/Anmeldedaten, falls darin verschachtelt) sowie Arbeitsbereichsverzeichnisse und Arbeitsbereichsattestierungen | ja                        |

`config+creds+sessions` und `full` stoppen einen laufenden verwalteten Gateway-Dienst, bevor sie den Zustand löschen.

## Hinweise

- Führen Sie zuerst `openclaw backup create` aus, um vor dem Entfernen des lokalen Zustands einen wiederherstellbaren Snapshot zu erstellen.
- Ohne `--scope` fragt `openclaw reset` interaktiv nach dem zu entfernenden Bereich.
- `--non-interactive` ist nur gültig, wenn sowohl `--scope` als auch `--yes` festgelegt sind.
- `config+creds+sessions` und `full` geben nach Abschluss `Next: openclaw onboard --install-daemon` aus.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
