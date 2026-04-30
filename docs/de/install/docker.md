---
read_when:
    - Sie möchten ein containerisiertes Gateway statt lokaler Installationen
    - Sie validieren den Docker-Ablauf
summary: Optionales Docker-basiertes Setup und Onboarding für OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-30T06:59:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker ist **optional**. Verwenden Sie es nur, wenn Sie ein containerisiertes Gateway möchten oder den Docker-Ablauf validieren wollen.

## Ist Docker das Richtige für mich?

- **Ja**: Sie möchten eine isolierte, wegwerfbare Gateway-Umgebung oder OpenClaw auf einem Host ohne lokale Installationen ausführen.
- **Nein**: Sie führen es auf Ihrem eigenen Rechner aus und möchten nur den schnellsten Entwicklungsloop. Verwenden Sie stattdessen den normalen Installationsablauf.
- **Sandboxing-Hinweis**: Das Standard-Sandbox-Backend verwendet Docker, wenn Sandboxing aktiviert ist, aber Sandboxing ist standardmäßig deaktiviert und erfordert **nicht**, dass das vollständige Gateway in Docker ausgeführt wird. SSH- und OpenShell-Sandbox-Backends sind ebenfalls verfügbar. Siehe [Sandboxing](/de/gateway/sandboxing).

## Voraussetzungen

- Docker Desktop (oder Docker Engine) + Docker Compose v2
- Mindestens 2 GB RAM für den Image-Build (`pnpm install` kann auf Hosts mit 1 GB mit Exit 137 wegen OOM beendet werden)
- Ausreichend Speicherplatz für Images und Protokolle
- Wenn Sie auf einem VPS/öffentlichen Host ausführen, lesen Sie
  [Sicherheits-Härtung für Netzwerkexposition](/de/gateway/security),
  insbesondere die Docker-Firewall-Richtlinie `DOCKER-USER`.

## Containerisiertes Gateway

<Steps>
  <Step title="Image erstellen">
    Führen Sie im Repo-Root das Setup-Skript aus:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Dadurch wird das Gateway-Image lokal erstellt. Um stattdessen ein vorab erstelltes Image zu verwenden:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Vorab erstellte Images werden in der
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) veröffentlicht.
    Übliche Tags: `main`, `latest`, `<version>` (z. B. `2026.2.26`).

  </Step>

  <Step title="Onboarding abschließen">
    Das Setup-Skript führt das Onboarding automatisch aus. Es wird:

    - nach Provider-API-Schlüsseln fragen
    - ein Gateway-Token generieren und in `.env` schreiben
    - das Gateway über Docker Compose starten

    Während des Setups laufen Pre-Start-Onboarding und Konfigurationsschreibvorgänge direkt über
    `openclaw-gateway`. `openclaw-cli` ist für Befehle gedacht, die Sie ausführen, nachdem
    der Gateway-Container bereits existiert.

  </Step>

  <Step title="Control UI öffnen">
    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser und fügen Sie das konfigurierte
    Shared Secret in den Einstellungen ein. Das Setup-Skript schreibt standardmäßig ein Token nach `.env`;
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
binden Sie sie mit `-f docker-compose.yml -f docker-compose.extra.yml` ein.
</Note>

<Note>
Da `openclaw-cli` den Netzwerk-Namespace von `openclaw-gateway` teilt, ist es ein
Post-Start-Tool. Führen Sie vor `docker compose up -d openclaw-gateway` Onboarding
und Konfigurationsschreibvorgänge zur Setup-Zeit über `openclaw-gateway` mit
`--no-deps --entrypoint node` aus.
</Note>

### Umgebungsvariablen

Das Setup-Skript akzeptiert diese optionalen Umgebungsvariablen:

| Variable                                   | Zweck                                                           |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Ein Remote-Image verwenden, statt lokal zu bauen                |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Zusätzliche apt-Pakete während des Builds installieren (durch Leerzeichen getrennt) |
| `OPENCLAW_EXTENSIONS`                      | Plugin-Abhängigkeiten zur Build-Zeit vorinstallieren (durch Leerzeichen getrennte Namen) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Zusätzliche Host-Bind-Mounts (durch Kommas getrenntes `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` in einem benannten Docker-Volume persistieren      |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | Container-Pfad für generierte gebündelte Plugin-Abhängigkeiten und Mirrors |
| `OPENCLAW_SANDBOX`                         | Sandbox-Bootstrap aktivieren (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_SKIP_ONBOARDING`                 | Den interaktiven Onboarding-Schritt überspringen (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker-Socket-Pfad überschreiben                                |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour-/mDNS-Advertising deaktivieren (Standard ist `1` für Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Bind-Mount-Overlays für gebündelte Plugin-Quellen deaktivieren  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Gemeinsamer OTLP/HTTP-Collector-Endpunkt für OpenTelemetry-Export |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Signalspezifische OTLP-Endpunkte für Traces, Metriken oder Protokolle |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP-Protokollüberschreibung. Heute wird nur `http/protobuf` unterstützt |
| `OTEL_SERVICE_NAME`                        | Dienstname, der für OpenTelemetry-Ressourcen verwendet wird     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Aktuelle experimentelle semantische GenAI-Attribute aktivieren  |
| `OPENCLAW_OTEL_PRELOADED`                  | Starten eines zweiten OpenTelemetry SDK überspringen, wenn bereits eines vorgeladen ist |

Maintainer können die Quelle gebündelter Plugins gegen ein paketiertes Image testen, indem sie
ein Plugin-Quellverzeichnis über dessen paketierten Quellpfad mounten, zum Beispiel
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Dieses gemountete Quellverzeichnis überschreibt das passende kompilierte
`/app/dist/extensions/synology-chat`-Bundle für dieselbe Plugin-ID.

### Observability

OpenTelemetry-Export erfolgt ausgehend vom Gateway-Container zu Ihrem OTLP-
Collector. Dafür ist kein veröffentlichter Docker-Port erforderlich. Wenn Sie das Image
lokal bauen und den gebündelten OpenTelemetry-Exporter im Image verfügbar haben möchten,
fügen Sie dessen Runtime-Abhängigkeiten hinzu:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Das offizielle OpenClaw-Docker-Release-Image enthält die gebündelte
`diagnostics-otel`-Plugin-Quelle. Je nach Image- und Cache-Zustand kann das
Gateway beim ersten Aktivieren des Plugins dennoch Plugin-lokale OpenTelemetry-Runtime-Abhängigkeiten
stagen. Lassen Sie daher den ersten Start die Paket-Registry erreichen oder wärmen Sie das Image
in Ihrer Release-Lane vor. Um den Export zu aktivieren, erlauben und aktivieren Sie das
`diagnostics-otel`-Plugin in der Konfiguration und setzen Sie dann
`diagnostics.otel.enabled=true` oder verwenden Sie das Konfigurationsbeispiel in
[OpenTelemetry-Export](/de/gateway/opentelemetry). Collector-Auth-Header werden über
`diagnostics.otel.headers` konfiguriert, nicht über Docker-Umgebungsvariablen.

Prometheus-Metriken verwenden den bereits veröffentlichten Gateway-Port. Aktivieren Sie das
`diagnostics-prometheus`-Plugin und scrapen Sie dann:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Die Route ist durch Gateway-Authentifizierung geschützt. Stellen Sie keinen separaten
öffentlichen `/metrics`-Port oder nicht authentifizierten Reverse-Proxy-Pfad bereit. Siehe
[Prometheus-Metriken](/de/gateway/prometheus).

### Health Checks

Container-Probe-Endpunkte (keine Authentifizierung erforderlich):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Das Docker-Image enthält einen integrierten `HEALTHCHECK`, der `/healthz` pingt.
Wenn Prüfungen weiter fehlschlagen, markiert Docker den Container als `unhealthy`, und
Orchestrierungssysteme können ihn neu starten oder ersetzen.

Authentifizierter tiefer Health-Snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs. loopback

`scripts/docker/setup.sh` setzt standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, damit Host-Zugriff auf
`http://127.0.0.1:18789` mit Docker-Portveröffentlichung funktioniert.

- `lan` (Standard): Host-Browser und Host-CLI können den veröffentlichten Gateway-Port erreichen.
- `loopback`: Nur Prozesse innerhalb des Container-Netzwerk-Namespace können das
  Gateway direkt erreichen.

<Note>
Verwenden Sie Bind-Moduswerte in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), nicht Host-Aliasse wie `0.0.0.0` oder `127.0.0.1`.
</Note>

### Host Local Providers

Wenn OpenClaw in Docker ausgeführt wird, ist `127.0.0.1` innerhalb des Containers der Container
selbst, nicht Ihre Host-Maschine. Verwenden Sie `host.docker.internal` für AI-Provider, die
auf dem Host laufen:

| Provider  | Host-Standard-URL        | Docker-Setup-URL                   |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Das gebündelte Docker-Setup verwendet diese Host-URLs als Onboarding-Standards für LM Studio und Ollama,
und `docker-compose.yml` ordnet `host.docker.internal` dem Host-Gateway von Docker für Linux Docker Engine zu.
Docker Desktop stellt denselben Hostnamen auf macOS und Windows bereits bereit.

Host-Dienste müssen außerdem auf einer Adresse lauschen, die von Docker aus erreichbar ist:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Wenn Sie Ihre eigene Compose-Datei oder Ihren eigenen `docker run`-Befehl verwenden, fügen Sie dieselbe Host-
Zuordnung selbst hinzu, zum Beispiel
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker-Bridge-Networking leitet Bonjour/mDNS-Multicast
(`224.0.0.251:5353`) normalerweise nicht zuverlässig weiter. Das gebündelte Compose-Setup setzt daher standardmäßig
`OPENCLAW_DISABLE_BONJOUR=1`, damit das Gateway nicht in einer Crash-Schleife landet oder das Advertising wiederholt
neu startet, wenn die Bridge Multicast-Verkehr verwirft.

Verwenden Sie die veröffentlichte Gateway-URL, Tailscale oder Wide-Area-DNS-SD für Docker-Hosts.
Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur, wenn Sie mit Host-Networking, macvlan
oder einem anderen Netzwerk ausführen, in dem mDNS-Multicast nachweislich funktioniert.

Gotchas und Fehlerbehebung finden Sie unter [Bonjour-Erkennung](/de/gateway/bonjour).

### Speicher und Persistenz

Docker Compose bind-mountet `OPENCLAW_CONFIG_DIR` nach `/home/node/.openclaw` und
`OPENCLAW_WORKSPACE_DIR` nach `/home/node/.openclaw/workspace`, sodass diese Pfade
einen Container-Ersatz überdauern. Wenn eine der Variablen nicht gesetzt ist, fällt das gebündelte
`docker-compose.yml` auf `${HOME}/.openclaw` zurück (und
`${HOME}/.openclaw/workspace` für den Workspace-Mount), oder auf `/tmp/.openclaw`,
wenn `HOME` selbst ebenfalls fehlt. Dadurch wird verhindert, dass `docker compose up`
in minimalen Umgebungen eine Volume-Spezifikation mit leerer Quelle ausgibt.

In diesem gemounteten Konfigurationsverzeichnis speichert OpenClaw:

- `openclaw.json` für Verhaltenskonfiguration
- `agents/<agentId>/agent/auth-profiles.json` für gespeicherte Provider-OAuth-/API-Key-Authentifizierung
- `.env` für env-gestützte Runtime-Secrets wie `OPENCLAW_GATEWAY_TOKEN`

Gebündelte Plugin-Laufzeitabhängigkeiten und gespiegelte Laufzeitdateien sind generierter Zustand, keine Benutzerkonfiguration. Compose speichert sie im benannten Docker-Volume `openclaw-plugin-runtime-deps`, das unter `/var/lib/openclaw/plugin-runtime-deps` eingehängt ist. Wenn dieser häufig geänderte Baum außerhalb des Host-Konfigurations-Bind-Mounts bleibt, werden langsame Docker Desktop/WSL-Dateivorgänge und veraltete Windows-Handles beim Kaltstart des Gateway vermieden.

Die standardmäßige Compose-Datei setzt `OPENCLAW_PLUGIN_STAGE_DIR` für sowohl `openclaw-gateway` als auch `openclaw-cli` auf diesen Pfad, sodass `openclaw doctor --fix`, Kanal-Anmelde-/Einrichtungsbefehle und der Gateway-Start alle dasselbe generierte Laufzeit-Volume verwenden.

Vollständige Persistenzdetails für VM-Bereitstellungen finden Sie unter
[Docker-VM-Laufzeit - Was wo bestehen bleibt](/de/install/docker-vm-runtime#what-persists-where).

**Hotspots für Festplattenwachstum:** Beobachten Sie `media/`, Sitzungs-JSONL-Dateien, `cron/runs/*.jsonl`, das Docker-Volume `openclaw-plugin-runtime-deps` und rotierende Dateiprotokolle unter `/tmp/openclaw/`.

### Shell-Helfer (optional)

Für eine einfachere tägliche Docker-Verwaltung installieren Sie `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock über den älteren Raw-Pfad `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, führen Sie den Installationsbefehl oben erneut aus, damit Ihre lokale Helferdatei dem neuen Speicherort folgt.

Verwenden Sie anschließend `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` usw. Führen Sie
`clawdock-help` für alle Befehle aus.
Die vollständige Anleitung für die Helfer finden Sie unter [ClawDock](/de/install/clawdock).

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

    Das Skript hängt `docker.sock` erst ein, nachdem die Sandbox-Voraussetzungen erfüllt sind. Wenn die Sandbox-Einrichtung nicht abgeschlossen werden kann, setzt das Skript `agents.defaults.sandbox.mode` auf `off` zurück.

  </Accordion>

  <Accordion title="Automatisierung / CI (nicht interaktiv)">
    Deaktivieren Sie die Compose-Pseudo-TTY-Zuweisung mit `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Sicherheitshinweis zu gemeinsamem Netzwerk">
    `openclaw-cli` verwendet `network_mode: "service:openclaw-gateway"`, damit CLI-Befehle das Gateway über `127.0.0.1` erreichen können. Behandeln Sie dies als gemeinsame Vertrauensgrenze. Die Compose-Konfiguration entfernt `NET_RAW`/`NET_ADMIN` und aktiviert `no-new-privileges` für `openclaw-cli`.
  </Accordion>

  <Accordion title="Berechtigungen und EACCES">
    Das Image läuft als `node` (uid 1000). Wenn Berechtigungsfehler bei `/home/node/.openclaw` auftreten, stellen Sie sicher, dass Ihre Host-Bind-Mounts uid 1000 gehören:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Schnellere Rebuilds">
    Ordnen Sie Ihr Dockerfile so an, dass Abhängigkeitsschichten zwischengespeichert werden. Dadurch wird vermieden, dass `pnpm install` erneut ausgeführt wird, sofern sich Lockfiles nicht ändern:

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
    Das Standard-Image priorisiert Sicherheit und läuft als nicht-root `node`. Für einen Container mit mehr Funktionen:

    1. **`/home/node` dauerhaft speichern**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Systemabhängigkeiten einbacken**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
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
    Wenn Sie OpenAI Codex OAuth im Assistenten auswählen, wird eine Browser-URL geöffnet. Kopieren Sie in Docker- oder Headless-Setups die vollständige Weiterleitungs-URL, auf der Sie landen, und fügen Sie sie wieder in den Assistenten ein, um die Authentifizierung abzuschließen.
  </Accordion>

  <Accordion title="Metadaten des Basis-Images">
    Das Haupt-Docker-Laufzeit-Image verwendet `node:24-bookworm-slim` und veröffentlicht OCI-Basis-Image-Annotationen einschließlich `org.opencontainers.image.base.name`, `org.opencontainers.image.source` und weiteren. Der Node-Basis-Digest wird über Dependabot-PRs für Docker-Basis-Images aktualisiert; Release-Builds führen keine Distro-Upgrade-Schicht aus. Siehe
    [OCI-Image-Annotationen](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Ausführung auf einem VPS?

Siehe [Hetzner (Docker-VPS)](/de/install/hetzner) und
[Docker-VM-Laufzeit](/de/install/docker-vm-runtime) für gemeinsame VM-Bereitstellungsschritte einschließlich Einbacken von Binärdateien, Persistenz und Updates.

## Agent-Sandbox

Wenn `agents.defaults.sandbox` mit dem Docker-Backend aktiviert ist, führt das Gateway die Ausführung von Agent-Tools (Shell, Lesen/Schreiben von Dateien usw.) in isolierten Docker-Containern aus, während das Gateway selbst auf dem Host bleibt. Dadurch erhalten Sie eine harte Abgrenzung um nicht vertrauenswürdige oder mandantenfähige Agent-Sitzungen, ohne das gesamte Gateway zu containerisieren.

Der Sandbox-Geltungsbereich kann pro Agent (Standard), pro Sitzung oder gemeinsam sein. Jeder Geltungsbereich erhält seinen eigenen Arbeitsbereich, der unter `/workspace` eingehängt ist. Sie können außerdem Allow-/Deny-Tool-Richtlinien, Netzwerkisolierung, Ressourcenlimits und Browser-Container konfigurieren.

Die vollständige Konfiguration, Images, Sicherheitshinweise und Multi-Agent-Profile finden Sie unter:

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz
- [OpenShell](/de/gateway/openshell) -- interaktiver Shell-Zugriff auf Sandbox-Container
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) -- agentenspezifische Überschreibungen

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

Erstellen Sie das standardmäßige Sandbox-Image:

```bash
scripts/sandbox-setup.sh
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Image fehlt oder Sandbox-Container startet nicht">
    Erstellen Sie das Sandbox-Image mit
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    oder setzen Sie `agents.defaults.sandbox.docker.image` auf Ihr benutzerdefiniertes Image.
    Container werden bei Bedarf automatisch pro Sitzung erstellt.
  </Accordion>

  <Accordion title="Berechtigungsfehler in der Sandbox">
    Setzen Sie `docker.user` auf eine UID:GID, die zur Eigentümerschaft Ihres eingehängten Arbeitsbereichs passt, oder ändern Sie den Eigentümer des Arbeitsbereichsordners mit chown.
  </Accordion>

  <Accordion title="Benutzerdefinierte Tools in der Sandbox nicht gefunden">
    OpenClaw führt Befehle mit `sh -lc` (Login-Shell) aus, wodurch `/etc/profile` geladen und PATH möglicherweise zurückgesetzt wird. Setzen Sie `docker.env.PATH`, um Ihre benutzerdefinierten Tool-Pfade voranzustellen, oder fügen Sie in Ihrem Dockerfile ein Skript unter `/etc/profile.d/` hinzu.
  </Accordion>

  <Accordion title="Während des Image-Builds per OOM beendet (Exit 137)">
    Die VM benötigt mindestens 2 GB RAM. Verwenden Sie eine größere Maschinenklasse und versuchen Sie es erneut.
  </Accordion>

  <Accordion title="Nicht autorisiert oder Kopplung in Control UI erforderlich">
    Rufen Sie einen neuen Dashboard-Link ab und genehmigen Sie das Browser-Gerät:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Weitere Details: [Dashboard](/de/web/dashboard), [Geräte](/de/cli/devices).

  </Accordion>

  <Accordion title="Gateway-Ziel zeigt ws://172.x.x.x oder Kopplungsfehler von der Docker-CLI">
    Setzen Sie Gateway-Modus und Bind zurück:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Installationsübersicht](/de/install) — alle Installationsmethoden
- [Podman](/de/install/podman) — Podman-Alternative zu Docker
- [ClawDock](/de/install/clawdock) — Community-Einrichtung mit Docker Compose
- [Aktualisierung](/de/install/updating) — OpenClaw aktuell halten
- [Konfiguration](/de/gateway/configuration) — Gateway-Konfiguration nach der Installation
