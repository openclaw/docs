---
read_when:
    - Vuoi più agenti isolati (spazi di lavoro + routing + autenticazione)
summary: Riferimento CLI per `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agenti
x-i18n:
    generated_at: "2026-06-27T17:17:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gestisci agenti isolati (workspace + auth + routing).

Correlati:

- [Routing multi-agente](/it/concepts/multi-agent)
- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Configurazione Skills](/it/tools/skills-config): configurazione della visibilità delle skill.

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

## Associazioni di routing

Usa le associazioni di routing per vincolare il traffico in ingresso del canale a un agente specifico.

Se vuoi anche Skills visibili diverse per agente, configura `agents.defaults.skills` e `agents.list[].skills` in `openclaw.json`. Consulta [Configurazione Skills](/it/tools/skills-config) e [Riferimento configurazione](/it/gateway/config-agents#agents-defaults-skills).

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

Puoi anche aggiungere associazioni durante la creazione di un agente:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Se ometti `accountId` (`--bind <channel>`), OpenClaw lo risolve dagli hook di configurazione del Plugin, dall'associazione forzata dell'account o dal numero di account configurati del canale.

Se ometti `--agent` per `bind` o `unbind`, OpenClaw usa come destinazione l'agente predefinito corrente.

### Formato di `--bind`

| Formato                     | Significato                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Corrisponde a tutti gli account sul canale.                                                      |
| `--bind <channel>:<account>` | Corrisponde a un account.                                                                       |
| `--bind <channel>`           | Corrisponde solo all'account predefinito, a meno che la CLI possa risolvere in modo sicuro un ambito account specifico del Plugin. |

### Comportamento dell'ambito di associazione

- Un'associazione memorizzata senza `accountId` corrisponde solo all'account predefinito del canale.
- `accountId: "*"` è il fallback a livello di canale (tutti gli account) ed è meno specifico di un'associazione account esplicita.
- Se lo stesso agente ha già un'associazione di canale corrispondente senza `accountId` e in seguito crei un'associazione con un `accountId` esplicito o risolto, OpenClaw aggiorna tale associazione esistente sul posto invece di aggiungere un duplicato.

Esempi:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

Dopo l'aggiornamento, il routing per tale associazione è limitato a `telegram:alerts`. Se vuoi anche il routing dell'account predefinito, aggiungilo esplicitamente (ad esempio `--bind telegram:default`).

Rimuovi associazioni:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` accetta `--all` oppure uno o più valori `--bind`, non entrambi.

## Superficie dei comandi

### `agents`

Eseguire `openclaw agents` senza sottocomando equivale a `openclaw agents list`.

### `agents list`

Opzioni:

- `--json`
- `--bindings`: include le regole di routing complete, non solo conteggi/riepiloghi per agente

### `agents add [name]`

Opzioni:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ripetibile)
- `--non-interactive`
- `--json`

Note:

- Passare qualsiasi flag add esplicito porta il comando nel percorso non interattivo.
- La modalità non interattiva richiede sia un nome agente sia `--workspace`.
- `main` è riservato e non può essere usato come nuovo ID agente.
- In modalità interattiva, il seeding dell'auth copia solo profili statici portabili
  (`api_key` e `token` statico per impostazione predefinita). I profili OAuth con token di refresh rimangono
  disponibili solo tramite ereditarietà in lettura dallo store reale dell'agente `main`.
  Se l'agente predefinito configurato non è `main`, accedi separatamente per i profili OAuth
  sul nuovo agente.

### `agents bindings`

Opzioni:

- `--agent <id>`
- `--json`

### `agents bind`

Opzioni:

- `--agent <id>` (predefinito: agente predefinito corrente)
- `--bind <channel[:accountId]>` (ripetibile)
- `--json`

### `agents unbind`

Opzioni:

- `--agent <id>` (predefinito: agente predefinito corrente)
- `--bind <channel[:accountId]>` (ripetibile)
- `--all`
- `--json`

### `agents delete <id>`

Opzioni:

- `--force`
- `--json`

Note:

- `main` non può essere eliminato.
- Senza `--force`, è richiesta una conferma interattiva.
- Le directory del workspace, dello stato dell'agente e delle trascrizioni delle sessioni vengono spostate nel Cestino, non eliminate definitivamente.
- Quando il Gateway è raggiungibile, l'eliminazione viene inviata tramite il Gateway, così la pulizia della configurazione e dello store delle sessioni condivide lo stesso writer del traffico runtime. Se il Gateway non è raggiungibile, la CLI ripiega sul percorso locale offline.
- Se il workspace di un altro agente è lo stesso percorso, si trova all'interno di questo workspace o contiene questo workspace,
  il workspace viene mantenuto e `--json` riporta `workspaceRetained`,
  `workspaceRetainedReason` e `workspaceSharedWith`.

## File di identità

Ogni workspace agente può includere un `IDENTITY.md` nella radice del workspace:

- Percorso di esempio: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` legge dalla radice del workspace (o da un `--identity-file` esplicito)

I percorsi avatar vengono risolti relativamente alla radice del workspace.

## Impostare l'identità

`set-identity` scrive campi in `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (percorso relativo al workspace, URL http(s) o data URI)

Opzioni:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Note:

- `--agent` o `--workspace` possono essere usati per selezionare l'agente di destinazione.
- Se fai affidamento su `--workspace` e più agenti condividono tale workspace, il comando non riesce e chiede di passare `--agent`.
- I file immagine avatar locali relativi al workspace sono limitati a 2 MB. Gli URL HTTP(S) e gli URI `data:` non vengono controllati con il limite locale di dimensione file.
- Quando non vengono forniti campi identità espliciti, il comando legge i dati di identità da `IDENTITY.md`.

Carica da `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Sovrascrivi i campi esplicitamente:

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

- [Riferimento CLI](/it/cli)
- [Routing multi-agente](/it/concepts/multi-agent)
- [Workspace dell'agente](/it/concepts/agent-workspace)
