---
read_when:
    - Vuoi che OpenClaw funzioni 24 ore su 24, 7 giorni su 7, su un VPS cloud (non sul tuo portatile)
    - Desideri un Gateway sempre attivo, di livello produttivo, sul tuo VPS
    - Vuoi il pieno controllo su persistenza, file binari e comportamento al riavvio
    - Stai eseguendo OpenClaw in Docker su Hetzner o un provider simile
summary: Esegui OpenClaw Gateway 24 ore su 24, 7 giorni su 7, su un VPS Hetzner economico (Docker), con stato persistente e binari preinstallati
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T07:10:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Esegui un Gateway OpenClaw persistente su un VPS Hetzner usando Docker, con stato durevole, binari integrati nell'immagine e un comportamento sicuro al riavvio.

I prezzi di Hetzner cambiano; scegli il VPS Debian/Ubuntu più piccolo adatto alle tue esigenze e passa a una configurazione superiore se riscontri errori di memoria esaurita (OOM).

È possibile accedere al Gateway tramite port forwarding SSH dal laptop oppure esponendo direttamente la porta, se gestisci autonomamente il firewall e i token.

Promemoria sul modello di sicurezza:

- Gli agenti condivisi in azienda sono adatti quando tutti appartengono allo stesso perimetro di attendibilità e il runtime è usato esclusivamente per attività aziendali.
- Mantieni una separazione rigorosa: VPS/runtime dedicati e account dedicati; nessun profilo personale Apple, Google, del browser o del gestore di password su tale host.
- Se gli utenti possono agire in modo ostile gli uni verso gli altri, separali per Gateway, host o utente del sistema operativo.

Consulta [Sicurezza](/it/gateway/security) e [Hosting su VPS](/it/vps).

Questa guida presuppone l'uso di Ubuntu o Debian su Hetzner. Su un altro VPS Linux, adatta i pacchetti di conseguenza. Per il flusso Docker generico, consulta [Docker](/it/install/docker).

## Requisiti

- VPS Hetzner con accesso root
- Accesso SSH dal laptop
- Docker e Docker Compose
- Credenziali di autenticazione del modello
- Credenziali facoltative dei provider (codice QR di WhatsApp, token del bot Telegram, OAuth di Gmail)
- Circa 20 minuti

## Procedura rapida

1. Effettua il provisioning del VPS Hetzner
2. Installa Docker
3. Clona il repository OpenClaw
4. Crea directory persistenti sull'host
5. Configura `.env` e `docker-compose.yml`
6. Integra i binari necessari nell'immagine
7. Esegui `docker compose up -d`
8. Verifica la persistenza e l'accesso al Gateway

<Steps>
  <Step title="Effettua il provisioning del VPS">
    Crea un VPS Ubuntu o Debian su Hetzner, quindi connettiti come root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Considera il VPS come un'infrastruttura con stato, non usa e getta.

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

    Questa guida crea un'immagine personalizzata, in modo che tutti i binari integrati nell'immagine sopravvivano ai riavvii.

  </Step>

  <Step title="Crea directory persistenti sull'host">
    I container Docker sono effimeri; tutto lo stato permanente deve risiedere sull'host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configura le variabili di ambiente">
    Crea `.env` nella directory principale del repository:

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

    Imposta `OPENCLAW_GATEWAY_TOKEN` per gestire il token stabile del Gateway tramite
    `.env`; in alternativa, configura `gateway.auth.token` prima di fare affidamento sui client
    tra un riavvio e l'altro. Se non è impostato nessuno dei due, OpenClaw usa un token valido
    solo per il runtime di quell'avvio. Genera una password del portachiavi per `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Non eseguire il commit di questo file.** Contiene variabili di ambiente del container/runtime, come
    `OPENCLAW_GATEWAY_TOKEN`. Le credenziali OAuth o le chiavi API archiviate per i provider risiedono nel file
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

    `--allow-unconfigured` serve solo a facilitare l'avvio iniziale, non sostituisce una configurazione effettiva del Gateway. Imposta comunque l'autenticazione (`gateway.auth.token` o una password) e una modalità di associazione sicura per la distribuzione.

  </Step>

  <Step title="Passaggi condivisi per il runtime della VM Docker">
    Segui la guida condivisa del runtime per il flusso comune dell'host Docker:

    - [Integra i binari necessari nell'immagine](/it/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Compila e avvia](/it/install/docker-vm-runtime#build-and-launch)
    - [Cosa viene mantenuto e dove](/it/install/docker-vm-runtime#what-persists-where)
    - [Aggiornamenti](/it/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Accesso specifico per Hetzner">
    Dopo i passaggi condivisi di compilazione e avvio, apri il tunnel.

    **Prerequisito:** assicurati che la configurazione di sshd sul VPS consenta il port forwarding TCP. Se hai
    rafforzato la configurazione SSH, controlla `/etc/ssh/sshd_config` e imposta:

    ```text
    AllowTcpForwarding local
    ```

    `local` consente i port forwarding locali `ssh -L` dal laptop, bloccando al contempo
    quelli remoti dal server. Impostandolo su `no`, il tunnel non riesce e restituisce:
    `channel 3: open failed: administratively prohibited: open failed`

    Dopo aver verificato che il port forwarding TCP sia abilitato, riavvia il servizio SSH
    (`systemctl restart ssh`) ed esegui il tunnel dal laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Apri `http://127.0.0.1:18789/` e incolla il segreto condiviso configurato.
    Questa guida usa per impostazione predefinita il token del Gateway; usa invece la password
    configurata se hai scelto l'autenticazione tramite password.

  </Step>
</Steps>

La mappa condivisa della persistenza si trova in [Runtime della VM Docker](/it/install/docker-vm-runtime#what-persists-where).

## Infrastruttura come codice (Terraform)

Per i team che preferiscono flussi di lavoro basati sull'infrastruttura come codice, una configurazione Terraform gestita dalla community offre:

- Configurazione Terraform modulare con gestione remota dello stato
- Provisioning automatizzato tramite cloud-init
- Script di distribuzione (avvio iniziale, distribuzione, backup/ripristino)
- Rafforzamento della sicurezza (firewall, UFW, accesso esclusivamente tramite SSH)
- Configurazione del tunnel SSH per l'accesso al Gateway

**Repository:**

- Infrastruttura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configurazione Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Questo approccio completa la configurazione Docker descritta sopra con distribuzioni riproducibili, infrastruttura sottoposta a controllo di versione e ripristino di emergenza automatizzato.

<Note>
Gestito dalla community. Per problemi o contributi, consulta i collegamenti ai repository riportati sopra.
</Note>

## Passaggi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Configura il Gateway: [Configurazione del Gateway](/it/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Aggiornamento](/it/install/updating)

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Fly.io](/it/install/fly)
- [Docker](/it/install/docker)
- [Hosting su VPS](/it/vps)
