---
read_when:
    - De Gateway Control UI buiten localhost beschikbaar maken
    - Toegang tot het dashboard via tailnet of openbaar netwerk automatiseren
summary: Geïntegreerde Tailscale Serve/Funnel voor het Gateway-dashboard
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T08:56:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw kan Tailscale **Serve** (tailnet) of **Funnel** (openbaar) automatisch configureren voor het Gateway-dashboard en de WebSocket-poort. Hierdoor blijft de Gateway aan loopback gebonden, terwijl Tailscale HTTPS, routering en (voor Serve) identiteitsheaders levert.

## Modi

`gateway.tailscale.mode`:

| Modus           | Gedrag                                                                      |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | Serve uitsluitend via het tailnet met `tailscale serve`. De Gateway blijft op `127.0.0.1`. |
| `funnel`        | Openbare HTTPS via `tailscale funnel`. Vereist een gedeeld wachtwoord.      |
| `off` (standaard) | Geen Tailscale-automatisering.                                            |

Status- en audituitvoer gebruiken **Tailscale-blootstelling** voor deze OpenClaw Serve/Funnel-modus. `off` betekent dat OpenClaw Serve of Funnel niet beheert; het betekent niet dat de lokale Tailscale-daemon is gestopt of afgemeld.

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

Open: `https://<magicdns>/` (of uw geconfigureerde `gateway.controlUi.basePath`)

Om de Control UI via een benoemde Tailscale Service beschikbaar te maken in plaats van via de hostnaam van het apparaat, stelt u `gateway.tailscale.serviceName` in op de naam van de Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Bij het opstarten wordt vervolgens de Service-URL `https://openclaw.<tailnet-name>.ts.net/` gemeld in plaats van de hostnaam van het apparaat. Voor Tailscale Services moet de host een goedgekeurde getagde Node in uw tailnet zijn — configureer de tag en keur de Service in Tailscale goed voordat u dit inschakelt, anders mislukt `tailscale serve --service=...` tijdens het opstarten van de Gateway.

### Alleen tailnet (binden aan Tailnet-IP)

Gebruik dit om de Gateway rechtstreeks op het Tailnet-IP te laten luisteren, zonder Serve/Funnel:

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
Wanneer een bindbaar Tailnet-IPv4-adres aanwezig is, vereist de Gateway ook `http://127.0.0.1:18789` voor geauthenticeerde clients op dezelfde host. Als bij het opstarten geen Tailnet-adres beschikbaar is, valt de Gateway terug op uitsluitend loopback; start opnieuw nadat Tailscale beschikbaar is geworden om rechtstreekse Tailnet-toegang toe te voegen. Geen van beide paden voegt LAN- of openbare blootstelling toe.
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

Geef de voorkeur aan `OPENCLAW_GATEWAY_PASSWORD` boven het opslaan van een wachtwoord op schijf.

## CLI-voorbeelden

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Authenticatie

`gateway.auth.mode` bepaalt de handshake:

| Modus                                                  | Gebruikssituatie                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | Alleen privé-inkomend verkeer                                                       |
| `token` (standaard wanneer `OPENCLAW_GATEWAY_TOKEN` is ingesteld) | Gedeeld token                                                            |
| `password`                                             | Gedeeld geheim via `OPENCLAW_GATEWAY_PASSWORD` of de configuratie                   |
| `trusted-proxy`                                        | Identiteitsbewuste reverse proxy; zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth) |

### Tailscale-identiteitsheaders (alleen Serve)

Wanneer `tailscale.mode: "serve"` is ingesteld en `gateway.auth.allowTailscale` `true` is, kan de authenticatie van de Control UI/WebSocket Tailscale-identiteitsheaders (`tailscale-user-login`) gebruiken in plaats van een token/wachtwoord. OpenClaw verifieert de header door het `x-forwarded-for`-adres van het verzoek via de lokale Tailscale-daemon (`tailscale whois`) op te zoeken en dit met de aanmeldnaam in de header te vergelijken voordat het verzoek wordt geaccepteerd. Een verzoek komt alleen voor dit pad in aanmerking wanneer het via loopback binnenkomt met de Tailscale-headers `x-forwarded-for`, `x-forwarded-proto` en `x-forwarded-host`.

Deze tokenloze stroom gaat ervan uit dat de Gateway-host wordt vertrouwd. Als niet-vertrouwde lokale code op dezelfde host kan worden uitgevoerd, stelt u `gateway.auth.allowTailscale: false` in en vereist u in plaats daarvan authenticatie met een token/wachtwoord.

Reikwijdte van de omzeiling:

- Geldt alleen voor het WebSocket-authenticatieoppervlak van de Control UI. HTTP-API-eindpunten (`/v1/*`, `/tools/invoke`, `/api/channels/*`, enzovoort) gebruiken nooit authenticatie via Tailscale-identiteitsheaders; ze volgen altijd de normale HTTP-authenticatiemodus van de Gateway.
- Voor operatorsessies in de Control UI die al een apparaatidentiteit van de browser bevatten, slaat een geverifieerde Tailscale-identiteit de retourstap voor koppeling via een bootstrap-token/QR-code over.
- Dit omzeilt de apparaatidentiteit zelf niet: clients zonder apparaatidentiteit worden nog steeds geweigerd en verbindingen met een Node-rol doorlopen nog steeds de normale koppelings- en authenticatiecontroles.

## Opmerkingen

- Voor Tailscale Serve/Funnel moet de `tailscale`-CLI geïnstalleerd en aangemeld zijn.
- `tailscale.mode: "funnel"` weigert te starten tenzij de authenticatiemodus `password` is, om openbare blootstelling te voorkomen.
- `gateway.tailscale.serviceName` geldt alleen voor de Serve-modus en wordt doorgegeven aan `tailscale serve --service=<name>`. De waarde moet de Tailscale-indeling `svc:<dns-label>` gebruiken, bijvoorbeeld `svc:openclaw`. Tailscale vereist dat Service-hosts getagde Nodes zijn en de Service moet mogelijk in de beheerdersconsole worden goedgekeurd voordat Serve deze kan publiceren.
- `gateway.tailscale.resetOnExit` maakt bij het afsluiten de configuratie van `tailscale serve`/`tailscale funnel` ongedaan.
- `gateway.tailscale.preserveFunnel: true` houdt een extern geconfigureerde `tailscale funnel`-route actief tijdens herstarts van de Gateway. Met `mode: "serve"` controleert OpenClaw `tailscale funnel status` voordat Serve opnieuw wordt toegepast en slaat dit over wanneer een Funnel-route de Gateway-poort al afdekt. Het door OpenClaw beheerde Funnel-beleid waarbij alleen een wachtwoord is toegestaan, blijft ongewijzigd.
- `gateway.bind: "tailnet"` gebruikt een rechtstreekse binding aan het Tailnet (geen HTTPS, geen Serve/Funnel), plus het vereiste lokale `127.0.0.1` wanneer een Tailnet-IPv4-adres beschikbaar is; anders valt dit terug op uitsluitend loopback.
- `gateway.bind: "auto"` geeft de voorkeur aan loopback; gebruik `tailnet` om netwerkblootstelling tot het Tailnet te beperken en tegelijk loopback-toegang op dezelfde host te behouden.
- Serve/Funnel maken alleen de **Control UI + WS van de Gateway** beschikbaar. Nodes maken verbinding via hetzelfde WS-eindpunt van de Gateway, zodat Serve ook voor toegang door Nodes werkt.

### Vereisten en beperkingen van Tailscale

- Voor Serve moet HTTPS voor uw tailnet zijn ingeschakeld; de CLI vraagt hierom als dit ontbreekt.
- Serve voegt Tailscale-identiteitsheaders toe; Funnel doet dit niet.
- Funnel vereist Tailscale v1.38.3+, MagicDNS, ingeschakelde HTTPS en een Funnel-Node-kenmerk.
- Funnel ondersteunt via TLS alleen de poorten `443`, `8443` en `10000`.
- Funnel op macOS vereist de opensourcevariant van de Tailscale-app.

## Browserbesturing (externe Gateway + lokale browser)

Om de Gateway op de ene machine uit te voeren en een browser op een andere machine te besturen, voert u een **Node-host** uit op de browsermachine en houdt u beide op hetzelfde tailnet. De Gateway stuurt browseracties door naar de Node; er is geen afzonderlijke besturingsserver of Serve-URL nodig.

Vermijd Funnel voor browserbesturing; behandel Node-koppeling als operatorstoegang.

## Meer informatie

- Overzicht van Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Opdracht `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Overzicht van Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Opdracht `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Detectie](/nl/gateway/discovery)
- [Authenticatie](/nl/gateway/authentication)
