---
read_when:
    - Je wilt OpenClaw 24/7 op GCP laten draaien
    - U wilt een productieklare, permanent actieve Gateway op uw eigen VM
    - Je wilt volledige controle over persistentie, binaire bestanden en herstartgedrag
summary: Voer OpenClaw Gateway 24/7 uit op een GCP Compute Engine-VM (Docker) met duurzame status
title: GCP
x-i18n:
    generated_at: "2026-07-12T09:03:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Voer een permanente OpenClaw Gateway uit op een GCP Compute Engine-VM met Docker, met duurzame statusopslag, ingebouwde binaire bestanden en veilig herstartgedrag.

De prijs varieert per machinetype en regio; kies de kleinste VM die geschikt is voor je werklast en schaal op als er OOM-fouten optreden.

De Gateway is toegankelijk vanaf je laptop via SSH-poortdoorsturing, of via directe openstelling van de poort als je zelf de firewall en tokens beheert.

Deze handleiding gebruikt Debian op GCP Compute Engine. Ubuntu werkt ook; pas de pakketten dienovereenkomstig aan. Zie [Docker](/nl/install/docker) voor de algemene Docker-procedure.

## Wat je nodig hebt

- GCP-account (`e2-micro` komt in aanmerking voor de gratis laag)
- `gcloud` CLI of de [Cloud Console](https://console.cloud.google.com)
- SSH-toegang vanaf je laptop
- Docker en Docker Compose
- Authenticatiegegevens voor het model
- Optionele providerreferenties (WhatsApp-QR-code, Telegram-bottoken, Gmail OAuth)
- Ongeveer 20-30 minuten

## Snelle procedure

1. Maak een GCP-project, schakel facturering en de Compute Engine API in
2. Maak een Compute Engine-VM (`e2-small`, Debian 12, 20 GB)
3. Maak via SSH verbinding met de VM en installeer Docker
4. Kloon de OpenClaw-repository
5. Maak permanente hostmappen
6. Configureer `.env` en `docker-compose.yml`
7. Bouw de vereiste binaire bestanden in, bouw de image en start deze

<Steps>
  <Step title="Installeer de gcloud CLI (of gebruik de Console)">
    Installeer deze via [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) en voer vervolgens uit:

    ```bash
    gcloud init
    gcloud auth login
    ```

    Je kunt in plaats daarvan ook alle onderstaande stappen uitvoeren via de webinterface van de [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="Maak een GCP-project">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Schakel facturering in via [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (vereist voor Compute Engine).

    Equivalent in de Console: IAM & Admin > Create Project, schakel facturering in en ga vervolgens naar APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="Maak de VM">
    | Type      | Specificaties             | Kosten                       | Opmerkingen                                          |
    | --------- | ------------------------- | ---------------------------- | ---------------------------------------------------- |
    | e2-medium | 2 vCPU, 4 GB RAM          | Ongeveer $ 25 per maand      | Meest betrouwbaar voor lokale Docker-builds          |
    | e2-small  | 2 vCPU, 2 GB RAM          | Ongeveer $ 12 per maand      | Aanbevolen minimum voor een Docker-build              |
    | e2-micro  | 2 vCPU (gedeeld), 1 GB RAM | Komt in aanmerking voor gratis laag | Mislukt vaak door OOM tijdens Docker-build (afsluitcode 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Maak via SSH verbinding met de VM">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console: klik op "SSH" naast de VM in het Compute Engine-dashboard.

    Het doorgeven van SSH-sleutels kan na het maken van de VM 1-2 minuten duren; wacht en probeer het opnieuw als de verbinding wordt geweigerd.

  </Step>

  <Step title="Installeer Docker (op de VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Meld je af en weer aan om de groepswijziging van kracht te laten worden en maak daarna opnieuw via SSH verbinding:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Controleer:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Kloon de OpenClaw-repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Deze handleiding bouwt een aangepaste image, zodat alle ingebouwde binaire bestanden behouden blijven na herstarts.

  </Step>

  <Step title="Maak permanente hostmappen">
    Docker-containers zijn tijdelijk; alle langlevende status moet op de host worden opgeslagen.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configureer omgevingsvariabelen">
    Maak `.env` in de hoofdmap van de repository:

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

    Stel `OPENCLAW_GATEWAY_TOKEN` in om het stabiele Gateway-token via
    `.env` te beheren; configureer anders `gateway.auth.token` voordat je
    erop vertrouwt dat clients na herstarts verbinding kunnen maken. Als geen
    van beide is ingesteld, gebruikt OpenClaw voor die startsessie een token
    dat alleen tijdens runtime bestaat. Genereer een wachtwoord voor de
    sleutelring voor `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Commit dit bestand niet.** Het bevat omgevingsvariabelen voor de
    container/runtime, zoals `OPENCLAW_GATEWAY_TOKEN`. Opgeslagen
    OAuth-/API-sleutelauthenticatie voor providers staat in het gekoppelde
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker Compose-configuratie">
    Maak of werk `docker-compose.yml` bij:

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
          # Aanbevolen: houd de Gateway op de VM alleen op loopback; gebruik een SSH-tunnel voor toegang.
          # Verwijder om deze openbaar toegankelijk te maken het voorvoegsel `127.0.0.1:` en configureer de firewall dienovereenkomstig.
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

    `--allow-unconfigured` is alleen bedoeld voor gemak tijdens de initiële configuratie en is geen vervanging voor een echte Gateway-configuratie. Stel nog steeds authenticatie (`gateway.auth.token` of een wachtwoord) en een veilige bindingsmodus in voor je implementatie.

  </Step>

  <Step title="Gedeelde runtimestappen voor Docker-VM's">
    Volg de gedeelde runtimehandleiding voor de algemene Docker-hostprocedure:

    - [Bouw vereiste binaire bestanden in de image in](/nl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bouw en start](/nl/install/docker-vm-runtime#build-and-launch)
    - [Wat waar permanent wordt opgeslagen](/nl/install/docker-vm-runtime#what-persists-where)
    - [Updates](/nl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-specifieke opmerkingen voor het starten">
    Als de build mislukt met `Killed` of `exit code 137` tijdens `pnpm install --frozen-lockfile`, heeft de VM onvoldoende geheugen. Gebruik minimaal `e2-small`, of `e2-medium` voor betrouwbaardere eerste builds.

    Wanneer je aan LAN bindt (`OPENCLAW_GATEWAY_BIND=lan`), moet je een vertrouwde browseroorsprong configureren voordat je verdergaat:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Vervang `18789` door je geconfigureerde poort als je deze hebt gewijzigd.

  </Step>

  <Step title="Toegang vanaf je laptop">
    Maak een SSH-tunnel om de Gateway-poort door te sturen:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Open `http://127.0.0.1:18789/` in je browser.

    Toon opnieuw een overzichtelijke dashboardlink:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Als de gebruikersinterface om authenticatie met een gedeeld geheim vraagt,
    plak je het geconfigureerde token of wachtwoord in de instellingen van de
    Control UI (deze Docker-procedure schrijft standaard een token; gebruik in
    plaats daarvan je geconfigureerde wachtwoord als je bent overgeschakeld
    op wachtwoordauthenticatie).

    Als de Control UI `unauthorized` of `disconnected (1008): pairing required` weergeeft, keur je het browserapparaat goed:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Zie [Docker-VM-runtime](/nl/install/docker-vm-runtime#what-persists-where) voor het gedeelde overzicht van permanente opslag en de [updateprocedure](/nl/install/docker-vm-runtime#updates).

  </Step>
</Steps>

## Problemen oplossen

**SSH-verbinding geweigerd**

Het doorgeven van SSH-sleutels kan na het maken van de VM 1-2 minuten duren. Wacht en probeer het opnieuw.

**Problemen met OS Login**

Controleer je OS Login-profiel:

```bash
gcloud compute os-login describe-profile
```

Controleer of je account de vereiste IAM-machtigingen heeft (Compute OS Login of Compute OS Admin Login).

**Onvoldoende geheugen (OOM)**

Als de Docker-build mislukt met `Killed` en `exit code 137`, is het VM-proces vanwege OOM beëindigd:

```bash
# Stop eerst de VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Wijzig het machinetype
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start de VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Serviceaccounts (aanbevolen beveiligingspraktijk)

Voor persoonlijk gebruik volstaat je standaardgebruikersaccount. Maak voor automatisering of CI/CD een speciaal serviceaccount met minimale machtigingen:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Vermijd de rol Owner voor automatisering; gebruik de meest beperkte rol die werkt. Zie [Inzicht in rollen](https://cloud.google.com/iam/docs/understanding-roles).

## Volgende stappen

- Stel berichtenkanalen in: [Kanalen](/nl/channels)
- Koppel lokale apparaten als nodes: [Nodes](/nl/nodes)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Azure](/nl/install/azure)
- [VPS-hosting](/nl/vps)
