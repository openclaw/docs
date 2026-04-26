---
read_when:
    - Sie möchten ein containerisiertes Gateway statt lokaler Installationen.
    - Sie validieren den Docker-Ablauf.
summary: Optionales Docker-basiertes Setup und Onboarding für OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-26T11:32:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

Docker ist **optional**. Verwenden Sie es nur, wenn Sie ein containerisiertes Gateway möchten oder den Docker-Ablauf validieren wollen.

## Ist Docker das Richtige für mich?

- **Ja**: Sie möchten eine isolierte, wegwerfbare Gateway-Umgebung oder OpenClaw auf einem Host ohne lokale Installationen ausführen.
- **Nein**: Sie arbeiten auf Ihrer eigenen Maschine und möchten nur den schnellsten Entwicklungszyklus. Verwenden Sie stattdessen den normalen Installationsablauf.
- **Hinweis zu Sandboxing**: Das Standard-Sandbox-Backend verwendet Docker, wenn Sandboxing aktiviert ist, aber Sandboxing ist standardmäßig deaktiviert und erfordert **nicht**, dass das vollständige Gateway in Docker läuft. Die Sandbox-Backends SSH und OpenShell sind ebenfalls verfügbar. Siehe [Sandboxing](/de/gateway/sandboxing).

## Voraussetzungen

- Docker Desktop (oder Docker Engine) + Docker Compose v2
- Mindestens 2 GB RAM für den Image-Build (`pnpm install` kann auf Hosts mit 1 GB Speicher mit Exit 137 durch OOM beendet werden)
- Genügend Speicherplatz für Images und Logs
- Wenn Sie auf einem VPS/öffentlichen Host ausführen, prüfen Sie
  [Security hardening for network exposure](/de/gateway/security),
  insbesondere die Docker-`DOCKER-USER`-Firewall-Richtlinie.

## Containerisiertes Gateway

<Steps>
  <Step title="Das Image bauen">
    Führen Sie im Repo-Root das Setup-Skript aus:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Dadurch wird das Gateway-Image lokal gebaut. Um stattdessen ein vorgefertigtes Image zu verwenden:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Vorgefertigte Images werden in der
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) veröffentlicht.
    Gängige Tags: `main`, `latest`, `<version>` (z. B. `2026.2.26`).

  </Step>

  <Step title="Onboarding abschließen">
    Das Setup-Skript führt das Onboarding automatisch aus. Es wird:

    - nach API-Schlüsseln für Provider fragen
    - ein Gateway-Token erzeugen und in `.env` schreiben
    - das Gateway über Docker Compose starten

    Während der Einrichtung laufen Onboarding vor dem Start und Konfigurationsschreibvorgänge
    direkt über `openclaw-gateway`. `openclaw-cli` ist für Befehle gedacht, die Sie ausführen,
    nachdem der Gateway-Container bereits existiert.

  </Step>

  <Step title="Die Control UI öffnen">
    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser und fügen Sie das konfigurierte
    gemeinsame Secret in die Einstellungen ein. Das Setup-Skript schreibt standardmäßig ein Token in `.env`;
    wenn Sie die Container-Konfiguration auf Passwortauthentifizierung umstellen, verwenden Sie stattdessen dieses
    Passwort.

    Brauchen Sie die URL erneut?

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

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord)

  </Step>
</Steps>

### Manueller Ablauf

Wenn Sie lieber jeden Schritt selbst ausführen möchten, statt das Setup-Skript zu verwenden:

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
fügen Sie es mit `-f docker-compose.yml -f docker-compose.extra.yml` hinzu.
</Note>

<Note>
Da `openclaw-cli` den Netzwerk-Namespace von `openclaw-gateway` teilt, ist es ein
Tool für nach dem Start. Vor `docker compose up -d openclaw-gateway` führen Sie Onboarding
und Konfigurationsschreibvorgänge zur Einrichtungszeit über `openclaw-gateway` mit
`--no-deps --entrypoint node` aus.
</Note>

### Umgebungsvariablen

Das Setup-Skript akzeptiert diese optionalen Umgebungsvariablen:

| Variable                                   | Zweck                                                          |
| ------------------------------------------ | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Ein Remote-Image verwenden statt lokal zu bauen                |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Zusätzliche apt-Pakete während des Builds installieren (durch Leerzeichen getrennt) |
| `OPENCLAW_EXTENSIONS`                      | Plugin-Abhängigkeiten zur Build-Zeit vorinstallieren (durch Leerzeichen getrennte Namen) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Zusätzliche Host-Bind-Mounts (durch Kommata getrennt `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` in einem benannten Docker-Volume persistieren     |
| `OPENCLAW_SANDBOX`                         | In Sandbox-Bootstrap opt-in (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker-Socket-Pfad überschreiben                               |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour-/mDNS-Ankündigung deaktivieren (für Docker standardmäßig `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Gebündelte Source-Bind-Mount-Overlays für Plugins deaktivieren |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Gemeinsamer OTLP/HTTP-Collector-Endpunkt für OpenTelemetry-Export |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Signalspezifische OTLP-Endpunkte für Traces, Metriken oder Logs |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP-Protokoll-Überschreibung. Derzeit wird nur `http/protobuf` unterstützt |
| `OTEL_SERVICE_NAME`                        | Service-Name für OpenTelemetry-Ressourcen                      |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | In die neuesten experimentellen GenAI-Semantikattribute opt-in |
| `OPENCLAW_OTEL_PRELOADED`                  | Starten eines zweiten OpenTelemetry-SDK überspringen, wenn bereits eines vorgeladen ist |

Maintainer können gebündelten Plugin-Source-Code gegen ein Paket-Image testen, indem
sie ein Plugin-Source-Verzeichnis über dessen Paket-Source-Pfad mounten, zum Beispiel
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Dieses gemountete Source-Verzeichnis überschreibt das passende kompilierte
Bundle `/app/dist/extensions/synology-chat` für dieselbe Plugin-ID.

### Beobachtbarkeit

OpenTelemetry-Export läuft ausgehend vom Gateway-Container zu Ihrem OTLP-
Collector. Er benötigt keinen veröffentlichten Docker-Port. Wenn Sie das Image
lokal bauen und den gebündelten OpenTelemetry-Exporter innerhalb des Images verfügbar machen möchten,
schließen Sie dessen Laufzeitabhängigkeiten ein:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Das offizielle Docker-Release-Image von OpenClaw enthält den gebündelten
Plugin-Source-Code `diagnostics-otel`. Je nach Image- und Cache-Zustand kann das
Gateway beim ersten Aktivieren des Plugins dennoch pluginlokale OpenTelemetry-Laufzeitabhängigkeiten
stagen. Lassen Sie deshalb zu, dass dieser erste Boot die Paket-Registry erreicht,
oder wärmen Sie das Image in Ihrer Release-Lane vor. Um den Export zu aktivieren, erlauben und
aktivieren Sie das Plugin `diagnostics-otel` in der Konfiguration und setzen dann
`diagnostics.otel.enabled=true` oder verwenden das Konfigurationsbeispiel in
[OpenTelemetry export](/de/gateway/opentelemetry). Collector-Authentifizierungsheader werden
über `diagnostics.otel.headers` konfiguriert, nicht über Docker-Umgebungsvariablen.

Prometheus-Metriken verwenden den bereits veröffentlichten Gateway-Port. Aktivieren Sie das
Plugin `diagnostics-prometheus` und scrapen Sie dann:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Die Route ist durch Gateway-Authentifizierung geschützt. Legen Sie keinen separaten
öffentlichen `/metrics`-Port oder unauthentifizierten Reverse-Proxy-Pfad offen. Siehe
[Prometheus metrics](/de/gateway/prometheus).

### Health Checks

Container-Probe-Endpunkte (keine Authentifizierung erforderlich):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # Liveness
curl -fsS http://127.0.0.1:18789/readyz     # Readiness
```

Das Docker-Image enthält einen integrierten `HEALTHCHECK`, der `/healthz` anpingt.
Wenn Prüfungen weiterhin fehlschlagen, markiert Docker den Container als `unhealthy` und
Orchestrierungssysteme können ihn neu starten oder ersetzen.

Authentifizierter tiefer Health-Snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs. loopback

`scripts/docker/setup.sh` setzt standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, sodass Host-Zugriff auf
`http://127.0.0.1:18789` mit Docker-Portfreigabe funktioniert.

- `lan` (Standard): Host-Browser und Host-CLI können den veröffentlichten Gateway-Port erreichen.
- `loopback`: Nur Prozesse innerhalb des Netzwerk-Namespace des Containers können
  das Gateway direkt erreichen.

<Note>
Verwenden Sie Werte des Bind-Modus in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), nicht Host-Aliase wie `0.0.0.0` oder `127.0.0.1`.
</Note>

### Bonjour / mDNS

Docker-Bridge-Netzwerke leiten Bonjour-/mDNS-Multicast
(`224.0.0.251:5353`) normalerweise nicht zuverlässig weiter. Das gebündelte Compose-Setup setzt daher standardmäßig
`OPENCLAW_DISABLE_BONJOUR=1`, damit das Gateway nicht in eine Crash-Loop gerät oder
wiederholt die Ankündigung neu startet, wenn die Bridge den Multicast-Verkehr verwirft.

Verwenden Sie für Docker-Hosts die veröffentlichte Gateway-URL, Tailscale oder Wide-Area-DNS-SD.
Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur, wenn Sie mit Host-Netzwerk, macvlan
oder einem anderen Netzwerk arbeiten, bei dem mDNS-Multicast nachweislich funktioniert.

Zu Stolperfallen und Fehlerbehebung siehe [Bonjour-Erkennung](/de/gateway/bonjour).

### Storage und Persistenz

Docker Compose bind-mountet `OPENCLAW_CONFIG_DIR` nach `/home/node/.openclaw` und
`OPENCLAW_WORKSPACE_DIR` nach `/home/node/.openclaw/workspace`, sodass diese Pfade
den Austausch von Containern überstehen.

In diesem gemounteten Konfigurationsverzeichnis speichert OpenClaw:

- `openclaw.json` für Verhaltenskonfiguration
- `agents/<agentId>/agent/auth-profiles.json` für gespeicherte Provider-OAuth-/API-Key-Authentifizierung
- `.env` für env-gestützte Laufzeit-Secrets wie `OPENCLAW_GATEWAY_TOKEN`

Vollständige Details zur Persistenz bei VM-Bereitstellungen finden Sie unter
[Docker VM Runtime - What persists where](/de/install/docker-vm-runtime#what-persists-where).

**Hotspots für Speicherwachstum:** Beobachten Sie `media/`, JSONL-Dateien von Sitzungen, `cron/runs/*.jsonl`
und rotierende Dateilogs unter `/tmp/openclaw/`.

### Shell-Helfer (optional)

Für eine einfachere tägliche Docker-Verwaltung installieren Sie `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock über den älteren Raw-Pfad `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, führen Sie den obigen Installationsbefehl erneut aus, damit Ihre lokale Helferdatei dem neuen Speicherort folgt.

Verwenden Sie dann `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` usw. Führen Sie
`clawdock-help` aus, um alle Befehle zu sehen.
Siehe [ClawDock](/de/install/clawdock) für die vollständige Helfer-Anleitung.

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

    Das Skript mountet `docker.sock` erst, nachdem die Voraussetzungen für die Sandbox erfüllt sind. Wenn
    die Sandbox-Einrichtung nicht abgeschlossen werden kann, setzt das Skript `agents.defaults.sandbox.mode`
    auf `off` zurück.

  </Accordion>

  <Accordion title="Automatisierung / CI (nicht interaktiv)">
    Deaktivieren Sie die Zuweisung eines Compose-Pseudo-TTY mit `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Sicherheitshinweis zu gemeinsam genutzten Netzwerken">
    `openclaw-cli` verwendet `network_mode: "service:openclaw-gateway"`, damit CLI-
    Befehle das Gateway über `127.0.0.1` erreichen können. Behandeln Sie dies als gemeinsame
    Vertrauensgrenze. Die Compose-Konfiguration entfernt `NET_RAW`/`NET_ADMIN` und aktiviert
    `no-new-privileges` auf `openclaw-cli`.
  </Accordion>

  <Accordion title="Berechtigungen und EACCES">
    Das Image läuft als `node` (uid 1000). Wenn Sie Berechtigungsfehler auf
    `/home/node/.openclaw` sehen, stellen Sie sicher, dass Ihre Host-Bind-Mounts uid 1000 gehören:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Schnellere Rebuilds">
    Ordnen Sie Ihr Dockerfile so an, dass Abhängigkeits-Layer gecacht werden. Dadurch wird
    `pnpm install` nicht erneut ausgeführt, solange sich die Lockfiles nicht ändern:

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
    Das Standard-Image ist sicherheitsorientiert und läuft als nicht-root `node`. Für einen
    funktionsreicheren Container:

    1. **`/home/node` persistieren**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Systemabhängigkeiten einbacken**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright-Browser installieren**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Browser-Downloads persistieren**: Setzen Sie
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` und verwenden Sie
       `OPENCLAW_HOME_VOLUME` oder `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Wenn Sie im Assistenten OpenAI Codex OAuth auswählen, wird eine Browser-URL geöffnet. In
    Docker- oder headless Setups kopieren Sie die vollständige Redirect-URL, auf der Sie landen, und fügen sie
    zurück in den Assistenten ein, um die Authentifizierung abzuschließen.
  </Accordion>

  <Accordion title="Metadaten des Base-Image">
    Das Haupt-Docker-Image verwendet `node:24-bookworm` und veröffentlicht OCI-Base-Image-
    Annotationen einschließlich `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` und weiterer. Siehe
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Auf einem VPS ausführen?

Siehe [Hetzner (Docker VPS)](/de/install/hetzner) und
[Docker VM Runtime](/de/install/docker-vm-runtime) für gemeinsame VM-Bereitstellungsschritte
einschließlich Binary-Baking, Persistenz und Updates.

## Agent-Sandbox

Wenn `agents.defaults.sandbox` mit dem Docker-Backend aktiviert ist, führt das Gateway
die Tool-Ausführung von Agenten (Shell, Dateilesen/-schreiben usw.) in isolierten Docker-
Containern aus, während das Gateway selbst auf dem Host bleibt. Dadurch erhalten Sie eine harte Grenze
um nicht vertrauenswürdige oder mandantenfähige Agent-Sitzungen, ohne das gesamte
Gateway zu containerisieren.

Der Sandbox-Scope kann pro Agent (Standard), pro Sitzung oder gemeinsam sein. Jeder Scope
erhält einen eigenen Workspace, der unter `/workspace` gemountet wird. Sie können außerdem
Tool-Richtlinien für Zulassen/Verweigern, Netzwerkisolierung, Ressourcenlimits und Browser-
Container konfigurieren.

Vollständige Informationen zu Konfiguration, Images, Sicherheitshinweisen und Multi-Agent-Profilen finden Sie unter:

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz
- [OpenShell](/de/gateway/openshell) -- interaktiver Shell-Zugriff auf Sandbox-Container
- [Multi-Agent Sandbox and Tools](/de/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent

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

Das Standard-Sandbox-Image bauen:

```bash
scripts/sandbox-setup.sh
```

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Image fehlt oder Sandbox-Container startet nicht">
    Bauen Sie das Sandbox-Image mit
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    oder setzen Sie `agents.defaults.sandbox.docker.image` auf Ihr benutzerdefiniertes Image.
    Container werden bei Bedarf automatisch pro Sitzung erstellt.
  </Accordion>

  <Accordion title="Berechtigungsfehler in der Sandbox">
    Setzen Sie `docker.user` auf eine UID:GID, die zur Eigentümerschaft Ihres gemounteten Workspace passt,
    oder ändern Sie den Besitzer des Workspace-Ordners.
  </Accordion>

  <Accordion title="Benutzerdefinierte Tools in der Sandbox nicht gefunden">
    OpenClaw führt Befehle mit `sh -lc` (Login-Shell) aus, wodurch
    `/etc/profile` geladen wird und PATH möglicherweise zurückgesetzt wird. Setzen Sie `docker.env.PATH`, um Ihre
    benutzerdefinierten Tool-Pfade voranzustellen, oder fügen Sie in Ihrem Dockerfile ein Skript unter `/etc/profile.d/` hinzu.
  </Accordion>

  <Accordion title="Beim Image-Build durch OOM beendet (Exit 137)">
    Die VM benötigt mindestens 2 GB RAM. Verwenden Sie eine größere Maschinenklasse und versuchen Sie es erneut.
  </Accordion>

  <Accordion title="Unauthorized oder Pairing in der Control UI erforderlich">
    Holen Sie einen neuen Dashboard-Link und genehmigen Sie das Browser-Gerät:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Weitere Details: [Dashboard](/de/web/dashboard), [Devices](/de/cli/devices).

  </Accordion>

  <Accordion title="Gateway-Ziel zeigt ws://172.x.x.x oder Pairing-Fehler aus der Docker-CLI">
    Gateway-Modus und Bind zurücksetzen:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Verwandt

- [Install Overview](/de/install) — alle Installationsmethoden
- [Podman](/de/install/podman) — Podman-Alternative zu Docker
- [ClawDock](/de/install/clawdock) — Docker-Compose-Setup aus der Community
- [Updating](/de/install/updating) — OpenClaw aktuell halten
- [Configuration](/de/gateway/configuration) — Gateway-Konfiguration nach der Installation
