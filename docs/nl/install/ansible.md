---
read_when:
    - Je wilt geautomatiseerde serveruitrol met beveiligingshardening
    - Je hebt een firewall-geïsoleerde installatie met VPN-toegang nodig
    - Je implementeert op externe Debian/Ubuntu-servers
summary: Geautomatiseerde, geharde OpenClaw-installatie met Ansible, Tailscale VPN en firewallisolatie
title: Ansible
x-i18n:
    generated_at: "2026-04-29T22:52:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Ansible-installatie

Implementeer OpenClaw op productieservers met **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- een geautomatiseerd installatieprogramma met een security-first architectuur.

<Info>
De [openclaw-ansible](https://github.com/openclaw/openclaw-ansible)-repo is de bron van waarheid voor Ansible-implementatie. Deze pagina is een kort overzicht.
</Info>

## Vereisten

| Vereiste    | Details                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ of Ubuntu 20.04+                               |
| **Toegang** | Root- of sudo-rechten                                     |
| **Netwerk** | Internetverbinding voor pakketinstallatie                 |
| **Ansible** | 2.14+ (automatisch geïnstalleerd door het quick-startscript) |

## Wat je krijgt

- **Firewall-first beveiliging** -- UFW + Docker-isolatie (alleen SSH + Tailscale toegankelijk)
- **Tailscale VPN** -- veilige externe toegang zonder services openbaar bloot te stellen
- **Docker** -- geïsoleerde sandboxcontainers, alleen localhost-bindings
- **Defense in depth** -- beveiligingsarchitectuur met 4 lagen
- **Systemd-integratie** -- automatisch starten bij opstarten met hardening
- **Installatie met één opdracht** -- volledige implementatie in enkele minuten

## Quick start

Installatie met één opdracht:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Wat er wordt geïnstalleerd

Het Ansible-playbook installeert en configureert:

1. **Tailscale** -- mesh-VPN voor veilige externe toegang
2. **UFW-firewall** -- alleen SSH + Tailscale-poorten
3. **Docker CE + Compose V2** -- voor de standaard agent-sandboxbackend
4. **Node.js 24 + pnpm** -- runtime-afhankelijkheden (Node 22 LTS, momenteel `22.14+`, blijft ondersteund)
5. **OpenClaw** -- hostgebaseerd, niet gecontaineriseerd
6. **Systemd-service** -- automatisch starten met security hardening

<Note>
De Gateway draait rechtstreeks op de host (niet in Docker). Agent-sandboxing is
optioneel; dit playbook installeert Docker omdat dit de standaard sandbox-
backend is. Zie [Sandboxing](/nl/gateway/sandboxing) voor details en andere backends.
</Note>

## Instellen na installatie

<Steps>
  <Step title="Schakel over naar de openclaw-gebruiker">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Voer de onboardingwizard uit">
    Het post-installatiescript begeleidt je bij het configureren van OpenClaw-instellingen.
  </Step>
  <Step title="Verbind messagingproviders">
    Log in bij WhatsApp, Telegram, Discord of Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Controleer de installatie">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Verbind met Tailscale">
    Word lid van je VPN-mesh voor veilige externe toegang.
  </Step>
</Steps>

### Snelle opdrachten

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## Beveiligingsarchitectuur

De implementatie gebruikt een defense-model met 4 lagen:

1. **Firewall (UFW)** -- alleen SSH (22) + Tailscale (41641/udp) openbaar blootgesteld
2. **VPN (Tailscale)** -- Gateway alleen toegankelijk via VPN-mesh
3. **Docker-isolatie** -- DOCKER-USER iptables-chain voorkomt blootstelling van externe poorten
4. **Systemd-hardening** -- NoNewPrivileges, PrivateTmp, gebruiker zonder privileges

Om je externe aanvalsoppervlak te controleren:

```bash
nmap -p- YOUR_SERVER_IP
```

Alleen poort 22 (SSH) zou open moeten zijn. Alle andere services (Gateway, Docker) zijn vergrendeld.

Docker wordt geïnstalleerd voor agent-sandboxes (geïsoleerde uitvoering van tools), niet om de Gateway zelf te draaien. Zie [Multi-Agent Sandbox and Tools](/nl/tools/multi-agent-sandbox-tools) voor sandboxconfiguratie.

## Handmatige installatie

Als je liever handmatige controle hebt over de automatisering:

<Steps>
  <Step title="Installeer vereisten">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Kloon de repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Installeer Ansible-collecties">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Voer het playbook uit">
    ```bash
    ./run-playbook.sh
    ```

    Je kunt ook rechtstreeks uitvoeren en daarna handmatig het setupscript uitvoeren:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Bijwerken

Het Ansible-installatieprogramma stelt OpenClaw in voor handmatige updates. Zie [Bijwerken](/nl/install/updating) voor de standaard updateflow.

Om het Ansible-playbook opnieuw uit te voeren (bijvoorbeeld voor configuratiewijzigingen):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Dit is idempotent en kan veilig meerdere keren worden uitgevoerd.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Firewall blokkeert mijn verbinding">
    - Zorg ervoor dat je eerst toegang hebt via Tailscale VPN
    - SSH-toegang (poort 22) is altijd toegestaan
    - De Gateway is bewust alleen toegankelijk via Tailscale

  </Accordion>
  <Accordion title="Service start niet">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problemen met Docker-sandbox">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Providerlogin mislukt">
    Zorg ervoor dat je als de `openclaw`-gebruiker draait:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Geavanceerde configuratie

Zie de openclaw-ansible-repo voor gedetailleerde beveiligingsarchitectuur en probleemoplossing:

- [Beveiligingsarchitectuur](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technische details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Handleiding voor probleemoplossing](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Gerelateerd

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- volledige implementatiehandleiding
- [Docker](/nl/install/docker) -- gecontaineriseerde Gateway-installatie
- [Sandboxing](/nl/gateway/sandboxing) -- agent-sandboxconfiguratie
- [Multi-Agent Sandbox and Tools](/nl/tools/multi-agent-sandbox-tools) -- isolatie per agent
