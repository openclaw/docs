---
read_when:
    - Sie möchten OpenClaw rund um die Uhr auf einem Cloud-VPS betreiben (nicht auf Ihrem Laptop)
    - Sie möchten ein produktionsreifes, dauerhaft verfügbares Gateway auf Ihrem eigenen VPS
    - Sie möchten vollständige Kontrolle über Persistenz, Binärdateien und Neustartverhalten
    - Sie betreiben OpenClaw in Docker bei Hetzner oder einem ähnlichen Provider
summary: OpenClaw Gateway rund um die Uhr auf einem günstigen Hetzner-VPS (Docker) mit persistentem Zustand und integrierten Binärdateien ausführen
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T06:53:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2625a028b6242f653d29b8f45035bf2d796c5c60453582cf269fd1c3776eca52
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw auf Hetzner (Docker, Produktions-VPS-Leitfaden)

## Ziel

Einen dauerhaften OpenClaw Gateway auf einem Hetzner-VPS mit Docker ausführen, mit persistentem Zustand, eingebauten Binärdateien und sicherem Neustartverhalten.

Wenn Sie „OpenClaw 24/7 für ca. 5 USD“ möchten, ist dies die einfachste zuverlässige Einrichtung.
Hetzner-Preise ändern sich; wählen Sie den kleinsten Debian-/Ubuntu-VPS und skalieren Sie hoch, wenn OOMs auftreten.

Erinnerung zum Sicherheitsmodell:

- Unternehmensweit gemeinsam genutzte Agents sind in Ordnung, wenn sich alle innerhalb derselben Vertrauensgrenze befinden und die Laufzeitumgebung ausschließlich geschäftlich genutzt wird.
- Halten Sie eine strikte Trennung ein: dedizierter VPS/dedizierte Laufzeitumgebung + dedizierte Konten; keine persönlichen Apple-/Google-/Browser-/Passwortmanager-Profile auf diesem Host.
- Wenn Benutzer einander gegenüber adversarial sind, trennen Sie nach Gateway/Host/OS-Benutzer.

Siehe [Sicherheit](/de/gateway/security) und [VPS-Hosting](/de/vps).

## Was tun wir hier (einfach erklärt)?

- Einen kleinen Linux-Server mieten (Hetzner-VPS)
- Docker installieren (isolierte App-Laufzeitumgebung)
- Den OpenClaw Gateway in Docker starten
- `~/.openclaw` + `~/.openclaw/workspace` auf dem Host persistent speichern (übersteht Neustarts/Neuaufbauten)
- Über einen SSH-Tunnel von Ihrem Laptop auf die Control UI zugreifen

Dieser eingebundene Zustand `~/.openclaw` enthält `openclaw.json`, pro Agent
`agents/<agentId>/agent/auth-profiles.json` und `.env`.

Auf den Gateway kann zugegriffen werden über:

- SSH-Portweiterleitung von Ihrem Laptop
- Direkte Portfreigabe, wenn Sie Firewalling und Tokens selbst verwalten

Dieser Leitfaden setzt Ubuntu oder Debian auf Hetzner voraus.  
Wenn Sie einen anderen Linux-VPS verwenden, ordnen Sie die Pakete entsprechend zu.
Den generischen Docker-Ablauf finden Sie unter [Docker](/de/install/docker).

---

## Schneller Weg (erfahrene Betreiber)

1. Hetzner-VPS bereitstellen
2. Docker installieren
3. OpenClaw-Repository klonen
4. Persistente Host-Verzeichnisse erstellen
5. `.env` und `docker-compose.yml` konfigurieren
6. Erforderliche Binärdateien in das Image einbauen
7. `docker compose up -d`
8. Persistenz und Gateway-Zugriff überprüfen

---

## Was Sie benötigen

- Hetzner-VPS mit Root-Zugriff
- SSH-Zugriff von Ihrem Laptop
- Grundlegende Vertrautheit mit SSH + Kopieren/Einfügen
- ca. 20 Minuten
- Docker und Docker Compose
- Anmeldedaten für Modellauthentifizierung
- Optionale Provider-Anmeldedaten
  - WhatsApp-QR
  - Telegram-Bot-Token
  - Gmail OAuth

---

<Steps>
  <Step title="Den VPS bereitstellen">
    Erstellen Sie einen Ubuntu- oder Debian-VPS bei Hetzner.

    Als Root verbinden:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Dieser Leitfaden setzt voraus, dass der VPS zustandsbehaftet ist.
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

  <Step title="Das OpenClaw-Repository klonen">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Dieser Leitfaden setzt voraus, dass Sie ein eigenes Image bauen, um Binärdatei-Persistenz zu garantieren.

  </Step>

  <Step title="Persistente Host-Verzeichnisse erstellen">
    Docker-Container sind flüchtig.
    Alle langfristigen Zustände müssen auf dem Host liegen.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
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

    Lassen Sie `OPENCLAW_GATEWAY_TOKEN` leer, sofern Sie es nicht ausdrücklich
    über `.env` verwalten möchten; OpenClaw schreibt beim ersten Start ein
    zufälliges Gateway-Token in die Konfiguration. Generieren Sie ein Keyring-Passwort
    und fügen Sie es in `GOG_KEYRING_PASSWORD` ein:

    ```bash
    openssl rand -hex 32
    ```

    **Committen Sie diese Datei nicht.**

    Diese `.env`-Datei ist für Container-/Laufzeitumgebungsvariablen wie `OPENCLAW_GATEWAY_TOKEN`.
    Gespeicherte Provider-OAuth-/API-Key-Authentifizierung befindet sich in der eingebundenen Datei
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

    `--allow-unconfigured` dient nur der Bequemlichkeit beim Bootstrap und ist kein Ersatz für eine ordnungsgemäße Gateway-Konfiguration. Legen Sie dennoch Authentifizierung (`gateway.auth.token` oder Passwort) fest und verwenden Sie sichere Bind-Einstellungen für Ihre Bereitstellung.

  </Step>

  <Step title="Gemeinsame Docker-VM-Laufzeitumgebungsschritte">
    Verwenden Sie den gemeinsamen Laufzeitumgebungsleitfaden für den üblichen Docker-Host-Ablauf:

    - [Erforderliche Binärdateien in das Image einbauen](/de/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bauen und starten](/de/install/docker-vm-runtime#build-and-launch)
    - [Was wo persistent gespeichert wird](/de/install/docker-vm-runtime#what-persists-where)
    - [Aktualisierungen](/de/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-spezifischer Zugriff">
    Führen Sie nach den gemeinsamen Build- und Startschritten die folgende Einrichtung aus, um den Tunnel zu öffnen:

    **Voraussetzung:** Stellen Sie sicher, dass Ihre VPS-sshd-Konfiguration TCP-Weiterleitung erlaubt. Wenn Sie
    Ihre SSH-Konfiguration gehärtet haben, prüfen Sie `/etc/ssh/sshd_config` und setzen Sie:

    ```
    AllowTcpForwarding local
    ```

    `local` erlaubt lokale `ssh -L`-Weiterleitungen von Ihrem Laptop, während
    Remote-Weiterleitungen vom Server blockiert werden. Wenn Sie dies auf `no` setzen, schlägt der Tunnel fehl
    mit:
    `channel 3: open failed: administratively prohibited: open failed`

    Nachdem Sie bestätigt haben, dass TCP-Weiterleitung aktiviert ist, starten Sie den SSH-Dienst neu
    (`systemctl restart ssh`) und führen Sie den Tunnel von Ihrem Laptop aus:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Öffnen Sie:

    `http://127.0.0.1:18789/`

    Fügen Sie das konfigurierte gemeinsame Secret ein. Dieser Leitfaden verwendet standardmäßig das Gateway-Token;
    wenn Sie auf Passwortauthentifizierung umgestellt haben, verwenden Sie stattdessen dieses Passwort.

  </Step>
</Steps>

Die gemeinsame Persistenzübersicht befindet sich unter [Docker-VM-Laufzeitumgebung](/de/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Für Teams, die Infrastructure-as-Code-Workflows bevorzugen, bietet eine von der Community gepflegte Terraform-Einrichtung:

- Modulare Terraform-Konfiguration mit Remote-State-Verwaltung
- Automatisierte Bereitstellung über cloud-init
- Bereitstellungsskripte (Bootstrap, Deploy, Backup/Wiederherstellung)
- Sicherheitshärtung (Firewall, UFW, Zugriff nur per SSH)
- SSH-Tunnel-Konfiguration für Gateway-Zugriff

**Repositories:**

- Infrastruktur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker-Konfiguration: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Dieser Ansatz ergänzt die obige Docker-Einrichtung um reproduzierbare Bereitstellungen, versionskontrollierte Infrastruktur und automatisierte Notfallwiederherstellung.

<Note>
Von der Community gepflegt. Bei Problemen oder Beiträgen verwenden Sie die obigen Repository-Links.
</Note>

## Nächste Schritte

- Messaging-Kanäle einrichten: [Kanäle](/de/channels)
- Den Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)
- OpenClaw aktuell halten: [Aktualisieren](/de/install/updating)

## Verwandt

- [Installationsübersicht](/de/install)
- [Fly.io](/de/install/fly)
- [Docker](/de/install/docker)
- [VPS-Hosting](/de/vps)
