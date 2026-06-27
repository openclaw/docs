---
read_when:
    - iOS-/Android-Knoten mit einem Gateway koppeln
    - Node-Canvas/Kamera für Agentenkontext verwenden
    - Neue Node-Befehle oder CLI-Hilfsfunktionen hinzufügen
summary: 'Nodes: Kopplung, Fähigkeiten, Berechtigungen und CLI-Hilfsprogramme für Canvas/Kamera/Bildschirm/Gerät/Benachrichtigungen/System'
title: Nodes
x-i18n:
    generated_at: "2026-06-27T17:40:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

Ein **Node** ist ein Begleitgerät (macOS/iOS/Android/headless), das sich mit dem Gateway-**WebSocket** (derselbe Port wie für Operatoren) mit `role: "node"` verbindet und über `node.invoke` eine Befehlsoberfläche bereitstellt (z. B. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`). Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

Legacy-Transport: [Bridge-Protokoll](/de/gateway/bridge-protocol) (TCP JSONL;
nur historisch für aktuelle Nodes).

macOS kann auch im **Node-Modus** ausgeführt werden: Die Menüleisten-App verbindet sich mit dem
WS-Server des Gateway und stellt ihre lokalen Canvas-/Kamera-Befehle als Node bereit (sodass
`openclaw nodes …` für diesen Mac funktioniert). Im Remote-Gateway-Modus wird
Browserautomatisierung vom CLI-Node-Host (`openclaw node run` oder dem
installierten Node-Dienst) verarbeitet, nicht vom nativen App-Node.

Hinweise:

- Nodes sind **Peripheriegeräte**, keine Gateways. Sie führen den Gateway-Dienst nicht aus.
- Telegram-/WhatsApp-/usw.-Nachrichten landen auf dem **Gateway**, nicht auf Nodes.
- Runbook zur Fehlerbehebung: [/nodes/troubleshooting](/de/nodes/troubleshooting)

## Kopplung + Status

**WS-Nodes verwenden Gerätekopplung.** Nodes präsentieren während `connect` eine Geräteidentität; das Gateway
erstellt eine Gerätekopplungsanfrage für `role: node`. Genehmigen Sie sie über die Geräte-CLI (oder UI).

Schnelle CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Wenn ein Node mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht,
sich zu verbinden, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie
`openclaw devices list` vor der Genehmigung erneut aus.

Hinweise:

- `nodes status` markiert einen Node als **gekoppelt**, wenn seine Gerätekopplungsrolle `node` enthält.
- Der Gerätekopplungseintrag ist der dauerhafte Vertrag für genehmigte Rollen. Token-
  Rotation bleibt innerhalb dieses Vertrags; sie kann einen gekoppelten Node nicht in eine
  andere Rolle hochstufen, die durch die Kopplungsgenehmigung nie gewährt wurde.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) ist ein separater Gateway-eigener
  Node-Kopplungsspeicher; er steuert **nicht** den WS-`connect`-Handshake.
- `openclaw nodes remove --node <id|name|ip>` entfernt eine Node-Kopplung. Für einen
  gerätegestützten Node widerruft es die `node`-Rolle des Geräts in `devices/paired.json`
  und trennt die Node-Rollen-Sitzungen dieses Geräts — ein Gerät mit gemischten Rollen behält
  seine Zeile und verliert nur die `node`-Rolle, während eine reine Node-Gerätezeile
  gelöscht wird. Außerdem wird jeder passende Eintrag aus dem separaten Gateway-eigenen Node-
  Kopplungsspeicher entfernt. `operator.pairing` darf Nicht-Operator-Node-Zeilen entfernen; ein
  Geräte-Token-Aufrufer, der seine eigene Node-Rolle auf einem Gerät mit gemischten Rollen widerruft,
  benötigt zusätzlich `operator.admin`.
- Der Genehmigungsumfang folgt den deklarierten Befehlen der ausstehenden Anfrage:
  - Anfrage ohne Befehle: `operator.pairing`
  - Nicht-Exec-Node-Befehle: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Remote-Node-Host (system.run)

Verwenden Sie einen **Node-Host**, wenn Ihr Gateway auf einem Computer ausgeführt wird und Befehle
auf einem anderen ausgeführt werden sollen. Das Modell spricht weiterhin mit dem **Gateway**; das Gateway
leitet `exec`-Aufrufe an den **Node-Host** weiter, wenn `host=node` ausgewählt ist.

### Was wo ausgeführt wird

- **Gateway-Host**: empfängt Nachrichten, führt das Modell aus, leitet Tool-Aufrufe weiter.
- **Node-Host**: führt `system.run`/`system.which` auf dem Node-Computer aus.
- **Genehmigungen**: werden auf dem Node-Host über `~/.openclaw/exec-approvals.json` erzwungen.

Hinweis zu Genehmigungen:

- Genehmigungsbasierte Node-Ausführungen binden den exakten Anfragekontext.
- Für direkte Shell-/Runtime-Dateiausführungen bindet OpenClaw nach bestem Bemühen außerdem einen konkreten lokalen
  Dateioperanden und verweigert die Ausführung, wenn sich diese Datei vor der Ausführung ändert.
- Wenn OpenClaw für einen Interpreter-/Runtime-Befehl nicht genau eine konkrete lokale Datei identifizieren kann,
  wird die genehmigungsbasierte Ausführung verweigert, statt vollständige Runtime-Abdeckung vorzutäuschen. Verwenden Sie Sandboxing,
  separate Hosts oder eine explizite vertrauenswürdige Allowlist/einen vollständigen Workflow für breitere Interpreter-Semantik.

### Node-Host starten (Vordergrund)

Auf dem Node-Computer:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Remote-Gateway über SSH-Tunnel (Loopback-Bindung)

Wenn das Gateway an Loopback gebunden ist (`gateway.bind=loopback`, Standard im lokalen Modus),
können Remote-Node-Hosts keine direkte Verbindung herstellen. Erstellen Sie einen SSH-Tunnel und richten Sie den
Node-Host auf das lokale Ende des Tunnels.

Beispiel (Node-Host -> Gateway-Host):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Hinweise:

- `openclaw node run` unterstützt Token- oder Passwort-Authentifizierung.
- Env vars werden bevorzugt: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Config-Fallback ist `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus ignoriert der Node-Host absichtlich `gateway.remote.token` / `gateway.remote.password`.
- Im Remote-Modus kommen `gateway.remote.token` / `gateway.remote.password` gemäß den Remote-Prioritätsregeln infrage.
- Wenn aktive lokale `gateway.auth.*`-SecretRefs konfiguriert, aber nicht aufgelöst sind, schlägt die Node-Host-Authentifizierung geschlossen fehl.
- Die Authentifizierungsauflösung des Node-Hosts berücksichtigt nur `OPENCLAW_GATEWAY_*`-Env vars.

### Node-Host starten (Dienst)

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

Wenn der Node es mit geänderten Authentifizierungsdetails erneut versucht, führen Sie `openclaw devices list`
erneut aus und genehmigen Sie die aktuelle `requestId`.

Benennungsoptionen:

- `--display-name` bei `openclaw node run` / `openclaw node install` (wird auf dem Node in `~/.openclaw/node.json` persistiert).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (Gateway-Override).

### Befehle auf die Allowlist setzen

Exec-Genehmigungen gelten **pro Node-Host**. Fügen Sie Allowlist-Einträge vom Gateway hinzu:

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

Nach der Einrichtung wird jeder `exec`-Aufruf mit `host=node` auf dem Node-Host ausgeführt (abhängig von der
Node-Allowlist/den Genehmigungen).

`host=auto` wählt den Node nicht implizit selbst aus, aber eine explizite Anfrage pro Aufruf mit `host=node` ist aus `auto` erlaubt. Wenn Node-Exec der Standard für die Sitzung sein soll, setzen Sie `tools.exec.host=node` oder `/exec host=node ...` explizit.

Verwandt:

- [Node-Host-CLI](/de/cli/node)
- [Exec-Tool](/de/tools/exec)
- [Exec-Genehmigungen](/de/tools/exec-approvals)

## Befehle aufrufen

Low-Level (rohes RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Für die gängigen Workflows „dem Agenten einen MEDIA-Anhang geben“ gibt es Higher-Level-Helfer.

## Befehlsrichtlinie

Node-Befehle müssen zwei Prüfungen bestehen, bevor sie aufgerufen werden können:

1. Der Node muss den Befehl in seiner WebSocket-`connect.commands`-Liste deklarieren.
2. Die Plattformrichtlinie des Gateway muss den deklarierten Befehl erlauben.

Windows- und macOS-Begleit-Nodes erlauben standardmäßig sichere deklarierte Befehle wie
`canvas.*`, `camera.list`, `location.get` und `screen.snapshot`.
Vertrauenswürdige Nodes, die die `talk`-Fähigkeit bewerben oder `talk.*`-Befehle deklarieren,
erlauben standardmäßig auch deklarierte Push-to-Talk-Befehle (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), unabhängig vom Plattformlabel.
Gefährliche oder datenschutzintensive Befehle wie `camera.snap`, `camera.clip` und
`screen.record` erfordern weiterhin ein explizites Opt-in mit
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` hat immer Vorrang vor
Standardwerten und zusätzlichen Allowlist-Einträgen.

Plugin-eigene Node-Befehle können eine Gateway-Node-Invoke-Richtlinie hinzufügen. Diese Richtlinie
läuft nach der Allowlist-Prüfung und vor der Weiterleitung an den Node, sodass rohes
`node.invoke`, CLI-Helfer und dedizierte Agent-Tools dieselbe Plugin-
Berechtigungsgrenze teilen. Gefährliche Plugin-Node-Befehle erfordern weiterhin ein explizites
`gateway.nodes.allowCommands`-Opt-in.

Nachdem ein Node seine deklarierte Befehlsliste geändert hat, lehnen Sie die alte Gerätekopplung ab
und genehmigen Sie die neue Anfrage, damit das Gateway den aktualisierten Befehls-Snapshot speichert.

## Config (`openclaw.json`)

Node-bezogene Einstellungen liegen unter `gateway.nodes` und `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Verwenden Sie exakte Node-Befehlsnamen. `denyCommands` entfernt einen Befehl auch dann, wenn ein
Plattformstandard oder ein `allowCommands`-Eintrag ihn sonst erlauben würde. Siehe
[Gateway-Konfigurationsreferenz](/de/gateway/configuration-reference#gateway-field-details)
für Details zu Gateway-Node-Kopplungs- und Befehlsrichtlinienfeldern.

Exec-Node-Override pro Agent:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Screenshots (Canvas-Snapshots)

Wenn der Node die Canvas (WebView) anzeigt, gibt `canvas.snapshot` `{ format, base64 }` zurück.

CLI-Helfer (schreibt in eine temporäre Datei und gibt den gespeicherten Pfad aus):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas-Steuerungen

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Hinweise:

- `canvas present` akzeptiert URLs oder lokale Dateipfade (`--target`) sowie optional `--x/--y/--width/--height` für die Positionierung.
- `canvas eval` akzeptiert Inline-JS (`--js`) oder ein Positionsargument.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Hinweise:

- Mobile Nodes verwenden eine gebündelte App-eigene A2UI-Seite für aktionsfähiges Rendering.
- Nur A2UI v0.8 JSONL wird unterstützt (v0.9/createSurface wird abgelehnt).
- iOS und Android rendern Remote-Gateway-Canvas-Seiten, aber A2UI-Button-Aktionen werden nur von der gebündelten App-eigenen A2UI-Seite ausgelöst. Gateway-gehostete HTTP/HTTPS-A2UI-Seiten sind auf diesen mobilen Clients nur für die Darstellung vorgesehen.

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
- Die Clipdauer wird begrenzt (derzeit `<= 60s`), um zu große base64-Payloads zu vermeiden.
- Android fordert nach Möglichkeit `CAMERA`-/`RECORD_AUDIO`-Berechtigungen an; verweigerte Berechtigungen schlagen mit `*_PERMISSION_REQUIRED` fehl.

## Bildschirmaufzeichnungen (Nodes)

Unterstützte Nodes stellen `screen.record` (`mp4`) bereit. Beispiel:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Hinweise:

- Die Verfügbarkeit von `screen.record` hängt von der Node-Plattform ab.
- Bildschirmaufzeichnungen werden auf `<= 60s` begrenzt.
- `--no-audio` deaktiviert die Mikrofonaufnahme auf unterstützten Plattformen.
- Verwenden Sie `--screen <index>`, um eine Anzeige auszuwählen, wenn mehrere Bildschirme verfügbar sind.

## Standort (Nodes)

Nodes stellen `location.get` bereit, wenn Standort in den Einstellungen aktiviert ist.

CLI-Helfer:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Hinweise:

- Standort ist **standardmäßig deaktiviert**.
- „Immer“ erfordert eine Systemberechtigung; Abrufe im Hintergrund erfolgen nach Best-Effort.
- Die Antwort enthält Breiten-/Längengrad, Genauigkeit (Meter) und Zeitstempel.

## SMS (Android-Nodes)

Android-Nodes können `sms.send` bereitstellen, wenn der Nutzer die **SMS**-Berechtigung erteilt und das Gerät Telefonie unterstützt.

Low-Level-Aufruf:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Hinweise:

- Die Berechtigungsabfrage muss auf dem Android-Gerät akzeptiert werden, bevor die Capability angeboten wird.
- Geräte ohne Telefonie, die nur Wi-Fi unterstützen, bieten `sms.send` nicht an.

## Android-Geräte- und persönliche Datenbefehle

Android-Nodes können zusätzliche Befehlsfamilien anbieten, wenn die entsprechenden Capabilities aktiviert sind.

Verfügbare Familien:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps`, wenn die Freigabe installierter Apps in den Android-Einstellungen aktiviert ist
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
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Hinweise:

- `device.apps` ist Opt-in und gibt standardmäßig im Launcher sichtbare Apps zurück.
- Bewegungsbefehle werden durch verfügbare Sensoren Capability-gesteuert freigeschaltet.

## Systembefehle (Node-Host / Mac-Node)

Der macOS-Node stellt `system.run`, `system.notify` und `system.execApprovals.get/set` bereit.
Der Headless-Node-Host stellt `system.run`, `system.which` und `system.execApprovals.get/set` bereit.

Beispiele:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Hinweise:

- `system.run` gibt stdout/stderr/Exit-Code im Payload zurück.
- Shell-Ausführung läuft jetzt über das `exec`-Tool mit `host=node`; `nodes` bleibt die direkte RPC-Oberfläche für explizite Node-Befehle.
- `nodes invoke` stellt `system.run` oder `system.run.prepare` nicht bereit; diese bleiben ausschließlich auf dem Exec-Pfad.
- Der Exec-Pfad erstellt vor der Genehmigung einen kanonischen `systemRunPlan`. Sobald eine
  Genehmigung erteilt wurde, leitet der Gateway diesen gespeicherten Plan weiter, nicht später
  vom Aufrufer bearbeitete Befehls-/cwd-/session-Felder.
- `system.notify` berücksichtigt den Status der Benachrichtigungsberechtigung in der macOS-App.
- Nicht erkannte Node-Metadaten für `platform` / `deviceFamily` verwenden eine konservative Standard-Allowlist, die `system.run` und `system.which` ausschließt. Wenn Sie diese Befehle absichtlich für eine unbekannte Plattform benötigen, fügen Sie sie explizit über `gateway.nodes.allowCommands` hinzu.
- `system.run` unterstützt `--cwd`, `--env KEY=VAL`, `--command-timeout` und `--needs-screen-recording`.
- Für Shell-Wrapper (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene `--env`-Werte auf eine explizite Allowlist reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei Immer-erlauben-Entscheidungen im Allowlist-Modus persistieren bekannte Dispatch-Wrapper (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) die inneren ausführbaren Pfade statt der Wrapper-Pfade. Wenn das Entpacken nicht sicher ist, wird automatisch kein Allowlist-Eintrag persistiert.
- Auf Windows-Node-Hosts im Allowlist-Modus benötigen Shell-Wrapper-Ausführungen über `cmd.exe /c` eine Genehmigung (ein Allowlist-Eintrag allein erlaubt die Wrapper-Form nicht automatisch).
- `system.notify` unterstützt `--priority <passive|active|timeSensitive>` und `--delivery <system|overlay|auto>`.
- Node-Hosts ignorieren `PATH`-Überschreibungen und entfernen gefährliche Start-/Shell-Schlüssel (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Wenn Sie zusätzliche PATH-Einträge benötigen, konfigurieren Sie stattdessen die Service-Umgebung des Node-Hosts (oder installieren Sie Tools an Standardorten), anstatt `PATH` über `--env` zu übergeben.
- Im macOS-Node-Modus wird `system.run` durch Exec-Genehmigungen in der macOS-App gesteuert (Einstellungen → Exec-Genehmigungen).
  Fragen/Allowlist/Vollzugriff verhalten sich genauso wie beim Headless-Node-Host; abgelehnte Aufforderungen geben `SYSTEM_RUN_DENIED` zurück.
- Auf dem Headless-Node-Host wird `system.run` durch Exec-Genehmigungen (`~/.openclaw/exec-approvals.json`) gesteuert.

## Exec-Node-Bindung

Wenn mehrere Nodes verfügbar sind, können Sie Exec an einen bestimmten Node binden.
Dies legt den Standard-Node für `exec host=node` fest (und kann pro Agent überschrieben werden).

Globaler Standard:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Überschreibung pro Agent:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Aufheben, um beliebige Nodes zuzulassen:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Berechtigungskarte

Nodes können in `node.list` / `node.describe` eine `permissions`-Karte enthalten, nach Berechtigungsname (z. B. `screenRecording`, `accessibility`) mit booleschen Werten (`true` = erteilt) indiziert.

## Headless-Node-Host (plattformübergreifend)

OpenClaw kann einen **Headless-Node-Host** (ohne UI) ausführen, der sich mit dem Gateway-
WebSocket verbindet und `system.run` / `system.which` bereitstellt. Dies ist auf Linux/Windows
oder zum Ausführen eines minimalen Nodes neben einem Server nützlich.

Starten:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Hinweise:

- Pairing ist weiterhin erforderlich (der Gateway zeigt eine Aufforderung zum Geräte-Pairing an).
- Der Node-Host speichert seine Node-ID, sein Token, seinen Anzeigenamen und Gateway-Verbindungsinformationen in `~/.openclaw/node.json`.
- Exec-Genehmigungen werden lokal über `~/.openclaw/exec-approvals.json` erzwungen
  (siehe [Exec-Genehmigungen](/de/tools/exec-approvals)).
- Auf macOS führt der Headless-Node-Host `system.run` standardmäßig lokal aus. Setzen Sie
  `OPENCLAW_NODE_EXEC_HOST=app`, um `system.run` über den Exec-Host der Begleit-App zu leiten; fügen Sie
  `OPENCLAW_NODE_EXEC_FALLBACK=0` hinzu, um den App-Host zu erzwingen und geschlossen fehlzuschlagen, wenn er nicht verfügbar ist.
- Fügen Sie `--tls` / `--tls-fingerprint` hinzu, wenn der Gateway WS TLS verwendet.

## Mac-Node-Modus

- Die macOS-Menüleisten-App verbindet sich als Node mit dem Gateway WS-Server (sodass `openclaw nodes …` mit diesem Mac funktioniert).
- Im Remote-Modus öffnet die App einen SSH-Tunnel für den Gateway-Port und verbindet sich mit `localhost`.
