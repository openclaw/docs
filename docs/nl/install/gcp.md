---
read_when:
    - Je wilt OpenClaw 24/7 op GCP laten draaien
    - Je wilt een productieklare, altijd actieve Gateway op je eigen VM
    - Je wilt volledige controle over persistentie, binaire bestanden en herstartgedrag
summary: Voer OpenClaw Gateway 24/7 uit op een GCP Compute Engine-VM (Docker) met persistente staat
title: GCP
x-i18n:
    generated_at: "2026-05-06T09:19:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: eefd3a324ababdaa3072cda5354c1d59ddfe80c2f88f24a4ad21208f54636e89
    source_path: install/gcp.md
    workflow: 16
---

Voer een persistente OpenClaw Gateway uit op een GCP Compute Engine-VM met Docker, met duurzame state, ingebakken binaries en veilig herstartgedrag.

Als je "OpenClaw 24/7 voor ~$5-12/maand" wilt, is dit een betrouwbare setup op Google Cloud.
Prijzen verschillen per machinetype en regio; kies de kleinste VM die bij je workload past en schaal op als je OOMs krijgt.

## Wat doen we (in eenvoudige termen)?

- Een GCP-project maken en facturering inschakelen
- Een Compute Engine-VM maken
- Docker installeren (geisoleerde app-runtime)
- De OpenClaw Gateway starten in Docker
- `~/.openclaw` + `~/.openclaw/workspace` op de host persistent maken (overleeft herstarts/rebuilds)
- De Control UI vanaf je laptop openen via een SSH-tunnel

Die gekoppelde `~/.openclaw`-state bevat `openclaw.json`, per-agent
`agents/<agentId>/agent/auth-profiles.json` en `.env`.

De Gateway is toegankelijk via:

- SSH-portforwarding vanaf je laptop
- Directe poortblootstelling als je firewalling en tokens zelf beheert

Deze gids gebruikt Debian op GCP Compute Engine.
Ubuntu werkt ook; stem pakketten overeenkomstig af.
Zie [Docker](/nl/install/docker) voor de generieke Docker-flow.

---

## Snel pad (ervaren operators)

1. Maak een GCP-project + schakel de Compute Engine API in
2. Maak een Compute Engine-VM (e2-small, Debian 12, 20GB)
3. SSH naar de VM
4. Installeer Docker
5. Clone de OpenClaw-repository
6. Maak persistente hostdirectories
7. Configureer `.env` en `docker-compose.yml`
8. Bak vereiste binaries in, bouw en start

---

## Wat je nodig hebt

- GCP-account (free tier geschikt voor e2-micro)
- gcloud CLI geinstalleerd (of gebruik Cloud Console)
- SSH-toegang vanaf je laptop
- Basiscomfort met SSH + kopieren/plakken
- ~20-30 minuten
- Docker en Docker Compose
- Model-authreferenties
- Optionele providerreferenties
  - WhatsApp QR
  - Telegram-bottoken
  - Gmail OAuth

---

<Steps>
  <Step title="Installeer gcloud CLI (of gebruik Console)">
    **Optie A: gcloud CLI** (aanbevolen voor automatisering)

    Installeer vanaf [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Initialiseer en authenticeer:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Optie B: Cloud Console**

    Alle stappen kunnen via de web-UI op [https://console.cloud.google.com](https://console.cloud.google.com) worden uitgevoerd

  </Step>

  <Step title="Maak een GCP-project">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Schakel facturering in op [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (vereist voor Compute Engine).

    Schakel de Compute Engine API in:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Ga naar IAM & Admin > Create Project
    2. Geef het een naam en maak het aan
    3. Schakel facturering in voor het project
    4. Navigeer naar APIs & Services > Enable APIs > zoek "Compute Engine API" > Enable

  </Step>

  <Step title="Maak de VM">
    **Machinetypen:**

    | Type      | Specificaties            | Kosten             | Opmerkingen                                  |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/maand         | Meest betrouwbaar voor lokale Docker-builds  |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/maand         | Minimum aanbevolen voor Docker-build         |
    | e2-micro  | 2 vCPU (gedeeld), 1GB RAM | Geschikt voor free tier | Faalt vaak met Docker-build-OOM (exit 137) |

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

    1. Ga naar Compute Engine > VM instances > Create instance
    2. Naam: `openclaw-gateway`
    3. Regio: `us-central1`, Zone: `us-central1-a`
    4. Machinetype: `e2-small`
    5. Bootdisk: Debian 12, 20GB
    6. Maken

  </Step>

  <Step title="SSH naar de VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Klik op de knop "SSH" naast je VM in het Compute Engine-dashboard.

    Opmerking: propagatie van SSH-sleutels kan 1-2 minuten duren nadat de VM is gemaakt. Als de verbinding wordt geweigerd, wacht en probeer opnieuw.

  </Step>

  <Step title="Installeer Docker (op de VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Log uit en weer in zodat de groepswijziging van kracht wordt:

    ```bash
    exit
    ```

    SSH daarna opnieuw naar binnen:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Verifieer:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone de OpenClaw-repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Deze gids gaat ervan uit dat je een aangepaste image bouwt om binary-persistentie te garanderen.

  </Step>

  <Step title="Maak persistente hostdirectories">
    Docker-containers zijn vluchtig.
    Alle langlevende state moet op de host staan.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configureer omgevingsvariabelen">
    Maak `.env` aan in de repository-root.

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

    Laat `OPENCLAW_GATEWAY_TOKEN` leeg tenzij je dit expliciet via `.env` wilt
    beheren; OpenClaw schrijft bij de eerste start een willekeurig gatewaytoken naar
    de configuratie. Genereer een keyring-wachtwoord en plak het in
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Commit dit bestand niet.**

    Dit `.env`-bestand is voor container/runtime-env zoals `OPENCLAW_GATEWAY_TOKEN`.
    Opgeslagen provider-OAuth/API-key-auth staat in het gekoppelde
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker Compose-configuratie">
    Maak `docker-compose.yml` aan of werk het bij.

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

    `--allow-unconfigured` is alleen bedoeld voor bootstrapgemak; het is geen vervanging voor een juiste gatewayconfiguratie. Stel nog steeds auth (`gateway.auth.token` of wachtwoord) in en gebruik veilige bind-instellingen voor je deployment.

  </Step>

  <Step title="Gedeelde Docker VM-runtimestappen">
    Gebruik de gedeelde runtimegids voor de gemeenschappelijke Docker-hostflow:

    - [Vereiste binaries in de image bakken](/nl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bouwen en starten](/nl/install/docker-vm-runtime#build-and-launch)
    - [Wat waar persistent blijft](/nl/install/docker-vm-runtime#what-persists-where)
    - [Updates](/nl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-specifieke startnotities">
    Op GCP geldt: als de build faalt met `Killed` of `exit code 137` tijdens `pnpm install --frozen-lockfile`, heeft de VM onvoldoende geheugen. Gebruik minimaal `e2-small`, of `e2-medium` voor betrouwbaardere eerste builds.

    Wanneer je bindt aan LAN (`OPENCLAW_GATEWAY_BIND=lan`), configureer dan een vertrouwde browser-origin voordat je verdergaat:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Als je de gatewaypoort hebt gewijzigd, vervang `18789` dan door je geconfigureerde poort.

  </Step>

  <Step title="Toegang vanaf je laptop">
    Maak een SSH-tunnel om de Gateway-poort door te sturen:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Open in je browser:

    `http://127.0.0.1:18789/`

    Druk opnieuw een schone dashboardlink af:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Als de UI om gedeelde-geheim-auth vraagt, plak dan het geconfigureerde token of
    wachtwoord in de Control UI-instellingen. Deze Docker-flow schrijft standaard een token;
    als je de containerconfiguratie overschakelt naar wachtwoordauth, gebruik dan dat
    wachtwoord in plaats daarvan.

    Als Control UI `unauthorized` of `disconnected (1008): pairing required` toont, keur dan het browserapparaat goed:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Heb je de gedeelde persistentie- en updatereferentie opnieuw nodig?
    Zie [Docker VM Runtime](/nl/install/docker-vm-runtime#what-persists-where) en [Docker VM Runtime-updates](/nl/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Problemen oplossen

**SSH-verbinding geweigerd**

Propagatie van SSH-sleutels kan 1-2 minuten duren nadat de VM is gemaakt. Wacht en probeer opnieuw.

**OS Login-problemen**

Controleer je OS Login-profiel:

```bash
gcloud compute os-login describe-profile
```

Zorg dat je account de vereiste IAM-machtigingen heeft (Compute OS Login of Compute OS Admin Login).

**Onvoldoende geheugen (OOM)**

Als de Docker-build faalt met `Killed` en `exit code 137`, is de VM door OOM beeindigd. Upgrade naar e2-small (minimum) of e2-medium (aanbevolen voor betrouwbare lokale builds):

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

## Serviceaccounts (best practice voor beveiliging)

Voor persoonlijk gebruik werkt je standaard gebruikersaccount prima.

Maak voor automatisering of CI/CD-pijplijnen een speciaal serviceaccount met minimale machtigingen:

1. Maak een serviceaccount:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Ken de rol Compute Instance Admin toe (of een nauwere aangepaste rol):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Gebruik de Owner-rol niet voor automatisering. Pas het principe van minimale rechten toe.

Zie [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) voor details over IAM-rollen.

---

## Volgende stappen

- Stel berichtenkanalen in: [Kanalen](/nl/channels)
- Koppel lokale apparaten als nodes: [Nodes](/nl/nodes)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Azure](/nl/install/azure)
- [VPS-hosting](/nl/vps)
