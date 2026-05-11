---
read_when:
    - Je wilt een Gateway in een container in plaats van lokale installaties
    - Je valideert de Docker-flow
summary: Optionele op Docker gebaseerde installatie en onboarding voor OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-11T20:35:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73e7f028708f6455b21aa38adf9dcd833bf6bc169d5405d32faa42641186b4a0
    source_path: install/docker.md
    workflow: 16
---

Docker is **optioneel**. Gebruik het alleen als je een gecontaineriseerde Gateway wilt of de Docker-flow wilt valideren.

## Is Docker geschikt voor mij?

- **Ja**: je wilt een geïsoleerde, wegwerpbare Gateway-omgeving of OpenClaw uitvoeren op een host zonder lokale installaties.
- **Nee**: je draait op je eigen machine en wilt alleen de snelste ontwikkellus. Gebruik in plaats daarvan de normale installatiestroom.
- **Opmerking over sandboxing**: de standaard sandbox-backend gebruikt Docker wanneer sandboxing is ingeschakeld, maar sandboxing staat standaard uit en vereist **niet** dat de volledige Gateway in Docker draait. SSH- en OpenShell-sandbox-backends zijn ook beschikbaar. Zie [Sandboxing](/nl/gateway/sandboxing).

## Vereisten

- Docker Desktop (of Docker Engine) + Docker Compose v2
- Minstens 2 GB RAM voor het bouwen van de image (`pnpm install` kan op hosts met 1 GB door OOM worden beëindigd met exit 137)
- Voldoende schijfruimte voor images en logs
- Als je op een VPS/openbare host draait, bekijk dan
  [Beveiligingshardening voor netwerkblootstelling](/nl/gateway/security),
  met name het Docker `DOCKER-USER`-firewallbeleid.

## Gecontaineriseerde Gateway

<Steps>
  <Step title="Bouw de image">
    Voer vanuit de repo-root het setup-script uit:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Dit bouwt de Gateway-image lokaal. Om in plaats daarvan een vooraf gebouwde image te gebruiken:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Vooraf gebouwde images worden gepubliceerd in de
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Gebruikelijke tags: `main`, `latest`, `<version>` (bijv. `2026.2.26`).

  </Step>

  <Step title="Voltooi onboarding">
    Het setup-script voert onboarding automatisch uit. Het zal:

    - vragen om provider-API-sleutels
    - een Gateway-token genereren en dit naar `.env` schrijven
    - de Gateway starten via Docker Compose

    Tijdens de setup lopen pre-start-onboarding en config-schrijfacties rechtstreeks via
    `openclaw-gateway`. `openclaw-cli` is voor opdrachten die je uitvoert nadat
    de Gateway-container al bestaat.

  </Step>

  <Step title="Open de Control UI">
    Open `http://127.0.0.1:18789/` in je browser en plak het geconfigureerde
    gedeelde geheim in Settings. Het setup-script schrijft standaard een token naar `.env`;
    als je de containerconfiguratie omschakelt naar wachtwoordauthenticatie, gebruik dan in plaats daarvan dat
    wachtwoord.

    Heb je de URL opnieuw nodig?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configureer kanalen (optioneel)">
    Gebruik de CLI-container om berichtkanalen toe te voegen:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Docs: [WhatsApp](/nl/channels/whatsapp), [Telegram](/nl/channels/telegram), [Discord](/nl/channels/discord)

  </Step>
</Steps>

### Handmatige flow

Als je liever elke stap zelf uitvoert in plaats van het setup-script te gebruiken:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Voer `docker compose` uit vanuit de repo-root. Als je `OPENCLAW_EXTRA_MOUNTS`
of `OPENCLAW_HOME_VOLUME` hebt ingeschakeld, schrijft het setup-script `docker-compose.extra.yml`;
neem dit op met `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Omdat `openclaw-cli` de netwerknamespace van `openclaw-gateway` deelt, is het een
post-start-tool. Voer vóór `docker compose up -d openclaw-gateway` onboarding
en config-schrijfacties tijdens setup uit via `openclaw-gateway` met
`--no-deps --entrypoint node`.
</Note>

### Omgevingsvariabelen

Het setup-script accepteert deze optionele omgevingsvariabelen:

| Variabele                                  | Doel                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Gebruik een externe image in plaats van lokaal te bouwen        |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Installeer extra apt-pakketten tijdens de build (gescheiden door spaties) |
| `OPENCLAW_EXTENSIONS`                      | Neem geselecteerde gebundelde plugin-helpers op tijdens build   |
| `OPENCLAW_EXTRA_MOUNTS`                    | Extra bind mounts van host (`source:target[:opts]`, kommagescheiden) |
| `OPENCLAW_HOME_VOLUME`                     | Bewaar `/home/node` in een benoemd Docker-volume                |
| `OPENCLAW_SANDBOX`                         | Schakel sandbox-bootstrap in (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_SKIP_ONBOARDING`                 | Sla de interactieve onboardingstap over (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Overschrijf het Docker-socketpad                                |
| `OPENCLAW_DISABLE_BONJOUR`                 | Schakel Bonjour/mDNS-advertising uit (standaard `1` voor Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Schakel bron-bind-mount-overlays van gebundelde plugins uit     |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Gedeeld OTLP/HTTP-collectorendpoint voor OpenTelemetry-export   |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Signaalspecifieke OTLP-endpoints voor traces, metrics of logs   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Overschrijving van OTLP-protocol. Alleen `http/protobuf` wordt vandaag ondersteund |
| `OTEL_SERVICE_NAME`                        | Servicenaam die wordt gebruikt voor OpenTelemetry-resources     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Schakel de nieuwste experimentele semantische GenAI-attributen in |
| `OPENCLAW_OTEL_PRELOADED`                  | Sla het starten van een tweede OpenTelemetry SDK over wanneer er al een vooraf is geladen |

Maintainers kunnen de bron van gebundelde plugins testen tegen een verpakte image door
één plugin-brondirectory over het verpakte bronpad ervan te mounten, bijvoorbeeld
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Die gemounte brondirectory overschrijft de overeenkomende gecompileerde
`/app/dist/extensions/synology-chat`-bundel voor dezelfde plugin-id.

### Observability

OpenTelemetry-export gaat uitgaand vanuit de Gateway-container naar je OTLP-
collector. Hiervoor is geen gepubliceerde Docker-poort nodig. Als je de image
lokaal bouwt en de gebundelde OpenTelemetry-exporter beschikbaar wilt hebben in de image,
neem dan de runtime-afhankelijkheden ervan op:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Installeer de officiële `@openclaw/diagnostics-otel`-plugin vanuit ClawHub in
verpakte Docker-installaties voordat je export inschakelt. Aangepaste vanuit bron gebouwde images kunnen
nog steeds de lokale plugin-bron opnemen met
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Om export in te schakelen, sta de
`diagnostics-otel`-plugin toe en schakel deze in de config in, en stel vervolgens
`diagnostics.otel.enabled=true` in of gebruik het config-voorbeeld in [OpenTelemetry
export](/nl/gateway/opentelemetry). Collector-authenticatieheaders worden geconfigureerd via
`diagnostics.otel.headers`, niet via Docker-omgevingsvariabelen.

Prometheus-metrics gebruiken de al gepubliceerde Gateway-poort. Installeer
`clawhub:@openclaw/diagnostics-prometheus`, schakel de
`diagnostics-prometheus`-plugin in en scrape vervolgens:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

De route wordt beschermd door Gateway-authenticatie. Stel geen aparte
openbare `/metrics`-poort of niet-geauthenticeerd reverse-proxy-pad bloot. Zie
[Prometheus-metrics](/nl/gateway/prometheus).

### Health checks

Container-probe-endpoints (geen authenticatie vereist):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

De Docker-image bevat een ingebouwde `HEALTHCHECK` die `/healthz` pingt.
Als checks blijven mislukken, markeert Docker de container als `unhealthy` en
kunnen orchestratiesystemen deze herstarten of vervangen.

Geauthenticeerde diepe health-snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` gebruikt standaard `OPENCLAW_GATEWAY_BIND=lan` zodat hosttoegang tot
`http://127.0.0.1:18789` werkt met Docker-poortpublicatie.

- `lan` (standaard): hostbrowser en host-CLI kunnen de gepubliceerde Gateway-poort bereiken.
- `loopback`: alleen processen binnen de containernetwerknamespace kunnen
  de Gateway rechtstreeks bereiken.

<Note>
Gebruik bind-modewaarden in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), geen hostaliassen zoals `0.0.0.0` of `127.0.0.1`.
</Note>

### Lokale hostproviders

Wanneer OpenClaw in Docker draait, is `127.0.0.1` binnen de container de container
zelf, niet je hostmachine. Gebruik `host.docker.internal` voor AI-providers die
op de host draaien:

| Provider  | Standaard-URL host       | Docker-setup-URL                   |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

De gebundelde Docker-setup gebruikt die host-URL's als de onboardingstandaarden voor LM Studio en Ollama,
en `docker-compose.yml` wijst `host.docker.internal` toe aan
Docker's host-gateway voor Linux Docker Engine. Docker Desktop biedt
dezelfde hostnaam al op macOS en Windows.

Hostservices moeten ook luisteren op een adres dat bereikbaar is vanuit Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Als je je eigen Compose-bestand of `docker run`-opdracht gebruikt, voeg dan zelf dezelfde host-
mapping toe, bijvoorbeeld
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker bridge networking stuurt Bonjour/mDNS-multicast
(`224.0.0.251:5353`) meestal niet betrouwbaar door. De gebundelde Compose-setup gebruikt daarom standaard
`OPENCLAW_DISABLE_BONJOUR=1` zodat de Gateway niet in een crash-loop raakt of herhaaldelijk
advertising opnieuw start wanneer de bridge multicastverkeer laat vallen.

Gebruik de gepubliceerde Gateway-URL, Tailscale of wide-area DNS-SD voor Docker-hosts.
Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in wanneer je draait met host networking, macvlan
of een ander netwerk waarvan bekend is dat mDNS-multicast werkt.

Zie [Bonjour discovery](/nl/gateway/bonjour) voor valkuilen en probleemoplossing.

### Opslag en persistentie

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` naar `/home/node/.openclaw` en
`OPENCLAW_WORKSPACE_DIR` naar `/home/node/.openclaw/workspace`, zodat die paden
containervervanging overleven. Wanneer een van beide variabelen niet is ingesteld, valt de gebundelde
`docker-compose.yml` terug op `${HOME}/.openclaw` (en
`${HOME}/.openclaw/workspace` voor de workspace-mount), of `/tmp/.openclaw`
wanneer `HOME` zelf ook ontbreekt. Dat voorkomt dat `docker compose up` in kale
omgevingen een volumespecificatie met lege bron uitgeeft.

Die gemounte configdirectory is waar OpenClaw het volgende bewaart:

- `openclaw.json` voor gedragsconfiguratie
- `agents/<agentId>/agent/auth-profiles.json` voor opgeslagen provider-OAuth/API-key-authenticatie
- `.env` voor door env ondersteunde runtimegeheimen zoals `OPENCLAW_GATEWAY_TOKEN`

Geïnstalleerde downloadbare plugins slaan hun pakketstatus op onder de gemounte
OpenClaw-home, zodat plugin-installatierecords en pakketroots containervervanging
overleven. Gateway-startup genereert geen afhankelijkheidsbomen voor gebundelde plugins.

Zie voor volledige persistentiedetails op VM-deployments
[Docker VM Runtime - Wat waar behouden blijft](/nl/install/docker-vm-runtime#what-persists-where).

**Hotspots voor schijfgroei:** houd `media/`, sessie-JSONL-bestanden,
`cron/runs/*.jsonl`, hoofdlocaties van geïnstalleerde pluginpakketten en roterende bestandslogs
onder `/tmp/openclaw/` in de gaten.

### Shell-hulpen (optioneel)

Installeer `ClawDock` voor eenvoudiger dagelijks Docker-beheer:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Als je ClawDock hebt geïnstalleerd vanaf het oudere raw-pad `scripts/shell-helpers/clawdock-helpers.sh`, voer dan de bovenstaande installatieopdracht opnieuw uit zodat je lokale hulpbestand de nieuwe locatie volgt.

Gebruik daarna `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, enzovoort. Voer
`clawdock-help` uit voor alle opdrachten.
Zie [ClawDock](/nl/install/clawdock) voor de volledige hulpgids.

<AccordionGroup>
  <Accordion title="Agentsandbox inschakelen voor Docker-gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Aangepast socketpad (bijv. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Het script mount `docker.sock` pas nadat aan de sandbox-vereisten is voldaan. Als
    het instellen van de sandbox niet kan worden voltooid, zet het script `agents.defaults.sandbox.mode`
    terug naar `off`. Codex code-mode-beurten blijven beperkt tot Codex
    `workspace-write` terwijl de OpenClaw-sandbox actief is; mount de
    Docker-socket van de host niet in agentsandboxcontainers.

  </Accordion>

  <Accordion title="Automatisering / CI (niet-interactief)">
    Schakel Compose-pseudo-TTY-toewijzing uit met `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Beveiligingsopmerking voor gedeeld netwerk">
    `openclaw-cli` gebruikt `network_mode: "service:openclaw-gateway"` zodat CLI-
    opdrachten de gateway via `127.0.0.1` kunnen bereiken. Behandel dit als een gedeelde
    vertrouwensgrens. De compose-configuratie verwijdert `NET_RAW`/`NET_ADMIN` en schakelt
    `no-new-privileges` in voor zowel `openclaw-gateway` als `openclaw-cli`.
  </Accordion>

  <Accordion title="DNS-fouten van Docker Desktop in openclaw-cli">
    Sommige Docker Desktop-configuraties laten DNS-lookups mislukken vanuit de gedeelde-netwerk-
    `openclaw-cli`-sidecar nadat `NET_RAW` is verwijderd, wat zichtbaar wordt als
    `EAI_AGAIN` tijdens npm-ondersteunde opdrachten zoals `openclaw plugins install`.
    Houd het standaard geharde compose-bestand voor normale gatewaywerking. De
    lokale override hieronder versoepelt de beveiligingshouding van de CLI-container door
    Docker's standaardcapabilities te herstellen, dus gebruik deze alleen voor de eenmalige CLI-
    opdracht die toegang tot het pakketregister nodig heeft, niet als je standaard Compose-
    aanroep:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Als je al een langlopende `openclaw-cli`-container hebt gemaakt, maak deze dan opnieuw
    met dezelfde override. `docker compose exec` en `docker exec` kunnen
    Linux-capabilities niet wijzigen op een al gemaakte container.

  </Accordion>

  <Accordion title="Rechten en EACCES">
    De image draait als `node` (uid 1000). Als je rechtenfouten ziet op
    `/home/node/.openclaw`, zorg er dan voor dat je host-bindmounts eigendom zijn van uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Dezelfde mismatch kan verschijnen als een pluginwaarschuwing zoals
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    gevolgd door `plugin present but blocked`. Dat betekent dat de proces-uid en de
    eigenaar van de gemounte pluginmap niet overeenkomen. Geef de voorkeur aan het draaien van de container als de
    standaard-uid 1000 en het herstellen van het eigendom van de bindmount. Voer alleen chown uit op
    `/path/to/openclaw-config/npm` naar `root:root` als je OpenClaw bewust
    langdurig als root draait.

  </Accordion>

  <Accordion title="Snellere rebuilds">
    Orden je Dockerfile zodat afhankelijkheidslagen worden gecachet. Dit voorkomt dat
    `pnpm install` opnieuw wordt uitgevoerd tenzij lockfiles wijzigen:

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

  <Accordion title="Containeropties voor power users">
    De standaardimage geeft prioriteit aan beveiliging en draait als niet-root `node`. Voor een
    container met meer functies:

    1. **`/home/node` behouden**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Systeemafhankelijkheden inbouwen**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright Chromium inbouwen**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **Of installeer Playwright-browsers in een behouden volume**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **Browserdownloads behouden**: gebruik `OPENCLAW_HOME_VOLUME` of
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw detecteert automatisch de door Playwright beheerde Chromium van de Docker-image op Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Als je OpenAI Codex OAuth kiest in de wizard, opent deze een browser-URL. Kopieer in
    Docker- of headless-configuraties de volledige redirect-URL waarop je uitkomt en plak
    deze terug in de wizard om de authenticatie te voltooien.
  </Accordion>

  <Accordion title="Metadata van basisimage">
    De hoofd-Docker-runtime-image gebruikt `node:24-bookworm-slim` en bevat `tini` als entrypoint-initproces (PID 1) om ervoor te zorgen dat zombieprocessen worden opgeruimd en signalen correct worden afgehandeld in langlopende containers. Deze publiceert OCI-basisimage-annotaties, waaronder `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` en andere. De Node-basisdigest wordt
    vernieuwd via Dependabot-PR's voor Docker-basisimages; releasebuilds voeren geen
    distributie-upgradelaag uit. Zie
    [OCI-imageannotaties](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Draaien op een VPS?

Zie [Hetzner (Docker VPS)](/nl/install/hetzner) en
[Docker VM Runtime](/nl/install/docker-vm-runtime) voor gedeelde VM-deploymentstappen,
inclusief binary-baking, persistentie en updates.

## Agentsandbox

Wanneer `agents.defaults.sandbox` is ingeschakeld met de Docker-backend, voert de gateway
uitvoering van agenttools (shell, bestanden lezen/schrijven, enz.) uit binnen geïsoleerde Docker-
containers, terwijl de gateway zelf op de host blijft. Dit geeft je een harde grens
rond niet-vertrouwde of multi-tenant agentsessies zonder de volledige
gateway te containeriseren.

Sandboxscope kan per agent (standaard), per sessie of gedeeld zijn. Elke scope
krijgt zijn eigen workspace gemount op `/workspace`. Je kunt ook
allow/deny-toolbeleid, netwerkisolatie, resourcelimieten en browser-
containers configureren.

Voor volledige configuratie, images, beveiligingsopmerkingen en multi-agentprofielen, zie:

- [Sandboxing](/nl/gateway/sandboxing) -- volledige sandboxreferentie
- [OpenShell](/nl/gateway/openshell) -- interactieve shelltoegang tot sandboxcontainers
- [Multi-Agent Sandbox and Tools](/nl/tools/multi-agent-sandbox-tools) -- overrides per agent

### Snel inschakelen

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

Bouw de standaardsandboximage (vanuit een source checkout):

```bash
scripts/sandbox-setup.sh
```

Voor npm-installaties zonder source checkout, zie [Sandboxing § Images en setup](/nl/gateway/sandboxing#images-and-setup) voor inline `docker build`-opdrachten.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Image ontbreekt of sandboxcontainer start niet">
    Bouw de sandboximage met
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) of de inline `docker build`-opdracht uit [Sandboxing § Images en setup](/nl/gateway/sandboxing#images-and-setup) (npm-installatie),
    of stel `agents.defaults.sandbox.docker.image` in op je aangepaste image.
    Containers worden automatisch per sessie op aanvraag gemaakt.
  </Accordion>

  <Accordion title="Rechtenfouten in sandbox">
    Stel `docker.user` in op een UID:GID die overeenkomt met het eigendom van je gemounte workspace,
    of wijzig de eigenaar van de workspace-map.
  </Accordion>

  <Accordion title="Aangepaste tools niet gevonden in sandbox">
    OpenClaw voert opdrachten uit met `sh -lc` (login-shell), die
    `/etc/profile` sourcet en PATH mogelijk reset. Stel `docker.env.PATH` in om je
    aangepaste toolpaden vooraan te zetten, of voeg een script toe onder `/etc/profile.d/` in je Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed tijdens imagebuild (exit 137)">
    De VM heeft minimaal 2 GB RAM nodig. Gebruik een grotere machineklasse en probeer opnieuw.
  </Accordion>

  <Accordion title="Ongeautoriseerd of koppeling vereist in Control UI">
    Haal een nieuwe dashboardlink op en keur het browserapparaat goed:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Meer details: [Dashboard](/nl/web/dashboard), [Apparaten](/nl/cli/devices).

  </Accordion>

  <Accordion title="Gatewaydoel toont ws://172.x.x.x of koppelingsfouten vanuit Docker CLI">
    Reset gatewaymodus en bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Installatieoverzicht](/nl/install) — alle installatiemethoden
- [Podman](/nl/install/podman) — Podman-alternatief voor Docker
- [ClawDock](/nl/install/clawdock) — Docker Compose-communitysetup
- [Updaten](/nl/install/updating) — OpenClaw up-to-date houden
- [Configuratie](/nl/gateway/configuration) — gatewayconfiguratie na installatie
