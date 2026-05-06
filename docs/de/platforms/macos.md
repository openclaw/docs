---
read_when:
    - Implementieren von macOS-App-Funktionen
    - Ändern des Gateway-Lebenszyklus oder der Node-Überbrückung unter macOS
summary: OpenClaw-macOS-Begleit-App (Menüleiste + Gateway-Broker)
title: macOS-App
x-i18n:
    generated_at: "2026-05-06T06:57:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc67a88303073bb771fcec09e7366f710a6bd5500f584f8782232deaa69e599d
    source_path: platforms/macos.md
    workflow: 16
---

Die macOS-App ist die **Begleit-App in der Menüleiste** für OpenClaw. Sie verwaltet Berechtigungen,
verwaltet den Gateway lokal bzw. hängt sich daran an (launchd oder manuell) und stellt macOS-
Funktionen dem Agenten als Node bereit.

## Was sie tut

- Zeigt native Benachrichtigungen und Status in der Menüleiste an.
- Verwaltet TCC-Abfragen (Benachrichtigungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon,
  Spracherkennung, Automation/AppleScript).
- Führt den Gateway aus oder verbindet sich mit ihm (lokal oder remote).
- Stellt nur unter macOS verfügbare Tools bereit (Canvas, Kamera, Bildschirmaufnahme, `system.run`).
- Startet den lokalen Node-Host-Dienst im **Remote**-Modus (launchd) und stoppt ihn im **lokalen** Modus.
- Hostet optional **PeekabooBridge** für UI-Automatisierung.
- Installiert auf Anfrage die globale CLI (`openclaw`) über npm, pnpm oder bun (die App bevorzugt npm, dann pnpm, dann bun; Node bleibt die empfohlene Gateway-Laufzeitumgebung).

## Lokaler vs. Remote-Modus

- **Lokal** (Standard): Die App hängt sich an einen laufenden lokalen Gateway an, falls vorhanden;
  andernfalls aktiviert sie den launchd-Dienst über `openclaw gateway install`.
- **Remote**: Die App verbindet sich über SSH/Tailscale mit einem Gateway und startet niemals
  einen lokalen Prozess.
  Die App startet den lokalen **Node-Host-Dienst**, damit der Remote-Gateway diesen Mac erreichen kann.
  Die App startet den Gateway nicht als Kindprozess.
  Die Gateway-Erkennung bevorzugt jetzt Tailscale-MagicDNS-Namen gegenüber rohen Tailnet-IPs,
  sodass sich die Mac-App zuverlässiger erholt, wenn sich Tailnet-IPs ändern.

## launchd-Steuerung

Die App verwaltet einen LaunchAgent pro Benutzer mit dem Label `ai.openclaw.gateway`
(oder `ai.openclaw.<profile>` bei Verwendung von `--profile`/`OPENCLAW_PROFILE`; das ältere `com.openclaw.*` wird weiterhin entladen).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ersetzen Sie das Label durch `ai.openclaw.<profile>`, wenn Sie ein benanntes Profil ausführen.

Wenn der LaunchAgent nicht installiert ist, aktivieren Sie ihn in der App oder führen Sie
`openclaw gateway install` aus.

## Node-Funktionen (Mac)

Die macOS-App präsentiert sich als Node. Häufige Befehle:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Bildschirm: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Der Node meldet eine `permissions`-Map, damit Agenten entscheiden können, was erlaubt ist.

Node-Dienst + App-IPC:

- Wenn der Headless-Node-Host-Dienst läuft (Remote-Modus), verbindet er sich als Node mit dem Gateway-WS.
- `system.run` wird in der macOS-App (UI/TCC-Kontext) über einen lokalen Unix-Socket ausgeführt; Abfragen + Ausgabe bleiben in der App.

Diagramm (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Ausführungsgenehmigungen (system.run)

`system.run` wird in der macOS-App über **Ausführungsgenehmigungen** gesteuert (Einstellungen → Ausführungsgenehmigungen).
Sicherheit + Nachfrage + Allowlist werden lokal auf dem Mac gespeichert in:

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
- Roher Shell-Befehlstext, der Shell-Steuerungs- oder Erweiterungssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), wird als Allowlist-Fehltreffer behandelt und erfordert eine explizite Genehmigung (oder das Hinzufügen der Shell-Binärdatei zur Allowlist).
- Wenn Sie in der Abfrage „Immer erlauben“ wählen, wird dieser Befehl zur Allowlist hinzugefügt.
- `system.run`-Umgebungsüberschreibungen werden gefiltert (entfernt `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) und dann mit der Umgebung der App zusammengeführt.
- Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene Umgebungsüberschreibungen auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei „immer erlauben“-Entscheidungen im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) innere ausführbare Pfade statt Wrapper-Pfaden dauerhaft. Wenn das Entpacken nicht sicher ist, wird kein Allowlist-Eintrag automatisch gespeichert.

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

- Ohne `key` fordert die App eine Bestätigung an.
- Ohne `key` erzwingt die App eine kurze Nachrichtenbegrenzung für die Bestätigungsabfrage und ignoriert `deliver` / `to` / `channel`.
- Mit einem gültigen `key` läuft die Ausführung unbeaufsichtigt (für persönliche Automatisierungen gedacht).

## Onboarding-Ablauf (typisch)

1. Installieren und starten Sie **OpenClaw.app**.
2. Schließen Sie die Berechtigungs-Checkliste ab (TCC-Abfragen).
3. Stellen Sie sicher, dass der **lokale** Modus aktiv ist und der Gateway läuft.
4. Installieren Sie die CLI, wenn Sie Terminalzugriff wünschen.

## Platzierung des State-Verzeichnisses (macOS)

Vermeiden Sie es, Ihr OpenClaw-State-Verzeichnis in iCloud oder anderen cloud-synchronisierten Ordnern abzulegen.
Synchronisierte Pfade können Latenz hinzufügen und gelegentlich Datei-Sperr-/Synchronisationsrennen für
Sitzungen und Anmeldedaten verursachen.

Bevorzugen Sie einen lokalen, nicht synchronisierten State-Pfad wie:
__OC_I18N_900005__
Wenn `openclaw doctor` State unter folgenden Pfaden erkennt:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

warnt es und empfiehlt, zurück zu einem lokalen Pfad zu wechseln.

## Build- und Entwicklungsworkflow (nativ)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (oder Xcode)
- App paketieren: `scripts/package-mac-app.sh`

## Gateway-Konnektivität debuggen (macOS-CLI)

Verwenden Sie die Debug-CLI, um denselben Gateway-WebSocket-Handshake und dieselbe Erkennungslogik
auszuführen, die die macOS-App verwendet, ohne die App zu starten.
__OC_I18N_900006__
Verbindungsoptionen:

- `--url <ws://host:port>`: Konfiguration überschreiben
- `--mode <local|remote>`: aus der Konfiguration auflösen (Standard: Konfiguration oder lokal)
- `--probe`: frische Health-Probe erzwingen
- `--timeout <ms>`: Anfrage-Timeout (Standard: `15000`)
- `--json`: strukturierte Ausgabe zum Vergleichen

Erkennungsoptionen:

- `--include-local`: Gateways einbeziehen, die als „lokal“ herausgefiltert würden
- `--timeout <ms>`: gesamtes Erkennungsfenster (Standard: `2000`)
- `--json`: strukturierte Ausgabe zum Vergleichen

<Tip>
Vergleichen Sie mit `openclaw gateway discover --json`, um zu sehen, ob sich die Erkennungspipeline der macOS-App (`local.` plus die konfigurierte Wide-Area-Domain, mit Wide-Area- und Tailscale-Serve-Fallbacks) von der `dns-sd`-basierten Erkennung der Node-CLI unterscheidet.
</Tip>

## Remote-Verbindungsplumbing (SSH-Tunnel)

Wenn die macOS-App im **Remote**-Modus läuft, öffnet sie einen SSH-Tunnel, damit lokale UI-
Komponenten mit einem Remote-Gateway sprechen können, als befände er sich auf localhost.

### Kontrolltunnel (Gateway-WebSocket-Port)

- **Zweck:** Health Checks, Status, Web Chat, Konfiguration und andere Control-Plane-Aufrufe.
- **Lokaler Port:** der Gateway-Port (Standard `18789`), immer stabil.
- **Remote-Port:** derselbe Gateway-Port auf dem Remote-Host.
- **Verhalten:** kein zufälliger lokaler Port; die App verwendet einen vorhandenen intakten Tunnel erneut
  oder startet ihn bei Bedarf neu.
- **SSH-Form:** `ssh -N -L <local>:127.0.0.1:<remote>` mit BatchMode +
  ExitOnForwardFailure + Keepalive-Optionen.
- **IP-Meldung:** Der SSH-Tunnel verwendet Loopback, daher sieht der Gateway die Node-
  IP als `127.0.0.1`. Verwenden Sie den Transport **Direkt (ws/wss)**, wenn die echte Client-
  IP erscheinen soll (siehe [macOS-Remotezugriff](/de/platforms/mac/remote)).

Einrichtungsschritte finden Sie unter [macOS-Remotezugriff](/de/platforms/mac/remote). Protokoll-
details finden Sie unter [Gateway-Protokoll](/de/gateway/protocol).

## Verwandte Dokumentation

- [Gateway-Runbook](/de/gateway)
- [Gateway (macOS)](/de/platforms/mac/bundled-gateway)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
- [Canvas](/de/platforms/mac/canvas)
