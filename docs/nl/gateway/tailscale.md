---
read_when:
    - De Gateway-bedieningsinterface buiten localhost beschikbaar maken
    - Toegang tot tailnet of openbaar dashboard automatiseren
summary: Geïntegreerde Tailscale Serve/Funnel voor het Gateway-dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:56:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw kan Tailscale **Serve** (tailnet) of **Funnel** (openbaar) automatisch configureren voor het
Gateway-dashboard en de WebSocket-poort. Hierdoor blijft de Gateway gebonden aan loopback terwijl
Tailscale HTTPS, routering en (voor Serve) identiteitsheaders biedt.

## Modi

- `serve`: Serve alleen voor tailnet via `tailscale serve`. De gateway blijft op `127.0.0.1`.
- `funnel`: Openbare HTTPS via `tailscale funnel`. OpenClaw vereist een gedeeld wachtwoord.
- `off`: Standaard (geen Tailscale-automatisering).

Status- en audituitvoer gebruiken **Tailscale-blootstelling** voor deze OpenClaw Serve/Funnel
modus. `off` betekent dat OpenClaw Serve of Funnel niet beheert; het betekent niet dat de
lokale Tailscale-daemon is gestopt of uitgelogd.

## Auth

Stel `gateway.auth.mode` in om de handshake te beheren:

- `none` (alleen private ingress)
- `token` (standaard wanneer `OPENCLAW_GATEWAY_TOKEN` is ingesteld)
- `password` (gedeeld geheim via `OPENCLAW_GATEWAY_PASSWORD` of configuratie)
- `trusted-proxy` (identiteitsbewuste reverse proxy; zie [Vertrouwde proxy-auth](/nl/gateway/trusted-proxy-auth))

Wanneer `tailscale.mode = "serve"` en `gateway.auth.allowTailscale` `true` is,
kan Control UI/WebSocket-auth gebruikmaken van Tailscale-identiteitsheaders
(`tailscale-user-login`) zonder een token/wachtwoord te leveren. OpenClaw verifieert
de identiteit door het `x-forwarded-for`-adres via de lokale Tailscale-
daemon (`tailscale whois`) op te lossen en dit met de header te vergelijken voordat het wordt geaccepteerd.
OpenClaw behandelt een request alleen als Serve wanneer het vanaf loopback binnenkomt met
Tailscale's `x-forwarded-for`, `x-forwarded-proto` en `x-forwarded-host`
headers.
Voor Control UI-operatorsessies die browserapparaatidentiteit bevatten, slaat dit
geverifieerde Serve-pad ook de device-pairing-rondgang over. Het omzeilt
browserapparaatidentiteit niet: clients zonder apparaat worden nog steeds geweigerd, en node-rol-
of niet-Control UI-WebSocket-verbindingen volgen nog steeds de normale pairing- en
auth-controles.
HTTP API-endpoints (bijvoorbeeld `/v1/*`, `/tools/invoke` en `/api/channels/*`)
gebruiken **geen** Tailscale-auth via identiteitsheaders. Ze volgen nog steeds de normale
HTTP-authmodus van de gateway: standaard auth met gedeeld geheim, of een bewust
geconfigureerde trusted-proxy / private-ingress `none`-instelling.
Deze tokenloze flow gaat ervan uit dat de gatewayhost vertrouwd is. Als niet-vertrouwde lokale code
op dezelfde host kan draaien, schakel dan `gateway.auth.allowTailscale` uit en vereis
in plaats daarvan token-/wachtwoord-auth.
Om expliciete inloggegevens met gedeeld geheim te vereisen, stel `gateway.auth.allowTailscale: false`
in en gebruik `gateway.auth.mode: "token"` of `"password"`.

## Configuratievoorbeelden

### Alleen tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Open: `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

### Alleen tailnet (binden aan Tailnet-IP)

Gebruik dit wanneer je wilt dat de Gateway rechtstreeks op het Tailnet-IP luistert (geen Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Maak verbinding vanaf een ander Tailnet-apparaat:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) werkt **niet** in deze modus.
</Note>

### Openbaar internet (Funnel + gedeeld wachtwoord)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Geef de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD` boven het vastleggen van een wachtwoord op schijf.

## CLI-voorbeelden

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Opmerkingen

- Tailscale Serve/Funnel vereist dat de `tailscale` CLI is geïnstalleerd en ingelogd.
- `tailscale.mode: "funnel"` weigert te starten tenzij de authmodus `password` is om openbare blootstelling te voorkomen.
- Stel `gateway.tailscale.resetOnExit` in als je wilt dat OpenClaw de `tailscale serve`-
  of `tailscale funnel`-configuratie bij het afsluiten ongedaan maakt.
- `gateway.bind: "tailnet"` is een directe Tailnet-binding (geen HTTPS, geen Serve/Funnel).
- `gateway.bind: "auto"` geeft de voorkeur aan loopback; gebruik `tailnet` als je alleen Tailnet wilt.
- Serve/Funnel stellen alleen de **Gateway control UI + WS** bloot. Nodes maken verbinding via
  hetzelfde Gateway WS-endpoint, dus Serve kan werken voor node-toegang.

## Browserbesturing (externe Gateway + lokale browser)

Als je de Gateway op één machine draait maar een browser op een andere machine wilt aansturen,
draai dan een **nodehost** op de browsermachine en houd beide op hetzelfde tailnet.
De Gateway proxyt browseracties naar de node; er is geen aparte controleserver of Serve-URL nodig.

Vermijd Funnel voor browserbesturing; behandel node-pairing zoals operatortoegang.

## Tailscale-vereisten + limieten

- Serve vereist dat HTTPS voor je tailnet is ingeschakeld; de CLI vraagt erom als dit ontbreekt.
- Serve injecteert Tailscale-identiteitsheaders; Funnel doet dat niet.
- Funnel vereist Tailscale v1.38.3+, MagicDNS, HTTPS ingeschakeld en een funnel-nodeattribuut.
- Funnel ondersteunt alleen poorten `443`, `8443` en `10000` via TLS.
- Funnel op macOS vereist de open-source Tailscale-appvariant.

## Meer informatie

- Overzicht van Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve`-commando: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Overzicht van Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel`-commando: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Detectie](/nl/gateway/discovery)
- [Authenticatie](/nl/gateway/authentication)
