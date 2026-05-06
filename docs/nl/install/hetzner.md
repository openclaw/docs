---
read_when:
    - Je wilt OpenClaw 24/7 laten draaien op een cloud-VPS (niet op je laptop)
    - Je wilt een Gateway van productiekwaliteit die altijd actief is op je eigen VPS
    - Je wilt volledige controle over persistentie, binaire bestanden en herstartgedrag
    - Je draait OpenClaw in Docker op Hetzner of bij een vergelijkbare aanbieder
summary: Voer OpenClaw Gateway 24/7 uit op een goedkope Hetzner-VPS (Docker) met persistente status en ingebakken binaire bestanden
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T17:57:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6102649b381b3b1ecd6f52e1cf518fc36147fe143ebc8fd4be5f44ab26cb3b4d
    source_path: install/hetzner.md
    workflow: 16
---

## Doel

Voer een permanente OpenClaw Gateway uit op een Hetzner-VPS met Docker, met duurzame status, ingebakken binaries en veilig herstartgedrag.

Als je "OpenClaw 24/7 voor ongeveer $5" wilt, is dit de eenvoudigste betrouwbare installatie.
De prijzen van Hetzner veranderen; kies de kleinste Debian/Ubuntu-VPS en schaal op als je OOMs tegenkomt.

Herinnering aan het beveiligingsmodel:

- Bedrijfsgedeelde agents zijn prima wanneer iedereen binnen dezelfde vertrouwensgrens valt en de runtime alleen zakelijk wordt gebruikt.
- Houd strikte scheiding aan: dedicated VPS/runtime + dedicated accounts; geen persoonlijke Apple/Google/browser-/wachtwoordmanagerprofielen op die host.
- Als gebruikers onderling vijandig kunnen zijn, splits dan per gateway/host/OS-gebruiker.

Zie [Beveiliging](/nl/gateway/security) en [VPS-hosting](/nl/vps).

## Wat doen we (simpel gezegd)?

- Huur een kleine Linux-server (Hetzner-VPS)
- Installeer Docker (geïsoleerde app-runtime)
- Start de OpenClaw Gateway in Docker
- Bewaar `~/.openclaw` + `~/.openclaw/workspace` op de host (overleeft herstarts/herbuilds)
- Open de Control-UI vanaf je laptop via een SSH-tunnel

Die aangekoppelde `~/.openclaw`-status bevat `openclaw.json`, per-agent
`agents/<agentId>/agent/auth-profiles.json` en `.env`.

De Gateway is toegankelijk via:

- SSH-poortdoorschakeling vanaf je laptop
- Directe poortblootstelling als je firewalling en tokens zelf beheert

Deze handleiding gaat uit van Ubuntu of Debian op Hetzner.  
Als je een andere Linux-VPS gebruikt, koppel de pakketten dan overeenkomstig.
Zie [Docker](/nl/install/docker) voor de generieke Docker-flow.

---

## Snelle route (ervaren operators)

1. Richt een Hetzner-VPS in
2. Installeer Docker
3. Kloon de OpenClaw-repository
4. Maak permanente hostmappen
5. Configureer `.env` en `docker-compose.yml`
6. Bak vereiste binaries in de image
7. `docker compose up -d`
8. Verifieer persistentie en Gateway-toegang

---

## Wat je nodig hebt

- Hetzner-VPS met roottoegang
- SSH-toegang vanaf je laptop
- Basisvertrouwen met SSH + kopiëren/plakken
- Ongeveer 20 minuten
- Docker en Docker Compose
- Model-authenticatiereferenties
- Optionele providerreferenties
  - WhatsApp-QR
  - Telegram-bottoken
  - Gmail OAuth

---

<Steps>
  <Step title="De VPS inrichten">
    Maak een Ubuntu- of Debian-VPS aan in Hetzner.

    Verbind als root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Deze handleiding gaat ervan uit dat de VPS stateful is.
    Behandel deze niet als wegwerpinfrastructuur.

  </Step>

  <Step title="Docker installeren (op de VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Verifieer:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="De OpenClaw-repository klonen">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Deze handleiding gaat ervan uit dat je een aangepaste image bouwt om binaire persistentie te garanderen.

  </Step>

  <Step title="Permanente hostmappen maken">
    Docker-containers zijn tijdelijk.
    Alle langdurige status moet op de host staan.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Omgevingsvariabelen configureren">
    Maak `.env` aan in de root van de repository.

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

    Stel `OPENCLAW_GATEWAY_TOKEN` in wanneer je het stabiele gateway-token
    via `.env` wilt beheren; configureer anders `gateway.auth.token` voordat
    je vertrouwt op clients over herstarts heen. Als geen van beide bronnen bestaat, gebruikt OpenClaw
    voor die opstart een token dat alleen tijdens runtime bestaat. Genereer een keyring-wachtwoord en plak
    het in `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Commit dit bestand niet.**

    Dit `.env`-bestand is bedoeld voor container-/runtime-env zoals `OPENCLAW_GATEWAY_TOKEN`.
    Opgeslagen OAuth/API-key-authenticatie van providers staat in de aangekoppelde
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

    `--allow-unconfigured` is alleen bedoeld voor gemak bij bootstrap; het is geen vervanging voor een correcte Gateway-configuratie. Stel nog steeds auth in (`gateway.auth.token` of wachtwoord) en gebruik veilige bind-instellingen voor je deployment.

  </Step>

  <Step title="Gedeelde Docker VM-runtime-stappen">
    Gebruik de gedeelde runtimehandleiding voor de algemene Docker-hostflow:

    - [Vereiste binaries in de image bakken](/nl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bouwen en starten](/nl/install/docker-vm-runtime#build-and-launch)
    - [Wat waar persistent blijft](/nl/install/docker-vm-runtime#what-persists-where)
    - [Updates](/nl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specifieke toegang">
    Voltooi na de gedeelde bouw- en startstappen de volgende installatie om de tunnel te openen:

    **Vereiste:** Zorg dat de sshd-configuratie van je VPS TCP-forwarding toestaat. Als je
    je SSH-configuratie hebt gehard, controleer dan `/etc/ssh/sshd_config` en stel in:

    ```
    AllowTcpForwarding local
    ```

    `local` staat lokale `ssh -L`-forwards vanaf je laptop toe en blokkeert tegelijk
    remote forwards vanaf de server. Als je dit op `no` zet, mislukt de tunnel
    met:
    `channel 3: open failed: administratively prohibited: open failed`

    Nadat je hebt bevestigd dat TCP-forwarding is ingeschakeld, herstart je de SSH-service
    (`systemctl restart ssh`) en voer je de tunnel uit vanaf je laptop:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Open:

    `http://127.0.0.1:18789/`

    Plak het geconfigureerde gedeelde geheim. Deze handleiding gebruikt standaard het gateway-token;
    als je bent overgestapt op wachtwoordauthenticatie, gebruik dan dat wachtwoord.

  </Step>
</Steps>

De gedeelde persistentiemap staat in [Docker VM Runtime](/nl/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Voor teams die de voorkeur geven aan infrastructure-as-code-workflows, biedt een door de community onderhouden Terraform-installatie:

- Modulaire Terraform-configuratie met remote state-beheer
- Geautomatiseerde provisioning via cloud-init
- Deploymentscripts (bootstrap, deploy, backup/restore)
- Beveiligingsverharding (firewall, UFW, alleen SSH-toegang)
- SSH-tunnelconfiguratie voor Gateway-toegang

**Repositories:**

- Infrastructuur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker-configuratie: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Deze aanpak vult de Docker-installatie hierboven aan met reproduceerbare deployments, versiebeheerde infrastructuur en geautomatiseerd disaster recovery.

<Note>
Door de community onderhouden. Zie de repositorylinks hierboven voor issues of bijdragen.
</Note>

## Volgende stappen

- Stel berichtkanalen in: [Kanalen](/nl/channels)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)
- Houd OpenClaw up-to-date: [Bijwerken](/nl/install/updating)

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Fly.io](/nl/install/fly)
- [Docker](/nl/install/docker)
- [VPS-hosting](/nl/vps)
