---
read_when:
    - Esporre l'interfaccia di controllo del Gateway al di fuori di localhost
    - Automatizzare l'accesso alla tailnet o alla dashboard pubblica
summary: Tailscale Serve/Funnel integrato per la dashboard del Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:37:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw può configurare automaticamente Tailscale **Serve** (tailnet) o **Funnel** (pubblico) per la
dashboard del Gateway e la porta WebSocket. Questo mantiene il Gateway vincolato al loopback mentre
Tailscale fornisce HTTPS, routing e (per Serve) intestazioni di identità.

## Modalità

- `serve`: Serve solo tailnet tramite `tailscale serve`. Il gateway rimane su `127.0.0.1`.
- `funnel`: HTTPS pubblico tramite `tailscale funnel`. OpenClaw richiede una password condivisa.
- `off`: Predefinito (nessuna automazione Tailscale).

L'output di stato e audit usa **esposizione Tailscale** per questa modalità Serve/Funnel
di OpenClaw. `off` significa che OpenClaw non sta gestendo Serve o Funnel; non significa che il
daemon Tailscale locale sia arrestato o disconnesso.

## Autenticazione

Imposta `gateway.auth.mode` per controllare l'handshake:

- `none` (solo ingresso privato)
- `token` (predefinito quando `OPENCLAW_GATEWAY_TOKEN` è impostato)
- `password` (segreto condiviso tramite `OPENCLAW_GATEWAY_PASSWORD` o configurazione)
- `trusted-proxy` (reverse proxy consapevole dell'identità; consulta [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` è `true`,
l'autenticazione UI/WebSocket di controllo può usare le intestazioni di identità Tailscale
(`tailscale-user-login`) senza fornire un token/password. OpenClaw verifica
l'identità risolvendo l'indirizzo `x-forwarded-for` tramite il daemon Tailscale
locale (`tailscale whois`) e confrontandolo con l'intestazione prima di accettarla.
OpenClaw tratta una richiesta come Serve solo quando arriva dal loopback con le
intestazioni `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host`
di Tailscale.
Per le sessioni operatore della UI di controllo che includono l'identità del dispositivo del browser, questo
percorso Serve verificato salta anche il round trip di associazione del dispositivo. Non aggira
l'identità del dispositivo del browser: i client senza dispositivo sono comunque rifiutati e le connessioni WebSocket
con ruolo nodo o non appartenenti alla UI di controllo seguono comunque le normali verifiche di associazione e
autenticazione.
Gli endpoint API HTTP (per esempio `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**non** usano l'autenticazione tramite intestazioni di identità Tailscale. Seguono comunque la normale
modalità di autenticazione HTTP del gateway: autenticazione con segreto condiviso per impostazione predefinita,
oppure una configurazione `none` trusted-proxy / ingresso privato impostata intenzionalmente.
Questo flusso senza token presuppone che l'host del gateway sia attendibile. Se sullo stesso host
può essere eseguito codice locale non attendibile, disabilita `gateway.auth.allowTailscale` e richiedi invece
l'autenticazione con token/password.
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

Usa questa opzione quando vuoi che il Gateway ascolti direttamente sull'IP Tailnet (senza Serve/Funnel).

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
- `tailscale.mode: "funnel"` si rifiuta di avviarsi a meno che la modalità di autenticazione sia `password`, per evitare l'esposizione pubblica.
- Imposta `gateway.tailscale.resetOnExit` se vuoi che OpenClaw annulli la configurazione di `tailscale serve`
  o `tailscale funnel` all'arresto.
- Imposta `gateway.tailscale.preserveFunnel: true` per mantenere attiva una rotta
  `tailscale funnel` configurata esternamente durante i riavvii del gateway. Quando è abilitata e il
  gateway viene eseguito in `mode: "serve"`, OpenClaw controlla `tailscale funnel status`
  prima di riapplicare Serve e lo salta quando una rotta Funnel copre già la
  porta del gateway. La policy solo password per Funnel gestita da OpenClaw resta invariata.
- `gateway.bind: "tailnet"` è un bind diretto a Tailnet (senza HTTPS, senza Serve/Funnel).
- `gateway.bind: "auto"` preferisce il loopback; usa `tailnet` se vuoi solo Tailnet.
- Serve/Funnel espongono solo la **UI di controllo del Gateway + WS**. I nodi si connettono tramite
  lo stesso endpoint WS del Gateway, quindi Serve può funzionare per l'accesso dei nodi.

## Controllo del browser (Gateway remoto + browser locale)

Se esegui il Gateway su una macchina ma vuoi controllare un browser su un'altra macchina,
esegui un **host nodo** sulla macchina del browser e mantieni entrambi sulla stessa tailnet.
Il Gateway inoltrerà le azioni del browser al nodo; non servono un server di controllo separato o un URL Serve.

Evita Funnel per il controllo del browser; tratta l'associazione dei nodi come l'accesso operatore.

## Prerequisiti e limiti di Tailscale

- Serve richiede HTTPS abilitato per la tua tailnet; la CLI mostra un prompt se manca.
- Serve inietta intestazioni di identità Tailscale; Funnel no.
- Funnel richiede Tailscale v1.38.3+, MagicDNS, HTTPS abilitato e un attributo nodo funnel.
- Funnel supporta solo le porte `443`, `8443` e `10000` su TLS.
- Funnel su macOS richiede la variante open source dell'app Tailscale.

## Scopri di più

- Panoramica di Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Panoramica di Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Rilevamento](/it/gateway/discovery)
- [Autenticazione](/it/gateway/authentication)
