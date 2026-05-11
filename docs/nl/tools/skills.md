---
read_when:
    - Skills toevoegen of wijzigen
    - Skills-gating, allowlists of laadregels wijzigen
    - Inzicht in de prioriteit van Skills en snapshotgedrag
sidebarTitle: Skills
summary: 'Skills: beheerd versus werkruimtegebonden, toelatingsregels, allowlists voor agents en configuratiekoppeling'
title: Skills
x-i18n:
    generated_at: "2026-05-11T20:54:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw gebruikt **[AgentSkills](https://agentskills.io)-compatibele** skillmappen
om de agent te leren hoe tools te gebruiken. Elke skill is een directory
met een `SKILL.md` met YAML-frontmatter en instructies. OpenClaw
laadt gebundelde skills plus optionele lokale overschrijvingen, en filtert ze
tijdens het laden op basis van omgeving, configuratie en aanwezigheid van binaries.

## Locaties en prioriteit

OpenClaw laadt skills uit deze bronnen, **hoogste prioriteit eerst**:

| #   | Bron                  | Pad                              |
| --- | --------------------- | -------------------------------- |
| 1   | Workspace-skills      | `<workspace>/skills`             |
| 2   | Project-agent-skills  | `<workspace>/.agents/skills`     |
| 3   | Persoonlijke agent-skills | `~/.agents/skills`            |
| 4   | Beheerde/lokale skills | `~/.openclaw/skills`            |
| 5   | Gebundelde skills     | meegeleverd met de installatie   |
| 6   | Extra skillmappen     | `skills.load.extraDirs` (config) |

Als een skillnaam conflicteert, wint de hoogste bron.

De native `$CODEX_HOME/skills`-directory van Codex CLI is niet een van deze
OpenClaw-skillroots. In Codex-harnessmodus gebruiken lokale app-serverstarts
geisoleerde Codex-homes per agent, dus persoonlijke Codex CLI-skills worden niet
impliciet geladen. Gebruik `openclaw migrate codex --dry-run` om ze te
inventariseren en `openclaw migrate codex` om skilldirectories te kiezen met een
interactieve checkboxprompt voordat ze naar de huidige OpenClaw-agentworkspace
worden gekopieerd. Herhaal voor niet-interactieve runs `--skill <name>` voor de
exacte skills die moeten worden gekopieerd.

## Per-agent versus gedeelde skills

In **multi-agent**-opstellingen heeft elke agent een eigen workspace:

| Bereik               | Pad                                         | Zichtbaar voor              |
| -------------------- | ------------------------------------------- | --------------------------- |
| Per-agent            | `<workspace>/skills`                        | Alleen die agent            |
| Project-agent        | `<workspace>/.agents/skills`                | Alleen de agent van die workspace |
| Persoonlijke agent   | `~/.agents/skills`                          | Alle agents op die machine  |
| Gedeeld beheerd/lokaal | `~/.openclaw/skills`                      | Alle agents op die machine  |
| Gedeelde extra directories | `skills.load.extraDirs` (laagste prioriteit) | Alle agents op die machine  |

Dezelfde naam op meerdere plaatsen → de hoogste bron wint. Workspace wint van
project-agent, wint van persoonlijke agent, wint van beheerd/lokaal, wint van gebundeld,
wint van extra directories.

## Agent-skill-allowlists

Skill**locatie** en skill**zichtbaarheid** zijn aparte controles.
Locatie/prioriteit bepaalt welke kopie van een gelijknamige skill wint; agent-
allowlists bepalen welke skills een agent daadwerkelijk kan gebruiken.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist-regels">
    - Laat `agents.defaults.skills` weg voor standaard onbeperkte skills.
    - Laat `agents.list[].skills` weg om `agents.defaults.skills` te erven.
    - Stel `agents.list[].skills: []` in voor geen skills.
    - Een niet-lege `agents.list[].skills`-lijst is de **definitieve** set voor die
      agent - deze wordt niet samengevoegd met standaardwaarden.
    - De effectieve allowlist geldt voor promptopbouw, ontdekking van
      slash-commands voor skills, sandbox-synchronisatie en skillsnapshots.
  </Accordion>
</AccordionGroup>

## Plugins en skills

Plugins kunnen hun eigen skills meeleveren door `skills`-directories te vermelden in
`openclaw.plugin.json` (paden relatief aan de Plugin-root). Pluginskills
worden geladen wanneer de Plugin is ingeschakeld. Dit is de juiste plek voor toolspecifieke
bedieningsgidsen die te lang zijn voor de toolbeschrijving maar beschikbaar moeten zijn
wanneer de Plugin is geinstalleerd - de browserplugin levert bijvoorbeeld een
`browser-automation`-skill voor browserbesturing in meerdere stappen.

Pluginskilldirectories worden samengevoegd in hetzelfde pad met lage prioriteit als
`skills.load.extraDirs`, dus een gelijknamige gebundelde, beheerde, agent- of
workspaceskill overschrijft ze. Je kunt ze blokkeren of toestaan via
`metadata.openclaw.requires.config` in de configuratie-entry van de Plugin.

Zie [Plugins](/nl/tools/plugin) voor ontdekking/configuratie en [Tools](/nl/tools) voor
het tooloppervlak dat die skills aanleren.

## Skill Workshop

De optionele, experimentele **Skill Workshop**-Plugin kan workspaceskills maken of bijwerken
op basis van herbruikbare procedures die tijdens agentwerk zijn geobserveerd. Deze
is standaard uitgeschakeld en moet expliciet worden ingeschakeld via
`plugins.entries.skill-workshop`.

Skill Workshop schrijft alleen naar `<workspace>/skills`, scant gegenereerde
inhoud, ondersteunt wachtende goedkeuring of automatische veilige schrijfacties, plaatst
onveilige voorstellen in quarantaine en vernieuwt het skillsnapshot na succesvolle
schrijfacties zodat nieuwe skills beschikbaar worden zonder een Gateway-herstart.

Gebruik dit voor correcties zoals _"controleer de volgende keer GIF-attributie"_ of
zwaar bevochten workflows zoals checklists voor media-QA. Begin met wachtende
goedkeuring; gebruik automatische schrijfacties alleen in vertrouwde workspaces na beoordeling
van de voorstellen. Volledige gids: [Skill Workshop-Plugin](/nl/plugins/skill-workshop).

## ClawHub (installeren en synchroniseren)

[ClawHub](https://clawhub.ai) is het openbare skillsregister voor OpenClaw.
Gebruik native `openclaw skills`-commands voor ontdekken/installeren/bijwerken, of de
aparte `clawhub` CLI voor publicatie-/synchronisatieworkflows. Volledige gids:
[ClawHub](/nl/clawhub).

| Actie                              | Command                                |
| ---------------------------------- | -------------------------------------- |
| Een skill in de workspace installeren | `openclaw skills install <skill-slug>` |
| Alle geinstalleerde skills bijwerken | `openclaw skills update --all`         |
| Synchroniseren (scannen + updates publiceren) | `clawhub sync --all`          |

Native `openclaw skills install` installeert in de actieve workspace-
`skills/`-directory. De aparte `clawhub` CLI installeert ook in
`./skills` onder je huidige werkdirectory (of valt terug op de
geconfigureerde OpenClaw-workspace). OpenClaw pikt dat op als
`<workspace>/skills` in de volgende sessie.
Geconfigureerde skillroots ondersteunen ook een groeperingsniveau, zoals
`skills/<group>/<skill>/SKILL.md`, zodat gerelateerde skills van derden onder
een gedeelde map kunnen worden bewaard zonder brede recursieve scanning.

Gateway-clients die private levering buiten ClawHub nodig hebben, kunnen een zip-skill
archief klaarzetten met `skills.upload.begin`, `skills.upload.chunk` en
`skills.upload.commit`, en daarna de vastgelegde upload installeren met
`skills.install({ source: "upload", uploadId, slug, force?, sha256? })`. Dit is
een expliciet admin-uploadpad voor vertrouwde clients, niet de normale
`openclaw skills install <slug>`- of ClawHub-installatiestroom. Het staat standaard uit
en werkt alleen wanneer `skills.install.allowUploadedArchives: true` is ingesteld in
`openclaw.json`. Uploadmodus installeert nog steeds in de standaard agentworkspace-
`skills/<slug>`-directory; de interne mapnaam van het archief wordt genegeerd voor het
uiteindelijke installatiedoel.

ClawHub-skillpagina's tonen de nieuwste status van de veiligheidsscan voor installatie,
met scannerdetailpagina's voor VirusTotal, ClawScan en statische analyse.
`openclaw skills install <slug>` blijft alleen het installatiepad; uitgevers
herstellen fout-positieven via het ClawHub-dashboard of
`clawhub skill rescan <slug>`.

## Beveiliging

<Warning>
Behandel skills van derden als **niet-vertrouwde code**. Lees ze voordat je ze inschakelt.
Geef de voorkeur aan sandboxed runs voor niet-vertrouwde invoer en risicovolle tools. Zie
[Sandboxing](/nl/gateway/sandboxing) voor de agent-side controles.
</Warning>

- Workspace- en extra-directory-skillontdekking accepteert alleen skillroots en `SKILL.md`-bestanden waarvan de opgeloste realpath binnen de geconfigureerde root blijft.
- Private archiefinstallaties via Gateway staan standaard uit. Wanneer ze expliciet zijn ingeschakeld,
  vereisen ze een vastgelegde zip-upload met `SKILL.md` en hergebruiken ze dezelfde
  beveiligingen voor archiefextractie, path traversal, symlinks, force en rollback als
  ClawHub-skillinstallaties. Ze worden bewaakt door
  `skills.install.allowUploadedArchives`; normale ClawHub-installaties vereisen
  die instelling niet.
- Skilldependency-installaties via Gateway (`skills.install`, onboarding en de UI voor Skills-instellingen) voeren de ingebouwde scanner voor gevaarlijke code uit voordat installermetadata wordt uitgevoerd. `critical`-bevindingen blokkeren standaard, tenzij de caller expliciet de gevaarlijke override instelt; verdachte bevindingen geven nog steeds alleen een waarschuwing.
- `openclaw skills install <slug>` is anders - het downloadt een ClawHub-skillmap naar de workspace en gebruikt het installermetadata-pad hierboven niet.
- `skills.entries.*.env` en `skills.entries.*.apiKey` injecteren geheimen in het **host**proces voor die agentbeurt (niet de sandbox). Houd geheimen uit prompts en logs.

Zie [Security](/nl/gateway/security) voor een breder dreigingsmodel en checklists.

## SKILL.md-indeling

`SKILL.md` moet minimaal het volgende bevatten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw volgt de AgentSkills-specificatie voor layout/intentie. De parser die
door de ingebedde agent wordt gebruikt, ondersteunt alleen **single-line** frontmatterkeys;
`metadata` moet een **single-line JSON object** zijn. Gebruik `{baseDir}` in
instructies om naar het pad van de skillmap te verwijzen.

### Optionele frontmatterkeys

<ParamField path="homepage" type="string">
  URL die als "Website" wordt getoond in de macOS Skills-UI. Ook ondersteund via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Wanneer `true`, wordt de skill beschikbaar gemaakt als slash-command voor de gebruiker.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wanneer `true`, houdt OpenClaw de instructies van de skill buiten de normale
  prompt van de agent. De skill blijft geinstalleerd en kan nog steeds expliciet worden uitgevoerd als
  slash-command wanneer `user-invocable` ook `true` is.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Wanneer ingesteld op `tool`, omzeilt het slash-command het model en dispatcht het rechtstreeks naar een tool.
</ParamField>
<ParamField path="command-tool" type="string">
  Toolnaam om aan te roepen wanneer `command-dispatch: tool` is ingesteld.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Voor tooldispatch worden de ruwe argumentenstring doorgestuurd naar de tool (geen core-parsing). De tool wordt aangeroepen met `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (laadtijdfilters)

OpenClaw filtert skills tijdens het laden met `metadata` (single-line JSON):

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

Velden onder `metadata.openclaw`:

<ParamField path="always" type="boolean">
  Wanneer `true`, neem de skill altijd op (sla andere gates over).
</ParamField>
<ParamField path="emoji" type="string">
  Optionele emoji die wordt gebruikt door de macOS Skills UI.
</ParamField>
<ParamField path="homepage" type="string">
  Optionele URL die als "Website" wordt weergegeven in de macOS Skills UI.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Optionele lijst met platforms. Indien ingesteld, komt de skill alleen in aanmerking op die OS'en.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Elk item moet bestaan op `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Minstens één item moet bestaan op `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  De env-var moet bestaan of in de configuratie worden opgegeven.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lijst met `openclaw.json`-paden die truthy moeten zijn.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Naam van de env-var die is gekoppeld aan `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Optionele installerspecificaties die worden gebruikt door de macOS Skills UI (brew/node/go/uv/download).
</ParamField>

Als er geen `metadata.openclaw` aanwezig is, komt de skill altijd in aanmerking (tenzij
uitgeschakeld in de configuratie of geblokkeerd door `skills.allowBundled` voor gebundelde skills).

<Note>
Verouderde `metadata.clawdbot`-blokken worden nog steeds geaccepteerd wanneer
`metadata.openclaw` ontbreekt, zodat oudere geïnstalleerde skills hun
dependency-gates en installertips behouden. Nieuwe en bijgewerkte skills moeten
`metadata.openclaw` gebruiken.
</Note>

### Opmerkingen over sandboxing

- `requires.bins` wordt gecontroleerd op de **host** tijdens het laden van skills.
- Als een agent in een sandbox draait, moet de binary ook **binnen de container** bestaan. Installeer deze via `agents.defaults.sandbox.docker.setupCommand` (of een custom image). `setupCommand` wordt eenmaal uitgevoerd nadat de container is gemaakt. Pakketinstallaties vereisen ook netwerk-egress, een beschrijfbaar rootbestandssysteem en een rootgebruiker in de sandbox.
- Voorbeeld: de `summarize`-skill (`skills/summarize/SKILL.md`) heeft de `summarize` CLI nodig in de sandboxcontainer om daar te kunnen draaien.

### Installerspecificaties

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
  <Accordion title="Selectieregels voor installers">
    - Als er meerdere installers worden vermeld, kiest de gateway één voorkeursoptie (brew wanneer beschikbaar, anders node).
    - Als alle installers `download` zijn, vermeldt OpenClaw elk item zodat je de beschikbare artefacten kunt zien.
    - Installerspecificaties kunnen `os: ["darwin"|"linux"|"win32"]` bevatten om opties op platform te filteren.
    - Node-installaties respecteren `skills.install.nodeManager` in `openclaw.json` (standaard: npm; opties: npm/pnpm/yarn/bun). Dit heeft alleen invloed op skill-installaties; de Gateway-runtime moet nog steeds Node zijn - Bun wordt niet aanbevolen voor WhatsApp/Telegram.
    - Door de Gateway ondersteunde installerselectie wordt door voorkeuren gestuurd: wanneer installatiespecificaties soorten mengen, geeft OpenClaw de voorkeur aan Homebrew wanneer `skills.install.preferBrew` is ingeschakeld en `brew` bestaat, daarna `uv`, daarna de geconfigureerde node-manager, en daarna andere fallbacks zoals `go` of `download`.
    - Als elke installatiespecificatie `download` is, toont OpenClaw alle downloadopties in plaats van ze samen te vouwen tot één voorkeursinstaller.

  </Accordion>
  <Accordion title="Details per installer">
    - **Go-installaties:** als `go` ontbreekt en `brew` beschikbaar is, installeert de gateway eerst Go via Homebrew en stelt waar mogelijk `GOBIN` in op de `bin` van Homebrew.
    - **Downloadinstallaties:** `url` (vereist), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (standaard: auto wanneer een archief wordt gedetecteerd), `stripComponents`, `targetDir` (standaard: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Configuratie-overschrijvingen

Gebundelde en beheerde skills kunnen worden in- en uitgeschakeld en van env-waarden
worden voorzien onder `skills.entries` in `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
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
  `false` schakelt de skill uit, zelfs als deze gebundeld of geïnstalleerd is.
  De gebundelde `coding-agent`-skill is opt-in: stel
  `skills.entries.coding-agent.enabled: true` in voordat je deze aan agents blootstelt,
  en zorg er vervolgens voor dat een van `claude`, `codex`, `opencode` of `pi` is geïnstalleerd en
  geauthenticeerd voor zijn eigen CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Gemak voor skills die `metadata.openclaw.primaryEnv` declareren. Ondersteunt platte tekst of SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Alleen geïnjecteerd als de variabele nog niet in het proces is ingesteld.
</ParamField>
<ParamField path="config" type="object">
  Optionele container voor custom velden per skill. Custom sleutels moeten hier staan.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Optionele allowlist alleen voor **gebundelde** skills. Indien ingesteld, komen alleen gebundelde skills in de lijst in aanmerking (beheerde/workspace-skills blijven onaangetast).
</ParamField>

Als de skillnaam koppeltekens bevat, zet je de sleutel tussen aanhalingstekens (JSON5 staat aangehaalde
sleutels toe). Configuratiesleutels komen standaard overeen met de **skillnaam** - als een skill
`metadata.openclaw.skillKey` definieert, gebruik die sleutel dan onder `skills.entries`.

<Note>
Voor standaard afbeeldingsgeneratie/-bewerking binnen OpenClaw gebruik je de core
`image_generate` tool met `agents.defaults.imageGenerationModel` in plaats
van een gebundelde skill. Skillvoorbeelden hier zijn voor custom of third-party
workflows. Gebruik voor native afbeeldingsanalyse de `image` tool met
`agents.defaults.imageModel`. Als je `openai/*`, `google/*`,
`fal/*` of een ander providerspecifiek afbeeldingsmodel kiest, voeg dan ook de
auth/API-sleutel van die provider toe.
</Note>

## Omgevingsinjectie

Wanneer een agentrun start, doet OpenClaw het volgende:

1. Leest skillmetadata.
2. Past `skills.entries.<key>.env` en `skills.entries.<key>.apiKey` toe op `process.env`.
3. Bouwt de systeemprompt met **in aanmerking komende** skills.
4. Herstelt de oorspronkelijke omgeving nadat de run eindigt.

Omgevingsinjectie is **beperkt tot de agentrun**, niet tot een globale shellomgeving.

Voor de gebundelde `claude-cli`-backend materialiseert OpenClaw dezelfde
in aanmerking komende snapshot ook als een tijdelijke Claude Code-plugin en geeft deze door met
`--plugin-dir`. Claude Code kan dan zijn native skillresolver gebruiken, terwijl
OpenClaw nog steeds eigenaar blijft van voorrang, allowlists per agent, gating en
`skills.entries.*` env/API-sleutelinjectie. Andere CLI-backends gebruiken alleen de
promptcatalogus.

## Snapshots en vernieuwen

OpenClaw maakt snapshots van de in aanmerking komende skills **wanneer een sessie start** en
hergebruikt die lijst voor volgende beurten in dezelfde sessie. Wijzigingen aan
skills of configuratie worden van kracht bij de volgende nieuwe sessie.

Skills kunnen midden in een sessie in twee gevallen worden vernieuwd:

- De skills-watcher is ingeschakeld.
- Er verschijnt een nieuwe in aanmerking komende remote node.

Zie dit als een **hot reload**: de vernieuwde lijst wordt opgepakt bij de
volgende agentbeurt. Als de effectieve skill-allowlist van de agent voor die
sessie verandert, vernieuwt OpenClaw de snapshot zodat zichtbare skills afgestemd blijven
op de huidige agent.

### Skills-watcher

Standaard bewaakt OpenClaw skillmappen en verhoogt het de skillssnapshot
wanneer `SKILL.md`-bestanden veranderen. Configureer onder `skills.load`:

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

Gebruik `allowSymlinkTargets` voor opzettelijke sibling-repo-layouts waarin een ingebouwde
skillroot een symlink bevat, bijvoorbeeld
`~/.agents/skills/manager -> ~/Projects/manager/skills`. De doellijst wordt
gematcht na realpath-resolutie en moet beperkt blijven.

### Remote macOS-nodes (Linux-gateway)

Als de Gateway op Linux draait maar een **macOS-node** is verbonden met
`system.run` toegestaan (Exec-goedkeuringsbeveiliging niet ingesteld op `deny`),
kan OpenClaw macOS-only skills als in aanmerking komend behandelen wanneer de vereiste
binaries op die node aanwezig zijn. De agent moet die skills uitvoeren
via de `exec` tool met `host=node`.

Dit vertrouwt erop dat de node zijn command-ondersteuning rapporteert en op een bin-probe
via `system.which` of `system.run`. Offline nodes maken
remote-only skills **niet** zichtbaar. Als een verbonden node stopt met reageren op bin-probes,
wist OpenClaw zijn gecachte bin-matches zodat agents geen skills meer zien
die daar momenteel niet kunnen draaien.

## Tokenimpact

Wanneer skills in aanmerking komen, injecteert OpenClaw een compacte XML-lijst met beschikbare
skills in de systeemprompt (via `formatSkillsForPrompt` in
`pi-coding-agent`). De kosten zijn deterministisch:

- **Basisoverhead** (alleen wanneer ≥1 skill): 195 tekens.
- **Per skill:** 97 tekens + de lengte van de XML-geëscapete `<name>`, `<description>` en `<location>`-waarden.

Formule (tekens):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-escaping breidt `& < > " '` uit naar entiteiten (`&amp;`, `&lt;`, enz.),
waardoor de lengte toeneemt. Tokenaantallen verschillen per modeltokenizer. Een ruwe
OpenAI-achtige schatting is ~4 tekens/token, dus **97 tekens ≈ 24 tokens** per
skill plus je daadwerkelijke veldlengtes.

## Levenscyclus van beheerde skills

OpenClaw levert een basisset skills als **gebundelde skills** met de
installatie (npm-pakket of OpenClaw.app). `~/.openclaw/skills` bestaat voor
lokale overschrijvingen - bijvoorbeeld om een skill vast te zetten of te patchen zonder
de gebundelde kopie te wijzigen. Workspace-skills zijn eigendom van de gebruiker en overschrijven
beide bij naamconflicten.

## Op zoek naar meer skills?

Blader door [https://clawhub.ai](https://clawhub.ai). Volledig configuratie
schema: [Skills-configuratie](/nl/tools/skills-config).

## Gerelateerd

- [ClawHub](/nl/clawhub) - openbaar skillsregister
- [Skills maken](/nl/tools/creating-skills) - custom skills bouwen
- [Plugins](/nl/tools/plugin) - overzicht van het pluginsysteem
- [Skill Workshop-plugin](/nl/plugins/skill-workshop) - skills genereren uit agentwerk
- [Skills-configuratie](/nl/tools/skills-config) - referentie voor skillconfiguratie
- [Slash commands](/nl/tools/slash-commands) - alle beschikbare slash commands
