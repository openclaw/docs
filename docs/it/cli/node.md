---
read_when:
    - Esecuzione dell'host Node headless
    - Associazione di un Node non macOS per system.run
summary: Riferimento della CLI per `openclaw node` (host Node senza interfaccia grafica)
title: Node
x-i18n:
    generated_at: "2026-07-12T06:54:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Esegue un **host Node headless** che si connette al WebSocket del Gateway ed espone
`system.run` / `system.which` su questa macchina.

## Perché usare un host Node?

Usa un host Node quando vuoi che gli agenti **eseguano comandi su altre macchine** nella tua
rete senza installarvi un'app complementare completa per macOS.

Casi d'uso comuni:

- Eseguire comandi su macchine Linux/Windows remote (server di compilazione, macchine di laboratorio, NAS).
- Mantenere l'esecuzione **isolata** sul Gateway, delegando però le esecuzioni approvate ad altri host.
- Fornire una destinazione di esecuzione leggera e headless per l'automazione o i nodi CI.

L'esecuzione rimane protetta dalle **approvazioni di esecuzione** e dagli elenchi di elementi consentiti per agente sull'host
Node, così puoi mantenere l'accesso ai comandi limitato ed esplicito.

`openclaw node run` può pubblicare strumenti supportati da plugin o MCP dopo la connessione.
Per impostazione predefinita, il Gateway considera attendibili i descrittori del Node associato, ma richiede
che il comando di ciascun descrittore rimanga nell'insieme di comandi approvati del Node. L'agente
vede ogni descrittore accettato come un normale strumento plugin, ma l'esecuzione continua
a passare attraverso `node.invoke`; di conseguenza, la disconnessione del Node rimuove lo strumento dalle nuove
esecuzioni degli agenti. Gli operatori del Gateway possono disabilitare la pubblicazione con
`gateway.nodes.pluginTools.enabled: false`.

Per gli strumenti MCP dichiarativi, aggiungi la normale struttura del server MCP in
`nodeHost.mcp.servers` nel file `openclaw.json` sulla macchina Node, quindi riavvia l'host
Node. Il Node dichiara la famiglia di comandi `mcp.tools.call.v1`, soggetta ad approvazione,
e pubblica gli strumenti elencati dopo la connessione; modificare successivamente l'elenco dei server
non richiede una nuova associazione. Consulta
[Server MCP ospitati dal Node](/it/nodes#node-hosted-mcp-servers).

## Proxy del browser (senza configurazione)

Gli host Node pubblicizzano automaticamente un proxy del browser se `browser.enabled` non è
disabilitato sul Node. Ciò consente all'agente di usare l'automazione del browser su quel Node
senza configurazioni aggiuntive.

Per impostazione predefinita, il proxy espone il normale insieme di profili del browser del Node. Se
imposti `nodeHost.browserProxy.allowProfiles`, il proxy diventa restrittivo:
la selezione di profili non inclusi nell'elenco degli elementi consentiti viene rifiutata e le route per
creare/eliminare profili persistenti vengono bloccate tramite il proxy.

Se necessario, disabilitalo sul Node:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Esecuzione (in primo piano)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host WebSocket del Gateway (valore predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (valore predefinito: `18789`)
- `--context-path <path>`: percorso di contesto del WebSocket del Gateway (ad es. `/openclaw-gw`). Viene aggiunto all'URL WebSocket.
- `--tls`: usa TLS per la connessione al Gateway
- `--no-tls`: forza una connessione al Gateway in testo non cifrato anche quando la configurazione locale del Gateway abilita TLS
- `--tls-fingerprint <sha256>`: impronta prevista del certificato TLS (sha256)
- `--node-id <id>`: sostituisce l'ID dell'istanza client legacy memorizzato in `node.json` (non reimposta l'associazione)
- `--display-name <name>`: sostituisce il nome visualizzato del Node

## Autenticazione del Gateway per l'host Node

`openclaw node run` e `openclaw node install` risolvono l'autenticazione del Gateway dalla configurazione/dall'ambiente (i comandi Node non dispongono dei flag `--token`/`--password`):

- Vengono controllati prima `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Successivamente viene usata la configurazione locale come ripiego: `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host Node non eredita intenzionalmente `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non viene risolto, la risoluzione dell'autenticazione del Node fallisce in modalità sicura (nessun ripiego remoto che mascheri l'errore).
- Con `gateway.mode=remote`, sono idonei anche i campi del client remoto (`gateway.remote.token` / `gateway.remote.password`), secondo le regole di precedenza remota.
- La risoluzione dell'autenticazione dell'host Node considera solo le variabili d'ambiente `OPENCLAW_GATEWAY_*`.

Per un Node che si connette a un Gateway `ws://` in testo non cifrato, sono accettati local loopback, valori letterali
di IP privati, `.local` e host Tailnet `*.ts.net`. Per altri nomi DNS privati
attendibili, imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; senza questa variabile,
l'avvio del Node fallisce in modalità sicura e richiede di usare `wss://`, un tunnel SSH o
Tailscale. Questa è un'abilitazione esplicita tramite l'ambiente del processo, non una chiave di configurazione di
`openclaw.json`.
Quando è presente nell'ambiente del comando di installazione, `openclaw node install` la rende persistente
nel servizio Node supervisionato.

## Servizio (in background)

Installa un host Node headless come servizio utente (launchd su macOS, systemd su
Linux, Utilità di pianificazione su Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host WebSocket del Gateway (valore predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (valore predefinito: `18789`)
- `--context-path <path>`: percorso di contesto del WebSocket del Gateway (ad es. `/openclaw-gw`). Viene aggiunto all'URL WebSocket.
- `--tls`: usa TLS per la connessione al Gateway
- `--tls-fingerprint <sha256>`: impronta prevista del certificato TLS (sha256)
- `--node-id <id>`: sostituisce l'ID dell'istanza client legacy memorizzato in `node.json` (non reimposta l'associazione)
- `--display-name <name>`: sostituisce il nome visualizzato del Node
- `--runtime <runtime>`: runtime del servizio (`node` o `bun`)
- `--force`: reinstalla/sovrascrive se è già installato

Gestisci il servizio:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usa `openclaw node run` per un host Node in primo piano (senza servizio).

I comandi del servizio accettano `--json` per un output leggibile dalla macchina.

L'host Node ritenta internamente in caso di riavvio del Gateway e chiusure di rete. Se il
Gateway segnala una pausa terminale dell'autenticazione tramite token/password/bootstrap, l'host Node
registra i dettagli della chiusura ed esce con un codice diverso da zero, in modo che launchd/systemd/Utilità di pianificazione
possa riavviarlo con configurazione e credenziali aggiornate. Le pause che richiedono l'associazione rimangono
nel flusso in primo piano, così la richiesta in sospeso può essere approvata.

## Associazione

La prima connessione crea una richiesta in sospeso di associazione del dispositivo (`role: node`) sul Gateway.

Quando l'host del Gateway può connettersi tramite SSH all'host Node in modo non interattivo (stesso utente,
chiave host attendibile), la richiesta in sospeso viene approvata automaticamente: il Gateway
esegue `openclaw node identity --json` sull'host Node tramite SSH e approva se la chiave del dispositivo
corrisponde esattamente. Questa funzionalità è attiva per impostazione predefinita; consulta
[Approvazione automatica del dispositivo verificata tramite SSH](/it/gateway/pairing#ssh-verified-device-auto-approval-default)
per i requisiti e le istruzioni per disabilitarla (`gateway.nodes.pairing.sshVerify: false`).

Altrimenti, approva manualmente tramite:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Controlla l'identità locale del Node rispetto alla quale il Gateway effettua la verifica:

```bash
openclaw node identity --json
```

Il comando stampa l'ID del dispositivo e la chiave pubblica da `identity/device.json` e non
crea né modifica mai i file di identità.

Nelle reti di Node strettamente controllate, l'operatore del Gateway può abilitare esplicitamente
l'approvazione automatica della prima associazione del Node da CIDR attendibili:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Questa funzionalità è disabilitata per impostazione predefinita (`autoApproveCidrs` non è impostato). Si applica solo
alle nuove associazioni `role: node` senza ambiti richiesti, provenienti da un IP client considerato
attendibile dal Gateway. I client operatore/browser, Control UI, WebChat e gli aggiornamenti di ruolo,
ambito, metadati o chiave pubblica richiedono comunque l'approvazione manuale.

Se il Node ritenta l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui nuovamente `openclaw devices list` prima dell'approvazione.

### Stato dell'identità e dell'associazione

Il Node headless separa il proprio ID dell'istanza client legacy dall'identità firmata del dispositivo
usata dal Gateway per l'associazione e l'instradamento. Questi file si trovano nella
directory di stato di OpenClaw (`~/.openclaw` per impostazione predefinita oppure `$OPENCLAW_STATE_DIR`
quando è impostata):

| File                        | Scopo                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | ID dell'istanza client nella chiave legacy `nodeId`, nome visualizzato e metadati di connessione al Gateway. Il client invia questo valore come `instanceId`. |
| `identity/device.json`      | Coppia di chiavi Ed25519 firmata e ID del dispositivo derivato. Per le connessioni firmate, questo ID del dispositivo è l'ID del Node instradato e l'identità di associazione. |
| `identity/device-auth.json` | Token dei dispositivi associati, indicizzati in base all'ID crittografico del dispositivo e al ruolo.                                        |

`--node-id` modifica solo l'ID dell'istanza client in `node.json`. Non
modifica l'ID crittografico del dispositivo né cancella l'autenticazione dell'associazione. Analogamente, eliminare soltanto
`node.json` non reimposta l'associazione. Per revocare e associare nuovamente un Node:

1. Sul Gateway, esegui `openclaw nodes remove --node <id|name|ip>`.
2. Sul Node, riavvia il servizio installato con `openclaw node restart` oppure
   arresta e riesegui il comando in primo piano `openclaw node run`. Questo avvia il
   flusso di associazione del dispositivo. Se `openclaw devices list` non mostra una richiesta
   e il Node segnala `AUTH_DEVICE_TOKEN_MISMATCH`, riavvialo o rieseguilo ancora
   una volta. Il tentativo rifiutato cancella il token locale ormai revocato; il tentativo
   successivo può richiedere l'associazione.
3. Sul Gateway, esegui `openclaw devices list`, quindi
   `openclaw devices approve <deviceRequestId>`.
4. Riavvia o riesegui nuovamente il Node. Un client sospeso in attesa dell'associazione non riprende
   automaticamente dopo l'approvazione; questa riconnessione crea la richiesta separata
   per l'insieme dei comandi.
5. Sul Gateway, esegui `openclaw nodes pending`, quindi
   `openclaw nodes approve <nodeRequestId>`.

I due ID richiesta sono distinti. Una policy applicabile basata su CIDR attendibili può
approvare automaticamente il passaggio iniziale di associazione del dispositivo; l'approvazione dell'insieme dei comandi rimane
un controllo separato.

Le versioni precedenti di OpenClaw potevano lasciare un campo legacy `token` in `node.json`.
La versione corrente di OpenClaw non usa tale campo e lo rimuove la volta successiva in cui l'host Node
salva il file. Mantieni privati entrambi i file in `identity/`; contengono la
coppia di chiavi del dispositivo e i token di autenticazione.

## Approvazioni di esecuzione

`system.run` è soggetto alle approvazioni di esecuzione locali:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` oppure
  `~/.openclaw/exec-approvals.json` quando la variabile non è impostata
- [Approvazioni di esecuzione](/it/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifica dal Gateway)

Per l'esecuzione asincrona approvata sul Node, OpenClaw prepara un `systemRunPlan` canonico
prima di richiedere l'approvazione. Il successivo inoltro approvato di `system.run` riutilizza il piano
memorizzato, pertanto le modifiche ai campi comando/cwd/sessione apportate dopo la creazione della richiesta
di approvazione vengono rifiutate invece di modificare ciò che il Node esegue.

## Contenuti correlati

- [Riferimento CLI](/it/cli)
- [Nodi](/it/nodes)
