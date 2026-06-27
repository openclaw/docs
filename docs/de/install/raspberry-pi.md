---
read_when:
    - OpenClaw auf einem Raspberry Pi einrichten
    - OpenClaw auf ARM-Geräten ausführen
    - Einen günstigen, ständig verfügbaren persönlichen KI-Assistenten aufbauen
summary: OpenClaw auf einem Raspberry Pi für durchgehend aktives Self-Hosting hosten
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T17:39:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

Betreiben Sie einen persistenten, dauerhaft aktiven OpenClaw Gateway auf einem Raspberry Pi. Da der Pi nur der Gateway ist (Modelle laufen per API in der Cloud), bewältigt selbst ein einfacher Pi die Arbeitslast gut — typische Hardwarekosten liegen bei **35–80 US-Dollar einmalig**, ohne monatliche Gebühren.

## Hardwarekompatibilität

| Pi-Modell   | RAM    | Funktioniert? | Hinweise                                  |
| ----------- | ------ | -------------- | ----------------------------------------- |
| Pi 5        | 4/8 GB | Am besten      | Am schnellsten, empfohlen.                |
| Pi 4        | 4 GB   | Gut            | Ideal für die meisten Nutzer.             |
| Pi 4        | 2 GB   | OK             | Swap hinzufügen.                          |
| Pi 4        | 1 GB   | Knapp          | Mit Swap und minimaler Konfiguration möglich. |
| Pi 3B+      | 1 GB   | Langsam        | Funktioniert, aber träge.                 |
| Pi Zero 2 W | 512 MB | Nein           | Nicht empfohlen.                          |

**Minimum:** 1 GB RAM, 1 Kern, 500 MB freier Speicherplatz, 64-Bit-OS.
**Empfohlen:** 2 GB+ RAM, 16 GB+ SD-Karte (oder USB-SSD), Ethernet.

## Voraussetzungen

- Raspberry Pi 4 oder 5 mit 2 GB+ RAM (4 GB empfohlen)
- MicroSD-Karte (16 GB+) oder USB-SSD (bessere Leistung)
- Offizielles Pi-Netzteil
- Netzwerkverbindung (Ethernet oder WLAN)
- 64-Bit Raspberry Pi OS (erforderlich -- verwenden Sie kein 32-Bit)
- Etwa 30 Minuten

## Einrichtung

<Steps>
  <Step title="Flash the OS">
    Verwenden Sie **Raspberry Pi OS Lite (64-bit)** -- für einen headless Server wird kein Desktop benötigt.

    1. Laden Sie den [Raspberry Pi Imager](https://www.raspberrypi.com/software/) herunter.
    2. Wählen Sie das OS: **Raspberry Pi OS Lite (64-bit)**.
    3. Konfigurieren Sie im Einstellungsdialog vorab:
       - Hostname: `gateway-host`
       - SSH aktivieren
       - Benutzername und Passwort festlegen
       - WLAN konfigurieren (wenn Sie kein Ethernet verwenden)
    4. Schreiben Sie das Image auf Ihre SD-Karte oder Ihr USB-Laufwerk, stecken Sie es ein und starten Sie den Pi.

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

    Folgen Sie dem Assistenten. API-Schlüssel werden für headless Geräte gegenüber OAuth empfohlen. Telegram ist der einfachste Kanal für den Einstieg.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    Rufen Sie auf Ihrem Computer eine Dashboard-URL vom Pi ab:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Erstellen Sie dann in einem weiteren Terminal einen SSH-Tunnel:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Öffnen Sie die ausgegebene URL in Ihrem lokalen Browser. Für dauerhaft aktiven Remotezugriff siehe [Tailscale-Integration](/de/gateway/tailscale).

  </Step>
</Steps>

## Leistungstipps

**Verwenden Sie eine USB-SSD** -- SD-Karten sind langsam und verschleißen. Eine USB-SSD verbessert die Leistung deutlich. Siehe den [Pi-USB-Boot-Leitfaden](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Modul-Compile-Cache aktivieren** -- Beschleunigt wiederholte CLI-Aufrufe auf leistungsschwächeren Pi-Hosts:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` hält routinemäßige Gateway-Neustarts im Prozess. Dadurch werden zusätzliche Prozessübergaben vermieden und die PID-Verfolgung bleibt auf kleinen Hosts einfach.

**Speichernutzung reduzieren** -- Geben Sie bei headless Setups GPU-Speicher frei und deaktivieren Sie ungenutzte Dienste:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd-Drop-in für stabile Neustarts** -- Wenn dieser Pi hauptsächlich OpenClaw ausführt, fügen Sie ein Service-Drop-in hinzu:

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

Führen Sie dann `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` aus. Aktivieren Sie auf einem headless Pi außerdem einmalig Lingering, damit der Benutzerdienst die Abmeldung übersteht: `sudo loginctl enable-linger "$(whoami)"`.

## Empfohlene Modelleinrichtung

Da der Pi nur den Gateway ausführt, verwenden Sie cloudgehostete API-Modelle:

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

Führen Sie keine lokalen LLMs auf einem Pi aus — selbst kleine Modelle sind zu langsam, um nützlich zu sein. Lassen Sie Claude oder GPT die Modellarbeit erledigen.

## Hinweise zu ARM-Binaries

Die meisten OpenClaw-Funktionen funktionieren unter ARM64 ohne Änderungen (Node.js, Telegram, WhatsApp/Baileys, Chromium). Binaries, für die gelegentlich ARM-Builds fehlen, sind typischerweise optionale Go/Rust-CLI-Tools, die von Skills ausgeliefert werden. Prüfen Sie die Release-Seite eines fehlenden Binaries auf `linux-arm64`- / `aarch64`-Artefakte, bevor Sie auf das Bauen aus dem Quellcode zurückfallen.

## Persistenz und Backups

Der OpenClaw-Status liegt unter:

- `~/.openclaw/` — `openclaw.json`, agentenspezifische `auth-profiles.json`, Kanal-/Provider-Status, Sitzungen.
- `~/.openclaw/workspace/` — Agent-Arbeitsbereich (SOUL.md, Speicher, Artefakte).

Diese Daten überstehen Neustarts. Erstellen Sie einen portablen Snapshot mit:

```bash
openclaw backup create
```

Wenn Sie diese Daten auf einer SSD speichern, verbessern sich sowohl Leistung als auch Lebensdauer gegenüber der SD-Karte.

## Problembehandlung

**Nicht genügend Arbeitsspeicher** -- Prüfen Sie mit `free -h`, ob Swap aktiv ist. Deaktivieren Sie ungenutzte Dienste (`sudo systemctl disable cups bluetooth avahi-daemon`). Verwenden Sie ausschließlich API-basierte Modelle.

**Langsame Leistung** -- Verwenden Sie eine USB-SSD statt einer SD-Karte. Prüfen Sie mit `vcgencmd get_throttled` auf CPU-Drosselung (sollte `0x0` zurückgeben).

**Dienst startet nicht** -- Prüfen Sie die Logs mit `journalctl --user -u openclaw-gateway.service --no-pager -n 100` und führen Sie `openclaw doctor --non-interactive` aus. Wenn dies ein headless Pi ist, prüfen Sie außerdem, ob Lingering aktiviert ist: `sudo loginctl enable-linger "$(whoami)"`.

**ARM-Binary-Probleme** -- Wenn ein Skill mit „exec format error“ fehlschlägt, prüfen Sie, ob das Binary einen ARM64-Build hat. Prüfen Sie die Architektur mit `uname -m` (sollte `aarch64` anzeigen).

**WLAN-Verbindungsabbrüche** -- Deaktivieren Sie die WLAN-Energieverwaltung: `sudo iwconfig wlan0 power off`.

## Nächste Schritte

- [Kanäle](/de/channels) -- Telegram, WhatsApp, Discord und weitere verbinden
- [Gateway-Konfiguration](/de/gateway/configuration) -- alle Konfigurationsoptionen
- [Aktualisierung](/de/install/updating) -- OpenClaw aktuell halten

## Verwandt

- [Installationsübersicht](/de/install)
- [Linux-Server](/de/vps)
- [Plattformen](/de/platforms)
