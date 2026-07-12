---
read_when:
    - Je wilt shell-aanvullingen voor zsh/bash/fish/PowerShell
    - Je moet scripts voor automatische aanvulling cachen in de OpenClaw-statusopslag
summary: CLI-referentie voor `openclaw completion` (scripts voor shell-aanvulling genereren/installeren)
title: Voltooiing
x-i18n:
    generated_at: "2026-07-12T08:40:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Genereer shell-aanvullingsscripts, sla ze op in de cache onder de OpenClaw-status en installeer ze desgewenst in je shellprofiel.

## Gebruik

```bash
openclaw completion                          # print zsh script to stdout
openclaw completion --shell fish             # print fish script
openclaw completion --write-state            # cache scripts for all shells
openclaw completion --write-state --install  # cache, then install in one step
openclaw completion --shell bash --write-state
```

## Opties

- `-s, --shell <shell>`: doelshell (`zsh`, `bash`, `powershell`, `fish`; standaard: `zsh`)
- `-i, --install`: installeer aanvulling door een bronregel voor het gecachte script aan je shellprofiel toe te voegen
- `--write-state`: schrijf aanvullingsscript(s) naar `$OPENCLAW_STATE_DIR/completions` (standaard `~/.openclaw/completions`) zonder ze naar stdout te schrijven; met `--shell` wordt alleen voor die shell geschreven, anders voor alle vier
- `-y, --yes`: sla bevestigingsvragen voor de installatie over (niet-interactief)

## Installatieproces

`--install` laat je profiel naar het gecachte script verwijzen, dus de cache moet eerst bestaan: als deze ontbreekt, mislukt de opdracht en wordt aangegeven dat je `openclaw completion --write-state` moet uitvoeren. Combineer `--write-state --install` om beide in één stap uit te voeren. Zonder `--shell` detecteert `--install` de shell via `$SHELL` (met zsh als terugvaloptie).

De installatie schrijft een klein blok met `# OpenClaw Completion` naar je shellprofiel en vervangt eventuele oudere, trage regels met `source <(openclaw completion ...)` door de gecachte bronregel:

| Shell      | Profiel                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (valt terug op `~/.bash_profile` wanneer `~/.bashrc` ontbreekt)                                                                                                                |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (op Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`, of `Documents/WindowsPowerShell/...` voor Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## Opmerkingen

- Zonder `--install` of `--write-state` schrijft de opdracht het script naar stdout.
- Bij het genereren van aanvullingen wordt de volledige opdrachtstructuur direct geladen, inclusief CLI-opdrachten van Plugins, zodat geneste subopdrachten worden opgenomen.
- `openclaw update` vernieuwt de aanvullingscache automatisch na een geslaagde update; `openclaw doctor` kan ontbrekende of verouderde aanvullingsconfiguraties herstellen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
