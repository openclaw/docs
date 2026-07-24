---
read_when:
    - Sie möchten einen containerisierten Gateway anstelle lokaler Installationen
    - Sie validieren den Docker-Ablauf
summary: Optionale Docker-basierte Einrichtung und Einführung für OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-24T03:54:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c1784bd49f6847db75633840a4d5a8e49205200728bd2e9d59b646a446e508d6
    source_path: install/docker.md
    workflow: 16
---

Docker ist **optional**. Verwenden Sie es für eine isolierte, kurzlebige Gateway-Umgebung oder einen Host ohne lokale Installationen. Wenn Sie bereits auf Ihrem eigenen Rechner entwickeln, verwenden Sie stattdessen den normalen Installationsablauf.

Das standardmäßige Sandbox-Backend verwendet Docker, wenn `agents.defaults.sandbox` aktiviert ist. Sandboxing ist jedoch standardmäßig deaktiviert und setzt nicht voraus, dass das Gateway selbst in Docker ausgeführt wird. SSH- und OpenShell-Sandbox-Backends sind ebenfalls verfügbar; siehe [Sandboxing](/de/gateway/sandboxing).

Hosten Sie mehrere Benutzer? Informationen zum Modell mit einer Zelle pro Mandant finden Sie unter [Mandantenfähiges Hosting](/de/gateway/multi-tenant-hosting).

## Voraussetzungen

- Docker Desktop (oder Docker Engine) + Docker Compose v2
- Mindestens 2 GB RAM für die Image-Erstellung (`pnpm install` kann auf Hosts mit 1 GB wegen Speichermangels beendet werden, mit Exit-Code 137)
- Ausreichend Speicherplatz für Images und Protokolle
- Prüfen Sie auf einem VPS/öffentlichen Host die [Sicherheitshärtung für Netzwerkexposition](/de/gateway/security), insbesondere die Docker-Firewall-Kette `DOCKER-USER`

## Containerisiertes Gateway

<Steps>
  <Step title="Image erstellen">
    Vom Repository-Stammverzeichnis aus:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Dadurch wird das Gateway-Image lokal als `openclaw:local` erstellt. So verwenden Sie stattdessen ein vorab erstelltes Image:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Vorab erstellte Images werden zuerst in der [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) veröffentlicht. GHCR ist die primäre Registry für Release-Automatisierung, fest angeheftete Bereitstellungen und Herkunftsprüfungen. Dasselbe Release veröffentlicht einen Docker-Hub-Spiegel unter `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Verwenden Sie `ghcr.io/openclaw/openclaw` oder `openclaw/openclaw` und vermeiden Sie inoffizielle Spiegel, da diese weder den Release-Zeitplan noch die Aufbewahrungsrichtlinie von OpenClaw übernehmen. Versionsspezifische Tags umfassen Releases wie `2026.2.26` und Vorabversionen wie `2026.2.26-beta.1`. Stabile Releases aktualisieren `latest` und `main`; Gateway-Releases für den auslaufenden Monat aktualisieren nur `extended-stable`. Zu den Varianten gehören `slim`, `main-slim`, `extended-stable-slim`, `latest-browser`, `main-browser` und `extended-stable-browser`. Die Standard-Images enthalten die Plugins `codex` und `diagnostics-otel`. Eine Variante `-browser` wird außerdem mit integriertem Chromium ausgeliefert. Dies ist für das Tool [Browser in der Sandbox](/de/gateway/sandboxing#sandboxed-browser) nützlich, ohne dass beim ersten Start eine Playwright-Installation erforderlich ist.

  </Step>

  <Step title="Erneute Ausführung ohne Netzwerkzugang">
    Übertragen und laden Sie das Image auf Offline-Hosts zunächst:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` prüft, ob `OPENCLAW_IMAGE` bereits lokal vorhanden ist, deaktiviert implizite Compose-Abrufe und -Builds und führt anschließend den normalen Ablauf aus: Synchronisierung von `.env`, Korrekturen der Berechtigungen, Onboarding, Synchronisierung der Gateway-Konfiguration und Compose-Start.

    Wenn `OPENCLAW_SANDBOX=1`, prüft die Offline-Einrichtung außerdem die konfigurierten standardmäßigen und agentenspezifischen Sandbox-Images auf dem Daemon hinter `OPENCLAW_DOCKER_SOCKET`, einschließlich der Browser-Vertragskennzeichnung auf Docker-basierten Browser-Images. Wenn ein erforderliches Image fehlt oder veraltet ist, wird die Einrichtung beendet, ohne die Sandbox-Konfiguration zu ändern, statt fälschlicherweise einen erfolgreichen Abschluss zu melden.

  </Step>

  <Step title="Onboarding abschließen">
    Das Einrichtungsskript führt das Onboarding automatisch aus:

    - fordert Provider-API-Schlüssel an
    - generiert ein Gateway-Token und schreibt es nach `.env`
    - erstellt das Verzeichnis für den geheimen Schlüssel des Authentifizierungsprofils
    - startet das Gateway über Docker Compose

    Das Onboarding vor dem Start und Konfigurationsschreibvorgänge werden direkt über `openclaw-gateway` ausgeführt (mit `--no-deps --entrypoint node`), da `openclaw-cli` den Netzwerk-Namespace des Gateways gemeinsam verwendet und erst funktioniert, wenn der Gateway-Container vorhanden ist.

  </Step>

  <Step title="Control UI öffnen">
    Öffnen Sie `http://127.0.0.1:18789/` und fügen Sie das in `.env` geschriebene Token unter Settings ein. Wenn Sie den Container auf Passwortauthentifizierung umgestellt haben, verwenden Sie stattdessen dieses Passwort.

    Benötigen Sie die URL erneut?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanäle konfigurieren (optional)">
    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord)

  </Step>
</Steps>

### Manueller Ablauf

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Der Docker-Kontext schließt `.git` aus. Übergeben Sie die Quellidentität wie
oben gezeigt als Build-Argumente, damit der Info-Bildschirm des Images den ausgecheckten Commit und
einen Build-Zeitstempel anzeigt. `scripts/docker/setup.sh` ermittelt und übergibt beide Werte
automatisch.

<Note>
Führen Sie `docker compose` vom Repository-Stammverzeichnis aus. Wenn Sie `OPENCLAW_EXTRA_MOUNTS` oder `OPENCLAW_HOME_VOLUME` aktiviert haben, schreibt das Einrichtungsskript `docker-compose.extra.yml`; binden Sie es nach allen `docker-compose.override.yml` ein, die Sie selbst verwalten, z. B. `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Container-Images aktualisieren

Wenn Sie das OpenClaw-Image ersetzen, aber denselben eingebundenen Zustand und dieselbe Konfiguration beibehalten, führt das
neue Gateway vor der Betriebsbereitschaft startsichere Upgrade-Migrationen und eine Plugin-Konvergenz aus.
Für routinemäßige Image-Aktualisierungen sollte kein separater
Durchlauf von `openclaw doctor --fix` erforderlich sein.

Wenn diese Reparaturen beim Start nicht sicher abgeschlossen werden können, wird das Gateway beendet, statt
einen fehlerfreien Zustand zu melden. Bei einer Neustartrichtlinie können Docker, Podman oder Kubernetes den
Gateway-Container als wiederholt neu startend anzeigen. Behalten Sie das eingebundene Zustands-Volume bei und führen Sie anschließend
dasselbe Image einmal mit `openclaw doctor --fix` als Container-Befehl und mit denselben
Zustands-/Konfigurationseinbindungen aus, die das Gateway verwendet:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Starten Sie nach Abschluss von doctor den Gateway-Container mit seinem Standardbefehl neu.
Führen Sie denselben Befehl in Kubernetes in einem einmaligen Job oder Debug-Pod aus, der dasselbe
PVC eingebunden hat, und starten Sie anschließend das Deployment oder StatefulSet neu.

### Umgebungsvariablen

Optionale Variablen, die von `scripts/docker/setup.sh` (und für den Gateway-Container direkt von `docker-compose.yml`) akzeptiert werden:

| Variable                                        | Zweck                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Ein Remote-Image verwenden, statt es lokal zu erstellen                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Zusätzliche apt-Pakete während des Builds installieren (durch Leerzeichen getrennt). Veralteter Alias: `OPENCLAW_DOCKER_APT_PACKAGES`           |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Zusätzliche Python-Pakete während des Builds installieren (durch Leerzeichen getrennt)                                                      |
| `OPENCLAW_EXTENSIONS`                           | Unterstützte ausgewählte Plugins kompilieren/paketieren und ihre Laufzeitabhängigkeiten installieren (durch Kommas oder Leerzeichen getrennte IDs) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Node-Optionen für den lokalen Quell-Build überschreiben (Standard: `--max-old-space-size=8192`)                                |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | tsdown-Heap für den lokalen Quell-Build in MB überschreiben                                                                 |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Ausgabe von Deklarationen bei lokalen Image-Builds nur für die Laufzeit überspringen (Standard: `1`)                                      |
| `OPENCLAW_INSTALL_BROWSER`                      | Chromium + Xvfb während des Builds in das Image integrieren                                                                 |
| `OPENCLAW_EXTRA_MOUNTS`                         | Zusätzliche Host-Bind-Mounts (durch Kommas getrennte `source:target[:opts]`)                                                   |
| `OPENCLAW_HOME_VOLUME`                          | `/home/node` in einem benannten Docker-Volume dauerhaft speichern                                                                     |
| `OPENCLAW_SANDBOX`                              | Sandbox-Bootstrap aktivieren (`1`, `true`, `yes`, `on`)                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | Den interaktiven Onboarding-Schritt überspringen (`1`, `true`, `yes`, `on`)                                                   |
| `OPENCLAW_DOCKER_SOCKET`                        | Docker-Socket-Pfad überschreiben                                                                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | Bonjour-/mDNS-Ankündigung erzwingen: ein (`0`) oder aus (`1`); siehe [Bonjour / mDNS](#bonjour--mdns)                        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Bind-Mount-Overlays für den Quellcode mitgelieferter Plugins deaktivieren                                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Gemeinsamer OTLP/HTTP-Collector-Endpunkt für den OpenTelemetry-Export                                                      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Signalspezifische OTLP-Endpunkte für Traces, Metriken oder Protokolle                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLP-Protokoll überschreiben. Derzeit wird nur `http/protobuf` unterstützt                                                   |
| `OTEL_SERVICE_NAME`                             | Für OpenTelemetry-Ressourcen verwendeter Dienstname                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Neueste experimentelle semantische GenAI-Attribute aktivieren                                                           |
| `OPENCLAW_OTEL_PRELOADED`                       | Start eines zweiten OpenTelemetry SDK überspringen, wenn bereits eines vorgeladen ist                                                    |

Das offizielle Image enthält kein Homebrew. Während des Onboardings blendet OpenClaw in einem Linux-Container ohne `brew` Installer für reine brew-Abhängigkeiten von Skills aus; stellen Sie diese Abhängigkeiten über ein benutzerdefiniertes Image bereit oder installieren Sie sie manuell. Verwenden Sie `OPENCLAW_IMAGE_APT_PACKAGES` für als Debian-Pakete verfügbare Abhängigkeiten und `OPENCLAW_IMAGE_PIP_PACKAGES` für Python-Abhängigkeiten (führt `python3 -m pip install --break-system-packages` während des Builds aus; fixieren Sie daher Versionen und verwenden Sie nur Indizes, denen Sie vertrauen).

Wenn Docker `ResourceExhausted` oder `cannot allocate memory` meldet oder während `tsdown` abbricht, erhöhen Sie das Speicherlimit des Docker-Builders oder versuchen Sie es erneut mit kleineren expliziten Heaps:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Aus dem Quellcode erstellte Images mit ausgewählten Plugins

`OPENCLAW_EXTENSIONS` wählt Plugin-Manifest-IDs aus dem Quell-Checkout aus;
vorhandene Namen von Quellverzeichnissen werden ebenfalls akzeptiert, wenn sie abweichen. Der Docker-
Build löst die Auswahl einmalig in Quellverzeichnisse auf, installiert Produktions-
abhängigkeiten und kompiliert, wenn ein ausgewähltes Plugin separat mit
`openclaw.build.bundledDist: false` veröffentlicht wird, dessen Laufzeit in die gebündelte Root-
Distribution. Diese reine Docker-Paketierung ändert den npm- oder ClawHub-
Artefaktvertrag des Plugins nicht. Unbekannte, ungültige oder mehrdeutige IDs lassen den Image-Build fehlschlagen.
Bekannte reine Abhängigkeits-/Quell-IDs behalten ihr bestehendes Staging von Quellen und Abhängigkeiten,
ohne einen kompilierten Root-Distributionseintrag zu erhalten. Ein ausgewähltes Plugin mit
vereinheitlichten Build-Einträgen muss erfolgreich kompiliert werden; nicht ausgewählte externe Plugin-
Quellen und Laufzeitausgaben werden entfernt.

Diese Befehle erstellen beispielsweise separate, eigenständige
FakeCo-Gateway-Images für mehrere Architekturen für ClickClack, Slack und Microsoft Teams. ClawRouter ist
bereits Teil der Root-Laufzeit von OpenClaw, daher wählt das ClickClack-Image nur
`clickclack` aus. Das explizit leere Browserargument hält das Standard-Image frei
von Chromium:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

Verwenden Sie `--platform linux/arm64 --load` oder `--platform linux/amd64 --load` für einen
einzelnen nativen lokalen Build. Ausgaben für mehrere Plattformen und angehängte SBOM-/Provenienz-
Nachweise erfordern eine Registry oder eine andere Buildx-Ausgabe, die Attestierungen beibehält. Prüfen
Sie nach dem Push das Manifest und stellen Sie den unveränderlichen Digest statt des
veränderlichen Quell-SHA-Tags bereit:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Bereitstellen: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Diese Images sind für eigenständige OCI-basierte Gateways und allgemeine Docker-Benutzer vorgesehen.
Von Crabhelm verwaltete Gateways verwenden sie nicht: Dieser Bereitstellungspfad erstellt ein
separates x86_64-Appliance-Archiv, das einen OpenClaw-npm-Tarball enthält, und fixiert
die Digests von Node, Archiv und Manifest. Erstellen Sie diese Appliance unabhängig
aus derselben übernommenen OpenClaw-Quelle.

Um gebündelte Plugin-Quellen mit einem paketierten Image zu testen, mounten Sie ein Plugin-Quellverzeichnis über dessen paketierten Quellpfad, z. B. `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Dadurch wird das entsprechende kompilierte `/app/dist/extensions/synology-chat`-Bundle für dieselbe Plugin-ID überschrieben.

### Beobachtbarkeit

Der OpenTelemetry-Export erfolgt ausgehend vom Gateway-Container zu Ihrem OTLP-Collector; dafür ist kein veröffentlichter Docker-Port erforderlich. So nehmen Sie den gebündelten Exporter in ein lokal erstelltes Image auf:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Offizielle vorgefertigte Images enthalten `diagnostics-otel` bereits; installieren Sie `clawhub:@openclaw/diagnostics-otel` nur selbst, wenn Sie es entfernt haben. Um den Export zu aktivieren, erlauben und aktivieren Sie das Plugin `diagnostics-otel` in der Konfiguration und setzen Sie anschließend `diagnostics.otel.enabled=true` (das vollständige Beispiel finden Sie unter [OpenTelemetry-Export](/de/gateway/opentelemetry)). Authentifizierungsheader für den Collector werden über `diagnostics.otel.headers` und nicht über Docker-Umgebungsvariablen übergeben.

Prometheus-Metriken verwenden den bereits veröffentlichten Gateway-Port. Installieren Sie `clawhub:@openclaw/diagnostics-prometheus`, aktivieren Sie das Plugin `diagnostics-prometheus` und führen Sie dann das Scraping durch:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Die Route ist durch die Gateway-Authentifizierung geschützt; legen Sie keinen separaten öffentlichen Port `/metrics` oder einen nicht authentifizierten Reverse-Proxy-Pfad offen. Siehe [Prometheus-Metriken](/de/gateway/prometheus).

### Zustandsprüfungen

Container-Prüfendpunkte (keine Authentifizierung erforderlich):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # Aktivität
curl -fsS http://127.0.0.1:18789/readyz     # Bereitschaft
```

Der integrierte `HEALTHCHECK` des Images fragt `/healthz` ab; wiederholte Fehler markieren den Container als `unhealthy`, sodass Orchestratoren ihn neu starten oder ersetzen können.

Authentifizierte detaillierte Zustandsübersicht:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN im Vergleich zu Loopback

`scripts/docker/setup.sh` verwendet standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, sodass `http://127.0.0.1:18789` auf dem Host mit der Docker-Portveröffentlichung funktioniert.

- `lan` (Standard): Host-Browser und Host-CLI können den veröffentlichten Gateway-Port erreichen.
- `loopback`: Nur Prozesse innerhalb des Netzwerk-Namensraums des Containers können das Gateway direkt erreichen.

<Note>
Verwenden Sie Bindungsmoduswerte in `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`) und keine Host-Aliasse wie `0.0.0.0` oder `127.0.0.1`.
</Note>

### Lokale Provider auf dem Host

Innerhalb des Containers ist `127.0.0.1` der Container selbst, nicht der Host. Verwenden Sie `host.docker.internal` für Provider, die auf dem Host ausgeführt werden:

| Provider  | Standard-URL auf dem Host | Docker-Einrichtungs-URL              |
| --------- | ------------------------- | ------------------------------------ |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Die gebündelte Einrichtung verwendet diese URLs als Onboarding-Standardwerte für LM Studio/Ollama, und `docker-compose.yml` ordnet `host.docker.internal` unter Linux Docker Engine dem Host-Gateway zu (Docker Desktop stellt denselben Alias unter macOS/Windows bereit). Host-Dienste müssen an einer Adresse lauschen, die Docker erreichen kann:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Verwenden Sie Ihre eigene Compose-Datei oder `docker run`? Fügen Sie dieselbe Zuordnung selbst hinzu, z. B. `--add-host=host.docker.internal:host-gateway`.

### Claude-CLI-Backend in Docker

Das offizielle Image installiert Claude Code nicht vorab. Installieren Sie es und melden Sie sich innerhalb des Benutzers `node` des Containers an. Persistieren Sie anschließend dieses Container-Home-Verzeichnis, damit Image-Upgrades weder die Binärdatei noch den Authentifizierungsstatus löschen.

Aktivieren Sie für eine Neuinstallation ein persistentes Volume `/home/node`, bevor Sie die Einrichtung ausführen:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Stoppen Sie bei einer bestehenden Installation zunächst den Stack und laden Sie die aktuellen Werte aus `.env` neu — das Einrichtungsskript schreibt `.env` immer anhand der aktuellen Shell und der Standardwerte neu; es liest die Datei nicht selbstständig:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Falls `.env` Werte enthält, die Ihre Shell nicht einlesen kann, exportieren Sie zunächst manuell erneut, worauf Sie angewiesen sind (`OPENCLAW_IMAGE`, Ports, Bindungsmodus, benutzerdefinierte Pfade, `OPENCLAW_EXTRA_MOUNTS`, Sandbox, Onboarding überspringen). Das generierte Overlay mountet das Home-Volume sowohl für `openclaw-gateway` als auch für `openclaw-cli`; führen Sie die verbleibenden Befehle mit diesem Overlay aus (und zuerst mit `docker-compose.override.yml`, falls Sie eines verwenden):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Das native Installationsprogramm schreibt `claude` nach `/home/node/.local/bin/claude`. Das
OpenClaw-Image enthält `/home/node/.local/bin` in `PATH`, sodass das gebündelte
Anthropic-Plugin es ohne Überschreibung der Adapterkonfiguration auflöst.

Melden Sie sich an und prüfen Sie die Installation aus demselben persistenten Home-Verzeichnis:

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

Verwenden Sie anschließend das gebündelte Backend `claude-cli`:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Begrüßen Sie mich aus der Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` persistiert die native Installation unter `/home/node/.local/bin` und `/home/node/.local/share/claude` sowie die Einstellungen/Authentifizierung von Claude Code unter `/home/node/.claude` und `/home/node/.claude.json`. Nur `/home/node/.openclaw` zu persistieren, reicht nicht aus; wenn Sie `OPENCLAW_EXTRA_MOUNTS` statt eines Home-Volumes verwenden, mounten Sie alle diese Claude-Pfade in beide Dienste.

<Note>
Bevorzugen Sie für gemeinsam genutzte Produktionsautomatisierung oder vorhersehbare Anthropic-Abrechnung den Anthropic-API-Schlüssel-Pfad. Die Wiederverwendung der Claude CLI richtet sich nach der installierten Version, der Kontoanmeldung, der Abrechnung und dem Aktualisierungsverhalten von Claude Code.
</Note>

### Bonjour / mDNS

Docker-Bridge-Netzwerke leiten Bonjour-/mDNS-Multicast (`224.0.0.251:5353`) üblicherweise nicht zuverlässig weiter. Wenn `OPENCLAW_DISABLE_BONJOUR` nicht gesetzt ist, deaktiviert das gebündelte Bonjour-Plugin die LAN-Ankündigung automatisch, sobald es erkennt, dass es in einem Container ausgeführt wird. Dadurch gerät es nicht in eine Absturzschleife, während es wiederholt Multicast sendet, das von der Bridge verworfen wird. Setzen Sie `OPENCLAW_DISABLE_BONJOUR=1`, um die Funktion unabhängig von der Erkennung zwangsweise zu deaktivieren, oder `0`, um sie zwangsweise zu aktivieren (nur bei Host-Netzwerken, macvlan oder einem anderen Netzwerk, in dem mDNS-Multicast nachweislich funktioniert).

Verwenden Sie andernfalls für Docker-Hosts die veröffentlichte Gateway-URL, Tailscale oder Wide-Area-DNS-SD. Hinweise zu Fallstricken und zur Fehlerbehebung finden Sie unter [Bonjour-Erkennung](/de/gateway/bonjour).

### Speicher und Persistenz

Docker Compose bind-mountet `OPENCLAW_CONFIG_DIR` nach `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` nach `/home/node/.openclaw/workspace` und `OPENCLAW_AUTH_PROFILE_SECRET_DIR` nach `/home/node/.config/openclaw`, sodass diese Pfade einen Container-Austausch überstehen. Wenn eine Variable nicht gesetzt ist, greift `docker-compose.yml` auf einen Pfad unter `${HOME}` zurück oder auf `/tmp`, falls `HOME` selbst fehlt. Dadurch erzeugt `docker compose up` in Basissystemen niemals eine Volume-Spezifikation mit leerer Quelle.

Dieses gemountete Konfigurationsverzeichnis enthält:

- `openclaw.json` für die Verhaltenskonfiguration
- `agents/<agentId>/agent/auth-profiles.json` für gespeicherte OAuth-/API-Schlüssel-Authentifizierung von Providern
- `.env` für umgebungsbasierte Laufzeit-Secrets wie `OPENCLAW_GATEWAY_TOKEN`

Das Secret-Verzeichnis des Authentifizierungsprofils speichert den lokalen Verschlüsselungsschlüssel für das Tokenmaterial OAuth-basierter Authentifizierungsprofile. Bewahren Sie es zusammen mit dem Status Ihres Docker-Hosts auf, jedoch getrennt von `OPENCLAW_CONFIG_DIR`.

Installierte herunterladbare Plugins speichern ihren Paketstatus unter dem gemounteten OpenClaw-Home-Verzeichnis, sodass Installationsdatensätze und Paketstammverzeichnisse einen Container-Austausch überstehen; der Gateway-Start erzeugt die Abhängigkeitsbäume gebündelter Plugins nicht neu.

Vollständige Einzelheiten zur VM-Persistenz finden Sie unter [Docker-VM-Laufzeit – Was wo persistiert wird](/de/install/docker-vm-runtime#what-persists-where).

**Schwerpunkte des Speicherwachstums:** `media/`, agentenspezifische SQLite-Datenbanken, ältere JSONL-Transkripte von Sitzungen, die gemeinsam genutzte SQLite-Statusdatenbank, Paketstammverzeichnisse installierter Plugins und rotierende Dateiprotokolle unter `/tmp/openclaw/`.

### Shell-Hilfsfunktionen (optional)

Installieren Sie für kürzere alltägliche Befehle [ClawDock](/de/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie über den älteren Pfad `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, führen Sie den obigen Befehl erneut aus, damit Ihre lokale Hilfsfunktion dem aktuellen Speicherort folgt. Verwenden Sie anschließend `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` usw. (führen Sie `clawdock-help` aus, um die vollständige Liste anzuzeigen).

<AccordionGroup>
  <Accordion title="Agent-Sandbox für Docker-Gateway aktivieren">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Benutzerdefinierter Socket-Pfad (z. B. rootloses Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Das Skript bindet `docker.sock` erst ein, nachdem die Sandbox-Voraussetzungen erfüllt sind. Wenn die Sandbox-Einrichtung nicht abgeschlossen werden kann, setzt es `agents.defaults.sandbox.mode` auf `off` zurück. Der Codex-Codemodus ist für Durchläufe deaktiviert, in denen die OpenClaw-Sandbox aktiv ist (siehe [Sandboxing § Docker-Backend](/de/gateway/sandboxing#docker-backend)); binden Sie den Docker-Socket des Hosts niemals in Agent-Sandbox-Container ein.

  </Accordion>

  <Accordion title="Automatisierung / CI (nicht interaktiv)">
    Deaktivieren Sie die Pseudo-TTY-Zuweisung von Compose mit `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Sicherheitshinweis zum gemeinsam genutzten Netzwerk">
    `openclaw-cli` verwendet `network_mode: "service:openclaw-gateway"`, damit CLI-Befehle den Gateway über `127.0.0.1` erreichen können. Behandeln Sie dies als gemeinsame Vertrauensgrenze. Die Compose-Konfiguration entfernt `NET_RAW`/`NET_ADMIN` und aktiviert `no-new-privileges` sowohl für `openclaw-gateway` als auch für `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker-Desktop-DNS-Fehler in openclaw-cli">
    Bei einigen Docker-Desktop-Konfigurationen schlagen DNS-Abfragen aus dem `openclaw-cli`-Sidecar im gemeinsam genutzten Netzwerk fehl, nachdem `NET_RAW` entfernt wurde. Dies äußert sich bei npm-gestützten Befehlen wie `openclaw plugins install` als `EAI_AGAIN`. Verwenden Sie für den normalen Betrieb weiterhin die standardmäßige gehärtete Compose-Datei. Die folgende Überschreibung stellt die Standard-Capabilities nur für den Container `openclaw-cli` wieder her — verwenden Sie sie für den einmaligen Befehl, der Zugriff auf die Registry benötigt, nicht als Standardaufruf:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Wenn Sie bereits einen langlebigen `openclaw-cli`-Container erstellt haben, erstellen Sie ihn mit derselben Überschreibung neu — `docker compose exec`/`docker exec` können die Linux-Capabilities eines bereits erstellten Containers nicht ändern.

  </Accordion>

  <Accordion title="Berechtigungen und EACCES">
    Das Image wird als `node` (UID 1000) ausgeführt. Wenn bei `/home/node/.openclaw` Berechtigungsfehler auftreten, stellen Sie sicher, dass Ihre Bind-Mounts auf dem Host UID 1000 gehören:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Dieselbe Abweichung kann sich als `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`, gefolgt von `plugin present but blocked`, zeigen — die Prozess-UID und der Eigentümer des eingebundenen Plugin-Verzeichnisses stimmen nicht überein. Führen Sie den Prozess vorzugsweise mit der standardmäßigen UID 1000 aus und korrigieren Sie die Eigentümerschaft des Bind-Mounts. Ändern Sie die Eigentümerschaft von `/path/to/openclaw-config/npm` nur dann auf `root:root`, wenn Sie OpenClaw absichtlich dauerhaft als root ausführen.

  </Accordion>

  <Accordion title="Schnellere Neuerstellungen">
    Ordnen Sie Ihr Dockerfile so an, dass Abhängigkeits-Layer zwischengespeichert werden und `pnpm install` nicht erneut ausgeführt wird, solange sich die Lockfiles nicht ändern:

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

  <Accordion title="Container-Optionen für fortgeschrittene Benutzer">
    Das Standard-Image priorisiert Sicherheit und wird als Nicht-root-Benutzer `node` ausgeführt. Für einen umfangreicher ausgestatteten Container:

    1. **`/home/node` persistent speichern**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Systemabhängigkeiten integrieren**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python-Abhängigkeiten integrieren**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium integrieren**: `export OPENCLAW_INSTALL_BROWSER=1`, oder verwenden Sie das offizielle Image-Tag `-browser`
    5. **Oder Playwright-Browser in einem persistenten Volume installieren**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Browser-Downloads persistent speichern**: Verwenden Sie `OPENCLAW_HOME_VOLUME` oder `OPENCLAW_EXTRA_MOUNTS`. OpenClaw erkennt unter Linux automatisch das vom Image durch Playwright verwaltete Chromium.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Wenn Sie im Assistenten OpenAI Codex OAuth auswählen, wird eine Browser-URL geöffnet. Kopieren Sie bei Docker- oder Headless-Konfigurationen die vollständige Weiterleitungs-URL, auf der Sie landen, und fügen Sie sie wieder in den Assistenten ein, um die Authentifizierung abzuschließen.
  </Accordion>

  <Accordion title="Metadaten des Basis-Images">
    Das Runtime-Image verwendet `node:24-bookworm-slim` und führt `tini` als PID 1 aus, damit Zombie-Prozesse beseitigt und Signale in langlebigen Containern korrekt verarbeitet werden. Es veröffentlicht OCI-Basis-Image-Annotationen einschließlich `org.opencontainers.image.base.name` und `org.opencontainers.image.source`. Dependabot aktualisiert den angehefteten Digest des Node-Basis-Images; Release-Builds führen keinen separaten Distributions-Upgrade-Layer aus. Siehe [OCI-Image-Annotationen](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Ausführung auf einem VPS?

Unter [Hetzner (Docker-VPS)](/de/install/hetzner) und [Docker-VM-Runtime](/de/install/docker-vm-runtime) finden Sie Bereitstellungsschritte für gemeinsam genutzte VMs, einschließlich der Integration von Binärdateien, Persistenz und Aktualisierungen.

## Agent-Sandbox

Wenn `agents.defaults.sandbox` mit dem Docker-Backend aktiviert ist, führt der Gateway Agent-Werkzeuge (Shell, Lesen/Schreiben von Dateien usw.) innerhalb isolierter Docker-Container aus, während der Gateway selbst auf dem Host verbleibt — eine feste Trennung für nicht vertrauenswürdige oder mandantenfähige Agent-Sitzungen, ohne den gesamten Gateway in einen Container zu verlagern.

Der Sandbox-Geltungsbereich kann pro Agent (Standard), pro Sitzung oder gemeinsam gelten; jeder Geltungsbereich erhält einen eigenen Arbeitsbereich, der unter `/workspace` eingebunden wird. Sie können außerdem Zulassungs-/Verweigerungsrichtlinien für Werkzeuge, Netzwerkisolierung, Ressourcenlimits und Browser-Container konfigurieren.

Vollständige Informationen zu Konfiguration, Images, Sicherheitshinweisen und Multi-Agent-Profilen:

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz
- [OpenShell](/de/gateway/openshell) -- interaktiver Shell-Zugriff auf Sandbox-Container
- [Multi-Agent-Sandbox und -Werkzeuge](/de/tools/multi-agent-sandbox-tools) -- agentenspezifische Überschreibungen

### Schnellaktivierung

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

Erstellen Sie das standardmäßige Sandbox-Image (aus einem Quellcode-Checkout):

```bash
scripts/sandbox-setup.sh
```

Informationen zu npm-Installationen ohne Quellcode-Checkout finden Sie unter [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) für direkt eingebettete `docker build`-Befehle.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Image fehlt oder Sandbox-Container startet nicht">
    Erstellen Sie das Sandbox-Image mit [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (Quellcode-Checkout) oder dem direkt eingebetteten `docker build`-Befehl aus [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) (npm-Installation), oder setzen Sie `agents.defaults.sandbox.docker.image` auf Ihr benutzerdefiniertes Image. Container werden bei Bedarf automatisch pro Sitzung erstellt.
  </Accordion>

  <Accordion title="Berechtigungsfehler in der Sandbox">
    Setzen Sie `docker.user` auf eine UID:GID, die mit der Eigentümerschaft Ihres eingebundenen Arbeitsbereichs übereinstimmt, oder ändern Sie die Eigentümerschaft des Arbeitsbereichsordners.
  </Accordion>

  <Accordion title="Benutzerdefinierte Werkzeuge werden in der Sandbox nicht gefunden">
    OpenClaw führt Befehle mit `sh -lc` (Login-Shell) aus. Diese liest `/etc/profile` ein und setzt möglicherweise PATH zurück. Legen Sie `docker.env.PATH` fest, um die Pfade Ihrer benutzerdefinierten Werkzeuge voranzustellen, oder fügen Sie in Ihrem Dockerfile ein Skript unter `/etc/profile.d/` hinzu.
  </Accordion>

  <Accordion title="Während der Image-Erstellung wegen Speichermangels beendet (Exit 137)">
    Die VM benötigt mindestens 2 GB RAM. Verwenden Sie eine größere Maschinenklasse und versuchen Sie es erneut.
  </Accordion>

  <Accordion title="Nicht autorisiert oder Kopplung in der Control UI erforderlich">
    Rufen Sie einen neuen Dashboard-Link ab und genehmigen Sie das Browsergerät:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Weitere Einzelheiten: [Dashboard](/de/web/dashboard), [Geräte](/de/cli/devices).

  </Accordion>

  <Accordion title="Gateway-Ziel zeigt ws://172.x.x.x oder Kopplungsfehler über die Docker-CLI">
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
- [ClawDock](/de/install/clawdock) — Community-Konfiguration für Docker Compose
- [Aktualisieren](/de/install/updating) — OpenClaw auf dem neuesten Stand halten
- [Konfiguration](/de/gateway/configuration) — Gateway-Konfiguration nach der Installation
