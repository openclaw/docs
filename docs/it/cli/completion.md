---
read_when:
    - Vuoi completamenti della shell per zsh/bash/fish/PowerShell
    - Devi memorizzare nella cache gli script di completamento sotto lo stato di OpenClaw
summary: Riferimento CLI per `openclaw completion` (generare/installare script di completamento della shell)
title: Completamento
x-i18n:
    generated_at: "2026-04-24T08:33:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Genera script di completamento della shell e facoltativamente li installa nel profilo della shell.

## Utilizzo

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Opzioni

- `-s, --shell <shell>`: target shell (`zsh`, `bash`, `powershell`, `fish`; predefinito: `zsh`)
- `-i, --install`: installa il completamento aggiungendo una riga source al profilo della shell
- `--write-state`: scrive gli script di completamento in `$OPENCLAW_STATE_DIR/completions` senza stamparli su stdout
- `-y, --yes`: salta le richieste di conferma per l'installazione

## Note

- `--install` scrive un piccolo blocco "OpenClaw Completion" nel profilo della shell e lo punta allo script memorizzato nella cache.
- Senza `--install` o `--write-state`, il comando stampa lo script su stdout.
- La generazione del completamento carica in modo eager gli alberi dei comandi così che siano inclusi i sottocomandi annidati.

## Correlati

- [Riferimento CLI](/it/cli)
