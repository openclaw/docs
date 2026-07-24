---
read_when:
    - Sie führen OpenClaw häufig mit Docker aus und möchten kürzere Befehle für den täglichen Gebrauch
    - Sie benötigen eine Hilfsschicht für Dashboard-, Protokoll-, Token-Einrichtungs- und Kopplungsabläufe
summary: ClawDock-Shell-Hilfsprogramme für Docker-basierte OpenClaw-Installationen
title: ClawDock
x-i18n:
    generated_at: "2026-07-24T04:27:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock ist eine schlanke Shell-Hilfsebene für Docker-basierte OpenClaw-Installationen.

Sie bietet kurze Befehle wie `clawdock-start`, `clawdock-dashboard` und `clawdock-fix-token` anstelle längerer `docker compose ...`-Aufrufe.

Wenn Sie Docker noch nicht eingerichtet haben, beginnen Sie mit [Docker](/de/install/docker).

## Installation

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock zuvor über `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, installieren Sie es erneut über den aktuellen Pfad `scripts/clawdock/clawdock-helpers.sh`; der alte GitHub-Rohdatenpfad wurde entfernt.

Die Hilfsfunktionen erkennen beim ersten Aufruf automatisch Ihr OpenClaw-Checkout (indem sie gängige Pfade wie `~/openclaw` und `~/projects/openclaw` prüfen) und speichern das Ergebnis in `~/.clawdock/config` zwischen. Legen Sie `CLAWDOCK_DIR` selbst fest, wenn sich Ihr Checkout an einem anderen Ort befindet.

## Enthaltene Funktionen

### Grundlegende Vorgänge

| Befehl             | Beschreibung                |
| ------------------ | --------------------------- |
| `clawdock-start` | Gateway starten             |
| `clawdock-stop` | Gateway stoppen             |
| `clawdock-restart` | Gateway neu starten         |
| `clawdock-status` | Containerstatus prüfen      |
| `clawdock-logs` | Gateway-Protokolle verfolgen |

### Containerzugriff

| Befehl                    | Beschreibung                                      |
| ------------------------- | ------------------------------------------------- |
| `clawdock-shell`        | Eine Shell im Gateway-Container öffnen            |
| `clawdock-cli <command>`        | OpenClaw-CLI-Befehle in Docker ausführen           |
| `clawdock-exec <command>`        | Einen beliebigen Befehl im Container ausführen    |

### Web-UI und Kopplung

| Befehl                    | Beschreibung                         |
| ------------------------- | ------------------------------------ |
| `clawdock-dashboard`        | URL der Control UI öffnen            |
| `clawdock-devices`        | Ausstehende Gerätekopplungen auflisten |
| `clawdock-approve <id>`        | Kopplungsanfrage genehmigen          |

### Einrichtung und Wartung

| Befehl                    | Beschreibung                                               |
| ------------------------- | ---------------------------------------------------------- |
| `clawdock-fix-token`        | Gateway-Token in die Containerkonfiguration schreiben      |
| `clawdock-update`        | Abrufen, neu erstellen und neu starten                     |
| `clawdock-rebuild`        | Nur das Docker-Image neu erstellen                         |
| `clawdock-clean`        | Container und Volumes entfernen                            |

### Dienstprogramme

| Befehl                    | Beschreibung                                      |
| ------------------------- | ------------------------------------------------- |
| `clawdock-health`        | Zustandsprüfung des Gateways ausführen            |
| `clawdock-token`        | Gateway-Token ausgeben                            |
| `clawdock-cd`        | Zum OpenClaw-Projektverzeichnis wechseln          |
| `clawdock-config`        | `~/.openclaw` öffnen                         |
| `clawdock-show-config`        | Konfigurationsdateien mit geschwärzten Werten ausgeben |
| `clawdock-workspace`        | Arbeitsbereichsverzeichnis öffnen                 |
| `clawdock-help`        | Alle ClawDock-Befehle auflisten                   |

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

ClawDock liest zwei separate `.env`-Dateien entsprechend der unter [Docker](/de/install/docker) beschriebenen Aufteilung:

- Die Projektdatei `.env` neben `docker-compose.yml`: Docker-spezifische Werte wie Image-Name, Ports und `OPENCLAW_GATEWAY_TOKEN`. `clawdock-token` liest das Token von hier.
- `~/.openclaw/.env` (in den Container eingebunden): umgebungsvariablenbasierte Secrets, die OpenClaw selbst verwaltet, zusammen mit `openclaw.json` und `agents/<agentId>/agent/auth-profiles.json`.

`clawdock-fix-token` kopiert das Token aus der Projektdatei `.env` in die Konfigurationswerte `gateway.remote.token` und `gateway.auth.token` des Containers und startet das Gateway neu.

Verwenden Sie `clawdock-show-config`, um `openclaw.json` und beide `.env`-Dateien schnell zu prüfen; in der ausgegebenen Darstellung werden `.env`-Werte geschwärzt.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Docker" href="/de/install/docker" icon="docker">
    Kanonische Docker-Installation für OpenClaw.
  </Card>
  <Card title="Docker-VM-Laufzeit" href="/de/install/docker-vm-runtime" icon="cube">
    Von Docker verwaltete VM-Laufzeit für verstärkte Isolation.
  </Card>
  <Card title="Aktualisierung" href="/de/install/updating" icon="arrow-up-right-from-square">
    Aktualisierung des OpenClaw-Pakets und der verwalteten Dienste.
  </Card>
</CardGroup>
