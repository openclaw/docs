---
read_when:
    - iOS-/watchOS-/Android-Nodes mit einem Gateway koppeln
    - Node-Canvas/Kamera für den Agentenkontext verwenden
    - Neue Node-Befehle oder CLI-Hilfsfunktionen hinzufügen
summary: 'Nodes: Kopplung, Funktionen, Berechtigungen und CLI-Hilfen für Canvas/Kamera/Bildschirm/Gerät/Benachrichtigungen/System'
title: Nodes
x-i18n:
    generated_at: "2026-07-12T15:35:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b59e34e93ec38c69d0cee274d2366eef22c6ff6619a8aea3c2d4a75721865b72
    source_path: nodes/index.md
    workflow: 16
---

Ein **Node** ist ein Begleitgerät (macOS/iOS/watchOS/Android/headless), das sich mit `role: "node"` mit dem Gateway verbindet und über `node.invoke` eine Befehlsoberfläche (z. B. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) bereitstellt. Die meisten Nodes verwenden den Gateway-WebSocket am Operator-Port. Der optionale direkte Apple-Watch-Node verwendet signiertes HTTPS-Polling am selben Port, da watchOS generische Low-Level-Netzwerkkommunikation für gewöhnliche Apps blockiert. Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

Veralteter Transport: [Bridge-Protokoll](/de/gateway/bridge-protocol) (TCP JSONL; für aktuelle Nodes nur noch von historischem Interesse).

macOS kann auch im **Node-Modus** ausgeführt werden: Die Menüleisten-App verbindet sich mit dem WS-Server des Gateways und stellt ihre lokalen Canvas-/Kamerabefehle als Node bereit (sodass `openclaw nodes …` für diesen Mac funktioniert). Im Remote-Gateway-Modus wird die Browserautomatisierung vom CLI-Node-Host (`openclaw node run` oder dem installierten Node-Dienst) übernommen, nicht vom Node der nativen App.

Nodes sind **Peripheriegeräte**, keine Gateways: Sie führen den Gateway-Dienst nicht aus, und Kanalnachrichten (Telegram, WhatsApp usw.) gehen beim Gateway ein, nicht bei Nodes.

Runbook zur Fehlerbehebung: [/nodes/troubleshooting](/de/nodes/troubleshooting)

## Kopplung und Status

Nodes verwenden die **Gerätekopplung**. Ein Node übermittelt beim Verbindungsaufbau eine signierte Geräteidentität; das Gateway erstellt eine Gerätekopplungsanfrage für `role: node`. Genehmigen Sie sie über die Geräte-CLI (oder die Benutzeroberfläche). Die direkte Apple-Watch-Einrichtung verwendet einen vom Administrator ausgestellten, kurzlebigen, ausschließlich für Nodes bestimmten Einrichtungscode, um ihre feste Befehlsoberfläche mit geringem Risiko zu genehmigen; eine spätere Erweiterung der Fähigkeiten erfordert weiterhin eine normale Genehmigung.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Ausstehende Kopplungsanfragen laufen 5 Minuten nach dem letzten erneuten Versuch des Geräts ab — ein Gerät, das fortlaufend versucht, die Verbindung wiederherzustellen, hält seine einzige ausstehende Anfrage (und `requestId`) aktiv, statt alle paar Minuten eine neue Aufforderung zu erzeugen; den vollständigen Lebenszyklus von Anfrage und Genehmigung finden Sie unter [Node-Kopplung](/de/gateway/pairing). Wenn ein Node den Versuch mit geänderten Authentifizierungsdetails (Rolle/Berechtigungsbereiche/öffentlicher Schlüssel) wiederholt, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt — Clients erhalten für die ersetzte Anfrage ein `device.pair.resolved`-Ereignis, und Sie sollten vor der Genehmigung erneut `openclaw devices list` ausführen.

- `nodes status` kennzeichnet einen Node als **gekoppelt**, wenn seine Gerätekopplungsrolle `node` umfasst.
- Ein verbundener nativer Mac mit Bedienungshilfen-Berechtigung kann zusammengefasste
  physische Eingabeaktivitäten melden. Das Gateway kennzeichnet den aktuellsten geeigneten Mac als
  `active`, stellt dem Agenten einen stabilen Hinweis auf die Node-ID bereit und leitet Warnungen zu
  Node-Verbindungen zuerst dorthin weiter, bevor ein verzögerter Fallback erfolgt. Informationen zu
  Einrichtung, Datenschutz, Zeitverhalten und Fehlerbehebung finden Sie unter
  [Präsenz des aktiven Computers](/de/nodes/presence).
- Der Gerätekopplungsdatensatz ist der dauerhafte Vertrag über die genehmigte Rolle. Die Token-Rotation bleibt innerhalb dieses Vertrags; sie kann einen gekoppelten Node nicht auf eine Rolle hochstufen, die bei der Kopplung nie genehmigt wurde.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) ist ein separater, Gateway-eigener Node-Kopplungsspeicher, der die genehmigte Befehls-/Fähigkeitsoberfläche des Nodes über erneute Verbindungen hinweg verfolgt. Er steuert **nicht** die Transportauthentifizierung — dies übernimmt die Gerätekopplung.
- `openclaw nodes remove --node <id|name|ip>` entfernt eine Node-Kopplung. Bei einem gerätegestützten Node entzieht der Befehl dem Gerät die Rolle `node` im Speicher gekoppelter Geräte und trennt die Sitzungen dieses Geräts mit der Node-Rolle: Ein Gerät mit mehreren Rollen behält seinen Eintrag und verliert nur die Rolle `node`, während der Eintrag eines Geräts, das ausschließlich ein Node ist, gelöscht wird. Außerdem wird jeder übereinstimmende Eintrag aus dem separaten Node-Kopplungsspeicher entfernt. `operator.pairing` kann Nicht-Operator-Node-Einträge auf anderen Geräten entfernen; ein Aufrufer mit Geräte-Token, der seine eigene Node-Rolle auf einem Gerät mit mehreren Rollen widerruft, benötigt zusätzlich `operator.admin`.
- Der Genehmigungsumfang richtet sich nach den in der ausstehenden Anfrage deklarierten Befehlen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Nicht-Ausführungsbefehle des Nodes: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Versionsabweichung und Upgrade-Reihenfolge

Der Gateway-WebSocket akzeptiert authentifizierte Node-Clients innerhalb eines N-1-Protokollfensters.
Das aktuelle v4-Gateway akzeptiert daher v3-Nodes, wenn die Verbindung sowohl
`role: "node"` als auch `client.mode: "node"` deklariert. Operator- und UI-Sitzungen müssen
weiterhin das aktuelle Protokoll verwenden.

Aktualisieren Sie bei gestaffelten Flotten-Upgrades zuerst das Gateway und anschließend jeden Node.
Ein N-1-Node bleibt während seines Upgrades sichtbar und verwaltbar; das Gateway
protokolliert `legacy node protocol accepted` zusammen mit einer Upgrade-Empfehlung. Kopplung,
Geräteauthentifizierung, Befehlsfreigabelisten und Ausführungsgenehmigungen gelten weiterhin.
Plugin-eigene Fähigkeiten und Befehle bleiben verborgen, bis der Node auf das
aktuelle Protokoll aktualisiert wurde. Nodes, die älter als N-1 sind, benötigen vor dem
erneuten Verbindungsaufbau ein Out-of-Band-Upgrade.

Der direkte watchOS-HTTPS-Transport erfordert die aktuelle Protokollversion; aktualisieren Sie
die Watch-App zusammen mit dem Gateway, bevor Sie den direkten Modus aktivieren.

## Remote-Node-Host (system.run)

Verwenden Sie einen **Node-Host**, wenn Ihr Gateway auf einem Rechner ausgeführt wird und Sie Befehle auf einem anderen ausführen möchten. Das Modell kommuniziert weiterhin mit dem **Gateway**; das Gateway leitet `exec`-Aufrufe an den **Node-Host** weiter, wenn `host=node` ausgewählt ist.

| Rolle        | Verantwortlichkeit                                                |
| ------------ | ----------------------------------------------------------------- |
| Gateway-Host | Empfängt Nachrichten, führt das Modell aus und leitet Tool-Aufrufe weiter. |
| Node-Host    | Führt `system.run`/`system.which` auf dem Node-Rechner aus.        |
| Genehmigungen | Werden auf dem Node-Host über `~/.openclaw/exec-approvals.json` durchgesetzt. |

Hinweis zu Genehmigungen:

- Genehmigungsgestützte Node-Ausführungen werden an den exakten Anfragekontext gebunden. Der Ausführungspfad bereitet vor der Genehmigung einen kanonischen `systemRunPlan` vor; nach der Erteilung leitet das Gateway diesen gespeicherten Plan weiter, nicht später vom Aufrufer bearbeitete Befehls-/cwd-/Sitzungsfelder, und validiert das Arbeitsverzeichnis vor der Ausführung erneut.
- Bei direkten Datei-Ausführungen über Shell oder Laufzeitumgebung bindet OpenClaw außerdem nach bestem Bemühen einen konkreten lokalen Dateioperanden und verweigert die Ausführung, wenn sich diese Datei vor der Ausführung ändert.
- Wenn OpenClaw für einen Interpreter-/Laufzeitbefehl nicht genau eine konkrete lokale Datei ermitteln kann, wird die genehmigungsgestützte Ausführung verweigert, statt eine vollständige Abdeckung der Laufzeitumgebung vorzutäuschen. Verwenden Sie für umfassendere Interpreter-Semantik Sandboxing, separate Hosts oder einen ausdrücklich vertrauenswürdigen Ablauf mit Freigabeliste bzw. vollständigem Workflow.

### Einen Node-Host starten (Vordergrund)

Auf dem Node-Rechner:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` akzeptiert außerdem `--context-path` (Gateway-WS-Kontextpfad), `--tls`, `--tls-fingerprint <sha256>` und `--node-id` (überschreibt die veraltete Clientinstanz-ID; dadurch wird die Kopplung nicht zurückgesetzt).

### Remote-Gateway über SSH-Tunnel (Loopback-Bindung)

Wenn das Gateway an Loopback gebunden ist (`gateway.bind=loopback`, Standard im lokalen Modus), können Remote-Node-Hosts keine direkte Verbindung herstellen. Erstellen Sie einen SSH-Tunnel und richten Sie den Node-Host auf das lokale Ende des Tunnels.

Beispiel (Node-Host -> Gateway-Host):

```bash
# Terminal A (weiterlaufen lassen): lokalen Port 18790 -> Gateway 127.0.0.1:18789 weiterleiten
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: Gateway-Token exportieren und über den Tunnel verbinden
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Hinweise:

- `openclaw node run` unterstützt die Authentifizierung per Token oder Passwort.
- Umgebungsvariablen werden bevorzugt: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Der Konfigurations-Fallback ist `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus ignoriert der Node-Host absichtlich `gateway.remote.token` / `gateway.remote.password`.
- Im Remote-Modus kommen `gateway.remote.token` / `gateway.remote.password` gemäß den Remote-Prioritätsregeln infrage.
- Wenn aktive lokale `gateway.auth.*`-SecretRefs konfiguriert, aber nicht aufgelöst sind, schlägt die Node-Host-Authentifizierung sicher geschlossen fehl.
- Die Auflösung der Node-Host-Authentifizierung berücksichtigt nur `OPENCLAW_GATEWAY_*`-Umgebungsvariablen.

### Einen Node-Host starten (Dienst)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` akzeptiert außerdem `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (nur veraltete Clientinstanz-ID), `--runtime <node|bun>` (Standard: node) und `--force` für eine Neuinstallation. `node status`, `node stop` und `node uninstall` sind ebenfalls verfügbar.

### Koppeln und benennen

Auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Wenn der Node den Versuch mit geänderten Authentifizierungsdetails wiederholt, führen Sie erneut `openclaw devices list` aus und genehmigen Sie die aktuelle `requestId`.

Benennungsoptionen:

- `--display-name` bei `openclaw node run` / `openclaw node install` (wird auf dem Node neben der Clientinstanz-ID und den Gateway-Verbindungsmetadaten in `~/.openclaw/node.json` gespeichert).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (Gateway-Überschreibung).

### Auf dem Node gehostete MCP-Server

Konfigurieren Sie MCP-Server in `openclaw.json` auf dem Node-Rechner, nicht auf dem
Gateway:

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

Der headless Node-Host startet diese Server, listet ihre Tools auf und veröffentlicht
die Deskriptoren nach dem Verbindungsaufbau. Tool-Aufrufe werden über
`mcp.tools.call.v1` an diesen Node zurückgeleitet; das Gateway benötigt weder eine passende MCP-Konfiguration noch ein JS-
Plugin. OAuth-MCP-Server werden von diesem auf dem Node gehosteten v1-Pfad nicht unterstützt.

Aktuelle Node-Hosts deklarieren die integrierte Befehlsfamilie `mcp.tools.call.v1` während
ihrer anfänglichen Kopplung, selbst wenn kein MCP-Server konfiguriert ist. Ein Node, der mit einer
älteren OpenClaw-Version gekoppelt wurde, kann nach der Aktualisierung des
Node-Hosts ein einmaliges Upgrade der Befehlsoberfläche anfordern. Das anschließende Hinzufügen, Entfernen oder Filtern von Servern erfordert
keine erneute Kopplung, da die genehmigte Befehlsfamilie unverändert bleibt. Starten Sie
`openclaw node run` oder `openclaw node restart` neu, um Änderungen an der Node-MCP-Konfiguration anzuwenden;
der Node-Host überwacht diese Konfiguration nicht.

Gateway-Operatoren können alle von gekoppelten Nodes veröffentlichten, für Agenten sichtbaren Tools ignorieren,
einschließlich der auf Nodes gehosteten MCP-Tools, indem sie
`gateway.nodes.pluginTools.enabled: false` verwenden. Exakte Befehlsverbote wie
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` blockieren ebenfalls die Ausführung.

### Auf dem Node gehostete Skills

Installieren Sie Skills im aktiven OpenClaw-Skills-Verzeichnis des Node-Rechners,
standardmäßig `~/.openclaw/skills`. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` und
`OPENCLAW_CONFIG_PATH` verschieben dieses aktive Profil. `OPENCLAW_STATE_DIR` hat
für Skills Vorrang; andernfalls befindet sich `skills/` neben dem von
`openclaw config file` ausgegebenen Pfad. Der headless Node-Host veröffentlicht gültige `SKILL.md`-Dateien,
nachdem er eine Verbindung hergestellt hat, und das Gateway fügt sie nur dann zu den Skill-Snapshots des Agenten hinzu,
solange dieser Node verbunden bleibt. Jeder Name eines Skill-Verzeichnisses muss mit dem Frontmatter-Feld `name`
übereinstimmen, damit der abstrakte Node-Locator ihn einem einzelnen Eintrag zuordnet, ohne
ein weiteres Protokollfeld hinzuzufügen.

Die anfängliche Kopplung für die Node-Rolle genehmigt die Veröffentlichung von Skills. Das Hinzufügen, Entfernen oder
Ändern von Skills erfordert weder eine weitere Kopplung noch eine Änderung der Gateway-Konfiguration.
Starten Sie `openclaw node run` oder `openclaw node restart` nach Änderungen an
Node-Skill-Dateien neu; der Node-Host überwacht das Skills-Verzeichnis nicht.

Auf einer Node gehostete Skill-Einträge identifizieren ihre Node und enthalten ihren
Ausführungsort. Skill-Dateien, referenzierte relative Pfade und Binärdateien verbleiben auf dieser
Node. Der Agent liest den angegebenen Speicherort `node://.../SKILL.md` mit dem
normalen `read`-Tool. `file_fetch` akzeptiert vom Operator genehmigte absolute Node-Pfade,
keine Node-Skill-Locators; Laufzeitumgebungen ohne das normale read-Tool können stattdessen
`cat SKILL.md` über `exec host=node node=<node-id>` ausführen, wobei das angegebene
Verzeichnis `node://.../skills/<name>` als `workdir` dient. Referenzierte Dateien und Binärdateien
verwenden dasselbe exec-Ziel und dieselbe workdir. Der Node-Host löst diesen Locator relativ zu
seinem aktiven OpenClaw-Zustandsverzeichnis auf, sodass relative Pfade auf der Node statt
auf dem Gateway-Rechner aufgelöst werden. Auf der veröffentlichenden Node muss `system.run`
genehmigt sein, und die exec-Richtlinie des Agenten muss `host=node` erlauben; andernfalls bleibt
der Skill außerhalb des Snapshots dieses Agenten.

Legen Sie auf der Node `nodeHost.skills.enabled: false` fest, um die Veröffentlichung zu beenden. Gateway-
Operatoren können Skills von allen gekoppelten Nodes mit
`gateway.nodes.skills.enabled: false` ignorieren.

### Identitätsstatus im Headless-Betrieb

Die Headless-Node verwaltet drei separate Zustandsdateien:

- `~/.openclaw/node.json`: die veraltete Client-Instanz-ID (als `nodeId` gespeichert), der Anzeigename und die Gateway-Verbindungsmetadaten.
- `~/.openclaw/identity/device.json`: das signierte Geräteschlüsselpaar und die daraus abgeleitete kryptografische Geräte-ID.
- `~/.openclaw/identity/device-auth.json`: gekoppelte Geräteauthentifizierungstoken, nach kryptografischer Geräte-ID und Rolle indiziert.

Bei einer signierten Node verwendet das Gateway die kryptografische Geräte-ID für die Kopplung und
das Node-Routing. Die Client-Instanz-ID ist lediglich ein Verbindungsmetadatum. Das Ändern von
`--node-id` oder das alleinige Löschen von `node.json` setzt die Kopplung daher nicht zurück. Unter
[Identitäts- und Kopplungsstatus](/de/cli/node#identity-and-pairing-state) finden Sie den
unterstützten Ablauf zum Widerrufen und erneuten Koppeln sowie Hinweise zum Upgrade.

### Befehle zur Zulassungsliste hinzufügen

Ausführungsgenehmigungen gelten **pro Node-Host**. Fügen Sie Zulassungslisteneinträge über das Gateway hinzu:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Genehmigungen werden auf dem Node-Host unter `~/.openclaw/exec-approvals.json` gespeichert.

### exec auf die Node ausrichten

Konfigurieren Sie die Standardwerte (Gateway-Konfiguration):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Oder pro Sitzung:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Nach der Festlegung wird jeder `exec`-Aufruf mit `host=node` auf dem Node-Host ausgeführt (vorbehaltlich der Node-Zulassungsliste/-Genehmigungen).

`host=auto` wählt die Node nicht selbstständig implizit aus, eine explizite Anforderung `host=node` pro Aufruf ist jedoch von `auto` aus zulässig. Wenn die Node-Ausführung der Standard für die Sitzung sein soll, legen Sie explizit `tools.exec.host=node` fest oder verwenden Sie `/exec host=node ...`.

Verwandte Themen:

- [Node-Host-CLI](/de/cli/node)
- [Exec-Tool](/de/tools/exec)
- [Ausführungsgenehmigungen](/de/tools/exec-approvals)

### Lokale Modellinferenz

Eine Desktop- oder Server-Node kann chatfähige Modelle von einem auf dieser Node ausgeführten Ollama-Server bereitstellen. Agenten verwenden das Tool `node_inference` des Ollama-Plugins, um installierte Modelle zu ermitteln und einen begrenzten Prompt remote auszuführen; das Gateway benötigt keinen direkten Netzwerkzugriff auf Ollama. Unter [Node-lokale Ollama-Inferenz](/de/providers/ollama#node-local-inference) finden Sie Informationen zur Einrichtung, Modellfilterung und zu direkten Verifizierungsbefehlen.

### Codex-Sitzungen und Transkripte

Das offizielle `codex`-Plugin kann nicht archivierte Codex-Sitzungen auf einem
Headless-Node-Host oder einer nativen macOS-Node bereitstellen. Die Katalogregistrierung hängt nicht mehr
von `supervision.enabled` ab; diese Option steuert die agentenseitigen Überwachungs-Tools.
Das Plugin muss weiterhin auf beiden Computern aktiv sein, und die Node-Einstellung bleibt
eine lokale Zustimmung: Wenn sie nur auf dem Gateway aktiviert wird, kann dieses den Codex-
Status eines anderen Computers nicht lesen.

Die Node kündigt die versionierten schreibgeschützten Befehle
`codex.appServer.threads.list.v1` und
`codex.appServer.thread.turns.list.v1` an. Genehmigen Sie das Upgrade der Node-Kopplung,
wenn diese Befehle erstmals erscheinen. Das Gateway ruft sie über die
normale Plugin-Node-Richtlinie auf und isoliert Fehler nach Host.

Zeilen gekoppelter Nodes erscheinen als Gruppe **Codex** in der normalen Sitzungsseitenleiste.
Durch Auswählen einer Zeile wird der normale Chat-Bereich geöffnet und das gespeicherte Transkript
über begrenzte, cursorpaginierte
`thread/turns/list`-Aufrufe mit vollständiger Elementprojektion gelesen. Der Node-Aufruftransport unterstützt nur Anfrage/Antwort und kann
die zum Fortsetzen eines nativen Threads über das Codex-Harness erforderlichen
Streaming-Turns, Live-Ereignisse oder Genehmigungen nicht übertragen. **Fortsetzen** und **Archivieren** sind
daher für Remote-Zeilen nicht verfügbar. Auf dem Gateway-Computer können gespeicherte und inaktive
Zeilen einen separaten, an ein Modell gebundenen Chat-Zweig starten. Beide können erst archiviert werden,
nachdem der Operator bestätigt hat, dass kein anderer Codex-Client sie verwendet; die Live-Aktivität
einer gespeicherten Zeile bleibt unbekannt. Aktive Zeilen können weder verzweigt noch archiviert werden.

Unter [Codex-Sitzungen überwachen](/plugins/codex-supervision) finden Sie Informationen zu Einrichtung,
Paginierung, lokaler Fortsetzung und der Sicherheitsgrenze für Metadaten.

### Claude-Sitzungen und Transkripte

Das mitgelieferte `anthropic`-Plugin erkennt nicht archivierte Sitzungen der Claude CLI und von Claude
Desktop auf dem Gateway und gekoppelten Nodes. Anders als bei der Codex-Überwachung
ist hierfür keine separate Zustimmung erforderlich: Eine Remote-Node der macOS-App kündigt
`anthropic.claude.sessions.list.v1` und `anthropic.claude.sessions.read.v1` an,
wenn das Anthropic-Plugin aktiviert ist und `~/.claude/projects/` vorhanden ist. Genehmigen Sie
das Upgrade der Node-Kopplung, wenn diese Befehle erstmals erscheinen.

Der Katalog kombiniert gültige Projektindexeinträge der Claude CLI mit einem begrenzten
Metadatenpräfix aus aktuellen `sdk-cli`-JSONL-Dateien. Die lokalen Metadaten von Claude Desktop
liefern Desktop-Titel und den Archivstatus. Desktop-Metadaten haben Vorrang, wenn
beide Quellen auf dieselbe Claude-Code-Sitzungs-ID verweisen; reine CLI-Transkripte
bleiben sichtbar, da die CLI über kein Archivierungsflag verfügt. Beim Lesen von Transkripten werden undurchsichtige
Byte-Offset-Cursor und begrenzte rückwärtsgerichtete Dateilesevorgänge verwendet, sodass beim Auswählen einer großen
Sitzung oder Laden einer älteren Seite nicht der gesamte JSONL-Verlauf in eine einzige
Gateway-Antwort eingelesen wird.

Beide Node-Befehle sind schreibgeschützt. Sie stellen Katalogmetadaten und Transkript-
inhalte nur über die generischen Methoden `sessions.catalog.list` und
`sessions.catalog.read` für eine authentifizierte Operatorverbindung mit
`operator.write` bereit. Zeilen gekoppelter Nodes bleiben schreibgeschützt. Eine Gateway-lokale Zeile der Claude CLI
kann über den normalen Chat-Composer übernommen werden: OpenClaw importiert den begrenzten
sichtbaren Verlauf, setzt die Sitzung beim ersten Turn mit `--fork-session` fort und lässt das
Quelltranskript unverändert. Zeilen von Claude Desktop bleiben schreibgeschützt.

Unter [Anthropic: Claude-Sitzungen auf mehreren Computern](/de/providers/anthropic#claude-sessions-across-computers)
finden Sie Informationen zum Verhalten der Control UI und zu den Speicherquellen.

## Befehle aufrufen

Niedrige Ebene (rohes RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` blockiert `system.run` und `system.run.prepare`; diese Befehle werden nur über das `exec`-Tool mit `host=node` ausgeführt (siehe oben). Für die üblichen Arbeitsabläufe „dem Agenten einen MEDIA-Anhang übergeben“ (Canvas, Kamera, Bildschirm, Standort, siehe unten) stehen höherstufige Hilfsfunktionen zur Verfügung.

## Befehlsrichtlinie

Node-Befehle müssen zwei Prüfungen bestehen, bevor sie aufgerufen werden können:

1. Die Node muss den Befehl in ihren authentifizierten Verbindungsmetadaten (`connect.commands`) deklarieren.
2. Die aus Plattform und Genehmigungen abgeleitete Zulassungsliste des Gateways muss den deklarierten Befehl enthalten.

Standardmäßige Zulassungslisten nach Plattform (vor Plugin-Standardwerten und Überschreibungen durch `allowCommands`/`denyCommands`):

| Plattform | Standardmäßig zulässige Befehle                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (Node-Host-Befehle wie `system.run` unterliegen einer Genehmigungspflicht, siehe unten)                                                                                                                                                                                                                                  |

Diese Zeilen beschreiben die Obergrenze der Gateway-Richtlinie, nicht die von jeder Node-App implementierten Befehle. Ein Befehl kann nur verwendet werden, wenn die verbundene Node ihn ebenfalls deklariert. Insbesondere deklariert die aktuelle macOS-App nicht die in der macOS-Richtlinienzeile aufgeführten Geräte- und personenbezogenen Datenfamilien.

`canvas.*`-Befehle (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) sind ein Plugin-Standard auf iOS, Android, macOS, Windows und unbekannten Plattformen (nicht Linux); unter iOS sind sie alle auf den Vordergrundbetrieb beschränkt.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` sind standardmäßig für jede Node zulässig, die die `talk`-Fähigkeit ankündigt oder `talk.*`-Befehle deklariert, unabhängig von der Plattformbezeichnung.

Desktop-Host-Befehle (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` sowie `screen.snapshot` unter macOS/Windows) sind nicht Bestandteil der oben aufgeführten statischen Plattformstandardtabelle. Sie werden verfügbar, sobald der Operator eine Kopplungsanfrage genehmigt, die sie deklariert. Anschließend übernimmt der genehmigte Befehlssatz der Node sie bei erneuter Verbindung.

Gefährliche oder besonders datenschutzrelevante Befehle erfordern weiterhin eine explizite Zustimmung über `gateway.nodes.allowCommands`, selbst wenn eine Node sie deklariert: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` hat stets Vorrang vor Standardwerten und zusätzlichen Zulassungslisteneinträgen. Unter [Computersteuerung](/nodes/computer-use) finden Sie Informationen zu den zusätzlichen macOS-, Tool-Richtlinien- und Aktivierungsschranken für Desktop-Eingaben.

Plugin-eigene Node-Befehle können eine Gateway-Richtlinie für Node-Aufrufe hinzufügen. Diese Richtlinie wird nach der Allowlist-Prüfung und vor der Weiterleitung an die Node ausgeführt, sodass rohe `node.invoke`-Aufrufe, CLI-Helfer und dedizierte Agent-Tools dieselbe Plugin-Berechtigungsgrenze verwenden. Gefährliche Plugin-Node-Befehle erfordern weiterhin eine explizite Aktivierung über `gateway.nodes.allowCommands`.

Nachdem eine Node ihre deklarierte Befehlsliste geändert hat, lehnen Sie die alte Gerätekopplung ab und genehmigen Sie die neue Anfrage, damit das Gateway den aktualisierten Befehlssnapshot speichert.

## Konfiguration (`openclaw.json`)

Node-bezogene Einstellungen befinden sich unter `gateway.nodes` und `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Erstmalige Node-Kopplung aus vertrauenswürdigen Netzwerken automatisch genehmigen (CIDR-Liste).
      // Deaktiviert, wenn nicht festgelegt. Gilt nur für erstmalige role:node-Anfragen
      // ohne angeforderte Geltungsbereiche; Upgrades werden nicht automatisch genehmigt.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // SSH-verifizierte automatische Genehmigung (Standard: aktiviert). Genehmigt die erstmalige
        // Node-Kopplung bei exakter Übereinstimmung des über SSH zurückgelesenen Geräteschlüssels.
        sshVerify: true,
      },
      // Von gekoppelten Nodes veröffentlichte, für Agents sichtbare Plugin-Tools als vertrauenswürdig einstufen (Standard: true).
      pluginTools: {
        enabled: true,
      },
      // Gefährliche/datenschutzintensive Node-Befehle aktivieren (camera.snap usw.).
      allowCommands: ["camera.snap", "screen.record"],
      // Exakte Befehlsnamen blockieren, selbst wenn Standardwerte oder allowCommands sie enthalten.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Standardmäßiger exec-Host: "node" leitet alle exec-Aufrufe an eine gekoppelte Node weiter.
      host: "node",
      // Sicherheitsmodus für Node-exec: nur genehmigte/in der Allowlist enthaltene Befehle zulassen.
      security: "allowlist",
      // exec an eine bestimmte Node binden (ID oder Name). Weglassen, um jede Node zuzulassen.
      node: "build-node",
    },
  },
}
```

Verwenden Sie exakte Node-Befehlsnamen. `denyCommands` entfernt einen Befehl selbst dann, wenn ein Plattformstandard oder ein Eintrag in `allowCommands` ihn andernfalls zulassen würde. Gekoppelte Nodes können standardmäßig für Agents sichtbare Plugin-Tool-Deskriptoren veröffentlichen, aber der Befehl jedes Deskriptors muss weiterhin zur genehmigten Befehlsoberfläche der Node gehören. Legen Sie `gateway.nodes.pluginTools.enabled: false` fest, um alle derartigen Deskriptoren zu ignorieren. Einzelheiten zur Gateway-Node-Kopplung und zu den Feldern der Befehlsrichtlinie finden Sie in der [Referenz zur Gateway-Konfiguration](/de/gateway/configuration-reference#gateway).

Agent-spezifische Überschreibung der exec-Node:

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

Wenn die Node den Canvas (WebView) anzeigt, gibt `canvas.snapshot` `{ format, base64 }` zurück.

CLI-Helfer (schreibt in eine temporäre Datei und gibt den gespeicherten Pfad aus):

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
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hallo"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Hinweise:

- Mobile Nodes verwenden eine gebündelte, App-eigene A2UI-Seite für die Darstellung mit Aktionsunterstützung.
- Es wird nur A2UI v0.8 JSONL unterstützt (v0.9/createSurface wird abgelehnt).
- iOS und Android stellen entfernte Gateway-Canvas-Seiten dar, A2UI-Schaltflächenaktionen werden jedoch nur von der gebündelten, App-eigenen A2UI-Seite ausgelöst. Vom Gateway bereitgestellte HTTP/HTTPS-A2UI-Seiten dienen auf diesen mobilen Clients ausschließlich der Darstellung.
- macOS kann Aktionen von genau der funktionsbereichsspezifischen Gateway-A2UI-Seite auslösen, die von der App ausgewählt wurde. Andere HTTP/HTTPS-Seiten dienen weiterhin ausschließlich der Darstellung.

## Fotos und Videos (Node-Kamera)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # Standard: beide Kamerarichtungen (2 MEDIA-Zeilen)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Videoclips (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Hinweise:

- Die Node muss sich für `canvas.*` und `camera.*` **im Vordergrund** befinden (Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück).
- Nodes begrenzen die Clipdauer, damit die base64-Nutzlast handhabbar bleibt (die genauen plattformspezifischen Grenzwerte finden Sie unter [Kameraaufnahme](/de/nodes/camera)). Das Agent-Tool `nodes` begrenzt die angeforderte `durationMs` zusätzlich auf 300000 (5 Minuten), bevor es den Aufruf weiterleitet; die Node selbst setzt den strengeren Grenzwert durch.
- Android fordert nach Möglichkeit die Berechtigungen `CAMERA`/`RECORD_AUDIO` an; bei verweigerten Berechtigungen tritt ein Fehler mit `*_PERMISSION_REQUIRED` auf.

## Bildschirmaufzeichnungen (Nodes)

Unterstützte Nodes stellen `screen.record` (mp4) bereit. Beispiel:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Hinweise:

- Die Verfügbarkeit von `screen.record` hängt von der Node-Plattform ab.
- Das Agent-Tool `nodes` begrenzt die angeforderte `durationMs` auf 300000 (5 Minuten); die Node kann einen strengeren Grenzwert durchsetzen, um die zurückgegebene Nutzlast zu begrenzen.
- `--no-audio` deaktiviert auf unterstützten Plattformen die Mikrofonaufnahme.
- Verwenden Sie `--screen <index>`, um bei mehreren verfügbaren Bildschirmen einen Bildschirm auszuwählen (0 = primär).

## Standort (Nodes)

Nodes stellen `location.get` bereit, wenn der Standort in den Einstellungen aktiviert ist.

CLI-Helfer:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Hinweise:

- Der Standort ist **standardmäßig deaktiviert**.
- „Immer“ erfordert eine Systemberechtigung; der Abruf im Hintergrund erfolgt nach Möglichkeit.
- Die Antwort enthält Breiten-/Längengrad, Genauigkeit (Meter) und Zeitstempel.
- Vollständige Parameter-/Antwortstruktur und Fehlercodes: [Standortbefehl](/de/nodes/location-command).

## SMS (Android-Nodes)

Android-Nodes können `sms.send` und `sms.search` bereitstellen, wenn der Benutzer die **SMS**-Berechtigung erteilt und das Gerät Telefoniefunktionen unterstützt. Beide Befehle gelten standardmäßig als gefährlich: Der Gateway-Betreiber muss sie zusätzlich zu `gateway.nodes.allowCommands` hinzufügen, bevor sie aufgerufen werden können (siehe [Befehlsrichtlinie](#command-policy)).

Aktivieren Sie die schreibgeschützte SMS-Suche explizit in `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Fügen Sie `sms.send` nur dann separat hinzu, wenn die Node auch Nachrichten senden können soll. Android-Berechtigung und Gateway-Befehlsautorisierung sind voneinander unabhängig; das Erteilen der Telefonberechtigung ändert die Gateway-Richtlinie nicht.

Niedriger Aufruflevel:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hallo von OpenClaw"}'
```

Hinweise:

- `sms.search` kann deklariert werden, bevor `READ_SMS` erteilt wurde, damit ein Aufruf eine Berechtigungsdiagnose zurückgeben kann; zum Lesen von Nachrichten ist diese Android-Berechtigung weiterhin erforderlich.
- Reine WLAN-Geräte ohne Telefoniefunktion bieten `sms.send` nicht an.
- Ein Fehler `requires explicit gateway.nodes.allowCommands opt-in` bedeutet, dass das Telefon den Befehl deklariert hat, der Gateway-Betreiber ihn jedoch nicht autorisiert hat.

## Befehle für Geräte- und persönliche Daten

iOS- und Android-Nodes bieten standardmäßig mehrere schreibgeschützte Datenbefehle an (siehe Tabelle unter [Befehlsrichtlinie](#command-policy)); Android stellt zusätzlich eine größere Familie bereit, die durch eigene App-interne Einstellungen geschützt ist.

Verfügbare Familien:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — nur Android; `device.apps` erfordert, dass die Freigabe installierter Apps in den Android-Einstellungen aktiviert ist, und gibt standardmäßig im Launcher sichtbare Apps zurück.
- `notifications.list`, `notifications.actions` — nur Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (standardmäßig schreibgeschützt); `contacts.add` ist gefährlich und benötigt `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (standardmäßig schreibgeschützt); `calendar.add` ist gefährlich und benötigt `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (standardmäßig schreibgeschützt); `reminders.add` ist gefährlich und benötigt `gateway.nodes.allowCommands`.
- `callLog.search` — nur Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; durch die verfügbaren Sensoren funktionsabhängig eingeschränkt.

Beispielaufrufe:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Systembefehle (Node-Host/macOS-Node)

Die macOS-Node stellt `system.run`, `system.which`, `system.notify` und `system.execApprovals.get/set` bereit. Der monitorlose Node-Host stellt `system.run.prepare`, `system.run`, `system.which` und `system.execApprovals.get/set` bereit.

Beispiele:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway bereit"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Hinweise:

- `system.run` gibt stdout/stderr/Exit-Code in der Nutzlast zurück.
- Die Shell-Ausführung erfolgt jetzt über das Tool `exec` mit `host=node`; `nodes` bleibt die direkte RPC-Schnittstelle für explizite Node-Befehle.
- `nodes invoke` stellt `system.run` oder `system.run.prepare` nicht bereit; diese bleiben ausschließlich im exec-Pfad.
- Der exec-Pfad erstellt vor der Genehmigung einen kanonischen `systemRunPlan`. Sobald eine Genehmigung erteilt wurde, leitet der Gateway diesen gespeicherten Plan weiter und nicht etwa später vom Aufrufer bearbeitete command-/cwd-/session-Felder.
- `system.notify` berücksichtigt den Status der Mitteilungsberechtigung in der macOS-App; unterstützt `--priority <passive|active|timeSensitive>` und `--delivery <system|overlay|auto>`.
- Nicht erkannte Node-Metadaten für `platform` / `deviceFamily` verwenden standardmäßig eine konservative Zulassungsliste, die `system.run` und `system.which` ausschließt. Wenn Sie diese Befehle absichtlich für eine unbekannte Plattform benötigen, fügen Sie sie explizit über `gateway.nodes.allowCommands` hinzu.
- `system.run` unterstützt `--cwd`, `--env KEY=VAL`, `--command-timeout` und `--needs-screen-recording`.
- Bei Shell-Wrappern (`bash|sh|zsh ... -c/-lc`) werden anfragespezifische `--env`-Werte auf eine explizite Zulassungsliste (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`) beschränkt.
- Bei Entscheidungen für eine dauerhafte Zulassung im Zulassungslistenmodus werden für bekannte Dispatch-Wrapper (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) die Pfade der inneren ausführbaren Dateien statt der Wrapper-Pfade dauerhaft gespeichert. Wenn das Entpacken nicht sicher ist, wird nicht automatisch ein Eintrag in der Zulassungsliste gespeichert.
- Auf Windows-Node-Hosts im Zulassungslistenmodus erfordern Shell-Wrapper-Ausführungen über `cmd.exe /c` eine Genehmigung (ein Eintrag in der Zulassungsliste allein erlaubt die Wrapper-Form nicht automatisch).
- Node-Hosts ignorieren `PATH`-Überschreibungen in `--env` und entfernen vor der Ausführung eines Befehls eine große, gepflegte Gruppe von Startvariablen für Interpreter und Shells (zum Beispiel `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`). Wenn Sie zusätzliche PATH-Einträge benötigen, konfigurieren Sie die Dienstumgebung des Node-Hosts (oder installieren Sie Tools an Standardspeicherorten), anstatt `PATH` über `--env` zu übergeben.
- Im macOS-Node-Modus wird `system.run` durch exec-Genehmigungen in der macOS-App gesteuert (Settings → Exec approvals). Ask/Zulassungsliste/vollständig verhalten sich wie beim headless Node-Host; abgelehnte Aufforderungen geben `SYSTEM_RUN_DENIED` zurück.
- Auf dem headless Node-Host wird `system.run` durch exec-Genehmigungen (`~/.openclaw/exec-approvals.json`) gesteuert; speziell für macOS finden Sie unten unter [Headless Node-Host](#headless-node-host-cross-platform) die Umgebungsvariablen für das Routing des exec-Hosts.

## Bindung des exec-Nodes

Wenn mehrere Nodes verfügbar sind, können Sie exec an einen bestimmten Node binden. Dadurch wird der Standard-Node für `exec host=node` festgelegt (und kann pro Agent überschrieben werden).

Globaler Standard:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Überschreibung pro Agent:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Aufheben, um jeden Node zuzulassen:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Berechtigungsübersicht

Nodes können in `node.list` / `node.describe` eine `permissions`-Übersicht enthalten, deren Schlüssel Berechtigungsnamen sind (z. B. `screenRecording`, `accessibility`, `location`) und deren Werte boolesch sind (`true` = erteilt).

## Headless Node-Host (plattformübergreifend)

OpenClaw kann einen **headless Node-Host** (ohne Benutzeroberfläche) ausführen, der eine Verbindung zum Gateway-WebSocket herstellt und `system.run` / `system.which` bereitstellt. Dies ist unter Linux/Windows oder für die Ausführung eines minimalen Nodes neben einem Server nützlich.

So starten Sie ihn:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Hinweise:

- Das Pairing ist weiterhin erforderlich (der Gateway zeigt eine Aufforderung zum Geräte-Pairing an).
- Metadaten der Client-Instanz, die signierte Geräteidentität und die Pairing-Authentifizierung verwenden separate Dateien; siehe [Status der headless Identität](#headless-identity-state).
- exec-Genehmigungen werden lokal über `~/.openclaw/exec-approvals.json` erzwungen (siehe [exec-Genehmigungen](/de/tools/exec-approvals)).
- Unter macOS führt der headless Node-Host `system.run` standardmäßig lokal aus. Setzen Sie `OPENCLAW_NODE_EXEC_HOST=app`, um `system.run` über den exec-Host der Begleit-App zu leiten; fügen Sie `OPENCLAW_NODE_EXEC_FALLBACK=0` hinzu, um den App-Host zwingend vorauszusetzen und bei Nichtverfügbarkeit ohne Fallback abzubrechen.
- Fügen Sie `--tls` / `--tls-fingerprint` hinzu, wenn das Gateway-WS TLS verwendet.

## Mac-Node-Modus

- Die macOS-Menüleisten-App stellt als Node eine Verbindung zum Gateway-WS-Server her (sodass `openclaw nodes …` mit diesem Mac funktioniert).
- Im Remote-Modus öffnet die App einen SSH-Tunnel für den Gateway-Port und stellt eine Verbindung zu `localhost` her.
