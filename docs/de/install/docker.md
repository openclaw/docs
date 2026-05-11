---
read_when:
    - Sie möchten ein containerisiertes Gateway statt lokaler Installationen
    - Sie validieren den Docker-Ablauf
summary: Optionale Docker-basierte Einrichtung und Onboarding für OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-11T20:32:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73e7f028708f6455b21aa38adf9dcd833bf6bc169d5405d32faa42641186b4a0
    source_path: install/docker.md
    workflow: 16
---

Docker ist **optional**. Verwenden Sie es nur, wenn Sie ein containerisiertes Gateway nutzen oder den Docker-Ablauf validieren möchten.

## Ist Docker das Richtige für mich?

- **Ja**: Sie möchten eine isolierte, wegwerfbare Gateway-Umgebung oder OpenClaw auf einem Host ohne lokale Installationen ausführen.
- **Nein**: Sie führen es auf Ihrer eigenen Maschine aus und möchten nur den schnellsten Entwicklungsloop. Verwenden Sie stattdessen den normalen Installationsablauf.
- **Hinweis zum Sandboxing**: Das Standard-Sandbox-Backend verwendet Docker, wenn Sandboxing aktiviert ist, aber Sandboxing ist standardmäßig deaktiviert und erfordert **nicht**, dass das vollständige Gateway in Docker ausgeführt wird. SSH- und OpenShell-Sandbox-Backends sind ebenfalls verfügbar. Siehe [Sandboxing](/de/gateway/sandboxing).

## Voraussetzungen

- Docker Desktop (oder Docker Engine) + Docker Compose v2
- Mindestens 2 GB RAM für den Image-Build (`pnpm install` kann auf Hosts mit 1 GB und Exit 137 wegen OOM beendet werden)
- Ausreichend Speicherplatz für Images und Logs
- Wenn Sie auf einem VPS/öffentlichen Host ausführen, prüfen Sie
  [Security-Hardening für Netzwerkzugriff](/de/gateway/security),
  insbesondere die Docker-Firewall-Richtlinie `DOCKER-USER`.

## Containerisiertes Gateway

<Steps>
  <Step title="Image bauen">
    Führen Sie im Repo-Root das Setup-Skript aus:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Dies baut das Gateway-Image lokal. Um stattdessen ein vorgebautes Image zu verwenden:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Vorgebaute Images werden in der
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    veröffentlicht. Häufige Tags: `main`, `latest`, `<version>` (z. B. `2026.2.26`).

  </Step>

  <Step title="Onboarding abschließen">
    Das Setup-Skript führt das Onboarding automatisch aus. Es wird:

    - nach Provider-API-Schlüsseln fragen
    - ein Gateway-Token generieren und in `.env` schreiben
    - das Gateway über Docker Compose starten

    Während des Setups laufen Onboarding vor dem Start und Konfigurationsschreibvorgänge direkt über
    `openclaw-gateway`. `openclaw-cli` ist für Befehle gedacht, die Sie ausführen, nachdem
    der Gateway-Container bereits existiert.

  </Step>

  <Step title="Control UI öffnen">
    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser und fügen Sie das konfigurierte
    gemeinsame Secret in den Einstellungen ein. Das Setup-Skript schreibt standardmäßig
    ein Token in `.env`; wenn Sie die Containerkonfiguration auf Passwortauthentifizierung umstellen,
    verwenden Sie stattdessen dieses Passwort.

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
Führen Sie `docker compose` vom Repo-Root aus. Wenn Sie `OPENCLAW_EXTRA_MOUNTS`
oder `OPENCLAW_HOME_VOLUME` aktiviert haben, schreibt das Setup-Skript `docker-compose.extra.yml`;
binden Sie es mit `-f docker-compose.yml -f docker-compose.extra.yml` ein.
</Note>

<Note>
Da `openclaw-cli` den Netzwerk-Namespace von `openclaw-gateway` teilt, ist es ein
Tool nach dem Start. Führen Sie vor `docker compose up -d openclaw-gateway` das Onboarding
und Konfigurationsschreibvorgänge während des Setups über `openclaw-gateway` mit
`--no-deps --entrypoint node` aus.
</Note>

### Umgebungsvariablen

Das Setup-Skript akzeptiert diese optionalen Umgebungsvariablen:

| Variable                                   | Zweck                                                             |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Ein Remote-Image verwenden, statt lokal zu bauen                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Zusätzliche apt-Pakete während des Builds installieren (leerzeichengetrennt) |
| `OPENCLAW_EXTENSIONS`                      | Ausgewählte gebündelte Plugin-Helfer zur Build-Zeit einbeziehen   |
| `OPENCLAW_EXTRA_MOUNTS`                    | Zusätzliche Host-Bind-Mounts (kommagetrennt `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` in einem benannten Docker-Volume persistieren        |
| `OPENCLAW_SANDBOX`                         | Sandbox-Bootstrap aktivieren (`1`, `true`, `yes`, `on`)           |
| `OPENCLAW_SKIP_ONBOARDING`                 | Den interaktiven Onboarding-Schritt überspringen (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker-Socket-Pfad überschreiben                                  |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS-Ankündigung deaktivieren (standardmäßig `1` für Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Bind-Mount-Overlays für gebündelte Plugin-Quellen deaktivieren    |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Gemeinsamer OTLP/HTTP-Collector-Endpunkt für OpenTelemetry-Export |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Signalspezifische OTLP-Endpunkte für Traces, Metriken oder Logs   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Überschreibung des OTLP-Protokolls. Derzeit wird nur `http/protobuf` unterstützt |
| `OTEL_SERVICE_NAME`                        | Dienstname für OpenTelemetry-Ressourcen                           |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Neueste experimentelle GenAI-Semantikattribute aktivieren         |
| `OPENCLAW_OTEL_PRELOADED`                  | Start eines zweiten OpenTelemetry-SDK überspringen, wenn eines vorgeladen ist |

Maintainer können gebündelte Plugin-Quellen gegen ein paketiertes Image testen, indem sie
ein Plugin-Quellverzeichnis über dessen paketierten Quellpfad mounten, zum Beispiel
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Dieses gemountete Quellverzeichnis überschreibt das passende kompilierte
`/app/dist/extensions/synology-chat`-Bundle für dieselbe Plugin-ID.

### Observability

OpenTelemetry-Export erfolgt ausgehend vom Gateway-Container zu Ihrem OTLP-Collector.
Dafür ist kein veröffentlichter Docker-Port erforderlich. Wenn Sie das Image
lokal bauen und den gebündelten OpenTelemetry-Exporter im Image verfügbar haben möchten,
beziehen Sie seine Laufzeitabhängigkeiten ein:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Installieren Sie das offizielle `@openclaw/diagnostics-otel`-Plugin aus ClawHub in
paketierten Docker-Installationen, bevor Sie den Export aktivieren. Eigene aus Quellen gebaute Images können
die lokale Plugin-Quelle weiterhin mit
`OPENCLAW_EXTENSIONS=diagnostics-otel` einbeziehen. Um den Export zu aktivieren, erlauben und aktivieren Sie das
`diagnostics-otel`-Plugin in der Konfiguration und setzen Sie dann
`diagnostics.otel.enabled=true` oder verwenden Sie das Konfigurationsbeispiel unter [OpenTelemetry-Export](/de/gateway/opentelemetry).
Collector-Auth-Header werden über
`diagnostics.otel.headers` konfiguriert, nicht über Docker-Umgebungsvariablen.

Prometheus-Metriken verwenden den bereits veröffentlichten Gateway-Port. Installieren Sie
`clawhub:@openclaw/diagnostics-prometheus`, aktivieren Sie das
`diagnostics-prometheus`-Plugin und scrapen Sie dann:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Die Route ist durch Gateway-Authentifizierung geschützt. Stellen Sie keinen separaten
öffentlichen `/metrics`-Port und keinen nicht authentifizierten Reverse-Proxy-Pfad bereit. Siehe
[Prometheus-Metriken](/de/gateway/prometheus).

### Health Checks

Container-Probe-Endpunkte (keine Authentifizierung erforderlich):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Das Docker-Image enthält einen integrierten `HEALTHCHECK`, der `/healthz` anpingt.
Wenn Checks weiterhin fehlschlagen, markiert Docker den Container als `unhealthy`, und
Orchestrierungssysteme können ihn neu starten oder ersetzen.

Authentifizierter Deep-Health-Snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs. Loopback

`scripts/docker/setup.sh` setzt standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, damit Host-Zugriff auf
`http://127.0.0.1:18789` mit Docker-Portveröffentlichung funktioniert.

- `lan` (Standard): Host-Browser und Host-CLI können den veröffentlichten Gateway-Port erreichen.
- `loopback`: Nur Prozesse innerhalb des Container-Netzwerk-Namespace können das
  Gateway direkt erreichen.

<Note>
Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), nicht Host-Aliase wie `0.0.0.0` oder `127.0.0.1`.
</Note>

### Lokale Provider auf dem Host

Wenn OpenClaw in Docker läuft, ist `127.0.0.1` innerhalb des Containers der Container
selbst, nicht Ihre Host-Maschine. Verwenden Sie `host.docker.internal` für KI-Provider, die
auf dem Host laufen:

| Provider  | Host-Standard-URL        | Docker-Setup-URL                   |
| --------- | ------------------------ | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Das gebündelte Docker-Setup verwendet diese Host-URLs als Onboarding-Standardwerte für LM Studio und Ollama,
und `docker-compose.yml` bildet `host.docker.internal` auf
Dockers Host-Gateway für Linux Docker Engine ab. Docker Desktop stellt auf macOS und Windows bereits
denselben Hostnamen bereit.

Host-Dienste müssen außerdem auf einer von Docker erreichbaren Adresse lauschen:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Wenn Sie Ihre eigene Compose-Datei oder einen eigenen `docker run`-Befehl verwenden, fügen Sie dieselbe Host-
Zuordnung selbst hinzu, zum Beispiel
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker-Bridge-Networking leitet Bonjour/mDNS-Multicast
(`224.0.0.251:5353`) in der Regel nicht zuverlässig weiter. Das gebündelte Compose-Setup setzt daher standardmäßig
`OPENCLAW_DISABLE_BONJOUR=1`, damit das Gateway nicht in einer Crash-Loop landet oder wiederholt
die Ankündigung neu startet, wenn die Bridge Multicast-Traffic verwirft.

Verwenden Sie die veröffentlichte Gateway-URL, Tailscale oder Wide-Area-DNS-SD für Docker-Hosts.
Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur, wenn Sie mit Host-Networking, macvlan
oder einem anderen Netzwerk ausführen, in dem mDNS-Multicast nachweislich funktioniert.

Hinweise zu Fallstricken und Fehlerbehebung finden Sie unter [Bonjour-Erkennung](/de/gateway/bonjour).

### Speicher und Persistenz

Docker Compose bind-mountet `OPENCLAW_CONFIG_DIR` nach `/home/node/.openclaw` und
`OPENCLAW_WORKSPACE_DIR` nach `/home/node/.openclaw/workspace`, sodass diese Pfade
Container-Ersetzungen überdauern. Wenn eine der Variablen nicht gesetzt ist, fällt das gebündelte
`docker-compose.yml` auf `${HOME}/.openclaw` (und
`${HOME}/.openclaw/workspace` für den Workspace-Mount) zurück, oder auf `/tmp/.openclaw`,
wenn `HOME` selbst ebenfalls fehlt. Dadurch wird verhindert, dass `docker compose up` in
minimalen Umgebungen eine Volume-Spezifikation mit leerer Quelle ausgibt.

In diesem gemounteten Konfigurationsverzeichnis speichert OpenClaw:

- `openclaw.json` für Verhaltenskonfiguration
- `agents/<agentId>/agent/auth-profiles.json` für gespeicherte OAuth-/API-Schlüssel-Authentifizierung von Providern
- `.env` für env-gestützte Laufzeit-Secrets wie `OPENCLAW_GATEWAY_TOKEN`

Installierte herunterladbare Plugins speichern ihren Paketstatus im gemounteten
OpenClaw-Home, sodass Plugin-Installationsdatensätze und Paket-Roots Container-Ersetzungen
überdauern. Der Gateway-Start erzeugt keine Abhängigkeitsbäume für gebündelte Plugins.

Vollständige Persistenzdetails für VM-Deployments finden Sie unter
[Docker-VM-Laufzeit - Was wo persistiert](/de/install/docker-vm-runtime#what-persists-where).

**Hotspots für Datenträgerwachstum:** Überwachen Sie `media/`, Sitzungs-JSONL-Dateien,
`cron/runs/*.jsonl`, installierte Plugin-Paket-Roots und rotierende Datei-Logs
unter `/tmp/openclaw/`.

### Shell-Helfer (optional)

Für einfacheres alltägliches Docker-Management installieren Sie `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock über den älteren Raw-Pfad `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, führen Sie den obigen Installationsbefehl erneut aus, damit Ihre lokale Helferdatei den neuen Speicherort verfolgt.

Verwenden Sie dann `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` usw. Führen Sie
`clawdock-help` für alle Befehle aus.
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
    auf `off` zurück. Codex-Code-Modus-Turns bleiben weiterhin auf Codex
    `workspace-write` beschränkt, während die OpenClaw-Sandbox aktiv ist; binden Sie den
    Host-Docker-Socket nicht in Agent-Sandbox-Container ein.

  </Accordion>

  <Accordion title="Automatisierung / CI (nicht interaktiv)">
    Deaktivieren Sie die Compose-Pseudo-TTY-Zuweisung mit `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Sicherheitshinweis zum gemeinsamen Netzwerk">
    `openclaw-cli` verwendet `network_mode: "service:openclaw-gateway"`, damit CLI-
    Befehle das Gateway über `127.0.0.1` erreichen können. Behandeln Sie dies als gemeinsame
    Vertrauensgrenze. Die Compose-Konfiguration entfernt `NET_RAW`/`NET_ADMIN` und aktiviert
    `no-new-privileges` sowohl für `openclaw-gateway` als auch für `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker-Desktop-DNS-Fehler in openclaw-cli">
    Einige Docker-Desktop-Setups schlagen bei DNS-Lookups vom Shared-Network-
    `openclaw-cli`-Sidecar fehl, nachdem `NET_RAW` entfernt wurde. Dies zeigt sich als
    `EAI_AGAIN` während npm-gestützter Befehle wie `openclaw plugins install`.
    Behalten Sie die standardmäßig gehärtete Compose-Datei für den normalen Gateway-Betrieb bei. Das
    lokale Override unten lockert die Sicherheitslage des CLI-Containers, indem
    Dockers Standard-Capabilities wiederhergestellt werden. Verwenden Sie es daher nur für den einmaligen CLI-
    Befehl, der Zugriff auf die Paket-Registry benötigt, nicht als Ihre standardmäßige Compose-
    Ausführung:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Wenn Sie bereits einen dauerhaft laufenden `openclaw-cli`-Container erstellt haben, erstellen Sie ihn
    mit demselben Override neu. `docker compose exec` und `docker exec` können
    Linux-Capabilities eines bereits erstellten Containers nicht ändern.

  </Accordion>

  <Accordion title="Berechtigungen und EACCES">
    Das Image läuft als `node` (uid 1000). Wenn Berechtigungsfehler auf
    `/home/node/.openclaw` auftreten, stellen Sie sicher, dass Ihre Host-Bind-Mounts uid 1000 gehören:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Dieselbe Abweichung kann als Plugin-Warnung erscheinen, etwa
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    gefolgt von `plugin present but blocked`. Das bedeutet, dass Prozess-uid und Eigentümer des
    eingebundenen Plugin-Verzeichnisses nicht übereinstimmen. Führen Sie den Container vorzugsweise mit der
    Standard-uid 1000 aus und korrigieren Sie die Eigentümerschaft des Bind-Mounts. Führen Sie `chown`
    für `/path/to/openclaw-config/npm` nur dann auf `root:root` aus, wenn Sie
    OpenClaw langfristig bewusst als root ausführen.

  </Accordion>

  <Accordion title="Schnellere Rebuilds">
    Ordnen Sie Ihr Dockerfile so an, dass Dependency-Layer gecacht werden. Dadurch wird vermieden,
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
    umfangreicher ausgestatteten Container:

    1. **`/home/node` persistent machen**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **System-Dependencies einbacken**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright Chromium einbacken**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **Oder Playwright-Browser in ein persistentes Volume installieren**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **Browser-Downloads persistent machen**: Verwenden Sie `OPENCLAW_HOME_VOLUME` oder
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw erkennt das vom Docker-Image
       Playwright-verwaltete Chromium unter Linux automatisch.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Wenn Sie im Assistenten OpenAI Codex OAuth auswählen, öffnet er eine Browser-URL. Kopieren Sie in
    Docker- oder Headless-Setups die vollständige Weiterleitungs-URL, auf der Sie landen, und fügen Sie
    sie wieder in den Assistenten ein, um die Authentifizierung abzuschließen.
  </Accordion>

  <Accordion title="Metadaten des Basis-Images">
    Das Haupt-Docker-Runtime-Image verwendet `node:24-bookworm-slim` und enthält `tini` als Entrypoint-Init-Prozess (PID 1), um sicherzustellen, dass Zombie-Prozesse bereinigt und Signale in dauerhaft laufenden Containern korrekt verarbeitet werden. Es veröffentlicht OCI-Basis-Image-Annotationen, darunter `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` und weitere. Der Node-Basis-Digest wird
    über Dependabot-PRs für Docker-Basis-Images aktualisiert; Release-Builds führen keinen
    Distro-Upgrade-Layer aus. Siehe
    [OCI-Image-Annotationen](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Ausführung auf einem VPS?

Siehe [Hetzner (Docker VPS)](/de/install/hetzner) und
[Docker-VM-Runtime](/de/install/docker-vm-runtime) für gemeinsame VM-Bereitstellungsschritte
einschließlich Einbacken von Binärdateien, Persistenz und Updates.

## Agent-Sandbox

Wenn `agents.defaults.sandbox` mit dem Docker-Backend aktiviert ist, führt das Gateway
die Ausführung von Agent-Tools (Shell, Lesen/Schreiben von Dateien usw.) in isolierten Docker-
Containern aus, während das Gateway selbst auf dem Host bleibt. Dadurch erhalten Sie eine harte Grenze
um nicht vertrauenswürdige oder mandantenfähige Agent-Sitzungen, ohne das gesamte
Gateway zu containerisieren.

Der Sandbox-Geltungsbereich kann pro Agent (Standard), pro Sitzung oder gemeinsam sein. Jeder Geltungsbereich
erhält seinen eigenen Workspace, der unter `/workspace` eingebunden ist. Sie können außerdem
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
    oder setzen Sie `agents.defaults.sandbox.docker.image` auf Ihr eigenes Image.
    Container werden bei Bedarf automatisch pro Sitzung erstellt.
  </Accordion>

  <Accordion title="Berechtigungsfehler in der Sandbox">
    Setzen Sie `docker.user` auf eine UID:GID, die zur Eigentümerschaft Ihres eingebundenen Workspaces passt,
    oder ändern Sie den Eigentümer des Workspace-Ordners.
  </Accordion>

  <Accordion title="Benutzerdefinierte Tools in der Sandbox nicht gefunden">
    OpenClaw führt Befehle mit `sh -lc` (Login-Shell) aus, wodurch
    `/etc/profile` geladen wird und PATH zurückgesetzt werden kann. Setzen Sie `docker.env.PATH`, um Ihre
    benutzerdefinierten Tool-Pfade voranzustellen, oder fügen Sie ein Skript unter `/etc/profile.d/` in Ihrem Dockerfile hinzu.
  </Accordion>

  <Accordion title="OOM-killed während des Image-Builds (Exit 137)">
    Die VM benötigt mindestens 2 GB RAM. Verwenden Sie eine größere Maschinenklasse und versuchen Sie es erneut.
  </Accordion>

  <Accordion title="Nicht autorisiert oder Kopplung in der Control UI erforderlich">
    Rufen Sie einen frischen Dashboard-Link ab und genehmigen Sie das Browser-Gerät:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Weitere Details: [Dashboard](/de/web/dashboard), [Geräte](/de/cli/devices).

  </Accordion>

  <Accordion title="Gateway-Ziel zeigt ws://172.x.x.x oder Kopplungsfehler von Docker CLI">
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
- [ClawDock](/de/install/clawdock) — Community-Setup für Docker Compose
- [Aktualisieren](/de/install/updating) — OpenClaw aktuell halten
- [Konfiguration](/de/gateway/configuration) — Gateway-Konfiguration nach der Installation
