---
read_when:
    - Du möchtest, dass OpenClaw auf GCP rund um die Uhr läuft.
    - Du möchtest ein produktionsreifes, dauerhaft laufendes Gateway auf deiner eigenen VM.
    - Du möchtest die volle Kontrolle über Persistenz, Binärdateien und Neustartverhalten.
summary: OpenClaw Gateway 24/7 auf einer GCP Compute Engine-VM (Docker) mit dauerhaftem Status ausführen
title: GCP
x-i18n:
    generated_at: "2026-04-19T01:11:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b4cf7924cbcfae74f268c88caedb79ed87a6ad37f4910ad65d92a5d99fe49c1
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw auf GCP Compute Engine (Docker, Produktions-VPS-Leitfaden)

## Ziel

Führe ein persistentes OpenClaw Gateway auf einer GCP Compute Engine-VM mit Docker aus, mit dauerhaftem Status, fest integrierten Binärdateien und sicherem Neustartverhalten.

Wenn du „OpenClaw 24/7 für ca. 5–12 $/Monat“ möchtest, ist dies ein zuverlässiges Setup auf Google Cloud.
Die Preise variieren je nach Maschinentyp und Region; wähle die kleinste VM, die zu deiner Arbeitslast passt, und skaliere hoch, wenn du auf OOMs stößt.

## Was machen wir (einfach erklärt)?

- Ein GCP-Projekt erstellen und Abrechnung aktivieren
- Eine Compute Engine-VM erstellen
- Docker installieren (isolierte App-Laufzeit)
- Das OpenClaw Gateway in Docker starten
- `~/.openclaw` + `~/.openclaw/workspace` auf dem Host persistent speichern (überlebt Neustarts/Neubuilds)
- Über einen SSH-Tunnel vom Laptop auf die Control UI zugreifen

Der eingehängte Status in `~/.openclaw` umfasst `openclaw.json`, agentenspezifische
`agents/<agentId>/agent/auth-profiles.json` sowie `.env`.

Auf das Gateway kann zugegriffen werden über:

- SSH-Portweiterleitung von deinem Laptop
- Direkte Portfreigabe, wenn du Firewalling und Tokens selbst verwaltest

Dieser Leitfaden verwendet Debian auf GCP Compute Engine.
Ubuntu funktioniert ebenfalls; ordne die Pakete entsprechend zu.
Für den generischen Docker-Ablauf siehe [Docker](/de/install/docker).

---

## Schneller Weg (erfahrene Betreiber)

1. GCP-Projekt erstellen + Compute Engine API aktivieren
2. Compute Engine-VM erstellen (e2-small, Debian 12, 20GB)
3. Per SSH mit der VM verbinden
4. Docker installieren
5. OpenClaw-Repository klonen
6. Persistente Host-Verzeichnisse erstellen
7. `.env` und `docker-compose.yml` konfigurieren
8. Erforderliche Binärdateien einbinden, bauen und starten

---

## Was du brauchst

- GCP-Konto (für e2-micro für die kostenlose Stufe geeignet)
- installierte gcloud CLI (oder die Cloud Console verwenden)
- SSH-Zugriff von deinem Laptop
- Grundlegende Vertrautheit mit SSH + Copy-and-Paste
- ca. 20–30 Minuten
- Docker und Docker Compose
- Modell-Authentifizierungsdaten
- Optionale Provider-Anmeldedaten
  - WhatsApp-QR
  - Telegram-Bot-Token
  - Gmail-OAuth

---

<Steps>
  <Step title="gcloud CLI installieren (oder die Console verwenden)">
    **Option A: gcloud CLI** (für Automatisierung empfohlen)

    Installation über [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Initialisieren und authentifizieren:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Option B: Cloud Console**

    Alle Schritte können über die Weboberfläche unter [https://console.cloud.google.com](https://console.cloud.google.com) durchgeführt werden

  </Step>

  <Step title="Ein GCP-Projekt erstellen">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Aktiviere die Abrechnung unter [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (für Compute Engine erforderlich).

    Aktiviere die Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Gehe zu IAM & Admin > Create Project
    2. Benenne es und erstelle es
    3. Aktiviere die Abrechnung für das Projekt
    4. Navigiere zu APIs & Services > Enable APIs > suche nach „Compute Engine API“ > Enable

  </Step>

  <Step title="Die VM erstellen">
    **Maschinentypen:**

    | Type      | Specs                    | Cost               | Notes                                            |
    | --------- | ------------------------ | ------------------ | ------------------------------------------------ |
    | e2-medium | 2 vCPU, 4GB RAM          | ~25 $/Monat        | Am zuverlässigsten für lokale Docker-Builds      |
    | e2-small  | 2 vCPU, 2GB RAM          | ~12 $/Monat        | Empfohlenes Minimum für Docker-Builds            |
    | e2-micro  | 2 vCPU (geteilt), 1GB RAM | Für kostenlose Stufe geeignet | Schlägt bei Docker-Builds oft mit OOM fehl (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Gehe zu Compute Engine > VM instances > Create instance
    2. Name: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Maschinentyp: `e2-small`
    5. Boot-Datenträger: Debian 12, 20GB
    6. Erstellen

  </Step>

  <Step title="Per SSH mit der VM verbinden">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Klicke im Compute Engine-Dashboard neben deiner VM auf die Schaltfläche „SSH“.

    Hinweis: Die Verteilung des SSH-Schlüssels kann nach der Erstellung der VM 1–2 Minuten dauern. Wenn die Verbindung verweigert wird, warte kurz und versuche es erneut.

  </Step>

  <Step title="Docker installieren (auf der VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Melde dich ab und wieder an, damit die Gruppenänderung wirksam wird:

    ```bash
    exit
    ```

    Dann per SSH erneut verbinden:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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

    Dieser Leitfaden geht davon aus, dass du ein benutzerdefiniertes Image baust, um die Persistenz der Binärdateien zu garantieren.

  </Step>

  <Step title="Persistente Host-Verzeichnisse erstellen">
    Docker-Container sind vergänglich.
    Jeder langlebige Status muss auf dem Host liegen.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Umgebungsvariablen konfigurieren">
    Erstelle `.env` im Repository-Stammverzeichnis.

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

    Lass `OPENCLAW_GATEWAY_TOKEN` leer, sofern du es nicht ausdrücklich über
    `.env` verwalten möchtest; OpenClaw schreibt beim ersten Start ein zufälliges Gateway-Token in die
    Konfiguration. Erzeuge ein Keyring-Passwort und füge es in
    `GOG_KEYRING_PASSWORD` ein:

    ```bash
    openssl rand -hex 32
    ```

    **Diese Datei nicht committen.**

    Diese `.env`-Datei ist für Container-/Laufzeit-Umgebungsvariablen wie `OPENCLAW_GATEWAY_TOKEN`.
    Gespeicherte Provider-OAuth-/API-Key-Authentifizierung befindet sich in der eingehängten
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker Compose-Konfiguration">
    Erstelle oder aktualisiere `docker-compose.yml`.

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
          # Empfohlen: Das Gateway auf der VM nur an loopback binden; Zugriff per SSH-Tunnel.
          # Um es öffentlich verfügbar zu machen, entferne das Präfix `127.0.0.1:` und konfiguriere die Firewall entsprechend.
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

    `--allow-unconfigured` dient nur dem einfacheren Bootstrap und ersetzt keine ordnungsgemäße Gateway-Konfiguration. Setze weiterhin Authentifizierung (`gateway.auth.token` oder Passwort) und verwende sichere Bind-Einstellungen für dein Deployment.

  </Step>

  <Step title="Gemeinsame Docker-VM-Laufzeitschritte">
    Verwende den gemeinsamen Laufzeitleitfaden für den allgemeinen Docker-Host-Ablauf:

    - [Erforderliche Binärdateien in das Image einbinden](/de/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bauen und starten](/de/install/docker-vm-runtime#build-and-launch)
    - [Was wo persistent gespeichert wird](/de/install/docker-vm-runtime#what-persists-where)
    - [Updates](/de/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-spezifische Start-Hinweise">
    Wenn auf GCP der Build bei `pnpm install --frozen-lockfile` mit `Killed` oder `exit code 137` fehlschlägt, hat die VM zu wenig Arbeitsspeicher. Verwende mindestens `e2-small` oder für zuverlässigere erste Builds `e2-medium`.

    Wenn du an LAN bindest (`OPENCLAW_GATEWAY_BIND=lan`), konfiguriere vor dem Fortfahren eine vertrauenswürdige Browser-Origin:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Wenn du den Gateway-Port geändert hast, ersetze `18789` durch deinen konfigurierten Port.

  </Step>

  <Step title="Zugriff von deinem Laptop">
    Erstelle einen SSH-Tunnel, um den Gateway-Port weiterzuleiten:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Im Browser öffnen:

    `http://127.0.0.1:18789/`

    Einen sauberen Dashboard-Link erneut ausgeben:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Wenn die UI nach Shared-Secret-Authentifizierung fragt, füge das konfigurierte Token oder
    Passwort in die Einstellungen der Control UI ein. Dieser Docker-Ablauf schreibt standardmäßig
    ein Token; wenn du die Container-Konfiguration auf Passwortauthentifizierung umstellst, verwende stattdessen
    dieses Passwort.

    Wenn die Control UI `unauthorized` oder `disconnected (1008): pairing required` anzeigt, genehmige das Browser-Gerät:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Du brauchst die Referenz zu gemeinsamer Persistenz und Updates noch einmal?
    Siehe [Docker VM Runtime](/de/install/docker-vm-runtime#what-persists-where) und [Docker VM Runtime updates](/de/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Fehlerbehebung

**SSH-Verbindung verweigert**

Die Verteilung des SSH-Schlüssels kann nach der Erstellung der VM 1–2 Minuten dauern. Warte kurz und versuche es erneut.

**Probleme mit OS Login**

Prüfe dein OS-Login-Profil:

```bash
gcloud compute os-login describe-profile
```

Stelle sicher, dass dein Konto über die erforderlichen IAM-Berechtigungen verfügt (Compute OS Login oder Compute OS Admin Login).

**Zu wenig Arbeitsspeicher (OOM)**

Wenn der Docker-Build mit `Killed` und `exit code 137` fehlschlägt, wurde die VM durch OOM beendet. Upgrade auf e2-small (Minimum) oder e2-medium (empfohlen für zuverlässige lokale Builds):

```bash
# Stoppe zuerst die VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Maschinentyp ändern
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Die VM starten
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Service Accounts (bewährte Sicherheitsmethode)

Für die persönliche Nutzung funktioniert dein Standardbenutzerkonto problemlos.

Für Automatisierung oder CI/CD-Pipelines erstelle ein dediziertes Service Account mit minimalen Berechtigungen:

1. Ein Service Account erstellen:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Rolle „Compute Instance Admin“ gewähren (oder eine engere benutzerdefinierte Rolle):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Verwende für Automatisierung nicht die Rolle „Owner“. Nutze das Prinzip der geringsten Rechte.

Siehe [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) für Details zu IAM-Rollen.

---

## Nächste Schritte

- Messaging-Kanäle einrichten: [Channels](/de/channels)
- Lokale Geräte als Nodes koppeln: [Nodes](/de/nodes)
- Das Gateway konfigurieren: [Gateway configuration](/de/gateway/configuration)
