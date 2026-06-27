---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gestisci i runtime sandbox e ispeziona la policy sandbox effettiva
title: CLI sandbox
x-i18n:
    generated_at: "2026-06-27T17:21:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

Gestisci i runtime sandbox per l'esecuzione isolata degli agenti.

## Panoramica

OpenClaw può eseguire agenti in runtime sandbox isolati per sicurezza. I comandi `sandbox` ti aiutano a ispezionare e ricreare questi runtime dopo aggiornamenti o modifiche di configurazione.

Oggi questo di solito significa:

- Container sandbox Docker
- Runtime sandbox SSH quando `agents.defaults.sandbox.backend = "ssh"`
- Runtime sandbox OpenShell quando `agents.defaults.sandbox.backend = "openshell"`

Per `ssh` e OpenShell `remote`, la ricreazione è più importante che con Docker:

- l'area di lavoro remota è canonica dopo il seed iniziale
- `openclaw sandbox recreate` elimina quell'area di lavoro remota canonica per l'ambito selezionato
- l'uso successivo la inizializza di nuovo dall'area di lavoro locale corrente

## Comandi

### `openclaw sandbox explain`

Ispeziona la modalità, l'ambito e l'accesso all'area di lavoro sandbox **effettivi**, la policy degli strumenti sandbox e i gate elevati (con percorsi delle chiavi di configurazione per la correzione).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Elenca tutti i runtime sandbox con il relativo stato e la configurazione.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**L'output include:**

- Nome e stato del runtime
- Backend (`docker`, `openshell`, ecc.)
- Etichetta di configurazione e se corrisponde alla configurazione corrente
- Età (tempo dalla creazione)
- Tempo di inattività (tempo dall'ultimo utilizzo)
- Sessione/agente associato

### `openclaw sandbox recreate`

Rimuovi i runtime sandbox per forzarne la ricreazione con la configurazione aggiornata.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Opzioni:**

- `--all`: ricrea tutti i container sandbox
- `--session <key>`: ricrea il container per una sessione specifica
- `--agent <id>`: ricrea i container per un agente specifico
- `--browser`: ricrea solo i container del browser
- `--force`: salta la richiesta di conferma

<Note>
I runtime vengono ricreati automaticamente al successivo utilizzo dell'agente.
</Note>

## Casi d'uso

### Dopo l'aggiornamento di un'immagine Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Dopo la modifica della configurazione sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Dopo la modifica del target SSH o del materiale di autenticazione SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Per il backend `ssh` core, la ricreazione elimina la radice dell'area di lavoro remota per ambito
sul target SSH. L'esecuzione successiva la inizializza di nuovo dall'area di lavoro locale.

### Dopo la modifica della sorgente, della policy o della modalità OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Per la modalità OpenShell `remote`, la ricreazione elimina l'area di lavoro remota canonica
per quell'ambito. L'esecuzione successiva la inizializza di nuovo dall'area di lavoro locale.

### Dopo la modifica di setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Solo per un agente specifico

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Perché è necessario

Quando aggiorni la configurazione sandbox:

- I runtime esistenti continuano a funzionare con le vecchie impostazioni.
- I runtime vengono eliminati solo dopo 24 ore di inattività.
- Gli agenti usati regolarmente mantengono vivi i vecchi runtime a tempo indefinito.

Usa `openclaw sandbox recreate` per forzare la rimozione dei vecchi runtime. Verranno ricreati automaticamente con le impostazioni correnti quando saranno di nuovo necessari.

<Tip>
Preferisci `openclaw sandbox recreate` alla pulizia manuale specifica del backend. Usa il registro dei runtime del Gateway ed evita disallineamenti quando cambiano l'ambito o le chiavi di sessione.
</Tip>

## Migrazione del registro

OpenClaw archivia i metadati dei runtime sandbox nel database di stato SQLite condiviso. Le installazioni più vecchie potrebbero avere ancora file di registro sandbox legacy:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Alcuni aggiornamenti potrebbero anche avere uno shard JSON per container/browser sotto `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`. Le normali letture dei runtime sandbox non riscrivono queste sorgenti legacy. Esegui `openclaw doctor --fix` per migrare le voci legacy valide in SQLite. I file legacy non validi vengono messi in quarantena, così un vecchio registro difettoso non può nascondere le voci di runtime correnti.

## Configurazione

Le impostazioni sandbox si trovano in `~/.openclaw/openclaw.json` sotto `agents.defaults.sandbox` (gli override per agente vanno in `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Sandboxing](/it/gateway/sandboxing)
- [Area di lavoro dell'agente](/it/concepts/agent-workspace)
- [Doctor](/it/gateway/doctor): controlla la configurazione sandbox.
