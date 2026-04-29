---
read_when:
    - Je wilt OpenClaw 24/7 laten draaien op een cloud-VPS (niet op je laptop)
    - Je wilt een productieklare, altijd beschikbare Gateway op je eigen VPS
    - Je wilt volledige controle over persistentie, binaire bestanden en herstartgedrag
    - Je draait OpenClaw in Docker op Hetzner of bij een vergelijkbare provider
summary: Draai OpenClaw Gateway 24/7 op een goedkope Hetzner-VPS (Docker) met persistente status en ingebouwde binaire bestanden
title: Hetzner
x-i18n:
    generated_at: "2026-04-29T22:54:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw op Hetzner (Docker, productiegids voor VPS)

## Doel

Voer een persistente OpenClaw Gateway uit op een Hetzner-VPS met Docker, met blijvende status, meegebakken binaries en veilig herstartgedrag.

Als je “OpenClaw 24/7 voor ~$5” wilt, is dit de eenvoudigste betrouwbare installatie.
De prijzen van Hetzner veranderen; kies de kleinste Debian/Ubuntu-VPS en schaal op als je OOM-fouten tegenkomt.

Herinnering aan het beveiligingsmodel:

- Bedrijfsgedeelde agents zijn prima wanneer iedereen zich binnen dezelfde vertrouwensgrens bevindt en de runtime uitsluitend zakelijk is.
- Houd strikte scheiding aan: dedicated VPS/runtime + dedicated accounts; geen persoonlijke Apple/Google/browser/wachtwoordmanager-profielen op die host.
- Als gebruikers vijandig tegenover elkaar kunnen staan, splits dan per gateway/host/OS-gebruiker.

Zie [Beveiliging](/nl/gateway/security) en [VPS-hosting](/nl/vps).

## Wat gaan we doen (eenvoudig uitgelegd)?

- Een kleine Linux-server huren (Hetzner-VPS)
- Docker installeren (geisoleerde app-runtime)
- De OpenClaw Gateway starten in Docker
- `~/.openclaw` + `~/.openclaw/workspace` blijvend opslaan op de host (overleeft herstarts/herbuilds)
- De Control UI vanaf je laptop openen via een SSH-tunnel

Die gemounte `~/.openclaw`-status bevat `openclaw.json`, per-agent
`agents/<agentId>/agent/auth-profiles.json` en `.env`.

De Gateway is toegankelijk via:

- SSH-portforwarding vanaf je laptop
- Directe poortblootstelling als je zelf firewalling en tokens beheert

Deze gids gaat uit van Ubuntu of Debian op Hetzner.  
Als je een andere Linux-VPS gebruikt, pas de pakketten overeenkomstig aan.
Zie [Docker](/nl/install/docker) voor de generieke Docker-flow.

---

## Snelle route (ervaren operators)

1. Provision een Hetzner-VPS
2. Installeer Docker
3. Clone de OpenClaw-repository
4. Maak persistente hostmappen
5. Configureer `.env` en `docker-compose.yml`
6. Bak vereiste binaries in de image
7. `docker compose up -d`
8. Controleer persistentie en Gateway-toegang

---

## Wat je nodig hebt

- Hetzner-VPS met root-toegang
- SSH-toegang vanaf je laptop
- Basisvertrouwdheid met SSH + kopieren/plakken
- ~20 minuten
- Docker en Docker Compose
- Modelauthenticatiegegevens
- Optionele providerreferenties
  - WhatsApp-QR
  - Telegram-bottoken
  - Gmail-OAuth

---

<Steps>
  <Step title="Provision de VPS">
    Maak een Ubuntu- of Debian-VPS aan in Hetzner.

    Verbind als root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Deze gids gaat ervan uit dat de VPS stateful is.
    Behandel deze niet als wegwerpinfrastructuur.

  </Step>

  <Step title="Installeer Docker (op de VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Controleer:

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

  <Step title="Maak persistente hostmappen">
    Docker-containers zijn vluchtig.
    Alle langlevende status moet op de host staan.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configureer omgevingsvariabelen">
    Maak `.env` aan in de repository-root.

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

    Laat `OPENCLAW_GATEWAY_TOKEN` leeg tenzij je expliciet wilt dat deze
    via `.env` wordt beheerd; OpenClaw schrijft bij de eerste start een willekeurig gateway-token naar
    de configuratie. Genereer een keyring-wachtwoord en plak het in
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Commit dit bestand niet.**

    Dit `.env`-bestand is bedoeld voor container/runtime-env zoals `OPENCLAW_GATEWAY_TOKEN`.
    Opgeslagen OAuth/API-key-authenticatie voor providers staat in de gemounte
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

    `--allow-unconfigured` is alleen bedoeld als bootstrapgemak; het is geen vervanging voor een goede gateway-configuratie. Stel nog steeds auth in (`gateway.auth.token` of wachtwoord) en gebruik veilige bind-instellingen voor je deployment.

  </Step>

  <Step title="Gedeelde runtime-stappen voor Docker-VM">
    Gebruik de gedeelde runtime-gids voor de algemene Docker-hostflow:

    - [Bak vereiste binaries in de image](/nl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bouwen en starten](/nl/install/docker-vm-runtime#build-and-launch)
    - [Wat waar persistent blijft](/nl/install/docker-vm-runtime#what-persists-where)
    - [Updates](/nl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specifieke toegang">
    Voltooi na de gedeelde bouw- en startstappen de volgende setup om de tunnel te openen:

    **Vereiste:** Zorg dat je VPS-sshd-configuratie TCP-forwarding toestaat. Als je
    je SSH-configuratie hebt gehard, controleer dan `/etc/ssh/sshd_config` en stel in:

    ```
    AllowTcpForwarding local
    ```

    `local` staat `ssh -L` lokale forwards vanaf je laptop toe terwijl
    remote forwards vanaf de server worden geblokkeerd. Instellen op `no` laat de tunnel mislukken
    met:
    `channel 3: open failed: administratively prohibited: open failed`

    Nadat je hebt bevestigd dat TCP-forwarding is ingeschakeld, herstart je de SSH-service
    (`systemctl restart ssh`) en voer je de tunnel uit vanaf je laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Open:

    `http://127.0.0.1:18789/`

    Plak het geconfigureerde gedeelde geheim. Deze gids gebruikt standaard het gateway-token;
    als je bent overgestapt op wachtwoordauthenticatie, gebruik dan dat wachtwoord.

  </Step>
</Steps>

De gedeelde persistentiemap staat in [Docker VM Runtime](/nl/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Voor teams die de voorkeur geven aan infrastructure-as-code-workflows, biedt een door de community onderhouden Terraform-setup:

- Modulaire Terraform-configuratie met remote statusbeheer
- Geautomatiseerde provisioning via cloud-init
- Deploymentscripts (bootstrap, deploy, backup/restore)
- Beveiligingshardening (firewall, UFW, alleen SSH-toegang)
- SSH-tunnelconfiguratie voor Gateway-toegang

**Repositories:**

- Infrastructuur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker-configuratie: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Deze aanpak vult de Docker-setup hierboven aan met reproduceerbare deployments, versiebeheerde infrastructuur en geautomatiseerd disaster recovery.

<Note>
Door de community onderhouden. Zie de repository-links hierboven voor problemen of bijdragen.
</Note>

## Volgende stappen

- Stel messaging-kanalen in: [Kanalen](/nl/channels)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)
- Houd OpenClaw up-to-date: [Bijwerken](/nl/install/updating)

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Fly.io](/nl/install/fly)
- [Docker](/nl/install/docker)
- [VPS-hosting](/nl/vps)
