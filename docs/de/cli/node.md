---
read_when:
    - Ausführen des Headless-Node-Hosts
    - Koppeln eines Nicht-macOS-Nodes für system.run
summary: CLI-Referenz für `openclaw node` (headless Node-Host)
title: Node
x-i18n:
    generated_at: "2026-07-16T12:39:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Führen Sie einen **headless Node-Host** aus, der eine Verbindung zum Gateway-WebSocket herstellt und
`system.run` / `system.which` auf diesem Rechner bereitstellt.

Unter macOS bettet die Menüleisten-App diese Node-Host-Laufzeit bereits in ihre eigene
Node-Verbindung ein und ergänzt native Mac-Funktionen. Verwenden Sie `openclaw node run` auf einem
Mac nur, wenn Sie bewusst einen headless Node ohne die App verwenden möchten. Werden
beide ausgeführt, entstehen zwei Node-Identitäten für denselben Rechner.

## Warum einen Node-Host verwenden?

Verwenden Sie einen Node-Host, wenn Agenten **Befehle auf anderen Rechnern** in Ihrem
Netzwerk ausführen sollen, ohne dort eine vollständige macOS-Begleit-App zu installieren.

Häufige Anwendungsfälle:

- Befehle auf entfernten Linux-/Windows-Rechnern ausführen (Build-Server, Laborrechner, NAS).
- Exec auf dem Gateway weiterhin in einer **Sandbox** ausführen, genehmigte Ausführungen jedoch an andere Hosts delegieren.
- Ein leichtgewichtiges, headless Ausführungsziel für Automatisierungs- oder CI-Nodes bereitstellen.

Die Ausführung wird weiterhin durch **Exec-Genehmigungen** und agentenspezifische Positivlisten auf dem
Node-Host geschützt, sodass der Befehlszugriff begrenzt und ausdrücklich freigegeben bleibt.

`openclaw node run` kann nach dem Verbindungsaufbau Plugin- oder MCP-gestützte Tools veröffentlichen.
Das Gateway vertraut standardmäßig den Deskriptoren des gekoppelten Nodes, verlangt jedoch,
dass der Befehl jedes Deskriptors innerhalb der genehmigten Befehlsoberfläche des Nodes bleibt. Der
Agent sieht jeden akzeptierten Deskriptor als normales Plugin-Tool, die Ausführung erfolgt jedoch weiterhin
über `node.invoke`. Wird die Verbindung zum Node getrennt, steht das Tool daher für neue
Agentenausführungen nicht mehr zur Verfügung. Gateway-Betreiber können die Veröffentlichung mit
`gateway.nodes.pluginTools.enabled: false` deaktivieren.

Fügen Sie für deklarative MCP-Tools die normale MCP-Serverstruktur unter
`nodeHost.mcp.servers` in `openclaw.json` auf dem Node-Rechner hinzu und starten Sie anschließend den
Node-Host neu. Der Node deklariert die genehmigungspflichtige Befehlsfamilie `mcp.tools.call.v1`
und veröffentlicht nach dem Verbindungsaufbau die aufgeführten Tools; spätere Änderungen an der Serverliste
erfordern keine erneute Kopplung. Siehe
[Auf dem Node gehostete MCP-Server](/de/nodes#node-hosted-mcp-servers).

## Browser-Proxy (ohne Konfiguration)

Node-Hosts geben automatisch einen Browser-Proxy bekannt, sofern `browser.enabled` auf dem
Node nicht deaktiviert ist. Dadurch kann der Agent ohne zusätzliche Konfiguration
Browserautomatisierung auf diesem Node verwenden.

Standardmäßig stellt der Proxy die normale Browserprofiloberfläche des Nodes bereit. Wenn Sie
`nodeHost.browserProxy.allowProfiles` festlegen, wird der Proxy restriktiv:
Die Auswahl nicht in der Positivliste enthaltener Profile wird abgelehnt, und Routen zum
Erstellen und Löschen persistenter Profile werden über den Proxy blockiert.

Deaktivieren Sie ihn bei Bedarf auf dem Node:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Ausführen (Vordergrund)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--context-path <path>`: Gateway-WebSocket-Kontextpfad (z. B. `/openclaw-gw`). Wird an die WebSocket-URL angehängt.
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--no-tls`: Eine unverschlüsselte Gateway-Verbindung erzwingen, selbst wenn TLS in der lokalen Gateway-Konfiguration aktiviert ist
- `--tls-fingerprint <sha256>`: Erwarteter Fingerabdruck des TLS-Zertifikats (sha256)
- `--node-id <id>`: Die in der gemeinsamen SQLite-Datenbank gespeicherte Clientinstanz-ID überschreiben (setzt die Kopplung nicht zurück)
- `--display-name <name>`: Anzeigenamen des Nodes überschreiben

## Gateway-Authentifizierung für den Node-Host

`openclaw node run` und `openclaw node install` beziehen die Gateway-Authentifizierung aus Konfiguration/Umgebung (keine Flags `--token`/`--password` für Node-Befehle):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` werden zuerst geprüft.
- Danach folgt die lokale Konfiguration als Rückfalloption: `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus übernimmt der Node-Host bewusst nicht `gateway.remote.token` / `gateway.remote.password`.
- Wenn `gateway.auth.token` / `gateway.auth.password` ausdrücklich über SecretRef konfiguriert, aber nicht aufgelöst ist, schlägt die Auflösung der Node-Authentifizierung sicher fehl (keine Verschleierung durch eine entfernte Rückfalloption).
- In `gateway.mode=remote` kommen gemäß den Prioritätsregeln für entfernte Verbindungen auch die entfernten Clientfelder (`gateway.remote.token` / `gateway.remote.password`) infrage.
- Die Authentifizierungsauflösung des Node-Hosts berücksichtigt nur `OPENCLAW_GATEWAY_*`-Umgebungsvariablen.

Für einen Node, der eine Verbindung zu einem unverschlüsselten `ws://`-Gateway herstellt, werden Loopback-Adressen, private
IP-Literale, `.local` und Tailnet-Hosts mit `*.ts.net` akzeptiert. Legen Sie für andere
vertrauenswürdige private DNS-Namen `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` fest; andernfalls
schlägt der Node-Start sicher fehl und fordert Sie auf, `wss://`, einen SSH-Tunnel oder
Tailscale zu verwenden. Dies ist eine explizite Aktivierung über die Prozessumgebung und kein
`openclaw.json`-Konfigurationsschlüssel.
`openclaw node install` übernimmt diese Einstellung in den überwachten Node-Dienst, wenn sie
in der Umgebung des Installationsbefehls vorhanden ist.

## Dienst (Hintergrund)

Installieren Sie einen headless Node-Host als Benutzerdienst (launchd unter macOS, systemd unter
Linux, Windows Task Scheduler unter Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Optionen:

- `--host <host>`: Gateway-WebSocket-Host (Standard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-Port (Standard: `18789`)
- `--context-path <path>`: Gateway-WebSocket-Kontextpfad (z. B. `/openclaw-gw`). Wird an die WebSocket-URL angehängt.
- `--tls`: TLS für die Gateway-Verbindung verwenden
- `--tls-fingerprint <sha256>`: Erwarteter Fingerabdruck des TLS-Zertifikats (sha256)
- `--node-id <id>`: Die in der gemeinsamen SQLite-Datenbank gespeicherte Clientinstanz-ID überschreiben (setzt die Kopplung nicht zurück)
- `--display-name <name>`: Anzeigenamen des Nodes überschreiben
- `--runtime <runtime>`: Dienstlaufzeit (`node`)
- `--force`: Neu installieren/überschreiben, wenn bereits installiert

Dienst verwalten:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Verwenden Sie `openclaw node run` für einen Node-Host im Vordergrund (kein Dienst).

Dienstbefehle akzeptieren `--json` für eine maschinenlesbare Ausgabe.

Der Node-Host wiederholt Gateway-Neustarts und Netzwerkschließungen innerhalb des Prozesses. Wenn das
Gateway eine endgültige Unterbrechung der Token-/Passwort-/Bootstrap-Authentifizierung meldet, protokolliert der Node-Host
die Details der Schließung und beendet sich mit einem von null verschiedenen Status, damit launchd/systemd/Task Scheduler ihn
mit aktueller Konfiguration und aktuellen Anmeldedaten neu starten kann. Unterbrechungen wegen erforderlicher Kopplung verbleiben im
Vordergrundablauf, damit die ausstehende Anfrage genehmigt werden kann.

## Kopplung

Bei der ersten Verbindung wird auf dem Gateway eine ausstehende Anfrage zur Gerätekopplung (`role: node`) erstellt.

Wenn der Gateway-Host nicht interaktiv per SSH auf den Node-Host zugreifen kann (derselbe Benutzer,
vertrauenswürdiger Hostschlüssel), wird die ausstehende Anfrage automatisch genehmigt: Das Gateway
führt `openclaw node identity --json` über SSH auf dem Node-Host aus und genehmigt bei
exakter Übereinstimmung des Geräteschlüssels. Dies ist standardmäßig aktiviert; unter
[SSH-verifizierte automatische Genehmigung von Geräten](/de/gateway/pairing#ssh-verified-device-auto-approval-default)
finden Sie die Anforderungen und Informationen zur Deaktivierung (`gateway.nodes.pairing.sshVerify: false`).

Andernfalls genehmigen Sie die Anfrage manuell über:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Prüfen Sie die lokale Node-Identität, mit der das Gateway den Abgleich durchführt:

```bash
openclaw node identity --json
```

Der Befehl gibt die Geräte-ID und den öffentlichen Schlüssel aus `identity/device.json` aus und
erstellt oder ändert niemals Identitätsdateien.

In streng kontrollierten Node-Netzwerken kann der Gateway-Betreiber ausdrücklich die
automatische Genehmigung der erstmaligen Node-Kopplung aus vertrauenswürdigen CIDRs aktivieren:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Dies ist standardmäßig deaktiviert (`autoApproveCidrs` ist nicht gesetzt). Es gilt nur für eine
neue `role: node`-Kopplung ohne angeforderte Geltungsbereiche von einer Client-IP, der das
Gateway vertraut. Operator-/Browser-Clients, Control UI, WebChat sowie Aktualisierungen von Rolle,
Geltungsbereich, Metadaten oder öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

Wenn der Node die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Geltungsbereiche/öffentlicher Schlüssel) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

### Identitäts- und Kopplungsstatus

Der headless Node trennt seine Clientinstanz-ID von der signierten Geräteidentität,
die das Gateway für Kopplung und Routing verwendet. Dieser Status befindet sich im
OpenClaw-Statusverzeichnis (standardmäßig `~/.openclaw` oder `$OPENCLAW_STATE_DIR`,
wenn festgelegt):

| Status                                        | Zweck                                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `state/openclaw.sqlite` (`node_host_config`) | Clientinstanz-ID, Anzeigename und Gateway-Verbindungsmetadaten. Der Client sendet diese ID als `instanceId`.                   |
| `identity/device.json`                       | Signiertes Ed25519-Schlüsselpaar und daraus abgeleitete Geräte-ID. Bei signierten Verbindungen ist diese Geräte-ID die für das Routing verwendete Node-ID und Kopplungsidentität. |
| `identity/device-auth.json`                  | Token gekoppelter Geräte, nach kryptografischer Geräte-ID und Rolle verschlüsselt.                                             |

`--node-id` ändert nur die Clientinstanz-ID in der gemeinsamen SQLite-Datenbank. Es
ändert weder die kryptografische Geräte-ID noch löscht es die Kopplungsauthentifizierung. Auch die Migration einer außer Betrieb genommenen
`node.json` mit `openclaw doctor --fix` setzt die Kopplung nicht zurück. So
widerrufen und koppeln Sie einen Node erneut:

1. Führen Sie auf dem Gateway `openclaw nodes remove --node <id|name|ip>` aus.
2. Starten Sie auf dem Node den installierten Dienst mit `openclaw node restart` neu oder
   halten Sie ihn an und führen Sie den Vordergrundbefehl `openclaw node run` erneut aus. Dadurch wird der
   Gerätekopplungsablauf gestartet. Wenn `openclaw devices list` keine Anfrage anzeigt
   und der Node `AUTH_DEVICE_TOKEN_MISMATCH` meldet, starten Sie ihn noch einmal neu
   oder führen Sie ihn noch einmal aus. Der abgelehnte Versuch löscht das nun widerrufene lokale Token; beim nächsten
   Versuch kann die Kopplung angefordert werden.
3. Führen Sie auf dem Gateway `openclaw devices list` und anschließend
   `openclaw devices approve <deviceRequestId>` aus.
4. Starten Sie den Node erneut oder führen Sie ihn erneut aus. Ein Client, der wegen der Kopplung pausiert, wird nach der Genehmigung
   nicht automatisch fortgesetzt; durch diese erneute Verbindung wird die separate
   Anfrage für die Befehlsoberfläche erstellt.
5. Führen Sie auf dem Gateway `openclaw nodes pending` und anschließend
   `openclaw nodes approve <nodeRequestId>` aus.

Die beiden Anfrage-IDs sind unterschiedlich. Eine anwendbare Richtlinie für vertrauenswürdige CIDRs kann
den erstmaligen Gerätekopplungsschritt automatisch genehmigen; die Genehmigung der Befehlsoberfläche bleibt
eine separate Prüfung.

Ältere OpenClaw-Versionen speicherten den Status des Node-Hosts in `node.json` und konnten dort ein
veraltetes Feld `token` hinterlassen. Halten Sie den Node-Host an und führen Sie `openclaw doctor --fix`
einmal aus; Doctor importiert die unterstützten Identitäts- und Verbindungsfelder in SQLite,
verwirft das ungenutzte Token-Feld, überprüft den Datensatz und entfernt die außer Betrieb genommene Datei.
Normale Node-Befehle schlagen mit diesem Reparaturhinweis sicher fehl, solange die Datei oder
eine unterbrochene Doctor-Beanspruchung vorhanden ist. Halten Sie beide Dateien unter `identity/` privat;
sie enthalten das Geräteschlüsselpaar und Authentifizierungstoken.

## Exec-Genehmigungen

`system.run` wird durch lokale Exec-Genehmigungen geschützt:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` oder
  `~/.openclaw/exec-approvals.json`, wenn die Variable nicht gesetzt ist
- [Exec-Genehmigungen](/de/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (vom Gateway aus bearbeiten)

Für eine genehmigte asynchrone Node-Exec-Ausführung bereitet OpenClaw vor der Abfrage einen kanonischen `systemRunPlan`
vor. Die später genehmigte Weiterleitung `system.run` verwendet diesen gespeicherten
Plan erneut. Änderungen an Befehls-, cwd- oder Sitzungsfeldern nach der Erstellung der Genehmigungsanfrage
werden daher abgelehnt, statt die Ausführung durch den Node zu verändern.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
