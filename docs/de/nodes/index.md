---
read_when:
    - iOS-/watchOS-/Android-Nodes mit einem Gateway koppeln
    - Node-Canvas/Kamera für den Agentenkontext verwenden
    - Neue Node-Befehle oder CLI-Hilfsfunktionen hinzufügen
summary: 'Nodes: Kopplung, Funktionen, Berechtigungen und CLI-Hilfsprogramme für Canvas/Kamera/Bildschirm/Gerät/Benachrichtigungen/System'
title: Nodes
x-i18n:
    generated_at: "2026-07-16T13:00:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c2c1e9ad62866704941906db136546f7e81975f52c503c24ce829d0b13613bcc
    source_path: nodes/index.md
    workflow: 16
---

Ein **Node** ist ein Begleitgerät (macOS/iOS/watchOS/Android/headless), das sich über `role: "node"` mit dem Gateway verbindet und über `node.invoke` eine Befehlsoberfläche (z. B. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) bereitstellt. Die meisten Nodes verwenden den Gateway-WebSocket am Operator-Port. Der optionale direkte Apple-Watch-Node verwendet signiertes HTTPS-Polling am selben Port, da watchOS gewöhnlichen Apps generische Low-Level-Netzwerkverbindungen untersagt. Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

Veralteter Transport: [Bridge-Protokoll](/de/gateway/bridge-protocol) (TCP JSONL; für aktuelle Nodes nur von historischer Bedeutung).

macOS kann auch im **Node-Modus** ausgeführt werden: Die Menüleisten-App verbindet sich als ein Node mit dem
WS-Server des Gateways (sodass `openclaw nodes …` auf diesem Mac funktioniert). Die App
ergänzt die gleiche, von `openclaw node run` verwendete Node-Host-Befehlsoberfläche
um native Befehle für Canvas, Kamera, Bildschirm, Benachrichtigungen und Computersteuerung.
Starten Sie auf diesem Mac keinen zweiten CLI-Node; die App führt die entsprechende
CLI-Node-Host-Laufzeit als internen Worker aus und bleibt die einzige Gateway-Verbindung
und Node-Identität.

Nodes sind **Peripheriegeräte**, keine Gateways: Sie führen den Gateway-Dienst nicht aus, und Kanalnachrichten (Telegram, WhatsApp usw.) gehen beim Gateway ein, nicht bei den Nodes.

Runbook zur Fehlerbehebung: [/nodes/troubleshooting](/de/nodes/troubleshooting)

## Kopplung und Status

Nodes verwenden die **Gerätekopplung**. Ein Node legt beim Verbindungsaufbau eine signierte Geräteidentität vor; das Gateway erstellt eine Gerätekopplungsanfrage für `role: node`. Genehmigen Sie sie über die Geräte-CLI (oder die Benutzeroberfläche). Bei der direkten Einrichtung der Apple Watch wird ein vom Administrator ausgestellter, kurzlebiger und ausschließlich für Nodes bestimmter Einrichtungscode verwendet, um ihre festgelegte Befehlsoberfläche mit geringem Risiko zu genehmigen; eine spätere Erweiterung der Funktionen erfordert weiterhin eine reguläre Genehmigung.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Ausstehende Kopplungsanfragen laufen 5 Minuten nach dem letzten Wiederholungsversuch des Geräts ab – ein Gerät, das fortlaufend versucht, die Verbindung wiederherzustellen, hält seine eine ausstehende Anfrage (und `requestId`) aktiv, anstatt alle paar Minuten eine neue Aufforderung zu erzeugen; den vollständigen Anfrage- und Genehmigungsablauf finden Sie unter [Node-Kopplung](/de/gateway/pairing). Wenn ein Node den Verbindungsversuch mit geänderten Authentifizierungsdetails (Rolle/Bereiche/öffentlicher Schlüssel) wiederholt, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt – Clients erhalten für die ersetzte Anfrage ein `device.pair.resolved`-Ereignis, und Sie sollten `openclaw devices list` vor der Genehmigung erneut ausführen.

- `nodes status` kennzeichnet einen Node als **gekoppelt**, wenn seine Gerätekopplungsrolle `node` umfasst.
- Ein verbundener nativer Mac mit Bedienungshilfen-Berechtigung kann zusammengefasste
  physische Eingabeaktivitäten melden. Das Gateway kennzeichnet den aktuellsten geeigneten Mac als
  `active`, stellt dem Agenten einen stabilen Hinweis auf die Node-ID bereit und leitet Warnungen
  zu Node-Verbindungen dorthin weiter, bevor verzögert auf eine Ausweichlösung zurückgegriffen wird. Informationen
  zu Einrichtung, Datenschutz, Timing und Fehlerbehebung finden Sie unter
  [Präsenz des aktiven Computers](/de/nodes/presence).
- Der Gerätekopplungsdatensatz ist der dauerhafte Vertrag für die genehmigte Rolle. Die Token-Rotation bleibt innerhalb dieses Vertrags; sie kann einem gekoppelten Node keine Rolle zuweisen, die durch die Kopplungsgenehmigung nie gewährt wurde.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) ist ein separater, vom Gateway verwalteter Node-Kopplungsspeicher, der die genehmigte Befehls- und Funktionsoberfläche des Nodes über erneute Verbindungen hinweg erfasst. Er steuert **nicht** die Transportauthentifizierung – dafür ist die Gerätekopplung zuständig.
- `openclaw nodes remove --node <id|name|ip>` entfernt eine Node-Kopplung. Bei einem gerätegestützten Node widerruft dies die Rolle `node` des Geräts im Speicher gekoppelter Geräte und trennt die Sitzungen dieses Geräts mit Node-Rolle: Bei einem Gerät mit mehreren Rollen bleibt der Datensatz erhalten und nur die Rolle `node` geht verloren, während der Datensatz eines reinen Node-Geräts gelöscht wird. Außerdem wird jeder passende Eintrag aus dem separaten Node-Kopplungsspeicher entfernt. `operator.pairing` kann Nicht-Operator-Node-Datensätze auf anderen Geräten entfernen; ein Aufrufer mit Geräte-Token, der seine eigene Node-Rolle auf einem Gerät mit mehreren Rollen widerruft, benötigt zusätzlich `operator.admin`.
- Der Genehmigungsumfang richtet sich nach den in der ausstehenden Anfrage deklarierten Befehlen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Node-Befehle ohne Ausführung: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Versionsabweichungen und Upgrade-Reihenfolge

Der Gateway-WebSocket akzeptiert authentifizierte Node-Clients innerhalb eines N-1-Protokollfensters.
Das aktuelle v4-Gateway akzeptiert daher v3-Nodes, wenn die Verbindung sowohl
`role: "node"` als auch `client.mode: "node"` deklariert. Operator- und UI-Sitzungen müssen
weiterhin das aktuelle Protokoll verwenden.

Aktualisieren Sie bei gestaffelten Flotten-Upgrades zuerst das Gateway und anschließend jeden Node.
Ein N-1-Node bleibt während des Upgrades sichtbar und verwaltbar; das Gateway
protokolliert `legacy node protocol accepted` mit einer Upgrade-Empfehlung. Kopplung,
Geräteauthentifizierung, Befehls-Zulassungslisten und Ausführungsgenehmigungen gelten weiterhin.
Plugin-eigene Funktionen und Befehle bleiben verborgen, bis der Node auf
das aktuelle Protokoll aktualisiert wurde. Nodes, die älter als N-1 sind, benötigen vor
der erneuten Verbindung ein Out-of-Band-Upgrade.

Der direkte watchOS-HTTPS-Transport erfordert die aktuelle Protokollversion; aktualisieren Sie
die Watch-App zusammen mit dem Gateway, bevor Sie den Direktmodus aktivieren.

## Remote-Node-Host (system.run)

Verwenden Sie einen **Node-Host**, wenn Ihr Gateway auf einem Rechner ausgeführt wird und Sie Befehle auf einem anderen ausführen möchten. Das Modell kommuniziert weiterhin mit dem **Gateway**; das Gateway leitet `exec`-Aufrufe an den **Node-Host** weiter, wenn `host=node` ausgewählt ist.

| Rolle        | Zuständigkeit                                                     |
| ------------ | ----------------------------------------------------------------- |
| Gateway-Host | Empfängt Nachrichten, führt das Modell aus und leitet Tool-Aufrufe weiter. |
| Node-Host    | Führt `system.run`/`system.which` auf dem Node-Rechner aus. |
| Genehmigungen | Werden auf dem Node-Host über `~/.openclaw/exec-approvals.json` durchgesetzt. |

Hinweis zur Genehmigung:

- Genehmigungspflichtige Node-Ausführungen werden an den exakten Anfragekontext gebunden. Der Ausführungspfad erstellt vor der Genehmigung einen kanonischen `systemRunPlan`; nach der Genehmigung leitet das Gateway diesen gespeicherten Plan weiter, nicht etwa später vom Aufrufer bearbeitete Befehls-, cwd- oder Sitzungsfelder, und validiert das Arbeitsverzeichnis vor der Ausführung erneut.
- Bei direkten Shell-/Laufzeit-Dateiausführungen bindet OpenClaw außerdem nach bestem Bemühen einen konkreten lokalen Dateioperanden und verweigert die Ausführung, wenn sich diese Datei vor der Ausführung ändert.
- Wenn OpenClaw für einen Interpreter-/Laufzeitbefehl nicht genau eine konkrete lokale Datei identifizieren kann, wird die genehmigungspflichtige Ausführung verweigert, anstatt eine vollständige Abdeckung der Laufzeit vorzutäuschen. Verwenden Sie für eine breitere Interpreter-Semantik Sandboxing, separate Hosts oder eine ausdrücklich vertrauenswürdige Zulassungsliste bzw. einen vollständigen Workflow.

### Node-Host starten (Vordergrund)

Auf dem Node-Rechner:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` akzeptiert außerdem `--context-path` (Gateway-WS-Kontextpfad), `--tls`, `--tls-fingerprint <sha256>` und `--node-id` (überschreibt die veraltete Clientinstanz-ID; dadurch wird die Kopplung nicht zurückgesetzt).

### Remote-Gateway über SSH-Tunnel (Loopback-Bindung)

Wenn das Gateway an Loopback gebunden ist (`gateway.bind=loopback`, Standard im lokalen Modus), können Remote-Node-Hosts keine direkte Verbindung herstellen. Erstellen Sie einen SSH-Tunnel und richten Sie den Node-Host auf das lokale Ende des Tunnels aus.

Beispiel (Node-Host -> Gateway-Host):

```bash
# Terminal A (weiterlaufen lassen): lokales 18790 -> Gateway 127.0.0.1:18789 weiterleiten
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: Gateway-Token exportieren und Verbindung über den Tunnel herstellen
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Hinweise:

- `openclaw node run` unterstützt Token- oder Passwortauthentifizierung.
- Umgebungsvariablen werden bevorzugt: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Der Konfigurations-Fallback ist `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus ignoriert der Node-Host absichtlich `gateway.remote.token` / `gateway.remote.password`.
- Im Remote-Modus kommen `gateway.remote.token` / `gateway.remote.password` gemäß den Remote-Prioritätsregeln infrage.
- Wenn aktive lokale `gateway.auth.*`-SecretRefs konfiguriert, aber nicht aufgelöst sind, schlägt die Node-Host-Authentifizierung nach dem Fail-Closed-Prinzip fehl.
- Die Auflösung der Node-Host-Authentifizierung berücksichtigt nur `OPENCLAW_GATEWAY_*`-Umgebungsvariablen.

### Node-Host starten (Dienst)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` akzeptiert außerdem `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (nur veraltete Clientinstanz-ID), `--runtime <node>` (Standard: Node) und `--force` zur Neuinstallation. `node status`, `node stop` und `node uninstall` sind ebenfalls verfügbar.

### Koppeln und benennen

Auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Wenn der Node den Verbindungsversuch mit geänderten Authentifizierungsdetails wiederholt, führen Sie `openclaw devices list` erneut aus und genehmigen Sie die aktuelle `requestId`.

Benennungsoptionen:

- `--display-name` für `openclaw node run` / `openclaw node install` (wird im gemeinsamen `node_host_config`-SQLite-Datensatz zusammen mit der Clientinstanz-ID und den Gateway-Verbindungsmetadaten gespeichert).
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
nach dem Verbindungsaufbau die Deskriptoren. Tool-Aufrufe werden über
`mcp.tools.call.v1` an diesen Node zurückgeleitet; das Gateway benötigt weder eine entsprechende MCP-Konfiguration noch ein JS-
Plugin. OAuth-MCP-Server werden von diesem auf dem Node gehosteten v1-Pfad nicht unterstützt.

Aktuelle Node-Hosts deklarieren die integrierte Befehlsfamilie `mcp.tools.call.v1` während
ihrer ersten Kopplung, selbst wenn kein MCP-Server konfiguriert ist. Ein Node, der mit einer
älteren OpenClaw-Version gekoppelt wurde, kann nach der Aktualisierung des
Node-Hosts einmalig ein Upgrade der Befehlsoberfläche anfordern. Das Hinzufügen, Entfernen oder Filtern von Servern danach erfordert keine
erneute Kopplung, da die genehmigte Befehlsfamilie unverändert bleibt. Starten Sie
`openclaw node run` oder `openclaw node restart` neu, um Änderungen an der Node-MCP-Konfiguration anzuwenden;
der Node-Host überwacht diese Konfiguration nicht.

Gateway-Operatoren können alle von gekoppelten Nodes veröffentlichten, für Agenten sichtbaren Tools ignorieren,
einschließlich auf Nodes gehosteter MCP-Tools, und zwar mit
`gateway.nodes.pluginTools.enabled: false`. Exakte Befehlsverbote wie
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]` blockieren ebenfalls die Ausführung.

### Auf dem Node gehostete Skills

Installieren Sie Skills im aktiven OpenClaw-Skills-Verzeichnis des Node-Rechners,
standardmäßig `~/.openclaw/skills`. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` und
`OPENCLAW_CONFIG_PATH` verschieben dieses aktive Profil. `OPENCLAW_STATE_DIR` hat
für Skills Vorrang; andernfalls befindet sich `skills/` neben dem von
`openclaw config file` ausgegebenen Pfad. Der headless Node-Host veröffentlicht gültige `SKILL.md`-Dateien,
nachdem er die Verbindung hergestellt hat, und das Gateway fügt sie nur dann zu den Skill-Snapshots des Agenten hinzu,
solange dieser Node verbunden bleibt. Der Name jedes Skill-Verzeichnisses muss mit dem Frontmatter-Feld `name`
übereinstimmen, damit der abstrakte Node-Locator genau einem Eintrag zugeordnet wird, ohne
ein weiteres Protokollfeld hinzuzufügen.

Die anfängliche Kopplung der Node-Rolle genehmigt die Veröffentlichung von Skills. Das Hinzufügen, Entfernen oder
Ändern von Skills erfordert keine erneute Kopplung oder Änderung der Gateway-Konfiguration.
Starten Sie `openclaw node run` oder `openclaw node restart` nach Änderungen an
Node-Skill-Dateien neu; der Node-Host überwacht das Skills-Verzeichnis nicht.

Auf dem Node gehostete Skill-Einträge identifizieren ihren Node und enthalten ihren
Ausführungsort. Skill-Dateien, referenzierte relative Pfade und Binärdateien verbleiben auf diesem
Node. Der Agent liest den veröffentlichten Speicherort `node://.../SKILL.md` mit dem
normalen Tool `read`. `file_fetch` akzeptiert vom Operator genehmigte absolute Node-Pfade,
keine Node-Skill-Locators; Laufzeitumgebungen ohne das normale Lesetool können stattdessen
`cat SKILL.md` über `exec host=node node=<node-id>` ausführen, wobei das veröffentlichte
Verzeichnis `node://.../skills/<name>` als `workdir` verwendet wird. Referenzierte Dateien und Binärdateien
verwenden dasselbe Exec-Ziel und Arbeitsverzeichnis. Der Node-Host löst diesen Locator relativ zu
seinem aktiven OpenClaw-Zustandsverzeichnis auf, sodass relative Pfade auf dem Node statt
auf dem Gateway-Computer aufgelöst werden. Für den veröffentlichenden Node muss `system.run` genehmigt sein,
und die Exec-Richtlinie des Agenten muss `host=node` zulassen; andernfalls bleibt der Skill
außerhalb des Snapshots dieses Agenten.

Setzen Sie `nodeHost.skills.enabled: false` auf dem Node, um die Veröffentlichung zu stoppen. Gateway-
Operatoren können Skills von allen gekoppelten Nodes mit
`gateway.nodes.skills.enabled: false` ignorieren.

### Headless-Identitätsstatus

Der Headless-Node verwaltet drei separate Zustandsdatensätze:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): die Client-Instanz-ID, der Anzeigename und die Gateway-Verbindungsmetadaten.
- `~/.openclaw/identity/device.json`: das signierte Geräteschlüsselpaar und die daraus abgeleitete kryptografische Geräte-ID.
- `~/.openclaw/identity/device-auth.json`: Authentifizierungstoken gekoppelter Geräte, nach kryptografischer Geräte-ID und Rolle indiziert.

Bei einem signierten Node verwendet das Gateway die kryptografische Geräte-ID für die Kopplung und
das Node-Routing. Die Client-Instanz-ID dient lediglich als Verbindungsmetadatum. Das Ändern von
`--node-id` oder die Migration eines eingestellten `node.json` setzt die Kopplung daher nicht zurück. Informationen zum
unterstützten Ablauf für Widerruf und erneute Kopplung sowie Upgrade-Hinweise finden Sie unter
[Identitäts- und Kopplungsstatus](/de/cli/node#identity-and-pairing-state).

### Befehle zur Zulassungsliste hinzufügen

Exec-Genehmigungen gelten **pro Node-Host**. Fügen Sie die Einträge der Zulassungsliste über das Gateway hinzu:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Genehmigungen werden auf dem Node-Host unter `~/.openclaw/exec-approvals.json` gespeichert.

### Exec auf den Node ausrichten

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

Nach der Konfiguration wird jeder `exec`-Aufruf mit `host=node` auf dem Node-Host ausgeführt (vorbehaltlich der Zulassungsliste und Genehmigungen des Nodes).

`host=auto` wählt den Node nicht eigenständig implizit aus, aber eine explizite `host=node`-Anforderung pro Aufruf ist von `auto` aus zulässig. Wenn Node-Exec der Standard für die Sitzung sein soll, setzen Sie `tools.exec.host=node` oder `/exec host=node ...` explizit.

Verwandte Themen:

- [Node-Host-CLI](/de/cli/node)
- [Exec-Tool](/de/tools/exec)
- [Exec-Genehmigungen](/de/tools/exec-approvals)

### Lokale Modellinferenz

Ein Desktop- oder Server-Node kann chatfähige Modelle eines auf diesem Node ausgeführten Ollama-Servers bereitstellen. Agenten verwenden das Tool `node_inference` des Ollama-Plugins, um installierte Modelle zu erkennen und einen begrenzten Prompt remote auszuführen; das Gateway benötigt keinen direkten Netzwerkzugriff auf Ollama. Informationen zur Einrichtung, Modellfilterung und zu Befehlen für die direkte Überprüfung finden Sie unter [Node-lokale Ollama-Inferenz](/de/providers/ollama#node-local-inference).

### Codex-Sitzungen und Transkripte

Das offizielle Plugin `codex` kann nicht archivierte Codex-Sitzungen auf einem
Headless-Node-Host oder nativen macOS-Node bereitstellen. Die Katalogregistrierung hängt nicht mehr
von `supervision.enabled` ab; diese Option steuert die agentenseitigen Überwachungstools.
Setzen Sie `sessionCatalog.enabled: false` in der Codex-Plugin-Konfiguration, um die
Operatorkatalog- und Gekoppelter-Node-Katalogbefehle zu deaktivieren, ohne den
Provider oder das Harness zu deaktivieren.
Das Plugin muss weiterhin auf beiden Computern aktiv sein, und die Node-Einstellung bleibt
eine lokale Zustimmung: Wenn sie nur auf dem Gateway aktiviert wird, kann dieses den Codex-
Status eines anderen Computers nicht lesen.

Der Node veröffentlicht die versionierten schreibgeschützten Befehle
`codex.appServer.threads.list.v1` und
`codex.appServer.thread.turns.list.v1`. Ein nativer Node-Host, auf dem die
Codex CLI verfügbar ist, veröffentlicht außerdem `codex.terminal.resume.v1`. Genehmigen Sie das Upgrade der Node-Kopplung,
wenn diese Befehle erstmals angezeigt werden. Das Gateway ruft sie über die
normale Plugin-Node-Richtlinie auf und isoliert Fehler nach Host.

Zeilen gekoppelter Nodes werden in der normalen Sitzungsseitenleiste als Gruppe **Codex** angezeigt.
Standardmäßig öffnet die Auswahl einer Zeile den normalen Chat-Bereich und liest das persistierte Transkript
über begrenzte, cursor-paginierte
`thread/turns/list`-Aufrufe mit vollständiger Elementprojektion. Verwenden Sie das Zeilenmenü, den Viewer-Header oder die Einstellung **Open Codex/Claude sessions in**, um `codex resume <thread-id>` im Operatorterminal auf dem Computer zu starten, dem die Sitzung gehört. Der Terminalpfad des gekoppelten Nodes ist ein vom Codex-Plugin verwaltetes PTY-Relay mit Zulassungsliste und keine beliebige Node-Befehlsausführung.

Das Relay stellt nicht die vollständigen Verträge des OpenClaw-Harness für Fortsetzung und Archivbesitz bereit. **Continue** und **Archive** sind daher für Remote-Zeilen nicht verfügbar. Auf dem Gateway-Computer können gespeicherte und inaktive
Zeilen einen separaten, an ein Modell gebundenen Chat-Zweig starten. Beide können nur archiviert werden,
nachdem der Operator bestätigt hat, dass kein anderer Codex-Client sie verwendet; die Live-Aktivität
einer gespeicherten Zeile bleibt unbekannt. Aktive Zeilen können weder verzweigt noch archiviert werden.

Informationen zur Einrichtung, Paginierung, lokalen Fortsetzung und zur Sicherheitsgrenze für Metadaten finden Sie unter
[Codex-Sitzungen überwachen](/de/plugins/codex-supervision).

### Claude-Sitzungen und Transkripte

Das gebündelte Plugin `anthropic` erkennt standardmäßig nicht archivierte Sitzungen der Claude CLI und von Claude
Desktop auf dem Gateway und gekoppelten Nodes. Setzen Sie
`plugins.entries.anthropic.config.sessionCatalog.enabled: false`, um die
Operatorkatalog- und Gekoppelter-Node-Katalogbefehle zu deaktivieren, ohne Anthropic-
Modelle oder das Claude-CLI-Backend zu deaktivieren.
Ein Remote-macOS-App-Node veröffentlicht
`anthropic.claude.sessions.list.v1` und `anthropic.claude.sessions.read.v1`,
wenn das Anthropic-Plugin aktiviert ist und `~/.claude/projects/` vorhanden ist. Genehmigen Sie
das Upgrade der Node-Kopplung, wenn diese Befehle erstmals angezeigt werden.

Ein nativer Node-Host, auf dem die Claude CLI verfügbar ist, veröffentlicht außerdem
`anthropic.claude.terminal.resume.v1`. Geeignete CLI- und Desktop-Zeilen können
`claude --resume <session-id>` im Operatorterminal auf ihrem jeweiligen Host öffnen.
Dabei wird die native Sitzung übernommen; anders als bei der Übernahme durch OpenClaw
wird die Claude-Sitzung nicht zuerst verzweigt.

Der Katalog kombiniert gültige Claude-CLI-Projektindex-Datensätze mit einem begrenzten
Metadatenpräfix aus aktuellen `sdk-cli`-JSONL-Dateien. Die lokalen Metadaten von Claude Desktop
liefern Desktop-Titel und Archivstatus. Desktop-Metadaten haben Vorrang, wenn
beide Quellen auf dieselbe Claude-Code-Sitzungs-ID verweisen; reine CLI-Transkripte
bleiben sichtbar, da die CLI kein Archivierungsflag besitzt. Beim Lesen von Transkripten werden undurchsichtige
Byte-Offset-Cursor und begrenzte rückwärtsgerichtete Dateilesevorgänge verwendet, sodass beim Auswählen einer großen
Sitzung oder Laden einer älteren Seite nicht der gesamte JSONL-Verlauf in eine einzige
Gateway-Antwort eingelesen wird.

Die Listen- und Lesebefehle sind schreibgeschützt. Sie stellen Katalogmetadaten und Transkriptinhalte
nur über die generischen Methoden `sessions.catalog.list` und
`sessions.catalog.read` für eine authentifizierte Operatorverbindung mit
`operator.write` bereit. Eine Gateway-lokale Claude-CLI-Zeile kann über den normalen
Chat-Composer übernommen werden: OpenClaw importiert den begrenzten sichtbaren Verlauf, setzt die Sitzung
beim ersten Turn mit `--fork-session` fort und lässt das Quelltranskript unverändert.

Ein Headless-Node-Host kann denselben Fortsetzungsablauf aktivieren:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Der Node veröffentlicht `agent.cli.claude.run.v1` nur, wenn diese Node-lokale Einstellung
aktiviert ist und die ausführbare Datei `claude` auf diesem Node aufgelöst werden kann. Das Gateway kann
sie nicht remote aktivieren. Der Befehl unterliegt außerdem der bestehenden Exec-
Genehmigungsrichtlinie des Nodes. Wenn alle drei Claude-Befehle veröffentlicht und von
der Node-Befehlsrichtlinie des Gateways zugelassen werden, kann eine Claude-CLI-
Zeile auf diesem Node fortgesetzt werden: OpenClaw importiert den begrenzten Verlauf, bindet
die übernommene Sitzung an den Node und das vom Katalog gemeldete Arbeitsverzeichnis und
führt dort jeden einmaligen `claude -p`-Turn aus. Der erste Turn verwendet weiterhin
`--fork-session`, wodurch das Quelltranskript erhalten bleibt.

Auf dem Node ausgeführte Turns verwenden die Claude-Standardwerte des Nodes. In v1 erhalten sie weder die
Gateway-Loopback-MCP-Konfiguration noch das Gateway-Skills-Plugin, können nicht aus einem
Gateway-Transkript neu initialisiert werden und lehnen Anhänge sowie Bilder ab. Claude-Desktop-Zeilen und
Nodes, die den Ausführungsbefehl nicht veröffentlichen, bleiben schreibgeschützt. Der macOS-App-
Node veröffentlicht diesen Befehl noch nicht, daher bleiben seine Zeilen schreibgeschützt.

Informationen zum Verhalten der Control UI und zu den Speicherquellen finden Sie unter [Anthropic: Claude-Sitzungen auf mehreren Computern](/de/providers/anthropic#claude-sessions-across-computers).

### OpenCode- und Pi-Sitzungen

Die gebündelten OpenCode- und ACPX-Plugins erkennen außerdem schreibgeschützte native Sitzungskataloge
auf dem Gateway und gekoppelten Nodes. Ein Node veröffentlicht
`opencode.sessions.list.v1` / `opencode.sessions.read.v1`, wenn die `opencode`-
CLI installiert ist, und `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`,
wenn das Sitzungsverzeichnis von Pi vorhanden ist. Genehmigen Sie das Upgrade der Node-Kopplung, wenn neue
Befehle erstmals angezeigt werden. Wenn auch die entsprechende CLI verfügbar ist, fügt der Node
`opencode.terminal.resume.v1` oder `acpx.pi.terminal.resume.v1` hinzu; über das bestehende Zeilenmenü
und den Viewer-Header kann die ausgewählte Sitzung dann mit
`opencode --session <id>` oder `pi --session <id>` erneut im zugehörigen Terminal geöffnet werden.

OpenCode liest über seine offizielle CLI-JSON-/Export-Schnittstelle. Pi liest seinen
dokumentierten JSONL-Sitzungsspeicher, einschließlich projektbezogener und globaler `settings.json`-
Sitzungsverzeichnisse sowie der Überschreibungen `PI_CODING_AGENT_DIR` und
`PI_CODING_AGENT_SESSION_DIR`. Beide Kataloge sind standardmäßig aktiviert;
deaktivieren Sie sie in der Web-UI unter **Config > Plugins**.

Bei der Fortsetzung im Terminal werden das gespeicherte Arbeitsverzeichnis der Sitzung und dasselbe
Duplex-PTY-Relay mit Zulassungsliste wie bei Codex und Claude verwendet. Es ermöglicht keine beliebige
Node-Befehlsausführung.

### Datei-Uploads im Terminal

In der Control UI können Dateien in ein geöffnetes Terminal eines gekoppelten Nodes gezogen werden. Der native Node-Host veröffentlicht den ausschließlich für Administratoren vorgesehenen Befehl `terminal.upload`; genehmigen Sie das Kopplungs-Upgrade, wenn er erstmals angezeigt wird. Jede Datei ist auf 16 MiB begrenzt, wird in einem privaten temporären Verzeichnis auf diesem Node bereitgestellt und als Shell-quotierter Pfad an das Terminal zurückgegeben, ohne ausgeführt zu werden.

Die Pfadeinfügung unterstützt PowerShell, `cmd.exe` und erkannte POSIX-Shells (`sh`, Bash, Dash, Ash, Ksh, Zsh und Fish), einschließlich Git Bash unter Windows. Andere Shell-Überschreibungen werden abgelehnt, da deren Quotierungsregeln nicht sicher ermittelt werden können; führen Sie den Node-Host für native WSL-Pfade innerhalb von WSL aus. `cmd.exe`-Pfade, die `%` oder `!` enthalten, werden ebenfalls abgelehnt, da diese Shell die Zeichen selbst innerhalb doppelter Anführungszeichen expandiert.

## Befehle aufrufen

Niedrige Ebene (rohes RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` blockiert `system.run` und `system.run.prepare`; diese Befehle werden nur über das Tool `exec` mit `host=node` ausgeführt (siehe oben). Für die üblichen Workflows „dem Agenten einen MEDIA-Anhang übergeben“ stehen Hilfsfunktionen auf höherer Ebene zur Verfügung (Canvas, Kamera, Bildschirm, Standort, siehe unten).

Lang laufende, streamende Node-Befehle verwenden additive `node.invoke.progress`-Ereignisse.
Jedes Ereignis enthält die Aufruf-ID, eine nullbasierte Sequenznummer und ein
begrenztes UTF-8-Textfragment; das Gateway ordnet die Fragmente, bevor es sie an
den Aufrufer übermittelt. Das bestehende `node.invoke.result` bleibt die einzige
abschließende Antwort. Streaming-Aufrufer können eine Inaktivitätsfrist festlegen,
die mit dem ersten Fortschrittsereignis beginnt und nach späteren Fortschritten
zurückgesetzt wird, während das separate feste Zeitlimit des Aufrufs während
Genehmigung und Ausführung bestehen bleibt. Ergebnis, festes Zeitlimit,
Inaktivitätszeitlimit und Trennung der Node verwerfen jeweils den ausstehenden
Stream-Zustand. Eine Abbruchanforderung des Aufrufers löst `node.invoke.cancel` aus;
der Node-Host beendet daraufhin den zugehörigen Prozessbaum. Bestehende
Anfrage-/Antwortbefehle bleiben unverändert.

## Befehlsrichtlinie

Node-Befehle müssen zwei Prüfungen bestehen, bevor sie aufgerufen werden können:

1. Die Node muss den Befehl in ihren authentifizierten Verbindungsmetadaten deklarieren (`connect.commands`).
2. Die aus Plattform und Genehmigung abgeleitete Zulassungsliste des Gateways muss den deklarierten Befehl enthalten.

Standardmäßige Zulassungslisten nach Plattform (vor Plugin-Standardeinstellungen und Überschreibungen durch `allowCommands`/`denyCommands`):

| Plattform | Standardmäßig zulässige Befehle                                                                                                                                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (Node-Host-Befehle wie `system.run` sind genehmigungspflichtig, siehe unten)                                                                                                                                                                                                                                  |

Diese Zeilen beschreiben die Obergrenze der Gateway-Richtlinie, nicht die von jeder Node-App implementierten Befehle. Ein Befehl kann nur verwendet werden, wenn die verbundene Node ihn ebenfalls deklariert. Insbesondere deklariert die aktuelle macOS-App die in der macOS-Richtlinienzeile aufgeführten Geräte- und personenbezogenen Datenfamilien nicht.

`canvas.*`-Befehle (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) sind auf iOS, Android, macOS, Windows, Linux und unbekannten Plattformen eine Plugin-Standardeinstellung. Linux-Nodes deklarieren sie nur, wenn der lokale Canvas-Socket der Desktop-App vorhanden ist. Alle Canvas-Befehle sind unter iOS auf den Vordergrund beschränkt.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` sind standardmäßig für jede Node zulässig, die die Fähigkeit `talk` ankündigt oder `talk.*`-Befehle deklariert, unabhängig von der Plattformbezeichnung.

Desktop-Host-Befehle (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` und `screen.snapshot` unter macOS/Windows) sind nicht Teil der oben aufgeführten statischen Plattformstandardtabelle. Sie werden verfügbar, sobald der Betreiber eine Kopplungsanfrage genehmigt, die sie deklariert. Anschließend übernimmt die genehmigte Befehlsmenge der Node sie bei erneuter Verbindung.

Gefährliche oder besonders datenschutzkritische Befehle erfordern weiterhin eine ausdrückliche Aktivierung mit `gateway.nodes.allowCommands`, selbst wenn eine Node sie deklariert: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` hat stets Vorrang vor Standardeinstellungen und zusätzlichen Einträgen der Zulassungsliste. Informationen zur Einwilligungsprüfung auf dem iPhone finden Sie unter [HealthKit-Zusammenfassungen](/platforms/ios-healthkit), Informationen zu den zusätzlichen macOS-, Tool-Richtlinien- und Aktivierungsprüfungen für Desktop-Eingaben unter [Computernutzung](/de/nodes/computer-use).

Plugin-eigene Node-Befehle können eine Gateway-Richtlinie für Node-Aufrufe hinzufügen. Diese Richtlinie wird nach der Prüfung der Zulassungsliste und vor der Weiterleitung an die Node ausgeführt, sodass rohe `node.invoke`-Aufrufe, CLI-Hilfsprogramme und dedizierte Agent-Tools dieselbe Plugin-Berechtigungsgrenze verwenden. Gefährliche Plugin-Node-Befehle erfordern weiterhin eine ausdrückliche Aktivierung über `gateway.nodes.allowCommands`.

Nachdem eine Node ihre Liste deklarierter Befehle geändert hat, lehnen Sie die alte Gerätekopplung ab und genehmigen Sie die neue Anfrage, damit das Gateway den aktualisierten Befehlsschnappschuss speichert.

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
      // Von gekoppelten Nodes veröffentlichte, für Agents sichtbare Plugin-Tools als vertrauenswürdig behandeln (Standard: true).
      pluginTools: {
        enabled: true,
      },
      // Gefährliche/datenschutzkritische Node-Befehle aktivieren (camera.snap usw.).
      allowCommands: ["camera.snap", "screen.record"],
      // Exakte Befehlsnamen sperren, selbst wenn Standardeinstellungen oder allowCommands sie enthalten.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Standardmäßiger exec-Host: "node" leitet alle exec-Aufrufe an eine gekoppelte Node weiter.
      host: "node",
      // Sicherheitsmodus für Node-exec: nur genehmigte/in der Zulassungsliste enthaltene Befehle zulassen.
      security: "allowlist",
      // exec an eine bestimmte Node binden (ID oder Name). Weglassen, um jede Node zuzulassen.
      node: "build-node",
    },
  },
}
```

Verwenden Sie exakte Node-Befehlsnamen. `denyCommands` entfernt einen Befehl selbst dann, wenn eine Plattformstandardeinstellung oder ein `allowCommands`-Eintrag ihn andernfalls zulassen würde. Gekoppelte Nodes dürfen standardmäßig für Agents sichtbare Plugin-Tool-Deskriptoren veröffentlichen, doch der Befehl jedes Deskriptors muss weiterhin zur genehmigten Befehlsoberfläche der Node gehören. Setzen Sie `gateway.nodes.pluginTools.enabled: false`, um alle derartigen Deskriptoren zu ignorieren. Einzelheiten zu den Feldern für Gateway-Node-Kopplung und Befehlsrichtlinien finden Sie in der [Gateway-Konfigurationsreferenz](/de/gateway/configuration-reference#gateway).

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

## Screenshots (Canvas-Schnappschüsse)

Wenn die Node Canvas (WebView) anzeigt, gibt `canvas.snapshot` `{ format, base64 }` zurück.

CLI-Hilfsprogramm (schreibt in eine temporäre Datei und gibt den gespeicherten Pfad aus):

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

- `canvas present` akzeptiert auf Nodes, die lokale Pfade unterstützen, URLs oder lokale Dateipfade (`--target`) sowie optional `--x/--y/--width/--height` zur Positionierung. Linux Canvas akzeptiert HTTP(S)-URLs oder seinen gebündelten A2UI-Renderer.
- `canvas eval` akzeptiert eingebettetes JS (`--js`) oder ein Positionsargument.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Hinweise:

- Mobile Nodes und Linux-Desktop-Nodes verwenden eine gebündelte, App-eigene A2UI-Seite für aktionsfähiges Rendering.
- Es wird nur A2UI v0.8 JSONL unterstützt (v0.9/createSurface wird abgelehnt).
- iOS und Android rendern entfernte Gateway-Canvas-Seiten, A2UI-Schaltflächenaktionen werden jedoch nur von der gebündelten, App-eigenen A2UI-Seite ausgelöst. Vom Gateway gehostete HTTP/HTTPS-A2UI-Seiten dienen auf diesen mobilen Clients ausschließlich dem Rendering.
- macOS kann Aktionen von genau der fähigkeitsbezogenen Gateway-A2UI-Seite auslösen, die von der App ausgewählt wurde. Andere HTTP/HTTPS-Seiten dienen weiterhin ausschließlich dem Rendering.
- Linux löst Aktionen nur von der gebündelten A2UI-Seite aus. Andere HTTP/HTTPS-Seiten dienen weiterhin ausschließlich dem Rendering, und eine monitorlose Linux-Node ohne Desktop-App kündigt Canvas nicht an.

## Fotos und Videos (Node-Kamera)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # Standard: beide Ausrichtungen (2 MEDIA-Zeilen)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Videoclips (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Hinweise:

- Die Node muss für `canvas.*` und `camera.*` **im Vordergrund** sein (Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück).
- Nodes begrenzen die Clipdauer, damit die base64-Nutzlast handhabbar bleibt (die genauen plattformspezifischen Grenzwerte finden Sie unter [Kameraaufnahme](/de/nodes/camera)). Das Agent-Tool `nodes` begrenzt den angeforderten Wert `durationMs` zusätzlich auf 300000 (5 Minuten), bevor der Aufruf weitergeleitet wird; die Node selbst setzt den strengeren Grenzwert durch.
- Android fordert nach Möglichkeit die Berechtigungen `CAMERA`/`RECORD_AUDIO` an; verweigerte Berechtigungen schlagen mit `*_PERMISSION_REQUIRED` fehl.

## Bildschirmaufzeichnungen (Nodes)

Unterstützte Nodes stellen `screen.record` (mp4) bereit. Beispiel:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Hinweise:

- `screen.record`-Verfügbarkeit hängt von der Node-Plattform ab.
- Das Agent-Tool `nodes` begrenzt den angeforderten Wert für `durationMs` auf 300000 (5 Minuten); die Node kann einen strengeren Grenzwert erzwingen, um die zurückgegebene Nutzlast zu begrenzen.
- `--no-audio` deaktiviert die Mikrofonaufnahme auf unterstützten Plattformen.
- Verwenden Sie `--screen <index>`, um bei mehreren verfügbaren Bildschirmen einen Bildschirm auszuwählen (0 = primär).

## Standort (Nodes)

Nodes stellen `location.get` bereit, wenn der Standort in den Einstellungen aktiviert ist.

CLI-Hilfsbefehl:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Hinweise:

- Der Standort ist **standardmäßig deaktiviert**.
- „Immer“ erfordert eine Systemberechtigung; der Abruf im Hintergrund erfolgt nach bestem Bemühen.
- Die Antwort enthält Breiten-/Längengrad, Genauigkeit (Meter) und Zeitstempel.
- Vollständige Parameter-/Antwortstruktur und Fehlercodes: [Standortbefehl](/de/nodes/location-command).

## SMS (Android-Nodes)

Android-Nodes können `sms.send` und `sms.search` bereitstellen, wenn der Benutzer die Berechtigung **SMS** erteilt und das Gerät Telefonie unterstützt. Beide Befehle sind standardmäßig als gefährlich eingestuft: Der Gateway-Betreiber muss sie zusätzlich zu `gateway.nodes.allowCommands` hinzufügen, bevor sie aufgerufen werden können (siehe [Befehlsrichtlinie](#command-policy)).

Aktivieren Sie die schreibgeschützte SMS-Suche ausdrücklich in `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Fügen Sie `sms.send` nur dann separat hinzu, wenn die Node auch Nachrichten senden können soll. Android-Berechtigung und Gateway-Befehlsautorisierung sind unabhängig voneinander; das Erteilen der Telefonberechtigung ändert die Gateway-Richtlinie nicht.

Direkter Aufruf auf niedriger Ebene:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Hinweise:

- `sms.search` kann deklariert werden, bevor `READ_SMS` erteilt wurde, sodass ein Aufruf eine Berechtigungsdiagnose zurückgeben kann; zum Lesen von Nachrichten ist diese Android-Berechtigung weiterhin erforderlich.
- Reine WLAN-Geräte ohne Telefonie geben `sms.send` nicht an.
- Ein Fehler `requires explicit gateway.nodes.allowCommands opt-in` bedeutet, dass das Telefon den Befehl deklariert hat, der Gateway-Betreiber ihn jedoch nicht autorisiert hat.

## Befehle für Geräte- und personenbezogene Daten

iOS- und Android-Nodes geben standardmäßig mehrere schreibgeschützte Datenbefehle an (siehe Tabelle unter [Befehlsrichtlinie](#command-policy)); Android stellt zusätzlich eine größere Befehlsfamilie bereit, die durch eigene Einstellungen innerhalb der App eingeschränkt ist.

Verfügbare Familien:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — nur Android; `device.apps` erfordert, dass die Freigabe installierter Apps in den Android-Einstellungen aktiviert ist, und gibt standardmäßig im Launcher sichtbare Apps zurück.
- `notifications.list`, `notifications.actions` — nur Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (standardmäßig schreibgeschützt); `contacts.add` ist gefährlich und benötigt `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (standardmäßig schreibgeschützt); `calendar.add` ist gefährlich und benötigt `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (standardmäßig schreibgeschützt); `reminders.add` ist gefährlich und benötigt `gateway.nodes.allowCommands`.
- `callLog.search` — nur Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; durch die verfügbaren Sensoren funktionsbeschränkt.

Beispielaufrufe:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Systembefehle (Node-Host/Mac-Node)

Die macOS-Node stellt `system.run`, `system.which`, `system.notify` und `system.execApprovals.get/set` bereit. Der Headless-Node-Host stellt `system.run.prepare`, `system.run`, `system.which` und `system.execApprovals.get/set` bereit.

Beispiele:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Hinweise:

- `system.run` gibt Standardausgabe, Standardfehlerausgabe und Exit-Code in der Nutzlast zurück.
- Die Shell-Ausführung erfolgt jetzt über das Tool `exec` mit `host=node`; `nodes` bleibt die direkte RPC-Schnittstelle für explizite Node-Befehle.
- `nodes invoke` stellt `system.run` oder `system.run.prepare` nicht bereit; diese bleiben ausschließlich im Ausführungspfad.
- Der Ausführungspfad bereitet vor der Genehmigung einen kanonischen `systemRunPlan` vor. Nach Erteilung einer Genehmigung leitet das Gateway diesen gespeicherten Plan weiter und nicht etwaige später vom Aufrufer bearbeitete Befehls-, cwd- oder Sitzungsfelder.
- `system.notify` berücksichtigt den Status der Benachrichtigungsberechtigung in der macOS-App; unterstützt `--priority <passive|active|timeSensitive>` und `--delivery <system|overlay|auto>`.
- Nicht erkannte Node-Metadaten für `platform` / `deviceFamily` verwenden eine konservative standardmäßige Zulassungsliste, die `system.run` und `system.which` ausschließt. Wenn Sie diese Befehle absichtlich für eine unbekannte Plattform benötigen, fügen Sie sie ausdrücklich über `gateway.nodes.allowCommands` hinzu.
- `system.run` unterstützt `--cwd`, `--env KEY=VAL`, `--command-timeout` und `--needs-screen-recording`.
- Bei Shell-Wrappern (`bash|sh|zsh ... -c/-lc`) werden anfragebezogene Werte für `--env` auf eine ausdrückliche Zulassungsliste reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei dauerhaften Zulassungsentscheidungen im Zulassungslistenmodus speichern bekannte Dispatch-Wrapper (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) die Pfade der inneren ausführbaren Dateien statt der Wrapper-Pfade. Wenn das Entfernen der Wrapper-Schicht nicht sicher ist, wird nicht automatisch ein Eintrag in der Zulassungsliste gespeichert.
- Auf Windows-Node-Hosts im Zulassungslistenmodus erfordern Shell-Wrapper-Ausführungen über `cmd.exe /c` eine Genehmigung (ein Eintrag in der Zulassungsliste allein erlaubt die Wrapper-Form nicht automatisch).
- Node-Hosts ignorieren Überschreibungen von `PATH` in `--env` und entfernen vor der Ausführung eines Befehls eine umfangreiche, gepflegte Gruppe von Startvariablen für Interpreter und Shells (zum Beispiel `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`). Wenn Sie zusätzliche PATH-Einträge benötigen, konfigurieren Sie die Dienstumgebung des Node-Hosts (oder installieren Sie Tools an Standardspeicherorten), anstatt `PATH` über `--env` zu übergeben.
- Im macOS-Node-Modus wird `system.run` durch Ausführungsgenehmigungen in der macOS-App eingeschränkt (Settings → Exec approvals). Nachfrage/Zulassungsliste/vollständig verhalten sich wie beim Headless-Node-Host; abgelehnte Abfragen geben `SYSTEM_RUN_DENIED` zurück.
- Auf dem Headless-Node-Host wird `system.run` durch Ausführungsgenehmigungen (`~/.openclaw/exec-approvals.json`) eingeschränkt; speziell für macOS finden Sie die Umgebungsvariablen für das Routing zum Ausführungs-Host weiter unten unter [Headless-Node-Host](#headless-node-host-cross-platform).

## Bindung der Ausführung an eine Node

Wenn mehrere Nodes verfügbar sind, können Sie die Ausführung an eine bestimmte Node binden. Dadurch wird die Standard-Node für `exec host=node` festgelegt (und kann für einzelne Agenten überschrieben werden).

Globaler Standardwert:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Überschreibung pro Agent:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Zurücksetzen, um jede Node zuzulassen:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Berechtigungszuordnung

Nodes können in `node.list` / `node.describe` eine Zuordnung `permissions` enthalten, deren Schlüssel Berechtigungsnamen sind (z. B. `screenRecording`, `accessibility`, `location`) und deren Werte boolesch sind (`true` = erteilt).

## Headless-Node-Host (plattformübergreifend)

OpenClaw kann einen **Headless-Node-Host** (ohne Benutzeroberfläche) ausführen, der sich mit dem Gateway-WebSocket verbindet und `system.run` / `system.which` bereitstellt. Dies ist unter Linux/Windows oder zum Ausführen einer minimalen Node neben einem Server nützlich.

Starten Sie ihn:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Hinweise:

- Die Kopplung ist weiterhin erforderlich (das Gateway zeigt eine Aufforderung zur Gerätekopplung an).
- Metadaten der Clientinstanz, signierte Geräteidentität und Kopplungsauthentifizierung verwenden separate Dateien; siehe [Headless-Identitätsstatus](#headless-identity-state).
- Ausführungsgenehmigungen werden lokal über `~/.openclaw/exec-approvals.json` erzwungen (siehe [Ausführungsgenehmigungen](/de/tools/exec-approvals)).
- Unter macOS führt der Headless-Node-Host `system.run` standardmäßig lokal aus. Legen Sie `OPENCLAW_NODE_EXEC_HOST=app` fest, um `system.run` über den Ausführungs-Host der Begleit-App zu leiten; fügen Sie `OPENCLAW_NODE_EXEC_FALLBACK=0` hinzu, um den App-Host vorauszusetzen und bei dessen Nichtverfügbarkeit geschlossen fehlzuschlagen.
- Fügen Sie `--tls` / `--tls-fingerprint` hinzu, wenn der Gateway-WebSocket TLS verwendet.

## Mac-Node-Modus

- Die macOS-Menüleisten-App verbindet sich als Node mit dem Gateway-WebSocket-Server (sodass `openclaw nodes …` für diesen Mac funktioniert).
- Im Remote-Modus öffnet die App einen SSH-Tunnel für den Gateway-Port und verbindet sich mit `localhost`.
