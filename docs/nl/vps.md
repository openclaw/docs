---
read_when:
    - U wilt de Gateway uitvoeren op een Linux-server of cloud-VPS
    - Je hebt een snel overzicht van hostinghandleidingen nodig
    - U wilt algemene Linux-serveroptimalisatie voor OpenClaw
sidebarTitle: Linux Server
summary: Voer OpenClaw uit op een Linux-server of cloud-VPS — providerselectie, architectuur en optimalisatie
title: Linux-server
x-i18n:
    generated_at: "2026-07-12T09:32:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Voer de OpenClaw Gateway uit op elke Linux-server of cloud-VPS. Deze pagina helpt u
een provider te kiezen, legt uit hoe cloudimplementaties werken en behandelt algemene Linux-
optimalisaties die overal van toepassing zijn.

## Kies een provider

<CardGroup cols={2}>
  <Card title="Azure" href="/nl/install/azure">Linux-VM</Card>
  <Card title="DigitalOcean" href="/nl/install/digitalocean">Eenvoudige betaalde VPS</Card>
  <Card title="exe.dev" href="/nl/install/exe-dev">VM met HTTPS-proxy</Card>
  <Card title="Fly.io" href="/nl/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/nl/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/nl/install/hetzner">Docker op een Hetzner-VPS</Card>
  <Card title="Hostinger" href="/nl/install/hostinger">VPS met installatie met één klik</Card>
  <Card title="Northflank" href="/nl/install/northflank">Browserinstallatie met één klik</Card>
  <Card title="Oracle Cloud" href="/nl/install/oracle">Altijd gratis ARM-niveau</Card>
  <Card title="Railway" href="/nl/install/railway">Browserinstallatie met één klik</Card>
  <Card title="Raspberry Pi" href="/nl/install/raspberry-pi">Zelf gehost op ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / gratis niveau)** werkt ook goed.
Een videohandleiding van de community is beschikbaar op
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(communitybron — kan onbeschikbaar worden).

## Hoe cloudconfiguraties werken

- De **Gateway draait op de VPS** en beheert de status en werkruimte.
- U maakt vanaf uw laptop of telefoon verbinding via de **bedieningsinterface** of **Tailscale/SSH**.
- Beschouw de VPS als de gezaghebbende bron en maak regelmatig een **back-up** van de status en werkruimte.
- Veilige standaardinstelling: houd de Gateway op local loopback en benader deze via een SSH-tunnel of Tailscale Serve.
  Als u deze aan `lan` of `tailnet` bindt, vereist de Gateway een gedeeld geheim
  (`gateway.auth.token` of `gateway.auth.password`), tenzij authenticatie aan een
  vertrouwde proxy is gedelegeerd.

Gerelateerde pagina's: [Externe toegang tot de Gateway](/nl/gateway/remote), [Platformoverzicht](/nl/platforms).

## Beveilig eerst de beheerderstoegang

Bepaal voordat u OpenClaw op een openbare VPS installeert hoe u
de machine zelf wilt beheren.

- Voor beheerderstoegang die uitsluitend via Tailnet verloopt: installeer eerst Tailscale, voeg de VPS toe aan uw
  tailnet, controleer een tweede SSH-sessie via het Tailscale-IP-adres of de MagicDNS-naam
  en beperk daarna openbare SSH-toegang.
- Zonder Tailscale: pas gelijkwaardige beveiligingsmaatregelen toe op uw SSH-route voordat u
  meer diensten beschikbaar stelt.
- Dit staat los van toegang tot de Gateway. U kunt OpenClaw nog steeds aan
  local loopback gebonden houden en een SSH-tunnel of Tailscale Serve voor het dashboard gebruiken.

Tailscale-specifieke Gateway-opties vindt u onder [Tailscale](/nl/gateway/tailscale).

## Gedeelde bedrijfsagent op een VPS

Het uitvoeren van één agent voor een team is een geldige configuratie wanneer elke gebruiker zich binnen
dezelfde vertrouwensgrens bevindt en de agent uitsluitend zakelijk wordt gebruikt.

- Gebruik hiervoor een specifieke runtime (VPS/VM/container en een afzonderlijke OS-gebruiker/aparte accounts).
- Meld die runtime niet aan bij persoonlijke Apple-/Google-accounts of persoonlijke browser-/wachtwoordbeheerderprofielen.
- Als gebruikers elkaar niet vertrouwen, scheidt u ze per Gateway/host/OS-gebruiker.

Details over het beveiligingsmodel: [Beveiliging](/nl/gateway/security).

## Nodes gebruiken met een VPS

U kunt de Gateway in de cloud houden en **nodes** op uw lokale apparaten koppelen
(Mac/iOS/Android/headless). Nodes bieden lokale scherm-, camera- en canvasmogelijkheden en `system.run`-
functionaliteit, terwijl de Gateway in de cloud blijft.

Documentatie: [Nodes](/nl/nodes), [Nodes-CLI](/nl/cli/nodes).

## Opstartoptimalisatie voor kleine VM's en ARM-hosts

Als CLI-opdrachten traag aanvoelen op VM's met weinig rekenkracht (of ARM-hosts), schakelt u de modulecompilatiecache van Node in:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` versnelt het herhaaldelijk starten van opdrachten; bij de eerste uitvoering wordt de cache opgewarmd.
- `OPENCLAW_NO_RESPAWN=1` houdt normale herstarts van de Gateway binnen hetzelfde proces. Dit voorkomt extra overdrachten tussen processen en houdt het volgen van PID's eenvoudig op kleine hosts.
- Zie [Raspberry Pi](/nl/install/raspberry-pi) voor informatie die specifiek is voor Raspberry Pi.

### Checklist voor systemd-optimalisatie (optioneel)

Overweeg voor VM-hosts die `systemd` gebruiken:

- Omgevingsvariabelen voor de dienst voor een stabiel opstartpad: `OPENCLAW_NO_RESPAWN=1` en
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Expliciet herstartgedrag: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- SSD-opslag voor status- en cachepaden om nadelen bij koude starts door willekeurige I/O te beperken.

Het standaardpad `openclaw onboard --install-daemon` installeert een systemd-eenheid voor de
gebruiker; bewerk deze met:

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

Als u bewust een systeemeenheid hebt geïnstalleerd, bewerkt u deze via
`sudo systemctl edit openclaw-gateway.service`.

Hoe `Restart=`-beleid geautomatiseerd herstel ondersteunt:
[systemd kan dienstherstel automatiseren](https://www.redhat.com/en/blog/systemd-automate-recovery).

Zie [Linux-geheugendruk en beëindigingen door OOM](/nl/platforms/linux#memory-pressure-and-oom-kills) voor het OOM-gedrag van Linux, de selectie van te beëindigen
onderliggende processen en diagnostiek voor `exit 137`.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [DigitalOcean](/nl/install/digitalocean)
- [Fly.io](/nl/install/fly)
- [Hetzner](/nl/install/hetzner)
