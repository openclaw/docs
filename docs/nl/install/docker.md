---
read_when:
    - U wilt een gecontaineriseerde Gateway in plaats van lokale installaties
    - Je valideert de Docker-flow
summary: Optionele Docker-gebaseerde installatie en onboarding voor OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-27T17:42:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker is **optioneel**. Gebruik het alleen als je een gecontaineriseerde Gateway wilt of de Docker-flow wilt valideren.

## Is Docker geschikt voor mij?

- **Ja**: je wilt een geïsoleerde, tijdelijke Gateway-omgeving of OpenClaw uitvoeren op een host zonder lokale installaties.
- **Nee**: je draait op je eigen machine en wilt gewoon de snelste ontwikkellus. Gebruik in plaats daarvan de normale installatieflow.
- **Opmerking over sandboxing**: de standaard sandbox-backend gebruikt Docker wanneer sandboxing is ingeschakeld, maar sandboxing staat standaard uit en vereist **niet** dat de volledige Gateway in Docker draait. SSH- en OpenShell-sandbox-backends zijn ook beschikbaar. Zie [Sandboxing](/nl/gateway/sandboxing).

## Vereisten

- Docker Desktop (of Docker Engine) + Docker Compose v2
- Minimaal 2 GB RAM voor het bouwen van de image (`pnpm install` kan op hosts met 1 GB door OOM worden beëindigd met exit 137)
- Voldoende schijfruimte voor images en logs
- Als je dit op een VPS/openbare host draait, bekijk dan
  [Beveiligingsverharding voor netwerkblootstelling](/nl/gateway/security),
  vooral het Docker `DOCKER-USER`-firewallbeleid.

## Gecontaineriseerde Gateway

<Steps>
  <Step title="Build the image">
    Voer vanuit de repo-root het setupscript uit:

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
    Veelgebruikte tags: `main`, `latest`, `<version>` (bijv. `2026.2.26`).

  </Step>

  <Step title="Airgapped rerun">
    Zet op offline hosts eerst de image over en laad deze:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifieert dat `OPENCLAW_IMAGE` al lokaal bestaat, schakelt
    impliciete Compose-pulls en builds uit, en voert daarna de normale setupflow uit, zoals
    `.env`-synchronisatie, permissieherstel, onboarding, synchronisatie van Gateway-configuratie
    en Compose-startup.

    Als `OPENCLAW_SANDBOX=1`, controleert offline setup ook de geconfigureerde standaard-
    en actieve sandbox-images per agent op de daemon achter
    `OPENCLAW_DOCKER_SOCKET`. Docker-gebaseerde browser-images moeten ook het
    huidige OpenClaw-browsercontractlabel dragen. Wanneer een vereiste image ontbreekt of
    incompatibel is, stopt setup zonder de sandboxconfiguratie te wijzigen in plaats van
    succes te melden met een onbruikbare sandbox.

  </Step>

  <Step title="Complete onboarding">
    Het setupscript voert onboarding automatisch uit. Het zal:

    - vragen om API-sleutels voor providers
    - een Gateway-token genereren en dit naar `.env` schrijven
    - de map voor de geheime sleutel van het auth-profiel maken
    - de Gateway starten via Docker Compose

    Tijdens setup lopen pre-start-onboarding en config-schrijfacties rechtstreeks via
    `openclaw-gateway`. `openclaw-cli` is voor opdrachten die je uitvoert nadat
    de Gateway-container al bestaat.

  </Step>

  <Step title="Open the Control UI">
    Open `http://127.0.0.1:18789/` in je browser en plak het geconfigureerde
    gedeelde geheim in Settings. Het setupscript schrijft standaard een token naar `.env`;
    als je de containerconfiguratie overschakelt naar wachtwoordauthenticatie, gebruik dan in plaats daarvan
    dat wachtwoord.

    Heb je de URL opnieuw nodig?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    Gebruik de CLI-container om berichtkanalen toe te voegen:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Documentatie: [WhatsApp](/nl/channels/whatsapp), [Telegram](/nl/channels/telegram), [Discord](/nl/channels/discord)

  </Step>
</Steps>

### Handmatige flow

Als je liever elke stap zelf uitvoert in plaats van het setupscript te gebruiken:

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
of `OPENCLAW_HOME_VOLUME` hebt ingeschakeld, schrijft het setupscript `docker-compose.extra.yml`;
neem dit op na elk standaard override-bestand, bijvoorbeeld
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
wanneer beide override-bestanden bestaan.
</Note>

<Note>
Omdat `openclaw-cli` de netwerknamespace van `openclaw-gateway` deelt, is het een
post-start-tool. Voer vóór `docker compose up -d openclaw-gateway` onboarding
en config-schrijfacties tijdens setup uit via `openclaw-gateway` met
`--no-deps --entrypoint node`.
</Note>

### Omgevingsvariabelen

Het setupscript accepteert deze optionele omgevingsvariabelen:

| Variabele                                  | Doel                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Gebruik een remote image in plaats van lokaal te bouwen               |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Installeer extra apt-pakketten tijdens de build (spatiegescheiden)    |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Installeer extra Python-pakketten tijdens de build (spatiegescheiden) |
| `OPENCLAW_EXTENSIONS`                      | Installeer Plugin-afhankelijkheden vooraf tijdens buildtijd (spatiegescheiden namen) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Extra host-bindmounts (kommagescheiden `source:target[:opts]`)        |
| `OPENCLAW_HOME_VOLUME`                     | Bewaar `/home/node` in een benoemd Docker-volume                      |
| `OPENCLAW_SANDBOX`                         | Schakel sandbox-bootstrap in (`1`, `true`, `yes`, `on`)               |
| `OPENCLAW_SKIP_ONBOARDING`                 | Sla de interactieve onboardingstap over (`1`, `true`, `yes`, `on`)    |
| `OPENCLAW_DOCKER_SOCKET`                   | Overschrijf het Docker-socketpad                                      |
| `OPENCLAW_DISABLE_BONJOUR`                 | Schakel Bonjour/mDNS-advertering uit (standaard `1` voor Docker)      |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Schakel bind-mount-overlays voor gebundelde Plugin-broncode uit       |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Gedeeld OTLP/HTTP-collectorendpoint voor OpenTelemetry-export         |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Signaalspecifieke OTLP-endpoints voor traces, metrics of logs         |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP-protocoloverride. Alleen `http/protobuf` wordt vandaag ondersteund |
| `OTEL_SERVICE_NAME`                        | Servicenaam die wordt gebruikt voor OpenTelemetry-resources           |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Schakel nieuwste experimentele GenAI-semantische attributen in        |
| `OPENCLAW_OTEL_PRELOADED`                  | Sla het starten van een tweede OpenTelemetry SDK over wanneer er al een is voorgeladen |

De officiële Docker-image bevat geen Homebrew. Tijdens onboarding verbergt OpenClaw
brew-only installatieprogramma's voor skill-afhankelijkheden wanneer het in een Linux-
container zonder `brew` draait; die afhankelijkheden moeten door een aangepaste image
worden geleverd of handmatig worden geïnstalleerd. Voor afhankelijkheden die beschikbaar zijn
als Debian-pakketten, gebruik je `OPENCLAW_IMAGE_APT_PACKAGES` tijdens de image-build.
De verouderde naam `OPENCLAW_DOCKER_APT_PACKAGES` wordt nog steeds geaccepteerd.
Voor Python-afhankelijkheden gebruik je `OPENCLAW_IMAGE_PIP_PACKAGES`. Dit voert
`python3 -m pip install --break-system-packages` uit tijdens de image-build, dus pin
pakketversies en gebruik alleen package-indexes die je vertrouwt.

Maintainers kunnen gebundelde Plugin-broncode testen tegen een packaged image door
één Plugin-bronmap over het packaged bronpad te mounten, bijvoorbeeld
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Die gemounte bronmap overschrijft de overeenkomende gecompileerde
`/app/dist/extensions/synology-chat`-bundel voor dezelfde Plugin-id.

### Observability

OpenTelemetry-export is uitgaand vanuit de Gateway-container naar je OTLP-
collector. Hiervoor is geen gepubliceerde Docker-poort nodig. Als je de image
lokaal bouwt en de gebundelde OpenTelemetry-exporter beschikbaar wilt hebben in de image,
neem dan de runtime-afhankelijkheden ervan op:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Installeer de officiële `@openclaw/diagnostics-otel`-Plugin vanuit ClawHub in
packaged Docker-installaties voordat je export inschakelt. Aangepaste uit bron gebouwde images kunnen
nog steeds de lokale Plugin-broncode opnemen met
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Om export in te schakelen, sta de
`diagnostics-otel`-Plugin toe en schakel deze in de configuratie in, stel daarna
`diagnostics.otel.enabled=true` in of gebruik het configuratievoorbeeld in [OpenTelemetry
export](/nl/gateway/opentelemetry). Collector-authheaders worden geconfigureerd via
`diagnostics.otel.headers`, niet via Docker-omgevingsvariabelen.

Prometheus-metrics gebruiken de al gepubliceerde Gateway-poort. Installeer
`clawhub:@openclaw/diagnostics-prometheus`, schakel de
`diagnostics-prometheus`-Plugin in, en scrape daarna:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

De route wordt beschermd door Gateway-authenticatie. Stel geen aparte openbare
`/metrics`-poort of niet-geauthenticeerd reverse-proxy-pad bloot. Zie
[Prometheus-metrics](/nl/gateway/prometheus).

### Health checks

Container-probe-endpoints (geen auth vereist):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

De Docker-image bevat een ingebouwde `HEALTHCHECK` die `/healthz` pingt.
Als controles blijven mislukken, markeert Docker de container als `unhealthy` en
kunnen orkestratiesystemen deze herstarten of vervangen.

Geauthenticeerde diepe health-snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN versus loopback

`scripts/docker/setup.sh` gebruikt standaard `OPENCLAW_GATEWAY_BIND=lan`, zodat hosttoegang tot
`http://127.0.0.1:18789` werkt met Docker-poortpublicatie.

- `lan` (standaard): hostbrowser en host-CLI kunnen de gepubliceerde Gateway-poort bereiken.
- `loopback`: alleen processen binnen de netwerknamespace van de container kunnen
  de Gateway rechtstreeks bereiken.

<Note>
Gebruik bindmoduswaarden in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), geen hostaliassen zoals `0.0.0.0` of `127.0.0.1`.
</Note>

### Lokale hostproviders

Wanneer OpenClaw in Docker draait, is `127.0.0.1` binnen de container de container
zelf, niet je hostmachine. Gebruik `host.docker.internal` voor AI-providers die
op de host draaien:

| Provider  | Standaard-URL op host     | Docker-setup-URL                    |
| --------- | ------------------------- | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434` |

De gebundelde Docker-setup gebruikt die host-URL's als de standaardwaarden voor onboarding
van LM Studio en Ollama, en `docker-compose.yml` mappt `host.docker.internal` naar
Docker's hostgateway voor Linux Docker Engine. Docker Desktop biedt dezelfde
hostnaam al op macOS en Windows.

Hostservices moeten ook luisteren op een adres dat vanuit Docker bereikbaar is:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Als je je eigen Compose-bestand of `docker run`-opdracht gebruikt, voeg dan zelf
dezelfde hosttoewijzing toe, bijvoorbeeld
`--add-host=host.docker.internal:host-gateway`.

### Claude CLI-backend in Docker

De officiële OpenClaw Docker-image installeert Claude Code niet vooraf. Installeer
Claude Code en log erop in binnen de containergebruiker die OpenClaw uitvoert, en
maak daarna de home van die container persistent zodat image-upgrades de binary
of de Claude-authenticatiestatus niet wissen.

Schakel voor nieuwe Docker-installaties een persistent `/home/node`-volume in
voordat je de installatie uitvoert:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Voor een bestaande Docker-installatie stop je eerst de stack en laad je de
huidige Docker `.env`-waarden opnieuw voordat je de installatie opnieuw uitvoert.
Het installatiescript leest `.env` niet zelf; het herschrijft `.env` vanuit de
huidige shell en standaardwaarden. Voer voor de gegenereerde `.env` uit:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Als je `.env` waarden bevat die je shell niet kan sourcen, exporteer dan eerst
handmatig de bestaande waarden opnieuw waarop je vertrouwt, zoals
`OPENCLAW_IMAGE`, poorten, bindmodus, aangepaste paden,
`OPENCLAW_EXTRA_MOUNTS`, sandbox en instellingen om onboarding over te slaan.
De gegenereerde overlay mount het homevolume voor zowel `openclaw-gateway` als
`openclaw-cli`.

Voer de resterende opdrachten uit met de gegenereerde Compose-overlay, zodat
beide services de persistente home mounten. Als je installatie ook
`docker-compose.override.yml` gebruikt, neem dat dan op vóór
`docker-compose.extra.yml`.

Installeer Claude Code in die persistente home:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Het native installatieprogramma schrijft de `claude`-binary onder
`/home/node/.local/bin/claude`. Vertel OpenClaw dat het dat containerpad moet
gebruiken:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Log in en verifieer vanuit dezelfde persistente container-home:

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

Daarna kun je de gebundelde `claude-cli`-backend gebruiken:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` bewaart de native Claude Code-installatie onder
`/home/node/.local/bin` en `/home/node/.local/share/claude`, plus Claude Code-
instellingen en authenticatiestatus onder `/home/node/.claude` en
`/home/node/.claude.json`. Alleen `/home/node/.openclaw` persistent maken is niet
genoeg voor hergebruik van Claude CLI. Als je `OPENCLAW_EXTRA_MOUNTS` gebruikt in
plaats van een homevolume, mount dan al die Claude-paden in beide Docker-services.

<Note>
Voor gedeelde productieautomatisering of voorspelbare Anthropic-facturering geef
je de voorkeur aan het Anthropic API-sleutelpad. Hergebruik van Claude CLI volgt
de geïnstalleerde versie, accountlogin, facturering en updategedrag van
Claude Code.
</Note>

### Bonjour / mDNS

Docker bridge-netwerken sturen Bonjour/mDNS-multicast (`224.0.0.251:5353`)
meestal niet betrouwbaar door. De gebundelde Compose-installatie zet daarom
standaard `OPENCLAW_DISABLE_BONJOUR=1`, zodat de Gateway niet in een crash-loop
terechtkomt of herhaaldelijk opnieuw begint met adverteren wanneer de bridge
multicastverkeer laat vallen.

Gebruik de gepubliceerde Gateway-URL, Tailscale of wide-area DNS-SD voor
Docker-hosts. Zet `OPENCLAW_DISABLE_BONJOUR=0` alleen wanneer je draait met host-
netwerken, macvlan of een ander netwerk waarvan bekend is dat mDNS-multicast
werkt.

Zie [Bonjour-detectie](/nl/gateway/bonjour) voor valkuilen en probleemoplossing.

### Opslag en persistentie

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` naar `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` naar `/home/node/.openclaw/workspace` en
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` naar `/home/node/.config/openclaw`, zodat die
paden containervervanging overleven. Wanneer een variabele niet is ingesteld,
valt de gebundelde `docker-compose.yml` terug onder `${HOME}`, of onder `/tmp`
wanneer `HOME` zelf ook ontbreekt. Daarmee voorkom je dat `docker compose up` in
kale omgevingen een volumespecificatie met lege bron uitvoert.

Die gemounte configuratiemap is waar OpenClaw het volgende bewaart:

- `openclaw.json` voor gedragsconfiguratie
- `agents/<agentId>/agent/auth-profiles.json` voor opgeslagen provider-OAuth/API-sleutelauthenticatie
- `.env` voor door omgevingsvariabelen ondersteunde runtimegeheimen zoals `OPENCLAW_GATEWAY_TOKEN`

De map met geheime sleutels voor authenticatieprofielen bewaart de lokale
encryptiesleutel die wordt gebruikt voor OAuth-ondersteund tokenmateriaal van
authenticatieprofielen. Bewaar deze bij de status van je Docker-host, maar los
van `OPENCLAW_CONFIG_DIR`.

Geïnstalleerde downloadbare plugins bewaren hun pakketstatus onder de gemounte
OpenClaw-home, zodat plugin-installatierecords en pakketroots containervervanging
overleven. Het starten van de Gateway genereert geen afhankelijkheidsstructuren
voor gebundelde plugins.

Zie voor volledige persistentiedetails bij VM-implementaties
[Docker VM Runtime - Wat waar persistent blijft](/nl/install/docker-vm-runtime#what-persists-where).

**Hotspots voor schijfgroei:** houd `media/`, sessie-JSONL-bestanden, de
gedeelde SQLite-statusdatabase, geïnstalleerde plugin-pakketroots en roterende
bestandslogs onder `/tmp/openclaw/` in de gaten.

### Shell-helpers (optioneel)

Installeer `ClawDock` voor eenvoudiger dagelijks Docker-beheer:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Als je ClawDock hebt geïnstalleerd vanaf het oudere raw-pad
`scripts/shell-helpers/clawdock-helpers.sh`, voer dan de installatieopdracht
hierboven opnieuw uit zodat je lokale helperbestand de nieuwe locatie volgt.

Gebruik daarna `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`,
enzovoort. Voer `clawdock-help` uit voor alle opdrachten.
Zie [ClawDock](/nl/install/clawdock) voor de volledige helpergids.

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

    Het script mount `docker.sock` pas nadat de sandbox-vereisten slagen. Als
    de sandbox-installatie niet kan worden voltooid, zet het script
    `agents.defaults.sandbox.mode` terug naar `off`. Codex-code-modusbeurten
    blijven beperkt tot Codex `workspace-write` terwijl de OpenClaw-sandbox
    actief is; mount de Docker-socket van de host niet in agentsandboxcontainers.

  </Accordion>

  <Accordion title="Automatisering / CI (niet-interactief)">
    Schakel pseudo-TTY-toewijzing van Compose uit met `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Beveiligingsopmerking voor gedeeld netwerk">
    `openclaw-cli` gebruikt `network_mode: "service:openclaw-gateway"` zodat CLI-
    opdrachten de gateway via `127.0.0.1` kunnen bereiken. Behandel dit als een
    gedeelde vertrouwensgrens. De compose-configuratie verwijdert
    `NET_RAW`/`NET_ADMIN` en schakelt `no-new-privileges` in voor zowel
    `openclaw-gateway` als `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker Desktop DNS-fouten in openclaw-cli">
    Sommige Docker Desktop-installaties laten DNS-lookups mislukken vanuit de
    gedeelde-netwerk-`openclaw-cli`-sidecar nadat `NET_RAW` is verwijderd, wat
    zichtbaar wordt als `EAI_AGAIN` tijdens npm-ondersteunde opdrachten zoals
    `openclaw plugins install`. Houd het standaard geharde compose-bestand aan
    voor normale gatewaywerking. De lokale override hieronder versoepelt de
    beveiligingshouding van de CLI-container door de standaardmogelijkheden van
    Docker te herstellen, dus gebruik deze alleen voor de eenmalige CLI-opdracht
    die toegang tot de pakketregistry nodig heeft, niet als je standaard
    Compose-aanroep:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Als je al een langlopende `openclaw-cli`-container hebt gemaakt, maak die
    dan opnieuw aan met dezelfde override. `docker compose exec` en `docker exec`
    kunnen Linux-capabilities op een al aangemaakte container niet wijzigen.

  </Accordion>

  <Accordion title="Machtigingen en EACCES">
    De image draait als `node` (uid 1000). Als je machtigingsfouten ziet op
    `/home/node/.openclaw`, zorg er dan voor dat je host-bindmounts eigendom zijn
    van uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Dezelfde mismatch kan verschijnen als een plugin-waarschuwing zoals
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    gevolgd door `plugin present but blocked`. Dat betekent dat de proces-uid en
    de eigenaar van de gemounte plugin-map niet overeenkomen. Geef de voorkeur
    aan het draaien van de container als de standaard-uid 1000 en het herstellen
    van het eigendom van de bindmount. Voer alleen chown uit op
    `/path/to/openclaw-config/npm` naar `root:root` als je OpenClaw bewust
    langdurig als root draait.

  </Accordion>

  <Accordion title="Snellere rebuilds">
    Orden je Dockerfile zodat afhankelijkheidslagen worden gecachet. Dit voorkomt
    dat `pnpm install` opnieuw wordt uitgevoerd tenzij lockfiles wijzigen:

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

  <Accordion title="Containeropties voor power-users">
    De standaardimage is beveiligingsgericht en draait als niet-root `node`. Voor
    een completere container:

    1. **Maak `/home/node` persistent**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Bak systeemafhankelijkheden in**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Bak Python-afhankelijkheden in**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Bak Playwright Chromium in**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Of installeer Playwright-browsers in een persistent volume**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Maak browserdownloads persistent**: gebruik `OPENCLAW_HOME_VOLUME` of
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw detecteert de door Playwright beheerde
       Chromium van de Docker-image automatisch op Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Als je OpenAI Codex OAuth kiest in de wizard, opent deze een browser-URL. In
    Docker- of headless-installaties kopieer je de volledige omleidings-URL
    waarop je uitkomt en plak je die terug in de wizard om de authenticatie te
    voltooien.
  </Accordion>

  <Accordion title="Metadata van basisimage">
    De hoofd-Docker-runtime-image gebruikt `node:24-bookworm-slim` en bevat `tini` als entrypoint-initproces (PID 1) om te zorgen dat zombieprocessen worden opgeruimd en signalen correct worden afgehandeld in langlopende containers. Het publiceert OCI-basisimage-annotaties, waaronder `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` en andere. De Node-basisdigest wordt
    vernieuwd via Dependabot-PR's voor Docker-basisimages; releasebuilds voeren geen
    distro-upgradelaag uit. Zie
    [OCI-imageannotaties](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Draaien op een VPS?

Zie [Hetzner (Docker-VPS)](/nl/install/hetzner) en
[Docker-VM-runtime](/nl/install/docker-vm-runtime) voor gedeelde VM-implementatiestappen,
inclusief binary baking, persistentie en updates.

## Agent-sandbox

Wanneer `agents.defaults.sandbox` is ingeschakeld met de Docker-backend, voert de gateway
agent-tooluitvoering (shell, bestanden lezen/schrijven, enz.) uit binnen geïsoleerde Docker-
containers, terwijl de gateway zelf op de host blijft. Dit geeft je een harde scheiding
rond niet-vertrouwde of multi-tenant agentsessies zonder de volledige
gateway in een container te plaatsen.

De sandbox-scope kan per agent (standaard), per sessie of gedeeld zijn. Elke scope
krijgt een eigen workspace die is gemount op `/workspace`. Je kunt ook
allow/deny-toolbeleid, netwerkisolatie, resourcelimieten en browser-
containers configureren.

Voor de volledige configuratie, images, beveiligingsnotities en multi-agent-profielen, zie:

- [Sandboxing](/nl/gateway/sandboxing) -- volledige sandboxreferentie
- [OpenShell](/nl/gateway/openshell) -- interactieve shelltoegang tot sandboxcontainers
- [Multi-agent-sandbox en tools](/nl/tools/multi-agent-sandbox-tools) -- overrides per agent

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

Bouw de standaard sandboximage (vanuit een source checkout):

```bash
scripts/sandbox-setup.sh
```

Voor npm-installaties zonder source checkout, zie [Sandboxing § Images en installatie](/nl/gateway/sandboxing#images-and-setup) voor inline `docker build`-opdrachten.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Image ontbreekt of sandboxcontainer start niet">
    Bouw de sandboximage met
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) of de inline `docker build`-opdracht uit [Sandboxing § Images en installatie](/nl/gateway/sandboxing#images-and-setup) (npm-installatie),
    of stel `agents.defaults.sandbox.docker.image` in op je aangepaste image.
    Containers worden op aanvraag automatisch per sessie aangemaakt.
  </Accordion>

  <Accordion title="Permissiefouten in sandbox">
    Stel `docker.user` in op een UID:GID die overeenkomt met het eigendom van je gemounte workspace,
    of voer chown uit op de workspacemap.
  </Accordion>

  <Accordion title="Aangepaste tools niet gevonden in sandbox">
    OpenClaw voert opdrachten uit met `sh -lc` (login shell), die
    `/etc/profile` inleest en PATH mogelijk reset. Stel `docker.env.PATH` in om je
    aangepaste toolpaden vooraan te zetten, of voeg een script toe onder `/etc/profile.d/` in je Dockerfile.
  </Accordion>

  <Accordion title="Beëindigd wegens OOM tijdens imagebuild (afsluitcode 137)">
    De VM heeft minimaal 2 GB RAM nodig. Gebruik een grotere machineklasse en probeer het opnieuw.
  </Accordion>

  <Accordion title="Niet-geautoriseerd of koppeling vereist in Control UI">
    Haal een nieuwe dashboardlink op en keur het browserapparaat goed:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Meer details: [Dashboard](/nl/web/dashboard), [Apparaten](/nl/cli/devices).

  </Accordion>

  <Accordion title="Gateway-doel toont ws://172.x.x.x of koppelingsfouten vanuit Docker CLI">
    Reset de gatewaymodus en binding:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Installatieoverzicht](/nl/install) — alle installatiemethoden
- [Podman](/nl/install/podman) — Podman-alternatief voor Docker
- [ClawDock](/nl/install/clawdock) — communityconfiguratie met Docker Compose
- [Bijwerken](/nl/install/updating) — OpenClaw up-to-date houden
- [Configuratie](/nl/gateway/configuration) — gatewayconfiguratie na installatie
