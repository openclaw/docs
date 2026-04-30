---
read_when:
    - Vuoi eseguire OpenClaw 24/7 su un VPS cloud (non sul tuo portatile)
    - Vuoi un Gateway di livello produzione, sempre attivo, sul tuo VPS
    - Vuoi il pieno controllo su persistenza, binari e comportamento di riavvio
    - Stai eseguendo OpenClaw in Docker su Hetzner o su un provider simile
summary: Esegui OpenClaw Gateway 24/7 su un VPS Hetzner economico (Docker) con stato persistente e binari incorporati
title: Hetzner
x-i18n:
    generated_at: "2026-04-30T08:58:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw su Hetzner (Docker, guida VPS di produzione)

## Obiettivo

Eseguire un Gateway OpenClaw persistente su una VPS Hetzner usando Docker, con stato durevole, binari integrati e comportamento di riavvio sicuro.

Se vuoi “OpenClaw 24/7 per circa 5 $”, questa è la configurazione affidabile più semplice.
I prezzi di Hetzner cambiano; scegli la VPS Debian/Ubuntu più piccola e fai scaling se incontri OOM.

Promemoria sul modello di sicurezza:

- Gli agenti condivisi in azienda vanno bene quando tutti rientrano nello stesso perimetro di fiducia e il runtime è solo aziendale.
- Mantieni una separazione rigorosa: VPS/runtime dedicati + account dedicati; nessun profilo personale Apple/Google/browser/password manager su quell'host.
- Se gli utenti sono avversari tra loro, separa per gateway/host/utente OS.

Vedi [Sicurezza](/it/gateway/security) e [hosting VPS](/it/vps).

## Cosa stiamo facendo (in termini semplici)?

- Noleggiare un piccolo server Linux (VPS Hetzner)
- Installare Docker (runtime applicativo isolato)
- Avviare il Gateway OpenClaw in Docker
- Rendere persistenti `~/.openclaw` + `~/.openclaw/workspace` sull'host (sopravvivono a riavvii/ricompilazioni)
- Accedere alla Control UI dal tuo laptop tramite un tunnel SSH

Lo stato montato `~/.openclaw` include `openclaw.json`, i file per agente
`agents/<agentId>/agent/auth-profiles.json` e `.env`.

È possibile accedere al Gateway tramite:

- Inoltro porta SSH dal tuo laptop
- Esposizione diretta della porta se gestisci autonomamente firewall e token

Questa guida presuppone Ubuntu o Debian su Hetzner.  
Se usi un'altra VPS Linux, mappa i pacchetti di conseguenza.
Per il flusso Docker generico, vedi [Docker](/it/install/docker).

---

## Percorso rapido (operatori esperti)

1. Esegui il provisioning della VPS Hetzner
2. Installa Docker
3. Clona il repository OpenClaw
4. Crea directory host persistenti
5. Configura `.env` e `docker-compose.yml`
6. Integra i binari richiesti nell'immagine
7. `docker compose up -d`
8. Verifica persistenza e accesso al Gateway

---

## Cosa ti serve

- VPS Hetzner con accesso root
- Accesso SSH dal tuo laptop
- Familiarità di base con SSH + copia/incolla
- Circa 20 minuti
- Docker e Docker Compose
- Credenziali di autenticazione modello
- Credenziali provider opzionali
  - QR WhatsApp
  - token bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Provision the VPS">
    Crea una VPS Ubuntu o Debian su Hetzner.

    Connettiti come root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Questa guida presuppone che la VPS sia stateful.
    Non trattarla come infrastruttura usa e getta.

  </Step>

  <Step title="Install Docker (on the VPS)">
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

  <Step title="Clone the OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Questa guida presuppone che creerai un'immagine personalizzata per garantire la persistenza dei binari.

  </Step>

  <Step title="Create persistent host directories">
    I container Docker sono effimeri.
    Tutto lo stato a lunga durata deve risiedere sull'host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configure environment variables">
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
    configurazione al primo avvio. Genera una password keyring e incollala in
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Non committare questo file.**

    Questo file `.env` serve per variabili env di container/runtime come `OPENCLAW_GATEWAY_TOKEN`.
    L'autenticazione OAuth/API key dei provider memorizzata risiede nel file montato
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker Compose configuration">
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

    `--allow-unconfigured` serve solo per comodità di bootstrap, non sostituisce una corretta configurazione gateway. Imposta comunque l'autenticazione (`gateway.auth.token` o password) e usa impostazioni di bind sicure per il tuo deployment.

  </Step>

  <Step title="Shared Docker VM runtime steps">
    Usa la guida runtime condivisa per il flusso comune dell'host Docker:

    - [Integra i binari richiesti nell'immagine](/it/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compila e avvia](/it/install/docker-vm-runtime#build-and-launch)
    - [Cosa persiste dove](/it/install/docker-vm-runtime#what-persists-where)
    - [Aggiornamenti](/it/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specific access">
    Dopo i passaggi condivisi di build e avvio, completa la seguente configurazione per aprire il tunnel:

    **Prerequisito:** assicurati che la configurazione sshd della tua VPS permetta il forwarding TCP. Se hai
    rafforzato la configurazione SSH, controlla `/etc/ssh/sshd_config` e imposta:

    ```
    AllowTcpForwarding local
    ```

    `local` consente forwarding locali `ssh -L` dal tuo laptop bloccando
    i forwarding remoti dal server. Impostarlo su `no` farà fallire il tunnel
    con:
    `channel 3: open failed: administratively prohibited: open failed`

    Dopo aver confermato che il forwarding TCP è abilitato, riavvia il servizio SSH
    (`systemctl restart ssh`) ed esegui il tunnel dal tuo laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Apri:

    `http://127.0.0.1:18789/`

    Incolla il segreto condiviso configurato. Questa guida usa il token gateway per
    impostazione predefinita; se sei passato all'autenticazione tramite password, usa invece quella password.

  </Step>
</Steps>

La mappa di persistenza condivisa si trova in [Runtime VM Docker](/it/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Per i team che preferiscono workflow infrastructure-as-code, una configurazione Terraform mantenuta dalla community fornisce:

- Configurazione Terraform modulare con gestione dello stato remoto
- Provisioning automatizzato tramite cloud-init
- Script di deployment (bootstrap, deploy, backup/ripristino)
- Hardening di sicurezza (firewall, UFW, accesso solo SSH)
- Configurazione tunnel SSH per l'accesso al gateway

**Repository:**

- Infrastruttura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configurazione Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Questo approccio integra la configurazione Docker sopra con deployment riproducibili, infrastruttura versionata e disaster recovery automatizzato.

<Note>
Mantenuto dalla community. Per problemi o contributi, vedi i link ai repository sopra.
</Note>

## Passaggi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Configura il Gateway: [Configurazione Gateway](/it/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Aggiornamento](/it/install/updating)

## Correlati

- [Panoramica installazione](/it/install)
- [Fly.io](/it/install/fly)
- [Docker](/it/install/docker)
- [hosting VPS](/it/vps)
