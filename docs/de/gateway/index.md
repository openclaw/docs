---
read_when:
    - Ausführen oder Debuggen des Gateway-Prozesses
summary: Betriebshandbuch für den Gateway-Dienst, den Lebenszyklus und den Betrieb
title: Gateway-Runbook
x-i18n:
    generated_at: "2026-04-30T06:54:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

Verwenden Sie diese Seite für den Start am Tag 1 und den Betrieb des Gateway-Dienstes ab Tag 2.

<CardGroup cols={2}>
  <Card title="Tiefgehende Fehlerbehebung" icon="siren" href="/de/gateway/troubleshooting">
    Symptomorientierte Diagnose mit exakten Befehlsabfolgen und Log-Signaturen.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Aufgabenorientierte Einrichtungsanleitung + vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Geheimnisverwaltung" icon="key-round" href="/de/gateway/secrets">
    SecretRef-Vertrag, Verhalten von Laufzeit-Snapshots und Migrations-/Reload-Vorgänge.
  </Card>
  <Card title="Vertrag für Geheimnispläne" icon="shield-check" href="/de/gateway/secrets-plan-contract">
    Exakte Ziel-/Pfadregeln für `secrets apply` und ref-only-Verhalten für Authentifizierungsprofile.
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

Gesunde Ausgangsbasis: `Runtime: running`, `Connectivity probe: ok` und `Capability: ...`, passend zu dem, was Sie erwarten. Verwenden Sie `openclaw gateway status --require-rpc`, wenn Sie einen RPC-Nachweis mit Lesebereich benötigen, nicht nur Erreichbarkeit.

  </Step>

  <Step title="Kanalbereitschaft validieren">

```bash
openclaw channels status --probe
```

Bei erreichbarem Gateway führt dies Live-Kanalprüfungen pro Konto und optionale Audits aus.
Wenn der Gateway nicht erreichbar ist, fällt die CLI stattdessen auf rein konfigurationsbasierte Kanalzusammenfassungen zurück,
anstatt Live-Prüfausgabe zu liefern.

  </Step>
</Steps>

<Note>
Das Neuladen der Gateway-Konfiguration überwacht den aktiven Konfigurationsdateipfad (aufgelöst aus Profil-/State-Standardwerten oder aus `OPENCLAW_CONFIG_PATH`, wenn gesetzt).
Der Standardmodus ist `gateway.reload.mode="hybrid"`.
Nach dem ersten erfolgreichen Laden bedient der laufende Prozess den aktiven In-Memory-Konfigurations-Snapshot; ein erfolgreiches Neuladen tauscht diesen Snapshot atomar aus.
</Note>

## Laufzeitmodell

- Ein dauerhaft laufender Prozess für Routing, Control Plane und Kanalverbindungen.
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

OpenClaws wichtigste Kompatibilitätsoberfläche ist jetzt:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Warum diese Auswahl wichtig ist:

- Die meisten Integrationen mit Open WebUI, LobeChat und LibreChat prüfen zuerst `/v1/models`.
- Viele RAG- und Speicher-Pipelines erwarten `/v1/embeddings`.
- Agent-native Clients bevorzugen zunehmend `/v1/responses`.

Planungshinweis:

- `/v1/models` ist agent-first: Es gibt `openclaw`, `openclaw/default` und `openclaw/<agentId>` zurück.
- `openclaw/default` ist der stabile Alias, der immer dem konfigurierten Standard-Agent zugeordnet ist.
- Verwenden Sie `x-openclaw-model`, wenn Sie ein Override für Backend-Provider/-Modell wünschen; andernfalls bleibt die normale Modell- und Embedding-Konfiguration des ausgewählten Agent maßgeblich.

Alle diese Endpunkte laufen auf dem Hauptport des Gateway und verwenden dieselbe vertrauenswürdige Operator-Authentifizierungsgrenze wie der Rest der Gateway-HTTP-API.

### Port- und Bind-Priorität

| Einstellung  | Auflösungsreihenfolge                                        |
| ------------ | ------------------------------------------------------------- |
| Gateway-Port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind-Modus   | CLI/Override → `gateway.bind` → `loopback`                    |

Installierte Gateway-Dienste speichern das aufgelöste `--port` in Supervisor-Metadaten. Nachdem Sie `gateway.port` geändert haben, führen Sie `openclaw doctor --fix` oder `openclaw gateway install --force` aus, damit launchd/systemd/schtasks den Prozess auf dem neuen Port startet.

Der Gateway-Start verwendet denselben effektiven Port und Bind, wenn lokale
Control-UI-Ursprünge für Nicht-Loopback-Binds gesetzt werden. Zum Beispiel setzt
`--bind lan --port 3000` `http://localhost:3000` und `http://127.0.0.1:3000`,
bevor die Laufzeitvalidierung ausgeführt wird. Fügen Sie alle Remote-Browser-Ursprünge,
etwa HTTPS-Proxy-URLs, explizit zu `gateway.controlUi.allowedOrigins` hinzu.

### Hot-Reload-Modi

| `gateway.reload.mode` | Verhalten                                             |
| --------------------- | ----------------------------------------------------- |
| `off`                 | Kein Neuladen der Konfiguration                       |
| `hot`                 | Nur hot-sichere Änderungen anwenden                   |
| `restart`             | Bei Änderungen mit Neustartpflicht neu starten        |
| `hybrid` (Standard)   | Wenn sicher hot anwenden, andernfalls neu starten     |

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

`gateway status --deep` dient der zusätzlichen Dienstsuche (LaunchDaemons/systemd-System-
Units/schtasks), nicht einer tieferen RPC-Zustandsprüfung.

## Mehrere Gateways (derselbe Host)

Die meisten Installationen sollten einen Gateway pro Maschine ausführen. Ein einzelner Gateway kann mehrere
Agenten und Kanäle hosten.

Sie benötigen mehrere Gateways nur, wenn Sie bewusst Isolation oder einen Rettungs-Bot wünschen.

Nützliche Prüfungen:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Was Sie erwarten können:

- `gateway status --deep` kann `Other gateway-like services detected (best effort)`
  melden und Bereinigungshinweise ausgeben, wenn veraltete launchd/systemd/schtasks-Installationen noch vorhanden sind.
- `gateway probe` kann vor `multiple reachable gateways` warnen, wenn mehr als ein Ziel
  antwortet.
- Wenn dies beabsichtigt ist, isolieren Sie Ports, Konfiguration/State und Workspace-Wurzeln pro Gateway.

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

## VoiceClaw-Echtzeit-Brain-Endpunkt

OpenClaw stellt unter `/voiceclaw/realtime` einen VoiceClaw-kompatiblen Echtzeit-WebSocket-Endpunkt bereit.
Verwenden Sie ihn, wenn ein VoiceClaw-Desktop-Client direkt mit einem Echtzeit-OpenClaw-Brain sprechen soll,
anstatt über einen separaten Relay-Prozess zu gehen.

Der Endpunkt verwendet Gemini Live für Echtzeit-Audio und ruft OpenClaw als
Brain auf, indem OpenClaw-Tools direkt für Gemini Live bereitgestellt werden. Tool-Aufrufe geben ein
sofortiges `working`-Ergebnis zurück, damit der Sprachturn reaktionsfähig bleibt; anschließend führt OpenClaw
das eigentliche Tool asynchron aus und injiziert das Ergebnis zurück in die
Live-Sitzung. Setzen Sie `GEMINI_API_KEY` in der Prozessumgebung des Gateway. Wenn
Gateway-Authentifizierung aktiviert ist, sendet der Desktop-Client das Gateway-Token oder Passwort
in seiner ersten `session.config`-Nachricht.

Echtzeit-Brain-Zugriff führt owner-autorisierte OpenClaw-Agent-Befehle aus. Beschränken Sie
`gateway.auth.mode: "none"` auf reine Loopback-Testinstanzen. Nicht-lokale
Echtzeit-Brain-Verbindungen erfordern Gateway-Authentifizierung.

Führen Sie für einen isolierten Test-Gateway eine separate Instanz mit eigenem Port, eigener Konfiguration
und eigenem State aus:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Konfigurieren Sie VoiceClaw dann zur Verwendung von:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Remote-Zugriff

Bevorzugt: Tailscale/VPN.
Fallback: SSH-Tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Verbinden Sie Clients anschließend lokal mit `ws://127.0.0.1:18789`.

<Warning>
SSH-Tunnel umgehen die Gateway-Authentifizierung nicht. Bei Authentifizierung mit gemeinsamem Geheimnis müssen Clients weiterhin
`token`/`password` senden, auch über den Tunnel. Bei identitätstragenden Modi
muss die Anfrage weiterhin diesen Authentifizierungspfad erfüllen.
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

Verwenden Sie `openclaw gateway restart` für Neustarts. Verketten Sie nicht `openclaw gateway stop` und `openclaw gateway start`; unter macOS deaktiviert `gateway stop` den LaunchAgent absichtlich, bevor er gestoppt wird.

LaunchAgent-Labels sind `ai.openclaw.gateway` (Standard) oder `ai.openclaw.<profile>` (benanntes Profil). `openclaw doctor` auditiert und repariert Abweichungen in der Dienstkonfiguration.

  </Tab>

  <Tab title="Linux (systemd-Benutzer)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Aktivieren Sie für Persistenz nach dem Abmelden Lingering:

```bash
sudo loginctl enable-linger <user>
```

Beispiel für eine manuelle Benutzer-Unit, wenn Sie einen benutzerdefinierten Installationspfad benötigen:

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

Der verwaltete Start unter nativem Windows verwendet eine geplante Aufgabe namens `OpenClaw Gateway`
(oder `OpenClaw Gateway (<profile>)` für benannte Profile). Wenn das Erstellen der geplanten Aufgabe
verweigert wird, fällt OpenClaw auf einen Launcher im Startup-Ordner pro Benutzer zurück,
der auf `gateway.cmd` im State-Verzeichnis verweist.

  </Tab>

  <Tab title="Linux (Systemdienst)">

Verwenden Sie eine System-Unit für Mehrbenutzer-/Always-on-Hosts.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Verwenden Sie denselben Dienstkörper wie bei der Benutzer-Unit, installieren Sie ihn aber unter
`/etc/systemd/system/openclaw-gateway[-<profile>].service` und passen Sie
`ExecStart=` an, falls Ihr `openclaw`-Binary an anderer Stelle liegt.

Lassen Sie nicht zusätzlich `openclaw doctor --fix` einen Gateway-Dienst auf Benutzerebene für dasselbe Profil/denselben Port installieren. Doctor verweigert diese automatische Installation, wenn ein OpenClaw-Gateway-Dienst auf Systemebene gefunden wird; verwenden Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die System-Unit den Lebenszyklus besitzt.

  </Tab>
</Tabs>

## Schneller Pfad für das Dev-Profil

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Die Standardwerte umfassen isolierte State-/Konfigurationsdaten und den Basis-Gateway-Port `19001`.

## Kurzübersicht zum Protokoll (Operator-Sicht)

- Der erste Client-Frame muss `connect` sein.
- Gateway gibt einen `hello-ok`-Snapshot zurück (`presence`, `health`, `stateVersion`, `uptimeMs`, Limits/Policy).
- `hello-ok.features.methods` / `events` sind eine konservative Discovery-Liste, kein
  generierter Dump aller aufrufbaren Helper-Routen.
- Anfragen: `req(method, params)` → `res(ok/payload|error)`.
- Häufige Events umfassen `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, Pairing-/Genehmigungs-Lebenszyklus-Events und `shutdown`.

Agent-Ausführungen erfolgen in zwei Phasen:

1. Sofortige Annahmebestätigung (`status:"accepted"`)
2. Abschließende Abschlussantwort (`status:"ok"|"error"`) mit gestreamten `agent`-Events dazwischen.

Vollständige Protokolldokumentation: [Gateway-Protokoll](/de/gateway/protocol).

## Betriebliche Prüfungen

### Liveness

- WS öffnen und `connect` senden.
- `hello-ok`-Antwort mit Snapshot erwarten.

### Bereitschaft

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Wiederherstellung bei Lücken

Ereignisse werden nicht erneut wiedergegeben. Aktualisieren Sie bei Sequenzlücken den Status (`health`, `system-presence`), bevor Sie fortfahren.

## Häufige Fehlersignaturen

| Signatur                                                       | Wahrscheinliches Problem                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bindung an Nicht-Loopback-Adresse ohne gültigen Gateway-Authentifizierungspfad  |
| `another gateway instance is already listening` / `EADDRINUSE` | Portkonflikt                                                                    |
| `Gateway start blocked: set gateway.mode=local`                | Konfiguration ist auf Remote-Modus gesetzt, oder der Local-Mode-Marker fehlt in einer beschädigten Konfiguration |
| `unauthorized` during connect                                  | Authentifizierungsabweichung zwischen Client und Gateway                        |

Für vollständige Diagnoseleitern verwenden Sie [Gateway-Fehlerbehebung](/de/gateway/troubleshooting).

## Sicherheitsgarantien

- Gateway-Protokollclients schlagen schnell fehl, wenn der Gateway nicht verfügbar ist (kein impliziter Fallback auf direkte Kanäle).
- Ungültige erste Frames bzw. erste Frames ohne `connect` werden abgelehnt und geschlossen.
- Ein ordnungsgemäßes Herunterfahren gibt vor dem Schließen des Sockets ein `shutdown`-Ereignis aus.

---

Verwandt:

- [Fehlerbehebung](/de/gateway/troubleshooting)
- [Hintergrundprozess](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Zustand](/de/gateway/health)
- [Doctor](/de/gateway/doctor)
- [Authentifizierung](/de/gateway/authentication)

## Verwandt

- [Konfiguration](/de/gateway/configuration)
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting)
- [Remote-Zugriff](/de/gateway/remote)
- [Secrets-Verwaltung](/de/gateway/secrets)
