---
read_when:
    - Externe Gateway-configuraties uitvoeren of problemen ermee oplossen
summary: Externe toegang met Gateway WS, SSH-tunnels en tailnets
title: Externe toegang
x-i18n:
    generated_at: "2026-07-03T23:36:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

Deze repo ondersteunt externe Gateway-toegang door één Gateway (de master) actief te houden op een toegewezen host (desktop/server) en clients ermee te verbinden.

- Voor **operators (jij / de macOS-app)**: directe LAN/Tailnet-WebSocket is het eenvoudigst wanneer de gateway bereikbaar is; SSH-tunneling is de universele fallback.
- Voor **nodes (iOS/Android en toekomstige apparaten)**: maak verbinding met de Gateway **WebSocket** (LAN/tailnet of SSH-tunnel waar nodig).

## Het kernidee

- De Gateway WebSocket bindt meestal aan **loopback** op je geconfigureerde poort (standaard 18789).
- Voor extern gebruik maak je die beschikbaar via Tailscale Serve of een vertrouwde LAN/Tailnet-binding, of stuur je de loopback-poort door via SSH.

## Veelvoorkomende VPN- en tailnet-configuraties

Zie de **Gateway-host** als de plek waar de agent draait. Die beheert sessies, auth-profielen, kanalen en state. Je laptop, desktop en nodes verbinden met die host.

### Altijd actieve Gateway in je tailnet

Draai de Gateway op een permanente host (VPS of thuisserver) en bereik die via **Tailscale** of SSH.

- **Beste UX:** houd `gateway.bind: "loopback"` aan en gebruik **Tailscale Serve** voor de Control UI.
- **Vertrouwd LAN/Tailnet:** bind de gateway aan een privé-interface en verbind direct met `gateway.remote.transport: "direct"`.
- **Fallback:** houd loopback plus een SSH-tunnel aan vanaf elke machine die toegang nodig heeft.
- **Voorbeelden:** [exe.dev](/nl/install/exe-dev) (eenvoudige VM) of [Hetzner](/nl/install/hetzner) (productie-VPS).

Ideaal wanneer je laptop vaak slaapt, maar je wilt dat de agent altijd actief blijft.

### Thuisdesktop draait de Gateway

De laptop draait de agent **niet**. Die verbindt extern:

- Gebruik de externe modus van de macOS-app (Instellingen → Algemeen → OpenClaw runs).
- De app verbindt direct wanneer de gateway bereikbaar is op LAN/Tailnet, of opent en beheert een SSH-tunnel wanneer je SSH kiest.

Runbook: [externe toegang voor macOS](/nl/platforms/mac/remote).

### Laptop draait de Gateway

Houd de Gateway lokaal, maar maak die veilig beschikbaar:

- SSH-tunnel naar de laptop vanaf andere machines, of
- Tailscale Serve voor de Control UI en houd de Gateway alleen op loopback.

Gidsen: [Tailscale](/nl/gateway/tailscale) en [Web-overzicht](/nl/web).

## Commandoflow (wat waar draait)

Eén gateway-service beheert state + kanalen. Nodes zijn randapparaten.

Flowvoorbeeld (Telegram → node):

- Telegram-bericht komt binnen bij de **Gateway**.
- Gateway draait de **agent** en beslist of een node-tool moet worden aangeroepen.
- Gateway roept de **node** aan via de Gateway WebSocket (`node.*` RPC).
- Node retourneert het resultaat; Gateway antwoordt terug naar Telegram.

Opmerkingen:

- **Nodes draaien de gateway-service niet.** Er mag maar één gateway per host draaien, tenzij je bewust geïsoleerde profielen draait (zie [Meerdere gateways](/nl/gateway/multiple-gateways)).
- macOS-app "node mode" is alleen een node-client via de Gateway WebSocket.

## SSH-tunnel (CLI + tools)

Maak een lokale tunnel naar de externe Gateway-WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Met de tunnel actief:

- `openclaw health` en `openclaw status --deep` bereiken nu de externe gateway via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` en `openclaw gateway call` kunnen indien nodig ook de doorgestuurde URL targeten via `--url`.

<Note>
Vervang `18789` door je geconfigureerde `gateway.port` (of `--port` of `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Wanneer je `--url` meegeeft, valt de CLI niet terug op configuratie- of omgevingscredentials. Voeg `--token` of `--password` expliciet toe. Ontbrekende expliciete credentials zijn een fout.
</Warning>

## Externe CLI-standaarden

Je kunt een extern target vastleggen zodat CLI-commando's dit standaard gebruiken:

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

Wanneer de gateway alleen loopback gebruikt, houd de URL op `ws://127.0.0.1:18789` en open eerst de SSH-tunnel.
In het SSH-tunneltransport van de macOS-app horen ontdekte gateway-hostnamen thuis in
`gateway.remote.sshTarget`; `gateway.remote.url` blijft de lokale tunnel-URL.
Als die poorten verschillen, stel `gateway.remote.remotePort` in op de gatewaypoort op
de SSH-host.
Hostsleutelverificatie is standaard strikt. Beheerde aliassen kunnen expliciet
hun effectieve OpenSSH-vertrouwensbeleid gebruiken met
`gateway.remote.sshHostKeyPolicy: "openssh"`; controleer overeenkomende gebruikers- en systeeminstellingen voor
SSH voordat je dit inschakelt.

Gebruik voor een gateway die al bereikbaar is op een vertrouwd LAN of Tailnet de directe modus:

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

## Prioriteit van credentials

Gateway-credentialresolutie volgt één gedeeld contract voor call-/probe-/statuspaden en Discord-monitoring van exec-goedkeuringen. Node-host gebruikt hetzelfde basiscontract met één uitzondering voor lokale modus (die negeert bewust `gateway.remote.*`):

- Expliciete referenties (`--token`, `--password` of tool `gatewayToken`) hebben altijd voorrang op aanroeppaden die expliciete auth accepteren.
- Veiligheid bij URL-overschrijvingen:
  - CLI-URL-overschrijvingen (`--url`) hergebruiken nooit impliciete config/env-referenties.
  - Env-URL-overschrijvingen (`OPENCLAW_GATEWAY_URL`) mogen alleen env-referenties gebruiken (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standaarden voor lokale modus:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (remote fallback geldt alleen wanneer lokale auth-tokeninvoer niet is ingesteld)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (remote fallback geldt alleen wanneer lokale auth-wachtwoordinvoer niet is ingesteld)
- Standaarden voor remote modus:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Uitzondering voor lokale modus op Node-host: `gateway.remote.token` / `gateway.remote.password` worden genegeerd.
- Remote probe/status-tokencontroles zijn standaard strikt: ze gebruiken alleen `gateway.remote.token` (geen lokale token-fallback) wanneer remote modus wordt gebruikt.
- Gateway-env-overschrijvingen gebruiken alleen `OPENCLAW_GATEWAY_*`.

## Remote toegang tot Chat-UI

WebChat gebruikt niet langer een aparte HTTP-poort. De SwiftUI-chat-UI maakt direct verbinding met de Gateway-WebSocket.

- Forward `18789` via SSH (zie hierboven) en verbind clients daarna met `ws://127.0.0.1:18789`.
- Voor directe LAN-/Tailnet-modus verbindt u clients met de geconfigureerde private `ws://`- of beveiligde `wss://`-URL.
- Geef op macOS de voorkeur aan de remote modus van de app, die het geselecteerde transport automatisch beheert.

## Remote modus van macOS-app

De macOS-menubalk-app kan dezelfde setup van begin tot eind uitvoeren (remote statuscontroles, WebChat en Voice Wake-forwarding).

Runbook: [Remote toegang op macOS](/nl/platforms/mac/remote).

## Beveiligingsregels (remote/VPN)

Korte versie: **houd de Gateway alleen op loopback** tenzij u zeker weet dat u een bind nodig hebt.

- **Loopback + SSH/Tailscale Serve** is de veiligste standaard (geen publieke blootstelling).
- Plaintext `ws://` wordt geaccepteerd voor loopback, LAN, link-local, `.local`, `.ts.net` en Tailscale CGNAT-hosts. Publieke remote hosts moeten `wss://` gebruiken.
- **Niet-loopback-binds** (`lan`/`tailnet`/`custom`, of `auto` wanneer loopback niet beschikbaar is) moeten gateway-auth gebruiken: token, wachtwoord of een identiteitsbewuste reverse proxy met `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` zijn bronnen voor clientreferenties. Ze configureren **niet** zelf server-auth.
- Lokale aanroeppaden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet is geconfigureerd via SecretRef en niet kan worden opgelost, faalt resolutie gesloten (geen maskering door remote fallback).
- `gateway.remote.tlsFingerprint` pint het remote TLS-certificaat bij gebruik van `wss://`, inclusief directe macOS-modus. Zonder een geconfigureerde of eerder opgeslagen pin pint macOS een certificaat bij eerste gebruik alleen nadat normale systeemvertrouwen slaagt; self-signed gateways of gateways met private CA die macOS nog niet vertrouwt, hebben een expliciete fingerprint of Remote over SSH nodig.
- **Tailscale Serve** kan Control UI-/WebSocket-verkeer authenticeren via identiteitsheaders wanneer `gateway.auth.allowTailscale: true`; HTTP API-endpoints gebruiken die Tailscale-headerauth niet en volgen in plaats daarvan de normale HTTP-authmodus van de gateway. Deze tokenloze flow gaat ervan uit dat de gateway-host vertrouwd is. Stel dit in op `false` als u overal shared-secret-auth wilt.
- **Trusted-proxy**-auth verwacht standaard niet-loopback identiteitsbewuste proxy-setups.
  Reverse proxies op loopback op dezelfde host vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`.
- Behandel browserbesturing als operatortoegang: alleen tailnet + doelbewuste node-koppeling.

Diepgaand: [Beveiliging](/nl/gateway/security).

### macOS: permanente SSH-tunnel via LaunchAgent

Voor macOS-clients die verbinding maken met een remote gateway gebruikt de eenvoudigste permanente setup een SSH-`LocalForward`-configuratie-item plus een LaunchAgent om de tunnel actief te houden na herstarts en crashes.

#### Stap 1: SSH-configuratie toevoegen

Bewerk `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Vervang `<REMOTE_IP>` en `<REMOTE_USER>` door uw waarden.

#### Stap 2: SSH-sleutel kopiëren (eenmalig)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Stap 3: gateway-token configureren

Sla het token op in config zodat het behouden blijft na herstarts:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Stap 4: LaunchAgent maken

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

#### Stap 5: LaunchAgent laden

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

De tunnel start automatisch bij inloggen, herstart na een crash en houdt de geforwarde poort actief.

<Note>
Als u nog een overgebleven `com.openclaw.ssh-tunnel` LaunchAgent uit een oudere setup hebt, unload en verwijder deze.
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

| Config-entry                         | Wat het doet                                                |
| ------------------------------------ | ----------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Forwardt lokale poort 18789 naar remote poort 18789         |
| `ssh -N`                             | SSH zonder remote opdrachten uit te voeren (alleen port-forwarding) |
| `KeepAlive`                          | Herstart de tunnel automatisch als deze crasht              |
| `RunAtLoad`                          | Start de tunnel wanneer de LaunchAgent bij inloggen laadt   |

## Gerelateerd

- [Tailscale](/nl/gateway/tailscale)
- [Authenticatie](/nl/gateway/authentication)
- [Remote gateway-setup](/nl/gateway/remote-gateway-readme)
