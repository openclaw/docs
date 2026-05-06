---
read_when:
    - OpenClaw auf DigitalOcean einrichten
    - Auf der Suche nach einem einfachen kostenpflichtigen VPS für OpenClaw
summary: OpenClaw auf einem DigitalOcean Droplet hosten
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T06:52:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

Führen Sie einen dauerhaft laufenden OpenClaw Gateway auf einem DigitalOcean Droplet aus (~6 $/Monat für den 1-GB-Basic-Plan).

DigitalOcean ist der einfachste kostenpflichtige VPS-Weg. Wenn Sie günstigere oder kostenlose Optionen bevorzugen:

- [Hetzner](/de/install/hetzner) — 3,79 €/Monat, mehr Kerne/RAM pro Dollar.
- [Oracle Cloud](/de/install/oracle) — Always Free ARM (bis zu 4 OCPU, 24 GB RAM), aber die Registrierung kann knifflig sein und ist nur ARM.

## Voraussetzungen

- DigitalOcean-Konto ([Registrierung](https://cloud.digitalocean.com/registrations/new))
- SSH-Schlüsselpaar (oder Bereitschaft, Passwortauthentifizierung zu verwenden)
- Etwa 20 Minuten

## Einrichtung

<Steps>
  <Step title="Droplet erstellen">
    <Warning>
    Verwenden Sie ein sauberes Basis-Image (Ubuntu 24.04 LTS). Vermeiden Sie 1-Click-Images von Drittanbietern aus dem Marketplace, sofern Sie deren Startskripte und Firewall-Standardeinstellungen nicht geprüft haben.
    </Warning>

    1. Melden Sie sich bei [DigitalOcean](https://cloud.digitalocean.com/) an.
    2. Klicken Sie auf **Create > Droplets**.
    3. Wählen Sie:
       - **Region:** Am nächsten zu Ihnen
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
    openclaw --version
    ```

  </Step>

  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --install-daemon
    ```

    Der Assistent führt Sie durch die Modellauthentifizierung, die Kanaleinrichtung, die Gateway-Token-Generierung und die Daemon-Installation (systemd).

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

  <Step title="Gateway überprüfen">
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

    Öffnen Sie dann `http://localhost:18789`.

    **Option B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Öffnen Sie dann `https://<magicdns>/` von jedem Gerät in Ihrem Tailnet.

    Tailscale Serve authentifiziert Control-UI- und WebSocket-Datenverkehr über Tailnet-Identitätsheader, wobei vorausgesetzt wird, dass der Gateway-Host selbst vertrauenswürdig ist. HTTP-API-Endpunkte folgen unabhängig davon dem normalen Authentifizierungsmodus des Gateway (Token/Passwort). Um explizite Shared-Secret-Anmeldedaten über Serve zu erzwingen, setzen Sie `gateway.auth.allowTailscale: false` und verwenden Sie `gateway.auth.mode: "token"` oder `"password"`.

    **Option C: Tailnet-Bindung (ohne Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Öffnen Sie dann `http://<tailscale-ip>:18789` (Token erforderlich).

  </Step>
</Steps>

## Persistenz und Backups

Der OpenClaw-Zustand befindet sich unter:

- `~/.openclaw/` — `openclaw.json`, agentenspezifische `auth-profiles.json`, Kanal-/Provider-Zustand und Sitzungsdaten.
- `~/.openclaw/workspace/` — der Agent-Arbeitsbereich (SOUL.md, Speicher, Artefakte).

Diese Daten bleiben nach Droplet-Neustarts erhalten. So erstellen Sie einen portablen Snapshot:

```bash
openclaw backup create
```

DigitalOcean-Snapshots sichern das gesamte Droplet; `openclaw backup create` ist zwischen Hosts portabel.

## Tipps für 1 GB RAM

Das 6-$-Droplet hat nur 1 GB RAM. Damit alles reibungslos läuft:

- Stellen Sie sicher, dass der obige Swap-Schritt in `/etc/fstab` steht, damit er Neustarts übersteht.
- Bevorzugen Sie API-basierte Modelle (Claude, GPT) gegenüber lokalen Modellen — lokale LLM-Inferenz passt nicht in 1 GB.
- Setzen Sie `agents.defaults.model.primary` auf ein kleineres Modell, wenn bei großen Prompts OOMs auftreten.
- Überwachen Sie mit `free -h` und `htop`.

## Fehlerbehebung

**Gateway startet nicht** -- Führen Sie `openclaw doctor --non-interactive` aus und prüfen Sie die Logs mit `journalctl --user -u openclaw-gateway.service -n 50`.

**Port wird bereits verwendet** -- Führen Sie `lsof -i :18789` aus, um den Prozess zu finden, und stoppen Sie ihn dann.

**Nicht genügend Arbeitsspeicher** -- Prüfen Sie mit `free -h`, ob Swap aktiv ist. Wenn weiterhin OOM auftritt, verwenden Sie API-basierte Modelle (Claude, GPT) statt lokaler Modelle oder aktualisieren Sie auf ein 2-GB-Droplet.

## Nächste Schritte

- [Kanäle](/de/channels) -- Telegram, WhatsApp, Discord und mehr verbinden
- [Gateway-Konfiguration](/de/gateway/configuration) -- alle Konfigurationsoptionen
- [Aktualisierung](/de/install/updating) -- OpenClaw aktuell halten

## Verwandt

- [Installationsübersicht](/de/install)
- [Fly.io](/de/install/fly)
- [Hetzner](/de/install/hetzner)
- [VPS-Hosting](/de/vps)
