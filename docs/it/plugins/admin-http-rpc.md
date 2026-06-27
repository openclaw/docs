---
read_when:
    - Creazione di strumenti host che non possono usare il client RPC WebSocket del Gateway
    - Esporre l'automazione amministrativa del Gateway dietro un ingresso privato attendibile
    - Verifica del modello di sicurezza per l’accesso HTTP ai metodi Gateway
summary: Espone i metodi selezionati del piano di controllo del Gateway tramite il plugin admin-http-rpc integrato e opt-in
title: Plugin RPC HTTP di amministrazione
x-i18n:
    generated_at: "2026-06-27T17:46:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Il plugin `admin-http-rpc` incluso espone metodi selezionati del control plane del Gateway tramite HTTP per automazioni host attendibili che non possono usare il normale client RPC WebSocket del Gateway.

Il plugin è incluso in OpenClaw, ma è disattivato per impostazione predefinita. Quando è disattivato, la rotta non viene registrata. Quando è attivato, aggiunge:

- `POST /api/v1/admin/rpc`
- lo stesso listener del Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

Attivalo solo per strumenti host privati, automazioni tailnet o un ingresso interno attendibile. Non esporre questa rotta direttamente a internet pubblico.

## Prima di attivarlo

Admin HTTP RPC è una superficie completa di control plane operatore. Qualsiasi chiamante che supera l'autenticazione HTTP del Gateway può invocare i metodi in allowlist in questa pagina.

Usalo quando tutte queste condizioni sono vere:

- Il chiamante è attendibile per operare il Gateway.
- Il chiamante non può usare il client RPC WebSocket.
- La rotta è raggiungibile solo su loopback, una tailnet o un ingresso privato autenticato.
- Hai esaminato i metodi consentiti e corrispondono all'automazione che intendi eseguire.

Usa il percorso RPC WebSocket per i client OpenClaw e gli strumenti interattivi che possono mantenere aperta una connessione WebSocket al Gateway.

## Attivazione

Attiva il plugin incluso:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

La rotta viene registrata durante l'avvio del plugin. Riavvia il Gateway dopo aver modificato la configurazione del plugin.

Disattivalo quando non hai più bisogno della superficie HTTP:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Verificare la rotta

Usa `health` come richiesta sicura minima:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Una risposta riuscita ha `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Quando il plugin è disattivato, la rotta restituisce `404` perché non è registrata.

## Autenticazione

La rotta del plugin usa l'autenticazione HTTP del Gateway.

Percorsi di autenticazione comuni:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`): `Authorization: Bearer <token-or-password>`
- autenticazione HTTP con identità attendibile (`gateway.auth.mode="trusted-proxy"`): instrada attraverso il proxy configurato con consapevolezza dell'identità e lascia che inietti gli header di identità richiesti
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`): nessun header di autenticazione richiesto

## Modello di sicurezza

Considera questo plugin come una superficie completa per operatori del Gateway.

- Attivare il plugin offre intenzionalmente accesso ai metodi RPC di amministrazione in allowlist su `/api/v1/admin/rpc`.
- Il plugin dichiara il contratto di manifest riservato `contracts.gatewayMethodDispatch: ["authenticated-request"]` affinché la sua rotta HTTP autenticata dal Gateway possa eseguire metodi del control plane nel processo.
- L'autenticazione bearer con segreto condiviso prova il possesso del segreto operatore del gateway.
- Per l'autenticazione `token` e `password`, gli header `x-openclaw-scopes` più ristretti vengono ignorati e vengono ripristinate le normali impostazioni predefinite da operatore completo.
- Le modalità HTTP con identità attendibile rispettano `x-openclaw-scopes` quando presente.
- `gateway.auth.mode="none"` significa che questa rotta non è autenticata se il plugin è attivato. Usalo solo dietro un ingresso privato di cui ti fidi pienamente.
- Le richieste vengono indirizzate tramite gli stessi gestori dei metodi del Gateway e controlli di ambito dell'RPC WebSocket dopo il superamento dell'autenticazione della rotta del plugin.
- Mantieni questa rotta su loopback, tailnet o un ingresso privato attendibile. Non esporla direttamente a internet pubblico.
- I contratti del manifest del plugin non sono una sandbox. Impediscono l'uso accidentale di helper SDK riservati; i plugin attendibili vengono comunque eseguiti nel processo del Gateway.

Usa gateway separati quando i chiamanti attraversano confini di fiducia.

## Richiesta

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

Campi:

- `id` (string, facoltativo): copiato nella risposta. Un UUID viene generato quando omesso.
- `method` (string, obbligatorio): nome del metodo Gateway consentito.
- `params` (any, facoltativo): parametri specifici del metodo.

La dimensione massima predefinita del corpo della richiesta è 1 MB.

## Risposta

Le risposte di successo usano la forma RPC del Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gli errori dei metodi Gateway usano:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

Lo stato HTTP segue l'errore del Gateway quando possibile. Ad esempio, `INVALID_REQUEST` restituisce `400` e `UNAVAILABLE` restituisce `503`.

## Metodi consentiti

- discovery: `commands.list`
  Restituisce i nomi dei metodi HTTP RPC consentiti da questo plugin.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- config: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- channels: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- models: `models.list`, `models.authStatus`
- agents: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- approvals: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- devices: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- nodes: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tasks: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostics: `doctor.memory.status`, `update.status`

Gli altri metodi Gateway sono bloccati finché non vengono aggiunti intenzionalmente.

## Confronto con WebSocket

Il normale percorso RPC WebSocket del Gateway resta l'API di control plane preferita per i client OpenClaw. Usa admin HTTP RPC solo per strumenti host che richiedono una superficie HTTP richiesta/risposta.

I client WebSocket con token condiviso senza un'identità di dispositivo attendibile non possono dichiarare autonomamente ambiti admin durante la connessione. Admin HTTP RPC segue deliberatamente il modello operatore HTTP attendibile esistente: quando il plugin è attivato, l'autenticazione bearer con segreto condiviso viene trattata come accesso operatore completo per questa superficie di amministrazione.

## Risoluzione dei problemi

`404 Not Found`

: Il plugin è disattivato, il Gateway non è stato riavviato dopo l'attivazione, oppure la richiesta sta raggiungendo un processo Gateway diverso.

`401 Unauthorized`

: La richiesta non ha soddisfatto l'autenticazione HTTP del Gateway. Controlla il token bearer o gli header di identità trusted-proxy.

`400 INVALID_REQUEST`

: Il corpo della richiesta non è JSON valido, il campo `method` manca, oppure il metodo non è nella allowlist del plugin.

`503 UNAVAILABLE`

: Il gestore del metodo Gateway non è disponibile. Controlla i log del Gateway e riprova dopo il completamento dell'avvio del Gateway.

## Correlati

- [Ambiti operatore](/it/gateway/operator-scopes)
- [Sicurezza del Gateway](/it/gateway/security)
- [Accesso remoto](/it/gateway/remote)
- [Manifest del plugin](/it/plugins/manifest#contracts)
- [Sottopercorsi SDK](/it/plugins/sdk-subpaths)
