---
read_when:
    - OpenClaw.app paketieren
    - Fehlerbehebung beim macOS-Gateway-launchd-Dienst
    - Installation der Gateway-CLI für macOS
summary: Gateway-Laufzeit unter macOS (externer launchd-Dienst)
title: Gateway unter macOS
x-i18n:
    generated_at: "2026-05-06T06:55:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bündelt Node/Bun oder die Gateway-Laufzeit nicht mehr. Die macOS-App
erwartet eine **externe** Installation der `openclaw`-CLI, startet den Gateway nicht als
Kindprozess und verwaltet einen launchd-Dienst pro Benutzer, um den Gateway
ausgeführt zu halten (oder verbindet sich mit einem vorhandenen lokalen Gateway, falls bereits einer läuft).

## CLI installieren (für lokalen Modus erforderlich)

Node 24 ist die Standardlaufzeitumgebung auf dem Mac. Node 22 LTS, derzeit `22.14+`, funktioniert aus Kompatibilitätsgründen weiterhin. Installieren Sie dann `openclaw` global:

```bash
npm install -g openclaw@<version>
```

Die Schaltfläche **CLI installieren** der macOS-App führt denselben globalen Installationsablauf aus, den die App
intern verwendet: Sie bevorzugt zuerst npm, dann pnpm und dann bun, falls dies der einzige
erkannte Paketmanager ist. Node bleibt die empfohlene Gateway-Laufzeitumgebung.

## Launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (oder `ai.openclaw.<profile>`; veraltete `com.openclaw.*` können bestehen bleiben)

Plist-Speicherort (pro Benutzer):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (oder `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Manager:

- Die macOS-App verwaltet Installation/Aktualisierung des LaunchAgent im lokalen Modus.
- Die CLI kann ihn ebenfalls installieren: `openclaw gateway install`.

Verhalten:

- „OpenClaw Active“ aktiviert/deaktiviert den LaunchAgent.
- Das Beenden der App stoppt den Gateway **nicht** (launchd hält ihn am Leben).
- Wenn bereits ein Gateway auf dem konfigurierten Port läuft, verbindet sich die App
  mit ihm, anstatt einen neuen zu starten.

Protokollierung:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Versionskompatibilität

Die macOS-App prüft die Gateway-Version gegen ihre eigene Version. Wenn sie
inkompatibel sind, aktualisieren Sie die globale CLI passend zur App-Version.

## Smoke-Prüfung

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
