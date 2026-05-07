---
read_when:
    - Status der Linux-Begleit-App wird gesucht
    - Plattformabdeckung oder Beiträge planen
    - Fehlerbehebung bei Linux-OOM-Kills oder Exit 137 auf einem VPS oder in einem Container
summary: Linux-Unterstützung + Status der Begleit-App
title: Linux-App
x-i18n:
    generated_at: "2026-05-07T13:21:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

The Gateway wird unter Linux vollständig unterstützt. **Node ist die empfohlene Runtime**.
Bun wird für den Gateway nicht empfohlen (WhatsApp-/Telegram-Fehler).

Native Linux-Begleit-Apps sind geplant. Beiträge sind willkommen, wenn Sie beim Aufbau einer solchen App helfen möchten.

## Schnellstart für Einsteiger (VPS)

1. Installieren Sie Node 24 (empfohlen; Node 22 LTS, derzeit `22.16+`, funktioniert aus Kompatibilitätsgründen weiterhin)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Von Ihrem Laptop aus: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Öffnen Sie `http://127.0.0.1:18789/` und authentifizieren Sie sich mit dem konfigurierten gemeinsamen Secret (standardmäßig Token; Passwort, wenn Sie `gateway.auth.mode: "password"` festlegen)

Vollständige Linux-Server-Anleitung: [Linux-Server](/de/vps). Schritt-für-Schritt-VPS-Beispiel: [exe.dev](/de/install/exe-dev)

## Installation

- [Erste Schritte](/de/start/getting-started)
- [Installation & Updates](/de/install/updating)
- Optionale Abläufe: [Bun (experimentell)](/de/install/bun), [Nix](/de/install/nix), [Docker](/de/install/docker)

## Gateway

- [Gateway-Runbook](/de/gateway)
- [Konfiguration](/de/gateway/configuration)

## Gateway-Dienstinstallation (CLI)

Verwenden Sie eine dieser Optionen:

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

Wählen Sie bei der Aufforderung **Gateway-Dienst** aus.

Reparieren/migrieren:

```
openclaw doctor
```

## Systemsteuerung (systemd-Benutzereinheit)

OpenClaw installiert standardmäßig einen systemd-Dienst für den **Benutzer**. Verwenden Sie einen **System**-Dienst für gemeinsam genutzte oder dauerhaft laufende Server. `openclaw gateway install` und
`openclaw onboard --install-daemon` erzeugen bereits die aktuelle kanonische Einheit
für Sie; schreiben Sie eine nur dann manuell, wenn Sie eine benutzerdefinierte System-/Dienstmanager-
Einrichtung benötigen. Die vollständige Dienstanleitung finden Sie im [Gateway-Runbook](/de/gateway).

Minimale Einrichtung:

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
KillMode=control-group

[Install]
WantedBy=default.target
```

Aktivieren Sie sie:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Speicherdruck und OOM-Kills

Unter Linux wählt der Kernel ein OOM-Opfer aus, wenn einer Host-, VM- oder Container-cgroup
der Speicher ausgeht. Der Gateway kann ein ungünstiges Opfer sein, weil er langlebige
Sitzungen und Channel-Verbindungen besitzt. OpenClaw gewichtet daher nach Möglichkeit transiente
Kindprozesse so, dass sie vor dem Gateway beendet werden.

Für geeignete Linux-Kindprozesse startet OpenClaw den Kindprozess über einen kurzen
`/bin/sh`-Wrapper, der den eigenen `oom_score_adj` des Kindprozesses auf `1000` erhöht und dann
den eigentlichen Befehl per `exec` startet. Dies ist ein unprivilegierter Vorgang, weil der Kindprozess
nur seine eigene Wahrscheinlichkeit erhöht, durch den OOM-Killer beendet zu werden.

Abgedeckte Kindprozessoberflächen umfassen:

- vom Supervisor verwaltete Befehlskindprozesse,
- PTY-Shell-Kindprozesse,
- MCP-stdio-Server-Kindprozesse,
- von OpenClaw gestartete Browser-/Chrome-Prozesse.

Der Wrapper ist nur für Linux verfügbar und wird übersprungen, wenn `/bin/sh` nicht verfügbar ist. Er wird
auch übersprungen, wenn die Kindprozess-Umgebung `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` oder `off` setzt.

So überprüfen Sie einen Kindprozess:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Der erwartete Wert für abgedeckte Kindprozesse ist `1000`. Der Gateway-Prozess sollte
seinen normalen Wert behalten, üblicherweise `0`.

Dies ersetzt keine normale Speicheroptimierung. Wenn ein VPS oder Container wiederholt
Kindprozesse beendet, erhöhen Sie das Speicherlimit, reduzieren Sie die Parallelität oder fügen Sie stärkere
Ressourcenkontrollen wie systemd `MemoryMax=` oder Speicherlimits auf Container-Ebene hinzu.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Linux-Server](/de/vps)
- [Raspberry Pi](/de/install/raspberry-pi)
