---
read_when:
    - Esecuzione dell'host nodo headless
    - Abbinamento di un nodo non macOS per system.run
summary: Riferimento CLI per `openclaw node` (host nodo headless)
title: node
x-i18n:
    generated_at: "2026-04-05T13:48:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6123b33ec46f2b85f2c815947435ac91bbe84456165ff0e504453356da55b46d
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Esegue un **host nodo headless** che si connette al Gateway WebSocket ed espone
`system.run` / `system.which` su questa macchina.

## Perché usare un host nodo?

Usa un host nodo quando vuoi che gli agenti **eseguano comandi su altre macchine** nella tua
rete senza installare lì un'app companion macOS completa.

Casi d'uso comuni:

- Eseguire comandi su macchine Linux/Windows remote (server di build, macchine di laboratorio, NAS).
- Mantenere exec **sandboxed** sul gateway, ma delegare le esecuzioni approvate ad altri host.
- Fornire un target di esecuzione leggero e headless per nodi di automazione o CI.

L'esecuzione è comunque protetta da **approvazioni exec** e allowlist per agente sull'host
nodo, così puoi mantenere l'accesso ai comandi delimitato ed esplicito.

## Browser proxy (zero-config)

Gli host nodo pubblicizzano automaticamente un browser proxy se `browser.enabled` non è
disabilitato sul nodo. Questo permette all'agente di usare l'automazione del browser su quel nodo
senza configurazione aggiuntiva.

Per impostazione predefinita, il proxy espone la normale superficie del profilo browser del nodo. Se
imposti `nodeHost.browserProxy.allowProfiles`, il proxy diventa restrittivo:
il targeting di profili non presenti nella allowlist viene rifiutato, e le route di
creazione/eliminazione dei profili persistenti vengono bloccate attraverso il proxy.

Disabilitalo sul nodo, se necessario:

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

- `--host <host>`: host del Gateway WebSocket (predefinito: `127.0.0.1`)
- `--port <port>`: porta del Gateway WebSocket (predefinito: `18789`)
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint previsto del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'ID del nodo (cancella il token di abbinamento)
- `--display-name <name>`: sovrascrive il nome visualizzato del nodo

## Auth Gateway per host nodo

`openclaw node run` e `openclaw node install` risolvono l'auth del gateway da config/env (nessun flag `--token`/`--password` sui comandi node):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` vengono controllati per primi.
- Poi fallback della config locale: `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host nodo intenzionalmente non eredita `gateway.remote.token` / `gateway.remote.password`.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione dell'auth del nodo fallisce in modo fail-closed (nessun masking del fallback remoto).
- In `gateway.mode=remote`, i campi del client remoto (`gateway.remote.token` / `gateway.remote.password`) sono anch'essi idonei secondo le regole di precedenza remota.
- La risoluzione dell'auth dell'host nodo rispetta solo le variabili env `OPENCLAW_GATEWAY_*`.

## Servizio (background)

Installa un host nodo headless come servizio utente.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opzioni:

- `--host <host>`: host del Gateway WebSocket (predefinito: `127.0.0.1`)
- `--port <port>`: porta del Gateway WebSocket (predefinito: `18789`)
- `--tls`: usa TLS per la connessione al gateway
- `--tls-fingerprint <sha256>`: fingerprint previsto del certificato TLS (sha256)
- `--node-id <id>`: sovrascrive l'ID del nodo (cancella il token di abbinamento)
- `--display-name <name>`: sovrascrive il nome visualizzato del nodo
- `--runtime <runtime>`: runtime del servizio (`node` o `bun`)
- `--force`: reinstalla/sovrascrive se già installato

Gestisci il servizio:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usa `openclaw node run` per un host nodo in foreground (senza servizio).

I comandi del servizio accettano `--json` per output leggibile da macchina.

## Abbinamento

La prima connessione crea una richiesta di abbinamento dispositivo in attesa (`role: node`) sul Gateway.
Approvala tramite:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se il nodo riprova l'abbinamento con dettagli auth cambiati (role/scopes/public key),
la precedente richiesta in attesa viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

L'host nodo memorizza l'ID del nodo, il token, il nome visualizzato e le informazioni di connessione al gateway in
`~/.openclaw/node.json`.

## Approvazioni exec

`system.run` è regolato da approvazioni exec locali:

- `~/.openclaw/exec-approvals.json`
- [Approvazioni exec](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifica dal Gateway)

Per exec asincrono del nodo approvato, OpenClaw prepara un `systemRunPlan`
canonico prima del prompt. Il successivo inoltro `system.run` approvato riutilizza quel
piano memorizzato, quindi le modifiche ai campi command/cwd/session dopo la creazione
della richiesta di approvazione vengono rifiutate invece di cambiare ciò che il nodo esegue.
