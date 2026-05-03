---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Hoe sandboxing in OpenClaw werkt: modi, bereiken, toegang tot werkruimte en afbeeldingen'
title: Sandboxisolatie
x-i18n:
    generated_at: "2026-05-03T21:33:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e887d07ed84d582bb605c75f841499b6bed42cfc94d60690aba33c2f351b272b
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw kan **tools binnen sandbox-backends** uitvoeren om de blast radius te verkleinen. Dit is **optioneel** en wordt beheerd via configuratie (`agents.defaults.sandbox` of `agents.list[].sandbox`). Als sandboxing uit staat, draaien tools op de host. De Gateway blijft op de host; tooluitvoering draait in een geïsoleerde sandbox wanneer dit is ingeschakeld.

<Note>
Dit is geen perfecte beveiligingsgrens, maar het beperkt filesystem- en proces-toegang aanzienlijk wanneer het model iets onverstandigs doet.
</Note>

## Wat in de sandbox wordt uitgevoerd

- Tooluitvoering (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, enz.).
- Optionele gesandboxte browser (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - Standaard start de sandboxbrowser automatisch (zorgt dat CDP bereikbaar is) wanneer de browsertool die nodig heeft. Configureer dit via `agents.defaults.sandbox.browser.autoStart` en `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Standaard gebruiken sandboxbrowsercontainers een toegewijd Docker-netwerk (`openclaw-sandbox-browser`) in plaats van het globale `bridge`-netwerk. Configureer dit met `agents.defaults.sandbox.browser.network`.
    - Optioneel beperkt `agents.defaults.sandbox.browser.cdpSourceRange` CDP-ingress aan de containerrand met een CIDR-allowlist (bijvoorbeeld `172.21.0.1/32`).
    - noVNC-observertoegang is standaard met een wachtwoord beveiligd; OpenClaw geeft een kortlevende token-URL uit die een lokale bootstrap-pagina serveert en noVNC opent met het wachtwoord in het URL-fragment (niet in query-/headerlogs).
    - `agents.defaults.sandbox.browser.allowHostControl` laat gesandboxte sessies expliciet de hostbrowser targeten.
    - Optionele allowlists begrenzen `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Niet in de sandbox uitgevoerd:

- Het Gateway-proces zelf.
- Elke tool die expliciet buiten de sandbox mag draaien (bijv. `tools.elevated`).
  - **Elevated exec omzeilt sandboxing en gebruikt het geconfigureerde escape-pad (`gateway` standaard, of `node` wanneer het exec-target `node` is).**
  - Als sandboxing uit staat, verandert `tools.elevated` de uitvoering niet (die draait al op de host). Zie [Elevated Mode](/nl/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` bepaalt **wanneer** sandboxing wordt gebruikt:

<Tabs>
  <Tab title="off">
    Geen sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandbox alleen **niet-main** sessies (standaard als je normale chats op de host wilt).

    `"non-main"` is gebaseerd op `session.mainKey` (standaard `"main"`), niet op agent-id. Groeps-/kanaalsessies gebruiken hun eigen keys, dus die tellen als niet-main en worden in de sandbox uitgevoerd.

  </Tab>
  <Tab title="all">
    Elke sessie draait in een sandbox.
  </Tab>
</Tabs>

## Bereik

`agents.defaults.sandbox.scope` bepaalt **hoeveel containers** er worden gemaakt:

- `"agent"` (standaard): één container per agent.
- `"session"`: één container per sessie.
- `"shared"`: één container gedeeld door alle gesandboxte sessies.

## Backend

`agents.defaults.sandbox.backend` bepaalt **welke runtime** de sandbox levert:

- `"docker"` (standaard wanneer sandboxing is ingeschakeld): lokale Docker-ondersteunde sandboxruntime.
- `"ssh"`: generieke SSH-ondersteunde externe sandboxruntime.
- `"openshell"`: OpenShell-ondersteunde sandboxruntime.

SSH-specifieke configuratie staat onder `agents.defaults.sandbox.ssh`. OpenShell-specifieke configuratie staat onder `plugins.entries.openshell.config`.

### Een backend kiezen

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Waar het draait** | Lokale container                 | Elke via SSH toegankelijke host | Door OpenShell beheerde sandbox                     |
| **Setup**           | `scripts/sandbox-setup.sh`       | SSH-key + targethost           | OpenShell-Plugin ingeschakeld                       |
| **Werkruimtemodel** | Bind-mount of kopie              | Remote-canonical (eenmalig seeden) | `mirror` of `remote`                            |
| **Netwerkbeheer**   | `docker.network` (standaard: geen) | Afhankelijk van externe host | Afhankelijk van OpenShell                           |
| **Browsersandbox**  | Ondersteund                      | Niet ondersteund               | Nog niet ondersteund                                |
| **Bind mounts**     | `docker.binds`                   | N.v.t.                         | N.v.t.                                              |
| **Beste voor**      | Lokale ontwikkeling, volledige isolatie | Offloaden naar een externe machine | Beheerde externe sandboxes met optionele tweerichtingssynchronisatie |

### Docker-backend

Sandboxing staat standaard uit. Als je sandboxing inschakelt en geen backend kiest, gebruikt OpenClaw de Docker-backend. Deze voert tools en sandboxbrowsers lokaal uit via de Docker-daemonsocket (`/var/run/docker.sock`). Isolatie van sandboxcontainers wordt bepaald door Docker-namespaces.

Om host-GPU's beschikbaar te maken voor Docker-sandboxes, stel je `agents.defaults.sandbox.docker.gpus` in of de per-agent override `agents.list[].sandbox.docker.gpus`. De waarde wordt als afzonderlijk argument doorgegeven aan Docker's `--gpus`-flag, bijvoorbeeld `"all"` of `"device=GPU-uuid"`, en vereist een compatibele hostruntime zoals NVIDIA Container Toolkit.

<Warning>
**Docker-out-of-Docker (DooD)-beperkingen**

Als je de OpenClaw Gateway zelf als Docker-container deployt, orkestreert die sibling-sandboxcontainers via de Docker-socket van de host (DooD). Dit introduceert een specifieke beperking voor pathmapping:

- **Configuratie vereist hostpaden**: De `openclaw.json`-`workspace`-configuratie MOET het **absolute pad van de host** bevatten (bijv. `/home/user/.openclaw/workspaces`), niet het interne pad van de Gateway-container. Wanneer OpenClaw de Docker-daemon vraagt een sandbox te starten, evalueert de daemon paden relatief aan de namespace van het host-OS, niet aan de Gateway-namespace.
- **FS-bridge-pariteit (identieke volumemap)**: Het native OpenClaw Gateway-proces schrijft ook Heartbeat- en bridge-bestanden naar de `workspace`-directory. Omdat de Gateway exact dezelfde string (het hostpad) evalueert vanuit zijn eigen gecontaineriseerde omgeving, MOET de Gateway-deployment een identieke volumemap bevatten die de hostnamespace native koppelt (`-v /home/user/.openclaw:/home/user/.openclaw`).

Als je paden intern mapt zonder absolute hostpariteit, gooit OpenClaw native een `EACCES`-permissiefout bij een poging zijn Heartbeat binnen de containeromgeving te schrijven, omdat de volledig gekwalificeerde padstring daar native niet bestaat.
</Warning>

### SSH-backend

Gebruik `backend: "ssh"` wanneer je wilt dat OpenClaw `exec`, bestandstools en medialezingen sandboxt op een willekeurige via SSH toegankelijke machine.

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
  <Accordion title="How it works">
    - OpenClaw maakt een per-scope externe root onder `sandbox.ssh.workspaceRoot`.
    - Bij eerste gebruik na aanmaken of opnieuw aanmaken seedt OpenClaw die externe werkruimte één keer vanuit de lokale werkruimte.
    - Daarna draaien `exec`, `read`, `write`, `edit`, `apply_patch`, promptmedialezingen en inkomende mediastaging rechtstreeks tegen de externe werkruimte via SSH.
    - OpenClaw synchroniseert externe wijzigingen niet automatisch terug naar de lokale werkruimte.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: gebruik bestaande lokale bestanden en geef ze door via OpenSSH-configuratie.
    - `identityData`, `certificateData`, `knownHostsData`: gebruik inline strings of SecretRefs. OpenClaw lost ze op via de normale secrets-runtime-snapshot, schrijft ze naar tijdelijke bestanden met `0600` en verwijdert ze wanneer de SSH-sessie eindigt.
    - Als zowel `*File` als `*Data` voor hetzelfde item zijn ingesteld, wint `*Data` voor die SSH-sessie.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    Dit is een **remote-canonical** model. De externe SSH-werkruimte wordt de echte sandboxstatus na de initiële seed.

    - Host-lokale bewerkingen die buiten OpenClaw na de seedstap worden gemaakt, zijn extern niet zichtbaar totdat je de sandbox opnieuw aanmaakt.
    - `openclaw sandbox recreate` verwijdert de per-scope externe root en seedt opnieuw vanuit lokaal bij het volgende gebruik.
    - Browsersandboxing wordt niet ondersteund op de SSH-backend.
    - `sandbox.docker.*`-instellingen gelden niet voor de SSH-backend.

  </Accordion>
</AccordionGroup>

### OpenShell-backend

Gebruik `backend: "openshell"` wanneer je wilt dat OpenClaw tools in een door OpenShell beheerde externe omgeving sandboxt. Zie de toegewezen [OpenShell-pagina](/nl/gateway/openshell) voor de volledige setupgids, configuratiereferentie en vergelijking van werkruimtemodi.

OpenShell hergebruikt hetzelfde kern-SSH-transport en dezelfde externe filesystem-bridge als de generieke SSH-backend, en voegt OpenShell-specifieke lifecycle toe (`sandbox create/get/delete`, `sandbox ssh-config`) plus de optionele `mirror`-werkruimtemodus.

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

- `mirror` (standaard): lokale werkruimte blijft canonical. OpenClaw synchroniseert lokale bestanden naar OpenShell vóór exec en synchroniseert de externe werkruimte terug na exec.
- `remote`: OpenShell-werkruimte is canonical nadat de sandbox is aangemaakt. OpenClaw seedt de externe werkruimte één keer vanuit de lokale werkruimte, waarna bestandstools en exec rechtstreeks tegen de externe sandbox draaien zonder wijzigingen terug te synchroniseren.

<AccordionGroup>
  <Accordion title="Remote transport details">
    - OpenClaw vraagt OpenShell om sandboxspecifieke SSH-configuratie via `openshell sandbox ssh-config <name>`.
    - Core schrijft die SSH-configuratie naar een tijdelijk bestand, opent de SSH-sessie en hergebruikt dezelfde externe filesystem-bridge die door `backend: "ssh"` wordt gebruikt.
    - Alleen in `mirror`-modus verschilt de lifecycle: synchroniseer lokaal naar extern vóór exec, en synchroniseer daarna terug na exec.

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - sandboxbrowser wordt nog niet ondersteund
    - `sandbox.docker.binds` wordt niet ondersteund op de OpenShell-backend
    - Docker-specifieke runtimeknoppen onder `sandbox.docker.*` gelden nog steeds alleen voor de Docker-backend

  </Accordion>
</AccordionGroup>

#### Werkruimtemodi

OpenShell heeft twee werkruimtemodellen. Dit is in de praktijk het belangrijkste deel.

<Tabs>
  <Tab title="mirror (local canonical)">
    Gebruik `plugins.entries.openshell.config.mode: "mirror"` wanneer je wilt dat de **lokale werkruimte canonical blijft**.

    Gedrag:

    - Vóór `exec` synchroniseert OpenClaw de lokale werkruimte naar de OpenShell-sandbox.
    - Na `exec` synchroniseert OpenClaw de externe werkruimte terug naar de lokale werkruimte.
    - Bestandstools werken nog steeds via de sandbox-bridge, maar de lokale werkruimte blijft tussen beurten de source of truth.

    Gebruik dit wanneer:

    - je bestanden lokaal buiten OpenClaw bewerkt en wilt dat die wijzigingen automatisch in de sandbox verschijnen
    - je wilt dat de OpenShell-sandbox zich zo veel mogelijk gedraagt als de Docker-backend
    - je wilt dat de host-werkruimte sandbox-schrijfacties na elke exec-beurt weergeeft

    Afweging: extra synchronisatiekosten vóór en na exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Gebruik `plugins.entries.openshell.config.mode: "remote"` wanneer je wilt dat de **OpenShell-werkruimte canoniek wordt**.

    Gedrag:

    - Wanneer de sandbox voor het eerst wordt gemaakt, vult OpenClaw de externe werkruimte eenmalig vanuit de lokale werkruimte.
    - Daarna werken `exec`, `read`, `write`, `edit` en `apply_patch` rechtstreeks op de externe OpenShell-werkruimte.
    - OpenClaw synchroniseert externe wijzigingen na exec **niet** terug naar de lokale werkruimte.
    - Media-lezingen op prompttijd blijven werken omdat bestands- en mediatools via de sandbox-bridge lezen in plaats van uit te gaan van een lokaal hostpad.
    - Transport verloopt via SSH naar de OpenShell-sandbox die wordt geretourneerd door `openshell sandbox ssh-config`.

    Belangrijke gevolgen:

    - Als je na de seed-stap bestanden op de host buiten OpenClaw bewerkt, ziet de externe sandbox die wijzigingen **niet** automatisch.
    - Als de sandbox opnieuw wordt gemaakt, wordt de externe werkruimte opnieuw gevuld vanuit de lokale werkruimte.
    - Met `scope: "agent"` of `scope: "shared"` wordt die externe werkruimte op hetzelfde bereik gedeeld.

    Gebruik dit wanneer:

    - de sandbox primair aan de externe OpenShell-kant moet leven
    - je minder synchronisatie-overhead per beurt wilt
    - je niet wilt dat host-lokale bewerkingen stilzwijgend de externe sandboxstatus overschrijven

  </Tab>
</Tabs>

Kies `mirror` als je de sandbox ziet als een tijdelijke uitvoeringsomgeving. Kies `remote` als je de sandbox ziet als de echte werkruimte.

#### OpenShell-levenscyclus

OpenShell-sandboxes worden nog steeds beheerd via de normale sandbox-levenscyclus:

- `openclaw sandbox list` toont zowel OpenShell-runtimes als Docker-runtimes
- `openclaw sandbox recreate` verwijdert de huidige runtime en laat OpenClaw deze bij het volgende gebruik opnieuw maken
- opschoonlogica is ook backend-bewust

Voor de modus `remote` is opnieuw maken extra belangrijk:

- opnieuw maken verwijdert de canonieke externe werkruimte voor dat bereik
- het volgende gebruik vult een nieuwe externe werkruimte vanuit de lokale werkruimte

Voor de modus `mirror` reset opnieuw maken vooral de externe uitvoeringsomgeving, omdat de lokale werkruimte toch canoniek blijft.

## Werkruimtetoegang

`agents.defaults.sandbox.workspaceAccess` bepaalt **wat de sandbox kan zien**:

<Tabs>
  <Tab title="none (default)">
    Tools zien een sandbox-werkruimte onder `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Koppelt de agent-werkruimte alleen-lezen op `/agent` (schakelt `write`/`edit`/`apply_patch` uit).
  </Tab>
  <Tab title="rw">
    Koppelt de agent-werkruimte lezen/schrijven op `/workspace`.
  </Tab>
</Tabs>

Met de OpenShell-backend:

- de modus `mirror` gebruikt nog steeds de lokale werkruimte als de canonieke bron tussen exec-beurten
- de modus `remote` gebruikt na de initiële seed de externe OpenShell-werkruimte als de canonieke bron
- `workspaceAccess: "ro"` en `"none"` beperken schrijfgedrag nog steeds op dezelfde manier

Inkomende media worden gekopieerd naar de actieve sandbox-werkruimte (`media/inbound/*`).

<Note>
**Opmerking over Skills:** de tool `read` is sandbox-rooted. Met `workspaceAccess: "none"` spiegelt OpenClaw geschikte Skills naar de sandbox-werkruimte (`.../skills`) zodat ze gelezen kunnen worden. Met `"rw"` zijn werkruimte-Skills leesbaar vanuit `/workspace/skills`.
</Note>

## Aangepaste bind mounts

`agents.defaults.sandbox.docker.binds` koppelt extra hostmappen in de container. Formaat: `host:container:mode` (bijv. `"/home/user/source:/source:rw"`).

Globale binds en binds per agent worden **samengevoegd** (niet vervangen). Onder `scope: "shared"` worden binds per agent genegeerd.

`agents.defaults.sandbox.browser.binds` koppelt extra hostmappen alleen in de **sandboxbrowser**-container.

- Wanneer ingesteld (inclusief `[]`), vervangt dit `agents.defaults.sandbox.docker.binds` voor de browsercontainer.
- Wanneer weggelaten, valt de browsercontainer terug op `agents.defaults.sandbox.docker.binds` (achterwaarts compatibel).

Voorbeeld (alleen-lezen bron + een extra datamap):

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
- OpenClaw blokkeert ook veelvoorkomende credential-roots in thuismappen, zoals `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` en `~/.ssh`.
- Bind-validatie is niet alleen stringmatching. OpenClaw normaliseert het bronpad en lost het daarna opnieuw op via de diepste bestaande ancestor voordat geblokkeerde paden en toegestane roots opnieuw worden gecontroleerd.
- Dat betekent dat ontsnappingen via symlink-parents nog steeds fail-closed zijn, zelfs wanneer het uiteindelijke leaf nog niet bestaat. Voorbeeld: `/workspace/run-link/new-file` wordt nog steeds opgelost als `/var/run/...` als `run-link` daarheen wijst.
- Toegestane bron-roots worden op dezelfde manier gecanonicaliseerd, dus een pad dat alleen vóór symlinkresolutie binnen de allowlist lijkt te liggen, wordt nog steeds geweigerd als `outside allowed roots`.
- Gevoelige mounts (geheimen, SSH-sleutels, servicecredentials) moeten `:ro` zijn, tenzij absoluut vereist.
- Combineer met `workspaceAccess: "ro"` als je alleen leestoegang tot de werkruimte nodig hebt; bind-modi blijven onafhankelijk.
- Zie [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) voor hoe binds samenwerken met toolbeleid en verhoogde exec.

</Warning>

## Images en setup

Standaard Docker-image: `openclaw-sandbox:bookworm-slim`

<Note>
**Bron-checkout versus npm-installatie**

De helperscripts `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` en `scripts/sandbox-browser-setup.sh` zijn alleen beschikbaar wanneer je draait vanuit een [bron-checkout](https://github.com/openclaw/openclaw). Ze zijn niet opgenomen in het npm-pakket.

Als je OpenClaw hebt geïnstalleerd via `npm install -g openclaw`, gebruik dan in plaats daarvan de inline `docker build`-commando's hieronder.
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

    De standaard-image bevat **geen** Node. Als een skill Node nodig heeft (of andere runtimes), bak dan een aangepaste image of installeer via `sandbox.docker.setupCommand` (vereist netwerk-egress + schrijfbare root + root-gebruiker).

    OpenClaw vervangt niet stilzwijgend door gewone `debian:bookworm-slim` wanneer `openclaw-sandbox:bookworm-slim` ontbreekt. Sandbox-runs die de standaard-image targeten, falen snel met een bouwinstructie totdat je deze bouwt, omdat de meegeleverde image `python3` bevat voor sandbox-helpers voor schrijven/bewerken.

  </Step>
  <Step title="Optional: build the common image">
    Voor een functionelere sandbox-image met gangbare tooling (bijvoorbeeld `curl`, `jq`, `nodejs`, `python3`, `git`):

    Vanuit een bron-checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Bouw vanuit een npm-installatie eerst de standaard-image (zie hierboven) en bouw daarna de common-image erbovenop met de [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) uit de repository.

    Stel vervolgens `agents.defaults.sandbox.docker.image` in op `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    Vanuit een bron-checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Bouw vanuit een npm-installatie met de [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) uit de repository.

  </Step>
</Steps>

Standaard draaien Docker-sandboxcontainers met **geen netwerk**. Overschrijf dit met `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    De meegeleverde sandboxbrowser-image past ook conservatieve Chromium-opstartstandaarden toe voor gecontaineriseerde workloads. Huidige containerstandaarden omvatten:

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
    - De drie graphics-hardeningflags (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) zijn optioneel en nuttig wanneer containers geen GPU-ondersteuning hebben. Stel `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` in als je workload WebGL of andere 3D-/browserfuncties vereist.
    - `--disable-extensions` is standaard ingeschakeld en kan worden uitgeschakeld met `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` voor flows die afhankelijk zijn van extensies.
    - `--renderer-process-limit=2` wordt beheerd door `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, waarbij `0` de standaard van Chromium behoudt.

    Als je een ander runtimeprofiel nodig hebt, gebruik dan een aangepaste browser-image en lever je eigen entrypoint. Gebruik voor lokale (niet-container) Chromium-profielen `browser.extraArgs` om extra opstartflags toe te voegen.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` wordt geblokkeerd.
    - `network: "container:<id>"` wordt standaard geblokkeerd (risico op omzeiling via namespace-join).
    - Break-glass-override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker-installaties en de gecontaineriseerde Gateway staan hier: [Docker](/nl/install/docker)

Voor Docker Gateway-deployments kan `scripts/docker/setup.sh` sandboxconfiguratie bootstrappen. Stel `OPENCLAW_SANDBOX=1` (of `true`/`yes`/`on`) in om dat pad in te schakelen. Je kunt de socketlocatie overschrijven met `OPENCLAW_DOCKER_SOCKET`. Volledige setup- en env-referentie: [Docker](/nl/install/docker#agent-sandbox).

## setupCommand (eenmalige container-setup)

`setupCommand` draait **één keer** nadat de sandboxcontainer is gemaakt (niet bij elke run). Het wordt in de container uitgevoerd via `sh -lc`.

Paden:

- Globaal: `agents.defaults.sandbox.docker.setupCommand`
- Per agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Veelvoorkomende valkuilen">
    - Standaard is `docker.network` `"none"` (geen uitgaand verkeer), waardoor pakketinstallaties mislukken.
    - `docker.network: "container:<id>"` vereist `dangerouslyAllowContainerNamespaceJoin: true` en is alleen bedoeld als noodoplossing.
    - `readOnlyRoot: true` voorkomt schrijfacties; stel `readOnlyRoot: false` in of bak een aangepaste image.
    - `user` moet root zijn voor pakketinstallaties (laat `user` weg of stel `user: "0:0"` in).
    - Sandbox-exec neemt host-`process.env` **niet** over. Gebruik `agents.defaults.sandbox.docker.env` (of een aangepaste image) voor skill-API-sleutels.

  </Accordion>
</AccordionGroup>

## Toolbeleid en escape hatches

Tool-allow/deny-beleid blijft van toepassing vóór sandboxregels. Als een tool globaal of per agent wordt geweigerd, brengt sandboxing die niet terug.

`tools.elevated` is een expliciete escape hatch die `exec` buiten de sandbox uitvoert (standaard `gateway`, of `node` wanneer het exec-doel `node` is). `/exec`-richtlijnen gelden alleen voor geautoriseerde afzenders en blijven per sessie bestaan; gebruik tool policy deny om `exec` hard uit te schakelen (zie [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debuggen:

- Gebruik `openclaw sandbox explain` om de effectieve sandboxmodus, het toolbeleid en fix-it-configuratiesleutels te inspecteren.
- Zie [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) voor het mentale model achter "waarom wordt dit geblokkeerd?".

Houd het vergrendeld.

## Multi-agent-overschrijvingen

Elke agent kan sandbox + tools overschrijven: `agents.list[].sandbox` en `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` voor sandbox-toolbeleid). Zie [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) voor prioriteit.

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

- [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) — overschrijvingen per agent en prioriteit
- [OpenShell](/nl/gateway/openshell) — beheerde sandbox-backendconfiguratie, werkruimtemodi en configuratiereferentie
- [Sandboxconfiguratie](/nl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) — debuggen van "waarom wordt dit geblokkeerd?"
- [Beveiliging](/nl/gateway/security)
