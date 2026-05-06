---
read_when:
    - OpenClaw instellen op een Raspberry Pi
    - OpenClaw uitvoeren op ARM-apparaten
    - Een goedkope, altijd actieve persoonlijke AI bouwen
summary: Draai OpenClaw op een Raspberry Pi voor altijd actieve zelfhosting
title: Raspberry Pi
x-i18n:
    generated_at: "2026-05-06T09:20:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96df076c2707b0b27751d452f15fad774356a86e96d10bce998581235776c4bc
    source_path: install/raspberry-pi.md
    workflow: 16
---

Voer een permanente, altijd actieve OpenClaw Gateway uit op een Raspberry Pi. Omdat de Pi alleen de Gateway is (modellen draaien in de cloud via API), kan zelfs een bescheiden Pi de workload goed aan — typische hardwarekosten zijn **$35–80 eenmalig**, zonder maandelijkse kosten.

## Hardwarecompatibiliteit

| Pi-model    | RAM    | Werkt? | Opmerkingen                         |
| ----------- | ------ | ------ | ----------------------------------- |
| Pi 5        | 4/8 GB | Beste  | Snelst, aanbevolen.                 |
| Pi 4        | 4 GB   | Goed   | Ideale keuze voor de meeste gebruikers. |
| Pi 4        | 2 GB   | OK     | Voeg swap toe.                      |
| Pi 4        | 1 GB   | Krap   | Mogelijk met swap, minimale configuratie. |
| Pi 3B+      | 1 GB   | Traag  | Werkt, maar traag.                  |
| Pi Zero 2 W | 512 MB | Nee    | Niet aanbevolen.                    |

**Minimum:** 1 GB RAM, 1 core, 500 MB vrije schijfruimte, 64-bits OS.
**Aanbevolen:** 2 GB+ RAM, 16 GB+ SD-kaart (of USB-SSD), Ethernet.

## Vereisten

- Raspberry Pi 4 of 5 met 2 GB+ RAM (4 GB aanbevolen)
- MicroSD-kaart (16 GB+) of USB-SSD (betere prestaties)
- Officiële Pi-voeding
- Netwerkverbinding (Ethernet of WiFi)
- 64-bits Raspberry Pi OS (vereist -- gebruik geen 32-bits)
- Ongeveer 30 minuten

## Instellen

<Steps>
  <Step title="Flash het OS">
    Gebruik **Raspberry Pi OS Lite (64-bit)** -- geen desktop nodig voor een headless server.

    1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Kies OS: **Raspberry Pi OS Lite (64-bit)**.
    3. Configureer vooraf in het instellingendialoog:
       - Hostnaam: `gateway-host`
       - Schakel SSH in
       - Stel gebruikersnaam en wachtwoord in
       - Configureer WiFi (als je geen Ethernet gebruikt)
    4. Flash naar je SD-kaart of USB-schijf, plaats deze en start de Pi op.

  </Step>

  <Step title="Maak verbinding via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Werk het systeem bij">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Installeer Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Voeg swap toe (belangrijk voor 2 GB of minder)">
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

  <Step title="Installeer OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Voer onboarding uit">
    ```bash
    openclaw onboard --install-daemon
    ```

    Volg de wizard. API-sleutels worden aanbevolen boven OAuth voor headless apparaten. Telegram is het eenvoudigste kanaal om mee te beginnen.

  </Step>

  <Step title="Verifieer">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Open de Control UI">
    Haal op je computer een dashboard-URL op vanaf de Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Maak vervolgens een SSH-tunnel in een andere terminal:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Open de afgedrukte URL in je lokale browser. Zie [Tailscale-integratie](/nl/gateway/tailscale) voor permanente externe toegang.

  </Step>
</Steps>

## Prestatietips

**Gebruik een USB-SSD** -- SD-kaarten zijn traag en slijten. Een USB-SSD verbetert de prestaties aanzienlijk. Zie de [Pi USB-opstartgids](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Schakel module-compilecache in** -- Versnelt herhaalde CLI-aanroepen op Pi-hosts met lager vermogen:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Verminder geheugengebruik** -- Maak voor headless setups GPU-geheugen vrij en schakel ongebruikte services uit:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd drop-in voor stabiele herstarts** -- Als deze Pi voornamelijk OpenClaw draait, voeg dan een service-drop-in toe:

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

Voer daarna `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` uit. Schakel op een headless Pi ook eenmalig lingering in, zodat de gebruikersservice blijft draaien na uitloggen: `sudo loginctl enable-linger "$(whoami)"`.

## Aanbevolen modelconfiguratie

Omdat de Pi alleen de Gateway draait, gebruik je cloudgehoste API-modellen:

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

Draai geen lokale LLM's op een Pi — zelfs kleine modellen zijn te traag om nuttig te zijn. Laat Claude of GPT het modelwerk doen.

## Opmerkingen over ARM-binaries

De meeste OpenClaw-functies werken zonder wijzigingen op ARM64 (Node.js, Telegram, WhatsApp/Baileys, Chromium). De binaries waarvoor af en toe ARM-builds ontbreken, zijn doorgaans optionele Go/Rust CLI-tools die door Skills worden meegeleverd. Controleer de releasepagina van een ontbrekende binary op `linux-arm64`- / `aarch64`-artefacten voordat je terugvalt op bouwen vanaf broncode.

## Persistentie en back-ups

OpenClaw-status staat onder:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, kanaal-/providerstatus, sessies.
- `~/.openclaw/workspace/` — agentwerkruimte (SOUL.md, geheugen, artefacten).

Deze blijven behouden na herstarts. Maak een draagbare snapshot met:

```bash
openclaw backup create
```

Als je deze op een SSD bewaart, verbeteren zowel de prestaties als de levensduur ten opzichte van de SD-kaart.

## Probleemoplossing

**Onvoldoende geheugen** -- Controleer met `free -h` of swap actief is. Schakel ongebruikte services uit (`sudo systemctl disable cups bluetooth avahi-daemon`). Gebruik uitsluitend API-gebaseerde modellen.

**Trage prestaties** -- Gebruik een USB-SSD in plaats van een SD-kaart. Controleer CPU-throttling met `vcgencmd get_throttled` (zou `0x0` moeten retourneren).

**Service start niet** -- Controleer logs met `journalctl --user -u openclaw-gateway.service --no-pager -n 100` en voer `openclaw doctor --non-interactive` uit. Als dit een headless Pi is, controleer dan ook of lingering is ingeschakeld: `sudo loginctl enable-linger "$(whoami)"`.

**ARM-binaryproblemen** -- Als een skill mislukt met "exec format error", controleer dan of de binary een ARM64-build heeft. Verifieer de architectuur met `uname -m` (zou `aarch64` moeten tonen).

**WiFi valt weg** -- Schakel WiFi-energiebeheer uit: `sudo iwconfig wlan0 power off`.

## Volgende stappen

- [Kanalen](/nl/channels) -- verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieopties
- [Bijwerken](/nl/install/updating) -- houd OpenClaw up-to-date

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Linux-server](/nl/vps)
- [Platforms](/nl/platforms)
