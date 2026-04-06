---
read_when:
    - Sie möchten ein containerisiertes Gateway statt lokaler Installationen
    - Sie validieren den Docker-Ablauf
summary: Optionales Docker-basiertes Setup und Onboarding für OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-06T03:08:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6aa0453340d7683b4954316274ba6dd1aa7c0ce2483e9bd8ae137ff4efd4c3c
    source_path: install/docker.md
    workflow: 15
---

# Docker (optional)

Docker ist **optional**. Verwenden Sie es nur, wenn Sie ein containerisiertes Gateway möchten oder den Docker-Ablauf validieren wollen.

## Ist Docker das Richtige für mich?

- **Ja**: Sie möchten eine isolierte, wegwerfbare Gateway-Umgebung oder OpenClaw auf einem Host ohne lokale Installationen ausführen.
- **Nein**: Sie arbeiten auf Ihrem eigenen Rechner und möchten einfach die schnellste Dev-Schleife. Verwenden Sie stattdessen den normalen Installationsablauf.
- **Hinweis zum Sandboxing**: Agent-Sandboxing verwendet ebenfalls Docker, erfordert aber **nicht**, dass das gesamte Gateway in Docker läuft. Siehe [Sandboxing](/de/gateway/sandboxing).

## Voraussetzungen

- Docker Desktop (oder Docker Engine) + Docker Compose v2
- Mindestens 2 GB RAM für den Image-Build (`pnpm install` kann auf Hosts mit 1 GB per OOM mit Exit 137 beendet werden)
- Genügend Festplattenspeicher für Images und Logs
- Wenn Sie auf einem VPS/öffentlichen Host ausführen, prüfen Sie
  [Security hardening for network exposure](/de/gateway/security),
  insbesondere die Firewall-Richtlinie `DOCKER-USER` von Docker.

## Containerisiertes Gateway

<Steps>
  <Step title="Image bauen">
    Führen Sie im Repo-Root das Setup-Skript aus:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Dadurch wird das Gateway-Image lokal gebaut. Wenn Sie stattdessen ein vorgefertigtes Image verwenden möchten:

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

    - nach API-Schlüsseln für Anbieter fragen
    - ein Gateway-Token erzeugen und in `.env` schreiben
    - das Gateway über Docker Compose starten

    Während des Setups laufen Onboarding vor dem Start und Konfigurationsschreibvorgänge direkt über
    `openclaw-gateway`. `openclaw-cli` ist für Befehle gedacht, die Sie ausführen, nachdem
    der Gateway-Container bereits existiert.

  </Step>

  <Step title="Die Control UI öffnen">
    Öffnen Sie `http://127.0.0.1:18789/` in Ihrem Browser und fügen Sie das konfigurierte
    gemeinsame Geheimnis in Settings ein. Das Setup-Skript schreibt standardmäßig ein Token nach `.env`; wenn Sie die Containerkonfiguration auf Passwortauthentifizierung umstellen, verwenden Sie stattdessen dieses
    Passwort.

    Sie brauchen die URL noch einmal?

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
Führen Sie `docker compose` aus dem Repo-Root aus. Wenn Sie `OPENCLAW_EXTRA_MOUNTS`
oder `OPENCLAW_HOME_VOLUME` aktiviert haben, schreibt das Setup-Skript `docker-compose.extra.yml`;
binden Sie es mit `-f docker-compose.yml -f docker-compose.extra.yml` ein.
</Note>

<Note>
Da `openclaw-cli` den Netzwerk-Namespace von `openclaw-gateway` gemeinsam nutzt, ist es ein
Werkzeug für nach dem Start. Vor `docker compose up -d openclaw-gateway` führen Sie Onboarding
und Konfigurationsschreibvorgänge zur Setup-Zeit über `openclaw-gateway` mit
`--no-deps --entrypoint node` aus.
</Note>

### Umgebungsvariablen

Das Setup-Skript akzeptiert diese optionalen Umgebungsvariablen:

| Variable                       | Zweck                                                            |
| ------------------------------ | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | Ein Remote-Image statt eines lokalen Builds verwenden            |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Zusätzliche apt-Pakete während des Builds installieren (leerzeichengetrennt) |
| `OPENCLAW_EXTENSIONS`          | Erweiterungsabhängigkeiten beim Build vorinstallieren (leerzeichengetrennte Namen) |
| `OPENCLAW_EXTRA_MOUNTS`        | Zusätzliche Host-Bind-Mounts (kommagetrennt `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | `/home/node` in einem benannten Docker-Volume persistent machen  |
| `OPENCLAW_SANDBOX`             | Opt-in für Sandbox-Bootstrap (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_DOCKER_SOCKET`       | Pfad des Docker-Sockets überschreiben                            |

### Health Checks

Container-Probe-Endpunkte (keine Authentifizierung erforderlich):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # Liveness
curl -fsS http://127.0.0.1:18789/readyz     # Readiness
```

Das Docker-Image enthält einen integrierten `HEALTHCHECK`, der `/healthz` anpingt.
Wenn Prüfungen dauerhaft fehlschlagen, markiert Docker den Container als `unhealthy` und
Orchestrierungssysteme können ihn neu starten oder ersetzen.

Authentifizierter Deep-Health-Snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` setzt standardmäßig `OPENCLAW_GATEWAY_BIND=lan`, damit Host-Zugriff auf
`http://127.0.0.1:18789` mit Docker-Portfreigabe funktioniert.

- `lan` (Standard): Host-Browser und Host-CLI können den veröffentlichten Gateway-Port erreichen.
- `loopback`: Nur Prozesse innerhalb des Container-Netzwerk-Namespace können
  das Gateway direkt erreichen.

<Note>
Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), nicht Host-Aliase wie `0.0.0.0` oder `127.0.0.1`.
</Note>

### Speicher und Persistenz

Docker Compose bind-mountet `OPENCLAW_CONFIG_DIR` nach `/home/node/.openclaw` und
`OPENCLAW_WORKSPACE_DIR` nach `/home/node/.openclaw/workspace`, sodass diese Pfade
den Austausch von Containern überstehen.

In diesem gemounteten Konfigurationsverzeichnis speichert OpenClaw:

- `openclaw.json` für Verhaltenskonfiguration
- `agents/<agentId>/agent/auth-profiles.json` für gespeicherte OAuth-/API-Schlüssel-Authentifizierung von Anbietern
- `.env` für env-gestützte Laufzeitgeheimnisse wie `OPENCLAW_GATEWAY_TOKEN`

Vollständige Details zur Persistenz bei VM-Deployments finden Sie unter
[Docker VM Runtime - What persists where](/de/install/docker-vm-runtime#what-persists-where).

**Hotspots für Festplattenwachstum:** Beobachten Sie `media/`, JSONL-Sitzungsdateien, `cron/runs/*.jsonl`
und rotierende Dateilogs unter `/tmp/openclaw/`.

### Shell-Helfer (optional)

Für eine einfachere tägliche Docker-Verwaltung installieren Sie `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Wenn Sie ClawDock über den älteren Raw-Pfad `scripts/shell-helpers/clawdock-helpers.sh` installiert haben, führen Sie den obigen Installationsbefehl erneut aus, damit Ihre lokale Helferdatei dem neuen Speicherort folgt.

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

    Das Skript mountet `docker.sock` erst, nachdem die Sandbox-Voraussetzungen erfüllt sind. Wenn
    das Sandbox-Setup nicht abgeschlossen werden kann, setzt das Skript `agents.defaults.sandbox.mode`
    auf `off` zurück.

  </Accordion>

  <Accordion title="Automatisierung / CI (nicht interaktiv)">
    Deaktivieren Sie die Compose-Pseudo-TTY-Zuweisung mit `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Sicherheitshinweis für gemeinsames Netzwerk">
    `openclaw-cli` verwendet `network_mode: "service:openclaw-gateway"`, sodass CLI-
    Befehle das Gateway über `127.0.0.1` erreichen können. Behandeln Sie dies als gemeinsame
    Vertrauensgrenze. Die Compose-Konfiguration entfernt `NET_RAW`/`NET_ADMIN` und aktiviert
    `no-new-privileges` für `openclaw-cli`.
  </Accordion>

  <Accordion title="Berechtigungen und EACCES">
    Das Image läuft als `node` (uid 1000). Wenn Berechtigungsfehler auf
    `/home/node/.openclaw` auftreten, stellen Sie sicher, dass Ihre Host-Bind-Mounts Eigentümer uid 1000 haben:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Schnellere Rebuilds">
    Ordnen Sie Ihr Dockerfile so an, dass Abhängigkeits-Layer gecacht werden. So vermeiden Sie,
    `pnpm install` erneut auszuführen, solange sich Lockfiles nicht ändern:

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
    Das Standard-Image ist auf Sicherheit ausgelegt und läuft als nicht-root `node`. Für einen
    funktionsreicheren Container:

    1. **`/home/node` persistent machen**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Systemabhängigkeiten einbacken**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright-Browser installieren**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Browser-Downloads persistent machen**: Setzen Sie
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` und verwenden Sie
       `OPENCLAW_HOME_VOLUME` oder `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Wenn Sie im Assistenten OpenAI Codex OAuth auswählen, wird eine Browser-URL geöffnet. In
    Docker- oder headless-Setups kopieren Sie die vollständige Redirect-URL, auf der Sie landen, und fügen
    sie zurück in den Assistenten ein, um die Authentifizierung abzuschließen.
  </Accordion>

  <Accordion title="Metadaten des Basis-Images">
    Das Haupt-Docker-Image verwendet `node:24-bookworm` und veröffentlicht OCI-Annotationen
    zum Basis-Image, darunter `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` und weitere. Siehe
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Ausführung auf einem VPS?

Siehe [Hetzner (Docker VPS)](/de/install/hetzner) und
[Docker VM Runtime](/de/install/docker-vm-runtime) für gemeinsame Schritte zur VM-Bereitstellung,
einschließlich Binary-Baking, Persistenz und Updates.

## Agent Sandbox

Wenn `agents.defaults.sandbox` aktiviert ist, führt das Gateway die Tool-Ausführung des Agenten
(Shell, Dateilesen/-schreiben usw.) in isolierten Docker-Containern aus, während das
Gateway selbst auf dem Host bleibt. Das bietet eine harte Abgrenzung um nicht vertrauenswürdige oder
mandantenfähige Agent-Sitzungen, ohne das gesamte Gateway zu containerisieren.

Der Sandbox-Umfang kann pro Agent (Standard), pro Sitzung oder gemeinsam sein. Jeder Umfang
erhält seinen eigenen Workspace, gemountet unter `/workspace`. Sie können außerdem
Allow-/Deny-Tool-Richtlinien, Netzwerkisolierung, Ressourcenlimits und Browser-Container konfigurieren.

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

Bauen Sie das Standard-Sandbox-Image:

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
    Setzen Sie `docker.user` auf eine UID:GID, die zum Eigentümer Ihres gemounteten Workspace passt,
    oder ändern Sie den Eigentümer des Workspace-Ordners.
  </Accordion>

  <Accordion title="Benutzerdefinierte Tools in der Sandbox nicht gefunden">
    OpenClaw führt Befehle mit `sh -lc` (Login-Shell) aus, wodurch
    `/etc/profile` geladen wird und PATH möglicherweise zurückgesetzt wird. Setzen Sie `docker.env.PATH`, um Ihre
    benutzerdefinierten Tool-Pfade voranzustellen, oder fügen Sie in Ihrem Dockerfile ein Skript unter `/etc/profile.d/` hinzu.
  </Accordion>

  <Accordion title="Während des Image-Builds per OOM beendet (Exit 137)">
    Die VM benötigt mindestens 2 GB RAM. Verwenden Sie eine größere Maschinenklasse und versuchen Sie es erneut.
  </Accordion>

  <Accordion title="Unauthorized oder Pairing required in der Control UI">
    Holen Sie einen neuen Dashboard-Link und genehmigen Sie das Browser-Gerät:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Mehr Details: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="Gateway-Ziel zeigt ws://172.x.x.x oder Pairing-Fehler aus Docker-CLI">
    Setzen Sie Gateway-Modus und Bind zurück:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Verwandt

- [Install Overview](/de/install) — alle Installationsmethoden
- [Podman](/de/install/podman) — Podman-Alternative zu Docker
- [ClawDock](/de/install/clawdock) — Docker-Compose-Community-Setup
- [Updating](/de/install/updating) — OpenClaw aktuell halten
- [Configuration](/de/gateway/configuration) — Gateway-Konfiguration nach der Installation
