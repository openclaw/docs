---
read_when:
    - Sie führen OpenClaw häufig mit Docker aus und möchten kürzere Befehle für den Alltag
    - Sie benötigen eine Hilfsschicht für Dashboard, Protokolle, Token-Einrichtung und Kopplungsabläufe
summary: ClawDock-Shell-Hilfsprogramme für Docker-basierte OpenClaw-Installationen
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T06:52:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ClawDock ist eine kleine Shell-Helferebene für Docker-basierte OpenClaw-Installationen.

Sie stellt Ihnen kurze Befehle wie `clawdock-start`, `clawdock-dashboard` und `clawdock-fix-token` bereit, statt längerer `docker compose ...`-Aufrufe.

Wenn Sie Docker noch nicht eingerichtet haben, beginnen Sie mit [Docker](/de/install/docker).

## Installation

Verwenden Sie den kanonischen Helferpfad:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock zuvor aus `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, installieren Sie es erneut aus dem neuen Pfad `scripts/clawdock/clawdock-helpers.sh`. Der alte Raw-GitHub-Pfad wurde entfernt.

## Was Sie erhalten

### Grundlegende Vorgänge

| Befehl             | Beschreibung                 |
| ------------------ | ---------------------------- |
| `clawdock-start`   | Gateway starten              |
| `clawdock-stop`    | Gateway stoppen              |
| `clawdock-restart` | Gateway neu starten          |
| `clawdock-status`  | Containerstatus prüfen       |
| `clawdock-logs`    | Gateway-Protokollen folgen   |

### Containerzugriff

| Befehl                    | Beschreibung                                      |
| ------------------------- | ------------------------------------------------- |
| `clawdock-shell`          | Eine Shell im Gateway-Container öffnen            |
| `clawdock-cli <command>`  | OpenClaw-CLI-Befehle in Docker ausführen          |
| `clawdock-exec <command>` | Einen beliebigen Befehl im Container ausführen    |

### Web-UI und Kopplung

| Befehl                  | Beschreibung                        |
| ----------------------- | ----------------------------------- |
| `clawdock-dashboard`    | Control-UI-URL öffnen               |
| `clawdock-devices`      | Ausstehende Gerätekopplungen auflisten |
| `clawdock-approve <id>` | Eine Kopplungsanfrage genehmigen    |

### Einrichtung und Wartung

| Befehl               | Beschreibung                                      |
| -------------------- | ------------------------------------------------- |
| `clawdock-fix-token` | Gateway-Token im Container konfigurieren          |
| `clawdock-update`    | Abrufen, neu bauen und neu starten                |
| `clawdock-rebuild`   | Nur das Docker-Image neu bauen                    |
| `clawdock-clean`     | Container und Volumes entfernen                   |

### Dienstprogramme

| Befehl                 | Beschreibung                                      |
| ---------------------- | ------------------------------------------------- |
| `clawdock-health`      | Gateway-Integritätsprüfung ausführen              |
| `clawdock-token`       | Gateway-Token ausgeben                            |
| `clawdock-cd`          | In das OpenClaw-Projektverzeichnis springen       |
| `clawdock-config`      | `~/.openclaw` öffnen                              |
| `clawdock-show-config` | Konfigurationsdateien mit redigierten Werten ausgeben |
| `clawdock-workspace`   | Arbeitsbereichsverzeichnis öffnen                 |

## Ablauf bei der ersten Verwendung

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Wenn der Browser meldet, dass eine Kopplung erforderlich ist:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Konfiguration und Secrets

ClawDock arbeitet mit derselben Docker-Konfigurationsaufteilung, die in [Docker](/de/install/docker) beschrieben ist:

- `<project>/.env` für Docker-spezifische Werte wie Image-Name, Ports und das Gateway-Token
- `~/.openclaw/.env` für env-gestützte Provider-Schlüssel und Bot-Tokens
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` für gespeicherte Provider-OAuth/API-Key-Authentifizierung
- `~/.openclaw/openclaw.json` für Verhaltenskonfiguration

Verwenden Sie `clawdock-show-config`, wenn Sie die `.env`-Dateien und `openclaw.json` schnell prüfen möchten. Der Befehl redigiert `.env`-Werte in der ausgegebenen Darstellung.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Docker" href="/de/install/docker" icon="docker">
    Kanonische Docker-Installation für OpenClaw.
  </Card>
  <Card title="Docker-VM-Runtime" href="/de/install/docker-vm-runtime" icon="cube">
    Docker-verwaltete VM-Runtime für gehärtete Isolation.
  </Card>
  <Card title="Aktualisierung" href="/de/install/updating" icon="arrow-up-right-from-square">
    Aktualisierung des OpenClaw-Pakets und der verwalteten Dienste.
  </Card>
</CardGroup>
