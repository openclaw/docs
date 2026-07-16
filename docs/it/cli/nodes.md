---
read_when:
    - Stai gestendo Node associati (fotocamere, schermo, canvas)
    - È necessario approvare le richieste o invocare i comandi del Node
summary: Riferimento CLI per `openclaw nodes` (stato, associazione, invocazione, fotocamera/canvas/schermo/posizione/notifiche)
title: Nodi
x-i18n:
    generated_at: "2026-07-16T14:03:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gestisce i Node associati (dispositivi) e richiama le funzionalità dei Node.

Correlati: [Panoramica dei Node](/it/nodes) - [Presenza attiva al computer](/nodes/presence) - [Node fotocamera](/it/nodes/camera) - [Node immagini](/it/nodes/images)

Opzioni comuni a ogni sottocomando: `--url <url>`, `--token <token>`, `--timeout <ms>` (valore predefinito `10000`), `--json`.

## Stato

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` e `list` accettano entrambi `--connected` (solo i Node connessi) e `--last-connected <duration>` (ad es. `24h`, `7d`; solo i Node connessi nell'intervallo indicato). `list` mostra i Node in attesa e quelli associati in tabelle separate; le righe dei Node associati includono il tempo trascorso dalla connessione più recente (Last Connect). `status` mostra un'unica tabella combinata con i dettagli relativi a funzionalità, versione e ultimo input per ciascun Node. Un Node macOS connesso segnala l'ultimo input solo quando è concessa l'autorizzazione Accessibilità e la riga più recente è contrassegnata con `active`; vedere [Presenza attiva al computer](/nodes/presence). `describe` mostra le funzionalità, le autorizzazioni, l'attività e i comandi di richiamo effettivi o in attesa di un singolo Node.

## Associazione

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Questi comandi gestiscono l'archivio `node.pair.*` di proprietà del Gateway, distinto dall'associazione dei dispositivi (`openclaw devices approve`) che controlla l'handshake `connect` WS del Node. Vedere [Node](/it/nodes) per la relazione tra i due.

- `remove` revoca la voce del ruolo associato del Node. Per un Node basato su dispositivo, revoca il ruolo `node` nell'archivio di associazione dei dispositivi e disconnette le relative sessioni con ruolo Node: un dispositivo con più ruoli conserva la propria riga e perde solo il ruolo `node`, mentre la riga di un dispositivo con il solo ruolo Node viene eliminata. Elimina inoltre qualsiasi record di associazione Node legacy corrispondente di proprietà del Gateway.
- `pending` richiede soltanto l'ambito `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` può saltare il passaggio di attesa per l'associazione iniziale di un dispositivo `role: node` esplicitamente attendibile. È disattivato per impostazione predefinita e non approva gli aggiornamenti dei ruoli.
- `gateway.nodes.pairing.sshVerify` (attivato per impostazione predefinita) approva automaticamente l'associazione iniziale di un dispositivo `role: node` quando il Gateway può verificare tramite SSH la chiave del dispositivo nell'host del Node; la prima superficie di funzionalità viene approvata nello stesso passaggio. Vedere [Associazione dei Node](/it/gateway/pairing#ssh-verified-device-auto-approval-default).
- I requisiti degli ambiti di `approve` dipendono dai comandi dichiarati dalla richiesta in attesa:
  - richiesta senza comandi: `operator.pairing`
  - comandi Node ordinari: `operator.pairing` + `operator.write`
  - comandi sensibili per gli amministratori (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` e `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- ambito di `remove`: `operator.pairing` può rimuovere le righe dei Node non operatore; un chiamante con token del dispositivo che revoca il proprio ruolo Node su un dispositivo con più ruoli richiede inoltre `operator.admin`.

## Richiamo

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Flag:

- `--command <command>` (obbligatorio): ad es. `canvas.eval`.
- `--params <json>`: stringa contenente un oggetto JSON (valore predefinito `{}`).
- `--invoke-timeout <ms>`: timeout del richiamo del Node (valore predefinito `15000`).
- `--idempotency-key <key>`: chiave di idempotenza facoltativa.

`system.run` e `system.run.prepare` sono bloccati in questo contesto; per l'esecuzione nella shell, utilizzare invece lo strumento `exec` con `host=node`. `system.which` è consentito tramite `invoke`.

## Notifiche, push, posizione e schermo

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` invia una notifica locale su un Node che dichiara `system.notify`, inclusi i Node macOS, iOS, Android e watchOS diretti. La consegna diretta su watchOS richiede che OpenClaw sia attivo. Richiede `--title` o `--body`. Opzioni: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (valore predefinito `system`), `--invoke-timeout <ms>` (valore predefinito `15000`).
- `push` invia una notifica push di prova APNs a un Node iOS. Opzioni: `--title <text>` (valore predefinito `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` per sostituire l'ambiente APNs rilevato.
- `location get` recupera la posizione corrente del Node. Opzioni: `--max-age <ms>` (riutilizza una posizione memorizzata nella cache), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (valore predefinito `10000`), `--invoke-timeout <ms>` (valore predefinito `20000`).
- `screen record` acquisisce una breve clip e mostra il percorso di salvataggio (oppure scrive dati JSON con `--json`). Opzioni: `--screen <index>` (valore predefinito `0`), `--duration <ms|10s>` (valore predefinito `10000`), `--fps <fps>` (valore predefinito `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (valore predefinito `120000`).

I comandi Fotocamera e Canvas dispongono di documentazione specifica: [Node fotocamera](/it/nodes/camera), [Canvas](/it/platforms/mac/canvas). Canvas è implementato dal Plugin Canvas sperimentale incluso; il core mantiene `openclaw nodes canvas` come punto di montaggio per la compatibilità.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Node](/it/nodes)
