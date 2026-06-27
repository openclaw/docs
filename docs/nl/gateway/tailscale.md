---
read_when:
    - De Gateway Control UI buiten localhost beschikbaar maken
    - Toegang tot tailnet of openbaar dashboard automatiseren
summary: Geïntegreerde Tailscale Serve/Funnel voor het Gateway-dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T17:37:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw kan Tailscale **Serve** (tailnet) of **Funnel** (publiek) automatisch configureren voor het
Gateway-dashboard en de WebSocket-poort. Hierdoor blijft de Gateway aan loopback gebonden terwijl
Tailscale HTTPS, routing en (voor Serve) identiteitsheaders levert.

## Modi

- `serve`: Alleen-tailnet Serve via `tailscale serve`. De gateway blijft op `127.0.0.1`.
- `funnel`: Publieke HTTPS via `tailscale funnel`. OpenClaw vereist een gedeeld wachtwoord.
- `off`: Standaard (geen Tailscale-automatisering).

Status- en audituitvoer gebruiken **Tailscale-blootstelling** voor deze OpenClaw Serve/Funnel-
modus. `off` betekent dat OpenClaw Serve of Funnel niet beheert; het betekent niet dat de
lokale Tailscale-daemon is gestopt of afgemeld.

## Auth

Stel `gateway.auth.mode` in om de handshake te beheren:

- `none` (alleen private ingress)
- `token` (standaard wanneer `OPENCLAW_GATEWAY_TOKEN` is ingesteld)
- `password` (gedeeld geheim via `OPENCLAW_GATEWAY_PASSWORD` of configuratie)
- `trusted-proxy` (identiteitsbewuste reverse proxy; zie [Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth))

Wanneer `tailscale.mode = "serve"` en `gateway.auth.allowTailscale` `true` is,
kan Control UI/WebSocket-auth Tailscale-identiteitsheaders gebruiken
(`tailscale-user-login`) zonder een token/wachtwoord te leveren. OpenClaw verifieert
de identiteit door het `x-forwarded-for`-adres via de lokale Tailscale-
daemon (`tailscale whois`) op te lossen en dit met de header te vergelijken voordat die wordt geaccepteerd.
OpenClaw behandelt een verzoek alleen als Serve wanneer het vanaf loopback binnenkomt met
Tailscale's `x-forwarded-for`, `x-forwarded-proto` en `x-forwarded-host`-
headers.
Voor Control UI-operatorsessies die browserapparaatidentiteit bevatten, slaat dit
geverifieerde Serve-pad ook de device-pairing-roundtrip over. Het omzeilt
browserapparaatidentiteit niet: clients zonder apparaat worden nog steeds geweigerd, en node-role-
of niet-Control UI-WebSocket-verbindingen volgen nog steeds de normale pairing- en
auth-controles.
HTTP API-eindpunten (bijvoorbeeld `/v1/*`, `/tools/invoke` en `/api/channels/*`)
gebruiken **geen** Tailscale-identiteitsheader-auth. Ze volgen nog steeds de normale
HTTP-auth-modus van de gateway: standaard auth met gedeeld geheim, of een bewust
geconfigureerde trusted-proxy / private-ingress `none`-setup.
Deze tokenloze flow gaat ervan uit dat de gatewayhost vertrouwd is. Als niet-vertrouwde lokale code
op dezelfde host kan worden uitgevoerd, schakel dan `gateway.auth.allowTailscale` uit en vereis in plaats daarvan
token-/wachtwoord-auth.
Om expliciete gedeelde-geheim-inloggegevens te vereisen, stel `gateway.auth.allowTailscale: false`
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

Om de Control UI via een benoemde Tailscale Service bloot te stellen in plaats van via de
apparaathostnaam, stel `gateway.tailscale.serviceName` in op de Servicenaam:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Met het voorbeeld hierboven rapporteert startup de Service-URL als
`https://openclaw.<tailnet-name>.ts.net/` in plaats van de apparaathostnaam.
Tailscale Services vereisen dat de host een goedgekeurde getagde node in je
tailnet is. Configureer de tag en keur de Service goed in Tailscale voordat je
deze optie inschakelt, anders mislukt `tailscale serve --service=...` tijdens het starten van de gateway.

### Alleen-tailnet (binden aan Tailnet-IP)

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

Geef de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD` boven het committen van een wachtwoord naar schijf.

## CLI-voorbeelden

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Opmerkingen

- Tailscale Serve/Funnel vereist dat de `tailscale` CLI is geïnstalleerd en aangemeld.
- `tailscale.mode: "funnel"` weigert te starten tenzij de auth-modus `password` is, om publieke blootstelling te vermijden.
- `gateway.tailscale.serviceName` geldt alleen voor Serve-modus en wordt doorgegeven aan
  `tailscale serve --service=<name>`. De waarde moet Tailscale's
  `svc:<dns-label>`-Servicenaamindeling gebruiken, bijvoorbeeld `svc:openclaw`.
  Tailscale vereist dat Service-hosts getagde nodes zijn, en de Service moet mogelijk
  in de beheerconsole worden goedgekeurd voordat Serve deze kan publiceren.
- Stel `gateway.tailscale.resetOnExit` in als je wilt dat OpenClaw de configuratie van `tailscale serve`
  of `tailscale funnel` bij afsluiten ongedaan maakt.
- Stel `gateway.tailscale.preserveFunnel: true` in om een extern geconfigureerde
  `tailscale funnel`-route actief te houden over gateway-herstarts heen. Wanneer dit is ingeschakeld en de
  gateway in `mode: "serve"` draait, controleert OpenClaw `tailscale funnel status`
  voordat Serve opnieuw wordt toegepast en slaat dit over wanneer een Funnel-route de
  gatewaypoort al dekt. Het door OpenClaw beheerde Funnel-beleid met alleen wachtwoord blijft ongewijzigd.
- `gateway.bind: "tailnet"` is een directe Tailnet-binding (geen HTTPS, geen Serve/Funnel).
- `gateway.bind: "auto"` geeft de voorkeur aan loopback; gebruik `tailnet` als je alleen-tailnet wilt.
- Serve/Funnel stelt alleen de **Gateway control UI + WS** bloot. Nodes verbinden via
  hetzelfde Gateway WS-eindpunt, dus Serve kan werken voor node-toegang.

## Browserbesturing (externe Gateway + lokale browser)

Als je de Gateway op één machine draait maar een browser op een andere machine wilt aansturen,
draai dan een **nodehost** op de browsermachine en houd beide op hetzelfde tailnet.
De Gateway proxyt browseracties naar de node; er is geen aparte controleserver of Serve-URL nodig.

Vermijd Funnel voor browserbesturing; behandel node-pairing als operatortoegang.

## Tailscale-vereisten + limieten

- Serve vereist dat HTTPS is ingeschakeld voor je tailnet; de CLI vraagt erom als dit ontbreekt.
- Serve injecteert Tailscale-identiteitsheaders; Funnel doet dat niet.
- Funnel vereist Tailscale v1.38.3+, MagicDNS, ingeschakelde HTTPS en een funnel-nodeattribuut.
- Funnel ondersteunt via TLS alleen poorten `443`, `8443` en `10000`.
- Funnel op macOS vereist de open-source Tailscale-appvariant.

## Meer informatie

- Overzicht van Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve`-commando: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Overzicht van Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel`-commando: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Discovery](/nl/gateway/discovery)
- [Authenticatie](/nl/gateway/authentication)
