---
read_when:
    - Sie möchten eine automatisierte Serverbereitstellung mit Sicherheitshärtung
    - Sie benötigen eine durch eine Firewall isolierte Einrichtung mit VPN-Zugriff
    - Sie führen die Bereitstellung auf entfernten Debian-/Ubuntu-Servern durch
summary: Automatisierte, gehärtete OpenClaw-Installation mit Ansible, Tailscale-VPN und Firewall-Isolierung
title: Ansible
x-i18n:
    generated_at: "2026-07-12T15:25:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

Stellen Sie OpenClaw mit **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** auf Produktionsservern bereit – einem automatisierten Installationsprogramm mit einer konsequent auf Sicherheit ausgerichteten Architektur.

<Info>
Das Repository [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) ist die maßgebliche Quelle für die Bereitstellung mit Ansible. Diese Seite bietet einen kurzen Überblick.
</Info>

## Voraussetzungen

| Anforderung | Details                                                   |
| ----------- | --------------------------------------------------------- |
| Betriebssystem | Debian 11+ oder Ubuntu 20.04+                          |
| Zugriff     | Root- oder sudo-Berechtigungen                            |
| Netzwerk    | Internetverbindung für die Paketinstallation              |
| Ansible     | 2.14+ (wird vom Schnellstartskript automatisch installiert) |

## Leistungsumfang

- Sicherheit nach dem Firewall-first-Prinzip: UFW + Docker-Isolierung (nur SSH + Tailscale erreichbar)
- Tailscale-VPN für den Fernzugriff, ohne Dienste öffentlich zugänglich zu machen
- Docker für isolierte Sandbox-Container mit Bindungen ausschließlich an localhost
- Systemd-Integration mit Härtung und automatischem Start beim Systemstart
- Einrichtung mit einem einzigen Befehl

## Schnellstart

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Installierte Komponenten

1. Tailscale (Mesh-VPN für sicheren Fernzugriff)
2. UFW-Firewall (nur SSH- + Tailscale-Ports)
3. Docker CE + Compose V2 (standardmäßiges Sandbox-Backend für Agenten)
4. Node.js und pnpm (OpenClaw erfordert Node 22.19+ oder 23.11+; Node 24 wird empfohlen)
5. OpenClaw, hostbasiert und nicht containerisiert installiert
6. Ein systemd-Dienst mit Sicherheitshärtung

<Note>
Das Gateway wird direkt auf dem Host und nicht in Docker ausgeführt. Die Sandbox-Isolierung von Agenten ist
optional; dieses Playbook installiert Docker, da es das standardmäßige Sandbox-
Backend ist. Weitere Backends finden Sie unter [Sandbox-Isolierung](/de/gateway/sandboxing).
</Note>

## Einrichtung nach der Installation

<Steps>
  <Step title="Zum Benutzer openclaw wechseln">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Onboarding-Assistenten ausführen">
    Das Skript für die Einrichtung nach der Installation führt Sie durch die Konfiguration von OpenClaw.
  </Step>
  <Step title="Nachrichtenkanäle verbinden">
    Melden Sie sich bei WhatsApp, Telegram, Discord oder Signal an:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Installation überprüfen">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Mit Tailscale verbinden">
    Treten Sie für sicheren Fernzugriff Ihrem VPN-Mesh bei.
  </Step>
</Steps>

### Schnellbefehle

```bash
# Dienststatus prüfen
sudo systemctl status openclaw

# Live-Protokolle anzeigen
sudo journalctl -u openclaw -f

# Gateway neu starten
sudo systemctl restart openclaw

# Kanalanmeldung (als Benutzer openclaw ausführen)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Sicherheitsarchitektur

Vierstufiges Schutzmodell:

1. Firewall (UFW): Nur SSH (22) und Tailscale (41641/udp) sind öffentlich erreichbar
2. VPN (Tailscale): Das Gateway ist nur über das VPN-Mesh erreichbar
3. Docker-Isolierung: Die iptables-Kette `DOCKER-USER` verhindert die externe Freigabe von Ports
4. Systemd-Härtung: `NoNewPrivileges`, `PrivateTmp`, Benutzer ohne erhöhte Berechtigungen

Überprüfen Sie Ihre externe Angriffsfläche:

```bash
nmap -p- YOUR_SERVER_IP
```

Nur Port 22 (SSH) sollte geöffnet sein. Gateway und Docker bleiben abgeschottet.

Docker wird für Agenten-Sandboxes (isolierte Werkzeugausführung) installiert, nicht für die Ausführung des Gateways. Informationen zur Sandbox-Konfiguration finden Sie unter [Multi-Agenten-Sandbox und Werkzeuge](/de/tools/multi-agent-sandbox-tools).

## Manuelle Installation

<Steps>
  <Step title="Voraussetzungen installieren">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Repository klonen">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Ansible-Sammlungen installieren">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Playbook ausführen">
    ```bash
    ./run-playbook.sh
    ```

    Alternativ können Sie das Playbook direkt und anschließend das Einrichtungsskript manuell ausführen:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Anschließend ausführen: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aktualisierung

Das Ansible-Installationsprogramm richtet OpenClaw für manuelle Aktualisierungen ein. Den Standardablauf finden Sie unter [Aktualisierung](/de/install/updating).

So führen Sie das Playbook erneut aus, beispielsweise nach Konfigurationsänderungen:

```bash
cd openclaw-ansible
./run-playbook.sh
```

Der Vorgang ist idempotent und kann sicher mehrfach ausgeführt werden.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Die Firewall blockiert meine Verbindung">
    - Stellen Sie zuerst eine Verbindung über das Tailscale-VPN her; das Gateway ist absichtlich nur auf diesem Weg erreichbar.
    - SSH (Port 22) ist immer zugelassen.

  </Accordion>
  <Accordion title="Der Dienst startet nicht">
    ```bash
    # Protokolle prüfen
    sudo journalctl -u openclaw -n 100

    # Berechtigungen überprüfen
    sudo ls -la /opt/openclaw

    # Manuellen Start testen
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Probleme mit der Docker-Sandbox">
    ```bash
    # Überprüfen, ob Docker ausgeführt wird
    sudo systemctl status docker

    # Sandbox-Image prüfen
    sudo docker images | grep openclaw-sandbox

    # Fehlendes Sandbox-Image erstellen (erfordert einen Quellcode-Checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Informationen zu npm-Installationen ohne Quellcode-Checkout finden Sie unter
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Kanalanmeldung schlägt fehl">
    Stellen Sie sicher, dass Sie die Befehle als Benutzer `openclaw` ausführen:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

Ausführliche Informationen zur Sicherheitsarchitektur und Fehlerbehebung finden Sie im Repository openclaw-ansible:

- [Sicherheitsarchitektur](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technische Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Leitfaden zur Fehlerbehebung](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Verwandte Themen

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): vollständiger Bereitstellungsleitfaden
- [Docker](/de/install/docker): Einrichtung eines containerisierten Gateways
- [Sandbox-Isolierung](/de/gateway/sandboxing): Sandbox-Konfiguration für Agenten
- [Multi-Agenten-Sandbox und Werkzeuge](/de/tools/multi-agent-sandbox-tools): Isolierung pro Agent
