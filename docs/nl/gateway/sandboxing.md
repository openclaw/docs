---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Hoe OpenClaw-sandboxing werkt: modi, scopes, toegang tot de werkruimte en afbeeldingen'
title: Sandboxisolatie
x-i18n:
    generated_at: "2026-05-01T11:18:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw kan **tools binnen sandbox-backends** uitvoeren om de impact te beperken. Dit is **optioneel** en wordt beheerd via configuratie (`agents.defaults.sandbox` of `agents.list[].sandbox`). Als sandboxing uit staat, draaien tools op de host. De Gateway blijft op de host; tooluitvoering draait in een geisoleerde sandbox wanneer dit is ingeschakeld.

<Note>
Dit is geen perfecte beveiligingsgrens, maar het beperkt bestandssysteem- en procestoegang aanzienlijk wanneer het model iets onverstandigs doet.
</Note>

## Wat in een sandbox wordt geplaatst

- Tooluitvoering (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, enz.).
- Optionele sandboxbrowser (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Details van sandboxbrowser">
    - Standaard start de sandboxbrowser automatisch (zorgt dat CDP bereikbaar is) wanneer de browsertool deze nodig heeft. Configureer via `agents.defaults.sandbox.browser.autoStart` en `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Standaard gebruiken sandboxbrowsercontainers een speciaal Docker-netwerk (`openclaw-sandbox-browser`) in plaats van het globale `bridge`-netwerk. Configureer met `agents.defaults.sandbox.browser.network`.
    - Optioneel beperkt `agents.defaults.sandbox.browser.cdpSourceRange` CDP-ingress aan de containerrand met een CIDR-allowlist (bijvoorbeeld `172.21.0.1/32`).
    - noVNC-observertoegang is standaard met een wachtwoord beveiligd; OpenClaw geeft een kortlevende token-URL uit die een lokale bootstrap-pagina serveert en noVNC opent met het wachtwoord in het URL-fragment (niet in query-/headerlogs).
    - `agents.defaults.sandbox.browser.allowHostControl` laat sandboxsessies expliciet de hostbrowser targeten.
    - Optionele allowlists bewaken `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Niet in een sandbox geplaatst:

- Het Gateway-proces zelf.
- Elke tool die expliciet buiten de sandbox mag draaien (bijv. `tools.elevated`).
  - **Elevated exec omzeilt sandboxing en gebruikt het geconfigureerde ontsnappingspad (`gateway` standaard, of `node` wanneer het exec-target `node` is).**
  - Als sandboxing uit staat, verandert `tools.elevated` de uitvoering niet (deze draait al op de host). Zie [Verhoogde modus](/nl/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` bepaalt **wanneer** sandboxing wordt gebruikt:

<Tabs>
  <Tab title="off">
    Geen sandboxing.
  </Tab>
  <Tab title="non-main">
    Alleen **niet-main**-sessies in een sandbox (standaard als je normale chats op de host wilt).

    `"non-main"` is gebaseerd op `session.mainKey` (standaard `"main"`), niet op agent-id. Groeps-/kanaalsessies gebruiken hun eigen sleutels, dus ze tellen als niet-main en worden in een sandbox geplaatst.

  </Tab>
  <Tab title="all">
    Elke sessie draait in een sandbox.
  </Tab>
</Tabs>

## Scope

`agents.defaults.sandbox.scope` bepaalt **hoeveel containers** worden gemaakt:

- `"agent"` (standaard): een container per agent.
- `"session"`: een container per sessie.
- `"shared"`: een container gedeeld door alle sandboxsessies.

## Backend

`agents.defaults.sandbox.backend` bepaalt **welke runtime** de sandbox levert:

- `"docker"` (standaard wanneer sandboxing is ingeschakeld): lokale Docker-gebaseerde sandboxruntime.
- `"ssh"`: generieke SSH-gebaseerde externe sandboxruntime.
- `"openshell"`: OpenShell-gebaseerde sandboxruntime.

SSH-specifieke configuratie staat onder `agents.defaults.sandbox.ssh`. OpenShell-specifieke configuratie staat onder `plugins.entries.openshell.config`.

### Een backend kiezen

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Waar het draait** | Lokale container                 | Elke via SSH bereikbare host   | Door OpenShell beheerde sandbox                     |
| **Setup**           | `scripts/sandbox-setup.sh`       | SSH-sleutel + doelhost         | OpenShell-Plugin ingeschakeld                       |
| **Werkruimtemodel** | Bind-mount of kopie              | Extern-canoniek (eenmalig seeden) | `mirror` of `remote`                             |
| **Netwerkbeheer**   | `docker.network` (standaard: geen) | Afhankelijk van externe host | Afhankelijk van OpenShell                           |
| **Browsersandbox**  | Ondersteund                      | Niet ondersteund               | Nog niet ondersteund                                |
| **Bind mounts**     | `docker.binds`                   | N.v.t.                         | N.v.t.                                              |
| **Best voor**       | Lokale ontwikkeling, volledige isolatie | Offloaden naar een externe machine | Beheerde externe sandboxes met optionele tweerichtingssynchronisatie |

### Docker-backend

Sandboxing staat standaard uit. Als je sandboxing inschakelt en geen backend kiest, gebruikt OpenClaw de Docker-backend. Deze voert tools en sandboxbrowsers lokaal uit via de Docker-daemonsocket (`/var/run/docker.sock`). Sandboxcontainerisolatie wordt bepaald door Docker-namespaces.

Om host-GPU's aan Docker-sandboxes bloot te stellen, stel je `agents.defaults.sandbox.docker.gpus` in of de per-agent override `agents.list[].sandbox.docker.gpus`. De waarde wordt als afzonderlijk argument doorgegeven aan Docker's `--gpus`-vlag, bijvoorbeeld `"all"` of `"device=GPU-uuid"`, en vereist een compatibele hostruntime zoals NVIDIA Container Toolkit.

<Warning>
**Docker-out-of-Docker-beperkingen (DooD)**

Als je de OpenClaw Gateway zelf als Docker-container deployt, orkestreert deze sibling-sandboxcontainers via de Docker-socket van de host (DooD). Dit introduceert een specifieke beperking voor padmapping:

- **Configuratie vereist hostpaden**: De `workspace`-configuratie in `openclaw.json` MOET het **absolute pad van de host** bevatten (bijv. `/home/user/.openclaw/workspaces`), niet het interne Gateway-containerpad. Wanneer OpenClaw de Docker-daemon vraagt een sandbox te starten, evalueert de daemon paden relatief aan de namespace van het host-OS, niet aan de Gateway-namespace.
- **FS-bridge-pariteit (identieke volumemap)**: Het native OpenClaw Gateway-proces schrijft ook heartbeat- en bridge-bestanden naar de `workspace`-directory. Omdat de Gateway exact dezelfde tekenreeks (het hostpad) evalueert vanuit zijn eigen gecontaineriseerde omgeving, MOET de Gateway-deployment een identieke volumemap bevatten die de hostnamespace native koppelt (`-v /home/user/.openclaw:/home/user/.openclaw`).

Als je paden intern mapt zonder absolute hostpariteit, gooit OpenClaw native een `EACCES`-machtigingsfout wanneer het probeert de Heartbeat binnen de containeromgeving te schrijven, omdat de volledig gekwalificeerde padtekenreeks daar native niet bestaat.
</Warning>

### SSH-backend

Gebruik `backend: "ssh"` wanneer je wilt dat OpenClaw `exec`, bestandstools en medialezingen sandboxt op een willekeurige via SSH bereikbare machine.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Hoe het werkt">
    - OpenClaw maakt een externe root per scope aan onder `sandbox.ssh.workspaceRoot`.
    - Bij het eerste gebruik na aanmaken of opnieuw aanmaken seedt OpenClaw die externe werkruimte eenmalig vanuit de lokale werkruimte.
    - Daarna draaien `exec`, `read`, `write`, `edit`, `apply_patch`, prompt-medialezingen en staging van inkomende media rechtstreeks tegen de externe werkruimte via SSH.
    - OpenClaw synchroniseert externe wijzigingen niet automatisch terug naar de lokale werkruimte.

  </Accordion>
  <Accordion title="Authenticatiemateriaal">
    - `identityFile`, `certificateFile`, `knownHostsFile`: gebruik bestaande lokale bestanden en geef ze door via OpenSSH-configuratie.
    - `identityData`, `certificateData`, `knownHostsData`: gebruik inline strings of SecretRefs. OpenClaw lost ze op via de normale secrets-runtime-snapshot, schrijft ze naar tijdelijke bestanden met `0600` en verwijdert ze wanneer de SSH-sessie eindigt.
    - Als zowel `*File` als `*Data` voor hetzelfde item zijn ingesteld, wint `*Data` voor die SSH-sessie.

  </Accordion>
  <Accordion title="Gevolgen van extern-canoniek">
    Dit is een **extern-canoniek** model. De externe SSH-werkruimte wordt na de initiële seed de echte sandboxstatus.

    - Host-lokale bewerkingen buiten OpenClaw na de seedstap zijn extern niet zichtbaar totdat je de sandbox opnieuw aanmaakt.
    - `openclaw sandbox recreate` verwijdert de externe root per scope en seedt opnieuw vanuit lokaal bij het volgende gebruik.
    - Browsersandboxing wordt niet ondersteund op de SSH-backend.
    - `sandbox.docker.*`-instellingen zijn niet van toepassing op de SSH-backend.

  </Accordion>
</AccordionGroup>

### OpenShell-backend

Gebruik `backend: "openshell"` wanneer je wilt dat OpenClaw tools sandboxt in een door OpenShell beheerde externe omgeving. Zie de speciale [OpenShell-pagina](/nl/gateway/openshell) voor de volledige setupgids, configuratiereferentie en vergelijking van werkruimtemodi.

OpenShell hergebruikt hetzelfde kern-SSH-transport en dezelfde externe bestandssysteembridge als de generieke SSH-backend, en voegt OpenShell-specifieke lifecycle toe (`sandbox create/get/delete`, `sandbox ssh-config`) plus de optionele `mirror`-werkruimtemodus.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell-modi:

- `mirror` (standaard): lokale werkruimte blijft canoniek. OpenClaw synchroniseert lokale bestanden naar OpenShell voor exec en synchroniseert de externe werkruimte terug na exec.
- `remote`: OpenShell-werkruimte is canoniek nadat de sandbox is gemaakt. OpenClaw seedt de externe werkruimte eenmalig vanuit de lokale werkruimte, waarna bestandstools en exec rechtstreeks tegen de externe sandbox draaien zonder wijzigingen terug te synchroniseren.

<AccordionGroup>
  <Accordion title="Details van extern transport">
    - OpenClaw vraagt OpenShell om sandboxspecifieke SSH-configuratie via `openshell sandbox ssh-config <name>`.
    - Core schrijft die SSH-configuratie naar een tijdelijk bestand, opent de SSH-sessie en hergebruikt dezelfde externe bestandssysteembridge die door `backend: "ssh"` wordt gebruikt.
    - Alleen in `mirror`-modus verschilt de lifecycle: synchroniseer lokaal naar extern voor exec, en synchroniseer daarna terug na exec.

  </Accordion>
  <Accordion title="Huidige OpenShell-beperkingen">
    - sandboxbrowser wordt nog niet ondersteund
    - `sandbox.docker.binds` wordt niet ondersteund op de OpenShell-backend
    - Docker-specifieke runtimeknoppen onder `sandbox.docker.*` gelden nog steeds alleen voor de Docker-backend

  </Accordion>
</AccordionGroup>

#### Werkruimtemodi

OpenShell heeft twee werkruimtemodellen. Dit is in de praktijk het belangrijkste deel.

<Tabs>
  <Tab title="mirror (lokaal canoniek)">
    Gebruik `plugins.entries.openshell.config.mode: "mirror"` wanneer je wilt dat de **lokale werkruimte canoniek blijft**.

    Gedrag:

    - Voor `exec` synchroniseert OpenClaw de lokale werkruimte naar de OpenShell-sandbox.
    - Na `exec` synchroniseert OpenClaw de externe werkruimte terug naar de lokale werkruimte.
    - Bestandstools werken nog steeds via de sandboxbridge, maar de lokale werkruimte blijft tussen beurten de bron van waarheid.

    Gebruik dit wanneer:

    - je bestanden lokaal buiten OpenClaw bewerkt en wilt dat die wijzigingen automatisch in de sandbox verschijnen
    - je wilt dat de OpenShell-sandbox zich zo veel mogelijk gedraagt als de Docker-backend
    - je wilt dat de hostwerkruimte sandbox-schrijfacties weerspiegelt na elke exec-beurt

    Afweging: extra synchronisatiekosten vóór en na exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Gebruik `plugins.entries.openshell.config.mode: "remote"` wanneer je wilt dat de **OpenShell-werkruimte canoniek wordt**.

    Gedrag:

    - Wanneer de sandbox voor het eerst wordt gemaakt, vult OpenClaw de externe werkruimte één keer vanuit de lokale werkruimte.
    - Daarna werken `exec`, `read`, `write`, `edit` en `apply_patch` rechtstreeks op de externe OpenShell-werkruimte.
    - OpenClaw synchroniseert externe wijzigingen na exec **niet** terug naar de lokale werkruimte.
    - Media-leesacties tijdens prompts blijven werken omdat bestands- en mediatools via de sandboxbridge lezen in plaats van uit te gaan van een lokaal hostpad.
    - Transport verloopt via SSH naar de OpenShell-sandbox die wordt teruggegeven door `openshell sandbox ssh-config`.

    Belangrijke gevolgen:

    - Als je na de seed-stap bestanden op de host buiten OpenClaw bewerkt, ziet de externe sandbox die wijzigingen **niet** automatisch.
    - Als de sandbox opnieuw wordt gemaakt, wordt de externe werkruimte opnieuw gevuld vanuit de lokale werkruimte.
    - Met `scope: "agent"` of `scope: "shared"` wordt die externe werkruimte op hetzelfde bereik gedeeld.

    Gebruik dit wanneer:

    - de sandbox primair aan de externe OpenShell-kant moet leven
    - je lagere synchronisatie-overhead per beurt wilt
    - je niet wilt dat host-lokale bewerkingen stilzwijgend de externe sandboxstatus overschrijven

  </Tab>
</Tabs>

Kies `mirror` als je de sandbox ziet als een tijdelijke uitvoeringsomgeving. Kies `remote` als je de sandbox ziet als de echte werkruimte.

#### OpenShell-levenscyclus

OpenShell-sandboxen worden nog steeds beheerd via de normale sandboxlevenscyclus:

- `openclaw sandbox list` toont zowel OpenShell-runtimes als Docker-runtimes
- `openclaw sandbox recreate` verwijdert de huidige runtime en laat OpenClaw deze bij het volgende gebruik opnieuw maken
- opschoonlogica is ook backendbewust

Voor de modus `remote` is opnieuw maken extra belangrijk:

- opnieuw maken verwijdert de canonieke externe werkruimte voor dat bereik
- het volgende gebruik vult een nieuwe externe werkruimte vanuit de lokale werkruimte

Voor de modus `mirror` reset opnieuw maken vooral de externe uitvoeringsomgeving, omdat de lokale werkruimte toch canoniek blijft.

## Werkruimtetoegang

`agents.defaults.sandbox.workspaceAccess` bepaalt **wat de sandbox kan zien**:

<Tabs>
  <Tab title="none (default)">
    Tools zien een sandboxwerkruimte onder `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Koppelt de agentwerkruimte alleen-lezen aan `/agent` (schakelt `write`/`edit`/`apply_patch` uit).
  </Tab>
  <Tab title="rw">
    Koppelt de agentwerkruimte lezen/schrijven aan `/workspace`.
  </Tab>
</Tabs>

Met de OpenShell-backend:

- de modus `mirror` gebruikt nog steeds de lokale werkruimte als canonieke bron tussen exec-beurten
- de modus `remote` gebruikt de externe OpenShell-werkruimte als canonieke bron na de eerste seed
- `workspaceAccess: "ro"` en `"none"` beperken schrijfgedrag nog steeds op dezelfde manier

Binnenkomende media worden naar de actieve sandboxwerkruimte gekopieerd (`media/inbound/*`).

<Note>
**Opmerking over Skills:** de `read`-tool is geworteld in de sandbox. Met `workspaceAccess: "none"` spiegelt OpenClaw geschikte Skills naar de sandboxwerkruimte (`.../skills`) zodat ze kunnen worden gelezen. Met `"rw"` zijn werkruimte-Skills leesbaar vanuit `/workspace/skills`.
</Note>

## Aangepaste bind-mounts

`agents.defaults.sandbox.docker.binds` koppelt extra hostmappen aan de container. Formaat: `host:container:mode` (bijvoorbeeld `"/home/user/source:/source:rw"`).

Globale en per-agent binds worden **samengevoegd** (niet vervangen). Onder `scope: "shared"` worden per-agent binds genegeerd.

`agents.defaults.sandbox.browser.binds` koppelt extra hostmappen alleen aan de **sandboxbrowser**-container.

- Wanneer ingesteld (inclusief `[]`), vervangt dit `agents.defaults.sandbox.docker.binds` voor de browsercontainer.
- Wanneer weggelaten, valt de browsercontainer terug op `agents.defaults.sandbox.docker.binds` (achterwaarts compatibel).

Voorbeeld (alleen-lezen bron + een extra gegevensmap):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**Bind-beveiliging**

- Binds omzeilen het sandboxbestandssysteem: ze stellen hostpaden bloot met de modus die je instelt (`:ro` of `:rw`).
- OpenClaw blokkeert gevaarlijke bind-bronnen (bijvoorbeeld: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` en bovenliggende mounts die deze zouden blootstellen).
- OpenClaw blokkeert ook gangbare credential-roots in thuismappen, zoals `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` en `~/.ssh`.
- Bind-validatie is niet alleen stringmatching. OpenClaw normaliseert het bronpad en lost het daarna opnieuw op via de diepste bestaande voorouder voordat geblokkeerde paden en toegestane roots opnieuw worden gecontroleerd.
- Dat betekent dat escapes via symlink-ouders nog steeds dicht falen, zelfs wanneer het uiteindelijke blad nog niet bestaat. Voorbeeld: `/workspace/run-link/new-file` wordt nog steeds opgelost als `/var/run/...` als `run-link` daarnaar verwijst.
- Toegestane bronroots worden op dezelfde manier gecanonicaliseerd, dus een pad dat alleen vóór symlink-resolutie binnen de allowlist lijkt te liggen, wordt nog steeds afgewezen als `outside allowed roots`.
- Gevoelige mounts (secrets, SSH-sleutels, servicecredentials) moeten `:ro` zijn tenzij absoluut vereist.
- Combineer met `workspaceAccess: "ro"` als je alleen leestoegang tot de werkruimte nodig hebt; bind-modi blijven onafhankelijk.
- Zie [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) voor hoe binds samenwerken met toolbeleid en verhoogde exec.

</Warning>

## Images en installatie

Standaard Docker-image: `openclaw-sandbox:bookworm-slim`

<Note>
**Bron-checkout versus npm-installatie**

De helperscripts `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` en `scripts/sandbox-browser-setup.sh` zijn alleen beschikbaar wanneer je vanuit een [bron-checkout](https://github.com/openclaw/openclaw) draait. Ze zijn niet opgenomen in het npm-pakket.

Als je OpenClaw hebt geïnstalleerd via `npm install -g openclaw`, gebruik dan de inline `docker build`-commando's die hieronder worden getoond.
</Note>

<Steps>
  <Step title="Build the default image">
    Vanuit een bron-checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Vanuit een npm-installatie (geen bron-checkout nodig):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    De standaardimage bevat **geen** Node. Als een skill Node (of andere runtimes) nodig heeft, bak dan een aangepaste image of installeer via `sandbox.docker.setupCommand` (vereist netwerk-egress + schrijfbare root + rootgebruiker).

    OpenClaw vervangt niet stilzwijgend door gewone `debian:bookworm-slim` wanneer `openclaw-sandbox:bookworm-slim` ontbreekt. Sandboxruns die de standaardimage targeten, falen snel met een build-instructie totdat je deze bouwt, omdat de meegeleverde image `python3` bevat voor sandboxhelpers voor schrijven/bewerken.

  </Step>
  <Step title="Optional: build the common image">
    Voor een functionelere sandboximage met gangbare tooling (bijvoorbeeld `curl`, `jq`, `nodejs`, `python3`, `git`):

    Vanuit een bron-checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Bouw vanuit een npm-installatie eerst de standaardimage (zie hierboven) en bouw daarna de common image erbovenop met de [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) uit de repository.

    Stel daarna `agents.defaults.sandbox.docker.image` in op `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    Vanuit een bron-checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Bouw vanuit een npm-installatie met de [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) uit de repository.

  </Step>
</Steps>

Standaard draaien Docker-sandboxcontainers met **geen netwerk**. Overschrijf dit met `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    De meegeleverde sandboxbrowserimage past ook conservatieve Chromium-opstartstandaarden toe voor containerized workloads. Huidige containerstandaarden omvatten:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-3d-apis`
    - `--disable-gpu`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-extensions`
    - `--disable-features=TranslateUI`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--disable-software-rasterizer`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--renderer-process-limit=2`
    - `--no-sandbox` wanneer `noSandbox` is ingeschakeld.
    - De drie graphics-hardening-vlaggen (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) zijn optioneel en zijn nuttig wanneer containers geen GPU-ondersteuning hebben. Stel `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` in als je workload WebGL of andere 3D-/browserfuncties vereist.
    - `--disable-extensions` is standaard ingeschakeld en kan worden uitgeschakeld met `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` voor flows die afhankelijk zijn van extensies.
    - `--renderer-process-limit=2` wordt beheerd door `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, waarbij `0` de standaard van Chromium behoudt.

    Als je een ander runtimeprofiel nodig hebt, gebruik dan een aangepaste browserimage en lever je eigen entrypoint. Gebruik voor lokale (niet-container) Chromium-profielen `browser.extraArgs` om extra opstartvlaggen toe te voegen.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` wordt geblokkeerd.
    - `network: "container:<id>"` wordt standaard geblokkeerd (risico op omzeiling via namespace join).
    - Break-glass-override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker-installaties en de containerized Gateway staan hier: [Docker](/nl/install/docker)

Voor Docker Gateway-deployments kan `scripts/docker/setup.sh` de sandboxconfiguratie bootstrappen. Stel `OPENCLAW_SANDBOX=1` (of `true`/`yes`/`on`) in om dat pad in te schakelen. Je kunt de socketlocatie overschrijven met `OPENCLAW_DOCKER_SOCKET`. Volledige setup- en env-referentie: [Docker](/nl/install/docker#agent-sandbox).

## setupCommand (eenmalige containerconfiguratie)

`setupCommand` draait **één keer** nadat de sandboxcontainer is gemaakt (niet bij elke run). Het wordt in de container uitgevoerd via `sh -lc`.

Paden:

- Globaal: `agents.defaults.sandbox.docker.setupCommand`
- Per agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - Standaard `docker.network` is `"none"` (geen egress), dus pakketinstallaties mislukken.
    - `docker.network: "container:<id>"` vereist `dangerouslyAllowContainerNamespaceJoin: true` en is alleen voor break-glass.
    - `readOnlyRoot: true` voorkomt schrijfacties; stel `readOnlyRoot: false` in of bak een aangepaste image.
    - `user` moet root zijn voor pakketinstallaties (laat `user` weg of stel `user: "0:0"` in).
    - Sandbox exec neemt host-`process.env` **niet** over. Gebruik `agents.defaults.sandbox.docker.env` (of een aangepaste image) voor skill-API-sleutels.

  </Accordion>
</AccordionGroup>

## Hulpmiddelbeleid en uitwegen

Beleid voor toestaan/weigeren van hulpmiddelen blijft vóór sandboxregels van toepassing. Als een hulpmiddel globaal of per agent wordt geweigerd, brengt sandboxing het niet terug.

`tools.elevated` is een expliciete uitweg die `exec` buiten de sandbox uitvoert (`gateway` standaard, of `node` wanneer het exec-doel `node` is). `/exec`-directieven gelden alleen voor geautoriseerde afzenders en blijven per sessie behouden; om `exec` hard uit te schakelen, gebruik je weigeren via hulpmiddelbeleid (zie [Sandbox versus hulpmiddelbeleid versus Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debuggen:

- Gebruik `openclaw sandbox explain` om de effectieve sandboxmodus, het hulpmiddelbeleid en configuratiesleutels voor herstel te inspecteren.
- Zie [Sandbox versus hulpmiddelbeleid versus Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) voor het mentale model achter "waarom is dit geblokkeerd?".

Houd het vergrendeld.

## Multi-agent-overschrijvingen

Elke agent kan sandbox + hulpmiddelen overschrijven: `agents.list[].sandbox` en `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` voor sandbox-hulpmiddelbeleid). Zie [Multi-agent-sandbox en hulpmiddelen](/nl/tools/multi-agent-sandbox-tools) voor voorrang.

## Minimaal inschakelvoorbeeld

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Gerelateerd

- [Multi-agent-sandbox en hulpmiddelen](/nl/tools/multi-agent-sandbox-tools) — overschrijvingen per agent en voorrang
- [OpenShell](/nl/gateway/openshell) — beheerde installatie van sandbox-backend, werkruimtemodi en configuratiereferentie
- [Sandboxconfiguratie](/nl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox versus hulpmiddelbeleid versus Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) — debuggen van "waarom is dit geblokkeerd?"
- [Beveiliging](/nl/gateway/security)
