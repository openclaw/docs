---
read_when:
    - Implementieren von macOS-App-Funktionen
    - Ändern des Gateway-Lebenszyklus oder des Node-Bridgings unter macOS
summary: OpenClaw-macOS-Begleit-App (Menüleiste + Gateway-Broker)
title: macOS-App
x-i18n:
    generated_at: "2026-04-30T07:03:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

Die macOS-App ist der **Menüleistenbegleiter** für OpenClaw. Sie verwaltet Berechtigungen,
verwaltet den Gateway lokal bzw. hängt sich daran an (launchd oder manuell) und stellt dem Agenten macOS-
Funktionen als Node bereit.

## Was sie tut

- Zeigt native Benachrichtigungen und den Status in der Menüleiste an.
- Verwaltet TCC-Abfragen (Benachrichtigungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon,
  Spracherkennung, Automation/AppleScript).
- Führt den Gateway aus oder verbindet sich damit (lokal oder remote).
- Stellt nur unter macOS verfügbare Tools bereit (Canvas, Kamera, Bildschirmaufnahme, `system.run`).
- Startet den lokalen Node-Hostdienst im **Remote**-Modus (launchd) und stoppt ihn im **Lokal**-Modus.
- Hostet optional **PeekabooBridge** für UI-Automation.
- Installiert die globale CLI (`openclaw`) auf Anfrage über npm, pnpm oder bun (die App bevorzugt npm, dann pnpm, dann bun; Node bleibt die empfohlene Gateway-Laufzeitumgebung).

## Lokaler vs. Remote-Modus

- **Lokal** (Standard): Die App hängt sich an einen laufenden lokalen Gateway an, falls vorhanden;
  andernfalls aktiviert sie den launchd-Dienst über `openclaw gateway install`.
- **Remote**: Die App verbindet sich über SSH/Tailscale mit einem Gateway und startet nie
  einen lokalen Prozess.
  Die App startet den lokalen **Node-Hostdienst**, damit der Remote-Gateway diesen Mac erreichen kann.
  Die App startet den Gateway nicht als Kindprozess.
  Die Gateway-Erkennung bevorzugt jetzt Tailscale-MagicDNS-Namen gegenüber rohen Tailnet-IPs,
  sodass sich die Mac-App zuverlässiger erholt, wenn sich Tailnet-IPs ändern.

## Launchd-Steuerung

Die App verwaltet einen benutzerspezifischen LaunchAgent mit dem Label `ai.openclaw.gateway`
(oder `ai.openclaw.<profile>` bei Verwendung von `--profile`/`OPENCLAW_PROFILE`; ältere `com.openclaw.*` werden weiterhin entladen).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ersetzen Sie das Label durch `ai.openclaw.<profile>`, wenn Sie ein benanntes Profil ausführen.

Wenn der LaunchAgent nicht installiert ist, aktivieren Sie ihn in der App oder führen Sie
`openclaw gateway install` aus.

## Node-Funktionen (Mac)

Die macOS-App stellt sich selbst als Node dar. Häufige Befehle:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Bildschirm: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Die Node meldet eine `permissions`-Map, damit Agenten entscheiden können, was erlaubt ist.

Node-Dienst + App-IPC:

- Wenn der Headless-Node-Hostdienst läuft (Remote-Modus), verbindet er sich als Node mit dem Gateway-WS.
- `system.run` wird in der macOS-App (UI-/TCC-Kontext) über einen lokalen Unix-Socket ausgeführt; Abfragen und Ausgaben bleiben in der App.

Diagramm (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Ausführungsgenehmigungen (system.run)

`system.run` wird in der macOS-App über **Ausführungsgenehmigungen** gesteuert (Einstellungen → Ausführungsgenehmigungen).
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

- `allowlist`-Einträge sind Glob-Muster für aufgelöste Binärpfade oder reine Befehlsnamen für über PATH aufgerufene Befehle.
- Roher Shell-Befehlstext, der Shell-Steuerungs- oder Erweiterungssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), wird als Allowlist-Fehltreffer behandelt und erfordert eine ausdrückliche Genehmigung (oder die Aufnahme der Shell-Binärdatei in die Allowlist).
- Die Auswahl von „Immer erlauben“ in der Abfrage fügt diesen Befehl zur Allowlist hinzu.
- `system.run`-Umgebungsüberschreibungen werden gefiltert (`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` werden verworfen) und anschließend mit der Umgebung der App zusammengeführt.
- Bei Shell-Wrappern (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene Umgebungsüberschreibungen auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei Immer-erlauben-Entscheidungen im Allowlist-Modus werden für bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) innere ausführbare Pfade statt Wrapper-Pfade gespeichert. Wenn das Entpacken nicht sicher ist, wird kein Allowlist-Eintrag automatisch gespeichert.

## Deep Links

Die App registriert das URL-Schema `openclaw://` für lokale Aktionen.

### `openclaw://agent`

Löst eine Gateway-`agent`-Anfrage aus.
__OC_I18N_900004__
Abfrageparameter:

- `message` (erforderlich)
- `sessionKey` (optional)
- `thinking` (optional)
- `deliver` / `to` / `channel` (optional)
- `timeoutSeconds` (optional)
- `key` (optionaler Schlüssel für unbeaufsichtigten Modus)

Sicherheit:

- Ohne `key` fragt die App nach Bestätigung.
- Ohne `key` erzwingt die App ein kurzes Nachrichtenlimit für die Bestätigungsabfrage und ignoriert `deliver` / `to` / `channel`.
- Mit einem gültigen `key` läuft die Ausführung unbeaufsichtigt (für persönliche Automationen vorgesehen).

## Onboarding-Ablauf (typisch)

1. Installieren und starten Sie **OpenClaw.app**.
2. Schließen Sie die Berechtigungs-Checkliste ab (TCC-Abfragen).
3. Stellen Sie sicher, dass der **Lokal**-Modus aktiv ist und der Gateway läuft.
4. Installieren Sie die CLI, wenn Sie Terminalzugriff wünschen.

## Platzierung des Zustandsverzeichnisses (macOS)

Vermeiden Sie es, Ihr OpenClaw-Zustandsverzeichnis in iCloud oder andere Cloud-synchronisierte Ordner zu legen.
Synchronisierte Pfade können Latenz verursachen und gelegentlich Datei-Sperr-/Synchronisationsrennen bei
Sitzungen und Anmeldedaten auslösen.

Bevorzugen Sie einen lokalen, nicht synchronisierten Zustandspfad wie:
__OC_I18N_900005__
Wenn `openclaw doctor` Zustand unter folgenden Pfaden erkennt:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

gibt es eine Warnung aus und empfiehlt, zurück zu einem lokalen Pfad zu wechseln.

## Build- & Entwicklungsworkflow (nativ)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (oder Xcode)
- App paketieren: `scripts/package-mac-app.sh`

## Gateway-Konnektivität debuggen (macOS-CLI)

Verwenden Sie die Debug-CLI, um denselben Gateway-WebSocket-Handshake und dieselbe Erkennungslogik
zu testen, die die macOS-App verwendet, ohne die App zu starten.
__OC_I18N_900006__
Verbindungsoptionen:

- `--url <ws://host:port>`: Konfiguration überschreiben
- `--mode <local|remote>`: aus der Konfiguration auflösen (Standard: Konfiguration oder lokal)
- `--probe`: eine frische Zustandsprüfung erzwingen
- `--timeout <ms>`: Anfrage-Timeout (Standard: `15000`)
- `--json`: strukturierte Ausgabe für Vergleiche

Erkennungsoptionen:

- `--include-local`: Gateways einschließen, die als „lokal“ gefiltert würden
- `--timeout <ms>`: gesamtes Erkennungsfenster (Standard: `2000`)
- `--json`: strukturierte Ausgabe für Vergleiche

<Tip>
Vergleichen Sie mit `openclaw gateway discover --json`, um zu sehen, ob sich die Erkennungspipeline der macOS-App (`local.` plus die konfigurierte Wide-Area-Domain, mit Wide-Area- und Tailscale-Serve-Fallbacks) von der `dns-sd`-basierten Erkennung der Node-CLI unterscheidet.
</Tip>

## Remote-Verbindungsinfrastruktur (SSH-Tunnel)

Wenn die macOS-App im **Remote**-Modus läuft, öffnet sie einen SSH-Tunnel, damit lokale UI-
Komponenten mit einem Remote-Gateway kommunizieren können, als befände er sich auf localhost.

### Steuerungstunnel (Gateway-WebSocket-Port)

- **Zweck:** Zustandsprüfungen, Status, Web Chat, Konfiguration und andere Control-Plane-Aufrufe.
- **Lokaler Port:** der Gateway-Port (Standard `18789`), immer stabil.
- **Remote-Port:** derselbe Gateway-Port auf dem Remote-Host.
- **Verhalten:** kein zufälliger lokaler Port; die App verwendet einen vorhandenen fehlerfreien Tunnel erneut
  oder startet ihn bei Bedarf neu.
- **SSH-Form:** `ssh -N -L <local>:127.0.0.1:<remote>` mit BatchMode +
  ExitOnForwardFailure + Keepalive-Optionen.
- **IP-Bericht:** Der SSH-Tunnel verwendet loopback, daher sieht der Gateway die Node-
  IP als `127.0.0.1`. Verwenden Sie den Transport **Direkt (ws/wss)**, wenn die echte Client-
  IP erscheinen soll (siehe [macOS-Remotezugriff](/de/platforms/mac/remote)).

Einrichtungsschritte finden Sie unter [macOS-Remotezugriff](/de/platforms/mac/remote). Protokoll-
details finden Sie unter [Gateway-Protokoll](/de/gateway/protocol).

## Zugehörige Dokumentation

- [Gateway-Runbook](/de/gateway)
- [Gateway (macOS)](/de/platforms/mac/bundled-gateway)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
- [Canvas](/de/platforms/mac/canvas)
