---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gestisci gli ambienti di esecuzione isolati e ispeziona i criteri di isolamento effettivi
title: CLI dell'ambiente isolato
x-i18n:
    generated_at: "2026-04-30T08:44:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

Gestisci runtime sandbox per l'esecuzione isolata degli agenti.

## Panoramica

OpenClaw può eseguire agenti in runtime sandbox isolati per motivi di sicurezza. I comandi `sandbox` ti aiutano a ispezionare e ricreare quei runtime dopo aggiornamenti o modifiche alla configurazione.

Oggi di solito questo significa:

- Contenitori sandbox Docker
- Runtime sandbox SSH quando `agents.defaults.sandbox.backend = "ssh"`
- Runtime sandbox OpenShell quando `agents.defaults.sandbox.backend = "openshell"`

Per `ssh` e OpenShell `remote`, ricreare è più importante che con Docker:

- il workspace remoto è canonico dopo il seed iniziale
- `openclaw sandbox recreate` elimina quel workspace remoto canonico per l'ambito selezionato
- l'uso successivo lo inizializza di nuovo dal workspace locale corrente

## Comandi

### `openclaw sandbox explain`

Ispeziona la modalità, l'ambito e l'accesso al workspace sandbox **effettivi**, la policy degli strumenti sandbox e i gate elevati (con percorsi delle chiavi di configurazione per la correzione).

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
- Etichetta della configurazione e se corrisponde alla configurazione corrente
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

- `--all`: Ricrea tutti i contenitori sandbox
- `--session <key>`: Ricrea il contenitore per una sessione specifica
- `--agent <id>`: Ricrea i contenitori per un agente specifico
- `--browser`: Ricrea solo i contenitori del browser
- `--force`: Salta la richiesta di conferma

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

### Dopo la modifica della destinazione SSH o del materiale di autenticazione SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Per il backend principale `ssh`, la ricreazione elimina la radice del workspace remoto per ambito
sulla destinazione SSH. L'esecuzione successiva la inizializza di nuovo dal workspace locale.

### Dopo la modifica della sorgente, della policy o della modalità di OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Per la modalità OpenShell `remote`, la ricreazione elimina il workspace remoto canonico
per quell'ambito. L'esecuzione successiva lo inizializza di nuovo dal workspace locale.

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

- I runtime esistenti continuano a essere eseguiti con le vecchie impostazioni.
- I runtime vengono rimossi solo dopo 24 ore di inattività.
- Gli agenti usati regolarmente mantengono attivi i vecchi runtime a tempo indefinito.

Usa `openclaw sandbox recreate` per forzare la rimozione dei vecchi runtime. Vengono ricreati automaticamente con le impostazioni correnti quando servono di nuovo.

<Tip>
Preferisci `openclaw sandbox recreate` alla pulizia manuale specifica del backend. Usa il registro dei runtime del Gateway ed evita disallineamenti quando cambiano l'ambito o le chiavi di sessione.
</Tip>

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
- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Doctor](/it/gateway/doctor): verifica la configurazione sandbox.
