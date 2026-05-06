---
read_when:
    - Externe Gateway-installaties uitvoeren of problemen oplossen
summary: Toegang op afstand via SSH-tunnels (Gateway WS) en tailnets
title: Toegang op afstand
x-i18n:
    generated_at: "2026-05-06T09:15:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

Deze repo ondersteunt "remote over SSH" door één Gateway (de master) actief te houden op een dedicated host (desktop/server) en clients ermee te verbinden.

- Voor **operators (jij / de macOS-app)**: SSH-tunneling is de universele fallback.
- Voor **nodes (iOS/Android en toekomstige apparaten)**: verbind met de Gateway **WebSocket** (LAN/tailnet of SSH-tunnel indien nodig).

## Het kernidee

- De Gateway WebSocket bindt aan **loopback** op je geconfigureerde poort (standaard 18789).
- Voor gebruik op afstand forward je die loopback-poort via SSH (of gebruik je een tailnet/VPN en tunnel je minder).

## Veelvoorkomende VPN- en tailnet-setups

Zie de **Gateway-host** als de plek waar de agent leeft. Die beheert sessies, auth-profielen, kanalen en state. Je laptop, desktop en nodes verbinden met die host.

### Always-on Gateway in je tailnet

Draai de Gateway op een persistente host (VPS of thuisserver) en bereik die via **Tailscale** of SSH.

- **Beste UX:** houd `gateway.bind: "loopback"` aan en gebruik **Tailscale Serve** voor de Control UI.
- **Fallback:** houd loopback aan plus een SSH-tunnel vanaf elke machine die toegang nodig heeft.
- **Voorbeelden:** [exe.dev](/nl/install/exe-dev) (eenvoudige VM) of [Hetzner](/nl/install/hetzner) (productie-VPS).

Ideaal wanneer je laptop vaak slaapt, maar je wilt dat de agent altijd actief blijft.

### Thuisdesktop draait de Gateway

De laptop draait de agent **niet**. Die verbindt op afstand:

- Gebruik de **Remote over SSH**-modus van de macOS-app (Instellingen → Algemeen → OpenClaw draait).
- De app opent en beheert de tunnel, zodat WebChat en healthchecks gewoon werken.

Runbook: [macOS-toegang op afstand](/nl/platforms/mac/remote).

### Laptop draait de Gateway

Houd de Gateway lokaal, maar stel die veilig beschikbaar:

- SSH-tunnel naar de laptop vanaf andere machines, of
- Tailscale Serve de Control UI en houd de Gateway alleen op loopback.

Gidsen: [Tailscale](/nl/gateway/tailscale) en [Weboverzicht](/nl/web).

## Commandostroom (wat waar draait)

Eén gateway-service beheert state + kanalen. Nodes zijn randapparaten.

Voorbeeldstroom (Telegram → node):

- Telegram-bericht komt binnen bij de **Gateway**.
- Gateway draait de **agent** en beslist of een node-tool moet worden aangeroepen.
- Gateway roept de **node** aan via de Gateway WebSocket (`node.*` RPC).
- Node retourneert het resultaat; Gateway antwoordt terug naar Telegram.

Opmerkingen:

- **Nodes draaien de gateway-service niet.** Er mag slechts één gateway per host draaien, tenzij je bewust geïsoleerde profielen draait (zie [Meerdere gateways](/nl/gateway/multiple-gateways)).
- macOS-app-"node mode" is alleen een node-client via de Gateway WebSocket.

## SSH-tunnel (CLI + tools)

Maak een lokale tunnel naar de remote Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Met de tunnel actief:

- `openclaw health` en `openclaw status --deep` bereiken nu de remote gateway via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` en `openclaw gateway call` kunnen indien nodig ook de geforwarde URL targeten via `--url`.

<Note>
Vervang `18789` door je geconfigureerde `gateway.port` (of `--port` of `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Wanneer je `--url` meegeeft, valt de CLI niet terug op config- of omgevingscredentials. Voeg `--token` of `--password` expliciet toe. Ontbrekende expliciete credentials is een fout.
</Warning>

## Remote-standaarden voor de CLI

Je kunt een remote target persistent maken, zodat CLI-commando's die standaard gebruiken:

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

Wanneer de gateway alleen loopback is, houd je de URL op `ws://127.0.0.1:18789` en open je eerst de SSH-tunnel.
In de SSH-tunneltransportlaag van de macOS-app horen ontdekte gateway-hostnamen in
`gateway.remote.sshTarget`; `gateway.remote.url` blijft de lokale tunnel-URL.

## Credential-prioriteit

Gateway-credentialresolutie volgt één gedeeld contract voor call/probe/status-paden en Discord exec-approval-monitoring. Node-host gebruikt hetzelfde basiscontract met één local-mode-uitzondering (het negeert bewust `gateway.remote.*`):

- Expliciete credentials (`--token`, `--password` of tool `gatewayToken`) winnen altijd op call-paden die expliciete auth accepteren.
- Veiligheid bij URL-override:
  - CLI-URL-overrides (`--url`) hergebruiken nooit impliciete config-/env-credentials.
  - Env-URL-overrides (`OPENCLAW_GATEWAY_URL`) mogen alleen env-credentials gebruiken (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standaarden voor local mode:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (remote fallback geldt alleen wanneer lokale auth-tokeninvoer niet is ingesteld)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (remote fallback geldt alleen wanneer lokale auth-passwordinvoer niet is ingesteld)
- Standaarden voor remote mode:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Local-mode-uitzondering voor Node-host: `gateway.remote.token` / `gateway.remote.password` worden genegeerd.
- Tokencontroles voor remote probe/status zijn standaard strikt: ze gebruiken alleen `gateway.remote.token` (geen lokale token-fallback) wanneer ze remote mode targeten.
- Gateway-env-overrides gebruiken alleen `OPENCLAW_GATEWAY_*`.

## Chat-UI via SSH

WebChat gebruikt geen aparte HTTP-poort meer. De SwiftUI-chat-UI verbindt rechtstreeks met de Gateway WebSocket.

- Forward `18789` via SSH (zie hierboven) en verbind clients daarna met `ws://127.0.0.1:18789`.
- Op macOS heeft de "Remote over SSH"-modus van de app de voorkeur; die beheert de tunnel automatisch.

## macOS-app Remote over SSH

De macOS-menubalk-app kan dezelfde setup end-to-end aansturen (remote statuscontroles, WebChat en Voice Wake-forwarding).

Runbook: [macOS-toegang op afstand](/nl/platforms/mac/remote).

## Beveiligingsregels (remote/VPN)

Korte versie: **houd de Gateway alleen op loopback**, tenzij je zeker weet dat je een bind nodig hebt.

- **Loopback + SSH/Tailscale Serve** is de veiligste standaard (geen publieke blootstelling).
- Plaintext `ws://` is standaard alleen loopback. Voor vertrouwde privénetwerken
  stel je `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in op het clientproces als
  break-glass. Er is geen equivalent in `openclaw.json`; dit moet de procesomgeving
  zijn voor de client die de WebSocket-verbinding maakt.
- **Non-loopback binds** (`lan`/`tailnet`/`custom`, of `auto` wanneer loopback niet beschikbaar is) moeten gateway-auth gebruiken: token, password of een identity-aware reverse proxy met `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` zijn bronnen voor clientcredentials. Ze configureren op zichzelf **geen** server-auth.
- Lokale call-paden kunnen `gateway.remote.*` alleen als fallback gebruiken wanneer `gateway.auth.*` niet is ingesteld.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt resolutie gesloten (geen maskering door remote fallback).
- `gateway.remote.tlsFingerprint` pint het remote TLS-certificaat bij gebruik van `wss://`.
- **Tailscale Serve** kan Control UI-/WebSocket-verkeer authenticeren via identity
  headers wanneer `gateway.auth.allowTailscale: true`; HTTP API-endpoints gebruiken
  die Tailscale-headerauth niet en volgen in plaats daarvan de normale HTTP
  auth mode van de gateway. Deze flow zonder token gaat ervan uit dat de gateway-host vertrouwd is. Zet dit op
  `false` als je overal shared-secret-auth wilt.
- **Trusted-proxy**-auth verwacht standaard non-loopback identity-aware proxy-setups.
  Same-host loopback reverse proxies vereisen expliciet `gateway.auth.trustedProxy.allowLoopback = true`.
- Behandel browsercontrole als operator-toegang: alleen tailnet + bewuste node-pairing.

Diepgaand: [Beveiliging](/nl/gateway/security).

### macOS: persistente SSH-tunnel via LaunchAgent

Voor macOS-clients die met een remote gateway verbinden, gebruikt de eenvoudigste persistente setup een SSH-`LocalForward`-config-entry plus een LaunchAgent om de tunnel actief te houden na herstarts en crashes.

#### Stap 1: voeg SSH-config toe

Bewerk `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Vervang `<REMOTE_IP>` en `<REMOTE_USER>` door je waarden.

#### Stap 2: kopieer de SSH-sleutel (eenmalig)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Stap 3: configureer het gateway-token

Sla het token op in de config zodat het na herstarts behouden blijft:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Stap 4: maak de LaunchAgent

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

#### Stap 5: laad de LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

De tunnel start automatisch bij login, herstart na een crash en houdt de geforwarde poort actief.

<Note>
Als je nog een overgebleven `com.openclaw.ssh-tunnel` LaunchAgent uit een oudere setup hebt, unload en verwijder die.
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

| Config-entry                         | Wat het doet                                                   |
| ------------------------------------ | -------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Forwardt lokale poort 18789 naar remote poort 18789            |
| `ssh -N`                             | SSH zonder remote commando's uit te voeren (alleen port-forwarding) |
| `KeepAlive`                          | Herstart de tunnel automatisch als die crasht                  |
| `RunAtLoad`                          | Start de tunnel wanneer de LaunchAgent bij login wordt geladen |

## Gerelateerd

- [Tailscale](/nl/gateway/tailscale)
- [Authenticatie](/nl/gateway/authentication)
- [Remote gateway-setup](/nl/gateway/remote-gateway-readme)
