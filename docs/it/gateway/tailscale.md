---
read_when:
    - Esposizione della UI di controllo del Gateway fuori da localhost
    - Automazione dell'accesso alla tailnet o pubblico alla dashboard
summary: Integrazione di Tailscale Serve/Funnel per la dashboard del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-05T13:53:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ca5316e804e089c31a78ae882b3082444e082fb2b36b73679ffede20590cb2e
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (dashboard del Gateway)

OpenClaw può configurare automaticamente Tailscale **Serve** (tailnet) o **Funnel** (pubblico) per la
dashboard del Gateway e la porta WebSocket. Questo mantiene il Gateway associato al loopback mentre
Tailscale fornisce HTTPS, routing e, per Serve, header di identità.

## Modalità

- `serve`: Serve solo tailnet tramite `tailscale serve`. Il gateway resta su `127.0.0.1`.
- `funnel`: HTTPS pubblico tramite `tailscale funnel`. OpenClaw richiede una password condivisa.
- `off`: predefinito (nessuna automazione Tailscale).

## Autenticazione

Imposta `gateway.auth.mode` per controllare l'handshake:

- `none` (solo ingress privato)
- `token` (predefinito quando `OPENCLAW_GATEWAY_TOKEN` è impostato)
- `password` (segreto condiviso tramite `OPENCLAW_GATEWAY_PASSWORD` o configurazione)
- `trusted-proxy` (reverse proxy con riconoscimento dell'identità; vedi [Autenticazione Trusted Proxy](/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` è `true`,
l'autenticazione della UI di controllo/WebSocket può usare gli header di identità Tailscale
(`tailscale-user-login`) senza fornire un token/password. OpenClaw verifica
l'identità risolvendo l'indirizzo `x-forwarded-for` tramite il demone Tailscale locale
(`tailscale whois`) e confrontandolo con l'header prima di accettarlo.
OpenClaw tratta una richiesta come Serve solo quando arriva da loopback con
gli header Tailscale `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host`.
Gli endpoint HTTP API (ad esempio `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**non** usano l'autenticazione tramite header di identità Tailscale. Seguono comunque la
normale modalità di autenticazione HTTP del gateway: autenticazione con segreto condiviso per impostazione predefinita, oppure una configurazione intenzionale `trusted-proxy` / `none` per ingress privato.
Questo flusso senza token presuppone che l'host gateway sia affidabile. Se codice locale non affidabile
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

### Solo tailnet (bind all'IP tailnet)

Usa questa opzione quando vuoi che il Gateway ascolti direttamente sull'IP tailnet (senza Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connettiti da un altro dispositivo della tailnet:

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

- Tailscale Serve/Funnel richiede che la CLI `tailscale` sia installata e abbia effettuato il login.
- `tailscale.mode: "funnel"` rifiuta l'avvio a meno che la modalità auth non sia `password` per evitare esposizione pubblica.
- Imposta `gateway.tailscale.resetOnExit` se vuoi che OpenClaw annulli la configurazione `tailscale serve`
  o `tailscale funnel` all'arresto.
- `gateway.bind: "tailnet"` è un bind diretto alla tailnet (senza HTTPS, senza Serve/Funnel).
- `gateway.bind: "auto"` privilegia il loopback; usa `tailnet` se vuoi solo tailnet.
- Serve/Funnel espongono solo la **UI di controllo del Gateway + WS**. I nodi si connettono tramite
  lo stesso endpoint WS del Gateway, quindi Serve può funzionare anche per l'accesso ai nodi.

## Controllo browser (Gateway remoto + browser locale)

Se esegui il Gateway su una macchina ma vuoi pilotare un browser su un'altra macchina,
esegui un **host nodo** sulla macchina del browser e mantieni entrambi nella stessa tailnet.
Il Gateway farà da proxy alle azioni del browser verso il nodo; non serve alcun server di controllo separato né URL Serve.

Evita Funnel per il controllo del browser; tratta l'associazione del nodo come accesso da operatore.

## Prerequisiti e limiti di Tailscale

- Serve richiede che HTTPS sia abilitato per la tua tailnet; la CLI lo richiede se manca.
- Serve inietta header di identità Tailscale; Funnel no.
- Funnel richiede Tailscale v1.38.3+, MagicDNS, HTTPS abilitato e un attributo nodo funnel.
- Funnel supporta solo le porte `443`, `8443` e `10000` su TLS.
- Funnel su macOS richiede la variante open source dell'app Tailscale.

## Per saperne di più

- Panoramica di Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Panoramica di Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
