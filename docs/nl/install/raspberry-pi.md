---
read_when:
    - OpenClaw instellen op een Raspberry Pi
    - OpenClaw uitvoeren op ARM-apparaten
    - Een goedkope, altijd ingeschakelde persoonlijke AI bouwen
summary: Draai OpenClaw op een Raspberry Pi voor altijd beschikbare self-hosting
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T17:44:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

Voer een persistente, altijd actieve OpenClaw Gateway uit op een Raspberry Pi. Omdat de Pi alleen de Gateway is (modellen draaien in de cloud via API), kan zelfs een bescheiden Pi de werklast goed aan — typische hardwarekosten zijn **$35–80 eenmalig**, zonder maandelijkse kosten.

## Hardwarecompatibiliteit

| Pi-model    | RAM    | Werkt? | Opmerkingen                         |
| ----------- | ------ | ------ | ----------------------------------- |
| Pi 5        | 4/8 GB | Beste  | Snelste, aanbevolen.                |
| Pi 4        | 4 GB   | Goed   | Ideaal voor de meeste gebruikers.   |
| Pi 4        | 2 GB   | OK     | Voeg swap toe.                      |
| Pi 4        | 1 GB   | Krap   | Mogelijk met swap, minimale config. |
| Pi 3B+      | 1 GB   | Traag  | Werkt, maar langzaam.               |
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

## Installatie

<Steps>
  <Step title="Flash the OS">
    Gebruik **Raspberry Pi OS Lite (64-bit)** -- geen desktop nodig voor een headless server.

    1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Kies OS: **Raspberry Pi OS Lite (64-bit)**.
    3. Configureer vooraf in het instellingenvenster:
       - Hostnaam: `gateway-host`
       - Schakel SSH in
       - Stel gebruikersnaam en wachtwoord in
       - Configureer WiFi (als je geen Ethernet gebruikt)
    4. Flash naar je SD-kaart of USB-schijf, plaats deze en start de Pi op.

  </Step>

  <Step title="Connect via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Update the system">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Install Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Add swap (important for 2 GB or less)">
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

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Volg de wizard. API-sleutels worden aanbevolen boven OAuth voor headless apparaten. Telegram is het eenvoudigste kanaal om mee te beginnen.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    Haal op je computer een dashboard-URL op van de Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Maak vervolgens een SSH-tunnel in een andere terminal:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Open de afgedrukte URL in je lokale browser. Zie [Tailscale-integratie](/nl/gateway/tailscale) voor altijd beschikbare externe toegang.

  </Step>
</Steps>

## Prestatietips

**Gebruik een USB-SSD** -- SD-kaarten zijn traag en slijten. Een USB-SSD verbetert de prestaties aanzienlijk. Zie de [Pi USB-opstartgids](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Schakel modulecompilatiecache in** -- Versnelt herhaalde CLI-aanroepen op Pi-hosts met lager vermogen:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` houdt routinematige Gateway-herstarts binnen hetzelfde proces, waardoor extra procesoverdrachten worden vermeden en PID-tracking eenvoudig blijft op kleine hosts.

**Verminder geheugengebruik** -- Maak voor headless installaties GPU-geheugen vrij en schakel ongebruikte services uit:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd drop-in voor stabiele herstarts** -- Als deze Pi vooral OpenClaw draait, voeg dan een service-drop-in toe:

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

Voer daarna `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` uit. Schakel op een headless Pi ook eenmalig lingering in zodat de gebruikersservice blijft draaien na uitloggen: `sudo loginctl enable-linger "$(whoami)"`.

## Aanbevolen modelconfiguratie

Omdat de Pi alleen de Gateway draait, gebruik je cloud-gehoste API-modellen:

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

Draai geen lokale LLM's op een Pi — zelfs kleine modellen zijn te traag om bruikbaar te zijn. Laat Claude of GPT het modelwerk doen.

## Opmerkingen over ARM-binaries

De meeste OpenClaw-functies werken zonder wijzigingen op ARM64 (Node.js, Telegram, WhatsApp/Baileys, Chromium). De binaries waarvoor soms geen ARM-builds beschikbaar zijn, zijn meestal optionele Go/Rust CLI-tools die door Skills worden meegeleverd. Controleer de releasepagina van een ontbrekende binary op `linux-arm64` / `aarch64`-artefacten voordat je terugvalt op bouwen vanuit broncode.

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

**Onvoldoende geheugen** -- Controleer met `free -h` of swap actief is. Schakel ongebruikte services uit (`sudo systemctl disable cups bluetooth avahi-daemon`). Gebruik alleen API-gebaseerde modellen.

**Trage prestaties** -- Gebruik een USB-SSD in plaats van een SD-kaart. Controleer op CPU-throttling met `vcgencmd get_throttled` (zou `0x0` moeten teruggeven).

**Service start niet** -- Controleer logs met `journalctl --user -u openclaw-gateway.service --no-pager -n 100` en voer `openclaw doctor --non-interactive` uit. Als dit een headless Pi is, controleer dan ook of lingering is ingeschakeld: `sudo loginctl enable-linger "$(whoami)"`.

**ARM-binaryproblemen** -- Als een skill faalt met "exec format error", controleer dan of de binary een ARM64-build heeft. Controleer de architectuur met `uname -m` (zou `aarch64` moeten tonen).

**WiFi valt weg** -- Schakel energiebeheer voor WiFi uit: `sudo iwconfig wlan0 power off`.

## Volgende stappen

- [Kanalen](/nl/channels) -- verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieopties
- [Bijwerken](/nl/install/updating) -- houd OpenClaw up-to-date

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Linux-server](/nl/vps)
- [Platformen](/nl/platforms)
