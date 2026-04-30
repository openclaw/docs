---
read_when:
    - iOS-/Android-Nodes mit einem Gateway koppeln
    - Node-Canvas/Kamera für den Agent-Kontext verwenden
    - Neue Node-Befehle oder CLI-Hilfsprogramme hinzufügen
summary: 'Nodes: Kopplung, Fähigkeiten, Berechtigungen und CLI-Helfer für canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-04-30T07:02:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

Ein **Node** ist ein Begleitgerät (macOS/iOS/Android/headless), das sich mit dem Gateway-**WebSocket** (derselbe Port wie für Operatoren) mit `role: "node"` verbindet und über `node.invoke` eine Befehlsoberfläche bereitstellt (z. B. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`). Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

Legacy-Transport: [Bridge-Protokoll](/de/gateway/bridge-protocol) (TCP JSONL;
historisch nur für aktuelle Nodes).

macOS kann auch im **Node-Modus** ausgeführt werden: Die Menüleisten-App verbindet sich mit dem WS-Server des Gateway und stellt ihre lokalen Canvas-/Kamera-Befehle als Node bereit (sodass
`openclaw nodes …` mit diesem Mac funktioniert). Im Remote-Gateway-Modus wird die Browser-Automatisierung vom CLI-Node-Host (`openclaw node run` oder dem installierten Node-Dienst) übernommen, nicht vom nativen App-Node.

Hinweise:

- Nodes sind **Peripheriegeräte**, keine Gateways. Sie führen den Gateway-Dienst nicht aus.
- Telegram-/WhatsApp-/usw.-Nachrichten landen auf dem **Gateway**, nicht auf Nodes.
- Runbook zur Fehlerbehebung: [/nodes/troubleshooting](/de/nodes/troubleshooting)

## Koppeln + Status

**WS-Nodes verwenden Gerätekopplung.** Nodes präsentieren während `connect` eine Geräteidentität; das Gateway erstellt eine Gerätekopplungsanfrage für `role: node`. Genehmigen Sie sie über die Geräte-CLI (oder UI).

Schnelle CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Wenn ein Node mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht, sich zu verbinden, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut
`openclaw devices list` aus.

Hinweise:

- `nodes status` markiert einen Node als **gekoppelt**, wenn seine Gerätekopplungsrolle `node` enthält.
- Der Gerätekopplungsdatensatz ist der dauerhafte Vertrag für genehmigte Rollen. Die Token-Rotation bleibt innerhalb dieses Vertrags; sie kann einen gekoppelten Node nicht in eine andere Rolle hochstufen, die durch die Kopplungsgenehmigung nie gewährt wurde.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) ist ein separater, Gateway-eigener Node-Kopplungsspeicher; er steuert **nicht** den WS-`connect`-Handshake.
- `openclaw nodes remove --node <id|name|ip>` löscht veraltete Einträge aus diesem separaten, Gateway-eigenen Node-Kopplungsspeicher.
- Der Genehmigungsumfang folgt den deklarierten Befehlen der ausstehenden Anfrage:
  - Anfrage ohne Befehle: `operator.pairing`
  - Nicht-Exec-Node-Befehle: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Remote-Node-Host (system.run)

Verwenden Sie einen **Node-Host**, wenn Ihr Gateway auf einem Rechner läuft und Befehle auf einem anderen ausgeführt werden sollen. Das Modell spricht weiterhin mit dem **Gateway**; das Gateway leitet `exec`-Aufrufe an den **Node-Host** weiter, wenn `host=node` ausgewählt ist.

### Was wo läuft

- **Gateway-Host**: empfängt Nachrichten, führt das Modell aus, leitet Tool-Aufrufe weiter.
- **Node-Host**: führt `system.run`/`system.which` auf dem Node-Rechner aus.
- **Genehmigungen**: werden auf dem Node-Host über `~/.openclaw/exec-approvals.json` erzwungen.

Hinweis zu Genehmigungen:

- Genehmigungsbasierte Node-Ausführungen binden den exakten Anfragekontext.
- Für direkte Shell-/Runtime-Dateiausführungen bindet OpenClaw außerdem nach bestem Aufwand einen konkreten lokalen Dateioperanden und verweigert die Ausführung, wenn sich diese Datei vor der Ausführung ändert.
- Wenn OpenClaw für einen Interpreter-/Runtime-Befehl nicht genau eine konkrete lokale Datei identifizieren kann, wird die genehmigungsbasierte Ausführung verweigert, statt eine vollständige Runtime-Abdeckung vorzutäuschen. Verwenden Sie Sandboxing, separate Hosts oder eine explizite vertrauenswürdige Allowlist/einen vollständigen Workflow für breitere Interpreter-Semantik.

### Einen Node-Host starten (Vordergrund)

Auf dem Node-Rechner:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Remote-Gateway über SSH-Tunnel (loopback-Bind)

Wenn das Gateway an loopback bindet (`gateway.bind=loopback`, Standard im lokalen Modus), können Remote-Node-Hosts keine direkte Verbindung herstellen. Erstellen Sie einen SSH-Tunnel und richten Sie den Node-Host auf das lokale Ende des Tunnels aus.

Beispiel (Node-Host -> Gateway-Host):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Hinweise:

- `openclaw node run` unterstützt Token- oder Passwortauthentifizierung.
- Env-Vars werden bevorzugt: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Der Config-Fallback ist `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus ignoriert der Node-Host absichtlich `gateway.remote.token` / `gateway.remote.password`.
- Im Remote-Modus kommen `gateway.remote.token` / `gateway.remote.password` gemäß den Remote-Prioritätsregeln infrage.
- Wenn aktive lokale `gateway.auth.*`-SecretRefs konfiguriert, aber nicht aufgelöst sind, schlägt die Node-Host-Authentifizierung geschlossen fehl.
- Die Authentifizierungsauflösung des Node-Hosts berücksichtigt nur `OPENCLAW_GATEWAY_*`-Env-Vars.

### Einen Node-Host starten (Dienst)

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

Wenn der Node mit geänderten Authentifizierungsdetails erneut versucht, sich zu verbinden, führen Sie erneut `openclaw devices list` aus und genehmigen Sie die aktuelle `requestId`.

Benennungsoptionen:

- `--display-name` bei `openclaw node run` / `openclaw node install` (bleibt auf dem Node in `~/.openclaw/node.json` erhalten).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (Gateway-Override).

### Befehle auf die Allowlist setzen

Exec-Genehmigungen gelten **pro Node-Host**. Fügen Sie Allowlist-Einträge vom Gateway aus hinzu:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Genehmigungen liegen auf dem Node-Host unter `~/.openclaw/exec-approvals.json`.

### Exec auf den Node ausrichten

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

Sobald dies gesetzt ist, läuft jeder `exec`-Aufruf mit `host=node` auf dem Node-Host (vorbehaltlich der Node-Allowlist/Genehmigungen).

`host=auto` wählt den Node nicht automatisch von selbst aus, aber eine explizite Anfrage pro Aufruf mit `host=node` ist aus `auto` heraus zulässig. Wenn Node-Exec der Standard für die Sitzung sein soll, setzen Sie explizit `tools.exec.host=node` oder `/exec host=node ...`.

Verwandt:

- [Node-Host-CLI](/de/cli/node)
- [Exec-Tool](/de/tools/exec)
- [Exec-Genehmigungen](/de/tools/exec-approvals)

## Befehle aufrufen

Niedrige Ebene (rohes RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Für die gängigen Workflows „dem Agenten einen MEDIA-Anhang geben“ gibt es höherwertige Helper.

## Befehlsrichtlinie

Node-Befehle müssen zwei Gates passieren, bevor sie aufgerufen werden können:

1. Der Node muss den Befehl in seiner WebSocket-Liste `connect.commands` deklarieren.
2. Die Plattformrichtlinie des Gateway muss den deklarierten Befehl erlauben.

Windows- und macOS-Begleit-Nodes erlauben standardmäßig sichere deklarierte Befehle wie
`canvas.*`, `camera.list`, `location.get` und `screen.snapshot`.
Gefährliche oder besonders datenschutzrelevante Befehle wie `camera.snap`, `camera.clip` und
`screen.record` erfordern weiterhin ein explizites Opt-in mit
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` hat immer Vorrang vor Standardwerten und zusätzlichen Allowlist-Einträgen.

Plugin-eigene Node-Befehle können eine Gateway-Node-Invoke-Richtlinie hinzufügen. Diese Richtlinie läuft nach der Allowlist-Prüfung und vor der Weiterleitung an den Node, sodass rohes
`node.invoke`, CLI-Helper und dedizierte Agenten-Tools dieselbe Plugin-Berechtigungsgrenze teilen. Gefährliche Plugin-Node-Befehle erfordern weiterhin ein explizites Opt-in mit
`gateway.nodes.allowCommands`.

Nachdem ein Node seine deklarierte Befehlsliste geändert hat, lehnen Sie die alte Gerätekopplung ab und genehmigen Sie die neue Anfrage, damit das Gateway den aktualisierten Befehlssnapshot speichert.

## Screenshots (Canvas-Snapshots)

Wenn der Node den Canvas (WebView) anzeigt, gibt `canvas.snapshot` `{ format, base64 }` zurück.

CLI-Helper (schreibt in eine temporäre Datei und gibt `MEDIA:<path>` aus):

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

- `canvas present` akzeptiert URLs oder lokale Dateipfade (`--target`) sowie optional `--x/--y/--width/--height` zur Positionierung.
- `canvas eval` akzeptiert Inline-JS (`--js`) oder ein Positionsargument.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Hinweise:

- Es wird nur A2UI v0.8 JSONL unterstützt (v0.9/createSurface wird abgelehnt).

## Fotos + Videos (Node-Kamera)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Videoclips (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Hinweise:

- Der Node muss für `canvas.*` und `camera.*` **im Vordergrund** sein (Hintergrundaufrufe geben `NODE_BACKGROUND_UNAVAILABLE` zurück).
- Die Clipdauer wird begrenzt (derzeit `<= 60s`), um übergroße base64-Payloads zu vermeiden.
- Android fragt nach Möglichkeit nach `CAMERA`-/`RECORD_AUDIO`-Berechtigungen; verweigerte Berechtigungen schlagen mit `*_PERMISSION_REQUIRED` fehl.

## Bildschirmaufzeichnungen (Nodes)

Unterstützte Nodes stellen `screen.record` (mp4) bereit. Beispiel:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Hinweise:

- Die Verfügbarkeit von `screen.record` hängt von der Node-Plattform ab.
- Bildschirmaufzeichnungen werden auf `<= 60s` begrenzt.
- `--no-audio` deaktiviert die Mikrofonaufnahme auf unterstützten Plattformen.
- Verwenden Sie `--screen <index>`, um ein Display auszuwählen, wenn mehrere Bildschirme verfügbar sind.

## Standort (Nodes)

Nodes stellen `location.get` bereit, wenn Standort in den Einstellungen aktiviert ist.

CLI-Helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Hinweise:

- Standort ist **standardmäßig deaktiviert**.
- „Immer“ erfordert eine Systemberechtigung; Abruf im Hintergrund erfolgt nach bestem Aufwand.
- Die Antwort enthält Lat/Lon, Genauigkeit (Meter) und Zeitstempel.

## SMS (Android-Nodes)

Android-Nodes können `sms.send` bereitstellen, wenn der Benutzer die **SMS**-Berechtigung gewährt und das Gerät Telefonie unterstützt.

Aufruf auf niedriger Ebene:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Hinweise:

- Die Berechtigungsanfrage muss auf dem Android-Gerät akzeptiert werden, bevor die Fähigkeit angekündigt wird.
- Geräte nur mit WLAN ohne Telefonie kündigen `sms.send` nicht an.

## Android-Geräte- + persönliche Datenbefehle

Android-Nodes können zusätzliche Befehlsfamilien ankündigen, wenn die entsprechenden Fähigkeiten aktiviert sind.

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

- Bewegungsbefehle sind durch die verfügbaren Sensoren nach Capability freigeschaltet.

## Systembefehle (Node-Host / Mac-Node)

Der macOS-Node stellt `system.run`, `system.notify` und `system.execApprovals.get/set` bereit.
Der Headless-Node-Host stellt `system.run`, `system.which` und `system.execApprovals.get/set` bereit.

Beispiele:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Hinweise:

- `system.run` gibt stdout/stderr/Exit-Code in der Nutzlast zurück.
- Shell-Ausführung läuft jetzt über das Tool `exec` mit `host=node`; `nodes` bleibt die direkte RPC-Oberfläche für explizite Node-Befehle.
- `nodes invoke` stellt `system.run` oder `system.run.prepare` nicht bereit; diese bleiben ausschließlich auf dem Exec-Pfad.
- Der Exec-Pfad bereitet vor der Genehmigung einen kanonischen `systemRunPlan` vor. Sobald eine
  Genehmigung erteilt wurde, leitet das Gateway diesen gespeicherten Plan weiter, nicht später
  vom Aufrufer bearbeitete command/cwd/session-Felder.
- `system.notify` berücksichtigt den Status der Mitteilungsberechtigung in der macOS-App.
- Nicht erkannte Node-Metadaten für `platform` / `deviceFamily` verwenden eine konservative Standard-Allowlist, die `system.run` und `system.which` ausschließt. Wenn Sie diese Befehle absichtlich für eine unbekannte Plattform benötigen, fügen Sie sie explizit über `gateway.nodes.allowCommands` hinzu.
- `system.run` unterstützt `--cwd`, `--env KEY=VAL`, `--command-timeout` und `--needs-screen-recording`.
- Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene `--env`-Werte auf eine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei „immer erlauben“-Entscheidungen im Allowlist-Modus speichern bekannte Dispatch-Wrapper (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) die inneren ausführbaren Pfade statt der Wrapper-Pfade. Wenn das Entpacken nicht sicher ist, wird automatisch kein Allowlist-Eintrag gespeichert.
- Auf Windows-Node-Hosts im Allowlist-Modus erfordern Shell-Wrapper-Ausführungen über `cmd.exe /c` eine Genehmigung (ein Allowlist-Eintrag allein erlaubt die Wrapper-Form nicht automatisch).
- `system.notify` unterstützt `--priority <passive|active|timeSensitive>` und `--delivery <system|overlay|auto>`.
- Node-Hosts ignorieren `PATH`-Überschreibungen und entfernen gefährliche Start-/Shell-Schlüssel (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Wenn Sie zusätzliche PATH-Einträge benötigen, konfigurieren Sie die Dienstumgebung des Node-Hosts (oder installieren Sie Tools an Standardorten), statt `PATH` über `--env` zu übergeben.
- Im macOS-Node-Modus wird `system.run` durch Exec-Genehmigungen in der macOS-App geschützt (Einstellungen → Exec-Genehmigungen).
  Ask/allowlist/full verhalten sich genauso wie beim Headless-Node-Host; abgelehnte Prompts geben `SYSTEM_RUN_DENIED` zurück.
- Auf dem Headless-Node-Host wird `system.run` durch Exec-Genehmigungen geschützt (`~/.openclaw/exec-approvals.json`).

## Exec-Node-Bindung

Wenn mehrere Nodes verfügbar sind, können Sie Exec an einen bestimmten Node binden.
Dadurch wird der Standard-Node für `exec host=node` festgelegt (und kann pro Agent überschrieben werden).

Globale Standardeinstellung:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Überschreibung pro Agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Aufheben, um jeden Node zuzulassen:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Berechtigungszuordnung

Nodes können in `node.list` / `node.describe` eine `permissions`-Zuordnung enthalten, indiziert nach Berechtigungsname (z. B. `screenRecording`, `accessibility`) mit booleschen Werten (`true` = erteilt).

## Headless-Node-Host (plattformübergreifend)

OpenClaw kann einen **Headless-Node-Host** (ohne UI) ausführen, der eine Verbindung zum Gateway-
WebSocket herstellt und `system.run` / `system.which` bereitstellt. Das ist unter Linux/Windows
oder zum Ausführen eines minimalen Node neben einem Server nützlich.

Starten Sie ihn:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Hinweise:

- Pairing ist weiterhin erforderlich (das Gateway zeigt einen Prompt zur Gerätekopplung an).
- Der Node-Host speichert seine Node-ID, sein Token, seinen Anzeigenamen und seine Gateway-Verbindungsinformationen in `~/.openclaw/node.json`.
- Exec-Genehmigungen werden lokal über `~/.openclaw/exec-approvals.json` erzwungen
  (siehe [Exec-Genehmigungen](/de/tools/exec-approvals)).
- Unter macOS führt der Headless-Node-Host `system.run` standardmäßig lokal aus. Setzen Sie
  `OPENCLAW_NODE_EXEC_HOST=app`, um `system.run` über den Exec-Host der Begleit-App zu leiten; fügen Sie
  `OPENCLAW_NODE_EXEC_FALLBACK=0` hinzu, um den App-Host vorauszusetzen und geschlossen fehlzuschlagen, wenn er nicht verfügbar ist.
- Fügen Sie `--tls` / `--tls-fingerprint` hinzu, wenn das Gateway-WS TLS verwendet.

## Mac-Node-Modus

- Die macOS-Menüleisten-App verbindet sich als Node mit dem Gateway-WS-Server (sodass `openclaw nodes …` mit diesem Mac funktioniert).
- Im Remote-Modus öffnet die App einen SSH-Tunnel für den Gateway-Port und verbindet sich mit `localhost`.
