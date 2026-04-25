---
read_when:
    - Gateway-Prozess ausführen oder debuggen
summary: Runbook für den Gateway-Service, den Lebenszyklus und den Betrieb
title: Gateway-Runbook
x-i18n:
    generated_at: "2026-04-25T13:47:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

Verwenden Sie diese Seite für den Start am ersten Tag und den Betrieb am zweiten Tag des Gateway-Service.

<CardGroup cols={2}>
  <Card title="Tiefgehende Fehlerbehebung" icon="siren" href="/de/gateway/troubleshooting">
    Symptomorientierte Diagnose mit exakten Befehlsfolgen und Log-Signaturen.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Aufgabenorientierte Einrichtungsanleitung + vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Secrets-Verwaltung" icon="key-round" href="/de/gateway/secrets">
    SecretRef-Vertrag, Verhalten von Laufzeit-Snapshots und Migration-/Reload-Vorgänge.
  </Card>
  <Card title="Secrets-Plan-Vertrag" icon="shield-check" href="/de/gateway/secrets-plan-contract">
    Exakte Ziel-/Pfadregeln für `secrets apply` und Verhalten von Auth-Profilen nur mit Referenzen.
  </Card>
</CardGroup>

## Lokaler Start in 5 Minuten

<Steps>
  <Step title="Gateway starten">

```bash
openclaw gateway --port 18789
# Debug/Trace gespiegelt nach stdio
openclaw gateway --port 18789 --verbose
# Listener auf dem ausgewählten Port zwangsweise beenden, dann starten
openclaw gateway --force
```

  </Step>

  <Step title="Service-Zustand prüfen">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Gesunde Basis: `Runtime: running`, `Connectivity probe: ok` und `Capability: ...`, das Ihren Erwartungen entspricht. Verwenden Sie `openclaw gateway status --require-rpc`, wenn Sie einen Nachweis für RPC mit Leseberechtigung benötigen und nicht nur Erreichbarkeit.

  </Step>

  <Step title="Bereitschaft der Channels validieren">

```bash
openclaw channels status --probe
```

Mit einem erreichbaren Gateway führt dies Live-Prüfungen pro Konto und optionale Audits aus.
Wenn das Gateway nicht erreichbar ist, greift die CLI auf reine konfigurationsbasierte Channel-Zusammenfassungen zurück
anstatt auf Live-Prüfungsausgabe.

  </Step>
</Steps>

<Note>
Das Neuladen der Gateway-Konfiguration überwacht den aktiven Konfigurationsdateipfad (aufgelöst aus Profil-/Status-Standards oder `OPENCLAW_CONFIG_PATH`, wenn gesetzt).
Der Standardmodus ist `gateway.reload.mode="hybrid"`.
Nach dem ersten erfolgreichen Laden liefert der laufende Prozess den aktiven In-Memory-Snapshot der Konfiguration; ein erfolgreiches Neuladen tauscht diesen Snapshot atomar aus.
</Note>

## Laufzeitmodell

- Ein ständig laufender Prozess für Routing, Control Plane und Channel-Verbindungen.
- Ein einzelner multiplexter Port für:
  - WebSocket-Control/RPC
  - HTTP-APIs, OpenAI-kompatibel (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI und Hooks
- Standard-Bind-Modus: `loopback`.
- Authentifizierung ist standardmäßig erforderlich. Setups mit gemeinsamem Secret verwenden
  `gateway.auth.token` / `gateway.auth.password` (oder
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), und nicht-loopback-
  Reverse-Proxy-Setups können `gateway.auth.mode: "trusted-proxy"` verwenden.

## OpenAI-kompatible Endpunkte

Die wichtigste Kompatibilitätsoberfläche von OpenClaw ist jetzt:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Warum diese Auswahl wichtig ist:

- Die meisten Integrationen von Open WebUI, LobeChat und LibreChat prüfen zuerst `/v1/models`.
- Viele RAG- und Memory-Pipelines erwarten `/v1/embeddings`.
- Agent-native Clients bevorzugen zunehmend `/v1/responses`.

Planungshinweis:

- `/v1/models` ist agentenzentriert: Es gibt `openclaw`, `openclaw/default` und `openclaw/<agentId>` zurück.
- `openclaw/default` ist der stabile Alias, der immer auf den konfigurierten Standard-Agenten verweist.
- Verwenden Sie `x-openclaw-model`, wenn Sie eine Überschreibung für Backend-Anbieter/Modell möchten; andernfalls bleibt die normale Modell- und Embedding-Einrichtung des ausgewählten Agenten maßgeblich.

All dies läuft auf dem Hauptport des Gateway und nutzt dieselbe Authentifizierungsgrenze für vertrauenswürdige Operatoren wie der Rest der Gateway-HTTP-API.

### Port- und Bind-Priorität

| Einstellung  | Auflösungsreihenfolge                                         |
| ------------ | ------------------------------------------------------------- |
| Gateway-Port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind-Modus   | CLI/Override → `gateway.bind` → `loopback`                    |

### Hot-Reload-Modi

| `gateway.reload.mode` | Verhalten                                  |
| --------------------- | ------------------------------------------ |
| `off`                 | Kein Neuladen der Konfiguration            |
| `hot`                 | Nur hot-sichere Änderungen anwenden        |
| `restart`             | Bei reload-pflichtigen Änderungen neu starten |
| `hybrid` (Standard)   | Hot anwenden, wenn sicher, sonst neu starten |

## Befehlssatz für Operatoren

```bash
openclaw gateway status
openclaw gateway status --deep   # fügt einen Scan auf Systemebene für Services hinzu
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` dient der zusätzlichen Service-Erkennung (LaunchDaemons/systemd-System-
Units/schtasks), nicht einer tieferen RPC-Integritätsprüfung.

## Mehrere Gateways (gleicher Host)

Die meisten Installationen sollten ein Gateway pro Maschine ausführen. Ein einzelnes Gateway kann mehrere
Agenten und Channels hosten.

Mehrere Gateways benötigen Sie nur, wenn Sie absichtlich Isolation oder einen Rettungs-Bot möchten.

Nützliche Prüfungen:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Was zu erwarten ist:

- `gateway status --deep` kann `Other gateway-like services detected (best effort)` melden
  und Hinweise zur Bereinigung ausgeben, wenn noch veraltete launchd-/systemd-/schtasks-Installationen vorhanden sind.
- `gateway probe` kann vor `multiple reachable gateways` warnen, wenn mehr als ein Ziel
  antwortet.
- Wenn das beabsichtigt ist, isolieren Sie Ports, Konfiguration/Status und Workspace-Wurzeln pro Gateway.

Checkliste pro Instanz:

- Eindeutiger `gateway.port`
- Eindeutiger `OPENCLAW_CONFIG_PATH`
- Eindeutiges `OPENCLAW_STATE_DIR`
- Eindeutiger `agents.defaults.workspace`

Beispiel:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Detailliertes Setup: [/gateway/multiple-gateways](/de/gateway/multiple-gateways).

## Echtzeit-Gehirn-Endpunkt für VoiceClaw

OpenClaw stellt unter
`/voiceclaw/realtime` einen mit VoiceClaw kompatiblen Echtzeit-WebSocket-Endpunkt bereit. Verwenden Sie ihn, wenn ein VoiceClaw-Desktop-Client
direkt mit einem Echtzeit-OpenClaw-Gehirn sprechen soll, statt über einen separaten Relay-
Prozess zu gehen.

Der Endpunkt verwendet Gemini Live für Audio in Echtzeit und ruft OpenClaw als
Gehirn auf, indem OpenClaw-Tools direkt an Gemini Live bereitgestellt werden. Tool-Aufrufe geben ein
sofortiges `working`-Ergebnis zurück, damit der Sprach-Turn responsiv bleibt; anschließend
führt OpenClaw das tatsächliche Tool asynchron aus und injiziert das Ergebnis zurück in die
Live-Session. Setzen Sie `GEMINI_API_KEY` in der Prozessumgebung des Gateway. Wenn
Gateway-Auth aktiviert ist, sendet der Desktop-Client das Gateway-Token oder Passwort
in seiner ersten Nachricht `session.config`.

Der Echtzeit-Zugriff auf das Gehirn führt von Eigentümern autorisierte OpenClaw-Agent-Befehle aus. Beschränken Sie
`gateway.auth.mode: "none"` auf Testinstanzen nur mit loopback. Nicht-lokale
Echtzeit-Verbindungen zum Gehirn erfordern Gateway-Auth.

Für ein isoliertes Test-Gateway führen Sie eine separate Instanz mit eigenem Port, eigener Konfiguration
und eigenem Status aus:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Konfigurieren Sie VoiceClaw dann so:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Remote-Zugriff

Bevorzugt: Tailscale/VPN.
Fallback: SSH-Tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Verbinden Sie Clients dann lokal mit `ws://127.0.0.1:18789`.

<Warning>
SSH-Tunnel umgehen die Gateway-Authentifizierung nicht. Bei Authentifizierung mit gemeinsamem Secret müssen Clients auch über den Tunnel weiterhin `token`/`password` senden. Bei Modi mit Identitätsbezug muss die Anfrage weiterhin diesen Auth-Pfad erfüllen.
</Warning>

Siehe: [Remote Gateway](/de/gateway/remote), [Authentication](/de/gateway/authentication), [Tailscale](/de/gateway/tailscale).

## Überwachung und Service-Lebenszyklus

Verwenden Sie überwachte Ausführungen für produktionsähnliche Zuverlässigkeit.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent-Labels sind `ai.openclaw.gateway` (Standard) oder `ai.openclaw.<profile>` (benanntes Profil). `openclaw doctor` prüft und repariert Abweichungen in der Service-Konfiguration.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Um Persistenz nach dem Logout zu erhalten, aktivieren Sie Linger:

```bash
sudo loginctl enable-linger <user>
```

Manuelles Beispiel für eine User-Unit, wenn Sie einen benutzerdefinierten Installationspfad benötigen:

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

Der verwaltete native Windows-Start verwendet eine Scheduled Task namens `OpenClaw Gateway`
(oder `OpenClaw Gateway (<profile>)` für benannte Profile). Wenn das Erstellen der Scheduled Task
verweigert wird, greift OpenClaw auf einen Starter im benutzerspezifischen Startup-Ordner zurück,
der auf `gateway.cmd` im Statusverzeichnis verweist.

  </Tab>

  <Tab title="Linux (Systemdienst)">

Verwenden Sie für Hosts mit mehreren Benutzern / ständig laufende Hosts eine System-Unit.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Verwenden Sie denselben Service-Body wie bei der User-Unit, installieren Sie ihn aber unter
`/etc/systemd/system/openclaw-gateway[-<profile>].service` und passen Sie
`ExecStart=` an, wenn sich Ihre `openclaw`-Binärdatei anderswo befindet.

  </Tab>
</Tabs>

## Schnellpfad für Dev-Profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Die Standardwerte umfassen isolierten Status/Konfiguration und den Basis-Gateway-Port `19001`.

## Kurzübersicht zum Protokoll (Operator-Sicht)

- Der erste Client-Frame muss `connect` sein.
- Das Gateway gibt einen Snapshot `hello-ok` zurück (`presence`, `health`, `stateVersion`, `uptimeMs`, Limits/Richtlinie).
- `hello-ok.features.methods` / `events` sind eine konservative Discovery-Liste, kein automatisch generierter Dump jeder aufrufbaren Helper-Route.
- Anfragen: `req(method, params)` → `res(ok/payload|error)`.
- Häufige Ereignisse sind `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, Lifecycle-Ereignisse zu Pairing/Genehmigung und `shutdown`.

Agent-Läufe sind zweistufig:

1. Sofortige Bestätigungs-Ack (`status:"accepted"`)
2. Abschließende Antwort nach Abschluss (`status:"ok"|"error"`), mit gestreamten `agent`-Ereignissen dazwischen.

Siehe vollständige Protokolldokumentation: [Gateway Protocol](/de/gateway/protocol).

## Betriebsprüfungen

### Liveness

- WS öffnen und `connect` senden.
- Als Antwort `hello-ok` mit Snapshot erwarten.

### Bereitschaft

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap-Recovery

Ereignisse werden nicht erneut abgespielt. Bei Sequenzlücken aktualisieren Sie den Status (`health`, `system-presence`), bevor Sie fortfahren.

## Häufige Fehlersignaturen

| Signatur                                                     | Wahrscheinliches Problem                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                  | Nicht-Loopback-Bindung ohne gültigen Gateway-Auth-Pfad                          |
| `another gateway instance is already listening` / `EADDRINUSE` | Portkonflikt                                                                   |
| `Gateway start blocked: set gateway.mode=local`              | Konfiguration auf Remote-Modus gesetzt oder der Local-Mode-Stempel fehlt in einer beschädigten Konfiguration |
| `unauthorized` during connect                                | Auth-Mismatch zwischen Client und Gateway                                       |

Für vollständige Diagnosepfade verwenden Sie [Gateway Troubleshooting](/de/gateway/troubleshooting).

## Sicherheitsgarantien

- Gateway-Protokoll-Clients schlagen schnell fehl, wenn das Gateway nicht verfügbar ist (kein impliziter direkter Channel-Fallback).
- Ungültige erste Frames oder erste Frames, die nicht `connect` sind, werden abgelehnt und geschlossen.
- Ein geordnetes Herunterfahren sendet vor dem Schließen des Sockets ein `shutdown`-Ereignis.

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
