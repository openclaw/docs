---
read_when:
    - Den Gateway-Prozess ausführen oder debuggen
summary: Runbook für den Gateway-Service, den Lifecycle und den Betrieb
title: Gateway-Runbook
x-i18n:
    generated_at: "2026-04-26T11:29:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

Verwenden Sie diese Seite für den Start am ersten Tag und den Betrieb am zweiten Tag des Gateway-Service.

<CardGroup cols={2}>
  <Card title="Detaillierte Fehlerbehebung" icon="siren" href="/de/gateway/troubleshooting">
    Symptomorientierte Diagnose mit exakten Befehlsfolgen und Log-Signaturen.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Aufgabenorientierte Einrichtungsanleitung + vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Geheimnisverwaltung" icon="key-round" href="/de/gateway/secrets">
    SecretRef-Vertrag, Verhalten von Laufzeit-Snapshots und Vorgänge für Migration/Reload.
  </Card>
  <Card title="Secrets-Plan-Vertrag" icon="shield-check" href="/de/gateway/secrets-plan-contract">
    Exakte Regeln für Ziele/Pfade von `secrets apply` und rein ref-basiertes Verhalten von Auth-Profilen.
  </Card>
</CardGroup>

## Lokaler Start in 5 Minuten

<Steps>
  <Step title="Das Gateway starten">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Dienstzustand überprüfen">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Gesunder Ausgangszustand: `Runtime: running`, `Connectivity probe: ok` und `Capability: ...`, passend zu Ihren Erwartungen. Verwenden Sie `openclaw gateway status --require-rpc`, wenn Sie einen Nachweis für RPC mit Leseberechtigung benötigen, nicht nur Erreichbarkeit.

  </Step>

  <Step title="Kanalbereitschaft validieren">

```bash
openclaw channels status --probe
```

Bei einem erreichbaren Gateway führt dies Live-Kanal-Probes und optionale Audits pro Konto aus.
Wenn das Gateway nicht erreichbar ist, fällt die CLI auf reine Konfigurationszusammenfassungen der Kanäle zurück
anstatt auf eine Live-Probe-Ausgabe.

  </Step>
</Steps>

<Note>
Das Reload der Gateway-Konfiguration überwacht den aktiven Pfad der Konfigurationsdatei (aufgelöst aus Profil-/Status-Standards oder `OPENCLAW_CONFIG_PATH`, wenn gesetzt).
Der Standardmodus ist `gateway.reload.mode="hybrid"`.
Nach dem ersten erfolgreichen Laden stellt der laufende Prozess den aktiven In-Memory-Snapshot der Konfiguration bereit; ein erfolgreiches Reload tauscht diesen Snapshot atomar aus.
</Note>

## Laufzeitmodell

- Ein ständig laufender Prozess für Routing, Control Plane und Kanalverbindungen.
- Ein einzelner multiplexter Port für:
  - WebSocket-Control/RPC
  - HTTP-APIs, OpenAI-kompatibel (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI und Hooks
- Standard-Bind-Modus: `loopback`.
- Authentifizierung ist standardmäßig erforderlich. Setups mit gemeinsamem Geheimnis verwenden
  `gateway.auth.token` / `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), und nicht-Loopback-
  Reverse-Proxy-Setups können `gateway.auth.mode: "trusted-proxy"` verwenden.

## OpenAI-kompatible Endpunkte

Die Kompatibilitätsoberfläche mit der größten Hebelwirkung von OpenClaw ist jetzt:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Warum diese Auswahl wichtig ist:

- Die meisten Integrationen mit Open WebUI, LobeChat und LibreChat prüfen zuerst `/v1/models`.
- Viele RAG- und Speicher-Pipelines erwarten `/v1/embeddings`.
- Agent-native Clients bevorzugen zunehmend `/v1/responses`.

Hinweis zur Planung:

- `/v1/models` ist agentenorientiert: Es gibt `openclaw`, `openclaw/default` und `openclaw/<agentId>` zurück.
- `openclaw/default` ist der stabile Alias, der immer auf den konfigurierten Standard-Agenten verweist.
- Verwenden Sie `x-openclaw-model`, wenn Sie eine Überschreibung von Backend-Provider/Modell möchten; andernfalls bleibt die normale Modell- und Embedding-Einrichtung des ausgewählten Agenten maßgeblich.

All diese Endpunkte laufen auf dem Hauptport des Gateway und verwenden dieselbe vertrauenswürdige Operator-Authentifizierungsgrenze wie der Rest der Gateway-HTTP-API.

### Vorrang von Port und Bind

| Einstellung   | Auflösungsreihenfolge                                        |
| ------------- | ------------------------------------------------------------- |
| Gateway-Port  | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind-Modus    | CLI/override → `gateway.bind` → `loopback`                    |

Beim Start verwendet das Gateway denselben effektiven Port und Bind-Modus, wenn es lokale
Control-UI-Origins für nicht-Loopback-Binds anlegt. Zum Beispiel legt `--bind lan --port 3000`
`http://localhost:3000` und `http://127.0.0.1:3000` an, bevor die Laufzeit-
Validierung ausgeführt wird. Fügen Sie entfernte Browser-Origins, etwa HTTPS-Proxy-URLs, zu
`gateway.controlUi.allowedOrigins` explizit hinzu.

### Hot-Reload-Modi

| `gateway.reload.mode` | Verhalten                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Kein Reload der Konfiguration              |
| `hot`                 | Nur Hot-sichere Änderungen anwenden        |
| `restart`             | Bei reload-pflichtigen Änderungen neu starten |
| `hybrid` (Standard)   | Hot anwenden, wenn sicher, sonst Neustart  |

## Befehlsmenge für Operatoren

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` dient zusätzlicher Diensterkennung (LaunchDaemons/systemd-System-
Units/schtasks), nicht einer tieferen RPC-Zustandsprüfung.

## Mehrere Gateways (gleicher Host)

Die meisten Installationen sollten ein Gateway pro Maschine ausführen. Ein einzelnes Gateway kann mehrere
Agenten und Kanäle hosten.

Mehrere Gateways benötigen Sie nur, wenn Sie bewusst Isolation oder einen Rettungs-Bot möchten.

Nützliche Prüfungen:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Was zu erwarten ist:

- `gateway status --deep` kann `Other gateway-like services detected (best effort)`
  melden und Bereinigungshinweise ausgeben, wenn noch veraltete Installationen von launchd/systemd/schtasks vorhanden sind.
- `gateway probe` kann `multiple reachable gateways` warnen, wenn mehr als ein Ziel
  antwortet.
- Wenn dies beabsichtigt ist, isolieren Sie Port, Konfiguration/Status und Workspace-Roots pro Gateway.

Checkliste pro Instanz:

- Eindeutiger `gateway.port`
- Eindeutiger `OPENCLAW_CONFIG_PATH`
- Eindeutiges `OPENCLAW_STATE_DIR`
- Eindeutiges `agents.defaults.workspace`

Beispiel:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Detaillierte Einrichtung: [/gateway/multiple-gateways](/de/gateway/multiple-gateways).

## VoiceClaw-Echtzeit-Brain-Endpunkt

OpenClaw stellt unter
`/voiceclaw/realtime` einen zu VoiceClaw kompatiblen Echtzeit-WebSocket-Endpunkt bereit. Verwenden Sie ihn, wenn ein VoiceClaw-Desktop-Client
direkt mit einem Echtzeit-Brain von OpenClaw sprechen soll, statt über einen separaten Relay-
Prozess zu gehen.

Der Endpunkt verwendet Gemini Live für Audio in Echtzeit und ruft OpenClaw als
Brain auf, indem OpenClaw-Tools direkt Gemini Live verfügbar gemacht werden. Tool-Aufrufe geben ein
sofortiges `working`-Ergebnis zurück, damit der Sprachzug reaktionsfähig bleibt; anschließend
führt OpenClaw das tatsächliche Tool asynchron aus und injiziert das Ergebnis zurück in die
Live-Sitzung. Setzen Sie `GEMINI_API_KEY` in der Prozessumgebung des Gateway. Wenn die
Gateway-Authentifizierung aktiviert ist, sendet der Desktop-Client das Gateway-Token oder -Passwort
in seiner ersten Nachricht `session.config`.

Der Zugriff auf das Echtzeit-Brain führt eigentümergeprüfte OpenClaw-Agentenbefehle aus. Beschränken Sie
`gateway.auth.mode: "none"` auf reine Loopback-Testinstanzen. Nicht-lokale
Verbindungen zum Echtzeit-Brain erfordern Gateway-Authentifizierung.

Für ein isoliertes Test-Gateway führen Sie eine separate Instanz mit eigenem Port, eigener Konfiguration
und eigenem Status aus:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Konfigurieren Sie VoiceClaw dann für:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Fernzugriff

Bevorzugt: Tailscale/VPN.
Fallback: SSH-Tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Verbinden Sie Clients dann lokal mit `ws://127.0.0.1:18789`.

<Warning>
SSH-Tunnel umgehen die Gateway-Authentifizierung nicht. Bei Authentifizierung mit gemeinsamem Geheimnis
müssen Clients auch über den Tunnel weiterhin `token`/`password` senden. Bei Modi mit
Identität muss die Anfrage weiterhin diesen Authentifizierungspfad erfüllen.
</Warning>

Siehe: [Remote Gateway](/de/gateway/remote), [Authentication](/de/gateway/authentication), [Tailscale](/de/gateway/tailscale).

## Überwachung und Service-Lifecycle

Verwenden Sie überwachte Ausführungen für produktionsähnliche Zuverlässigkeit.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Verwenden Sie `openclaw gateway restart` für Neustarts. Verketten Sie nicht `openclaw gateway stop` und `openclaw gateway start`; unter macOS deaktiviert `gateway stop` den LaunchAgent absichtlich, bevor er ihn stoppt.

LaunchAgent-Labels sind `ai.openclaw.gateway` (Standard) oder `ai.openclaw.<profile>` (benanntes Profil). `openclaw doctor` prüft und repariert Drift in der Service-Konfiguration.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Für Persistenz nach dem Abmelden aktivieren Sie Lingering:

```bash
sudo loginctl enable-linger <user>
```

Beispiel für eine manuelle User-Unit, wenn Sie einen benutzerdefinierten Installationspfad benötigen:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
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

Der nativ verwaltete Start unter Windows verwendet eine geplante Aufgabe namens `OpenClaw Gateway`
(oder `OpenClaw Gateway (<profile>)` für benannte Profile). Wenn das Erstellen einer geplanten Aufgabe
verweigert wird, greift OpenClaw auf einen Launcher im Startup-Ordner pro Benutzer zurück, der auf `gateway.cmd` im Statusverzeichnis zeigt.

  </Tab>

  <Tab title="Linux (Systemdienst)">

Verwenden Sie eine System-Unit für Multi-User-/Always-on-Hosts.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Verwenden Sie denselben Service-Body wie bei der User-Unit, installieren Sie ihn aber unter
`/etc/systemd/system/openclaw-gateway[-<profile>].service` und passen Sie
`ExecStart=` an, falls sich Ihr `openclaw`-Binary an anderer Stelle befindet.

  </Tab>
</Tabs>

## Dev-Profil: Schnellpfad

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Die Standardwerte umfassen isolierten Status/Konfiguration und den Basis-Gateway-Port `19001`.

## Kurzübersicht des Protokolls (Operatorsicht)

- Das erste Client-Frame muss `connect` sein.
- Das Gateway gibt einen Snapshot `hello-ok` zurück (`presence`, `health`, `stateVersion`, `uptimeMs`, Limits/Richtlinie).
- `hello-ok.features.methods` / `events` ist eine konservative Discovery-Liste, kein
  generierter Dump aller aufrufbaren Hilfsrouten.
- Requests: `req(method, params)` → `res(ok/payload|error)`.
- Zu den häufigen Ereignissen gehören `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, Pairing-/Freigabe-Lifecycle-Ereignisse und `shutdown`.

Agentenläufe sind zweistufig:

1. Sofortige Bestätigungs-Antwort (`status:"accepted"`)
2. Endgültige Abschlussantwort (`status:"ok"|"error"`), mit gestreamten `agent`-Ereignissen dazwischen.

Die vollständige Protokolldokumentation finden Sie unter: [Gateway Protocol](/de/gateway/protocol).

## Betriebskontrollen

### Liveness

- Öffnen Sie WS und senden Sie `connect`.
- Erwarten Sie eine Antwort `hello-ok` mit Snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap-Recovery

Ereignisse werden nicht erneut abgespielt. Bei Sequenzlücken aktualisieren Sie den Zustand (`health`, `system-presence`), bevor Sie fortfahren.

## Häufige Fehlersignaturen

| Signatur                                                       | Wahrscheinliches Problem                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Nicht-Loopback-Bind ohne gültigen Gateway-Authentifizierungspfad                |
| `another gateway instance is already listening` / `EADDRINUSE` | Portkonflikt                                                                    |
| `Gateway start blocked: set gateway.mode=local`                | Konfiguration auf Remote-Modus gesetzt oder Local-Mode-Stempel fehlt in einer beschädigten Konfiguration |
| `unauthorized` during connect                                  | Authentifizierungsabweichung zwischen Client und Gateway                        |

Für vollständige Diagnosepfade verwenden Sie [Gateway Troubleshooting](/de/gateway/troubleshooting).

## Sicherheitsgarantien

- Gateway-Protokoll-Clients schlagen schnell fehl, wenn das Gateway nicht verfügbar ist (kein impliziter Direktkanal-Fallback).
- Ungültige erste Frames oder solche, die nicht `connect` sind, werden abgewiesen und die Verbindung wird geschlossen.
- Ein geordneter Shutdown sendet ein Ereignis `shutdown`, bevor der Socket geschlossen wird.

---

Verwandt:

- [Troubleshooting](/de/gateway/troubleshooting)
- [Background Process](/de/gateway/background-process)
- [Configuration](/de/gateway/configuration)
- [Health](/de/gateway/health)
- [Doctor](/de/gateway/doctor)
- [Authentication](/de/gateway/authentication)

## Verwandt

- [Configuration](/de/gateway/configuration)
- [Gateway troubleshooting](/de/gateway/troubleshooting)
- [Remote access](/de/gateway/remote)
- [Secrets management](/de/gateway/secrets)
