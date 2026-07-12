---
read_when:
    - Esposizione dell'interfaccia di controllo del Gateway al di fuori di localhost
    - Automatizzare l'accesso alla dashboard tramite tailnet o rete pubblica
summary: Tailscale Serve/Funnel integrato per la dashboard del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T07:07:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw può configurare automaticamente Tailscale **Serve** (tailnet) o **Funnel** (pubblico) per la dashboard del Gateway e la porta WebSocket. In questo modo il Gateway rimane associato al local loopback, mentre Tailscale fornisce HTTPS, instradamento e, per Serve, intestazioni di identità.

## Modalità

`gateway.tailscale.mode`:

| Modalità        | Comportamento                                                                       |
| --------------- | ----------------------------------------------------------------------------------- |
| `serve`         | Serve limitato alla tailnet tramite `tailscale serve`. Il Gateway rimane su `127.0.0.1`. |
| `funnel`        | HTTPS pubblico tramite `tailscale funnel`. Richiede una password condivisa.         |
| `off` (predefinita) | Nessuna automazione Tailscale.                                                  |

L'output di stato e controllo usa **esposizione Tailscale** per questa modalità Serve/Funnel di OpenClaw. `off` indica che OpenClaw non gestisce Serve o Funnel; non significa che il daemon Tailscale locale sia arrestato o disconnesso.

## Esempi di configurazione

### Solo tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Apri: `https://<magicdns>/` (oppure il valore configurato per `gateway.controlUi.basePath`)

Per esporre l'interfaccia di controllo tramite un servizio Tailscale denominato anziché tramite il nome host del dispositivo, imposta `gateway.tailscale.serviceName` sul nome del servizio:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

All'avvio viene quindi indicato l'URL del servizio come `https://openclaw.<tailnet-name>.ts.net/` anziché il nome host del dispositivo. I servizi Tailscale richiedono che l'host sia un Node con tag approvato nella tailnet: configura il tag e approva il servizio in Tailscale prima di abilitare questa opzione; in caso contrario, `tailscale serve --service=...` non riesce durante l'avvio del Gateway.

### Solo tailnet (associazione all'IP della tailnet)

Usa questa configurazione affinché il Gateway ascolti direttamente sull'IP della tailnet, senza Serve/Funnel:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connettiti da un altro dispositivo della tailnet:

- Interfaccia di controllo: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Quando è presente un indirizzo IPv4 associabile della tailnet, il Gateway richiede anche `http://127.0.0.1:18789` per i client autenticati sullo stesso host. Se all'avvio non è disponibile alcun indirizzo della tailnet, utilizza solo il local loopback; riavvialo dopo che Tailscale è diventato disponibile per aggiungere l'accesso diretto dalla tailnet. Nessuno dei due percorsi aggiunge un'esposizione LAN o pubblica.
</Note>

### Internet pubblico (Funnel + password condivisa)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

È preferibile usare `OPENCLAW_GATEWAY_PASSWORD` anziché salvare una password su disco.

## Esempi CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Autenticazione

`gateway.auth.mode` controlla l'handshake:

| Modalità                                               | Caso d'uso                                                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `none`                                                 | Solo ingresso privato                                                                              |
| `token` (predefinita quando è impostato `OPENCLAW_GATEWAY_TOKEN`) | Token condiviso                                                                        |
| `password`                                             | Segreto condiviso tramite `OPENCLAW_GATEWAY_PASSWORD` o configurazione                             |
| `trusted-proxy`                                        | Proxy inverso con riconoscimento dell'identità; consulta [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth) |

### Intestazioni di identità Tailscale (solo Serve)

Quando `tailscale.mode: "serve"` e `gateway.auth.allowTailscale` è `true`, l'autenticazione dell'interfaccia di controllo/WebSocket può usare le intestazioni di identità Tailscale (`tailscale-user-login`) anziché un token o una password. OpenClaw verifica l'intestazione risolvendo l'indirizzo `x-forwarded-for` della richiesta tramite il daemon Tailscale locale (`tailscale whois`) e confrontandolo con l'accesso indicato nell'intestazione prima di accettarlo. Una richiesta può usare questo percorso solo quando proviene dal local loopback e contiene le intestazioni `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` di Tailscale.

Questo flusso senza token presuppone che l'host del Gateway sia attendibile. Se sullo stesso host potrebbe essere eseguito codice locale non attendibile, imposta `gateway.auth.allowTailscale: false` e richiedi invece l'autenticazione tramite token o password.

Ambito dell'esclusione:

- Si applica solo alla superficie di autenticazione WebSocket dell'interfaccia di controllo. Gli endpoint dell'API HTTP (`/v1/*`, `/tools/invoke`, `/api/channels/*` e così via) non usano mai l'autenticazione tramite intestazione di identità Tailscale; seguono sempre la normale modalità di autenticazione HTTP del Gateway.
- Per le sessioni operatore dell'interfaccia di controllo che contengono già l'identità del dispositivo del browser, un'identità Tailscale verificata evita il passaggio di associazione tramite token di bootstrap/codice QR.
- Non esclude l'identità del dispositivo: i client senza dispositivo vengono comunque rifiutati e le connessioni con ruolo Node continuano a essere sottoposte alle normali verifiche di associazione e autenticazione.

## Note

- Tailscale Serve/Funnel richiede che la CLI `tailscale` sia installata e connessa.
- `tailscale.mode: "funnel"` rifiuta di avviarsi a meno che la modalità di autenticazione non sia `password`, per evitare l'esposizione pubblica.
- `gateway.tailscale.serviceName` si applica solo alla modalità Serve e viene passato a `tailscale serve --service=<name>`. Il valore deve usare il formato `svc:<dns-label>` di Tailscale, ad esempio `svc:openclaw`. Tailscale richiede che gli host del servizio siano Node con tag e potrebbe essere necessario approvare il servizio nella console di amministrazione prima che Serve possa pubblicarlo.
- `gateway.tailscale.resetOnExit` annulla la configurazione di `tailscale serve`/`tailscale funnel` all'arresto.
- `gateway.tailscale.preserveFunnel: true` mantiene attiva tra i riavvii del Gateway una route `tailscale funnel` configurata esternamente. Con `mode: "serve"`, OpenClaw controlla `tailscale funnel status` prima di riapplicare Serve e non lo applica se una route Funnel copre già la porta del Gateway. Il criterio di OpenClaw che limita Funnel gestito alla sola password rimane invariato.
- `gateway.bind: "tailnet"` usa un'associazione diretta alla tailnet (senza HTTPS né Serve/Funnel) insieme all'indirizzo locale obbligatorio `127.0.0.1` quando è disponibile un indirizzo IPv4 della tailnet; altrimenti utilizza solo il local loopback.
- `gateway.bind: "auto"` preferisce il local loopback; usa `tailnet` per limitare l'esposizione di rete alla tailnet mantenendo l'accesso dal local loopback sullo stesso host.
- Serve/Funnel espongono solo l'**interfaccia di controllo del Gateway + WS**. I Node si connettono tramite lo stesso endpoint WS del Gateway, quindi Serve funziona anche per l'accesso dei Node.

### Prerequisiti e limiti di Tailscale

- Serve richiede che HTTPS sia abilitato per la tailnet; la CLI mostra una richiesta se manca.
- Serve inserisce le intestazioni di identità Tailscale; Funnel no.
- Funnel richiede Tailscale v1.38.3 o successiva, MagicDNS, HTTPS abilitato e un attributo Funnel per il Node.
- Funnel supporta solo le porte `443`, `8443` e `10000` tramite TLS.
- Funnel su macOS richiede la variante open source dell'app Tailscale.

## Controllo del browser (Gateway remoto + browser locale)

Per eseguire il Gateway su un computer ma controllare un browser su un altro, esegui un **host Node** sul computer del browser e mantienili entrambi nella stessa tailnet. Il Gateway inoltra le azioni del browser al Node; non sono necessari un server di controllo separato né un URL Serve.

Evita Funnel per il controllo del browser; considera l'associazione del Node equivalente all'accesso dell'operatore.

## Ulteriori informazioni

- Panoramica di Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Panoramica di Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Argomenti correlati

- [Accesso remoto](/it/gateway/remote)
- [Rilevamento](/it/gateway/discovery)
- [Autenticazione](/it/gateway/authentication)
