---
read_when:
    - Je wilt de Gateway uitvoeren op een Linux-server of cloud-VPS
    - Je hebt een snelle kaart van hostinggidsen nodig
    - Je wilt algemene Linux-servertuning voor OpenClaw
sidebarTitle: Linux Server
summary: OpenClaw uitvoeren op een Linux-server of cloud-VPS — providerkiezer, architectuur en afstemming
title: Linux-server
x-i18n:
    generated_at: "2026-06-27T18:32:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

Voer de OpenClaw Gateway uit op elke Linux-server of cloud-VPS. Deze pagina helpt je
een provider te kiezen, legt uit hoe cloudimplementaties werken en behandelt algemene Linux-
afstemming die overal van toepassing is.

## Kies een provider

<CardGroup cols={2}>
  <Card title="Railway" href="/nl/install/railway">Setup met één klik in de browser</Card>
  <Card title="Northflank" href="/nl/install/northflank">Setup met één klik in de browser</Card>
  <Card title="DigitalOcean" href="/nl/install/digitalocean">Eenvoudige betaalde VPS</Card>
  <Card title="Oracle Cloud" href="/nl/install/oracle">Always Free ARM-laag</Card>
  <Card title="Fly.io" href="/nl/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/nl/install/hetzner">Docker op Hetzner VPS</Card>
  <Card title="Hostinger" href="/nl/install/hostinger">VPS met setup met één klik</Card>
  <Card title="GCP" href="/nl/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/nl/install/azure">Linux-VM</Card>
  <Card title="exe.dev" href="/nl/install/exe-dev">VM met HTTPS-proxy</Card>
  <Card title="Raspberry Pi" href="/nl/install/raspberry-pi">ARM zelf gehost</Card>
</CardGroup>

**AWS (EC2 / Lightsail / gratis laag)** werkt ook goed.
Een video-walkthrough van de community is beschikbaar op
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(communitybron -- kan onbeschikbaar worden).

## Hoe cloudsetups werken

- De **Gateway draait op de VPS** en beheert status + werkruimte.
- Je maakt verbinding vanaf je laptop of telefoon via de **Control-UI** of **Tailscale/SSH**.
- Behandel de VPS als de gezaghebbende bron en maak regelmatig **back-ups** van de status + werkruimte.
- Veilige standaard: houd de Gateway op loopback en benader deze via een SSH-tunnel of Tailscale Serve.
  Als je bindt aan `lan` of `tailnet`, vereis dan `gateway.auth.token` of `gateway.auth.password`.

Gerelateerde pagina's: [Gateway-toegang op afstand](/nl/gateway/remote), [Platformshub](/nl/platforms).

## Beveilig eerst beheerderstoegang

Voordat je OpenClaw op een openbare VPS installeert, bepaal je hoe je de server
zelf wilt beheren.

- Als je beheerderstoegang alleen via Tailnet wilt, installeer dan eerst Tailscale, voeg de VPS
  toe aan je tailnet, verifieer een tweede SSH-sessie via het Tailscale-IP-adres of
  de MagicDNS-naam en beperk daarna openbare SSH.
- Als je Tailscale niet gebruikt, pas dan gelijkwaardige beveiliging toe op je SSH-
  pad voordat je meer services blootstelt.
- Dit staat los van Gateway-toegang. Je kunt OpenClaw nog steeds aan
  loopback gebonden houden en een SSH-tunnel of Tailscale Serve gebruiken voor het dashboard.

Tailscale-specifieke Gateway-opties staan in [Tailscale](/nl/gateway/tailscale).

## Gedeelde bedrijfsagent op een VPS

Eén agent voor een team uitvoeren is een geldige setup wanneer elke gebruiker zich binnen dezelfde vertrouwensgrens bevindt en de agent uitsluitend zakelijk wordt gebruikt.

- Houd deze op een toegewezen runtime (VPS/VM/container + toegewezen OS-gebruiker/accounts).
- Meld die runtime niet aan bij persoonlijke Apple-/Google-accounts of persoonlijke browser-/wachtwoordbeheerprofielen.
- Als gebruikers vijandig tegenover elkaar kunnen staan, splits dan per gateway/host/OS-gebruiker.

Details over het beveiligingsmodel: [Beveiliging](/nl/gateway/security).

## Nodes gebruiken met een VPS

Je kunt de Gateway in de cloud houden en **nodes** op je lokale apparaten
(Mac/iOS/Android/headless) koppelen. Nodes bieden lokale scherm-/camera-/canvas- en `system.run`-
mogelijkheden terwijl de Gateway in de cloud blijft.

Docs: [Nodes](/nl/nodes), [Nodes-CLI](/nl/cli/nodes).

## Opstartafstemming voor kleine VM's en ARM-hosts

Als CLI-opdrachten traag aanvoelen op energiezuinige VM's (of ARM-hosts), schakel dan Node's modulecompilecache in:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` verbetert de opstarttijden van herhaalde opdrachten.
- `OPENCLAW_NO_RESPAWN=1` houdt routinematige Gateway-herstarts binnen hetzelfde proces, wat extra procesoverdrachten voorkomt en PID-tracking eenvoudig houdt op kleine hosts.
- De eerste opdrachtrun warmt de cache op; volgende runs zijn sneller.
- Zie [Raspberry Pi](/nl/install/raspberry-pi) voor Raspberry Pi-specifieke informatie.

### systemd-afstemmingschecklist (optioneel)

Voor VM-hosts die `systemd` gebruiken, overweeg:

- Voeg service-env toe voor een stabiel opstartpad:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Houd herstartgedrag expliciet:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Geef de voorkeur aan SSD-ondersteunde schijven voor status-/cachepaden om cold-startnadelen door willekeurige I/O te verminderen.

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

Als je bewust in plaats daarvan een systeemeenheid hebt geïnstalleerd, bewerk dan
`openclaw-gateway.service` via `sudo systemctl edit openclaw-gateway.service`.

Hoe `Restart=`-beleid geautomatiseerd herstel helpt:
[systemd kan serviceherstel automatiseren](https://www.redhat.com/en/blog/systemd-automate-recovery).

Voor Linux OOM-gedrag, selectie van childprocessen als slachtoffer en `exit 137`-
diagnostiek, zie [Linux-geheugendruk en OOM-kills](/nl/platforms/linux#memory-pressure-and-oom-kills).

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [DigitalOcean](/nl/install/digitalocean)
- [Fly.io](/nl/install/fly)
- [Hetzner](/nl/install/hetzner)
