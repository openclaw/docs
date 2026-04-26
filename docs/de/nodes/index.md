---
read_when:
    - Koppeln von iOS-/Android-Nodes mit einem Gateway
    - Verwenden von Node-Canvas/Kamera für Agent-Kontext
    - Hinzufügen neuer Node-Befehle oder CLI-Helfer
summary: 'Nodes: Kopplung, Fähigkeiten, Berechtigungen und CLI-Helfer für Canvas/Kamera/Bildschirm/Gerät/Benachrichtigungen/System'
title: Nodes
x-i18n:
    generated_at: "2026-04-26T11:33:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
    source_path: nodes/index.md
    workflow: 15
---

Eine **Node** ist ein Begleitgerät (macOS/iOS/Android/headless), das sich mit dem **WebSocket** des Gateway verbindet (derselbe Port wie für Operatoren) mit `role: "node"` und eine Befehlsoberfläche (z. B. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) über `node.invoke` bereitstellt. Protokolldetails: [Gateway protocol](/de/gateway/protocol).

Älterer Transport: [Bridge protocol](/de/gateway/bridge-protocol) (TCP JSONL;
für aktuelle Nodes nur historisch relevant).

macOS kann auch im **Node-Modus** laufen: Die Menubar-App verbindet sich mit dem
WS-Server des Gateway und stellt ihre lokalen Canvas-/Kamera-Befehle als Node bereit (sodass
`openclaw nodes …` gegen diesen Mac funktioniert). Im Remote-Gateway-Modus wird Browser-
Automatisierung vom CLI-Node-Host (`openclaw node run` oder dem installierten Node-Service) übernommen, nicht von der nativen App-Node.

Hinweise:

- Nodes sind **Peripheriegeräte**, keine Gateways. Sie führen den Gateway-Dienst nicht aus.
- Nachrichten aus Telegram/WhatsApp/usw. landen auf dem **Gateway**, nicht auf Nodes.
- Leitfaden zur Fehlerbehebung: [/nodes/troubleshooting](/de/nodes/troubleshooting)

## Kopplung + Status

**WS-Nodes verwenden Gerätekopplung.** Nodes präsentieren beim `connect` eine Geräteidentität; das Gateway
erstellt eine Gerätekopplungsanfrage für `role: node`. Genehmigen Sie diese über die Devices-CLI (oder UI).

Schnelle CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Wenn eine Node es mit geänderten Authentifizierungsdetails erneut versucht (Rolle/Scopes/öffentlicher Schlüssel), wird die vorherige
ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor dem Genehmigen
erneut `openclaw devices list` aus.

Hinweise:

- `nodes status` markiert eine Node als **paired**, wenn ihre Gerätekopplungsrolle `node` enthält.
- Der Gerätekopplungseintrag ist der dauerhafte Vertrag über genehmigte Rollen. Token-
  Rotation bleibt innerhalb dieses Vertrags; sie kann eine gekoppelte Node nicht in
  eine andere Rolle hochstufen, die durch die Kopplungsgenehmigung nie gewährt wurde.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) ist ein separater Gateway-eigener
  Node-Kopplungsspeicher; er steuert den WS-`connect`-Handshake **nicht**.
- Der Genehmigungsscope folgt den deklarierten Befehlen der ausstehenden Anfrage:
  - Anfrage ohne Befehl: `operator.pairing`
  - Nicht-Exec-Node-Befehle: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Remote-Node-Host (`system.run`)

Verwenden Sie einen **Node-Host**, wenn Ihr Gateway auf einer Maschine läuft und Sie Befehle
auf einer anderen ausführen möchten. Das Modell spricht weiterhin mit dem **Gateway**; das Gateway
leitet `exec`-Aufrufe an den **Node-Host** weiter, wenn `host=node` ausgewählt ist.

### Was läuft wo

- **Gateway-Host**: empfängt Nachrichten, führt das Modell aus, routet Tool-Aufrufe.
- **Node-Host**: führt `system.run`/`system.which` auf der Node-Maschine aus.
- **Genehmigungen**: werden auf dem Node-Host über `~/.openclaw/exec-approvals.json` erzwungen.

Hinweis zu Genehmigungen:

- Genehmigungsgestützte Node-Läufe binden den exakten Anfragekontext.
- Für direkte Shell-/Laufzeit-Dateiausführungen bindet OpenClaw außerdem best-effort genau
  einen konkreten lokalen Dateiope­randen und verweigert die Ausführung, wenn sich diese Datei vor der Ausführung ändert.
- Wenn OpenClaw für einen Interpreter-/Laufzeitbefehl nicht genau eine konkrete lokale Datei identifizieren kann,
  wird eine genehmigungsgestützte Ausführung verweigert, statt eine vollständige Laufzeitabdeckung vorzutäuschen. Verwenden Sie Sandboxing,
  separate Hosts oder einen expliziten vertrauenswürdigen Allowlist-/Full-Workflow für breitere Interpreter-Semantik.

### Einen Node-Host starten (Vordergrund)

Auf der Node-Maschine:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Remote-Gateway per SSH-Tunnel (Loopback-Bind)

Wenn das Gateway an Loopback gebunden ist (`gateway.bind=loopback`, Standard im lokalen Modus),
können sich Remote-Node-Hosts nicht direkt verbinden. Erstellen Sie einen SSH-Tunnel und verweisen Sie den
Node-Host auf das lokale Ende des Tunnels.

Beispiel (Node-Host -> Gateway-Host):

```bash
# Terminal A (weiterlaufen lassen): lokales 18790 -> Gateway 127.0.0.1:18789 weiterleiten
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: Gateway-Token exportieren und über den Tunnel verbinden
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Hinweise:

- `openclaw node run` unterstützt Token- oder Passwort-Auth.
- Env-Variablen werden bevorzugt: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Fallback in der Konfiguration ist `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus ignoriert der Node-Host absichtlich `gateway.remote.token` / `gateway.remote.password`.
- Im Remote-Modus sind `gateway.remote.token` / `gateway.remote.password` gemäß den Prioritätsregeln für Remote zulässig.
- Wenn aktive lokale `gateway.auth.*`-SecretRefs konfiguriert, aber nicht aufgelöst sind, schlägt Node-Host-Auth fail-closed fehl.
- Die Auflösung der Node-Host-Auth berücksichtigt nur Env-Variablen `OPENCLAW_GATEWAY_*`.

### Einen Node-Host starten (Service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Koppeln + benennen

Auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Wenn die Node es mit geänderten Authentifizierungsdetails erneut versucht, führen Sie erneut `openclaw devices list`
aus und genehmigen Sie die aktuelle `requestId`.

Optionen für Benennung:

- `--display-name` bei `openclaw node run` / `openclaw node install` (wird auf der Node in `~/.openclaw/node.json` gespeichert).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (Gateway-Überschreibung).

### Die Befehle auf die Allowlist setzen

Exec-Genehmigungen sind **pro Node-Host**. Fügen Sie vom Gateway aus Allowlist-Einträge hinzu:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Genehmigungen liegen auf dem Node-Host unter `~/.openclaw/exec-approvals.json`.

### Exec auf die Node verweisen

Standardwerte konfigurieren (Gateway-Konfiguration):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Oder pro Sitzung:

```
/exec host=node security=allowlist node=<id-or-name>
```

Sobald das gesetzt ist, läuft jeder `exec`-Aufruf mit `host=node` auf dem Node-Host (vorbehaltlich der
Allowlist/Genehmigungen der Node).

`host=auto` wählt die Node nicht implizit selbst aus, aber eine explizite Anfrage `host=node` pro Aufruf ist von `auto` aus zulässig. Wenn Node-Exec für die Sitzung der Standard sein soll, setzen Sie `tools.exec.host=node` oder explizit `/exec host=node ...`.

Verwandt:

- [Node host CLI](/de/cli/node)
- [Exec tool](/de/tools/exec)
- [Exec approvals](/de/tools/exec-approvals)

## Befehle aufrufen

Low-Level (rohes RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Für die häufigen Workflows „dem Agent einen MEDIA-Anhang geben“ gibt es höherwertige Helfer.

## Screenshots (Canvas-Snapshots)

Wenn die Node das Canvas (WebView) anzeigt, gibt `canvas.snapshot` `{ format, base64 }` zurück.

CLI-Helfer (schreibt in eine temporäre Datei und gibt `MEDIA:<path>` aus):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas-Steuerung

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Hinweise:

- `canvas present` akzeptiert URLs oder lokale Dateipfade (`--target`) sowie optional `--x/--y/--width/--height` für die Positionierung.
- `canvas eval` akzeptiert Inline-JavaScript (`--js`) oder ein Positionsargument.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Hinweise:

- Nur A2UI v0.8 JSONL wird unterstützt (v0.9/createSurface wird abgelehnt).

## Fotos + Videos (Node-Kamera)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # Standard: beide Blickrichtungen (2 MEDIA-Zeilen)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Videoclips (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Hinweise:

- Die Node muss für `canvas.*` und `camera.*` **im Vordergrund** sein (Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück).
- Die Clip-Dauer wird begrenzt (derzeit `<= 60s`), um zu große Base64-Nutzlasten zu vermeiden.
- Android fordert wenn möglich Berechtigungen für `CAMERA`/`RECORD_AUDIO` an; verweigerte Berechtigungen schlagen mit `*_PERMISSION_REQUIRED` fehl.

## Bildschirmaufnahmen (Nodes)

Unterstützte Nodes stellen `screen.record` bereit (`mp4`). Beispiel:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Hinweise:

- Die Verfügbarkeit von `screen.record` hängt von der Plattform der Node ab.
- Bildschirmaufnahmen werden auf `<= 60s` begrenzt.
- `--no-audio` deaktiviert die Mikrofonaufnahme auf unterstützten Plattformen.
- Verwenden Sie `--screen <index>`, um bei mehreren Bildschirmen ein Display auszuwählen.

## Standort (Nodes)

Nodes stellen `location.get` bereit, wenn Standort in den Einstellungen aktiviert ist.

CLI-Helfer:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Hinweise:

- Standort ist standardmäßig **deaktiviert**.
- „Always“ erfordert eine Systemberechtigung; Abruf im Hintergrund erfolgt best-effort.
- Die Antwort enthält Breite/Länge, Genauigkeit (Meter) und Zeitstempel.

## SMS (Android-Nodes)

Android-Nodes können `sms.send` bereitstellen, wenn der Benutzer die Berechtigung **SMS** erteilt und das Gerät Telefonie unterstützt.

Low-Level-Aufruf:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Hinweise:

- Die Berechtigungsabfrage muss auf dem Android-Gerät akzeptiert werden, bevor die Fähigkeit beworben wird.
- Geräte nur mit Wi‑Fi ohne Telefonie bewerben `sms.send` nicht.

## Android-Geräte- und personenbezogene Datenbefehle

Android-Nodes können zusätzliche Befehlsfamilien bewerben, wenn die entsprechenden Fähigkeiten aktiviert sind.

Verfügbare Familien:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Beispielaufrufe:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Hinweise:

- Bewegungsbefehle werden durch die verfügbaren Sensoren capability-gesteuert.

## Systembefehle (Node-Host / Mac-Node)

Die macOS-Node stellt `system.run`, `system.notify` und `system.execApprovals.get/set` bereit.
Der headless Node-Host stellt `system.run`, `system.which` und `system.execApprovals.get/set` bereit.

Beispiele:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Hinweise:

- `system.run` gibt stdout/stderr/Exit-Code in der Nutzlast zurück.
- Shell-Ausführung läuft jetzt über das Tool `exec` mit `host=node`; `nodes` bleibt die direkte RPC-Oberfläche für explizite Node-Befehle.
- `nodes invoke` stellt `system.run` oder `system.run.prepare` nicht bereit; diese bleiben ausschließlich auf dem Exec-Pfad.
- Der Exec-Pfad erstellt vor der Genehmigung einen kanonischen `systemRunPlan`. Sobald eine
  Genehmigung erteilt wird, leitet das Gateway diesen gespeicherten Plan weiter und nicht später
  vom Aufrufer bearbeitete Felder für command/cwd/session.
- `system.notify` berücksichtigt den Status der Benachrichtigungsberechtigung in der macOS-App.
- Nicht erkannte Metadaten `platform` / `deviceFamily` der Node verwenden eine konservative Standard-Allowlist, die `system.run` und `system.which` ausschließt. Wenn Sie diese Befehle absichtlich für eine unbekannte Plattform benötigen, fügen Sie sie explizit über `gateway.nodes.allowCommands` hinzu.
- `system.run` unterstützt `--cwd`, `--env KEY=VAL`, `--command-timeout` und `--needs-screen-recording`.
- Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene Werte aus `--env` auf eine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei Allow-Always-Entscheidungen im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) innere ausführbare Pfade statt Wrapper-Pfaden. Wenn das Entpacken nicht sicher ist, wird automatisch kein Allowlist-Eintrag gespeichert.
- Auf Windows-Node-Hosts im Allowlist-Modus erfordern Shell-Wrapper-Läufe über `cmd.exe /c` eine Genehmigung (ein Allowlist-Eintrag allein erlaubt die Wrapper-Form nicht automatisch).
- `system.notify` unterstützt `--priority <passive|active|timeSensitive>` und `--delivery <system|overlay|auto>`.
- Node-Hosts ignorieren Überschreibungen von `PATH` und entfernen gefährliche Start-/Shell-Schlüssel (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Wenn Sie zusätzliche PATH-Einträge benötigen, konfigurieren Sie die Service-Umgebung des Node-Hosts (oder installieren Sie Tools an Standardorten), statt `PATH` über `--env` zu übergeben.
- Im Node-Modus unter macOS wird `system.run` durch Exec-Genehmigungen in der macOS-App gesteuert (Einstellungen → Exec approvals).
  Ask/Allowlist/Full verhalten sich genauso wie beim headless Node-Host; verweigerte Aufforderungen geben `SYSTEM_RUN_DENIED` zurück.
- Auf dem headless Node-Host wird `system.run` durch Exec-Genehmigungen gesteuert (`~/.openclaw/exec-approvals.json`).

## Bindung von Exec an eine Node

Wenn mehrere Nodes verfügbar sind, können Sie Exec an eine bestimmte Node binden.
Dadurch wird die Standard-Node für `exec host=node` gesetzt (und kann pro Agent überschrieben werden).

Globaler Standard:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Überschreibung pro Agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Entfernen, um jede Node zuzulassen:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Berechtigungsübersicht

Nodes können in `node.list` / `node.describe` eine Map `permissions` enthalten, nach Berechtigungsnamen als Schlüssel (z. B. `screenRecording`, `accessibility`) mit booleschen Werten (`true` = gewährt).

## Headless Node-Host (plattformübergreifend)

OpenClaw kann einen **headless Node-Host** (ohne UI) ausführen, der sich mit dem
WebSocket des Gateway verbindet und `system.run` / `system.which` bereitstellt. Das ist nützlich auf Linux/Windows
oder um neben einem Server eine minimale Node auszuführen.

Starten:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Hinweise:

- Kopplung ist weiterhin erforderlich (das Gateway zeigt eine Gerätekopplungsaufforderung).
- Der Node-Host speichert seine Node-ID, sein Token, den Anzeigenamen und Informationen zur Gateway-Verbindung in `~/.openclaw/node.json`.
- Exec-Genehmigungen werden lokal über `~/.openclaw/exec-approvals.json`
  erzwungen (siehe [Exec approvals](/de/tools/exec-approvals)).
- Unter macOS führt der headless Node-Host `system.run` standardmäßig lokal aus. Setzen Sie
  `OPENCLAW_NODE_EXEC_HOST=app`, um `system.run` über den Exec-Host der Begleit-App zu routen; fügen Sie
  `OPENCLAW_NODE_EXEC_FALLBACK=0` hinzu, um den App-Host zu erzwingen und fail-closed zu sein, wenn er nicht verfügbar ist.
- Fügen Sie `--tls` / `--tls-fingerprint` hinzu, wenn der Gateway-WS TLS verwendet.

## Mac-Node-Modus

- Die macOS-Menubar-App verbindet sich als Node mit dem WS-Server des Gateway (sodass `openclaw nodes …` gegen diesen Mac funktioniert).
- Im Remote-Modus öffnet die App einen SSH-Tunnel für den Gateway-Port und verbindet sich mit `localhost`.
