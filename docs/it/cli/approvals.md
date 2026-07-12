---
read_when:
    - Vuoi modificare le approvazioni di esecuzione dalla CLI
    - Devi gestire gli elenchi di elementi consentiti sugli host del Gateway o dei Node
summary: Riferimento CLI per `openclaw approvals` e `openclaw exec-policy`
title: Approvazioni
x-i18n:
    generated_at: "2026-07-12T06:52:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Gestisce le approvazioni di esecuzione per l'**host locale**, l'**host del Gateway** o un **host Node**. Se non viene specificato alcun flag di destinazione, i comandi leggono/scrivono il file locale delle approvazioni su disco. Usa `--gateway` per selezionare il Gateway oppure `--node <id|name|ip>` per selezionare un Node specifico.

Alias: `openclaw exec-approvals`

Vedi anche: [Approvazioni di esecuzione](/it/tools/exec-approvals), [Node](/it/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` è il comando di utilità **esclusivamente locale** che sincronizza in un solo passaggio la configurazione `tools.exec.*` richiesta e il file delle approvazioni dell'host locale:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Le preimpostazioni (`yolo`, `cautious`, `deny-all`) applicano insieme `host`, `security`, `ask` e `askFallback`. `set` applica solo i flag specificati; ogni valore accettato viene convalidato (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Ambito:

- Aggiorna insieme il file di configurazione locale e il file locale delle approvazioni; non invia la policy al Gateway o a un host Node.
- `--host node` viene rifiutato: le approvazioni di esecuzione del Node vengono recuperate dal Node durante l'esecuzione, quindi `exec-policy` locale non può sincronizzarle. Usa invece `openclaw approvals set --node <id|name|ip>`.
- `exec-policy show` contrassegna gli ambiti con `host=node` come gestiti dal Node durante l'esecuzione, anziché derivare una policy effettiva dal file locale delle approvazioni.

Per le approvazioni degli host remoti, usa direttamente `openclaw approvals set --gateway` o `openclaw approvals set --node <id|name|ip>`.

## Comandi comuni

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` mostra la policy di esecuzione effettiva per la destinazione: la policy `tools.exec` richiesta, la policy del file delle approvazioni dell'host e il risultato effettivo combinato. I Node con una policy nativa dell'host, come l'app complementare per Windows, mostrano direttamente tale policy anziché applicare la logica della policy del file delle approvazioni di OpenClaw.

Per i Node basati su file, la vista combinata richiede un'istantanea della policy risolta dall'host. I Node meno recenti indicano che la policy effettiva non è disponibile, anziché presumere che la policy richiesta dal Gateway si applichi anche all'host.

<Note>
Le sostituzioni `/exec` specifiche della sessione non sono incluse. Esegui `/exec` nella sessione pertinente per esaminarne le impostazioni predefinite correnti.
</Note>

Precedenza:

- Il file delle approvazioni dell'host è la fonte di verità applicabile.
- La policy `tools.exec` richiesta può restringere o ampliare l'intento, ma il risultato effettivo deriva dalle regole dell'host.
- `--node` combina il file delle approvazioni dell'host Node con la policy `tools.exec` del Gateway (entrambe vengono applicate durante l'esecuzione).
- Se la configurazione del Gateway non è disponibile, la CLI utilizza come ripiego l'istantanea delle approvazioni del Node e segnala che non è stato possibile calcolare la policy finale di esecuzione.

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

I Node Windows con policy nativa dell'host utilizzano una struttura di policy propria:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

La CLI legge prima l'hash corrente del Node e lo invia con l'aggiornamento, così le modifiche locali simultanee vengono rifiutate anziché sovrascritte. `rules` è obbligatorio perché questa operazione sostituisce l'elenco completo delle regole del Node; `defaultAction` è facoltativo. Un Node che segnala la propria policy nativa come disabilitata non può essere configurato da remoto; abilita o configura prima la policy su tale host. Le policy native dell'host non supportano le utilità `allowlist add|remove`.

## Esempio "Non chiedere mai" / YOLO

Imposta i valori predefiniti delle approvazioni dell'host su `full` + `off` per un host che non deve mai interrompersi in attesa di approvazioni di esecuzione:

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

Per i Node che espongono un file delle approvazioni di OpenClaw, usa lo stesso corpo con `openclaw approvals set --node <id|name|ip> --stdin`. I Node con policy nativa dell'host richiedono la struttura specifica del proprietario mostrata sopra.

Questo modifica solo il **file delle approvazioni dell'host**. Per mantenere allineata anche la policy OpenClaw richiesta, imposta:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` è esplicito in questo caso perché `host=auto` continua a significare "sandbox quando disponibile, altrimenti Gateway": YOLO riguarda le approvazioni, non l'instradamento. Usa `gateway` (o `/exec host=gateway`) quando desideri l'esecuzione sull'host anche se è configurata una sandbox.

Se omesso, `askFallback` assume il valore predefinito `deny`. Imposta esplicitamente `askFallback: "full"` quando aggiorni un host privo di interfaccia utente che deve mantenere il comportamento senza richieste.

Scorciatoia locale per ottenere lo stesso risultato, solo sulla macchina locale:

```bash
openclaw exec-policy preset yolo
```

## Utilità per l'elenco consentito

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opzioni comuni

`get`, `set` e `allowlist add|remove` supportano tutti:

- `--node <id|name|ip>` (risolve ID, nome, IP o prefisso dell'ID; utilizza lo stesso risolutore di `openclaw nodes`)
- `--gateway`
- opzioni RPC condivise del Node: `--url`, `--token`, `--timeout`, `--json`

Se non viene specificato alcun flag di destinazione, viene utilizzato il file locale delle approvazioni su disco.

`allowlist add|remove` supporta anche `--agent <id>` (il valore predefinito è `"*"`, applicato a tutti gli agenti).

## Note

- L'host Node deve dichiarare `system.execApprovals.get/set` (app macOS, host Node headless o app complementare per Windows).
- I file delle approvazioni vengono archiviati per ciascun host nella directory di stato di OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json` oppure `~/.openclaw/exec-approvals.json` quando la variabile non è impostata.

## Vedi anche

- [Riferimento della CLI](/it/cli)
- [Approvazioni di esecuzione](/it/tools/exec-approvals)
