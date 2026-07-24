---
read_when:
    - Sie möchten, dass OpenClaw rund um die Uhr auf GCP läuft
    - Sie möchten einen produktionsreifen, ständig verfügbaren Gateway auf Ihrer eigenen VM.
    - Sie möchten vollständige Kontrolle über Persistenz, Binärdateien und das Neustartverhalten.
summary: OpenClaw Gateway rund um die Uhr auf einer GCP-Compute-Engine-VM (Docker) mit dauerhaftem Zustand ausführen
title: GCP
x-i18n:
    generated_at: "2026-07-24T04:28:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Führen Sie ein dauerhaftes OpenClaw Gateway auf einer GCP-Compute-Engine-VM mit Docker aus – mit persistentem Zustand, fest integrierten Binärdateien und sicherem Neustartverhalten.

Die Preise variieren je nach Maschinentyp und Region. Wählen Sie die kleinste VM, die für Ihre Arbeitslast ausreicht, und skalieren Sie sie bei Speicherengpässen nach oben.

Auf das Gateway kann per SSH-Portweiterleitung von Ihrem Laptop aus zugegriffen werden. Alternativ können Sie den Port direkt freigeben, wenn Sie Firewallregeln und Tokens selbst verwalten.

Diese Anleitung verwendet Debian auf GCP Compute Engine. Ubuntu funktioniert ebenfalls; passen Sie die Pakete entsprechend an. Den allgemeinen Docker-Ablauf finden Sie unter [Docker](/de/install/docker).

## Voraussetzungen

- GCP-Konto (`e2-micro` ist für das kostenlose Kontingent qualifiziert)
- `gcloud` CLI oder die [Cloud Console](https://console.cloud.google.com)
- SSH-Zugriff von Ihrem Laptop
- Docker und Docker Compose
- Anmeldedaten für die Modellauthentifizierung
- Optionale Provider-Anmeldedaten (WhatsApp-QR-Code, Telegram-Bot-Token, Gmail OAuth)
- Etwa 20–30 Minuten

## Schnellverfahren

1. Erstellen Sie ein GCP-Projekt und aktivieren Sie die Abrechnung sowie die Compute Engine API
2. Erstellen Sie eine Compute-Engine-VM (`e2-small`, Debian 12, 20GB)
3. Stellen Sie per SSH eine Verbindung zur VM her und installieren Sie Docker
4. Klonen Sie das OpenClaw-Repository
5. Erstellen Sie persistente Hostverzeichnisse
6. Konfigurieren Sie `.env` und `docker-compose.yml`
7. Integrieren Sie die erforderlichen Binärdateien, erstellen Sie das Image und starten Sie es

<Steps>
  <Step title="gcloud CLI installieren (oder Console verwenden)">
    Installieren Sie sie über [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) und führen Sie anschließend Folgendes aus:

    ```bash
    gcloud init
    gcloud auth login
    ```

    Alternativ können Sie alle folgenden Schritte über die Weboberfläche der [Cloud Console](https://console.cloud.google.com) ausführen.

  </Step>

  <Step title="GCP-Projekt erstellen">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Aktivieren Sie die Abrechnung unter [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (für Compute Engine erforderlich).

    Entsprechendes Vorgehen in der Console: IAM & Admin > Create Project, Abrechnung aktivieren, anschließend APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="VM erstellen">
    | Typ       | Spezifikationen           | Kosten                       | Hinweise                                              |
    | --------- | ------------------------- | ---------------------------- | ----------------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM           | ca. $25/Monat                | Am zuverlässigsten für lokale Docker-Builds           |
    | e2-small  | 2 vCPU, 2GB RAM           | ca. $12/Monat                | Empfohlenes Minimum für einen Docker-Build            |
    | e2-micro  | 2 vCPU (geteilt), 1GB RAM | Für kostenloses Kontingent qualifiziert | Schlägt beim Docker-Build häufig wegen Speichermangels fehl (Exit-Code 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Per SSH mit der VM verbinden">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console: Klicken Sie im Compute-Engine-Dashboard neben der VM auf "SSH".

    Die Übertragung des SSH-Schlüssels kann nach dem Erstellen der VM 1–2 Minuten dauern. Warten Sie und versuchen Sie es erneut, falls die Verbindung abgelehnt wird.

  </Step>

  <Step title="Docker installieren (auf der VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Melden Sie sich ab und wieder an, damit die Gruppenänderung wirksam wird, und stellen Sie anschließend erneut per SSH eine Verbindung her:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Überprüfen Sie die Installation:

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

    Diese Anleitung erstellt ein benutzerdefiniertes Image, damit alle integrierten Binärdateien Neustarts überstehen.

  </Step>

  <Step title="Persistente Hostverzeichnisse erstellen">
    Docker-Container sind flüchtig; sämtliche langlebigen Zustandsdaten müssen auf dem Host gespeichert werden.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Umgebungsvariablen konfigurieren">
    Erstellen Sie `.env` im Stammverzeichnis des Repositorys:

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Legen Sie `OPENCLAW_GATEWAY_TOKEN` fest, um das stabile Gateway-Token über
    `.env` zu verwalten. Andernfalls konfigurieren Sie `gateway.auth.token`, bevor Sie sich bei Clients
    auf die Verfügbarkeit über Neustarts hinweg verlassen. Wenn keines von beiden festgelegt ist, verwendet OpenClaw für
    diesen Start ein Token, das nur während der Laufzeit gültig ist. Generieren Sie ein Schlüsselbundpasswort für `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Committen Sie diese Datei nicht.** Sie enthält Container-/Laufzeit-Umgebungsvariablen wie
    `OPENCLAW_GATEWAY_TOKEN`. Gespeicherte OAuth-/API-Schlüssel-Authentifizierungsdaten für Provider befinden sich im
    eingebundenen `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker-Compose-Konfiguration">
    Erstellen oder aktualisieren Sie `docker-compose.yml`:

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
          # Empfohlen: Beschränken Sie das Gateway auf der VM auf die Loopback-Schnittstelle; greifen Sie über einen SSH-Tunnel darauf zu.
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

    `--allow-unconfigured` dient nur zur Vereinfachung der Ersteinrichtung und ersetzt keine ordnungsgemäße Gateway-Konfiguration. Legen Sie dennoch eine Authentifizierung (`gateway.auth.token` oder Passwort) und einen sicheren Bindungsmodus für Ihre Bereitstellung fest.

  </Step>

  <Step title="Gemeinsame Laufzeitschritte für Docker-VMs">
    Befolgen Sie die gemeinsame Laufzeitanleitung für den allgemeinen Ablauf auf einem Docker-Host:

    - [Erforderliche Binärdateien in das Image integrieren](/de/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Erstellen und starten](/de/install/docker-vm-runtime#build-and-launch)
    - [Speicherorte persistenter Daten](/de/install/docker-vm-runtime#what-persists-where)
    - [Aktualisierungen](/de/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-spezifische Hinweise zum Start">
    Wenn der Build während `pnpm install --frozen-lockfile` mit `Killed` oder `exit code 137` fehlschlägt, verfügt die VM nicht über genügend Arbeitsspeicher. Verwenden Sie mindestens `e2-small` oder `e2-medium` für zuverlässigere erste Builds.

    Konfigurieren Sie bei der Bindung an das LAN (`OPENCLAW_GATEWAY_BIND=lan`) vor dem Fortfahren einen vertrauenswürdigen Browser-Ursprung:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Ersetzen Sie `18789` durch den von Ihnen konfigurierten Port, falls Sie ihn geändert haben.

  </Step>

  <Step title="Zugriff von Ihrem Laptop">
    Erstellen Sie einen SSH-Tunnel zur Weiterleitung des Gateway-Ports:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser.

    Geben Sie erneut einen bereinigten Dashboard-Link aus:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Wenn die Benutzeroberfläche zur Authentifizierung mit einem gemeinsamen Geheimnis auffordert, fügen Sie das konfigurierte Token oder
    Passwort in die Einstellungen der Control UI ein (dieser Docker-Ablauf schreibt standardmäßig ein Token;
    verwenden Sie stattdessen Ihr konfiguriertes Passwort, falls Sie zur Passwortauthentifizierung
    gewechselt haben).

    Wenn die Control UI `unauthorized` oder `disconnected (1008): pairing required` anzeigt, genehmigen Sie das Browsergerät:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Die gemeinsame Übersicht zur Persistenz finden Sie unter [Docker-VM-Laufzeit](/de/install/docker-vm-runtime#what-persists-where), den [Aktualisierungsablauf](/de/install/docker-vm-runtime#updates) finden Sie ebenfalls dort.

  </Step>
</Steps>

## Fehlerbehebung

**SSH-Verbindung abgelehnt**

Die Übertragung des SSH-Schlüssels kann nach dem Erstellen der VM 1–2 Minuten dauern. Warten Sie und versuchen Sie es erneut.

**Probleme mit OS Login**

Überprüfen Sie Ihr OS-Login-Profil:

```bash
gcloud compute os-login describe-profile
```

Stellen Sie sicher, dass Ihr Konto über die erforderlichen IAM-Berechtigungen verfügt (Compute OS Login oder Compute OS Admin Login).

**Nicht genügend Arbeitsspeicher (OOM)**

Wenn der Docker-Build mit `Killed` und `exit code 137` fehlschlägt, wurde die VM aufgrund von Speichermangel beendet:

```bash
# Zuerst die VM anhalten
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Maschinentyp ändern
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM starten
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Dienstkonten (bewährte Sicherheitsmethode)

Für die persönliche Nutzung ist Ihr standardmäßiges Benutzerkonto ausreichend. Erstellen Sie für Automatisierung oder CI/CD ein dediziertes Dienstkonto mit minimalen Berechtigungen:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Vermeiden Sie die Rolle Owner für die Automatisierung; verwenden Sie die restriktivste geeignete Rolle. Weitere Informationen finden Sie unter [Rollen verstehen](https://cloud.google.com/iam/docs/understanding-roles).

## Nächste Schritte

- Messaging-Kanäle einrichten: [Kanäle](/de/channels)
- Lokale Geräte als Nodes koppeln: [Nodes](/de/nodes)
- Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Azure](/de/install/azure)
- [VPS-Hosting](/de/vps)
