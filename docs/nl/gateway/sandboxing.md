---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Hoe OpenClaw-sandboxing werkt: modi, bereiken, werkruimtetoegang en images'
title: Sandboxing
x-i18n:
    generated_at: "2026-07-12T08:52:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw kan tooluitvoering binnen een sandboxbackend uitvoeren om de impact te beperken. Sandboxing is standaard uitgeschakeld en wordt geregeld via `agents.defaults.sandbox` (globaal) of `agents.list[].sandbox` (per agent). Het Gateway-proces blijft altijd op de host; alleen de tooluitvoering wordt naar de sandbox verplaatst wanneer deze is ingeschakeld.

<Note>
Dit is geen perfecte beveiligingsgrens, maar het beperkt de toegang tot het bestandssysteem en processen aanzienlijk wanneer het model iets doms doet.
</Note>

## Wat in de sandbox wordt uitgevoerd

- Tooluitvoering: `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, enzovoort.
- De optionele browser in de sandbox (`agents.defaults.sandbox.browser`).

Niet in de sandbox uitgevoerd:

- Het Gateway-proces zelf.
- Elke tool die via `tools.elevated` expliciet buiten de sandbox mag worden uitgevoerd. Uitvoering met verhoogde rechten omzeilt sandboxing en gebruikt het geconfigureerde ontsnappingspad (standaard `gateway`, of `node` wanneer het uitvoeringsdoel `node` is). Als sandboxing is uitgeschakeld, verandert `tools.elevated` niets, omdat de uitvoering al op de host plaatsvindt. Zie [Modus met verhoogde rechten](/nl/tools/elevated).

## Modi, bereik en backend

Drie onafhankelijke instellingen bepalen het sandboxgedrag:

| Instelling | Sleutel                            | Waarden                      | Standaard |
| ---------- | ---------------------------------- | ---------------------------- | --------- |
| Modus      | `agents.defaults.sandbox.mode`     | `off`, `non-main`, `all`     | `off`     |
| Bereik     | `agents.defaults.sandbox.scope`    | `agent`, `session`, `shared` | `agent`   |
| Backend    | `agents.defaults.sandbox.backend`  | `docker`, `ssh`, `openshell` | `docker`  |

**Modus** bepaalt wanneer sandboxing van toepassing is:

- `off`: geen sandboxing.
- `non-main`: voer elke sessie behalve de hoofdsessie van de agent in een sandbox uit. De sleutel van de hoofdsessie is altijd `agent:<agentId>:main` (of `global` wanneer `session.scope` `"global"` is); deze is niet configureerbaar. Groeps- en kanaalsessies gebruiken hun eigen sleutels, gelden dus altijd als niet-hoofdsessies en worden in een sandbox uitgevoerd.
- `all`: elke sessie wordt in een sandbox uitgevoerd.

**Bereik** bepaalt hoeveel containers/omgevingen worden gemaakt:

- `agent`: één container per agent.
- `session`: één container per sessie.
- `shared`: één container die door alle sessies in een sandbox wordt gedeeld (overschrijvingen van `docker`/`ssh`/`browser` per agent worden binnen dit bereik genegeerd).

**Backend** bepaalt welke runtime tools in een sandbox uitvoert. SSH-specifieke configuratie staat onder `agents.defaults.sandbox.ssh`; OpenShell-specifieke configuratie staat onder `plugins.entries.openshell.config`.

|                      | Docker                              | SSH                                      | OpenShell                                                    |
| -------------------- | ----------------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| **Waar het draait**  | Lokale container                    | Elke via SSH toegankelijke host          | Door OpenShell beheerde sandbox                              |
| **Installatie**      | `scripts/sandbox-setup.sh`          | SSH-sleutel + doelhost                   | OpenShell-plugin ingeschakeld                                |
| **Werkruimtemodel**  | Bind-mount of kopie                 | Extern canoniek (eenmaal initialiseren)  | `mirror` of `remote`                                         |
| **Netwerkbeheer**    | `docker.network` (standaard: geen)  | Afhankelijk van de externe host          | Afhankelijk van OpenShell                                    |
| **Browsersandbox**   | Ondersteund                         | Niet ondersteund                         | Nog niet ondersteund                                         |
| **Bind-mounts**      | `docker.binds`                      | N.v.t.                                   | N.v.t.                                                       |
| **Meest geschikt voor** | Lokale ontwikkeling, volledige isolatie | Uitbesteden aan een externe machine | Beheerde externe sandboxes met optionele tweerichtingssynchronisatie |

## Docker-backend

Docker is de standaardbackend zodra sandboxing is ingeschakeld. Tools en sandboxbrowsers worden lokaal uitgevoerd via de Docker-daemonsocket (`/var/run/docker.sock`); de isolatie wordt geleverd door Docker-namespaces.

Standaardwaarden: `network: "none"` (geen uitgaand verkeer), `readOnlyRoot: true`, `capDrop: ["ALL"]`, image `openclaw-sandbox:bookworm-slim`.

Stel `agents.defaults.sandbox.docker.gpus` (of de overschrijving per agent) in op een waarde zoals `"all"` of `"device=GPU-uuid"` om GPU's van de host beschikbaar te maken. Deze waarde wordt doorgegeven aan de Docker-vlag `--gpus` en vereist een compatibele hostruntime, zoals NVIDIA Container Toolkit.

<Warning>
**Beperkingen van Docker-out-of-Docker (DooD)**

Als u de OpenClaw Gateway zelf als Docker-container implementeert, beheert deze naastliggende sandboxcontainers via de Docker-socket van de host (DooD). Dit introduceert een beperking voor padtoewijzing:

- **Configuratie vereist hostpaden**: `workspace` in `openclaw.json` moet het **absolute pad van de host** bevatten (bijvoorbeeld `/home/user/.openclaw/workspaces`), niet het interne pad van de Gateway-container. De Docker-daemon beoordeelt paden ten opzichte van de naamruimte van het hostbesturingssysteem, niet de eigen naamruimte van de Gateway.
- **Overeenkomende volumetoewijzing vereist**: het Gateway-proces schrijft ook Heartbeat- en bridgebestanden naar dat `workspace`-pad. Geef de Gateway-container een identieke volumetoewijzing (`-v /home/user/.openclaw:/home/user/.openclaw`), zodat hetzelfde hostpad ook vanuit de Gateway-container correct wordt omgezet. Niet-overeenkomende toewijzingen leiden tot `EACCES` wanneer de Gateway de Heartbeat probeert te schrijven.
- **Codex-codemodus**: wanneer een OpenClaw-sandbox actief is, schakelt OpenClaw voor die beurt de ingebouwde codemodus van de Codex-app-server, MCP-servers van de gebruiker en door apps ondersteunde pluginuitvoering uit (deze worden uitgevoerd vanuit het app-serverproces op de Gateway-host, niet vanuit de OpenClaw-sandboxbackend), tenzij het toolbeleid van de sandbox de vereiste tools beschikbaar stelt en u zich aanmeldt voor het experimentele pad voor de uitvoeringsserver in de sandbox. Shelltoegang verloopt dan via tools met een OpenClaw-sandboxbackend, zoals `sandbox_exec` en `sandbox_process`. Koppel de Docker-socket van de host niet aan agentsandboxcontainers of aangepaste Codex-sandboxes. Zie [Codex-harnas](/nl/plugins/codex-harness) voor het volledige gedrag.

Op Ubuntu-/AppArmor-hosts waarop de Docker-sandboxmodus is ingeschakeld, heeft `workspace-write`-shelluitvoering van de Codex-app-server onbevoorrechte gebruikersnaamruimten binnen de sandboxcontainer nodig. Dit kan mislukken voordat de shell wordt gestart wanneer de servicegebruiker deze niet kan maken. Er is ook een onbevoorrechte netwerknaamruimte nodig wanneer uitgaand verkeer vanuit de Docker-sandbox is uitgeschakeld (`network: "none"`, de standaardwaarde). Veelvoorkomende symptomen: `bwrap: setting up uid map: Permission denied` en `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Voer `openclaw doctor` uit; als dit een fout meldt bij de Codex-bwrap-naamruimtecontrole, gebruik dan bij voorkeur een AppArmor-profiel dat de vereiste naamruimten toestaat voor het OpenClaw-serviceproces. `kernel.apparmor_restrict_unprivileged_userns=0` is een terugvaloptie voor de hele host met gevolgen voor de beveiliging; gebruik deze alleen wanneer die beveiligingshouding voor de host acceptabel is.
</Warning>

### Browser in de sandbox

- De sandboxbrowser start automatisch (en zorgt dat CDP bereikbaar is) wanneer de browsertool deze nodig heeft. Configureer dit via `agents.defaults.sandbox.browser.autoStart` (standaard `true`) en `autoStartTimeoutMs` (standaard 12 s).
- Sandboxbrowsercontainers gebruiken een speciaal Docker-netwerk (`openclaw-sandbox-browser`) in plaats van het globale `bridge`-netwerk. Configureer dit met `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` beperkt binnenkomend CDP-verkeer aan de containerrand met een CIDR-toelatingslijst (bijvoorbeeld `172.21.0.1/32`).
- noVNC-waarnemerstoegang is standaard beveiligd met een wachtwoord; OpenClaw genereert een URL met een kortlevend token die een lokale opstartpagina aanbiedt en noVNC opent met het wachtwoord in het URL-fragment (niet in de querytekenreeks of headerlogboeken).
- Met `agents.defaults.sandbox.browser.allowHostControl` (standaard `false`) kunnen sessies in een sandbox expliciet de hostbrowser als doel gebruiken.
- Optionele toelatingslijsten bewaken `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## SSH-backend

Gebruik `backend: "ssh"` om `exec`, bestandstools en het lezen van media in een sandbox uit te voeren op een willekeurige via SSH toegankelijke machine.

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
          // Of gebruik SecretRefs / inline-inhoud in plaats van lokale bestanden:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Standaardwaarden: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`.

- **Levenscyclus**: OpenClaw maakt onder `sandbox.ssh.workspaceRoot` een externe hoofdmap per bereik. Bij het eerste gebruik na aanmaak of heraanmaak vult OpenClaw die externe werkruimte eenmaal vanuit de lokale werkruimte. Daarna werken `exec`, `read`, `write`, `edit`, `apply_patch`, het lezen van promptmedia en de voorbereiding van inkomende media rechtstreeks via SSH op de externe werkruimte. OpenClaw synchroniseert externe wijzigingen niet automatisch terug naar de lokale werkruimte.
- **Authenticatiemateriaal**: `identityFile`/`certificateFile`/`knownHostsFile` verwijzen naar bestaande lokale bestanden. `identityData`/`certificateData`/`knownHostsData` accepteren inline-tekenreeksen of SecretRefs, worden via de normale momentopname van de secretsruntime omgezet, naar tijdelijke bestanden met modus `0600` geschreven en verwijderd wanneer de SSH-sessie eindigt. Als voor hetzelfde item zowel een `*File`- als een `*Data`-variant is ingesteld, krijgt `*Data` voor die sessie voorrang.
- **Gevolgen van extern canoniek**: de externe SSH-werkruimte wordt na de eerste initialisatie de werkelijke sandboxstatus. Lokale bewerkingen op de host die na de initialisatiestap buiten OpenClaw worden uitgevoerd, zijn extern niet zichtbaar totdat u de sandbox opnieuw maakt. `openclaw sandbox recreate` verwijdert de externe hoofdmap per bereik en initialiseert deze bij het volgende gebruik opnieuw vanuit de lokale werkruimte. Browsersandboxing wordt niet ondersteund op deze backend en instellingen van `sandbox.docker.*` zijn er niet op van toepassing.

## OpenShell-backend

Gebruik `backend: "openshell"` om tools in een door OpenShell beheerde externe omgeving in een sandbox uit te voeren. OpenShell hergebruikt hetzelfde SSH-transport en dezelfde externe bestandssysteembridge als de algemene SSH-backend en voegt de OpenShell-levenscyclus (`sandbox create/get/delete/ssh-config`) plus een optionele `mirror`-modus voor werkruimtesynchronisatie toe.

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
        },
      },
    },
  },
}
```

`mode: "mirror"` (standaard) houdt de lokale werkruimte canoniek: OpenClaw synchroniseert de lokale werkruimte vóór `exec` naar de sandbox en synchroniseert deze daarna terug. `mode: "remote"` initialiseert de externe werkruimte eenmaal vanuit de lokale werkruimte en voert daarna `exec`/`read`/`write`/`edit`/`apply_patch` rechtstreeks op de externe werkruimte uit zonder terug te synchroniseren; lokale bewerkingen na de initialisatie zijn onzichtbaar totdat u `openclaw sandbox recreate` uitvoert. Onder `scope: "agent"` of `scope: "shared"` wordt die externe werkruimte binnen hetzelfde bereik gedeeld. Huidige beperkingen: de sandboxbrowser wordt nog niet ondersteund en `sandbox.docker.binds` is niet van toepassing op deze backend.

`openclaw sandbox list`/`recreate`/prune behandelen OpenShell-runtimes allemaal hetzelfde als Docker-runtimes; de opschoonlogica houdt rekening met de backend.

Zie [OpenShell](/nl/gateway/openshell) voor alle vereisten, de configuratiereferentie, de vergelijking van werkruimtemodi en details over de levenscyclus.

## Toegang tot de werkruimte

`agents.defaults.sandbox.workspaceAccess` bepaalt wat de sandbox kan zien:

| Waarde           | Gedrag                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `none` (standaard) | Tools zien een geïsoleerde sandboxwerkruimte onder `~/.openclaw/sandboxes`.                  |
| `ro`             | Koppelt de agentwerkruimte alleen-lezen aan `/agent` (schakelt `write`/`edit`/`apply_patch` uit). |
| `rw`             | Koppelt de agentwerkruimte voor lezen/schrijven aan `/workspace`.                              |

Met de OpenShell-backend gebruikt de modus `mirror` nog steeds de lokale werkruimte als canonieke bron tussen exec-beurten, gebruikt de modus `remote` na de initiële vulling de externe OpenShell-werkruimte als canonieke bron en beperken `workspaceAccess: "ro"`/`"none"` het schrijfgedrag nog steeds op dezelfde manier.

Inkomende media worden naar de actieve sandboxwerkruimte gekopieerd (`media/inbound/*`).

<Note>
**Skills**: de tool `read` is verankerd in de sandboxhoofdmap. Met `workspaceAccess: "none"` spiegelt OpenClaw geschikte Skills naar de sandboxwerkruimte (`.../skills`), zodat ze kunnen worden gelezen. Met `"rw"` zijn Skills uit de werkruimte leesbaar vanuit `/workspace/skills` en worden geschikte beheerde, meegeleverde of Plugin-Skills beschikbaar gemaakt in het gegenereerde alleen-lezenpad `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Aangepaste bind-mounts

`agents.defaults.sandbox.docker.binds` koppelt extra hostmappen aan de container. Indeling: `host:container:mode` (bijvoorbeeld `"/home/user/source:/source:rw"`).

Globale en agentspecifieke bind-mounts worden samengevoegd (niet vervangen). Bij `scope: "shared"` worden agentspecifieke bind-mounts genegeerd.

`agents.defaults.sandbox.browser.binds` koppelt extra hostmappen uitsluitend aan de container van de **sandboxbrowser**. Wanneer dit is ingesteld (ook als `[]`), vervangt het `docker.binds` voor de browsercontainer; wanneer het is weggelaten, valt de browsercontainer terug op `docker.binds`.

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
**Beveiliging van bind-mounts**

- Bind-mounts omzeilen het sandboxbestandssysteem: ze stellen hostpaden beschikbaar met de modus die u instelt (`:ro` of `:rw`).
- OpenClaw blokkeert standaard gevaarlijke bind-bronnen: systeempaden (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), Docker-socketmappen (`/run`, `/var/run` en hun `docker.sock`-varianten) en veelgebruikte hoofdmappen voor referenties in de thuismap (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- Validatie normaliseert het bronpad en lost het daarna opnieuw op via de diepste bestaande bovenliggende map voordat geblokkeerde paden en toegestane hoofdmappen opnieuw worden gecontroleerd. Daardoor worden ontsnappingen via bovenliggende symbolische koppelingen standaard geblokkeerd, zelfs wanneer het uiteindelijke blad nog niet bestaat (bijvoorbeeld `/workspace/run-link/new-file` wordt nog steeds als `/var/run/...` opgelost als `run-link` daarnaar verwijst).
- Bind-doelen die de gereserveerde containerkoppelpunten (`/workspace`, `/agent`) overschaduwen, worden eveneens standaard geblokkeerd; overschrijf dit met `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Bind-bronnen buiten de toegestane hoofdmappen van de werkruimte/agentwerkruimte worden standaard geblokkeerd; overschrijf dit met `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Toegestane hoofdmappen worden op dezelfde manier gecanonicaliseerd, zodat een pad dat vóór het oplossen van symbolische koppelingen alleen binnen de toelatingslijst lijkt te liggen, alsnog wordt geweigerd omdat het buiten de toegestane hoofdmappen ligt.
- Gevoelige mountpoints (geheimen, SSH-sleutels, servicereferenties) moeten `:ro` zijn, tenzij schrijftoegang absoluut vereist is.
- Combineer dit met `workspaceAccess: "ro"` als u alleen leestoegang tot de werkruimte nodig hebt; bind-modi blijven onafhankelijk.
- Zie [Sandbox versus toolbeleid versus verhoogde rechten](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) voor hoe bind-mounts samenwerken met toolbeleid en exec met verhoogde rechten.

</Warning>

## Images en configuratie

Standaard-Docker-image: `openclaw-sandbox:bookworm-slim`

<Note>
**Broncheckout versus npm-installatie**

De hulpscripts `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` en `scripts/sandbox-browser-setup.sh` zijn alleen beschikbaar wanneer u werkt vanuit een [broncheckout](https://github.com/openclaw/openclaw). Ze zijn niet opgenomen in het npm-pakket.

Als u OpenClaw hebt geïnstalleerd via `npm install -g openclaw`, gebruikt u in plaats daarvan de hieronder getoonde inline-opdrachten voor `docker build`.
</Note>

<Steps>
  <Step title="De standaard-image bouwen">
    Vanuit een broncheckout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Vanuit een npm-installatie (geen broncheckout vereist):

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

    De standaard-image bevat **geen** Node. Als een Skill Node (of andere runtimes) nodig heeft, bouwt u die in een aangepaste image in of installeert u die via `sandbox.docker.setupCommand` (vereist uitgaand netwerkverkeer + een beschrijfbare hoofdmap + rootgebruiker).

    OpenClaw gebruikt niet stilzwijgend het gewone `debian:bookworm-slim` wanneer `openclaw-sandbox:bookworm-slim` ontbreekt. Sandboxuitvoeringen die op de standaard-image zijn gericht, stoppen direct met een bouwinstructie totdat u deze bouwt, omdat de meegeleverde image `python3` bevat voor de schrijf-/bewerkhulpmiddelen van de sandbox.

  </Step>
  <Step title="Optioneel: de algemene image bouwen">
    Voor een functionelere sandbox-image met veelgebruikte tools (bijvoorbeeld `curl`, `jq`, Node 24, pnpm, `python3` en `git`):

    Vanuit een broncheckout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Vanuit een npm-installatie bouwt u eerst de standaard-image (zie hierboven) en bouwt u vervolgens de algemene image daarop met [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) uit de repository.

    Stel daarna `agents.defaults.sandbox.docker.image` in op `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optioneel: de sandboxbrowser-image bouwen">
    Vanuit een broncheckout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Vanuit een npm-installatie bouwt u met [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) uit de repository.

  </Step>
</Steps>

Standaard worden Docker-sandboxcontainers uitgevoerd **zonder netwerk**. Overschrijf dit met `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Standaardinstellingen van Chromium in de sandboxbrowser">
    De meegeleverde sandboxbrowser-image past behoudende opstartvlaggen voor gecontaineriseerde werkbelastingen toe:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new` wanneer `browser.headless` is ingeschakeld.
    - `--no-sandbox --disable-setuid-sandbox` wanneer `browser.noSandbox` is ingeschakeld.
    - Standaard `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer`; deze vlaggen voor grafische versterking helpen containers zonder GPU-ondersteuning. Stel `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` in als uw werkbelasting WebGL of andere 3D-functies nodig heeft.
    - Standaard `--disable-extensions`; stel `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` in voor processen die afhankelijk zijn van extensies.
    - Standaard `--renderer-process-limit=2`; geregeld door `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, waarbij `0` de standaardwaarde van Chromium behoudt.

    Als u een ander runtimeprofiel nodig hebt, gebruikt u een aangepaste browser-image en levert u uw eigen toegangspunt. Voor lokale Chromium-profielen (niet in containers) gebruikt u `browser.extraArgs` om extra opstartvlaggen toe te voegen.

  </Accordion>
  <Accordion title="Standaardinstellingen voor netwerkbeveiliging">
    - `network: "host"` wordt geblokkeerd.
    - `network: "container:<id>"` wordt standaard geblokkeerd (risico op omzeiling via samenvoeging van naamruimten).
    - Noodoverschrijving: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Docker-installaties en de gecontaineriseerde Gateway vindt u hier: [Docker](/nl/install/docker)

Voor Docker-implementaties van de Gateway kan `scripts/docker/setup.sh` de sandboxconfiguratie initialiseren. Stel `OPENCLAW_SANDBOX=1` (of `true`/`yes`/`on`) in om dat pad in te schakelen. Overschrijf de socketlocatie met `OPENCLAW_DOCKER_SOCKET`. Volledige configuratie en naslaginformatie voor omgevingsvariabelen: [Docker](/nl/install/docker#agent-sandbox).

## setupCommand (eenmalige containerconfiguratie)

`setupCommand` wordt **eenmaal** uitgevoerd nadat de sandboxcontainer is gemaakt (niet bij elke uitvoering). Het wordt in de container uitgevoerd via `sh -lc`.

Paden:

- Globaal: `agents.defaults.sandbox.docker.setupCommand`
- Per agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Veelvoorkomende valkuilen">
    - De standaardwaarde van `docker.network` is `"none"` (geen uitgaand verkeer), waardoor pakketinstallaties mislukken.
    - `docker.network: "container:<id>"` vereist `dangerouslyAllowContainerNamespaceJoin: true` en is uitsluitend bedoeld voor noodgevallen.
    - `readOnlyRoot: true` voorkomt schrijfbewerkingen; stel `readOnlyRoot: false` in of bouw een aangepaste image.
    - `user` moet root zijn voor pakketinstallaties (laat `user` weg of stel `user: "0:0"` in).
    - Sandbox-exec neemt `process.env` van de host **niet** over. Gebruik `agents.defaults.sandbox.docker.env` (of een aangepaste image) voor API-sleutels van Skills.
    - Waarden in `agents.defaults.sandbox.docker.env` worden als expliciete omgevingsvariabelen van de Docker-container doorgegeven. Iedereen met toegang tot de Docker-daemon kan deze inspecteren met Docker-metadataopdrachten zoals `docker inspect`. Gebruik een aangepaste image, een gekoppeld geheimenbestand of een andere methode voor het aanleveren van geheimen als die blootstelling via metadata onaanvaardbaar is.

  </Accordion>
</AccordionGroup>

## Toolbeleid en ontsnappingsmogelijkheden

Toestaan-/weigerenbeleid voor tools wordt nog steeds vóór sandboxregels toegepast. Als een tool globaal of per agent wordt geweigerd, maakt sandboxing deze niet opnieuw beschikbaar.

`tools.elevated` is een expliciete ontsnappingsmogelijkheid die `exec` buiten de sandbox uitvoert (standaard op de `gateway`, of op de `node` wanneer het exec-doel `node` is). `/exec`-instructies gelden alleen voor geautoriseerde afzenders en blijven per sessie behouden; om `exec` volledig uit te schakelen, gebruikt u weigering via het toolbeleid (zie [Sandbox versus toolbeleid versus verhoogde rechten](/nl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Foutopsporing:

- `openclaw sandbox list` toont sandboxcontainers, status, overeenkomst van de image, leeftijd, inactieve tijd en de gekoppelde sessie/agent.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` inspecteert de effectieve sandboxmodus, hostwerkruimte, runtimewerkmap, Docker-mounts, toolbeleid en configuratiesleutels voor oplossingen. Het veld `workspaceRoot` blijft de geconfigureerde sandboxhoofdmap; `effectiveHostWorkspaceRoot` toont waar de actieve werkruimte zich daadwerkelijk bevindt.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` verwijdert containers/omgevingen, zodat deze bij het volgende gebruik opnieuw met de huidige configuratie worden gemaakt.
- Zie [Sandbox versus toolbeleid versus verhoogde rechten](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) voor het denkmodel achter “waarom wordt dit geblokkeerd?”.

## Overschrijvingen voor meerdere agents

Elke agent kan sandbox + tools overschrijven: `agents.list[].sandbox` en `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` voor het toolbeleid van de sandbox). Zie [Sandbox en tools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools) voor de prioriteitsvolgorde.

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

- [Multi-agentsandbox en -tools](/nl/tools/multi-agent-sandbox-tools) -- overschrijvingen per agent en voorrangsvolgorde
- [OpenShell](/nl/gateway/openshell) -- instelling van de beheerde sandboxbackend, werkruimtemodi en configuratiereferentie
- [Sandboxconfiguratie](/nl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox versus toolbeleid versus verhoogde bevoegdheden](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) -- fouten opsporen bij "waarom wordt dit geblokkeerd?"
- [Beveiliging](/nl/gateway/security)
