---
read_when:
    - Vuoi modificare le approvazioni exec dalla CLI
    - Devi gestire le allowlist su host Gateway o Node
summary: Riferimento CLI per `openclaw approvals` e `openclaw exec-policy`
title: Approvazioni
x-i18n:
    generated_at: "2026-04-24T08:32:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Gestisci le approvazioni exec per l'**host locale**, l'**host Gateway** o un **host Node**.
Per impostazione predefinita, i comandi puntano al file delle approvazioni locale sul disco. Usa `--gateway` per puntare al Gateway, oppure `--node` per puntare a un Node specifico.

Alias: `openclaw exec-approvals`

Correlati:

- Approvazioni exec: [Approvazioni exec](/it/tools/exec-approvals)
- Node: [Node](/it/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` è il comando locale di utilità per mantenere allineati in un solo passaggio la configurazione richiesta
`tools.exec.*` e il file delle approvazioni dell'host locale.

Usalo quando vuoi:

- ispezionare la policy locale richiesta, il file delle approvazioni dell'host e il merge effettivo
- applicare un preset locale come YOLO o deny-all
- sincronizzare `tools.exec.*` locali e `~/.openclaw/exec-approvals.json` locale

Esempi:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Modalità di output:

- senza `--json`: stampa la vista tabellare leggibile
- con `--json`: stampa output strutturato leggibile dalle macchine

Ambito attuale:

- `exec-policy` è **solo locale**
- aggiorna insieme il file di configurazione locale e il file delle approvazioni locale
- **non** invia la policy all'host Gateway o a un host Node
- `--host node` viene rifiutato in questo comando perché le approvazioni exec del Node vengono recuperate dal Node a runtime e devono invece essere gestite tramite comandi di approvazione indirizzati al Node
- `openclaw exec-policy show` contrassegna gli ambiti `host=node` come gestiti dal Node a runtime invece di derivare una policy effettiva dal file delle approvazioni locale

Se devi modificare direttamente le approvazioni di host remoti, continua a usare `openclaw approvals set --gateway`
oppure `openclaw approvals set --node <id|name|ip>`.

## Comandi comuni

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` ora mostra la policy exec effettiva per target locali, Gateway e Node:

- policy richiesta `tools.exec`
- policy del file delle approvazioni dell'host
- risultato effettivo dopo l'applicazione delle regole di precedenza

La precedenza è intenzionale:

- il file delle approvazioni dell'host è la fonte di verità applicabile
- la policy richiesta `tools.exec` può restringere o ampliare l'intento, ma il risultato effettivo è comunque derivato dalle regole dell'host
- `--node` combina il file delle approvazioni dell'host Node con la policy `tools.exec` del Gateway, perché entrambe si applicano ancora a runtime
- se la configurazione del Gateway non è disponibile, la CLI usa come fallback lo snapshot delle approvazioni del Node e segnala che non è stato possibile calcolare la policy finale di runtime

## Sostituire le approvazioni da un file

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` accetta JSON5, non solo JSON rigoroso. Usa `--file` oppure `--stdin`, non entrambi.

## Esempio "Never prompt" / YOLO

Per un host che non dovrebbe mai fermarsi sulle approvazioni exec, imposta i valori predefiniti delle approvazioni dell'host su `full` + `off`:

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

Variante Node:

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
- Se vuoi l'exec host anche quando è configurata una sandbox, rendi esplicita la scelta dell'host con `gateway` o `/exec host=gateway`.

Questo corrisponde all'attuale comportamento YOLO predefinito dell'host. Rendilo più restrittivo se vuoi approvazioni.

Scorciatoia locale:

```bash
openclaw exec-policy preset yolo
```

Questa scorciatoia locale aggiorna insieme sia la configurazione locale richiesta `tools.exec.*` sia i
valori predefiniti delle approvazioni locali. È equivalente nell'intento alla configurazione manuale in due passaggi
qui sopra, ma solo per la macchina locale.

## Helper per allowlist

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
- opzioni RPC Node condivise: `--url`, `--token`, `--timeout`, `--json`

Note sul targeting:

- senza flag di target significa il file delle approvazioni locale sul disco
- `--gateway` punta al file delle approvazioni dell'host Gateway
- `--node` punta a un host Node dopo aver risolto ID, nome, IP o prefisso dell'ID

`allowlist add|remove` supporta anche:

- `--agent <id>` (predefinito `*`)

## Note

- `--node` usa lo stesso resolver di `openclaw nodes` (id, nome, ip o prefisso dell'id).
- `--agent` ha come valore predefinito `"*"`, che si applica a tutti gli agenti.
- L'host Node deve dichiarare `system.execApprovals.get/set` (app macOS o host Node headless).
- I file delle approvazioni sono archiviati per host in `~/.openclaw/exec-approvals.json`.

## Correlati

- [Riferimento CLI](/it/cli)
- [Approvazioni exec](/it/tools/exec-approvals)
