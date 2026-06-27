---
read_when:
    - Skills toevoegen of wijzigen
    - Skill-gating, allowlists of laadregels wijzigen
    - Inzicht in skillprioriteit en snapshotgedrag
sidebarTitle: Skills
summary: Skills leren je agent hoe hij tools gebruikt. Leer hoe ze laden, hoe voorrang werkt en hoe je gating, allowlists en omgevingsinjectie configureert.
title: Skills
x-i18n:
    generated_at: "2026-06-27T18:29:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills zijn markdown-instructiebestanden die de agent leren hoe en wanneer tools moeten worden gebruikt. Elke Skill staat in een map met een `SKILL.md`-bestand met YAML-frontmatter en een markdown-body. OpenClaw laadt gebundelde Skills plus eventuele lokale overschrijvingen, en filtert ze tijdens het laden op basis van omgeving, configuratie en aanwezigheid van binaire bestanden.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/nl/tools/creating-skills" icon="hammer">
    Bouw en test een aangepaste Skill vanaf nul.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Beoordeel en keur door agents opgestelde Skill-voorstellen goed.
  </Card>
  <Card title="Skills config" href="/nl/tools/skills-config" icon="gear">
    Volledig `skills.*`-configuratieschema en agent-allowlists.
  </Card>
  <Card title="ClawHub" href="/nl/clawhub" icon="cloud">
    Blader door community-Skills en installeer ze.
  </Card>
</CardGroup>

## Laadvolgorde

OpenClaw laadt uit deze bronnen, **hoogste prioriteit eerst**. Wanneer dezelfde Skill-naam op meerdere plaatsen voorkomt, wint de hoogste bron.

| Prioriteit   | Bron                   | Pad                                     |
| ------------ | ---------------------- | --------------------------------------- |
| 1 — hoogste  | Workspace-Skills       | `<workspace>/skills`                    |
| 2            | Project-agent-Skills   | `<workspace>/.agents/skills`            |
| 3            | Persoonlijke agent-Skills | `~/.agents/skills`                   |
| 4            | Beheerde / lokale Skills | `~/.openclaw/skills`                  |
| 5            | Gebundelde Skills      | meegeleverd met de installatie          |
| 6 — laagste  | Extra mappen           | `skills.load.extraDirs` + plugin-Skills |

Skill-roots ondersteunen gegroepeerde indelingen. OpenClaw ontdekt een Skill wanneer
`SKILL.md` ergens onder een geconfigureerde root verschijnt:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Het mappad is alleen voor organisatie. De naam, slash-command en allowlist-sleutel van de Skill komen allemaal uit het frontmatter-veld `name` (of uit de mapnaam wanneer `name` ontbreekt).

<Note>
  De native `$CODEX_HOME/skills`-map van Codex CLI is **geen** OpenClaw
  Skill-root. Gebruik `openclaw migrate plan codex` om die Skills te inventariseren, en daarna
  `openclaw migrate codex` om ze naar je OpenClaw-workspace te kopiëren.
</Note>

## Per-agent versus gedeelde Skills

In multi-agent-setups heeft elke agent zijn eigen workspace. Gebruik het pad dat
past bij de gewenste zichtbaarheid:

| Scope          | Pad                          | Zichtbaar voor              |
| -------------- | ---------------------------- | --------------------------- |
| Per-agent      | `<workspace>/skills`         | Alleen die agent            |
| Project-agent  | `<workspace>/.agents/skills` | Alleen de agent van die workspace |
| Persoonlijke agent | `~/.agents/skills`       | Alle agents op deze machine |
| Gedeeld beheerd | `~/.openclaw/skills`        | Alle agents op deze machine |
| Extra mappen   | `skills.load.extraDirs`      | Alle agents op deze machine |

## Agent-allowlists

Skill-**locatie** (prioriteit) en Skill-**zichtbaarheid** (welke agent deze kan gebruiken)
zijn afzonderlijke controles. Gebruik allowlists om te beperken welke Skills een agent ziet,
ongeacht waaruit ze worden geladen.

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
  <Accordion title="Allowlist rules">
    - Laat `agents.defaults.skills` weg om standaard alle Skills onbeperkt te laten.
    - Laat `agents.list[].skills` weg om `agents.defaults.skills` te erven.
    - Stel `agents.list[].skills: []` in om geen Skills voor die agent beschikbaar te maken.
    - Een niet-lege lijst `agents.list[].skills` is de **definitieve** set — deze wordt niet
      samengevoegd met defaults.
    - De effectieve allowlist geldt voor promptopbouw, slash-command-ontdekking,
      sandbox-sync en Skill-snapshots.
  </Accordion>
</AccordionGroup>

## Plugins en Skills

Plugins kunnen hun eigen Skills meeleveren door `skills`-mappen te vermelden in
`openclaw.plugin.json` (paden relatief aan de Plugin-root). Plugin-Skills laden
wanneer de Plugin is ingeschakeld — de browser-Plugin levert bijvoorbeeld een
`browser-automation`-Skill voor meerstaps browserbesturing.

Plugin-Skill-mappen worden samengevoegd op hetzelfde lage-prioriteitsniveau als
`skills.load.extraDirs`, dus een gelijknamige gebundelde, beheerde, agent- of workspace-Skill
overschrijft ze. Beperk ze via `metadata.openclaw.requires.config` op de
configuratie-entry van de Plugin.

Zie [Plugins](/nl/tools/plugin) en [Tools](/nl/tools) voor het volledige Plugin-systeem.

## Skill Workshop

[Skill Workshop](/nl/tools/skill-workshop) is een voorstelwachtrij tussen de agent
en je actieve Skill-bestanden. Wanneer de agent herbruikbaar werk herkent, stelt hij een
voorstel op in plaats van rechtstreeks naar `SKILL.md` te schrijven. Jij beoordeelt en keurt goed
voordat er iets verandert.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Zie [Skill Workshop](/nl/tools/skill-workshop) voor de volledige levenscyclus, CLI-
referentie en configuratie.

## Installeren vanuit ClawHub

[ClawHub](https://clawhub.ai) is het openbare Skills-register. Gebruik
`openclaw skills`-commands voor installeren en bijwerken, of de `clawhub` CLI voor
publiceren en synchroniseren.

| Actie                              | Command                                                |
| ---------------------------------- | ------------------------------------------------------ |
| Een Skill in de workspace installeren | `openclaw skills install @owner/<slug>`             |
| Installeren vanuit een Git-repository | `openclaw skills install git:owner/repo@ref`        |
| Een lokale Skill-map installeren   | `openclaw skills install ./path/to/skill --as my-tool` |
| Installeren voor alle lokale agents | `openclaw skills install @owner/<slug> --global`      |
| Alle workspace-Skills bijwerken    | `openclaw skills update --all`                         |
| Een gedeelde beheerde Skill bijwerken | `openclaw skills update @owner/<slug> --global`     |
| Alle gedeelde beheerde Skills bijwerken | `openclaw skills update --all --global`            |
| De trust envelope van een Skill verifiëren | `openclaw skills verify @owner/<slug>`          |
| De gegenereerde Skill Card afdrukken | `openclaw skills verify @owner/<slug> --card`        |
| Publiceren / synchroniseren via ClawHub CLI | `clawhub sync --all`                            |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` installeert standaard in de actieve workspace-`skills/`-
    map. Voeg `--global` toe om te installeren in de gedeelde
    `~/.openclaw/skills`-map, zichtbaar voor alle lokale agents tenzij agent-
    allowlists dit beperken.

    Git- en lokale installaties verwachten `SKILL.md` in de bronroot. De slug komt
    uit `SKILL.md`-frontmatter `name` wanneer geldig, en valt daarna terug op de
    map- of repositorynaam. Gebruik `--as <slug>` om dit te overschrijven.
    `openclaw skills update` volgt alleen ClawHub-installaties — installeer Git- of
    lokale bronnen opnieuw om ze te vernieuwen.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` vraagt ClawHub om de
    `clawhub.skill.verify.v1` trust envelope van de Skill. Geïnstalleerde ClawHub-Skills worden
    geverifieerd tegen de versie en het register die zijn vastgelegd in `.clawhub/origin.json`.
    Kale slugs blijven geaccepteerd voor bestaande geïnstalleerde of eenduidige Skills, maar
    owner-gekwalificeerde refs voorkomen onduidelijkheid over de uitgever.

    ClawHub-Skill-pagina's tonen de nieuwste status van de security-scan vóór installatie,
    met detailpagina's voor VirusTotal, ClawScan en statische analyse. Het
    command sluit met een niet-nulcode af wanneer ClawHub verificatie als mislukt markeert. Uitgevers
    herstellen fout-positieven via het ClawHub-dashboard of
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    Gateway-clients die niet-ClawHub-levering nodig hebben, kunnen een zip-Skill-archief klaarzetten
    met `skills.upload.begin`, `skills.upload.chunk` en `skills.upload.commit`,
    en daarna installeren met `skills.install({ source: "upload", ... })`. Dit pad staat
    standaard uit en vereist `skills.install.allowUploadedArchives: true` in
    `openclaw.json`. Normale ClawHub-installaties hebben die instelling nooit nodig.
  </Accordion>
</AccordionGroup>

## Beveiliging

<Warning>
  Behandel Skills van derden als **niet-vertrouwde code**. Lees ze voordat je ze inschakelt.
  Geef de voorkeur aan gesandboxte runs voor niet-vertrouwde invoer en risicovolle tools. Zie
  [Sandboxing](/nl/gateway/sandboxing) voor agent-side controles.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Workspace-, project-agent- en extra-map-Skill-ontdekking accepteert alleen Skill-
    roots waarvan het opgeloste realpath binnen de geconfigureerde root blijft, tenzij
    `skills.load.allowSymlinkTargets` expliciet een doelroot vertrouwt.
    Skill Workshop schrijft alleen via die vertrouwde doelen wanneer
    `skills.workshop.allowSymlinkTargetWrites` is ingeschakeld.
    Beheerde `~/.openclaw/skills` en persoonlijke `~/.agents/skills` kunnen
    gesymlinkte Skill-mappen bevatten, maar elk `SKILL.md`-realpath moet nog steeds
    binnen de opgeloste Skill-map blijven.
  </Accordion>
  <Accordion title="Operator install policy">
    Configureer `security.installPolicy` om een vertrouwd lokaal beleidscommand uit te voeren
    voordat Skill-installaties doorgaan. Het beleid ontvangt metadata en het klaargezette
    bronpad, geldt voor ClawHub-, geüploade, Git-, lokale, update- en
    dependency-installer-paden, en faalt gesloten wanneer het command geen
    geldige beslissing kan teruggeven.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` en `skills.entries.*.apiKey` injecteren secrets alleen in het
    **host**-proces voor die agent-turn — niet in de sandbox. Houd
    secrets uit prompts en logs.
  </Accordion>
</AccordionGroup>

Zie voor het bredere dreigingsmodel en beveiligingschecklists
[Security](/nl/gateway/security).

## SKILL.md-indeling

Elke Skill heeft minimaal een `name` en `description` nodig in de frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw volgt de [AgentSkills](https://agentskills.io)-specificatie. De
  frontmatter-parser ondersteunt **alleen keys op één regel** — `metadata` moet een
  JSON-object op één regel zijn. Gebruik `{baseDir}` in de body om naar het pad van de
  Skill-map te verwijzen.
</Note>

### Optionele frontmatter-keys

<ParamField path="homepage" type="string">
  URL die als "Website" wordt getoond in de macOS Skills-UI. Ook ondersteund via
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Wanneer `true`, wordt de Skill beschikbaar gemaakt als een door de gebruiker aanroepbaar slash-command.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wanneer `true`, houdt OpenClaw de instructies van de Skill buiten de normale
  prompt van de agent. De Skill blijft beschikbaar als slash-command wanneer `user-invocable`
  ook `true` is.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Wanneer ingesteld op `tool`, omzeilt het slash-command het model en dispatcht het
  rechtstreeks naar een geregistreerde tool.
</ParamField>

<ParamField path="command-tool" type="string">
  Toolnaam om aan te roepen wanneer `command-dispatch: tool` is ingesteld.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Voor tool-dispatch stuurt dit de raw args-string door naar de tool zonder
  core-parsing. De tool ontvangt
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating

OpenClaw filtert Skills tijdens het laden met `metadata.openclaw` (eenregelige
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
  Wanneer `true`, wordt de skill altijd opgenomen en worden alle andere controles overgeslagen.
</ParamField>

<ParamField path="emoji" type="string">
  Optionele emoji die wordt weergegeven in de macOS Skills-UI.
</ParamField>

<ParamField path="homepage" type="string">
  Optionele URL die als "Website" wordt weergegeven in de macOS Skills-UI.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Platformfilter. Wanneer dit is ingesteld, komt de skill alleen in aanmerking op de vermelde besturingssystemen.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Elke binary moet bestaan op `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Minstens één binary moet bestaan op `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Elke omgevingsvariabele moet bestaan in het proces of via config worden opgegeven.
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
  `metadata.openclaw` ontbreekt, zodat oudere geïnstalleerde skills hun
  afhankelijkheidscontroles en installatiehints behouden. Nieuwe skills moeten
  `metadata.openclaw` gebruiken.
</Note>

### Installatiespecificaties

Installatiespecificaties vertellen de macOS Skills-UI hoe een afhankelijkheid moet worden geïnstalleerd:

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
    - Wanneer meerdere installatieprogramma's worden vermeld, kiest de gateway één voorkeursoptie
      (brew wanneer beschikbaar, anders node).
    - Als alle installatieprogramma's `download` zijn, vermeldt OpenClaw elke vermelding zodat je
      alle beschikbare artefacten kunt zien.
    - Specificaties kunnen `os: ["darwin"|"linux"|"win32"]` bevatten om op platform te filteren.
    - Node-installaties respecteren `skills.install.nodeManager` in `openclaw.json`
      (standaard: npm; opties: npm / pnpm / yarn / bun). Dit heeft alleen invloed op skill-
      installaties; de Gateway-runtime moet nog steeds Node zijn.
    - Gateway-installatievoorkeur: Homebrew → uv → geconfigureerde Node-manager →
      go → download.
  </Accordion>
  <Accordion title="Details per installatieprogramma">
    - **Homebrew:** OpenClaw installeert Homebrew niet automatisch en vertaalt brew-
      formules niet naar systeempakketcommando's. In Linux-containers zonder
      `brew` worden installatieprogramma's die alleen brew ondersteunen verborgen; gebruik een aangepaste image of installeer
      de afhankelijkheid handmatig.
    - **Go:** als `go` ontbreekt en `brew` beschikbaar is, installeert de gateway
      eerst Go via Homebrew en stelt `GOBIN` in op de `bin` van Homebrew.
    - **Download:** `url` (vereist), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (standaard: automatisch wanneer een archief wordt gedetecteerd), `stripComponents`,
      `targetDir` (standaard: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Opmerkingen over sandboxing">
    `requires.bins` wordt gecontroleerd op de **host** tijdens het laden van skills. Als een agent
    in een sandbox draait, moet de binary ook **binnen de container** bestaan.
    Installeer deze via `agents.defaults.sandbox.docker.setupCommand` of een aangepaste
    image. `setupCommand` wordt eenmaal uitgevoerd na het aanmaken van de container en vereist
    netwerkuitgang, een beschrijfbaar rootbestandssysteem en een rootgebruiker in de sandbox.
  </Accordion>
</AccordionGroup>

## Config-overschrijvingen

Schakel gebundelde of beheerde skills in en configureer ze onder `skills.entries` in
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
  `false` schakelt de skill uit, zelfs wanneer deze gebundeld of geïnstalleerd is. De gebundelde skill `coding-agent`
  is opt-in — stel `skills.entries.coding-agent.enabled: true`
  in en zorg dat een van `claude`, `codex`, `opencode` of een andere ondersteunde CLI
  is geïnstalleerd en geauthenticeerd.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Gemaksveld voor skills die `metadata.openclaw.primaryEnv` declareren.
  Ondersteunt een plattetekstreeks of een SecretRef-object.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Omgevingsvariabelen die worden geïnjecteerd voor de agent-run. Alleen geïnjecteerd wanneer de
  variabele nog niet in het proces is ingesteld.
</ParamField>

<ParamField path="config" type="object">
  Optionele verzameling voor aangepaste configuratievelden per skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Optionele allowlist voor alleen **gebundelde** skills. Wanneer ingesteld, komen alleen gebundelde skills
  in de lijst in aanmerking. Beheerde en workspace-skills worden niet beïnvloed.
</ParamField>

<Note>
  Config-sleutels komen standaard overeen met de **skillnaam**. Als een skill
  `metadata.openclaw.skillKey` definieert, gebruik die sleutel dan onder `skills.entries`. Zet
  namen met koppeltekens tussen aanhalingstekens: JSON5 staat sleutels tussen aanhalingstekens toe.
</Note>

## Omgevingsinjectie

Wanneer een agent-run start, doet OpenClaw het volgende:

<Steps>
  <Step title="Leest skillmetadata">
    OpenClaw bepaalt de effectieve skilllijst voor de agent, met toepassing van toegangsregels,
    allowlists en config-overschrijvingen.
  </Step>
  <Step title="Injecteert env en API-sleutels">
    `skills.entries.<key>.env` en `skills.entries.<key>.apiKey` worden toegepast op
    `process.env` voor de duur van de run.
  </Step>
  <Step title="Bouwt de systeemprompt">
    In aanmerking komende skills worden gecompileerd tot een compact XML-blok en geïnjecteerd in de
    systeemprompt.
  </Step>
  <Step title="Herstelt de omgeving">
    Nadat de run eindigt, wordt de oorspronkelijke omgeving hersteld.
  </Step>
</Steps>

<Warning>
  Env-injectie is beperkt tot de **host**-agent-run, niet de sandbox. Binnen een
  sandbox hebben `env` en `apiKey` geen effect. Zie
  [Skills-config](/nl/tools/skills-config#sandboxed-skills-and-env-vars) voor hoe
  je geheimen doorgeeft aan runs in een sandbox.
</Warning>

Voor de gebundelde `claude-cli`-backend materialiseert OpenClaw dezelfde
in aanmerking komende skillsnapshot ook als tijdelijke Claude Code-plugin en geeft deze door via
`--plugin-dir`. Andere CLI-backends gebruiken alleen de promptcatalogus.

## Snapshots en vernieuwen

OpenClaw maakt snapshots van in aanmerking komende skills **wanneer een sessie start** en hergebruikt die
lijst voor alle volgende beurten in de sessie. Wijzigingen in skills of config worden
van kracht bij de volgende nieuwe sessie.

Skills worden halverwege een sessie in twee gevallen vernieuwd:

- De skills-watcher detecteert een wijziging in `SKILL.md`.
- Een nieuw in aanmerking komend extern knooppunt maakt verbinding.

De vernieuwde lijst wordt opgepakt bij de volgende agentbeurt. Als de effectieve agent-
allowlist verandert, vernieuwt OpenClaw de snapshot om zichtbare skills
uitgelijnd te houden.

<AccordionGroup>
  <Accordion title="Skills-watcher">
    Standaard bewaakt OpenClaw skillmappen en verhoogt het de snapshot wanneer
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

    Gebruik `allowSymlinkTargets` voor opzettelijke symlinklay-outs waarbij een skill-
    rootsymlink buiten de geconfigureerde root wijst, bijvoorbeeld
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Schakel `skills.workshop.allowSymlinkTargetWrites` alleen in wanneer Skill Workshop
    ook voorstellen via die vertrouwde symlinkpaden moet toepassen.

  </Accordion>
  <Accordion title="Externe macOS-knooppunten (Linux-gateway)">
    Als de Gateway op Linux draait maar een **macOS-knooppunt** is verbonden met
    `system.run` toegestaan, kan OpenClaw macOS-only skills als in aanmerking komend behandelen wanneer
    de vereiste binaries op dat knooppunt aanwezig zijn. De agent moet die
    skills uitvoeren via de `exec`-tool met `host=node`.

    Offline knooppunten maken remote-only skills **niet** zichtbaar. Als een knooppunt stopt
    met antwoorden op bin-probes, wist OpenClaw zijn gecachete bin-overeenkomsten.

  </Accordion>
</AccordionGroup>

## Tokenimpact

Wanneer skills in aanmerking komen, injecteert OpenClaw een compact XML-blok in de systeem-
prompt. De kosten zijn deterministisch:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Basisoverhead** (alleen bij ≥ 1 skill): ~195 tekens
- **Per skill:** ~97 tekens + de lengtes van je `name`-, `description`- en `location`-velden
- XML-escaping breidt `& < > " '` uit naar entiteiten, waardoor per voorkomen enkele tekens worden toegevoegd
- Bij ~4 tekens/token is 97 tekens ≈ 24 tokens per skill vóór veldlengtes

Houd beschrijvingen kort en beschrijvend om promptoverhead te minimaliseren.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Stapsgewijze gids voor het schrijven van een aangepaste skill.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Voorstelwachtrij voor door agents opgestelde skills.
  </Card>
  <Card title="Skills-config" href="/nl/tools/skills-config" icon="gear">
    Volledig `skills.*`-configschema en agent-allowlists.
  </Card>
  <Card title="Slash-commando's" href="/nl/tools/slash-commands" icon="terminal">
    Hoe slash-commando's van skills worden geregistreerd en gerouteerd.
  </Card>
  <Card title="ClawHub" href="/nl/clawhub" icon="cloud">
    Blader door skills in de openbare registry en publiceer ze daar.
  </Card>
  <Card title="Plugins" href="/nl/tools/plugin" icon="plug">
    Plugins kunnen skills meeleveren naast de tools die ze documenteren.
  </Card>
</CardGroup>
