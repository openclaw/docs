---
read_when:
    - Creazione di strumenti per l'host che non possono utilizzare il client RPC WebSocket del Gateway
    - Esposizione dell'automazione amministrativa del Gateway tramite un punto di ingresso privato e attendibile
    - Verifica del modello di sicurezza per l'accesso HTTP ai metodi del Gateway
summary: Esponi i metodi selezionati del piano di controllo del Gateway tramite il plugin admin-http-rpc incluso e attivabile su richiesta
title: Plugin RPC HTTP di amministrazione
x-i18n:
    generated_at: "2026-07-12T07:15:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Il plugin `admin-http-rpc` incluso espone tramite HTTP un insieme consentito di metodi del piano di controllo del Gateway, destinato all'automazione host attendibile che non può mantenere aperta una connessione WebSocket al Gateway.

Viene distribuito con OpenClaw, ma è disabilitato per impostazione predefinita; quando è disabilitato, la route non viene registrata. Quando è abilitato, aggiunge `POST /api/v1/admin/rpc` sullo stesso listener del Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Abilitalo solo per strumenti host privati, automazione della tailnet o un ingresso interno attendibile. Non esporre mai questa route direttamente a Internet.

## Prima di abilitarlo

Admin HTTP RPC è una superficie completa del piano di controllo per operatori: qualsiasi chiamante che supera l'autenticazione HTTP del Gateway può invocare i metodi consentiti elencati di seguito. Abilitalo solo quando sono vere tutte le condizioni seguenti:

- Il chiamante è autorizzato a gestire il Gateway.
- Il chiamante non può utilizzare il client RPC WebSocket.
- La route è raggiungibile solo tramite local loopback, una tailnet o un ingresso privato autenticato.
- Hai esaminato i metodi consentiti e corrispondono all'automazione che intendi eseguire.

Per i client OpenClaw e gli strumenti interattivi in grado di mantenere aperta una connessione WebSocket al Gateway, utilizza invece RPC WebSocket.

## Abilitazione

Abilita il plugin incluso:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Configurazione">
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

La route viene registrata durante l'avvio del plugin, quindi riavvia il Gateway dopo aver modificato la configurazione del plugin.

Disabilitala quando la superficie HTTP non è più necessaria:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Verifica della route

Utilizza `health` come richiesta sicura più semplice:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Una risposta riuscita contiene `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Quando il plugin è disabilitato, la route restituisce `404` perché non è registrata.

## Autenticazione

La route del plugin utilizza l'autenticazione HTTP del Gateway.

Modalità di autenticazione comuni:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`): `Authorization: Bearer <token-or-password>`
- autenticazione HTTP attendibile basata sull'identità (`gateway.auth.mode="trusted-proxy"`): instrada la richiesta tramite il proxy configurato in grado di riconoscere l'identità e lascia che inserisca le intestazioni di identità richieste
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`): non è richiesta alcuna intestazione di autenticazione

## Modello di sicurezza

Considera questo plugin come una superficie completa per gli operatori del Gateway.

- L'abilitazione del plugin rende intenzionalmente accessibili i metodi RPC amministrativi consentiti in `/api/v1/admin/rpc`.
- Il plugin dichiara il contratto riservato del manifest `contracts.gatewayMethodDispatch: ["authenticated-request"]`, che consente alla sua route HTTP autenticata dal Gateway di inoltrare internamente i metodi del piano di controllo. Non si tratta di una sandbox: il contratto impedisce l'uso accidentale degli helper SDK riservati, ma i plugin attendibili vengono comunque eseguiti nel processo del Gateway.
- L'autenticazione bearer con segreto condiviso (modalità `token`/`password`) dimostra il possesso del segreto dell'operatore del Gateway; le intestazioni `x-openclaw-scopes` con ambiti più limitati vengono ignorate in questo percorso e vengono ripristinate le normali impostazioni predefinite di operatore completo.
- L'autenticazione HTTP attendibile basata sull'identità (modalità `trusted-proxy`) rispetta `x-openclaw-scopes`, quando presente.
- `gateway.auth.mode="none"` rende questa route non autenticata se il plugin è abilitato. Utilizza questa modalità solo dietro un ingresso privato di cui ti fidi completamente.
- Dopo il superamento dell'autenticazione della route del plugin, le richieste vengono inoltrate tramite gli stessi gestori dei metodi e gli stessi controlli degli ambiti del Gateway utilizzati da RPC WebSocket.
- La route rimane raggiungibile durante un lease di sospensione predisposto. La convalida limitata delle richieste e la risposta di rilevamento locale `commands.list` rimangono disponibili. Tra i metodi inoltrati al Gateway, solo `gateway.suspend.prepare`, `gateway.suspend.status` e `gateway.suspend.resume` possono essere eseguiti mentre l'ammissione è chiusa; gli altri metodi consentiti restituiscono la normale risposta ripetibile `UNAVAILABLE` del Gateway.
- Mantieni questa route su local loopback, una tailnet o un ingresso privato attendibile. Non esporla direttamente a Internet. Utilizza Gateway separati quando i chiamanti attraversano confini di attendibilità.

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

- `id` (stringa, facoltativo): viene copiato nella risposta. Se omesso, viene generato un UUID.
- `method` (stringa, obbligatorio): nome del metodo Gateway consentito.
- `params` (qualsiasi tipo, facoltativo): parametri specifici del metodo.

La dimensione massima predefinita del corpo della richiesta è 1 MB.

## Risposta

Le risposte riuscite utilizzano il formato RPC del Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Gli errori dei metodi del Gateway utilizzano:

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

Lo stato HTTP dipende dal codice di errore:

| Codice di errore            | Stato HTTP |
| --------------------------- | ---------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| qualsiasi altro codice     | 500         |

## Metodi consentiti

- rilevamento: `commands.list`
  Restituisce i nomi dei metodi RPC HTTP consentiti da questo plugin.
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- configurazione: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- canali: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- modelli: `models.list`, `models.authStatus`
- agenti: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- approvazioni: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- dispositivi: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- Node: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- attività: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostica: `doctor.memory.status`, `update.status`

Gli altri metodi del Gateway vengono bloccati finché non vengono aggiunti intenzionalmente.

## Confronto con WebSocket

Il normale percorso RPC WebSocket del Gateway rimane l'API del piano di controllo preferita per i client OpenClaw. Utilizza Admin HTTP RPC solo per gli strumenti host che richiedono una superficie HTTP di richiesta/risposta.

I client WebSocket con token condiviso privi di un'identità attendibile del dispositivo non possono dichiarare autonomamente gli ambiti amministrativi durante la connessione. Admin HTTP RPC segue intenzionalmente il modello esistente di operatore HTTP attendibile: quando il plugin è abilitato, l'autenticazione bearer con segreto condiviso viene considerata come accesso da operatore completo per questa superficie amministrativa.

## Risoluzione dei problemi

`404 Not Found`

: Il plugin è disabilitato, il Gateway non è stato riavviato dopo l'abilitazione oppure la richiesta viene inviata a un altro processo del Gateway.

`401 Unauthorized`

: La richiesta non ha soddisfatto l'autenticazione HTTP del Gateway. Controlla il token bearer o le intestazioni di identità del proxy attendibile.

`405 Method Not Allowed`

: La richiesta ha utilizzato un metodo diverso da `POST`.

`413 Payload Too Large`

: Il corpo della richiesta ha superato il limite di 1 MB.

`400 INVALID_REQUEST`

: Il corpo della richiesta non è un JSON valido, il campo `method` è assente, il metodo non è incluso nell'elenco consentito del plugin oppure un ID di ripresa della sospensione non corrisponde al lease attivo.

`503 UNAVAILABLE`

: Il metodo del Gateway è in fase di avvio, soggetto a limitazione della frequenza, sospeso oppure in attesa di un'operazione concorrente di sospensione o ripresa. Esamina `error.details`, quando presente, e rispetta `error.retryAfterMs` prima di riprovare.

## Contenuti correlati

- [Ambiti dell'operatore](/it/gateway/operator-scopes)
- [Sicurezza del Gateway](/it/gateway/security)
- [Accesso remoto](/it/gateway/remote)
- [Manifest del plugin](/it/plugins/manifest#contracts-reference)
- [Sottopercorsi dell'SDK](/it/plugins/sdk-subpaths)
