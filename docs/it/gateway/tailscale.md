---
read_when:
    - Esposizione della UI di controllo del Gateway fuori da localhost
    - Automazione dell'accesso alla dashboard tramite tailnet o pubblico
summary: Tailscale Serve/Funnel integrato per la dashboard del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T08:42:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (dashboard del Gateway)

OpenClaw può configurare automaticamente Tailscale **Serve** (tailnet) o **Funnel** (pubblico) per la
dashboard del Gateway e la porta WebSocket. Questo mantiene il Gateway associato al loopback mentre
Tailscale fornisce HTTPS, instradamento e (per Serve) header di identità.

## Modalità

- `serve`: Serve solo tailnet tramite `tailscale serve`. Il gateway resta su `127.0.0.1`.
- `funnel`: HTTPS pubblico tramite `tailscale funnel`. OpenClaw richiede una password condivisa.
- `off`: predefinito (nessuna automazione Tailscale).

## Autenticazione

Imposta `gateway.auth.mode` per controllare l'handshake:

- `none` (solo ingresso privato)
- `token` (predefinito quando `OPENCLAW_GATEWAY_TOKEN` è impostato)
- `password` (segreto condiviso tramite `OPENCLAW_GATEWAY_PASSWORD` o configurazione)
- `trusted-proxy` (proxy inverso consapevole dell'identità; vedi [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` è `true`,
l'autenticazione della UI di controllo/WebSocket può usare gli header di identità Tailscale
(`tailscale-user-login`) senza fornire un token/password. OpenClaw verifica
l'identità risolvendo l'indirizzo `x-forwarded-for` tramite il daemon Tailscale locale
(`tailscale whois`) e confrontandolo con l'header prima di accettarlo.
OpenClaw tratta una richiesta come Serve solo quando arriva dal loopback con
gli header Tailscale `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host`.
Gli endpoint API HTTP (ad esempio `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**non** usano l'autenticazione tramite header di identità Tailscale. Seguono comunque la
normale modalità di autenticazione HTTP del gateway: autenticazione a segreto condiviso per impostazione predefinita, oppure una configurazione intenzionale `trusted-proxy` / `none` con ingresso privato.
Questo flusso senza token presuppone che l'host del gateway sia attendibile. Se codice locale non attendibile
può essere eseguito sullo stesso host, disabilita `gateway.auth.allowTailscale` e richiedi invece l'autenticazione con token/password.
Per richiedere credenziali esplicite con segreto condiviso, imposta `gateway.auth.allowTailscale: false`
e usa `gateway.auth.mode: "token"` o `"password"`.

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

Apri: `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

### Solo tailnet (bind all'IP Tailnet)

Usalo quando vuoi che il Gateway resti in ascolto direttamente sull'IP Tailnet (senza Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connettiti da un altro dispositivo Tailnet:

- UI di controllo: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Nota: il loopback (`http://127.0.0.1:18789`) **non** funzionerà in questa modalità.

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

Preferisci `OPENCLAW_GATEWAY_PASSWORD` invece di salvare una password su disco.

## Esempi CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Note

- Tailscale Serve/Funnel richiede che la CLI `tailscale` sia installata e che abbia effettuato l'accesso.
- `tailscale.mode: "funnel"` rifiuta di avviarsi se la modalità auth non è `password`, per evitare esposizione pubblica.
- Imposta `gateway.tailscale.resetOnExit` se vuoi che OpenClaw annulli la configurazione `tailscale serve`
  o `tailscale funnel` all'arresto.
- `gateway.bind: "tailnet"` è un bind Tailnet diretto (nessun HTTPS, nessun Serve/Funnel).
- `gateway.bind: "auto"` preferisce il loopback; usa `tailnet` se vuoi solo Tailnet.
- Serve/Funnel espongono solo la **UI di controllo del Gateway + WS**. I Node si connettono tramite
  lo stesso endpoint WS del Gateway, quindi Serve può funzionare per l'accesso ai Node.

## Controllo del browser (Gateway remoto + browser locale)

Se esegui il Gateway su una macchina ma vuoi controllare un browser su un'altra macchina,
esegui un **host Node** sulla macchina del browser e mantieni entrambe sulla stessa tailnet.
Il Gateway farà da proxy per le azioni del browser verso il Node; non serve un server di controllo separato o un URL Serve.

Evita Funnel per il controllo del browser; tratta l'associazione del Node come accesso operatore.

## Prerequisiti e limiti di Tailscale

- Serve richiede HTTPS abilitato per la tua tailnet; la CLI mostra una richiesta se manca.
- Serve inserisce header di identità Tailscale; Funnel no.
- Funnel richiede Tailscale v1.38.3+, MagicDNS, HTTPS abilitato e un attributo nodo funnel.
- Funnel supporta solo le porte `443`, `8443` e `10000` su TLS.
- Funnel su macOS richiede la variante open-source dell'app Tailscale.

## Ulteriori informazioni

- Panoramica di Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Panoramica di Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Discovery](/it/gateway/discovery)
- [Autenticazione](/it/gateway/authentication)
