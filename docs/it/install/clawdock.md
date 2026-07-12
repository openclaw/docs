---
read_when:
    - Esegui spesso OpenClaw con Docker e vuoi comandi più brevi per l'uso quotidiano
    - Vuoi un livello di supporto per la dashboard, i log, la configurazione dei token e i flussi di associazione
summary: Helper della shell ClawDock per installazioni di OpenClaw basate su Docker
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T07:07:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock è un piccolo livello di comandi shell ausiliari per le installazioni di OpenClaw basate su Docker.

Fornisce comandi brevi come `clawdock-start`, `clawdock-dashboard` e `clawdock-fix-token` al posto di chiamate `docker compose ...` più lunghe.

Se non hai ancora configurato Docker, inizia da [Docker](/it/install/docker).

## Installazione

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se in precedenza hai installato ClawDock da `scripts/shell-helpers/clawdock-helpers.sh`, reinstallalo dal percorso corrente `scripts/clawdock/clawdock-helpers.sh`; il vecchio percorso raw di GitHub è stato rimosso.

Al primo utilizzo, i comandi ausiliari rilevano automaticamente il checkout di OpenClaw (controllando percorsi comuni come `~/openclaw` e `~/projects/openclaw`) e memorizzano il risultato nella cache in `~/.clawdock/config`. Imposta manualmente `CLAWDOCK_DIR` se il checkout si trova altrove.

## Funzionalità disponibili

### Operazioni di base

| Comando            | Descrizione                       |
| ------------------ | --------------------------------- |
| `clawdock-start`   | Avvia il Gateway                  |
| `clawdock-stop`    | Arresta il Gateway                |
| `clawdock-restart` | Riavvia il Gateway                |
| `clawdock-status`  | Verifica lo stato del container   |
| `clawdock-logs`    | Segue i log del Gateway           |

### Accesso al container

| Comando                   | Descrizione                                        |
| ------------------------- | -------------------------------------------------- |
| `clawdock-shell`          | Apre una shell nel container del Gateway           |
| `clawdock-cli <command>`  | Esegue i comandi della CLI di OpenClaw in Docker   |
| `clawdock-exec <command>` | Esegue un comando arbitrario nel container         |

### Interfaccia web e associazione

| Comando                 | Descrizione                              |
| ----------------------- | ---------------------------------------- |
| `clawdock-dashboard`    | Apre l'URL dell'interfaccia di controllo |
| `clawdock-devices`      | Elenca le associazioni di dispositivi in sospeso |
| `clawdock-approve <id>` | Approva una richiesta di associazione    |

### Configurazione e manutenzione

| Comando              | Descrizione                                                   |
| -------------------- | ------------------------------------------------------------- |
| `clawdock-fix-token` | Scrive il token del Gateway nella configurazione del container |
| `clawdock-update`    | Scarica, ricompila e riavvia                                  |
| `clawdock-rebuild`   | Ricompila solo l'immagine Docker                              |
| `clawdock-clean`     | Rimuove container e volumi                                    |

### Utilità

| Comando                | Descrizione                                             |
| ---------------------- | ------------------------------------------------------- |
| `clawdock-health`      | Esegue un controllo di integrità del Gateway            |
| `clawdock-token`       | Visualizza il token del Gateway                         |
| `clawdock-cd`          | Passa alla directory del progetto OpenClaw              |
| `clawdock-config`      | Apre `~/.openclaw`                                      |
| `clawdock-show-config` | Visualizza i file di configurazione con i valori oscurati |
| `clawdock-workspace`   | Apre la directory dello spazio di lavoro                |
| `clawdock-help`        | Elenca tutti i comandi ClawDock                         |

## Procedura per il primo utilizzo

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Se il browser indica che è necessaria l'associazione:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configurazione e segreti

ClawDock legge due file `.env` distinti, in conformità con la suddivisione descritta in [Docker](/it/install/docker):

- Il file `.env` del progetto accanto a `docker-compose.yml`: valori specifici di Docker, come il nome dell'immagine, le porte e `OPENCLAW_GATEWAY_TOKEN`. `clawdock-token` legge il token da questo file.
- `~/.openclaw/.env` (montato nel container): segreti basati su variabili d'ambiente gestiti direttamente da OpenClaw, insieme a `openclaw.json` e `agents/<agentId>/agent/auth-profiles.json`.

`clawdock-fix-token` copia il token dal file `.env` del progetto nei valori di configurazione `gateway.remote.token` e `gateway.auth.token` del container, quindi riavvia il Gateway.

Usa `clawdock-show-config` per esaminare rapidamente `openclaw.json` ed entrambi i file `.env`; nell'output visualizzato, i valori dei file `.env` vengono oscurati.

## Risorse correlate

<CardGroup cols={2}>
  <Card title="Docker" href="/it/install/docker" icon="docker">
    Installazione Docker canonica per OpenClaw.
  </Card>
  <Card title="Runtime VM Docker" href="/it/install/docker-vm-runtime" icon="cube">
    Runtime VM gestito da Docker per un isolamento rafforzato.
  </Card>
  <Card title="Aggiornamento" href="/it/install/updating" icon="arrow-up-right-from-square">
    Aggiornamento del pacchetto OpenClaw e dei servizi gestiti.
  </Card>
</CardGroup>
