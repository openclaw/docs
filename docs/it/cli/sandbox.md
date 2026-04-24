---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gestire i runtime sandbox e ispezionare i criteri sandbox effettivi
title: CLI Sandbox
x-i18n:
    generated_at: "2026-04-24T08:34:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

Gestire i runtime sandbox per l'esecuzione isolata degli agenti.

## Panoramica

OpenClaw può eseguire gli agenti in runtime sandbox isolati per motivi di sicurezza. I comandi `sandbox` ti aiutano a ispezionare e ricreare questi runtime dopo aggiornamenti o modifiche di configurazione.

Oggi questo di solito significa:

- contenitori sandbox Docker
- runtime sandbox SSH quando `agents.defaults.sandbox.backend = "ssh"`
- runtime sandbox OpenShell quando `agents.defaults.sandbox.backend = "openshell"`

Per `ssh` e OpenShell `remote`, la ricreazione è più importante che con Docker:

- il workspace remoto è canonico dopo il seed iniziale
- `openclaw sandbox recreate` elimina quel workspace remoto canonico per l'ambito selezionato
- all'uso successivo viene eseguito di nuovo il seed dal workspace locale corrente

## Comandi

### `openclaw sandbox explain`

Ispeziona la modalità/l'ambito/l'accesso al workspace sandbox **effettivi**, i criteri degli strumenti sandbox e i gate elevati (con i percorsi delle chiavi di configurazione per la correzione).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Elenca tutti i runtime sandbox con il loro stato e la configurazione.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Elenca solo i contenitori browser
openclaw sandbox list --json     # Output JSON
```

**L'output include:**

- Nome e stato del runtime
- Backend (`docker`, `openshell`, ecc.)
- Etichetta di configurazione e se corrisponde alla configurazione corrente
- Età (tempo dalla creazione)
- Tempo di inattività (tempo dall'ultimo utilizzo)
- Sessione/agente associato

### `openclaw sandbox recreate`

Rimuove i runtime sandbox per forzarne la ricreazione con la configurazione aggiornata.

```bash
openclaw sandbox recreate --all                # Ricrea tutti i contenitori
openclaw sandbox recreate --session main       # Sessione specifica
openclaw sandbox recreate --agent mybot        # Agente specifico
openclaw sandbox recreate --browser            # Solo contenitori browser
openclaw sandbox recreate --all --force        # Salta la conferma
```

**Opzioni:**

- `--all`: ricrea tutti i contenitori sandbox
- `--session <key>`: ricrea il contenitore per una sessione specifica
- `--agent <id>`: ricrea i contenitori per un agente specifico
- `--browser`: ricrea solo i contenitori browser
- `--force`: salta la richiesta di conferma

**Importante:** i runtime vengono ricreati automaticamente al successivo utilizzo dell'agente.

## Casi d'uso

### Dopo l'aggiornamento di un'immagine Docker

```bash
# Scarica la nuova immagine
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Aggiorna la configurazione per usare la nuova immagine
# Modifica la configurazione: agents.defaults.sandbox.docker.image (o agents.list[].sandbox.docker.image)

# Ricrea i contenitori
openclaw sandbox recreate --all
```

### Dopo una modifica della configurazione sandbox

```bash
# Modifica la configurazione: agents.defaults.sandbox.* (o agents.list[].sandbox.*)

# Ricrea per applicare la nuova configurazione
openclaw sandbox recreate --all
```

### Dopo una modifica della destinazione SSH o del materiale di autenticazione SSH

```bash
# Modifica la configurazione:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Per il backend core `ssh`, la ricreazione elimina la root del workspace remoto per ambito
nella destinazione SSH. L'esecuzione successiva esegue di nuovo il seed dal workspace locale.

### Dopo una modifica della sorgente, dei criteri o della modalità di OpenShell

```bash
# Modifica la configurazione:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Per la modalità OpenShell `remote`, la ricreazione elimina il workspace remoto canonico
per quell'ambito. L'esecuzione successiva esegue di nuovo il seed dal workspace locale.

### Dopo una modifica di setupCommand

```bash
openclaw sandbox recreate --all
# oppure solo per un agente:
openclaw sandbox recreate --agent family
```

### Solo per un agente specifico

```bash
# Aggiorna solo i contenitori di un agente
openclaw sandbox recreate --agent alfred
```

## Perché è necessario?

**Problema:** quando aggiorni la configurazione sandbox:

- i runtime esistenti continuano a essere eseguiti con le vecchie impostazioni
- i runtime vengono rimossi solo dopo 24 ore di inattività
- gli agenti usati regolarmente mantengono in vita i vecchi runtime indefinitamente

**Soluzione:** usa `openclaw sandbox recreate` per forzare la rimozione dei vecchi runtime. Verranno ricreati automaticamente con le impostazioni correnti quando serviranno di nuovo.

Suggerimento: preferisci `openclaw sandbox recreate` invece della pulizia manuale specifica del backend.
Usa il registro dei runtime del Gateway ed evita discrepanze quando cambiano chiavi di ambito/sessione.

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
          // ... altre opzioni Docker
        },
        "prune": {
          "idleHours": 24, // Rimozione automatica dopo 24 ore di inattività
          "maxAgeDays": 7, // Rimozione automatica dopo 7 giorni
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
- [Doctor](/it/gateway/doctor) — controlla la configurazione sandbox
