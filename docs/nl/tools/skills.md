---
read_when:
    - Skills toevoegen of wijzigen
    - Gating, allowlists of laadregels voor Skills wijzigen
    - Skillprioriteit en snapshotgedrag begrijpen
sidebarTitle: Skills
summary: 'Skills: beheerd versus werkruimte, gate-regels, toestaanlijsten voor agents en configuratiekoppeling'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw gebruikt **[AgentSkills](https://agentskills.io)-compatibele** vaardigheidsmappen om de agent te leren hoe tools te gebruiken. Elke vaardigheid is een map met een `SKILL.md` met YAML-frontmatter en instructies. OpenClaw laadt gebundelde vaardigheden plus optionele lokale overrides, en filtert ze tijdens het laden op basis van omgeving, configuratie en aanwezigheid van binaries.

## Locaties en prioriteit

OpenClaw laadt vaardigheden uit deze bronnen, **hoogste prioriteit eerst**:

| #   | Bron                         | Pad                              |
| --- | ---------------------------- | -------------------------------- |
| 1   | Werkruimtevaardigheden       | `<workspace>/skills`             |
| 2   | Projectagentvaardigheden     | `<workspace>/.agents/skills`     |
| 3   | Persoonlijke agentvaardigheden | `~/.agents/skills`             |
| 4   | Beheerde/lokale vaardigheden | `~/.openclaw/skills`             |
| 5   | Gebundelde vaardigheden      | meegeleverd met de installatie   |
| 6   | Extra vaardigheidsmappen     | `skills.load.extraDirs` (config) |

Als een vaardigheidsnaam conflicteert, wint de hoogste bron.

De native `$CODEX_HOME/skills`-directory van Codex CLI is niet een van deze OpenClaw-vaardigheidsroots. In Codex-harnasmodus gebruiken lokale appserverstarts geïsoleerde Codex-homes per agent, waardoor persoonlijke Codex CLI-vaardigheden niet impliciet worden geladen. Gebruik `openclaw migrate codex --dry-run` om ze te inventariseren en `openclaw migrate codex` om vaardigheidsdirectories te kiezen met een interactieve checkboxprompt voordat ze naar de huidige OpenClaw-agentwerkruimte worden gekopieerd. Voor niet-interactieve runs herhaal je `--skill <name>` voor de exacte vaardigheden die moeten worden gekopieerd.

## Per-agent versus gedeelde vaardigheden

In **multi-agent**-setups heeft elke agent een eigen werkruimte:

| Scope                | Pad                                         | Zichtbaar voor               |
| -------------------- | ------------------------------------------- | ---------------------------- |
| Per-agent            | `<workspace>/skills`                        | Alleen die agent             |
| Project-agent        | `<workspace>/.agents/skills`                | Alleen de agent van die werkruimte |
| Personal-agent       | `~/.agents/skills`                          | Alle agents op die machine   |
| Gedeeld beheerd/lokaal | `~/.openclaw/skills`                      | Alle agents op die machine   |
| Gedeelde extra directories | `skills.load.extraDirs` (laagste prioriteit) | Alle agents op die machine |

Dezelfde naam op meerdere plaatsen → hoogste bron wint. Werkruimte wint van project-agent, wint van personal-agent, wint van beheerd/lokaal, wint van gebundeld, wint van extra directories.

## Allowlists voor agentvaardigheden

Vaardigheids**locatie** en vaardigheids**zichtbaarheid** zijn afzonderlijke controles. Locatie/prioriteit bepaalt welke kopie van een vaardigheid met dezelfde naam wint; agent-allowlists bepalen welke vaardigheden een agent daadwerkelijk kan gebruiken.

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
  <Accordion title="Allowlistregels">
    - Laat `agents.defaults.skills` weg voor standaard onbeperkte vaardigheden.
    - Laat `agents.list[].skills` weg om `agents.defaults.skills` te erven.
    - Stel `agents.list[].skills: []` in voor geen vaardigheden.
    - Een niet-lege `agents.list[].skills`-lijst is de **definitieve** set voor die agent — deze wordt niet samengevoegd met defaults.
    - De effectieve allowlist geldt voor promptopbouw, ontdekking van slash-commands voor vaardigheden, sandbox-synchronisatie en vaardigheidssnapshots.
  </Accordion>
</AccordionGroup>

## Plugins en vaardigheden

Plugins kunnen hun eigen vaardigheden meeleveren door `skills`-directories te vermelden in `openclaw.plugin.json` (paden relatief aan de pluginroot). Pluginvaardigheden worden geladen wanneer de Plugin is ingeschakeld. Dit is de juiste plaats voor toolspecifieke bedieningsgidsen die te lang zijn voor de toolbeschrijving, maar beschikbaar moeten zijn wanneer de Plugin is geïnstalleerd — de browserplugin levert bijvoorbeeld een `browser-automation`-vaardigheid voor meerstapsbrowserbesturing.

Pluginvaardigheidsdirectories worden samengevoegd in hetzelfde pad met lage prioriteit als `skills.load.extraDirs`, dus een gebundelde, beheerde, agent- of werkruimtevaardigheid met dezelfde naam overschrijft ze. Je kunt ze afschermen via `metadata.openclaw.requires.config` op de configuratie-entry van de Plugin.

Zie [Plugins](/nl/tools/plugin) voor ontdekking/configuratie en [Tools](/nl/tools) voor het tooloppervlak dat deze vaardigheden onderwijzen.

## Skill Workshop

De optionele, experimentele **Skill Workshop**-Plugin kan werkruimtevaardigheden maken of bijwerken op basis van herbruikbare procedures die tijdens agentwerk zijn waargenomen. Deze is standaard uitgeschakeld en moet expliciet worden ingeschakeld via `plugins.entries.skill-workshop`.

Skill Workshop schrijft alleen naar `<workspace>/skills`, scant gegenereerde inhoud, ondersteunt in afwachting zijnde goedkeuring of automatische veilige writes, plaatst onveilige voorstellen in quarantaine en vernieuwt het vaardigheidssnapshot na geslaagde writes zodat nieuwe vaardigheden beschikbaar worden zonder een Gateway-herstart.

Gebruik dit voor correcties zoals _"verifieer de volgende keer GIF-toeschrijving"_ of zwaar bevochten workflows zoals QA-checklists voor media. Begin met goedkeuring in afwachting; gebruik automatische writes alleen in vertrouwde werkruimten na beoordeling van de voorstellen. Volledige gids: [Skill Workshop-Plugin](/nl/plugins/skill-workshop).

## ClawHub (installeren en synchroniseren)

[ClawHub](https://clawhub.ai) is het openbare vaardighedenregister voor OpenClaw. Gebruik native `openclaw skills`-commands voor ontdekken/installeren/bijwerken, of de afzonderlijke `clawhub` CLI voor publicatie-/synchronisatieworkflows. Volledige gids: [ClawHub](/nl/tools/clawhub).

| Actie                              | Command                                |
| ---------------------------------- | -------------------------------------- |
| Een vaardigheid in de werkruimte installeren | `openclaw skills install <skill-slug>` |
| Alle geïnstalleerde vaardigheden bijwerken | `openclaw skills update --all`         |
| Synchroniseren (scannen + updates publiceren) | `clawhub sync --all`                   |

Native `openclaw skills install` installeert in de actieve werkruimte-`skills/`-directory. De afzonderlijke `clawhub` CLI installeert ook in `./skills` onder je huidige werkdirectory (of valt terug op de geconfigureerde OpenClaw-werkruimte). OpenClaw pikt dit op als `<workspace>/skills` bij de volgende sessie.
Geconfigureerde vaardigheidsroots ondersteunen ook één groeperingsniveau, zoals `skills/<group>/<skill>/SKILL.md`, zodat gerelateerde vaardigheden van derden onder een gedeelde map kunnen worden bewaard zonder brede recursieve scanning.

ClawHub-vaardigheidspagina's tonen vóór installatie de nieuwste status van de beveiligingsscan, met scandetailpagina's voor VirusTotal, ClawScan en statische analyse. `openclaw skills install <slug>` blijft alleen het installatiepad; publishers herstellen false positives via het ClawHub-dashboard of `clawhub skill rescan <slug>`.

## Beveiliging

<Warning>
Behandel vaardigheden van derden als **niet-vertrouwde code**. Lees ze voordat je ze inschakelt. Geef de voorkeur aan sandboxed runs voor niet-vertrouwde invoer en risicovolle tools. Zie [Sandboxing](/nl/gateway/sandboxing) voor de controles aan agentzijde.
</Warning>

- Detectie van werkruimte- en extra-directoryvaardigheden accepteert alleen vaardigheidsroots en `SKILL.md`-bestanden waarvan het opgeloste realpath binnen de geconfigureerde root blijft.
- Gateway-ondersteunde installatie van vaardigheidsafhankelijkheden (`skills.install`, onboarding en de Skills-instellingen-UI) voert de ingebouwde scanner voor gevaarlijke code uit voordat installatiemetadata wordt uitgevoerd. `critical`-bevindingen blokkeren standaard tenzij de caller expliciet de gevaarlijke override instelt; verdachte bevindingen geven nog steeds alleen een waarschuwing.
- `openclaw skills install <slug>` is anders — het downloadt een ClawHub-vaardigheidsmap naar de werkruimte en gebruikt het pad voor installatiemetadata hierboven niet.
- `skills.entries.*.env` en `skills.entries.*.apiKey` injecteren geheimen in het **host**-proces voor die agentbeurt (niet de sandbox). Houd geheimen uit prompts en logs.

Voor een breder dreigingsmodel en checklists, zie [Beveiliging](/nl/gateway/security).

## SKILL.md-indeling

`SKILL.md` moet ten minste bevatten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw volgt de AgentSkills-specificatie voor layout/intentie. De parser die door de ingebedde agent wordt gebruikt ondersteunt alleen **éénregelige** frontmatter-sleutels; `metadata` moet een **éénregelig JSON-object** zijn. Gebruik `{baseDir}` in instructies om naar het pad van de vaardigheidsmap te verwijzen.

### Optionele frontmatter-sleutels

<ParamField path="homepage" type="string">
  URL die als "Website" wordt getoond in de macOS Skills-UI. Ook ondersteund via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Wanneer `true`, wordt de vaardigheid weergegeven als een slash-command voor gebruikers.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wanneer `true`, wordt de vaardigheid uitgesloten van de modelprompt (nog steeds beschikbaar via gebruikersaanroep).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Wanneer ingesteld op `tool`, omzeilt het slash-command het model en dispatcht het rechtstreeks naar een tool.
</ParamField>
<ParamField path="command-tool" type="string">
  Toolnaam die moet worden aangeroepen wanneer `command-dispatch: tool` is ingesteld.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Voor tooldispatch stuurt dit de raw args-string door naar de tool (geen core parsing). De tool wordt aangeroepen met `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filters tijdens laden)

OpenClaw filtert vaardigheden tijdens het laden met `metadata` (éénregelige JSON):

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
  Wanneer `true`, neem de vaardigheid altijd op (sla andere gates over).
</ParamField>
<ParamField path="emoji" type="string">
  Optionele emoji die wordt gebruikt door de macOS Skills-UI.
</ParamField>
<ParamField path="homepage" type="string">
  Optionele URL die als "Website" wordt getoond in de macOS Skills-UI.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Optionele lijst met platforms. Indien ingesteld, komt de vaardigheid alleen in aanmerking op die OS'en.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Elke moet bestaan op `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Ten minste één moet bestaan op `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env-var moet bestaan of in config worden geleverd.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lijst met `openclaw.json`-paden die truthy moeten zijn.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Env-varnaam die is gekoppeld aan `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Optionele installatiespecificaties gebruikt door de macOS Skills-UI (brew/node/go/uv/download).
</ParamField>

Als er geen `metadata.openclaw` aanwezig is, komt de vaardigheid altijd in aanmerking (tenzij uitgeschakeld in config of geblokkeerd door `skills.allowBundled` voor gebundelde vaardigheden).

<Note>
Legacy `metadata.clawdbot`-blokken worden nog steeds geaccepteerd wanneer `metadata.openclaw` ontbreekt, zodat oudere geïnstalleerde vaardigheden hun dependencygates en installatiehints behouden. Nieuwe en bijgewerkte vaardigheden moeten `metadata.openclaw` gebruiken.
</Note>

### Sandboxnotities

- `requires.bins` wordt gecontroleerd op de **host** tijdens het laden van vaardigheden.
- Als een agent in een sandbox draait, moet de binary ook **binnen de container** bestaan. Installeer deze via `agents.defaults.sandbox.docker.setupCommand` (of een custom image). `setupCommand` wordt eenmaal uitgevoerd nadat de container is gemaakt. Package-installaties vereisen ook netwerkegress, een beschrijfbaar rootbestandssysteem en een rootgebruiker in de sandbox.
- Voorbeeld: de `summarize`-vaardigheid (`skills/summarize/SKILL.md`) heeft de `summarize` CLI nodig in de sandboxcontainer om daar te draaien.

### Installatiespecificaties

```markdown
---
name: gemini
description: Gebruik Gemini CLI voor codeerhulp en Google-zoekopdrachten.
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
              "label": "Installeer Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Regels voor installatieselectie">
    - Als er meerdere installers worden vermeld, kiest de gateway één voorkeursoptie (brew wanneer beschikbaar, anders node).
    - Als alle installers `download` zijn, vermeldt OpenClaw elke vermelding zodat je de beschikbare artefacten kunt zien.
    - Installerspecificaties kunnen `os: ["darwin"|"linux"|"win32"]` bevatten om opties op platform te filteren.
    - Node-installaties respecteren `skills.install.nodeManager` in `openclaw.json` (standaard: npm; opties: npm/pnpm/yarn/bun). Dit beïnvloedt alleen skill-installaties; de Gateway-runtime moet nog steeds Node zijn — Bun wordt niet aanbevolen voor WhatsApp/Telegram.
    - Door Gateway ondersteunde installatieselectie is voorkeurgestuurd: wanneer installatiespecificaties soorten mengen, geeft OpenClaw de voorkeur aan Homebrew wanneer `skills.install.preferBrew` is ingeschakeld en `brew` bestaat, daarna `uv`, daarna de geconfigureerde node-manager, en daarna andere terugvallen zoals `go` of `download`.
    - Als elke installatiespecificatie `download` is, toont OpenClaw alle downloadopties in plaats van ze samen te voegen tot één voorkeursinstaller.

  </Accordion>
  <Accordion title="Details per installer">
    - **Go-installaties:** als `go` ontbreekt en `brew` beschikbaar is, installeert de gateway eerst Go via Homebrew en stelt waar mogelijk `GOBIN` in op de `bin` van Homebrew.
    - **Downloadinstallaties:** `url` (vereist), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (standaard: automatisch wanneer archief wordt gedetecteerd), `stripComponents`, `targetDir` (standaard: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Configuratie-overschrijvingen

Gebundelde en beheerde skills kunnen worden in- en uitgeschakeld en worden voorzien van env-waarden
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
  Optionele allowlist alleen voor **gebundelde** skills. Indien ingesteld, komen alleen gebundelde skills in de lijst in aanmerking (beheerde/workspace-skills blijven onaangetast).
</ParamField>

Als de skillnaam koppeltekens bevat, zet de sleutel tussen aanhalingstekens (JSON5 staat aangehaalde
sleutels toe). Configuratiesleutels komen standaard overeen met de **skillnaam** — als een skill
`metadata.openclaw.skillKey` definieert, gebruik dan die sleutel onder `skills.entries`.

<Note>
Voor standaard afbeeldingsgeneratie/-bewerking binnen OpenClaw gebruik je de kern-tool
`image_generate` met `agents.defaults.imageGenerationModel` in plaats
van een gebundelde skill. Skillvoorbeelden hier zijn bedoeld voor aangepaste workflows of workflows van derden.
Gebruik voor native afbeeldingsanalyse de tool `image` met
`agents.defaults.imageModel`. Als je `openai/*`, `google/*`,
`fal/*` of een ander providerspecifiek afbeeldingsmodel kiest, voeg dan ook de
auth/API-sleutel van die provider toe.
</Note>

## Omgevingsinjectie

Wanneer een agent-run start, doet OpenClaw het volgende:

1. Leest skillmetadata.
2. Past `skills.entries.<key>.env` en `skills.entries.<key>.apiKey` toe op `process.env`.
3. Bouwt de systeemprompt met **in aanmerking komende** skills.
4. Herstelt de oorspronkelijke omgeving nadat de run is afgelopen.

Omgevingsinjectie is **beperkt tot de agent-run**, niet tot een globale shell-
omgeving.

Voor de gebundelde `claude-cli`-backend materialiseert OpenClaw ook dezelfde
in aanmerking komende momentopname als een tijdelijke Claude Code-plugin en geeft deze door met
`--plugin-dir`. Claude Code kan daarna zijn native skillresolver gebruiken terwijl
OpenClaw nog steeds eigenaar is van prioriteit, allowlists per agent, gating en
`skills.entries.*` env/API-sleutelinjectie. Andere CLI-backends gebruiken alleen de
promptcatalogus.

## Momentopnamen en verversen

OpenClaw maakt een momentopname van de in aanmerking komende skills **wanneer een sessie start** en
hergebruikt die lijst voor volgende beurten in dezelfde sessie. Wijzigingen in
skills of configuratie worden van kracht bij de volgende nieuwe sessie.

Skills kunnen midden in een sessie worden ververst in twee gevallen:

- De skills-watcher is ingeschakeld.
- Er verschijnt een nieuwe in aanmerking komende externe node.

Zie dit als een **hot reload**: de ververste lijst wordt opgepakt bij de
volgende agent-beurt. Als de effectieve allowlist voor agentskills voor die
sessie verandert, ververst OpenClaw de momentopname zodat zichtbare skills afgestemd blijven
op de huidige agent.

### Skills-watcher

Standaard bewaakt OpenClaw skillmappen en verhoogt het de skills-momentopname
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

### Externe macOS-nodes (Linux-gateway)

Als de Gateway op Linux draait maar er een **macOS-node** is verbonden met
`system.run` toegestaan (beveiliging voor Exec-goedkeuringen niet ingesteld op `deny`),
kan OpenClaw macOS-only skills als in aanmerking komend behandelen wanneer de vereiste
binaries op die node aanwezig zijn. De agent moet die skills uitvoeren
via de tool `exec` met `host=node`.

Dit is afhankelijk van de node die zijn commandondersteuning rapporteert en van een bin-probe
via `system.which` of `system.run`. Offline nodes maken
remote-only skills **niet** zichtbaar. Als een verbonden node stopt met antwoorden op bin-
probes, wist OpenClaw de gecachete bin-matches zodat agents geen
skills meer zien die daar momenteel niet kunnen worden uitgevoerd.

## Tokenimpact

Wanneer skills in aanmerking komen, injecteert OpenClaw een compacte XML-lijst van beschikbare
skills in de systeemprompt (via `formatSkillsForPrompt` in
`pi-coding-agent`). De kosten zijn deterministisch:

- **Basisoverhead** (alleen wanneer ≥1 skill): 195 tekens.
- **Per skill:** 97 tekens + de lengte van de XML-geëscapete waarden `<name>`, `<description>` en `<location>`.

Formule (tekens):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-escaping breidt `& < > " '` uit naar entiteiten (`&amp;`, `&lt;`, enz.),
waardoor de lengte toeneemt. Tokenaantallen verschillen per modeltokenizer. Een grove
schatting in OpenAI-stijl is ~4 tekens/token, dus **97 tekens ≈ 24 tokens** per
skill plus je werkelijke veldlengtes.

## Levenscyclus van beheerde skills

OpenClaw levert een basisset skills als **gebundelde skills** mee met de
installatie (npm-pakket of OpenClaw.app). `~/.openclaw/skills` bestaat voor
lokale overschrijvingen — bijvoorbeeld om een skill vast te pinnen of te patchen zonder
de gebundelde kopie te wijzigen. Workspace-skills zijn eigendom van de gebruiker en overschrijven
beide bij naamconflicten.

## Op zoek naar meer skills?

Bekijk [https://clawhub.ai](https://clawhub.ai). Volledig configuratie-
schema: [Skills-configuratie](/nl/tools/skills-config).

## Gerelateerd

- [ClawHub](/nl/tools/clawhub) — openbaar skillsregister
- [Skills maken](/nl/tools/creating-skills) — aangepaste skills bouwen
- [Plugins](/nl/tools/plugin) — overzicht van het Plugin-systeem
- [Skill Workshop-plugin](/nl/plugins/skill-workshop) — skills genereren uit agentwerk
- [Skills-configuratie](/nl/tools/skills-config) — referentie voor skillconfiguratie
- [Slash-opdrachten](/nl/tools/slash-commands) — alle beschikbare slash-opdrachten
