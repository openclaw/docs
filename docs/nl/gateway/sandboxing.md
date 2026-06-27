---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Hoe OpenClaw-sandboxing werkt: modi, scopes, werkruimtetoegang en afbeeldingen'
title: Sandboxisolatie
x-i18n:
    generated_at: "2026-06-27T17:36:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw kan **tools binnen sandbox-backends** uitvoeren om de blast radius te verkleinen. Dit is **optioneel** en wordt beheerd via configuratie (`agents.defaults.sandbox` of `agents.list[].sandbox`). Als sandboxing uit staat, worden tools op de host uitgevoerd. De Gateway blijft op de host; tooluitvoering gebeurt in een geïsoleerde sandbox wanneer dit is ingeschakeld.

<Note>
Dit is geen perfecte beveiligingsgrens, maar het beperkt de toegang tot het bestandssysteem en processen aanzienlijk wanneer het model iets doms doet.
</Note>

## Wat wordt gesandboxed

- Tooluitvoering (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, enz.).
- Optionele gesandboxte browser (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Details van gesandboxte browser">
    - Standaard start de sandboxbrowser automatisch (zorgt dat CDP bereikbaar is) wanneer de browsertool die nodig heeft. Configureer via `agents.defaults.sandbox.browser.autoStart` en `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Standaard gebruiken sandboxbrowsercontainers een specifiek Docker-netwerk (`openclaw-sandbox-browser`) in plaats van het globale `bridge`-netwerk. Configureer met `agents.defaults.sandbox.browser.network`.
    - Optioneel beperkt `agents.defaults.sandbox.browser.cdpSourceRange` CDP-ingress aan de containerrand met een CIDR-allowlist (bijvoorbeeld `172.21.0.1/32`).
    - noVNC-observertoegang is standaard met een wachtwoord beveiligd; OpenClaw geeft een kortlevende token-URL uit die een lokale bootstrappagina serveert en noVNC opent met het wachtwoord in het URL-fragment (niet in query-/headerlogs).
    - `agents.defaults.sandbox.browser.allowHostControl` laat gesandboxte sessies expliciet de hostbrowser targeten.
    - Optionele allowlists bewaken `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Niet gesandboxed:

- Het Gateway-proces zelf.
- Elke tool die expliciet buiten de sandbox mag worden uitgevoerd (bijv. `tools.elevated`).
  - **Elevated exec omzeilt sandboxing en gebruikt het geconfigureerde ontsnappingspad (`gateway` standaard, of `node` wanneer het exec-target `node` is).**
  - Als sandboxing uit staat, verandert `tools.elevated` de uitvoering niet (die draait al op de host). Zie [Elevated Mode](/nl/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` bepaalt **wanneer** sandboxing wordt gebruikt:

<Tabs>
  <Tab title="off">
    Geen sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandbox alleen **niet-main** sessies (standaard als je normale chats op de host wilt).

    `"non-main"` is gebaseerd op `session.mainKey` (standaard `"main"`), niet op agent-id. Groeps-/kanaalsessies gebruiken hun eigen sleutels, dus ze tellen als niet-main en worden gesandboxed.

  </Tab>
  <Tab title="all">
    Elke sessie draait in een sandbox.
  </Tab>
</Tabs>

## Bereik

`agents.defaults.sandbox.scope` bepaalt **hoeveel containers** worden aangemaakt:

- `"agent"` (standaard): één container per agent.
- `"session"`: één container per sessie.
- `"shared"`: één container gedeeld door alle gesandboxte sessies.

## Backend

`agents.defaults.sandbox.backend` bepaalt **welke runtime** de sandbox levert:

- `"docker"` (standaard wanneer sandboxing is ingeschakeld): lokale sandboxruntime op basis van Docker.
- `"ssh"`: generieke externe sandboxruntime op basis van SSH.
- `"openshell"`: sandboxruntime op basis van OpenShell.

SSH-specifieke configuratie staat onder `agents.defaults.sandbox.ssh`. OpenShell-specifieke configuratie staat onder `plugins.entries.openshell.config`.

### Een backend kiezen

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Waar het draait** | Lokale container                 | Elke host die via SSH bereikbaar is | Door OpenShell beheerde sandbox                 |
| **Setup**           | `scripts/sandbox-setup.sh`       | SSH-sleutel + doelhost         | OpenShell-Plugin ingeschakeld                       |
| **Werkruimtemodel** | Bind-mount of kopie              | Extern-canoniek (één keer seeden) | `mirror` of `remote`                              |
| **Netwerkbeheer**  | `docker.network` (standaard: geen) | Afhankelijk van externe host | Afhankelijk van OpenShell                           |
| **Browsersandbox** | Ondersteund                      | Niet ondersteund               | Nog niet ondersteund                                |
| **Bind-mounts**     | `docker.binds`                   | N.v.t.                         | N.v.t.                                              |
| **Best voor**       | Lokale ontwikkeling, volledige isolatie | Offloaden naar een externe machine | Beheerde externe sandboxes met optionele tweerichtingssynchronisatie |

### Docker-backend

Sandboxing staat standaard uit. Als je sandboxing inschakelt en geen backend kiest, gebruikt OpenClaw de Docker-backend. Deze voert tools en sandboxbrowsers lokaal uit via de Docker-daemonsocket (`/var/run/docker.sock`). De isolatie van sandboxcontainers wordt bepaald door Docker-namespaces.

Om host-GPU's beschikbaar te maken voor Docker-sandboxes, stel je `agents.defaults.sandbox.docker.gpus` in of de override per agent `agents.list[].sandbox.docker.gpus`. De waarde wordt als afzonderlijk argument doorgegeven aan Docker's `--gpus`-flag, bijvoorbeeld `"all"` of `"device=GPU-uuid"`, en vereist een compatibele hostruntime zoals NVIDIA Container Toolkit.

<Warning>
**Docker-out-of-Docker (DooD)-beperkingen**

Als je de OpenClaw Gateway zelf als Docker-container deployt, orkestreert die sibling-sandboxcontainers via de Docker-socket van de host (DooD). Dit introduceert een specifieke beperking voor padmapping:

- **Configuratie vereist hostpaden**: De `workspace`-configuratie in `openclaw.json` MOET het **absolute pad van de host** bevatten (bijv. `/home/user/.openclaw/workspaces`), niet het interne pad van de Gateway-container. Wanneer OpenClaw de Docker-daemon vraagt om een sandbox te starten, evalueert de daemon paden relatief aan de namespace van het host-OS, niet aan de Gateway-namespace.
- **Pariteit van FS-bridge (identieke volumemap)**: Het native OpenClaw Gateway-proces schrijft ook Heartbeat- en bridgebestanden naar de `workspace`-directory. Omdat de Gateway exact dezelfde string (het hostpad) evalueert vanuit zijn eigen gecontaineriseerde omgeving, MOET de Gateway-deployment een identieke volumemap bevatten die de hostnamespace native koppelt (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Codex-code-modus**: Wanneer een OpenClaw-sandbox actief is, schakelt OpenClaw voor die beurt de native Code Mode van de Codex-appserver, MCP-servers van de gebruiker en app-backed Plugin-uitvoering uit, omdat die native oppervlakken draaien vanuit het Gateway-host-appserverproces in plaats van de OpenClaw-sandboxbackend. Shelltoegang wordt aangeboden via OpenClaw-tools op basis van de sandbox, zoals `sandbox_exec` en `sandbox_process`, wanneer de normale exec-/proces-tools beschikbaar zijn. Mount de Docker-socket van de host niet in agentsandboxcontainers of aangepaste Codex-sandboxes.

Op Ubuntu-/AppArmor-hosts kan Codex `workspace-write` mislukken vóór het starten van de shell
wanneer je bewust native Codex `workspace-write` uitvoert zonder actieve
OpenClaw-sandboxing en de servicegebruiker geen onbevoorrechte
gebruikersnamespaces mag maken. Wanneer Docker-sandbox-egress is uitgeschakeld (`network: "none"`, de
standaard), heeft Codex ook een onbevoorrechte netwerknamespace nodig. Veelvoorkomende symptomen zijn
`bwrap: setting up uid map: Permission denied` en
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Voer
`openclaw doctor` uit; als dit een fout in de Codex bwrap-namespaceprobe meldt, geef dan de voorkeur aan
een AppArmor-profiel dat de vereiste namespaces toekent aan het OpenClaw-serviceproces.
`kernel.apparmor_restrict_unprivileged_userns=0` is een hostbrede
fallback met beveiligingstrade-offs; gebruik dit alleen wanneer die hosthouding
acceptabel is.

Als je paden intern mapt zonder absolute hostpariteit, geeft OpenClaw native een `EACCES`-permissiefout bij een poging om zijn Heartbeat binnen de containeromgeving te schrijven, omdat de volledig gekwalificeerde padstring daar native niet bestaat.
</Warning>

### SSH-backend

Gebruik `backend: "ssh"` wanneer je OpenClaw `exec`, bestandstools en medialezingen wilt laten sandboxen op een willekeurige machine die via SSH bereikbaar is.

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
    - Bij het eerste gebruik na aanmaken of opnieuw aanmaken seedt OpenClaw die externe werkruimte één keer vanuit de lokale werkruimte.
    - Daarna draaien `exec`, `read`, `write`, `edit`, `apply_patch`, promptmedialezingen en staging van inkomende media rechtstreeks tegen de externe werkruimte via SSH.
    - OpenClaw synchroniseert externe wijzigingen niet automatisch terug naar de lokale werkruimte.

  </Accordion>
  <Accordion title="Authenticatiemateriaal">
    - `identityFile`, `certificateFile`, `knownHostsFile`: gebruik bestaande lokale bestanden en geef ze door via OpenSSH-configuratie.
    - `identityData`, `certificateData`, `knownHostsData`: gebruik inline strings of SecretRefs. OpenClaw resolved ze via de normale runtime-snapshot voor secrets, schrijft ze naar tijdelijke bestanden met `0600` en verwijdert ze wanneer de SSH-sessie eindigt.
    - Als zowel `*File` als `*Data` voor hetzelfde item zijn ingesteld, wint `*Data` voor die SSH-sessie.

  </Accordion>
  <Accordion title="Gevolgen van extern-canoniek">
    Dit is een **extern-canoniek** model. De externe SSH-werkruimte wordt de echte sandboxstatus na de initiële seed.

    - Host-lokale bewerkingen die buiten OpenClaw na de seedstap worden gedaan, zijn extern niet zichtbaar totdat je de sandbox opnieuw aanmaakt.
    - `openclaw sandbox recreate` verwijdert de externe root per scope en seedt opnieuw vanuit lokaal bij het volgende gebruik.
    - Browsersandboxing wordt niet ondersteund op de SSH-backend.
    - `sandbox.docker.*`-instellingen zijn niet van toepassing op de SSH-backend.

  </Accordion>
</AccordionGroup>

### OpenShell-backend

Gebruik `backend: "openshell"` wanneer je OpenClaw tools wilt laten sandboxen in een door OpenShell beheerde externe omgeving. Zie de speciale [OpenShell-pagina](/nl/gateway/openshell) voor de volledige setupgids, configuratiereferentie en vergelijking van werkruimtemodi.

OpenShell hergebruikt hetzelfde kern-SSH-transport en dezelfde externe bestandssysteembridge als de generieke SSH-backend, en voegt OpenShell-specifieke levenscyclus toe (`sandbox create/get/delete`, `sandbox ssh-config`) plus de optionele werkruimtemodus `mirror`.

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

- `mirror` (standaard): de lokale werkruimte blijft canoniek. OpenClaw synchroniseert lokale bestanden naar OpenShell vóór exec en synchroniseert de externe werkruimte terug na exec.
- `remote`: de OpenShell-werkruimte is canoniek nadat de sandbox is aangemaakt. OpenClaw seedt de externe werkruimte één keer vanuit de lokale werkruimte, daarna draaien bestandstools en exec rechtstreeks tegen de externe sandbox zonder wijzigingen terug te synchroniseren.

<AccordionGroup>
  <Accordion title="Details van extern transport">
    - OpenClaw vraagt OpenShell om sandboxspecifieke SSH-configuratie via `openshell sandbox ssh-config <name>`.
    - Core schrijft die SSH-configuratie naar een tijdelijk bestand, opent de SSH-sessie en hergebruikt dezelfde externe bestandssysteembrug die door `backend: "ssh"` wordt gebruikt.
    - In `mirror`-modus verschilt alleen de levenscyclus: synchroniseer lokaal naar extern vóór exec en synchroniseer daarna terug na exec.

  </Accordion>
  <Accordion title="Huidige beperkingen van OpenShell">
    - sandboxbrowser wordt nog niet ondersteund
    - `sandbox.docker.binds` wordt niet ondersteund op de OpenShell-backend
    - Docker-specifieke runtimeknoppen onder `sandbox.docker.*` gelden nog steeds alleen voor de Docker-backend

  </Accordion>
</AccordionGroup>

#### Werkruimtemodi

OpenShell heeft twee werkruimtemodellen. Dit is het deel dat in de praktijk het belangrijkst is.

<Tabs>
  <Tab title="mirror (lokaal canoniek)">
    Gebruik `plugins.entries.openshell.config.mode: "mirror"` wanneer je wilt dat de **lokale werkruimte canoniek blijft**.

    Gedrag:

    - Vóór `exec` synchroniseert OpenClaw de lokale werkruimte naar de OpenShell-sandbox.
    - Na `exec` synchroniseert OpenClaw de externe werkruimte terug naar de lokale werkruimte.
    - Bestandstools werken nog steeds via de sandboxbrug, maar de lokale werkruimte blijft tussen beurten de bron van waarheid.

    Gebruik dit wanneer:

    - je bestanden lokaal buiten OpenClaw bewerkt en wilt dat die wijzigingen automatisch in de sandbox verschijnen
    - je wilt dat de OpenShell-sandbox zich zoveel mogelijk gedraagt als de Docker-backend
    - je wilt dat de hostwerkruimte sandboxschrijfacties weerspiegelt na elke exec-beurt

    Afweging: extra synchronisatiekosten vóór en na exec.

  </Tab>
  <Tab title="remote (OpenShell canoniek)">
    Gebruik `plugins.entries.openshell.config.mode: "remote"` wanneer je wilt dat de **OpenShell-werkruimte canoniek wordt**.

    Gedrag:

    - Wanneer de sandbox voor het eerst wordt gemaakt, vult OpenClaw de externe werkruimte één keer vanuit de lokale werkruimte.
    - Daarna werken `exec`, `read`, `write`, `edit` en `apply_patch` rechtstreeks tegen de externe OpenShell-werkruimte.
    - OpenClaw synchroniseert externe wijzigingen na exec **niet** terug naar de lokale werkruimte.
    - Media-reads tijdens prompts blijven werken omdat bestands- en mediatools via de sandboxbrug lezen in plaats van uit te gaan van een lokaal hostpad.
    - Transport is SSH naar de OpenShell-sandbox die door `openshell sandbox ssh-config` wordt teruggegeven.

    Belangrijke gevolgen:

    - Als je na de initiële vulstap bestanden op de host buiten OpenClaw bewerkt, ziet de externe sandbox die wijzigingen **niet** automatisch.
    - Als de sandbox opnieuw wordt gemaakt, wordt de externe werkruimte opnieuw gevuld vanuit de lokale werkruimte.
    - Met `scope: "agent"` of `scope: "shared"` wordt die externe werkruimte op datzelfde bereik gedeeld.

    Gebruik dit wanneer:

    - de sandbox primair aan de externe OpenShell-kant moet leven
    - je lagere synchronisatie-overhead per beurt wilt
    - je niet wilt dat hostlokale bewerkingen stilzwijgend externe sandboxstatus overschrijven

  </Tab>
</Tabs>

Kies `mirror` als je de sandbox ziet als een tijdelijke uitvoeringsomgeving. Kies `remote` als je de sandbox ziet als de echte werkruimte.

#### OpenShell-levenscyclus

OpenShell-sandboxes worden nog steeds beheerd via de normale sandboxlevenscyclus:

- `openclaw sandbox list` toont zowel OpenShell-runtimes als Docker-runtimes
- `openclaw sandbox recreate` verwijdert de huidige runtime en laat OpenClaw die bij het volgende gebruik opnieuw maken
- opruimlogica is ook backendbewust

Voor `remote`-modus is opnieuw maken extra belangrijk:

- opnieuw maken verwijdert de canonieke externe werkruimte voor dat bereik
- het volgende gebruik vult een verse externe werkruimte vanuit de lokale werkruimte

Voor `mirror`-modus reset opnieuw maken vooral de externe uitvoeringsomgeving, omdat de lokale werkruimte toch canoniek blijft.

## Werkruimtetoegang

`agents.defaults.sandbox.workspaceAccess` bepaalt **wat de sandbox kan zien**:

<Tabs>
  <Tab title="none (standaard)">
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

- `mirror`-modus gebruikt de lokale werkruimte nog steeds als de canonieke bron tussen exec-beurten
- `remote`-modus gebruikt de externe OpenShell-werkruimte als de canonieke bron na de initiële vulling
- `workspaceAccess: "ro"` en `"none"` beperken schrijfgedrag nog steeds op dezelfde manier

Binnenkomende media worden gekopieerd naar de actieve sandboxwerkruimte (`media/inbound/*`).

<Note>
**Skills-opmerking:** de `read`-tool is geworteld in de sandbox. Met `workspaceAccess: "none"` spiegelt OpenClaw in aanmerking komende Skills naar de sandboxwerkruimte (`.../skills`) zodat ze gelezen kunnen worden. Met `"rw"` zijn werkruimte-Skills leesbaar vanuit `/workspace/skills`, en in aanmerking komende beheerde, gebundelde of plugin-Skills worden gematerialiseerd in het gegenereerde alleen-lezen pad `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Aangepaste bind-mounts

`agents.defaults.sandbox.docker.binds` koppelt extra hostmappen in de container. Formaat: `host:container:mode` (bijv. `"/home/user/source:/source:rw"`).

Globale en per-agent binds worden **samengevoegd** (niet vervangen). Onder `scope: "shared"` worden per-agent binds genegeerd.

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
- OpenClaw blokkeert gevaarlijke bind-bronnen (bijvoorbeeld: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` en bovenliggende mounts die ze zouden blootstellen).
- OpenClaw blokkeert ook veelvoorkomende credential-roots in homedirectory's, zoals `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` en `~/.ssh`.
- Bind-validatie is niet alleen stringmatching. OpenClaw normaliseert het bronpad en resolveert het daarna opnieuw via de diepst bestaande ancestor voordat geblokkeerde paden en toegestane roots opnieuw worden gecontroleerd.
- Dat betekent dat ontsnappingen via symlink-parents nog steeds fail-closed zijn, zelfs wanneer het uiteindelijke leaf nog niet bestaat. Voorbeeld: `/workspace/run-link/new-file` resolveert nog steeds als `/var/run/...` als `run-link` daarheen wijst.
- Toegestane bron-roots worden op dezelfde manier gecanonicaliseerd, dus een pad dat alleen vóór symlink-resolutie binnen de allowlist lijkt te liggen, wordt nog steeds geweigerd als `outside allowed roots`.
- Gevoelige mounts (secrets, SSH-sleutels, servicecredentials) moeten `:ro` zijn, tenzij absoluut vereist.
- Combineer met `workspaceAccess: "ro"` als je alleen leestoegang tot de werkruimte nodig hebt; bind-modi blijven onafhankelijk.
- Zie [Sandbox versus toolbeleid versus elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) voor hoe binds samenwerken met toolbeleid en elevated exec.

</Warning>

## Images en setup

Standaard Docker-image: `openclaw-sandbox:bookworm-slim`

<Note>
**Source-checkout versus npm-installatie**

De helperscripts `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` en `scripts/sandbox-browser-setup.sh` zijn alleen beschikbaar wanneer je draait vanuit een [source-checkout](https://github.com/openclaw/openclaw). Ze zijn niet opgenomen in het npm-pakket.

Als je OpenClaw hebt geïnstalleerd via `npm install -g openclaw`, gebruik dan in plaats daarvan de hieronder getoonde inline `docker build`-opdrachten.
</Note>

<Steps>
  <Step title="Bouw de standaardimage">
    Vanuit een source-checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Vanuit een npm-installatie (geen source-checkout nodig):

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

    De standaardimage bevat **geen** Node. Als een Skill Node nodig heeft (of andere runtimes), bak dan een aangepaste image of installeer via `sandbox.docker.setupCommand` (vereist netwerk-egress + schrijfbare root + rootgebruiker).

    OpenClaw vervangt ontbrekende `openclaw-sandbox:bookworm-slim` niet stilzwijgend door gewone `debian:bookworm-slim`. Sandboxruns die op de standaardimage zijn gericht, falen snel met een bouwinstructie totdat je die bouwt, omdat de gebundelde image `python3` bevat voor sandbox write/edit-helpers.

  </Step>
  <Step title="Optioneel: bouw de common image">
    Voor een functionelere sandboximage met gangbare tooling (bijvoorbeeld `curl`, `jq`, Node 24, pnpm, `python3` en `git`):

    Vanuit een source-checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Vanuit een npm-installatie: bouw eerst de standaardimage (zie hierboven) en bouw daarna de common image erbovenop met de [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) uit de repository.

    Stel daarna `agents.defaults.sandbox.docker.image` in op `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optioneel: bouw de sandboxbrowserimage">
    Vanuit een source-checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Vanuit een npm-installatie: bouw met de [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) uit de repository.

  </Step>
</Steps>

Standaard draaien Docker-sandboxcontainers met **geen netwerk**. Overschrijf dit met `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Chromium-standaarden voor sandboxbrowser">
    De gebundelde sandboxbrowserimage past ook conservatieve Chromium-opstartstandaarden toe voor gecontaineriseerde workloads. Huidige containerstandaarden omvatten:

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
    - De drie hardeningsvlaggen voor graphics (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) zijn optioneel en nuttig wanneer containers geen GPU-ondersteuning hebben. Stel `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` in als je workload WebGL of andere 3D-/browserfuncties vereist.
    - `--disable-extensions` is standaard ingeschakeld en kan worden uitgeschakeld met `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` voor flows die afhankelijk zijn van extensies.
    - `--renderer-process-limit=2` wordt beheerd door `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, waarbij `0` de Chromium-standaard behoudt.

    Als je een ander runtimeprofiel nodig hebt, gebruik dan een aangepaste browserimage en lever je eigen entrypoint. Gebruik voor lokale (niet-container) Chromium-profielen `browser.extraArgs` om extra opstartvlaggen toe te voegen.

  </Accordion>
  <Accordion title="Standaardinstellingen voor netwerkbeveiliging">
    - `network: "host"` wordt geblokkeerd.
    - `network: "container:<id>"` wordt standaard geblokkeerd (risico op omzeiling via namespace-join).
    - Noodprocedure-override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker-installaties en de gecontaineriseerde Gateway staan hier: [Docker](/nl/install/docker)

Voor Docker Gateway-deployments kan `scripts/docker/setup.sh` de sandbox-configuratie bootstrappen. Stel `OPENCLAW_SANDBOX=1` in (of `true`/`yes`/`on`) om dat pad in te schakelen. Je kunt de socketlocatie overschrijven met `OPENCLAW_DOCKER_SOCKET`. Volledige setup- en env-referentie: [Docker](/nl/install/docker#agent-sandbox).

## setupCommand (eenmalige container-setup)

`setupCommand` wordt **eenmaal** uitgevoerd nadat de sandbox-container is gemaakt (niet bij elke run). Het wordt binnen de container uitgevoerd via `sh -lc`.

Paden:

- Globaal: `agents.defaults.sandbox.docker.setupCommand`
- Per agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Veelvoorkomende valkuilen">
    - Standaard is `docker.network` `"none"` (geen egress), dus pakketinstallaties mislukken.
    - `docker.network: "container:<id>"` vereist `dangerouslyAllowContainerNamespaceJoin: true` en is alleen bedoeld als noodprocedure.
    - `readOnlyRoot: true` voorkomt schrijfacties; stel `readOnlyRoot: false` in of bak een aangepaste image.
    - `user` moet root zijn voor pakketinstallaties (laat `user` weg of stel `user: "0:0"` in).
    - Sandbox-exec erft host-`process.env` **niet**. Gebruik `agents.defaults.sandbox.docker.env` (of een aangepaste image) voor skill-API-sleutels.
    - Waarden in `agents.defaults.sandbox.docker.env` worden doorgegeven als expliciete omgevingsvariabelen voor de Docker-container. Iedereen met toegang tot de Docker-daemon kan ze inspecteren met Docker-metadatacommando's zoals `docker inspect`. Gebruik een aangepaste image, een gemount geheim bestand of een ander pad voor geheimlevering als die metadata-blootstelling niet acceptabel is.

  </Accordion>
</AccordionGroup>

## Toolbeleid en uitwijkmogelijkheden

Toolbeleid voor toestaan/weigeren blijft van toepassing vóór sandbox-regels. Als een tool globaal of per agent wordt geweigerd, brengt sandboxing die niet terug.

`tools.elevated` is een expliciete uitwijkmogelijkheid die `exec` buiten de sandbox uitvoert (standaard `gateway`, of `node` wanneer het exec-doel `node` is). `/exec`-directives gelden alleen voor geautoriseerde afzenders en blijven per sessie behouden; gebruik toolbeleid met weigeren om `exec` volledig uit te schakelen (zie [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debuggen:

- Gebruik `openclaw sandbox explain` om de effectieve sandbox-modus, het toolbeleid en fix-it-configuratiesleutels te inspecteren.
- Zie [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) voor het denkmodel achter "waarom wordt dit geblokkeerd?".

Houd het streng afgeschermd.

## Multi-agent-overrides

Elke agent kan sandbox + tools overschrijven: `agents.list[].sandbox` en `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` voor sandbox-toolbeleid). Zie [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) voor voorrang.

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

- [Multi-Agent Sandbox & Tools](/nl/tools/multi-agent-sandbox-tools) — overrides per agent en voorrang
- [OpenShell](/nl/gateway/openshell) — beheerde sandbox-backendsetup, werkruimtemodi en configuratiereferentie
- [Sandboxconfiguratie](/nl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) — debuggen van "waarom wordt dit geblokkeerd?"
- [Beveiliging](/nl/gateway/security)
