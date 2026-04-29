---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Hoe OpenClaw-sandboxing werkt: modi, scopes, toegang tot werkruimte en afbeeldingen'
title: Sandboxisolatie
x-i18n:
    generated_at: "2026-04-29T22:47:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw kan **hulpmiddelen in sandbox-backends** uitvoeren om de impactradius te beperken. Dit is **optioneel** en wordt via configuratie beheerd (`agents.defaults.sandbox` of `agents.list[].sandbox`). Als sandboxing uit staat, worden hulpmiddelen op de host uitgevoerd. De Gateway blijft op de host; uitvoering van hulpmiddelen draait in een geisoleerde sandbox wanneer dit is ingeschakeld.

<Note>
Dit is geen perfecte beveiligingsgrens, maar het beperkt bestandsysteem- en procestoegang aanzienlijk wanneer het model iets doms doet.
</Note>

## Wat in een sandbox wordt uitgevoerd

- Uitvoering van hulpmiddelen (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, enz.).
- Optionele browser in een sandbox (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - Standaard start de sandboxbrowser automatisch (zorgt dat CDP bereikbaar is) wanneer het browserhulpmiddel die nodig heeft. Configureer via `agents.defaults.sandbox.browser.autoStart` en `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Standaard gebruiken sandboxbrowsercontainers een toegewezen Docker-netwerk (`openclaw-sandbox-browser`) in plaats van het globale `bridge`-netwerk. Configureer met `agents.defaults.sandbox.browser.network`.
    - Optioneel beperkt `agents.defaults.sandbox.browser.cdpSourceRange` CDP-ingress aan de containerrand met een CIDR-allowlist (bijvoorbeeld `172.21.0.1/32`).
    - noVNC-observertoegang is standaard met een wachtwoord beveiligd; OpenClaw geeft een kortlevende token-URL uit die een lokale bootstrap-pagina serveert en noVNC opent met het wachtwoord in het URL-fragment (niet in query-/headerlogs).
    - Met `agents.defaults.sandbox.browser.allowHostControl` kunnen sandboxsessies expliciet de hostbrowser targeten.
    - Optionele allowlists bewaken `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Niet in een sandbox uitgevoerd:

- Het Gateway-proces zelf.
- Elk hulpmiddel dat expliciet buiten de sandbox mag draaien (bijv. `tools.elevated`).
  - **Verhoogde exec omzeilt sandboxing en gebruikt het geconfigureerde ontsnappingspad (`gateway` standaard, of `node` wanneer het exec-doel `node` is).**
  - Als sandboxing uit staat, verandert `tools.elevated` de uitvoering niet (die draait al op de host). Zie [Verhoogde modus](/nl/tools/elevated).

## Modi

`agents.defaults.sandbox.mode` bepaalt **wanneer** sandboxing wordt gebruikt:

<Tabs>
  <Tab title="off">
    Geen sandboxing.
  </Tab>
  <Tab title="non-main">
    Alleen **niet-main** sessies in een sandbox (standaard als je normale chats op de host wilt).

    `"non-main"` is gebaseerd op `session.mainKey` (standaard `"main"`), niet op agent-id. Groeps-/kanaalsessies gebruiken hun eigen sleutels, dus ze tellen als niet-main en worden in een sandbox uitgevoerd.

  </Tab>
  <Tab title="all">
    Elke sessie draait in een sandbox.
  </Tab>
</Tabs>

## Bereik

`agents.defaults.sandbox.scope` bepaalt **hoeveel containers** worden gemaakt:

- `"agent"` (standaard): een container per agent.
- `"session"`: een container per sessie.
- `"shared"`: een container gedeeld door alle sandboxsessies.

## Backend

`agents.defaults.sandbox.backend` bepaalt **welke runtime** de sandbox levert:

- `"docker"` (standaard wanneer sandboxing is ingeschakeld): lokale, door Docker ondersteunde sandboxruntime.
- `"ssh"`: generieke, door SSH ondersteunde externe sandboxruntime.
- `"openshell"`: door OpenShell ondersteunde sandboxruntime.

SSH-specifieke configuratie staat onder `agents.defaults.sandbox.ssh`. OpenShell-specifieke configuratie staat onder `plugins.entries.openshell.config`.

### Een backend kiezen

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Waar het draait** | Lokale container                 | Elke via SSH toegankelijke host | Door OpenShell beheerde sandbox                     |
| **Installatie**     | `scripts/sandbox-setup.sh`       | SSH-sleutel + doelhost         | OpenShell-Plugin ingeschakeld                       |
| **Werkruimtemodel** | Bind-mount of kopie              | Extern-canoniek (eenmalig seeden) | `mirror` of `remote`                             |
| **Netwerkbeheer**   | `docker.network` (standaard: none) | Hangt af van externe host     | Hangt af van OpenShell                              |
| **Browsersandbox**  | Ondersteund                      | Niet ondersteund               | Nog niet ondersteund                                |
| **Bind-mounts**     | `docker.binds`                   | N.v.t.                         | N.v.t.                                              |
| **Meest geschikt voor** | Lokale ontwikkeling, volledige isolatie | Offloaden naar een externe machine | Beheerde externe sandboxes met optionele tweerichtingssynchronisatie |

### Docker-backend

Sandboxing staat standaard uit. Als je sandboxing inschakelt en geen backend kiest, gebruikt OpenClaw de Docker-backend. Die voert hulpmiddelen en sandboxbrowsers lokaal uit via de Docker-daemonsocket (`/var/run/docker.sock`). Isolatie van sandboxcontainers wordt bepaald door Docker-namespaces.

Om host-GPU's aan Docker-sandboxes bloot te stellen, stel je `agents.defaults.sandbox.docker.gpus` in of de override per agent `agents.list[].sandbox.docker.gpus`. De waarde wordt als afzonderlijk argument doorgegeven aan Docker's `--gpus`-vlag, bijvoorbeeld `"all"` of `"device=GPU-uuid"`, en vereist een compatibele hostruntime zoals NVIDIA Container Toolkit.

<Warning>
**Docker-out-of-Docker (DooD)-beperkingen**

Als je de OpenClaw Gateway zelf als Docker-container implementeert, orkestreert die sibling-sandboxcontainers via de Docker-socket van de host (DooD). Dit introduceert een specifieke beperking voor padmapping:

- **Configuratie vereist hostpaden**: De `openclaw.json`-`workspace`-configuratie MOET het **absolute pad van de host** bevatten (bijv. `/home/user/.openclaw/workspaces`), niet het interne Gateway-containerpad. Wanneer OpenClaw de Docker-daemon vraagt een sandbox te starten, evalueert de daemon paden relatief aan de namespace van het hostbesturingssysteem, niet aan de Gateway-namespace.
- **FS-bridge-pariteit (identieke volumemap)**: Het native proces van de OpenClaw Gateway schrijft ook heartbeat- en bridgebestanden naar de `workspace`-directory. Omdat de Gateway exact dezelfde string (het hostpad) evalueert vanuit zijn eigen gecontaineriseerde omgeving, MOET de Gateway-implementatie een identieke volumemap bevatten die de hostnamespace native koppelt (`-v /home/user/.openclaw:/home/user/.openclaw`).

Als je paden intern mapt zonder absolute hostpariteit, geeft OpenClaw native een `EACCES`-toestemmingsfout wanneer het zijn Heartbeat in de containeromgeving probeert te schrijven, omdat de volledig gekwalificeerde padstring native niet bestaat.
</Warning>

### SSH-backend

Gebruik `backend: "ssh"` wanneer je wilt dat OpenClaw `exec`, bestandshulpmiddelen en medialeesbewerkingen sandboxt op een willekeurige via SSH toegankelijke machine.

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
    - OpenClaw maakt een externe root per bereik onder `sandbox.ssh.workspaceRoot`.
    - Bij eerste gebruik na maken of opnieuw maken seedt OpenClaw die externe werkruimte eenmalig vanuit de lokale werkruimte.
    - Daarna worden `exec`, `read`, `write`, `edit`, `apply_patch`, promptmedialeesbewerkingen en staging van inkomende media rechtstreeks via SSH tegen de externe werkruimte uitgevoerd.
    - OpenClaw synchroniseert externe wijzigingen niet automatisch terug naar de lokale werkruimte.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: gebruik bestaande lokale bestanden en geef ze door via OpenSSH-configuratie.
    - `identityData`, `certificateData`, `knownHostsData`: gebruik inline strings of SecretRefs. OpenClaw lost ze op via de normale secrets-runtime-snapshot, schrijft ze naar tijdelijke bestanden met `0600` en verwijdert ze wanneer de SSH-sessie eindigt.
    - Als zowel `*File` als `*Data` voor hetzelfde item zijn ingesteld, wint `*Data` voor die SSH-sessie.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    Dit is een **extern-canoniek** model. De externe SSH-werkruimte wordt de echte sandboxstatus na de initiële seed.

    - Host-lokale bewerkingen die buiten OpenClaw na de seedstap worden gedaan, zijn extern niet zichtbaar totdat je de sandbox opnieuw maakt.
    - `openclaw sandbox recreate` verwijdert de externe root per bereik en seedt opnieuw vanuit lokaal bij het volgende gebruik.
    - Browsersandboxing wordt niet ondersteund op de SSH-backend.
    - `sandbox.docker.*`-instellingen gelden niet voor de SSH-backend.

  </Accordion>
</AccordionGroup>

### OpenShell-backend

Gebruik `backend: "openshell"` wanneer je wilt dat OpenClaw hulpmiddelen sandboxt in een door OpenShell beheerde externe omgeving. Zie de speciale [OpenShell-pagina](/nl/gateway/openshell) voor de volledige installatiehandleiding, configuratiereferentie en vergelijking van werkruimtemodi.

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
- `remote`: OpenShell-werkruimte is canoniek nadat de sandbox is gemaakt. OpenClaw seedt de externe werkruimte eenmalig vanuit de lokale werkruimte; daarna draaien bestandshulpmiddelen en exec rechtstreeks tegen de externe sandbox zonder wijzigingen terug te synchroniseren.

<AccordionGroup>
  <Accordion title="Remote transport details">
    - OpenClaw vraagt OpenShell om sandboxspecifieke SSH-configuratie via `openshell sandbox ssh-config <name>`.
    - Core schrijft die SSH-configuratie naar een tijdelijk bestand, opent de SSH-sessie en hergebruikt dezelfde externe bestandssysteembridge die wordt gebruikt door `backend: "ssh"`.
    - Alleen in `mirror`-modus verschilt de lifecycle: synchroniseer lokaal naar extern voor exec en synchroniseer daarna terug na exec.

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - sandboxbrowser wordt nog niet ondersteund
    - `sandbox.docker.binds` wordt niet ondersteund op de OpenShell-backend
    - Docker-specifieke runtimeknoppen onder `sandbox.docker.*` gelden nog steeds alleen voor de Docker-backend

  </Accordion>
</AccordionGroup>

#### Werkruimtemodi

OpenShell heeft twee werkruimtemodellen. Dit is het deel dat in de praktijk het belangrijkst is.

<Tabs>
  <Tab title="mirror (local canonical)">
    Gebruik `plugins.entries.openshell.config.mode: "mirror"` wanneer je wilt dat de **lokale werkruimte canoniek blijft**.

    Gedrag:

    - Voor `exec` synchroniseert OpenClaw de lokale werkruimte naar de OpenShell-sandbox.
    - Na `exec` synchroniseert OpenClaw de externe werkruimte terug naar de lokale werkruimte.
    - Bestandshulpmiddelen werken nog steeds via de sandboxbridge, maar de lokale werkruimte blijft tussen beurten de bron van waarheid.

    Gebruik dit wanneer:

    - je lokaal bestanden buiten OpenClaw bewerkt en wilt dat die wijzigingen automatisch in de sandbox verschijnen
    - je wilt dat de OpenShell-sandbox zich zo veel mogelijk gedraagt als de Docker-backend
    - je wilt dat de hostwerkruimte sandbox-schrijfacties weerspiegelt na elke exec-beurt

    Afweging: extra synchronisatiekosten voor en na exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Gebruik `plugins.entries.openshell.config.mode: "remote"` wanneer je wilt dat de **OpenShell-werkruimte canoniek wordt**.

    Gedrag:

    - Wanneer de sandbox voor het eerst wordt aangemaakt, zaait OpenClaw de externe werkruimte eenmalig vanuit de lokale werkruimte.
    - Daarna werken `exec`, `read`, `write`, `edit` en `apply_patch` rechtstreeks op de externe OpenShell-werkruimte.
    - OpenClaw synchroniseert externe wijzigingen **niet** terug naar de lokale werkruimte na exec.
    - Media-lezingen tijdens prompts blijven werken omdat bestands- en mediatools via de sandboxbrug lezen in plaats van uit te gaan van een lokaal hostpad.
    - Transport verloopt via SSH naar de OpenShell-sandbox die door `openshell sandbox ssh-config` wordt teruggegeven.

    Belangrijke gevolgen:

    - Als je na de zaai-stap bestanden op de host buiten OpenClaw bewerkt, ziet de externe sandbox die wijzigingen **niet** automatisch.
    - Als de sandbox opnieuw wordt aangemaakt, wordt de externe werkruimte opnieuw gezaaid vanuit de lokale werkruimte.
    - Met `scope: "agent"` of `scope: "shared"` wordt die externe werkruimte gedeeld binnen hetzelfde bereik.

    Gebruik dit wanneer:

    - de sandbox voornamelijk aan de externe OpenShell-kant moet leven
    - je lagere synchronisatie-overhead per beurt wilt
    - je niet wilt dat host-lokale bewerkingen stilzwijgend de externe sandboxstatus overschrijven

  </Tab>
</Tabs>

Kies `mirror` als je de sandbox ziet als een tijdelijke uitvoeringsomgeving. Kies `remote` als je de sandbox ziet als de echte werkruimte.

#### OpenShell-levenscyclus

OpenShell-sandboxes worden nog steeds beheerd via de normale sandboxlevenscyclus:

- `openclaw sandbox list` toont zowel OpenShell-runtimes als Docker-runtimes
- `openclaw sandbox recreate` verwijdert de huidige runtime en laat OpenClaw deze bij het volgende gebruik opnieuw aanmaken
- opschoonlogica is ook backendbewust

Voor de modus `remote` is opnieuw aanmaken extra belangrijk:

- opnieuw aanmaken verwijdert de canonieke externe werkruimte voor dat bereik
- het volgende gebruik zaait een nieuwe externe werkruimte vanuit de lokale werkruimte

Voor de modus `mirror` reset opnieuw aanmaken vooral de externe uitvoeringsomgeving, omdat de lokale werkruimte toch canoniek blijft.

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
- de modus `remote` gebruikt de externe OpenShell-werkruimte als canonieke bron na de eerste zaai
- `workspaceAccess: "ro"` en `"none"` beperken schrijfgedrag nog steeds op dezelfde manier

Binnenkomende media worden gekopieerd naar de actieve sandboxwerkruimte (`media/inbound/*`).

<Note>
**Skills-opmerking:** de tool `read` is geworteld in de sandbox. Met `workspaceAccess: "none"` spiegelt OpenClaw geschikte skills naar de sandboxwerkruimte (`.../skills`) zodat ze gelezen kunnen worden. Met `"rw"` zijn werkruimte-Skills leesbaar vanuit `/workspace/skills`.
</Note>

## Aangepaste bind-mounts

`agents.defaults.sandbox.docker.binds` koppelt extra hostmappen aan de container. Indeling: `host:container:mode` (bijv. `"/home/user/source:/source:rw"`).

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
- OpenClaw blokkeert ook veelvoorkomende credential-roots in thuismappen, zoals `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` en `~/.ssh`.
- Bind-validatie is meer dan alleen stringvergelijking. OpenClaw normaliseert het bronpad en lost het daarna opnieuw op via de diepste bestaande ancestor voordat geblokkeerde paden en toegestane roots opnieuw worden gecontroleerd.
- Dat betekent dat ontsnappingen via symlink-parents nog steeds gesloten falen, zelfs wanneer het uiteindelijke blad nog niet bestaat. Voorbeeld: `/workspace/run-link/new-file` wordt nog steeds opgelost als `/var/run/...` als `run-link` daarnaar verwijst.
- Toegestane bronroots worden op dezelfde manier gecanonicaliseerd, dus een pad dat alleen vóór symlink-resolutie binnen de allowlist lijkt te vallen, wordt nog steeds afgewezen als `outside allowed roots`.
- Gevoelige mounts (geheimen, SSH-sleutels, servicecredentials) moeten `:ro` zijn tenzij absoluut vereist.
- Combineer met `workspaceAccess: "ro"` als je alleen leestoegang tot de werkruimte nodig hebt; bind-modi blijven onafhankelijk.
- Zie [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) voor hoe binds samenwerken met toolbeleid en verhoogde exec.

</Warning>

## Images en setup

Standaard Docker-image: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Build the default image">
    ```bash
    scripts/sandbox-setup.sh
    ```

    De standaardimage bevat **geen** Node. Als een skill Node (of andere runtimes) nodig heeft, bak dan een aangepaste image of installeer via `sandbox.docker.setupCommand` (vereist netwerk-egress + beschrijfbare root + rootgebruiker).

    OpenClaw vervangt niet stilzwijgend door gewone `debian:bookworm-slim` wanneer `openclaw-sandbox:bookworm-slim` ontbreekt. Sandboxruns die op de standaardimage zijn gericht, falen snel met een bouwinstructie totdat je `scripts/sandbox-setup.sh` uitvoert, omdat de gebundelde image `python3` bevat voor sandboxhelpers voor schrijven/bewerken.

  </Step>
  <Step title="Optional: build the common image">
    Voor een functionelere sandboximage met algemene tooling (bijvoorbeeld `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Stel daarna `agents.defaults.sandbox.docker.image` in op `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Standaard draaien Docker-sandboxcontainers met **geen netwerk**. Overschrijf dit met `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
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
    - De drie graphics-hardening-flags (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) zijn optioneel en nuttig wanneer containers geen GPU-ondersteuning hebben. Stel `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` in als je workload WebGL of andere 3D-/browserfuncties vereist.
    - `--disable-extensions` is standaard ingeschakeld en kan worden uitgeschakeld met `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` voor flows die afhankelijk zijn van extensies.
    - `--renderer-process-limit=2` wordt beheerd door `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, waarbij `0` de standaard van Chromium behoudt.

    Als je een ander runtimeprofiel nodig hebt, gebruik dan een aangepaste browserimage en lever je eigen entrypoint. Gebruik voor lokale (niet-container) Chromium-profielen `browser.extraArgs` om extra opstartflags toe te voegen.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` wordt geblokkeerd.
    - `network: "container:<id>"` wordt standaard geblokkeerd (risico op omzeiling via namespace-join).
    - Break-glass-override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker-installaties en de gecontaineriseerde Gateway staan hier: [Docker](/nl/install/docker)

Voor Docker Gateway-deployments kan `scripts/docker/setup.sh` sandboxconfiguratie bootstrapen. Stel `OPENCLAW_SANDBOX=1` (of `true`/`yes`/`on`) in om dat pad in te schakelen. Je kunt de socketlocatie overschrijven met `OPENCLAW_DOCKER_SOCKET`. Volledige setup- en env-referentie: [Docker](/nl/install/docker#agent-sandbox).

## setupCommand (eenmalige container-setup)

`setupCommand` wordt **eenmalig** uitgevoerd nadat de sandboxcontainer is aangemaakt (niet bij elke run). Het wordt binnen de container uitgevoerd via `sh -lc`.

Paden:

- Globaal: `agents.defaults.sandbox.docker.setupCommand`
- Per agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - Standaard is `docker.network` `"none"` (geen egress), dus pakketinstallaties zullen mislukken.
    - `docker.network: "container:<id>"` vereist `dangerouslyAllowContainerNamespaceJoin: true` en is alleen voor break-glass.
    - `readOnlyRoot: true` voorkomt schrijven; stel `readOnlyRoot: false` in of bak een aangepaste image.
    - `user` moet root zijn voor pakketinstallaties (laat `user` weg of stel `user: "0:0"` in).
    - Sandbox-exec erft host-`process.env` **niet**. Gebruik `agents.defaults.sandbox.docker.env` (of een aangepaste image) voor skill-API-sleutels.

  </Accordion>
</AccordionGroup>

## Toolbeleid en escape hatches

Tool-allow/deny-beleid geldt nog steeds vóór sandboxregels. Als een tool globaal of per agent wordt geweigerd, brengt sandboxing die niet terug.

`tools.elevated` is een expliciete escape hatch die `exec` buiten de sandbox uitvoert (`gateway` standaard, of `node` wanneer het exec-doel `node` is). `/exec`-directives gelden alleen voor geautoriseerde afzenders en blijven per sessie behouden; gebruik toolbeleid deny om `exec` hard uit te schakelen (zie [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debuggen:

- Gebruik `openclaw sandbox explain` om de effectieve sandboxmodus, het toolbeleid en fix-it-configuratiesleutels te inspecteren.
- Zie [Sandbox vs Tool Policy vs Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) voor het mentale model achter "waarom wordt dit geblokkeerd?".

Houd het afgesloten.

## Multi-agent-overrides

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

- [Multi-agent-sandbox en tools](/nl/tools/multi-agent-sandbox-tools) — overschrijvingen per agent en prioriteit
- [OpenShell](/nl/gateway/openshell) — installatie van beheerde sandbox-backend, werkruimtemodi en configuratiereferentie
- [Sandboxconfiguratie](/nl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) — foutopsporing "waarom wordt dit geblokkeerd?"
- [Beveiliging](/nl/gateway/security)
