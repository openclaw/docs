---
read_when:
    - Vuoi più agenti isolati (workspace + instradamento + autenticazione)
summary: Riferimento CLI per `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: agenti
x-i18n:
    generated_at: "2026-04-23T08:26:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Gestisci agenti isolati (workspace + autenticazione + instradamento).

Correlati:

- Instradamento multi-agent: [Multi-Agent Routing](/it/concepts/multi-agent)
- Workspace agente: [Agent workspace](/it/concepts/agent-workspace)
- Configurazione della visibilità delle Skills: [Skills config](/it/tools/skills-config)

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

## Binding di instradamento

Usa i binding di instradamento per fissare il traffico in ingresso di un canale a un agente specifico.

Se vuoi anche Skills visibili diverse per agente, configura
`agents.defaults.skills` e `agents.list[].skills` in `openclaw.json`. Vedi
[Skills config](/it/tools/skills-config) e
[Configuration Reference](/it/gateway/configuration-reference#agents-defaults-skills).

Elencare i binding:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Aggiungere binding:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Se ometti `accountId` (`--bind <channel>`), OpenClaw lo risolve dai valori predefiniti del canale e dagli hook di configurazione del plugin quando disponibili.

Se ometti `--agent` per `bind` o `unbind`, OpenClaw usa come destinazione l’agente predefinito corrente.

### Comportamento dell’ambito dei binding

- Un binding senza `accountId` corrisponde solo all’account predefinito del canale.
- `accountId: "*"` è il fallback a livello di canale (tutti gli account) ed è meno specifico di un binding esplicito dell’account.
- Se lo stesso agente ha già un binding di canale corrispondente senza `accountId`, e in seguito esegui il binding con un `accountId` esplicito o risolto, OpenClaw aggiorna quel binding esistente sul posto invece di aggiungerne uno duplicato.

Esempio:

```bash
# binding iniziale solo canale
openclaw agents bind --agent work --bind telegram

# successivo aggiornamento a binding con ambito account
openclaw agents bind --agent work --bind telegram:ops
```

Dopo l’aggiornamento, l’instradamento per quel binding è limitato a `telegram:ops`. Se vuoi anche l’instradamento dell’account predefinito, aggiungilo esplicitamente (ad esempio `--bind telegram:default`).

Rimuovere binding:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` accetta o `--all` oppure uno o più valori `--bind`, non entrambi.

## Superficie dei comandi

### `agents`

Eseguire `openclaw agents` senza sottocomando equivale a `openclaw agents list`.

### `agents list`

Opzioni:

- `--json`
- `--bindings`: include le regole di instradamento complete, non solo conteggi/riepiloghi per agente

### `agents add [name]`

Opzioni:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ripetibile)
- `--non-interactive`
- `--json`

Note:

- Il passaggio di qualunque flag esplicito per add fa passare il comando al percorso non interattivo.
- La modalità non interattiva richiede sia un nome agente sia `--workspace`.
- `main` è riservato e non può essere usato come nuovo ID agente.

### `agents bindings`

Opzioni:

- `--agent <id>`
- `--json`

### `agents bind`

Opzioni:

- `--agent <id>` (predefinito: l’agente predefinito corrente)
- `--bind <channel[:accountId]>` (ripetibile)
- `--json`

### `agents unbind`

Opzioni:

- `--agent <id>` (predefinito: l’agente predefinito corrente)
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
- Workspace, stato dell’agente e directory delle trascrizioni di sessione vengono spostati nel Cestino, non eliminati definitivamente.

## File di identità

Ogni workspace agente può includere un file `IDENTITY.md` nella radice del workspace:

- Percorso di esempio: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` legge dalla radice del workspace (oppure da un `--identity-file` esplicito)

I percorsi dell’avatar vengono risolti relativamente alla radice del workspace.

## Impostare l’identità

`set-identity` scrive i campi in `agents.list[].identity`:

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

- `--agent` o `--workspace` possono essere usati per selezionare l’agente di destinazione.
- Se fai affidamento su `--workspace` e più agenti condividono quel workspace, il comando fallisce e ti chiede di passare `--agent`.
- Quando non vengono forniti campi di identità espliciti, il comando legge i dati di identità da `IDENTITY.md`.

Caricare da `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Sostituire esplicitamente i campi:

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
