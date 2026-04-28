---
read_when:
    - Vuoi OpenClaw in esecuzione 24/7 su GCP
    - Vuoi un Gateway sempre attivo, di livello production, sulla tua VM personalizzata
    - Vuoi il pieno controllo su persistenza, binari e comportamento di riavvio
summary: Esegui OpenClaw Gateway 24/7 su una VM GCP Compute Engine (Docker) con stato persistente
title: GCP
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T08:46:25Z"
  model: gpt-5.4
  provider: openai
  source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
  source_path: install/gcp.md
  workflow: 15
---

# OpenClaw su GCP Compute Engine (Docker, guida VPS di produzione)

## Obiettivo

Eseguire un Gateway OpenClaw persistente su una VM GCP Compute Engine usando Docker, con stato persistente, binari inclusi nell'immagine e comportamento di riavvio sicuro.

Se vuoi “OpenClaw 24/7 per ~$5-12/mese”, questa è una configurazione affidabile su Google Cloud.
Il prezzo varia in base al tipo di macchina e alla regione; scegli la VM più piccola adatta al tuo carico di lavoro e aumenta la scala se incontri OOM.

## Cosa stiamo facendo (in termini semplici)?

- Creare un progetto GCP e abilitare la fatturazione
- Creare una VM Compute Engine
- Installare Docker (runtime isolato dell'app)
- Avviare il Gateway OpenClaw in Docker
- Rendere persistenti `~/.openclaw` + `~/.openclaw/workspace` sull'host (sopravvivono a riavvii/ricostruzioni)
- Accedere alla Control UI dal tuo portatile tramite un tunnel SSH

Quello stato montato in `~/.openclaw` include `openclaw.json`, i file per agente
`agents/<agentId>/agent/auth-profiles.json` e `.env`.

È possibile accedere al Gateway tramite:

- Port forwarding SSH dal tuo portatile
- Esposizione diretta della porta se gestisci personalmente firewall e token

Questa guida usa Debian su GCP Compute Engine.
Anche Ubuntu funziona; adatta i pacchetti di conseguenza.
Per il flusso Docker generico, vedi [Docker](/it/install/docker).

---

## Percorso rapido (operatori esperti)

1. Crea un progetto GCP + abilita la Compute Engine API
2. Crea una VM Compute Engine (e2-small, Debian 12, 20GB)
3. Connettiti in SSH alla VM
4. Installa Docker
5. Clona il repository OpenClaw
6. Crea directory host persistenti
7. Configura `.env` e `docker-compose.yml`
8. Includi i binari richiesti nell'immagine, builda e avvia

---

## Cosa ti serve

- Account GCP (free tier idoneo per e2-micro)
- CLI gcloud installata (oppure usa Cloud Console)
- Accesso SSH dal tuo portatile
- Minima familiarità con SSH + copia/incolla
- ~20-30 minuti
- Docker e Docker Compose
- Credenziali auth del modello
- Credenziali provider facoltative
  - QR di WhatsApp
  - Token del bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Installa la CLI gcloud (oppure usa Console)">
    **Opzione A: CLI gcloud** (consigliata per l'automazione)

    Installa da [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Inizializza e autentica:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Opzione B: Cloud Console**

    Tutti i passaggi possono essere eseguiti tramite l'interfaccia web su [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Crea un progetto GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Abilita la fatturazione su [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (richiesta per Compute Engine).

    Abilita la Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Vai su IAM e amministrazione > Crea progetto
    2. Dagli un nome e crealo
    3. Abilita la fatturazione per il progetto
    4. Vai su API e servizi > Abilita API > cerca "Compute Engine API" > Abilita

  </Step>

  <Step title="Crea la VM">
    **Tipi di macchina:**

    | Tipo      | Specifiche               | Costo              | Note                                             |
    | --------- | ------------------------ | ------------------ | ------------------------------------------------ |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/mese          | Il più affidabile per build Docker locali        |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/mese          | Minimo consigliato per build Docker              |
    | e2-micro  | 2 vCPU (condivise), 1GB RAM | Idoneo al free tier | Spesso fallisce con OOM durante build Docker (exit 137) |

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

    1. Vai su Compute Engine > Istanze VM > Crea istanza
    2. Nome: `openclaw-gateway`
    3. Regione: `us-central1`, zona: `us-central1-a`
    4. Tipo di macchina: `e2-small`
    5. Disco di avvio: Debian 12, 20GB
    6. Crea

  </Step>

  <Step title="Connettiti in SSH alla VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Fai clic sul pulsante "SSH" accanto alla tua VM nella dashboard di Compute Engine.

    Nota: la propagazione della chiave SSH può richiedere 1-2 minuti dopo la creazione della VM. Se la connessione viene rifiutata, attendi e riprova.

  </Step>

  <Step title="Installa Docker (sulla VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Esci e rientra perché la modifica del gruppo abbia effetto:

    ```bash
    exit
    ```

    Poi riconnettiti in SSH:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Verifica:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clona il repository OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Questa guida presume che tu costruisca un'immagine personalizzata per garantire la persistenza dei binari.

  </Step>

  <Step title="Crea directory host persistenti">
    I container Docker sono effimeri.
    Tutto lo stato a lunga durata deve vivere sull'host.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configura le variabili d'ambiente">
    Crea `.env` nella root del repository.

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

    Lascia vuoto `OPENCLAW_GATEWAY_TOKEN` a meno che tu non voglia esplicitamente
    gestirlo tramite `.env`; OpenClaw scrive un token gateway casuale nella
    configurazione al primo avvio. Genera una password del keyring e incollala in
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Non eseguire il commit di questo file.**

    Questo file `.env` è per l'env del container/runtime come `OPENCLAW_GATEWAY_TOKEN`.
    L'autenticazione OAuth/chiave API del provider memorizzata vive nel file montato
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Configurazione Docker Compose">
    Crea o aggiorna `docker-compose.yml`.

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
          # Consigliato: mantieni il Gateway solo loopback sulla VM; accedi tramite tunnel SSH.
          # Per esporlo pubblicamente, rimuovi il prefisso `127.0.0.1:` e configura il firewall di conseguenza.
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

    `--allow-unconfigured` serve solo come comodità di bootstrap, non sostituisce una corretta configurazione del gateway. Imposta comunque l'autenticazione (`gateway.auth.token` o password) e usa impostazioni di bind sicure per la tua distribuzione.

  </Step>

  <Step title="Passaggi runtime condivisi della VM Docker">
    Usa la guida runtime condivisa per il flusso host Docker comune:

    - [Includi i binari richiesti nell'immagine](/it/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build e avvio](/it/install/docker-vm-runtime#build-and-launch)
    - [Cosa persiste e dove](/it/install/docker-vm-runtime#what-persists-where)
    - [Aggiornamenti](/it/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Note di avvio specifiche per GCP">
    Su GCP, se la build fallisce con `Killed` o `exit code 137` durante `pnpm install --frozen-lockfile`, la VM è senza memoria. Usa almeno `e2-small`, oppure `e2-medium` per build iniziali più affidabili.

    Quando fai bind su LAN (`OPENCLAW_GATEWAY_BIND=lan`), configura un'origine browser fidata prima di continuare:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Se hai cambiato la porta del gateway, sostituisci `18789` con la porta configurata.

  </Step>

  <Step title="Accedi dal tuo portatile">
    Crea un tunnel SSH per inoltrare la porta del Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Apri nel browser:

    `http://127.0.0.1:18789/`

    Stampa di nuovo un link pulito alla dashboard:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Se la UI richiede autenticazione con segreto condiviso, incolla il token o la
    password configurati nelle impostazioni della Control UI. Questo flusso Docker scrive
    un token per impostazione predefinita; se cambi la configurazione del container su autenticazione
    tramite password, usa invece quella password.

    Se la Control UI mostra `unauthorized` o `disconnected (1008): pairing required`, approva il dispositivo browser:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Ti serve di nuovo il riferimento su persistenza condivisa e aggiornamenti?
    Vedi [Docker VM Runtime](/it/install/docker-vm-runtime#what-persists-where) e [Aggiornamenti Docker VM Runtime](/it/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Risoluzione dei problemi

**Connessione SSH rifiutata**

La propagazione della chiave SSH può richiedere 1-2 minuti dopo la creazione della VM. Attendi e riprova.

**Problemi con OS Login**

Controlla il tuo profilo OS Login:

```bash
gcloud compute os-login describe-profile
```

Assicurati che il tuo account abbia i permessi IAM richiesti (Compute OS Login o Compute OS Admin Login).

**Memoria esaurita (OOM)**

Se la build Docker fallisce con `Killed` e `exit code 137`, la VM è stata terminata per OOM. Passa a e2-small (minimo) oppure e2-medium (consigliato per build locali affidabili):

```bash
# Prima arresta la VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Cambia tipo di macchina
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Avvia la VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Account di servizio (best practice di sicurezza)

Per uso personale, il tuo account utente predefinito va bene.

Per automazione o pipeline CI/CD, crea un account di servizio dedicato con permessi minimi:

1. Crea un account di servizio:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Concedi il ruolo Compute Instance Admin (o un ruolo personalizzato più ristretto):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Evita di usare il ruolo Owner per l'automazione. Usa il principio del privilegio minimo.

Vedi [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) per i dettagli sui ruoli IAM.

---

## Passaggi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Abbina i dispositivi locali come Node: [Node](/it/nodes)
- Configura il Gateway: [Configurazione del Gateway](/it/gateway/configuration)

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Azure](/it/install/azure)
- [Hosting VPS](/it/vps)
