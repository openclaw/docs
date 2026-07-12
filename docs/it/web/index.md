---
read_when:
    - Vuoi accedere al Gateway tramite Tailscale
    - Vuoi l'interfaccia di controllo nel browser e la modifica della configurazione
summary: 'Superfici web del Gateway: interfaccia di controllo, modalità di associazione e sicurezza'
title: Web
x-i18n:
    generated_at: "2026-07-12T07:39:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Il Gateway rende disponibile una piccola **interfaccia di controllo nel browser** (Vite + Lit) sulla stessa porta del WebSocket del Gateway:

- predefinito: `http://<host>:18789/`
- con `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefisso facoltativo: imposta `gateway.controlUi.basePath` (ad es. `/openclaw`)

Le funzionalità sono descritte in [Interfaccia di controllo](/it/web/control-ui). Questa pagina illustra le modalità di associazione, la sicurezza e le altre superfici esposte sul Web.

## Configurazione (attiva per impostazione predefinita)

L'interfaccia di controllo è **abilitata per impostazione predefinita** quando sono presenti gli asset (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath facoltativo
  },
}
```

## Webhook

Quando `hooks.enabled=true`, il Gateway espone anche un endpoint Webhook sullo stesso server HTTP. Consulta `hooks` nel [riferimento alla configurazione del Gateway](/it/gateway/configuration-reference#hooks) per informazioni sull'autenticazione e sui payload.

## RPC HTTP di amministrazione

`POST /api/v1/admin/rpc` espone tramite HTTP alcuni metodi selezionati del piano di controllo del Gateway. È disattivato per impostazione predefinita e viene registrato solo quando il plugin `admin-http-rpc` è abilitato. Consulta [RPC HTTP di amministrazione](/it/plugins/admin-http-rpc) per il modello di autenticazione, i metodi consentiti e il confronto con l'API WebSocket.

## Accesso tramite Tailscale

<Tabs>
  <Tab title="Serve integrato (consigliato)">
    Mantieni il Gateway su local loopback e lascia che Tailscale Serve operi da proxy:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Avvia il Gateway:

    ```bash
    openclaw gateway
    ```

    Apri `https://<magicdns>/` (oppure il valore configurato per `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Associazione alla tailnet + token">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Avvia il Gateway (questo esempio non local loopback utilizza l'autenticazione con token a segreto condiviso):

    ```bash
    openclaw gateway
    ```

    Apri `http://<tailscale-ip>:18789/` (oppure il valore configurato per `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Internet pubblico (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // oppure OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` richiede `gateway.auth.mode: "password"`; sia Serve sia Funnel richiedono `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Note sulla sicurezza

- L'autenticazione del Gateway è richiesta per impostazione predefinita: token, password, proxy attendibile oppure intestazioni di identità di Tailscale Serve, quando abilitate.
- Le associazioni diverse da local loopback **richiedono** comunque l'autenticazione del Gateway: autenticazione tramite token/password oppure un proxy inverso in grado di verificare l'identità con `gateway.auth.mode: "trusted-proxy"`.
- La procedura guidata di configurazione iniziale crea per impostazione predefinita un'autenticazione a segreto condiviso e in genere genera un token del Gateway, anche su local loopback.
- In modalità a segreto condiviso, durante l'handshake WebSocket l'interfaccia invia `connect.params.auth.token` oppure `connect.params.auth.password`.
- Con `gateway.tls.enabled: true`, gli strumenti locali per il pannello di controllo e lo stato generano URL `https://` e URL WebSocket `wss://`.
- Nelle modalità basate sull'identità (Tailscale Serve, `trusted-proxy`), la verifica dell'autenticazione WebSocket viene soddisfatta tramite le intestazioni della richiesta anziché mediante un segreto condiviso.
- Per le distribuzioni pubbliche dell'interfaccia di controllo non associate a local loopback, imposta esplicitamente `gateway.controlUi.allowedOrigins` specificando le origini complete. I caricamenti privati dalla stessa origine vengono accettati anche senza questa impostazione per local loopback, indirizzi RFC1918/link-local e host `.local`, `.ts.net` e Tailscale CGNAT.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` abilita il ripiego dell'origine basato sull'intestazione Host; si tratta di una pericolosa riduzione della sicurezza.
- Con Serve, le intestazioni di identità di Tailscale soddisfano l'autenticazione dell'interfaccia di controllo/WebSocket quando `gateway.auth.allowTailscale: true` (non sono richiesti token o password). Gli endpoint dell'API HTTP non utilizzano le intestazioni di identità di Tailscale; seguono sempre la normale modalità di autenticazione HTTP del Gateway. Imposta `gateway.auth.allowTailscale: false` per richiedere credenziali esplicite anche tramite Serve. Questo flusso senza token presuppone che l'host del Gateway stesso sia attendibile. Consulta [Tailscale](/it/gateway/tailscale) e [Sicurezza](/it/gateway/security).

## Compilazione dell'interfaccia

Il Gateway rende disponibili i file statici da `dist/control-ui`:

```bash
pnpm ui:build
```
