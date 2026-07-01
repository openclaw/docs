---
read_when:
    - Sie möchten ein containerisiertes Gateway statt lokaler Installationen
    - Sie validieren den Docker-Ablauf
summary: Optionale Docker-basierte Einrichtung und Onboarding für OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-01T12:53:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker ist **optional**. Verwenden Sie es nur, wenn Sie einen containerisierten Gateway wünschen oder den Docker-Ablauf validieren möchten.

## Ist Docker das Richtige für mich?

- **Ja**: Sie möchten eine isolierte, temporäre Gateway-Umgebung oder OpenClaw auf einem Host ohne lokale Installationen ausführen.
- **Nein**: Sie führen OpenClaw auf Ihrem eigenen Rechner aus und möchten nur die schnellste Entwicklungsschleife. Verwenden Sie stattdessen den normalen Installationsablauf.
- **Sandboxing-Hinweis**: Das Standard-Sandbox-Backend verwendet Docker, wenn Sandboxing aktiviert ist. Sandboxing ist jedoch standardmäßig deaktiviert und erfordert **nicht**, dass der gesamte Gateway in Docker ausgeführt wird. SSH- und OpenShell-Sandbox-Backends sind ebenfalls verfügbar. Siehe [Sandboxing](/de/gateway/sandboxing).

## Voraussetzungen

- Docker Desktop (oder Docker Engine) + Docker Compose v2
- Mindestens 2 GB RAM für den Image-Build (`pnpm install` kann auf Hosts mit 1 GB wegen Speichermangels mit Exit 137 beendet werden)
- Ausreichend Speicherplatz für Images und Logs
- Wenn Sie OpenClaw auf einem VPS/öffentlichen Host ausführen, prüfen Sie
  [Sicherheitshärtung für Netzwerkexposition](/de/gateway/security),
  insbesondere die Docker-`DOCKER-USER`-Firewallrichtlinie.

## Containerisierter Gateway

<Steps>
  <Step title="Image bauen">
    Führen Sie im Repo-Root das Setup-Skript aus:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Dadurch wird das Gateway-Image lokal gebaut. Um stattdessen ein vorab gebautes Image zu verwenden:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Vorab gebaute Images werden zuerst in der
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    veröffentlicht. GHCR ist die primäre Registry für Release-Automatisierung,
    gepinnte Deployments und Provenance-Prüfungen. Derselbe Release-Workflow
    veröffentlicht außerdem einen offiziellen Docker-Hub-Mirror unter
    `openclaw/openclaw` für Hosts, die Docker Hub bevorzugen:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Verwenden Sie `ghcr.io/openclaw/openclaw` oder `openclaw/openclaw`. Vermeiden Sie Community-
    Docker-Hub-Mirrors, da OpenClaw deren Release-Zeitpunkt,
    Rebuilds oder Aufbewahrungsrichtlinie nicht kontrolliert. Häufige offizielle Tags: `main`, `latest`,
    `<version>` (z. B. `2026.2.26`) und Beta-Versionen wie
    `2026.2.26-beta.1`. Beta-Tags verschieben `latest` oder `main` nicht.

  </Step>

  <Step title="Airgapped erneut ausführen">
    Übertragen und laden Sie auf Offline-Hosts zuerst das Image:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` prüft, dass `OPENCLAW_IMAGE` bereits lokal vorhanden ist, deaktiviert
    implizite Compose-Pulls und Builds und führt dann den normalen Setup-Ablauf aus, zum Beispiel
    `.env`-Synchronisierung, Berechtigungskorrekturen, Onboarding, Gateway-Konfigurationssynchronisierung
    und Compose-Start.

    Wenn `OPENCLAW_SANDBOX=1` gesetzt ist, prüft das Offline-Setup außerdem die konfigurierten Standard-
    und aktiven Sandbox-Images pro Agent auf dem Daemon hinter
    `OPENCLAW_DOCKER_SOCKET`. Docker-gestützte Browser-Images müssen außerdem das
    aktuelle OpenClaw-Browser-Contract-Label tragen. Wenn ein erforderliches Image fehlt oder
    inkompatibel ist, beendet sich das Setup ohne Änderung der Sandbox-Konfiguration, statt
    Erfolg mit einer unbrauchbaren Sandbox zu melden.

  </Step>

  <Step title="Onboarding abschließen">
    Das Setup-Skript führt das Onboarding automatisch aus. Es wird:

    - nach Provider-API-Schlüsseln fragen
    - ein Gateway-Token generieren und in `.env` schreiben
    - das Verzeichnis für den geheimen Auth-Profile-Schlüssel erstellen
    - den Gateway über Docker Compose starten

    Während des Setups laufen Pre-Start-Onboarding und Konfigurationsschreibvorgänge direkt über
    `openclaw-gateway`. `openclaw-cli` ist für Befehle gedacht, die Sie ausführen, nachdem
    der Gateway-Container bereits existiert.

  </Step>

  <Step title="Control UI öffnen">
    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser und fügen Sie das konfigurierte
    gemeinsame Secret in den Einstellungen ein. Das Setup-Skript schreibt standardmäßig ein Token in `.env`;
    wenn Sie die Container-Konfiguration auf Passwortauthentifizierung umstellen, verwenden Sie stattdessen dieses
    Passwort.

    Benötigen Sie die URL erneut?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanäle konfigurieren (optional)">
    Verwenden Sie den CLI-Container, um Messaging-Kanäle hinzuzufügen:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Docs: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord)

  </Step>
</Steps>

### Manueller Ablauf

Wenn Sie jeden Schritt lieber selbst ausführen möchten, statt das Setup-Skript zu verwenden:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Führen Sie `docker compose` im Repo-Root aus. Wenn Sie `OPENCLAW_EXTRA_MOUNTS`
oder `OPENCLAW_HOME_VOLUME` aktiviert haben, schreibt das Setup-Skript `docker-compose.extra.yml`;
binden Sie sie nach jeder Standard-Override-Datei ein, zum Beispiel
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`,
wenn beide Override-Dateien existieren.
</Note>

<Note>
Da `openclaw-cli` den Netzwerk-Namespace von `openclaw-gateway` teilt, ist es ein
Post-Start-Tool. Führen Sie vor `docker compose up -d openclaw-gateway` Onboarding
und Setup-Konfigurationsschreibvorgänge über `openclaw-gateway` mit
`--no-deps --entrypoint node` aus.
</Note>

### Umgebungsvariablen

Das Setup-Skript akzeptiert diese optionalen Umgebungsvariablen:

| Variable                                        | Zweck                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Remote-Image statt lokalem Build verwenden                           |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Zusätzliche apt-Pakete während des Builds installieren (leerzeichengetrennt) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Zusätzliche Python-Pakete während des Builds installieren (leerzeichengetrennt) |
| `OPENCLAW_EXTENSIONS`                           | Plugin-Abhängigkeiten zur Build-Zeit vorinstallieren (leerzeichengetrennte Namen) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Node-Optionen für den lokalen Source-Build überschreiben              |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | tsdown-Heap für den lokalen Source-Build in MB überschreiben          |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Deklarationsausgabe bei rein laufzeitbezogenen lokalen Image-Builds überspringen |
| `OPENCLAW_EXTRA_MOUNTS`                         | Zusätzliche Host-Bind-Mounts (kommagetrennt `source:target[:opts]`)   |
| `OPENCLAW_HOME_VOLUME`                          | `/home/node` in einem benannten Docker-Volume persistent speichern    |
| `OPENCLAW_SANDBOX`                              | Sandbox-Bootstrap aktivieren (`1`, `true`, `yes`, `on`)               |
| `OPENCLAW_SKIP_ONBOARDING`                      | Interaktiven Onboarding-Schritt überspringen (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                        | Docker-Socket-Pfad überschreiben                                      |
| `OPENCLAW_DISABLE_BONJOUR`                      | Bonjour-/mDNS-Ankündigung deaktivieren (Standard ist `1` für Docker)  |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Source-Bind-Mount-Overlays gebündelter Plugins deaktivieren           |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Gemeinsamer OTLP/HTTP-Collector-Endpunkt für OpenTelemetry-Export     |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Signalspezifische OTLP-Endpunkte für Traces, Metriken oder Logs       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLP-Protokoll überschreiben. Derzeit wird nur `http/protobuf` unterstützt |
| `OTEL_SERVICE_NAME`                             | Für OpenTelemetry-Ressourcen verwendeter Dienstname                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Neueste experimentelle semantische GenAI-Attribute aktivieren         |
| `OPENCLAW_OTEL_PRELOADED`                       | Start eines zweiten OpenTelemetry-SDK überspringen, wenn bereits eines vorgeladen ist |

Das offizielle Docker-Image enthält kein Homebrew. Während des Onboardings blendet OpenClaw
Installationsprogramme für brew-only-Skill-Abhängigkeiten aus, wenn es in einem Linux-
Container ohne `brew` läuft; diese Abhängigkeiten müssen durch ein benutzerdefiniertes Image
bereitgestellt oder manuell installiert werden. Für Abhängigkeiten, die als Debian-Pakete verfügbar sind, verwenden Sie
`OPENCLAW_IMAGE_APT_PACKAGES` während des Image-Builds. Der alte Name
`OPENCLAW_DOCKER_APT_PACKAGES` wird weiterhin akzeptiert.
Für Python-Abhängigkeiten verwenden Sie `OPENCLAW_IMAGE_PIP_PACKAGES`. Dies führt
`python3 -m pip install --break-system-packages` während des Image-Builds aus; pinnen Sie daher
Paketversionen und verwenden Sie nur Paketindizes, denen Sie vertrauen.
Source-Builds setzen `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` standardmäßig auf
`--max-old-space-size=8192` und lassen
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` ungesetzt, damit der tsdown-Wrapper
Container-Speicherlimits berücksichtigen kann. Außerdem setzen sie standardmäßig
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1`, da Runtime-Images Deklarationsdateien
nach dem Build entfernen. Wenn Docker `ResourceExhausted`, `cannot allocate
memory` meldet oder während `tsdown` abbricht, erhöhen Sie das Speicherlimit des Docker-Builders oder
versuchen Sie es erneut mit kleineren expliziten Heaps, zum Beispiel
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

Maintainer können gebündelte Plugin-Quellen gegen ein paketiertes Image testen, indem sie
ein Plugin-Source-Verzeichnis über dessen paketierten Source-Pfad mounten, zum Beispiel
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Dieses gemountete Source-Verzeichnis überschreibt das passende kompilierte
`/app/dist/extensions/synology-chat`-Bundle für dieselbe Plugin-ID.

### Observability

OpenTelemetry-Export erfolgt ausgehend vom Gateway-Container zu Ihrem OTLP-
Collector. Dafür ist kein veröffentlichter Docker-Port erforderlich. Wenn Sie das Image
lokal bauen und möchten, dass der gebündelte OpenTelemetry-Exporter im Image verfügbar ist,
schließen Sie seine Runtime-Abhängigkeiten ein:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Installieren Sie das offizielle `@openclaw/diagnostics-otel`-Plugin aus ClawHub in
paketierten Docker-Installationen, bevor Sie den Export aktivieren. Benutzerdefinierte source-gebaute Images können
die lokale Plugin-Quelle weiterhin mit
`OPENCLAW_EXTENSIONS=diagnostics-otel` einbinden. Um den Export zu aktivieren, erlauben und aktivieren Sie das
`diagnostics-otel`-Plugin in der Konfiguration und setzen Sie dann
`diagnostics.otel.enabled=true` oder verwenden Sie das Konfigurationsbeispiel unter [OpenTelemetry-
Export](/de/gateway/opentelemetry). Collector-Auth-Header werden über
`diagnostics.otel.headers` konfiguriert, nicht über Docker-Umgebungsvariablen.

Prometheus-Metriken verwenden den bereits veröffentlichten Gateway-Port. Installieren Sie
`clawhub:@openclaw/diagnostics-prometheus`, aktivieren Sie das
`diagnostics-prometheus`-Plugin und scrapen Sie dann:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Die Route ist durch Gateway-Authentifizierung geschützt. Legen Sie keinen separaten
öffentlichen `/metrics`-Port und keinen nicht authentifizierten Reverse-Proxy-Pfad offen. Siehe
[Prometheus-Metriken](/de/gateway/prometheus).

### Health Checks

Container-Probe-Endpunkte (keine Authentifizierung erforderlich):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Das Docker-Image enthält einen integrierten `HEALTHCHECK`, der `/healthz` anpingt.
Wenn Prüfungen weiter fehlschlagen, markiert Docker den Container als `unhealthy` und
Orchestrierungssysteme können ihn neu starten oder ersetzen.

Authentifizierter tiefer Health-Snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` setzt standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, damit Host-Zugriff auf
`http://127.0.0.1:18789` mit Docker-Port-Publishing funktioniert.

- `lan` (Standard): Host-Browser und Host-CLI können den veröffentlichten Gateway-Port erreichen.
- `loopback`: Nur Prozesse innerhalb des Container-Network-Namespace können
  den Gateway direkt erreichen.

<Note>
Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), keine Host-Aliasse wie `0.0.0.0` oder `127.0.0.1`.
</Note>

### Lokale Host-Provider

Wenn OpenClaw in Docker läuft, ist `127.0.0.1` innerhalb des Containers der Container
selbst, nicht Ihr Host-Rechner. Verwenden Sie `host.docker.internal` für KI-Provider, die
auf dem Host laufen:

| Provider  | Standard-Host-URL        | Docker-Setup-URL                  |
| --------- | ------------------------ | --------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Das mitgelieferte Docker-Setup verwendet diese Host-URLs als Onboarding-Standardwerte für LM Studio und Ollama,
und `docker-compose.yml` ordnet `host.docker.internal` dem Host-Gateway von Docker für Linux Docker Engine zu. Docker Desktop stellt
denselben Hostnamen auf macOS und Windows bereits bereit.

Host-Dienste müssen außerdem an einer Adresse lauschen, die von Docker aus erreichbar ist:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Wenn Sie Ihre eigene Compose-Datei oder einen `docker run`-Befehl verwenden, fügen Sie
dieselbe Host-Zuordnung selbst hinzu, zum Beispiel
`--add-host=host.docker.internal:host-gateway`.

### Claude-CLI-Backend in Docker

Das offizielle OpenClaw-Docker-Image installiert Claude Code nicht vor. Installieren Sie
Claude Code im Container-Benutzer, der OpenClaw ausführt, melden Sie sich dort an und persistieren Sie anschließend
dieses Container-Home, damit Image-Upgrades die Binärdatei oder den Claude-Auth-
Status nicht löschen.

Aktivieren Sie bei neuen Docker-Installationen ein persistentes `/home/node`-Volume, bevor Sie
das Setup ausführen:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Stoppen Sie bei einer bestehenden Docker-Installation zuerst den Stack und laden Sie die aktuellen
Docker-`.env`-Werte neu, bevor Sie das Setup erneut ausführen. Das Setup-Skript liest
`.env` nicht selbst; es schreibt `.env` aus der aktuellen Shell und den Standardwerten neu. Führen Sie für
die generierte `.env` Folgendes aus:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Wenn Ihre `.env` Werte enthält, die Ihre Shell nicht sourcen kann, exportieren Sie die
bestehenden Werte, auf die Sie angewiesen sind, zuerst manuell neu, zum Beispiel `OPENCLAW_IMAGE`, Ports, Bind-Modus,
benutzerdefinierte Pfade, `OPENCLAW_EXTRA_MOUNTS`, Sandbox- und Skip-Onboarding-Einstellungen.
Das generierte Overlay mountet das Home-Volume sowohl für `openclaw-gateway` als auch für
`openclaw-cli`.

Führen Sie die übrigen Befehle mit dem generierten Compose-Overlay aus, damit beide Dienste
das persistierte Home mounten. Wenn Ihr Setup auch `docker-compose.override.yml` verwendet,
fügen Sie es vor `docker-compose.extra.yml` ein.

Installieren Sie Claude Code in diesem persistierten Home:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Der native Installer schreibt die `claude`-Binärdatei unter
`/home/node/.local/bin/claude`. Weisen Sie OpenClaw an, diesen Container-Pfad zu verwenden:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Melden Sie sich an und verifizieren Sie aus demselben persistierten Container-Home:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

Danach können Sie das mitgelieferte `claude-cli`-Backend verwenden:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` persistiert die native Claude-Code-Installation unter
`/home/node/.local/bin` und `/home/node/.local/share/claude` sowie Claude-Code-
Einstellungen und Auth-Status unter `/home/node/.claude` und `/home/node/.claude.json`.
Nur `/home/node/.openclaw` zu persistieren, reicht für die Wiederverwendung der Claude CLI nicht aus. Wenn
Sie `OPENCLAW_EXTRA_MOUNTS` statt eines Home-Volumes verwenden, mounten Sie alle diese
Claude-Pfade in beide Docker-Dienste.

<Note>
Für gemeinsam genutzte Produktionsautomatisierung oder planbare Anthropic-Abrechnung bevorzugen Sie den
Anthropic-API-Key-Pfad. Die Wiederverwendung der Claude CLI folgt der installierten
Version, Kontoanmeldung, Abrechnung und dem Update-Verhalten von Claude Code.
</Note>

### Bonjour / mDNS

Docker-Bridge-Networking leitet Bonjour/mDNS-Multicast
(`224.0.0.251:5353`) in der Regel nicht zuverlässig weiter. Das mitgelieferte Compose-Setup setzt daher standardmäßig
`OPENCLAW_DISABLE_BONJOUR=1`, damit der Gateway nicht in einer Crash-Schleife hängt oder wiederholt
die Ankündigung neu startet, wenn die Bridge Multicast-Verkehr verwirft.

Verwenden Sie die veröffentlichte Gateway-URL, Tailscale oder Wide-Area-DNS-SD für Docker-Hosts.
Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur, wenn Sie mit Host-Networking, macvlan
oder einem anderen Netzwerk arbeiten, in dem mDNS-Multicast bekanntermaßen funktioniert.

Fallstricke und Fehlerbehebung finden Sie unter [Bonjour-Erkennung](/de/gateway/bonjour).

### Speicher und Persistenz

Docker Compose bind-mountet `OPENCLAW_CONFIG_DIR` nach `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` nach `/home/node/.openclaw/workspace` und
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` nach `/home/node/.config/openclaw`, sodass diese
Pfade den Austausch von Containern überstehen. Wenn eine Variable nicht gesetzt ist, fällt die mitgelieferte
`docker-compose.yml` unter `${HOME}` zurück, oder auf `/tmp`, wenn auch `HOME` selbst
fehlt. Dadurch gibt `docker compose up` in nackten Umgebungen keine Volume-Spezifikation
mit leerer Quelle aus.

In diesem gemounteten Konfigurationsverzeichnis speichert OpenClaw:

- `openclaw.json` für Verhaltenskonfiguration
- `agents/<agentId>/agent/auth-profiles.json` für gespeicherte Provider-OAuth-/API-Key-Authentifizierung
- `.env` für env-gestützte Runtime-Secrets wie `OPENCLAW_GATEWAY_TOKEN`

Das Verzeichnis für den Auth-Profil-Geheimschlüssel speichert den lokalen Verschlüsselungsschlüssel, der für
OAuth-gestütztes Auth-Profile-Tokenmaterial verwendet wird. Bewahren Sie es mit Ihrem Docker-Host-Status auf,
aber getrennt von `OPENCLAW_CONFIG_DIR`.

Installierte herunterladbare Plugins speichern ihren Paketstatus unter dem gemounteten
OpenClaw-Home, sodass Plugin-Installationsdatensätze und Paket-Roots den Austausch von Containern
überstehen. Der Gateway-Start generiert keine Dependency-Trees für mitgelieferte Plugins.

Vollständige Persistenzdetails für VM-Deployments finden Sie unter
[Docker-VM-Runtime - Was wo persistiert](/de/install/docker-vm-runtime#what-persists-where).

**Hotspots für Festplattenwachstum:** Beobachten Sie `media/`, Sitzungs-JSONL-Dateien, die gemeinsam genutzte
SQLite-Statusdatenbank, installierte Plugin-Paket-Roots und rotierende Datei-Logs
unter `/tmp/openclaw/`.

### Shell-Helfer (optional)

Installieren Sie für einfachere tägliche Docker-Verwaltung `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock über den älteren Raw-Pfad `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, führen Sie den Installationsbefehl oben erneut aus, damit Ihre lokale Helferdatei den neuen Speicherort verfolgt.

Verwenden Sie dann `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` usw. Führen Sie
`clawdock-help` für alle Befehle aus.
Die vollständige Helferanleitung finden Sie unter [ClawDock](/de/install/clawdock).

<AccordionGroup>
  <Accordion title="Agent-Sandbox für Docker-Gateway aktivieren">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Benutzerdefinierter Socket-Pfad (z. B. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Das Skript mountet `docker.sock` erst, nachdem die Sandbox-Voraussetzungen erfüllt sind. Wenn
    das Sandbox-Setup nicht abgeschlossen werden kann, setzt das Skript `agents.defaults.sandbox.mode`
    auf `off` zurück. Codex-Code-Mode-Turns bleiben weiterhin auf Codex
    `workspace-write` beschränkt, während die OpenClaw-Sandbox aktiv ist; mounten Sie den
    Host-Docker-Socket nicht in Agent-Sandbox-Container.

  </Accordion>

  <Accordion title="Automatisierung / CI (nicht interaktiv)">
    Deaktivieren Sie Compose-Pseudo-TTY-Zuweisung mit `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Sicherheitshinweis für gemeinsam genutzte Netzwerke">
    `openclaw-cli` verwendet `network_mode: "service:openclaw-gateway"`, damit CLI-
    Befehle den Gateway über `127.0.0.1` erreichen können. Behandeln Sie dies als gemeinsam genutzte
    Vertrauensgrenze. Die Compose-Konfiguration entfernt `NET_RAW`/`NET_ADMIN` und aktiviert
    `no-new-privileges` sowohl für `openclaw-gateway` als auch für `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker-Desktop-DNS-Fehler in openclaw-cli">
    Einige Docker-Desktop-Setups schlagen bei DNS-Lookups aus dem gemeinsam genutzten Netzwerk-
    `openclaw-cli`-Sidecar fehl, nachdem `NET_RAW` entfernt wurde. Das erscheint als
    `EAI_AGAIN` während npm-gestützter Befehle wie `openclaw plugins install`.
    Behalten Sie die standardmäßige gehärtete Compose-Datei für den normalen Gateway-Betrieb bei. Der
    lokale Override unten lockert die Sicherheitshaltung des CLI-Containers, indem
    Dockers Standard-Capabilities wiederhergestellt werden. Verwenden Sie ihn daher nur für den einmaligen CLI-
    Befehl, der Zugriff auf die Paket-Registry benötigt, nicht als Standard-Compose-
    Aufruf:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Wenn Sie bereits einen langlebigen `openclaw-cli`-Container erstellt haben, erstellen Sie ihn
    mit demselben Override neu. `docker compose exec` und `docker exec` können
    Linux-Capabilities an einem bereits erstellten Container nicht ändern.

  </Accordion>

  <Accordion title="Berechtigungen und EACCES">
    Das Image läuft als `node` (uid 1000). Wenn Sie Berechtigungsfehler bei
    `/home/node/.openclaw` sehen, stellen Sie sicher, dass Ihre Host-Bind-Mounts uid 1000 gehören:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Dieselbe Abweichung kann als Plugin-Warnung erscheinen, zum Beispiel
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`,
    gefolgt von `plugin present but blocked`. Das bedeutet, dass die Prozess-uid und der
    Besitzer des gemounteten Plugin-Verzeichnisses nicht übereinstimmen. Bevorzugen Sie, den Container mit der
    Standard-uid 1000 auszuführen und die Besitzrechte des Bind-Mounts zu korrigieren. Führen Sie `chown`
    für `/path/to/openclaw-config/npm` nur auf `root:root` aus, wenn Sie
    OpenClaw absichtlich langfristig als root ausführen.

  </Accordion>

  <Accordion title="Schnellere Rebuilds">
    Ordnen Sie Ihr Dockerfile so an, dass Dependency-Layer zwischengespeichert werden. Dadurch wird vermieden,
    `pnpm install` erneut auszuführen, sofern sich Lockfiles nicht ändern:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Container-Optionen für Power-User">
    Das Standard-Image stellt Sicherheit an erste Stelle und wird als Nicht-Root-Benutzer `node` ausgeführt. Für einen
    umfangreicher ausgestatteten Container:

    1. **`/home/node` persistent speichern**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Systemabhängigkeiten einbacken**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python-Abhängigkeiten einbacken**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium einbacken**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Oder Playwright-Browser in einem persistenten Volume installieren**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Browser-Downloads persistent speichern**: Verwenden Sie `OPENCLAW_HOME_VOLUME` oder
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw erkennt das vom Docker-Image
       über Playwright verwaltete Chromium unter Linux automatisch.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Headless-Docker)">
    Wenn Sie im Assistenten OpenAI Codex OAuth auswählen, wird eine Browser-URL geöffnet. In
    Docker- oder Headless-Setups kopieren Sie die vollständige Redirect-URL, auf der Sie landen, und fügen
    sie wieder in den Assistenten ein, um die Authentifizierung abzuschließen.
  </Accordion>

  <Accordion title="Metadaten des Basis-Images">
    Das Haupt-Docker-Runtime-Image verwendet `node:24-bookworm-slim` und enthält `tini` als Entry-Point-Init-Prozess (PID 1), um sicherzustellen, dass Zombie-Prozesse bereinigt und Signale in langlebigen Containern korrekt verarbeitet werden. Es veröffentlicht OCI-Basis-Image-Annotationen einschließlich `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` und weiterer. Der Node-Basis-Digest wird
    über Dependabot-PRs für Docker-Basis-Images aktualisiert; Release-Builds führen keine
    Distro-Upgrade-Schicht aus. Siehe
    [OCI-Image-Annotationen](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Ausführung auf einem VPS?

Siehe [Hetzner (Docker VPS)](/de/install/hetzner) und
[Docker-VM-Runtime](/de/install/docker-vm-runtime) für gemeinsame VM-Deployment-Schritte
einschließlich Binary-Baking, Persistenz und Updates.

## Agent-Sandbox

Wenn `agents.defaults.sandbox` mit dem Docker-Backend aktiviert ist, führt der Gateway
die Ausführung von Agent-Tools (Shell, Dateilesen/-schreiben usw.) in isolierten Docker-
Containern aus, während der Gateway selbst auf dem Host bleibt. Dadurch erhalten Sie eine harte Grenze
um nicht vertrauenswürdige oder mandantenfähige Agent-Sitzungen, ohne den gesamten
Gateway zu containerisieren.

Der Sandbox-Umfang kann pro Agent (Standard), pro Sitzung oder gemeinsam sein. Jeder Umfang
erhält einen eigenen Workspace, der unter `/workspace` gemountet wird. Sie können außerdem
Tool-Richtlinien zum Erlauben/Verweigern, Netzwerkisolation, Ressourcenlimits und Browser-
Container konfigurieren.

Die vollständige Konfiguration, Images, Sicherheitshinweise und Multi-Agent-Profile finden Sie unter:

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz
- [OpenShell](/de/gateway/openshell) -- interaktiver Shell-Zugriff auf Sandbox-Container
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent

### Schnell aktivieren

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Erstellen Sie das Standard-Sandbox-Image (aus einem Source-Checkout):

```bash
scripts/sandbox-setup.sh
```

Für npm-Installationen ohne Source-Checkout finden Sie unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) Inline-Befehle für `docker build`.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    Erstellen Sie das Sandbox-Image mit
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (Source-Checkout) oder dem Inline-Befehl `docker build` aus [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) (npm-Installation),
    oder setzen Sie `agents.defaults.sandbox.docker.image` auf Ihr benutzerdefiniertes Image.
    Container werden bei Bedarf automatisch pro Sitzung erstellt.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    Setzen Sie `docker.user` auf eine UID:GID, die zur Eigentümerschaft Ihres eingebundenen Arbeitsbereichs passt,
    oder ändern Sie den Besitzer des Arbeitsbereichsordners mit `chown`.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw führt Befehle mit `sh -lc` (Login-Shell) aus, wodurch
    `/etc/profile` eingelesen wird und PATH möglicherweise zurückgesetzt wird. Setzen Sie `docker.env.PATH`, um Ihre
    benutzerdefinierten Tool-Pfade voranzustellen, oder fügen Sie in Ihrer Dockerfile ein Skript unter `/etc/profile.d/` hinzu.
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    Die VM benötigt mindestens 2 GB RAM. Verwenden Sie eine größere Maschinenklasse und versuchen Sie es erneut.
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    Rufen Sie einen neuen Dashboard-Link ab und genehmigen Sie das Browser-Gerät:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Weitere Details: [Dashboard](/de/web/dashboard), [Geräte](/de/cli/devices).

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
    Setzen Sie Gateway-Modus und Bindung zurück:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Installationsübersicht](/de/install) — alle Installationsmethoden
- [Podman](/de/install/podman) — Podman-Alternative zu Docker
- [ClawDock](/de/install/clawdock) — Docker Compose-Community-Einrichtung
- [Aktualisieren](/de/install/updating) — OpenClaw aktuell halten
- [Konfiguration](/de/gateway/configuration) — Gateway-Konfiguration nach der Installation
