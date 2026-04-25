---
read_when:
    - Implementieren von Funktionen der macOS-App
    - Ändern des Gateway-Lifecycles oder des Node-Bridgeings unter macOS
summary: OpenClaw macOS-Begleit-App (Menüleiste + Gateway-Broker)
title: macOS-App
x-i18n:
    generated_at: "2026-04-25T13:50:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
    source_path: platforms/macos.md
    workflow: 15
---

Die macOS-App ist die **Menüleisten-Begleit-App** für OpenClaw. Sie verwaltet Berechtigungen,
verwaltet/verbindet sich lokal mit dem Gateway (launchd oder manuell) und stellt dem Agenten macOS-
Fähigkeiten als Node bereit.

## Was sie tut

- Zeigt native Benachrichtigungen und Status in der Menüleiste an.
- Verwaltet TCC-Aufforderungen (Benachrichtigungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon,
  Spracherkennung, Automatisierung/AppleScript).
- Führt das Gateway aus oder verbindet sich damit (lokal oder remote).
- Stellt nur auf macOS verfügbare Tools bereit (Canvas, Kamera, Bildschirmaufnahme, `system.run`).
- Startet im **Remote**-Modus den lokalen Node-Host-Service (launchd) und stoppt ihn im **Local**-Modus.
- Hostet optional **PeekabooBridge** für UI-Automatisierung.
- Installiert auf Anfrage die globale CLI (`openclaw`) über npm, pnpm oder bun (die App bevorzugt npm, dann pnpm, dann bun; Node bleibt die empfohlene Gateway-Laufzeit).

## Lokaler vs. Remote-Modus

- **Local** (Standard): Die App verbindet sich mit einem laufenden lokalen Gateway, falls vorhanden;
  andernfalls aktiviert sie den launchd-Service über `openclaw gateway install`.
- **Remote**: Die App verbindet sich über SSH/Tailscale mit einem Gateway und startet niemals
  einen lokalen Prozess.
  Die App startet den lokalen **Node-Host-Service**, damit das entfernte Gateway diesen Mac erreichen kann.
  Die App startet das Gateway nicht als Child-Prozess.
  Die Gateway-Erkennung bevorzugt jetzt Tailscale-MagicDNS-Namen gegenüber rohen Tailnet-IPs,
  sodass die Mac-App zuverlässiger wiederhergestellt wird, wenn sich Tailnet-IPs ändern.

## Launchd-Steuerung

Die App verwaltet einen LaunchAgent pro Benutzer mit der Bezeichnung `ai.openclaw.gateway`
(oder `ai.openclaw.<profile>` bei Verwendung von `--profile`/`OPENCLAW_PROFILE`; ältere `com.openclaw.*` werden weiterhin entladen).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ersetzen Sie die Bezeichnung durch `ai.openclaw.<profile>`, wenn Sie ein benanntes Profil verwenden.

Wenn der LaunchAgent nicht installiert ist, aktivieren Sie ihn in der App oder führen Sie
`openclaw gateway install` aus.

## Node-Fähigkeiten (mac)

Die macOS-App präsentiert sich als Node. Häufige Befehle:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Bildschirm: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Der Node meldet eine Map `permissions`, damit Agenten entscheiden können, was erlaubt ist.

Node-Service + App-IPC:

- Wenn der Headless-Node-Host-Service läuft (Remote-Modus), verbindet er sich als Node mit dem Gateway-WS.
- `system.run` wird in der macOS-App (UI-/TCC-Kontext) über einen lokalen Unix-Socket ausgeführt; Prompts + Ausgabe bleiben in der App.

Diagramm (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec-Genehmigungen (`system.run`)

`system.run` wird durch **Exec-Genehmigungen** in der macOS-App gesteuert (Settings → Exec approvals).
Sicherheit + Nachfrage + Allowlist werden lokal auf dem Mac gespeichert unter:

```
~/.openclaw/exec-approvals.json
```

Beispiel:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Hinweise:

- `allowlist`-Einträge sind Glob-Muster für aufgelöste Binary-Pfade oder einfache Befehlsnamen für über PATH aufgerufene Befehle.
- Rohtext von Shell-Befehlen, der Shell-Steuer- oder Erweiterungssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), wird als Allowlist-Miss behandelt und erfordert explizite Genehmigung (oder die Aufnahme des Shell-Binarys in die Allowlist).
- Die Auswahl „Always Allow“ im Prompt fügt diesen Befehl der Allowlist hinzu.
- Umgebungsüberschreibungen für `system.run` werden gefiltert (entfernt `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) und dann mit der Umgebung der App zusammengeführt.
- Bei Shell-Wrappern (`bash|sh|zsh ... -c/-lc`) werden Umgebungsüberschreibungen pro Anfrage auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei Entscheidungen „immer erlauben“ im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) die inneren ausführbaren Pfade statt der Wrapper-Pfade. Wenn das Entpacken nicht sicher ist, wird automatisch kein Allowlist-Eintrag gespeichert.

## Deep Links

Die App registriert das URL-Schema `openclaw://` für lokale Aktionen.

### `openclaw://agent`

Löst eine Gateway-`agent`-Anfrage aus.
__OC_I18N_900004__
Query-Parameter:

- `message` (erforderlich)
- `sessionKey` (optional)
- `thinking` (optional)
- `deliver` / `to` / `channel` (optional)
- `timeoutSeconds` (optional)
- `key` (optional, Schlüssel für den Modus ohne Beaufsichtigung)

Sicherheit:

- Ohne `key` fordert die App eine Bestätigung an.
- Ohne `key` erzwingt die App ein kurzes Nachrichtenlimit für den Bestätigungsdialog und ignoriert `deliver` / `to` / `channel`.
- Mit einem gültigen `key` läuft der Vorgang unbeaufsichtigt (gedacht für persönliche Automatisierungen).

## Onboarding-Ablauf (typisch)

1. **OpenClaw.app** installieren und starten.
2. Die Checkliste für Berechtigungen abschließen (TCC-Aufforderungen).
3. Sicherstellen, dass der Modus **Local** aktiv ist und das Gateway läuft.
4. Die CLI installieren, wenn Sie Terminal-Zugriff möchten.

## Platzierung des Statusverzeichnisses (macOS)

Vermeiden Sie es, Ihr OpenClaw-Statusverzeichnis in iCloud oder anderen cloud-synchronisierten Ordnern abzulegen.
Durch Synchronisierung gestützte Pfade können Latenz hinzufügen und gelegentlich zu Datei-Lock-/Sync-Rennen bei
Sitzungen und Anmeldedaten führen.

Bevorzugen Sie einen lokalen, nicht synchronisierten Statuspfad wie:
__OC_I18N_900005__
Wenn `openclaw doctor` Status unter folgendem Pfad erkennt:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

gibt es eine Warnung aus und empfiehlt, zu einem lokalen Pfad zurückzukehren.

## Build- und Dev-Workflow (nativ)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (oder Xcode)
- App paketieren: `scripts/package-mac-app.sh`

## Debuggen der Gateway-Konnektivität (macOS-CLI)

Verwenden Sie die Debug-CLI, um dieselbe Gateway-WebSocket-Handshake- und Erkennungslogik zu testen,
die auch die macOS-App verwendet, ohne die App zu starten.
__OC_I18N_900006__
Connect-Optionen:

- `--url <ws://host:port>`: Konfiguration überschreiben
- `--mode <local|remote>`: aus der Konfiguration auflösen (Standard: Konfiguration oder local)
- `--probe`: frische Integritätsprüfung erzwingen
- `--timeout <ms>`: Anfrage-Timeout (Standard: `15000`)
- `--json`: strukturierte Ausgabe zum Vergleichen

Discovery-Optionen:

- `--include-local`: Gateways einschließen, die als „lokal“ herausgefiltert würden
- `--timeout <ms>`: gesamtes Discovery-Fenster (Standard: `2000`)
- `--json`: strukturierte Ausgabe zum Vergleichen

Tipp: Vergleichen Sie mit `openclaw gateway discover --json`, um zu sehen, ob sich die
Erkennungspipeline der macOS-App (`local.` plus die konfigurierte Wide-Area-Domain, mit
Wide-Area- und Tailscale-Serve-Fallbacks) von der auf `dns-sd` basierenden Erkennung
der Node-CLI unterscheidet.

## Verbindungsaufbau für Remote-Verbindungen (SSH-Tunnel)

Wenn die macOS-App im **Remote**-Modus läuft, öffnet sie einen SSH-Tunnel, damit lokale UI-
Komponenten mit einem entfernten Gateway sprechen können, als liefe es auf localhost.

### Control-Tunnel (Gateway-WebSocket-Port)

- **Zweck:** Integritätsprüfungen, Status, Web Chat, Konfiguration und andere Control-Plane-Aufrufe.
- **Lokaler Port:** der Gateway-Port (Standard `18789`), immer stabil.
- **Entfernter Port:** derselbe Gateway-Port auf dem entfernten Host.
- **Verhalten:** kein zufälliger lokaler Port; die App verwendet einen vorhandenen gesunden Tunnel wieder
  oder startet ihn bei Bedarf neu.
- **SSH-Form:** `ssh -N -L <local>:127.0.0.1:<remote>` mit BatchMode +
  ExitOnForwardFailure + Keepalive-Optionen.
- **IP-Meldung:** Der SSH-Tunnel verwendet Loopback, daher sieht das Gateway die Node-
  IP als `127.0.0.1`. Verwenden Sie **Direct (ws/wss)** als Transport, wenn die echte Client-
  IP erscheinen soll (siehe [macOS remote access](/de/platforms/mac/remote)).

Für Einrichtungsschritte siehe [macOS remote access](/de/platforms/mac/remote). Für Protokoll-
Details siehe [Gateway protocol](/de/gateway/protocol).

## Zugehörige Dokumente

- [Gateway-Runbook](/de/gateway)
- [Gateway (macOS)](/de/platforms/mac/bundled-gateway)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
- [Canvas](/de/platforms/mac/canvas)
