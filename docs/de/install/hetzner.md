---
read_when:
    - Sie möchten, dass OpenClaw rund um die Uhr auf einem Cloud-VPS läuft (nicht auf Ihrem Laptop)
    - Sie möchten ein produktionsreifes, dauerhaft laufendes Gateway auf Ihrem eigenen VPS
    - Sie möchten die vollständige Kontrolle über Persistenz, Binärdateien und das Neustartverhalten
    - Sie betreiben OpenClaw in Docker bei Hetzner oder einem ähnlichen Provider
summary: OpenClaw Gateway rund um die Uhr auf einem günstigen Hetzner VPS (Docker) mit persistentem Zustand und integrierten Binärdateien betreiben
title: Hetzner
x-i18n:
    generated_at: "2026-04-30T07:00:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw auf Hetzner (Docker, Produktionsleitfaden für VPS)

## Ziel

Betreiben Sie einen persistenten OpenClaw Gateway auf einem Hetzner-VPS mit Docker, dauerhaftem Zustand, eingebackenen Binärdateien und sicherem Neustartverhalten.

Wenn Sie „OpenClaw rund um die Uhr für ca. 5 $“ möchten, ist dies die einfachste zuverlässige Einrichtung.
Hetzner-Preise ändern sich; wählen Sie den kleinsten Debian-/Ubuntu-VPS und skalieren Sie nach oben, wenn OOMs auftreten.

Hinweis zum Sicherheitsmodell:

- Unternehmensweit gemeinsam genutzte Agents sind in Ordnung, wenn sich alle innerhalb derselben Vertrauensgrenze befinden und die Runtime ausschließlich geschäftlich genutzt wird.
- Halten Sie eine strikte Trennung ein: dedizierter VPS/Runtime + dedizierte Konten; keine persönlichen Apple-/Google-/Browser-/Passwortmanager-Profile auf diesem Host.
- Wenn Benutzer einander gegenüber adversarial sind, trennen Sie nach Gateway/Host/OS-Benutzer.

Siehe [Sicherheit](/de/gateway/security) und [VPS-Hosting](/de/vps).

## Was tun wir hier (einfach erklärt)?

- Einen kleinen Linux-Server mieten (Hetzner-VPS)
- Docker installieren (isolierte App-Runtime)
- Den OpenClaw Gateway in Docker starten
- `~/.openclaw` + `~/.openclaw/workspace` auf dem Host persistieren (übersteht Neustarts/Rebuilds)
- Über einen SSH-Tunnel von Ihrem Laptop aus auf die Control UI zugreifen

Dieser eingebundene `~/.openclaw`-Zustand enthält `openclaw.json`, agentenspezifische
`agents/<agentId>/agent/auth-profiles.json` und `.env`.

Auf den Gateway kann zugegriffen werden über:

- SSH-Portweiterleitung von Ihrem Laptop
- Direkte Portfreigabe, wenn Sie Firewalling und Tokens selbst verwalten

Dieser Leitfaden geht von Ubuntu oder Debian auf Hetzner aus.  
Wenn Sie einen anderen Linux-VPS verwenden, ordnen Sie die Pakete entsprechend zu.
Für den generischen Docker-Ablauf siehe [Docker](/de/install/docker).

---

## Schnellpfad (erfahrene Betreiber)

1. Hetzner-VPS bereitstellen
2. Docker installieren
3. OpenClaw-Repository klonen
4. Persistente Host-Verzeichnisse erstellen
5. `.env` und `docker-compose.yml` konfigurieren
6. Erforderliche Binärdateien in das Image einbacken
7. `docker compose up -d`
8. Persistenz und Gateway-Zugriff überprüfen

---

## Was Sie benötigen

- Hetzner-VPS mit Root-Zugriff
- SSH-Zugriff von Ihrem Laptop
- Grundlegende Sicherheit im Umgang mit SSH + Kopieren/Einfügen
- ca. 20 Minuten
- Docker und Docker Compose
- Modell-Authentifizierungsdaten
- Optionale Provider-Zugangsdaten
  - WhatsApp-QR
  - Telegram-Bot-Token
  - Gmail OAuth

---

<Steps>
  <Step title="VPS bereitstellen">
    Erstellen Sie einen Ubuntu- oder Debian-VPS in Hetzner.

    Als Root verbinden:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Dieser Leitfaden geht davon aus, dass der VPS zustandsbehaftet ist.
    Behandeln Sie ihn nicht als wegwerfbare Infrastruktur.

  </Step>

  <Step title="Docker installieren (auf dem VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Überprüfen:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw-Repository klonen">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Dieser Leitfaden geht davon aus, dass Sie ein benutzerdefiniertes Image erstellen, um die Persistenz der Binärdateien sicherzustellen.

  </Step>

  <Step title="Persistente Host-Verzeichnisse erstellen">
    Docker-Container sind kurzlebig.
    Alle langlebigen Zustände müssen auf dem Host liegen.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Umgebungsvariablen konfigurieren">
    Erstellen Sie `.env` im Repository-Root.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Lassen Sie `OPENCLAW_GATEWAY_TOKEN` leer, es sei denn, Sie möchten es ausdrücklich über `.env` verwalten; OpenClaw schreibt beim ersten Start ein zufälliges Gateway-Token in die Konfiguration. Generieren Sie ein Keyring-Passwort und fügen Sie es in `GOG_KEYRING_PASSWORD` ein:

    ```bash
    openssl rand -hex 32
    ```

    **Committen Sie diese Datei nicht.**

    Diese `.env`-Datei ist für Container-/Runtime-Umgebungsvariablen wie `OPENCLAW_GATEWAY_TOKEN` vorgesehen.
    Gespeicherte Provider-OAuth-/API-Key-Authentifizierung liegt in der eingebundenen Datei
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker-Compose-Konfiguration">
    Erstellen oder aktualisieren Sie `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` dient nur der bequemen Erstinitialisierung; es ist kein Ersatz für eine ordnungsgemäße Gateway-Konfiguration. Setzen Sie dennoch Authentifizierung (`gateway.auth.token` oder Passwort) und verwenden Sie sichere Bind-Einstellungen für Ihre Bereitstellung.

  </Step>

  <Step title="Gemeinsame Docker-VM-Runtime-Schritte">
    Verwenden Sie den gemeinsamen Runtime-Leitfaden für den üblichen Docker-Host-Ablauf:

    - [Erforderliche Binärdateien in das Image einbacken](/de/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Erstellen und starten](/de/install/docker-vm-runtime#build-and-launch)
    - [Was wo persistiert wird](/de/install/docker-vm-runtime#what-persists-where)
    - [Updates](/de/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-spezifischer Zugriff">
    Nach den gemeinsamen Build- und Startschritten schließen Sie die folgende Einrichtung ab, um den Tunnel zu öffnen:

    **Voraussetzung:** Stellen Sie sicher, dass Ihre VPS-sshd-Konfiguration TCP-Weiterleitung erlaubt. Wenn Sie
    Ihre SSH-Konfiguration gehärtet haben, prüfen Sie `/etc/ssh/sshd_config` und setzen Sie:

    ```
    AllowTcpForwarding local
    ```

    `local` erlaubt lokale `ssh -L`-Weiterleitungen von Ihrem Laptop, während
    Remote-Weiterleitungen vom Server blockiert werden. Wenn der Wert auf `no` gesetzt ist, schlägt der Tunnel fehl
    mit:
    `channel 3: open failed: administratively prohibited: open failed`

    Nachdem Sie bestätigt haben, dass TCP-Weiterleitung aktiviert ist, starten Sie den SSH-Dienst neu
    (`systemctl restart ssh`) und führen Sie den Tunnel von Ihrem Laptop aus aus:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Öffnen Sie:

    `http://127.0.0.1:18789/`

    Fügen Sie das konfigurierte gemeinsame Secret ein. Dieser Leitfaden verwendet standardmäßig das Gateway-Token; wenn Sie auf Passwortauthentifizierung umgestellt haben, verwenden Sie stattdessen dieses Passwort.

  </Step>
</Steps>

Die gemeinsame Persistenzübersicht befindet sich in [Docker-VM-Runtime](/de/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Für Teams, die Infrastructure-as-Code-Workflows bevorzugen, bietet ein von der Community gepflegtes Terraform-Setup:

- Modulare Terraform-Konfiguration mit Remote-State-Verwaltung
- Automatisierte Bereitstellung über cloud-init
- Deployment-Skripte (Bootstrap, Deploy, Backup/Restore)
- Sicherheits-Härtung (Firewall, UFW, reiner SSH-Zugriff)
- SSH-Tunnel-Konfiguration für Gateway-Zugriff

**Repositories:**

- Infrastruktur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker-Konfiguration: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Dieser Ansatz ergänzt die obige Docker-Einrichtung um reproduzierbare Deployments, versionierte Infrastruktur und automatisierte Disaster Recovery.

<Note>
Von der Community gepflegt. Bei Problemen oder Beiträgen siehe die obigen Repository-Links.
</Note>

## Nächste Schritte

- Messaging-Kanäle einrichten: [Kanäle](/de/channels)
- Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)
- OpenClaw aktuell halten: [Aktualisieren](/de/install/updating)

## Verwandt

- [Installationsübersicht](/de/install)
- [Fly.io](/de/install/fly)
- [Docker](/de/install/docker)
- [VPS-Hosting](/de/vps)
