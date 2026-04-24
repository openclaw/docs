---
read_when:
    - Esecuzione dell'host Node headless
    - Associazione di un Node non macOS per `system.run`
summary: Riferimento CLI per `openclaw node` (host Node headless)
title: Node
x-i18n:
    generated_at: "2026-04-24T08:34:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f2bd6d61ee87d36f7691207d03a91c914e6460549256e0cc6ea7bebfa713923
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Esegui un **host Node headless** che si connette al WebSocket del Gateway ed espone
`system.run` / `system.which` su questa macchina.

## Perché usare un host Node?

Usa un host Node quando vuoi che gli agenti **eseguano comandi su altre macchine** della tua
rete senza installare lì un'app companion macOS completa.

Casi d'uso comuni:

- Eseguire comandi su macchine Linux/Windows remote (build server, macchine di laboratorio, NAS).
- Mantenere l'exec **sandboxed** sul Gateway, ma delegare le esecuzioni approvate ad altri host.
- Fornire un target di esecuzione leggero e headless per automazione o Node CI.

L'esecuzione resta comunque protetta da **approvazioni exec** e allowlist per agente sull'host
Node, così puoi mantenere l'accesso ai comandi circoscritto ed esplicito.

## Proxy del browser (zero-config)

Gli host Node pubblicizzano automaticamente un proxy del browser se `browser.enabled` non è
disabilitato sul Node. Questo consente all'agente di usare l'automazione del browser su quel Node
senza configurazione aggiuntiva.

Per impostazione predefinita, il proxy espone la normale superficie del profilo browser del Node. Se
imposti `nodeHost.browserProxy.allowProfiles`, il proxy diventa restrittivo:
i target di profilo non presenti in allowlist vengono rifiutati e le route di
creazione/eliminazione dei profili persistenti vengono bloccate tramite il proxy.

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
- `--tls`: usa TLS per la connessione al Gateway
- `--tls-fingerprint <sha256>`: fingerprint attesa del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'id del Node (azzera il token di associazione)
- `--display-name <name>`: sovrascrive il nome visualizzato del Node

## Autenticazione del Gateway per host Node

`openclaw node run` e `openclaw node install` risolvono l'autenticazione del Gateway da config/env (nessun flag `--token`/`--password` nei comandi Node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` vengono controllati per primi.
- Poi fallback alla configurazione locale: `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host Node intenzionalmente non eredita `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non è risolto, la risoluzione dell'autenticazione del Node fallisce in modo chiuso (nessun fallback remoto che mascheri il problema).
- In `gateway.mode=remote`, anche i campi del client remoto (`gateway.remote.token` / `gateway.remote.password`) sono validi secondo le regole di precedenza remota.
- La risoluzione dell'autenticazione dell'host Node rispetta solo le variabili env `OPENCLAW_GATEWAY_*`.

Per un Node che si connette a un Gateway `ws://` non loopback su una rete privata
attendibile, imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Senza questo, l'avvio del Node fallisce in modo chiuso e chiede di usare `wss://`, un tunnel SSH o Tailscale.
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
- `--tls`: usa TLS per la connessione al Gateway
- `--tls-fingerprint <sha256>`: fingerprint attesa del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'id del Node (azzera il token di associazione)
- `--display-name <name>`: sovrascrive il nome visualizzato del Node
- `--runtime <runtime>`: runtime del servizio (`node` o `bun`)
- `--force`: reinstalla/sovrascrive se già installato

Gestire il servizio:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usa `openclaw node run` per un host Node in foreground (senza servizio).

I comandi del servizio accettano `--json` per output leggibile dalle macchine.

## Associazione

La prima connessione crea una richiesta di associazione dispositivo in sospeso (`role: node`) sul Gateway.
Approvazione tramite:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se il Node riprova l'associazione con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

L'host Node memorizza id del Node, token, nome visualizzato e informazioni di connessione al Gateway in
`~/.openclaw/node.json`.

## Approvazioni exec

`system.run` è protetto dalle approvazioni exec locali:

- `~/.openclaw/exec-approvals.json`
- [Approvazioni exec](/it/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifica dal Gateway)

Per l'exec Node asincrono approvato, OpenClaw prepara un `systemRunPlan` canonico
prima del prompt. Il successivo inoltro `system.run` approvato riutilizza quel piano
memorizzato, quindi le modifiche ai campi command/cwd/session dopo la creazione della richiesta
di approvazione vengono rifiutate invece di modificare ciò che il Node esegue.

## Correlati

- [Riferimento CLI](/it/cli)
- [Node](/it/nodes)
