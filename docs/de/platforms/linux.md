---
read_when:
    - Status der Linux-Begleit-App gesucht
    - Planung der Plattformabdeckung oder von Beiträgen
    - Debugging von Linux-OOM-Beendigungen oder Exit-Code 137 auf einem VPS oder in einem Container
summary: Linux-Unterstützung und Status der Begleit-App
title: Linux-App
x-i18n:
    generated_at: "2026-07-12T15:38:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Der Gateway wird unter Linux vollständig unterstützt. Node ist die empfohlene Laufzeitumgebung; Bun
wird nicht empfohlen (bekannte Probleme mit WhatsApp/Telegram).

Eine native Linux-Begleit-App gibt es noch nicht. Beiträge sind willkommen.

## Schnellstart (VPS)

1. Installieren Sie Node 24 (empfohlen) oder Node 22.19+ (LTS, weiterhin unterstützt).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Auf Ihrem Laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Öffnen Sie `http://127.0.0.1:18789/` und authentifizieren Sie sich mit dem konfigurierten gemeinsamen
   Secret (standardmäßig Token; Passwort, wenn `gateway.auth.mode` auf `"password"` gesetzt ist).

Vollständige Server-Anleitung: [Linux-Server](/de/vps). Schritt-für-Schritt-Beispiel für einen VPS:
[exe.dev](/de/install/exe-dev).

## Installation

- [Erste Schritte](/de/start/getting-started)
- [Installation und Aktualisierungen](/de/install/updating)
- Optional: [Bun (experimentell)](/de/install/bun), [Nix](/de/install/nix), [Docker](/de/install/docker)

## Gateway-Dienst (systemd)

Installieren Sie ihn mit einem der folgenden Befehle:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # wählen Sie bei Aufforderung "Gateway service" aus
```

Eine vorhandene Installation reparieren oder migrieren:

```bash
openclaw doctor
```

`openclaw gateway install` erzeugt standardmäßig eine systemd-**Benutzer**-Unit. Vollständige
Hinweise zum Dienst, einschließlich der Variante als **System**-Unit für gemeinsam genutzte oder
dauerhaft aktive Hosts, finden Sie im [Gateway-Betriebshandbuch](/de/gateway#supervision-and-service-lifecycle).

Erstellen Sie eine Unit nur für eine benutzerdefinierte Einrichtung manuell. Minimales Beispiel für eine Benutzer-Unit
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (Profil: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Aktivieren Sie sie:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Speicherdruck und Beendigungen durch den OOM-Killer

Unter Linux wählt der Kernel einen OOM-Kandidaten aus, wenn einem Host, einer VM oder einer Container-cgroup
der Arbeitsspeicher ausgeht. Der Gateway ist dafür ungeeignet, da er langlebige
Sitzungen und Kanalverbindungen verwaltet. Daher sorgt OpenClaw nach Möglichkeit dafür, dass kurzlebige
Kindprozesse zuerst beendet werden.

Für geeignete unter Linux gestartete Kindprozesse umschließt OpenClaw den Befehl mit einem kurzen
`/bin/sh`-Shim, das den eigenen `oom_score_adj`-Wert des Kindprozesses auf `1000` erhöht und anschließend
den eigentlichen Befehl per `exec` ausführt. Dafür sind keine erweiterten Berechtigungen erforderlich: Ein Prozess darf
seinen eigenen OOM-Wert jederzeit erhöhen.

Abgedeckte Kindprozessbereiche:

- Vom Supervisor verwaltete Befehls-Kindprozesse
- PTY-Shell-Kindprozesse
- Kindprozesse von MCP-stdio-Servern
- Von OpenClaw gestartete Browser-/Chrome-Prozesse (über die Prozesslaufzeit des Plugin SDK)

Der Wrapper wird nur unter Linux verwendet und übersprungen, wenn `/bin/sh` nicht verfügbar ist oder wenn
die Umgebung des Kindprozesses `OPENCLAW_CHILD_OOM_SCORE_ADJ` auf `0`, `false`, `no` oder
`off` setzt.

Überprüfen Sie einen Kindprozess:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Der erwartete Wert für abgedeckte Kindprozesse ist `1000`; der Gateway-Prozess selbst
behält seinen normalen Wert (üblicherweise `0`).

`OOMPolicy=continue` in der systemd-Unit hält den Gateway-Dienst aktiv, wenn
der OOM-Killer einen kurzlebigen Kindprozess auswählt, anstatt die gesamte
Unit als fehlgeschlagen zu markieren und alle Kanäle neu zu starten. Der fehlgeschlagene Kindprozess beziehungsweise die fehlgeschlagene Sitzung meldet
den eigenen Fehler.

Dies ersetzt keine normale Speicheroptimierung. Wenn ein VPS oder Container wiederholt
Kindprozesse beendet, erhöhen Sie das Speicherlimit, reduzieren Sie die Parallelität oder fügen Sie strengere
Ressourcenbeschränkungen hinzu (systemd `MemoryMax=`, Container-Speicherlimits).

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Linux-Server](/de/vps)
- [Raspberry Pi](/de/install/raspberry-pi)
- [Gateway-Betriebshandbuch](/de/gateway)
- [Gateway-Konfiguration](/de/gateway/configuration)
