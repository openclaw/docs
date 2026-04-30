---
read_when:
    - Esporre l'interfaccia di controllo del Gateway al di fuori di localhost
    - Automatizzare l'accesso alla tailnet o alla dashboard pubblica
summary: Serve/Funnel Tailscale integrato per la dashboard del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T08:54:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw può configurare automaticamente Tailscale **Serve** (tailnet) o **Funnel** (pubblico) per la dashboard del Gateway e la porta WebSocket. Questo mantiene il Gateway associato al loopback mentre Tailscale fornisce HTTPS, routing e (per Serve) header di identità.

## Modalità

- `serve`: Serve solo Tailnet tramite `tailscale serve`. Il gateway resta su `127.0.0.1`.
- `funnel`: HTTPS pubblico tramite `tailscale funnel`. OpenClaw richiede una password condivisa.
- `off`: Predefinito (nessuna automazione Tailscale).

L'output di stato e audit usa **Esposizione Tailscale** per questa modalità OpenClaw Serve/Funnel. `off` significa che OpenClaw non sta gestendo Serve o Funnel; non significa che il daemon Tailscale locale sia arrestato o disconnesso.

## Autenticazione

Imposta `gateway.auth.mode` per controllare l'handshake:

- `none` (solo ingresso privato)
- `token` (predefinito quando `OPENCLAW_GATEWAY_TOKEN` è impostato)
- `password` (segreto condiviso tramite `OPENCLAW_GATEWAY_PASSWORD` o configurazione)
- `trusted-proxy` (proxy inverso consapevole dell'identità; vedi [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` è `true`, l'autenticazione di Control UI/WebSocket può usare gli header di identità Tailscale (`tailscale-user-login`) senza fornire token/password. OpenClaw verifica l'identità risolvendo l'indirizzo `x-forwarded-for` tramite il daemon Tailscale locale (`tailscale whois`) e confrontandolo con l'header prima di accettarla. OpenClaw considera una richiesta come Serve solo quando arriva dal loopback con gli header Tailscale `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host`.
Per le sessioni operatore di Control UI che includono l'identità del dispositivo del browser, questo percorso Serve verificato salta anche il round trip di associazione del dispositivo. Non aggira l'identità del dispositivo del browser: i client senza dispositivo vengono comunque rifiutati e le connessioni WebSocket con ruolo nodo o non Control UI seguono comunque i normali controlli di associazione e autenticazione.
Gli endpoint HTTP API (ad esempio `/v1/*`, `/tools/invoke` e `/api/channels/*`) **non** usano l'autenticazione tramite header di identità Tailscale. Seguono comunque la normale modalità di autenticazione HTTP del gateway: autenticazione con segreto condiviso per impostazione predefinita, oppure una configurazione `none` trusted-proxy / ingresso privato configurata intenzionalmente.
Questo flusso senza token presuppone che l'host del gateway sia attendibile. Se codice locale non attendibile può essere eseguito sullo stesso host, disabilita `gateway.auth.allowTailscale` e richiedi invece l'autenticazione tramite token/password.
Per richiedere credenziali esplicite con segreto condiviso, imposta `gateway.auth.allowTailscale: false` e usa `gateway.auth.mode: "token"` o `"password"`.

## Esempi di configurazione

### Solo Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Apri: `https://<magicdns>/` (o il tuo `gateway.controlUi.basePath` configurato)

### Solo Tailnet (associazione all'IP Tailnet)

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

<Note>
Loopback (`http://127.0.0.1:18789`) **non** funzionerà in questa modalità.
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

Preferisci `OPENCLAW_GATEWAY_PASSWORD` rispetto al commit di una password su disco.

## Esempi CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Note

- Tailscale Serve/Funnel richiede che la CLI `tailscale` sia installata e che l'accesso sia stato effettuato.
- `tailscale.mode: "funnel"` rifiuta l'avvio a meno che la modalità di autenticazione non sia `password`, per evitare l'esposizione pubblica.
- Imposta `gateway.tailscale.resetOnExit` se vuoi che OpenClaw annulli la configurazione di `tailscale serve` o `tailscale funnel` allo spegnimento.
- `gateway.bind: "tailnet"` è un'associazione diretta a Tailnet (nessun HTTPS, nessun Serve/Funnel).
- `gateway.bind: "auto"` preferisce il loopback; usa `tailnet` se vuoi solo Tailnet.
- Serve/Funnel espongono solo **l'interfaccia di controllo del Gateway + WS**. I nodi si connettono tramite lo stesso endpoint WS del Gateway, quindi Serve può funzionare per l'accesso dei nodi.

## Controllo del browser (Gateway remoto + browser locale)

Se esegui il Gateway su una macchina ma vuoi controllare un browser su un'altra macchina, esegui un **host nodo** sulla macchina del browser e mantieni entrambi sulla stessa tailnet. Il Gateway inoltrerà le azioni del browser al nodo; non serve un server di controllo separato o un URL Serve.

Evita Funnel per il controllo del browser; tratta l'associazione del nodo come l'accesso operatore.

## Prerequisiti e limiti di Tailscale

- Serve richiede HTTPS abilitato per la tua tailnet; la CLI mostra un prompt se manca.
- Serve inietta header di identità Tailscale; Funnel no.
- Funnel richiede Tailscale v1.38.3+, MagicDNS, HTTPS abilitato e un attributo nodo funnel.
- Funnel supporta solo le porte `443`, `8443` e `10000` su TLS.
- Funnel su macOS richiede la variante open-source dell'app Tailscale.

## Scopri di più

- Panoramica di Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Panoramica di Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Rilevamento](/it/gateway/discovery)
- [Autenticazione](/it/gateway/authentication)
