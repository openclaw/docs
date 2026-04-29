---
read_when:
    - OpenClaw instellen op een Raspberry Pi
    - OpenClaw uitvoeren op ARM-apparaten
    - Een goedkope, altijd actieve persoonlijke AI bouwen
summary: OpenClaw op Raspberry Pi (budgetvriendelijke zelfgehoste installatie)
title: Raspberry Pi (platform)
x-i18n:
    generated_at: "2026-04-29T23:00:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# OpenClaw op Raspberry Pi

## Doel

Voer een permanente, altijd actieve OpenClaw Gateway uit op een Raspberry Pi voor een eenmalige kost van **~$35-80** (geen maandelijkse kosten).

Perfect voor:

- 24/7 persoonlijke AI-assistent
- Hub voor huisautomatisering
- Energiezuinige, altijd beschikbare Telegram/WhatsApp-bot

## Hardwarevereisten

| Pi-model        | RAM     | Werkt?       | Opmerkingen                         |
| --------------- | ------- | ------------ | ----------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ Beste     | Snelst, aanbevolen                  |
| **Pi 4**        | 4GB     | ✅ Goed      | Ideaal voor de meeste gebruikers    |
| **Pi 4**        | 2GB     | ✅ OK        | Werkt, voeg swap toe                |
| **Pi 4**        | 1GB     | ⚠️ Krap      | Mogelijk met swap, minimale config  |
| **Pi 3B+**      | 1GB     | ⚠️ Traag     | Werkt, maar stroperig               |
| **Pi Zero 2 W** | 512MB   | ❌           | Niet aanbevolen                     |

**Minimale specificaties:** 1GB RAM, 1 core, 500MB schijfruimte  
**Aanbevolen:** 2GB+ RAM, 64-bit OS, 16GB+ SD-kaart (of USB-SSD)

## Wat je nodig hebt

- Raspberry Pi 4 of 5 (2GB+ aanbevolen)
- MicroSD-kaart (16GB+) of USB-SSD (betere prestaties)
- Voeding (officiële Pi-voeding aanbevolen)
- Netwerkverbinding (Ethernet of WiFi)
- ~30 minuten

## 1) Flash het OS

Gebruik **Raspberry Pi OS Lite (64-bit)** — geen desktop nodig voor een headless server.

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Kies OS: **Raspberry Pi OS Lite (64-bit)**
3. Klik op het tandwielpictogram (⚙️) om vooraf te configureren:
   - Stel hostnaam in: `gateway-host`
   - Schakel SSH in
   - Stel gebruikersnaam/wachtwoord in
   - Configureer WiFi (als je geen Ethernet gebruikt)
4. Flash naar je SD-kaart / USB-schijf
5. Plaats de kaart/schijf en start de Pi op

## 2) Maak verbinding via SSH

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) Systeeminstallatie

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Installeer Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) Voeg swap toe (belangrijk voor 2GB of minder)

Swap voorkomt crashes door te weinig geheugen:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Installeer OpenClaw

### Optie A: standaardinstallatie (aanbevolen)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Optie B: aanpasbare installatie (om te experimenteren)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

De aanpasbare installatie geeft je directe toegang tot logs en code — handig voor het debuggen van ARM-specifieke problemen.

## 7) Voer onboarding uit

```bash
openclaw onboard --install-daemon
```

Volg de wizard:

1. **Gateway-modus:** Lokaal
2. **Auth:** API-sleutels aanbevolen (OAuth kan lastig zijn op een headless Pi)
3. **Kanalen:** Telegram is het makkelijkst om mee te beginnen
4. **Daemon:** Ja (systemd)

## 8) Controleer de installatie

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) Open het OpenClaw-dashboard

Vervang `user@gateway-host` door je Pi-gebruikersnaam en hostnaam of IP-adres.

Vraag de Pi vanaf je computer om een nieuwe dashboard-URL af te drukken:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

De opdracht drukt `Dashboard URL:` af. Afhankelijk van hoe `gateway.auth.token`
is geconfigureerd, kan de URL een gewone `http://127.0.0.1:18789/`-link zijn of een
link met `#token=...`.

Maak in een andere terminal op je computer de SSH-tunnel:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Open daarna de afgedrukte dashboard-URL in je lokale browser.

Als de UI om shared-secret-authenticatie vraagt, plak je het geconfigureerde token of wachtwoord
in de Control UI-instellingen. Gebruik voor token-authenticatie `gateway.auth.token` (of
`OPENCLAW_GATEWAY_TOKEN`).

Zie [Tailscale](/nl/gateway/tailscale) voor altijd beschikbare externe toegang.

---

## Prestatieoptimalisaties

### Gebruik een USB-SSD (grote verbetering)

SD-kaarten zijn traag en slijten. Een USB-SSD verbetert de prestaties drastisch:

```bash
# Check if booting from USB
lsblk
```

Zie de [Pi USB-opstartgids](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) voor de installatie.

### Versnel het starten van de CLI (module-compilecache)

Schakel op Pi-hosts met minder rekenkracht de module-compilecache van Node in, zodat herhaalde CLI-runs sneller zijn:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Opmerkingen:

- `NODE_COMPILE_CACHE` versnelt volgende runs (`status`, `health`, `--help`).
- `/var/tmp` overleeft herstarts beter dan `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` voorkomt extra opstartkosten door CLI-zelfrespawn.
- De eerste run warmt de cache op; latere runs profiteren het meest.

### systemd-opstartafstemming (optioneel)

Als deze Pi vooral OpenClaw draait, voeg dan een service-drop-in toe om restart-jitter te verminderen
en de opstartomgeving stabiel te houden:

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

Pas daarna toe:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Houd OpenClaw-status/cache indien mogelijk op SSD-backed opslag om
random-I/O-knelpunten van SD-kaarten tijdens koude starts te vermijden.

Als dit een headless Pi is, schakel lingering dan één keer in zodat de gebruikersservice
afmelden overleeft:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Hoe `Restart=`-beleid geautomatiseerd herstel helpt:
[systemd kan serviceherstel automatiseren](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Verminder geheugengebruik

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### Monitor resources

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## ARM-specifieke opmerkingen

### Binaire compatibiliteit

De meeste OpenClaw-functies werken op ARM64, maar sommige externe binaries hebben mogelijk ARM-builds nodig:

| Tool               | ARM64-status | Opmerkingen                         |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Werkt uitstekend                    |
| WhatsApp (Baileys) | ✅           | Pure JS, geen problemen             |
| Telegram           | ✅           | Pure JS, geen problemen             |
| gog (Gmail CLI)    | ⚠️           | Controleer op ARM-release           |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

Als een skill faalt, controleer dan of de binary een ARM-build heeft. Veel Go/Rust-tools hebben die; sommige niet.

### 32-bit versus 64-bit

**Gebruik altijd een 64-bit OS.** Node.js en veel moderne tools vereisen dit. Controleer met:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## Aanbevolen modelconfiguratie

Omdat de Pi alleen de Gateway is (modellen draaien in de cloud), gebruik je API-gebaseerde modellen:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**Probeer geen lokale LLM's op een Pi te draaien** — zelfs kleine modellen zijn te traag. Laat Claude/GPT het zware werk doen.

---

## Automatisch starten bij boot

Onboarding stelt dit in, maar om te controleren:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## Probleemoplossing

### Te weinig geheugen (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### Trage prestaties

- Gebruik een USB-SSD in plaats van een SD-kaart
- Schakel ongebruikte services uit: `sudo systemctl disable cups bluetooth avahi-daemon`
- Controleer CPU-throttling: `vcgencmd get_throttled` (moet `0x0` retourneren)

### Service start niet

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM-binaryproblemen

Als een skill faalt met "exec format error":

1. Controleer of de binary een ARM64-build heeft
2. Probeer vanaf broncode te bouwen
3. Of gebruik een Docker-container met ARM-ondersteuning

### WiFi valt weg

Voor headless Pi's op WiFi:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Kostenvergelijking

| Installatie      | Eenmalige kosten | Maandelijkse kosten | Opmerkingen                |
| ---------------- | ---------------- | ------------------- | -------------------------- |
| **Pi 4 (2GB)**   | ~$45             | $0                  | + stroom (~$5/jaar)        |
| **Pi 4 (4GB)**   | ~$55             | $0                  | Aanbevolen                 |
| **Pi 5 (4GB)**   | ~$60             | $0                  | Beste prestaties           |
| **Pi 5 (8GB)**   | ~$80             | $0                  | Overkill, maar toekomstvast |
| DigitalOcean     | $0               | $6/mnd              | $72/jaar                   |
| Hetzner          | $0               | €3,79/mnd           | ~$50/jaar                  |

**Break-even:** Een Pi verdient zichzelf terug in ~6-12 maanden vergeleken met een cloud-VPS.

---

## Gerelateerd

- [Linux-gids](/nl/platforms/linux) — algemene Linux-installatie
- [DigitalOcean-gids](/nl/install/digitalocean) — cloudalternatief
- [Hetzner-gids](/nl/install/hetzner) — Docker-installatie
- [Tailscale](/nl/gateway/tailscale) — externe toegang
- [Nodes](/nl/nodes) — koppel je laptop/telefoon met de Pi-gateway
