---
read_when:
    - Esecuzione dell'host Node headless
    - Associazione di un Node non macOS per system.run
summary: Riferimento CLI per `openclaw node` (host Node headless)
title: Node
x-i18n:
    generated_at: "2026-07-16T14:13:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Eseguire un **host Node headless** che si connette al WebSocket del Gateway ed espone
`system.run` / `system.which` su questa macchina.

Su macOS, l'app della barra dei menu incorpora già questo runtime dell'host Node nella propria
connessione Node e aggiunge funzionalità native per Mac. Usare `openclaw node run` su un
Mac solo quando si desidera intenzionalmente un Node headless senza l'app. L'esecuzione
di entrambi crea due identità Node per la stessa macchina.

## Perché usare un host Node?

Usare un host Node quando si desidera consentire agli agenti di **eseguire comandi su altre macchine** nella propria
rete senza installarvi un'app complementare macOS completa.

Casi d'uso comuni:

- Eseguire comandi su macchine Linux/Windows remote (server di compilazione, macchine di laboratorio, NAS).
- Mantenere exec **in sandbox** sul Gateway, ma delegare le esecuzioni approvate ad altri host.
- Fornire una destinazione di esecuzione leggera e headless per l'automazione o i nodi CI.

L'esecuzione rimane protetta dalle **approvazioni exec** e dalle liste di elementi consentiti per agente
sull'host Node, in modo che l'accesso ai comandi possa rimanere circoscritto ed esplicito.

`openclaw node run` può pubblicare strumenti supportati da Plugin o MCP dopo la connessione.
Per impostazione predefinita, il Gateway considera attendibili i descrittori del Node associato, richiedendo
al contempo che il comando di ciascun descrittore rimanga nella superficie dei comandi approvati del Node. L'
agente vede ogni descrittore accettato come un normale strumento Plugin, ma l'esecuzione passa comunque
attraverso `node.invoke`, pertanto la disconnessione del Node rimuove lo strumento dalle nuove
esecuzioni degli agenti. Gli operatori del Gateway possono disabilitare la pubblicazione con
`gateway.nodes.pluginTools.enabled: false`.

Per gli strumenti MCP dichiarativi, aggiungere la normale struttura del server MCP in
`nodeHost.mcp.servers` in `openclaw.json` sulla macchina Node, quindi riavviare l'
host Node. Il Node dichiara la famiglia di comandi `mcp.tools.call.v1` soggetta ad approvazione
e pubblica gli strumenti elencati dopo la connessione; la successiva modifica dell'elenco dei server
non richiede una nuova associazione. Vedere
[Server MCP ospitati sul Node](/it/nodes#node-hosted-mcp-servers).

## Proxy del browser (senza configurazione)

Gli host Node pubblicizzano automaticamente un proxy del browser se `browser.enabled` non è
disabilitato sul Node. Ciò consente all'agente di usare l'automazione del browser su quel Node
senza configurazione aggiuntiva.

Per impostazione predefinita, il proxy espone la normale superficie dei profili del browser del Node. Se si
imposta `nodeHost.browserProxy.allowProfiles`, il proxy diventa restrittivo:
la selezione di profili non inclusi nell'elenco degli elementi consentiti viene rifiutata e le route per la
creazione/eliminazione di profili persistenti vengono bloccate tramite il proxy.

Se necessario, disabilitarlo sul Node:

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

- `--host <host>`: host WebSocket del Gateway (predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (predefinita: `18789`)
- `--context-path <path>`: percorso di contesto WebSocket del Gateway (ad es. `/openclaw-gw`). Aggiunto all'URL WebSocket.
- `--tls`: usa TLS per la connessione al Gateway
- `--no-tls`: forza una connessione al Gateway in testo non crittografato anche quando la configurazione locale del Gateway abilita TLS
- `--tls-fingerprint <sha256>`: impronta digitale prevista del certificato TLS (sha256)
- `--node-id <id>`: sostituisce l'ID dell'istanza client archiviato nello stato SQLite condiviso (non reimposta l'associazione)
- `--display-name <name>`: sostituisce il nome visualizzato del Node

## Autenticazione del Gateway per l'host Node

`openclaw node run` e `openclaw node install` risolvono l'autenticazione del Gateway dalla configurazione/dall'ambiente (nessun flag `--token`/`--password` nei comandi Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` vengono controllati per primi.
- Quindi viene usato il fallback della configurazione locale: `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host Node intenzionalmente non eredita `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non viene risolto, la risoluzione dell'autenticazione del Node fallisce in modo sicuro (senza che un fallback remoto mascheri l'errore).
- In `gateway.mode=remote`, anche i campi del client remoto (`gateway.remote.token` / `gateway.remote.password`) sono idonei secondo le regole di precedenza remota.
- La risoluzione dell'autenticazione dell'host Node considera solo le variabili di ambiente `OPENCLAW_GATEWAY_*`.

Per un Node che si connette a un Gateway `ws://` in testo non crittografato, sono accettati loopback, indirizzi IP
privati letterali, `.local` e host `*.ts.net` della Tailnet. Per altri
nomi DNS privati attendibili, impostare `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; in sua
assenza, l'avvio del Node fallisce in modo sicuro e richiede di usare `wss://`, un tunnel SSH o
Tailscale. Si tratta di un consenso esplicito tramite l'ambiente del processo, non di una chiave di configurazione
`openclaw.json`.
`openclaw node install` lo mantiene nel servizio Node supervisionato quando è
presente nell'ambiente del comando di installazione.

## Servizio (in background)

Installare un host Node headless come servizio utente (launchd su macOS, systemd su
Linux, Utilità di pianificazione su Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host WebSocket del Gateway (predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (predefinita: `18789`)
- `--context-path <path>`: percorso di contesto WebSocket del Gateway (ad es. `/openclaw-gw`). Aggiunto all'URL WebSocket.
- `--tls`: usa TLS per la connessione al Gateway
- `--tls-fingerprint <sha256>`: impronta digitale prevista del certificato TLS (sha256)
- `--node-id <id>`: sostituisce l'ID dell'istanza client archiviato nello stato SQLite condiviso (non reimposta l'associazione)
- `--display-name <name>`: sostituisce il nome visualizzato del Node
- `--runtime <runtime>`: runtime del servizio (`node`)
- `--force`: reinstalla/sovrascrive se già installato

Gestire il servizio:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usare `openclaw node run` per un host Node in primo piano (senza servizio).

I comandi del servizio accettano `--json` per un output leggibile dalla macchina.

L'host Node ritenta nel processo in caso di riavvio del Gateway e chiusure di rete. Se il
Gateway segnala una pausa terminale dell'autenticazione mediante token/password/bootstrap, l'host Node
registra i dettagli della chiusura ed esce con un codice diverso da zero, in modo che launchd/systemd/Utilità di pianificazione possa
riavviarlo con configurazione e credenziali aggiornate. Le pause che richiedono l'associazione rimangono nel
flusso in primo piano affinché la richiesta in sospeso possa essere approvata.

## Associazione

La prima connessione crea una richiesta di associazione del dispositivo in sospeso (`role: node`) sul Gateway.

Quando l'host del Gateway può connettersi tramite SSH all'host Node in modo non interattivo (stesso utente,
chiave host attendibile), la richiesta in sospeso viene approvata automaticamente: il Gateway
esegue `openclaw node identity --json` sull'host Node tramite SSH e approva in caso
di corrispondenza esatta della chiave del dispositivo. Questa funzione è abilitata per impostazione predefinita; vedere
[Approvazione automatica del dispositivo verificata tramite SSH](/it/gateway/pairing#ssh-verified-device-auto-approval-default)
per i requisiti e le istruzioni per disabilitarla (`gateway.nodes.pairing.sshVerify: false`).

Altrimenti, approvare manualmente tramite:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Esaminare l'identità locale del Node rispetto alla quale il Gateway esegue la verifica:

```bash
openclaw node identity --json
```

Il comando stampa l'ID del dispositivo e la chiave pubblica da `identity/device.json` e non
crea né modifica mai i file di identità.

Nelle reti di Node strettamente controllate, l'operatore del Gateway può acconsentire esplicitamente
all'approvazione automatica della prima associazione del Node da CIDR attendibili:

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

Questa funzione è disabilitata per impostazione predefinita (`autoApproveCidrs` non è impostato). Si applica solo a
una nuova associazione `role: node` senza ambiti richiesti, proveniente da un IP client considerato
attendibile dal Gateway. I client operatore/browser, Control UI, WebChat e gli aggiornamenti di ruolo,
ambito, metadati o chiave pubblica richiedono comunque l'approvazione manuale.

Se il Node ritenta l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Eseguire nuovamente `openclaw devices list` prima dell'approvazione.

### Stato dell'identità e dell'associazione

Il Node headless separa l'ID della propria istanza client dall'identità firmata del dispositivo
usata dal Gateway per l'associazione e l'instradamento. Questo stato si trova nella
directory di stato di OpenClaw (`~/.openclaw` per impostazione predefinita, oppure `$OPENCLAW_STATE_DIR`
quando impostata):

| Stato                                        | Scopo                                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | ID dell'istanza client, nome visualizzato e metadati di connessione al Gateway. Il client invia questo ID come `instanceId`.                     |
| `identity/device.json`                       | Coppia di chiavi Ed25519 firmata e ID del dispositivo derivato. Per le connessioni firmate, questo ID del dispositivo è l'ID del Node instradato e l'identità di associazione. |
| `identity/device-auth.json`                  | Token dei dispositivi associati, indicizzati per ID crittografico del dispositivo e ruolo.                                                                 |

`--node-id` modifica solo l'ID dell'istanza client nello stato SQLite condiviso. Non
modifica l'ID crittografico del dispositivo né cancella l'autenticazione dell'associazione. Anche la migrazione di un
`node.json` ritirato con `openclaw doctor --fix` non reimposta l'associazione. Per
revocare e associare nuovamente un Node:

1. Sul Gateway, eseguire `openclaw nodes remove --node <id|name|ip>`.
2. Sul Node, riavviare il servizio installato con `openclaw node restart`, oppure
   arrestare e rieseguire il comando in primo piano `openclaw node run`. Viene così avviato il
   flusso di associazione del dispositivo. Se `openclaw devices list` non mostra una richiesta
   e il Node segnala `AUTH_DEVICE_TOKEN_MISMATCH`, riavviarlo o rieseguirlo una
   seconda volta. Il tentativo rifiutato cancella il token locale ormai revocato; il tentativo
   successivo può richiedere l'associazione.
3. Sul Gateway, eseguire `openclaw devices list`, quindi
   `openclaw devices approve <deviceRequestId>`.
4. Riavviare o rieseguire nuovamente il Node. Un client in pausa per l'associazione non riprende
   automaticamente dopo l'approvazione; questa riconnessione crea la richiesta separata
   per la superficie dei comandi.
5. Sul Gateway, eseguire `openclaw nodes pending`, quindi
   `openclaw nodes approve <nodeRequestId>`.

I due ID richiesta sono distinti. Un criterio CIDR attendibile applicabile può
approvare automaticamente la fase iniziale di associazione del dispositivo; l'approvazione della superficie dei comandi rimane
un controllo separato.

Le versioni precedenti di OpenClaw archiviavano lo stato dell'host Node in `node.json` e potevano lasciare un
campo `token` obsoleto al suo interno. Arrestare l'host Node ed eseguire `openclaw doctor --fix`
una volta; Doctor importa in SQLite i campi supportati relativi all'identità e alla connessione,
elimina il campo token inutilizzato, verifica la riga e rimuove il file ritirato.
I normali comandi Node falliscono in modo sicuro mostrando questa istruzione di riparazione finché il file o
una dichiarazione Doctor interrotta rimangono presenti. Mantenere privati entrambi i file in `identity/`;
contengono la coppia di chiavi del dispositivo e i token di autenticazione.

## Approvazioni exec

`system.run` è soggetto alle approvazioni exec locali:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, oppure
  `~/.openclaw/exec-approvals.json` quando la variabile non è impostata
- [Approvazioni exec](/it/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modificare dal Gateway)

Per l'esecuzione exec asincrona approvata sul Node, OpenClaw prepara un `systemRunPlan` canonico
prima di richiedere l'approvazione. Il successivo inoltro `system.run` approvato riutilizza il piano
archiviato, pertanto le modifiche ai campi comando/cwd/sessione dopo la creazione della richiesta di approvazione
vengono rifiutate anziché modificare ciò che il Node esegue.

## Argomenti correlati

- [Riferimento CLI](/it/cli)
- [Node](/it/nodes)
