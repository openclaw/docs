---
read_when:
    - Sie möchten Shell-Completions für zsh/bash/fish/PowerShell
    - Sie müssen Completion-Skripte unter dem OpenClaw-Status zwischenspeichern
summary: CLI-Referenz für `openclaw completion` (Shell-Completion-Skripte generieren/installieren)
title: Completion
x-i18n:
    generated_at: "2026-04-24T06:30:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw completion`

Generieren Sie Shell-Completion-Skripte und installieren Sie sie optional in Ihr Shell-Profil.

## Verwendung

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Optionen

- `-s, --shell <shell>`: Shell-Ziel (`zsh`, `bash`, `powershell`, `fish`; Standard: `zsh`)
- `-i, --install`: Completion installieren, indem eine `source`-Zeile zu Ihrem Shell-Profil hinzugefügt wird
- `--write-state`: Completion-Skript(e) nach `$OPENCLAW_STATE_DIR/completions` schreiben, ohne sie auf stdout auszugeben
- `-y, --yes`: Bestätigungsabfragen für die Installation überspringen

## Hinweise

- `--install` schreibt einen kleinen Block „OpenClaw Completion“ in Ihr Shell-Profil und verweist dabei auf das zwischengespeicherte Skript.
- Ohne `--install` oder `--write-state` gibt der Befehl das Skript auf stdout aus.
- Die Generierung von Completions lädt Befehlsbäume frühzeitig, damit verschachtelte Unterbefehle enthalten sind.

## Verwandt

- [CLI-Referenz](/de/cli)
