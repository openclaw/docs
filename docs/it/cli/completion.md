---
read_when:
    - Vuoi il completamento automatico della shell per zsh/bash/fish/PowerShell
    - È necessario memorizzare nella cache gli script di completamento nello stato di OpenClaw
summary: Riferimento CLI per `openclaw completion` (generazione/installazione degli script di completamento della shell)
title: Completamento
x-i18n:
    generated_at: "2026-07-12T06:54:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Genera script di completamento per la shell, li memorizza nella cache dello stato di OpenClaw e, facoltativamente, li installa nel profilo della shell.

## Utilizzo

```bash
openclaw completion                          # stampa lo script zsh sullo standard output
openclaw completion --shell fish             # stampa lo script fish
openclaw completion --write-state            # memorizza nella cache gli script per tutte le shell
openclaw completion --write-state --install  # memorizza nella cache, quindi installa in un solo passaggio
openclaw completion --shell bash --write-state
```

## Opzioni

- `-s, --shell <shell>`: shell di destinazione (`zsh`, `bash`, `powershell`, `fish`; predefinita: `zsh`)
- `-i, --install`: installa il completamento aggiungendo al profilo della shell una riga che carica lo script memorizzato nella cache
- `--write-state`: scrive gli script di completamento in `$OPENCLAW_STATE_DIR/completions` (valore predefinito: `~/.openclaw/completions`) senza stamparli sullo standard output; con `--shell` scrive solo quello per la shell specificata, altrimenti tutti e quattro
- `-y, --yes`: ignora le richieste di conferma dell'installazione (modalità non interattiva)

## Flusso di installazione

`--install` configura il profilo affinché utilizzi lo script memorizzato nella cache, quindi la cache deve già esistere: se manca, il comando non riesce e indica di eseguire `openclaw completion --write-state`. Combina `--write-state --install` per eseguire entrambe le operazioni in un solo passaggio. Senza `--shell`, `--install` rileva la shell da `$SHELL` (con ripiego su zsh).

L'installazione scrive un piccolo blocco `# OpenClaw Completion` nel profilo della shell e sostituisce eventuali righe obsolete e lente `source <(openclaw completion ...)` con la riga che carica lo script memorizzato nella cache:

| Shell      | Profilo                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (utilizza `~/.bash_profile` come ripiego quando `~/.bashrc` non è presente)                                                                                                    |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (su Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`, oppure `Documents/WindowsPowerShell/...` per Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## Note

- Senza `--install` o `--write-state`, il comando stampa lo script sullo standard output.
- La generazione del completamento carica immediatamente l'intero albero dei comandi, inclusi i comandi CLI dei Plugin, quindi sono inclusi anche i sottocomandi annidati.
- `openclaw update` aggiorna automaticamente la cache del completamento dopo un aggiornamento riuscito; `openclaw doctor` può riparare configurazioni di completamento mancanti o obsolete.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
