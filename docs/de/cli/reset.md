---
read_when:
    - Sie möchten den lokalen Status löschen und dabei die CLI installiert lassen
    - Sie möchten einen Dry-Run dessen, was entfernt würde
summary: CLI-Referenz für `openclaw reset` (lokalen Status/Konfiguration zurücksetzen)
title: Reset
x-i18n:
    generated_at: "2026-04-24T06:32:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw reset`

Lokale Konfiguration/Status zurücksetzen (die CLI bleibt installiert).

Optionen:

- `--scope <scope>`: `config`, `config+creds+sessions` oder `full`
- `--yes`: Bestätigungsabfragen überspringen
- `--non-interactive`: Eingabeaufforderungen deaktivieren; erfordert `--scope` und `--yes`
- `--dry-run`: Aktionen ausgeben, ohne Dateien zu entfernen

Beispiele:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Hinweise:

- Führen Sie zuerst `openclaw backup create` aus, wenn Sie vor dem Entfernen des lokalen Status einen wiederherstellbaren Snapshot möchten.
- Wenn Sie `--scope` weglassen, verwendet `openclaw reset` eine interaktive Eingabeaufforderung, um auszuwählen, was entfernt werden soll.
- `--non-interactive` ist nur gültig, wenn sowohl `--scope` als auch `--yes` gesetzt sind.

## Verwandt

- [CLI-Referenz](/de/cli)
