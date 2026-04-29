---
read_when:
    - OpenClaw instellen op Oracle Cloud
    - Op zoek naar betaalbare VPS-hosting voor OpenClaw
    - Wil je 24/7 OpenClaw op een kleine server draaien
summary: OpenClaw op Oracle Cloud (Always Free ARM)
title: Oracle Cloud (platform)
x-i18n:
    generated_at: "2026-04-29T23:01:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw op Oracle Cloud (OCI)

## Doel

Draai een persistente OpenClaw Gateway op Oracle Cloud's **Always Free** ARM-laag.

Oracle's gratis laag kan goed bij OpenClaw passen (vooral als je al een OCI-account hebt), maar kent afwegingen:

- ARM-architectuur (de meeste dingen werken, maar sommige binaries kunnen alleen x86 zijn)
- Capaciteit en aanmelden kunnen lastig zijn

## Kostenvergelijking (2026)

| Provider     | Abonnement     | Specificaties          | Prijs/mnd | Opmerkingen              |
| ------------ | --------------- | ---------------------- | --------- | ------------------------ |
| Oracle Cloud | Always Free ARM | tot 4 OCPU, 24GB RAM   | $0        | ARM, beperkte capaciteit |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | ~ $4      | Goedkoopste betaalde optie |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6        | Eenvoudige UI, goede docs |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6        | Veel locaties            |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5        | Nu onderdeel van Akamai  |

---

## Vereisten

- Oracle Cloud-account ([aanmelden](https://www.oracle.com/cloud/free/)) — zie de [community-aanmeldgids](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) als je problemen tegenkomt
- Tailscale-account (gratis op [tailscale.com](https://tailscale.com))
- ~30 minuten

## 1) Maak een OCI-instantie aan

1. Log in op de [Oracle Cloud Console](https://cloud.oracle.com/)
2. Ga naar **Compute → Instances → Create Instance**
3. Configureer:
   - **Naam:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPU's:** 2 (of tot 4)
   - **Geheugen:** 12 GB (of tot 24 GB)
   - **Bootvolume:** 50 GB (tot 200 GB gratis)
   - **SSH-sleutel:** Voeg je publieke sleutel toe
4. Klik op **Create**
5. Noteer het publieke IP-adres

**Tip:** Als het aanmaken van de instantie mislukt met "Out of capacity", probeer dan een ander availability domain of probeer het later opnieuw. De capaciteit van de gratis laag is beperkt.

## 2) Verbind en werk bij

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Opmerking:** `build-essential` is vereist voor ARM-compilatie van sommige afhankelijkheden.

## 3) Configureer gebruiker en hostnaam

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Installeer Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Dit schakelt Tailscale SSH in, zodat je vanaf elk apparaat in je tailnet kunt verbinden via `ssh openclaw` — geen publiek IP nodig.

Controleer:

```bash
tailscale status
```

**Verbind vanaf nu via Tailscale:** `ssh ubuntu@openclaw` (of gebruik het Tailscale-IP).

## 5) Installeer OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Wanneer je wordt gevraagd "How do you want to hatch your bot?", selecteer je **"Do this later"**.

> Opmerking: Als je ARM-native buildproblemen tegenkomt, begin dan met systeempakketten (bijv. `sudo apt install -y build-essential`) voordat je Homebrew probeert.

## 6) Configureer Gateway (loopback + token-auth) en schakel Tailscale Serve in

Gebruik token-auth als standaard. Het is voorspelbaar en voorkomt dat je "insecure auth"-Control UI-flags nodig hebt.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` is hier alleen voor de forwarded-IP/local-client-afhandeling van de lokale Tailscale Serve-proxy. Het is **niet** `gateway.auth.mode: "trusted-proxy"`. Routes voor de diff-viewer behouden fail-closed gedrag in deze configuratie: ruwe `127.0.0.1`-viewerrequests zonder forwarded proxy-headers kunnen `Diff not found` retourneren. Gebruik `mode=file` / `mode=both` voor bijlagen, of schakel bewust externe viewers in en stel `plugins.entries.diffs.config.viewerBaseUrl` in (of geef een proxy-`baseUrl` door) als je deelbare viewerlinks nodig hebt.

## 7) Controleer

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) Vergrendel VCN-beveiliging

Nu alles werkt, vergrendel je de VCN om al het verkeer behalve Tailscale te blokkeren. OCI's Virtual Cloud Network werkt als firewall aan de netwerkrand — verkeer wordt geblokkeerd voordat het je instantie bereikt.

1. Ga naar **Networking → Virtual Cloud Networks** in de OCI Console
2. Klik op je VCN → **Security Lists** → Default Security List
3. **Verwijder** alle ingress-regels behalve:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Behoud de standaard egress-regels (sta al het uitgaande verkeer toe)

Dit blokkeert SSH op poort 22, HTTP, HTTPS en al het andere aan de netwerkrand. Vanaf nu kun je alleen nog via Tailscale verbinden.

---

## Toegang tot de Control UI

Vanaf elk apparaat op je Tailscale-netwerk:

```
https://openclaw.<tailnet-name>.ts.net/
```

Vervang `<tailnet-name>` door je tailnet-naam (zichtbaar in `tailscale status`).

Geen SSH-tunnel nodig. Tailscale biedt:

- HTTPS-versleuteling (automatische certificaten)
- Authenticatie via Tailscale-identiteit
- Toegang vanaf elk apparaat in je tailnet (laptop, telefoon, enz.)

---

## Beveiliging: VCN + Tailscale (aanbevolen basis)

Met de vergrendelde VCN (alleen UDP 41641 open) en de Gateway gebonden aan loopback krijg je sterke defense-in-depth: publiek verkeer wordt aan de netwerkrand geblokkeerd, en beheerstoegang loopt via je tailnet.

Deze configuratie neemt vaak de _noodzaak_ weg voor extra hostgebaseerde firewallregels puur om internetbrede SSH-bruteforce te stoppen — maar je moet het besturingssysteem nog steeds bijgewerkt houden, `openclaw security audit` uitvoeren en controleren dat je niet per ongeluk op publieke interfaces luistert.

### Al beschermd

| Traditionele stap        | Nodig?        | Waarom                                                                      |
| ------------------------ | ------------- | --------------------------------------------------------------------------- |
| UFW-firewall             | Nee           | VCN blokkeert voordat verkeer de instantie bereikt                          |
| fail2ban                 | Nee           | Geen bruteforce als poort 22 bij de VCN is geblokkeerd                      |
| sshd-hardening           | Nee           | Tailscale SSH gebruikt sshd niet                                            |
| Root-login uitschakelen  | Nee           | Tailscale gebruikt Tailscale-identiteit, geen systeemgebruikers             |
| SSH-auth alleen met sleutel | Nee        | Tailscale authenticeert via je tailnet                                      |
| IPv6-hardening           | Meestal niet  | Hangt af van je VCN-/subnetinstellingen; controleer wat echt is toegewezen/blootgesteld |

### Nog steeds aanbevolen

- **Credential-machtigingen:** `chmod 700 ~/.openclaw`
- **Beveiligingsaudit:** `openclaw security audit`
- **Systeemupdates:** voer regelmatig `sudo apt update && sudo apt upgrade` uit
- **Monitor Tailscale:** Controleer apparaten in de [Tailscale admin console](https://login.tailscale.com/admin)

### Controleer de beveiligingshouding

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## Terugvaloptie: SSH-tunnel

Als Tailscale Serve niet werkt, gebruik dan een SSH-tunnel:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Open daarna `http://localhost:18789`.

---

## Probleemoplossing

### Aanmaken van instantie mislukt ("Out of capacity")

ARM-instanties in de gratis laag zijn populair. Probeer:

- Een ander availability domain
- Opnieuw proberen buiten piekuren (vroeg in de ochtend)
- Gebruik het filter "Always Free" bij het selecteren van de shape

### Tailscale wil niet verbinden

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway start niet

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Control UI niet bereikbaar

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### Problemen met ARM-binaries

Sommige tools hebben mogelijk geen ARM-builds. Controleer:

```bash
uname -m  # Should show aarch64
```

De meeste npm-pakketten werken prima. Zoek voor binaries naar `linux-arm64`- of `aarch64`-releases.

---

## Persistentie

Alle state staat in:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, channel-/provider-state en sessiegegevens
- `~/.openclaw/workspace/` — workspace (SOUL.md, geheugen, artefacten)

Maak periodiek een back-up:

```bash
openclaw backup create
```

---

## Gerelateerd

- [Gateway-toegang op afstand](/nl/gateway/remote) — andere patronen voor externe toegang
- [Tailscale-integratie](/nl/gateway/tailscale) — volledige Tailscale-docs
- [Gateway-configuratie](/nl/gateway/configuration) — alle configuratieopties
- [DigitalOcean-gids](/nl/install/digitalocean) — als je betaald + eenvoudiger aanmelden wilt
- [Hetzner-gids](/nl/install/hetzner) — Docker-gebaseerd alternatief
