---
read_when:
    - OpenClaw.app paketieren
    - Debugging des macOS-Gateway-launchd-Dienstes
    - Installieren der Gateway-CLI für macOS
summary: Gateway-Laufzeit unter macOS (externer launchd-Dienst)
title: Gateway unter macOS
x-i18n:
    generated_at: "2026-07-12T15:37:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e6a871678fcbc617cb87dc4f0610419187a0b67cea7105e02a6cde70d44e85f3
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app enthält weder Node/Bun noch die Gateway-Laufzeit. Die macOS-App
erwartet eine **externe** Installation der `openclaw`-CLI, startet das Gateway
nicht als untergeordneten Prozess und verwaltet einen benutzerspezifischen
launchd-Dienst, der das Gateway am Laufen hält (oder stellt eine Verbindung
zu einem bereits laufenden lokalen Gateway her).

## Automatische Einrichtung

Wählen Sie auf einem neuen Mac während des Onboardings **This Mac** aus. Die App
führt vor dem Gateway-Assistenten ihr signiertes, mitgeliefertes
Installationsskript aus: Es installiert eine Node-Laufzeit im Benutzerbereich
und die passende `openclaw`-CLI unter `~/.openclaw` und installiert und startet
anschließend den benutzerspezifischen launchd-Dienst. Für diesen Weg sind weder
Terminal noch Homebrew oder Administratorzugriff erforderlich.

Die App enthält nur das Installationsskript, nicht die Node- oder
Gateway-Nutzlast; für die Einrichtung ist eine Internetverbindung erforderlich,
um die Laufzeit und das passende OpenClaw-Paket herunterzuladen.

## Manuelle Wiederherstellung

Node 24 wird für eine manuelle Installation empfohlen; Node 22.19+ funktioniert
ebenfalls. Installieren Sie `openclaw` global:

```bash
npm install -g openclaw@<version>
```

Verwenden Sie nach einer fehlgeschlagenen automatischen Einrichtung
**Retry setup**. Falls dies weiterhin fehlschlägt, installieren Sie die CLI
manuell mit dem obigen Befehl und wählen Sie anschließend beim Onboarding
**Check again** aus.

## Launchd (Gateway als LaunchAgent)

Bezeichnung: `ai.openclaw.gateway` (Standardprofil) oder
`ai.openclaw.<profile>` für ein benanntes Profil.

Plist-Speicherort (benutzerspezifisch):
`~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(oder `ai.openclaw.<profile>.plist`).

Die macOS-App ist im lokalen Modus für die Installation und Aktualisierung des
LaunchAgent für das Standardprofil zuständig. Die CLI kann ihn ebenfalls direkt
installieren: `openclaw gateway install` (benannte Profile werden über die
Umgebungsvariable `OPENCLAW_PROFILE` ausgewählt).

Verhalten:

- „OpenClaw Active“ aktiviert/deaktiviert den LaunchAgent.
- Das Beenden der App stoppt das Gateway **nicht** (launchd hält es am Laufen).
- Wenn auf dem konfigurierten Port bereits ein Gateway läuft, stellt die App
  eine Verbindung dazu her, anstatt ein neues zu starten.

Protokollierung:

- launchd-Standardausgabe: `~/Library/Logs/openclaw/gateway.log` (Profile
  verwenden `gateway-<profile>.log`)
- launchd-Standardfehlerausgabe: unterdrückt
- Wenn der Host durch wiederholtes `EADDRINUSE` oder schnelle Neustarts in
  einer Schleife hängt, suchen Sie nach doppelten LaunchAgents
  `ai.openclaw.gateway` / `ai.openclaw.node` und prüfen Sie die Problemumgehung
  mit launchd-Markierung unter
  [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Versionskompatibilität

Die macOS-App gleicht die Gateway-Version mit ihrer eigenen Version ab. Das
Onboarding führt die verwaltete Einrichtung automatisch aus, wenn eine
vorhandene CLI fehlt oder inkompatibel ist. Verwenden Sie **Retry setup**, um
die Installation zu wiederholen, oder **Check again**, nachdem Sie eine externe
CLI repariert haben.

## Zustandsverzeichnis unter macOS

Speichern Sie den OpenClaw-Zustand auf einem lokalen, nicht synchronisierten
Datenträger. Vermeiden Sie iCloud Drive und andere mit der Cloud synchronisierte
Ordner; Synchronisierungslatenzen und Dateisperren können Sitzungen,
Anmeldedaten und den Gateway-Zustand beeinträchtigen.

Setzen Sie `OPENCLAW_STATE_DIR` nur dann auf einen lokalen Pfad, wenn Sie eine
Überschreibung benötigen. `openclaw doctor` warnt vor häufig verwendeten,
mit der Cloud synchronisierten Zustandspfaden und empfiehlt die Rückkehr zu
lokalem Speicher. Weitere Informationen finden Sie unter
[Umgebungsvariablen](/de/help/environment#path-related-env-vars) und
[Doctor](/de/gateway/doctor).

## App-Verbindung debuggen

Verwenden Sie die macOS-Debug-CLI aus einem Quellcode-Checkout, um denselben
Gateway-WebSocket-Handshake und dieselbe Erkennungslogik auszuführen, die von
der App verwendet werden:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` akzeptiert `--url`, `--token`, `--timeout`, `--probe` und `--json`
(sowie Überschreibungen der Clientidentität; führen Sie den Befehl mit `--help`
aus, um die vollständige Liste anzuzeigen). `discover` akzeptiert `--timeout`,
`--json` und `--include-local`. Vergleichen Sie die Erkennungsausgabe mit
`openclaw gateway discover --json`, wenn Sie Probleme bei der CLI-Erkennung
von appseitigen Verbindungsproblemen unterscheiden müssen.

## Funktionstest

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
