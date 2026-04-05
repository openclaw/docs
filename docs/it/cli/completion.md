---
read_when:
    - Vuoi i completamenti della shell per zsh/bash/fish/PowerShell
    - Devi memorizzare nella cache gli script di completamento nello stato di OpenClaw
summary: Riferimento CLI per `openclaw completion` (generare/installare script di completamento della shell)
title: completion
x-i18n:
    generated_at: "2026-04-05T13:47:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Genera script di completamento della shell e, facoltativamente, li installa nel profilo della tua shell.

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

- `-s, --shell <shell>`: shell di destinazione (`zsh`, `bash`, `powershell`, `fish`; predefinita: `zsh`)
- `-i, --install`: installa il completamento aggiungendo una riga source al profilo della tua shell
- `--write-state`: scrive gli script di completamento in `$OPENCLAW_STATE_DIR/completions` senza stamparli su stdout
- `-y, --yes`: salta i prompt di conferma dell'installazione

## Note

- `--install` scrive un piccolo blocco "OpenClaw Completion" nel profilo della tua shell e lo punta allo script memorizzato nella cache.
- Senza `--install` o `--write-state`, il comando stampa lo script su stdout.
- La generazione del completamento carica in modo eager gli alberi dei comandi così da includere i sottocomandi nidificati.
