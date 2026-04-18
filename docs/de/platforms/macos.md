---
read_when:
    - Implementierung von Funktionen der macOS-App
    - Ändern des Gateway-Luntimezyklus oder der Node-Bridge auf macOS
summary: OpenClaw macOS-Begleit-App (Menüleiste + Gateway-Broker)
title: macOS-App
x-i18n:
    generated_at: "2026-04-18T06:12:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d637df2f73ced110223c48ea3c934045d782e150a46495f434cf924a6a00baf0
    source_path: platforms/macos.md
    workflow: 15
---

# OpenClaw macOS-Begleiter (Menüleiste + Gateway-Broker)

Die macOS-App ist der **Begleiter in der Menüleiste** für OpenClaw. Sie verwaltet Berechtigungen,
verwaltet/stellt lokal eine Verbindung zum Gateway her (launchd oder manuell) und stellt dem Agent macOS-
Funktionen als Node zur Verfügung.

## Was sie macht

- Zeigt native Benachrichtigungen und Status in der Menüleiste an.
- Verwaltet TCC-Aufforderungen (Benachrichtigungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon,
  Spracherkennung, Automation/AppleScript).
- Führt das Gateway aus oder verbindet sich damit (lokal oder remote).
- Stellt reine macOS-Tools bereit (Canvas, Kamera, Bildschirmaufnahme, `system.run`).
- Startet den lokalen Node-Host-Service im **Remote**-Modus (launchd) und stoppt ihn im **Local**-Modus.
- Hoster optional **PeekabooBridge** für UI-Automatisierung.
- Installiert auf Anfrage die globale CLI (`openclaw`) über npm, pnpm oder bun (die App bevorzugt npm, dann pnpm, dann bun; Node bleibt die empfohlene Gateway-Laufzeit).

## Local- vs. Remote-Modus

- **Local** (Standard): Die App verbindet sich mit einem laufenden lokalen Gateway, falls vorhanden;
  andernfalls aktiviert sie den launchd-Service über `openclaw gateway install`.
- **Remote**: Die App verbindet sich über SSH/Tailscale mit einem Gateway und startet niemals
  einen lokalen Prozess.
  Die App startet den lokalen **Node-Host-Service**, damit das entfernte Gateway diesen Mac erreichen kann.
  Die App startet das Gateway nicht als Child-Prozess.
  Die Gateway-Erkennung bevorzugt jetzt Tailscale MagicDNS-Namen gegenüber rohen Tailnet-IP-Adressen,
  sodass sich die Mac-App zuverlässiger erholt, wenn sich Tailnet-IP-Adressen ändern.

## launchd-Steuerung

Die App verwaltet einen benutzerspezifischen LaunchAgent mit der Bezeichnung `ai.openclaw.gateway`
(oder `ai.openclaw.<profile>` bei Verwendung von `--profile`/`OPENCLAW_PROFILE`; das alte `com.openclaw.*` wird weiterhin entladen).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ersetzen Sie die Bezeichnung durch `ai.openclaw.<profile>`, wenn Sie ein benanntes Profil ausführen.

Wenn der LaunchAgent nicht installiert ist, aktivieren Sie ihn in der App oder führen Sie
`openclaw gateway install` aus.

## Node-Funktionen (mac)

Die macOS-App präsentiert sich selbst als Node. Häufige Befehle:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Bildschirm: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Der Node meldet eine `permissions`-Zuordnung, damit Agents entscheiden können, was erlaubt ist.

Node-Service + App-IPC:

- Wenn der kopflose Node-Host-Service läuft (Remote-Modus), verbindet er sich als Node mit dem Gateway-WS.
- `system.run` wird in der macOS-App (UI/TCC-Kontext) über einen lokalen Unix-Socket ausgeführt; Aufforderungen und Ausgabe bleiben in der App.

Diagramm (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Ausführungsfreigaben (system.run)

`system.run` wird durch **Exec approvals** in der macOS-App gesteuert (Einstellungen → Exec approvals).
Security + ask + allowlist werden lokal auf dem Mac gespeichert in:

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

- `allowlist`-Einträge sind Glob-Muster für aufgelöste Binärpfade.
- Roher Shell-Befehlstext, der Shell-Steuer- oder Erweiterungssyntax enthält (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`), wird als Nichttreffer in der Allowlist behandelt und erfordert eine explizite Freigabe (oder das Hinzufügen der Shell-Binärdatei zur Allowlist).
- Wenn Sie in der Aufforderung „Immer zulassen“ wählen, wird dieser Befehl zur Allowlist hinzugefügt.
- Umgebungsüberschreibungen für `system.run` werden gefiltert (entfernt `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) und dann mit der Umgebung der App zusammengeführt.
- Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anforderungsbezogene Umgebungsüberschreibungen auf eine kleine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei Entscheidungen „Immer zulassen“ im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) innere ausführbare Pfade statt Wrapper-Pfade. Wenn das Entpacken nicht sicher ist, wird kein Allowlist-Eintrag automatisch gespeichert.

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
- `key` (optionaler Schlüssel für den unbeaufsichtigten Modus)

Sicherheit:

- Ohne `key` fordert die App eine Bestätigung an.
- Ohne `key` erzwingt die App für die Bestätigungsaufforderung eine kurze Nachrichtenbegrenzung und ignoriert `deliver` / `to` / `channel`.
- Mit einem gültigen `key` läuft die Ausführung unbeaufsichtigt (gedacht für persönliche Automatisierungen).

## Onboarding-Ablauf (typisch)

1. Installieren und starten Sie **OpenClaw.app**.
2. Schließen Sie die Berechtigungs-Checkliste ab (TCC-Aufforderungen).
3. Stellen Sie sicher, dass der **Local**-Modus aktiv ist und das Gateway läuft.
4. Installieren Sie die CLI, wenn Sie Terminalzugriff möchten.

## Platzierung des Zustandsverzeichnisses (macOS)

Vermeiden Sie es, Ihr OpenClaw-Zustandsverzeichnis in iCloud oder anderen cloud-synchronisierten Ordnern abzulegen.
Synchronisationsgestützte Pfade können Latenz hinzufügen und gelegentlich Dateisperren-/Synchronisationskonflikte für
Sitzungen und Anmeldedaten verursachen.

Bevorzugen Sie einen lokalen, nicht synchronisierten Zustandspfad wie:
__OC_I18N_900005__
Wenn `openclaw doctor` einen Zustand unter folgenden Pfaden erkennt:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

wird eine Warnung ausgegeben und empfohlen, wieder zu einem lokalen Pfad zu wechseln.

## Build- und Dev-Workflow (nativ)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (oder Xcode)
- App paketieren: `scripts/package-mac-app.sh`

## Gateway-Konnektivität debuggen (macOS CLI)

Verwenden Sie die Debug-CLI, um denselben Gateway-WebSocket-Handshake und dieselbe Erkennungslogik zu testen,
die auch die macOS-App verwendet, ohne die App zu starten.
__OC_I18N_900006__
Verbindungsoptionen:

- `--url <ws://host:port>`: Konfiguration überschreiben
- `--mode <local|remote>`: aus der Konfiguration auflösen (Standard: Konfiguration oder local)
- `--probe`: eine neue Integritätsprüfung erzwingen
- `--timeout <ms>`: Anfrage-Timeout (Standard: `15000`)
- `--json`: strukturierte Ausgabe zum Vergleichen

Erkennungsoptionen:

- `--include-local`: Gateways einschließen, die als „local“ herausgefiltert würden
- `--timeout <ms>`: gesamtes Erkennungsfenster (Standard: `2000`)
- `--json`: strukturierte Ausgabe zum Vergleichen

Tipp: Vergleichen Sie mit `openclaw gateway discover --json`, um zu sehen, ob sich die
Erkennungspipeline der macOS-App (`local.` plus die konfigurierte Wide-Area-Domain, mit
Wide-Area- und Tailscale-Serve-Fallbacks) von
der `dns-sd`-basierten Erkennung der Node-CLI unterscheidet.

## Remote-Verbindungs-Weiterleitung (SSH-Tunnel)

Wenn die macOS-App im **Remote**-Modus läuft, öffnet sie einen SSH-Tunnel, damit lokale UI-
Komponenten mit einem entfernten Gateway kommunizieren können, als wäre es auf localhost.

### Kontroll-Tunnel (Gateway-WebSocket-Port)

- **Zweck:** Integritätsprüfungen, Status, Web Chat, Konfiguration und andere Control-Plane-Aufrufe.
- **Lokaler Port:** der Gateway-Port (Standard `18789`), immer stabil.
- **Remote-Port:** derselbe Gateway-Port auf dem entfernten Host.
- **Verhalten:** kein zufälliger lokaler Port; die App verwendet einen vorhandenen funktionsfähigen Tunnel wieder
  oder startet ihn bei Bedarf neu.
- **SSH-Form:** `ssh -N -L <local>:127.0.0.1:<remote>` mit BatchMode +
  ExitOnForwardFailure + Keepalive-Optionen.
- **IP-Berichterstattung:** Der SSH-Tunnel verwendet Loopback, daher sieht das Gateway die Node-
  IP als `127.0.0.1`. Verwenden Sie den Transport **Direct (ws/wss)**, wenn die echte Client-
  IP angezeigt werden soll (siehe [macOS remote access](/de/platforms/mac/remote)).

Einrichtungsschritte finden Sie unter [macOS remote access](/de/platforms/mac/remote). Protokolldetails finden Sie unter [Gateway protocol](/de/gateway/protocol).

## Verwandte Dokumentation

- [Gateway runbook](/de/gateway)
- [Gateway (macOS)](/de/platforms/mac/bundled-gateway)
- [macOS permissions](/de/platforms/mac/permissions)
- [Canvas](/de/platforms/mac/canvas)
