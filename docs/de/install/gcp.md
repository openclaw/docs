---
read_when:
    - Sie möchten OpenClaw rund um die Uhr auf GCP ausführen
    - Sie möchten einen produktionsreifen, dauerhaft verfügbaren Gateway auf Ihrer eigenen VM.
    - Sie möchten vollständige Kontrolle über Persistenz, Binärdateien und das Neustartverhalten.
summary: OpenClaw Gateway rund um die Uhr auf einer GCP-Compute-Engine-VM (Docker) mit persistentem Zustand ausführen
title: GCP
x-i18n:
    generated_at: "2026-07-12T01:48:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Führen Sie einen persistenten OpenClaw Gateway auf einer GCP-Compute-Engine-VM mit Docker aus – mit dauerhaftem Zustand, fest in das Image integrierten Binärdateien und sicherem Neustartverhalten.

Die Preise variieren je nach Maschinentyp und Region. Wählen Sie die kleinste VM, die für Ihre Arbeitslast ausreicht, und skalieren Sie sie hoch, wenn Fehler wegen Speichermangels auftreten.

Auf den Gateway können Sie von Ihrem Laptop aus über SSH-Portweiterleitung zugreifen oder über eine direkte Portfreigabe, wenn Sie Firewallregeln und Token selbst verwalten.

Diese Anleitung verwendet Debian auf GCP Compute Engine. Ubuntu funktioniert ebenfalls; passen Sie die Pakete entsprechend an. Den allgemeinen Docker-Ablauf finden Sie unter [Docker](/de/install/docker).

## Voraussetzungen

- GCP-Konto (`e2-micro` ist für das kostenlose Kontingent berechtigt)
- `gcloud`-CLI oder die [Cloud Console](https://console.cloud.google.com)
- SSH-Zugriff von Ihrem Laptop
- Docker und Docker Compose
- Anmeldedaten für die Modellauthentifizierung
- Optionale Provider-Anmeldedaten (WhatsApp-QR-Code, Telegram-Bot-Token, Gmail OAuth)
- Etwa 20–30 Minuten

## Schnellstart

1. Erstellen Sie ein GCP-Projekt und aktivieren Sie die Abrechnung sowie die Compute Engine API
2. Erstellen Sie eine Compute-Engine-VM (`e2-small`, Debian 12, 20 GB)
3. Stellen Sie per SSH eine Verbindung zur VM her und installieren Sie Docker
4. Klonen Sie das OpenClaw-Repository
5. Erstellen Sie persistente Verzeichnisse auf dem Host
6. Konfigurieren Sie `.env` und `docker-compose.yml`
7. Integrieren Sie die erforderlichen Binärdateien in das Image, erstellen Sie es und starten Sie es

<Steps>
  <Step title="gcloud-CLI installieren (oder Console verwenden)">
    Installieren Sie sie über [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install), und führen Sie anschließend Folgendes aus:

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

    Entsprechender Ablauf in der Console: IAM & Admin > Create Project, Abrechnung aktivieren, anschließend APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="VM erstellen">
    | Typ       | Spezifikationen           | Kosten                         | Hinweise                                                      |
    | --------- | ------------------------- | ------------------------------ | ------------------------------------------------------------- |
    | e2-medium | 2 vCPU, 4 GB RAM          | ca. 25 USD/Monat               | Am zuverlässigsten für lokale Docker-Builds                   |
    | e2-small  | 2 vCPU, 2 GB RAM          | ca. 12 USD/Monat               | Empfohlenes Minimum für einen Docker-Build                    |
    | e2-micro  | 2 vCPU (geteilt), 1 GB RAM | Für kostenloses Kontingent berechtigt | Scheitert bei Docker-Builds häufig wegen Speichermangels (Exit-Code 137) |

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

    Die Übertragung des SSH-Schlüssels kann nach dem Erstellen der VM 1–2 Minuten dauern. Warten Sie und versuchen Sie es erneut, wenn die Verbindung abgelehnt wird.

  </Step>

  <Step title="Docker installieren (auf der VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Melden Sie sich ab und wieder an, damit die Gruppenänderung wirksam wird. Stellen Sie anschließend erneut eine SSH-Verbindung her:

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

    In dieser Anleitung wird ein benutzerdefiniertes Image erstellt, damit alle darin integrierten Binärdateien Neustarts überstehen.

  </Step>

  <Step title="Persistente Hostverzeichnisse erstellen">
    Docker-Container sind flüchtig; alle dauerhaft benötigten Zustandsdaten müssen auf dem Host gespeichert werden.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Umgebungsvariablen konfigurieren">
    Erstellen Sie im Stammverzeichnis des Repositorys eine `.env`-Datei:

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
    `.env` zu verwalten. Andernfalls konfigurieren Sie `gateway.auth.token`,
    bevor Sie sich darauf verlassen, dass Clients über Neustarts hinweg
    funktionieren. Wenn keines von beiden festgelegt ist, verwendet OpenClaw
    für diesen Start ein ausschließlich zur Laufzeit gültiges Token. Erzeugen
    Sie ein Schlüsselbund-Passwort für `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Übertragen Sie diese Datei nicht in das Repository.** Sie enthält
    Umgebungsvariablen für Container und Laufzeit, beispielsweise
    `OPENCLAW_GATEWAY_TOKEN`. Gespeicherte OAuth- und API-Schlüssel-
    Authentifizierungsdaten der Provider befinden sich in der eingebundenen
    Datei `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

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
          # Empfohlen: Beschränken Sie den Gateway auf der VM auf Loopback; greifen Sie über einen SSH-Tunnel darauf zu.
          # Um ihn öffentlich verfügbar zu machen, entfernen Sie das Präfix `127.0.0.1:` und passen Sie die Firewall entsprechend an.
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

    `--allow-unconfigured` dient nur der bequemeren Ersteinrichtung und ersetzt keine ordnungsgemäße Gateway-Konfiguration. Legen Sie weiterhin die Authentifizierung (`gateway.auth.token` oder ein Passwort) sowie einen sicheren Bindungsmodus für Ihre Bereitstellung fest.

  </Step>

  <Step title="Gemeinsame Laufzeitschritte für Docker-VMs">
    Befolgen Sie für den allgemeinen Ablauf auf einem Docker-Host die gemeinsame Laufzeitanleitung:

    - [Erforderliche Binärdateien in das Image integrieren](/de/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Erstellen und starten](/de/install/docker-vm-runtime#build-and-launch)
    - [Welche Daten wo persistent gespeichert werden](/de/install/docker-vm-runtime#what-persists-where)
    - [Aktualisierungen](/de/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-spezifische Hinweise zum Start">
    Wenn der Build während `pnpm install --frozen-lockfile` mit `Killed` oder `exit code 137` fehlschlägt, steht der VM nicht genügend Arbeitsspeicher zur Verfügung. Verwenden Sie mindestens `e2-small` oder `e2-medium`, um zuverlässigere erste Builds zu erhalten.

    Wenn Sie die Bindung an das LAN verwenden (`OPENCLAW_GATEWAY_BIND=lan`), konfigurieren Sie vor dem Fortfahren einen vertrauenswürdigen Browser-Ursprung:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Ersetzen Sie `18789` durch den von Ihnen konfigurierten Port, falls Sie ihn geändert haben.

  </Step>

  <Step title="Zugriff von Ihrem Laptop">
    Erstellen Sie einen SSH-Tunnel, um den Gateway-Port weiterzuleiten:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser.

    Geben Sie einen bereinigten Dashboard-Link erneut aus:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Wenn die Benutzeroberfläche zur Authentifizierung mit einem gemeinsamen
    Geheimnis auffordert, fügen Sie das konfigurierte Token oder Passwort in
    die Einstellungen der Control UI ein. Dieser Docker-Ablauf schreibt
    standardmäßig ein Token; verwenden Sie stattdessen Ihr konfiguriertes
    Passwort, wenn Sie zur Passwortauthentifizierung gewechselt haben.

    Wenn die Control UI `unauthorized` oder `disconnected (1008): pairing required` anzeigt, genehmigen Sie das Browsergerät:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Die gemeinsame Übersicht zur Persistenz finden Sie unter [Docker-VM-Laufzeit](/de/install/docker-vm-runtime#what-persists-where), den [Aktualisierungsablauf](/de/install/docker-vm-runtime#updates) ebenfalls dort.

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

Wenn der Docker-Build mit `Killed` und `exit code 137` fehlschlägt, wurde die VM wegen Speichermangels beendet:

```bash
# Zuerst die VM stoppen
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Maschinentyp ändern
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM starten
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Dienstkonten (bewährte Sicherheitsmethode)

Für die persönliche Nutzung ist Ihr standardmäßiges Benutzerkonto ausreichend. Erstellen Sie für Automatisierung oder CI/CD ein eigenes Dienstkonto mit minimalen Berechtigungen:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Vermeiden Sie für Automatisierungen die Rolle „Owner“. Verwenden Sie die restriktivste Rolle, die funktioniert. Weitere Informationen finden Sie unter [Rollen verstehen](https://cloud.google.com/iam/docs/understanding-roles).

## Nächste Schritte

- Nachrichtenkanäle einrichten: [Kanäle](/de/channels)
- Lokale Geräte als Nodes koppeln: [Nodes](/de/nodes)
- Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Azure](/de/install/azure)
- [VPS-Hosting](/de/vps)
