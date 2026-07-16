---
read_when:
    - Je wilt een Gateway in een container in plaats van lokale installaties
    - Je valideert de Docker-flow
summary: Optionele Docker-gebaseerde installatie en onboarding voor OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-16T15:53:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker is **optioneel**. Gebruik het voor een geïsoleerde, tijdelijke Gateway-omgeving of een host zonder lokale installaties. Als je al op je eigen machine ontwikkelt, gebruik je in plaats daarvan de normale installatiestroom.

De standaard sandbox-backend gebruikt Docker wanneer `agents.defaults.sandbox` is ingeschakeld, maar sandboxing is standaard uitgeschakeld en vereist niet dat de Gateway zelf in Docker wordt uitgevoerd. SSH- en OpenShell-sandbox-backends zijn ook beschikbaar; zie [Sandboxing](/nl/gateway/sandboxing).

Host je meerdere gebruikers? Zie [Hosting voor meerdere tenants](/nl/gateway/multi-tenant-hosting) voor het model met één cel per tenant.

## Vereisten

- Docker Desktop (of Docker Engine) + Docker Compose v2
- Minimaal 2 GB RAM voor het bouwen van de image (`pnpm install` kan op hosts met 1 GB wegens onvoldoende geheugen worden beëindigd met afsluitcode 137)
- Voldoende schijfruimte voor images en logboeken
- Bekijk op een VPS/openbare host [Beveiligingsversterking voor netwerktoegang](/nl/gateway/security), met name de Docker-firewallketen `DOCKER-USER`

## Gateway in een container

<Steps>
  <Step title="Bouw de image">
    Vanuit de hoofdmap van de repository:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Hiermee wordt de Gateway-image lokaal gebouwd als `openclaw:local`. Om in plaats daarvan een vooraf gebouwde image te gebruiken:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Vooraf gebouwde images worden eerst gepubliceerd in de [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw). GHCR is het primaire register voor releaseautomatisering, vastgezette implementaties en herkomstcontroles. Dezelfde release publiceert een mirror op Docker Hub als `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Gebruik `ghcr.io/openclaw/openclaw` of `openclaw/openclaw` en vermijd niet-officiële mirrors, die niet dezelfde releaseplanning of hetzelfde bewaarbeleid als OpenClaw hebben. Officiële tags: `main`, `latest`, `<version>` (bijv. `2026.2.26`) en bètatags zoals `2026.2.26-beta.1` (bèta's wijzigen nooit `latest`/`main`). De standaardimage `main`/`latest`/`<version>` bevat de plugins `codex` en `diagnostics-otel`. Er wordt ook een variant `-browser` (bijv. `latest-browser`) geleverd waarin Chromium vooraf is ingebouwd, wat handig is voor de tool [browser in een sandbox](/nl/gateway/sandboxing#sandboxed-browser) zonder dat Playwright bij de eerste uitvoering hoeft te worden geïnstalleerd.

  </Step>

  <Step title="Opnieuw uitvoeren zonder netwerkverbinding">
    Draag op offline hosts eerst de image over en laad deze:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` controleert of `OPENCLAW_IMAGE` al lokaal bestaat, schakelt impliciete Compose-pulls en -builds uit en voert vervolgens de normale stroom uit: synchronisatie van `.env`, correcties van machtigingen, onboarding, synchronisatie van de Gateway-configuratie en het starten van Compose.

    Als `OPENCLAW_SANDBOX=1`, controleert de offline-installatie ook de geconfigureerde standaard- en agentspecifieke sandbox-images op de daemon achter `OPENCLAW_DOCKER_SOCKET`, inclusief het browsercontractlabel op Docker-gebaseerde browserimages. Als een vereiste image ontbreekt of verouderd is, wordt de installatie afgesloten zonder de sandboxconfiguratie te wijzigen, in plaats van ten onrechte een geslaagd resultaat te melden.

  </Step>

  <Step title="Voltooi de onboarding">
    Het installatiescript voert de onboarding automatisch uit:

    - vraagt om API-sleutels van providers
    - genereert een Gateway-token en schrijft dit naar `.env`
    - maakt de map voor de geheime sleutel van het authenticatieprofiel
    - start de Gateway via Docker Compose

    Onboarding en configuratieschrijfbewerkingen vóór het starten worden rechtstreeks via `openclaw-gateway` uitgevoerd (met `--no-deps --entrypoint node`), omdat `openclaw-cli` de netwerknaamruimte van de Gateway deelt en pas werkt zodra de Gateway-container bestaat.

  </Step>

  <Step title="Open de Control UI">
    Open `http://127.0.0.1:18789/` en plak het token dat naar `.env` is geschreven in Settings. Als je de container hebt overgeschakeld op wachtwoordauthenticatie, gebruik je in plaats daarvan dat wachtwoord.

    Heb je de URL opnieuw nodig?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configureer kanalen (optioneel)">
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

### Handmatige stroom

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

De Docker-context sluit `.git` uit. Geef de bronidentiteit door als buildargumenten
zoals hierboven weergegeven, zodat het scherm Info van de image de uitgecheckte commit en
één buildtijdstempel toont. `scripts/docker/setup.sh` bepaalt beide waarden en geeft ze
automatisch door.

<Note>
Voer `docker compose` uit vanuit de hoofdmap van de repository. Als je `OPENCLAW_EXTRA_MOUNTS` of `OPENCLAW_HOME_VOLUME` hebt ingeschakeld, schrijft het installatiescript `docker-compose.extra.yml`; voeg dit toe na eventuele `docker-compose.override.yml` die je zelf beheert, bijvoorbeeld `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Containerimages upgraden

Wanneer je de OpenClaw-image vervangt maar dezelfde gekoppelde status/configuratie behoudt, voert de
nieuwe Gateway vóór gereedheid opstartveilige upgrademigraties en pluginconvergentie uit.
Voor reguliere image-upgrades zou geen afzonderlijke uitvoering van
`openclaw doctor --fix` nodig moeten zijn.

Als deze reparaties tijdens het opstarten niet veilig kunnen worden voltooid, wordt de Gateway afgesloten in plaats van
zich als gezond te melden. Met een herstartbeleid kunnen Docker, Podman of Kubernetes weergeven
dat de Gateway-container opnieuw wordt gestart. Behoud het gekoppelde statusvolume en voer vervolgens
dezelfde image eenmaal uit met `openclaw doctor --fix` als containeropdracht, met
dezelfde status-/configuratiekoppelingen die de Gateway gebruikt:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Nadat doctor is voltooid, start je de Gateway-container opnieuw met de standaardopdracht.
Voer in Kubernetes dezelfde opdracht uit in een eenmalige Job of debugpod die aan dezelfde
PVC is gekoppeld en start vervolgens de Deployment of StatefulSet opnieuw.

### Omgevingsvariabelen

Optionele variabelen die door `scripts/docker/setup.sh` worden geaccepteerd (en, voor de Gateway-container, rechtstreeks door `docker-compose.yml`):

| Variabele                                       | Doel                                                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Een externe image gebruiken in plaats van deze lokaal te bouwen                                                   |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Extra apt-pakketten installeren tijdens de build (gescheiden door spaties). Verouderde alias: `OPENCLAW_DOCKER_APT_PACKAGES` |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Extra Python-pakketten installeren tijdens de build (gescheiden door spaties)                                     |
| `OPENCLAW_EXTENSIONS`                           | Geselecteerde ondersteunde plugins compileren/verpakken en hun runtime-afhankelijkheden installeren (id's gescheiden door komma's of spaties) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | De Node-opties voor de lokale bronbuild overschrijven (standaard `--max-old-space-size=8192`)                    |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | De tsdown-heap voor de lokale bronbuild overschrijven in MB                                                       |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Declaratie-uitvoer overslaan tijdens lokale imagebuilds die alleen voor runtime zijn (standaard `1`) |
| `OPENCLAW_INSTALL_BROWSER`                      | Chromium + Xvfb tijdens de build in de image opnemen                                                              |
| `OPENCLAW_EXTRA_MOUNTS`                         | Extra bind-mounts van de host (door komma's gescheiden `source:target[:opts]`)                                    |
| `OPENCLAW_HOME_VOLUME`                          | `/home/node` behouden in een benoemd Docker-volume                                                          |
| `OPENCLAW_SANDBOX`                              | Sandbox-bootstrap inschakelen (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                      | De interactieve onboardingstap overslaan (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                        | Het pad naar de Docker-socket overschrijven                                                                      |
| `OPENCLAW_DISABLE_BONJOUR`                      | Bonjour/mDNS-advertenties geforceerd inschakelen (`0`) of uitschakelen (`1`); zie [Bonjour/mDNS](#bonjour--mdns) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Bind-mountoverlays voor de broncode van gebundelde plugins uitschakelen                                            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Gedeeld OTLP/HTTP-collectoreindpunt voor OpenTelemetry-export                                                     |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Signaalspecifieke OTLP-eindpunten voor traces, metrische gegevens of logboeken                                     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Overschrijving van het OTLP-protocol. Momenteel wordt alleen `http/protobuf` ondersteund                        |
| `OTEL_SERVICE_NAME`                             | Servicenaam die voor OpenTelemetry-resources wordt gebruikt                                                       |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | De nieuwste experimentele semantische GenAI-attributen inschakelen                                                |
| `OPENCLAW_OTEL_PRELOADED`                       | Het starten van een tweede OpenTelemetry-SDK overslaan wanneer er al een is geladen                               |

De officiële image bevat geen Homebrew. Tijdens de onboarding verbergt OpenClaw installatieprogramma's voor skill-afhankelijkheden die alleen met brew werken in een Linux-container zonder `brew`; lever deze afhankelijkheden via een aangepaste image of installeer ze handmatig. Gebruik `OPENCLAW_IMAGE_APT_PACKAGES` voor afhankelijkheden uit Debian-pakketten en `OPENCLAW_IMAGE_PIP_PACKAGES` voor Python-afhankelijkheden (voert tijdens de build `python3 -m pip install --break-system-packages` uit; zet daarom versies vast en gebruik alleen indexen die je vertrouwt).

Als Docker `ResourceExhausted` of `cannot allocate memory` meldt, of tijdens `tsdown` wordt afgebroken, verhoog je de geheugenlimiet van de Docker-builder of probeer je het opnieuw met kleinere, expliciete heaps:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Vanuit bron gebouwde images met geselecteerde plugins

`OPENCLAW_EXTENSIONS` selecteert Plugin-manifest-id's uit de broncheckout;
bestaande brondirectorynamen worden ook geaccepteerd wanneer ze afwijken. De Docker-
build zet de selectie eenmaal om naar brondirectory's, installeert productie-
afhankelijkheden en compileert, wanneer een geselecteerde Plugin afzonderlijk wordt gepubliceerd met
`openclaw.build.bundledDist: false`, de runtime ervan naar de gebundelde root-
dist. Deze uitsluitend voor Docker bestemde verpakking wijzigt het npm- of ClawHub-
artefactcontract van de Plugin niet. Onbekende, ongeldige of dubbelzinnige id's laten de imagebuild mislukken.
Bekende id's die alleen voor afhankelijkheden/bronnen dienen, behouden hun bestaande staging van bronnen en afhankelijkheden
zonder een gecompileerd root-dist-item te krijgen. Een geselecteerde Plugin met
uniforme build-items moet succesvol compileren; niet-geselecteerde externe Plugin-
broncode en runtime-uitvoer worden verwijderd.

Deze opdrachten bouwen bijvoorbeeld afzonderlijke, zelfstandige FakeCo-
gatewayimages voor meerdere architecturen voor ClickClack, Slack en Microsoft Teams. ClawRouter maakt
al deel uit van de OpenClaw-rootruntime, dus de ClickClack-image selecteert alleen
`clickclack`. Het expliciete lege browserargument houdt de standaardimage vrij
van Chromium:

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

Gebruik `--platform linux/arm64 --load` of `--platform linux/amd64 --load` voor één
native lokale build. Uitvoer voor meerdere platforms en bijgevoegde SBOM/herkomstgegevens
vereisen een registry of een andere Buildx-uitvoer die attestaties behoudt. Inspecteer na
het pushen het manifest en implementeer de onveranderlijke digest in plaats van de
veranderlijke bron-SHA-tag:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Implementeren: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Deze images zijn bedoeld voor zelfstandige OCI-gebaseerde gateways en algemene Docker-gebruikers.
Door Crabhelm beheerde gateways gebruiken ze niet: dat distributiepad bouwt een
afzonderlijk x86_64-apparaatarchief dat een OpenClaw npm-tarball bevat en legt
de digests van Node, het archief en het manifest vast. Bouw dat apparaat afzonderlijk
op basis van dezelfde gelande OpenClaw-broncode.

Om gebundelde Plugin-broncode te testen met een verpakte image, koppel je één Plugin-brondirectory aan het bijbehorende verpakte bronpad, bijvoorbeeld `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Daarmee wordt de overeenkomende gecompileerde `/app/dist/extensions/synology-chat`-bundel voor hetzelfde Plugin-id overschreven.

### Observeerbaarheid

OpenTelemetry-export loopt uitgaand van de Gateway-container naar je OTLP-collector; hiervoor hoeft geen Docker-poort te worden gepubliceerd. Om de gebundelde exporter in een lokaal gebouwde image op te nemen:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Officiële vooraf gebouwde images bundelen `diagnostics-otel` al; installeer `clawhub:@openclaw/diagnostics-otel` alleen zelf als je deze hebt verwijderd. Om export in te schakelen, sta je de Plugin `diagnostics-otel` toe en schakel je deze in de configuratie in; stel daarna `diagnostics.otel.enabled=true` in (zie het volledige voorbeeld in [OpenTelemetry-export](/nl/gateway/opentelemetry)). Authenticatieheaders voor de collector lopen via `diagnostics.otel.headers`, niet via Docker-omgevingsvariabelen.

Prometheus-metrieken hergebruiken de al gepubliceerde Gateway-poort. Installeer `clawhub:@openclaw/diagnostics-prometheus`, schakel de Plugin `diagnostics-prometheus` in en scrape vervolgens:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

De route wordt beschermd door Gateway-authenticatie; stel geen afzonderlijke openbare `/metrics`-poort of niet-geverifieerd reverse-proxypad beschikbaar. Zie [Prometheus-metrieken](/nl/gateway/prometheus).

### Statuscontroles

Probe-eindpunten van de container (geen authenticatie vereist):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # actief
curl -fsS http://127.0.0.1:18789/readyz     # gereed
```

De ingebouwde `HEALTHCHECK` van de image pingt `/healthz`; herhaalde fouten markeren de container als `unhealthy`, zodat orchestrators deze opnieuw kunnen starten of vervangen.

Geauthenticeerde diepgaande statusmomentopname:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN versus loopback

`scripts/docker/setup.sh` gebruikt standaard `OPENCLAW_GATEWAY_BIND=lan`, zodat `http://127.0.0.1:18789` op de host werkt met Docker-poortpublicatie.

- `lan` (standaard): de hostbrowser en host-CLI kunnen de gepubliceerde gatewaypoort bereiken.
- `loopback`: alleen processen binnen de netwerknaamruimte van de container kunnen de gateway rechtstreeks bereiken.

<Note>
Gebruik bindmoduswaarden in `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), geen hostaliassen zoals `0.0.0.0` of `127.0.0.1`.
</Note>

### Lokale providers op de host

Binnen de container is `127.0.0.1` de container zelf, niet de host. Gebruik `host.docker.internal` voor providers die op de host draaien:

| Provider  | Standaard-URL op host    | Docker-installatie-URL              |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

De gebundelde installatie gebruikt die URL's als onboardingstandaarden voor LM Studio/Ollama en `docker-compose.yml` wijst `host.docker.internal` toe aan de hostgateway op Linux Docker Engine (Docker Desktop biedt dezelfde alias op macOS/Windows). Hostservices moeten luisteren op een adres dat Docker kan bereiken:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Gebruik je een eigen Compose-bestand of `docker run`? Voeg dan zelf dezelfde toewijzing toe, bijvoorbeeld `--add-host=host.docker.internal:host-gateway`.

### Claude CLI-backend in Docker

De officiële image installeert Claude Code niet vooraf. Installeer het en meld je aan binnen de `node`-gebruiker van de container; maak vervolgens die containerhome persistent, zodat image-upgrades het binaire bestand of de authenticatiestatus niet wissen.

Schakel voor een nieuwe installatie een persistent `/home/node`-volume in voordat je de installatie uitvoert:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Stop voor een bestaande installatie de stack en laad eerst de huidige `.env`-waarden opnieuw — het installatiescript herschrijft `.env` altijd op basis van de huidige shell en standaardwaarden; het leest het bestand niet zelfstandig:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Als `.env` waarden bevat die je shell niet kan sourcen, exporteer dan eerst handmatig opnieuw wat je gebruikt (`OPENCLAW_IMAGE`, poorten, bindmodus, aangepaste paden, `OPENCLAW_EXTRA_MOUNTS`, sandbox, onboarding overslaan). De gegenereerde overlay koppelt het homevolume aan zowel `openclaw-gateway` als `openclaw-cli`; voer de resterende opdrachten uit met die overlay (en eerst `docker-compose.override.yml`, als je die gebruikt):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Het native installatieprogramma schrijft `claude` naar `/home/node/.local/bin/claude`. Laat OpenClaw dat pad gebruiken:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Meld je aan en verifieer vanuit dezelfde persistente home:

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

Gebruik vervolgens de gebundelde `claude-cli`-backend:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Zeg hallo vanuit de Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` bewaart de native installatie onder `/home/node/.local/bin` en `/home/node/.local/share/claude`, plus de instellingen/authenticatie van Claude Code onder `/home/node/.claude` en `/home/node/.claude.json`. Alleen `/home/node/.openclaw` persistent maken is niet voldoende; als je `OPENCLAW_EXTRA_MOUNTS` gebruikt in plaats van een homevolume, koppel dan al die Claude-paden aan beide services.

<Note>
Geef voor gedeelde productieautomatisering of voorspelbare Anthropic-facturering de voorkeur aan het Anthropic API-sleutelpad. Hergebruik van Claude CLI volgt de geïnstalleerde versie, accountaanmelding, facturering en het updategedrag van Claude Code.
</Note>

### Bonjour / mDNS

Docker-bridgenetwerken sturen Bonjour/mDNS-multicast (`224.0.0.251:5353`) doorgaans niet betrouwbaar door. Wanneer `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld, schakelt de gebundelde Bonjour-Plugin LAN-advertering automatisch uit zodra deze detecteert dat hij in een container draait, zodat hij niet in een crashlus terechtkomt door multicast opnieuw te proberen die door de bridge wordt verwijderd. Stel `OPENCLAW_DISABLE_BONJOUR=1` in om dit ongeacht de detectie uit te schakelen, of `0` om dit geforceerd in te schakelen (alleen bij hostnetwerken, macvlan of een ander netwerk waarvan bekend is dat mDNS-multicast werkt).

Gebruik anders de gepubliceerde Gateway-URL, Tailscale of wide-area DNS-SD voor Docker-hosts. Zie [Bonjour-detectie](/nl/gateway/bonjour) voor aandachtspunten en probleemoplossing.

### Opslag en persistentie

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` naar `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` naar `/home/node/.openclaw/workspace` en `OPENCLAW_AUTH_PROFILE_SECRET_DIR` naar `/home/node/.config/openclaw`, zodat die paden behouden blijven wanneer containers worden vervangen. Wanneer een variabele niet is ingesteld, valt `docker-compose.yml` terug op een locatie onder `${HOME}`, of `/tmp` als `HOME` zelf ontbreekt, zodat `docker compose up` in kale omgevingen nooit een volumespecificatie met een lege bron genereert.

Die gekoppelde configuratiedirectory bevat:

- `openclaw.json` voor gedragsconfiguratie
- `agents/<agentId>/agent/auth-profiles.json` voor opgeslagen OAuth-/API-sleutelauthenticatie van providers
- `.env` voor door de omgeving geleverde runtimegeheimen, zoals `OPENCLAW_GATEWAY_TOKEN`

De geheime directory voor authenticatieprofielen bevat de lokale versleutelingssleutel voor tokenmateriaal van OAuth-gebaseerde authenticatieprofielen. Bewaar deze bij de statusgegevens van je Docker-host, maar gescheiden van `OPENCLAW_CONFIG_DIR`.

Geïnstalleerde downloadbare Plugins slaan pakketstatus op onder de gekoppelde OpenClaw-home, zodat installatierecords en pakketroots behouden blijven wanneer containers worden vervangen; bij het starten van de gateway worden afhankelijkheidsstructuren van gebundelde Plugins niet opnieuw gegenereerd.

Zie [Docker VM-runtime - Wat waar behouden blijft](/nl/install/docker-vm-runtime#what-persists-where) voor volledige informatie over VM-persistentie.

**Belangrijkste oorzaken van schijfgroei:** `media/`, SQLite-databases per agent, oude JSONL-transcripten van sessies, de gedeelde SQLite-statusdatabase, pakketroots van geïnstalleerde Plugins en roterende bestandslogboeken onder `/tmp/openclaw/`.

### Shellhulpmiddelen (optioneel)

Installeer [ClawDock](/nl/install/clawdock) voor kortere dagelijkse opdrachten:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Als je via het oudere `scripts/shell-helpers/clawdock-helpers.sh`-pad hebt geïnstalleerd, voer je de bovenstaande opdracht opnieuw uit, zodat je lokale helper de huidige locatie volgt. Gebruik daarna `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, enzovoort (voer `clawdock-help` uit voor de volledige lijst).

<AccordionGroup>
  <Accordion title="Agent-sandbox inschakelen voor Docker-gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Aangepast socketpad (bijvoorbeeld rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Het script koppelt `docker.sock` pas nadat aan de sandboxvereisten is voldaan. Als de sandboxconfiguratie niet kan worden voltooid, stelt het `agents.defaults.sandbox.mode` opnieuw in op `off`. De Codex-codemodus is uitgeschakeld voor beurten waarin de OpenClaw-sandbox actief is (zie [Sandboxing § Docker-backend](/nl/gateway/sandboxing#docker-backend)); koppel de Docker-socket van de host nooit aan agent-sandboxcontainers.

  </Accordion>

  <Accordion title="Automatisering / CI (niet-interactief)">
    Schakel de pseudo-TTY-toewijzing van Compose uit met `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Beveiligingsopmerking voor het gedeelde netwerk">
    `openclaw-cli` gebruikt `network_mode: "service:openclaw-gateway"`, zodat CLI-opdrachten de Gateway via `127.0.0.1` kunnen bereiken. Behandel dit als een gedeelde vertrouwensgrens. De Compose-configuratie verwijdert `NET_RAW`/`NET_ADMIN` en schakelt `no-new-privileges` in op zowel `openclaw-gateway` als `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker Desktop-DNS-fouten in openclaw-cli">
    Bij sommige Docker Desktop-configuraties mislukken DNS-zoekopdrachten vanuit de gedeelde-netwerk-sidecar `openclaw-cli` nadat `NET_RAW` is verwijderd. Dit verschijnt als `EAI_AGAIN` tijdens door npm ondersteunde opdrachten zoals `openclaw plugins install`. Gebruik voor normaal gebruik het standaard geharde Compose-bestand. De onderstaande override herstelt de standaardmogelijkheden uitsluitend voor de container `openclaw-cli` — gebruik deze voor de eenmalige opdracht die toegang tot het register nodig heeft, niet als je standaardaanroep:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Als je al een langlopende container `openclaw-cli` hebt gemaakt, maak je deze opnieuw met dezelfde override — `docker compose exec`/`docker exec` kunnen de Linux-mogelijkheden van een reeds gemaakte container niet wijzigen.

  </Accordion>

  <Accordion title="Machtigingen en EACCES">
    De image wordt uitgevoerd als `node` (uid 1000). Als je machtigingsfouten voor `/home/node/.openclaw` ziet, zorg je ervoor dat je bind-mounts op de host eigendom zijn van uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Dezelfde discrepantie kan verschijnen als `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`, gevolgd door `plugin present but blocked` — de uid van het proces en de eigenaar van de gekoppelde Plugin-map komen niet overeen. Voer bij voorkeur uit met de standaard-uid 1000 en corrigeer het eigendom van de bind-mount. Wijzig het eigendom van `/path/to/openclaw-config/npm` alleen in `root:root` als je OpenClaw bewust langdurig als root uitvoert.

  </Accordion>

  <Accordion title="Sneller opnieuw bouwen">
    Orden je Dockerfile zo dat afhankelijkheidslagen in de cache worden opgeslagen, waardoor `pnpm install` niet opnieuw wordt uitgevoerd tenzij lockbestanden veranderen:

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

  <Accordion title="Containeropties voor ervaren gebruikers">
    De standaardimage stelt beveiliging voorop en wordt uitgevoerd als niet-rootgebruiker `node`. Voor een container met meer functies:

    1. **`/home/node` persistent maken**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Systeemafhankelijkheden inbouwen**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python-afhankelijkheden inbouwen**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium inbouwen**: `export OPENCLAW_INSTALL_BROWSER=1`, of gebruik de officiële imagetag `-browser`
    5. **Of Playwright-browsers in een persistent volume installeren**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Browserdownloads persistent maken**: gebruik `OPENCLAW_HOME_VOLUME` of `OPENCLAW_EXTRA_MOUNTS`. OpenClaw detecteert op Linux automatisch de door Playwright beheerde Chromium van de image.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Als je in de wizard OpenAI Codex OAuth kiest, wordt een browser-URL geopend. Kopieer in Docker- of headless-configuraties de volledige omleidings-URL waarop je terechtkomt en plak deze terug in de wizard om de authenticatie te voltooien.
  </Accordion>

  <Accordion title="Metadata van de basisimage">
    De runtime-image gebruikt `node:24-bookworm-slim` en voert `tini` uit als PID 1, zodat zombieprocessen worden opgeruimd en signalen correct worden afgehandeld in langlopende containers. De image publiceert OCI-annotaties voor basisimages, waaronder `org.opencontainers.image.base.name` en `org.opencontainers.image.source`. Dependabot vernieuwt de vastgezette digest van de Node-basisimage; releasebuilds voeren geen afzonderlijke upgrade-laag voor de distributie uit. Zie [OCI-imageannotaties](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uitvoeren op een VPS?

Zie [Hetzner (Docker-VPS)](/nl/install/hetzner) en [Docker-VM-runtime](/nl/install/docker-vm-runtime) voor implementatiestappen voor een gedeelde VM, waaronder het inbouwen van binaire bestanden, persistentie en updates.

## Agent-sandbox

Wanneer `agents.defaults.sandbox` is ingeschakeld met de Docker-backend, voert de Gateway agenttools (shell, bestanden lezen/schrijven, enzovoort) uit in geïsoleerde Docker-containers, terwijl de Gateway zelf op de host blijft — een harde scheiding rond niet-vertrouwde agent-sessies of agentsessies met meerdere tenants, zonder de volledige Gateway in een container onder te brengen.

Het sandboxbereik kan per agent (standaard), per sessie of gedeeld zijn; elk bereik krijgt een eigen werkruimte die aan `/workspace` is gekoppeld. Je kunt ook beleid voor toegestane/geweigerde tools, netwerkisolatie, resourcelimieten en browsercontainers configureren.

Voor de volledige configuratie, images, beveiligingsopmerkingen en profielen voor meerdere agents:

- [Sandboxing](/nl/gateway/sandboxing) -- volledige sandboxreferentie
- [OpenShell](/nl/gateway/openshell) -- interactieve shelltoegang tot sandboxcontainers
- [Sandbox en tools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools) -- overrides per agent

### Snel inschakelen

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // uit | niet-hoofd | alles
        scope: "agent", // sessie | agent | gedeeld
      },
    },
  },
}
```

Bouw de standaard-sandboximage (vanuit een broncode-checkout):

```bash
scripts/sandbox-setup.sh
```

Zie voor npm-installaties zonder broncode-checkout [Sandboxing § Images en configuratie](/nl/gateway/sandboxing#images-and-setup) voor inline `docker build`-opdrachten.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Image ontbreekt of sandboxcontainer start niet">
    Bouw de sandboximage met [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (broncode-checkout) of de inline opdracht `docker build` uit [Sandboxing § Images en configuratie](/nl/gateway/sandboxing#images-and-setup) (npm-installatie), of stel `agents.defaults.sandbox.docker.image` in op je aangepaste image. Containers worden per sessie automatisch en op aanvraag gemaakt.
  </Accordion>

  <Accordion title="Machtigingsfouten in de sandbox">
    Stel `docker.user` in op een UID:GID die overeenkomt met het eigendom van je gekoppelde werkruimte, of wijzig het eigendom van de werkruimtemap.
  </Accordion>

  <Accordion title="Aangepaste tools niet gevonden in de sandbox">
    OpenClaw voert opdrachten uit met `sh -lc` (login-shell), die `/etc/profile` inleest en PATH mogelijk opnieuw instelt. Stel `docker.env.PATH` in om je aangepaste toolpaden vooraan toe te voegen, of voeg in je Dockerfile een script toe onder `/etc/profile.d/`.
  </Accordion>

  <Accordion title="Door OOM beëindigd tijdens het bouwen van de image (afsluitcode 137)">
    De VM heeft minstens 2 GB RAM nodig. Gebruik een grotere machineklasse en probeer het opnieuw.
  </Accordion>

  <Accordion title="Niet geautoriseerd of koppeling vereist in de Control UI">
    Haal een nieuwe dashboardlink op en keur het browserapparaat goed:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Meer informatie: [Dashboard](/nl/web/dashboard), [Apparaten](/nl/cli/devices).

  </Accordion>

  <Accordion title="Gateway-doel toont ws://172.x.x.x of koppelingsfouten vanuit de Docker-CLI">
    Stel de Gateway-modus en binding opnieuw in:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Installatieoverzicht](/nl/install) — alle installatiemethoden
- [Podman](/nl/install/podman) — Podman-alternatief voor Docker
- [ClawDock](/nl/install/clawdock) — Docker Compose-configuratie van de community
- [Bijwerken](/nl/install/updating) — OpenClaw actueel houden
- [Configuratie](/nl/gateway/configuration) — Gateway-configuratie na installatie
