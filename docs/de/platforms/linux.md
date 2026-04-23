---
read_when:
    - Suche nach dem Status der Linux-Companion-App
    - Plattformabdeckung oder Beiträge planen
    - Linux-OOM-Kills oder Exit 137 auf einem VPS oder in einem Container debuggen
summary: Linux-Unterstützung + Status der Companion-App
title: Linux-App
x-i18n:
    generated_at: "2026-04-23T06:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# Linux-App

Das Gateway wird unter Linux vollständig unterstützt. **Node ist die empfohlene Laufzeit**.
Bun wird für das Gateway nicht empfohlen (WhatsApp-/Telegram-Bugs).

Native Linux-Companion-Apps sind geplant. Beiträge sind willkommen, wenn du beim Bau einer solchen App helfen möchtest.

## Schneller Einstieg für Anfänger (VPS)

1. Node 24 installieren (empfohlen; Node 22 LTS, derzeit `22.14+`, funktioniert aus Kompatibilitätsgründen weiterhin)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Von deinem Laptop aus: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` öffnen und mit dem konfigurierten gemeinsamen Secret authentifizieren (standardmäßig Token; Passwort, wenn du `gateway.auth.mode: "password"` gesetzt hast)

Vollständige Linux-Server-Anleitung: [Linux Server](/de/vps). Schritt-für-Schritt-VPS-Beispiel: [exe.dev](/de/install/exe-dev)

## Installation

- [Getting Started](/de/start/getting-started)
- [Install & updates](/de/install/updating)
- Optionale Abläufe: [Bun (experimentell)](/de/install/bun), [Nix](/de/install/nix), [Docker](/de/install/docker)

## Gateway

- [Gateway-Runbook](/de/gateway)
- [Konfiguration](/de/gateway/configuration)

## Gateway-Service-Installation (CLI)

Verwende eine der folgenden Optionen:

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

Wähle **Gateway service**, wenn du dazu aufgefordert wirst.

Reparieren/migrieren:

```
openclaw doctor
```

## Systemsteuerung (systemd-User-Unit)

OpenClaw installiert standardmäßig einen systemd-**User**-Service. Verwende einen **System**-Service für gemeinsam genutzte oder dauerhaft aktive Server. `openclaw gateway install` und
`openclaw onboard --install-daemon` rendern die aktuelle kanonische Unit bereits
für dich; schreibe nur dann selbst eine Unit-Datei, wenn du ein benutzerdefiniertes System-/Service-Manager-
Setup benötigst. Die vollständige Service-Anleitung findest du im [Gateway-Runbook](/de/gateway).

Minimale Einrichtung:

Erstelle `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

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

Aktivieren:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Speicherdruck und OOM-Kills

Unter Linux wählt der Kernel ein OOM-Opfer aus, wenn einem Host, einer VM oder einer Container-cgroup
der Speicher ausgeht. Das Gateway kann ein ungünstiges Opfer sein, da es langlebige
Sitzungen und Kanalverbindungen besitzt. OpenClaw gewichtet daher kurzlebige Kindprozesse nach Möglichkeit so,
dass sie vor dem Gateway beendet werden.

Für geeignete Linux-Kindprozesse startet OpenClaw den Kindprozess über einen kurzen
`/bin/sh`-Wrapper, der den eigenen `oom_score_adj` des Kindprozesses auf `1000` anhebt und dann
den eigentlichen Befehl per `exec` ausführt. Das ist ein nicht privilegierter Vorgang, weil der Kindprozess
nur seine eigene Wahrscheinlichkeit erhöht, durch OOM beendet zu werden.

Abgedeckte Oberflächen für Kindprozesse umfassen:

- supervisorverwaltete Befehls-Kindprozesse,
- PTY-Shell-Kindprozesse,
- MCP-stdio-Server-Kindprozesse,
- von OpenClaw gestartete Browser-/Chrome-Prozesse.

Der Wrapper ist nur für Linux und wird übersprungen, wenn `/bin/sh` nicht verfügbar ist. Er
wird auch übersprungen, wenn die Kindprozess-Env `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` oder `off` setzt.

Um einen Kindprozess zu prüfen:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Der erwartete Wert für abgedeckte Kindprozesse ist `1000`. Der Gateway-Prozess sollte
seinen normalen Wert behalten, normalerweise `0`.

Dies ersetzt keine normale Speicherabstimmung. Wenn ein VPS oder Container wiederholt
Kindprozesse beendet, erhöhe das Speicherlimit, reduziere die Nebenläufigkeit oder füge stärkere
Ressourcenkontrollen hinzu, etwa systemd `MemoryMax=` oder Speicherlimits auf Containerebene.
