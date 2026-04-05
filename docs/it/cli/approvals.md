---
read_when:
    - Vuoi modificare le approvazioni exec dalla CLI
    - Devi gestire le allowlist sugli host gateway o nodo
summary: Riferimento CLI per `openclaw approvals` (approvazioni exec per gateway o host nodo)
title: approvals
x-i18n:
    generated_at: "2026-04-05T13:46:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2532bfd3e6e6ce43c96a2807df2dd00cb7b4320b77a7dfd09bee0531da610e
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Gestisci le approvazioni exec per l'**host locale**, l'**host gateway** o un **host nodo**.
Per impostazione predefinita, i comandi puntano al file delle approvazioni locale su disco. Usa `--gateway` per puntare al gateway oppure `--node` per puntare a un nodo specifico.

Alias: `openclaw exec-approvals`

Correlati:

- Approvazioni exec: [Approvazioni exec](/tools/exec-approvals)
- Nodi: [Nodi](/nodes)

## Comandi comuni

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` ora mostra la policy exec effettiva per i target locali, gateway e nodo:

- policy `tools.exec` richiesta
- policy del file delle approvazioni dell'host
- risultato effettivo dopo l'applicazione delle regole di precedenza

La precedenza è intenzionale:

- il file delle approvazioni dell'host è la fonte di verità applicabile
- la policy `tools.exec` richiesta può restringere o ampliare l'intento, ma il risultato effettivo deriva comunque dalle regole dell'host
- `--node` combina il file delle approvazioni dell'host nodo con la policy `tools.exec` del gateway, perché entrambe si applicano ancora in fase di runtime
- se la configurazione del gateway non è disponibile, la CLI usa come fallback lo snapshot delle approvazioni del nodo e segnala che la policy finale di runtime non ha potuto essere calcolata

## Sostituisci le approvazioni da un file

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` accetta JSON5, non solo JSON rigoroso. Usa `--file` oppure `--stdin`, non entrambi.

## Esempio "Mai chiedere" / YOLO

Per un host che non deve mai fermarsi sulle approvazioni exec, imposta i valori predefiniti delle approvazioni host su `full` + `off`:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Variante nodo:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Questo modifica solo il **file delle approvazioni dell'host**. Per mantenere allineata anche la policy OpenClaw richiesta, imposta anche:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Perché `tools.exec.host=gateway` in questo esempio:

- `host=auto` significa ancora "sandbox quando disponibile, altrimenti gateway".
- YOLO riguarda le approvazioni, non l'instradamento.
- Se vuoi l'exec sull'host anche quando è configurata una sandbox, rendi esplicita la scelta dell'host con `gateway` o `/exec host=gateway`.

Questo corrisponde all'attuale comportamento YOLO predefinito dell'host. Se vuoi approvazioni, rendilo più restrittivo.

## Helper allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opzioni comuni

`get`, `set` e `allowlist add|remove` supportano tutti:

- `--node <id|name|ip>`
- `--gateway`
- opzioni RPC nodo condivise: `--url`, `--token`, `--timeout`, `--json`

Note sul targeting:

- senza flag di target viene usato il file delle approvazioni locale su disco
- `--gateway` punta al file delle approvazioni dell'host gateway
- `--node` punta a un host nodo dopo la risoluzione di id, nome, IP o prefisso dell'id

`allowlist add|remove` supporta anche:

- `--agent <id>` (predefinito `*`)

## Note

- `--node` usa lo stesso resolver di `openclaw nodes` (id, nome, ip o prefisso dell'id).
- `--agent` ha come valore predefinito `"*"`, che si applica a tutti gli agenti.
- L'host nodo deve dichiarare `system.execApprovals.get/set` (app macOS o host nodo headless).
- I file delle approvazioni sono archiviati per host in `~/.openclaw/exec-approvals.json`.
