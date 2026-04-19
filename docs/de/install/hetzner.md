---
read_when:
    - Sie möchten OpenClaw 24/7 auf einem Cloud-VPS ausführen lassen (nicht auf Ihrem Laptop)
    - Sie möchten ein produktionsreifes, ständig verfügbares Gateway auf Ihrem eigenen VPS
    - Sie möchten die vollständige Kontrolle über Persistenz, Binärdateien und das Neustartverhalten
    - Sie führen OpenClaw in Docker auf Hetzner oder einem ähnlichen Anbieter aus
summary: Führen Sie OpenClaw Gateway 24/7 auf einem günstigen Hetzner-VPS (Docker) mit dauerhaftem Status und integrierten Binärdateien aus
title: Hetzner
x-i18n:
    generated_at: "2026-04-19T01:11:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw auf Hetzner (Docker, Leitfaden für Produktions-VPS)

## Ziel

Führen Sie ein persistentes OpenClaw Gateway auf einem Hetzner-VPS mit Docker aus, mit dauerhaftem Status, integrierten Binärdateien und sicherem Neustartverhalten.

Wenn Sie „OpenClaw 24/7 für ~5 $“ möchten, ist dies die einfachste zuverlässige Einrichtung.
Die Preise von Hetzner ändern sich; wählen Sie den kleinsten Debian-/Ubuntu-VPS und skalieren Sie nach oben, wenn Sie auf OOMs stoßen.

Erinnerung zum Sicherheitsmodell:

- Gemeinsam genutzte Agenten im Unternehmen sind in Ordnung, wenn sich alle innerhalb derselben Vertrauensgrenze befinden und die Laufzeitumgebung ausschließlich geschäftlich genutzt wird.
- Halten Sie eine strikte Trennung ein: dedizierter VPS/Laufzeit + dedizierte Konten; keine persönlichen Apple-/Google-/Browser-/Passwort-Manager-Profile auf diesem Host.
- Wenn Benutzer einander gegenüber adversarial sind, trennen Sie nach Gateway/Host/OS-Benutzer.

Siehe [Sicherheit](/de/gateway/security) und [VPS-Hosting](/de/vps).

## Was machen wir hier (einfach erklärt)?

- Einen kleinen Linux-Server mieten (Hetzner-VPS)
- Docker installieren (isolierte App-Laufzeit)
- Das OpenClaw Gateway in Docker starten
- `~/.openclaw` + `~/.openclaw/workspace` auf dem Host persistent speichern (übersteht Neustarts/Neubuilds)
- Über einen SSH-Tunnel von Ihrem Laptop aus auf die Control UI zugreifen

Dieser eingehängte `~/.openclaw`-Status umfasst `openclaw.json`, pro Agent
`agents/<agentId>/agent/auth-profiles.json` und `.env`.

Auf das Gateway kann wie folgt zugegriffen werden:

- SSH-Portweiterleitung von Ihrem Laptop
- Direkte Portfreigabe, wenn Sie Firewalling und Tokens selbst verwalten

Dieser Leitfaden geht von Ubuntu oder Debian auf Hetzner aus.  
Wenn Sie einen anderen Linux-VPS verwenden, passen Sie die Pakete entsprechend an.
Für den allgemeinen Docker-Ablauf siehe [Docker](/de/install/docker).

---

## Schneller Weg (für erfahrene Betreiber)

1. Hetzner-VPS bereitstellen
2. Docker installieren
3. OpenClaw-Repository klonen
4. Persistente Host-Verzeichnisse erstellen
5. `.env` und `docker-compose.yml` konfigurieren
6. Erforderliche Binärdateien in das Image integrieren
7. `docker compose up -d`
8. Persistenz und Gateway-Zugriff prüfen

---

## Was Sie benötigen

- Hetzner-VPS mit Root-Zugriff
- SSH-Zugriff von Ihrem Laptop
- Grundlegende Vertrautheit mit SSH + Copy/Paste
- ~20 Minuten
- Docker und Docker Compose
- Modell-Authentifizierungsdaten
- Optionale Anbieter-Anmeldedaten
  - WhatsApp-QR
  - Telegram-Bot-Token
  - Gmail-OAuth

---

<Steps>
  <Step title="Den VPS bereitstellen">
    Erstellen Sie einen Ubuntu- oder Debian-VPS bei Hetzner.

    Als root verbinden:

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

    Prüfen:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Das OpenClaw-Repository klonen">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Dieser Leitfaden geht davon aus, dass Sie ein benutzerdefiniertes Image erstellen, um die Persistenz der Binärdateien zu garantieren.

  </Step>

  <Step title="Persistente Host-Verzeichnisse erstellen">
    Docker-Container sind flüchtig.
    Jeder langlebige Status muss auf dem Host gespeichert werden.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Eigentümer auf den Container-Benutzer setzen (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Umgebungsvariablen konfigurieren">
    Erstellen Sie `.env` im Repository-Stammverzeichnis.

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

    Lassen Sie `OPENCLAW_GATEWAY_TOKEN` leer, außer Sie möchten ihn ausdrücklich über
    `.env` verwalten; OpenClaw schreibt beim ersten Start ein zufälliges Gateway-Token in die
    Konfiguration. Generieren Sie ein Keyring-Passwort und fügen Sie es in
    `GOG_KEYRING_PASSWORD` ein:

    ```bash
    openssl rand -hex 32
    ```

    **Committen Sie diese Datei nicht.**

    Diese `.env`-Datei ist für Container-/Laufzeit-Umgebungsvariablen wie `OPENCLAW_GATEWAY_TOKEN`.
    Gespeicherte OAuth-/API-Key-Authentifizierung von Anbietern befindet sich in der eingehängten
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
          # Empfohlen: Das Gateway auf dem VPS nur an loopback binden; Zugriff per SSH-Tunnel.
          # Um es öffentlich bereitzustellen, entfernen Sie das Präfix `127.0.0.1:` und konfigurieren Sie die Firewall entsprechend.
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

    `--allow-unconfigured` dient nur dem bequemen Bootstrap und ersetzt keine ordnungsgemäße Gateway-Konfiguration. Richten Sie weiterhin Authentifizierung ein (`gateway.auth.token` oder Passwort) und verwenden Sie sichere Bind-Einstellungen für Ihre Bereitstellung.

  </Step>

  <Step title="Gemeinsame Docker-VM-Laufzeitschritte">
    Verwenden Sie den gemeinsamen Laufzeit-Leitfaden für den allgemeinen Docker-Host-Ablauf:

    - [Erforderliche Binärdateien in das Image integrieren](/de/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build und Start](/de/install/docker-vm-runtime#build-and-launch)
    - [Was wo persistent gespeichert wird](/de/install/docker-vm-runtime#what-persists-where)
    - [Updates](/de/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-spezifischer Zugriff">
    Nach den gemeinsamen Schritten für Build und Start tunneln Sie von Ihrem Laptop aus:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Öffnen Sie:

    `http://127.0.0.1:18789/`

    Fügen Sie das konfigurierte gemeinsame Geheimnis ein. Dieser Leitfaden verwendet standardmäßig das Gateway-Token;
    wenn Sie stattdessen zur Passwort-Authentifizierung gewechselt haben, verwenden Sie dieses Passwort.

  </Step>
</Steps>

Die gemeinsame Persistenzübersicht finden Sie unter [Docker VM Runtime](/de/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Für Teams, die Infrastructure-as-Code-Workflows bevorzugen, bietet eine von der Community gepflegte Terraform-Einrichtung:

- Modulare Terraform-Konfiguration mit Remote-Statusverwaltung
- Automatisierte Bereitstellung über cloud-init
- Deployment-Skripte (Bootstrap, Deployment, Backup/Wiederherstellung)
- Sicherheits-Härtung (Firewall, UFW, nur SSH-Zugriff)
- SSH-Tunnel-Konfiguration für den Gateway-Zugriff

**Repositories:**

- Infrastruktur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker-Konfiguration: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Dieser Ansatz ergänzt die obige Docker-Einrichtung durch reproduzierbare Deployments, versionskontrollierte Infrastruktur und automatisierte Disaster-Recovery.

> **Hinweis:** Von der Community gepflegt. Bei Problemen oder Beiträgen siehe die obigen Repository-Links.

## Nächste Schritte

- Messaging-Kanäle einrichten: [Channels](/de/channels)
- Das Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)
- OpenClaw aktuell halten: [Aktualisierung](/de/install/updating)
