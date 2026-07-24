---
read_when:
    - iOS-/watchOS-/Android-Nodes mit einem Gateway koppeln
    - Node-Canvas/Kamera für den Agentenkontext verwenden
    - Neue Node-Befehle oder CLI-Hilfsfunktionen hinzufügen
summary: 'Nodes: Kopplung, Funktionen, Berechtigungen und CLI-Hilfen für Canvas/Kamera/Bildschirm/Gerät/Benachrichtigungen/System'
title: Nodes
x-i18n:
    generated_at: "2026-07-24T04:39:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b4f7c80491d713777e1ba5b8f55c88bd9fa48be602b504e6ac6ba00cd12a4313
    source_path: nodes/index.md
    workflow: 16
---

Ein **Node** ist ein Begleitgerät (macOS/iOS/watchOS/Android/headless), das sich mit `role: "node"` mit dem Gateway verbindet und über `node.invoke` eine Befehlsoberfläche (z. B. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) bereitstellt. Die meisten Nodes verwenden den Gateway-WebSocket am Operator-Port. Der optionale direkte Apple-Watch-Node verwendet signiertes HTTPS-Polling am selben Port, da watchOS gewöhnlichen Apps generische Low-Level-Netzwerkverbindungen untersagt. Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

Veralteter Transport: [Bridge-Protokoll](/de/gateway/bridge-protocol) (TCP JSONL; für aktuelle Nodes nur von historischem Interesse).

macOS kann auch im **Node-Modus** ausgeführt werden: Die Menüleisten-App verbindet sich als ein Node mit dem
WS-Server des Gateways (sodass `openclaw nodes …` auf diesem Mac funktioniert). Die App
fügt der gleichen, von `openclaw node run` verwendeten Node-Host-Befehlsoberfläche native Befehle für Canvas, Kamera, Bildschirm, Benachrichtigungen und Computersteuerung
hinzu. Starten Sie auf diesem Mac keinen
zweiten CLI-Node; die App führt die entsprechende CLI-Node-Host-Laufzeit als
internen Worker aus und bleibt die einzige Gateway-Verbindung und Node-Identität.

Nodes sind **Peripheriegeräte**, keine Gateways: Sie führen den Gateway-Dienst nicht aus, und Kanalnachrichten (Telegram, WhatsApp usw.) gehen beim Gateway ein, nicht bei den Nodes.

Runbook zur Fehlerbehebung: [/nodes/troubleshooting](/de/nodes/troubleshooting)

## Kopplung und Status

Nodes verwenden die **Gerätekopplung**. Ein Node legt beim Verbindungsaufbau eine signierte Geräteidentität vor; das Gateway erstellt eine Gerätekopplungsanfrage für `role: node`. Genehmigen Sie sie über die Geräte-CLI (oder die Benutzeroberfläche). Bei der direkten Einrichtung der Apple Watch wird ein vom Administrator ausgestellter, kurzlebiger und ausschließlich für Nodes bestimmter Einrichtungscode verwendet, um ihre feste Befehlsoberfläche mit geringem Risiko zu genehmigen; eine spätere Erweiterung der Fähigkeiten erfordert weiterhin eine reguläre Genehmigung.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Ausstehende Kopplungsanfragen laufen 5 Minuten nach dem letzten Wiederholungsversuch des Geräts ab — ein Gerät, das die Verbindung fortlaufend erneut herstellt, hält seine eine ausstehende Anfrage (und `requestId`) aktiv, statt alle paar Minuten eine neue Aufforderung zu erzeugen; den vollständigen Anfrage-/Genehmigungslebenszyklus finden Sie unter [Node-Kopplung](/de/gateway/pairing). Wenn ein Node den Verbindungsversuch mit geänderten Authentifizierungsdetails (Rolle/Bereiche/öffentlicher Schlüssel) wiederholt, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt — Clients erhalten für die ersetzte Anfrage ein `device.pair.resolved`-Ereignis, und Sie sollten `openclaw devices list` vor der Genehmigung erneut ausführen.

- `nodes status` kennzeichnet einen Node als **gekoppelt**, wenn seine Gerätekopplungsrolle `node` umfasst.
- Ein verbundener nativer Mac kann unter
  **Settings -> Permissions -> Active computer detection** die zusammengefasste Aktivität physischer Eingaben aktivieren. Bedienungshilfen sind
  ebenfalls erforderlich. Das Gateway kennzeichnet den aktuellsten geeigneten Mac als
  `active`, stellt dem Agenten einen stabilen Node-ID-Hinweis bereit und leitet Warnungen zu Node-Verbindungen
  dorthin weiter, bevor es mit Verzögerung auf den Fallback zurückgreift. Informationen zu Einrichtung, Datenschutz, Zeitverhalten und
  Fehlerbehebung finden Sie unter
  [Präsenz des aktiven Computers](/de/nodes/presence).
- Der Gerätekopplungsdatensatz ist der dauerhafte Vertrag für die genehmigte Rolle. Die Token-Rotation bleibt innerhalb dieses Vertrags; sie kann einem gekoppelten Node keine Rolle zuweisen, die bei der Kopplung nie genehmigt wurde.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) ist ein separater, vom Gateway verwalteter Speicher für Node-Kopplungen, der die genehmigte Befehls-/Fähigkeitsoberfläche des Nodes über erneute Verbindungen hinweg verfolgt. Er steuert **nicht** die Transportauthentifizierung — dafür ist die Gerätekopplung zuständig.
- `openclaw nodes remove --node <id|name|ip>` entfernt eine Node-Kopplung. Bei einem gerätegestützten Node widerruft dies die Rolle `node` des Geräts im Speicher gekoppelter Geräte und trennt die Sitzungen dieses Geräts mit Node-Rolle: Ein Gerät mit mehreren Rollen behält seinen Eintrag und verliert nur die Rolle `node`, während der Eintrag eines reinen Node-Geräts gelöscht wird. Außerdem wird jeder entsprechende Eintrag aus dem separaten Node-Kopplungsspeicher entfernt. `operator.pairing` kann Nicht-Operator-Node-Einträge auf anderen Geräten entfernen; ein Aufrufer mit Geräte-Token, der seine eigene Node-Rolle auf einem Gerät mit mehreren Rollen widerruft, benötigt zusätzlich `operator.admin`.
- Der Genehmigungsumfang richtet sich nach den in der ausstehenden Anfrage deklarierten Befehlen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Node-Befehle ohne Ausführung: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Versionsabweichung und Upgrade-Reihenfolge

Der Gateway-WebSocket akzeptiert authentifizierte Node-Clients innerhalb eines N-1-Protokollfensters.
Das aktuelle v4-Gateway akzeptiert daher v3-Nodes, wenn die Verbindung sowohl
`role: "node"` als auch `client.mode: "node"` deklariert. Operator- und UI-Sitzungen müssen
weiterhin das aktuelle Protokoll verwenden.

Aktualisieren Sie bei gestaffelten Flotten-Upgrades zuerst das Gateway und anschließend jeden Node.
Ein N-1-Node bleibt während des Upgrades sichtbar und verwaltbar; das Gateway
protokolliert `legacy node protocol accepted` mit einer Upgrade-Empfehlung. Kopplung,
Geräteauthentifizierung, Befehls-Zulassungslisten und Ausführungsgenehmigungen gelten weiterhin.
Fähigkeiten und Befehle im Besitz von Plugins bleiben verborgen, bis der Node auf
das aktuelle Protokoll aktualisiert wurde. Nodes, die älter als N-1 sind, müssen außerhalb des normalen Verbindungswegs aktualisiert werden, bevor
sie erneut eine Verbindung herstellen können.

Der direkte watchOS-HTTPS-Transport erfordert die aktuelle Protokollversion; aktualisieren Sie
die Watch-App gemeinsam mit dem Gateway, bevor Sie den direkten Modus aktivieren.

## Entfernter Node-Host (system.run)

Verwenden Sie einen **Node-Host**, wenn Ihr Gateway auf einem Rechner ausgeführt wird und Befehle auf einem anderen Rechner ausgeführt werden sollen. Das Modell kommuniziert weiterhin mit dem **Gateway**; das Gateway leitet `exec`-Aufrufe an den **Node-Host** weiter, wenn `host=node` ausgewählt ist.

| Rolle        | Zuständigkeit                                                    |
| ------------ | ---------------------------------------------------------------- |
| Gateway-Host | Empfängt Nachrichten, führt das Modell aus und leitet Tool-Aufrufe weiter. |
| Node-Host    | Führt `system.run`/`system.which` auf dem Node-Rechner aus. |
| Genehmigungen | Werden auf dem Node-Host über `~/.openclaw/exec-approvals.json` erzwungen. |

Hinweis zur Genehmigung:

- Genehmigungspflichtige Node-Ausführungen werden an den exakten Anfragekontext gebunden. Der Ausführungspfad erstellt vor der Genehmigung einen kanonischen `systemRunPlan`; nach der Genehmigung leitet das Gateway diesen gespeicherten Plan weiter, nicht etwa später vom Aufrufer bearbeitete Befehls-, Arbeitsverzeichnis- oder Sitzungsfelder, und validiert das Arbeitsverzeichnis vor der Ausführung erneut.
- Bei direkten Datei-Ausführungen über Shell oder Laufzeit bindet OpenClaw nach bestem Bemühen außerdem einen konkreten lokalen Dateioperanden und verweigert die Ausführung, wenn sich diese Datei vor der Ausführung ändert.
- Wenn OpenClaw für einen Interpreter-/Laufzeitbefehl nicht genau eine konkrete lokale Datei identifizieren kann, wird die genehmigungspflichtige Ausführung verweigert, statt eine vollständige Abdeckung der Laufzeit vorzutäuschen. Verwenden Sie für umfassendere Interpretersemantik Sandboxing, separate Hosts oder eine ausdrücklich vertrauenswürdige Zulassungsliste bzw. einen vollständigen Workflow.

### Node-Host starten (Vordergrund)

Auf dem Node-Rechner:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` akzeptiert außerdem `--context-path` (Gateway-WS-Kontextpfad), `--tls`, `--tls-fingerprint <sha256>` und `--node-id` (überschreibt die veraltete Clientinstanz-ID; die Kopplung wird dadurch nicht zurückgesetzt). Übergeben Sie unter macOS `--share-installed-apps`, um `device.apps` bekannt zu geben; die Freigabe ist standardmäßig deaktiviert. Verwenden Sie `--no-share-installed-apps`, um eine zuvor gespeicherte Aktivierung zu deaktivieren.

### Entferntes Gateway über SSH-Tunnel (Loopback-Bindung)

Wenn das Gateway an Loopback gebunden ist (`gateway.bind=loopback`, Standard im lokalen Modus), können entfernte Node-Hosts keine direkte Verbindung herstellen. Erstellen Sie einen SSH-Tunnel und richten Sie den Node-Host auf das lokale Ende des Tunnels aus.

Beispiel (Node-Host -> Gateway-Host):

```bash
# Terminal A (laufen lassen): lokalen Port 18790 -> Gateway 127.0.0.1:18789 weiterleiten
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

### Node-Host starten (Dienst)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` akzeptiert außerdem `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (nur veraltete Clientinstanz-ID), `--share-installed-apps` / `--no-share-installed-apps`, `--runtime <node>` (Standard: Node) und `--force` zur Neuinstallation. `node status`, `node stop` und `node uninstall` sind ebenfalls verfügbar.

### Koppeln und benennen

Auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Wenn der Node den Verbindungsversuch mit geänderten Authentifizierungsdetails wiederholt, führen Sie `openclaw devices list` erneut aus und genehmigen Sie die aktuelle `requestId`.

Benennungsoptionen:

- `--display-name` bei `openclaw node run` / `openclaw node install` (wird in der gemeinsam genutzten `node_host_config`-SQLite-Zeile zusammen mit der Clientinstanz-ID und den Metadaten der Gateway-Verbindung dauerhaft gespeichert).
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

Aktuelle Node-Hosts deklarieren bei ihrer erstmaligen Kopplung die integrierte `mcp.tools.call.v1`-Befehlsfamilie, selbst wenn
kein MCP-Server konfiguriert ist. Ein Node, der mit einer älteren OpenClaw-Version gekoppelt wurde, kann nach der
Aktualisierung des Node-Hosts ein einmaliges Upgrade seiner Befehlsoberfläche anfordern. Das Hinzufügen, Entfernen oder Filtern von Servern erfordert danach keine
erneute Kopplung, da die genehmigte Befehlsfamilie unverändert bleibt. Starten Sie
`openclaw node run` oder `openclaw node restart` neu, um Änderungen an der Node-MCP-Konfiguration anzuwenden;
der Node-Host überwacht diese Konfiguration nicht.

Gateway-Betreiber können alle von gekoppelten Nodes veröffentlichten, für Agenten sichtbaren Tools ignorieren,
einschließlich auf Nodes gehosteter MCP-Tools, indem sie
`gateway.nodes.pluginTools.enabled: false` verwenden. Exakte Befehlsverbote wie
`gateway.nodes.commands.deny: ["mcp.tools.call.v1"]` blockieren ebenfalls die Ausführung.

### Auf dem Node gehostete Skills

Installieren Sie Skills im aktiven OpenClaw-Skills-Verzeichnis der Node-Maschine,
standardmäßig `~/.openclaw/skills`. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` und
`OPENCLAW_CONFIG_PATH` verschieben dieses aktive Profil. `OPENCLAW_STATE_DIR` hat
für Skills Vorrang; andernfalls befindet sich `skills/` neben dem von
`openclaw config file` ausgegebenen Pfad. Der Headless-Node-Host veröffentlicht gültige `SKILL.md`-Dateien,
nachdem er eine Verbindung hergestellt hat, und der Gateway fügt sie nur so lange zu den Skill-Snapshots des Agenten hinzu,
wie diese Node verbunden bleibt. Der Name jedes Skill-Verzeichnisses muss mit dem Frontmatter-Feld `name`
übereinstimmen, damit der abstrakte Node-Locator ohne Hinzufügen
eines weiteren Protokollfelds genau einem Eintrag zugeordnet wird.

Die anfängliche Kopplung für die Node-Rolle genehmigt die Veröffentlichung von Skills. Das Hinzufügen, Entfernen oder
Ändern von Skills erfordert weder eine erneute Kopplung noch eine
Änderung der Gateway-Konfiguration. Starten Sie `openclaw node run` oder `openclaw node restart` nach dem Ändern
der Node-Skill-Dateien neu; der Node-Host überwacht das Skills-Verzeichnis nicht.

Auf der Node gehostete Skill-Einträge identifizieren ihre Node und enthalten ihren
Ausführungsort. Skill-Dateien, referenzierte relative Pfade und Binärdateien verbleiben auf dieser
Node. Der Agent liest den angekündigten Speicherort `node://.../SKILL.md` mit dem
normalen Tool `read`. `file_fetch` akzeptiert vom Operator genehmigte absolute Node-Pfade,
keine Node-Skill-Locators; Laufzeitumgebungen ohne das normale Lesetool können stattdessen
`cat SKILL.md` über `exec host=node node=<node-id>` ausführen und dabei das angekündigte
Verzeichnis `node://.../skills/<name>` als `workdir` verwenden. Referenzierte Dateien und Binärdateien
verwenden dasselbe Ausführungsziel und Arbeitsverzeichnis. Der Node-Host löst diesen Locator relativ zu
seinem aktiven OpenClaw-Zustandsverzeichnis auf, sodass relative Pfade auf der Node statt
auf der Gateway-Maschine aufgelöst werden. Für die veröffentlichende Node muss `system.run` genehmigt sein,
und die Ausführungsrichtlinie des Agenten muss `host=node` zulassen; andernfalls bleibt der Skill
außerhalb des Snapshots dieses Agenten.

Setzen Sie `nodeHost.skills.enabled: false` auf der Node, um die Veröffentlichung zu stoppen. Gateway-
Operatoren können Skills von allen gekoppelten Nodes mit
`gateway.nodes.allowSkills: false` ignorieren.

### Headless-Identitätsstatus

Die Headless-Node verwaltet drei separate Zustandsdatensätze in der gemeinsam genutzten SQLite-Datenbank:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): die Clientinstanz-ID, der Anzeigename und die Gateway-Verbindungsmetadaten.
- `~/.openclaw/state/openclaw.sqlite` (`device_identities`, Schlüssel `primary`): das signierte Geräteschlüsselpaar und die daraus abgeleitete kryptografische Geräte-ID.
- `~/.openclaw/state/openclaw.sqlite` (`device_auth_tokens`): gekoppelte Geräteauthentifizierungstoken, nach kryptografischer Geräte-ID und Rolle indiziert.

Für eine signierte Node verwendet der Gateway die kryptografische Geräte-ID für die Kopplung und
das Node-Routing. Die Clientinstanz-ID dient nur als Verbindungsmetadatum. Das Ändern von
`--node-id` oder das Migrieren einer eingestellten `node.json` setzt die Kopplung daher nicht zurück. Informationen zum
unterstützten Ablauf für Widerruf und erneute Kopplung sowie Upgrade-Hinweise finden Sie unter
[Identitäts- und Kopplungsstatus](/de/cli/node#identity-and-pairing-state).

Eingestellte Dateien `identity/device.json` und `identity/device-auth.json` sind
Doctor-eigene Migrationseingaben. Stoppen Sie den Node-Host und führen Sie
`openclaw doctor --fix` aus; Doctor importiert und überprüft ihre Zeilen in SQLite, bevor
die alten Dateien entfernt werden.

### Befehle zur Zulassungsliste hinzufügen

Ausführungsgenehmigungen gelten **pro Node-Host**. Fügen Sie Zulassungslisteneinträge vom Gateway aus hinzu:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Genehmigungen werden auf dem Node-Host unter `~/.openclaw/exec-approvals.json` gespeichert.

### Ausführung auf die Node ausrichten

Konfigurieren Sie die Standardwerte (Gateway-Konfiguration):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.mode allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Oder pro Sitzung:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Nach der Konfiguration wird jeder `exec`-Aufruf mit `host=node` auf dem Node-Host ausgeführt (vorbehaltlich der Node-Zulassungsliste und -Genehmigungen).

`host=auto` wählt die Node nicht implizit selbst aus, aber eine explizite `host=node`-Anforderung pro Aufruf ist von `auto` aus zulässig. Wenn die Node-Ausführung standardmäßig für die Sitzung verwendet werden soll, setzen Sie `tools.exec.host=node` oder `/exec host=node ...` explizit.

Verwandte Themen:

- [Node-Host-CLI](/de/cli/node)
- [Ausführungstool](/de/tools/exec)
- [Ausführungsgenehmigungen](/de/tools/exec-approvals)

### Lokale Modellinferenz

Eine Desktop- oder Server-Node kann chatfähige Modelle eines auf dieser Node laufenden Ollama-Servers bereitstellen. Agenten verwenden das Tool `node_inference` des Ollama-Plugins, um installierte Modelle zu erkennen und einen begrenzten Prompt remote auszuführen; der Gateway benötigt keinen direkten Netzwerkzugriff auf Ollama. Informationen zur Einrichtung, Modellfilterung und direkten Verifizierungsbefehlen finden Sie unter [Node-lokale Ollama-Inferenz](/de/providers/ollama#node-local-inference).

### Codex-Sitzungen und -Transkripte

Das offizielle Plugin `codex` kann nicht archivierte Codex-Sitzungen auf einem
Headless-Node-Host oder einer nativen macOS-Node bereitstellen. Die Katalogregistrierung hängt nicht mehr
von `supervision.enabled` ab; diese Option steuert die agentenseitigen Überwachungstools.
Setzen Sie `sessionCatalog.enabled: false` in der Codex-Plugin-Konfiguration, um den
Operatorkatalog und die Katalogbefehle für gekoppelte Nodes zu deaktivieren, ohne den
Provider oder das Harness zu deaktivieren.
Das Plugin muss weiterhin auf beiden Computern aktiv sein, und die Node-Einstellung bleibt
eine lokale Einwilligung: Wenn sie nur auf dem Gateway aktiviert wird, kann dieser den Codex-
Status eines anderen Computers nicht lesen.

Die Node kündigt die versionierten schreibgeschützten Befehle
`codex.appServer.threads.list.v1` und
`codex.appServer.thread.turns.list.v1` an. Ein nativer Node-Host, auf dem die
Codex-CLI verfügbar ist, kündigt außerdem `codex.terminal.resume.v1` an. Genehmigen Sie das Upgrade der Node-Kopplung,
wenn diese Befehle erstmals angezeigt werden. Der Gateway ruft sie über die
normale Plugin-Node-Richtlinie auf und isoliert Fehler nach Host.

Zeilen gekoppelter Nodes erscheinen als Gruppe **Codex** in der normalen Sitzungsseitenleiste.
Innerhalb jedes Hosts werden Zeilen standardmäßig nach Projektordner gruppiert; ein Arbeitsverzeichnis
unter `.claude/worktrees/<name>` wird seinem Ursprungs-Repository zugeordnet, und Projektgruppen
lassen sich wie andere Seitenleistenabschnitte einklappen. Verwenden Sie das Ordnersymbol in der Katalog-
Kopfzeile, um die Projektgruppen aufzulösen oder wiederherzustellen. Dieselbe Gruppierung gilt für
den Claude-Sitzungskatalog.
Standardmäßig öffnet die Auswahl einer Zeile den normalen Chat-Bereich und liest das persistierte Transkript
über begrenzte, cursor-paginierte
`thread/turns/list`-Aufrufe mit vollständiger Elementprojektion. Verwenden Sie das Zeilenmenü, die Kopfzeile des Viewers oder die Einstellung **Open Codex/Claude sessions in**, um `codex resume <thread-id>` im Operatorterminal auf dem Computer zu starten, dem die Sitzung gehört. Der Terminalpfad der gekoppelten Node ist ein vom Codex-Plugin verwaltetes PTY-Relay mit Zulassungsliste und keine beliebige Node-Befehlsausführung.

Das Relay stellt nicht die vollständigen Fortsetzungs- und Archiveigentumsverträge des OpenClaw-Harness bereit. **Continue** und **Archive** sind daher für Remote-Zeilen nicht verfügbar. Auf dem Gateway-Computer können gespeicherte und inaktive
Zeilen einen separaten, modellgebundenen Chat-Zweig starten. Beide können erst archiviert werden,
nachdem der Operator bestätigt hat, dass kein anderer Codex-Client sie verwendet; die Live-
Aktivität einer gespeicherten Zeile bleibt unbekannt. Aktive Zeilen können weder verzweigt noch archiviert werden.

Informationen zur Einrichtung, Paginierung, lokalen Fortsetzung und zur Sicherheitsgrenze für Metadaten finden Sie unter [Codex-Sitzungen überwachen](/de/plugins/codex-supervision).

### Claude-Sitzungen und -Transkripte

Das gebündelte Plugin `anthropic` erkennt standardmäßig nicht archivierte Claude-CLI- und Claude-
Desktop-Sitzungen auf dem Gateway und gekoppelten Nodes. Setzen Sie
`plugins.entries.anthropic.config.sessionCatalog.enabled: false`, um den
Operatorkatalog und die Katalogbefehle für gekoppelte Nodes zu deaktivieren, ohne Anthropic-
Modelle oder das Claude-CLI-Backend zu deaktivieren.
Eine Remote-macOS-App-Node kündigt
`anthropic.claude.sessions.list.v1` und `anthropic.claude.sessions.read.v1`
an, wenn das Anthropic-Plugin aktiviert ist und `~/.claude/projects/` vorhanden ist. Genehmigen Sie
das Upgrade der Node-Kopplung, wenn diese Befehle erstmals angezeigt werden.

Ein nativer Node-Host mit verfügbarer Claude-CLI kündigt außerdem
`anthropic.claude.terminal.resume.v1` an. Geeignete CLI- und Desktop-Zeilen können
`claude --resume <session-id>` im Operatorterminal auf ihrem jeweiligen Host öffnen.
Dabei wird die native Sitzung übernommen; anders als bei der OpenClaw-Übernahme wird die
Claude-Sitzung nicht zuvor verzweigt.

Der Katalog kombiniert gültige Claude-CLI-Projektindexdatensätze mit einem begrenzten
Metadaten-Fallback für nicht indizierte JSONL-Transkripte. Dieser Fallback erkennt
gleichzeitige interaktive Sitzungen ohne Sidechain (`cli`) und Headless-Agent-SDK-CLI-
Sitzungen (`sdk-cli`). Die lokalen Metadaten von Claude Desktop liefern Desktop-Titel und den Archiv-
status. Desktop-Metadaten haben Vorrang, wenn beide Quellen auf dieselbe Claude-Code-
Sitzungs-ID verweisen; reine CLI-Transkripte bleiben sichtbar, da die CLI kein Archiv-
Flag besitzt. Transkripte werden mit undurchsichtigen
Byte-Offset-Cursorn und begrenzten rückwärtsgerichteten Dateilesevorgängen gelesen, sodass bei der Auswahl einer großen
Sitzung oder beim Laden einer älteren Seite nicht der gesamte JSONL-Verlauf in eine einzige
Gateway-Antwort eingelesen wird.

Die Auflistungs- und Lesebefehle sind schreibgeschützt. Sie stellen Katalogmetadaten und Transkript-
inhalte nur über die generischen Methoden `sessions.catalog.list` und
`sessions.catalog.read` für eine authentifizierte Operatorverbindung mit
`operator.write` bereit. Eine Gateway-lokale Claude-CLI-Zeile kann über den normalen
Chat-Composer übernommen werden: OpenClaw importiert den begrenzten sichtbaren Verlauf, setzt ihn
beim ersten Durchlauf mit `--fork-session` fort und lässt das Quelltranskript unverändert.

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

Die Node kündigt `agent.cli.claude.run.v1` nur an, wenn diese Node-lokale Einstellung
aktiviert ist und die ausführbare Datei `claude` auf dieser Node aufgelöst werden kann. Der Gateway kann
sie nicht remote aktivieren. Der Befehl durchläuft außerdem die bestehende Ausführungs-
genehmigungsrichtlinie der Node. Wenn alle drei Claude-Befehle angekündigt und durch
die Node-Befehlsrichtlinie des Gateways zugelassen werden, kann eine Claude-CLI-
Zeile auf dieser Node fortgesetzt werden: OpenClaw importiert einen begrenzten Verlauf, bindet
die übernommene Sitzung an die Node und ihr vom Katalog gemeldetes Arbeitsverzeichnis und
führt dort jeden einmaligen `claude -p`-Durchlauf aus. Der erste Durchlauf verwendet weiterhin
`--fork-session`, sodass das Quelltranskript erhalten bleibt.

Auf der Node ausgeführte Durchläufe verwenden die Claude-Standardwerte der Node. In v1 erhalten sie weder die
Gateway-Loopback-MCP-Konfiguration noch das Gateway-Skills-Plugin, können nicht aus einem
Gateway-Transkript neu initialisiert werden und lehnen Anhänge und Bilder ab. Claude-Desktop-Zeilen und
Nodes, die den Ausführungsbefehl nicht ankündigen, bleiben schreibgeschützt. Die macOS-App-
Node kündigt diesen Befehl noch nicht an, sodass ihre Zeilen schreibgeschützt bleiben.

Informationen zum Verhalten der Control UI und zu den Speicherquellen finden Sie unter [Anthropic: Claude-Sitzungen auf mehreren Computern](/de/providers/anthropic#claude-sessions-across-computers).

### OpenCode- und Pi-Sitzungen

Die gebündelten OpenCode- und ACPX-Plugins erkennen außerdem schreibgeschützte native Sitzungs-
kataloge auf dem Gateway und gekoppelten Nodes. Eine Node kündigt
`opencode.sessions.list.v1` / `opencode.sessions.read.v1` an, wenn die CLI `opencode`
installiert ist, und `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`,
wenn das Sitzungsverzeichnis von Pi vorhanden ist. Genehmigen Sie das Upgrade der Node-Kopplung, wenn neue
Befehle erstmals angezeigt werden. Wenn auch die entsprechende CLI verfügbar ist, fügt die Node
`opencode.terminal.resume.v1` oder `acpx.pi.terminal.resume.v1` hinzu; über das vorhandene Zeilen-
menü und die Viewer-Kopfzeile kann die ausgewählte Sitzung dann mit `opencode --session <id>` oder `pi --session <id>` erneut in ihrem jeweiligen
Terminal geöffnet werden.

OpenCode liest über seine offizielle CLI-JSON-/Exportoberfläche. Pi liest seinen
dokumentierten JSONL-Sitzungsspeicher, einschließlich projektbezogener und globaler `settings.json`-
Sitzungsverzeichnisse sowie der Überschreibungen `PI_CODING_AGENT_DIR` und
`PI_CODING_AGENT_SESSION_DIR`. Beide Kataloge sind standardmäßig aktiviert;
deaktivieren Sie sie in der Web-UI unter **Config > Plugins**.

Die Fortsetzung im Terminal verwendet das gespeicherte Arbeitsverzeichnis der Sitzung und dasselbe
duplexfähige PTY-Relay mit Zulassungsliste wie Codex und Claude. Sie ermöglicht keine beliebige
Node-Befehlsausführung.

### Terminal-Dateiuploads

Die Control UI kann Dateien in ein geöffnetes Terminal eines gekoppelten Nodes ziehen. Der native Node-Host stellt den nur für Administratoren verfügbaren Befehl `terminal.upload` bereit; genehmigen Sie das Kopplungs-Upgrade, wenn es erstmals angezeigt wird. Jede Datei ist auf 16 MiB begrenzt, wird in einem privaten temporären Verzeichnis auf diesem Node bereitgestellt und als Shell-maskierter Pfad an das Terminal zurückgegeben, ohne ausgeführt zu werden.

Das Einfügen von Pfaden unterstützt PowerShell, `cmd.exe` und erkannte POSIX-Shells (`sh`, Bash, Dash, Ash, Ksh, Zsh und Fish), einschließlich Git Bash unter Windows. Andere Shell-Überschreibungen werden abgelehnt, da ihre Quotierungsregeln nicht sicher abgeleitet werden können; führen Sie den Node-Host für native WSL-Pfade innerhalb von WSL aus. `cmd.exe`-Pfade, die `%` oder `!` enthalten, werden ebenfalls abgelehnt, da diese Shell solche Zeichen selbst innerhalb doppelter Anführungszeichen expandiert.

## Befehle aufrufen

Niedrige Ebene (roher RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` blockiert `system.run` und `system.run.prepare`; diese Befehle werden ausschließlich über das Tool `exec` mit `host=node` ausgeführt (siehe oben). Für die üblichen Abläufe zum „Bereitstellen eines MEDIA-Anhangs für den Agenten“ stehen übergeordnete Hilfsfunktionen zur Verfügung (Canvas, Kamera, Bildschirm, Standort, siehe unten).

Lang laufende, streamende Node-Befehle verwenden additive
`node.invoke.progress`-Ereignisse. Jedes Ereignis enthält die Aufruf-ID, eine bei null
beginnende Sequenznummer und ein begrenztes UTF-8-Textfragment; der Gateway
ordnet die Fragmente, bevor er sie an den Aufrufer übermittelt. Das bestehende
`node.invoke.result` bleibt die einzige abschließende Antwort. Streamende Aufrufer
können eine Inaktivitätsfrist festlegen, die mit dem ersten Fortschrittsereignis
beginnt und nach späteren Fortschritten zurückgesetzt wird, während das separate
harte Zeitlimit des Aufrufs während Genehmigung und Ausführung bestehen bleibt.
Ergebnis, hartes Zeitlimit, Inaktivitätszeitlimit und Trennung des Nodes verwerfen
jeweils den ausstehenden Stream-Zustand. Eine Abbrechung durch den Aufrufer löst
`node.invoke.cancel` aus; der Node-Host beendet anschließend den zugehörigen
Prozessbaum. Bestehende Anfrage-/Antwortbefehle bleiben unverändert.

## Befehlsrichtlinie

Node-Befehle müssen zwei Prüfungen bestehen, bevor sie aufgerufen werden können:

1. Der Node muss den Befehl in seinen authentifizierten Verbindungsmetadaten deklarieren (`connect.commands`).
2. Die aus Plattform und Genehmigung abgeleitete Zulassungsliste des Gateways muss den deklarierten Befehl enthalten.

Standardmäßige Zulassungslisten nach Plattform (vor Plugin-Standardwerten und Überschreibungen durch `commands.allow`/`commands.deny`):

| Plattform | Standardmäßig erlaubte Befehle                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `device.apps`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                         |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (Node-Host-Befehle wie `system.run` sind genehmigungspflichtig, siehe unten)                                                                                                                                                                                                                                  |

Diese Zeilen beschreiben die Obergrenze der Gateway-Richtlinie, nicht die von jeder Node-App implementierten Befehle. Ein Befehl kann nur verwendet werden, wenn der verbundene Node ihn ebenfalls deklariert. Insbesondere deklariert die aktuelle macOS-App die in der macOS-Richtlinienzeile aufgeführten Geräte- und Personendaten-Befehlsfamilien nicht.

`canvas.*`-Befehle (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) sind auf iOS, Android, macOS, Windows, Linux und unbekannten Plattformen ein Plugin-Standardwert. Linux-Nodes deklarieren sie nur, wenn der lokale Canvas-Socket der Desktop-App vorhanden ist. Unter iOS sind alle Canvas-Befehle auf den Vordergrund beschränkt.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` sind standardmäßig für jeden Node erlaubt, der die Fähigkeit `talk` bereitstellt oder `talk.*`-Befehle deklariert, unabhängig von der Plattformbezeichnung.

Desktop-Host-Befehle (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` und `screen.snapshot` unter macOS/Windows/Linux) sind nicht Teil der obigen statischen Tabelle mit Plattform-Standardwerten. Sie werden verfügbar, sobald der Betreiber eine Kopplungsanfrage genehmigt, die sie deklariert. Danach werden sie bei erneuter Verbindung durch den genehmigten Befehlssatz des Nodes beibehalten.

Gefährliche oder besonders datenschutzrelevante Befehle erfordern weiterhin eine ausdrückliche Aktivierung mit `gateway.nodes.commands.allow`, selbst wenn ein Node sie deklariert: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.commands.deny` hat stets Vorrang vor Standardwerten und zusätzlichen Einträgen der Zulassungsliste. Informationen zur Zustimmungssperre auf dem iPhone finden Sie unter [HealthKit-Zusammenfassungen](/de/platforms/ios-healthkit), Informationen zu den zusätzlichen Sperren für Fähigkeit, Tool-Richtlinie, Aktivierung und Plattformausführung bei Desktop-Eingaben unter [Computersteuerung](/de/nodes/computer-use).

Plugin-eigene Node-Befehle können eine Gateway-Richtlinie für Node-Aufrufe hinzufügen. Diese Richtlinie wird nach der Prüfung der Zulassungsliste und vor der Weiterleitung an den Node ausgeführt, sodass rohe `node.invoke`-Aufrufe, CLI-Hilfsfunktionen und dedizierte Agenten-Tools dieselbe Plugin-Berechtigungsgrenze verwenden. Gefährliche Plugin-Node-Befehle erfordern weiterhin eine ausdrückliche Aktivierung über `gateway.nodes.commands.allow`.

Nachdem ein Node seine Liste deklarierter Befehle geändert hat, lehnen Sie die alte Gerätekopplung ab und genehmigen Sie die neue Anfrage, damit der Gateway den aktualisierten Befehlsschnappschuss speichert.

## Konfiguration (`openclaw.json`)

Node-bezogene Einstellungen befinden sich unter `gateway.nodes` und `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Erstmalige Node-Kopplungen aus vertrauenswürdigen Netzwerken automatisch genehmigen (CIDR-Liste).
      // Deaktiviert, wenn nicht festgelegt. Gilt nur für erstmalige role:node-Anfragen
      // ohne angeforderte Bereiche; Upgrades werden nicht automatisch genehmigt.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // SSH-verifizierte automatische Genehmigung (Standard: aktiviert). Genehmigt erstmalige
        // Node-Kopplungen bei exakter Übereinstimmung des über SSH zurückgelesenen Geräteschlüssels.
        sshVerify: true,
      },
      // Von gekoppelten Nodes veröffentlichte, für Agenten sichtbare Plugin-Tools als vertrauenswürdig einstufen (Standard: true).
      pluginTools: {
        enabled: true,
      },
      // Gefährliche/besonders datenschutzrelevante Node-Befehle aktivieren (camera.snap usw.).
      commands: {
        allow: ["camera.snap", "screen.record"],
        // Exakte Befehlsnamen blockieren, selbst wenn sie in den Standardwerten oder commands.allow enthalten sind.
        deny: ["camera.clip"],
      },
    },
  },
  tools: {
    exec: {
      // Standardmäßiger exec-Host: "node" leitet alle exec-Aufrufe an einen gekoppelten Node weiter.
      host: "node",
      // Sicherheitsmodus für Node-exec: nur genehmigte/in der Zulassungsliste enthaltene Befehle erlauben.
      security: "allowlist",
      // exec an einen bestimmten Node (ID oder Name) binden. Weglassen, um jeden Node zuzulassen.
      node: "build-node",
    },
  },
}
```

Verwenden Sie exakte Node-Befehlsnamen. `commands.deny` entfernt einen Befehl selbst dann, wenn ein Plattform-Standardwert oder ein `commands.allow`-Eintrag ihn andernfalls zulassen würde. Gekoppelte Nodes können standardmäßig für Agenten sichtbare Plugin-Tool-Deskriptoren veröffentlichen, doch der Befehl jedes Deskriptors muss weiterhin zur genehmigten Befehlsoberfläche des Nodes gehören. Legen Sie `gateway.nodes.pluginTools.enabled: false` fest, um alle derartigen Deskriptoren zu ignorieren. Einzelheiten zu den Feldern für Node-Kopplung und Befehlsrichtlinien des Gateways finden Sie in der [Referenz zur Gateway-Konfiguration](/de/gateway/configuration-reference#gateway).

Node-Überschreibung für exec je Agent:

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

Wenn der Node den Canvas (WebView) anzeigt, gibt `canvas.snapshot` den Wert `{ format, base64 }` zurück.

CLI-Hilfsfunktion (schreibt in eine temporäre Datei und gibt den gespeicherten Pfad aus):

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

- `canvas present` akzeptiert URLs oder lokale Dateipfade (`--target`) auf Nodes, die lokale Pfade unterstützen, sowie optional `--x/--y/--width/--height` zur Positionierung. Linux Canvas akzeptiert HTTP(S)-URLs oder seinen gebündelten A2UI-Renderer.
- `canvas eval` akzeptiert Inline-JS (`--js`) oder ein Positionsargument.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Hinweise:

- Mobile Nodes und Linux-Desktop-Nodes verwenden für die Darstellung mit Aktionsunterstützung eine gebündelte, der App zugehörige A2UI-Seite.
- Es wird ausschließlich A2UI v0.8 JSONL unterstützt (v0.9/createSurface wird abgelehnt).
- iOS und Android stellen entfernte Gateway-Canvas-Seiten dar, A2UI-Schaltflächenaktionen werden jedoch nur von der gebündelten, der App zugehörigen A2UI-Seite weitergeleitet. Vom Gateway gehostete HTTP/HTTPS-A2UI-Seiten dienen auf diesen mobilen Clients ausschließlich der Darstellung.
- macOS kann Aktionen von genau der fähigkeitsbezogenen Gateway-A2UI-Seite weiterleiten, die von der App ausgewählt wurde. Andere HTTP/HTTPS-Seiten dienen weiterhin ausschließlich der Darstellung.
- Linux leitet Aktionen ausschließlich von der gebündelten A2UI-Seite weiter. Andere HTTP/HTTPS-Seiten dienen weiterhin ausschließlich der Darstellung, und ein monitorloser Linux-Node ohne Desktop-App stellt Canvas nicht als Fähigkeit bereit.

## Fotos und Videos (Node-Kamera)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # Standard: beide Kameras (2 MEDIA-Zeilen)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Videoclips (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Hinweise:

- Der Node muss für `canvas.*` und `camera.*` **im Vordergrund** ausgeführt werden (Aufrufe im Hintergrund geben `NODE_BACKGROUND_UNAVAILABLE` zurück).
- Nodes begrenzen die Clipdauer, damit die Base64-Nutzlast handhabbar bleibt (die genauen plattformspezifischen Grenzwerte finden Sie unter [Kameraaufnahme](/de/nodes/camera)). Das Agent-Tool `nodes` begrenzt die angeforderte `durationMs` vor dem Weiterleiten des Aufrufs zusätzlich auf 300000 (5 Minuten); der Node selbst setzt den strengeren Grenzwert durch.
- Android fordert nach Möglichkeit die Berechtigungen `CAMERA`/`RECORD_AUDIO` an; verweigerte Berechtigungen führen zu `*_PERMISSION_REQUIRED`.

## Bildschirmaufzeichnungen (Nodes)

Unterstützte Nodes stellen `screen.record` (mp4) bereit. Beispiel:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Hinweise:

- Die Verfügbarkeit von `screen.record` hängt von der Node-Plattform ab.
- Das Agent-Tool `nodes` begrenzt die angeforderte `durationMs` auf 300000 (5 Minuten); der Node kann einen strengeren Grenzwert durchsetzen, um die zurückgegebene Nutzlast zu begrenzen.
- `--no-audio` deaktiviert die Mikrofonaufnahme auf unterstützten Plattformen.
- Verwenden Sie `--screen <index>`, um bei mehreren verfügbaren Bildschirmen einen Bildschirm auszuwählen (0 = primärer Bildschirm).

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
- Die Antwort enthält Breitengrad/Längengrad, Genauigkeit (Meter) und Zeitstempel.
- Vollständige Parameter-/Antwortstruktur und Fehlercodes: [Standortbefehl](/de/nodes/location-command).

## SMS (Android-Nodes)

Android-Nodes können `sms.send` und `sms.search` bereitstellen, wenn der Benutzer die **SMS**-Berechtigung erteilt und das Gerät Telefonie unterstützt. Beide Befehle gelten standardmäßig als gefährlich: Der Gateway-Betreiber muss sie zusätzlich zu `gateway.nodes.commands.allow` hinzufügen, bevor sie aufgerufen werden können (siehe [Befehlsrichtlinie](#command-policy)).

Aktivieren Sie die schreibgeschützte SMS-Suche ausdrücklich in `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      commands: { allow: ["sms.search"] },
    },
  },
}
```

Fügen Sie `sms.send` nur dann separat hinzu, wenn der Node auch Nachrichten senden können soll. Android-Berechtigung und Gateway-Befehlsautorisierung sind unabhängig voneinander; das Erteilen der Telefonberechtigung ändert die Gateway-Richtlinie nicht.

Low-Level-Aufruf:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Hinweise:

- `sms.search` kann vor der Erteilung von `READ_SMS` deklariert werden, damit ein Aufruf eine Berechtigungsdiagnose zurückgeben kann; zum Lesen von Nachrichten ist diese Android-Berechtigung weiterhin erforderlich.
- Geräte ohne Telefonie, die ausschließlich WLAN verwenden, geben `sms.send` nicht bekannt.
- Ein `requires explicit gateway.nodes.commands.allow opt-in`-Fehler bedeutet, dass das Telefon den Befehl deklariert hat, der Gateway-Betreiber ihn jedoch nicht autorisiert hat.

## Befehle für Geräte- und personenbezogene Daten

iOS- und Android-Nodes geben standardmäßig mehrere schreibgeschützte Datenbefehle bekannt (siehe Tabelle unter [Befehlsrichtlinie](#command-policy)); Android stellt zusätzlich eine größere Familie bereit, die durch eigene Einstellungen in der App gesteuert wird. Ein macOS- oder Headless-Mac-TypeScript-Node-Host gibt `device.apps` erst bekannt, nachdem der Betreiber die Freigabe installierter Apps mit `--share-installed-apps` aktiviert hat.

Verfügbare Familien:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health` — nur Android.
- `device.apps` — Android-, macOS- und Headless-Mac-Nodes. Android erfordert die Freigabe installierter Apps in den Einstellungen und gibt standardmäßig im Launcher sichtbare Apps zurück. TypeScript-Node-Hosts lassen die Freigabe standardmäßig deaktiviert und akzeptieren `query`, `limit` und `includeSystem`; macOS-Ergebnisse enthalten `label`, `bundleId`, `path` und `system`.
- `notifications.list`, `notifications.actions` — nur Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (standardmäßig schreibgeschützt); `contacts.add` ist gefährlich und erfordert `gateway.nodes.commands.allow`.
- `calendar.events` — iOS, Android (standardmäßig schreibgeschützt); `calendar.add` ist gefährlich und erfordert `gateway.nodes.commands.allow`.
- `reminders.list` — iOS, Android (standardmäßig schreibgeschützt); `reminders.add` ist gefährlich und erfordert `gateway.nodes.commands.allow`.
- `callLog.search` — nur Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; durch verfügbare Sensoren funktionsbeschränkt.

Beispielaufrufe:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Systembefehle (Node-Host/Mac-Node)

Der macOS-Node stellt `system.run`, `system.which`, `system.notify` und `system.execApprovals.get/set` bereit. Der Headless-Node-Host stellt `system.run.prepare`, `system.run`, `system.which` und `system.execApprovals.get/set` bereit.

Beispiele:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway bereit"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Hinweise:

- `system.run` gibt Standardausgabe, Standardfehlerausgabe und Exit-Code in der Nutzlast zurück.
- Die Shell-Ausführung erfolgt jetzt über das Tool `exec` mit `host=node`; `nodes` bleibt die direkte RPC-Oberfläche für explizite Node-Befehle.
- `nodes invoke` stellt `system.run` oder `system.run.prepare` nicht bereit; diese bleiben ausschließlich im Ausführungspfad.
- Der Ausführungspfad bereitet vor der Genehmigung einen kanonischen `systemRunPlan` vor. Sobald eine Genehmigung erteilt wurde, leitet das Gateway diesen gespeicherten Plan weiter und nicht etwaige später vom Aufrufer bearbeitete Befehls-, Arbeitsverzeichnis- oder Sitzungsfelder.
- `system.notify` berücksichtigt den Status der Benachrichtigungsberechtigung in der macOS-App; unterstützt `--priority <passive|active|timeSensitive>` und `--delivery <system|overlay|auto>`.
- Nicht erkannte Node-Metadaten für `platform` / `deviceFamily` verwenden eine konservative Standard-Zulassungsliste, die `system.run` und `system.which` ausschließt. Wenn Sie diese Befehle absichtlich für eine unbekannte Plattform benötigen, fügen Sie sie ausdrücklich über `gateway.nodes.commands.allow` hinzu.
- `system.run` unterstützt `--cwd`, `--env KEY=VAL`, `--command-timeout` und `--needs-screen-recording`.
- Bei Shell-Wrappern (`bash|sh|zsh ... -c/-lc`) werden anforderungsbezogene `--env`-Werte auf eine explizite Zulassungsliste reduziert (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Bei Entscheidungen zur dauerhaften Zulassung im Zulassungslistenmodus speichern bekannte Dispatch-Wrapper (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) die Pfade der inneren ausführbaren Dateien statt der Wrapper-Pfade. Wenn das Entpacken nicht sicher ist, wird nicht automatisch ein Eintrag in der Zulassungsliste gespeichert.
- Auf Windows-Node-Hosts im Zulassungslistenmodus erfordern Shell-Wrapper-Ausführungen über `cmd.exe /c` eine Genehmigung (ein Eintrag in der Zulassungsliste allein erlaubt die Wrapper-Form nicht automatisch).
- Node-Hosts ignorieren `PATH`-Überschreibungen in `--env` und entfernen eine große, gepflegte Menge von Startvariablen für Interpreter/Shells (zum Beispiel `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`), bevor ein Befehl ausgeführt wird. Wenn Sie zusätzliche PATH-Einträge benötigen, konfigurieren Sie die Dienstumgebung des Node-Hosts (oder installieren Sie Tools an Standardspeicherorten), statt `PATH` über `--env` zu übergeben.
- Im macOS-Node-Modus wird `system.run` durch Ausführungsgenehmigungen in der macOS-App gesteuert (Settings → Exec approvals). Nachfragen/Zulassungsliste/vollständig verhalten sich genauso wie beim Headless-Node-Host; abgelehnte Eingabeaufforderungen geben `SYSTEM_RUN_DENIED` zurück.
- Auf dem Headless-Node-Host wird `system.run` durch Ausführungsgenehmigungen (`~/.openclaw/exec-approvals.json`) gesteuert; speziell für macOS finden Sie unten unter [Headless-Node-Host](#headless-node-host-cross-platform) die Umgebungsvariablen für das Exec-Host-Routing.

## Bindung des Ausführungs-Nodes

Wenn mehrere Nodes verfügbar sind, können Sie die Ausführung an einen bestimmten Node binden. Dadurch wird der Standard-Node für `exec host=node` festgelegt (und kann pro Agent überschrieben werden).

Globaler Standard:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Überschreibung pro Agent:

```bash
openclaw config get agents.entries
openclaw config set 'agents.entries.main.tools.exec.node' "node-id-or-name"
```

Aufheben, um jeden beliebigen Node zuzulassen:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.entries.main.tools.exec.node'
```

## Berechtigungszuordnung

Nodes können in `node.list` / `node.describe` eine `permissions`-Zuordnung enthalten, deren Schlüssel Berechtigungsnamen sind (z. B. `screenRecording`, `accessibility`, `location`) und deren Werte boolesch sind (`true` = erteilt).

## Headless-Node-Host (plattformübergreifend)

OpenClaw kann einen **Headless-Node-Host** (ohne Benutzeroberfläche) ausführen, der eine Verbindung zum Gateway-WebSocket herstellt und `system.run` / `system.which` bereitstellt. Dies ist unter Linux/Windows oder für die Ausführung eines minimalen Nodes neben einem Server nützlich.

Starten Sie ihn:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Hinweise:

- Die Kopplung ist weiterhin erforderlich (das Gateway zeigt eine Aufforderung zur Gerätekopplung an).
- Clientinstanz-Metadaten, signierte Geräteidentität und Kopplungsauthentifizierung verwenden separate Zustandsdatensätze; siehe [Headless-Identitätsstatus](#headless-identity-state).
- Ausführungsgenehmigungen werden lokal über `~/.openclaw/exec-approvals.json` durchgesetzt (siehe [Ausführungsgenehmigungen](/de/tools/exec-approvals)).
- Unter macOS führt der Headless-Node-Host `system.run` standardmäßig lokal aus. Legen Sie `OPENCLAW_NODE_EXEC_HOST=app` fest, um `system.run` über den Exec-Host der Begleit-App zu leiten; fügen Sie `OPENCLAW_NODE_EXEC_FALLBACK=0` hinzu, um den App-Host vorauszusetzen und bei Nichtverfügbarkeit ohne Rückfall abzubrechen.
- Fügen Sie `--tls` / `--tls-fingerprint` hinzu, wenn der Gateway-WebSocket TLS verwendet.

## Mac-Node-Modus

- Die macOS-Menüleisten-App verbindet sich als Node mit dem Gateway-WebSocket-Server (sodass `openclaw nodes …` für diesen Mac funktioniert).
- Im Remote-Modus öffnet die App einen SSH-Tunnel für den Gateway-Port und stellt eine Verbindung zu `localhost` her.
