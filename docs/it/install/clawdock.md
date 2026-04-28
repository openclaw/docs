---
read_when:
    - Esegui spesso OpenClaw con Docker e vuoi comandi quotidiani più brevi
    - Vuoi un livello helper per dashboard, log, configurazione del token e flussi di pairing
summary: Helper di shell ClawDock per installazioni OpenClaw basate su Docker
title: ClawDock
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T08:45:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock è un piccolo livello di helper shell per installazioni OpenClaw basate su Docker.

Ti offre comandi brevi come `clawdock-start`, `clawdock-dashboard` e `clawdock-fix-token` al posto di invocazioni più lunghe `docker compose ...`.

Se non hai ancora configurato Docker, inizia da [Docker](/it/install/docker).

## Installazione

Usa il percorso helper canonico:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se in precedenza hai installato ClawDock da `scripts/shell-helpers/clawdock-helpers.sh`, reinstalla dal nuovo percorso `scripts/clawdock/clawdock-helpers.sh`. Il vecchio percorso raw GitHub è stato rimosso.

## Cosa ottieni

### Operazioni di base

| Comando | Descrizione |
| ------------------ | ---------------------- |
| `clawdock-start` | Avvia il gateway |
| `clawdock-stop` | Arresta il gateway |
| `clawdock-restart` | Riavvia il gateway |
| `clawdock-status` | Controlla lo stato del container |
| `clawdock-logs` | Segui i log del gateway |

### Accesso al container

| Comando | Descrizione |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell` | Apre una shell dentro il container del gateway |
| `clawdock-cli <command>` | Esegue comandi CLI OpenClaw in Docker |
| `clawdock-exec <command>` | Esegue un comando arbitrario nel container |

### Interfaccia web e pairing

| Comando | Descrizione |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard` | Apre l'URL dell'interfaccia Control |
| `clawdock-devices` | Elenca i pairing dei dispositivi in sospeso |
| `clawdock-approve <id>` | Approva una richiesta di pairing |

### Configurazione e manutenzione

| Comando | Descrizione |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | Configura il token del gateway dentro il container |
| `clawdock-update` | Esegue pull, rebuild e riavvio |
| `clawdock-rebuild` | Ricompila solo l'immagine Docker |
| `clawdock-clean` | Rimuove container e volumi |

### Utilità

| Comando | Descrizione |
| ---------------------- | --------------------------------------- |
| `clawdock-health` | Esegue un controllo di stato del gateway |
| `clawdock-token` | Stampa il token del gateway |
| `clawdock-cd` | Vai alla directory del progetto OpenClaw |
| `clawdock-config` | Apre `~/.openclaw` |
| `clawdock-show-config` | Stampa i file di configurazione con valori redatti |
| `clawdock-workspace` | Apre la directory dello spazio di lavoro |

## Flusso iniziale

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Se il browser dice che è richiesto il pairing:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configurazione e segreti

ClawDock funziona con la stessa suddivisione della configurazione Docker descritta in [Docker](/it/install/docker):

- `<project>/.env` per valori specifici di Docker come nome dell'immagine, porte e token del gateway
- `~/.openclaw/.env` per chiavi provider e token bot supportati da env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` per l'autenticazione provider OAuth/chiave API memorizzata
- `~/.openclaw/openclaw.json` per la configurazione del comportamento

Usa `clawdock-show-config` quando vuoi ispezionare rapidamente i file `.env` e `openclaw.json`. Redige i valori `.env` nell'output stampato.

## Pagine correlate

- [Docker](/it/install/docker)
- [Docker VM Runtime](/it/install/docker-vm-runtime)
- [Aggiornamento](/it/install/updating)
