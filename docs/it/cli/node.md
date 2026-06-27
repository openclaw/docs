---
read_when:
    - Esecuzione dell’host node headless
    - Associazione di un nodo non macOS per system.run
summary: Riferimento CLI per `openclaw node` (host nodo senza interfaccia grafica)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:20:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Esegue un **host Node headless** che si connette al WebSocket del Gateway ed espone
`system.run` / `system.which` su questa macchina.

## Perché usare un host Node?

Usa un host Node quando vuoi che gli agenti **eseguano comandi su altre macchine** nella tua
rete senza installare lì un'app companion macOS completa.

Casi d'uso comuni:

- Eseguire comandi su macchine Linux/Windows remote (server di build, macchine di laboratorio, NAS).
- Mantenere exec **in sandbox** sul gateway, ma delegare le esecuzioni approvate ad altri host.
- Fornire una destinazione di esecuzione leggera e headless per automazione o nodi CI.

L'esecuzione è comunque protetta dalle **approvazioni exec** e da allowlist per agente sull'host
Node, così puoi mantenere l'accesso ai comandi circoscritto ed esplicito.

## Proxy browser (zero-config)

Gli host Node annunciano automaticamente un proxy browser se `browser.enabled` non è
disabilitato sul nodo. Questo permette all'agente di usare l'automazione browser su quel nodo
senza configurazione aggiuntiva.

Per impostazione predefinita, il proxy espone la normale superficie del profilo browser del nodo. Se
imposti `nodeHost.browserProxy.allowProfiles`, il proxy diventa restrittivo:
il targeting di profili non inclusi nell'allowlist viene rifiutato, e le route di
creazione/eliminazione dei profili persistenti vengono bloccate tramite il proxy.

Disabilitalo sul nodo se necessario:

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
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint atteso del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'id del nodo (cancella il token di pairing)
- `--display-name <name>`: sovrascrive il nome visualizzato del nodo

## Autenticazione Gateway per host Node

`openclaw node run` e `openclaw node install` risolvono l'autenticazione del gateway da config/env (nessun flag `--token`/`--password` sui comandi node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` vengono controllati per primi.
- Poi fallback alla configurazione locale: `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host Node intenzionalmente non eredita `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione dell'autenticazione del nodo fallisce in modo chiuso (senza mascheramento tramite fallback remoto).
- In `gateway.mode=remote`, anche i campi del client remoto (`gateway.remote.token` / `gateway.remote.password`) sono idonei secondo le regole di precedenza remota.
- La risoluzione dell'autenticazione dell'host Node onora solo le variabili env `OPENCLAW_GATEWAY_*`.

Per un nodo che si connette a un Gateway `ws://` in chiaro, sono accettati loopback, letterali IP
privati, `.local` e host Tailnet `*.ts.net`. Per altri nomi
private-DNS attendibili, imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; senza
questa opzione, l'avvio del nodo fallisce in modo chiuso e chiede di usare `wss://`, un tunnel SSH o
Tailscale. Questo è un opt-in dell'ambiente di processo, non una chiave di configurazione
`openclaw.json`.
`openclaw node install` lo persiste nel servizio Node supervisionato quando è
presente nell'ambiente del comando di installazione.

## Servizio (in background)

Installa un host Node headless come servizio utente.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host WebSocket del Gateway (predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (predefinita: `18789`)
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint atteso del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'id del nodo (cancella il token di pairing)
- `--display-name <name>`: sovrascrive il nome visualizzato del nodo
- `--runtime <runtime>`: runtime del servizio (`node` o `bun`)
- `--force`: reinstalla/sovrascrive se già installato

Gestisci il servizio:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usa `openclaw node run` per un host Node in primo piano (senza servizio).

I comandi di servizio accettano `--json` per output leggibile dalle macchine.

L'host Node ritenta il riavvio del Gateway e le chiusure di rete nel processo. Se il
Gateway segnala una pausa terminale di autenticazione token/password/bootstrap, l'host Node
registra il dettaglio della chiusura ed esce con codice diverso da zero, così launchd/systemd può riavviarlo con
configurazione e credenziali fresche. Le pause che richiedono pairing restano nel flusso
in primo piano, così la richiesta in sospeso può essere approvata.

## Pairing

La prima connessione crea una richiesta di pairing dispositivo in sospeso (`role: node`) sul Gateway.
Approvala tramite:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Su reti di nodi strettamente controllate, l'operatore del Gateway può esplicitamente attivare
l'approvazione automatica del pairing Node iniziale da CIDR attendibili:

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

Questa opzione è disabilitata per impostazione predefinita. Si applica solo al pairing `role: node` nuovo
senza scope richiesti. Client operatore/browser, Control UI, WebChat, e upgrade di ruolo,
scope, metadati o chiave pubblica richiedono comunque approvazione manuale.

Se il nodo ritenta il pairing con dettagli di autenticazione modificati (ruolo/scope/chiave pubblica),
la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

L'host Node archivia id del nodo, token, nome visualizzato e informazioni di connessione al gateway in
`~/.openclaw/node.json`.

## Approvazioni exec

`system.run` è protetto dalle approvazioni exec locali:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, oppure
  `~/.openclaw/exec-approvals.json` quando la variabile non è impostata
- [Approvazioni exec](/it/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifica dal Gateway)

Per exec Node async approvato, OpenClaw prepara un `systemRunPlan` canonico
prima di richiedere conferma. Il successivo inoltro `system.run` approvato riusa quel piano
archiviato, quindi modifiche ai campi comando/cwd/session dopo la creazione della richiesta di
approvazione vengono rifiutate invece di cambiare ciò che il nodo esegue.

## Correlati

- [Riferimento CLI](/it/cli)
- [Nodi](/it/nodes)
