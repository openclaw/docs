---
read_when:
    - OpenClaw.app verpacken
    - Debugging des macOS-Gateway-launchd-Dienstes
    - Installieren der Gateway-CLI für macOS
summary: Gateway-Laufzeit unter macOS (externer launchd-Dienst)
title: Gateway unter macOS
x-i18n:
    generated_at: "2026-06-27T17:42:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bündelt Node/Bun oder die Gateway-Laufzeitumgebung nicht mehr. Die macOS-App
erwartet eine **externe** Installation der `openclaw`-CLI, startet den Gateway nicht als
Kindprozess und verwaltet einen benutzerbezogenen launchd-Dienst, um den Gateway
ausgeführt zu halten (oder verbindet sich mit einem bestehenden lokalen Gateway, falls bereits einer läuft).

## CLI installieren (für den lokalen Modus erforderlich)

Node 24 ist die Standard-Laufzeitumgebung auf dem Mac. Node 22 LTS, derzeit `22.19+`, funktioniert aus Kompatibilitätsgründen weiterhin. Installieren Sie dann `openclaw` global:

```bash
npm install -g openclaw@<version>
```

Die Schaltfläche **CLI installieren** der macOS-App führt denselben globalen Installationsablauf aus, den die App
intern verwendet: Sie bevorzugt zuerst npm, dann pnpm, dann bun, falls dies der einzige
erkannte Paketmanager ist. Node bleibt die empfohlene Gateway-Laufzeitumgebung.

## Launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (oder `ai.openclaw.<profile>`; Legacy-`com.openclaw.*` kann verbleiben)

Plist-Speicherort (benutzerbezogen):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (oder `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Manager:

- Die macOS-App ist im lokalen Modus für Installation/Aktualisierung des LaunchAgent verantwortlich.
- Die CLI kann ihn ebenfalls installieren: `openclaw gateway install`.

Verhalten:

- "OpenClaw Active" aktiviert/deaktiviert den LaunchAgent.
- Das Beenden der App stoppt den Gateway **nicht** (launchd hält ihn aktiv).
- Wenn auf dem konfigurierten Port bereits ein Gateway läuft, verbindet sich die App
  damit, anstatt einen neuen zu starten.

Protokollierung:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (Profile verwenden `gateway-<profile>.log`)
- launchd stderr: unterdrückt

## Versionskompatibilität

Die macOS-App prüft die Gateway-Version gegen ihre eigene Version. Wenn sie
inkompatibel sind, aktualisieren Sie die globale CLI passend zur App-Version.

## Smoke Check

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Dann:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Gateway-Runbook](/de/gateway)
