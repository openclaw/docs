---
read_when:
    - Esecuzione dell'host del nodo senza interfaccia grafica
    - Abbinamento di un nodo non macOS per system.run
summary: Riferimento CLI per `openclaw node` (host del nodo senza interfaccia grafica)
title: Node
x-i18n:
    generated_at: "2026-05-06T17:53:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
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
- Mantenere l'exec **sandboxed** sul gateway, ma delegare esecuzioni approvate ad altri host.
- Fornire una destinazione di esecuzione leggera e headless per nodi di automazione o CI.

L'esecuzione è comunque protetta da **approvazioni exec** e allowlist per agente sull'host
Node, così puoi mantenere l'accesso ai comandi circoscritto ed esplicito.

## Proxy del browser (zero-config)

Gli host Node pubblicizzano automaticamente un proxy del browser se `browser.enabled` non è
disabilitato sul Node. Questo consente all'agente di usare l'automazione del browser su quel Node
senza configurazione aggiuntiva.

Per impostazione predefinita, il proxy espone la normale superficie del profilo browser del Node. Se
imposti `nodeHost.browserProxy.allowProfiles`, il proxy diventa restrittivo:
il targeting di profili non inclusi nell'allowlist viene rifiutato e le route di
creazione/eliminazione dei profili persistenti sono bloccate attraverso il proxy.

Disabilitalo sul Node se necessario:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Esecuzione (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host WebSocket del Gateway (predefinito: `127.0.0.1`)
- `--port <port>`: porta WebSocket del Gateway (predefinita: `18789`)
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint previsto del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'id del Node (cancella il token di associazione)
- `--display-name <name>`: sovrascrive il nome visualizzato del Node

## Autenticazione Gateway per l'host Node

`openclaw node run` e `openclaw node install` risolvono l'autenticazione del gateway da config/env (nessun flag `--token`/`--password` nei comandi Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` vengono controllati per primi.
- Poi fallback alla configurazione locale: `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host Node intenzionalmente non eredita `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione dell'autenticazione Node fallisce in modo chiuso (nessun fallback remoto che mascheri il problema).
- In `gateway.mode=remote`, anche i campi del client remoto (`gateway.remote.token` / `gateway.remote.password`) sono idonei secondo le regole di precedenza remota.
- La risoluzione dell'autenticazione dell'host Node rispetta solo le variabili env `OPENCLAW_GATEWAY_*`.

Per un Node che si connette a un Gateway `ws://` non local loopback su una rete privata
attendibile, imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Senza questa impostazione, l'avvio del Node
fallisce in modo chiuso e ti chiede di usare `wss://`, un tunnel SSH o Tailscale.
Questo è un opt-in dell'ambiente di processo, non una chiave di configurazione `openclaw.json`.
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
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint previsto del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'id del Node (cancella il token di associazione)
- `--display-name <name>`: sovrascrive il nome visualizzato del Node
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

Usa `openclaw node run` per un host Node in foreground (nessun servizio).

I comandi del servizio accettano `--json` per output leggibile da macchine.

L'host Node ritenta il riavvio del Gateway e le chiusure di rete all'interno del processo. Se il
Gateway segnala una pausa terminale di autenticazione token/password/bootstrap, l'host Node
registra nei log il dettaglio della chiusura ed esce con codice diverso da zero, così launchd/systemd può riavviarlo con
configurazione e credenziali aggiornate. Le pause che richiedono associazione restano nel flusso
foreground, così la richiesta in sospeso può essere approvata.

## Associazione

La prima connessione crea una richiesta di associazione dispositivo in sospeso (`role: node`) sul Gateway.
Approvala tramite:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Su reti Node strettamente controllate, l'operatore del Gateway può fare opt-in esplicito
all'approvazione automatica della prima associazione Node da CIDR attendibili:

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

Questa opzione è disabilitata per impostazione predefinita. Si applica solo a nuove associazioni `role: node` con
nessuno scope richiesto. Client operatore/browser, Control UI, WebChat, e aggiornamenti di ruolo,
scope, metadati o chiave pubblica richiedono comunque l'approvazione manuale.

Se il Node ritenta l'associazione con dettagli di autenticazione modificati (ruolo/scope/chiave pubblica),
la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

L'host Node archivia il suo id Node, token, nome visualizzato e informazioni di connessione al gateway in
`~/.openclaw/node.json`.

## Approvazioni exec

`system.run` è controllato da approvazioni exec locali:

- `~/.openclaw/exec-approvals.json`
- [Approvazioni exec](/it/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifica dal Gateway)

Per l'exec Node asincrono approvato, OpenClaw prepara un `systemRunPlan` canonico
prima di richiedere conferma. Il successivo inoltro `system.run` approvato riusa quel piano
archiviato, quindi le modifiche ai campi command/cwd/session dopo la creazione della richiesta di approvazione
vengono rifiutate invece di cambiare ciò che il Node esegue.

## Correlati

- [Riferimento CLI](/it/cli)
- [Node](/it/nodes)
