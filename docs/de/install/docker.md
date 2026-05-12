---
read_when:
    - Sie möchten ein containerisiertes Gateway statt lokaler Installationen
    - Sie validieren den Docker-Flow
summary: Optionale Docker-basierte Einrichtung und Einführung für OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-12T12:55:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 241db808dcdaa91df67a88b93d94de61cb4c2265de0e84a3b7f031166c94ee77
    source_path: install/docker.md
    workflow: 16
---

Docker ist **optional**. Verwenden Sie es nur, wenn Sie einen containerisierten Gateway möchten oder den Docker-Ablauf validieren wollen.

## Ist Docker das Richtige für mich?

- **Ja**: Sie möchten eine isolierte, temporäre Gateway-Umgebung oder OpenClaw auf einem Host ohne lokale Installationen ausführen.
- **Nein**: Sie arbeiten auf Ihrem eigenen Rechner und möchten nur den schnellsten Entwicklungszyklus. Verwenden Sie stattdessen den normalen Installationsablauf.
- **Sandboxing-Hinweis**: Das Standard-Sandbox-Backend verwendet Docker, wenn Sandboxing aktiviert ist, aber Sandboxing ist standardmäßig deaktiviert und erfordert **nicht**, dass der vollständige Gateway in Docker ausgeführt wird. SSH- und OpenShell-Sandbox-Backends sind ebenfalls verfügbar. Siehe [Sandboxing](/de/gateway/sandboxing).

## Voraussetzungen

- Docker Desktop (oder Docker Engine) + Docker Compose v2
- Mindestens 2 GB RAM für den Image-Build (`pnpm install` kann auf Hosts mit 1 GB mit Exit 137 wegen Speichermangel beendet werden)
- Ausreichend Speicherplatz für Images und Protokolle
- Wenn Sie auf einem VPS/öffentlichen Host ausführen, lesen Sie
  [Sicherheitshärtung für Netzwerkexposition](/de/gateway/security),
  insbesondere die Docker-Firewallrichtlinie `DOCKER-USER`.

## Containerisierter Gateway

<Steps>
  <Step title="Image bauen">
    Führen Sie im Repo-Root das Einrichtungsskript aus:

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
    Häufige Tags: `main`, `latest`, `<version>` (z. B. `2026.2.26`).

  </Step>

  <Step title="Onboarding abschließen">
    Das Einrichtungsskript führt das Onboarding automatisch aus. Es wird:

    - nach Provider-API-Schlüsseln fragen
    - ein Gateway-Token generieren und in `.env` schreiben
    - das Verzeichnis für den Secret Key des Auth-Profils erstellen
    - den Gateway über Docker Compose starten

    Während der Einrichtung laufen das Onboarding vor dem Start und Konfigurationsschreibvorgänge direkt über
    `openclaw-gateway`. `openclaw-cli` ist für Befehle vorgesehen, die Sie ausführen, nachdem
    der Gateway-Container bereits existiert.

  </Step>

  <Step title="Steuerungsoberfläche öffnen">
    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser und fügen Sie das konfigurierte
    gemeinsame Secret in den Einstellungen ein. Das Einrichtungsskript schreibt standardmäßig ein Token in `.env`;
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

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Telegram](/de/channels/telegram), [Discord](/de/channels/discord)

  </Step>
</Steps>

### Manueller Ablauf

Wenn Sie jeden Schritt lieber selbst ausführen möchten, statt das Einrichtungsskript zu verwenden:

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
oder `OPENCLAW_HOME_VOLUME` aktiviert haben, schreibt das Einrichtungsskript `docker-compose.extra.yml`;
binden Sie es mit `-f docker-compose.yml -f docker-compose.extra.yml` ein.
</Note>

<Note>
Da `openclaw-cli` den Netzwerk-Namespace von `openclaw-gateway` teilt, ist es ein
Werkzeug nach dem Start. Führen Sie vor `docker compose up -d openclaw-gateway` Onboarding
und Konfigurationsschreibvorgänge zur Einrichtungszeit über `openclaw-gateway` mit
`--no-deps --entrypoint node` aus.
</Note>

### Umgebungsvariablen

Das Einrichtungsskript akzeptiert diese optionalen Umgebungsvariablen:

| Variable                                   | Zweck                                                           |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Remote-Image verwenden, statt lokal zu bauen                    |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Zusätzliche apt-Pakete während des Builds installieren (durch Leerzeichen getrennt) |
| `OPENCLAW_EXTENSIONS`                      | Ausgewählte gebündelte Plugin-Helfer zur Build-Zeit einschließen |
| `OPENCLAW_EXTRA_MOUNTS`                    | Zusätzliche Host-Bind-Mounts (durch Kommas getrenntes `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` in einem benannten Docker-Volume persistieren      |
| `OPENCLAW_SANDBOX`                         | Sandbox-Bootstrap aktivieren (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_SKIP_ONBOARDING`                 | Interaktiven Onboarding-Schritt überspringen (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker-Socket-Pfad überschreiben                                |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour-/mDNS-Ankündigung deaktivieren (standardmäßig `1` für Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Bind-Mount-Overlays für gebündelte Plugin-Quellen deaktivieren  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Gemeinsamer OTLP-/HTTP-Collector-Endpunkt für OpenTelemetry-Export |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Signalspezifische OTLP-Endpunkte für Traces, Metriken oder Protokolle |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP-Protokollüberschreibung. Derzeit wird nur `http/protobuf` unterstützt |
| `OTEL_SERVICE_NAME`                        | Für OpenTelemetry-Ressourcen verwendeter Dienstname             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Neueste experimentelle semantische GenAI-Attribute aktivieren   |
| `OPENCLAW_OTEL_PRELOADED`                  | Start eines zweiten OpenTelemetry-SDK überspringen, wenn bereits eines vorgeladen ist |

Maintainer können gebündelte Plugin-Quellen gegen ein paketiertes Image testen, indem sie
ein Plugin-Quellverzeichnis über dessen paketierten Quellpfad mounten, zum Beispiel
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Dieses gemountete Quellverzeichnis überschreibt das passende kompilierte
`/app/dist/extensions/synology-chat`-Bundle für dieselbe Plugin-ID.

### Observability

Der OpenTelemetry-Export erfolgt ausgehend vom Gateway-Container zu Ihrem OTLP-
Collector. Er erfordert keinen veröffentlichten Docker-Port. Wenn Sie das Image
lokal bauen und den gebündelten OpenTelemetry-Exporter im Image verfügbar haben möchten,
schließen Sie dessen Runtime-Abhängigkeiten ein:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Installieren Sie das offizielle `@openclaw/diagnostics-otel`-Plugin aus ClawHub in
paketierten Docker-Installationen, bevor Sie den Export aktivieren. Benutzerdefinierte, aus Quellcode gebaute Images können
die lokale Plugin-Quelle weiterhin mit
`OPENCLAW_EXTENSIONS=diagnostics-otel` einschließen. Um den Export zu aktivieren, erlauben und aktivieren Sie das
`diagnostics-otel`-Plugin in der Konfiguration, setzen Sie dann
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
Wenn Prüfungen weiterhin fehlschlagen, markiert Docker den Container als `unhealthy`, und
Orchestrierungssysteme können ihn neu starten oder ersetzen.

Authentifizierter Deep-Health-Snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs. Loopback

`scripts/docker/setup.sh` setzt standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, damit der Host-Zugriff auf
`http://127.0.0.1:18789` mit Docker-Portveröffentlichung funktioniert.

- `lan` (Standard): Host-Browser und Host-CLI können den veröffentlichten Gateway-Port erreichen.
- `loopback`: Nur Prozesse innerhalb des Container-Netzwerk-Namespace können
  den Gateway direkt erreichen.

<Note>
Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), nicht Host-Aliasse wie `0.0.0.0` oder `127.0.0.1`.
</Note>

### Lokale Host-Provider

Wenn OpenClaw in Docker ausgeführt wird, ist `127.0.0.1` innerhalb des Containers der Container
selbst, nicht Ihre Host-Maschine. Verwenden Sie `host.docker.internal` für AI-Provider, die
auf dem Host laufen:

| Provider  | Standard-Host-URL        | Docker-Einrichtungs-URL             |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Die gebündelte Docker-Einrichtung verwendet diese Host-URLs als Onboarding-Standardwerte für LM Studio und Ollama,
und `docker-compose.yml` ordnet `host.docker.internal` dem
Host-Gateway von Docker für Linux Docker Engine zu. Docker Desktop stellt denselben Hostnamen
unter macOS und Windows bereits bereit.

Host-Dienste müssen außerdem auf einer Adresse lauschen, die von Docker erreichbar ist:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Wenn Sie Ihre eigene Compose-Datei oder einen eigenen `docker run`-Befehl verwenden, fügen Sie dieselbe Host-
Zuordnung selbst hinzu, zum Beispiel
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker-Bridge-Netzwerke leiten Bonjour-/mDNS-Multicast
(`224.0.0.251:5353`) in der Regel nicht zuverlässig weiter. Die gebündelte Compose-Einrichtung setzt daher standardmäßig
`OPENCLAW_DISABLE_BONJOUR=1`, damit der Gateway nicht in eine Absturzschleife gerät oder wiederholt
die Ankündigung neu startet, wenn die Bridge Multicast-Datenverkehr verwirft.

Verwenden Sie die veröffentlichte Gateway-URL, Tailscale oder Wide-Area-DNS-SD für Docker-Hosts.
Setzen Sie `OPENCLAW_DISABLE_BONJOUR=0` nur, wenn Sie mit Host-Netzwerk, macvlan
oder einem anderen Netzwerk arbeiten, bei dem bekannt ist, dass mDNS-Multicast funktioniert.

Hinweise zu Fallstricken und Fehlerbehebung finden Sie unter [Bonjour-Erkennung](/de/gateway/bonjour).

### Speicher und Persistenz

Docker Compose bind-mountet `OPENCLAW_CONFIG_DIR` nach `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` nach `/home/node/.openclaw/workspace` und
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` nach `/home/node/.config/openclaw`, sodass diese
Pfade Container-Ersetzungen überdauern. Wenn eine Variable nicht gesetzt ist, fällt das gebündelte
`docker-compose.yml` auf `${HOME}` zurück oder auf `/tmp`, wenn `HOME` selbst
ebenfalls fehlt. Dadurch verhindert `docker compose up`, dass in einfachen Umgebungen eine Volume-Spezifikation
mit leerer Quelle ausgegeben wird.

Dieses gemountete Konfigurationsverzeichnis ist der Ort, an dem OpenClaw Folgendes speichert:

- `openclaw.json` für Verhaltenskonfiguration
- `agents/<agentId>/agent/auth-profiles.json` für gespeicherte Provider-OAuth-/API-Schlüssel-Authentifizierung
- `.env` für env-gestützte Runtime-Secrets wie `OPENCLAW_GATEWAY_TOKEN`

Das Verzeichnis für den Secret Key des Auth-Profils speichert den lokalen Verschlüsselungsschlüssel, der für
OAuth-gestütztes Tokenmaterial von Auth-Profilen verwendet wird. Bewahren Sie ihn zusammen mit Ihrem Docker-Host-Zustand auf,
aber getrennt von `OPENCLAW_CONFIG_DIR`.

Installierte herunterladbare Plugins speichern ihren Paketstatus unter dem gemounteten
OpenClaw-Home, sodass Plugin-Installationsdatensätze und Paketwurzeln den Austausch
des Containers überstehen. Der Gateway-Start erzeugt keine Abhängigkeitsbäume für
gebündelte Plugins.

Vollständige Details zur Persistenz bei VM-Bereitstellungen finden Sie unter
[Docker VM Runtime - Was wo bestehen bleibt](/de/install/docker-vm-runtime#what-persists-where).

**Hotspots für Festplattenwachstum:** Beobachten Sie `media/`, Sitzungs-JSONL-Dateien,
`cron/runs/*.jsonl`, installierte Plugin-Paketwurzeln und rotierende Dateilogs
unter `/tmp/openclaw/`.

### Shell-Hilfen (optional)

Installieren Sie `ClawDock` für eine einfachere tägliche Docker-Verwaltung:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock über den älteren Raw-Pfad `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, führen Sie den Installationsbefehl oben erneut aus, damit Ihre lokale Hilfsdatei dem neuen Speicherort folgt.

Verwenden Sie anschließend `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` usw. Führen Sie
`clawdock-help` aus, um alle Befehle anzuzeigen.
Den vollständigen Leitfaden zu den Hilfen finden Sie unter [ClawDock](/de/install/clawdock).

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
    die Sandbox-Einrichtung nicht abgeschlossen werden kann, setzt das Skript `agents.defaults.sandbox.mode`
    auf `off` zurück. Codex-Code-Modus-Turns bleiben weiterhin auf Codex
    `workspace-write` beschränkt, während die OpenClaw-Sandbox aktiv ist; mounten Sie den
    Host-Docker-Socket nicht in Agent-Sandbox-Container.

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
    Einige Docker-Desktop-Setups schlagen bei DNS-Lookups aus dem `openclaw-cli`-Sidecar
    im gemeinsamen Netzwerk fehl, nachdem `NET_RAW` entfernt wurde; dies zeigt sich als
    `EAI_AGAIN` bei npm-gestützten Befehlen wie `openclaw plugins install`.
    Behalten Sie die standardmäßig gehärtete Compose-Datei für den normalen Gateway-Betrieb bei. Die
    lokale Überschreibung unten lockert die Sicherheitslage des CLI-Containers, indem sie
    Dockers Standardfähigkeiten wiederherstellt. Verwenden Sie sie daher nur für den einmaligen CLI-
    Befehl, der Zugriff auf die Paket-Registry benötigt, nicht als Ihren standardmäßigen Compose-
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
    mit derselben Überschreibung neu. `docker compose exec` und `docker exec` können
    Linux-Fähigkeiten an einem bereits erstellten Container nicht ändern.

  </Accordion>

  <Accordion title="Berechtigungen und EACCES">
    Das Image läuft als `node` (uid 1000). Wenn Berechtigungsfehler bei
    `/home/node/.openclaw` auftreten, stellen Sie sicher, dass Ihre Host-Bind-Mounts uid 1000 gehören:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Dieselbe Abweichung kann als Plugin-Warnung erscheinen, etwa
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    gefolgt von `plugin present but blocked`. Das bedeutet, dass die Prozess-uid und der
    Eigentümer des gemounteten Plugin-Verzeichnisses nicht übereinstimmen. Bevorzugen Sie, den Container mit der
    Standard-uid 1000 auszuführen und die Eigentümerschaft des Bind-Mounts zu korrigieren. Ändern Sie
    `/path/to/openclaw-config/npm` nur dann per chown zu `root:root`, wenn Sie OpenClaw
    langfristig absichtlich als root ausführen.

  </Accordion>

  <Accordion title="Schnellere Rebuilds">
    Ordnen Sie Ihr Dockerfile so an, dass Abhängigkeitsschichten gecacht werden. Dadurch wird vermieden,
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

    1. **`/home/node` persistieren**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Systemabhängigkeiten einbacken**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright Chromium einbacken**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **Oder Playwright-Browser in ein persistiertes Volume installieren**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **Browser-Downloads persistieren**: Verwenden Sie `OPENCLAW_HOME_VOLUME` oder
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw erkennt das von Playwright verwaltete Chromium des Docker-Images
       unter Linux automatisch.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Wenn Sie im Assistenten OpenAI Codex OAuth auswählen, wird eine Browser-URL geöffnet. Kopieren Sie in
    Docker- oder Headless-Setups die vollständige Weiterleitungs-URL, auf der Sie landen, und fügen Sie
    sie wieder in den Assistenten ein, um die Authentifizierung abzuschließen.
  </Accordion>

  <Accordion title="Basis-Image-Metadaten">
    Das Haupt-Docker-Runtime-Image verwendet `node:24-bookworm-slim` und enthält `tini` als Entry-Point-Init-Prozess (PID 1), um sicherzustellen, dass Zombie-Prozesse bereinigt und Signale in langlebigen Containern korrekt verarbeitet werden. Es veröffentlicht OCI-Basis-Image-Annotationen, darunter `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` und weitere. Der Node-Basis-Digest wird
    über Dependabot-Docker-Basis-Image-PRs aktualisiert; Release-Builds führen keine
    Distributions-Upgrade-Schicht aus. Siehe
    [OCI-Image-Annotationen](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Ausführung auf einem VPS?

Siehe [Hetzner (Docker-VPS)](/de/install/hetzner) und
[Docker VM Runtime](/de/install/docker-vm-runtime) für gemeinsame Schritte zur VM-Bereitstellung,
einschließlich Binary-Baking, Persistenz und Updates.

## Agent-Sandbox

Wenn `agents.defaults.sandbox` mit dem Docker-Backend aktiviert ist, führt das Gateway
die Ausführung von Agent-Tools (Shell, Datei-Lesen/-Schreiben usw.) innerhalb isolierter Docker-
Container aus, während das Gateway selbst auf dem Host bleibt. Dadurch erhalten Sie eine harte Grenze
um nicht vertrauenswürdige oder mandantenfähige Agent-Sitzungen, ohne das gesamte
Gateway zu containerisieren.

Der Sandbox-Umfang kann pro Agent (Standard), pro Sitzung oder gemeinsam sein. Jeder Umfang
erhält seinen eigenen Workspace, der unter `/workspace` gemountet ist. Sie können außerdem
Allow/Deny-Tool-Richtlinien, Netzwerkisolation, Ressourcenlimits und Browser-
Container konfigurieren.

Vollständige Konfiguration, Images, Sicherheitshinweise und Multi-Agent-Profile finden Sie unter:

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
    Setzen Sie `docker.user` auf eine UID:GID, die zur Eigentümerschaft Ihres gemounteten Workspaces passt,
    oder ändern Sie den Workspace-Ordner per chown.
  </Accordion>

  <Accordion title="Benutzerdefinierte Tools werden in der Sandbox nicht gefunden">
    OpenClaw führt Befehle mit `sh -lc` (Login-Shell) aus, wodurch
    `/etc/profile` geladen wird und PATH möglicherweise zurückgesetzt wird. Setzen Sie `docker.env.PATH`, um Ihre
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

    Weitere Details: [Dashboard](/de/web/dashboard), [Geräte](/de/cli/devices).

  </Accordion>

  <Accordion title="Gateway-Ziel zeigt ws://172.x.x.x oder Pairing-Fehler von der Docker-CLI">
    Setzen Sie den Gateway-Modus und die Bindung zurück:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [Installationsübersicht](/de/install) — alle Installationsmethoden
- [Podman](/de/install/podman) — Podman-Alternative zu Docker
- [ClawDock](/de/install/clawdock) — Docker-Compose-Community-Setup
- [Aktualisierung](/de/install/updating) — OpenClaw aktuell halten
- [Konfiguration](/de/gateway/configuration) — Gateway-Konfiguration nach der Installation
