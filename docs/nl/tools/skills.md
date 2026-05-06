---
read_when:
    - Skills toevoegen of wijzigen
    - Skill-gating, toestemmingslijsten of laadregels wijzigen
    - Skills-voorrang en gedrag van momentopnamen begrijpen
sidebarTitle: Skills
summary: 'Skills: beheerd versus werkruimte, gate-regels, agent-toelatingslijsten en configuratiekoppeling'
title: Skills
x-i18n:
    generated_at: "2026-05-06T09:38:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw gebruikt **[AgentSkills](https://agentskills.io)-compatibele** skillmappen om de agent te leren hoe tools moeten worden gebruikt. Elke skill is een directory met een `SKILL.md` met YAML-frontmatter en instructies. OpenClaw laadt gebundelde skills plus optionele lokale overschrijvingen, en filtert ze tijdens het laden op basis van omgeving, configuratie en aanwezigheid van binaries.

## Locaties en voorrang

OpenClaw laadt skills uit deze bronnen, **hoogste voorrang eerst**:

| #   | Bron                  | Pad                              |
| --- | --------------------- | -------------------------------- |
| 1   | Workspace-skills      | `<workspace>/skills`             |
| 2   | Projectagentskills    | `<workspace>/.agents/skills`     |
| 3   | Persoonlijke agentskills | `~/.agents/skills`            |
| 4   | Beheerde/lokale skills | `~/.openclaw/skills`            |
| 5   | Gebundelde skills     | meegeleverd met de installatie   |
| 6   | Extra skillmappen     | `skills.load.extraDirs` (configuratie) |

Als een skillnaam conflicteert, wint de hoogste bron.

De native `$CODEX_HOME/skills`-directory van Codex CLI is geen van deze OpenClaw-skillroots. In Codex-harnasmodus gebruiken lokale appserverstarts geïsoleerde Codex-homes per agent, zodat persoonlijke Codex CLI-skills niet impliciet worden geladen. Gebruik `openclaw migrate codex --dry-run` om ze te inventariseren en `openclaw migrate codex` om skilldirectories te kiezen met een interactieve checkboxprompt voordat ze naar de huidige OpenClaw-agentworkspace worden gekopieerd. Herhaal voor niet-interactieve runs `--skill <name>` voor de exacte skills die moeten worden gekopieerd.

## Skills per agent versus gedeelde skills

In **multi-agent**-setups heeft elke agent zijn eigen workspace:

| Bereik              | Pad                                         | Zichtbaar voor               |
| ------------------- | ------------------------------------------- | ---------------------------- |
| Per agent           | `<workspace>/skills`                        | Alleen die agent             |
| Projectagent        | `<workspace>/.agents/skills`                | Alleen de agent van die workspace |
| Persoonlijke agent  | `~/.agents/skills`                          | Alle agents op die machine   |
| Gedeeld beheerd/lokaal | `~/.openclaw/skills`                     | Alle agents op die machine   |
| Gedeelde extra dirs | `skills.load.extraDirs` (laagste voorrang)  | Alle agents op die machine   |

Dezelfde naam op meerdere plaatsen → hoogste bron wint. Workspace wint van projectagent, wint van persoonlijke agent, wint van beheerd/lokaal, wint van gebundeld, wint van extra dirs.

## Allowlists voor agentskills

Skill**locatie** en skill**zichtbaarheid** zijn aparte controles. Locatie/voorrang bepaalt welke kopie van een skill met dezelfde naam wint; agentallowlists bepalen welke skills een agent daadwerkelijk kan gebruiken.

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
    - Een niet-lege lijst `agents.list[].skills` is de **definitieve** set voor die agent - deze wordt niet samengevoegd met standaardwaarden.
    - De effectieve allowlist wordt toegepast op promptopbouw, ontdekking van slash-commando's voor skills, sandbox-synchronisatie en skillsnapshots.

  </Accordion>
</AccordionGroup>

## Plugins en skills

Plugins kunnen hun eigen skills meeleveren door `skills`-directories op te nemen in `openclaw.plugin.json` (paden relatief aan de pluginroot). Pluginskills worden geladen wanneer de Plugin is ingeschakeld. Dit is de juiste plek voor toolspecifieke bedieningsgidsen die te lang zijn voor de toolbeschrijving, maar beschikbaar moeten zijn wanneer de Plugin is geïnstalleerd - de browser-Plugin levert bijvoorbeeld een `browser-automation`-skill voor browserbesturing in meerdere stappen.

Pluginskilldirectories worden samengevoegd in hetzelfde pad met lage voorrang als `skills.load.extraDirs`, dus een gebundelde, beheerde, agent- of workspace-skill met dezelfde naam overschrijft ze. Je kunt ze afschermen via `metadata.openclaw.requires.config` op de configuratie-entry van de Plugin.

Zie [Plugins](/nl/tools/plugin) voor ontdekking/configuratie en [Tools](/nl/tools) voor het tooloppervlak dat die skills aanleren.

## Skill Workshop

De optionele, experimentele **Skill Workshop**-Plugin kan workspaceskills maken of bijwerken vanuit herbruikbare procedures die tijdens agentwerk zijn waargenomen. Deze is standaard uitgeschakeld en moet expliciet worden ingeschakeld via `plugins.entries.skill-workshop`.

Skill Workshop schrijft alleen naar `<workspace>/skills`, scant gegenereerde inhoud, ondersteunt wachtende goedkeuring of automatische veilige schrijfacties, plaatst onveilige voorstellen in quarantaine en vernieuwt de skillsnapshot na succesvolle schrijfacties zodat nieuwe skills beschikbaar worden zonder een Gateway-herstart.

Gebruik dit voor correcties zoals _"controleer de volgende keer GIF-toeschrijving"_ of moeizaam verworven workflows zoals QA-checklists voor media. Begin met wachtende goedkeuring; gebruik automatische schrijfacties alleen in vertrouwde workspaces nadat de voorstellen zijn beoordeeld. Volledige gids: [Skill Workshop-Plugin](/nl/plugins/skill-workshop).

## ClawHub (installeren en synchroniseren)

[ClawHub](https://clawhub.ai) is het openbare skillsregister voor OpenClaw. Gebruik native `openclaw skills`-commando's voor ontdekken/installeren/bijwerken, of de aparte `clawhub` CLI voor publicatie-/synchronisatieworkflows. Volledige gids: [ClawHub](/nl/tools/clawhub).

| Actie                              | Commando                               |
| ---------------------------------- | -------------------------------------- |
| Een skill in de workspace installeren | `openclaw skills install <skill-slug>` |
| Alle geïnstalleerde skills bijwerken | `openclaw skills update --all`       |
| Synchroniseren (scannen + updates publiceren) | `clawhub sync --all`          |

Native `openclaw skills install` installeert in de actieve workspace-`skills/`-directory. De aparte `clawhub` CLI installeert ook in `./skills` onder je huidige werkdirectory (of valt terug op de geconfigureerde OpenClaw-workspace). OpenClaw pikt dat in de volgende sessie op als `<workspace>/skills`.
Geconfigureerde skillroots ondersteunen ook één groeperingsniveau, zoals `skills/<group>/<skill>/SKILL.md`, zodat gerelateerde skills van derden onder een gedeelde map kunnen worden bewaard zonder brede recursieve scanning.

ClawHub-skillpagina's tonen de nieuwste status van de beveiligingsscan vóór installatie, met detailpagina's van scanners voor VirusTotal, ClawScan en statische analyse. `openclaw skills install <slug>` blijft alleen het installatiepad; uitgevers herstellen vals-positieven via het ClawHub-dashboard of `clawhub skill rescan <slug>`.

## Beveiliging

<Warning>
Behandel skills van derden als **niet-vertrouwde code**. Lees ze voordat je ze inschakelt. Geef de voorkeur aan gesandboxte runs voor niet-vertrouwde invoer en riskante tools. Zie [Sandboxing](/nl/gateway/sandboxing) voor de agentzijdige controles.
</Warning>

- Ontdekking van workspace- en extra-dir-skills accepteert alleen skillroots en `SKILL.md`-bestanden waarvan het opgeloste realpath binnen de geconfigureerde root blijft.
- Gateway-ondersteunde installaties van skillafhankelijkheden (`skills.install`, onboarding en de Skills-instellingen-UI) voeren de ingebouwde gevaarlijke-codescanner uit voordat installermetadata wordt uitgevoerd. `critical`-bevindingen blokkeren standaard, tenzij de aanroeper expliciet de gevaarlijke overschrijving instelt; verdachte bevindingen waarschuwen nog steeds alleen.
- `openclaw skills install <slug>` is anders - het downloadt een ClawHub-skillmap naar de workspace en gebruikt het bovenstaande installermetadatapad niet.
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

OpenClaw volgt de AgentSkills-specificatie voor lay-out/intent. De parser die door de ingesloten agent wordt gebruikt, ondersteunt alleen frontmatter-sleutels op **één regel**; `metadata` moet een **JSON-object op één regel** zijn. Gebruik `{baseDir}` in instructies om naar het pad van de skillmap te verwijzen.

### Optionele frontmatter-sleutels

<ParamField path="homepage" type="string">
  URL die als "Website" wordt getoond in de macOS Skills-UI. Wordt ook ondersteund via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Wanneer `true`, wordt de skill als slash-commando voor gebruikers getoond.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wanneer `true`, houdt OpenClaw de instructies van de skill buiten de normale prompt van de agent. De skill blijft geïnstalleerd en kan nog steeds expliciet als slash-commando worden uitgevoerd wanneer `user-invocable` ook `true` is.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Wanneer ingesteld op `tool`, omzeilt het slash-commando het model en wordt het direct naar een tool gestuurd.
</ParamField>
<ParamField path="command-tool" type="string">
  Toolnaam om aan te roepen wanneer `command-dispatch: tool` is ingesteld.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Voor tooldispatch wordt de ruwe args-string doorgestuurd naar de tool (geen core-parsing). De tool wordt aangeroepen met `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filters tijdens laden)

OpenClaw filtert skills tijdens het laden met `metadata` (JSON op één regel):

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
  Optionele emoji die door de macOS Skills-UI wordt gebruikt.
</ParamField>
<ParamField path="homepage" type="string">
  Optionele URL die als "Website" wordt getoond in de macOS Skills-UI.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Optionele lijst met platforms. Indien ingesteld, komt de skill alleen in aanmerking op die OS'en.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Elke moet bestaan op `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Minstens één moet bestaan op `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env-var moet bestaan of in configuratie worden opgegeven.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lijst met `openclaw.json`-paden die truthy moeten zijn.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Naam van env-var die is gekoppeld aan `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Optionele installerspecificaties die door de macOS Skills-UI worden gebruikt (brew/node/go/uv/download).
</ParamField>

Als er geen `metadata.openclaw` aanwezig is, komt de skill altijd in aanmerking (tenzij uitgeschakeld in configuratie of geblokkeerd door `skills.allowBundled` voor gebundelde skills).

<Note>
Verouderde `metadata.clawdbot`-blokken worden nog steeds geaccepteerd wanneer `metadata.openclaw` ontbreekt, zodat oudere geïnstalleerde skills hun afhankelijkheidsgates en installerhints behouden. Nieuwe en bijgewerkte skills moeten `metadata.openclaw` gebruiken.
</Note>

### Sandboxnotities

- `requires.bins` wordt gecontroleerd op de **host** tijdens het laden van skills.
- Als een agent is gesandboxt, moet de binary ook **binnen de container** bestaan. Installeer deze via `agents.defaults.sandbox.docker.setupCommand` (of een aangepaste image). `setupCommand` wordt eenmaal uitgevoerd nadat de container is gemaakt. Pakketinstallaties vereisen ook netwerkuitgang, een beschrijfbaar root-FS en een rootgebruiker in de sandbox.
- Voorbeeld: de `summarize`-skill (`skills/summarize/SKILL.md`) heeft de `summarize` CLI in de sandboxcontainer nodig om daar te draaien.

### Installatiespecificaties

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
    - Als meerdere installatieprogramma's worden vermeld, kiest de Gateway één voorkeursoptie (`brew` wanneer beschikbaar, anders Node).
    - Als alle installatieprogramma's `download` zijn, toont OpenClaw elke vermelding zodat je de beschikbare artefacten kunt zien.
    - Installatiespecificaties kunnen `os: ["darwin"|"linux"|"win32"]` bevatten om opties op platform te filteren.
    - Node-installaties respecteren `skills.install.nodeManager` in `openclaw.json` (standaard: npm; opties: npm/pnpm/yarn/bun). Dit heeft alleen invloed op skill-installaties; de Gateway-runtime moet nog steeds Node zijn - Bun wordt niet aanbevolen voor WhatsApp/Telegram.
    - Gateway-gestuurde installatieprogrammakeuze is voorkeurgestuurd: wanneer installatiespecificaties soorten mengen, geeft OpenClaw de voorkeur aan Homebrew wanneer `skills.install.preferBrew` is ingeschakeld en `brew` bestaat, daarna `uv`, daarna de geconfigureerde Node-manager, en daarna andere fallbacks zoals `go` of `download`.
    - Als elke installatiespecificatie `download` is, toont OpenClaw alle downloadopties in plaats van ze samen te vouwen tot één voorkeursinstallatieprogramma.

  </Accordion>
  <Accordion title="Details per installatieprogramma">
    - **Go-installaties:** als `go` ontbreekt en `brew` beschikbaar is, installeert de Gateway eerst Go via Homebrew en stelt waar mogelijk `GOBIN` in op de `bin` van Homebrew.
    - **Downloadinstallaties:** `url` (vereist), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (standaard: automatisch wanneer een archief wordt gedetecteerd), `stripComponents`, `targetDir` (standaard: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Configuratie-overschrijvingen

Gebundelde en beheerde Skills kunnen worden in- of uitgeschakeld en voorzien van env-waarden
onder `skills.entries` in `~/.openclaw/openclaw.json`:

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
  `skills.entries.coding-agent.enabled: true` in voordat je deze aan agents beschikbaar maakt,
  en zorg er daarna voor dat een van `claude`, `codex`, `opencode` of `pi` geïnstalleerd en
  geauthenticeerd is voor de eigen CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Gemak voor Skills die `metadata.openclaw.primaryEnv` declareren. Ondersteunt platte tekst of SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Alleen geïnjecteerd als de variabele nog niet in het proces is ingesteld.
</ParamField>
<ParamField path="config" type="object">
  Optionele verzameling voor aangepaste velden per skill. Aangepaste sleutels moeten hier staan.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Optionele allowlist alleen voor **gebundelde** Skills. Indien ingesteld, komen alleen gebundelde Skills in de lijst in aanmerking (beheerde/workspace-Skills blijven onaangetast).
</ParamField>

Als de skillnaam koppeltekens bevat, zet de sleutel dan tussen aanhalingstekens (JSON5 staat aangehaalde
sleutels toe). Configuratiesleutels komen standaard overeen met de **skillnaam** - als een skill
`metadata.openclaw.skillKey` definieert, gebruik dan die sleutel onder `skills.entries`.

<Note>
Gebruik voor standaard afbeeldingsgeneratie/-bewerking binnen OpenClaw de core
`image_generate`-tool met `agents.defaults.imageGenerationModel` in plaats
van een gebundelde skill. Skillvoorbeelden hier zijn voor aangepaste workflows of workflows
van derden. Gebruik voor native afbeeldingsanalyse de `image`-tool met
`agents.defaults.imageModel`. Als je `openai/*`, `google/*`,
`fal/*` of een ander providerspecifiek afbeeldingsmodel kiest, voeg dan ook de
auth/API-sleutel van die provider toe.
</Note>

## Omgevingsinjectie

Wanneer een agent-run start, doet OpenClaw het volgende:

1. Leest skillmetadata.
2. Past `skills.entries.<key>.env` en `skills.entries.<key>.apiKey` toe op `process.env`.
3. Bouwt de systeemprompt met **in aanmerking komende** Skills.
4. Herstelt de oorspronkelijke omgeving nadat de run eindigt.

Omgevingsinjectie is **beperkt tot de agent-run**, niet tot een globale shellomgeving.

Voor de gebundelde `claude-cli`-backend materialiseert OpenClaw ook dezelfde
in aanmerking komende snapshot als een tijdelijke Claude Code-Plugin en geeft deze door met
`--plugin-dir`. Claude Code kan daarna de native skillresolver gebruiken, terwijl
OpenClaw nog steeds eigenaar blijft van prioriteit, allowlists per agent, gating en
`skills.entries.*` env/API-sleutelinjectie. Andere CLI-backends gebruiken alleen de
promptcatalogus.

## Snapshots en vernieuwen

OpenClaw maakt een snapshot van de in aanmerking komende Skills **wanneer een sessie start** en
hergebruikt die lijst voor daaropvolgende beurten in dezelfde sessie. Wijzigingen aan
Skills of configuratie worden van kracht bij de volgende nieuwe sessie.

Skills kunnen in twee gevallen halverwege de sessie worden vernieuwd:

- De skills watcher is ingeschakeld.
- Er verschijnt een nieuwe in aanmerking komende externe node.

Zie dit als een **hot reload**: de vernieuwde lijst wordt opgepakt bij de
volgende agentbeurt. Als de effectieve skill-allowlist van de agent voor die
sessie verandert, vernieuwt OpenClaw de snapshot zodat zichtbare Skills afgestemd blijven
op de huidige agent.

### Skills watcher

Standaard bewaakt OpenClaw skillmappen en verhoogt het de skillssnapshot
wanneer `SKILL.md`-bestanden veranderen. Configureer onder `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### Externe macOS-nodes (Linux-Gateway)

Als de Gateway op Linux draait maar er een **macOS-node** is verbonden met
`system.run` toegestaan (beveiliging voor Exec-goedkeuringen niet ingesteld op `deny`),
kan OpenClaw macOS-only Skills als in aanmerking komend behandelen wanneer de vereiste
binaries op die node aanwezig zijn. De agent moet die Skills uitvoeren
via de `exec`-tool met `host=node`.

Dit steunt op de node die de eigen commandondersteuning rapporteert en op een bin-probe
via `system.which` of `system.run`. Offline nodes maken
remote-only Skills **niet** zichtbaar. Als een verbonden node stopt met antwoorden op bin-
probes, wist OpenClaw de gecachte bin-matches zodat agents geen
Skills meer zien die daar momenteel niet kunnen draaien.

## Tokenimpact

Wanneer Skills in aanmerking komen, injecteert OpenClaw een compacte XML-lijst met beschikbare
Skills in de systeemprompt (via `formatSkillsForPrompt` in
`pi-coding-agent`). De kosten zijn deterministisch:

- **Basisoverhead** (alleen bij ≥1 skill): 195 tekens.
- **Per skill:** 97 tekens + de lengte van de XML-geëscapete waarden voor `<name>`, `<description>` en `<location>`.

Formule (tekens):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-escaping breidt `& < > " '` uit naar entiteiten (`&amp;`, `&lt;`, enz.),
waardoor de lengte toeneemt. Tokenaantallen verschillen per modeltokenizer. Een grove
OpenAI-stijl schatting is ~4 tekens/token, dus **97 tekens ≈ 24 tokens** per
skill plus je werkelijke veldlengtes.

## Levenscyclus van beheerde Skills

OpenClaw levert een basisset Skills als **gebundelde Skills** met de
installatie (npm-pakket of OpenClaw.app). `~/.openclaw/skills` bestaat voor
lokale overschrijvingen - bijvoorbeeld om een skill vast te pinnen of te patchen zonder
de gebundelde kopie te wijzigen. Workspace-Skills zijn eigendom van de gebruiker en overschrijven
beide bij naamconflicten.

## Op zoek naar meer Skills?

Blader door [https://clawhub.ai](https://clawhub.ai). Volledig configuratie-
schema: [Skills-configuratie](/nl/tools/skills-config).

## Gerelateerd

- [ClawHub](/nl/tools/clawhub) - openbaar skillsregister
- [Skills maken](/nl/tools/creating-skills) - aangepaste Skills bouwen
- [Plugins](/nl/tools/plugin) - overzicht van het Plugin-systeem
- [Skill Workshop-Plugin](/nl/plugins/skill-workshop) - genereer Skills op basis van agentwerk
- [Skills-configuratie](/nl/tools/skills-config) - referentie voor skillconfiguratie
- [Slash-commando's](/nl/tools/slash-commands) - alle beschikbare slash-commando's
