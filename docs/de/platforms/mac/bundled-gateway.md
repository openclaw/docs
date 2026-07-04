---
read_when:
    - Paketieren von OpenClaw.app
    - Debugging des macOS-Gateway-launchd-Dienstes
    - OpenClaw Gateway CLI für macOS installieren
summary: Gateway-Laufzeit unter macOS (externer launchd-Dienst)
title: Gateway unter macOS
x-i18n:
    generated_at: "2026-07-04T06:28:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bündelt Node/Bun oder die Gateway-Laufzeit nicht mehr. Die macOS-App
erwartet eine **externe** `openclaw`-CLI-Installation, startet das Gateway nicht als
Kindprozess und verwaltet einen launchd-Dienst pro Benutzer, um das Gateway
auszuführen (oder verbindet sich mit einem bestehenden lokalen Gateway, falls bereits eines läuft).

## Automatische Einrichtung

Wählen Sie auf einem neuen Mac während des Onboardings **Dieser Mac** aus. Die App führt ihr signiertes,
gebündeltes Installationsprogramm vor dem Gateway-Assistenten aus, installiert eine Node-Laufzeit im Benutzerbereich
und die passende `openclaw`-CLI unter `~/.openclaw` und installiert und startet anschließend den
launchd-Dienst pro Benutzer. Dieser Weg erfordert kein Terminal, kein Homebrew und keinen
Administratorzugriff.

Die App bündelt das Installationsskript, nicht die Node- oder Gateway-Nutzlast. Die Einrichtung
benötigt daher eine Internetverbindung, um die Laufzeit und das passende
OpenClaw-Paket herunterzuladen.

## Manuelle Wiederherstellung

Node 24 wird für eine manuelle Installation empfohlen. Node 22 LTS, derzeit `22.19+`,
funktioniert ebenfalls. Installieren Sie dann `openclaw` global:

```bash
npm install -g openclaw@<version>
```

Verwenden Sie nach einer fehlgeschlagenen automatischen Einrichtung **Einrichtung erneut versuchen**. Falls dies weiterhin fehlschlägt, installieren Sie
die CLI manuell mit dem obigen Befehl und wählen Sie dann im Onboarding **Erneut prüfen**.
Node bleibt die empfohlene Gateway-Laufzeit.

## Launchd (Gateway als LaunchAgent)

Label:

- `ai.openclaw.gateway` (oder `ai.openclaw.<profile>`; veraltetes `com.openclaw.*` kann bestehen bleiben)

Plist-Speicherort (pro Benutzer):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (oder `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Manager:

- Die macOS-App ist im lokalen Modus für Installation/Aktualisierung des LaunchAgent verantwortlich.
- Die CLI kann ihn ebenfalls installieren: `openclaw gateway install`.

Verhalten:

- "OpenClaw Aktiv" aktiviert/deaktiviert den LaunchAgent.
- Das Beenden der App stoppt das Gateway **nicht** (launchd hält es am Leben).
- Wenn bereits ein Gateway auf dem konfigurierten Port läuft, verbindet sich die App
  damit, statt ein neues zu starten.

Protokollierung:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (Profile verwenden `gateway-<profile>.log`)
- launchd stderr: unterdrückt

## Versionskompatibilität

Die macOS-App prüft die Gateway-Version gegen ihre eigene Version. Das Onboarding
führt die verwaltete Einrichtung automatisch aus, wenn eine vorhandene CLI fehlt oder
inkompatibel ist. Verwenden Sie **Einrichtung erneut versuchen**, um die Installation zu wiederholen, oder **Erneut prüfen**
nachdem Sie eine externe CLI repariert haben.

## Zustandsverzeichnis unter macOS

Speichern Sie den OpenClaw-Zustand auf einem lokalen, nicht synchronisierten Datenträger. Vermeiden Sie iCloud Drive und andere
cloud-synchronisierte Ordner, da Synchronisierungslatenz und Dateisperren Sitzungen,
Anmeldeinformationen und Gateway-Zustand beeinflussen können.

Setzen Sie `OPENCLAW_STATE_DIR` nur dann auf einen lokalen Pfad, wenn Sie eine Überschreibung benötigen.
`openclaw doctor` warnt vor gängigen cloud-synchronisierten Zustandspfaden und empfiehlt,
zurück auf lokalen Speicher zu wechseln. Siehe
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
