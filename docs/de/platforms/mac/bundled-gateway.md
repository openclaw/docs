---
read_when:
    - OpenClaw.app verpacken
    - Debugging des macOS-Gateway-launchd-Dienstes
    - Installieren der Gateway-CLI für macOS
summary: Gateway-Laufzeit unter macOS (externer launchd-Dienst)
title: Gateway unter macOS
x-i18n:
    generated_at: "2026-06-28T00:12:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bündelt Node/Bun oder die Gateway-Laufzeitumgebung nicht mehr. Die macOS-App
erwartet eine **externe** `openclaw`-CLI-Installation, startet das Gateway nicht als
Kindprozess und verwaltet einen benutzerspezifischen launchd-Dienst, um das Gateway
laufend zu halten (oder verbindet sich mit einem vorhandenen lokalen Gateway, falls bereits eines läuft).

## CLI installieren (für lokalen Modus erforderlich)

Node 24 ist die Standard-Laufzeitumgebung auf dem Mac. Node 22 LTS, derzeit `22.19+`, funktioniert aus Kompatibilitätsgründen weiterhin. Installieren Sie anschließend `openclaw` global:

```bash
npm install -g openclaw@<version>
```

Die Schaltfläche **CLI installieren** der macOS-App führt denselben globalen Installationsablauf aus, den die App
intern verwendet: Sie bevorzugt zuerst npm, dann pnpm und dann bun, falls dies der einzige
erkannte Paketmanager ist. Node bleibt die empfohlene Gateway-Laufzeitumgebung.

## Launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (oder `ai.openclaw.<profile>`; veraltetes `com.openclaw.*` kann verbleiben)

Plist-Speicherort (benutzerspezifisch):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (oder `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Manager:

- Die macOS-App besitzt die Installation/Aktualisierung des LaunchAgent im lokalen Modus.
- Die CLI kann ihn ebenfalls installieren: `openclaw gateway install`.

Verhalten:

- "OpenClaw Active" aktiviert/deaktiviert den LaunchAgent.
- Das Beenden der App stoppt das Gateway **nicht** (launchd hält es am Leben).
- Wenn auf dem konfigurierten Port bereits ein Gateway läuft, verbindet sich die App
  damit, anstatt ein neues zu starten.

Protokollierung:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (Profile verwenden `gateway-<profile>.log`)
- launchd stderr: unterdrückt

## Versionskompatibilität

Die macOS-App prüft die Gateway-Version gegen ihre eigene Version. Wenn sie
inkompatibel sind, aktualisieren Sie die globale CLI passend zur App-Version.

## Zustandsverzeichnis unter macOS

Bewahren Sie den OpenClaw-Zustand auf einem lokalen, nicht synchronisierten Datenträger auf. Vermeiden Sie iCloud Drive und andere
cloud-synchronisierte Ordner, da Synchronisierungslatenz und Dateisperren Sitzungen,
Anmeldeinformationen und den Gateway-Zustand beeinträchtigen können.

Setzen Sie `OPENCLAW_STATE_DIR` nur dann auf einen lokalen Pfad, wenn Sie eine Überschreibung benötigen.
`openclaw doctor` warnt vor gängigen cloud-synchronisierten Zustandspfaden und empfiehlt,
zur lokalen Speicherung zurückzukehren. Siehe
[Umgebungsvariablen](/de/help/environment#path-related-env-vars) und
[Doctor](/de/gateway/doctor).

## App-Konnektivität debuggen

Verwenden Sie die macOS-Debug-CLI aus einem Source-Checkout, um denselben Gateway-
WebSocket-Handshake und dieselbe Discovery-Logik auszuführen, die die App verwendet:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` akzeptiert `--url`, `--token`, `--timeout` und `--json`. `discover`
akzeptiert `--timeout`, `--json` und `--include-local`. Vergleichen Sie die Discovery-Ausgabe
mit `openclaw gateway discover --json`, wenn Sie CLI-Discovery
von appseitigen Verbindungsproblemen trennen müssen.

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

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Gateway-Runbook](/de/gateway)
