---
read_when:
    - OpenClaw.app paketieren
    - Fehlerbehebung beim macOS-Gateway-launchd-Dienst
    - Installation der Gateway-CLI für macOS
summary: Gateway-Laufzeit unter macOS (externer launchd-Dienst)
title: Gateway unter macOS
x-i18n:
    generated_at: "2026-07-16T13:13:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app bündelt weder Node noch die Gateway-Laufzeit. Die macOS-App
erwartet eine **externe** Installation der `openclaw`-CLI, startet das Gateway nicht als
untergeordneten Prozess und verwaltet einen benutzerspezifischen launchd-Dienst, um das Gateway
auszuführen (oder verbindet sich mit einem bereits lokal ausgeführten Gateway).

## Automatische Einrichtung

Wählen Sie auf einem neuen Mac während des Onboardings **This Mac**. Die App führt ihr
signiertes, gebündeltes Installationsskript vor dem Gateway-Assistenten aus: Es installiert eine
Node-Laufzeit im Benutzerbereich und die passende `openclaw`-CLI unter `~/.openclaw`,
installiert und startet anschließend den benutzerspezifischen launchd-Dienst. Dieser Weg erfordert weder
Terminal noch Homebrew oder Administratorzugriff.

Die App bündelt nur das Installationsskript, nicht die Node- oder Gateway-Nutzlast;
die Einrichtung benötigt eine Internetverbindung, um die Laufzeit und das passende
OpenClaw-Paket herunterzuladen.

## Manuelle Wiederherstellung

Node 24.15+ wird für eine manuelle Installation empfohlen; Node 22.22.3+ funktioniert ebenfalls. Installieren Sie
`openclaw` global:

```bash
npm install -g openclaw@<version>
```

Verwenden Sie nach einer fehlgeschlagenen automatischen Einrichtung **Retry setup**. Falls dies weiterhin fehlschlägt,
installieren Sie die CLI manuell mit dem obigen Befehl und wählen Sie anschließend beim Onboarding **Check again**.

## Launchd (Gateway als LaunchAgent)

Bezeichnung: `ai.openclaw.gateway` (Standardprofil) oder `ai.openclaw.<profile>`
für ein benanntes Profil.

Plist-Speicherort (benutzerspezifisch): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(oder `ai.openclaw.<profile>.plist`).

Die macOS-App übernimmt im lokalen Modus die Installation und Aktualisierung des LaunchAgent für das Standardprofil.
Die CLI kann ihn auch direkt installieren: `openclaw gateway install`
(benannte Profile werden über die Umgebungsvariable `OPENCLAW_PROFILE` ausgewählt).

Verhalten:

- „OpenClaw Active“ aktiviert/deaktiviert den LaunchAgent.
- Das Beenden der App stoppt das Gateway **nicht** (launchd hält es aktiv).
- Wenn auf dem konfigurierten Port bereits ein Gateway ausgeführt wird, verbindet sich die App
  damit, anstatt ein neues zu starten.

Protokollierung:

- launchd-Standardausgabe: `~/Library/Logs/openclaw/gateway.log` (Profile verwenden
  `gateway-<profile>.log`)
- launchd-Standardfehlerausgabe: unterdrückt
- Wenn der Host mit wiederholtem `EADDRINUSE` oder schnellen Neustarts in einer Schleife läuft, prüfen Sie auf
  doppelte `ai.openclaw.gateway`-/`ai.openclaw.node`-LaunchAgents und den
  Workaround für die launchd-Markierung unter
  [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Versionskompatibilität

Die macOS-App prüft die Gateway-Version anhand ihrer eigenen Version. Das Onboarding
führt automatisch die verwaltete Einrichtung aus, wenn eine vorhandene CLI fehlt oder
inkompatibel ist. Verwenden Sie **Retry setup**, um die Installation zu wiederholen, oder **Check again**,
nachdem Sie eine externe CLI repariert haben.

## Zustandsverzeichnis unter macOS

Speichern Sie den OpenClaw-Zustand auf einem lokalen, nicht synchronisierten Datenträger. Vermeiden Sie iCloud Drive und andere
cloudsynchronisierte Ordner; Synchronisierungslatenzen und Dateisperren können Sitzungen,
Anmeldedaten und den Gateway-Zustand beeinträchtigen.

Legen Sie `OPENCLAW_STATE_DIR` nur dann auf einen lokalen Pfad fest, wenn Sie eine Überschreibung benötigen.
`openclaw doctor` warnt vor gängigen cloudsynchronisierten Zustandspfaden und empfiehlt
die Rückkehr zu lokalem Speicher. Siehe
[Umgebungsvariablen](/de/help/environment#path-related-env-vars) und
[Doctor](/de/gateway/doctor).

## App-Verbindung debuggen

Verwenden Sie die macOS-Debug-CLI aus einem Quellcode-Checkout, um denselben Gateway-
WebSocket-Handshake und dieselbe Erkennungslogik auszuführen, die von der App verwendet werden:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` akzeptiert `--url`, `--token`, `--timeout`, `--probe` und `--json`
(sowie Überschreibungen der Clientidentität; führen Sie den Befehl mit `--help` aus, um die vollständige Liste anzuzeigen).
`discover` akzeptiert `--timeout`, `--json` und `--include-local`. Vergleichen Sie
die Erkennungsausgabe mit `openclaw gateway discover --json`, wenn Sie Probleme bei der CLI-Erkennung
von appseitigen Verbindungsproblemen unterscheiden müssen.

## Schnelltest

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Anschließend:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Gateway-Betriebshandbuch](/de/gateway)
