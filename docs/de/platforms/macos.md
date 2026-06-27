---
read_when:
    - macOS-App-Funktionen implementieren
    - Gateway-Lebenszyklus oder Node-Bridging unter macOS ändern
summary: OpenClaw-macOS-Begleit-App (Menüleiste + Gateway-Broker)
title: macOS-App
x-i18n:
    generated_at: "2026-06-27T17:43:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

Die macOS-App ist der **Menüleisten-Begleiter** für OpenClaw. Sie besitzt Berechtigungen,
verwaltet den Gateway lokal bzw. verbindet sich mit ihm (launchd oder manuell) und stellt dem Agenten macOS-
Funktionen als Node bereit.

## Was sie macht

- Zeigt native Benachrichtigungen und Status in der Menüleiste an.
- Besitzt TCC-Aufforderungen (Benachrichtigungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon,
  Spracherkennung, Automation/AppleScript).
- Führt den Gateway aus oder verbindet sich mit ihm (lokal oder remote).
- Stellt macOS-spezifische Tools bereit (Canvas, Kamera, Bildschirmaufnahme, `system.run`).
- Startet den lokalen Node-Hostdienst im **Remote**-Modus (launchd) und stoppt ihn im **lokalen** Modus.
- Hostet optional **PeekabooBridge** für UI-Automation.
- Installiert die globale CLI (`openclaw`) auf Anfrage über npm, pnpm oder bun (die App bevorzugt npm, dann pnpm, dann bun; Node bleibt die empfohlene Gateway-Laufzeitumgebung).

## Lokaler vs. Remote-Modus

- **Lokal** (Standard): Die App verbindet sich mit einem laufenden lokalen Gateway, falls vorhanden;
  andernfalls aktiviert sie den launchd-Dienst über `openclaw gateway install`.
- **Remote**: Die App verbindet sich über SSH/Tailscale mit einem Gateway und startet niemals
  einen lokalen Prozess.
  Die App startet den lokalen **Node-Hostdienst**, damit der Remote-Gateway diesen Mac erreichen kann.
  Die App startet den Gateway nicht als Kindprozess.
  Die Gateway-Erkennung bevorzugt jetzt Tailscale-MagicDNS-Namen gegenüber rohen Tailnet-IPs,
  sodass sich die Mac-App zuverlässiger erholt, wenn sich Tailnet-IPs ändern.

## Launchd-Steuerung

Die App verwaltet einen benutzerspezifischen LaunchAgent mit dem Label `ai.openclaw.gateway`
(oder `ai.openclaw.<profile>` bei Verwendung von `--profile`/`OPENCLAW_PROFILE`; Legacy-`com.openclaw.*` wird weiterhin entladen).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ersetzen Sie das Label durch `ai.openclaw.<profile>`, wenn Sie ein benanntes Profil ausführen.

Wenn der LaunchAgent nicht installiert ist, aktivieren Sie ihn in der App oder führen Sie
`openclaw gateway install` aus.

Wenn der Gateway wiederholt für Minuten bis Stunden verschwindet und erst wieder reagiert, wenn Sie die Control UI berühren oder per SSH auf den Host zugreifen, lesen Sie den Troubleshooting-Hinweis zu macOS Maintenance Sleep / `ENETDOWN`-Abstürzen und launchds Respawn-Schutzmechanismus unter [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard).

## Node-Funktionen (Mac)

Die macOS-App präsentiert sich selbst als Node. Häufige Befehle:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Bildschirm: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Der Node meldet eine `permissions`-Map, damit Agenten entscheiden können, was erlaubt ist.

Node-Dienst + App-IPC:

- Wenn der Headless-Node-Hostdienst läuft (Remote-Modus), verbindet er sich als Node mit dem Gateway-WS.
- `system.run` wird in der macOS-App (UI/TCC-Kontext) über einen lokalen Unix-Socket ausgeführt; Aufforderungen + Ausgabe bleiben in der App.

Diagramm (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec-Genehmigungen (system.run)

`system.run` wird über **Exec-Genehmigungen** in der macOS-App gesteuert (Einstellungen → Exec-Genehmigungen).
Sicherheit + Nachfragen + Allowlist werden lokal auf dem Mac gespeichert in:

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
- Roher Shell-Befehlstext, der Shell-Steuerungs- oder Erweiterungssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), wird als Allowlist-Fehltreffer behandelt und erfordert eine explizite Genehmigung (oder das Allowlisting der Shell-Binärdatei).
- Wenn Sie in der Aufforderung „Immer erlauben“ wählen, wird dieser Befehl zur Allowlist hinzugefügt.
- `system.run`-Umgebungsüberschreibungen werden gefiltert (entfernt `PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) und dann mit der Umgebung der App zusammengeführt.
- Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene Umgebungsüberschreibungen auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei Entscheidungen „immer erlauben“ im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) die inneren ausführbaren Pfade statt der Wrapper-Pfade. Wenn das Entpacken nicht sicher ist, wird automatisch kein Allowlist-Eintrag gespeichert.

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
- `key` (optionaler Schlüssel für unbeaufsichtigten Modus)

Sicherheit:

- Ohne `key` fordert die App eine Bestätigung an.
- Ohne `key` erzwingt die App ein kurzes Nachrichtenlimit für die Bestätigungsaufforderung und ignoriert `deliver` / `to` / `channel`.
- Mit einem gültigen `key` läuft die Ausführung unbeaufsichtigt (für persönliche Automationen vorgesehen).

## Onboarding-Ablauf (typisch)

1. Installieren und starten Sie **OpenClaw.app**.
2. Schließen Sie die Berechtigungs-Checkliste ab (TCC-Aufforderungen).
3. Stellen Sie sicher, dass der **lokale** Modus aktiv ist und der Gateway läuft.
4. Installieren Sie die CLI, wenn Sie Terminalzugriff möchten.

## Platzierung des Zustandsverzeichnisses (macOS)

Vermeiden Sie es, Ihr OpenClaw-Zustandsverzeichnis in iCloud oder anderen Cloud-synchronisierten Ordnern abzulegen.
Synchronisationsgestützte Pfade können Latenz hinzufügen und gelegentlich Datei-Sperr-/Synchronisationsrennen für
Sitzungen und Anmeldedaten verursachen.

Bevorzugen Sie einen lokalen, nicht synchronisierten Zustandspfad wie:
__OC_I18N_900005__
Wenn `openclaw doctor` Zustand unter Folgendem erkennt:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

warnt es und empfiehlt, wieder zu einem lokalen Pfad zu wechseln.

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
- `--probe`: eine frische Health-Prüfung erzwingen
- `--timeout <ms>`: Anfrage-Timeout (Standard: `15000`)
- `--json`: strukturierte Ausgabe für Diffs

Erkennungsoptionen:

- `--include-local`: Gateways einschließen, die als „lokal“ herausgefiltert würden
- `--timeout <ms>`: gesamtes Erkennungsfenster (Standard: `2000`)
- `--json`: strukturierte Ausgabe für Diffs

<Tip>
Vergleichen Sie mit `openclaw gateway discover --json`, um zu sehen, ob sich die Erkennungspipeline der macOS-App (`local.` plus die konfigurierte Wide-Area-Domain, mit Wide-Area- und Tailscale-Serve-Fallbacks) von der `dns-sd`-basierten Erkennung der Node-CLI unterscheidet.
</Tip>

## Remote-Verbindungsplumbing (SSH-Tunnel)

Wenn die macOS-App im **Remote**-Modus läuft, öffnet sie einen SSH-Tunnel, damit lokale UI-
Komponenten mit einem Remote-Gateway sprechen können, als wäre er auf localhost.

### Kontrolltunnel (Gateway-WebSocket-Port)

- **Zweck:** Health-Prüfungen, Status, Web Chat, Konfiguration und andere Control-Plane-Aufrufe.
- **Lokaler Port:** der Gateway-Port (Standard `18789`), immer stabil.
- **Remote-Port:** derselbe Gateway-Port auf dem Remote-Host.
- **Verhalten:** kein zufälliger lokaler Port; die App verwendet einen bestehenden gesunden Tunnel wieder
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
