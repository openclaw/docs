---
read_when:
    - Gateway-Prozess ausführen oder debuggen
summary: Runbook für den Gateway-Dienst, den Lebenszyklus und den Betrieb
title: Gateway-Runbook
x-i18n:
    generated_at: "2026-05-06T06:47:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

Verwenden Sie diese Seite für den Start am Tag 1 und den Betrieb am Tag 2 des Gateway-Dienstes.

<CardGroup cols={2}>
  <Card title="Tiefe Fehlerbehebung" icon="siren" href="/de/gateway/troubleshooting">
    Symptomorientierte Diagnose mit exakten Befehlsfolgen und Log-Signaturen.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Aufgabenorientierte Einrichtungsanleitung + vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Secrets-Verwaltung" icon="key-round" href="/de/gateway/secrets">
    SecretRef-Vertrag, Laufzeit-Snapshot-Verhalten und Migrations-/Neuladevorgänge.
  </Card>
  <Card title="Secrets-Plan-Vertrag" icon="shield-check" href="/de/gateway/secrets-plan-contract">
    Exakte Ziel-/Pfadregeln für `secrets apply` und Ref-only-Verhalten von Auth-Profilen.
  </Card>
</CardGroup>

## 5-Minuten-Start lokal

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

Gesunde Basis: `Runtime: running`, `Connectivity probe: ok` und `Capability: ...`, passend zu Ihren Erwartungen. Verwenden Sie `openclaw gateway status --require-rpc`, wenn Sie einen RPC-Nachweis für den Lesebereich benötigen, nicht nur Erreichbarkeit.

  </Step>

  <Step title="Kanalbereitschaft validieren">

```bash
openclaw channels status --probe
```

Mit einem erreichbaren Gateway führt dies Live-Kanalprüfungen pro Konto und optionale Audits aus.
Wenn das Gateway nicht erreichbar ist, fällt die CLI stattdessen auf reine Konfigurationszusammenfassungen der Kanäle zurück
anstelle einer Live-Prüfausgabe.

  </Step>
</Steps>

<Note>
Das Neuladen der Gateway-Konfiguration überwacht den aktiven Konfigurationsdateipfad (aufgelöst aus Profil-/Status-Defaults oder `OPENCLAW_CONFIG_PATH`, wenn gesetzt).
Der Standardmodus ist `gateway.reload.mode="hybrid"`.
Nach dem ersten erfolgreichen Laden bedient der laufende Prozess den aktiven In-Memory-Konfigurations-Snapshot; ein erfolgreiches Neuladen tauscht diesen Snapshot atomar aus.
</Note>

## Laufzeitmodell

- Ein ständig laufender Prozess für Routing, Control Plane und Kanalverbindungen.
- Ein einzelner multiplexierter Port für:
  - WebSocket-Control/RPC
  - HTTP-APIs, OpenAI-kompatibel (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI und Hooks
- Standard-Bindungsmodus: `loopback`.
- Auth ist standardmäßig erforderlich. Shared-Secret-Setups verwenden
  `gateway.auth.token` / `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), und Non-loopback-
  Reverse-Proxy-Setups können `gateway.auth.mode: "trusted-proxy"` verwenden.

## OpenAI-kompatible Endpunkte

Die wirkungsvollste Kompatibilitätsoberfläche von OpenClaw ist jetzt:

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
- Verwenden Sie `x-openclaw-model`, wenn Sie ein Backend-Provider-/Modell-Override möchten; andernfalls bleibt die normale Modell- und Embedding-Konfiguration des ausgewählten Agent maßgeblich.

Alle diese Endpunkte laufen auf dem Haupt-Gateway-Port und verwenden dieselbe Auth-Grenze für vertrauenswürdige Operatoren wie der Rest der Gateway-HTTP-API.

### Port- und Bindungspriorität

| Einstellung  | Auflösungsreihenfolge                                        |
| ------------ | ------------------------------------------------------------- |
| Gateway-Port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bindungsmodus | CLI/Override → `gateway.bind` → `loopback`                    |

Installierte Gateway-Dienste speichern das aufgelöste `--port` in Supervisor-Metadaten. Führen Sie nach einer Änderung von `gateway.port` `openclaw doctor --fix` oder `openclaw gateway install --force` aus, damit launchd/systemd/schtasks den Prozess am neuen Port startet.

Der Gateway-Start verwendet denselben effektiven Port und dieselbe Bindung, wenn lokale
Control-UI-Ursprünge für Non-loopback-Bindungen gesetzt werden. Zum Beispiel setzt `--bind lan --port 3000`
`http://localhost:3000` und `http://127.0.0.1:3000`, bevor die Laufzeitvalidierung
ausgeführt wird. Fügen Sie alle Remote-Browser-Ursprünge, etwa HTTPS-Proxy-URLs, explizit zu
`gateway.controlUi.allowedOrigins` hinzu.

### Hot-Reload-Modi

| `gateway.reload.mode` | Verhalten                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Kein Neuladen der Konfiguration            |
| `hot`                 | Nur Hot-safe-Änderungen anwenden           |
| `restart`             | Bei reload-pflichtigen Änderungen neu starten |
| `hybrid` (Standard)   | Hot-apply, wenn sicher, Neustart wenn erforderlich |

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

Sie benötigen nur dann mehrere Gateways, wenn Sie bewusst Isolation oder einen Rettungs-Bot möchten.

Nützliche Prüfungen:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Was Sie erwarten können:

- `gateway status --deep` kann `Other gateway-like services detected (best effort)` melden
  und Bereinigungshinweise ausgeben, wenn veraltete launchd/systemd/schtasks-Installationen noch vorhanden sind.
- `gateway probe` kann vor `multiple reachable gateways` warnen, wenn mehr als ein Ziel
  antwortet.
- Wenn dies beabsichtigt ist, isolieren Sie Ports, Konfiguration/Status und Workspace-Roots pro Gateway.

Checkliste pro Instanz:

- Eindeutiges `gateway.port`
- Eindeutiger `OPENCLAW_CONFIG_PATH`
- Eindeutiges `OPENCLAW_STATE_DIR`
- Eindeutiges `agents.defaults.workspace`

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

Verbinden Sie Clients dann lokal mit `ws://127.0.0.1:18789`.

<Warning>
SSH-Tunnel umgehen Gateway-Auth nicht. Bei Shared-Secret-Auth müssen Clients weiterhin
`token`/`password` senden, auch über den Tunnel. Bei Modi mit Identitätsinformationen
muss die Anfrage weiterhin diesen Auth-Pfad erfüllen.
</Warning>

Siehe: [Remote Gateway](/de/gateway/remote), [Authentifizierung](/de/gateway/authentication), [Tailscale](/de/gateway/tailscale).

## Überwachung und Dienstlebenszyklus

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

LaunchAgent-Labels sind `ai.openclaw.gateway` (Standard) oder `ai.openclaw.<profile>` (benanntes Profil). `openclaw doctor` auditiert und repariert Drift in der Dienstkonfiguration.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aktivieren Sie Lingering für Persistenz nach dem Abmelden:

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
(oder `OpenClaw Gateway (<profile>)` für benannte Profile). Wenn das Erstellen der geplanten Aufgabe
verweigert wird, fällt OpenClaw auf einen benutzerspezifischen Startup-Ordner-Launcher zurück,
der auf `gateway.cmd` im Statusverzeichnis verweist.

  </Tab>

  <Tab title="Linux (Systemdienst)">

Verwenden Sie eine System-Unit für Multi-User-/Always-on-Hosts.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Verwenden Sie denselben Dienstkörper wie bei der User-Unit, installieren Sie ihn jedoch unter
`/etc/systemd/system/openclaw-gateway[-<profile>].service` und passen Sie
`ExecStart=` an, falls Ihre `openclaw`-Binärdatei an anderer Stelle liegt.

Lassen Sie nicht zusätzlich `openclaw doctor --fix` einen Gateway-Dienst auf Benutzerebene für dasselbe Profil/denselben Port installieren. Doctor verweigert diese automatische Installation, wenn ein OpenClaw-Gateway-Dienst auf Systemebene gefunden wird; verwenden Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die System-Unit den Lebenszyklus besitzt.

  </Tab>
</Tabs>

## Schneller Pfad für das Dev-Profil

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Defaults umfassen isolierte Status-/Konfigurationsdaten und den Basis-Gateway-Port `19001`.

## Protokoll-Kurzreferenz (Operator-Sicht)

- Der erste Client-Frame muss `connect` sein.
- Gateway gibt einen `hello-ok`-Snapshot zurück (`presence`, `health`, `stateVersion`, `uptimeMs`, Limits/Policy).
- `hello-ok.features.methods` / `events` sind eine konservative Discovery-Liste, kein
  generierter Dump jeder aufrufbaren Hilfsroute.
- Anfragen: `req(method, params)` → `res(ok/payload|error)`.
- Häufige Ereignisse umfassen `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, Pairing-/Approval-Lebenszyklusereignisse und `shutdown`.

Agent-Läufe sind zweistufig:

1. Sofortige akzeptierte Bestätigung (`status:"accepted"`)
2. Abschließende Abschlussantwort (`status:"ok"|"error"`), mit gestreamten `agent`-Ereignissen dazwischen.

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

### Gap-Recovery

Ereignisse werden nicht erneut abgespielt. Aktualisieren Sie bei Sequenzlücken den Status (`health`, `system-presence`), bevor Sie fortfahren.

## Häufige Fehlersignaturen

| Signatur                                                       | Wahrscheinliches Problem                                                         |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Non-loopback-Bindung ohne gültigen Gateway-Auth-Pfad                             |
| `another gateway instance is already listening` / `EADDRINUSE` | Portkonflikt                                                                     |
| `Gateway start blocked: set gateway.mode=local`                | Konfiguration ist auf Remote-Modus gesetzt, oder der Local-Mode-Stamp fehlt in einer beschädigten Konfiguration |
| `unauthorized` während `connect`                               | Auth-Abweichung zwischen Client und Gateway                                      |

Für vollständige Diagnosefolgen verwenden Sie [Gateway-Fehlerbehebung](/de/gateway/troubleshooting).

## Sicherheitsgarantien

- Gateway-Protokollclients schlagen schnell fehl, wenn Gateway nicht verfügbar ist (kein impliziter Fallback auf direkte Kanäle).
- Ungültige erste Frames oder erste Frames ohne Verbindungsaufbau werden abgelehnt und geschlossen.
- Ein ordnungsgemäßes Herunterfahren gibt das Ereignis `shutdown` aus, bevor der Socket geschlossen wird.

---

Verwandt:

- [Fehlerbehebung](/de/gateway/troubleshooting)
- [Hintergrundprozess](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Status](/de/gateway/health)
- [Doctor](/de/gateway/doctor)
- [Authentifizierung](/de/gateway/authentication)

## Verwandt

- [Konfiguration](/de/gateway/configuration)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Remote-Zugriff](/de/gateway/remote)
- [Secrets-Verwaltung](/de/gateway/secrets)
