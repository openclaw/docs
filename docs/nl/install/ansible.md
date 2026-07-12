---
read_when:
    - U wilt geautomatiseerde serverimplementatie met beveiligingsversterking
    - Je hebt een door een firewall geïsoleerde configuratie met VPN-toegang nodig
    - Je implementeert op externe Debian-/Ubuntu-servers
summary: Geautomatiseerde, geharde installatie van OpenClaw met Ansible, Tailscale-VPN en firewallisolatie
title: Ansible
x-i18n:
    generated_at: "2026-07-12T08:54:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

Implementeer OpenClaw op productieservers met **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**, een geautomatiseerd installatieprogramma met een architectuur waarin beveiliging vooropstaat.

<Info>
De opslagplaats [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) is de gezaghebbende bron voor implementatie met Ansible. Deze pagina biedt een kort overzicht.
</Info>

## Vereisten

| Vereiste | Details                                                   |
| -------- | --------------------------------------------------------- |
| Besturingssysteem | Debian 11+ of Ubuntu 20.04+                       |
| Toegang  | Root- of sudo-rechten                                     |
| Netwerk  | Internetverbinding voor de installatie van pakketten      |
| Ansible  | 2.14+ (automatisch geïnstalleerd door het snelstartscript) |

## Wat u krijgt

- Beveiliging met de firewall als eerste verdedigingslinie: UFW + Docker-isolatie (alleen SSH + Tailscale bereikbaar)
- Tailscale-VPN voor externe toegang zonder services openbaar toegankelijk te maken
- Docker voor geïsoleerde sandboxcontainers met uitsluitend lokale bindingen
- Systemd-integratie met beveiligingsversterking en automatisch starten tijdens het opstarten
- Installatie met één opdracht

## Snel aan de slag

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Wat wordt geïnstalleerd

1. Tailscale (mesh-VPN voor veilige externe toegang)
2. UFW-firewall (alleen poorten voor SSH + Tailscale)
3. Docker CE + Compose V2 (standaardbackend voor agentsandboxes)
4. Node.js en pnpm (OpenClaw vereist Node 22.19+ of 23.11+; Node 24 wordt aanbevolen)
5. OpenClaw, op de host geïnstalleerd en niet in een container
6. Een systemd-service met beveiligingsversterking

<Note>
De Gateway draait rechtstreeks op de host, niet in Docker. Agentsandboxing is
optioneel; dit playbook installeert Docker omdat dit de standaardbackend voor
sandboxes is. Zie [Sandboxing](/nl/gateway/sandboxing) voor andere backends.
</Note>

## Configuratie na installatie

<Steps>
  <Step title="Overschakelen naar de gebruiker openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="De onboardingwizard uitvoeren">
    Het script voor na de installatie begeleidt u bij het configureren van OpenClaw.
  </Step>
  <Step title="Berichtenkanalen verbinden">
    Meld u aan bij WhatsApp, Telegram, Discord of Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="De installatie verifiëren">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Verbinding maken met Tailscale">
    Neem deel aan uw VPN-mesh voor veilige externe toegang.
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

# Aanmelden bij kanaal (uitvoeren als gebruiker openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Beveiligingsarchitectuur

Verdedigingsmodel met vier lagen:

1. Firewall (UFW): alleen SSH (22) en Tailscale (41641/udp) zijn openbaar toegankelijk
2. VPN (Tailscale): de Gateway is alleen bereikbaar via de VPN-mesh
3. Docker-isolatie: de iptables-keten `DOCKER-USER` voorkomt dat poorten extern toegankelijk zijn
4. Systemd-versterking: `NoNewPrivileges`, `PrivateTmp`, gebruiker zonder verhoogde rechten

Controleer uw externe aanvalsoppervlak:

```bash
nmap -p- YOUR_SERVER_IP
```

Alleen poort 22 (SSH) hoort open te zijn. De Gateway en Docker blijven afgeschermd.

Docker wordt geïnstalleerd voor agentsandboxes (geïsoleerde uitvoering van hulpprogramma's), niet om de Gateway uit te voeren. Zie [Sandbox voor meerdere agents en hulpprogramma's](/nl/tools/multi-agent-sandbox-tools) voor de sandboxconfiguratie.

## Handmatige installatie

<Steps>
  <Step title="Vereisten installeren">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="De opslagplaats klonen">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Ansible-collecties installeren">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Het playbook uitvoeren">
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

Het playbook opnieuw uitvoeren (bijvoorbeeld na configuratiewijzigingen):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Dit is idempotent en kan veilig meerdere keren worden uitgevoerd.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="De firewall blokkeert mijn verbinding">
    - Maak eerst verbinding via de Tailscale-VPN; de Gateway is standaard alleen op die manier bereikbaar.
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

    # De sandboximage bouwen als deze ontbreekt (vereist een uitgecheckte broncode)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Zie voor npm-installaties zonder uitgecheckte broncode
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Aanmelden bij het kanaal mislukt">
    Zorg dat u opdrachten uitvoert als de gebruiker `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Geavanceerde configuratie

Raadpleeg voor een gedetailleerde beveiligingsarchitectuur en informatie over probleemoplossing de opslagplaats openclaw-ansible:

- [Beveiligingsarchitectuur](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technische details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Gids voor probleemoplossing](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Gerelateerd

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): volledige implementatiehandleiding
- [Docker](/nl/install/docker): gecontaineriseerde Gateway-configuratie
- [Sandboxing](/nl/gateway/sandboxing): configuratie van agentsandboxes
- [Sandbox voor meerdere agents en hulpprogramma's](/nl/tools/multi-agent-sandbox-tools): isolatie per agent
