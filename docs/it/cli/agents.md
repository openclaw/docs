---
read_when:
    - Vuoi più agenti isolati (spazi di lavoro + instradamento + autenticazione)
summary: Riferimento CLI per `openclaw agents` (elencare/aggiungere/eliminare/associazioni/associare/dissociare/impostare l'identità)
title: Agenti
x-i18n:
    generated_at: "2026-07-12T06:53:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gestisci agenti isolati (spazi di lavoro + autenticazione + instradamento). L'esecuzione di `openclaw agents` senza sottocomandi equivale a `openclaw agents list`.

Correlati:

- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)
- [Configurazione delle Skills](/it/tools/skills-config): configurazione della visibilità delle Skills.

## Esempi

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Superficie dei comandi

### `agents list`

Opzioni: `--json`, `--bindings` (include le regole di instradamento complete, non solo i conteggi o i riepiloghi per agente).

### `agents add [name]`

Opzioni: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (ripetibile), `--non-interactive`, `--json`.

- Il passaggio di qualsiasi flag esplicito per l'aggiunta sposta il comando sul percorso non interattivo.
- La modalità non interattiva richiede sia un nome per l'agente sia `--workspace`.
- `main` è riservato e non può essere utilizzato come ID del nuovo agente.
- La modalità interattiva inizializza l'autenticazione copiando solo le credenziali statiche trasferibili (profili `api_key` e `token` statici), a meno che una credenziale non disabiliti la copia con `copyToAgents: false`; i profili con token di aggiornamento OAuth non vengono copiati, a meno che un provider non abiliti la copia con `copyToAgents: true`. Senza una copia, OAuth rimane disponibile solo tramite ereditarietà in lettura dall'archivio dell'agente `main` reale. Se l'agente predefinito configurato non è `main`, accedi separatamente ai profili OAuth sul nuovo agente.

### `agents bindings`

Opzioni: `--agent <id>`, `--json`.

### `agents bind`

Opzioni: `--agent <id>` (per impostazione predefinita, l'agente predefinito corrente), `--bind <channel[:accountId]>` (ripetibile), `--json`.

### `agents unbind`

Opzioni: `--agent <id>` (per impostazione predefinita, l'agente predefinito corrente), `--bind <channel[:accountId]>` (ripetibile), `--all`, `--json`. Accetta `--all` oppure uno o più valori `--bind`, ma non entrambi.

### `agents set-identity`

Opzioni: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Vedi [Impostare l'identità](#set-identity) di seguito.

### `agents delete <id>`

Opzioni: `--force`, `--json`.

- `main` non può essere eliminato.
- Senza `--force`, è richiesta una conferma interattiva (l'operazione non riesce in una sessione non TTY; riesegui con `--force`).
- Le directory dello spazio di lavoro, dello stato dell'agente e delle trascrizioni delle sessioni vengono spostate nel Cestino, non eliminate definitivamente.
- Quando il Gateway è raggiungibile, l'eliminazione viene instradata attraverso il Gateway, affinché la pulizia della configurazione e dell'archivio delle sessioni utilizzi lo stesso processo di scrittura del traffico in fase di esecuzione. Se il Gateway non è raggiungibile, la CLI ripiega sul percorso locale offline.
- Se lo spazio di lavoro di un altro agente corrisponde allo stesso percorso, si trova all'interno di questo spazio di lavoro o contiene questo spazio di lavoro, lo spazio di lavoro viene conservato e `--json` restituisce `workspaceRetained`, `workspaceRetainedReason` e `workspaceSharedWith`.

## Associazioni di instradamento

Utilizza le associazioni di instradamento per vincolare il traffico in ingresso da un canale a un agente specifico.

Se desideri anche Skills visibili diverse per ciascun agente, configura `agents.defaults.skills` e `agents.list[].skills` in `openclaw.json`. Vedi [Configurazione delle Skills](/it/tools/skills-config) e [Riferimento per la configurazione](/it/gateway/config-agents#agentsdefaultsskills).

Elenca le associazioni:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Aggiungi associazioni:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Puoi aggiungere associazioni anche durante la creazione di un agente:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Se ometti `accountId` (`--bind <channel>`), OpenClaw lo determina dagli hook di configurazione del plugin, dall'associazione forzata dell'account o dal numero di account configurati per il canale.

Se ometti `--agent` per `bind` o `unbind`, OpenClaw seleziona l'agente predefinito corrente.

### Formato di `--bind`

| Formato                      | Significato                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Corrisponde a tutti gli account del canale.                                                                                      |
| `--bind <channel>:<account>` | Corrisponde a un account.                                                                                                       |
| `--bind <channel>`           | Corrisponde solo all'account predefinito, a meno che la CLI non possa determinare in modo sicuro un ambito account specifico del plugin. |

### Comportamento dell'ambito delle associazioni

- Un'associazione archiviata senza `accountId` corrisponde solo all'account predefinito del canale.
- `accountId: "*"` è il ripiego valido per l'intero canale (tutti gli account) ed è meno specifico di un'associazione esplicita a un account.
- Se lo stesso agente dispone già di un'associazione corrispondente al canale senza `accountId` e successivamente crei un'associazione con un `accountId` esplicito o determinato, OpenClaw aggiorna direttamente l'associazione esistente anziché aggiungerne una duplicata.

Esempi:

```bash
# corrisponde a tutti gli account del canale
openclaw agents bind --agent work --bind telegram:*

# corrisponde a un account specifico
openclaw agents bind --agent work --bind telegram:ops

# associazione iniziale al solo canale
openclaw agents bind --agent work --bind telegram

# successivo aggiornamento a un'associazione con ambito account
openclaw agents bind --agent work --bind telegram:alerts
```

Dopo l'aggiornamento, l'instradamento per tale associazione è limitato a `telegram:alerts`. Se desideri anche l'instradamento dell'account predefinito, aggiungilo esplicitamente (ad esempio `--bind telegram:default`).

Rimuovi le associazioni:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## File di identità

Ogni spazio di lavoro di un agente può includere un file `IDENTITY.md` nella propria radice:

- Percorso di esempio: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` legge dalla radice dello spazio di lavoro (o da un file `--identity-file` esplicito).

I percorsi degli avatar vengono risolti rispetto alla radice dello spazio di lavoro e non possono uscirne, nemmeno tramite un collegamento simbolico.

## Impostare l'identità

`set-identity` scrive i campi in `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (percorso relativo allo spazio di lavoro, URL http(s) o URI di dati).

- `--agent` o `--workspace` seleziona l'agente di destinazione. Se `--workspace` corrisponde a più agenti, il comando non riesce e richiede di passare `--agent`.
- I file immagine locali degli avatar con percorso relativo allo spazio di lavoro sono limitati a 2 MB. Gli URL HTTP(S) e gli URI `data:` non vengono verificati rispetto al limite locale delle dimensioni dei file.
- Se non vengono forniti campi di identità espliciti, il comando legge i dati di identità da `IDENTITY.md`.

Carica da `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Sovrascrivi esplicitamente i campi:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Esempio di configurazione:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Correlati

- [Riferimento della CLI](/it/cli)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)
