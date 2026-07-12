---
read_when:
    - U wilt OpenClaw 24/7 uitvoeren op een cloud-VPS (niet op uw laptop)
    - Je wilt een Gateway van productiekwaliteit die altijd actief is op je eigen VPS
    - Je wilt volledige controle over persistentie, binaire bestanden en herstartgedrag
    - U voert OpenClaw uit in Docker op Hetzner of bij een vergelijkbare provider
summary: Voer OpenClaw Gateway 24/7 uit op een goedkope Hetzner-VPS (Docker), met duurzame statusopslag en ingebouwde binaire bestanden
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T09:00:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Voer een permanente OpenClaw Gateway uit op een Hetzner-VPS met Docker, met duurzame statusopslag, ingebouwde binaire bestanden en veilig herstartgedrag.

De prijzen van Hetzner veranderen; kies de kleinste Debian-/Ubuntu-VPS die voldoet en schaal op als er fouten door onvoldoende geheugen optreden.

De Gateway is vanaf je laptop toegankelijk via SSH-poortdoorschakeling, of via directe blootstelling van de poort als je de firewall en tokens zelf beheert.

Herinnering aan het beveiligingsmodel:

- Door het bedrijf gedeelde agents zijn prima wanneer iedereen zich binnen dezelfde vertrouwensgrens bevindt en de runtime uitsluitend zakelijk wordt gebruikt.
- Handhaaf strikte scheiding: een afzonderlijke VPS/runtime en afzonderlijke accounts; gebruik geen persoonlijke Apple-/Google-/browser-/wachtwoordmanagerprofielen op die host.
- Als gebruikers elkaar niet vertrouwen, scheid ze dan per Gateway/host/OS-gebruiker.

Zie [Beveiliging](/nl/gateway/security) en [VPS-hosting](/nl/vps).

Deze handleiding gaat uit van Ubuntu of Debian op Hetzner. Pas op een andere Linux-VPS de pakketten dienovereenkomstig aan. Zie [Docker](/nl/install/docker) voor de algemene Docker-procedure.

## Wat je nodig hebt

- Een Hetzner-VPS met roottoegang
- SSH-toegang vanaf je laptop
- Docker en Docker Compose
- Authenticatiegegevens voor het model
- Optionele providerreferenties (WhatsApp-QR-code, Telegram-bottoken, Gmail OAuth)
- Ongeveer 20 minuten

## Snelle procedure

1. Richt een Hetzner-VPS in
2. Installeer Docker
3. Kloon de OpenClaw-repository
4. Maak permanente hostmappen
5. Configureer `.env` en `docker-compose.yml`
6. Bouw de vereiste binaire bestanden in de image in
7. Voer `docker compose up -d` uit
8. Controleer de permanente opslag en toegang tot de Gateway

<Steps>
  <Step title="Richt de VPS in">
    Maak een Ubuntu- of Debian-VPS in Hetzner en maak vervolgens als root verbinding:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Behandel de VPS als stateful infrastructuur, niet als wegwerpinfrastructuur.

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

  <Step title="Kloon de OpenClaw-repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Deze handleiding bouwt een aangepaste image, zodat alle ingebouwde binaire bestanden behouden blijven na herstarts.

  </Step>

  <Step title="Maak permanente hostmappen">
    Docker-containers zijn tijdelijk; alle langdurige status moet op de host worden opgeslagen.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configureer omgevingsvariabelen">
    Maak `.env` in de hoofdmap van de repository:

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

    Stel `OPENCLAW_GATEWAY_TOKEN` in om het stabiele Gateway-token via
    `.env` te beheren; configureer anders `gateway.auth.token` voordat je erop
    vertrouwt dat clients na herstarts verbinding kunnen maken. Als geen van beide is ingesteld, gebruikt OpenClaw
    voor die opstart een token dat alleen tijdens de runtime bestaat. Genereer een sleutelboswachtwoord voor `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Commit dit bestand niet.** Het bevat omgevingsvariabelen voor de container/runtime, zoals
    `OPENCLAW_GATEWAY_TOKEN`. Opgeslagen OAuth-/API-sleutelauthenticatie voor providers bevindt zich in het
    gekoppelde `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker Compose-configuratie">
    Maak of werk `docker-compose.yml` bij:

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

    `--allow-unconfigured` dient alleen voor het gemak tijdens het opstarten en vervangt geen echte Gateway-configuratie. Stel voor je implementatie alsnog authenticatie (`gateway.auth.token` of een wachtwoord) en een veilige bindingsmodus in.

  </Step>

  <Step title="Gedeelde runtimestappen voor een Docker-VM">
    Volg de gedeelde runtimehandleiding voor de algemene procedure op een Docker-host:

    - [Bouw de vereiste binaire bestanden in de image in](/nl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bouw en start](/nl/install/docker-vm-runtime#build-and-launch)
    - [Wat waar behouden blijft](/nl/install/docker-vm-runtime#what-persists-where)
    - [Updates](/nl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specifieke toegang">
    Open de tunnel nadat je de gedeelde stappen voor het bouwen en starten hebt voltooid.

    **Vereiste:** zorg ervoor dat de sshd-configuratie van je VPS TCP-doorschakeling toestaat. Als je
    de SSH-configuratie hebt aangescherpt, controleer dan `/etc/ssh/sshd_config` en stel het volgende in:

    ```text
    AllowTcpForwarding local
    ```

    `local` staat lokale `ssh -L`-doorschakelingen vanaf je laptop toe, maar blokkeert
    externe doorschakelingen vanaf de server. Als je dit instelt op `no`, mislukt de tunnel met:
    `channel 3: open failed: administratively prohibited: open failed`

    Start nadat je hebt bevestigd dat TCP-doorschakeling is ingeschakeld de SSH-service opnieuw
    (`systemctl restart ssh`) en voer de tunnel vanaf je laptop uit:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Open `http://127.0.0.1:18789/` en plak het geconfigureerde gedeelde geheim.
    Deze handleiding gebruikt standaard het Gateway-token; gebruik in plaats daarvan je geconfigureerde wachtwoord
    als je bent overgeschakeld op wachtwoordauthenticatie.

  </Step>
</Steps>

Het gedeelde overzicht van permanente opslag staat in [Docker-VM-runtime](/nl/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Voor teams die de voorkeur geven aan Infrastructure-as-Code-workflows biedt een door de community onderhouden Terraform-configuratie:

- Modulaire Terraform-configuratie met extern statusbeheer
- Geautomatiseerde inrichting via cloud-init
- Implementatiescripts (opstarten, implementeren, back-up/herstel)
- Beveiligingsaanscherping (firewall, UFW, uitsluitend SSH-toegang)
- SSH-tunnelconfiguratie voor toegang tot de Gateway

**Repository's:**

- Infrastructuur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker-configuratie: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Deze aanpak vult de bovenstaande Docker-configuratie aan met reproduceerbare implementaties, versiebeheerde infrastructuur en geautomatiseerd noodherstel.

<Note>
Onderhouden door de community. Raadpleeg de bovenstaande repositorylinks voor problemen of bijdragen.
</Note>

## Volgende stappen

- Stel berichtenkanalen in: [Kanalen](/nl/channels)
- Configureer de Gateway: [Gateway-configuratie](/nl/gateway/configuration)
- Houd OpenClaw up-to-date: [Bijwerken](/nl/install/updating)

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Fly.io](/nl/install/fly)
- [Docker](/nl/install/docker)
- [VPS-hosting](/nl/vps)
