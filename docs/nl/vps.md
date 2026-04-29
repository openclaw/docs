---
read_when:
    - Je wilt de Gateway uitvoeren op een Linux-server of cloud-VPS
    - Je hebt een snel overzicht van hostinghandleidingen nodig
    - Je wilt algemene Linux-serveroptimalisatie voor OpenClaw
sidebarTitle: Linux Server
summary: OpenClaw uitvoeren op een Linux-server of cloud-VPS — providerkiezer, architectuur en afstemming
title: Linux-server
x-i18n:
    generated_at: "2026-04-29T23:28:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

Voer de OpenClaw Gateway uit op elke Linux-server of cloud-VPS. Deze pagina helpt je
een provider te kiezen, legt uit hoe cloudimplementaties werken en behandelt generieke Linux-
tuning die overal van toepassing is.

## Kies een provider

<CardGroup cols={2}>
  <Card title="Railway" href="/nl/install/railway">Eenkliksinstallatie in de browser</Card>
  <Card title="Northflank" href="/nl/install/northflank">Eenkliksinstallatie in de browser</Card>
  <Card title="DigitalOcean" href="/nl/install/digitalocean">Eenvoudige betaalde VPS</Card>
  <Card title="Oracle Cloud" href="/nl/install/oracle">Always Free ARM-laag</Card>
  <Card title="Fly.io" href="/nl/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/nl/install/hetzner">Docker op Hetzner VPS</Card>
  <Card title="Hostinger" href="/nl/install/hostinger">VPS met eenkliksinstallatie</Card>
  <Card title="GCP" href="/nl/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/nl/install/azure">Linux-VM</Card>
  <Card title="exe.dev" href="/nl/install/exe-dev">VM met HTTPS-proxy</Card>
  <Card title="Raspberry Pi" href="/nl/install/raspberry-pi">Zelfgehoste ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** werkt ook goed.
Een video-uitleg van de community is beschikbaar op
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(communitybron -- kan onbeschikbaar worden).

## Hoe cloudopstellingen werken

- De **Gateway draait op de VPS** en beheert status + workspace.
- Je maakt verbinding vanaf je laptop of telefoon via de **Control UI** of **Tailscale/SSH**.
- Behandel de VPS als de bron van waarheid en **maak regelmatig een back-up** van de status + workspace.
- Veilige standaard: houd de Gateway op loopback en benader deze via een SSH-tunnel of Tailscale Serve.
  Als je bindt aan `lan` of `tailnet`, vereis dan `gateway.auth.token` of `gateway.auth.password`.

Gerelateerde pagina's: [Gateway-toegang op afstand](/nl/gateway/remote), [Platformhub](/nl/platforms).

## Beveilig eerst beheertoegang

Voordat je OpenClaw op een openbare VPS installeert, bepaal je hoe je
de machine zelf wilt beheren.

- Als je alleen Tailnet-beheertoegang wilt, installeer dan eerst Tailscale, voeg de VPS
  toe aan je tailnet, verifieer een tweede SSH-sessie via het Tailscale-IP-adres of
  de MagicDNS-naam en beperk daarna openbare SSH.
- Als je Tailscale niet gebruikt, pas dan gelijkwaardige beveiliging toe voor je SSH-
  pad voordat je meer services blootstelt.
- Dit staat los van Gateway-toegang. Je kunt OpenClaw nog steeds gebonden houden aan
  loopback en een SSH-tunnel of Tailscale Serve gebruiken voor het dashboard.

Tailscale-specifieke Gateway-opties staan in [Tailscale](/nl/gateway/tailscale).

## Gedeelde bedrijfsagent op een VPS

Een enkele agent voor een team uitvoeren is een geldige opstelling wanneer elke gebruiker binnen dezelfde vertrouwensgrens valt en de agent alleen zakelijk wordt gebruikt.

- Houd deze op een toegewezen runtime (VPS/VM/container + toegewezen OS-gebruiker/accounts).
- Meld die runtime niet aan bij persoonlijke Apple-/Google-accounts of persoonlijke browser-/wachtwoordmanagerprofielen.
- Als gebruikers vijandig tegenover elkaar kunnen staan, splits dan per Gateway/host/OS-gebruiker.

Details van het beveiligingsmodel: [Beveiliging](/nl/gateway/security).

## Nodes gebruiken met een VPS

Je kunt de Gateway in de cloud houden en **nodes** koppelen op je lokale apparaten
(Mac/iOS/Android/headless). Nodes bieden lokaal scherm/camera/canvas en `system.run`-
mogelijkheden terwijl de Gateway in de cloud blijft.

Docs: [Nodes](/nl/nodes), [Nodes CLI](/nl/cli/nodes).

## Opstarttuning voor kleine VM's en ARM-hosts

Als CLI-opdrachten traag aanvoelen op VM's met weinig vermogen (of ARM-hosts), schakel dan Node's modulecompilecache in:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` verbetert de opstarttijden van herhaalde opdrachten.
- `OPENCLAW_NO_RESPAWN=1` voorkomt extra opstartoverhead van een zelf-herstartpad.
- De eerste opdrachtuitvoering warmt de cache op; volgende uitvoeringen zijn sneller.
- Zie [Raspberry Pi](/nl/install/raspberry-pi) voor Raspberry Pi-specifieke informatie.

### systemd-tuningchecklist (optioneel)

Voor VM-hosts die `systemd` gebruiken, overweeg:

- Voeg service-env toe voor een stabiel opstartpad:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Houd herstartgedrag expliciet:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Geef de voorkeur aan SSD-ondersteunde schijven voor status-/cachepaden om random-I/O-opstartvertragingen te verminderen.

Voor het standaardpad `openclaw onboard --install-daemon` bewerk je de gebruikerseenheid:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Als je bewust een systeemeenheid hebt geïnstalleerd, bewerk dan
`openclaw-gateway.service` via `sudo systemctl edit openclaw-gateway.service`.

Hoe `Restart=`-beleid geautomatiseerd herstel helpt:
[systemd kan serviceherstel automatiseren](https://www.redhat.com/en/blog/systemd-automate-recovery).

Zie voor Linux-OOM-gedrag, slachtofferselectie voor childprocessen en `exit 137`-
diagnostiek [Linux-geheugendruk en OOM-kills](/nl/platforms/linux#memory-pressure-and-oom-kills).

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [DigitalOcean](/nl/install/digitalocean)
- [Fly.io](/nl/install/fly)
- [Hetzner](/nl/install/hetzner)
