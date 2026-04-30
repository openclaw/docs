---
read_when:
    - Vuoi più agenti isolati (aree di lavoro + instradamento + autenticazione)
summary: Riferimento CLI per `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agenti
x-i18n:
    generated_at: "2026-04-30T08:41:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gestisci agenti isolati (workspace + autenticazione + routing).

Correlati:

- [Routing multi-agente](/it/concepts/multi-agent)
- [Workspace dell'agente](/it/concepts/agent-workspace)
- [Configurazione Skills](/it/tools/skills-config): configurazione della visibilità delle skill.

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

## Associazioni di routing

Usa le associazioni di routing per vincolare il traffico in ingresso dei canali a un agente specifico.

Se vuoi anche Skills visibili diverse per ciascun agente, configura `agents.defaults.skills` e `agents.list[].skills` in `openclaw.json`. Vedi [Configurazione Skills](/it/tools/skills-config) e [Riferimento di configurazione](/it/gateway/config-agents#agents-defaults-skills).

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

Se ometti `accountId` (`--bind <channel>`), OpenClaw lo risolve dai valori predefiniti del canale e dagli hook di configurazione del plugin quando disponibili.

Se ometti `--agent` per `bind` o `unbind`, OpenClaw usa come destinazione l'agente predefinito corrente.

### Comportamento dell'ambito delle associazioni

- Un'associazione senza `accountId` corrisponde solo all'account predefinito del canale.
- `accountId: "*"` è il fallback a livello di canale (tutti gli account) ed è meno specifico di un'associazione esplicita a un account.
- Se lo stesso agente ha già un'associazione di canale corrispondente senza `accountId` e in seguito crei un'associazione con un `accountId` esplicito o risolto, OpenClaw aggiorna sul posto l'associazione esistente invece di aggiungere un duplicato.

Esempio:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Dopo l'aggiornamento, il routing per quell'associazione è limitato a `telegram:ops`. Se vuoi anche il routing dell'account predefinito, aggiungilo esplicitamente (per esempio `--bind telegram:default`).

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
- `--bindings`: include regole di routing complete, non solo conteggi/riepiloghi per agente

### `agents add [name]`

Opzioni:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ripetibile)
- `--non-interactive`
- `--json`

Note:

- Passare qualsiasi flag esplicito di aggiunta porta il comando nel percorso non interattivo.
- La modalità non interattiva richiede sia un nome agente sia `--workspace`.
- `main` è riservato e non può essere usato come nuovo ID agente.
- In modalità interattiva, il popolamento dell'autenticazione copia solo i profili statici portabili
  (`api_key` e `token` statico per impostazione predefinita). I profili OAuth con token di aggiornamento restano
  disponibili solo tramite ereditarietà in lettura dallo store reale dell'agente `main`.
  Se l'agente predefinito configurato non è `main`, accedi separatamente ai profili OAuth
  sul nuovo agente.

### `agents bindings`

Opzioni:

- `--agent <id>`
- `--json`

### `agents bind`

Opzioni:

- `--agent <id>` (predefinito: l'agente predefinito corrente)
- `--bind <channel[:accountId]>` (ripetibile)
- `--json`

### `agents unbind`

Opzioni:

- `--agent <id>` (predefinito: l'agente predefinito corrente)
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
- Se il workspace di un altro agente è lo stesso percorso, si trova dentro questo workspace o contiene questo workspace,
  il workspace viene conservato e `--json` riporta `workspaceRetained`,
  `workspaceRetainedReason` e `workspaceSharedWith`.

## File di identità

Ogni workspace agente può includere un file `IDENTITY.md` nella radice del workspace:

- Percorso di esempio: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` legge dalla radice del workspace (o da un `--identity-file` esplicito)

I percorsi degli avatar vengono risolti relativamente alla radice del workspace.

## Impostare l'identità

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
- Se ti affidi a `--workspace` e più agenti condividono quel workspace, il comando non riesce e chiede di passare `--agent`.
- Quando non vengono forniti campi di identità espliciti, il comando legge i dati di identità da `IDENTITY.md`.

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
