---
read_when:
    - OpenClaw instellen op een Raspberry Pi
    - OpenClaw uitvoeren op ARM-apparaten
    - Een betaalbare, altijd actieve persoonlijke AI bouwen
summary: Host OpenClaw op een Raspberry Pi voor altijd actieve zelfhosting
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T09:00:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Voer een permanente, altijd actieve OpenClaw Gateway uit op een Raspberry Pi. Omdat de Pi alleen de Gateway is (modellen worden via een API in de cloud uitgevoerd), kan zelfs een bescheiden Pi de werklast goed aan — de gebruikelijke hardwarekosten bedragen eenmalig **$35-80**, zonder maandelijkse kosten.

## Hardwarecompatibiliteit

| Pi-model    | RAM    | Werkt?     | Opmerkingen                                 |
| ----------- | ------ | ---------- | ------------------------------------------- |
| Pi 5        | 4/8 GB | Beste      | Snelste optie, aanbevolen.                  |
| Pi 4        | 4 GB   | Goed       | Ideale keuze voor de meeste gebruikers.     |
| Pi 4        | 2 GB   | Redelijk   | Voeg swap toe.                              |
| Pi 4        | 1 GB   | Krap       | Mogelijk met swap en minimale configuratie. |
| Pi 3B+      | 1 GB   | Traag      | Werkt, maar is langzaam.                    |
| Pi Zero 2 W | 512 MB | Nee        | Niet aanbevolen.                            |

**Minimum:** 1 GB RAM, 1 core, 500 MB vrije schijfruimte, 64-bits besturingssysteem.
**Aanbevolen:** 2 GB+ RAM, SD-kaart van 16 GB+ (of USB-SSD), Ethernet.

## Vereisten

- Raspberry Pi 4 of 5 met 2 GB+ RAM (4 GB aanbevolen)
- MicroSD-kaart (16 GB+) of USB-SSD (betere prestaties)
- Officiële Pi-voeding
- Netwerkverbinding (Ethernet of wifi)
- 64-bits Raspberry Pi OS (vereist — gebruik geen 32-bits versie)
- Ongeveer 30 minuten

## Installatie

<Steps>
  <Step title="Het besturingssysteem flashen">
    Gebruik **Raspberry Pi OS Lite (64-bit)** — voor een headless server is geen desktopomgeving nodig.

    1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Kies als besturingssysteem: **Raspberry Pi OS Lite (64-bit)**.
    3. Configureer vooraf in het instellingenvenster:
       - Hostnaam: `gateway-host`
       - Schakel SSH in
       - Stel een gebruikersnaam en wachtwoord in
       - Configureer wifi (als je geen Ethernet gebruikt)
    4. Flash je SD-kaart of USB-schijf, plaats deze en start de Pi op.

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

    # Tijdzone instellen (belangrijk voor cron en herinneringen)
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

  <Step title="Swap toevoegen (belangrijk bij 2 GB of minder)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Swappiness verlagen voor apparaten met weinig RAM
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw installeren">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="De onboarding uitvoeren">
    ```bash
    openclaw onboard --install-daemon
    ```

    Volg de wizard. Voor headless apparaten worden API-sleutels aanbevolen boven OAuth. Telegram is het eenvoudigste kanaal om mee te beginnen.

  </Step>

  <Step title="Controleren">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="De bedieningsinterface openen">
    Haal op je computer een dashboard-URL op van de Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Maak vervolgens in een andere terminal een SSH-tunnel:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Open de weergegeven URL in je lokale browser. Zie [Tailscale-integratie](/nl/gateway/tailscale) voor permanente externe toegang.

  </Step>
</Steps>

## Prestatietips

**Gebruik een USB-SSD** — SD-kaarten zijn traag en slijten. Een USB-SSD verbetert de prestaties aanzienlijk en doorstaat meer schrijfcycli; gebruik deze voor `OPENCLAW_STATE_DIR` als je het besturingssysteem op de SD-kaart laat staan. Zie de [handleiding voor het opstarten van de Pi via USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Schakel de compileercache voor modules in** — Dit versnelt herhaalde CLI-aanroepen op minder krachtige Pi-hosts. `OPENCLAW_NO_RESPAWN=1` zorgt ervoor dat normale herstarts van de Gateway binnen hetzelfde proces plaatsvinden, waardoor extra procesoverdrachten worden vermeden en PID-tracering op kleine hosts eenvoudig blijft:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Gebruik `/var/tmp` en niet `/tmp` — sommige distributies wissen `/tmp` tijdens het opstarten, waardoor de opgewarmde cache verloren gaat.

**Verminder het geheugengebruik** — Maak voor headless installaties GPU-geheugen vrij en schakel ongebruikte services uit:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd-drop-in voor stabiele herstarts** — Als deze Pi hoofdzakelijk OpenClaw uitvoert, voeg dan een service-drop-in toe:

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

Voer vervolgens `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` uit. Schakel op een headless Pi ook eenmalig lingering in, zodat de gebruikersservice actief blijft na het afmelden: `sudo loginctl enable-linger "$(whoami)"`.

## Aanbevolen modelconfiguratie

Omdat de Pi alleen de Gateway uitvoert, moet je API-modellen uit de cloud gebruiken — voer geen lokale LLM's uit op een Pi; zelfs kleine modellen zijn te traag om bruikbaar te zijn:

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

## Opmerkingen over ARM-binaire bestanden

De meeste functies van OpenClaw werken zonder wijzigingen op ARM64 (Node.js, Telegram, WhatsApp/Baileys, Chromium). De binaire bestanden waarvoor soms geen ARM-build beschikbaar is, zijn doorgaans optionele CLI-hulpprogramma's in Go of Rust die door Skills worden meegeleverd. Controleer de architectuur met `uname -m` (dit moet `aarch64` weergeven) en controleer vervolgens op de releasepagina van een ontbrekend binair bestand of er `linux-arm64`- of `aarch64`-artefacten beschikbaar zijn voordat je terugvalt op compileren vanuit de broncode.

## Persistentie en back-ups

De statusgegevens van OpenClaw bevinden zich in:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agent, kanaal- en providerstatus, sessies.
- `~/.openclaw/workspace/` — werkruimte van de agent (SOUL.md, geheugen, artefacten).

Deze gegevens blijven na herstarts behouden en profiteren zowel qua prestaties als levensduur van een SSD in plaats van een SD-kaart. Maak een overdraagbare momentopname met:

```bash
openclaw backup create
```

## Problemen oplossen

**Onvoldoende geheugen** — Controleer met `free -h` of swap actief is. Schakel ongebruikte services uit (`sudo systemctl disable cups bluetooth avahi-daemon`). Gebruik uitsluitend API-gebaseerde modellen.

**Trage prestaties** — Gebruik een USB-SSD in plaats van een SD-kaart. Controleer met `vcgencmd get_throttled` op CPU-begrenzing (dit moet `0x0` retourneren).

**De service start niet** — Controleer de logboeken met `journalctl --user -u openclaw-gateway.service --no-pager -n 100` en voer `openclaw doctor --non-interactive` uit. Controleer bij een headless Pi ook of lingering is ingeschakeld: `sudo loginctl enable-linger "$(whoami)"`.

**Problemen met ARM-binaire bestanden** — Als een skill mislukt met "exec format error", controleer dan of er een ARM64-build van het binaire bestand bestaat. Controleer de architectuur met `uname -m` (dit moet `aarch64` weergeven).

**Wifi-verbinding valt weg** — Schakel energiebeheer voor wifi uit: `sudo iwconfig wlan0 power off`.

## Volgende stappen

- [Kanalen](/nl/channels) — verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) — alle configuratieopties
- [Bijwerken](/nl/install/updating) — houd OpenClaw up-to-date

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Linux-server](/nl/vps)
- [Platformen](/nl/platforms)
