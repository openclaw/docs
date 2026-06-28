---
read_when:
    - OpenClaw auf DigitalOcean einrichten
    - Einen einfachen kostenpflichtigen VPS für OpenClaw suchen
summary: OpenClaw auf einem DigitalOcean Droplet hosten
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-10T19:39:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ddfe3e6df5e48616584e912e12eede30a62f869fc307f586c9604c9c06c9e5b
    source_path: install/digitalocean.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Führen Sie einen persistenten OpenClaw Gateway auf einem DigitalOcean Droplet aus (~6 USD/Monat für den 1-GB-Basic-Tarif).

DigitalOcean ist der einfachste kostenpflichtige VPS-Weg. Wenn Sie günstigere oder kostenlose Optionen bevorzugen:

- [Hetzner](/de/install/hetzner) — 3,79 €/Monat, mehr Kerne/RAM pro Dollar.
- [Oracle Cloud](/de/install/oracle) — Always Free ARM (bis zu 4 OCPU, 24 GB RAM), die Registrierung kann jedoch hakelig sein und ist nur ARM.

## Voraussetzungen

- DigitalOcean-Konto ([Registrierung](https://cloud.digitalocean.com/registrations/new))
- SSH-Schlüsselpaar (oder Bereitschaft, Passwortauthentifizierung zu verwenden)
- Etwa 20 Minuten

## Einrichtung

<Steps>
  <Step title="Droplet erstellen">
    <Warning>
    Verwenden Sie ein sauberes Basis-Image (Ubuntu 24.04 LTS). Vermeiden Sie Marketplace-1-Click-Images von Drittanbietern, sofern Sie deren Startskripte und Firewall-Standards nicht geprüft haben.
    </Warning>

    1. Melden Sie sich bei [DigitalOcean](https://cloud.digitalocean.com/) an.
    2. Klicken Sie auf **Create > Droplets**.
    3. Wählen Sie:
       - **Region:** Am nächsten bei Ihnen
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH-Schlüssel (empfohlen) oder Passwort
    4. Klicken Sie auf **Create Droplet** und notieren Sie die IP-Adresse.

  </Step>

  <Step title="Verbinden und installieren">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Verwenden Sie die Root-Shell nur für das System-Bootstrap. Führen Sie OpenClaw-Befehle als Nicht-Root-Benutzer `openclaw` aus, damit der Zustand unter `/home/openclaw/.openclaw/` liegt und der Gateway als systemd-Dienst dieses Benutzers installiert wird.

  </Step>

  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --install-daemon
    ```

    Der Assistent führt Sie durch die Modellauthentifizierung, die Channel-Einrichtung, die Gateway-Token-Erstellung und die Daemon-Installation (systemd).

  </Step>

  <Step title="Swap hinzufügen (für 1-GB-Droplets empfohlen)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Gateway prüfen">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Auf die Control UI zugreifen">
    Der Gateway bindet standardmäßig an loopback. Wählen Sie eine dieser Optionen.

    **Option A: SSH-Tunnel (am einfachsten)**

    ```bash
    # From your local machine
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

    Öffnen Sie anschließend `https://<magicdns>/` von einem beliebigen Gerät in Ihrem Tailnet.

    Tailscale Serve authentifiziert Control UI- und WebSocket-Datenverkehr über Tailnet-Identitätsheader, wobei vorausgesetzt wird, dass der Gateway-Host selbst vertrauenswürdig ist. HTTP-API-Endpunkte folgen unabhängig davon dem normalen Authentifizierungsmodus des Gateways (Token/Passwort). Um explizite Shared-Secret-Zugangsdaten über Serve zu erzwingen, setzen Sie `gateway.auth.allowTailscale: false` und verwenden Sie `gateway.auth.mode: "token"` oder `"password"`.

    **Option C: Tailnet-Bindung (ohne Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Öffnen Sie anschließend `http://<tailscale-ip>:18789` (Token erforderlich).

  </Step>
</Steps>

## Persistenz und Backups

Der OpenClaw-Zustand liegt unter:

- `~/.openclaw/` — `openclaw.json`, agentenspezifische `auth-profiles.json`, Channel-/Provider-Zustand und Sitzungsdaten.
- `~/.openclaw/workspace/` — der Agent-Arbeitsbereich (SOUL.md, Speicher, Artefakte).

Diese Daten überstehen Droplet-Neustarts. So erstellen Sie einen portablen Snapshot:

```bash
openclaw backup create
```

DigitalOcean-Snapshots sichern das gesamte Droplet; `openclaw backup create` ist über Hosts hinweg portabel.

## Tipps für 1 GB RAM

Das 6-USD-Droplet hat nur 1 GB RAM. Damit alles reibungslos läuft:

- Stellen Sie sicher, dass der obige Swap-Schritt in `/etc/fstab` steht, damit er Neustarts übersteht.
- Bevorzugen Sie API-basierte Modelle (Claude, GPT) gegenüber lokalen Modellen — lokale LLM-Inferenz passt nicht in 1 GB.
- Setzen Sie `agents.defaults.model.primary` auf ein kleineres Modell, wenn bei großen Prompts OOMs auftreten.
- Überwachen Sie mit `free -h` und `htop`.

## Fehlerbehebung

**Gateway startet nicht** -- Führen Sie `openclaw doctor --non-interactive` aus und prüfen Sie die Logs mit `journalctl --user -u openclaw-gateway.service -n 50`.

**Port bereits in Verwendung** -- Führen Sie `lsof -i :18789` aus, um den Prozess zu finden, und stoppen Sie ihn dann.

**Nicht genügend Arbeitsspeicher** -- Prüfen Sie mit `free -h`, ob Swap aktiv ist. Wenn weiterhin OOM auftritt, verwenden Sie API-basierte Modelle (Claude, GPT) statt lokaler Modelle oder wechseln Sie zu einem 2-GB-Droplet.

## Nächste Schritte

- [Channels](/de/channels) -- Telegram, WhatsApp, Discord und weitere verbinden
- [Gateway-Konfiguration](/de/gateway/configuration) -- alle Konfigurationsoptionen
- [Aktualisierung](/de/install/updating) -- OpenClaw aktuell halten

## Verwandt

- [Installationsübersicht](/de/install)
- [Fly.io](/de/install/fly)
- [Hetzner](/de/install/hetzner)
- [VPS-Hosting](/de/vps)
