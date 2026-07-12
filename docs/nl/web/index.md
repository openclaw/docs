---
read_when:
    - Je wilt via Tailscale toegang tot de Gateway
    - Je wilt de browserbedieningsinterface en configuratiebewerking
summary: 'Gateway-webinterfaces: bedieningsinterface, bindingsmodi en beveiliging'
title: Web
x-i18n:
    generated_at: "2026-07-12T09:32:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

De Gateway biedt een kleine **browsergebaseerde beheerinterface** (Vite + Lit) aan via dezelfde poort als de Gateway-WebSocket:

- standaard: `http://<host>:18789/`
- met `gateway.tls.enabled: true`: `https://<host>:18789/`
- optioneel voorvoegsel: stel `gateway.controlUi.basePath` in (bijv. `/openclaw`)

De mogelijkheden worden beschreven in [Beheerinterface](/nl/web/control-ui). Deze pagina behandelt bindingsmodi, beveiliging en andere webgerichte oppervlakken.

## Configuratie (standaard ingeschakeld)

De beheerinterface is **standaard ingeschakeld** wanneer assets aanwezig zijn (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optioneel
  },
}
```

## Webhooks

Wanneer `hooks.enabled=true`, stelt de Gateway ook een Webhook-eindpunt beschikbaar op dezelfde HTTP-server. Zie `hooks` in het [configuratieoverzicht van de Gateway](/nl/gateway/configuration-reference#hooks) voor authenticatie en payloads.

## HTTP-RPC voor beheer

`POST /api/v1/admin/rpc` stelt geselecteerde methoden van het Gateway-besturingsvlak beschikbaar via HTTP. Standaard uitgeschakeld; wordt alleen geregistreerd wanneer de Plugin `admin-http-rpc` is ingeschakeld. Zie [HTTP-RPC voor beheer](/nl/plugins/admin-http-rpc) voor het authenticatiemodel, de toegestane methoden en een vergelijking met de WebSocket-API.

## Toegang via Tailscale

<Tabs>
  <Tab title="Geïntegreerde Serve (aanbevolen)">
    Houd de Gateway op local loopback en laat Tailscale Serve deze als proxy doorgeven:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Start de Gateway:

    ```bash
    openclaw gateway
    ```

    Open `https://<magicdns>/` (of uw geconfigureerde `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Tailnet-binding + token">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Start de Gateway (dit voorbeeld zonder local loopback gebruikt authenticatie met een gedeeld geheim token):

    ```bash
    openclaw gateway
    ```

    Open `http://<tailscale-ip>:18789/` (of uw geconfigureerde `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Openbaar internet (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // of OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` vereist `gateway.auth.mode: "password"`; zowel Serve als Funnel vereisen `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Beveiligingsopmerkingen

- Gateway-authenticatie is standaard vereist: token, wachtwoord, vertrouwde proxy of, indien ingeschakeld, identiteitsheaders van Tailscale Serve.
- Bindingen buiten local loopback **vereisen** nog steeds Gateway-authenticatie: authenticatie met een token/wachtwoord of een identiteitsbewuste reverse proxy met `gateway.auth.mode: "trusted-proxy"`.
- De onboardingwizard maakt standaard authenticatie met een gedeeld geheim en genereert doorgaans een Gateway-token, zelfs op local loopback.
- In de modus met een gedeeld geheim verzendt de beheerinterface `connect.params.auth.token` of `connect.params.auth.password` tijdens de WebSocket-handshake.
- Met `gateway.tls.enabled: true` geven lokale helpers voor het dashboard en de status `https://`-URL's en `wss://`-WebSocket-URL's weer.
- In modi die identiteit doorgeven (Tailscale Serve, `trusted-proxy`) wordt aan de WebSocket-authenticatiecontrole voldaan via aanvraagheaders in plaats van een gedeeld geheim.
- Stel voor openbare implementaties van de beheerinterface buiten local loopback `gateway.controlUi.allowedOrigins` expliciet in (volledige origins). Privéaanvragen van dezelfde origin worden zonder deze instelling geaccepteerd voor local loopback, RFC1918/link-local, `.local`, `.ts.net` en Tailscale-CGNAT-hosts.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` schakelt origin-terugval op basis van de Host-header in; dit is een gevaarlijke verlaging van de beveiliging.
- Met Serve voldoen Tailscale-identiteitsheaders aan de authenticatie voor de beheerinterface/WebSocket wanneer `gateway.auth.allowTailscale: true` (geen token/wachtwoord vereist). HTTP-API-eindpunten gebruiken geen Tailscale-identiteitsheaders; ze volgen altijd de normale HTTP-authenticatiemodus van de Gateway. Stel `gateway.auth.allowTailscale: false` in om zelfs via Serve expliciete inloggegevens te vereisen. Deze tokenloze werkwijze veronderstelt dat de Gateway-host zelf wordt vertrouwd. Zie [Tailscale](/nl/gateway/tailscale) en [Beveiliging](/nl/gateway/security).

## De beheerinterface bouwen

De Gateway biedt statische bestanden aan vanuit `dist/control-ui`:

```bash
pnpm ui:build
```
