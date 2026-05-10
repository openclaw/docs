---
read_when:
    - Gateway-Prozess ausführen oder debuggen
summary: Runbook für den Gateway-Dienst, den Lebenszyklus und den Betrieb
title: Gateway-Runbook
x-i18n:
    generated_at: "2026-05-10T19:36:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54f868e0b263e346876fb5c4f6a359e8a6f6802871f6931668ebe57140ca2711
    source_path: gateway/index.md
    workflow: 16
---

Verwenden Sie diese Seite für die Inbetriebnahme am ersten Tag und den Betrieb ab Tag 2 des Gateway-Dienstes.

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/de/gateway/troubleshooting">
    Symptomorientierte Diagnose mit exakten Befehlsabfolgen und Log-Signaturen.
  </Card>
  <Card title="Configuration" icon="sliders" href="/de/gateway/configuration">
    Aufgabenorientierte Einrichtungsanleitung und vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Secrets management" icon="key-round" href="/de/gateway/secrets">
    SecretRef-Vertrag, Verhalten von Runtime-Snapshots und Migrations-/Reload-Vorgänge.
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/de/gateway/secrets-plan-contract">
    Exakte Ziel-/Pfadregeln für `secrets apply` und ref-only-Verhalten von auth-Profilen.
  </Card>
</CardGroup>

## 5-Minuten-Start lokal

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Gesunde Ausgangslage: `Runtime: running`, `Connectivity probe: ok` und `Capability: ...`, passend zu Ihrer Erwartung. Verwenden Sie `openclaw gateway status --require-rpc`, wenn Sie einen RPC-Nachweis mit Lesebereich benötigen, nicht nur Erreichbarkeit.

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

Bei einem erreichbaren Gateway führt dies Live-Prüfungen pro Account-Channel und optionale Audits aus.
Wenn das Gateway nicht erreichbar ist, fällt die CLI auf reine Konfigurationszusammenfassungen der Channels zurück,
statt Live-Prüfungsausgaben zu liefern.

  </Step>
</Steps>

<Note>
Der Reload der Gateway-Konfiguration überwacht den aktiven Konfigurationsdateipfad (aufgelöst aus Profil-/Status-Defaults oder aus `OPENCLAW_CONFIG_PATH`, wenn gesetzt).
Der Standardmodus ist `gateway.reload.mode="hybrid"`.
Nach dem ersten erfolgreichen Laden bedient der laufende Prozess den aktiven In-Memory-Konfigurationssnapshot; ein erfolgreicher Reload tauscht diesen Snapshot atomar aus.
</Note>

## Runtime-Modell

- Ein dauerhaft laufender Prozess für Routing, Control Plane und Channel-Verbindungen.
- Einzelner multiplexter Port für:
  - WebSocket-Control/RPC
  - HTTP-APIs, OpenAI-kompatibel (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control-UI und Hooks
- Standard-Bind-Modus: `loopback`.
- Auth ist standardmäßig erforderlich. Shared-Secret-Setups verwenden
  `gateway.auth.token` / `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), und Reverse-Proxy-Setups
  außerhalb von loopback können `gateway.auth.mode: "trusted-proxy"` verwenden.

## OpenAI-kompatible Endpunkte

OpenClaws wichtigste Kompatibilitätsoberfläche ist jetzt:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Warum diese Auswahl wichtig ist:

- Die meisten Integrationen mit Open WebUI, LobeChat und LibreChat prüfen zuerst `/v1/models`.
- Viele RAG- und Memory-Pipelines erwarten `/v1/embeddings`.
- Agent-native Clients bevorzugen zunehmend `/v1/responses`.

Planungshinweis:

- `/v1/models` ist agent-first: Es gibt `openclaw`, `openclaw/default` und `openclaw/<agentId>` zurück.
- `openclaw/default` ist der stabile Alias, der immer dem konfigurierten Standard-Agent zugeordnet ist.
- Verwenden Sie `x-openclaw-model`, wenn Sie einen Backend-Provider-/Modell-Override wünschen; andernfalls bleibt das normale Modell- und Embedding-Setup des ausgewählten Agent maßgeblich.

Alle diese Endpunkte laufen auf dem Hauptport des Gateway und verwenden dieselbe vertrauenswürdige Operator-Auth-Grenze wie die übrige Gateway-HTTP-API.

### Port- und Bind-Priorität

| Einstellung  | Auflösungsreihenfolge                                       |
| ------------ | ----------------------------------------------------------- |
| Gateway-Port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind-Modus   | CLI/Override → `gateway.bind` → `loopback`                  |

Installierte Gateway-Dienste speichern den aufgelösten `--port` in Supervisor-Metadaten. Nachdem Sie `gateway.port` geändert haben, führen Sie `openclaw doctor --fix` oder `openclaw gateway install --force` aus, damit launchd/systemd/schtasks den Prozess auf dem neuen Port startet.

Der Gateway-Start verwendet denselben effektiven Port und Bind, wenn er lokale
Control-UI-Origins für Nicht-loopback-Binds initialisiert. Beispielsweise initialisiert
`--bind lan --port 3000`
`http://localhost:3000` und `http://127.0.0.1:3000`, bevor die Runtime-Validierung
ausgeführt wird. Fügen Sie Remote-Browser-Origins, etwa HTTPS-Proxy-URLs, explizit zu
`gateway.controlUi.allowedOrigins` hinzu.

### Hot-Reload-Modi

| `gateway.reload.mode` | Verhalten                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Kein Konfigurations-Reload                 |
| `hot`                 | Nur hot-safe Änderungen anwenden           |
| `restart`             | Bei reloadpflichtigen Änderungen neu starten |
| `hybrid` (Standard)   | Hot-Apply, wenn sicher, Neustart, wenn erforderlich |

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

`gateway status --deep` dient zusätzlicher Diensterkennung (LaunchDaemons/systemd-System-
Units/schtasks), nicht einer tieferen RPC-Health-Prüfung.

## Mehrere Gateways (derselbe Host)

Die meisten Installationen sollten ein Gateway pro Maschine ausführen. Ein einzelnes Gateway kann mehrere
Agents und Channels hosten.

Sie benötigen mehrere Gateways nur, wenn Sie bewusst Isolation oder einen Rescue-Bot wünschen.

Nützliche Prüfungen:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Zu erwarten:

- `gateway status --deep` kann `Other gateway-like services detected (best effort)`
  melden und Bereinigungshinweise ausgeben, wenn veraltete launchd/systemd/schtasks-Installationen noch vorhanden sind.
- `gateway probe` kann vor `multiple reachable gateways` warnen, wenn mehr als ein Ziel
  antwortet.
- Wenn das beabsichtigt ist, isolieren Sie Ports, Konfiguration/Status und Workspace-Roots pro Gateway.

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

## Remotezugriff

Bevorzugt: Tailscale/VPN.
Fallback: SSH-Tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Verbinden Sie Clients anschließend lokal mit `ws://127.0.0.1:18789`.

<Warning>
SSH-Tunnel umgehen die Gateway-Auth nicht. Bei Shared-Secret-Auth müssen Clients
auch über den Tunnel `token`/`password` senden. Bei identitätsführenden Modi
muss die Anfrage weiterhin diesen Auth-Pfad erfüllen.
</Warning>

Siehe: [Remote Gateway](/de/gateway/remote), [Authentifizierung](/de/gateway/authentication), [Tailscale](/de/gateway/tailscale).

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

Unter macOS verwendet `gateway stop` standardmäßig `launchctl bootout` — dadurch wird der LaunchAgent aus der aktuellen Boot-Sitzung entfernt, ohne eine Deaktivierung dauerhaft zu speichern, sodass die KeepAlive-Auto-Wiederherstellung nach unerwarteten Abstürzen weiterhin funktioniert und `gateway start` sauber wieder aktiviert. Um Auto-Respawn über Neustarts hinweg dauerhaft zu unterdrücken, übergeben Sie `--disable`: `openclaw gateway stop --disable`.

LaunchAgent-Labels sind `ai.openclaw.gateway` (Standard) oder `ai.openclaw.<profile>` (benanntes Profil). `openclaw doctor` auditiert und repariert Abweichungen in der Dienstkonfiguration.

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

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Der native verwaltete Windows-Start verwendet eine geplante Aufgabe namens `OpenClaw Gateway`
(oder `OpenClaw Gateway (<profile>)` für benannte Profile). Wenn die Erstellung der geplanten Aufgabe
verweigert wird, fällt OpenClaw auf einen per-user Startup-Ordner-Launcher zurück,
der auf `gateway.cmd` im Statusverzeichnis verweist.

  </Tab>

  <Tab title="Linux (system service)">

Verwenden Sie eine System-Unit für Multi-User-/Always-on-Hosts.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Verwenden Sie denselben Dienstkörper wie bei der User-Unit, installieren Sie ihn aber unter
`/etc/systemd/system/openclaw-gateway[-<profile>].service` und passen Sie
`ExecStart=` an, wenn Ihre `openclaw`-Binärdatei an anderer Stelle liegt.

Lassen Sie nicht zusätzlich `openclaw doctor --fix` einen Gateway-Dienst auf Benutzerebene für dasselbe Profil/denselben Port installieren. Doctor verweigert diese automatische Installation, wenn es einen OpenClaw-Gateway-Dienst auf Systemebene findet; verwenden Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die System-Unit den Lebenszyklus besitzt.

  </Tab>
</Tabs>

## Schneller Pfad für das Dev-Profil

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Defaults umfassen isolierten Status/isolierte Konfiguration und den Basis-Gateway-Port `19001`.

## Protokoll-Kurzreferenz (Operator-Sicht)

- Der erste Client-Frame muss `connect` sein.
- Gateway gibt einen `hello-ok`-Snapshot zurück (`presence`, `health`, `stateVersion`, `uptimeMs`, Limits/Policy).
- `hello-ok.features.methods` / `events` sind eine konservative Discovery-Liste, kein
  generierter Dump jeder aufrufbaren Helper-Route.
- Anfragen: `req(method, params)` → `res(ok/payload|error)`.
- Häufige Events umfassen `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, Lebenszyklus-Events für Pairing/Approval und `shutdown`.

Agent-Ausführungen sind zweistufig:

1. Sofortige Accepted-Bestätigung (`status:"accepted"`)
2. Finale Completion-Antwort (`status:"ok"|"error"`), mit gestreamten `agent`-Events dazwischen.

Siehe vollständige Protokolldokumentation: [Gateway-Protokoll](/de/gateway/protocol).

## Betriebsprüfungen

### Liveness

- WS öffnen und `connect` senden.
- `hello-ok`-Antwort mit Snapshot erwarten.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap Recovery

Events werden nicht erneut abgespielt. Aktualisieren Sie bei Sequenzlücken den Status (`health`, `system-presence`), bevor Sie fortfahren.

## Häufige Fehlersignaturen

| Signatur                                                      | Wahrscheinliches Problem                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Nicht-Loopback-Bindung ohne gültigen Gateway-Auth-Pfad                             |
| `another gateway instance is already listening` / `EADDRINUSE` | Portkonflikt                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | Config ist auf Remote-Modus gesetzt, oder der Local-Mode-Stempel fehlt in einer beschädigten Config |
| `unauthorized` during connect                                  | Auth-Abweichung zwischen Client und Gateway                                        |

Für vollständige Diagnoseleitern verwenden Sie [Gateway-Fehlerbehebung](/de/gateway/troubleshooting).

## Sicherheitsgarantien

- Gateway-Protokoll-Clients schlagen schnell fehl, wenn Gateway nicht verfügbar ist (kein impliziter Fallback auf einen direkten Kanal).
- Ungültige/nicht verbindende erste Frames werden abgewiesen und geschlossen.
- Ordnungsgemäßes Herunterfahren gibt vor dem Schließen des Sockets ein `shutdown`-Ereignis aus.

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
