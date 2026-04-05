---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gestire i runtime sandbox e ispezionare la policy sandbox effettiva
title: CLI Sandbox
x-i18n:
    generated_at: "2026-04-05T13:48:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa2783037da2901316108d35e04bb319d5d57963c2764b9146786b3c6474b48a
    source_path: cli/sandbox.md
    workflow: 15
---

# CLI Sandbox

Gestisci i runtime sandbox per l'esecuzione isolata degli agenti.

## Panoramica

OpenClaw può eseguire agenti in runtime sandbox isolati per motivi di sicurezza. I comandi `sandbox` ti aiutano a ispezionare e ricreare questi runtime dopo aggiornamenti o modifiche di configurazione.

Oggi questo di solito significa:

- container sandbox Docker
- runtime sandbox SSH quando `agents.defaults.sandbox.backend = "ssh"`
- runtime sandbox OpenShell quando `agents.defaults.sandbox.backend = "openshell"`

Per `ssh` e OpenShell `remote`, la ricreazione è più importante rispetto a Docker:

- il workspace remoto è canonico dopo il seeding iniziale
- `openclaw sandbox recreate` elimina quel workspace remoto canonico per l'ambito selezionato
- l'utilizzo successivo esegue nuovamente il seeding dal workspace locale corrente

## Comandi

### `openclaw sandbox explain`

Ispeziona la modalità/l'ambito/l'accesso al workspace sandbox **effettivi**, la policy degli strumenti sandbox e i gate elevati (con i percorsi delle chiavi config per la correzione).

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
openclaw sandbox list --browser  # Elenca solo i container browser
openclaw sandbox list --json     # Output JSON
```

**L'output include:**

- Nome e stato del runtime
- Backend (`docker`, `openshell`, ecc.)
- Etichetta config e se corrisponde alla config corrente
- Età (tempo dalla creazione)
- Tempo di inattività (tempo dall'ultimo utilizzo)
- Sessione/agente associato

### `openclaw sandbox recreate`

Rimuove i runtime sandbox per forzarne la ricreazione con la config aggiornata.

```bash
openclaw sandbox recreate --all                # Ricrea tutti i container
openclaw sandbox recreate --session main       # Sessione specifica
openclaw sandbox recreate --agent mybot        # Agente specifico
openclaw sandbox recreate --browser            # Solo container browser
openclaw sandbox recreate --all --force        # Salta la conferma
```

**Opzioni:**

- `--all`: ricrea tutti i container sandbox
- `--session <key>`: ricrea il container per una sessione specifica
- `--agent <id>`: ricrea i container per un agente specifico
- `--browser`: ricrea solo i container browser
- `--force`: salta il prompt di conferma

**Importante:** i runtime vengono ricreati automaticamente al successivo utilizzo dell'agente.

## Casi d'uso

### Dopo aver aggiornato un'immagine Docker

```bash
# Scarica la nuova immagine
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Aggiorna la config per usare la nuova immagine
# Modifica config: agents.defaults.sandbox.docker.image (oppure agents.list[].sandbox.docker.image)

# Ricrea i container
openclaw sandbox recreate --all
```

### Dopo aver modificato la configurazione sandbox

```bash
# Modifica config: agents.defaults.sandbox.* (oppure agents.list[].sandbox.*)

# Ricrea per applicare la nuova config
openclaw sandbox recreate --all
```

### Dopo aver modificato il target SSH o il materiale auth SSH

```bash
# Modifica config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Per il backend `ssh` core, la ricreazione elimina la root del workspace remoto per ambito
sul target SSH. L'esecuzione successiva esegue nuovamente il seeding dal workspace locale.

### Dopo aver modificato source, policy o mode di OpenShell

```bash
# Modifica config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Per la modalità OpenShell `remote`, la ricreazione elimina il workspace remoto canonico
per quell'ambito. L'esecuzione successiva esegue nuovamente il seeding dal workspace locale.

### Dopo aver modificato setupCommand

```bash
openclaw sandbox recreate --all
# oppure solo un agente:
openclaw sandbox recreate --agent family
```

### Solo per un agente specifico

```bash
# Aggiorna solo i container di un agente
openclaw sandbox recreate --agent alfred
```

## Perché è necessario?

**Problema:** quando aggiorni la configurazione sandbox:

- i runtime esistenti continuano a funzionare con le vecchie impostazioni
- i runtime vengono rimossi solo dopo 24 ore di inattività
- gli agenti usati regolarmente mantengono attivi indefinitamente i vecchi runtime

**Soluzione:** usa `openclaw sandbox recreate` per forzare la rimozione dei vecchi runtime. Verranno ricreati automaticamente con le impostazioni correnti quando serviranno di nuovo.

Suggerimento: preferisci `openclaw sandbox recreate` rispetto alla pulizia manuale specifica del backend.
Usa il registro runtime del Gateway ed evita discrepanze quando cambiano le chiavi di ambito/sessione.

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

## Vedi anche

- [Documentazione Sandbox](/gateway/sandboxing)
- [Configurazione agente](/concepts/agent-workspace)
- [Comando Doctor](/gateway/doctor) - Controlla la configurazione sandbox
