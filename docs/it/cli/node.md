---
read_when:
    - Esecuzione dell'host Node headless
    - Associare un nodo non macOS per system.run
summary: Riferimento CLI per `openclaw node` (host nodo headless)
title: Node
x-i18n:
    generated_at: "2026-07-01T13:04:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Esegui un **host Node headless** che si connette al WebSocket del Gateway ed espone
`system.run` / `system.which` su questa macchina.

## Perché usare un host Node?

Usa un host Node quando vuoi che gli agenti **eseguano comandi su altre macchine** nella tua
rete senza installare lì un'app companion macOS completa.

Casi d'uso comuni:

- Eseguire comandi su macchine Linux/Windows remote (server di build, macchine di laboratorio, NAS).
- Mantenere l'exec **in sandbox** sul gateway, ma delegare le esecuzioni approvate ad altri host.
- Fornire una destinazione di esecuzione headless e leggera per nodi di automazione o CI.

L'esecuzione resta protetta dalle **approvazioni exec** e da allowlist per agente sull'host
Node, così puoi mantenere l'accesso ai comandi circoscritto ed esplicito.

## Proxy browser (zero configurazione)

Gli host Node pubblicizzano automaticamente un proxy browser se `browser.enabled` non è
disabilitato sul nodo. Questo consente all'agente di usare l'automazione del browser su quel nodo
senza configurazione aggiuntiva.

Per impostazione predefinita, il proxy espone la normale superficie del profilo browser del nodo. Se
imposti `nodeHost.browserProxy.allowProfiles`, il proxy diventa restrittivo:
il targeting di profili non presenti nell'allowlist viene rifiutato e le route di
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

## Esecuzione (primo piano)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host WebSocket del Gateway (predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (predefinita: `18789`)
- `--context-path <path>`: percorso di contesto WebSocket del Gateway (ad es. `/openclaw-gw`). Aggiunto all'URL WebSocket.
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint previsto del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'ID del nodo (cancella il token di associazione)
- `--display-name <name>`: sovrascrive il nome visualizzato del nodo

## Autenticazione Gateway per l'host Node

`openclaw node run` e `openclaw node install` risolvono l'autenticazione gateway da config/env (nessun flag `--token`/`--password` sui comandi node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` vengono controllati per primi.
- Poi fallback alla configurazione locale: `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host Node non eredita intenzionalmente `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione dell'autenticazione del nodo fallisce in modo chiuso (nessun fallback remoto a mascherare il problema).
- In `gateway.mode=remote`, anche i campi del client remoto (`gateway.remote.token` / `gateway.remote.password`) sono idonei secondo le regole di precedenza remota.
- La risoluzione dell'autenticazione dell'host Node onora solo le variabili env `OPENCLAW_GATEWAY_*`.

Per un nodo che si connette a un Gateway `ws://` in chiaro, loopback, letterali IP privati,
`.local` e host Tailnet `*.ts.net` sono accettati. Per altri nomi
private-DNS attendibili, imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`; senza
di esso, l'avvio del nodo fallisce in modo chiuso e ti chiede di usare `wss://`, un tunnel SSH o
Tailscale. Questo è un opt-in dell'ambiente di processo, non una chiave di configurazione
`openclaw.json`.
`openclaw node install` lo rende persistente nel servizio Node supervisionato quando è
presente nell'ambiente del comando di installazione.

## Servizio (background)

Installa un host Node headless come servizio utente.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host WebSocket del Gateway (predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (predefinita: `18789`)
- `--context-path <path>`: percorso di contesto WebSocket del Gateway (ad es. `/openclaw-gw`). Aggiunto all'URL WebSocket.
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint previsto del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'ID del nodo (cancella il token di associazione)
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

Usa `openclaw node run` per un host Node in primo piano (nessun servizio).

I comandi di servizio accettano `--json` per output leggibile dalla macchina.

L'host Node ritenta il riavvio del Gateway e le chiusure di rete all'interno del processo. Se il
Gateway segnala una pausa di autenticazione terminale per token/password/bootstrap, l'host Node
registra i dettagli della chiusura ed esce con codice diverso da zero, così launchd/systemd può riavviarlo con
configurazione e credenziali fresche. Le pause che richiedono associazione restano nel flusso in primo piano,
così la richiesta in sospeso può essere approvata.

## Associazione

La prima connessione crea una richiesta di associazione dispositivo in sospeso (`role: node`) sul Gateway.
Approvala tramite:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Su reti di nodi strettamente controllate, l'operatore del Gateway può scegliere esplicitamente
di approvare automaticamente la prima associazione del nodo da CIDR attendibili:

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

Questa opzione è disabilitata per impostazione predefinita. Si applica solo a nuove associazioni `role: node`
senza ambiti richiesti. Client operatore/browser, Control UI, WebChat e aggiornamenti di ruolo,
ambito, metadati o chiave pubblica richiedono comunque l'approvazione manuale.

Se il nodo ritenta l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

L'host Node archivia ID nodo, token, nome visualizzato e informazioni di connessione al gateway in
`~/.openclaw/node.json`.

## Approvazioni exec

`system.run` è protetto da approvazioni exec locali:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, oppure
  `~/.openclaw/exec-approvals.json` quando la variabile non è impostata
- [Approvazioni exec](/it/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifica dal Gateway)

Per exec Node asincroni approvati, OpenClaw prepara un `systemRunPlan` canonico
prima della richiesta. Il successivo inoltro approvato di `system.run` riusa quel
piano memorizzato, quindi le modifiche ai campi command/cwd/session dopo la creazione della
richiesta di approvazione vengono rifiutate invece di cambiare ciò che il nodo esegue.

## Correlati

- [Riferimento CLI](/it/cli)
- [Nodi](/it/nodes)
