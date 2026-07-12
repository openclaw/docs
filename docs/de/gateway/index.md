---
read_when:
    - Ausführen oder Debuggen des Gateway-Prozesses
summary: Runbook für Gateway-Dienst, Lebenszyklus und Betrieb
title: Gateway-Betriebshandbuch
x-i18n:
    generated_at: "2026-07-12T15:20:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

Verwenden Sie diese Seite für den erstmaligen Start und den laufenden Betrieb des Gateway-Dienstes.

<CardGroup cols={2}>
  <Card title="Ausführliche Fehlerbehebung" icon="siren" href="/de/gateway/troubleshooting">
    Symptombasierte Diagnose mit exakten Befehlsfolgen und Log-Signaturen.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Aufgabenorientierte Einrichtungsanleitung und vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Verwaltung von Geheimnissen" icon="key-round" href="/de/gateway/secrets">
    SecretRef-Vertrag, Verhalten des Laufzeit-Snapshots sowie Migrations- und Neuladevorgänge.
  </Card>
  <Card title="Vertrag für Geheimnispläne" icon="shield-check" href="/de/gateway/secrets-plan-contract">
    Exakte Ziel-/Pfadregeln für `secrets apply` und Verhalten von Authentifizierungsprofilen mit ausschließlichen Referenzen.
  </Card>
</CardGroup>

## Lokaler Start in 5 Minuten

<Steps>
  <Step title="Gateway starten">

```bash
openclaw gateway --port 18789
# Debug-/Trace-Ausgaben werden auf stdio gespiegelt
openclaw gateway --port 18789 --verbose
# Listener am ausgewählten Port zwangsweise beenden, dann starten
openclaw gateway --force
```

  </Step>

  <Step title="Dienstzustand überprüfen">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Gesunder Ausgangszustand: `Runtime: running`, `Connectivity probe: ok` und eine `Capability`-Zeile, die Ihren Erwartungen entspricht. Verwenden Sie `openclaw gateway status --require-rpc` als RPC-Nachweis mit Leseberechtigung, nicht nur als Erreichbarkeitsprüfung.

  </Step>

  <Step title="Bereitschaft der Kanäle prüfen">

```bash
openclaw channels status --probe
```

Bei einem erreichbaren Gateway führt dies Live-Prüfungen und optionale Audits für die Kanäle jedes Kontos aus. Ist das Gateway nicht erreichbar, greift die CLI auf reine Konfigurationszusammenfassungen der Kanäle zurück.

  </Step>
</Steps>

<Note>
Das Neuladen der Gateway-Konfiguration überwacht den aktiven Pfad der Konfigurationsdatei, der aus den Standardwerten für Profil und Zustand ermittelt wird oder aus `OPENCLAW_CONFIG_PATH`, falls gesetzt. Der Standardmodus ist `gateway.reload.mode="hybrid"`. Nach dem ersten erfolgreichen Laden verwendet der laufende Prozess den aktiven Konfigurations-Snapshot im Arbeitsspeicher; ein erfolgreiches Neuladen ersetzt diesen Snapshot atomar.
</Note>

## Laufzeitmodell

- Ein ständig aktiver Prozess für Routing, Steuerungsebene und Kanalverbindungen.
- Ein einzelner multiplexierter Port für:
  - WebSocket-Steuerung/RPC
  - HTTP-APIs (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - HTTP-Routen von Plugins, etwa das optionale `/api/v1/admin/rpc`
  - Control UI und Hooks
- Standard-Bindungsmodus: `loopback`. Innerhalb einer erkannten Container-Umgebung ist der effektive Standardwert `auto` (wird für Portweiterleitungen zu `0.0.0.0` aufgelöst), sofern Tailscale Serve/Funnel nicht aktiv ist; in diesem Fall wird stets `loopback` erzwungen.
- Authentifizierung ist standardmäßig erforderlich. Einrichtungen mit gemeinsamem Geheimnis verwenden `gateway.auth.token` / `gateway.auth.password` (oder `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), und Reverse-Proxy-Einrichtungen ohne Loopback können `gateway.auth.mode: "trusted-proxy"` verwenden.

## OpenAI-kompatible Endpunkte

Die wirkungsvollste Kompatibilitätsschnittstelle von OpenClaw:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Warum diese Auswahl wichtig ist:

- Die meisten Integrationen mit Open WebUI, LobeChat und LibreChat prüfen zuerst `/v1/models`.
- Viele RAG- und Speicher-Pipelines erwarten `/v1/embeddings`.
- Agentenorientierte Clients bevorzugen zunehmend `/v1/responses`.

`/v1/models` ist agentenorientiert: Der Endpunkt gibt für jeden konfigurierten Agenten `openclaw`, `openclaw/default` und `openclaw/<agentId>` zurück. `openclaw/default` ist der stabile Alias, der stets dem konfigurierten Standardagenten zugeordnet ist. Senden Sie `x-openclaw-model`, wenn Sie Provider und Modell des Backends überschreiben möchten; andernfalls bleibt die normale Modell- und Embedding-Konfiguration des ausgewählten Agenten maßgeblich.

Alle diese Endpunkte laufen auf dem Hauptport des Gateways und verwenden dieselbe vertrauenswürdige Authentifizierungsgrenze für Operatoren wie die übrige HTTP-API des Gateways.

Admin-HTTP-RPC (`POST /api/v1/admin/rpc`) ist eine separate, standardmäßig deaktivierte Plugin-Route für Host-Werkzeuge, die WebSocket-RPC nicht verwenden können. Siehe [Admin-HTTP-RPC](/de/plugins/admin-http-rpc).

### Rangfolge von Port und Bindung

| Einstellung  | Auflösungsreihenfolge                                                 |
| ------------ | -------------------------------------------------------------------- |
| Gateway-Port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| Bindungsmodus | CLI/Überschreibung → `gateway.bind` → `loopback` (oder `auto` in Containern) |

Installierte Gateway-Dienste speichern den aufgelösten Wert von `--port` in den Supervisor-Metadaten. Führen Sie nach einer Änderung von `gateway.port` den Befehl `openclaw doctor --fix` oder `openclaw gateway install --force` aus, damit launchd/systemd/schtasks den Prozess am neuen Port startet.

Beim Start des Gateways werden derselbe effektive Port und dieselbe Bindung verwendet, um bei Bindungen ohne Loopback lokale Ursprünge für die Control UI vorzubelegen. Beispielsweise legt `--bind lan --port 3000` vor der Laufzeitvalidierung `http://localhost:3000` und `http://127.0.0.1:3000` an. Fügen Sie alle Ursprünge entfernter Browser, etwa HTTPS-Proxy-URLs, explizit zu `gateway.controlUi.allowedOrigins` hinzu.

### Hot-Reload-Modi

| `gateway.reload.mode` | Verhalten                                                   |
| --------------------- | ----------------------------------------------------------- |
| `off`                 | Konfiguration nicht neu laden                               |
| `hot`                 | Nur Hot-Reload-sichere Änderungen anwenden                  |
| `restart`             | Bei Änderungen, die ein Neuladen erfordern, neu starten     |
| `hybrid` (Standard)   | Wenn sicher, direkt anwenden; andernfalls neu starten        |

## Operator-Befehlssatz

```bash
openclaw gateway status
openclaw gateway status --deep   # fügt eine Dienstprüfung auf Systemebene hinzu
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` dient zur zusätzlichen Diensterkennung (LaunchDaemons/systemd-Systemeinheiten/schtasks), nicht für eine eingehendere RPC-Zustandsprüfung.

## Mehrere Gateways (auf demselben Host)

Bei den meisten Installationen sollte ein Gateway pro Computer ausgeführt werden. Ein einzelnes Gateway kann mehrere Agenten und Kanäle hosten. Mehrere Gateways benötigen Sie nur, wenn Sie gezielt eine Isolation oder einen Rettungs-Bot wünschen.

Nützliche Prüfungen:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Was Sie erwarten können:

- `gateway status --deep` kann `Other gateway-like services detected (best effort)` melden und Bereinigungshinweise ausgeben, wenn noch veraltete launchd-/systemd-/schtasks-Installationen vorhanden sind.
- `gateway probe` kann vor `multiple reachable gateway identities` warnen, wenn verschiedene Gateways antworten oder OpenClaw nicht nachweisen kann, dass die erreichbaren Ziele dasselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zum selben Gateway stellt ein Gateway mit mehreren Transportwegen dar, selbst wenn sich die Transportports unterscheiden.
- Wenn dies beabsichtigt ist, isolieren Sie Ports, Konfiguration/Zustand und Workspace-Stammverzeichnisse für jedes Gateway.

Checkliste pro Instanz:

- Eindeutiger Wert für `gateway.port`
- Eindeutiger Wert für `OPENCLAW_CONFIG_PATH`
- Eindeutiger Wert für `OPENCLAW_STATE_DIR`
- Eindeutiger Wert für `agents.defaults.workspace`

Beispiel:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Ausführliche Einrichtung: [/gateway/multiple-gateways](/de/gateway/multiple-gateways).

## Remote-Zugriff

Bevorzugt: Tailscale/VPN.
Ausweichlösung: SSH-Tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Verbinden Sie Clients anschließend lokal mit `ws://127.0.0.1:18789`.

<Warning>
SSH-Tunnel umgehen die Gateway-Authentifizierung nicht. Bei einer Authentifizierung mit gemeinsamem Geheimnis müssen Clients auch über den Tunnel weiterhin
`token`/`password` senden. Bei identitätstragenden Modi muss die Anfrage
weiterhin den entsprechenden Authentifizierungspfad erfüllen.
</Warning>

Siehe: [Remote-Gateway](/de/gateway/remote), [Authentifizierung](/de/gateway/authentication), [Tailscale](/de/gateway/tailscale).

## Überwachung und Dienstlebenszyklus

Verwenden Sie für produktionsähnliche Zuverlässigkeit überwachte Ausführungen.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Verwenden Sie für Neustarts `openclaw gateway restart`. Verketten Sie `openclaw gateway stop` und `openclaw gateway start` nicht als Ersatz für einen Neustart.

Unter macOS verwendet `gateway stop` standardmäßig `launchctl bootout`. Dadurch wird der LaunchAgent aus der aktuellen Startsitzung entfernt, ohne eine Deaktivierung dauerhaft zu speichern. Die automatische Wiederherstellung durch KeepAlive funktioniert daher weiterhin nach unerwarteten Abstürzen, und `gateway start` aktiviert den Dienst ordnungsgemäß erneut. Um den automatischen Neustart über Systemneustarts hinweg dauerhaft zu unterdrücken, übergeben Sie `--disable`: `openclaw gateway stop --disable`.

LaunchAgent-Bezeichnungen lauten `ai.openclaw.gateway` (Standard) oder `ai.openclaw.<profile>` (benanntes Profil). `openclaw doctor` prüft und korrigiert Abweichungen der Dienstkonfiguration.

  </Tab>

  <Tab title="Linux (systemd-Benutzerdienst)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aktivieren Sie Lingering, damit der Dienst nach der Abmeldung weiterläuft:

```bash
sudo loginctl enable-linger $(whoami)
```

Stellen Sie auf einem Headless-Server ohne Desktop-Sitzung außerdem sicher, dass `XDG_RUNTIME_DIR` gesetzt ist (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`), bevor Sie `systemctl --user`-Befehle erneut ausführen.

Beispiel für eine manuelle Benutzereinheit, wenn Sie einen benutzerdefinierten Installationspfad benötigen:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (nativ)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Der verwaltete native Windows-Start verwendet eine geplante Aufgabe mit dem Namen `OpenClaw Gateway`
(oder `OpenClaw Gateway (<profile>)` für benannte Profile). Wenn das Erstellen der geplanten Aufgabe
verweigert wird, greift OpenClaw auf ein Startprogramm im benutzerspezifischen Autostart-Ordner zurück,
das auf `gateway.cmd` im Zustandsverzeichnis verweist.

  </Tab>

  <Tab title="Linux (Systemdienst)">

Verwenden Sie eine Systemeinheit für Hosts mit mehreren Benutzern oder dauerhaftem Betrieb.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Verwenden Sie dieselbe Dienstdefinition wie für die Benutzereinheit, installieren Sie sie jedoch unter
`/etc/systemd/system/openclaw-gateway[-<profile>].service` und passen Sie
`ExecStart=` an, falls sich Ihre `openclaw`-Binärdatei an einem anderen Ort befindet.

Lassen Sie nicht zusätzlich `openclaw doctor --fix` einen Gateway-Dienst auf Benutzerebene für dasselbe Profil und denselben Port installieren. Doctor verweigert diese automatische Installation, wenn ein OpenClaw-Gateway-Dienst auf Systemebene gefunden wird. Verwenden Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die Systemeinheit den Lebenszyklus verwaltet.

  </Tab>
</Tabs>

Fehler aufgrund ungültiger Konfigurationen führen zum Beenden mit Code `78`. Linux-systemd-Einheiten verwenden `RestartPreventExitStatus=78`, um weitere Neustarts zu verhindern, bis die Konfiguration korrigiert wurde. launchd und die Windows-Aufgabenplanung verfügen über keine entsprechende Regel zum Stoppen abhängig vom Beendigungscode. Daher speichert das Gateway zusätzlich den Verlauf schneller unsauberer Starts und unterdrückt nach wiederholten Startfehlern den automatischen Start von Kanal-/Provider-Konten. In diesem sicheren Modus startet die Steuerungsebene weiterhin zur Überprüfung und Reparatur, Hot Reloads der Konfiguration und `secrets.reload` verweigern automatische Kanalneustarts, und eine explizite Operator-Anfrage über `channels.start` kann die Unterdrückung außer Kraft setzen.

## Schnellstart für das Entwicklungsprofil

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Zu den Standardwerten gehören isolierte Zustands-/Konfigurationsdaten und der Gateway-Basisport `19001`.

## Protokoll-Kurzreferenz (Operatoransicht)

- Der erste Client-Frame muss `connect` sein.
- Der Gateway gibt einen `hello-ok`-Frame mit einem `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`) sowie `policy`-Limits (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`) zurück.
- `hello-ok.features.methods` / `events` sind eine konservative Liste zur Ermittlung verfügbarer Funktionen und kein
  generierter Dump aller aufrufbaren Hilfsrouten.
- Anfragen: `req(method, params)` → `res(ok/payload|error)`.
- Zu den häufigen Ereignissen gehören `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, das optional aktivierbare
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, Ereignisse im Lebenszyklus von Kopplung/Genehmigung und `shutdown`.

Agent-Ausführungen erfolgen in zwei Phasen:

1. Sofortige Annahmebestätigung (`status:"accepted"`)
2. Abschließende Fertigstellungsantwort (`status:"ok"|"error"`), dazwischen werden `agent`-Ereignisse gestreamt.

Die vollständige Protokolldokumentation finden Sie unter [Gateway-Protokoll](/de/gateway/protocol).

## Betriebsprüfungen

### Erreichbarkeit

- Öffnen Sie eine WS-Verbindung und senden Sie `connect`.
- Erwarten Sie eine `hello-ok`-Antwort mit einem Snapshot.

### Bereitschaft

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Wiederherstellung bei Lücken

Ereignisse werden nicht erneut wiedergegeben. Aktualisieren Sie bei Sequenzlücken den Zustand (`health`, `system-presence`), bevor Sie fortfahren.

## Häufige Fehlermeldungen

| Meldung                                                        | Wahrscheinliche Ursache                                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bindung an eine Nicht-Loopback-Adresse ohne gültigen Gateway-Authentifizierungspfad |
| `another gateway instance is already listening` / `EADDRINUSE` | Portkonflikt                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | Konfiguration ist auf den Remote-Modus eingestellt oder `gateway.mode` fehlt in einer beschädigten Konfiguration |
| `unauthorized` during connect                                  | Nicht übereinstimmende Authentifizierung zwischen Client und Gateway           |

Vollständige Diagnoseabläufe finden Sie unter [Gateway-Fehlerbehebung](/de/gateway/troubleshooting).

## Sicherheitsgarantien

- Gateway-Protokollclients brechen sofort mit einem Fehler ab, wenn der Gateway nicht verfügbar ist (kein impliziter Fallback auf einen direkten Kanal).
- Ungültige erste Frames sowie erste Frames, die keine Verbindungsherstellung anfordern, werden abgelehnt und geschlossen.
- Beim ordnungsgemäßen Herunterfahren wird vor dem Schließen des Sockets ein `shutdown`-Ereignis ausgegeben.

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Hintergrundprozess](/de/gateway/background-process)
- [Systemzustand](/de/gateway/health)
- [Doctor](/de/gateway/doctor)
- [Authentifizierung](/de/gateway/authentication)
- [Remotezugriff](/de/gateway/remote)
- [Verwaltung von Geheimnissen](/de/gateway/secrets)
