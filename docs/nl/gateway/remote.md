---
read_when:
    - Externe Gateway-configuraties uitvoeren of problemen oplossen
summary: Externe toegang met Gateway WS, SSH-tunnels en tailnets
title: Toegang op afstand
x-i18n:
    generated_at: "2026-06-27T17:36:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

Deze repo ondersteunt externe Gateway-toegang door één Gateway (de master) op een toegewezen host (desktop/server) actief te houden en clients ermee te verbinden.

- Voor **operators (jij / de macOS-app)**: directe LAN/Tailnet-WebSocket is het eenvoudigst wanneer de Gateway bereikbaar is; SSH-tunneling is de universele fallback.
- Voor **nodes (iOS/Android en toekomstige apparaten)**: verbind met de Gateway-**WebSocket** (LAN/tailnet of SSH-tunnel waar nodig).

## Het kernidee

- De Gateway-WebSocket bindt meestal aan **loopback** op je geconfigureerde poort (standaard 18789).
- Voor extern gebruik stel je deze beschikbaar via Tailscale Serve of een vertrouwde LAN/Tailnet-bind, of forward je de loopback-poort via SSH.

## Veelvoorkomende VPN- en tailnet-configuraties

Zie de **Gateway-host** als de plek waar de agent draait. Die beheert sessies, auth-profielen, kanalen en state. Je laptop, desktop en nodes verbinden met die host.

### Altijd actieve Gateway in je tailnet

Draai de Gateway op een persistente host (VPS of homeserver) en bereik deze via **Tailscale** of SSH.

- **Beste UX:** houd `gateway.bind: "loopback"` aan en gebruik **Tailscale Serve** voor de Control UI.
- **Vertrouwde LAN/Tailnet:** bind de Gateway aan een privé-interface en verbind direct met `gateway.remote.transport: "direct"`.
- **Fallback:** houd loopback aan plus een SSH-tunnel vanaf elke machine die toegang nodig heeft.
- **Voorbeelden:** [exe.dev](/nl/install/exe-dev) (eenvoudige VM) of [Hetzner](/nl/install/hetzner) (productie-VPS).

Ideaal wanneer je laptop vaak slaapt, maar je de agent altijd actief wilt houden.

### Thuisdesktop draait de Gateway

De laptop draait de agent **niet**. Die verbindt op afstand:

- Gebruik de externe modus van de macOS-app (Instellingen → Algemeen → OpenClaw draait).
- De app verbindt direct wanneer de Gateway bereikbaar is op LAN/Tailnet, of opent en beheert een SSH-tunnel wanneer je SSH kiest.

Runbook: [externe toegang op macOS](/nl/platforms/mac/remote).

### Laptop draait de Gateway

Houd de Gateway lokaal, maar stel deze veilig beschikbaar:

- SSH-tunnel naar de laptop vanaf andere machines, of
- Tailscale Serve voor de Control UI en houd de Gateway alleen op loopback.

Handleidingen: [Tailscale](/nl/gateway/tailscale) en [Weboverzicht](/nl/web).

## Commandostroom (wat draait waar)

Eén Gateway-service beheert state + kanalen. Nodes zijn randapparaten.

Voorbeeldstroom (Telegram → node):

- Telegram-bericht komt binnen bij de **Gateway**.
- Gateway draait de **agent** en bepaalt of een node-tool moet worden aangeroepen.
- Gateway roept de **node** aan via de Gateway-WebSocket (`node.*` RPC).
- Node retourneert het resultaat; Gateway antwoordt terug naar Telegram.

Opmerkingen:

- **Nodes draaien de Gateway-service niet.** Er mag maar één Gateway per host draaien, tenzij je bewust geïsoleerde profielen draait (zie [Meerdere gateways](/nl/gateway/multiple-gateways)).
- macOS-app "node mode" is gewoon een node-client via de Gateway-WebSocket.

## SSH-tunnel (CLI + tools)

Maak een lokale tunnel naar de externe Gateway-WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Met de tunnel actief:

- `openclaw health` en `openclaw status --deep` bereiken nu de externe Gateway via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` en `openclaw gateway call` kunnen zo nodig ook de geforwarde URL gebruiken via `--url`.

<Note>
Vervang `18789` door je geconfigureerde `gateway.port` (of `--port` of `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Wanneer je `--url` doorgeeft, valt de CLI niet terug op config- of omgevingscredentials. Geef `--token` of `--password` expliciet mee. Ontbrekende expliciete credentials zijn een fout.
</Warning>

## Externe standaardwaarden voor CLI

Je kunt een extern doel persistent maken, zodat CLI-commando's dit standaard gebruiken:

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

Wanneer de Gateway alleen loopback gebruikt, houd je de URL op `ws://127.0.0.1:18789` en open je eerst de SSH-tunnel.
In de SSH-tunneltransportmodus van de macOS-app horen ontdekte Gateway-hostnamen thuis in
`gateway.remote.sshTarget`; `gateway.remote.url` blijft de lokale tunnel-URL.
Als die poorten verschillen, stel je `gateway.remote.remotePort` in op de Gateway-poort op
de SSH-host.

Voor een Gateway die al bereikbaar is op een vertrouwd LAN of Tailnet, gebruik je directe modus:

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

## Credential-prioriteit

Gateway-credentialresolutie volgt één gedeeld contract voor call-/probe-/statuspaden en Discord exec-approval-monitoring. Node-host gebruikt hetzelfde basiscontract met één uitzondering voor lokale modus (het negeert bewust `gateway.remote.*`):

- Expliciete credentials (`--token`, `--password` of tool `gatewayToken`) winnen altijd op call-paden die expliciete auth accepteren.
- Veiligheid bij URL-overschrijving:
  - CLI-URL-overschrijvingen (`--url`) hergebruiken nooit impliciete config-/env-credentials.
  - Env-URL-overschrijvingen (`OPENCLAW_GATEWAY_URL`) mogen alleen env-credentials gebruiken (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standaardwaarden voor lokale modus:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (remote fallback geldt alleen wanneer lokale auth-tokeninvoer niet is ingesteld)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (remote fallback geldt alleen wanneer lokale auth-passwordinvoer niet is ingesteld)
- Standaardwaarden voor externe modus:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Uitzondering voor node-host in lokale modus: `gateway.remote.token` / `gateway.remote.password` worden genegeerd.
- Tokencontroles voor remote probe/status zijn standaard strikt: ze gebruiken alleen `gateway.remote.token` (geen lokale tokenfallback) wanneer ze op externe modus gericht zijn.
- Gateway-env-overschrijvingen gebruiken alleen `OPENCLAW_GATEWAY_*`.

## Externe toegang tot chat-UI

WebChat gebruikt geen aparte HTTP-poort meer. De SwiftUI-chat-UI verbindt direct met de Gateway-WebSocket.

- Forward `18789` via SSH (zie hierboven) en verbind clients vervolgens met `ws://127.0.0.1:18789`.
- Voor directe LAN/Tailnet-modus verbind je clients met de geconfigureerde privé-`ws://`- of beveiligde `wss://`-URL.
- Op macOS heeft de externe modus van de app de voorkeur; die beheert het geselecteerde transport automatisch.

## Externe modus van de macOS-app

De macOS-menubalkapp kan dezelfde configuratie end-to-end aansturen (externe statuscontroles, WebChat en Voice Wake-forwarding).

Runbook: [externe toegang op macOS](/nl/platforms/mac/remote).

## Beveiligingsregels (remote/VPN)

Korte versie: **houd de Gateway alleen op loopback**, tenzij je zeker weet dat je een bind nodig hebt.

- **Loopback + SSH/Tailscale Serve** is de veiligste standaard (geen publieke blootstelling).
- Plaintext `ws://` wordt geaccepteerd voor loopback, LAN, link-local, `.local`, `.ts.net` en Tailscale CGNAT-hosts. Publieke externe hosts moeten `wss://` gebruiken.
- **Niet-loopback-binds** (`lan`/`tailnet`/`custom`, of `auto` wanneer loopback niet beschikbaar is) moeten Gateway-auth gebruiken: token, password of een identity-aware reverse proxy met `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` zijn clientcredentialbronnen. Ze configureren serverauth **niet** zelfstandig.
- Lokale call-paden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden resolved, faalt resolutie gesloten (geen remote fallback die dit maskeert).
- `gateway.remote.tlsFingerprint` pint het externe TLS-certificaat bij gebruik van `wss://`, inclusief directe macOS-modus. Zonder een geconfigureerde of eerder opgeslagen pin pint macOS alleen een certificaat bij eerste gebruik nadat normale systeemvertrouwen is geslaagd; self-signed gateways of gateways met privé-CA die macOS nog niet vertrouwt, hebben een expliciete fingerprint of Remote over SSH nodig.
- **Tailscale Serve** kan Control UI-/WebSocket-verkeer authenticeren via identity
  headers wanneer `gateway.auth.allowTailscale: true`; HTTP API-eindpunten gebruiken die
  Tailscale-headerauth niet en volgen in plaats daarvan de normale HTTP-authmodus
  van de Gateway. Deze tokenloze stroom gaat ervan uit dat de Gateway-host vertrouwd is. Zet dit op
  `false` als je overal shared-secret-auth wilt.
- **Trusted-proxy**-auth verwacht standaard niet-loopback identity-aware proxyconfiguraties.
  Same-host loopback reverse proxies vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`.
- Behandel browserbesturing als operatortoegang: alleen tailnet + bewuste node-koppeling.

Diepgaande uitleg: [Beveiliging](/nl/gateway/security).

### macOS: persistente SSH-tunnel via LaunchAgent

Voor macOS-clients die met een externe Gateway verbinden, gebruikt de eenvoudigste persistente configuratie een SSH-`LocalForward`-configvermelding plus een LaunchAgent om de tunnel actief te houden na reboots en crashes.

#### Stap 1: SSH-config toevoegen

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

#### Stap 3: de Gateway-token configureren

Sla de token op in config, zodat deze behouden blijft na herstarts:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Stap 4: de LaunchAgent maken

Sla dit op als `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

De tunnel start automatisch bij inloggen, herstart na een crash en houdt de geforwarde poort actief.

<Note>
Als je nog een overgebleven `com.openclaw.ssh-tunnel` LaunchAgent uit een oudere configuratie hebt, unload en verwijder die.
</Note>

#### Probleemoplossing

Controleer of de tunnel draait:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Herstart de tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Stop de tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Configvermelding                    | Wat deze doet                                               |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Forwardt lokale poort 18789 naar externe poort 18789         |
| `ssh -N`                             | SSH zonder externe commando's uit te voeren (alleen port-forwarding) |
| `KeepAlive`                          | Herstart de tunnel automatisch als deze crasht               |
| `RunAtLoad`                          | Start de tunnel wanneer de LaunchAgent bij inloggen laadt    |

## Gerelateerd

- [Tailscale](/nl/gateway/tailscale)
- [Authenticatie](/nl/gateway/authentication)
- [Externe Gateway-configuratie](/nl/gateway/remote-gateway-readme)
