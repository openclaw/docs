---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gestisci gli ambienti di esecuzione sandbox e ispeziona il criterio sandbox effettivo
title: CLI dell'ambiente isolato
x-i18n:
    generated_at: "2026-05-03T21:29:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

Gestisci i runtime sandbox per l'esecuzione isolata degli agenti.

## Panoramica

OpenClaw può eseguire gli agenti in runtime sandbox isolati per sicurezza. I comandi `sandbox` ti aiutano a ispezionare e ricreare questi runtime dopo aggiornamenti o modifiche alla configurazione.

Oggi questo di solito significa:

- container sandbox Docker
- runtime sandbox SSH quando `agents.defaults.sandbox.backend = "ssh"`
- runtime sandbox OpenShell quando `agents.defaults.sandbox.backend = "openshell"`

Per `ssh` e OpenShell `remote`, la ricreazione conta più che con Docker:

- la workspace remota è canonica dopo il seed iniziale
- `openclaw sandbox recreate` elimina quella workspace remota canonica per l'ambito selezionato
- l'uso successivo la sottopone di nuovo a seed dalla workspace locale corrente

## Comandi

### `openclaw sandbox explain`

Ispeziona la modalità, l'ambito, l'accesso alla workspace, la policy degli strumenti sandbox e i gate elevati **effettivi** (con percorsi delle chiavi di configurazione per la correzione).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Elenca tutti i runtime sandbox con il loro stato e la loro configurazione.

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

Per il backend `ssh` core, la ricreazione elimina la radice della workspace remota per ambito
sulla destinazione SSH. L'esecuzione successiva la sottopone di nuovo a seed dalla workspace locale.

### Dopo la modifica di origine, policy o modalità OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Per la modalità OpenShell `remote`, la ricreazione elimina la workspace remota canonica
per quell'ambito. L'esecuzione successiva la sottopone di nuovo a seed dalla workspace locale.

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
- I runtime vengono rimossi solo dopo 24 ore di inattività.
- Gli agenti usati regolarmente mantengono attivi i vecchi runtime a tempo indeterminato.

Usa `openclaw sandbox recreate` per forzare la rimozione dei vecchi runtime. Vengono ricreati automaticamente con le impostazioni correnti quando sono nuovamente necessari.

<Tip>
Preferisci `openclaw sandbox recreate` alla pulizia manuale specifica del backend. Usa il registro dei runtime del Gateway ed evita incongruenze quando cambiano le chiavi di ambito o sessione.
</Tip>

## Migrazione del registro

OpenClaw archivia i metadati dei runtime sandbox come uno shard JSON per ogni voce di container/browser nella directory dello stato sandbox. Le installazioni meno recenti potrebbero avere ancora file legacy monolitici:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Le normali letture dei runtime sandbox non riscrivono quei file. Esegui `openclaw doctor --fix` per migrare le voci legacy valide nelle directory del registro partizionato in shard. I file legacy non validi vengono messi in quarantena, così un vecchio registro difettoso non può nascondere le voci di runtime correnti.

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
- [Doctor](/it/gateway/doctor): controlla la configurazione sandbox.
