---
read_when:
    - Sie möchten ein containerisiertes Gateway statt lokaler Installationen
    - Sie validieren den Docker-Ablauf
summary: Optionale Docker-basierte Einrichtung und Einführung für OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-05T08:25:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: f57db2ec12f1a1fd681ec90cc43b2c945755a9240f571de46688777e957f1b8e
    source_path: install/docker.md
    workflow: 16
---

Docker ist **optional**. Verwenden Sie es nur, wenn Sie einen containerisierten Gateway wünschen oder den Docker-Ablauf validieren möchten.

## Ist Docker das Richtige für mich?

- **Ja**: Sie möchten eine isolierte, temporäre Gateway-Umgebung oder OpenClaw auf einem Host ohne lokale Installationen ausführen.
- **Nein**: Sie arbeiten auf Ihrer eigenen Maschine und möchten nur den schnellsten Entwicklungs-Loop. Verwenden Sie stattdessen den normalen Installationsablauf.
- **Hinweis zum Sandboxing**: Das standardmäßige Sandbox-Backend verwendet Docker, wenn Sandboxing aktiviert ist, aber Sandboxing ist standardmäßig deaktiviert und erfordert **nicht**, dass der vollständige Gateway in Docker ausgeführt wird. SSH- und OpenShell-Sandbox-Backends sind ebenfalls verfügbar. Siehe [Sandboxing](/de/gateway/sandboxing).

## Voraussetzungen

- Docker Desktop (oder Docker Engine) + Docker Compose v2
- Mindestens 2 GB RAM für den Image-Build (`pnpm install` kann auf Hosts mit 1 GB RAM per OOM mit Exit 137 beendet werden)
- Ausreichend Speicherplatz für Images und Logs
- Wenn Sie auf einem VPS/öffentlichen Host ausführen, lesen Sie
  [Sicherheitshärtung für Netzwerkexposition](/de/gateway/security),
  insbesondere die Docker-Firewall-Richtlinie `DOCKER-USER`.

## Containerisierter Gateway

<Steps>
  <Step title="Image bauen">
    Führen Sie im Repo-Root das Setup-Skript aus:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Dadurch wird das Gateway-Image lokal gebaut. Um stattdessen ein vorgebautes Image zu verwenden:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Vorgebaute Images werden in der
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    veröffentlicht. Gängige Tags: `main`, `latest`, `<version>` (z. B. `2026.2.26`).

  </Step>

  <Step title="Onboarding abschließen">
    Das Setup-Skript führt das Onboarding automatisch aus. Es wird:

    - nach Provider-API-Schlüsseln fragen
    - ein Gateway-Token generieren und in `.env` schreiben
    - den Gateway über Docker Compose starten

    Während des Setups laufen Pre-Start-Onboarding und Konfigurationsschreibvorgänge direkt über
    `openclaw-gateway`. `openclaw-cli` ist für Befehle gedacht, die Sie ausführen, nachdem
    der Gateway-Container bereits existiert.

  </Step>

  <Step title="Control UI öffnen">
    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser und fügen Sie das konfigurierte
    gemeinsame Secret in den Einstellungen ein. Das Setup-Skript schreibt standardmäßig ein Token in `.env`;
    wenn Sie die Container-Konfiguration auf Passwortauthentifizierung umstellen, verwenden Sie stattdessen
    dieses Passwort.

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

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord)

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
binden Sie es mit `-f docker-compose.yml -f docker-compose.extra.yml` ein.
</Note>

<Note>
Da `openclaw-cli` den Netzwerk-Namespace von `openclaw-gateway` teilt, ist es ein
Post-Start-Tool. Führen Sie vor `docker compose up -d openclaw-gateway` das Onboarding
und Konfigurationsschreibvorgänge zur Setup-Zeit über `openclaw-gateway` mit
`--no-deps --entrypoint node` aus.
</Note>

### Umgebungsvariablen

Das Setup-Skript akzeptiert diese optionalen Umgebungsvariablen:

| Variable                                   | Zweck                                                           |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Ein Remote-Image verwenden, statt lokal zu bauen                |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Zusätzliche apt-Pakete während des Builds installieren (durch Leerzeichen getrennt) |
| `OPENCLAW_EXTENSIONS`                      | Ausgewählte gebündelte Plugin-Helfer zur Build-Zeit einschließen |
| `OPENCLAW_EXTRA_MOUNTS`                    | Zusätzliche Host-Bind-Mounts (durch Kommas getrenntes `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` in einem benannten Docker-Volume persistieren      |
| `OPENCLAW_SANDBOX`                         | Sandbox-Bootstrap aktivieren (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_SKIP_ONBOARDING`                 | Den interaktiven Onboarding-Schritt überspringen (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker-Socket-Pfad überschreiben                                |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour-/mDNS-Ankündigung deaktivieren (für Docker standardmäßig `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Bind-Mount-Overlays für gebündelte Plugin-Quellen deaktivieren  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Gemeinsamer OTLP/HTTP-Collector-Endpunkt für OpenTelemetry-Export |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Signalspezifische OTLP-Endpunkte für Traces, Metriken oder Logs |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP-Protokollüberschreibung. Heute wird nur `http/protobuf` unterstützt |
| `OTEL_SERVICE_NAME`                        | Dienstname, der für OpenTelemetry-Ressourcen verwendet wird     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Aktuelle experimentelle semantische GenAI-Attribute aktivieren  |
| `OPENCLAW_OTEL_PRELOADED`                  | Start eines zweiten OpenTelemetry SDK überspringen, wenn bereits eines vorgeladen ist |

Maintainer können gebündelte Plugin-Quellen gegen ein paketiertes Image testen, indem sie
ein Plugin-Quellverzeichnis über dessen paketierten Quellpfad mounten, zum Beispiel
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Dieses gemountete Quellverzeichnis überschreibt das passende kompilierte
`/app/dist/extensions/synology-chat`-Bundle für dieselbe Plugin-ID.

### Beobachtbarkeit

OpenTelemetry-Export läuft ausgehend vom Gateway-Container zu Ihrem OTLP-
Collector. Er erfordert keinen veröffentlichten Docker-Port. Wenn Sie das Image
lokal bauen und den gebündelten OpenTelemetry-Exporter im Image verfügbar machen möchten,
schließen Sie dessen Runtime-Abhängigkeiten ein:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Installieren Sie das offizielle Plugin `@openclaw/diagnostics-otel` aus ClawHub in
paketierten Docker-Installationen, bevor Sie den Export aktivieren. Benutzerdefinierte, aus Quellen gebaute Images können
weiterhin die lokale Plugin-Quelle mit
`OPENCLAW_EXTENSIONS=diagnostics-otel` einschließen. Um den Export zu aktivieren, erlauben und aktivieren Sie das
Plugin `diagnostics-otel` in der Konfiguration und setzen Sie dann
`diagnostics.otel.enabled=true` oder verwenden Sie das Konfigurationsbeispiel unter [OpenTelemetry-
Export](/de/gateway/opentelemetry). Collector-Auth-Header werden über
`diagnostics.otel.headers` konfiguriert, nicht über Docker-Umgebungsvariablen.

Prometheus-Metriken verwenden den bereits veröffentlichten Gateway-Port. Installieren Sie
`clawhub:@openclaw/diagnostics-prometheus`, aktivieren Sie das
Plugin `diagnostics-prometheus` und scrapen Sie dann:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Die Route ist durch Gateway-Authentifizierung geschützt. Legen Sie keinen separaten
öffentlichen `/metrics`-Port und keinen nicht authentifizierten Reverse-Proxy-Pfad offen. Siehe
[Prometheus-Metriken](/de/gateway/prometheus).

### Integritätsprüfungen

Container-Probe-Endpunkte (keine Authentifizierung erforderlich):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Das Docker-Image enthält einen integrierten `HEALTHCHECK`, der `/healthz` anpingt.
Wenn Prüfungen weiter fehlschlagen, markiert Docker den Container als `unhealthy` und
Orchestrierungssysteme können ihn neu starten oder ersetzen.

Authentifizierter tiefer Integritäts-Snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs. loopback

`scripts/docker/setup.sh` setzt standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, sodass Host-Zugriff auf
`http://127.0.0.1:18789` mit Docker-Port-Veröffentlichung funktioniert.

- `lan` (Standard): Host-Browser und Host-CLI können den veröffentlichten Gateway-Port erreichen.
- `loopback`: Nur Prozesse innerhalb des Container-Netzwerk-Namespace können den
  Gateway direkt erreichen.

<Note>
Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), keine Host-Aliasse wie `0.0.0.0` oder `127.0.0.1`.
</Note>

### Lokale Host-Provider

Wenn OpenClaw in Docker läuft, ist `127.0.0.1` innerhalb des Containers der Container
selbst, nicht Ihre Host-Maschine. Verwenden Sie `host.docker.internal` für KI-Provider, die
auf dem Host laufen:

| Provider  | Standard-Host-URL        | Docker-Setup-URL                  |
| --------- | ------------------------ | --------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Das gebündelte Docker-Setup verwendet diese Host-URLs als Onboarding-Standards für LM Studio und Ollama,
und `docker-compose.yml` ordnet `host.docker.internal` dem Host-Gateway von Docker für Linux Docker Engine zu.
Docker Desktop stellt denselben Hostnamen auf macOS und Windows bereits bereit.

Host-Dienste müssen außerdem an einer Adresse lauschen, die von Docker aus erreichbar ist:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Wenn Sie Ihre eigene Compose-Datei oder Ihren eigenen `docker run`-Befehl verwenden, fügen Sie dieselbe Host-
Zuordnung selbst hinzu, zum Beispiel
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker-Bridge-Networking leitet Bonjour-/mDNS-Multicast
(`224.0.0.251:5353`) normalerweise nicht zuverlässig weiter. Das gebündelte Compose-Setup setzt daher standardmäßig
`OPENCLAW_DISABLE_BONJOUR=1`, damit der Gateway nicht in eine Crash-Loop gerät oder wiederholt
die Ankündigung neu startet, wenn die Bridge Multicast-Verkehr verwirft.

Verwenden Sie die veröffentlichte Gateway-URL, Tailscale oder Wide-Area-DNS-SD für Docker-Hosts.
Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur, wenn Sie mit Host-Networking, macvlan
oder einem anderen Netzwerk arbeiten, in dem mDNS-Multicast nachweislich funktioniert.

Gotchas und Fehlerbehebung finden Sie unter [Bonjour-Erkennung](/de/gateway/bonjour).

### Speicher und Persistenz

Docker Compose bind-mountet `OPENCLAW_CONFIG_DIR` nach `/home/node/.openclaw` und
`OPENCLAW_WORKSPACE_DIR` nach `/home/node/.openclaw/workspace`, sodass diese Pfade
Container-Ersetzungen überstehen. Wenn eine der Variablen nicht gesetzt ist, fällt die gebündelte
`docker-compose.yml` auf `${HOME}/.openclaw` (und
`${HOME}/.openclaw/workspace` für den Workspace-Mount) zurück, oder auf `/tmp/.openclaw`,
wenn auch `HOME` selbst fehlt. Dadurch verhindert `docker compose up`,
dass in einfachen Umgebungen eine Volume-Spezifikation mit leerer Quelle ausgegeben wird.

In diesem gemounteten Konfigurationsverzeichnis speichert OpenClaw:

- `openclaw.json` für Verhaltenskonfiguration
- `agents/<agentId>/agent/auth-profiles.json` für gespeicherte Provider-OAuth-/API-Schlüssel-Authentifizierung
- `.env` für umgebungsbasierte Runtime-Secrets wie `OPENCLAW_GATEWAY_TOKEN`

Installierte herunterladbare Plugins speichern ihren Paketstatus im gemounteten
OpenClaw-Home, sodass Plugin-Installationsdatensätze und Paket-Roots Container-
Ersetzungen überstehen. Der Gateway-Start generiert keine Abhängigkeitsbäume für gebündelte Plugins.

Vollständige Persistenzdetails zu VM-Deployments finden Sie unter
[Docker-VM-Runtime - Was wo persistiert](/de/install/docker-vm-runtime#what-persists-where).

**Hotspots für Speicherwachstum:** Achten Sie auf `media/`, JSONL-Sitzungsdateien,
`cron/runs/*.jsonl`, installierte Plugin-Paketwurzeln und rotierende Dateilogs
unter `/tmp/openclaw/`.

### Shell-Helfer (optional)

Installieren Sie `ClawDock` für eine einfachere tägliche Docker-Verwaltung:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock über den älteren Raw-Pfad `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, führen Sie den obigen Installationsbefehl erneut aus, damit Ihre lokale Hilfsdatei dem neuen Speicherort folgt.

Verwenden Sie anschließend `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` usw. Führen Sie
`clawdock-help` aus, um alle Befehle anzuzeigen.
Siehe [ClawDock](/de/install/clawdock) für die vollständige Anleitung zu den Helfern.

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

    Das Skript bindet `docker.sock` erst ein, nachdem die Sandbox-Voraussetzungen erfüllt sind. Wenn
    die Sandbox-Einrichtung nicht abgeschlossen werden kann, setzt das Skript `agents.defaults.sandbox.mode`
    auf `off` zurück.

  </Accordion>

  <Accordion title="Automatisierung / CI (nicht interaktiv)">
    Deaktivieren Sie die Compose-Pseudo-TTY-Zuweisung mit `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Sicherheitshinweis für gemeinsam genutzte Netzwerke">
    `openclaw-cli` verwendet `network_mode: "service:openclaw-gateway"`, damit CLI
    Befehle den Gateway über `127.0.0.1` erreichen können. Behandeln Sie dies als gemeinsame
    Vertrauensgrenze. Die Compose-Konfiguration entfernt `NET_RAW`/`NET_ADMIN` und aktiviert
    `no-new-privileges` sowohl für `openclaw-gateway` als auch für `openclaw-cli`.
  </Accordion>

  <Accordion title="Berechtigungen und EACCES">
    Das Image läuft als `node` (uid 1000). Wenn Berechtigungsfehler für
    `/home/node/.openclaw` auftreten, stellen Sie sicher, dass Ihre Host-Bind-Mounts uid 1000 gehören:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Schnellere Neubuilds">
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
    Das Standard-Image priorisiert Sicherheit und läuft als nicht-root `node`. Für einen
    funktionsreicheren Container:

    1. **`/home/node` dauerhaft speichern**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **System-Dependencies einbacken**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright-Browser installieren**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Browser-Downloads dauerhaft speichern**: Setzen Sie
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` und verwenden Sie
       `OPENCLAW_HOME_VOLUME` oder `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Wenn Sie im Assistenten OpenAI Codex OAuth auswählen, wird eine Browser-URL geöffnet. Kopieren Sie in
    Docker- oder Headless-Setups die vollständige Redirect-URL, auf der Sie landen, und fügen Sie
    sie wieder in den Assistenten ein, um die Authentifizierung abzuschließen.
  </Accordion>

  <Accordion title="Metadaten des Basis-Images">
    Das Haupt-Docker-Runtime-Image verwendet `node:24-bookworm-slim` und veröffentlicht OCI
    Basis-Image-Annotationen einschließlich `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` und weiterer. Der Node-Basis-Digest wird
    über Dependabot-PRs für Docker-Basis-Images aktualisiert; Release-Builds führen keinen
    Distro-Upgrade-Layer aus. Siehe
    [OCI-Image-Annotationen](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Betrieb auf einem VPS?

Siehe [Hetzner (Docker VPS)](/de/install/hetzner) und
[Docker VM Runtime](/de/install/docker-vm-runtime) für Bereitstellungsschritte auf gemeinsam genutzten VMs
einschließlich Binary-Einbacken, Persistenz und Updates.

## Agent-Sandbox

Wenn `agents.defaults.sandbox` mit dem Docker-Backend aktiviert ist, führt der Gateway
die Agent-Tool-Ausführung (Shell, Datei lesen/schreiben usw.) in isolierten Docker
Containern aus, während der Gateway selbst auf dem Host bleibt. So erhalten Sie eine feste Grenze
um nicht vertrauenswürdige oder mandantenfähige Agent-Sitzungen, ohne den gesamten
Gateway zu containerisieren.

Der Sandbox-Umfang kann pro Agent (Standard), pro Sitzung oder gemeinsam sein. Jeder Umfang
erhält einen eigenen Arbeitsbereich, der unter `/workspace` eingebunden wird. Sie können außerdem
Allow-/Deny-Tool-Richtlinien, Netzwerkisolation, Ressourcenlimits und Browser
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

Bauen Sie das Standard-Sandbox-Image (aus einem Source-Checkout):

```bash
scripts/sandbox-setup.sh
```

Für npm-Installationen ohne Source-Checkout siehe [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) für Inline-`docker build`-Befehle.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Image fehlt oder Sandbox-Container startet nicht">
    Bauen Sie das Sandbox-Image mit
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (Source-Checkout) oder dem Inline-`docker build`-Befehl aus [Sandboxing § Images und Einrichtung](/de/gateway/sandboxing#images-and-setup) (npm-Installation),
    oder setzen Sie `agents.defaults.sandbox.docker.image` auf Ihr benutzerdefiniertes Image.
    Container werden bei Bedarf automatisch pro Sitzung erstellt.
  </Accordion>

  <Accordion title="Berechtigungsfehler in der Sandbox">
    Setzen Sie `docker.user` auf eine UID:GID, die zur Besitzstruktur Ihres eingebundenen Arbeitsbereichs passt,
    oder ändern Sie den Besitzer des Arbeitsbereichsordners mit chown.
  </Accordion>

  <Accordion title="Benutzerdefinierte Tools in der Sandbox nicht gefunden">
    OpenClaw führt Befehle mit `sh -lc` (Login-Shell) aus, wodurch
    `/etc/profile` geladen wird und PATH zurückgesetzt werden kann. Setzen Sie `docker.env.PATH`, um Ihre
    benutzerdefinierten Tool-Pfade voranzustellen, oder fügen Sie in Ihrem Dockerfile ein Skript unter `/etc/profile.d/` hinzu.
  </Accordion>

  <Accordion title="Während des Image-Builds durch OOM beendet (Exit 137)">
    Die VM benötigt mindestens 2 GB RAM. Verwenden Sie eine größere Maschinenklasse und versuchen Sie es erneut.
  </Accordion>

  <Accordion title="Nicht autorisiert oder Pairing in der Control UI erforderlich">
    Rufen Sie einen frischen Dashboard-Link ab und genehmigen Sie das Browser-Gerät:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mehr Details: [Dashboard](/de/web/dashboard), [Geräte](/de/cli/devices).

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
- [Aktualisieren](/de/install/updating) — OpenClaw aktuell halten
- [Konfiguration](/de/gateway/configuration) — Gateway-Konfiguration nach der Installation
