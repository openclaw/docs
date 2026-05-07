---
read_when:
    - Paketieren von OpenClaw.app
    - Debuggen des launchd-Dienstes für das macOS-Gateway
    - Gateway-CLI für macOS installieren
summary: Gateway-Laufzeit unter macOS (externer launchd-Dienst)
title: Gateway unter macOS
x-i18n:
    generated_at: "2026-05-07T13:21:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf129918c46f8f54026e9db04e8ad5a033148899d3029fe1a362bb14c7f25f8
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bündelt Node/Bun oder die Gateway-Laufzeit nicht mehr. Die macOS-App
erwartet eine **externe** Installation der `openclaw`-CLI, startet das Gateway nicht als
Kindprozess und verwaltet einen benutzerspezifischen launchd-Dienst, damit das Gateway
läuft (oder verbindet sich mit einem vorhandenen lokalen Gateway, falls bereits eines läuft).

## CLI installieren (für lokalen Modus erforderlich)

Node 24 ist die Standardlaufzeit auf dem Mac. Node 22 LTS, derzeit `22.16+`, funktioniert aus Kompatibilitätsgründen weiterhin. Installieren Sie dann `openclaw` global:

```bash
npm install -g openclaw@<version>
```

Die Schaltfläche **CLI installieren** der macOS-App führt denselben globalen Installationsablauf aus, den die App
intern verwendet: Sie bevorzugt zuerst npm, dann pnpm und dann bun, falls dies der einzige
erkannte Paketmanager ist. Node bleibt die empfohlene Gateway-Laufzeit.

## Launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (oder `ai.openclaw.<profile>`; veraltetes `com.openclaw.*` kann bestehen bleiben)

Plist-Speicherort (benutzerspezifisch):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (oder `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Manager:

- Die macOS-App ist im lokalen Modus für Installation/Aktualisierung des LaunchAgent verantwortlich.
- Die CLI kann ihn ebenfalls installieren: `openclaw gateway install`.

Verhalten:

- „OpenClaw Active“ aktiviert/deaktiviert den LaunchAgent.
- Das Beenden der App stoppt das Gateway **nicht** (launchd hält es am Leben).
- Wenn auf dem konfigurierten Port bereits ein Gateway läuft, verbindet sich die App damit,
  statt ein neues zu starten.

Protokollierung:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Versionskompatibilität

Die macOS-App prüft die Gateway-Version gegen ihre eigene Version. Wenn sie
inkompatibel sind, aktualisieren Sie die globale CLI auf die Version der App.

## Smoke-Check

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
