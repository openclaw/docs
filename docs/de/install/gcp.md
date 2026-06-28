---
read_when:
    - Sie möchten OpenClaw rund um die Uhr auf GCP betreiben
    - Sie möchten ein produktionsreifes, dauerhaft aktives Gateway auf Ihrer eigenen VM betreiben
    - Sie möchten vollständige Kontrolle über Persistenz, Binärdateien und Neustartverhalten
summary: OpenClaw Gateway 24/7 auf einer GCP Compute Engine-VM (Docker) mit persistentem Zustand ausführen
title: GCP
x-i18n:
    generated_at: "2026-05-06T17:57:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 678253bd90f0694668400ffddba957e442f8aaed3f5308af3c2481940e104733
    source_path: install/gcp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Führen Sie ein dauerhaft laufendes OpenClaw Gateway auf einer GCP Compute Engine-VM mit Docker aus, mit dauerhaftem Zustand, integrierten Binärdateien und sicherem Neustartverhalten.

Wenn Sie „OpenClaw 24/7 für ca. 5-12 USD/Monat“ möchten, ist dies eine zuverlässige Einrichtung auf Google Cloud.
Die Preise variieren je nach Maschinentyp und Region; wählen Sie die kleinste VM, die zu Ihrer Workload passt, und skalieren Sie nach oben, wenn OOMs auftreten.

## Was machen wir (einfach erklärt)?

- Ein GCP-Projekt erstellen und Abrechnung aktivieren
- Eine Compute Engine-VM erstellen
- Docker installieren (isolierte App-Laufzeitumgebung)
- Das OpenClaw Gateway in Docker starten
- `~/.openclaw` + `~/.openclaw/workspace` auf dem Host dauerhaft speichern (übersteht Neustarts/Neuaufbauten)
- Über einen SSH-Tunnel von Ihrem Laptop auf die Control UI zugreifen

Dieser eingehängte Zustand `~/.openclaw` enthält `openclaw.json`, agentenspezifische
`agents/<agentId>/agent/auth-profiles.json` und `.env`.

Auf das Gateway kann zugegriffen werden über:

- SSH-Portweiterleitung von Ihrem Laptop
- Direkte Portfreigabe, wenn Sie Firewalling und Tokens selbst verwalten

Diese Anleitung verwendet Debian auf GCP Compute Engine.
Ubuntu funktioniert ebenfalls; ordnen Sie die Pakete entsprechend zu.
Den generischen Docker-Ablauf finden Sie unter [Docker](/de/install/docker).

---

## Schnellweg (erfahrene Betreiber)

1. GCP-Projekt erstellen + Compute Engine API aktivieren
2. Compute Engine-VM erstellen (e2-small, Debian 12, 20 GB)
3. Per SSH mit der VM verbinden
4. Docker installieren
5. OpenClaw-Repository klonen
6. Dauerhafte Host-Verzeichnisse erstellen
7. `.env` und `docker-compose.yml` konfigurieren
8. Erforderliche Binärdateien integrieren, bauen und starten

---

## Was Sie benötigen

- GCP-Konto (für e2-micro im Free Tier geeignet)
- Installierte gcloud CLI (oder Cloud Console verwenden)
- SSH-Zugriff von Ihrem Laptop
- Grundlegende Vertrautheit mit SSH + Kopieren/Einfügen
- ca. 20-30 Minuten
- Docker und Docker Compose
- Modell-Authentifizierungsdaten
- Optionale Provider-Zugangsdaten
  - WhatsApp-QR
  - Telegram-Bot-Token
  - Gmail-OAuth

---

<Steps>
  <Step title="gcloud CLI installieren (oder Console verwenden)">
    **Option A: gcloud CLI** (für Automatisierung empfohlen)

    Installieren Sie von [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Initialisieren und authentifizieren:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Option B: Cloud Console**

    Alle Schritte können über die Web-UI unter [https://console.cloud.google.com](https://console.cloud.google.com) durchgeführt werden

  </Step>

  <Step title="Ein GCP-Projekt erstellen">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Aktivieren Sie die Abrechnung unter [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (für Compute Engine erforderlich).

    Aktivieren Sie die Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Gehen Sie zu IAM & Admin > Create Project
    2. Geben Sie einen Namen ein und erstellen Sie es
    3. Aktivieren Sie die Abrechnung für das Projekt
    4. Navigieren Sie zu APIs & Services > Enable APIs > suchen Sie nach „Compute Engine API“ > Enable

  </Step>

  <Step title="Die VM erstellen">
    **Maschinentypen:**

    | Typ       | Spezifikationen          | Kosten             | Hinweise                                      |
    | --------- | ------------------------ | ------------------ | --------------------------------------------- |
    | e2-medium | 2 vCPU, 4 GB RAM         | ca. 25 USD/Monat   | Am zuverlässigsten für lokale Docker-Builds   |
    | e2-small  | 2 vCPU, 2 GB RAM         | ca. 12 USD/Monat   | Empfohlenes Minimum für Docker-Builds         |
    | e2-micro  | 2 vCPU (geteilt), 1 GB RAM | Free-Tier-fähig  | Schlägt oft mit Docker-Build-OOM fehl (exit 137) |

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

    1. Gehen Sie zu Compute Engine > VM instances > Create instance
    2. Name: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Maschinentyp: `e2-small`
    5. Boot-Datenträger: Debian 12, 20 GB
    6. Erstellen

  </Step>

  <Step title="Per SSH mit der VM verbinden">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Klicken Sie im Compute Engine-Dashboard neben Ihrer VM auf die Schaltfläche „SSH“.

    Hinweis: Die Verteilung von SSH-Schlüsseln kann nach der VM-Erstellung 1-2 Minuten dauern. Wenn die Verbindung abgelehnt wird, warten Sie und versuchen Sie es erneut.

  </Step>

  <Step title="Docker installieren (auf der VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Melden Sie sich ab und wieder an, damit die Gruppenänderung wirksam wird:

    ```bash
    exit
    ```

    Verbinden Sie sich dann erneut per SSH:

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

    Diese Anleitung geht davon aus, dass Sie ein eigenes Image bauen, um die dauerhafte Verfügbarkeit der Binärdateien zu garantieren.

  </Step>

  <Step title="Dauerhafte Host-Verzeichnisse erstellen">
    Docker-Container sind flüchtig.
    Jeder langlebige Zustand muss auf dem Host liegen.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Umgebungsvariablen konfigurieren">
    Erstellen Sie `.env` im Repository-Root.

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

    Setzen Sie `OPENCLAW_GATEWAY_TOKEN`, wenn Sie den stabilen Gateway-Token
    über `.env` verwalten möchten; andernfalls konfigurieren Sie `gateway.auth.token`,
    bevor Sie sich über Neustarts hinweg auf Clients verlassen. Wenn keine der
    beiden Quellen vorhanden ist, verwendet OpenClaw für diesen Start einen
    rein laufzeitgebundenen Token. Generieren Sie ein Keyring-Passwort und fügen
    Sie es in `GOG_KEYRING_PASSWORD` ein:

    ```bash
    openssl rand -hex 32
    ```

    **Committen Sie diese Datei nicht.**

    Diese `.env`-Datei ist für Container-/Laufzeitumgebungsvariablen wie `OPENCLAW_GATEWAY_TOKEN`.
    Gespeicherte Provider-OAuth-/API-Schlüssel-Authentifizierung liegt in der eingehängten Datei
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker Compose-Konfiguration">
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
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
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

    `--allow-unconfigured` dient nur der bequemen Ersteinrichtung und ersetzt keine ordnungsgemäße Gateway-Konfiguration. Setzen Sie trotzdem Authentifizierung (`gateway.auth.token` oder Passwort) und verwenden Sie sichere Bind-Einstellungen für Ihr Deployment.

  </Step>

  <Step title="Gemeinsame Docker-VM-Laufzeitschritte">
    Verwenden Sie die gemeinsame Laufzeitanleitung für den allgemeinen Docker-Host-Ablauf:

    - [Erforderliche Binärdateien in das Image integrieren](/de/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bauen und starten](/de/install/docker-vm-runtime#build-and-launch)
    - [Was wo dauerhaft gespeichert wird](/de/install/docker-vm-runtime#what-persists-where)
    - [Updates](/de/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-spezifische Starthinweise">
    Wenn der Build auf GCP während `pnpm install --frozen-lockfile` mit `Killed` oder `exit code 137` fehlschlägt, hat die VM nicht genug Arbeitsspeicher. Verwenden Sie mindestens `e2-small` oder `e2-medium` für zuverlässigere erste Builds.

    Wenn Sie an das LAN binden (`OPENCLAW_GATEWAY_BIND=lan`), konfigurieren Sie einen vertrauenswürdigen Browser-Origin, bevor Sie fortfahren:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Wenn Sie den Gateway-Port geändert haben, ersetzen Sie `18789` durch Ihren konfigurierten Port.

  </Step>

  <Step title="Zugriff von Ihrem Laptop">
    Erstellen Sie einen SSH-Tunnel, um den Gateway-Port weiterzuleiten:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Öffnen Sie dies in Ihrem Browser:

    `http://127.0.0.1:18789/`

    Geben Sie einen sauberen Dashboard-Link erneut aus:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Wenn die UI zur Shared-Secret-Authentifizierung auffordert, fügen Sie den
    konfigurierten Token oder das Passwort in den Control UI-Einstellungen ein.
    Dieser Docker-Ablauf schreibt standardmäßig einen Token; wenn Sie die
    Container-Konfiguration auf Passwortauthentifizierung umstellen, verwenden
    Sie stattdessen dieses Passwort.

    Wenn die Control UI `unauthorized` oder `disconnected (1008): pairing required` anzeigt, genehmigen Sie das Browsergerät:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Benötigen Sie die Referenz zu gemeinsamer Persistenz und Updates erneut?
    Siehe [Docker-VM-Laufzeit](/de/install/docker-vm-runtime#what-persists-where) und [Docker-VM-Laufzeit-Updates](/de/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Fehlerbehebung

**SSH-Verbindung abgelehnt**

Die Verteilung von SSH-Schlüsseln kann nach der VM-Erstellung 1-2 Minuten dauern. Warten Sie und versuchen Sie es erneut.

**Probleme mit OS Login**

Prüfen Sie Ihr OS Login-Profil:

```bash
gcloud compute os-login describe-profile
```

Stellen Sie sicher, dass Ihr Konto über die erforderlichen IAM-Berechtigungen verfügt (Compute OS Login oder Compute OS Admin Login).

**Nicht genügend Arbeitsspeicher (OOM)**

Wenn der Docker-Build mit `Killed` und `exit code 137` fehlschlägt, wurde die VM wegen OOM beendet. Führen Sie ein Upgrade auf e2-small (Minimum) oder e2-medium (für zuverlässige lokale Builds empfohlen) durch:

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Dienstkonten (bewährte Sicherheitsmethode)

Für die persönliche Nutzung funktioniert Ihr Standard-Benutzerkonto problemlos.

Für Automatisierung oder CI/CD-Pipelines erstellen Sie ein dediziertes Dienstkonto mit minimalen Berechtigungen:

1. Erstellen Sie ein Dienstkonto:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Gewähren Sie die Rolle Compute Instance Admin (oder eine enger gefasste benutzerdefinierte Rolle):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Vermeiden Sie die Verwendung der Owner-Rolle für Automatisierung. Verwenden Sie das Prinzip der geringsten Berechtigung.

Details zu IAM-Rollen finden Sie unter [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles).

---

## Nächste Schritte

- Messaging-Kanäle einrichten: [Channels](/de/channels)
- Lokale Geräte als Nodes koppeln: [Nodes](/de/nodes)
- Gateway konfigurieren: [Gateway-Konfiguration](/de/gateway/configuration)

## Verwandt

- [Installationsübersicht](/de/install)
- [Azure](/de/install/azure)
- [VPS-Hosting](/de/vps)
