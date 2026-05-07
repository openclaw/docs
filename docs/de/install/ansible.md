---
read_when:
    - Sie möchten eine automatisierte Serverbereitstellung mit Sicherheitshärtung
    - Sie benötigen eine durch eine Firewall isolierte Einrichtung mit VPN-Zugriff
    - Sie stellen auf entfernten Debian-/Ubuntu-Servern bereit
summary: Automatisierte, gehärtete OpenClaw-Installation mit Ansible, Tailscale-VPN und Firewall-Isolation
title: Ansible
x-i18n:
    generated_at: "2026-05-07T13:20:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f7a2a0c575529fd45804e160299239339100ec37979a17162cee9537ddb4653
    source_path: install/ansible.md
    workflow: 16
---

Stellen Sie OpenClaw mit **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** auf Produktionsservern bereit -- einem automatisierten Installer mit sicherheitsorientierter Architektur.

<Info>
Das Repo [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) ist die maßgebliche Quelle für die Ansible-Bereitstellung. Diese Seite ist eine kurze Übersicht.
</Info>

## Voraussetzungen

| Anforderung | Details                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ oder Ubuntu 20.04+                             |
| **Zugriff** | Root- oder sudo-Rechte                                    |
| **Netzwerk** | Internetverbindung für die Paketinstallation             |
| **Ansible** | 2.14+ (wird automatisch vom Schnellstartskript installiert) |

## Was Sie erhalten

- **Firewall-First-Sicherheit** -- UFW + Docker-Isolierung (nur SSH + Tailscale zugänglich)
- **Tailscale-VPN** -- sicherer Remote-Zugriff, ohne Dienste öffentlich freizugeben
- **Docker** -- isolierte Sandbox-Container, nur localhost-Bindungen
- **Defense in Depth** -- 4-Schichten-Sicherheitsarchitektur
- **Systemd-Integration** -- automatischer Start beim Booten mit Härtung
- **Ein-Befehl-Einrichtung** -- vollständige Bereitstellung in Minuten

## Schnellstart

Installation mit einem Befehl:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Was installiert wird

Das Ansible-Playbook installiert und konfiguriert:

1. **Tailscale** -- Mesh-VPN für sicheren Remote-Zugriff
2. **UFW-Firewall** -- nur SSH- + Tailscale-Ports
3. **Docker CE + Compose V2** -- für das Standard-Backend der Agent-Sandbox
4. **Node.js 24 + pnpm** -- Laufzeitabhängigkeiten (Node 22 LTS, derzeit `22.16+`, bleibt unterstützt)
5. **OpenClaw** -- hostbasiert, nicht containerisiert
6. **Systemd-Dienst** -- automatischer Start mit Sicherheitshärtung

<Note>
Der Gateway läuft direkt auf dem Host (nicht in Docker). Agent-Sandboxing ist
optional; dieses Playbook installiert Docker, weil es das Standard-Sandbox-
Backend ist. Siehe [Sandboxing](/de/gateway/sandboxing) für Details und andere Backends.
</Note>

## Einrichtung nach der Installation

<Steps>
  <Step title="Zum openclaw-Benutzer wechseln">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Onboarding-Assistenten ausführen">
    Das Skript nach der Installation führt Sie durch die Konfiguration der OpenClaw-Einstellungen.
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
    Treten Sie Ihrem VPN-Mesh für sicheren Remote-Zugriff bei.
  </Step>
</Steps>

### Schnellbefehle

```bash
# Dienststatus prüfen
sudo systemctl status openclaw

# Live-Logs anzeigen
sudo journalctl -u openclaw -f

# Gateway neu starten
sudo systemctl restart openclaw

# Provider-Anmeldung (als openclaw-Benutzer ausführen)
sudo -i -u openclaw
openclaw channels login
```

## Sicherheitsarchitektur

Die Bereitstellung verwendet ein 4-Schichten-Verteidigungsmodell:

1. **Firewall (UFW)** -- nur SSH (22) + Tailscale (41641/udp) öffentlich freigegeben
2. **VPN (Tailscale)** -- Gateway nur über das VPN-Mesh erreichbar
3. **Docker-Isolierung** -- DOCKER-USER-iptables-Kette verhindert externe Portfreigaben
4. **Systemd-Härtung** -- NoNewPrivileges, PrivateTmp, nicht privilegierter Benutzer

So überprüfen Sie Ihre externe Angriffsfläche:

```bash
nmap -p- YOUR_SERVER_IP
```

Nur Port 22 (SSH) sollte geöffnet sein. Alle anderen Dienste (Gateway, Docker) sind abgesichert.

Docker wird für Agent-Sandboxes (isolierte Tool-Ausführung) installiert, nicht für den Betrieb des Gateways selbst. Siehe [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) zur Sandbox-Konfiguration.

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

    Alternativ direkt ausführen und anschließend das Einrichtungsskript manuell ausführen:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Danach ausführen: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aktualisierung

Der Ansible-Installer richtet OpenClaw für manuelle Updates ein. Siehe [Aktualisierung](/de/install/updating) für den standardmäßigen Aktualisierungsablauf.

So führen Sie das Ansible-Playbook erneut aus (zum Beispiel für Konfigurationsänderungen):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Dies ist idempotent und kann sicher mehrfach ausgeführt werden.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Firewall blockiert meine Verbindung">
    - Stellen Sie sicher, dass Sie zuerst über das Tailscale-VPN zugreifen können
    - SSH-Zugriff (Port 22) ist immer erlaubt
    - Der Gateway ist absichtlich nur über Tailscale erreichbar

  </Accordion>
  <Accordion title="Dienst startet nicht">
    ```bash
    # Logs prüfen
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
    # Überprüfen, ob Docker läuft
    sudo systemctl status docker

    # Sandbox-Image prüfen
    sudo docker images | grep openclaw-sandbox

    # Sandbox-Image erstellen, falls es fehlt (erfordert Source-Checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Für npm-Installationen ohne Source-Checkout siehe
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
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

Ausführliche Informationen zur Sicherheitsarchitektur und Fehlerbehebung finden Sie im openclaw-ansible-Repo:

- [Sicherheitsarchitektur](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technische Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Fehlerbehebungsleitfaden](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Verwandte Themen

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- vollständiger Bereitstellungsleitfaden
- [Docker](/de/install/docker) -- containerisierte Gateway-Einrichtung
- [Sandboxing](/de/gateway/sandboxing) -- Agent-Sandbox-Konfiguration
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) -- Isolierung pro Agent
