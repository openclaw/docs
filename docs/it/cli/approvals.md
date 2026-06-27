---
read_when:
    - Vuoi modificare le approvazioni di exec dalla CLI
    - Devi gestire le liste consentite sugli host Gateway o Node
summary: Riferimento CLI per `openclaw approvals` e `openclaw exec-policy`
title: Approvazioni
x-i18n:
    generated_at: "2026-06-27T17:18:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Gestisci le approvazioni exec per l'**host locale**, l'**host Gateway** o un **host Node**.
Per impostazione predefinita, i comandi usano come destinazione il file locale delle approvazioni su disco. Usa `--gateway` per usare come destinazione il Gateway, oppure `--node` per usare come destinazione un Node specifico.

Alias: `openclaw exec-approvals`

Correlati:

- Approvazioni exec: [Approvazioni exec](/it/tools/exec-approvals)
- Node: [Node](/it/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` è il comando locale di praticità per mantenere la configurazione
`tools.exec.*` richiesta e il file delle approvazioni dell'host locale allineati in un solo passaggio.

Usalo quando vuoi:

- ispezionare la policy locale richiesta, il file delle approvazioni dell'host e l'unione effettiva
- applicare un preset locale come YOLO o deny-all
- sincronizzare `tools.exec.*` locale e il file delle approvazioni dell'host locale

Esempi:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Modalità di output:

- senza `--json`: stampa la vista tabellare leggibile dall'utente
- `--json`: stampa output strutturato leggibile da macchina

Ambito corrente:

- `exec-policy` è **solo locale**
- aggiorna insieme il file di configurazione locale e il file delle approvazioni locale
- **non** invia la policy all'host Gateway o a un host Node
- `--host node` viene rifiutato in questo comando perché le approvazioni exec dei Node vengono recuperate dal Node in fase di runtime e devono invece essere gestite tramite comandi di approvazione destinati al Node
- `openclaw exec-policy show` contrassegna gli ambiti `host=node` come gestiti dal Node in fase di runtime invece di derivare una policy effettiva dal file delle approvazioni locale

Se devi modificare direttamente le approvazioni di un host remoto, continua a usare `openclaw approvals set --gateway`
o `openclaw approvals set --node <id|name|ip>`.

## Comandi comuni

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` ora mostra la policy exec effettiva per destinazioni locali, Gateway e Node:

- policy `tools.exec` richiesta
- policy del file delle approvazioni dell'host
- risultato effettivo dopo l'applicazione delle regole di precedenza

La precedenza è intenzionale:

- il file delle approvazioni dell'host è la fonte di verità applicabile
- la policy `tools.exec` richiesta può restringere o ampliare l'intento, ma il risultato effettivo deriva comunque dalle regole dell'host
- `--node` combina il file delle approvazioni dell'host Node con la policy `tools.exec` del Gateway, perché entrambe continuano ad applicarsi in fase di runtime
- se la configurazione del Gateway non è disponibile, la CLI ripiega sullo snapshot delle approvazioni del Node e segnala che non è stato possibile calcolare la policy finale di runtime

## Sostituire le approvazioni da un file

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` accetta JSON5, non solo JSON rigoroso. Usa `--file` oppure `--stdin`, non entrambi.

## Esempio "Non chiedere mai" / YOLO

Per un host che non deve mai fermarsi sulle approvazioni exec, imposta i valori predefiniti delle approvazioni dell'host su `full` + `off`:

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

- `host=auto` significa ancora "sandbox quando disponibile, altrimenti Gateway".
- YOLO riguarda le approvazioni, non il routing.
- Se vuoi l'exec dell'host anche quando è configurata una sandbox, rendi esplicita la scelta dell'host con `gateway` o `/exec host=gateway`.

`askFallback` omesso usa come impostazione predefinita `deny`. Imposta esplicitamente `askFallback: "full"`
quando aggiorni un host senza UI che deve mantenere il comportamento senza richieste.

Scorciatoia locale:

```bash
openclaw exec-policy preset yolo
```

Quella scorciatoia locale aggiorna insieme sia la configurazione locale `tools.exec.*` richiesta sia i valori predefiniti
delle approvazioni locali. Nell'intento equivale alla configurazione manuale in due passaggi
sopra, ma solo per la macchina locale.

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
- opzioni RPC condivise per Node: `--url`, `--token`, `--timeout`, `--json`

Note sulla destinazione:

- nessun flag di destinazione indica il file locale delle approvazioni su disco
- `--gateway` usa come destinazione il file delle approvazioni dell'host Gateway
- `--node` usa come destinazione un host Node dopo aver risolto id, nome, IP o prefisso id

`allowlist add|remove` supporta anche:

- `--agent <id>` (predefinito: `*`)

## Note

- `--node` usa lo stesso resolver di `openclaw nodes` (id, nome, ip o prefisso id).
- `--agent` usa come impostazione predefinita `"*"`, che si applica a tutti gli agenti.
- L'host Node deve pubblicizzare `system.execApprovals.get/set` (app macOS o host Node headless).
- I file delle approvazioni vengono archiviati per host nella directory di stato di OpenClaw
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`, oppure
  `~/.openclaw/exec-approvals.json` quando la variabile non è impostata).

## Correlati

- [Riferimento CLI](/it/cli)
- [Approvazioni exec](/it/tools/exec-approvals)
