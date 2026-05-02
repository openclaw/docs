---
read_when:
    - Skills toevoegen of wijzigen
    - Skill-toegangscontrole, toelatingslijsten of laadregels wijzigen
    - Inzicht in Skills-prioriteit en snapshotgedrag
sidebarTitle: Skills
summary: 'Skills: beheerd versus werkruimte, gatingregels, agent-allowlists en configuratiekoppeling'
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:59:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw gebruikt **[AgentSkills](https://agentskills.io)-compatibele** skillmappen om de agent te leren hoe tools te gebruiken. Elke skill is een map met een `SKILL.md` met YAML-frontmatter en instructies. OpenClaw laadt gebundelde skills plus optionele lokale overschrijvingen, en filtert ze tijdens het laden op basis van omgeving, configuratie en aanwezigheid van binaries.

## Locaties en voorrang

OpenClaw laadt skills uit deze bronnen, **hoogste voorrang eerst**:

| #   | Bron                  | Pad                              |
| --- | --------------------- | -------------------------------- |
| 1   | Werkruimte-skills     | `<workspace>/skills`             |
| 2   | Projectagent-skills   | `<workspace>/.agents/skills`     |
| 3   | Persoonlijke agent-skills | `~/.agents/skills`           |
| 4   | Beheerde/lokale skills | `~/.openclaw/skills`            |
| 5   | Gebundelde skills     | meegeleverd met de installatie   |
| 6   | Extra skillmappen     | `skills.load.extraDirs` (config) |

Als een skillnaam conflicteert, wint de hoogste bron.

De native `$CODEX_HOME/skills`-map van Codex CLI is niet een van deze OpenClaw-skillroots. In Codex-harnessmodus gebruiken lokale app-serverstarts geisoleerde Codex-homes per agent, dus persoonlijke Codex CLI-skills worden niet impliciet geladen. Gebruik `openclaw migrate codex --dry-run` om ze te inventariseren en `openclaw migrate codex` om skillmappen te kiezen met een interactieve checkboxprompt voordat ze naar de huidige OpenClaw-agentwerkruimte worden gekopieerd. Voor niet-interactieve runs herhaal je `--skill <name>` voor de exacte skills die je wilt kopieren.

## Per-agent versus gedeelde skills

In **multi-agent**-setups heeft elke agent zijn eigen werkruimte:

| Bereik               | Pad                                         | Zichtbaar voor              |
| -------------------- | ------------------------------------------- | --------------------------- |
| Per-agent            | `<workspace>/skills`                        | Alleen die agent            |
| Projectagent         | `<workspace>/.agents/skills`                | Alleen de agent van die werkruimte |
| Persoonlijke agent   | `~/.agents/skills`                          | Alle agents op die machine  |
| Gedeeld beheerd/lokaal | `~/.openclaw/skills`                      | Alle agents op die machine  |
| Gedeelde extra mappen | `skills.load.extraDirs` (laagste voorrang) | Alle agents op die machine  |

Dezelfde naam op meerdere plekken -> hoogste bron wint. Werkruimte wint van projectagent, wint van persoonlijke agent, wint van beheerd/lokaal, wint van gebundeld, wint van extra mappen.

## Agent-allowlists voor skills

Skill**locatie** en skill**zichtbaarheid** zijn afzonderlijke controles. Locatie/voorrang bepaalt welke kopie van een gelijknamige skill wint; agent-allowlists bepalen welke skills een agent daadwerkelijk kan gebruiken.

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
    - Een niet-lege `agents.list[].skills`-lijst is de **definitieve** set voor die agent; deze wordt niet samengevoegd met defaults.
    - De effectieve allowlist geldt voor promptopbouw, ontdekking van slash-commands voor skills, sandbox-sync en skill-snapshots.
  </Accordion>
</AccordionGroup>

## Plugins en skills

Plugins kunnen hun eigen skills meeleveren door `skills`-mappen op te nemen in `openclaw.plugin.json` (paden relatief aan de Plugin-root). Plugin-skills worden geladen wanneer de Plugin is ingeschakeld. Dit is de juiste plaats voor toolspecifieke bedieningshandleidingen die te lang zijn voor de toolbeschrijving, maar beschikbaar moeten zijn wanneer de Plugin is geinstalleerd, bijvoorbeeld de browser-Plugin levert een `browser-automation`-skill voor browserbesturing in meerdere stappen.

Plugin-skillmappen worden samengevoegd in hetzelfde pad met lage voorrang als `skills.load.extraDirs`, dus een gelijknamige gebundelde, beheerde, agent- of werkruimte-skill overschrijft ze. Je kunt ze afschermen via `metadata.openclaw.requires.config` op de configuratie-entry van de Plugin.

Zie [Plugins](/nl/tools/plugin) voor ontdekking/configuratie en [Tools](/nl/tools) voor het tooloppervlak dat deze skills aanleren.

## Skill Workshop

De optionele, experimentele **Skill Workshop**-Plugin kan werkruimte-skills maken of bijwerken vanuit herbruikbare procedures die tijdens agentwerk zijn waargenomen. Deze is standaard uitgeschakeld en moet expliciet worden ingeschakeld via `plugins.entries.skill-workshop`.

Skill Workshop schrijft alleen naar `<workspace>/skills`, scant gegenereerde inhoud, ondersteunt wachtende goedkeuring of automatische veilige schrijfacties, plaatst onveilige voorstellen in quarantaine en vernieuwt de skill-snapshot na succesvolle schrijfacties, zodat nieuwe skills beschikbaar worden zonder Gateway-herstart.

Gebruik dit voor correcties zoals _"controleer de volgende keer GIF-toeschrijving"_ of zwaarbevochten workflows zoals media-QA-checklists. Begin met wachtende goedkeuring; gebruik automatische schrijfacties alleen in vertrouwde werkruimtes nadat je de voorstellen hebt beoordeeld. Volledige gids: [Skill Workshop-Plugin](/nl/plugins/skill-workshop).

## ClawHub (installeren en synchroniseren)

[ClawHub](https://clawhub.ai) is het openbare skillsregister voor OpenClaw. Gebruik native `openclaw skills`-commando's voor ontdekken/installeren/bijwerken, of de afzonderlijke `clawhub` CLI voor publicatie-/sync-workflows. Volledige gids: [ClawHub](/nl/tools/clawhub).

| Actie                              | Commando                               |
| ---------------------------------- | -------------------------------------- |
| Een skill in de werkruimte installeren | `openclaw skills install <skill-slug>` |
| Alle geinstalleerde skills bijwerken | `openclaw skills update --all`       |
| Synchroniseren (scannen + updates publiceren) | `clawhub sync --all`          |

Native `openclaw skills install` installeert in de actieve werkruimte-directory `skills/`. De afzonderlijke `clawhub` CLI installeert ook in `./skills` onder je huidige werkdirectory (of valt terug op de geconfigureerde OpenClaw-werkruimte). OpenClaw pakt dat op als `<workspace>/skills` in de volgende sessie. Geconfigureerde skillroots ondersteunen ook een groeperingsniveau, zoals `skills/<group>/<skill>/SKILL.md`, zodat gerelateerde skills van derden onder een gedeelde map kunnen worden bewaard zonder brede recursieve scanning.

ClawHub-skillpagina's tonen de nieuwste status van de beveiligingsscan voor installatie, met scandetailpagina's voor VirusTotal, ClawScan en statische analyse. `openclaw skills install <slug>` blijft alleen het installatiepad; uitgevers herstellen fout-positieven via het ClawHub-dashboard of `clawhub skill rescan <slug>`.

## Beveiliging

<Warning>
Behandel skills van derden als **onvertrouwde code**. Lees ze voordat je ze inschakelt. Geef de voorkeur aan sandboxed runs voor onvertrouwde invoer en risicovolle tools. Zie [Sandboxing](/nl/gateway/sandboxing) voor de controles aan agentzijde.
</Warning>

- Ontdekking van werkruimte- en extra-dir-skills accepteert alleen skillroots en `SKILL.md`-bestanden waarvan de opgeloste realpath binnen de geconfigureerde root blijft.
- Gateway-ondersteunde installaties van skillafhankelijkheden (`skills.install`, onboarding en de Skills-instellingen-UI) voeren de ingebouwde dangerous-code-scanner uit voordat installermetadata wordt uitgevoerd. `critical`-bevindingen blokkeren standaard tenzij de aanroeper expliciet de gevaarlijke override instelt; verdachte bevindingen waarschuwen nog steeds alleen.
- `openclaw skills install <slug>` is anders: het downloadt een ClawHub-skillmap naar de werkruimte en gebruikt het installermetadata-pad hierboven niet.
- `skills.entries.*.env` en `skills.entries.*.apiKey` injecteren geheimen in het **host**proces voor die agentbeurt (niet de sandbox). Houd geheimen uit prompts en logs.

Zie [Security](/nl/gateway/security) voor een breder dreigingsmodel en checklists.

## SKILL.md-indeling

`SKILL.md` moet minstens het volgende bevatten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw volgt de AgentSkills-specificatie voor layout/intentie. De parser die door de ingebedde agent wordt gebruikt ondersteunt alleen **eenregelige** frontmatter-sleutels; `metadata` moet een **eenregelig JSON-object** zijn. Gebruik `{baseDir}` in instructies om te verwijzen naar het pad van de skillmap.

### Optionele frontmatter-sleutels

<ParamField path="homepage" type="string">
  URL die als "Website" wordt weergegeven in de macOS Skills-UI. Ook ondersteund via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Wanneer `true`, wordt de skill zichtbaar als gebruikers-slash-command.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wanneer `true`, houdt OpenClaw de instructies van de skill buiten de normale prompt van de agent. De skill blijft geinstalleerd en kan nog steeds expliciet worden uitgevoerd als slash-command wanneer `user-invocable` ook `true` is.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Wanneer ingesteld op `tool`, omzeilt het slash-command het model en dispatcht het rechtstreeks naar een tool.
</ParamField>
<ParamField path="command-tool" type="string">
  Toolnaam die moet worden aangeroepen wanneer `command-dispatch: tool` is ingesteld.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Voor tool-dispatch stuurt dit de ruwe args-string door naar de tool (geen core-parsing). De tool wordt aangeroepen met `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filters tijdens laden)

OpenClaw filtert skills tijdens het laden met `metadata` (eenregelige JSON):

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
  Wanneer `true`, altijd de skill opnemen (andere gates overslaan).
</ParamField>
<ParamField path="emoji" type="string">
  Optionele emoji gebruikt door de macOS Skills-UI.
</ParamField>
<ParamField path="homepage" type="string">
  Optionele URL getoond als "Website" in de macOS Skills-UI.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Optionele lijst met platformen. Als deze is ingesteld, komt de skill alleen in aanmerking op die besturingssystemen.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Elk moet bestaan op `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Minstens een moet bestaan op `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env-var moet bestaan of in config worden opgegeven.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lijst met `openclaw.json`-paden die truthy moeten zijn.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Env-varnaam gekoppeld aan `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Optionele installerspecificaties gebruikt door de macOS Skills-UI (brew/node/go/uv/download).
</ParamField>

Als er geen `metadata.openclaw` aanwezig is, komt de skill altijd in aanmerking (tenzij uitgeschakeld in config of geblokkeerd door `skills.allowBundled` voor gebundelde skills).

<Note>
Verouderde `metadata.clawdbot`-blokken worden nog steeds geaccepteerd wanneer `metadata.openclaw` ontbreekt, zodat oudere geinstalleerde skills hun afhankelijkheidsgates en installerhints behouden. Nieuwe en bijgewerkte skills moeten `metadata.openclaw` gebruiken.
</Note>

### Opmerkingen over sandboxing

- `requires.bins` wordt gecontroleerd op de **host** tijdens het laden van skills.
- Als een agent in een sandbox draait, moet de binary ook **in de container** bestaan. Installeer deze via `agents.defaults.sandbox.docker.setupCommand` (of een aangepaste image). `setupCommand` draait eenmalig nadat de container is gemaakt. Pakketinstallaties vereisen ook netwerk-egress, een beschrijfbaar root-FS en een rootgebruiker in de sandbox.
- Voorbeeld: de `summarize`-skill (`skills/summarize/SKILL.md`) heeft de `summarize` CLI in de sandboxcontainer nodig om daar te kunnen draaien.

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
  <Accordion title="Selectieregels voor installaties">
    - Als er meerdere installatieprogramma's worden vermeld, kiest de Gateway één voorkeursoptie (brew wanneer beschikbaar, anders node).
    - Als alle installatieprogramma's `download` zijn, vermeldt OpenClaw elke vermelding zodat je de beschikbare artefacten kunt zien.
    - Installatiespecificaties kunnen `os: ["darwin"|"linux"|"win32"]` bevatten om opties op platform te filteren.
    - Node-installaties respecteren `skills.install.nodeManager` in `openclaw.json` (standaard: npm; opties: npm/pnpm/yarn/bun). Dit is alleen van invloed op skill-installaties; de Gateway-runtime moet nog steeds Node zijn — Bun wordt niet aanbevolen voor WhatsApp/Telegram.
    - Installatieselectie via de Gateway is voorkeursgestuurd: wanneer installatiespecificaties soorten mengen, geeft OpenClaw de voorkeur aan Homebrew wanneer `skills.install.preferBrew` is ingeschakeld en `brew` bestaat, daarna `uv`, daarna de geconfigureerde node-manager, en daarna andere terugvalopties zoals `go` of `download`.
    - Als elke installatiespecificatie `download` is, toont OpenClaw alle downloadopties in plaats van ze samen te voegen tot één voorkeursinstallatieprogramma.

  </Accordion>
  <Accordion title="Details per installatieprogramma">
    - **Go-installaties:** als `go` ontbreekt en `brew` beschikbaar is, installeert de Gateway eerst Go via Homebrew en stelt indien mogelijk `GOBIN` in op de `bin` van Homebrew.
    - **Downloadinstallaties:** `url` (vereist), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (standaard: automatisch wanneer een archief wordt gedetecteerd), `stripComponents`, `targetDir` (standaard: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Configuratie-overschrijvingen

Gebundelde en beheerde skills kunnen worden in- of uitgeschakeld en voorzien van env-waarden
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
  `false` schakelt de skill uit, zelfs als die is gebundeld of geïnstalleerd.
  De gebundelde `coding-agent`-skill is opt-in: stel
  `skills.entries.coding-agent.enabled: true` in voordat je die aan agents beschikbaar maakt,
  en zorg er daarna voor dat een van `claude`, `codex`, `opencode` of `pi` is geïnstalleerd en
  geauthenticeerd voor de eigen CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Gemak voor skills die `metadata.openclaw.primaryEnv` declareren. Ondersteunt platte tekst of SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Alleen geïnjecteerd als de variabele nog niet in het proces is ingesteld.
</ParamField>
<ParamField path="config" type="object">
  Optionele verzameling voor aangepaste velden per skill. Aangepaste sleutels moeten hier staan.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Optionele allowlist alleen voor **gebundelde** skills. Als deze is ingesteld, komen alleen gebundelde skills in de lijst in aanmerking (beheerde/werkruimte-skills blijven onaangetast).
</ParamField>

Als de skillnaam koppeltekens bevat, zet de sleutel dan tussen aanhalingstekens (JSON5 staat aangehaalde
sleutels toe). Configuratiesleutels komen standaard overeen met de **skillnaam** — als een skill
`metadata.openclaw.skillKey` definieert, gebruik dan die sleutel onder `skills.entries`.

<Note>
Voor standaard beeldgeneratie/-bewerking binnen OpenClaw gebruik je de kern-tool
`image_generate` met `agents.defaults.imageGenerationModel` in plaats
van een gebundelde skill. De skillvoorbeelden hier zijn voor aangepaste of externe
workflows. Gebruik voor native beeldanalyse de `image`-tool met
`agents.defaults.imageModel`. Als je `openai/*`, `google/*`,
`fal/*` of een ander providerspecifiek beeldmodel kiest, voeg dan ook de
auth/API-sleutel van die provider toe.
</Note>

## Omgevingsinjectie

Wanneer een agent-run start, doet OpenClaw het volgende:

1. Leest skillmetadata.
2. Past `skills.entries.<key>.env` en `skills.entries.<key>.apiKey` toe op `process.env`.
3. Bouwt de systeemprompt met **geschikte** skills.
4. Herstelt de oorspronkelijke omgeving nadat de run is afgelopen.

Omgevingsinjectie is **beperkt tot de agent-run**, niet tot een globale shellomgeving.

Voor de gebundelde `claude-cli`-backend materialiseert OpenClaw ook dezelfde
geschikte snapshot als een tijdelijke Claude Code-plugin en geeft deze door met
`--plugin-dir`. Claude Code kan dan zijn native skillresolver gebruiken terwijl
OpenClaw nog steeds de prioriteit, allowlists per agent, gating en
`skills.entries.*` env/API-sleutelinjectie beheert. Andere CLI-backends gebruiken alleen de
promptcatalogus.

## Snapshots en vernieuwen

OpenClaw maakt snapshots van de geschikte skills **wanneer een sessie start** en
hergebruikt die lijst voor volgende beurten in dezelfde sessie. Wijzigingen in
skills of configuratie worden van kracht bij de volgende nieuwe sessie.

Skills kunnen tijdens een sessie in twee gevallen worden vernieuwd:

- De skills-watcher is ingeschakeld.
- Er verschijnt een nieuw geschikt extern knooppunt.

Zie dit als een **hot reload**: de vernieuwde lijst wordt opgepakt bij de
volgende agentbeurt. Als de effectieve allowlist voor agentskills voor die
sessie verandert, vernieuwt OpenClaw de snapshot zodat zichtbare skills afgestemd blijven
op de huidige agent.

### Skills-watcher

OpenClaw bewaakt standaard skillmappen en verhoogt de skills-snapshot
wanneer `SKILL.md`-bestanden wijzigen. Configureer dit onder `skills.load`:

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

### Externe macOS-knooppunten (Linux-gateway)

Als de Gateway op Linux draait maar een **macOS-knooppunt** is verbonden met
`system.run` toegestaan (beveiliging voor Exec-goedkeuringen niet ingesteld op `deny`),
kan OpenClaw macOS-only skills als geschikt behandelen wanneer de vereiste
binaire bestanden op dat knooppunt aanwezig zijn. De agent moet die skills uitvoeren
via de `exec`-tool met `host=node`.

Dit vertrouwt erop dat het knooppunt zijn commandondersteuning rapporteert en op een bin-probe
via `system.which` of `system.run`. Offline knooppunten maken
remote-only skills **niet** zichtbaar. Als een verbonden knooppunt niet meer antwoordt op bin-probes,
wist OpenClaw de gecachete bin-matches zodat agents geen skills meer zien
die daar momenteel niet kunnen draaien.

## Tokenimpact

Wanneer skills geschikt zijn, injecteert OpenClaw een compacte XML-lijst met beschikbare
skills in de systeemprompt (via `formatSkillsForPrompt` in
`pi-coding-agent`). De kosten zijn deterministisch:

- **Basisoverhead** (alleen wanneer ≥1 skill): 195 tekens.
- **Per skill:** 97 tekens + de lengte van de XML-geëscapete waarden `<name>`, `<description>` en `<location>`.

Formule (tekens):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-escaping breidt `& < > " '` uit naar entiteiten (`&amp;`, `&lt;`, enz.),
waardoor de lengte toeneemt. Tokenaantallen variëren per modeltokenizer. Een ruwe
schatting in OpenAI-stijl is ~4 tekens/token, dus **97 tekens ≈ 24 tokens** per
skill plus je werkelijke veldlengtes.

## Levenscyclus van beheerde skills

OpenClaw levert een basisset skills als **gebundelde skills** mee met de
installatie (npm-pakket of OpenClaw.app). `~/.openclaw/skills` bestaat voor
lokale overschrijvingen — bijvoorbeeld om een skill vast te pinnen of te patchen zonder
de gebundelde kopie te wijzigen. Werkruimte-skills zijn eigendom van de gebruiker en overschrijven
beide bij naamconflicten.

## Op zoek naar meer skills?

Blader door [https://clawhub.ai](https://clawhub.ai). Volledig configuratie-
schema: [Skills-configuratie](/nl/tools/skills-config).

## Gerelateerd

- [ClawHub](/nl/tools/clawhub) — openbaar skillsregister
- [Skills maken](/nl/tools/creating-skills) — aangepaste skills bouwen
- [Plugins](/nl/tools/plugin) — overzicht van het pluginsysteem
- [Skill Workshop-plugin](/nl/plugins/skill-workshop) — skills genereren vanuit agentwerk
- [Skills-configuratie](/nl/tools/skills-config) — referentie voor skillconfiguratie
- [Slash-commands](/nl/tools/slash-commands) — alle beschikbare slash-commands
