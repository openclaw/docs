---
read_when:
    - Je wilt dat OpenClaw 24/7 op GCP draait
    - Je wilt een productiewaardige, altijd actieve Gateway op je eigen VM
    - Je wilt volledige controle over persistentie, binaries en herstartgedrag
summary: OpenClaw Gateway 24/7 uitvoeren op een GCP Compute Engine-VM (Docker) met persistente staat
title: GCP
x-i18n:
    generated_at: "2026-04-29T22:53:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 16
---

# OpenClaw op GCP Compute Engine (Docker, handleiding voor productie-VPS)

## Doel

Voer een permanente OpenClaw Gateway uit op een GCP Compute Engine-VM met Docker, met duurzame status, ingebakken binaries en veilig herstartgedrag.

Als je "OpenClaw 24/7 voor ~$5-12/maand" wilt, is dit een betrouwbare installatie op Google Cloud.
Prijzen verschillen per machinetype en regio; kies de kleinste VM die bij je werklast past en schaal op als je OOM's krijgt.

## Wat doen we (eenvoudig gezegd)?

- Een GCP-project maken en facturering inschakelen
- Een Compute Engine-VM maken
- Docker installeren (geïsoleerde app-runtime)
- De OpenClaw Gateway starten in Docker
- `~/.openclaw` + `~/.openclaw/workspace` op de host bewaren (overleeft herstarts/rebuilds)
- De Control UI vanaf je laptop openen via een SSH-tunnel

Die gemounte status in `~/.openclaw` omvat `openclaw.json`, per agent
`agents/<agentId>/agent/auth-profiles.json` en `.env`.

De Gateway is toegankelijk via:

- SSH-portforwarding vanaf je laptop
- Directe poortblootstelling als je firewalls en tokens zelf beheert

Deze handleiding gebruikt Debian op GCP Compute Engine.
Ubuntu werkt ook; koppel de pakketten dienovereenkomstig.
Zie [Docker](/nl/install/docker) voor de generieke Docker-stroom.

---

## Snelle route (ervaren operators)

1. Maak een GCP-project en schakel de Compute Engine API in
2. Maak een Compute Engine-VM (e2-small, Debian 12, 20GB)
3. SSH naar de VM
4. Installeer Docker
5. Clone de OpenClaw-repository
6. Maak permanente hostdirectories
7. Configureer `.env` en `docker-compose.yml`
8. Bak vereiste binaries in, bouw en start

---

## Wat je nodig hebt

- GCP-account (komt in aanmerking voor gratis laag met e2-micro)
- gcloud CLI geïnstalleerd (of gebruik Cloud Console)
- SSH-toegang vanaf je laptop
- Basiscomfort met SSH en kopiëren/plakken
- ~20-30 minuten
- Docker en Docker Compose
- Model-authreferenties
- Optionele providerreferenties
  - WhatsApp-QR
  - Telegram-bottoken
  - Gmail OAuth

---

<Steps>
  <Step title="gcloud CLI installeren (of Console gebruiken)">
    **Optie A: gcloud CLI** (aanbevolen voor automatisering)

    Installeer vanaf [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Initialiseer en authenticeer:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Optie B: Cloud Console**

    Alle stappen kunnen worden uitgevoerd via de webinterface op [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Een GCP-project maken">
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

  <Step title="De VM maken">
    **Machinetypen:**

    | Type      | Specificaties            | Kosten             | Opmerkingen                                  |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/maand         | Meest betrouwbaar voor lokale Docker-builds  |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/maand         | Minimaal aanbevolen voor Docker-build        |
    | e2-micro  | 2 vCPU (gedeeld), 1GB RAM | Komt in aanmerking voor gratis laag | Mislukt vaak met Docker-build-OOM (exit 137) |

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
    3. Regio: `us-central1`, zone: `us-central1-a`
    4. Machinetype: `e2-small`
    5. Opstartschijf: Debian 12, 20GB
    6. Maak aan

  </Step>

  <Step title="SSH naar de VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Klik op de knop "SSH" naast je VM in het Compute Engine-dashboard.

    Opmerking: propagatie van SSH-sleutels kan 1-2 minuten duren na het maken van de VM. Als de verbinding wordt geweigerd, wacht dan en probeer het opnieuw.

  </Step>

  <Step title="Docker installeren (op de VM)">
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

    SSH daarna opnieuw:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Controleer:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="De OpenClaw-repository clonen">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Deze handleiding gaat ervan uit dat je een aangepaste image bouwt om binaire persistentie te garanderen.

  </Step>

  <Step title="Permanente hostdirectories maken">
    Docker-containers zijn tijdelijk.
    Alle langdurige status moet op de host staan.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Omgevingsvariabelen configureren">
    Maak `.env` in de root van de repository.

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

    Laat `OPENCLAW_GATEWAY_TOKEN` leeg, tenzij je het expliciet via `.env`
    wilt beheren; OpenClaw schrijft bij de eerste start een willekeurig gateway-token naar
    de configuratie. Genereer een keyring-wachtwoord en plak het in
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Commit dit bestand niet.**

    Dit `.env`-bestand is voor container-/runtime-omgevingsvariabelen zoals `OPENCLAW_GATEWAY_TOKEN`.
    Opgeslagen OAuth-/API-key-auth van providers staat in het gemounte
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker Compose-configuratie">
    Maak of werk `docker-compose.yml` bij.

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

    `--allow-unconfigured` is alleen bedoeld voor gemak bij bootstrap; het is geen vervanging voor een juiste gateway-configuratie. Stel nog steeds auth in (`gateway.auth.token` of wachtwoord) en gebruik veilige bind-instellingen voor je deployment.

  </Step>

  <Step title="Gedeelde Docker-VM-runtime-stappen">
    Gebruik de gedeelde runtimehandleiding voor de algemene Docker-hoststroom:

    - [Vereiste binaries in de image bakken](/nl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bouwen en starten](/nl/install/docker-vm-runtime#build-and-launch)
    - [Wat waar persistent blijft](/nl/install/docker-vm-runtime#what-persists-where)
    - [Updates](/nl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-specifieke startnotities">
    Op GCP is de VM out of memory als de build mislukt met `Killed` of `exit code 137` tijdens `pnpm install --frozen-lockfile`. Gebruik minimaal `e2-small`, of `e2-medium` voor betrouwbaardere eerste builds.

    Configureer bij binden aan LAN (`OPENCLAW_GATEWAY_BIND=lan`) een vertrouwde browser-origin voordat je verdergaat:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Als je de gateway-poort hebt gewijzigd, vervang `18789` dan door je geconfigureerde poort.

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

    Als de UI om shared-secret-auth vraagt, plak dan het geconfigureerde token of
    wachtwoord in de Control UI-instellingen. Deze Docker-stroom schrijft standaard een token;
    als je de containerconfiguratie overschakelt naar wachtwoord-auth, gebruik dan in plaats daarvan dat
    wachtwoord.

    Als Control UI `unauthorized` of `disconnected (1008): pairing required` toont, keur dan het browserapparaat goed:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Heb je de gedeelde verwijzing voor persistentie en updates opnieuw nodig?
    Zie [Docker VM Runtime](/nl/install/docker-vm-runtime#what-persists-where) en [Docker VM Runtime-updates](/nl/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Probleemoplossing

**SSH-verbinding geweigerd**

Propagatie van SSH-sleutels kan 1-2 minuten duren na het maken van de VM. Wacht en probeer het opnieuw.

**OS Login-problemen**

Controleer je OS Login-profiel:

```bash
gcloud compute os-login describe-profile
```

Zorg ervoor dat je account de vereiste IAM-machtigingen heeft (Compute OS Login of Compute OS Admin Login).

**Out of memory (OOM)**

Als Docker-build mislukt met `Killed` en `exit code 137`, is de VM door OOM beëindigd. Upgrade naar e2-small (minimum) of e2-medium (aanbevolen voor betrouwbare lokale builds):

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

Voor persoonlijk gebruik werkt je standaardgebruikersaccount prima.

Maak voor automatisering of CI/CD-pijplijnen een toegewezen serviceaccount met minimale machtigingen:

1. Maak een serviceaccount:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Ken de rol Compute Instance Admin toe (of een beperktere aangepaste rol):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Vermijd het gebruik van de rol Owner voor automatisering. Gebruik het principe van minimale rechten.

Zie [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) voor details over IAM-rollen.

---

## Volgende stappen

- Stel berichtenkanalen in: [Kanalen](/nl/channels)
- Koppel lokale apparaten als Nodes: [Nodes](/nl/nodes)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Azure](/nl/install/azure)
- [VPS-hosting](/nl/vps)
