---
read_when:
    - Je wilt shell-aanvullingen voor zsh/bash/fish/PowerShell
    - Je moet voltooiingsscripts cachen onder de OpenClaw-status
summary: CLI-referentie voor `openclaw completion` (scripts voor shell-aanvulling genereren/installeren)
title: Voltooiing
x-i18n:
    generated_at: "2026-04-29T22:31:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Genereer shellcompletion-scripts en installeer ze optioneel in je shellprofiel.

## Gebruik

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Opties

- `-s, --shell <shell>`: doel-shell (`zsh`, `bash`, `powershell`, `fish`; standaard: `zsh`)
- `-i, --install`: installeer completion door een source-regel aan je shellprofiel toe te voegen
- `--write-state`: schrijf completion-script(s) naar `$OPENCLAW_STATE_DIR/completions` zonder naar stdout te printen
- `-y, --yes`: sla bevestigingsprompts voor installatie over

## Opmerkingen

- `--install` schrijft een klein blok "OpenClaw Completion" naar je shellprofiel en laat het verwijzen naar het gecachete script.
- Zonder `--install` of `--write-state` print de opdracht het script naar stdout.
- Completion-generatie laadt opdrachtbomen meteen, zodat geneste subopdrachten worden meegenomen.

## Gerelateerd

- [CLI-naslag](/nl/cli)
