---
read_when:
    - De Gateway-beheer-UI buiten localhost beschikbaar maken
    - Toegang tot tailnet of openbaar dashboard automatiseren
summary: Geïntegreerde Tailscale Serve/Funnel voor het Gateway-dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-04-29T22:48:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw kan Tailscale **Serve** (tailnet) of **Funnel** (publiek) automatisch configureren voor het
Gateway-dashboard en de WebSocket-poort. Zo blijft de Gateway aan loopback gebonden terwijl
Tailscale HTTPS, routering en (voor Serve) identiteitsheaders levert.

## Modi

- `serve`: Serve alleen voor tailnet via `tailscale serve`. De gateway blijft op `127.0.0.1`.
- `funnel`: Publieke HTTPS via `tailscale funnel`. OpenClaw vereist een gedeeld wachtwoord.
- `off`: Standaard (geen Tailscale-automatisering).

Status- en audituitvoer gebruiken **Tailscale-blootstelling** voor deze OpenClaw Serve/Funnel-
modus. `off` betekent dat OpenClaw Serve of Funnel niet beheert; het betekent niet dat de
lokale Tailscale-daemon is gestopt of uitgelogd.

## Verificatie

Stel `gateway.auth.mode` in om de handshake te beheren:

- `none` (alleen private ingress)
- `token` (standaard wanneer `OPENCLAW_GATEWAY_TOKEN` is ingesteld)
- `password` (gedeeld geheim via `OPENCLAW_GATEWAY_PASSWORD` of configuratie)
- `trusted-proxy` (identiteitsbewuste reverse proxy; zie [Verificatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth))

Wanneer `tailscale.mode = "serve"` en `gateway.auth.allowTailscale` `true` is,
kan Control UI/WebSocket-verificatie Tailscale-identiteitsheaders
(`tailscale-user-login`) gebruiken zonder een token/wachtwoord op te geven. OpenClaw verifieert
de identiteit door het `x-forwarded-for`-adres via de lokale Tailscale-
daemon (`tailscale whois`) op te lossen en dit te vergelijken met de header voordat het wordt geaccepteerd.
OpenClaw behandelt een verzoek alleen als Serve wanneer het binnenkomt vanaf loopback met
Tailscale’s `x-forwarded-for`, `x-forwarded-proto` en `x-forwarded-host`-
headers.
Voor Control UI-operatorsessies die browserapparaatidentiteit bevatten, slaat dit
geverifieerde Serve-pad ook de device-pairing-roundtrip over. Het omzeilt
browserapparaatidentiteit niet: clients zonder apparaat worden nog steeds geweigerd, en node-rol-
of niet-Control UI-WebSocket-verbindingen volgen nog steeds de normale pairing- en
verificatiecontroles.
HTTP API-eindpunten (bijvoorbeeld `/v1/*`, `/tools/invoke` en `/api/channels/*`)
gebruiken **geen** Tailscale-identiteitsheaderverificatie. Ze volgen nog steeds de normale
HTTP-verificatiemodus van de gateway: standaard verificatie met gedeeld geheim, of een bewust
geconfigureerde trusted-proxy / private-ingress-`none`-opzet.
Deze tokenloze flow gaat ervan uit dat de gateway-host vertrouwd is. Als onvertrouwde lokale code
op dezelfde host kan draaien, schakel dan `gateway.auth.allowTailscale` uit en vereis in plaats daarvan
token-/wachtwoordverificatie.
Om expliciete referenties met gedeeld geheim te vereisen, stel je `gateway.auth.allowTailscale: false`
in en gebruik je `gateway.auth.mode: "token"` of `"password"`.

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

Openen: `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

### Alleen tailnet (binden aan Tailnet-IP)

Gebruik dit wanneer je wilt dat de Gateway direct luistert op het Tailnet-IP (geen Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Verbind vanaf een ander Tailnet-apparaat:

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
- `tailscale.mode: "funnel"` weigert te starten tenzij de verificatiemodus `password` is, om publieke blootstelling te voorkomen.
- Stel `gateway.tailscale.resetOnExit` in als je wilt dat OpenClaw de configuratie van `tailscale serve`
  of `tailscale funnel` ongedaan maakt bij het afsluiten.
- `gateway.bind: "tailnet"` is een directe Tailnet-binding (geen HTTPS, geen Serve/Funnel).
- `gateway.bind: "auto"` geeft de voorkeur aan loopback; gebruik `tailnet` als je alleen Tailnet wilt.
- Serve/Funnel stelt alleen de **Gateway control UI + WS** bloot. Nodes verbinden via
  hetzelfde Gateway WS-eindpunt, dus Serve kan werken voor node-toegang.

## Browserbesturing (externe Gateway + lokale browser)

Als je de Gateway op de ene machine draait maar een browser op een andere machine wilt aansturen,
draai dan een **node-host** op de browsermachine en houd beide op hetzelfde tailnet.
De Gateway proxyt browseracties naar de node; er is geen afzonderlijke control server of Serve-URL nodig.

Vermijd Funnel voor browserbesturing; behandel node-pairing zoals operatortoegang.

## Tailscale-vereisten + beperkingen

- Serve vereist dat HTTPS is ingeschakeld voor je tailnet; de CLI vraagt erom als dit ontbreekt.
- Serve injecteert Tailscale-identiteitsheaders; Funnel doet dat niet.
- Funnel vereist Tailscale v1.38.3+, MagicDNS, ingeschakelde HTTPS en een funnel-nodekenmerk.
- Funnel ondersteunt alleen poorten `443`, `8443` en `10000` via TLS.
- Funnel op macOS vereist de open-source Tailscale-appvariant.

## Meer informatie

- Overzicht van Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Opdracht `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Overzicht van Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Opdracht `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Detectie](/nl/gateway/discovery)
- [Verificatie](/nl/gateway/authentication)
