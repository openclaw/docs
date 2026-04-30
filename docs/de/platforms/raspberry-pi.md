---
read_when:
    - OpenClaw auf einem Raspberry Pi einrichten
    - OpenClaw auf ARM-Geräten ausführen
    - Eine günstige, ständig verfügbare persönliche KI aufbauen
summary: OpenClaw auf Raspberry Pi (kostengünstiges selbstgehostetes Setup)
title: Raspberry Pi (Plattform)
x-i18n:
    generated_at: "2026-04-30T07:03:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# OpenClaw auf Raspberry Pi

## Ziel

Betreiben Sie einen persistenten, immer verfügbaren OpenClaw Gateway auf einem Raspberry Pi für **~35-80 $** einmalige Kosten (keine monatlichen Gebühren).

Perfekt für:

- Persönlicher KI-Assistent rund um die Uhr
- Hub für Heimautomatisierung
- Stromsparender, jederzeit verfügbarer Telegram-/WhatsApp-Bot

## Hardwareanforderungen

| Pi-Modell       | RAM     | Funktioniert? | Hinweise                           |
| --------------- | ------- | -------------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ Am besten   | Schnellster, empfohlen             |
| **Pi 4**        | 4GB     | ✅ Gut         | Beste Wahl für die meisten Nutzer  |
| **Pi 4**        | 2GB     | ✅ OK          | Funktioniert, Swap hinzufügen      |
| **Pi 4**        | 1GB     | ⚠️ Knapp       | Mit Swap möglich, minimale Konfig. |
| **Pi 3B+**      | 1GB     | ⚠️ Langsam     | Funktioniert, aber träge           |
| **Pi Zero 2 W** | 512MB   | ❌             | Nicht empfohlen                    |

**Mindestanforderungen:** 1GB RAM, 1 Kern, 500MB Speicherplatz  
**Empfohlen:** 2GB+ RAM, 64-Bit-OS, 16GB+ SD-Karte (oder USB-SSD)

## Was Sie benötigen

- Raspberry Pi 4 oder 5 (2GB+ empfohlen)
- MicroSD-Karte (16GB+) oder USB-SSD (bessere Leistung)
- Netzteil (offizielles Pi-Netzteil empfohlen)
- Netzwerkverbindung (Ethernet oder WLAN)
- ~30 Minuten

## 1) OS flashen

Verwenden Sie **Raspberry Pi OS Lite (64-bit)** — für einen Headless-Server ist kein Desktop erforderlich.

1. Laden Sie den [Raspberry Pi Imager](https://www.raspberrypi.com/software/) herunter
2. Wählen Sie das OS: **Raspberry Pi OS Lite (64-bit)**
3. Klicken Sie auf das Zahnradsymbol (⚙️) zur Vorkonfiguration:
   - Hostname festlegen: `gateway-host`
   - SSH aktivieren
   - Benutzername/Passwort festlegen
   - WLAN konfigurieren (falls Sie kein Ethernet verwenden)
4. Flashen Sie auf Ihre SD-Karte / Ihr USB-Laufwerk
5. Stecken Sie sie ein und starten Sie den Pi

## 2) Per SSH verbinden

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) Systemeinrichtung

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Node.js 24 (ARM64) installieren

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) Swap hinzufügen (wichtig bei 2GB oder weniger)

Swap verhindert Abstürze durch Speichermangel:

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

## 6) OpenClaw installieren

### Option A: Standardinstallation (empfohlen)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Option B: hackbare Installation (zum Experimentieren)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Die hackbare Installation gibt Ihnen direkten Zugriff auf Logs und Code — nützlich zum Debuggen ARM-spezifischer Probleme.

## 7) Onboarding ausführen

```bash
openclaw onboard --install-daemon
```

Folgen Sie dem Assistenten:

1. **Gateway-Modus:** Lokal
2. **Auth:** API-Schlüssel empfohlen (OAuth kann auf einem Headless-Pi unzuverlässig sein)
3. **Kanäle:** Telegram ist für den Einstieg am einfachsten
4. **Daemon:** Ja (systemd)

## 8) Installation prüfen

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) Auf das OpenClaw-Dashboard zugreifen

Ersetzen Sie `user@gateway-host` durch Ihren Pi-Benutzernamen und Hostnamen oder Ihre IP-Adresse.

Bitten Sie den Pi auf Ihrem Computer, eine neue Dashboard-URL auszugeben:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Der Befehl gibt `Dashboard URL:` aus. Je nachdem, wie `gateway.auth.token`
konfiguriert ist, kann die URL ein einfacher Link wie `http://127.0.0.1:18789/`
sein oder `#token=...` enthalten.

Erstellen Sie in einem weiteren Terminal auf Ihrem Computer den SSH-Tunnel:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Öffnen Sie anschließend die ausgegebene Dashboard-URL in Ihrem lokalen Browser.

Wenn die UI nach Shared-Secret-Authentifizierung fragt, fügen Sie das konfigurierte Token oder Passwort
in die Control UI-Einstellungen ein. Verwenden Sie für Token-Authentifizierung `gateway.auth.token` (oder
`OPENCLAW_GATEWAY_TOKEN`).

Für dauerhaft verfügbaren Remote-Zugriff siehe [Tailscale](/de/gateway/tailscale).

---

## Leistungsoptimierungen

### USB-SSD verwenden (große Verbesserung)

SD-Karten sind langsam und verschleißen. Eine USB-SSD verbessert die Leistung deutlich:

```bash
# Check if booting from USB
lsblk
```

Siehe [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) für die Einrichtung.

### CLI-Start beschleunigen (Modul-Compile-Cache)

Aktivieren Sie auf leistungsschwächeren Pi-Hosts den Modul-Compile-Cache von Node, damit wiederholte CLI-Ausführungen schneller sind:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Hinweise:

- `NODE_COMPILE_CACHE` beschleunigt nachfolgende Ausführungen (`status`, `health`, `--help`).
- `/var/tmp` übersteht Neustarts besser als `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` vermeidet zusätzliche Startkosten durch CLI-Selbstneustart.
- Der erste Lauf wärmt den Cache auf; spätere Läufe profitieren am meisten.

### systemd-Startoptimierung (optional)

Wenn dieser Pi hauptsächlich OpenClaw ausführt, fügen Sie ein Service-Drop-in hinzu, um Neustart-
Jitter zu reduzieren und die Startumgebung stabil zu halten:

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

Anschließend anwenden:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Wenn möglich, halten Sie OpenClaw-Status/Cache auf SSD-gestütztem Speicher, um Random-I/O-
Engpässe der SD-Karte bei Kaltstarts zu vermeiden.

Wenn dies ein Headless-Pi ist, aktivieren Sie Lingering einmalig, damit der Benutzer-Service nach
dem Abmelden weiterläuft:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Wie `Restart=`-Richtlinien bei automatisierter Wiederherstellung helfen:
[systemd kann die Dienstwiederherstellung automatisieren](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Speicherverbrauch reduzieren

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### Ressourcen überwachen

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## ARM-spezifische Hinweise

### Binärkompatibilität

Die meisten OpenClaw-Funktionen funktionieren auf ARM64, einige externe Binärdateien benötigen jedoch möglicherweise ARM-Builds:

| Tool               | ARM64-Status | Hinweise                         |
| ------------------ | ------------ | -------------------------------- |
| Node.js            | ✅           | Funktioniert hervorragend        |
| WhatsApp (Baileys) | ✅           | Reines JS, keine Probleme        |
| Telegram           | ✅           | Reines JS, keine Probleme        |
| gog (Gmail CLI)    | ⚠️           | Auf ARM-Release prüfen           |
| Chromium (Browser) | ✅           | `sudo apt install chromium-browser` |

Wenn ein Skill fehlschlägt, prüfen Sie, ob die zugehörige Binärdatei einen ARM-Build hat. Viele Go-/Rust-Tools haben einen; einige nicht.

### 32-Bit vs. 64-Bit

**Verwenden Sie immer ein 64-Bit-OS.** Node.js und viele moderne Tools erfordern es. Prüfen Sie mit:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## Empfohlene Modelleinrichtung

Da der Pi nur der Gateway ist (Modelle laufen in der Cloud), verwenden Sie API-basierte Modelle:

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

**Versuchen Sie nicht, lokale LLMs auf einem Pi auszuführen** — selbst kleine Modelle sind zu langsam. Lassen Sie Claude/GPT die schwere Arbeit erledigen.

---

## Automatischer Start beim Booten

Das Onboarding richtet dies ein, aber zur Prüfung:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## Fehlerbehebung

### Zu wenig Speicher (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### Langsame Leistung

- Verwenden Sie eine USB-SSD statt einer SD-Karte
- Deaktivieren Sie nicht verwendete Dienste: `sudo systemctl disable cups bluetooth avahi-daemon`
- Prüfen Sie CPU-Drosselung: `vcgencmd get_throttled` (sollte `0x0` zurückgeben)

### Service startet nicht

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM-Binärprobleme

Wenn ein Skill mit "exec format error" fehlschlägt:

1. Prüfen Sie, ob die Binärdatei einen ARM64-Build hat
2. Versuchen Sie, aus dem Quellcode zu bauen
3. Oder verwenden Sie einen Docker-Container mit ARM-Unterstützung

### WLAN-Verbindungsabbrüche

Für Headless-Pis im WLAN:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Kostenvergleich

| Setup          | Einmalige Kosten | Monatliche Kosten | Hinweise                          |
| -------------- | ---------------- | ----------------- | --------------------------------- |
| **Pi 4 (2GB)** | ~$45             | $0                | + Strom (~$5/Jahr)                |
| **Pi 4 (4GB)** | ~$55             | $0                | Empfohlen                         |
| **Pi 5 (4GB)** | ~$60             | $0                | Beste Leistung                    |
| **Pi 5 (8GB)** | ~$80             | $0                | Überdimensioniert, aber zukunftssicher |
| DigitalOcean   | $0               | $6/Monat          | $72/Jahr                          |
| Hetzner        | $0               | €3.79/Monat       | ~$50/Jahr                         |

**Amortisation:** Ein Pi rechnet sich gegenüber einem Cloud-VPS in ~6-12 Monaten.

---

## Verwandt

- [Linux-Anleitung](/de/platforms/linux) — allgemeine Linux-Einrichtung
- [DigitalOcean-Anleitung](/de/install/digitalocean) — Cloud-Alternative
- [Hetzner-Anleitung](/de/install/hetzner) — Docker-Einrichtung
- [Tailscale](/de/gateway/tailscale) — Remote-Zugriff
- [Nodes](/de/nodes) — Ihren Laptop/Ihr Telefon mit dem Pi-Gateway koppeln
