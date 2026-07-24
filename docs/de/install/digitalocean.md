---
read_when:
    - OpenClaw auf DigitalOcean einrichten
    - Auf der Suche nach einem einfachen kostenpflichtigen VPS für OpenClaw
summary: OpenClaw auf einem DigitalOcean Droplet hosten
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-24T05:01:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Betreiben Sie einen persistenten OpenClaw Gateway auf einem DigitalOcean Droplet (ca. 6 USD/Monat für den Basic-Tarif mit 1 GB).

DigitalOcean ist eine unkomplizierte kostenpflichtige VPS-Lösung. Günstigere oder kostenlose Optionen:

- [Hetzner](/de/install/hetzner) -- mehr Kerne/RAM pro Dollar.
- [Oracle Cloud](/de/install/oracle) -- dauerhaft kostenloser ARM-Tarif (bis zu 4 OCPU, 24 GB RAM), die Registrierung kann jedoch etwas umständlich sein und es wird ausschließlich ARM unterstützt.

## Voraussetzungen

- DigitalOcean-Konto ([registrieren](https://cloud.digitalocean.com/registrations/new))
- SSH-Schlüsselpaar (oder Bereitschaft zur Verwendung der Passwortauthentifizierung)
- Etwa 20 Minuten

## Einrichtung

<Steps>
  <Step title="Droplet erstellen">
    <Warning>
    Verwenden Sie ein unverändertes Basis-Image (Ubuntu 24.04 LTS). Vermeiden Sie 1-Click-Images von Drittanbietern aus dem Marketplace, sofern Sie deren Startskripte und Firewall-Standardeinstellungen nicht überprüft haben.
    </Warning>

    1. Melden Sie sich bei [DigitalOcean](https://cloud.digitalocean.com/) an.
    2. Klicken Sie auf **Create > Droplets**.
    3. Wählen Sie:
       - **Region:** Die nächstgelegene Region
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH-Schlüssel (empfohlen) oder Passwort
    4. Klicken Sie auf **Create Droplet** und notieren Sie die IP-Adresse.

  </Step>

  <Step title="Verbinden und installieren">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Node.js 24 installieren
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # OpenClaw installieren
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Den Nicht-Root-Benutzer erstellen, dem OpenClaw-Status und -Dienste gehören werden.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Verwenden Sie die Root-Shell ausschließlich für die grundlegende Systemeinrichtung. Führen Sie OpenClaw-Befehle als Nicht-Root-Benutzer `openclaw` aus, damit der Status unter `/home/openclaw/.openclaw/` gespeichert und der Gateway als systemd-`--user`-Dienst dieses Benutzers installiert wird.

  </Step>

  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --install-daemon
    ```

    Der Assistent führt Sie durch die Modellauthentifizierung, die Kanaleinrichtung, die Generierung des Gateway-Tokens und die Installation des Daemons (systemd-Benutzerdienst).

  </Step>

  <Step title="Swap hinzufügen (für Droplets mit 1 GB empfohlen)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Gateway überprüfen">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Auf die Control UI zugreifen">
    Der Gateway bindet sich standardmäßig an die Loopback-Schnittstelle. Wählen Sie eine der folgenden Optionen.

    **Option A: SSH-Tunnel (am einfachsten)**

    ```bash
    # Von Ihrem lokalen Rechner aus
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Öffnen Sie anschließend `http://localhost:18789`.

    **Option B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Öffnen Sie anschließend `https://<magicdns>/` auf einem beliebigen Gerät in Ihrem Tailnet.

    Tailscale Serve authentifiziert den Datenverkehr der Control UI und von WebSockets über Tailnet-Identitätsheader. Dabei wird vorausgesetzt, dass der Gateway-Host selbst vertrauenswürdig ist. HTTP-API-Endpunkte verwenden unabhängig davon weiterhin den normalen Authentifizierungsmodus des Gateways (Token/Passwort). Um über Serve explizite Zugangsdaten mit gemeinsamem Geheimnis zu verlangen, legen Sie `gateway.auth.allowTailscale: false` fest und verwenden Sie `gateway.auth.mode: "token"` oder `"password"`.

    **Option C: Tailnet-Bindung (ohne Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Öffnen Sie anschließend `http://<tailscale-ip>:18789` (Token erforderlich).

  </Step>
</Steps>

## Persistenz und Sicherungen

Der OpenClaw-Status befindet sich unter:

- `~/.openclaw/` -- `openclaw.json`, Kanal-/Provider-Anmeldedaten, agentenspezifische `auth-profiles.json` und Sitzungsdaten.
- `~/.openclaw/workspace/` -- der Agent-Arbeitsbereich (SOUL.md, Speicher, Artefakte).

Diese Daten bleiben bei Neustarts des Droplets erhalten. So erstellen Sie einen portierbaren Snapshot:

```bash
openclaw backup create
```

DigitalOcean-Snapshots sichern das gesamte Droplet; `openclaw backup create` ist zwischen Hosts portierbar.

## Tipps für 1 GB RAM

Das 6-USD-Droplet verfügt nur über 1 GB RAM. So gewährleisten Sie einen reibungslosen Betrieb:

- Stellen Sie sicher, dass der obige Swap-Schritt in `/etc/fstab` eingetragen ist, damit er Neustarts übersteht.
- Bevorzugen Sie API-basierte Modelle (Claude, GPT) gegenüber lokalen Modellen -- die lokale LLM-Inferenz ist mit 1 GB nicht möglich.
- Legen Sie für `agents.defaults.model.primary` ein kleineres Modell fest, wenn bei umfangreichen Prompts Speicherüberschreitungen auftreten.
- Überwachen Sie das System mit `free -h` und `htop`.

## Fehlerbehebung

**Gateway startet nicht** -- Führen Sie `openclaw doctor --non-interactive` aus und überprüfen Sie die Protokolle mit `journalctl --user -u openclaw-gateway.service -n 50`.

**Port wird bereits verwendet** -- Führen Sie `lsof -i :18789` aus, um den Prozess zu ermitteln, und beenden Sie ihn anschließend.

**Nicht genügend Arbeitsspeicher** -- Überprüfen Sie mit `free -h`, ob Swap aktiv ist. Falls weiterhin Speicherüberschreitungen auftreten, wechseln Sie von lokalen Modellen zu API-basierten Modellen (Claude, GPT) oder führen Sie ein Upgrade auf ein Droplet mit 2 GB durch.

## Nächste Schritte

- [Kanäle](/de/channels) -- Telegram, WhatsApp, Discord und weitere Dienste verbinden
- [Gateway-Konfiguration](/de/gateway/configuration) -- alle Konfigurationsoptionen
- [Aktualisierung](/de/install/updating) -- OpenClaw auf dem neuesten Stand halten

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Fly.io](/de/install/fly)
- [Hetzner](/de/install/hetzner)
- [VPS-Hosting](/de/vps)
