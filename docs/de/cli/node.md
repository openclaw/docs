---
read_when:
    - Ausführen des Node-Hosts ohne Benutzeroberfläche
    - Koppeln eines Nicht-macOS-Node für system.run
summary: CLI-Referenz für `openclaw node` (monitorloser Node-Host)
title: Node
x-i18n:
    generated_at: "2026-07-12T15:07:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Führen Sie einen **headless Node-Host** aus, der eine Verbindung zum Gateway-WebSocket herstellt und
`system.run` / `system.which` auf diesem Rechner bereitstellt.

## Warum einen Node-Host verwenden?

Verwenden Sie einen Node-Host, wenn Agenten **Befehle auf anderen Rechnern** in Ihrem
Netzwerk ausführen sollen, ohne dort eine vollständige macOS-Begleit-App zu installieren.

Häufige Anwendungsfälle:

- Befehle auf entfernten Linux-/Windows-Rechnern ausführen (Build-Server, Laborrechner, NAS).
- Die Ausführung auf dem Gateway weiterhin in einer **Sandbox** halten, genehmigte Ausführungen jedoch an andere Hosts delegieren.
- Ein leichtgewichtiges, headless Ausführungsziel für Automatisierung oder CI-Nodes bereitstellen.

Die Ausführung wird weiterhin durch **Ausführungsgenehmigungen** und Allowlists pro Agent auf dem
Node-Host geschützt, sodass Sie den Befehlszugriff klar und ausdrücklich begrenzen können.

`openclaw node run` kann nach dem Herstellen der Verbindung Plugin- oder MCP-gestützte Tools veröffentlichen.
Das Gateway vertraut standardmäßig den Deskriptoren des gekoppelten Nodes, verlangt jedoch,
dass der Befehl jedes Deskriptors innerhalb der genehmigten Befehlsoberfläche des Nodes bleibt. Der
Agent sieht jeden akzeptierten Deskriptor als normales Plugin-Tool, die Ausführung erfolgt jedoch weiterhin
über `node.invoke`. Wenn die Verbindung zum Node getrennt wird, steht das Tool daher für neue
Agent-Ausführungen nicht mehr zur Verfügung. Gateway-Betreiber können die Veröffentlichung mit
`gateway.nodes.pluginTools.enabled: false` deaktivieren.

Fügen Sie für deklarative MCP-Tools die normale MCP-Serverstruktur unter
`nodeHost.mcp.servers` in `openclaw.json` auf dem Node-Rechner hinzu und starten Sie anschließend den
Node-Host neu. Der Node deklariert die genehmigungspflichtige Befehlsfamilie `mcp.tools.call.v1`
und veröffentlicht die aufgeführten Tools nach dem Verbindungsaufbau; eine spätere Änderung der Serverliste
erfordert keine erneute Kopplung. Siehe
[Auf dem Node gehostete MCP-Server](/de/nodes#node-hosted-mcp-servers).

## Browser-Proxy (ohne Konfiguration)

Node-Hosts kündigen automatisch einen Browser-Proxy an, sofern `browser.enabled` auf dem
Node nicht deaktiviert ist. Dadurch kann der Agent die Browserautomatisierung auf diesem Node
ohne zusätzliche Konfiguration verwenden.

Standardmäßig stellt der Proxy die normale Browserprofil-Oberfläche des Nodes bereit. Wenn Sie
`nodeHost.browserProxy.allowProfiles` festlegen, wird der Proxy restriktiv:
Das Ansprechen von Profilen, die nicht auf der Allowlist stehen, wird abgelehnt, und Routen zum
Erstellen/Löschen persistenter Profile werden über den Proxy blockiert.

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
- `--no-tls`: Eine unverschlüsselte Gateway-Verbindung erzwingen, selbst wenn die lokale Gateway-Konfiguration TLS aktiviert
- `--tls-fingerprint <sha256>`: Erwarteter Fingerabdruck des TLS-Zertifikats (sha256)
- `--node-id <id>`: Die in `node.json` gespeicherte ID der Legacy-Clientinstanz überschreiben (setzt die Kopplung nicht zurück)
- `--display-name <name>`: Den Anzeigenamen des Nodes überschreiben

## Gateway-Authentifizierung für den Node-Host

`openclaw node run` und `openclaw node install` ermitteln die Gateway-Authentifizierung aus Konfiguration/Umgebung (keine Flags `--token`/`--password` für Node-Befehle):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` werden zuerst geprüft.
- Danach folgt der Rückgriff auf die lokale Konfiguration: `gateway.auth.token` / `gateway.auth.password`.
- Im lokalen Modus übernimmt der Node-Host absichtlich nicht `gateway.remote.token` / `gateway.remote.password`.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung der Node-Authentifizierung sicher fehl (kein kaschierender Rückgriff auf die Remote-Konfiguration).
- Bei `gateway.mode=remote` kommen gemäß den Remote-Prioritätsregeln auch Remote-Clientfelder (`gateway.remote.token` / `gateway.remote.password`) infrage.
- Die Authentifizierungsauflösung des Node-Hosts berücksichtigt nur `OPENCLAW_GATEWAY_*`-Umgebungsvariablen.

Für einen Node, der eine Verbindung zu einem unverschlüsselten `ws://`-Gateway herstellt, werden Loopback,
private IP-Literale, `.local` und Tailnet-Hosts unter `*.ts.net` akzeptiert. Legen Sie für andere
vertrauenswürdige private DNS-Namen `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` fest; andernfalls
schlägt der Start des Nodes sicher fehl und fordert Sie auf, `wss://`, einen SSH-Tunnel oder
Tailscale zu verwenden. Dies ist eine Aktivierung über die Prozessumgebung und kein
Konfigurationsschlüssel in `openclaw.json`.
`openclaw node install` speichert die Einstellung im überwachten Node-Dienst, wenn sie
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
- `--node-id <id>`: Die in `node.json` gespeicherte ID der Legacy-Clientinstanz überschreiben (setzt die Kopplung nicht zurück)
- `--display-name <name>`: Den Anzeigenamen des Nodes überschreiben
- `--runtime <runtime>`: Dienst-Runtime (`node` oder `bun`)
- `--force`: Neu installieren/überschreiben, falls bereits installiert

Verwalten Sie den Dienst:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Verwenden Sie `openclaw node run` für einen Node-Host im Vordergrund (kein Dienst).

Dienstbefehle akzeptieren `--json` für maschinenlesbare Ausgaben.

Der Node-Host versucht Gateway-Neustarts und Netzwerkschließungen prozessintern erneut. Wenn das
Gateway eine terminale Authentifizierungspause aufgrund von Token, Passwort oder Bootstrap meldet, protokolliert der Node-Host
die Details zur Schließung und wird mit einem von null verschiedenen Status beendet, damit launchd/systemd/Task Scheduler ihn
mit aktueller Konfiguration und aktuellen Anmeldedaten neu starten kann. Pausen aufgrund einer erforderlichen Kopplung verbleiben im
Vordergrundablauf, damit die ausstehende Anfrage genehmigt werden kann.

## Kopplung

Die erste Verbindung erstellt auf dem Gateway eine ausstehende Anfrage zur Gerätekopplung (`role: node`).

Wenn der Gateway-Host nicht interaktiv per SSH auf den Node-Host zugreifen kann (gleicher Benutzer,
vertrauenswürdiger Hostschlüssel), wird die ausstehende Anfrage automatisch genehmigt: Das Gateway
führt über SSH `openclaw node identity --json` auf dem Node-Host aus und genehmigt bei
exakter Übereinstimmung des Geräteschlüssels. Dies ist standardmäßig aktiviert; unter
[SSH-verifizierte automatische Gerätegenehmigung](/de/gateway/pairing#ssh-verified-device-auto-approval-default)
finden Sie die Anforderungen und Informationen zur Deaktivierung (`gateway.nodes.pairing.sshVerify: false`).

Andernfalls genehmigen Sie sie manuell über:

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

In streng kontrollierten Node-Netzwerken kann der Gateway-Betreiber ausdrücklich der
automatischen Genehmigung erstmaliger Node-Kopplungen aus vertrauenswürdigen CIDRs zustimmen:

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

Dies ist standardmäßig deaktiviert (`autoApproveCidrs` ist nicht festgelegt). Es gilt nur für
neue Kopplungen mit `role: node` ohne angeforderte Geltungsbereiche, die von einer Client-IP stammen, der das
Gateway vertraut. Operator-/Browser-Clients, Control UI, WebChat sowie Aktualisierungen von Rolle,
Geltungsbereich, Metadaten oder öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

Wenn der Node die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Geltungsbereiche/öffentlicher Schlüssel) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

### Identitäts- und Kopplungsstatus

Der headless Node trennt die ID seiner Legacy-Clientinstanz von der signierten Geräteidentität,
die das Gateway für Kopplung und Routing verwendet. Diese Dateien befinden sich im
OpenClaw-Statusverzeichnis (standardmäßig `~/.openclaw` oder `$OPENCLAW_STATE_DIR`,
wenn festgelegt):

| Datei                       | Zweck                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | Clientinstanz-ID unter dem Legacy-Schlüssel `nodeId`, Anzeigename und Gateway-Verbindungsmetadaten. Der Client sendet diesen Wert als `instanceId`. |
| `identity/device.json`      | Signiertes Ed25519-Schlüsselpaar und abgeleitete Geräte-ID. Bei signierten Verbindungen ist diese Geräte-ID die für das Routing verwendete Node-ID und Kopplungsidentität. |
| `identity/device-auth.json` | Token gekoppelter Geräte, nach kryptografischer Geräte-ID und Rolle indiziert.                                                                     |

`--node-id` ändert nur die Clientinstanz-ID in `node.json`. Es ändert weder
die kryptografische Geräte-ID noch löscht es die Kopplungsauthentifizierung. Auch das alleinige Löschen von
`node.json` setzt die Kopplung nicht zurück. So widerrufen Sie einen Node und koppeln ihn erneut:

1. Führen Sie auf dem Gateway `openclaw nodes remove --node <id|name|ip>` aus.
2. Starten Sie auf dem Node den installierten Dienst mit `openclaw node restart` neu oder
   stoppen Sie den Vordergrundbefehl `openclaw node run` und führen Sie ihn erneut aus. Dadurch wird der
   Gerätekopplungsablauf gestartet. Wenn `openclaw devices list` keine Anfrage anzeigt
   und der Node `AUTH_DEVICE_TOKEN_MISMATCH` meldet, starten Sie ihn noch einmal neu
   oder führen Sie ihn erneut aus. Der abgelehnte Versuch löscht das nun widerrufene lokale Token; beim nächsten
   Versuch kann die Kopplung angefordert werden.
3. Führen Sie auf dem Gateway `openclaw devices list` und anschließend
   `openclaw devices approve <deviceRequestId>` aus.
4. Starten Sie den Node erneut oder führen Sie ihn erneut aus. Ein Client, der wegen der Kopplung pausiert wurde, wird
   nach der Genehmigung nicht automatisch fortgesetzt; durch diese erneute Verbindung wird die separate
   Anfrage für die Befehlsoberfläche erstellt.
5. Führen Sie auf dem Gateway `openclaw nodes pending` und anschließend
   `openclaw nodes approve <nodeRequestId>` aus.

Die beiden Anfrage-IDs sind verschieden. Eine anwendbare Richtlinie für vertrauenswürdige CIDRs kann
den Schritt der erstmaligen Gerätekopplung automatisch genehmigen; die Genehmigung der Befehlsoberfläche bleibt
eine separate Prüfung.

Ältere OpenClaw-Versionen konnten ein Legacy-Feld `token` in `node.json` hinterlassen.
Die aktuelle OpenClaw-Version verwendet dieses Feld nicht und entfernt es, wenn der Node-Host
die Datei das nächste Mal speichert. Halten Sie beide Dateien unter `identity/` geheim; sie enthalten das
Geräteschlüsselpaar und Authentifizierungstoken.

## Ausführungsgenehmigungen

`system.run` wird durch lokale Ausführungsgenehmigungen geschützt:

- `$OPENCLAW_STATE_DIR/exec-approvals.json` oder
  `~/.openclaw/exec-approvals.json`, wenn die Variable nicht festgelegt ist
- [Ausführungsgenehmigungen](/de/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (vom Gateway aus bearbeiten)

Für genehmigte asynchrone Node-Ausführungen erstellt OpenClaw vor der Abfrage einen kanonischen `systemRunPlan`.
Die spätere genehmigte Weiterleitung von `system.run` verwendet diesen gespeicherten
Plan erneut. Daher werden Änderungen an Befehls-, cwd- oder Sitzungsfeldern nach dem Erstellen der Genehmigungsanfrage
abgelehnt, anstatt zu ändern, was der Node ausführt.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Nodes](/de/nodes)
