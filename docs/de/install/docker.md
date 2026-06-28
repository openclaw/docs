---
read_when:
    - Sie möchten einen containerisierten Gateway statt lokaler Installationen
    - Sie validieren den Docker-Ablauf
summary: Optionale Docker-basierte Einrichtung und Onboarding für OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-28T20:43:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker ist **optional**. Verwenden Sie es nur, wenn Sie einen containerisierten Gateway möchten oder den Docker-Ablauf validieren wollen.

## Ist Docker das Richtige für mich?

- **Ja**: Sie möchten eine isolierte, verwerfbare Gateway-Umgebung oder OpenClaw auf einem Host ohne lokale Installationen ausführen.
- **Nein**: Sie führen OpenClaw auf Ihrem eigenen Rechner aus und möchten nur den schnellsten Entwicklungszyklus. Verwenden Sie stattdessen den normalen Installationsablauf.
- **Hinweis zur Sandboxing**: Das standardmäßige Sandbox-Backend verwendet Docker, wenn Sandboxing aktiviert ist, aber Sandboxing ist standardmäßig deaktiviert und erfordert **nicht**, dass der vollständige Gateway in Docker läuft. SSH- und OpenShell-Sandbox-Backends sind ebenfalls verfügbar. Siehe [Sandboxing](/de/gateway/sandboxing).

## Voraussetzungen

- Docker Desktop (oder Docker Engine) + Docker Compose v2
- Mindestens 2 GB RAM für den Image-Build (`pnpm install` kann auf Hosts mit 1 GB mit Exit 137 wegen OOM beendet werden)
- Ausreichend Speicherplatz für Images und Protokolle
- Wenn Sie auf einem VPS/öffentlichen Host ausführen, prüfen Sie
  [Sicherheitshärtung für Netzwerkfreigabe](/de/gateway/security),
  insbesondere die Docker-Firewall-Richtlinie `DOCKER-USER`.

## Containerisierter Gateway

<Steps>
  <Step title="Image bauen">
    Führen Sie aus dem Repo-Root das Setup-Skript aus:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Dadurch wird das Gateway-Image lokal gebaut. Um stattdessen ein vorgebautes Image zu verwenden:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Vorgebaute Images werden zuerst in der
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    veröffentlicht. GHCR ist die primäre Registry für Release-Automatisierung,
    gepinnte Deployments und Provenance-Prüfungen. Derselbe Release-Workflow
    veröffentlicht außerdem einen offiziellen Docker-Hub-Mirror unter
    `openclaw/openclaw` für Hosts, die Docker Hub bevorzugen:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Verwenden Sie `ghcr.io/openclaw/openclaw` oder `openclaw/openclaw`. Vermeiden
    Sie Community-Mirrors auf Docker Hub, weil OpenClaw deren Release-Zeitpunkt,
    Rebuilds oder Retention-Richtlinie nicht kontrolliert. Häufige offizielle Tags:
    `main`, `latest`, `<version>` (z. B. `2026.2.26`) und Beta-Versionen wie
    `2026.2.26-beta.1`. Beta-Tags verschieben weder `latest` noch `main`.

  </Step>

  <Step title="Erneuter Durchlauf ohne Netzverbindung">
    Übertragen und laden Sie auf Offline-Hosts zuerst das Image:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` prüft, dass `OPENCLAW_IMAGE` bereits lokal vorhanden ist,
    deaktiviert implizite Compose-Pulls und Builds und führt dann den normalen
    Setup-Ablauf aus, etwa `.env`-Synchronisierung, Berechtigungskorrekturen,
    Onboarding, Gateway-Konfigurationssynchronisierung und Compose-Start.

    Wenn `OPENCLAW_SANDBOX=1`, prüft das Offline-Setup außerdem die konfigurierten
    Standard- und aktiven agentenspezifischen Sandbox-Images auf dem Daemon hinter
    `OPENCLAW_DOCKER_SOCKET`. Docker-gestützte Browser-Images müssen außerdem das
    aktuelle OpenClaw-Browser-Contract-Label tragen. Wenn ein erforderliches Image
    fehlt oder inkompatibel ist, beendet sich das Setup, ohne die
    Sandbox-Konfiguration zu ändern, statt Erfolg mit einer nicht nutzbaren Sandbox
    zu melden.

  </Step>

  <Step title="Onboarding abschließen">
    Das Setup-Skript führt das Onboarding automatisch aus. Es wird:

    - nach Provider-API-Schlüsseln fragen
    - ein Gateway-Token generieren und in `.env` schreiben
    - das Secret-Key-Verzeichnis für Auth-Profile erstellen
    - den Gateway über Docker Compose starten

    Während des Setups laufen Onboarding vor dem Start und Konfigurationsschreibvorgänge
    direkt über `openclaw-gateway`. `openclaw-cli` ist für Befehle gedacht, die Sie
    ausführen, nachdem der Gateway-Container bereits existiert.

  </Step>

  <Step title="Control UI öffnen">
    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser und fügen Sie das
    konfigurierte gemeinsame Secret in den Einstellungen ein. Das Setup-Skript
    schreibt standardmäßig ein Token in `.env`; wenn Sie die Container-Konfiguration
    auf Passwortauthentifizierung umstellen, verwenden Sie stattdessen dieses
    Passwort.

    Benötigen Sie die URL erneut?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Channels konfigurieren (optional)">
    Verwenden Sie den CLI-Container, um Messaging-Channels hinzuzufügen:

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
Führen Sie `docker compose` aus dem Repo-Root aus. Wenn Sie `OPENCLAW_EXTRA_MOUNTS`
oder `OPENCLAW_HOME_VOLUME` aktiviert haben, schreibt das Setup-Skript
`docker-compose.extra.yml`; binden Sie sie nach jeder standardmäßigen Override-Datei ein,
zum Beispiel
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`,
wenn beide Override-Dateien existieren.
</Note>

<Note>
Da `openclaw-cli` den Netzwerk-Namespace von `openclaw-gateway` teilt, ist es ein
Werkzeug nach dem Start. Führen Sie vor `docker compose up -d openclaw-gateway`
Onboarding und Setup-Konfigurationsschreibvorgänge über `openclaw-gateway` mit
`--no-deps --entrypoint node` aus.
</Note>

### Umgebungsvariablen

Das Setup-Skript akzeptiert diese optionalen Umgebungsvariablen:

| Variable                                   | Zweck                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Ein Remote-Image verwenden, statt lokal zu bauen                      |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Zusätzliche apt-Pakete während des Builds installieren (durch Leerzeichen getrennt) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Zusätzliche Python-Pakete während des Builds installieren (durch Leerzeichen getrennt) |
| `OPENCLAW_EXTENSIONS`                      | Plugin-Abhängigkeiten zur Build-Zeit vorinstallieren (durch Leerzeichen getrennte Namen) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Zusätzliche Host-Bind-Mounts (kommagetrennt `source:target[:opts]`)   |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` in einem benannten Docker-Volume persistent speichern    |
| `OPENCLAW_SANDBOX`                         | Sandbox-Bootstrap aktivieren (`1`, `true`, `yes`, `on`)               |
| `OPENCLAW_SKIP_ONBOARDING`                 | Den interaktiven Onboarding-Schritt überspringen (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker-Socket-Pfad überschreiben                                      |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour-/mDNS-Ankündigungen deaktivieren (standardmäßig `1` für Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Bind-Mount-Overlays für gebündelte Plugin-Quellen deaktivieren        |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Gemeinsamer OTLP/HTTP-Collector-Endpunkt für OpenTelemetry-Export     |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Signalspezifische OTLP-Endpunkte für Traces, Metriken oder Protokolle |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP-Protokoll-Override. Derzeit wird nur `http/protobuf` unterstützt |
| `OTEL_SERVICE_NAME`                        | Für OpenTelemetry-Ressourcen verwendeter Dienstname                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Aktuelle experimentelle semantische GenAI-Attribute aktivieren        |
| `OPENCLAW_OTEL_PRELOADED`                  | Start eines zweiten OpenTelemetry-SDK überspringen, wenn eines vorgeladen ist |

Das offizielle Docker-Image enthält kein Homebrew. Während des Onboardings blendet
OpenClaw Installer für reine brew-Skill-Abhängigkeiten aus, wenn es in einem
Linux-Container ohne `brew` läuft; diese Abhängigkeiten müssen durch ein
Custom-Image bereitgestellt oder manuell installiert werden. Verwenden Sie für
Abhängigkeiten, die als Debian-Pakete verfügbar sind, während des Image-Builds
`OPENCLAW_IMAGE_APT_PACKAGES`. Der alte Name `OPENCLAW_DOCKER_APT_PACKAGES` wird
weiterhin akzeptiert. Verwenden Sie für Python-Abhängigkeiten
`OPENCLAW_IMAGE_PIP_PACKAGES`. Dadurch wird während des Image-Builds
`python3 -m pip install --break-system-packages` ausgeführt; pinnen Sie daher
Paketversionen und verwenden Sie nur Paketindizes, denen Sie vertrauen.

Maintainer können gebündelte Plugin-Quellen gegen ein paketiertes Image testen,
indem sie ein Plugin-Quellverzeichnis über dessen paketierten Quellpfad mounten,
zum Beispiel
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Dieses gemountete Quellverzeichnis überschreibt das passende kompilierte Bundle
`/app/dist/extensions/synology-chat` für dieselbe Plugin-ID.

### Observability

Der OpenTelemetry-Export erfolgt ausgehend vom Gateway-Container zu Ihrem
OTLP-Collector. Er erfordert keinen veröffentlichten Docker-Port. Wenn Sie das
Image lokal bauen und den gebündelten OpenTelemetry-Exporter im Image verfügbar
haben möchten, binden Sie seine Runtime-Abhängigkeiten ein:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Installieren Sie das offizielle Plugin `@openclaw/diagnostics-otel` aus ClawHub
in paketierten Docker-Installationen, bevor Sie den Export aktivieren. Custom
aus Quellen gebaute Images können die lokale Plugin-Quelle weiterhin mit
`OPENCLAW_EXTENSIONS=diagnostics-otel` einbinden. Um den Export zu aktivieren,
erlauben und aktivieren Sie das Plugin `diagnostics-otel` in der Konfiguration
und setzen Sie dann `diagnostics.otel.enabled=true` oder verwenden Sie das
Konfigurationsbeispiel in [OpenTelemetry-Export](/de/gateway/opentelemetry).
Collector-Auth-Header werden über `diagnostics.otel.headers` konfiguriert, nicht
über Docker-Umgebungsvariablen.

Prometheus-Metriken verwenden den bereits veröffentlichten Gateway-Port.
Installieren Sie `clawhub:@openclaw/diagnostics-prometheus`, aktivieren Sie das
Plugin `diagnostics-prometheus` und scrapen Sie dann:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Die Route ist durch Gateway-Authentifizierung geschützt. Veröffentlichen Sie
keinen separaten öffentlichen `/metrics`-Port und keinen nicht authentifizierten
Reverse-Proxy-Pfad. Siehe [Prometheus-Metriken](/de/gateway/prometheus).

### Health Checks

Container-Probe-Endpunkte (keine Authentifizierung erforderlich):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Das Docker-Image enthält einen eingebauten `HEALTHCHECK`, der `/healthz`
anpingt. Wenn Prüfungen weiter fehlschlagen, markiert Docker den Container als
`unhealthy`, und Orchestrierungssysteme können ihn neu starten oder ersetzen.

Authentifizierter tiefer Health-Snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs. loopback

`scripts/docker/setup.sh` setzt standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, damit
Host-Zugriff auf `http://127.0.0.1:18789` mit Docker-Portveröffentlichung funktioniert.

- `lan` (Standard): Host-Browser und Host-CLI können den veröffentlichten Gateway-Port erreichen.
- `loopback`: Nur Prozesse innerhalb des Container-Netzwerk-Namespace können den Gateway direkt erreichen.

<Note>
Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), keine Host-Aliase wie `0.0.0.0` oder `127.0.0.1`.
</Note>

### Lokale Provider des Hosts

Wenn OpenClaw in Docker läuft, ist `127.0.0.1` innerhalb des Containers der
Container selbst, nicht Ihr Host-Rechner. Verwenden Sie `host.docker.internal`
für KI-Provider, die auf dem Host laufen:

| Provider  | Standard-URL des Hosts   | Docker-Setup-URL                   |
| --------- | ------------------------ | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Das gebündelte Docker-Setup verwendet diese Host-URLs als Onboarding-Standardwerte für LM Studio und Ollama, und `docker-compose.yml` ordnet `host.docker.internal` dem Host-Gateway von Docker für die Linux Docker Engine zu. Docker Desktop stellt denselben Hostnamen unter macOS und Windows bereits bereit.

Host-Dienste müssen außerdem auf einer Adresse lauschen, die von Docker aus erreichbar ist:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Wenn Sie Ihre eigene Compose-Datei oder einen `docker run`-Befehl verwenden, fügen Sie dieselbe Host-Zuordnung selbst hinzu, zum Beispiel `--add-host=host.docker.internal:host-gateway`.

### Claude-CLI-Backend in Docker

Das offizielle OpenClaw-Docker-Image installiert Claude Code nicht vor. Installieren Sie Claude Code innerhalb des Container-Benutzers, der OpenClaw ausführt, und melden Sie sich dort an. Persistieren Sie anschließend dieses Container-Home, damit Image-Upgrades weder die Binärdatei noch den Claude-Authentifizierungsstatus löschen.

Aktivieren Sie bei neuen Docker-Installationen ein persistentes `/home/node`-Volume, bevor Sie das Setup ausführen:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Stoppen Sie bei einer bestehenden Docker-Installation zuerst den Stack und laden Sie die aktuellen Docker-`.env`-Werte erneut, bevor Sie das Setup erneut ausführen. Das Setup-Skript liest `.env` nicht selbst; es schreibt `.env` aus der aktuellen Shell und den Standardwerten neu. Führen Sie für die generierte `.env` Folgendes aus:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Wenn Ihre `.env` Werte enthält, die Ihre Shell nicht sourcen kann, exportieren Sie die bestehenden Werte, auf die Sie angewiesen sind, zuerst manuell erneut, zum Beispiel `OPENCLAW_IMAGE`, Ports, Bind-Modus, benutzerdefinierte Pfade, `OPENCLAW_EXTRA_MOUNTS`, Sandbox und Skip-Onboarding-Einstellungen. Das generierte Overlay bindet das Home-Volume für `openclaw-gateway` und `openclaw-cli` ein.

Führen Sie die verbleibenden Befehle mit dem generierten Compose-Overlay aus, damit beide Dienste das persistierte Home einbinden. Wenn Ihr Setup auch `docker-compose.override.yml` verwendet, fügen Sie es vor `docker-compose.extra.yml` ein.

Installieren Sie Claude Code in diesem persistenten Home:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Der native Installer schreibt die `claude`-Binärdatei unter `/home/node/.local/bin/claude`. Weisen Sie OpenClaw an, diesen Container-Pfad zu verwenden:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Melden Sie sich an und prüfen Sie den Status aus demselben persistenten Container-Home heraus:

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

Danach können Sie das gebündelte `claude-cli`-Backend verwenden:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` persistiert die native Claude-Code-Installation unter `/home/node/.local/bin` und `/home/node/.local/share/claude` sowie Claude-Code-Einstellungen und Authentifizierungsstatus unter `/home/node/.claude` und `/home/node/.claude.json`. Nur `/home/node/.openclaw` zu persistieren reicht für die Wiederverwendung der Claude CLI nicht aus. Wenn Sie `OPENCLAW_EXTRA_MOUNTS` anstelle eines Home-Volumes verwenden, mounten Sie alle diese Claude-Pfade in beide Docker-Dienste.

<Note>
Für gemeinsam genutzte Produktionsautomatisierung oder vorhersehbare Anthropic-Abrechnung sollten Sie den Anthropic-API-Key-Pfad bevorzugen. Die Wiederverwendung der Claude CLI folgt der installierten Version, Kontoanmeldung, Abrechnung und dem Update-Verhalten von Claude Code.
</Note>

### Bonjour / mDNS

Docker-Bridge-Networking leitet Bonjour-/mDNS-Multicast (`224.0.0.251:5353`) in der Regel nicht zuverlässig weiter. Das gebündelte Compose-Setup setzt daher standardmäßig `OPENCLAW_DISABLE_BONJOUR=1`, damit der Gateway nicht in eine Crash-Schleife gerät oder wiederholt das Advertising neu startet, wenn die Bridge Multicast-Traffic verwirft.

Verwenden Sie die veröffentlichte Gateway-URL, Tailscale oder Wide-Area-DNS-SD für Docker-Hosts. Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur, wenn Sie Host-Networking, macvlan oder ein anderes Netzwerk verwenden, in dem mDNS-Multicast bekanntermaßen funktioniert.

Hinweise zu Stolperfallen und Fehlerbehebung finden Sie unter [Bonjour-Erkennung](/de/gateway/bonjour).

### Storage und Persistenz

Docker Compose bind-mountet `OPENCLAW_CONFIG_DIR` nach `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` nach `/home/node/.openclaw/workspace` und `OPENCLAW_AUTH_PROFILE_SECRET_DIR` nach `/home/node/.config/openclaw`, sodass diese Pfade einen Container-Austausch überstehen. Wenn eine Variable nicht gesetzt ist, fällt das gebündelte `docker-compose.yml` unter `${HOME}` zurück oder auf `/tmp`, wenn auch `HOME` selbst fehlt. Dadurch gibt `docker compose up` in blanken Umgebungen keine Volume-Spezifikation mit leerer Quelle aus.

In diesem gemounteten Konfigurationsverzeichnis speichert OpenClaw:

- `openclaw.json` für die Verhaltenskonfiguration
- `agents/<agentId>/agent/auth-profiles.json` für gespeicherte OAuth-/API-Key-Authentifizierung von Providern
- `.env` für env-gestützte Runtime-Secrets wie `OPENCLAW_GATEWAY_TOKEN`

Das Secret-Key-Verzeichnis für Authentifizierungsprofile speichert den lokalen Verschlüsselungsschlüssel, der für OAuth-gestütztes Token-Material von Authentifizierungsprofilen verwendet wird. Bewahren Sie es zusammen mit Ihrem Docker-Host-State auf, aber getrennt von `OPENCLAW_CONFIG_DIR`.

Installierte herunterladbare Plugins speichern ihren Paketstatus unter dem gemounteten OpenClaw-Home, sodass Plugin-Installationsdatensätze und Paket-Roots einen Container-Austausch überstehen. Der Gateway-Start erzeugt keine Abhängigkeitsbäume gebündelter Plugins.

Vollständige Persistenzdetails für VM-Deployments finden Sie unter [Docker-VM-Runtime - Was wo persistiert](/de/install/docker-vm-runtime#what-persists-where).

**Hotspots für Festplattenwachstum:** Beobachten Sie `media/`, Sitzungs-JSONL-Dateien, die gemeinsame SQLite-State-Datenbank, installierte Plugin-Paket-Roots und rotierende Dateilogs unter `/tmp/openclaw/`.

### Shell-Helfer (optional)

Installieren Sie `ClawDock` für einfacheres tägliches Docker-Management:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock über den älteren Raw-Pfad `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, führen Sie den Installationsbefehl oben erneut aus, damit Ihre lokale Helferdatei den neuen Speicherort verfolgt.

Verwenden Sie dann `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` usw. Führen Sie `clawdock-help` aus, um alle Befehle anzuzeigen.
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

    Das Skript mountet `docker.sock` erst, nachdem die Sandbox-Voraussetzungen erfüllt sind. Wenn das Sandbox-Setup nicht abgeschlossen werden kann, setzt das Skript `agents.defaults.sandbox.mode` auf `off` zurück. Codex-Code-Mode-Turns bleiben weiterhin auf Codex `workspace-write` beschränkt, während die OpenClaw-Sandbox aktiv ist; mounten Sie den Host-Docker-Socket nicht in Agent-Sandbox-Container.

  </Accordion>

  <Accordion title="Automatisierung / CI (nicht interaktiv)">
    Deaktivieren Sie die Compose-Pseudo-TTY-Zuweisung mit `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Sicherheitshinweis zu gemeinsam genutzten Netzwerken">
    `openclaw-cli` verwendet `network_mode: "service:openclaw-gateway"`, damit CLI-Befehle den Gateway über `127.0.0.1` erreichen können. Behandeln Sie dies als gemeinsame Vertrauensgrenze. Die Compose-Konfiguration entfernt `NET_RAW`/`NET_ADMIN` und aktiviert `no-new-privileges` sowohl für `openclaw-gateway` als auch für `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker-Desktop-DNS-Fehler in openclaw-cli">
    Einige Docker-Desktop-Setups schlagen bei DNS-Lookups aus dem Shared-Network-`openclaw-cli`-Sidecar fehl, nachdem `NET_RAW` entfernt wurde. Das zeigt sich als `EAI_AGAIN` bei npm-gestützten Befehlen wie `openclaw plugins install`. Behalten Sie die standardmäßig gehärtete Compose-Datei für den normalen Gateway-Betrieb bei. Das lokale Override unten lockert die Sicherheitslage des CLI-Containers, indem es Dockers Standard-Capabilities wiederherstellt. Verwenden Sie es daher nur für den einmaligen CLI-Befehl, der Zugriff auf das Paket-Registry benötigt, nicht als Ihre standardmäßige Compose-Ausführung:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Wenn Sie bereits einen langlebigen `openclaw-cli`-Container erstellt haben, erstellen Sie ihn mit demselben Override neu. `docker compose exec` und `docker exec` können Linux-Capabilities auf einem bereits erstellten Container nicht ändern.

  </Accordion>

  <Accordion title="Berechtigungen und EACCES">
    Das Image läuft als `node` (uid 1000). Wenn Sie Berechtigungsfehler auf `/home/node/.openclaw` sehen, stellen Sie sicher, dass Ihre Host-Bind-Mounts uid 1000 gehören:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Dieselbe Abweichung kann als Plugin-Warnung erscheinen, zum Beispiel `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`, gefolgt von `plugin present but blocked`. Das bedeutet, dass Prozess-uid und Eigentümer des gemounteten Plugin-Verzeichnisses nicht übereinstimmen. Führen Sie den Container vorzugsweise mit der Standard-uid 1000 aus und korrigieren Sie die Eigentümerschaft des Bind-Mounts. Führen Sie nur dann `chown` für `/path/to/openclaw-config/npm` auf `root:root` aus, wenn Sie OpenClaw langfristig absichtlich als root ausführen.

  </Accordion>

  <Accordion title="Schnellere Rebuilds">
    Ordnen Sie Ihr Dockerfile so an, dass Abhängigkeits-Layer zwischengespeichert werden. Dadurch wird vermieden, `pnpm install` erneut auszuführen, sofern sich Lockfiles nicht ändern:

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
    Das Standard-Image ist sicherheitsorientiert und läuft als nicht-root-`node`. Für einen funktionsreicheren Container:

    1. **`/home/node` dauerhaft speichern**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Systemabhängigkeiten ins Image einbacken**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python-Abhängigkeiten ins Image einbacken**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium einbacken**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Oder Playwright-Browser in einem dauerhaft gespeicherten Volume installieren**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Browser-Downloads dauerhaft speichern**: Verwenden Sie `OPENCLAW_HOME_VOLUME` oder
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw erkennt auf Linux automatisch das vom
       Playwright verwaltete Chromium des Docker-Images.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Wenn Sie im Assistenten OpenAI Codex OAuth auswählen, öffnet er eine Browser-URL. In
    Docker- oder headless Setups kopieren Sie die vollständige Redirect-URL, auf der Sie landen, und fügen
    sie wieder in den Assistenten ein, um die Authentifizierung abzuschließen.
  </Accordion>

  <Accordion title="Metadaten des Basis-Images">
    Das Haupt-Docker-Runtime-Image verwendet `node:24-bookworm-slim` und enthält `tini` als Init-Prozess des Entrypoints (PID 1), damit Zombie-Prozesse bereinigt und Signale in langlebigen Containern korrekt verarbeitet werden. Es veröffentlicht OCI-Basis-Image-Annotationen, darunter `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` und weitere. Der Node-Basis-Digest wird
    über Dependabot-PRs für Docker-Basis-Images aktualisiert; Release-Builds führen keine
    Distro-Upgrade-Schicht aus. Siehe
    [OCI-Image-Annotationen](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Ausführung auf einem VPS?

Siehe [Hetzner (Docker-VPS)](/de/install/hetzner) und
[Docker-VM-Runtime](/de/install/docker-vm-runtime) für gemeinsame Schritte zur VM-Bereitstellung,
einschließlich Einbacken von Binärdateien, Persistenz und Updates.

## Agent-Sandbox

Wenn `agents.defaults.sandbox` mit dem Docker-Backend aktiviert ist, führt der Gateway
die Tool-Ausführung des Agents (Shell, Dateilesen/-schreiben usw.) in isolierten Docker-
Containern aus, während der Gateway selbst auf dem Host bleibt. Das verschafft Ihnen eine klare harte Grenze
um nicht vertrauenswürdige oder mandantenfähige Agent-Sitzungen, ohne den gesamten
Gateway zu containerisieren.

Der Sandbox-Umfang kann pro Agent (Standard), pro Sitzung oder gemeinsam sein. Jeder Umfang
erhält einen eigenen Workspace, der unter `/workspace` eingehängt wird. Sie können außerdem
Allow/Deny-Tool-Richtlinien, Netzwerkisolation, Ressourcenlimits und Browser-
Container konfigurieren.

Vollständige Konfiguration, Images, Sicherheitshinweise und Multi-Agent-Profile finden Sie hier:

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz
- [OpenShell](/de/gateway/openshell) -- interaktiver Shell-Zugriff auf Sandbox-Container
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) -- Overrides pro Agent

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

Für npm-Installationen ohne Source-Checkout finden Sie unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) Inline-`docker build`-Befehle.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Image fehlt oder Sandbox-Container startet nicht">
    Erstellen Sie das Sandbox-Image mit
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (Source-Checkout) oder dem Inline-Befehl `docker build` aus [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) (npm-Installation),
    oder setzen Sie `agents.defaults.sandbox.docker.image` auf Ihr benutzerdefiniertes Image.
    Container werden bei Bedarf automatisch pro Sitzung erstellt.
  </Accordion>

  <Accordion title="Berechtigungsfehler in der Sandbox">
    Setzen Sie `docker.user` auf eine UID:GID, die zur Eigentümerschaft Ihres eingehängten Workspace passt,
    oder ändern Sie den Besitzer des Workspace-Ordners mit chown.
  </Accordion>

  <Accordion title="Benutzerdefinierte Tools werden in der Sandbox nicht gefunden">
    OpenClaw führt Befehle mit `sh -lc` (Login-Shell) aus, wodurch
    `/etc/profile` geladen wird und PATH möglicherweise zurückgesetzt wird. Setzen Sie `docker.env.PATH`, um Ihre
    benutzerdefinierten Tool-Pfade voranzustellen, oder fügen Sie in Ihrem Dockerfile ein Skript unter `/etc/profile.d/` hinzu.
  </Accordion>

  <Accordion title="Während des Image-Builds wegen OOM beendet (Exit 137)">
    Die VM benötigt mindestens 2 GB RAM. Verwenden Sie eine größere Maschinenklasse und versuchen Sie es erneut.
  </Accordion>

  <Accordion title="Nicht autorisiert oder Pairing in der Control UI erforderlich">
    Rufen Sie einen neuen Dashboard-Link ab und genehmigen Sie das Browsergerät:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Weitere Details: [Dashboard](/de/web/dashboard), [Geräte](/de/cli/devices).

  </Accordion>

  <Accordion title="Gateway-Ziel zeigt ws://172.x.x.x oder Pairing-Fehler von der Docker-CLI">
    Setzen Sie Gateway-Modus und Bindung zurück:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Verwandt

- [Installationsübersicht](/de/install) — alle Installationsmethoden
- [Podman](/de/install/podman) — Podman-Alternative zu Docker
- [ClawDock](/de/install/clawdock) — Community-Setup mit Docker Compose
- [Aktualisierung](/de/install/updating) — OpenClaw aktuell halten
- [Konfiguration](/de/gateway/configuration) — Gateway-Konfiguration nach der Installation
