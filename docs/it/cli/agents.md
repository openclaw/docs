---
read_when:
    - Vuoi più agenti isolati (aree di lavoro + routing + autenticazione)
summary: Riferimento CLI per `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agenti
x-i18n:
    generated_at: "2026-05-02T20:41:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3522394dd416a9c8b4bf25767a14073484df0ff3d7c546cf6c730f111c5c51dc
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gestisci agenti isolati (aree di lavoro + autenticazione + instradamento).

Correlati:

- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Area di lavoro dell'agente](/it/concepts/agent-workspace)
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

## Associazioni di instradamento

Usa le associazioni di instradamento per vincolare il traffico in ingresso dei canali a un agente specifico.

Se vuoi anche skill visibili diverse per agente, configura `agents.defaults.skills` e `agents.list[].skills` in `openclaw.json`. Vedi [Configurazione Skills](/it/tools/skills-config) e [Riferimento di configurazione](/it/gateway/config-agents#agents-defaults-skills).

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

Se ometti `accountId` (`--bind <channel>`), OpenClaw lo risolve dai valori predefiniti del canale e dagli hook di configurazione del Plugin quando disponibili.

Se ometti `--agent` per `bind` o `unbind`, OpenClaw usa come destinazione l'agente predefinito corrente.

### Comportamento dell'ambito delle associazioni

- Un'associazione senza `accountId` corrisponde solo all'account predefinito del canale.
- `accountId: "*"` è il fallback a livello di canale (tutti gli account) ed è meno specifico di un'associazione esplicita a un account.
- Se lo stesso agente ha già un'associazione di canale corrispondente senza `accountId`, e in seguito aggiungi un'associazione con un `accountId` esplicito o risolto, OpenClaw aggiorna sul posto quell'associazione esistente invece di aggiungere un duplicato.

Esempio:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Dopo l'aggiornamento, l'instradamento per quell'associazione è limitato a `telegram:ops`. Se vuoi anche l'instradamento per l'account predefinito, aggiungilo esplicitamente (per esempio `--bind telegram:default`).

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

- Passare qualunque flag di aggiunta esplicito sposta il comando nel percorso non interattivo.
- La modalità non interattiva richiede sia il nome dell'agente sia `--workspace`.
- `main` è riservato e non può essere usato come nuovo id agente.
- In modalità interattiva, l'inizializzazione dell'autenticazione copia solo profili statici portabili
  (`api_key` e `token` statico per impostazione predefinita). I profili OAuth con refresh token restano
  disponibili solo tramite ereditarietà in lettura dal vero archivio dell'agente `main`.
  Se l'agente predefinito configurato non è `main`, accedi separatamente per i profili OAuth
  nel nuovo agente.

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
- Le directory dell'area di lavoro, dello stato agente e delle trascrizioni di sessione vengono spostate nel Cestino, non eliminate definitivamente.
- Quando il Gateway è raggiungibile, l'eliminazione viene inviata tramite il Gateway in modo che la pulizia della configurazione e dell'archivio sessioni condivida lo stesso writer del traffico runtime. Se il Gateway non può essere raggiunto, la CLI ripiega sul percorso locale offline.
- Se l'area di lavoro di un altro agente è lo stesso percorso, si trova dentro questa area di lavoro o contiene questa area di lavoro,
  l'area di lavoro viene mantenuta e `--json` riporta `workspaceRetained`,
  `workspaceRetainedReason` e `workspaceSharedWith`.

## File di identità

Ogni area di lavoro agente può includere un `IDENTITY.md` nella radice dell'area di lavoro:

- Percorso di esempio: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` legge dalla radice dell'area di lavoro (o da un `--identity-file` esplicito)

I percorsi degli avatar vengono risolti rispetto alla radice dell'area di lavoro.

## Imposta identità

`set-identity` scrive i campi in `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (percorso relativo all'area di lavoro, URL http(s) o URI dati)

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
- Se ti affidi a `--workspace` e più agenti condividono quell'area di lavoro, il comando non riesce e chiede di passare `--agent`.
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
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Area di lavoro dell'agente](/it/concepts/agent-workspace)
