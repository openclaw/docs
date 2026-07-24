---
read_when:
    - Ausführen oder Debuggen des Gateway-Prozesses
summary: Betriebshandbuch für Gateway-Dienst, Lebenszyklus und Betrieb
title: Gateway-Betriebshandbuch
x-i18n:
    generated_at: "2026-07-24T04:55:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

Verwenden Sie diese Seite für die Inbetriebnahme am ersten Tag und den Betrieb des Gateway-Dienstes ab dem zweiten Tag.

<CardGroup cols={2}>
  <Card title="Detaillierte Fehlerbehebung" icon="siren" href="/de/gateway/troubleshooting">
    Symptombasierte Diagnose mit exakten Befehlsfolgen und Protokollsignaturen.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Aufgabenorientierte Einrichtungsanleitung und vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Verwaltung von Geheimnissen" icon="key-round" href="/de/gateway/secrets">
    SecretRef-Vertrag, Verhalten des Laufzeit-Snapshots sowie Migrations- und Neuladevorgänge.
  </Card>
  <Card title="Vertrag des Geheimnisplans" icon="shield-check" href="/de/gateway/secrets-plan-contract">
    Exakte `secrets apply`-Ziel-/Pfadregeln und Verhalten von Authentifizierungsprofilen, die ausschließlich Referenzen verwenden.
  </Card>
</CardGroup>

## Lokaler Start in 5 Minuten

<Steps>
  <Step title="Gateway starten">

```bash
openclaw gateway --port 18789
# Debug-/Trace-Ausgabe wird auf stdio gespiegelt
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

Gesunder Ausgangszustand: `Runtime: running`, `Connectivity probe: ok` und eine Ihren Erwartungen entsprechende `Capability`-Zeile. Verwenden Sie `openclaw gateway status --require-rpc` als RPC-Nachweis für den Lesezugriff, nicht nur für die Erreichbarkeit.

  </Step>

  <Step title="Kanalbereitschaft überprüfen">

```bash
openclaw channels status --probe
```

Bei erreichbarem Gateway führt dies Live-Kanalprüfungen pro Konto und optionale Audits aus. Ist das Gateway nicht erreichbar, greift die CLI auf rein konfigurationsbasierte Kanalzusammenfassungen zurück.

  </Step>
</Steps>

<Note>
Das Neuladen der Gateway-Konfiguration überwacht den Pfad der aktiven Konfigurationsdatei, der aus den Profil-/Zustandsvorgaben oder, falls gesetzt, aus `OPENCLAW_CONFIG_PATH` aufgelöst wird. Der Standardmodus ist `gateway.reload.mode="hybrid"`. Nach dem ersten erfolgreichen Laden stellt der laufende Prozess den aktiven Konfigurations-Snapshot im Arbeitsspeicher bereit; ein erfolgreiches Neuladen tauscht diesen Snapshot atomar aus.
</Note>

## Laufzeitmodell

- Ein dauerhaft aktiver Prozess für Routing, Steuerungsebene und Kanalverbindungen.
- Ein einzelner multiplexierter Port für:
  - WebSocket-Steuerung/RPC
  - HTTP-APIs (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Plugin-HTTP-Routen, beispielsweise das optionale `/api/v1/admin/rpc`
  - Control UI und Hooks
- Standard-Bindungsmodus: `loopback`. Innerhalb einer erkannten Container-Umgebung ist die effektive Vorgabe `auto` (wird für die Portweiterleitung zu `0.0.0.0` aufgelöst), sofern Tailscale Serve/Funnel nicht aktiv ist; dies erzwingt stets `loopback`.
- Authentifizierung ist standardmäßig erforderlich. Konfigurationen mit gemeinsamem Geheimnis verwenden `gateway.auth.token` / `gateway.auth.password` (oder `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`); Reverse-Proxy-Konfigurationen außerhalb von Loopback können `gateway.auth.mode: "trusted-proxy"` verwenden.

## OpenAI-kompatible Endpunkte

Die Kompatibilitätsoberfläche von OpenClaw mit der größten Hebelwirkung:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Warum diese Zusammenstellung wichtig ist:

- Die meisten Integrationen mit Open WebUI, LobeChat und LibreChat prüfen zuerst `/v1/models`.
- Viele RAG- und Speicher-Pipelines erwarten `/v1/embeddings`.
- Agent-native Clients bevorzugen zunehmend `/v1/responses`.

`/v1/models` ist primär auf Agenten ausgerichtet: Für jeden konfigurierten Agenten werden `openclaw`, `openclaw/default` und `openclaw/<agentId>` zurückgegeben. `openclaw/default` ist der stabile Alias, der stets dem konfigurierten Standardagenten zugeordnet wird. Senden Sie `x-openclaw-model`, wenn Sie den Backend-Provider bzw. das Backend-Modell überschreiben möchten; andernfalls bleibt die normale Modell- und Embedding-Konfiguration des ausgewählten Agenten maßgeblich.

Alle diese Endpunkte werden am Hauptport des Gateways ausgeführt und verwenden dieselbe vertrauenswürdige Authentifizierungsgrenze für Operatoren wie die übrige Gateway-HTTP-API.

Admin-HTTP-RPC (`POST /api/v1/admin/rpc`) ist eine separate, standardmäßig deaktivierte Plugin-Route für Host-Werkzeuge, die WebSocket-RPC nicht verwenden können. Siehe [Admin-HTTP-RPC](/de/plugins/admin-http-rpc).

### Rangfolge von Port und Bindung

| Einstellung  | Auflösungsreihenfolge                                                |
| ------------ | -------------------------------------------------------------------- |
| Gateway-Port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| Bindungsmodus | CLI/Überschreibung → `gateway.bind` → `loopback` (oder `auto` in Containern) |

Installierte Gateway-Dienste speichern den aufgelösten `--port` in den Supervisor-Metadaten. Führen Sie nach einer Änderung von `gateway.port` den Befehl `openclaw doctor --fix` oder `openclaw gateway install --force` aus, damit launchd/systemd/schtasks den Prozess am neuen Port startet.

Beim Start des Gateways werden derselbe effektive Port und dieselbe Bindung verwendet, wenn lokale Ursprünge der Control UI für Bindungen außerhalb von Loopback vorbelegt werden. Beispielsweise belegt `--bind lan --port 3000` vor der Laufzeitvalidierung `http://localhost:3000` und `http://127.0.0.1:3000` vor. Fügen Sie alle Ursprünge entfernter Browser, etwa HTTPS-Proxy-URLs, explizit zu `gateway.controlUi.allowedOrigins` hinzu.

### Modi für Hot Reload

| `gateway.reload.mode` | Verhalten                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Kein Neuladen der Konfiguration            |
| `hot`                 | Nur Hot-Safe-Änderungen anwenden           |
| `restart`             | Bei Änderungen mit erforderlichem Neustart neu starten |
| `hybrid` (Standard)   | Wenn sicher, im laufenden Betrieb anwenden; bei Bedarf neu starten |

## Operator-Befehlssatz

```bash
openclaw gateway status
openclaw gateway status --deep   # fügt eine Dienstsuche auf Systemebene hinzu
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` dient der zusätzlichen Dienstsuche (LaunchDaemons/systemd-Systemeinheiten/schtasks), nicht einer tiefergehenden RPC-Zustandsprüfung.

## Mehrere Gateways (auf demselben Host)

Bei den meisten Installationen sollte ein Gateway pro Rechner ausgeführt werden. Ein einzelnes Gateway kann mehrere Agenten und Kanäle hosten. Mehrere Gateways benötigen Sie nur, wenn Sie gezielt Isolation oder einen Rettungs-Bot wünschen.

Nützliche Prüfungen:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Zu erwartendes Verhalten:

- `gateway status --deep` kann `Other gateway-like services detected (best effort)` melden und Bereinigungshinweise ausgeben, wenn veraltete launchd-/systemd-/schtasks-Installationen noch vorhanden sind.
- `gateway probe` kann vor `multiple reachable gateway identities` warnen, wenn unterschiedliche Gateways antworten oder OpenClaw nicht nachweisen kann, dass erreichbare Ziele dasselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zum selben Gateway stellt ein Gateway mit mehreren Transportwegen dar, auch wenn sich die Transportports unterscheiden.
- Wenn dies beabsichtigt ist, isolieren Sie Ports, Konfiguration/Zustand und Workspace-Stammverzeichnisse für jedes Gateway.

Checkliste pro Instanz:

- Eindeutiger `gateway.port`
- Eindeutiger `OPENCLAW_CONFIG_PATH`
- Eindeutiger `OPENCLAW_STATE_DIR`
- Eindeutiger `agents.defaults.workspace`

Beispiel:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Ausführliche Einrichtung: [/gateway/multiple-gateways](/de/gateway/multiple-gateways).

## Fernzugriff

Bevorzugt: Tailscale/VPN.
Ausweichlösung: SSH-Tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Verbinden Sie anschließend Clients lokal mit `ws://127.0.0.1:18789`.

<Warning>
SSH-Tunnel umgehen die Gateway-Authentifizierung nicht. Bei der Authentifizierung mit gemeinsamem Geheimnis müssen Clients auch über den Tunnel weiterhin
`token`/`password` senden. Bei identitätstragenden Modi
muss die Anfrage weiterhin den entsprechenden Authentifizierungspfad erfüllen.
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

Verwenden Sie `openclaw gateway restart` für Neustarts. Verketten Sie `openclaw gateway stop` und `openclaw gateway start` nicht als Ersatz für einen Neustart.

Unter macOS verwendet `gateway stop` standardmäßig `launchctl bootout`. Dadurch wird der LaunchAgent aus der aktuellen Startsitzung entfernt, ohne dauerhaft deaktiviert zu werden. Somit funktioniert die automatische Wiederherstellung durch KeepAlive nach unerwarteten Abstürzen weiterhin, und `gateway start` aktiviert ihn ordnungsgemäß wieder. Um den automatischen Neustart über Systemneustarts hinweg dauerhaft zu unterdrücken, übergeben Sie `--disable`: `openclaw gateway stop --disable`.

LaunchAgent-Bezeichnungen lauten `ai.openclaw.gateway` (Standard) oder `ai.openclaw.<profile>` (benanntes Profil). `openclaw doctor` prüft und repariert Abweichungen der Dienstkonfiguration.

  </Tab>

  <Tab title="Linux (systemd-Benutzerdienst)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aktivieren Sie für die Ausführung nach der Abmeldung das Verweilen:

```bash
sudo loginctl enable-linger $(whoami)
```

Stellen Sie auf einem Headless-Server ohne Desktop-Sitzung außerdem sicher, dass `XDG_RUNTIME_DIR` auf `export XDG_RUNTIME_DIR=/run/user/$(id -u)` gesetzt ist, bevor Sie die `systemctl --user`-Befehle erneut ausführen.

Beispiel einer manuellen Benutzereinheit, wenn Sie einen benutzerdefinierten Installationspfad benötigen:

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

Der verwaltete native Windows-Start verwendet eine geplante Aufgabe namens `OpenClaw Gateway`
(oder `OpenClaw Gateway (<profile>)` für benannte Profile). Wenn die Erstellung der geplanten Aufgabe
verweigert wird, greift OpenClaw auf ein Startordner-Startprogramm pro Benutzer zurück,
das auf `gateway.cmd` im Zustandsverzeichnis verweist.

  </Tab>

  <Tab title="Linux (Systemdienst)">

Verwenden Sie eine Systemeinheit für Mehrbenutzer- bzw. dauerhaft aktive Hosts.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Verwenden Sie denselben Dienstinhalt wie für die Benutzereinheit, installieren Sie ihn jedoch unter
`/etc/systemd/system/openclaw-gateway[-<profile>].service` und passen Sie
`ExecStart=` an, wenn sich Ihre `openclaw`-Binärdatei an anderer Stelle befindet.

Lassen Sie `openclaw doctor --fix` nicht zusätzlich einen Gateway-Dienst auf Benutzerebene für dasselbe Profil bzw. denselben Port installieren. Doctor verweigert diese automatische Installation, wenn ein OpenClaw-Gateway-Dienst auf Systemebene gefunden wird; verwenden Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die Systemeinheit den Lebenszyklus verwaltet.

  </Tab>
</Tabs>

Fehler aufgrund einer ungültigen Konfiguration werden mit Code `78` beendet. Linux-systemd-Einheiten verwenden `RestartPreventExitStatus=78`, um weitere Starts zu unterbinden, bis die Konfiguration korrigiert wurde. launchd und die Windows-Aufgabenplanung besitzen keine entsprechende Regel zum Beenden anhand des Exitcodes. Daher speichert das Gateway zusätzlich den Verlauf schneller unsauberer Starts und unterdrückt nach wiederholten Startfehlern den automatischen Start von Kanal-/Provider-Konten. In diesem abgesicherten Modus wird die Steuerungsebene weiterhin für Prüfung und Reparatur gestartet; Hot Reloads der Konfiguration und `secrets.reload` verweigern automatische Kanalneustarts, und eine explizite Operator-Anfrage mit `channels.start` kann die Unterdrückung außer Kraft setzen.

## Schnellstart mit Entwicklungsprofil

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Zu den Vorgaben gehören ein isolierter Zustand/eine isolierte Konfiguration und der Gateway-Basisport `19001`.

## Protokoll-Kurzreferenz (Operator-Sicht)

- Der erste Client-Frame muss `connect` sein.
- Der Gateway gibt einen `hello-ok`-Frame mit einem `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`) sowie `policy`-Limits (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`) zurück.
- `hello-ok.features.methods` / `events` sind eine konservative Erkennungsliste und keine
  generierte Auflistung aller aufrufbaren Hilfsrouten.
- Anfragen: `req(method, params)` → `res(ok/payload|error)`.
- Zu den üblichen Ereignissen gehören `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, das optionale
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, Lebenszyklusereignisse für Kopplung/Genehmigung und `shutdown`.

Agent-Ausführungen erfolgen in zwei Phasen:

1. Sofortige Annahmebestätigung (`status:"accepted"`)
2. Abschließende Fertigstellungsantwort (`status:"ok"|"error"`), dazwischen mit gestreamten `agent`-Ereignissen.

Die vollständige Protokolldokumentation finden Sie unter [Gateway-Protokoll](/de/gateway/protocol).

## Betriebsprüfungen

### Verfügbarkeit

- Öffnen Sie eine WS-Verbindung und senden Sie `connect`.
- Erwarten Sie eine `hello-ok`-Antwort mit Snapshot.

### Bereitschaft

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Wiederherstellung bei Lücken

Ereignisse werden nicht erneut wiedergegeben. Aktualisieren Sie bei Sequenzlücken den Zustand (`health`, `system-presence`), bevor Sie fortfahren.

## Häufige Fehlersignaturen

| Signatur                                                       | Wahrscheinliches Problem                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                    | Bindung außerhalb von Loopback ohne gültigen Gateway-Authentifizierungspfad    |
| `another gateway instance is already listening` / `EADDRINUSE` | Portkonflikt                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | Die Konfiguration ist auf den Remote-Modus eingestellt oder `gateway.mode` fehlt in einer beschädigten Konfiguration |
| `unauthorized` während des Verbindungsaufbaus                  | Nicht übereinstimmende Authentifizierung zwischen Client und Gateway            |

Vollständige Diagnoseabläufe finden Sie unter [Gateway-Fehlerbehebung](/de/gateway/troubleshooting).

## Sicherheitsgarantien

- Gateway-Protokollclients brechen sofort ab, wenn der Gateway nicht verfügbar ist (kein impliziter Fallback auf einen direkten Kanal).
- Ungültige erste Frames oder erste Frames, die keine Verbindungsframes sind, werden abgelehnt und geschlossen.
- Beim ordnungsgemäßen Herunterfahren wird vor dem Schließen des Sockets das Ereignis `shutdown` ausgegeben.

## Verwandte Themen

- [Konfiguration](/de/gateway/configuration)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Hintergrundprozess](/de/gateway/background-process)
- [Systemzustand](/de/gateway/health)
- [Doctor](/de/gateway/doctor)
- [Authentifizierung](/de/gateway/authentication)
- [Remote-Zugriff](/de/gateway/remote)
- [Verwaltung von Geheimnissen](/de/gateway/secrets)
