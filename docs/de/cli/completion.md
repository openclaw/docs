---
read_when:
    - Sie möchten Shell-Vervollständigungen für zsh/bash/fish/PowerShell.
    - Sie müssen Skripte für die Shell-Vervollständigung im OpenClaw-Zustand zwischenspeichern.
summary: CLI-Referenz für `openclaw completion` (Shell-Vervollständigungsskripte generieren/installieren)
title: Abschluss
x-i18n:
    generated_at: "2026-07-24T04:17:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Generieren Sie Shell-Vervollständigungsskripte, speichern Sie sie im OpenClaw-Status zwischen und installieren Sie sie optional in Ihrem Shell-Profil.

## Verwendung

```bash
openclaw completion                          # zsh-Skript auf stdout ausgeben
openclaw completion --shell fish             # fish-Skript ausgeben
openclaw completion --write-state            # Skripte für alle Shells zwischenspeichern
openclaw completion --write-state --install  # zwischenspeichern, dann in einem Schritt installieren
openclaw completion --shell bash --write-state
```

## Optionen

- `-s, --shell <shell>`: Ziel-Shell (`zsh`, `bash`, `powershell`, `fish`; Standard: `zsh`)
- `-i, --install`: Vervollständigung installieren, indem dem Shell-Profil eine Source-Zeile für das zwischengespeicherte Skript hinzugefügt wird
- `--write-state`: Vervollständigungsskript(e) nach `$OPENCLAW_STATE_DIR/completions` schreiben (Standard: `~/.openclaw/completions`), ohne sie auf stdout auszugeben; mit `--shell` wird nur für diese Shell geschrieben, andernfalls für alle vier
- `-y, --yes`: Bestätigungsaufforderungen bei der Installation überspringen (nicht interaktiv)

## Installationsablauf

`--install` verweist Ihr Profil auf das zwischengespeicherte Skript, daher muss der Cache zuerst vorhanden sein: Fehlt er, schlägt der Befehl fehl und fordert Sie auf, `openclaw completion --write-state` auszuführen. Kombinieren Sie `--write-state --install`, um beides in einem Schritt auszuführen. Ohne `--shell` erkennt `--install` die Shell anhand von `$SHELL` (mit zsh als Fallback).

Bei der Installation wird ein kleiner `# OpenClaw Completion`-Block in Ihr Shell-Profil geschrieben und jede ältere langsame `source <(openclaw completion ...)`-Zeile durch die zwischengespeicherte Source-Zeile ersetzt:

| Shell      | Profil                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (verwendet ersatzweise `~/.bash_profile`, wenn `~/.bashrc` fehlt)                                                                                              |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                                        |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (unter Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1` oder `Documents/WindowsPowerShell/...` für Windows PowerShell)                                                                                      |
| zsh        | `~/.zshrc`                                                                                                                                                                        |

## Hinweise

- Ohne `--install` oder `--write-state` gibt der Befehl das Skript auf stdout aus.
- Bei der Generierung der Vervollständigung wird der vollständige Befehlsbaum einschließlich der CLI-Befehle von Plugins vorab geladen, sodass verschachtelte Unterbefehle enthalten sind.
- `openclaw update` aktualisiert den Vervollständigungs-Cache nach einem erfolgreichen Update automatisch; `openclaw doctor` kann fehlende oder veraltete Vervollständigungskonfigurationen reparieren.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
