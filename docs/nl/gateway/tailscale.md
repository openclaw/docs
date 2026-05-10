---
read_when:
    - De Gateway-beheerinterface buiten localhost beschikbaar maken
    - Toegang tot tailnet of openbaar dashboard automatiseren
summary: Geïntegreerde Tailscale Serve/Funnel voor het Gateway-dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:38:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw kan Tailscale **Serve** (tailnet) of **Funnel** (publiek) automatisch configureren voor het
Gateway-dashboard en de WebSocket-poort. Hierdoor blijft de Gateway gebonden aan loopback terwijl
Tailscale HTTPS, routering en (voor Serve) identiteitsheaders levert.

## Modi

- `serve`: alleen-tailnet Serve via `tailscale serve`. De gateway blijft op `127.0.0.1`.
- `funnel`: publieke HTTPS via `tailscale funnel`. OpenClaw vereist een gedeeld wachtwoord.
- `off`: standaard (geen Tailscale-automatisering).

Status- en audituitvoer gebruiken **Tailscale-blootstelling** voor deze OpenClaw Serve/Funnel-
modus. `off` betekent dat OpenClaw Serve of Funnel niet beheert; het betekent niet dat de
lokale Tailscale-daemon is gestopt of is uitgelogd.

## Authenticatie

Stel `gateway.auth.mode` in om de handshake te beheren:

- `none` (alleen private ingress)
- `token` (standaard wanneer `OPENCLAW_GATEWAY_TOKEN` is ingesteld)
- `password` (gedeeld geheim via `OPENCLAW_GATEWAY_PASSWORD` of configuratie)
- `trusted-proxy` (identiteitsbewuste reverse proxy; zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth))

Wanneer `tailscale.mode = "serve"` en `gateway.auth.allowTailscale` `true` is,
kan authenticatie voor de Control UI/WebSocket Tailscale-identiteitsheaders
(`tailscale-user-login`) gebruiken zonder een token/wachtwoord op te geven. OpenClaw verifieert
de identiteit door het `x-forwarded-for`-adres op te lossen via de lokale Tailscale-
daemon (`tailscale whois`) en het te vergelijken met de header voordat deze wordt geaccepteerd.
OpenClaw behandelt een aanvraag alleen als Serve wanneer deze vanaf loopback binnenkomt met
Tailscale's `x-forwarded-for`, `x-forwarded-proto` en `x-forwarded-host`-
headers.
Voor Control UI-operatorsessies die browserapparaatidentiteit bevatten, slaat dit
geverifieerde Serve-pad ook de retourstap voor apparaatkoppeling over. Het omzeilt
browserapparaatidentiteit niet: clients zonder apparaat worden nog steeds geweigerd, en node-rol-
of niet-Control UI-WebSocket-verbindingen volgen nog steeds de normale koppelings- en
authenticatiecontroles.
HTTP API-eindpunten (bijvoorbeeld `/v1/*`, `/tools/invoke` en `/api/channels/*`)
gebruiken **geen** authenticatie via Tailscale-identiteitsheaders. Ze volgen nog steeds de
normale HTTP-authenticatiemodus van de gateway: standaard authenticatie met gedeeld geheim,
of een bewust geconfigureerde trusted-proxy- / private-ingress-`none`-opzet.
Deze tokenloze stroom gaat ervan uit dat de gatewayhost wordt vertrouwd. Als niet-vertrouwde lokale code
op dezelfde host kan worden uitgevoerd, schakel dan `gateway.auth.allowTailscale` uit en vereis
in plaats daarvan token-/wachtwoordauthenticatie.
Om expliciete referenties met gedeeld geheim te vereisen, stel `gateway.auth.allowTailscale: false`
in en gebruik `gateway.auth.mode: "token"` of `"password"`.

## Configuratievoorbeelden

### Alleen-tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Open: `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

### Alleen-tailnet (binden aan Tailnet-IP)

Gebruik dit wanneer je wilt dat de Gateway rechtstreeks luistert op het Tailnet-IP (geen Serve/Funnel).

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

### Publiek internet (Funnel + gedeeld wachtwoord)

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
- `tailscale.mode: "funnel"` weigert te starten tenzij de authenticatiemodus `password` is, om publieke blootstelling te voorkomen.
- Stel `gateway.tailscale.resetOnExit` in als je wilt dat OpenClaw de configuratie van `tailscale serve`
  of `tailscale funnel` ongedaan maakt bij afsluiten.
- Stel `gateway.tailscale.preserveFunnel: true` in om een extern geconfigureerde
  `tailscale funnel`-route actief te houden tijdens gateway-herstarts. Wanneer dit is ingeschakeld en de
  gateway draait in `mode: "serve"`, controleert OpenClaw `tailscale funnel status`
  voordat Serve opnieuw wordt toegepast en slaat dit over wanneer een Funnel-route de
  gatewaypoort al afdekt. Het door OpenClaw beheerde beleid voor Funnel met alleen wachtwoord blijft ongewijzigd.
- `gateway.bind: "tailnet"` is een directe Tailnet-binding (geen HTTPS, geen Serve/Funnel).
- `gateway.bind: "auto"` geeft de voorkeur aan loopback; gebruik `tailnet` als je alleen-tailnet wilt.
- Serve/Funnel stellen alleen de **Gateway Control UI + WS** bloot. Nodes maken verbinding via
  hetzelfde Gateway WS-eindpunt, dus Serve kan werken voor nodetoegang.

## Browserbesturing (externe Gateway + lokale browser)

Als je de Gateway op de ene machine draait maar een browser op een andere machine wilt aansturen,
draai dan een **nodehost** op de browsermachine en houd beide op dezelfde tailnet.
De Gateway proxyt browseracties naar de node; er is geen aparte controleserver of Serve-URL nodig.

Vermijd Funnel voor browserbesturing; behandel nodekoppeling zoals operatortoegang.

## Tailscale-vereisten + limieten

- Serve vereist dat HTTPS is ingeschakeld voor je tailnet; de CLI vraagt erom als dit ontbreekt.
- Serve injecteert Tailscale-identiteitsheaders; Funnel doet dat niet.
- Funnel vereist Tailscale v1.38.3+, MagicDNS, ingeschakelde HTTPS en een funnel-nodeattribuut.
- Funnel ondersteunt alleen poorten `443`, `8443` en `10000` via TLS.
- Funnel op macOS vereist de opensourcevariant van de Tailscale-app.

## Meer informatie

- Overzicht van Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve`-opdracht: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Overzicht van Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel`-opdracht: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Ontdekking](/nl/gateway/discovery)
- [Authenticatie](/nl/gateway/authentication)
