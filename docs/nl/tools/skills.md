---
read_when:
    - Skills toevoegen of wijzigen
    - Toegangscontrole voor Skills, toelatingslijsten of laadregels wijzigen
    - Prioriteit van Skills en snapshotgedrag begrijpen
sidebarTitle: Skills
summary: Skills leren je agent hoe hij tools gebruikt. Leer hoe ze worden geladen, hoe voorrang werkt en hoe je gating, allowlists en omgevingsinjectie configureert.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:40:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills zijn markdown-instructiebestanden die de agent leren hoe en wanneer hij
tools moet gebruiken. Elke skill staat in een map met een `SKILL.md`-bestand met
YAML-frontmatter en een markdown-body. OpenClaw laadt gebundelde skills plus
eventuele lokale overschrijvingen, en filtert ze tijdens het laden op basis van
omgeving, configuratie en aanwezigheid van binaries.

<CardGroup cols={2}>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Bouw en test een aangepaste skill vanaf nul.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Beoordeel en keur door agents opgestelde skillvoorstellen goed.
  </Card>
  <Card title="Skills-configuratie" href="/nl/tools/skills-config" icon="gear">
    Volledig `skills.*`-configuratieschema en agent-allowlists.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Blader door communityskills en installeer ze.
  </Card>
</CardGroup>

## Laadvolgorde

OpenClaw laadt uit deze bronnen, **hoogste prioriteit eerst**. Wanneer dezelfde
skillnaam op meerdere plaatsen voorkomt, wint de hoogste bron.

| Prioriteit  | Bron                   | Pad                                     |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — hoogste | Werkruimte-skills      | `<workspace>/skills`                    |
| 2           | Projectagent-skills    | `<workspace>/.agents/skills`            |
| 3           | Persoonlijke agent-skills | `~/.agents/skills`                   |
| 4           | Beheerde / lokale skills | `~/.openclaw/skills`                  |
| 5           | Gebundelde skills      | meegeleverd met de installatie          |
| 6 — laagste | Extra mappen           | `skills.load.extraDirs` + plugin-skills |

Skillroots ondersteunen gegroepeerde indelingen. OpenClaw ontdekt een skill
wanneer `SKILL.md` ergens onder een geconfigureerde root voorkomt:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Het mappad is alleen bedoeld voor organisatie. De naam van de skill, slashcommand
en allowlist-sleutel komen allemaal uit het frontmatter-veld `name` (of uit de
mapnaam wanneer `name` ontbreekt).

<Note>
  De native `$CODEX_HOME/skills`-map van Codex CLI is **geen** OpenClaw
  skillroot. Gebruik `openclaw migrate plan codex` om die skills te inventariseren
  en vervolgens `openclaw migrate codex` om ze naar je OpenClaw-werkruimte te
  kopiëren.
</Note>

## Per-agent versus gedeelde skills

In multi-agent-opstellingen heeft elke agent zijn eigen werkruimte. Gebruik het
pad dat overeenkomt met de gewenste zichtbaarheid:

| Bereik             | Pad                          | Zichtbaar voor                 |
| ------------------ | ---------------------------- | ------------------------------ |
| Per-agent          | `<workspace>/skills`         | Alleen die agent               |
| Projectagent       | `<workspace>/.agents/skills` | Alleen de agent van die werkruimte |
| Persoonlijke agent | `~/.agents/skills`           | Alle agents op deze machine    |
| Gedeeld beheerd    | `~/.openclaw/skills`         | Alle agents op deze machine    |
| Extra mappen       | `skills.load.extraDirs`      | Alle agents op deze machine    |

## Agent-allowlists

Skill**locatie** (prioriteit) en skill**zichtbaarheid** (welke agent deze kan
gebruiken) zijn afzonderlijke controles. Gebruik allowlists om te beperken welke
skills een agent ziet, ongeacht waar ze vandaan worden geladen.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist-regels">
    - Laat `agents.defaults.skills` weg om standaard alle skills onbeperkt te laten.
    - Laat `agents.list[].skills` weg om `agents.defaults.skills` te erven.
    - Stel `agents.list[].skills: []` in om geen skills voor die agent beschikbaar te maken.
    - Een niet-lege `agents.list[].skills`-lijst is de **definitieve** set — deze
      wordt niet samengevoegd met defaults.
    - De effectieve allowlist geldt voor promptopbouw, ontdekking van slashcommands,
      sandbox-synchronisatie en skillsnapshots.
    - Dit is geen autorisatiegrens voor de hostshell. Als dezelfde agent
      `exec` kan gebruiken, beperk die shell dan afzonderlijk met sandboxing,
      OS-gebruikersisolatie, exec-deny/allowlists en credentials per resource.
  </Accordion>
</AccordionGroup>

## Plugins en skills

Plugins kunnen hun eigen skills meeleveren door `skills`-mappen te vermelden in
`openclaw.plugin.json` (paden relatief aan de pluginroot). Plugin-skills worden
geladen wanneer de plugin is ingeschakeld — de browserplugin levert bijvoorbeeld
een `browser-automation`-skill voor meerstaps browserbesturing.

Plugin-skillmappen worden samengevoegd op hetzelfde lage prioriteitsniveau als
`skills.load.extraDirs`, dus een gelijknamige gebundelde, beheerde, agent- of
werkruimte-skill overschrijft ze. Scherm ze af via
`metadata.openclaw.requires.config` op de configuratie-entry van de plugin.

Zie [Plugins](/nl/tools/plugin) en [Tools](/nl/tools) voor het volledige pluginsysteem.

## Skill Workshop

[Skill Workshop](/nl/tools/skill-workshop) is een wachtrij voor voorstellen tussen
de agent en je actieve skillbestanden. Wanneer de agent herbruikbaar werk
herkent, stelt hij een voorstel op in plaats van rechtstreeks naar `SKILL.md` te
schrijven. Je beoordeelt en keurt goed voordat er iets verandert.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Zie [Skill Workshop](/nl/tools/skill-workshop) voor de volledige levenscyclus, CLI-
referentie en configuratie.

## Installeren vanuit ClawHub

[ClawHub](https://clawhub.ai) is het openbare skillsregister. Gebruik
`openclaw skills`-commands voor installatie en updates, of de `clawhub` CLI voor
publiceren en synchroniseren.

| Actie                                  | Command                                                |
| -------------------------------------- | ------------------------------------------------------ |
| Installeer een skill in de werkruimte  | `openclaw skills install @owner/<slug>`                |
| Installeer vanuit een Git-repository   | `openclaw skills install git:owner/repo@ref`           |
| Installeer een lokale skillmap         | `openclaw skills install ./path/to/skill --as my-tool` |
| Installeer voor alle lokale agents     | `openclaw skills install @owner/<slug> --global`       |
| Werk alle werkruimte-skills bij        | `openclaw skills update --all`                         |
| Werk een gedeelde beheerde skill bij   | `openclaw skills update @owner/<slug> --global`        |
| Werk alle gedeelde beheerde skills bij | `openclaw skills update --all --global`                |
| Verifieer de trust-envelop van een skill | `openclaw skills verify @owner/<slug>`               |
| Druk de gegenereerde Skill Card af     | `openclaw skills verify @owner/<slug> --card`          |
| Publiceer / synchroniseer via ClawHub CLI | `clawhub sync --all`                                |

<AccordionGroup>
  <Accordion title="Installatiedetails">
    `openclaw skills install` installeert standaard in de `skills/`-map van de
    actieve werkruimte. Voeg `--global` toe om te installeren in de gedeelde
    `~/.openclaw/skills`-map, zichtbaar voor alle lokale agents tenzij
    agent-allowlists dit beperken.

    Git- en lokale installaties verwachten `SKILL.md` in de bronroot. De slug
    komt uit de `name`-frontmatter van `SKILL.md` wanneer die geldig is, en valt
    daarna terug op de map- of repositorynaam. Gebruik `--as <slug>` om dit te
    overschrijven. `openclaw skills update` volgt alleen ClawHub-installaties —
    installeer Git- of lokale bronnen opnieuw om ze te vernieuwen.

  </Accordion>
  <Accordion title="Verificatie en beveiligingsscans">
    `openclaw skills verify @owner/<slug>` vraagt ClawHub om de
    `clawhub.skill.verify.v1`-trust-envelop van de skill. Geïnstalleerde ClawHub-
    skills worden geverifieerd tegen de versie en het register die zijn
    vastgelegd in `.clawhub/origin.json`. Bare slugs blijven geaccepteerd voor
    bestaande geïnstalleerde of ondubbelzinnige skills, maar refs met eigenaar
    voorkomen onduidelijkheid over de uitgever.

    ClawHub-skillpagina's tonen vóór installatie de nieuwste status van de
    beveiligingsscan, met detailpagina's voor VirusTotal, ClawScan en statische
    analyse. Het command eindigt met een niet-nulcode wanneer ClawHub de
    verificatie als mislukt markeert. Uitgevers herstellen fout-positieven via
    het ClawHub-dashboard of `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installaties uit privéarchieven">
    Gateway-clients die niet-ClawHub-levering nodig hebben, kunnen een zip-
    skillarchief klaarzetten met `skills.upload.begin`, `skills.upload.chunk` en
    `skills.upload.commit`, en vervolgens installeren met
    `skills.install({ source: "upload", ... })`. Dit pad staat standaard uit en
    vereist `skills.install.allowUploadedArchives: true` in `openclaw.json`.
    Normale ClawHub-installaties hebben die instelling nooit nodig.
  </Accordion>
</AccordionGroup>

## Beveiliging

<Warning>
  Behandel skills van derden als **niet-vertrouwde code**. Lees ze voordat je ze
  inschakelt. Geef de voorkeur aan sandboxed runs voor niet-vertrouwde invoer en
  risicovolle tools. Zie [Sandboxing](/nl/gateway/sandboxing) voor controles aan
  agentzijde.
</Warning>

<AccordionGroup>
  <Accordion title="Padinsluiting">
    Ontdekking van werkruimte-, projectagent- en extra-map-skills accepteert
    alleen skillroots waarvan het opgeloste realpath binnen de geconfigureerde
    root blijft, tenzij `skills.load.allowSymlinkTargets` expliciet een doelroot
    vertrouwt. Skill Workshop schrijft alleen via die vertrouwde doelen wanneer
    `skills.workshop.allowSymlinkTargetWrites` is ingeschakeld.
    Beheerde `~/.openclaw/skills` en persoonlijke `~/.agents/skills` kunnen
    gesymlinkte skillmappen bevatten, maar elk `SKILL.md`-realpath moet nog
    steeds binnen de opgeloste skillmap blijven.
  </Accordion>
  <Accordion title="Installatiebeleid voor operators">
    Configureer `security.installPolicy` om een vertrouwd lokaal policy-command
    uit te voeren voordat skillinstallaties doorgaan. De policy ontvangt metadata
    en het gestagede bronpad, geldt voor ClawHub-, geüploade, Git-, lokale,
    update- en dependency-installer-paden, en faalt gesloten wanneer het command
    geen geldige beslissing kan teruggeven.
  </Accordion>
  <Accordion title="Bereik van secretinjectie">
    `skills.entries.*.env` en `skills.entries.*.apiKey` injecteren secrets alleen
    voor die agentbeurt in het **host**proces — niet in de sandbox. Houd secrets
    uit prompts en logs.
  </Accordion>
</AccordionGroup>

Zie [Beveiliging](/nl/gateway/security) voor het bredere threatmodel en
beveiligingschecklists.

## SKILL.md-indeling

Elke skill heeft minimaal een `name` en `description` in de frontmatter nodig:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw volgt de [AgentSkills](https://agentskills.io)-specificatie. De
  frontmatter-parser ondersteunt **alleen keys op één regel** — `metadata` moet
  een JSON-object op één regel zijn. Gebruik `{baseDir}` in de body om naar het
  pad van de skillmap te verwijzen.
</Note>

### Optionele frontmatter-keys

<ParamField path="homepage" type="string">
  URL die als "Website" wordt weergegeven in de macOS Skills-UI. Ook ondersteund
  via `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Wanneer `true`, wordt de skill beschikbaar gemaakt als een door de gebruiker
  aanroepbaar slashcommand.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wanneer `true`, houdt OpenClaw de instructies van de skill buiten de normale
  prompt van de agent. De skill blijft beschikbaar als slashcommand wanneer
  `user-invocable` ook `true` is.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Wanneer ingesteld op `tool`, omzeilt het slashcommand het model en dispatcht
  het rechtstreeks naar een geregistreerde tool.
</ParamField>

<ParamField path="command-tool" type="string">
  Toolnaam die moet worden aangeroepen wanneer `command-dispatch: tool` is ingesteld.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Voor tooldispatch stuurt dit de ruwe argumenttekenreeks door naar de tool zonder
  core-parsing. De tool ontvangt
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Toegangscontrole

OpenClaw filtert skills bij het laden met `metadata.openclaw` (eenregelige
JSON in de frontmatter). Een skill zonder `metadata.openclaw`-blok komt altijd
in aanmerking, tenzij deze expliciet is uitgeschakeld.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  Wanneer `true`, neem de skill altijd op en sla alle andere controles over.
</ParamField>

<ParamField path="emoji" type="string">
  Optionele emoji die wordt getoond in de macOS Skills UI.
</ParamField>

<ParamField path="homepage" type="string">
  Optionele URL die als "Website" wordt getoond in de macOS Skills UI.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Platformfilter. Wanneer ingesteld, komt de skill alleen in aanmerking op de vermelde besturingssystemen.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Elke binary moet op `PATH` bestaan.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Minstens een binary moet op `PATH` bestaan.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Elke omgevingsvariabele moet in het proces bestaan of via configuratie worden geleverd.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Elk `openclaw.json`-pad moet truthy zijn.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Naam van de omgevingsvariabele die is gekoppeld aan `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Optionele installatiespecificaties die worden gebruikt door de macOS Skills UI (brew / node / go / uv / download).
</ParamField>

<Note>
  Verouderde `metadata.clawdbot`-blokken worden nog steeds geaccepteerd wanneer
  `metadata.openclaw` ontbreekt, zodat oudere geïnstalleerde skills hun
  afhankelijkheidscontroles en installatiehints behouden. Nieuwe skills moeten
  `metadata.openclaw` gebruiken.
</Note>

### Installatiespecificaties

Installatiespecificaties vertellen de macOS Skills UI hoe een afhankelijkheid moet worden geïnstalleerd:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Regels voor installatieselectie">
    - Wanneer meerdere installers worden vermeld, kiest de Gateway een voorkeursoptie
      (brew wanneer beschikbaar, anders node).
    - Als alle installers `download` zijn, vermeldt OpenClaw elke entry zodat je
      alle beschikbare artefacten kunt zien.
    - Specificaties kunnen `os: ["darwin"|"linux"|"win32"]` bevatten om op platform te filteren.
    - Node-installaties respecteren `skills.install.nodeManager` in `openclaw.json`
      (standaard: npm; opties: npm / pnpm / yarn / bun). Dit heeft alleen invloed op
      skillinstallaties; de Gateway-runtime moet nog steeds Node zijn.
    - Installatievoorkeur van de Gateway: Homebrew → uv → geconfigureerde node-manager →
      go → download.
  </Accordion>
  <Accordion title="Details per installer">
    - **Homebrew:** OpenClaw installeert Homebrew niet automatisch en vertaalt brew-
      formules niet naar systeempakketcommando's. In Linux-containers zonder
      `brew` worden installers die alleen brew gebruiken verborgen; gebruik een aangepaste image of installeer
      de afhankelijkheid handmatig.
    - **Go:** OpenClaw vereist Go 1.21 of nieuwer voor automatische skillinstallaties en
      behoudt de bestaande instellingen voor `GOBIN`, `GOPATH` en `GOTOOLCHAIN`. Als de
      geconfigureerde toolchain niet kan voldoen aan de vereiste Go-versie van een module,
      groepeert onboarding de skill met handmatige Go-vereisten na de installatiepoging.
      Als `go` ontbreekt en Homebrew beschikbaar is, installeert OpenClaw
      Go eerst via Homebrew en stelt `GOBIN` in op de `bin` van Homebrew. Op Linux
      kan OpenClaw in plaats daarvan `apt-get` gebruiken als root of via wachtwoordloze `sudo`
      wanneer de vernieuwde `golang-go`-kandidaat aan de minimumversie voldoet.
    - **Download:** `url` (vereist), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (standaard: automatisch wanneer archief gedetecteerd), `stripComponents`,
      `targetDir` (standaard: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Opmerkingen over sandboxing">
    `requires.bins` wordt bij het laden van skills op de **host** gecontroleerd. Als een agent
    in een sandbox draait, moet de binary ook **binnen de container** bestaan.
    Installeer deze via `agents.defaults.sandbox.docker.setupCommand` of een aangepaste
    image. `setupCommand` wordt eenmaal uitgevoerd na het maken van de container en vereist
    netwerkuitgaand verkeer, een beschrijfbaar rootbestandssysteem en een rootgebruiker in de sandbox.
  </Accordion>
</AccordionGroup>

## Configuratie-overschrijvingen

Schakel gebundelde of beheerde skills in of configureer ze onder `skills.entries` in
`~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` schakelt de skill uit, zelfs wanneer deze gebundeld of geïnstalleerd is. De gebundelde
  skill `coding-agent` is opt-in — stel `skills.entries.coding-agent.enabled: true`
  in en zorg dat een van `claude`, `codex`, `opencode` of een andere ondersteunde CLI
  is geïnstalleerd en geauthenticeerd.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Gemaksveld voor skills die `metadata.openclaw.primaryEnv` declareren.
  Ondersteunt een platte-teksttekenreeks of een SecretRef-object.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Omgevingsvariabelen die worden geïnjecteerd voor de agent-run. Alleen geïnjecteerd wanneer de
  variabele nog niet in het proces is ingesteld.
</ParamField>

<ParamField path="config" type="object">
  Optionele verzameling voor aangepaste configuratievelden per skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Optionele allowlist alleen voor **gebundelde** skills. Wanneer ingesteld, komen alleen gebundelde skills
  in de lijst in aanmerking. Beheerde en workspace-skills worden niet beïnvloed.
</ParamField>

<Note>
  Configuratiesleutels komen standaard overeen met de **skillnaam**. Als een skill
  `metadata.openclaw.skillKey` definieert, gebruik die sleutel dan onder `skills.entries`. Zet
  namen met koppeltekens tussen aanhalingstekens: JSON5 staat sleutels tussen aanhalingstekens toe.
</Note>

## Omgevingsinjectie

Wanneer een agent-run start, doet OpenClaw het volgende:

<Steps>
  <Step title="Leest skillmetadata">
    OpenClaw bepaalt de effectieve skilllijst voor de agent en past daarbij toegangscontrole-
    regels, allowlists en configuratie-overschrijvingen toe.
  </Step>
  <Step title="Injecteert env en API-sleutels">
    `skills.entries.<key>.env` en `skills.entries.<key>.apiKey` worden toegepast op
    `process.env` voor de duur van de run.
  </Step>
  <Step title="Bouwt de systeemprompt">
    Skills die in aanmerking komen, worden gecompileerd tot een compact XML-blok en geïnjecteerd in de
    systeemprompt.
  </Step>
  <Step title="Herstelt de omgeving">
    Nadat de run is beëindigd, wordt de oorspronkelijke omgeving hersteld.
  </Step>
</Steps>

<Warning>
  Env-injectie is beperkt tot de **host**-agent-run, niet de sandbox. Binnen een
  sandbox hebben `env` en `apiKey` geen effect. Zie
  [Skills-configuratie](/nl/tools/skills-config#sandboxed-skills-and-env-vars) voor hoe
  je secrets aan sandboxed runs doorgeeft.
</Warning>

Voor de gebundelde `claude-cli`-backend materialiseert OpenClaw dezelfde
snapshot van in aanmerking komende skills ook als tijdelijke Claude Code-plugin en geeft deze door via
`--plugin-dir`. Andere CLI-backends gebruiken alleen de promptcatalogus.

## Snapshots en vernieuwen

OpenClaw maakt snapshots van in aanmerking komende skills **wanneer een sessie start** en hergebruikt die
lijst voor alle volgende beurten in de sessie. Wijzigingen aan skills of configuratie worden
van kracht bij de volgende nieuwe sessie.

Skills worden midden in een sessie in twee gevallen vernieuwd:

- De skills-watcher detecteert een wijziging in `SKILL.md`.
- Een nieuwe in aanmerking komende externe node maakt verbinding.

De vernieuwde lijst wordt opgepakt bij de volgende agentbeurt. Als de effectieve agent-
allowlist verandert, vernieuwt OpenClaw de snapshot om zichtbare skills
uitgelijnd te houden.

<AccordionGroup>
  <Accordion title="Skills-watcher">
    Standaard bewaakt OpenClaw skillmappen en verhoogt de snapshot wanneer
    `SKILL.md`-bestanden wijzigen. Configureer onder `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    Gebruik `allowSymlinkTargets` voor opzettelijke layouts met symlinks waarbij een skillroot-
    symlink buiten de geconfigureerde root wijst, bijvoorbeeld
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Schakel `skills.workshop.allowSymlinkTargetWrites` alleen in wanneer Skill Workshop
    ook voorstellen via die vertrouwde symlinkpaden moet toepassen.

  </Accordion>
  <Accordion title="Externe macOS-nodes (Linux-gateway)">
    Als de Gateway op Linux draait maar er een **macOS-node** is verbonden met
    `system.run` toegestaan, kan OpenClaw macOS-only skills als in aanmerking komend behandelen wanneer
    de vereiste binaries op die node aanwezig zijn. De agent moet die
    skills uitvoeren via de `exec`-tool met `host=node`.

    Offline nodes maken remote-only skills **niet** zichtbaar. Als een node stopt met
    antwoorden op bin-probes, wist OpenClaw de gecachte bin-matches.

  </Accordion>
</AccordionGroup>

## Tokenimpact

Wanneer skills in aanmerking komen, injecteert OpenClaw een compact XML-blok in de systeem-
prompt. De kosten zijn deterministisch:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Basisoverhead** (alleen wanneer ≥ 1 skill): ~195 tekens
- **Per skill:** ~97 tekens + de lengtes van je `name`-, `description`- en `location`-velden
- XML-escaping breidt `& < > " '` uit naar entiteiten, wat enkele tekens per voorkomen toevoegt
- Bij ~4 tekens/token is 97 tekens ≈ 24 tokens per skill vóór veldlengtes

Houd beschrijvingen kort en beschrijvend om promptoverhead te minimaliseren.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Stapsgewijze handleiding voor het schrijven van een aangepaste skill.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Voorstellenwachtrij voor door agents opgestelde skills.
  </Card>
  <Card title="Skills-configuratie" href="/nl/tools/skills-config" icon="gear">
    Volledig `skills.*`-configuratieschema en agent-allowlists.
  </Card>
  <Card title="Slash commands" href="/nl/tools/slash-commands" icon="terminal">
    Hoe slash-commands van skills worden geregistreerd en gerouteerd.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Browse en publiceer skills in het openbare register.
  </Card>
  <Card title="Plugins" href="/nl/tools/plugin" icon="plug">
    Plugins kunnen skills meeleveren naast de tools die ze documenteren.
  </Card>
</CardGroup>
