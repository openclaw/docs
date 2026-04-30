---
read_when:
    - Sie möchten eine automatisierte Serverbereitstellung mit Sicherheitshärtung
    - Sie benötigen eine durch eine Firewall isolierte Einrichtung mit VPN-Zugriff
    - Sie stellen auf entfernten Debian-/Ubuntu-Servern bereit
summary: Automatisierte, gehärtete OpenClaw-Installation mit Ansible, Tailscale-VPN und Firewall-Isolierung
title: Ansible
x-i18n:
    generated_at: "2026-04-30T06:59:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Ansible-Installation

Stellen Sie OpenClaw mit **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** auf Produktionsservern bereit -- einem automatisierten Installer mit Security-First-Architektur.

<Info>
Das Repository [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) ist die maßgebliche Quelle für die Ansible-Bereitstellung. Diese Seite ist eine kurze Übersicht.
</Info>

## Voraussetzungen

| Anforderung | Details                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ oder Ubuntu 20.04+                             |
| **Zugriff** | Root- oder sudo-Berechtigungen                            |
| **Netzwerk** | Internetverbindung für die Paketinstallation             |
| **Ansible** | 2.14+ (wird automatisch vom Schnellstartskript installiert) |

## Was Sie erhalten

- **Firewall-First-Sicherheit** -- UFW + Docker-Isolation (nur SSH + Tailscale erreichbar)
- **Tailscale VPN** -- sicherer Fernzugriff, ohne Dienste öffentlich bereitzustellen
- **Docker** -- isolierte Sandbox-Container, nur localhost-Bindings
- **Defense in Depth** -- 4-Schichten-Sicherheitsarchitektur
- **Systemd-Integration** -- automatischer Start beim Booten mit Härtung
- **Ein-Befehl-Einrichtung** -- vollständige Bereitstellung in wenigen Minuten

## Schnellstart

Installation mit einem Befehl:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Was installiert wird

Das Ansible-Playbook installiert und konfiguriert:

1. **Tailscale** -- Mesh-VPN für sicheren Fernzugriff
2. **UFW-Firewall** -- nur SSH- + Tailscale-Ports
3. **Docker CE + Compose V2** -- für das Standard-Backend der Agent-Sandbox
4. **Node.js 24 + pnpm** -- Runtime-Abhängigkeiten (Node 22 LTS, derzeit `22.14+`, bleibt unterstützt)
5. **OpenClaw** -- hostbasiert, nicht containerisiert
6. **Systemd-Dienst** -- automatischer Start mit Sicherheitshärtung

<Note>
Der Gateway läuft direkt auf dem Host (nicht in Docker). Agent-Sandboxing ist
optional; dieses Playbook installiert Docker, weil es das Standard-Sandbox-
Backend ist. Details und andere Backends finden Sie unter [Sandboxing](/de/gateway/sandboxing).
</Note>

## Einrichtung nach der Installation

<Steps>
  <Step title="Zum openclaw-Benutzer wechseln">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Onboarding-Assistenten ausführen">
    Das Post-Install-Skript führt Sie durch die Konfiguration der OpenClaw-Einstellungen.
  </Step>
  <Step title="Messaging-Provider verbinden">
    Melden Sie sich bei WhatsApp, Telegram, Discord oder Signal an:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Installation überprüfen">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Mit Tailscale verbinden">
    Treten Sie Ihrem VPN-Mesh für sicheren Fernzugriff bei.
  </Step>
</Steps>

### Schnellbefehle

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

## Sicherheitsarchitektur

Die Bereitstellung nutzt ein 4-Schichten-Verteidigungsmodell:

1. **Firewall (UFW)** -- nur SSH (22) + Tailscale (41641/udp) öffentlich exponiert
2. **VPN (Tailscale)** -- Gateway nur über das VPN-Mesh erreichbar
3. **Docker-Isolation** -- DOCKER-USER-iptables-Chain verhindert externe Portfreigaben
4. **Systemd-Härtung** -- NoNewPrivileges, PrivateTmp, unprivilegierter Benutzer

So überprüfen Sie Ihre externe Angriffsfläche:

```bash
nmap -p- YOUR_SERVER_IP
```

Nur Port 22 (SSH) sollte offen sein. Alle anderen Dienste (Gateway, Docker) sind gesperrt.

Docker wird für Agent-Sandboxes (isolierte Tool-Ausführung) installiert, nicht für den Betrieb des Gateways selbst. Informationen zur Sandbox-Konfiguration finden Sie unter [Multi-Agent Sandbox and Tools](/de/tools/multi-agent-sandbox-tools).

## Manuelle Installation

Wenn Sie die Automatisierung lieber manuell steuern möchten:

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
  <Step title="Ansible-Collections installieren">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Playbook ausführen">
    ```bash
    ./run-playbook.sh
    ```

    Alternativ können Sie es direkt ausführen und anschließend das Einrichtungsskript manuell starten:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aktualisierung

Der Ansible-Installer richtet OpenClaw für manuelle Updates ein. Den standardmäßigen Aktualisierungsablauf finden Sie unter [Aktualisierung](/de/install/updating).

So führen Sie das Ansible-Playbook erneut aus (zum Beispiel für Konfigurationsänderungen):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Dies ist idempotent und kann sicher mehrfach ausgeführt werden.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Firewall blockiert meine Verbindung">
    - Stellen Sie sicher, dass Sie zuerst über Tailscale VPN zugreifen können
    - SSH-Zugriff (Port 22) ist immer erlaubt
    - Der Gateway ist absichtlich nur über Tailscale erreichbar

  </Accordion>
  <Accordion title="Dienst startet nicht">
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
  <Accordion title="Probleme mit der Docker-Sandbox">
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
  <Accordion title="Provider-Anmeldung schlägt fehl">
    Stellen Sie sicher, dass Sie als Benutzer `openclaw` ausführen:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

Detaillierte Informationen zur Sicherheitsarchitektur und Fehlerbehebung finden Sie im openclaw-ansible-Repository:

- [Sicherheitsarchitektur](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technische Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Anleitung zur Fehlerbehebung](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Verwandte Themen

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- vollständige Bereitstellungsanleitung
- [Docker](/de/install/docker) -- containerisierte Gateway-Einrichtung
- [Sandboxing](/de/gateway/sandboxing) -- Agent-Sandbox-Konfiguration
- [Multi-Agent Sandbox and Tools](/de/tools/multi-agent-sandbox-tools) -- Isolation pro Agent
