---
read_when:
    - Vuoi più agenti isolati (workspace + instradamento + autenticazione)
summary: Riferimento CLI per `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: agents
x-i18n:
    generated_at: "2026-04-05T13:46:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90b90c4915993bd8af322c0590d4cb59baabb8940598ce741315f8f95ef43179
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Gestisci agenti isolati (workspace + autenticazione + instradamento).

Correlati:

- Instradamento multi-agent: [Instradamento multi-agent](/concepts/multi-agent)
- Workspace dell'agente: [Workspace dell'agente](/concepts/agent-workspace)
- Configurazione della visibilità delle Skills: [Configurazione delle Skills](/tools/skills-config)

## Esempi

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Associazioni di instradamento

Usa le associazioni di instradamento per vincolare il traffico in ingresso di un canale a un agente specifico.

Se vuoi anche Skills visibili diverse per agente, configura
`agents.defaults.skills` e `agents.list[].skills` in `openclaw.json`. Vedi
[Configurazione delle Skills](/tools/skills-config) e
[Riferimento configurazione](/gateway/configuration-reference#agentsdefaultsskills).

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

Se ometti `accountId` (`--bind <channel>`), OpenClaw lo risolve dai valori predefiniti del canale e dagli hook di setup del plugin quando disponibili.

Se ometti `--agent` per `bind` o `unbind`, OpenClaw usa come destinazione l'agente predefinito corrente.

### Comportamento dell'ambito delle associazioni

- Un'associazione senza `accountId` corrisponde solo all'account predefinito del canale.
- `accountId: "*"` è il fallback a livello di canale (tutti gli account) ed è meno specifico di un'associazione esplicita a un account.
- Se lo stesso agente ha già un'associazione di canale corrispondente senza `accountId`, e in seguito esegui un'associazione con un `accountId` esplicito o risolto, OpenClaw aggiorna quell'associazione esistente sul posto invece di aggiungerne una duplicata.

Esempio:

```bash
# associazione iniziale solo canale
openclaw agents bind --agent work --bind telegram

# successivo aggiornamento ad associazione con ambito account
openclaw agents bind --agent work --bind telegram:ops
```

Dopo l'aggiornamento, l'instradamento per quell'associazione è limitato a `telegram:ops`. Se vuoi anche l'instradamento dell'account predefinito, aggiungilo esplicitamente (ad esempio `--bind telegram:default`).

Rimuovi associazioni:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` accetta `--all` oppure uno o più valori `--bind`, ma non entrambi.

## Superficie dei comandi

### `agents`

Eseguire `openclaw agents` senza sottocomandi equivale a `openclaw agents list`.

### `agents list`

Opzioni:

- `--json`
- `--bindings`: include le regole complete di instradamento, non solo conteggi/riepiloghi per agente

### `agents add [name]`

Opzioni:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ripetibile)
- `--non-interactive`
- `--json`

Note:

- Il passaggio di qualsiasi flag esplicito di add fa passare il comando al percorso non interattivo.
- La modalità non interattiva richiede sia un nome agente sia `--workspace`.
- `main` è riservato e non può essere usato come nuovo id agente.

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

## File identity

Ogni workspace dell'agente può includere un `IDENTITY.md` nella radice del workspace:

- Percorso di esempio: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` legge dalla radice del workspace (oppure da un `--identity-file` esplicito)

I percorsi degli avatar vengono risolti relativamente alla radice del workspace.

## Imposta identity

`set-identity` scrive i campi in `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (percorso relativo al workspace, URL http(s) o URI data)

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
- Se ti basi su `--workspace` e più agenti condividono quel workspace, il comando fallisce e ti chiede di passare `--agent`.
- Quando non vengono forniti campi identity espliciti, il comando legge i dati identity da `IDENTITY.md`.

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
