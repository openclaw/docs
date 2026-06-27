---
read_when:
    - Gateway-Prozess ausführen oder debuggen
summary: Runbook für den Gateway-Dienst, Lebenszyklus und Betrieb
title: Gateway-Runbook
x-i18n:
    generated_at: "2026-06-27T17:30:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

Verwenden Sie diese Seite für die Inbetriebnahme am ersten Tag und den Betrieb ab dem zweiten Tag des Gateway-Dienstes.

<CardGroup cols={2}>
  <Card title="Tiefgehende Fehlerbehebung" icon="siren" href="/de/gateway/troubleshooting">
    Symptomorientierte Diagnose mit exakten Befehlsabfolgen und Log-Signaturen.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Aufgabenorientierte Einrichtungsanleitung + vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Secrets-Verwaltung" icon="key-round" href="/de/gateway/secrets">
    SecretRef-Vertrag, Snapshot-Verhalten zur Laufzeit und Migrations-/Neuladevorgänge.
  </Card>
  <Card title="Secrets-Plan-Vertrag" icon="shield-check" href="/de/gateway/secrets-plan-contract">
    Exakte Ziel-/Pfadregeln für `secrets apply` und ref-only-Verhalten für Auth-Profile.
  </Card>
</CardGroup>

## Lokaler Start in 5 Minuten

<Steps>
  <Step title="Gateway starten">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Dienstzustand prüfen">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Gesunde Basis: `Runtime: running`, `Connectivity probe: ok` und `Capability: ...`, passend zu Ihrer Erwartung. Verwenden Sie `openclaw gateway status --require-rpc`, wenn Sie RPC-Nachweis mit Leseberechtigung benötigen, nicht nur Erreichbarkeit.

  </Step>

  <Step title="Kanalbereitschaft validieren">

```bash
openclaw channels status --probe
```

Bei erreichbarem Gateway führt dies Live-Kanalprüfungen pro Konto und optionale Audits aus.
Wenn das Gateway nicht erreichbar ist, fällt die CLI statt Live-Prüfausgabe auf rein konfigurationsbasierte Kanalzusammenfassungen zurück.

  </Step>
</Steps>

<Note>
Das Neuladen der Gateway-Konfiguration überwacht den aktiven Konfigurationsdateipfad (aufgelöst aus Profil-/State-Standards oder aus `OPENCLAW_CONFIG_PATH`, wenn gesetzt).
Der Standardmodus ist `gateway.reload.mode="hybrid"`.
Nach dem ersten erfolgreichen Laden stellt der laufende Prozess den aktiven In-Memory-Konfigurations-Snapshot bereit; ein erfolgreiches Neuladen tauscht diesen Snapshot atomar aus.
</Note>

## Laufzeitmodell

- Ein immer aktiver Prozess für Routing, Steuerungsebene und Kanalverbindungen.
- Ein einzelner multiplexter Port für:
  - WebSocket-Steuerung/RPC
  - HTTP-APIs (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Plugin-HTTP-Routen, z. B. optional `/api/v1/admin/rpc`
  - Control UI und Hooks
- Standard-Bind-Modus: `loopback`.
- Auth ist standardmäßig erforderlich. Setups mit gemeinsamem Secret verwenden
  `gateway.auth.token` / `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), und Reverse-Proxy-Setups
  ohne loopback können `gateway.auth.mode: "trusted-proxy"` verwenden.

## OpenAI-kompatible Endpunkte

Die wirkungsvollste Kompatibilitätsfläche von OpenClaw ist jetzt:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Warum diese Auswahl wichtig ist:

- Die meisten Integrationen für Open WebUI, LobeChat und LibreChat prüfen zuerst `/v1/models`.
- Viele RAG- und Memory-Pipelines erwarten `/v1/embeddings`.
- Agent-native Clients bevorzugen zunehmend `/v1/responses`.

Planungshinweis:

- `/v1/models` ist agent-first: Es gibt `openclaw`, `openclaw/default` und `openclaw/<agentId>` zurück.
- `openclaw/default` ist der stabile Alias, der immer dem konfigurierten Standard-Agenten zugeordnet ist.
- Verwenden Sie `x-openclaw-model`, wenn Sie einen Backend-Provider-/Modell-Override wünschen; andernfalls bleibt die normale Modell- und Embedding-Einrichtung des ausgewählten Agenten maßgeblich.

Alle diese Endpunkte laufen auf dem Hauptport des Gateway und verwenden dieselbe vertrauenswürdige Operator-Auth-Grenze wie der Rest der Gateway-HTTP-API.

Admin-HTTP-RPC (`POST /api/v1/admin/rpc`) ist eine separate, standardmäßig deaktivierte Plugin-Route für Host-Tools, die WebSocket-RPC nicht verwenden können. Siehe [Admin-HTTP-RPC](/de/plugins/admin-http-rpc).

### Port- und Bind-Priorität

| Einstellung  | Auflösungsreihenfolge                                      |
| ------------ | ---------------------------------------------------------- |
| Gateway-Port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind-Modus   | CLI/Override → `gateway.bind` → `loopback`                 |

Installierte Gateway-Dienste speichern den aufgelösten `--port` in Supervisor-Metadaten. Nachdem Sie `gateway.port` geändert haben, führen Sie `openclaw doctor --fix` oder `openclaw gateway install --force` aus, damit launchd/systemd/schtasks den Prozess auf dem neuen Port startet.

Der Gateway-Start verwendet denselben effektiven Port und Bind, wenn lokale
Control-UI-Origins für Nicht-loopback-Binds gesetzt werden. Beispielsweise setzt
`--bind lan --port 3000` `http://localhost:3000` und `http://127.0.0.1:3000`,
bevor die Laufzeitvalidierung ausgeführt wird. Fügen Sie alle Remote-Browser-Origins,
z. B. HTTPS-Proxy-URLs, explizit zu `gateway.controlUi.allowedOrigins` hinzu.

### Hot-Reload-Modi

| `gateway.reload.mode` | Verhalten                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Kein Neuladen der Konfiguration            |
| `hot`                 | Nur hot-sichere Änderungen anwenden        |
| `restart`             | Bei Änderungen, die einen Neustart erfordern, neu starten |
| `hybrid` (Standard)   | Hot anwenden, wenn sicher; neu starten, wenn erforderlich |

## Operator-Befehlssatz

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

`gateway status --deep` ist für zusätzliche Diensterkennung (LaunchDaemons/systemd-System-
Units/schtasks) gedacht, nicht für eine tiefere RPC-Zustandsprüfung.

## Mehrere Gateways (gleicher Host)

Die meisten Installationen sollten ein Gateway pro Maschine ausführen. Ein einzelnes Gateway kann mehrere
Agenten und Kanäle hosten.

Sie benötigen mehrere Gateways nur, wenn Sie absichtlich Isolation oder einen Rescue-Bot wünschen.

Nützliche Prüfungen:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Was Sie erwarten können:

- `gateway status --deep` kann `Other gateway-like services detected (best effort)`
  melden und Bereinigungshinweise ausgeben, wenn noch veraltete launchd-/systemd-/schtasks-Installationen vorhanden sind.
- `gateway probe` kann vor `multiple reachable gateway identities` warnen, wenn unterschiedliche
  Gateways antworten oder wenn OpenClaw nicht nachweisen kann, dass erreichbare Ziele dasselbe Gateway sind.
  Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zum selben Gateway ist ein
  Gateway mit mehreren Transporten, auch wenn sich die Transport-Ports unterscheiden.
- Wenn dies beabsichtigt ist, isolieren Sie Ports, Konfiguration/State und Workspace-Roots pro Gateway.

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

Detaillierte Einrichtung: [/gateway/multiple-gateways](/de/gateway/multiple-gateways).

## Remote-Zugriff

Bevorzugt: Tailscale/VPN.
Fallback: SSH-Tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Verbinden Sie Clients anschließend lokal mit `ws://127.0.0.1:18789`.

<Warning>
SSH-Tunnel umgehen die Gateway-Auth nicht. Bei Auth mit gemeinsamem Secret müssen Clients
auch über den Tunnel weiterhin `token`/`password` senden. Bei Modi mit Identität
muss die Anfrage weiterhin diesen Auth-Pfad erfüllen.
</Warning>

Siehe: [Remote-Gateway](/de/gateway/remote), [Authentifizierung](/de/gateway/authentication), [Tailscale](/de/gateway/tailscale).

## Supervision und Dienstlebenszyklus

Verwenden Sie überwachte Ausführungen für produktionsähnliche Zuverlässigkeit.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Verwenden Sie `openclaw gateway restart` für Neustarts. Verketten Sie `openclaw gateway stop` und `openclaw gateway start` nicht als Ersatz für einen Neustart.

Unter macOS verwendet `gateway stop` standardmäßig `launchctl bootout` — dies entfernt den LaunchAgent aus der aktuellen Boot-Sitzung, ohne eine Deaktivierung dauerhaft zu speichern, sodass KeepAlive-Auto-Recovery nach unerwarteten Abstürzen weiterhin funktioniert und `gateway start` sauber wieder aktiviert. Um automatisches Respawn über Neustarts hinweg dauerhaft zu unterdrücken, übergeben Sie `--disable`: `openclaw gateway stop --disable`.

LaunchAgent-Labels sind `ai.openclaw.gateway` (Standard) oder `ai.openclaw.<profile>` (benanntes Profil). `openclaw doctor` auditiert und repariert Drift in der Dienstkonfiguration.

  </Tab>

  <Tab title="Linux (systemd-Benutzer)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aktivieren Sie Lingering für Persistenz nach dem Abmelden:

```bash
sudo loginctl enable-linger <user>
```

Manuelles Beispiel für eine Benutzer-Unit, wenn Sie einen benutzerdefinierten Installationspfad benötigen:

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
verweigert wird, fällt OpenClaw auf einen pro-Benutzer-Launcher im Autostart-Ordner zurück,
der auf `gateway.cmd` im State-Verzeichnis zeigt.

  </Tab>

  <Tab title="Linux (Systemdienst)">

Verwenden Sie eine System-Unit für Mehrbenutzer-/Immer-aktiv-Hosts.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Verwenden Sie denselben Dienstkörper wie bei der Benutzer-Unit, installieren Sie ihn aber unter
`/etc/systemd/system/openclaw-gateway[-<profile>].service` und passen Sie
`ExecStart=` an, falls Ihre `openclaw`-Binärdatei an anderer Stelle liegt.

Lassen Sie nicht zusätzlich `openclaw doctor --fix` einen Gateway-Dienst auf Benutzerebene für dasselbe Profil/denselben Port installieren. Doctor verweigert diese automatische Installation, wenn er einen OpenClaw-Gateway-Dienst auf Systemebene findet; verwenden Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die System-Unit den Lebenszyklus besitzt.

  </Tab>
</Tabs>

## Schneller Pfad für das Dev-Profil

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Die Standards umfassen isolierten State/isolierte Konfiguration und den Basis-Gateway-Port `19001`.

## Kurzreferenz zum Protokoll (Operator-Sicht)

- Der erste Client-Frame muss `connect` sein.
- Gateway gibt einen `hello-ok`-Snapshot zurück (`presence`, `health`, `stateVersion`, `uptimeMs`, Limits/Policy).
- `hello-ok.features.methods` / `events` sind eine konservative Erkennungsliste, kein
  generierter Dump jeder aufrufbaren Helper-Route.
- Anfragen: `req(method, params)` → `res(ok/payload|error)`.
- Häufige Events sind unter anderem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `sessions.changed`,
  `presence`, `tick`, `health`, `heartbeat`, Events zum Pairing-/Approval-Lebenszyklus
  und `shutdown`.

Agent-Ausführungen sind zweistufig:

1. Sofortige Annahmebestätigung (`status:"accepted"`)
2. Abschließende Completion-Antwort (`status:"ok"|"error"`), mit gestreamten `agent`-Events dazwischen.

Siehe vollständige Protokolldokumentation: [Gateway-Protokoll](/de/gateway/protocol).

## Betriebliche Prüfungen

### Liveness

- WS öffnen und `connect` senden.
- `hello-ok`-Antwort mit Snapshot erwarten.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Wiederherstellung bei Lücken

Events werden nicht erneut abgespielt. Aktualisieren Sie bei Sequenzlücken den State (`health`, `system-presence`), bevor Sie fortfahren.

## Häufige Fehlersignaturen

| Signatur                                                       | Wahrscheinliches Problem                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Nicht-Loopback-Bind ohne gültigen Gateway-Authentifizierungspfad                |
| `another gateway instance is already listening` / `EADDRINUSE` | Portkonflikt                                                                    |
| `Gateway start blocked: set gateway.mode=local`                | Konfiguration ist auf Remote-Modus gesetzt, oder der Local-Mode-Stempel fehlt in einer beschädigten Konfiguration |
| `unauthorized` während der Verbindung                          | Authentifizierungsabweichung zwischen Client und Gateway                        |

Für vollständige Diagnoseleitern verwenden Sie [Gateway-Fehlerbehebung](/de/gateway/troubleshooting).

## Sicherheitsgarantien

- Gateway-Protokoll-Clients schlagen schnell fehl, wenn der Gateway nicht verfügbar ist (kein impliziter Fallback auf Direct-Channel).
- Ungültige bzw. Nicht-Verbindungs-First-Frames werden abgelehnt und geschlossen.
- Ein ordnungsgemäßes Herunterfahren sendet das Ereignis `shutdown`, bevor der Socket geschlossen wird.

---

Verwandt:

- [Fehlerbehebung](/de/gateway/troubleshooting)
- [Hintergrundprozess](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Integrität](/de/gateway/health)
- [Doctor](/de/gateway/doctor)
- [Authentifizierung](/de/gateway/authentication)

## Verwandt

- [Konfiguration](/de/gateway/configuration)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Remote-Zugriff](/de/gateway/remote)
- [Geheimnisverwaltung](/de/gateway/secrets)
