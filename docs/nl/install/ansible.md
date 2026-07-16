---
read_when:
    - Je wilt geautomatiseerde serverimplementatie met beveiligingsversterking
    - Je hebt een door een firewall geïsoleerde installatie met VPN-toegang nodig
    - Je implementeert op externe Debian-/Ubuntu-servers
summary: Geautomatiseerde, geharde installatie van OpenClaw met Ansible, Tailscale VPN en firewallisolatie
title: Ansible
x-i18n:
    generated_at: "2026-07-16T15:48:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

Implementeer OpenClaw op productieservers met **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**, een geautomatiseerd installatieprogramma met een beveiligingsgerichte architectuur.

<Info>
De repository [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) is de gezaghebbende bron voor implementatie met Ansible. Deze pagina biedt een kort overzicht.
</Info>

## Vereisten

| Vereiste    | Details                                                   |
| ----------- | --------------------------------------------------------- |
| OS          | Debian 11+ of Ubuntu 20.04+                               |
| Toegang     | Root- of sudo-rechten                                     |
| Netwerk     | Internetverbinding voor de installatie van pakketten      |
| Ansible     | 2.14+ (automatisch geïnstalleerd door het snelstartscript) |

## Wat je krijgt

- Beveiliging met de firewall voorop: UFW + Docker-isolatie (alleen SSH + Tailscale bereikbaar)
- Tailscale-VPN voor externe toegang zonder services openbaar beschikbaar te maken
- Docker voor geïsoleerde sandboxcontainers met uitsluitend bindingen aan localhost
- Systemd-integratie met beveiligingsversterking en automatisch starten bij het opstarten
- Installatie met één opdracht

## Snel aan de slag

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Wat er wordt geïnstalleerd

1. Tailscale (mesh-VPN voor veilige externe toegang)
2. UFW-firewall (alleen poorten voor SSH + Tailscale)
3. Docker CE + Compose V2 (standaardbackend voor agentsandboxes)
4. Node.js en pnpm (OpenClaw vereist Node 22.22.3+, 24.15+ of 25.9+; Node 24 wordt aanbevolen)
5. OpenClaw, hostgebaseerd geïnstalleerd, niet in een container
6. Een systemd-service met beveiligingsversterking

<Note>
De Gateway draait rechtstreeks op de host, niet in Docker. Agentsandboxing is
optioneel; dit playbook installeert Docker omdat dit de standaardbackend voor
sandboxes is. Zie [Sandboxing](/nl/gateway/sandboxing) voor andere backends.
</Note>

## Configuratie na installatie

<Steps>
  <Step title="Schakel over naar de openclaw-gebruiker">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Voer de onboardingwizard uit">
    Het script voor na de installatie begeleidt je bij het configureren van OpenClaw.
  </Step>
  <Step title="Verbind berichtkanalen">
    Meld je aan bij WhatsApp, Telegram, Discord of Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Controleer de installatie">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Maak verbinding met Tailscale">
    Neem deel aan je VPN-mesh voor veilige externe toegang.
  </Step>
</Steps>

### Snelle opdrachten

```bash
# Servicestatus controleren
sudo systemctl status openclaw

# Live-logboeken bekijken
sudo journalctl -u openclaw -f

# Gateway opnieuw starten
sudo systemctl restart openclaw

# Aanmelden bij een kanaal (uitvoeren als openclaw-gebruiker)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Beveiligingsarchitectuur

Verdedigingsmodel met vier lagen:

1. Firewall (UFW): alleen SSH (22) en Tailscale (41641/udp) zijn openbaar bereikbaar
2. VPN (Tailscale): de Gateway is alleen bereikbaar via de VPN-mesh
3. Docker-isolatie: de iptables-keten `DOCKER-USER` voorkomt dat poorten extern beschikbaar worden
4. Systemd-beveiligingsversterking: `NoNewPrivileges`, `PrivateTmp`, gebruiker zonder verhoogde rechten

Controleer je externe aanvalsoppervlak:

```bash
nmap -p- YOUR_SERVER_IP
```

Alleen poort 22 (SSH) hoort open te zijn. De Gateway en Docker blijven afgeschermd.

Docker wordt geïnstalleerd voor agentsandboxes (geïsoleerde uitvoering van tools), niet om de Gateway uit te voeren. Zie [Sandbox en tools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools) voor de sandboxconfiguratie.

## Handmatige installatie

<Steps>
  <Step title="Installeer de vereisten">
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

    Of voer het playbook rechtstreeks uit en voer daarna het configuratiescript handmatig uit:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Voer daarna uit: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Bijwerken

Het Ansible-installatieprogramma configureert OpenClaw voor handmatige updates; zie [Bijwerken](/nl/install/updating) voor de standaardprocedure.

Om het playbook opnieuw uit te voeren (bijvoorbeeld na configuratiewijzigingen):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Dit is idempotent en kan veilig meerdere keren worden uitgevoerd.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="De firewall blokkeert mijn verbinding">
    - Maak eerst verbinding via de Tailscale-VPN; de Gateway is bewust alleen op die manier bereikbaar.
    - SSH (poort 22) is altijd toegestaan.

  </Accordion>
  <Accordion title="De service start niet">
    ```bash
    # Logboeken controleren
    sudo journalctl -u openclaw -n 100

    # Rechten controleren
    sudo ls -la /opt/openclaw

    # Handmatig starten testen
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problemen met de Docker-sandbox">
    ```bash
    # Controleren of Docker actief is
    sudo systemctl status docker

    # Sandboximage controleren
    sudo docker images | grep openclaw-sandbox

    # De sandboximage bouwen als deze ontbreekt (vereist een checkout van de broncode)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Zie voor npm-installaties zonder checkout van de broncode
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Aanmelden bij een kanaal mislukt">
    Zorg dat je de opdracht uitvoert als de gebruiker `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Geavanceerde configuratie

Zie de repository openclaw-ansible voor gedetailleerde informatie over de beveiligingsarchitectuur en probleemoplossing:

- [Beveiligingsarchitectuur](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technische details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Handleiding voor probleemoplossing](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Gerelateerd

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): volledige implementatiehandleiding
- [Docker](/nl/install/docker): configuratie van de Gateway in een container
- [Sandboxing](/nl/gateway/sandboxing): configuratie van agentsandboxes
- [Sandbox en tools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools): isolatie per agent
