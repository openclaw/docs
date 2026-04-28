---
read_when:
    - Esporre la Control UI del Gateway fuori da localhost
    - Automatizzare l'accesso alla dashboard tramite tailnet o pubblico
summary: Tailscale Serve/Funnel integrato per la dashboard del Gateway
title: Tailscale
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:30:37Z"
  model: gpt-5.4
  provider: openai
  source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
  source_path: gateway/tailscale.md
  workflow: 15
---

OpenClaw può configurare automaticamente Tailscale **Serve** (tailnet) o **Funnel** (pubblico) per la
dashboard del Gateway e la porta WebSocket. Questo mantiene il Gateway associato a loopback mentre
Tailscale fornisce HTTPS, routing e (per Serve) header di identità.

## Modalità

- `serve`: Serve solo tailnet tramite `tailscale serve`. Il gateway resta su `127.0.0.1`.
- `funnel`: HTTPS pubblico tramite `tailscale funnel`. OpenClaw richiede una password condivisa.
- `off`: predefinita (nessuna automazione Tailscale).

L'output di stato e audit usa **esposizione Tailscale** per questa modalità Serve/Funnel di OpenClaw.
`off` significa che OpenClaw non sta gestendo Serve o Funnel; non significa che il
daemon Tailscale locale sia fermo o disconnesso.

## Auth

Imposta `gateway.auth.mode` per controllare l'handshake:

- `none` (ingresso solo privato)
- `token` (predefinito quando `OPENCLAW_GATEWAY_TOKEN` è impostato)
- `password` (segreto condiviso tramite `OPENCLAW_GATEWAY_PASSWORD` o configurazione)
- `trusted-proxy` (reverse proxy identity-aware; vedi [Auth Trusted Proxy](/it/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` è `true`,
l'auth di Control UI/WebSocket può usare gli header di identità Tailscale
(`tailscale-user-login`) senza fornire token/password. OpenClaw verifica
l'identità risolvendo l'indirizzo `x-forwarded-for` tramite il daemon Tailscale locale
(`tailscale whois`) e confrontandolo con l'header prima di accettarlo.
OpenClaw tratta una richiesta come Serve solo quando arriva da loopback con
gli header Tailscale `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host`.
Per le sessioni operatore della Control UI che includono identità del dispositivo browser, questo
percorso Serve verificato salta anche il round trip di pairing del dispositivo. Non aggira
l'identità del dispositivo browser: i client senza dispositivo vengono comunque rifiutati, e le
connessioni WebSocket senza ruolo node o non Control UI seguono ancora i normali controlli di pairing e
auth.
Gli endpoint HTTP API (per esempio `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**non** usano auth tramite header di identità Tailscale. Seguono comunque la normale
modalità auth HTTP del gateway: auth con segreto condiviso per impostazione predefinita, oppure una configurazione
intenzionale trusted-proxy / private-ingress `none`.
Questo flusso senza token presuppone che l'host del gateway sia affidabile. Se codice locale non affidabile
può essere eseguito sullo stesso host, disabilita `gateway.auth.allowTailscale` e richiedi invece auth con
token/password.
Per richiedere credenziali esplicite con segreto condiviso, imposta `gateway.auth.allowTailscale: false`
e usa `gateway.auth.mode: "token"` oppure `"password"`.

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

Apri: `https://<magicdns>/` (oppure il tuo `gateway.controlUi.basePath` configurato)

### Solo tailnet (bind all'IP Tailnet)

Usalo quando vuoi che il Gateway ascolti direttamente sull'IP Tailnet (senza Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connettiti da un altro dispositivo Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Nota: loopback (`http://127.0.0.1:18789`) **non** funzionerà in questa modalità.

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

- Tailscale Serve/Funnel richiede che la CLI `tailscale` sia installata e abbia effettuato l'accesso.
- `tailscale.mode: "funnel"` rifiuta l'avvio a meno che la modalità auth non sia `password` per evitare esposizione pubblica.
- Imposta `gateway.tailscale.resetOnExit` se vuoi che OpenClaw annulli la configurazione `tailscale serve`
  o `tailscale funnel` allo spegnimento.
- `gateway.bind: "tailnet"` è un bind Tailnet diretto (nessun HTTPS, nessun Serve/Funnel).
- `gateway.bind: "auto"` preferisce loopback; usa `tailnet` se vuoi solo Tailnet.
- Serve/Funnel espongono solo la **Control UI + WS del Gateway**. I node si collegano
  tramite lo stesso endpoint Gateway WS, quindi Serve può funzionare anche per l'accesso ai node.

## Controllo browser (Gateway remoto + browser locale)

Se esegui il Gateway su una macchina ma vuoi controllare un browser su un'altra macchina,
esegui un **host node** sulla macchina del browser e mantieni entrambe sulla stessa tailnet.
Il Gateway inoltrerà le azioni del browser al node; non è necessario alcun server di controllo separato o URL Serve.

Evita Funnel per il controllo del browser; tratta il pairing del node come accesso operatore.

## Prerequisiti + limiti di Tailscale

- Serve richiede HTTPS abilitato per la tua tailnet; la CLI mostra un prompt se manca.
- Serve inietta header di identità Tailscale; Funnel no.
- Funnel richiede Tailscale v1.38.3+, MagicDNS, HTTPS abilitato e un attributo nodo funnel.
- Funnel supporta solo le porte `443`, `8443` e `10000` tramite TLS.
- Funnel su macOS richiede la variante open-source dell'app Tailscale.

## Per saperne di più

- Panoramica Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Panoramica Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Discovery](/it/gateway/discovery)
- [Autenticazione](/it/gateway/authentication)
