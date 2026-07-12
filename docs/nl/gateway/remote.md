---
read_when:
    - Externe Gateway-configuraties uitvoeren of problemen ermee oplossen
summary: Externe toegang via Gateway WS, SSH-tunnels en tailnets
title: Externe toegang
x-i18n:
    generated_at: "2026-07-12T08:52:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw voert één Gateway (de master) uit op een host en verbindt elke client ermee. De Gateway beheert sessies, authenticatieprofielen, kanalen en status; al het overige is een client.

- **Operators** (jij of de macOS-app): een directe LAN-/Tailnet-WebSocket is het eenvoudigst wanneer de Gateway bereikbaar is; een SSH-tunnel is de universele terugvaloptie.
- **Nodes** (iOS/Android en andere apparaten): maken verbinding met de **WebSocket** van de Gateway (via LAN/Tailnet of een SSH-tunnel).

## Het kernidee

De WebSocket van de Gateway luistert standaard alleen op **loopback**, op poort `18789` (`gateway.port`). Voor extern gebruik stel je deze beschikbaar via Tailscale Serve / een vertrouwde LAN-/Tailnet-binding, of stuur je de loopback-poort door via SSH.

## Topologieopties

| Opstelling                              | Waar de Gateway wordt uitgevoerd                                                                         | Meest geschikt voor                                                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Altijd actieve Gateway in je tailnet    | Permanente host (VPS of thuisserver), bereikbaar via Tailscale of SSH                                     | Laptops die vaak in de slaapstand staan, maar waarop de agent altijd actief moet zijn. Zie [exe.dev](/nl/install/exe-dev) (eenvoudige VM) of [Hetzner](/nl/install/hetzner) (productie-VPS). |
| Desktop thuis                           | Desktop; laptop maakt extern verbinding via de externe modus van de macOS-app (Settings → Connection → OpenClaw runs) | De agent uitvoeren op hardware die ingeschakeld blijft. Draaiboek: [externe toegang via macOS](/nl/platforms/mac/remote).                                        |
| Laptop                                  | Laptop, veilig beschikbaar via een SSH-tunnel of Tailscale Serve (behoud `gateway.bind: "loopback"`)      | Opstellingen met één machine. Zie [Tailscale](/nl/gateway/tailscale) en [Web](/nl/web).                                                                              |

Voor de altijd actieve opstelling en de laptopopstelling verdient het de voorkeur om `gateway.bind: "loopback"` te behouden en **Tailscale Serve** te gebruiken voor de bedieningsinterface, of een vertrouwde LAN-/Tailnet-binding met `gateway.remote.transport: "direct"`. Een SSH-tunnel is de terugvaloptie die vanaf elke machine werkt.

## Opdrachtstroom (wat waar wordt uitgevoerd)

Eén Gateway beheert status en kanalen; Nodes zijn randapparaten. Voorbeeld (Telegram-bericht doorgestuurd naar een Node-hulpmiddel):

1. Een Telegram-bericht komt aan bij de **Gateway**.
2. De Gateway voert de **agent** uit, die bepaalt of een Node-hulpmiddel moet worden aangeroepen.
3. De Gateway roept de **Node** aan via de WebSocket van de Gateway (`node.invoke`-RPC).
4. De Node retourneert het resultaat; de Gateway antwoordt via Telegram.

Nodes voeren de Gateway-service niet uit. Per host mag slechts één Gateway worden uitgevoerd, tenzij je bewust geïsoleerde profielen gebruikt (zie [Meerdere Gateways](/nl/gateway/multiple-gateways)). De 'Node-modus' van de macOS-app is slechts een Node-client die via de WebSocket van de Gateway werkt.

## SSH-tunnel (CLI + hulpmiddelen)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Wanneer de tunnel actief is, bereiken `openclaw health` en `openclaw status --deep` de externe Gateway via `ws://127.0.0.1:18789`. `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` en `openclaw gateway call` kunnen met `--url` ook op een doorgestuurde URL worden gericht.

<Note>
Vervang `18789` door je geconfigureerde `gateway.port` (of `--port` / `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
`--url` valt nooit terug op referenties uit de configuratie of omgeving. Geef `--token` of `--password` expliciet door; zonder deze opties verzendt de client geen referenties en mislukt de verbinding als de doel-Gateway authenticatie vereist.
</Warning>

## Externe standaardwaarden voor de CLI

Sla een extern doel permanent op, zodat CLI-opdrachten dit standaard gebruiken:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Wanneer de Gateway alleen via loopback bereikbaar is, laat je de URL op `ws://127.0.0.1:18789` staan en open je eerst de SSH-tunnel. Bij het SSH-tunneltransport van de macOS-app wordt de gedetecteerde hostnaam van de Gateway opgeslagen in `gateway.remote.sshTarget` (`user@host` of `user@host:port`); `gateway.remote.url` blijft de lokale tunnel-URL. Als de externe poort afwijkt van de lokale poort, stel je `gateway.remote.remotePort` in.

Verificatie van de hostsleutel is standaard strikt (`gateway.remote.sshHostKeyPolicy: "strict"`). Stel deze in op `"openssh"` om de verificatie in plaats daarvan aan je effectieve OpenSSH-configuratie over te laten; controleer je SSH-instellingen op gebruikers- en systeemniveau voordat je dit inschakelt.

Gebruik de directe modus voor een Gateway die al bereikbaar is via een vertrouwd LAN of Tailnet:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Voorrangsvolgorde van referenties

De Gateway gebruikt één gedeeld contract voor het bepalen van referenties in aanroep-, controle- en statuspaden en bij de bewaking van uitvoeringsgoedkeuringen in Discord. De Node-host gebruikt hetzelfde contract, met één uitzondering voor de lokale modus (daarin wordt `gateway.remote.*` genegeerd).

- Expliciete referenties (`--token`, `--password` of de `gatewayToken` van een hulpmiddel) hebben altijd voorrang in aanroeppaden die expliciete authenticatie accepteren.
- Veiligheid bij URL-overschrijvingen:
  - CLI-optie `--url` gebruikt nooit impliciete referenties uit de configuratie of omgeving.
  - Omgevingsvariabele `OPENCLAW_GATEWAY_URL` mag alleen referenties uit de omgeving gebruiken (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standaardwaarden voor de lokale modus:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (alleen externe terugval wanneer het lokale token niet is ingesteld)
  - wachtwoord: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (alleen externe terugval wanneer het lokale wachtwoord niet is ingesteld)
- Standaardwaarden voor de externe modus:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - wachtwoord: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Uitzondering voor de lokale modus van de Node-host: `gateway.remote.token` / `gateway.remote.password` worden genegeerd.
- Tokencontroles voor externe controles/status zijn standaard strikt: wanneer de externe modus als doel wordt gebruikt, gebruiken ze alleen `gateway.remote.token` (zonder terugval op het lokale token).
- Omgevingsoverschrijvingen voor de Gateway gebruiken alleen `OPENCLAW_GATEWAY_*`.

## Externe toegang tot de chatinterface

WebChat heeft geen afzonderlijke HTTP-poort; de SwiftUI-chatinterface maakt rechtstreeks verbinding met de WebSocket van de Gateway.

- Stuur `18789` door via SSH (zie hierboven) en verbind clients vervolgens met `ws://127.0.0.1:18789`.
- Verbind clients voor de directe LAN-/Tailnet-modus met de geconfigureerde privé-URL met `ws://` of beveiligde URL met `wss://`.
- Op macOS beheert de externe modus van de app het geselecteerde transport automatisch.

## Externe modus van de macOS-app

De macOS-menubalkapp beheert dezelfde opstelling van begin tot eind: externe statuscontroles, WebChat en het doorsturen van Voice Wake. Draaiboek: [externe toegang via macOS](/nl/platforms/mac/remote).

## Beveiligingsregels (extern/VPN)

Houd de Gateway **uitsluitend op loopback** tenzij je zeker weet dat je een binding nodig hebt.

- **Loopback + SSH/Tailscale Serve** is de veiligste standaardinstelling (geen openbare blootstelling).
- `ws://` zonder versleuteling wordt geaccepteerd voor loopback-, privé-/LAN- (RFC 1918), link-local-, CGNAT-, `.local`- en `.ts.net`-hosts. Openbare externe hosts moeten `wss://` gebruiken.
- **Niet-loopback-bindingen** (`lan`/`tailnet`/`custom`, of `auto` wanneer loopback niet beschikbaar is) moeten Gateway-authenticatie gebruiken: een token, wachtwoord of identiteitsbewuste reverse proxy met `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` zijn bronnen voor clientreferenties; ze configureren op zichzelf geen serverauthenticatie.
- Lokale aanroeppaden kunnen alleen op `gateway.remote.*` terugvallen wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden omgezet, wordt de toegang veilig geweigerd (zonder dat een externe terugval dit maskeert).
- `gateway.remote.tlsFingerprint` zet het externe TLS-certificaat vast voor `wss://`, ook in de directe modus van macOS. Zonder opgeslagen vingerafdruk zet macOS deze pas bij het eerste gebruik vast nadat de normale systeemvertrouwenscontrole is geslaagd; Gateways met een zelfondertekend certificaat of een privé-CA hebben een expliciete vingerafdruk of Remote over SSH nodig.
- **Tailscale Serve** kan verkeer van de bedieningsinterface/WebSocket via identiteitsheaders authenticeren wanneer `gateway.auth.allowTailscale: true`. HTTP-API-eindpunten gebruiken deze headerauthenticatie niet en volgen in plaats daarvan de normale HTTP-authenticatiemodus van de Gateway. Deze tokenloze stroom veronderstelt dat de Gateway-host wordt vertrouwd; stel dit in op `false` om overal authenticatie met een gedeeld geheim te gebruiken.
- Authenticatie via een **vertrouwde proxy** verwacht standaard een niet-loopback, identiteitsbewuste proxy. Reverse proxy's op dezelfde host via loopback vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`.
- Behandel bediening via de browser als operator-toegang: alleen via het tailnet en met bewuste koppeling van Nodes.

Verdieping: [Beveiliging](/nl/gateway/security).

### macOS: permanente SSH-tunnel via LaunchAgent

Voor macOS-clients gebruikt de eenvoudigste permanente opstelling een SSH-configuratie-item `LocalForward` plus een LaunchAgent die de tunnel actief houdt na opnieuw opstarten en vastlopen.

#### Stap 1: SSH-configuratie toevoegen

Bewerk `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Vervang `<REMOTE_IP>` en `<REMOTE_USER>` door je eigen waarden.

#### Stap 2: SSH-sleutel kopiëren (eenmalig)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Stap 3: het Gateway-token configureren

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Gebruik in plaats daarvan `gateway.remote.password` als de externe Gateway wachtwoordauthenticatie gebruikt. `OPENCLAW_GATEWAY_TOKEN` blijft geldig als overschrijving op shellniveau, maar voor een permanente externe clientopstelling gebruik je `gateway.remote.token` / `gateway.remote.password`.

#### Stap 4: de LaunchAgent maken

Sla het bestand op als `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Stap 5: de LaunchAgent laden

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

De tunnel wordt automatisch gestart bij het aanmelden, opnieuw gestart na vastlopen en houdt de doorgestuurde poort actief.

<Note>
Als je nog een `com.openclaw.ssh-tunnel`-LaunchAgent van een oudere opstelling hebt, verwijder deze dan uit het geheugen en verwijder het bestand.
</Note>

#### Problemen oplossen

```bash
# Controleren of de tunnel actief is
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# De tunnel opnieuw starten
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# De tunnel stoppen
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Configuratie-item                     | Functie                                                               |
| ------------------------------------- | --------------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Stuurt lokale poort 18789 door naar externe poort 18789               |
| `ssh -N`                              | SSH zonder externe opdrachten uit te voeren (alleen poortdoorschakeling) |
| `KeepAlive`                           | Start de tunnel automatisch opnieuw als deze vastloopt                |
| `RunAtLoad`                           | Start de tunnel wanneer de LaunchAgent bij het aanmelden wordt geladen |

## Gerelateerd

- [Tailscale](/nl/gateway/tailscale)
- [Authenticatie](/nl/gateway/authentication)
- [Externe Gateway instellen](/nl/gateway/remote-gateway-readme)
