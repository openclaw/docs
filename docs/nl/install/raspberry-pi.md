---
read_when:
    - OpenClaw instellen op een Raspberry Pi
    - OpenClaw uitvoeren op ARM-apparaten
    - Een goedkope, altijd actieve persoonlijke AI bouwen
summary: Draai OpenClaw op een Raspberry Pi voor altijd actieve zelfhosting
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-29T22:56:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 16
---

Voer een persistente, altijd actieve OpenClaw Gateway uit op een Raspberry Pi. Omdat de Pi alleen de Gateway is (modellen draaien in de cloud via API), kan zelfs een bescheiden Pi de werklast goed aan.

## Vereisten

- Raspberry Pi 4 of 5 met 2 GB+ RAM (4 GB aanbevolen)
- MicroSD-kaart (16 GB+) of USB-SSD (betere prestaties)
- Officiële Pi-voeding
- Netwerkverbinding (Ethernet of WiFi)
- 64-bits Raspberry Pi OS (vereist -- gebruik geen 32-bits)
- Ongeveer 30 minuten

## Installatie

<Steps>
  <Step title="Het OS flashen">
    Gebruik **Raspberry Pi OS Lite (64-bit)** -- geen desktop nodig voor een headless server.

    1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Kies OS: **Raspberry Pi OS Lite (64-bit)**.
    3. Configureer vooraf in het instellingendialoogvenster:
       - Hostnaam: `gateway-host`
       - SSH inschakelen
       - Gebruikersnaam en wachtwoord instellen
       - WiFi configureren (als je geen Ethernet gebruikt)
    4. Flash naar je SD-kaart of USB-station, plaats deze en start de Pi op.

  </Step>

  <Step title="Verbinding maken via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Het systeem bijwerken">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24 installeren">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Swap toevoegen (belangrijk voor 2 GB of minder)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw installeren">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Onboarding uitvoeren">
    ```bash
    openclaw onboard --install-daemon
    ```

    Volg de wizard. API-sleutels worden aanbevolen boven OAuth voor headless apparaten. Telegram is het makkelijkste kanaal om mee te beginnen.

  </Step>

  <Step title="Verifiëren">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="De Control UI openen">
    Haal op je computer een dashboard-URL op vanaf de Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Maak daarna een SSH-tunnel in een andere terminal:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Open de afgedrukte URL in je lokale browser. Zie [Tailscale-integratie](/nl/gateway/tailscale) voor altijd beschikbare externe toegang.

  </Step>
</Steps>

## Prestatietips

**Gebruik een USB-SSD** -- SD-kaarten zijn traag en slijten. Een USB-SSD verbetert de prestaties aanzienlijk. Zie de [Pi USB-opstartgids](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Schakel module compile cache in** -- Versnelt herhaalde CLI-aanroepen op Pi-hosts met lager vermogen:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Verminder geheugengebruik** -- Maak voor headless installaties GPU-geheugen vrij en schakel ongebruikte services uit:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Probleemoplossing

**Onvoldoende geheugen** -- Controleer met `free -h` of swap actief is. Schakel ongebruikte services uit (`sudo systemctl disable cups bluetooth avahi-daemon`). Gebruik alleen API-gebaseerde modellen.

**Trage prestaties** -- Gebruik een USB-SSD in plaats van een SD-kaart. Controleer CPU-throttling met `vcgencmd get_throttled` (moet `0x0` retourneren).

**Service start niet** -- Controleer logs met `journalctl --user -u openclaw-gateway.service --no-pager -n 100` en voer `openclaw doctor --non-interactive` uit. Als dit een headless Pi is, controleer dan ook of lingering is ingeschakeld: `sudo loginctl enable-linger "$(whoami)"`.

**Problemen met ARM-binaries** -- Als een skill mislukt met "exec format error", controleer dan of de binary een ARM64-build heeft. Controleer de architectuur met `uname -m` (moet `aarch64` tonen).

**WiFi valt weg** -- Schakel WiFi-energiebeheer uit: `sudo iwconfig wlan0 power off`.

## Volgende stappen

- [Kanalen](/nl/channels) -- verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieopties
- [Bijwerken](/nl/install/updating) -- houd OpenClaw up-to-date

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Linux-server](/nl/vps)
- [Platforms](/nl/platforms)
