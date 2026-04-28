---
read_when:
- Vuoi OpenClaw in esecuzione 24/7 su un VPS cloud (non sul tuo laptop)
- You want a production-grade, always-on Gateway on your own VPS
- Vuoi il pieno controllo su persistenza, binari e comportamento di riavvio
- Stai eseguendo OpenClaw in Docker su Hetzner o un provider simile
summary: Eseguire OpenClaw Gateway 24/7 su un VPS Hetzner economico (Docker) con stato
  persistente e binari inclusi nella build
title: Hetzner
x-i18n:
  generated_at: '2026-04-24T08:46:28Z'
  refreshed_at: '2026-04-28T05:14:37Z'
  model: gpt-5.4
  provider: openai
  source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
  source_path: install/hetzner.md
  workflow: 15
---

# OpenClaw su Hetzner (Docker, guida VPS per la produzione)

## Obiettivo

Eseguire un Gateway OpenClaw persistente su un VPS Hetzner usando Docker, con stato persistente, binari inclusi nella build e comportamento di riavvio sicuro.

Se vuoi “OpenClaw 24/7 a ~$5”, questa è la configurazione affidabile più semplice.
I prezzi Hetzner cambiano; scegli il VPS Debian/Ubuntu più piccolo e aumenta le risorse se incontri OOM.

Promemoria sul modello di sicurezza:

- Gli agenti condivisi in azienda vanno bene quando tutti si trovano nello stesso confine di fiducia e il runtime è solo business.
- Mantieni una separazione rigorosa: VPS/runtime dedicato + account dedicati; nessun profilo personale Apple/Google/browser/password-manager su quell'host.
- Se gli utenti sono avversariali tra loro, separa per gateway/host/utente OS.

Vedi [Security](/it/gateway/security) e [VPS hosting](/it/vps).

## Cosa stiamo facendo (in termini semplici)?

- Noleggiare un piccolo server Linux (VPS Hetzner)
- Installare Docker (runtime dell'app isolato)
- Avviare il Gateway OpenClaw in Docker
- Mantenere `~/.openclaw` + `~/.openclaw/workspace` sull'host (sopravvive a riavvii/ricostruzioni)
- Accedere alla Control UI dal tuo laptop tramite un tunnel SSH

Quello stato `~/.openclaw` montato include `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json`
per agente e `.env`.

È possibile accedere al Gateway tramite:

- Port forwarding SSH dal tuo laptop
- Esposizione diretta della porta se gestisci da solo firewall e token

Questa guida presume Ubuntu o Debian su Hetzner.  
Se usi un altro VPS Linux, adatta i pacchetti di conseguenza.
Per il flusso Docker generico, vedi [Docker](/it/install/docker).

---

## Percorso rapido (operatori esperti)

1. Esegui il provisioning del VPS Hetzner
2. Installa Docker
3. Clona il repository OpenClaw
4. Crea directory host persistenti
5. Configura `.env` e `docker-compose.yml`
6. Includi i binari richiesti nell'immagine
7. `docker compose up -d`
8. Verifica persistenza e accesso al Gateway

---

## Cosa ti serve

- VPS Hetzner con accesso root
- Accesso SSH dal tuo laptop
- Familiarità di base con SSH + copia/incolla
- ~20 minuti
- Docker e Docker Compose
- Credenziali auth del modello
- Credenziali provider facoltative
  - QR WhatsApp
  - Token bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Esegui il provisioning del VPS">
    Crea un VPS Ubuntu o Debian in Hetzner.

    Connettiti come root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Questa guida presume che il VPS sia stateful.
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

    Questa guida presume che costruirai un'immagine personalizzata per garantire la persistenza dei binari.

  </Step>

  <Step title="Crea directory host persistenti">
    I container Docker sono effimeri.
    Tutto lo stato di lunga durata deve risiedere sull'host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configura le variabili d'ambiente">
    Crea `.env` nella radice del repository.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Lascia `OPENCLAW_GATEWAY_TOKEN` vuoto a meno che tu non voglia esplicitamente
    gestirlo tramite `.env`; OpenClaw scrive un token gateway casuale nella
    configurazione al primo avvio. Genera una password per il keyring e incollala in
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Non eseguire il commit di questo file.**

    Questo file `.env` è per l'env del container/runtime, come `OPENCLAW_GATEWAY_TOKEN`.
    L'autenticazione provider OAuth/API key memorizzata risiede nel file montato
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
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
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

    `--allow-unconfigured` serve solo per comodità nel bootstrap, non sostituisce una corretta configurazione del gateway. Imposta comunque auth (`gateway.auth.token` o password) e usa impostazioni di bind sicure per la tua distribuzione.

  </Step>

  <Step title="Passaggi condivisi del runtime VM Docker">
    Usa la guida runtime condivisa per il flusso comune degli host Docker:

    - [Includi i binari richiesti nell'immagine](/it/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build e avvio](/it/install/docker-vm-runtime#build-and-launch)
    - [Cosa viene mantenuto e dove](/it/install/docker-vm-runtime#what-persists-where)
    - [Aggiornamenti](/it/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Accesso specifico per Hetzner">
    Dopo i passaggi condivisi di build e avvio, crea un tunnel dal tuo laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Apri:

    `http://127.0.0.1:18789/`

    Incolla il secret condiviso configurato. Questa guida usa il token gateway per
    impostazione predefinita; se hai invece scelto l'autenticazione con password, usa quella password.

  </Step>
</Steps>

La mappa condivisa della persistenza si trova in [Docker VM Runtime](/it/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Per i team che preferiscono flussi di lavoro infrastructure-as-code, una configurazione Terraform mantenuta dalla community fornisce:

- Configurazione Terraform modulare con gestione dello stato remoto
- Provisioning automatizzato tramite cloud-init
- Script di distribuzione (bootstrap, deploy, backup/restore)
- Hardening della sicurezza (firewall, UFW, accesso solo SSH)
- Configurazione del tunnel SSH per l'accesso al gateway

**Repository:**

- Infrastruttura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configurazione Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Questo approccio integra la configurazione Docker sopra con distribuzioni riproducibili, infrastruttura versionata e disaster recovery automatizzato.

> **Nota:** mantenuto dalla community. Per problemi o contributi, vedi i link ai repository sopra.

## Passi successivi

- Configura i canali di messaggistica: [Channels](/it/channels)
- Configura il Gateway: [Gateway configuration](/it/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Updating](/it/install/updating)

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Fly.io](/it/install/fly)
- [Docker](/it/install/docker)
- [VPS hosting](/it/vps)
