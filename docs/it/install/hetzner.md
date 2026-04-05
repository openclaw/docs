---
read_when:
    - Vuoi OpenClaw in esecuzione 24/7 su un VPS cloud (non sul tuo laptop)
    - Vuoi un Gateway always-on di livello production sul tuo VPS
    - Vuoi il pieno controllo su persistenza, binari e comportamento ai riavvii
    - Stai eseguendo OpenClaw in Docker su Hetzner o un provider simile
summary: Esegui OpenClaw Gateway 24/7 su un VPS Hetzner economico (Docker) con stato persistente e binari inclusi nell'immagine
title: Hetzner
x-i18n:
    generated_at: "2026-04-05T13:55:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: d859e4c0943040b022835f320708f879a11eadef70f2816cf0f2824eaaf165ef
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw su Hetzner (Docker, guida VPS di produzione)

## Obiettivo

Eseguire un Gateway OpenClaw persistente su un VPS Hetzner usando Docker, con stato durevole, binari inclusi nell'immagine e comportamento sicuro ai riavvii.

Se vuoi “OpenClaw 24/7 per ~$5”, questa è la configurazione affidabile più semplice.
I prezzi di Hetzner cambiano; scegli il VPS Debian/Ubuntu più piccolo e passa a una dimensione superiore se incontri OOM.

Promemoria sul modello di sicurezza:

- Gli agenti condivisi in azienda vanno bene quando tutti sono nello stesso perimetro di fiducia e il runtime è solo per uso aziendale.
- Mantieni una separazione rigorosa: VPS/runtime dedicato + account dedicati; nessun profilo personale Apple/Google/browser/password manager su quell'host.
- Se gli utenti sono avversariali tra loro, separa per gateway/host/utente OS.

Vedi [Sicurezza](/gateway/security) e [Hosting VPS](/vps).

## Cosa stiamo facendo (in termini semplici)?

- Affittare un piccolo server Linux (VPS Hetzner)
- Installare Docker (runtime applicativo isolato)
- Avviare OpenClaw Gateway in Docker
- Rendere persistenti `~/.openclaw` + `~/.openclaw/workspace` sull'host (sopravvivono a riavvii/rebuild)
- Accedere alla Control UI dal tuo laptop tramite un tunnel SSH

Quello stato montato in `~/.openclaw` include `openclaw.json`, il file per agente
`agents/<agentId>/agent/auth-profiles.json` e `.env`.

È possibile accedere al Gateway tramite:

- port forwarding SSH dal tuo laptop
- esposizione diretta della porta se gestisci tu firewall e token

Questa guida presuppone Ubuntu o Debian su Hetzner.  
Se usi un altro VPS Linux, adatta i pacchetti di conseguenza.
Per il flusso Docker generico, vedi [Docker](/install/docker).

---

## Percorso rapido (operatori esperti)

1. Effettua il provisioning del VPS Hetzner
2. Installa Docker
3. Clona il repository OpenClaw
4. Crea directory host persistenti
5. Configura `.env` e `docker-compose.yml`
6. Inserisci i binari richiesti nell'immagine
7. `docker compose up -d`
8. Verifica persistenza e accesso al Gateway

---

## Cosa ti serve

- VPS Hetzner con accesso root
- Accesso SSH dal tuo laptop
- Una familiarità di base con SSH + copia/incolla
- ~20 minuti
- Docker e Docker Compose
- Credenziali auth del modello
- Credenziali provider opzionali
  - QR WhatsApp
  - token bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Effettua il provisioning del VPS">
    Crea un VPS Ubuntu o Debian in Hetzner.

    Connettiti come root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Questa guida presuppone che il VPS sia stateful.
    Non trattarlo come infrastruttura usa e getta.

  </Step>

  <Step title="Installa Docker (sul VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
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

    Questa guida presuppone che tu costruisca un'immagine personalizzata per garantire la persistenza dei binari.

  </Step>

  <Step title="Crea directory host persistenti">
    I container Docker sono effimeri.
    Tutto lo stato a lunga durata deve vivere sull'host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Imposta il proprietario sull'utente del container (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configura le variabili d'ambiente">
    Crea `.env` nella root del repository.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Genera secret robusti:

    ```bash
    openssl rand -hex 32
    ```

    **Non fare commit di questo file.**

    Questo file `.env` serve per l'env del container/runtime come `OPENCLAW_GATEWAY_TOKEN`.
    L'autenticazione provider OAuth/chiave API memorizzata vive nel file montato
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
          # Consigliato: mantieni il Gateway accessibile solo via loopback sul VPS; accedi tramite tunnel SSH.
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

    `--allow-unconfigured` serve solo per comodità di bootstrap, non sostituisce una configurazione gateway corretta. Imposta comunque auth (`gateway.auth.token` o password) e usa impostazioni di bind sicure per il tuo deployment.

  </Step>

  <Step title="Passaggi condivisi del runtime Docker VM">
    Usa la guida runtime condivisa per il flusso comune degli host Docker:

    - [Inserisci i binari richiesti nell'immagine](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build e avvio](/install/docker-vm-runtime#build-and-launch)
    - [Cosa persiste e dove](/install/docker-vm-runtime#what-persists-where)
    - [Aggiornamenti](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Accesso specifico per Hetzner">
    Dopo i passaggi condivisi di build e avvio, apri un tunnel dal tuo laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Apri:

    `http://127.0.0.1:18789/`

    Incolla il secret condiviso configurato. Questa guida usa il token del gateway per
    impostazione predefinita; se hai cambiato a password auth, usa invece quella password.

  </Step>
</Steps>

La mappa condivisa della persistenza si trova in [Runtime Docker VM](/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Per i team che preferiscono flussi infrastructure-as-code, una configurazione Terraform mantenuta dalla community offre:

- Configurazione Terraform modulare con gestione dello stato remoto
- Provisioning automatizzato tramite cloud-init
- Script di deployment (bootstrap, deploy, backup/restore)
- Rafforzamento della sicurezza (firewall, UFW, accesso solo SSH)
- Configurazione del tunnel SSH per l'accesso al gateway

**Repository:**

- Infrastruttura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configurazione Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Questo approccio completa la configurazione Docker sopra con deployment riproducibili, infrastruttura sotto controllo di versione e disaster recovery automatizzato.

> **Nota:** mantenuto dalla community. Per problemi o contributi, vedi i link ai repository sopra.

## Passaggi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Configura il Gateway: [Configurazione del Gateway](/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Aggiornamento](/install/updating)
