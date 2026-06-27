---
read_when:
    - Suche nach dem Status der Linux-Begleit-App
    - Planung der Plattformabdeckung oder von Beiträgen
    - Debugging von Linux-OOM-Kills oder Exit 137 auf einem VPS oder in einem Container
summary: Status der Linux-Unterstützung + Begleit-App
title: Linux-App
x-i18n:
    generated_at: "2026-06-27T17:42:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Der Gateway wird unter Linux vollständig unterstützt. **Node ist die empfohlene Runtime**.
Bun wird für den Gateway nicht empfohlen (WhatsApp-/Telegram-Fehler).

Native Linux-Begleit-Apps sind geplant. Beiträge sind willkommen, wenn Sie beim Bau einer solchen App helfen möchten.

## Schnellstart für Einsteiger (VPS)

1. Installieren Sie Node 24 (empfohlen; Node 22 LTS, derzeit `22.19+`, funktioniert aus Kompatibilitätsgründen weiterhin)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Von Ihrem Laptop aus: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Öffnen Sie `http://127.0.0.1:18789/` und authentifizieren Sie sich mit dem konfigurierten gemeinsamen Secret (standardmäßig Token; Passwort, wenn Sie `gateway.auth.mode: "password"` gesetzt haben)

Vollständige Linux-Server-Anleitung: [Linux-Server](/de/vps). Schrittweises VPS-Beispiel: [exe.dev](/de/install/exe-dev)

## Installation

- [Erste Schritte](/de/start/getting-started)
- [Installation & Updates](/de/install/updating)
- Optionale Abläufe: [Bun (experimentell)](/de/install/bun), [Nix](/de/install/nix), [Docker](/de/install/docker)

## Gateway

- [Gateway-Runbook](/de/gateway)
- [Konfiguration](/de/gateway/configuration)

## Gateway-Dienst installieren (CLI)

Verwenden Sie eines hiervon:

```
openclaw onboard --install-daemon
```

Oder:

```
openclaw gateway install
```

Oder:

```
openclaw configure
```

Wählen Sie bei der Eingabeaufforderung **Gateway-Dienst** aus.

Reparieren/migrieren:

```
openclaw doctor
```

## Systemsteuerung (systemd-Benutzereinheit)

OpenClaw installiert standardmäßig einen systemd-**Benutzer**dienst. Verwenden Sie einen **System**dienst für gemeinsam genutzte oder dauerhaft laufende Server. `openclaw gateway install` und
`openclaw onboard --install-daemon` rendern bereits die aktuelle kanonische Einheit
für Sie; schreiben Sie nur dann eine von Hand, wenn Sie ein benutzerdefiniertes System-/Service-Manager-
Setup benötigen. Die vollständige Dienstanleitung finden Sie im [Gateway-Runbook](/de/gateway).

Minimales Setup:

Erstellen Sie `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Aktivieren Sie ihn:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Speicherdruck und OOM-Kills

Unter Linux wählt der Kernel ein OOM-Opfer aus, wenn einem Host, einer VM oder einer Container-cgroup
der Arbeitsspeicher ausgeht. Der Gateway kann ein schlechtes Opfer sein, weil er langlebige
Sitzungen und Kanalverbindungen besitzt. OpenClaw bevorzugt daher, wenn möglich, transiente Kindprozesse
vor dem Gateway zu beenden.

Für berechtigte Linux-Kindprozesse startet OpenClaw den Kindprozess über einen kurzen
`/bin/sh`-Wrapper, der das eigene `oom_score_adj` des Kindprozesses auf `1000` erhöht und dann
per `exec` den eigentlichen Befehl ausführt. Dies ist ein unprivilegierter Vorgang, weil der Kindprozess
nur seine eigene Wahrscheinlichkeit erhöht, durch OOM beendet zu werden.

Abgedeckte Kindprozess-Bereiche umfassen:

- vom Supervisor verwaltete Befehlskindprozesse,
- PTY-Shell-Kindprozesse,
- MCP-stdio-Server-Kindprozesse,
- von OpenClaw gestartete Browser-/Chrome-Prozesse.

Der Wrapper ist nur für Linux verfügbar und wird übersprungen, wenn `/bin/sh` nicht verfügbar ist. Er wird
außerdem übersprungen, wenn die Kindprozess-Umgebung `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` oder `off` setzt.

So überprüfen Sie einen Kindprozess:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Der erwartete Wert für abgedeckte Kindprozesse ist `1000`. Der Gateway-Prozess sollte
seinen normalen Wert behalten, üblicherweise `0`.

Die empfohlene systemd-Einheit setzt außerdem `OOMPolicy=continue`. Dadurch bleibt die
Gateway-Einheit aktiv, wenn ein transienter Kindprozess vom OOM-Killer ausgewählt wird;
der Kindbefehl oder die Sitzung kann fehlschlagen und den Fehler melden, ohne dass systemd
den gesamten Gateway-Dienst als fehlgeschlagen markiert und alle Kanäle neu startet.

Dies ersetzt keine normale Speicherabstimmung. Wenn ein VPS oder Container wiederholt
Kindprozesse beendet, erhöhen Sie das Speicherlimit, reduzieren Sie die Parallelität oder fügen Sie stärkere
Ressourcenkontrollen wie systemd `MemoryMax=` oder Speicherlimits auf Container-Ebene hinzu.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Linux-Server](/de/vps)
- [Raspberry Pi](/de/install/raspberry-pi)
