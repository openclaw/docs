---
read_when:
    - OpenClaw auf einem Raspberry Pi einrichten
    - OpenClaw auf ARM-Geräten ausführen
    - Eine kostengünstige, jederzeit verfügbare persönliche KI entwickeln
summary: Hosten Sie OpenClaw auf einem Raspberry Pi für dauerhaft verfügbares Self-Hosting
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T15:34:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Betreiben Sie einen persistenten, ständig verfügbaren OpenClaw Gateway auf einem Raspberry Pi. Da der Pi nur als Gateway dient (die Modelle werden über eine API in der Cloud ausgeführt), bewältigt selbst ein leistungsschwächerer Pi die Arbeitslast problemlos – die typischen Hardwarekosten betragen einmalig **$35-80**, ohne monatliche Gebühren.

## Hardwarekompatibilität

| Pi-Modell   | RAM    | Geeignet? | Hinweise                                    |
| ----------- | ------ | --------- | ------------------------------------------- |
| Pi 5        | 4/8 GB | Optimal   | Am schnellsten, empfohlen.                  |
| Pi 4        | 4 GB   | Gut       | Ideal für die meisten Benutzer.             |
| Pi 4        | 2 GB   | Ausreichend | Swap hinzufügen.                          |
| Pi 4        | 1 GB   | Knapp     | Mit Swap und minimaler Konfiguration möglich. |
| Pi 3B+      | 1 GB   | Langsam   | Funktioniert, reagiert aber träge.           |
| Pi Zero 2 W | 512 MB | Nein      | Nicht empfohlen.                             |

**Minimum:** 1 GB RAM, 1 Kern, 500 MB freier Speicherplatz, 64-Bit-Betriebssystem.
**Empfohlen:** 2 GB+ RAM, 16 GB+ SD-Karte (oder USB-SSD), Ethernet.

## Voraussetzungen

- Raspberry Pi 4 oder 5 mit 2 GB+ RAM (4 GB empfohlen)
- MicroSD-Karte (16 GB+) oder USB-SSD (bessere Leistung)
- Offizielles Pi-Netzteil
- Netzwerkverbindung (Ethernet oder WLAN)
- 64-Bit-Version von Raspberry Pi OS (erforderlich – verwenden Sie nicht die 32-Bit-Version)
- Etwa 30 Minuten

## Einrichtung

<Steps>
  <Step title="Betriebssystem aufspielen">
    Verwenden Sie **Raspberry Pi OS Lite (64-bit)** – für einen Headless-Server ist keine Desktop-Umgebung erforderlich.

    1. Laden Sie [Raspberry Pi Imager](https://www.raspberrypi.com/software/) herunter.
    2. Wählen Sie als Betriebssystem **Raspberry Pi OS Lite (64-bit)**.
    3. Konfigurieren Sie im Einstellungsdialog vorab:
       - Hostname: `gateway-host`
       - SSH aktivieren
       - Benutzernamen und Passwort festlegen
       - WLAN konfigurieren (falls Sie kein Ethernet verwenden)
    4. Spielen Sie das Image auf Ihre SD-Karte oder Ihr USB-Laufwerk auf, setzen Sie das Medium ein und starten Sie den Pi.

  </Step>

  <Step title="Über SSH verbinden">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="System aktualisieren">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Zeitzone festlegen (wichtig für Cron und Erinnerungen)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24 installieren">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Swap hinzufügen (wichtig bei 2 GB oder weniger)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Swappiness für Geräte mit wenig RAM reduzieren
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw installieren">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --install-daemon
    ```

    Folgen Sie dem Assistenten. Für Headless-Geräte werden API-Schlüssel anstelle von OAuth empfohlen. Telegram ist für den Einstieg der einfachste Kanal.

  </Step>

  <Step title="Überprüfen">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Auf die Control UI zugreifen">
    Rufen Sie auf Ihrem Computer eine Dashboard-URL vom Pi ab:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Erstellen Sie anschließend in einem anderen Terminal einen SSH-Tunnel:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Öffnen Sie die ausgegebene URL in Ihrem lokalen Browser. Informationen zum permanenten Remotezugriff finden Sie unter [Tailscale-Integration](/de/gateway/tailscale).

  </Step>
</Steps>

## Tipps zur Leistung

**Verwenden Sie eine USB-SSD** – SD-Karten sind langsam und verschleißen. Eine USB-SSD verbessert die Leistung erheblich und hält mehr Schreibzyklen stand; verwenden Sie sie für `OPENCLAW_STATE_DIR`, wenn das Betriebssystem auf der SD-Karte verbleibt. Weitere Informationen finden Sie im [Pi-Leitfaden zum Booten über USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Modul-Kompilierungscache aktivieren** – Beschleunigt wiederholte CLI-Aufrufe auf leistungsschwächeren Pi-Hosts. `OPENCLAW_NO_RESPAWN=1` sorgt dafür, dass routinemäßige Neustarts des Gateway innerhalb desselben Prozesses erfolgen. Dadurch werden zusätzliche Prozessübergaben vermieden und die PID-Verfolgung bleibt auf kleinen Hosts übersichtlich:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Verwenden Sie `/var/tmp` und nicht `/tmp` – einige Distributionen leeren `/tmp` beim Systemstart, wodurch der vorgewärmte Cache verloren geht.

**Speichernutzung reduzieren** – Geben Sie bei Headless-Konfigurationen GPU-Speicher frei und deaktivieren Sie nicht verwendete Dienste:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd-Drop-in für stabile Neustarts** – Wenn auf diesem Pi hauptsächlich OpenClaw ausgeführt wird, fügen Sie ein Service-Drop-in hinzu:

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

Führen Sie anschließend `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` aus. Aktivieren Sie auf einem Headless-Pi außerdem einmalig Lingering, damit der Benutzerdienst auch nach der Abmeldung weiterläuft: `sudo loginctl enable-linger "$(whoami)"`.

## Empfohlene Modellkonfiguration

Da auf dem Pi nur das Gateway ausgeführt wird, sollten Sie in der Cloud gehostete API-Modelle verwenden. Führen Sie keine lokalen LLMs auf einem Pi aus; selbst kleine Modelle sind zu langsam, um sinnvoll eingesetzt werden zu können:

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

## Hinweise zu ARM-Binärdateien

Die meisten OpenClaw-Funktionen laufen ohne Änderungen auf ARM64 (Node.js, Telegram, WhatsApp/Baileys, Chromium). Bei den Binärdateien, für die gelegentlich keine ARM-Builds verfügbar sind, handelt es sich üblicherweise um optionale Go-/Rust-CLI-Werkzeuge, die von Skills bereitgestellt werden. Überprüfen Sie die Architektur mit `uname -m` (die Ausgabe sollte `aarch64` lauten), und suchen Sie anschließend auf der Release-Seite einer fehlenden Binärdatei nach `linux-arm64`- bzw. `aarch64`-Artefakten, bevor Sie als Ausweichlösung eine Erstellung aus dem Quellcode erwägen.

## Persistenz und Sicherungen

Der OpenClaw-Status befindet sich unter:

- `~/.openclaw/` – `openclaw.json`, agentenspezifische `auth-profiles.json`, Kanal-/Provider-Status und Sitzungen.
- `~/.openclaw/workspace/` – Agent-Arbeitsbereich (SOUL.md, Speicher, Artefakte).

Diese Daten bleiben bei Neustarts erhalten und profitieren sowohl bei der Leistung als auch bei der Lebensdauer von einer SSD anstelle einer SD-Karte. Erstellen Sie einen portablen Snapshot mit:

```bash
openclaw backup create
```

## Fehlerbehebung

**Nicht genügend Arbeitsspeicher** – Überprüfen Sie mit `free -h`, ob Swap aktiv ist. Deaktivieren Sie nicht verwendete Dienste (`sudo systemctl disable cups bluetooth avahi-daemon`). Verwenden Sie ausschließlich API-basierte Modelle.

**Langsame Leistung** – Verwenden Sie eine USB-SSD anstelle einer SD-Karte. Prüfen Sie mit `vcgencmd get_throttled`, ob die CPU gedrosselt wird (die Ausgabe sollte `0x0` lauten).

**Dienst startet nicht** – Prüfen Sie die Protokolle mit `journalctl --user -u openclaw-gateway.service --no-pager -n 100` und führen Sie `openclaw doctor --non-interactive` aus. Überprüfen Sie bei einem Headless-Pi außerdem, ob Lingering aktiviert ist: `sudo loginctl enable-linger "$(whoami)"`.

**Probleme mit ARM-Binärdateien** – Wenn ein Skill mit „exec format error“ fehlschlägt, prüfen Sie, ob für die Binärdatei ein ARM64-Build verfügbar ist. Überprüfen Sie die Architektur mit `uname -m` (die Ausgabe sollte `aarch64` lauten).

**WLAN-Verbindungsabbrüche** – Deaktivieren Sie die WLAN-Energieverwaltung: `sudo iwconfig wlan0 power off`.

## Nächste Schritte

- [Kanäle](/de/channels) – Telegram, WhatsApp, Discord und weitere Dienste verbinden
- [Gateway-Konfiguration](/de/gateway/configuration) – alle Konfigurationsoptionen
- [Aktualisierung](/de/install/updating) – OpenClaw auf dem neuesten Stand halten

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Linux-Server](/de/vps)
- [Plattformen](/de/platforms)
