---
read_when:
    - Sie möchten eine automatisierte Server-Bereitstellung mit Sicherheits-Härtung
    - Sie benötigen eine firewall-isolierte Einrichtung mit VPN-Zugriff
    - Sie stellen auf entfernten Debian-/Ubuntu-Servern bereit
summary: Automatisierte, gehärtete OpenClaw-Installation mit Ansible, Tailscale-VPN und Firewall-Isolation
title: Ansible
x-i18n:
    generated_at: "2026-04-21T06:26:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# Ansible-Installation

Stellen Sie OpenClaw auf Produktionsservern mit **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** bereit — einem automatisierten Installer mit sicherheitsorientierter Architektur.

<Info>
Das Repository [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) ist die maßgebliche Quelle für die Bereitstellung mit Ansible. Diese Seite ist eine kurze Übersicht.
</Info>

## Voraussetzungen

| Anforderung | Details                                                  |
| ----------- | -------------------------------------------------------- |
| **OS**      | Debian 11+ oder Ubuntu 20.04+                            |
| **Zugriff** | Root- oder sudo-Berechtigungen                           |
| **Netzwerk** | Internetverbindung für die Paketinstallation            |
| **Ansible** | 2.14+ (wird automatisch durch das Schnellstart-Skript installiert) |

## Was Sie erhalten

- **Firewall-first-Sicherheit** — UFW + Docker-Isolation (nur SSH + Tailscale zugänglich)
- **Tailscale-VPN** — sicherer Fernzugriff, ohne Dienste öffentlich freizugeben
- **Docker** — isolierte Sandbox-Container, nur an localhost gebundene Bindings
- **Defence in depth** — 4-schichtige Sicherheitsarchitektur
- **Systemd-Integration** — automatischer Start beim Booten mit Härtung
- **Ein-Befehl-Einrichtung** — vollständige Bereitstellung in wenigen Minuten

## Schnellstart

Installation mit einem Befehl:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Was installiert wird

Das Ansible-Playbook installiert und konfiguriert:

1. **Tailscale** — Mesh-VPN für sicheren Fernzugriff
2. **UFW-Firewall** — nur SSH- + Tailscale-Ports
3. **Docker CE + Compose V2** — für das Standard-Sandbox-Backend des Agenten
4. **Node.js 24 + pnpm** — Laufzeitabhängigkeiten (Node 22 LTS, derzeit `22.14+`, bleibt unterstützt)
5. **OpenClaw** — hostbasiert, nicht containerisiert
6. **Systemd-Service** — automatischer Start mit Sicherheits-Härtung

<Note>
Das Gateway läuft direkt auf dem Host (nicht in Docker). Agent-Sandboxing ist
optional; dieses Playbook installiert Docker, weil es das Standard-Sandbox-Backend
ist. Siehe [Sandboxing](/de/gateway/sandboxing) für Details und andere Backends.
</Note>

## Einrichtung nach der Installation

<Steps>
  <Step title="Zum Benutzer openclaw wechseln">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Den Onboarding-Assistenten ausführen">
    Das Skript nach der Installation führt Sie durch die Konfiguration der OpenClaw-Einstellungen.
  </Step>
  <Step title="Messaging-Anbieter verbinden">
    Melden Sie sich bei WhatsApp, Telegram, Discord oder Signal an:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Die Installation überprüfen">
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
# Servicestatus prüfen
sudo systemctl status openclaw

# Live-Logs anzeigen
sudo journalctl -u openclaw -f

# Gateway neu starten
sudo systemctl restart openclaw

# Anbieter-Login (als Benutzer openclaw ausführen)
sudo -i -u openclaw
openclaw channels login
```

## Sicherheitsarchitektur

Die Bereitstellung verwendet ein 4-Schichten-Verteidigungsmodell:

1. **Firewall (UFW)** — nur SSH (22) + Tailscale (41641/udp) sind öffentlich erreichbar
2. **VPN (Tailscale)** — Gateway ist nur über das VPN-Mesh erreichbar
3. **Docker-Isolation** — die iptables-Kette DOCKER-USER verhindert die Freigabe externer Ports
4. **Systemd-Härtung** — NoNewPrivileges, PrivateTmp, unprivilegierter Benutzer

So überprüfen Sie Ihre externe Angriffsfläche:

```bash
nmap -p- YOUR_SERVER_IP
```

Nur Port 22 (SSH) sollte offen sein. Alle anderen Dienste (Gateway, Docker) sind gesperrt.

Docker wird für Agent-Sandboxes (isolierte Tool-Ausführung) installiert, nicht für den Betrieb des Gateways selbst. Siehe [Multi-Agent Sandbox and Tools](/de/tools/multi-agent-sandbox-tools) für die Sandbox-Konfiguration.

## Manuelle Installation

Wenn Sie die Automatisierung lieber manuell steuern möchten:

<Steps>
  <Step title="Voraussetzungen installieren">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Das Repository klonen">
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
  <Step title="Das Playbook ausführen">
    ```bash
    ./run-playbook.sh
    ```

    Alternativ direkt ausführen und danach das Setup-Skript manuell ausführen:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Dann ausführen: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Aktualisieren

Der Ansible-Installer richtet OpenClaw für manuelle Updates ein. Siehe [Updating](/de/install/updating) für den Standard-Aktualisierungsablauf.

Um das Ansible-Playbook erneut auszuführen (zum Beispiel für Konfigurationsänderungen):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Dies ist idempotent und kann sicher mehrfach ausgeführt werden.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Die Firewall blockiert meine Verbindung">
    - Stellen Sie sicher, dass Sie zuerst über Tailscale-VPN zugreifen können
    - SSH-Zugriff (Port 22) ist immer erlaubt
    - Das Gateway ist absichtlich nur über Tailscale erreichbar

  </Accordion>
  <Accordion title="Der Service startet nicht">
    ```bash
    # Logs prüfen
    sudo journalctl -u openclaw -n 100

    # Berechtigungen prüfen
    sudo ls -la /opt/openclaw

    # Manuellen Start testen
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Probleme mit der Docker-Sandbox">
    ```bash
    # Prüfen, ob Docker läuft
    sudo systemctl status docker

    # Sandbox-Image prüfen
    sudo docker images | grep openclaw-sandbox

    # Sandbox-Image bauen, falls es fehlt
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Anbieter-Login schlägt fehl">
    Stellen Sie sicher, dass Sie als Benutzer `openclaw` arbeiten:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

Für detaillierte Informationen zur Sicherheitsarchitektur und Fehlerbehebung siehe das Repository openclaw-ansible:

- [Sicherheitsarchitektur](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technische Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Anleitung zur Fehlerbehebung](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Verwandt

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — vollständige Bereitstellungsanleitung
- [Docker](/de/install/docker) — containerisierte Gateway-Einrichtung
- [Sandboxing](/de/gateway/sandboxing) — Konfiguration der Agent-Sandbox
- [Multi-Agent Sandbox and Tools](/de/tools/multi-agent-sandbox-tools) — Isolation pro Agent
