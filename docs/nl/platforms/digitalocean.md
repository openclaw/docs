---
read_when:
    - OpenClaw instellen op DigitalOcean
    - Op zoek naar goedkope VPS-hosting voor OpenClaw
summary: OpenClaw op DigitalOcean (eenvoudige betaalde VPS-optie)
title: DigitalOcean (platform)
x-i18n:
    generated_at: "2026-04-29T22:58:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw op DigitalOcean

## Doel

Voer een persistente OpenClaw Gateway uit op DigitalOcean voor **$6/maand** (of $4/maand met gereserveerde prijzen).

Als je een optie van $0/maand wilt en ARM + providerspecifieke installatie geen probleem vindt, bekijk dan de [Oracle Cloud-handleiding](/nl/install/oracle).

## Kostenvergelijking (2026)

| Provider     | Abonnement      | Specificaties          | Prijs/maand | Opmerkingen                           |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | tot 4 OCPU, 24GB RAM   | $0          | ARM, beperkte capaciteit / aanmeld-eigenaardigheden |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | €3,79 (~$4) | Goedkoopste betaalde optie            |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6          | Eenvoudige UI, goede documentatie     |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6          | Veel locaties                         |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5          | Nu onderdeel van Akamai               |

**Een provider kiezen:**

- DigitalOcean: eenvoudigste UX + voorspelbare installatie (deze handleiding)
- Hetzner: goede prijs/prestatie (zie de [Hetzner-handleiding](/nl/install/hetzner))
- Oracle Cloud: kan $0/maand zijn, maar is kieskeuriger en alleen ARM (zie de [Oracle-handleiding](/nl/install/oracle))

---

## Vereisten

- DigitalOcean-account ([meld je aan met $200 gratis tegoed](https://m.do.co/c/signup))
- SSH-sleutelpaar (of bereidheid om wachtwoordauthenticatie te gebruiken)
- ~20 minuten

## 1) Maak een Droplet

<Warning>
Gebruik een schone basisimage (Ubuntu 24.04 LTS). Vermijd externe Marketplace 1-click-images, tenzij je hun opstartscripts en firewallstandaarden hebt gecontroleerd.
</Warning>

1. Log in bij [DigitalOcean](https://cloud.digitalocean.com/)
2. Klik op **Create → Droplets**
3. Kies:
   - **Regio:** Het dichtst bij jou (of je gebruikers)
   - **Image:** Ubuntu 24.04 LTS
   - **Grootte:** Basic → Regular → **$6/maand** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authenticatie:** SSH-sleutel (aanbevolen) of wachtwoord
4. Klik op **Create Droplet**
5. Noteer het IP-adres

## 2) Maak verbinding via SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Installeer OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Voer Onboarding uit

```bash
openclaw onboard --install-daemon
```

De wizard leidt je door:

- Modelauthenticatie (API-sleutels of OAuth)
- Kanaalconfiguratie (Telegram, WhatsApp, Discord, enz.)
- Gateway-token (automatisch gegenereerd)
- Daemon-installatie (systemd)

## 5) Verifieer de Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Open het Dashboard

De Gateway bindt standaard aan loopback. Om toegang te krijgen tot de Control UI:

**Optie A: SSH-tunnel (aanbevolen)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Optie B: Tailscale Serve (HTTPS, alleen loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Open: `https://<magicdns>/`

Opmerkingen:

- Serve houdt de Gateway alleen via loopback bereikbaar en authenticeert Control UI/WebSocket-verkeer via Tailscale-identiteitsheaders (authenticatie zonder token gaat uit van een vertrouwde gatewayhost; HTTP-API's gebruiken die Tailscale-headers niet en volgen in plaats daarvan de normale HTTP-authenticatiemodus van de Gateway).
- Om in plaats daarvan expliciete gedeelde geheime inloggegevens te vereisen, stel je `gateway.auth.allowTailscale: false` in en gebruik je `gateway.auth.mode: "token"` of `"password"`.

**Optie C: Tailnet-bind (geen Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Open: `http://<tailscale-ip>:18789` (token vereist).

## 7) Verbind je kanalen

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Zie [Kanalen](/nl/channels) voor andere providers.

---

## Optimalisaties voor 1GB RAM

De droplet van $6 heeft maar 1GB RAM. Om alles soepel te laten draaien:

### Swap toevoegen (aanbevolen)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Gebruik een lichter model

Als je OOM's tegenkomt, overweeg dan:

- API-gebaseerde modellen (Claude, GPT) gebruiken in plaats van lokale modellen
- `agents.defaults.model.primary` instellen op een kleiner model

### Geheugen monitoren

```bash
free -h
htop
```

---

## Persistentie

Alle status leeft in:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, kanaal-/providerstatus en sessiegegevens
- `~/.openclaw/workspace/` — workspace (SOUL.md, geheugen, enz.)

Deze blijven behouden na herstarts. Maak er periodiek een back-up van:

```bash
openclaw backup create
```

---

## Gratis alternatief met Oracle Cloud

Oracle Cloud biedt **Always Free** ARM-instanties die aanzienlijk krachtiger zijn dan welke betaalde optie hier dan ook — voor $0/maand.

| Wat je krijgt    | Specificaties          |
| ---------------- | ---------------------- |
| **4 OCPU's**     | ARM Ampere A1          |
| **24GB RAM**     | Meer dan genoeg        |
| **200GB opslag** | Blockvolume            |
| **Voor altijd gratis** | Geen creditcardkosten |

**Kanttekeningen:**

- Aanmelden kan kieskeurig zijn (probeer opnieuw als het mislukt)
- ARM-architectuur — de meeste dingen werken, maar sommige binaries hebben ARM-builds nodig

Bekijk voor de volledige installatiehandleiding [Oracle Cloud](/nl/install/oracle). Voor aanmeldtips en probleemoplossing voor het inschrijvingsproces, zie deze [communityhandleiding](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Probleemoplossing

### Gateway start niet

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Poort is al in gebruik

```bash
lsof -i :18789
kill <PID>
```

### Onvoldoende geheugen

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Gerelateerd

- [Hetzner-handleiding](/nl/install/hetzner) — goedkoper, krachtiger
- [Docker-installatie](/nl/install/docker) — gecontaineriseerde installatie
- [Tailscale](/nl/gateway/tailscale) — veilige externe toegang
- [Configuratie](/nl/gateway/configuration) — volledige configuratiereferentie
