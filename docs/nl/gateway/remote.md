---
read_when:
    - Externe Gateway-configuraties uitvoeren of problemen oplossen
summary: Toegang op afstand via SSH-tunnels (Gateway WS) en tailnets
title: Toegang op afstand
x-i18n:
    generated_at: "2026-04-29T22:47:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

Deze repo ondersteunt “remote over SSH” door een enkele Gateway (de master) draaiend te houden op een toegewezen host (desktop/server) en clients ermee te verbinden.

- Voor **operators (jij / de macOS-app)**: SSH-tunneling is de universele fallback.
- Voor **nodes (iOS/Android en toekomstige apparaten)**: maak verbinding met de Gateway **WebSocket** (LAN/tailnet of SSH-tunnel waar nodig).

## Het kernidee

- De Gateway WebSocket bindt aan **loopback** op je geconfigureerde poort (standaard 18789).
- Voor gebruik op afstand forward je die loopback-poort over SSH (of gebruik je een tailnet/VPN en tunnel je minder).

## Veelvoorkomende VPN- en tailnet-set-ups

Zie de **Gateway-host** als de plek waar de agent leeft. Deze beheert sessies, auth-profielen, kanalen en status. Je laptop, desktop en nodes verbinden met die host.

### Altijd actieve Gateway in je tailnet

Draai de Gateway op een persistente host (VPS of thuisserver) en bereik deze via **Tailscale** of SSH.

- **Beste UX:** houd `gateway.bind: "loopback"` aan en gebruik **Tailscale Serve** voor de Control UI.
- **Fallback:** houd loopback aan plus een SSH-tunnel vanaf elke machine die toegang nodig heeft.
- **Voorbeelden:** [exe.dev](/nl/install/exe-dev) (eenvoudige VM) of [Hetzner](/nl/install/hetzner) (productie-VPS).

Ideaal wanneer je laptop vaak slaapt, maar je de agent altijd actief wilt houden.

### Thuisdesktop draait de Gateway

De laptop draait de agent **niet**. Hij verbindt op afstand:

- Gebruik de modus **Remote over SSH** van de macOS-app (Instellingen → Algemeen → OpenClaw draait).
- De app opent en beheert de tunnel, zodat WebChat en health checks gewoon werken.

Runbook: [macOS-toegang op afstand](/nl/platforms/mac/remote).

### Laptop draait de Gateway

Houd de Gateway lokaal, maar stel deze veilig beschikbaar:

- SSH-tunnel naar de laptop vanaf andere machines, of
- Tailscale Serve voor de Control UI en houd de Gateway alleen op loopback.

Handleidingen: [Tailscale](/nl/gateway/tailscale) en [Weboverzicht](/nl/web).

## Commandostroom (wat draait waar)

Één gateway-service beheert status + kanalen. Nodes zijn randapparaten.

Voorbeeldstroom (Telegram → node):

- Telegram-bericht komt aan bij de **Gateway**.
- Gateway draait de **agent** en beslist of een node-tool moet worden aangeroepen.
- Gateway roept de **node** aan via de Gateway WebSocket (`node.*` RPC).
- Node geeft het resultaat terug; Gateway antwoordt weer naar Telegram.

Opmerkingen:

- **Nodes draaien de gateway-service niet.** Er mag slechts één gateway per host draaien, tenzij je bewust geïsoleerde profielen draait (zie [Meerdere gateways](/nl/gateway/multiple-gateways)).
- “node-modus” in de macOS-app is gewoon een node-client via de Gateway WebSocket.

## SSH-tunnel (CLI + tools)

Maak een lokale tunnel naar de externe Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Met de tunnel actief:

- `openclaw health` en `openclaw status --deep` bereiken nu de externe gateway via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` en `openclaw gateway call` kunnen de geforwarde URL ook targeten via `--url` wanneer nodig.

<Note>
Vervang `18789` door je geconfigureerde `gateway.port` (of `--port` of `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Wanneer je `--url` doorgeeft, valt de CLI niet terug op config- of omgevingscredentials. Voeg expliciet `--token` of `--password` toe. Ontbrekende expliciete credentials zijn een fout.
</Warning>

## Externe standaardinstellingen voor de CLI

Je kunt een extern doel persistent maken zodat CLI-commando’s dit standaard gebruiken:

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

Wanneer de gateway alleen loopback gebruikt, houd je de URL op `ws://127.0.0.1:18789` en open je eerst de SSH-tunnel.
In het SSH-tunneltransport van de macOS-app horen gevonden gateway-hostnamen in
`gateway.remote.sshTarget`; `gateway.remote.url` blijft de lokale tunnel-URL.

## Credential-prioriteit

Gateway-credentialresolutie volgt één gedeeld contract over call/probe/status-paden en Discord exec-approval-monitoring. Node-host gebruikt hetzelfde basiscontract met één uitzondering voor lokale modus (het negeert bewust `gateway.remote.*`):

- Expliciete credentials (`--token`, `--password` of tool `gatewayToken`) winnen altijd op call-paden die expliciete auth accepteren.
- Veiligheid bij URL-overschrijvingen:
  - CLI-URL-overschrijvingen (`--url`) hergebruiken nooit impliciete config/env-credentials.
  - Env-URL-overschrijvingen (`OPENCLAW_GATEWAY_URL`) mogen alleen env-credentials gebruiken (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standaarden voor lokale modus:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (remote fallback geldt alleen wanneer lokale auth-tokeninvoer niet is ingesteld)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (remote fallback geldt alleen wanneer lokale auth-wachtwoordinvoer niet is ingesteld)
- Standaarden voor remote-modus:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Uitzondering voor lokale modus van Node-host: `gateway.remote.token` / `gateway.remote.password` worden genegeerd.
- Tokenchecks voor remote probe/status zijn standaard strikt: ze gebruiken alleen `gateway.remote.token` (geen fallback naar lokaal token) wanneer remote-modus wordt getarget.
- Gateway-env-overschrijvingen gebruiken alleen `OPENCLAW_GATEWAY_*`.

## Chat-UI over SSH

WebChat gebruikt geen aparte HTTP-poort meer. De SwiftUI-chat-UI verbindt rechtstreeks met de Gateway WebSocket.

- Forward `18789` over SSH (zie hierboven) en verbind clients vervolgens met `ws://127.0.0.1:18789`.
- Op macOS heeft de modus “Remote over SSH” van de app de voorkeur; die beheert de tunnel automatisch.

## macOS-app Remote over SSH

De macOS-menubalkapp kan dezelfde set-up end-to-end aansturen (statuschecks op afstand, WebChat en Voice Wake-forwarding).

Runbook: [macOS-toegang op afstand](/nl/platforms/mac/remote).

## Beveiligingsregels (remote/VPN)

Korte versie: **houd de Gateway alleen op loopback** tenzij je zeker weet dat je een bind nodig hebt.

- **Loopback + SSH/Tailscale Serve** is de veiligste standaard (geen publieke blootstelling).
- Plaintext `ws://` is standaard alleen loopback. Voor vertrouwde privénetwerken
  stel je `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in op het clientproces als
  noodoptie. Er is geen `openclaw.json`-equivalent; dit moet de procesomgeving
  zijn voor de client die de WebSocket-verbinding maakt.
- **Niet-loopback binds** (`lan`/`tailnet`/`custom`, of `auto` wanneer loopback niet beschikbaar is) moeten gateway-auth gebruiken: token, wachtwoord of een identity-aware reverse proxy met `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` zijn bronnen voor clientcredentials. Ze configureren op zichzelf **geen** server-auth.
- Lokale call-paden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt de resolutie gesloten (geen remote fallback die dit maskeert).
- `gateway.remote.tlsFingerprint` pint het externe TLS-certificaat bij gebruik van `wss://`.
- **Tailscale Serve** kan Control UI/WebSocket-verkeer authenticeren via identity
  headers wanneer `gateway.auth.allowTailscale: true`; HTTP API-eindpunten gebruiken
  die Tailscale-headerauth niet en volgen in plaats daarvan de normale HTTP
  auth-modus van de gateway. Deze tokenloze stroom gaat ervan uit dat de gateway-host vertrouwd is. Zet dit op
  `false` als je overal shared-secret-auth wilt.
- **Trusted-proxy**-auth verwacht standaard niet-loopback identity-aware proxy-set-ups.
  Same-host loopback reverse proxies vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`.
- Behandel browserbediening als operatortoegang: alleen tailnet + bewuste node-koppeling.

Verdieping: [Beveiliging](/nl/gateway/security).

### macOS: persistente SSH-tunnel via LaunchAgent

Voor macOS-clients die met een externe gateway verbinden, gebruikt de eenvoudigste persistente set-up een SSH-`LocalForward`-configuratievermelding plus een LaunchAgent om de tunnel actief te houden bij herstarts en crashes.

#### Stap 1: SSH-config toevoegen

Bewerk `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Vervang `<REMOTE_IP>` en `<REMOTE_USER>` door je waarden.

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
Als je nog een oude `com.openclaw.ssh-tunnel` LaunchAgent uit een oudere set-up hebt, unload en verwijder die dan.
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

| Config-vermelding                   | Wat deze doet                                               |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Forwardt lokale poort 18789 naar externe poort 18789         |
| `ssh -N`                             | SSH zonder externe commando’s uit te voeren (alleen port-forwarding) |
| `KeepAlive`                          | Herstart de tunnel automatisch als deze crasht               |
| `RunAtLoad`                          | Start de tunnel wanneer de LaunchAgent bij inloggen laadt    |

## Gerelateerd

- [Tailscale](/nl/gateway/tailscale)
- [Authenticatie](/nl/gateway/authentication)
- [Remote gateway-set-up](/nl/gateway/remote-gateway-readme)
