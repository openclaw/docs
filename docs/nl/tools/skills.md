---
read_when:
    - Skills toevoegen of wijzigen
    - Skill-gating, allowlists of laadregels wijzigen
    - Inzicht in Skills-prioriteit en snapshotgedrag
sidebarTitle: Skills
summary: Skills leren je agent hoe hij tools gebruikt. Leer hoe ze laden, hoe prioriteit werkt en hoe je gating, allowlists en omgevingsinjectie configureert.
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:21:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills zijn markdown-instructiebestanden die de agent leren hoe en wanneer hij
tools moet gebruiken. Elke skill staat in een map met een `SKILL.md`-bestand met
YAML-frontmatter en een markdown-body. OpenClaw laadt gebundelde Skills plus
eventuele lokale overschrijvingen, en filtert ze tijdens het laden op basis van
omgeving, config en aanwezigheid van binaries.

<CardGroup cols={2}>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Bouw en test een aangepaste skill vanaf nul.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Beoordeel en keur door agents opgestelde skillvoorstellen goed.
  </Card>
  <Card title="Skills-config" href="/nl/tools/skills-config" icon="gear">
    Volledig `skills.*`-configschema en allowlists voor agents.
  </Card>
  <Card title="ClawHub" href="/nl/clawhub" icon="cloud">
    Blader door community-Skills en installeer ze.
  </Card>
</CardGroup>

## Laadvolgorde

OpenClaw laadt uit deze bronnen, **hoogste prioriteit eerst**. Wanneer dezelfde
skillnaam op meerdere plaatsen voorkomt, wint de bron met de hoogste prioriteit.

| Prioriteit   | Bron                         | Pad                                     |
| ------------ | ---------------------------- | --------------------------------------- |
| 1 — hoogste  | Workspace-Skills             | `<workspace>/skills`                    |
| 2            | Project-agent-Skills         | `<workspace>/.agents/skills`            |
| 3            | Persoonlijke agent-Skills    | `~/.agents/skills`                      |
| 4            | Beheerde / lokale Skills     | `~/.openclaw/skills`                    |
| 5            | Gebundelde Skills            | meegeleverd met de installatie          |
| 6 — laagste  | Extra mappen                 | `skills.load.extraDirs` + Plugin-Skills |

Skillroots ondersteunen gegroepeerde indelingen. OpenClaw ontdekt een skill
wanneer `SKILL.md` ergens onder een geconfigureerde root voorkomt:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Het mappad is alleen bedoeld voor organisatie. De naam van de skill, slash
command en allowlist-sleutel komen allemaal uit het frontmatterveld `name` (of
uit de mapnaam wanneer `name` ontbreekt).

<Note>
  De native `$CODEX_HOME/skills`-map van Codex CLI is **geen** OpenClaw
  skillroot. Gebruik `openclaw migrate plan codex` om die Skills te
  inventariseren, en daarna `openclaw migrate codex` om ze naar je OpenClaw
  workspace te kopiëren.
</Note>

## Per-agent versus gedeelde Skills

In multi-agent-setups heeft elke agent zijn eigen workspace. Gebruik het pad dat
overeenkomt met de gewenste zichtbaarheid:

| Bereik            | Pad                          | Zichtbaar voor                  |
| ----------------- | ---------------------------- | ------------------------------- |
| Per-agent         | `<workspace>/skills`         | Alleen die agent                |
| Project-agent     | `<workspace>/.agents/skills` | Alleen de agent van die workspace |
| Persoonlijke agent | `~/.agents/skills`           | Alle agents op deze machine     |
| Gedeeld beheerd   | `~/.openclaw/skills`         | Alle agents op deze machine     |
| Extra mappen      | `skills.load.extraDirs`      | Alle agents op deze machine     |

## Allowlists voor agents

Skill**locatie** (prioriteit) en skill**zichtbaarheid** (welke agent deze kan
gebruiken) zijn afzonderlijke controles. Gebruik allowlists om te beperken welke
Skills een agent ziet, ongeacht waar ze vandaan worden geladen.

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
    - Laat `agents.defaults.skills` weg om standaard alle Skills onbeperkt te laten.
    - Laat `agents.list[].skills` weg om `agents.defaults.skills` te erven.
    - Stel `agents.list[].skills: []` in om geen Skills voor die agent bloot te stellen.
    - Een niet-lege lijst `agents.list[].skills` is de **definitieve** set — deze
      wordt niet samengevoegd met defaults.
    - De effectieve allowlist geldt voor promptopbouw, ontdekking van slash
      commands, sandboxsync en skillsnapshots.
    - Dit is geen autorisatiegrens voor de hostshell. Als dezelfde agent
      `exec` kan gebruiken, beperk die shell dan afzonderlijk met sandboxing,
      OS-gebruikersisolatie, deny-/allowlists voor exec en credentials per resource.
  </Accordion>
</AccordionGroup>

## Plugins en Skills

Plugins kunnen hun eigen Skills meeleveren door `skills`-mappen op te nemen in
`openclaw.plugin.json` (paden relatief aan de Plugin-root). Plugin-Skills worden
geladen wanneer de Plugin is ingeschakeld — de browser-Plugin levert
bijvoorbeeld een `browser-automation`-skill voor browserbesturing in meerdere
stappen.

Plugin-skillmappen worden samengevoegd op hetzelfde lage prioriteitsniveau als
`skills.load.extraDirs`, dus een gelijknamige gebundelde, beheerde, agent- of
workspace-skill overschrijft ze. Beperk ze via `metadata.openclaw.requires.config`
op de configvermelding van de Plugin.

Zie [Plugins](/nl/tools/plugin) en [Tools](/nl/tools) voor het volledige Plugin-systeem.

## Skill Workshop

[Skill Workshop](/nl/tools/skill-workshop) is een wachtrij voor voorstellen tussen
de agent en je actieve skillbestanden. Wanneer de agent herbruikbaar werk ziet,
stelt hij een voorstel op in plaats van rechtstreeks naar `SKILL.md` te schrijven.
Je beoordeelt en keurt goed voordat er iets verandert.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Zie [Skill Workshop](/nl/tools/skill-workshop) voor de volledige levenscyclus,
CLI-referentie en configuratie.

## Installeren vanuit ClawHub

[ClawHub](https://clawhub.ai) is het openbare Skills-register. Gebruik
`openclaw skills`-commando's voor installatie en updates, of de `clawhub` CLI
voor publiceren en synchroniseren.

| Actie                                      | Commando                                               |
| ------------------------------------------ | ------------------------------------------------------ |
| Installeer een skill in de workspace       | `openclaw skills install @owner/<slug>`                |
| Installeer vanuit een Git-repository       | `openclaw skills install git:owner/repo@ref`           |
| Installeer een lokale skillmap             | `openclaw skills install ./path/to/skill --as my-tool` |
| Installeer voor alle lokale agents         | `openclaw skills install @owner/<slug> --global`       |
| Werk alle workspace-Skills bij             | `openclaw skills update --all`                         |
| Werk een gedeelde beheerde skill bij       | `openclaw skills update @owner/<slug> --global`        |
| Werk alle gedeelde beheerde Skills bij     | `openclaw skills update --all --global`                |
| Verifieer de trust envelope van een skill  | `openclaw skills verify @owner/<slug>`                 |
| Druk de gegenereerde Skill Card af         | `openclaw skills verify @owner/<slug> --card`          |
| Publiceer / synchroniseer via ClawHub CLI  | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Installatiedetails">
    `openclaw skills install` installeert standaard in de `skills/`-map van de
    actieve workspace. Voeg `--global` toe om te installeren in de gedeelde
    `~/.openclaw/skills`-map, zichtbaar voor alle lokale agents tenzij
    agent-allowlists dit beperken.

    Git- en lokale installaties verwachten `SKILL.md` in de sourceroot. De slug
    komt uit `name` in de frontmatter van `SKILL.md` wanneer die geldig is, en
    valt daarna terug op de map- of repositorynaam. Gebruik `--as <slug>` om dit
    te overschrijven. `openclaw skills update` volgt alleen ClawHub-installaties
    — installeer Git- of lokale bronnen opnieuw om ze te vernieuwen.

  </Accordion>
  <Accordion title="Verificatie en securityscanning">
    `openclaw skills verify @owner/<slug>` vraagt ClawHub om de
    `clawhub.skill.verify.v1` trust envelope van de skill. Geïnstalleerde
    ClawHub-Skills worden geverifieerd tegen de versie en het register die zijn
    vastgelegd in `.clawhub/origin.json`. Bare slugs blijven geaccepteerd voor
    bestaande geïnstalleerde of eenduidige Skills, maar owner-gekwalificeerde
    refs vermijden onduidelijkheid over de uitgever.

    ClawHub-skillpagina's tonen de meest recente status van securityscans vóór
    installatie, met detailpagina's voor VirusTotal, ClawScan en statische
    analyse. Het commando sluit af met een niet-nulcode wanneer ClawHub
    verificatie als mislukt markeert. Uitgevers herstellen false positives via
    het ClawHub-dashboard of `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installaties vanuit privéarchieven">
    Gateway-clients die niet-ClawHub-levering nodig hebben, kunnen een zip-archief
    met een skill klaarzetten met `skills.upload.begin`, `skills.upload.chunk` en
    `skills.upload.commit`, en vervolgens installeren met
    `skills.install({ source: "upload", ... })`. Dit pad staat standaard uit en
    vereist `skills.install.allowUploadedArchives: true` in `openclaw.json`.
    Normale ClawHub-installaties hebben die instelling nooit nodig.
  </Accordion>
</AccordionGroup>

## Beveiliging

<Warning>
  Behandel Skills van derden als **niet-vertrouwde code**. Lees ze voordat je ze
  inschakelt. Geef de voorkeur aan sandboxed runs voor niet-vertrouwde invoer en
  risicovolle tools. Zie [Sandboxing](/nl/gateway/sandboxing) voor controles aan
  agentzijde.
</Warning>

<AccordionGroup>
  <Accordion title="Padbegrenzing">
    Ontdekking van workspace-, project-agent- en extra-dir-Skills accepteert
    alleen skillroots waarvan de opgeloste realpath binnen de geconfigureerde
    root blijft, tenzij `skills.load.allowSymlinkTargets` expliciet een targetroot
    vertrouwt. Skill Workshop schrijft alleen via die vertrouwde targets wanneer
    `skills.workshop.allowSymlinkTargetWrites` is ingeschakeld. Beheerde
    `~/.openclaw/skills` en persoonlijke `~/.agents/skills` mogen gesymlinkte
    skillmappen bevatten, maar elke realpath van `SKILL.md` moet nog steeds
    binnen de opgeloste skillmap blijven.
  </Accordion>
  <Accordion title="Installatiebeleid voor operators">
    Configureer `security.installPolicy` om een vertrouwd lokaal
    beleidscommando uit te voeren voordat skillinstallaties doorgaan. Het beleid
    ontvangt metadata en het klaargezette sourcepad, geldt voor ClawHub-,
    geüploade, Git-, lokale, update- en dependency-installer-paden, en faalt
    gesloten wanneer het commando geen geldige beslissing kan teruggeven.
  </Accordion>
  <Accordion title="Scope van secretinjectie">
    `skills.entries.*.env` en `skills.entries.*.apiKey` injecteren secrets alleen
    in het **host**-proces voor die agentturn — niet in de sandbox. Houd secrets
    buiten prompts en logs.
  </Accordion>
</AccordionGroup>

Zie [Security](/nl/gateway/security) voor het bredere dreigingsmodel en
securitychecklists.

## SKILL.md-indeling

Elke skill heeft minimaal een `name` en `description` nodig in de frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw volgt de [AgentSkills](https://agentskills.io)-specificatie. De
  frontmatterparser ondersteunt **alleen sleutels op één regel** — `metadata`
  moet een JSON-object op één regel zijn. Gebruik `{baseDir}` in de body om naar
  het mappad van de skill te verwijzen.
</Note>

### Optionele frontmattersleutels

<ParamField path="homepage" type="string">
  URL die als "Website" wordt getoond in de macOS Skills-UI. Ook ondersteund via
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Wanneer `true`, wordt de skill blootgesteld als een door de gebruiker
  aanroepbare slash command.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wanneer `true`, houdt OpenClaw de instructies van de skill uit de normale
  prompt van de agent. De skill blijft beschikbaar als slash command wanneer
  `user-invocable` ook `true` is.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Wanneer ingesteld op `tool`, omzeilt de slash command het model en dispatcht
  rechtstreeks naar een geregistreerde tool.
</ParamField>

<ParamField path="command-tool" type="string">
  Toolnaam die moet worden aangeroepen wanneer `command-dispatch: tool` is ingesteld.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Voor tooldispatch wordt de raw args-string zonder kernparsing naar de tool
  doorgestuurd. De tool ontvangt
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Toelating

OpenClaw filtert Skills tijdens het laden met `metadata.openclaw` (JSON op één
regel in de frontmatter). Een Skill zonder `metadata.openclaw`-blok komt altijd
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
  Neem de Skill altijd op en sla alle andere poorten over wanneer dit `true` is.
</ParamField>

<ParamField path="emoji" type="string">
  Optionele emoji die wordt getoond in de macOS Skills-UI.
</ParamField>

<ParamField path="homepage" type="string">
  Optionele URL die als "Website" wordt getoond in de macOS Skills-UI.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Platformfilter. Wanneer dit is ingesteld, komt de Skill alleen in aanmerking
  op de vermelde besturingssystemen.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Elk binair bestand moet bestaan op `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Ten minste één binair bestand moet bestaan op `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Elke omgevingsvariabele moet bestaan in het proces of via configuratie worden
  geleverd.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Elk `openclaw.json`-pad moet truthy zijn.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Naam van de omgevingsvariabele die is gekoppeld aan `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Optionele installatiespecificaties die worden gebruikt door de macOS Skills-UI (brew / node / go / uv / download).
</ParamField>

<Note>
  Verouderde `metadata.clawdbot`-blokken worden nog steeds geaccepteerd wanneer
  `metadata.openclaw` ontbreekt, zodat oudere geïnstalleerde Skills hun
  afhankelijkheidspoorten en installatiehints behouden. Nieuwe Skills moeten
  `metadata.openclaw` gebruiken.
</Note>

### Installatiespecificaties

Installatiespecificaties vertellen de macOS Skills-UI hoe een afhankelijkheid
moet worden geïnstalleerd:

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
  <Accordion title="Selectieregels voor installatieprogramma's">
    - Wanneer meerdere installatieprogramma's worden vermeld, kiest de gateway één
      voorkeursoptie (brew indien beschikbaar, anders node).
    - Als alle installatieprogramma's `download` zijn, vermeldt OpenClaw elke
      entry zodat je alle beschikbare artifacts kunt zien.
    - Specificaties kunnen `os: ["darwin"|"linux"|"win32"]` bevatten om op
      platform te filteren.
    - Node-installaties respecteren `skills.install.nodeManager` in
      `openclaw.json` (standaard: npm; opties: npm / pnpm / yarn / bun). Dit
      beïnvloedt alleen Skill-installaties; de Gateway-runtime moet nog steeds
      Node zijn.
    - Voorkeur van het Gateway-installatieprogramma: Homebrew → uv → geconfigureerde Node-manager →
      go → download.
  </Accordion>
  <Accordion title="Details per installatieprogramma">
    - **Homebrew:** OpenClaw installeert Homebrew niet automatisch en vertaalt
      brew-formules niet naar systeempakketcommando's. In Linux-containers
      zonder `brew` worden installatieprogramma's die alleen brew gebruiken
      verborgen; gebruik een aangepaste image of installeer de afhankelijkheid
      handmatig.
    - **Go:** als `go` ontbreekt en `brew` beschikbaar is, installeert de gateway
      eerst Go via Homebrew en stelt `GOBIN` in op de `bin` van Homebrew.
    - **Download:** `url` (vereist), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (standaard: automatisch wanneer archief wordt gedetecteerd), `stripComponents`,
      `targetDir` (standaard: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Opmerkingen over sandboxing">
    `requires.bins` wordt tijdens het laden van de Skill op de **host**
    gecontroleerd. Als een agent in een sandbox draait, moet het binaire bestand
    ook **binnen de container** bestaan. Installeer het via
    `agents.defaults.sandbox.docker.setupCommand` of een aangepaste image.
    `setupCommand` wordt één keer uitgevoerd na het maken van de container en
    vereist netwerkegress, een beschrijfbaar rootbestandssysteem en een rootgebruiker
    in de sandbox.
  </Accordion>
</AccordionGroup>

## Configuratie-overschrijvingen

Schakel gebundelde of beheerde Skills in en configureer ze onder
`skills.entries` in `~/.openclaw/openclaw.json`:

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
  `false` schakelt de Skill uit, zelfs wanneer deze gebundeld of geïnstalleerd
  is. De gebundelde Skill `coding-agent` is opt-in — stel
  `skills.entries.coding-agent.enabled: true` in en zorg dat een van `claude`,
  `codex`, `opencode` of een andere ondersteunde CLI is geïnstalleerd en
  geauthenticeerd.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Gemaksveld voor Skills die `metadata.openclaw.primaryEnv` declareren.
  Ondersteunt een plaintext-string of een SecretRef-object.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Omgevingsvariabelen die voor de agentuitvoering worden geïnjecteerd. Worden
  alleen geïnjecteerd wanneer de variabele nog niet in het proces is ingesteld.
</ParamField>

<ParamField path="config" type="object">
  Optionele verzameling voor aangepaste configuratievelden per Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Optionele allowlist alleen voor **gebundelde** Skills. Wanneer dit is ingesteld,
  komen alleen gebundelde Skills in de lijst in aanmerking. Beheerde Skills en
  workspace-Skills worden niet beïnvloed.
</ParamField>

<Note>
  Configuratiesleutels komen standaard overeen met de **Skill-naam**. Als een
  Skill `metadata.openclaw.skillKey` definieert, gebruik die sleutel dan onder
  `skills.entries`. Zet namen met koppeltekens tussen aanhalingstekens: JSON5
  staat aangehaalde sleutels toe.
</Note>

## Omgevingsinjectie

Wanneer een agentuitvoering start, doet OpenClaw het volgende:

<Steps>
  <Step title="Leest Skill-metadata">
    OpenClaw bepaalt de effectieve Skill-lijst voor de agent en past
    toelatingsregels, allowlists en configuratie-overschrijvingen toe.
  </Step>
  <Step title="Injecteert omgevingsvariabelen en API-sleutels">
    `skills.entries.<key>.env` en `skills.entries.<key>.apiKey` worden toegepast
    op `process.env` voor de duur van de uitvoering.
  </Step>
  <Step title="Bouwt de systeemprompt">
    In aanmerking komende Skills worden gecompileerd tot een compact XML-blok en
    in de systeemprompt geïnjecteerd.
  </Step>
  <Step title="Herstelt de omgeving">
    Nadat de uitvoering eindigt, wordt de oorspronkelijke omgeving hersteld.
  </Step>
</Steps>

<Warning>
  Omgevingsinjectie is beperkt tot de **host**-agentuitvoering, niet tot de
  sandbox. Binnen een sandbox hebben `env` en `apiKey` geen effect. Zie
  [Skills-configuratie](/nl/tools/skills-config#sandboxed-skills-and-env-vars) voor hoe
  je geheimen doorgeeft aan uitvoeringen in een sandbox.
</Warning>

Voor de gebundelde `claude-cli`-backend materialiseert OpenClaw ook dezelfde
in aanmerking komende Skill-momentopname als tijdelijke Claude Code-Plugin en
geeft deze door via `--plugin-dir`. Andere CLI-backends gebruiken alleen de
promptcatalogus.

## Momentopnamen en verversen

OpenClaw maakt momentopnamen van in aanmerking komende Skills **wanneer een
sessie start** en hergebruikt die lijst voor alle volgende beurten in de sessie.
Wijzigingen aan Skills of configuratie worden van kracht bij de volgende nieuwe
sessie.

Skills worden midden in een sessie in twee gevallen ververst:

- De Skills-watcher detecteert een wijziging in `SKILL.md`.
- Een nieuwe in aanmerking komende externe Node maakt verbinding.

De ververste lijst wordt bij de volgende agentbeurt opgepikt. Als de effectieve
agent-allowlist wijzigt, ververst OpenClaw de momentopname om zichtbare Skills
uitgelijnd te houden.

<AccordionGroup>
  <Accordion title="Skills-watcher">
    Standaard bewaakt OpenClaw Skill-mappen en verhoogt de momentopname wanneer
    `SKILL.md`-bestanden wijzigen. Configureer dit onder `skills.load`:

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

    Gebruik `allowSymlinkTargets` voor opzettelijke layouts met symlinks waarbij
    een root-symlink van een Skill buiten de geconfigureerde root wijst,
    bijvoorbeeld `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Schakel `skills.workshop.allowSymlinkTargetWrites` alleen in wanneer Skill Workshop
    ook voorstellen via die vertrouwde symlinkpaden moet toepassen.

  </Accordion>
  <Accordion title="Externe macOS-Nodes (Linux-gateway)">
    Als de Gateway op Linux draait maar een **macOS-Node** is verbonden met
    toegestane `system.run`, kan OpenClaw macOS-only Skills als in aanmerking
    komend behandelen wanneer de vereiste binaire bestanden op die Node aanwezig
    zijn. De agent moet die Skills uitvoeren via de `exec`-tool met `host=node`.

    Offline Nodes maken remote-only Skills **niet** zichtbaar. Als een Node niet
    meer reageert op bin-probes, wist OpenClaw de gecachete bin-matches ervan.

  </Accordion>
</AccordionGroup>

## Tokenimpact

Wanneer Skills in aanmerking komen, injecteert OpenClaw een compact XML-blok in
de systeemprompt. De kosten zijn deterministisch:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Basisoverhead** (alleen wanneer ≥ 1 Skill): ~195 tekens
- **Per Skill:** ~97 tekens + de lengtes van je velden `name`, `description` en `location`
- XML-escaping zet `& < > " '` om naar entities, wat per voorkomen enkele tekens toevoegt
- Bij ~4 tekens/token is 97 tekens ≈ 24 tokens per Skill vóór veldlengtes

Houd beschrijvingen kort en beschrijvend om promptoverhead te minimaliseren.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Stapsgewijze gids voor het schrijven van een aangepaste Skill.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Voorstellenwachtrij voor door agents opgestelde Skills.
  </Card>
  <Card title="Skills-configuratie" href="/nl/tools/skills-config" icon="gear">
    Volledig `skills.*`-configuratieschema en agent-allowlists.
  </Card>
  <Card title="Slash commands" href="/nl/tools/slash-commands" icon="terminal">
    Hoe Skill-slash commands worden geregistreerd en gerouteerd.
  </Card>
  <Card title="ClawHub" href="/nl/clawhub" icon="cloud">
    Blader door Skills in het openbare register en publiceer ze daar.
  </Card>
  <Card title="Plugins" href="/nl/tools/plugin" icon="plug">
    Plugins kunnen Skills meeleveren naast de tools die ze documenteren.
  </Card>
</CardGroup>
