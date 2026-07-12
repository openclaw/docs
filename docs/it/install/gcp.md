---
read_when:
    - Vuoi che OpenClaw sia in esecuzione 24 ore su 24, 7 giorni su 7 su GCP
    - Vuoi un Gateway sempre attivo e pronto per la produzione sulla tua VM
    - Vuoi il pieno controllo sulla persistenza, sui file binari e sul comportamento di riavvio
summary: Esegui OpenClaw Gateway 24 ore su 24, 7 giorni su 7, su una VM GCP Compute Engine (Docker) con stato persistente
title: GCP
x-i18n:
    generated_at: "2026-07-12T07:11:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Esegui un Gateway OpenClaw persistente su una VM GCP Compute Engine utilizzando Docker, con stato durevole, binari integrati nell'immagine e un comportamento di riavvio sicuro.

I prezzi variano in base al tipo di macchina e alla regione; scegli la VM più piccola adatta al tuo carico di lavoro e passa a una configurazione superiore se riscontri errori di memoria insufficiente.

Puoi accedere al Gateway tramite il port forwarding SSH dal tuo laptop oppure esponendo direttamente la porta, se gestisci autonomamente il firewall e i token.

Questa guida utilizza Debian su GCP Compute Engine. Anche Ubuntu è compatibile; adatta i pacchetti di conseguenza. Per la procedura Docker generica, consulta [Docker](/it/install/docker).

## Requisiti

- Account GCP (`e2-micro` è idonea al livello gratuito)
- CLI `gcloud` oppure [Cloud Console](https://console.cloud.google.com)
- Accesso SSH dal tuo laptop
- Docker e Docker Compose
- Credenziali di autenticazione del modello
- Credenziali facoltative dei provider (codice QR di WhatsApp, token del bot Telegram, OAuth di Gmail)
- Circa 20-30 minuti

## Procedura rapida

1. Crea un progetto GCP, abilita la fatturazione e l'API Compute Engine
2. Crea una VM Compute Engine (`e2-small`, Debian 12, 20 GB)
3. Accedi alla VM tramite SSH e installa Docker
4. Clona il repository OpenClaw
5. Crea directory persistenti sull'host
6. Configura `.env` e `docker-compose.yml`
7. Integra i binari richiesti nell'immagine, compila e avvia

<Steps>
  <Step title="Installare la CLI gcloud (o utilizzare Console)">
    Esegui l'installazione da [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install), quindi:

    ```bash
    gcloud init
    gcloud auth login
    ```

    In alternativa, esegui tutti i passaggi seguenti tramite l'interfaccia web di [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="Creare un progetto GCP">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Abilita la fatturazione su [console.cloud.google.com/billing](https://console.cloud.google.com/billing), necessaria per Compute Engine.

    Procedura equivalente in Console: IAM & Admin > Create Project, abilita la fatturazione, quindi APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="Creare la VM">
    | Tipo      | Specifiche                | Costo                  | Note                                                        |
    | --------- | ------------------------- | ---------------------- | ----------------------------------------------------------- |
    | e2-medium | 2 vCPU, 4 GB di RAM       | Circa 25 USD al mese   | Più affidabile per le compilazioni Docker locali            |
    | e2-small  | 2 vCPU, 2 GB di RAM       | Circa 12 USD al mese   | Configurazione minima consigliata per una compilazione Docker |
    | e2-micro  | 2 vCPU (condivise), 1 GB di RAM | Idonea al livello gratuito | La compilazione Docker spesso non riesce per memoria insufficiente (`exit 137`) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Accedere alla VM tramite SSH">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console: fai clic su "SSH" accanto alla VM nella dashboard di Compute Engine.

    La propagazione della chiave SSH può richiedere 1-2 minuti dopo la creazione della VM; attendi e riprova se la connessione viene rifiutata.

  </Step>

  <Step title="Installare Docker (sulla VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Disconnettiti e accedi nuovamente affinché la modifica al gruppo abbia effetto, quindi riconnettiti tramite SSH:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Verifica:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clonare il repository OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Questa guida crea un'immagine personalizzata, in modo che tutti i binari integrati rimangano disponibili dopo i riavvii.

  </Step>

  <Step title="Creare directory persistenti sull'host">
    I container Docker sono effimeri; tutto lo stato persistente deve risiedere sull'host.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configurare le variabili di ambiente">
    Crea `.env` nella radice del repository:

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

    Imposta `OPENCLAW_GATEWAY_TOKEN` per gestire il token stabile del Gateway tramite
    `.env`; in alternativa, configura `gateway.auth.token` prima di fare affidamento sui client
    tra un riavvio e l'altro. Se nessuno dei due è impostato, OpenClaw utilizza per
    quell'avvio un token valido solo in fase di esecuzione. Genera una password per il portachiavi da assegnare a `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Non eseguire il commit di questo file.** Contiene variabili di ambiente del container e dell'esecuzione, come
    `OPENCLAW_GATEWAY_TOKEN`. L'autenticazione OAuth o tramite chiave API memorizzata per i provider si trova nel file
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` montato.

  </Step>

  <Step title="Configurazione di Docker Compose">
    Crea o aggiorna `docker-compose.yml`:

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
          # Consigliato: mantieni il Gateway accessibile solo tramite loopback sulla VM; accedi tramite tunnel SSH.
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

    `--allow-unconfigured` serve solo a semplificare l'avvio iniziale e non sostituisce una configurazione effettiva del Gateway. Imposta comunque l'autenticazione (`gateway.auth.token` o una password) e una modalità di associazione sicura per la distribuzione.

  </Step>

  <Step title="Passaggi di esecuzione condivisi per una VM Docker">
    Segui la guida di esecuzione condivisa per la procedura comune su un host Docker:

    - [Integrare i binari richiesti nell'immagine](/it/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compilazione e avvio](/it/install/docker-vm-runtime#build-and-launch)
    - [Cosa viene conservato e dove](/it/install/docker-vm-runtime#what-persists-where)
    - [Aggiornamenti](/it/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Note di avvio specifiche per GCP">
    Se la compilazione non riesce mostrando `Killed` o `exit code 137` durante `pnpm install --frozen-lockfile`, la VM ha esaurito la memoria. Utilizza almeno `e2-small` oppure `e2-medium` per rendere più affidabili le prime compilazioni.

    Quando esegui l'associazione alla LAN (`OPENCLAW_GATEWAY_BIND=lan`), configura un'origine attendibile per il browser prima di continuare:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Sostituisci `18789` con la porta configurata, se l'hai modificata.

  </Step>

  <Step title="Accedere dal laptop">
    Crea un tunnel SSH per inoltrare la porta del Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Apri `http://127.0.0.1:18789/` nel browser.

    Visualizza nuovamente un collegamento pulito alla dashboard:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Se l'interfaccia richiede l'autenticazione tramite segreto condiviso, incolla il token o
    la password configurati nelle impostazioni dell'interfaccia di controllo (questa procedura Docker scrive
    un token per impostazione predefinita; se sei passato all'autenticazione tramite password, utilizza invece
    la password configurata).

    Se l'interfaccia di controllo mostra `unauthorized` o `disconnected (1008): pairing required`, approva il dispositivo del browser:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Consulta [Ambiente di esecuzione per VM Docker](/it/install/docker-vm-runtime#what-persists-where) per la mappa condivisa della persistenza e il [flusso di aggiornamento](/it/install/docker-vm-runtime#updates).

  </Step>
</Steps>

## Risoluzione dei problemi

**Connessione SSH rifiutata**

La propagazione della chiave SSH può richiedere 1-2 minuti dopo la creazione della VM. Attendi e riprova.

**Problemi con OS Login**

Controlla il tuo profilo OS Login:

```bash
gcloud compute os-login describe-profile
```

Assicurati che il tuo account disponga delle autorizzazioni IAM necessarie (Compute OS Login o Compute OS Admin Login).

**Memoria insufficiente (OOM)**

Se la compilazione Docker non riesce mostrando `Killed` e `exit code 137`, il processo della VM è stato terminato per memoria insufficiente:

```bash
# Arresta prima la VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Modifica il tipo di macchina
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Avvia la VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Account di servizio (procedura consigliata per la sicurezza)

Per l'uso personale, l'account utente predefinito è sufficiente. Per l'automazione o CI/CD, crea un account di servizio dedicato con autorizzazioni minime:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Evita il ruolo Owner per l'automazione; utilizza il ruolo più limitato che soddisfa i requisiti. Consulta [Informazioni sui ruoli](https://cloud.google.com/iam/docs/understanding-roles).

## Passaggi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Associa i dispositivi locali come nodi: [Nodi](/it/nodes)
- Configura il Gateway: [Configurazione del Gateway](/it/gateway/configuration)

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Azure](/it/install/azure)
- [Hosting VPS](/it/vps)
