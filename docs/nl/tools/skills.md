---
read_when:
    - Skills toevoegen of wijzigen
    - Skills-gating, allowlists of laadregels wijzigen
    - Skill-precedentie en snapshotgedrag begrijpen
sidebarTitle: Skills
summary: 'Skills: beheerd versus werkruimte, gating-regels, allowlists voor agents en configuratiebedrading'
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:40:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw gebruikt **[AgentSkills](https://agentskills.io)-compatibele** skillmappen om de agent te leren hoe tools te gebruiken. Elke skill is een directory met een `SKILL.md` met YAML-frontmatter en instructies. OpenClaw laadt gebundelde skills plus optionele lokale overschrijvingen, en filtert ze tijdens het laden op basis van omgeving, configuratie en aanwezigheid van binaries.

## Locaties en prioriteit

OpenClaw laadt skills uit deze bronnen, **hoogste prioriteit eerst**:

| #   | Bron                  | Pad                              |
| --- | --------------------- | -------------------------------- |
| 1   | Werkruimte-skills     | `<workspace>/skills`             |
| 2   | Project-agent-skills  | `<workspace>/.agents/skills`     |
| 3   | Persoonlijke agent-skills | `~/.agents/skills`           |
| 4   | Beheerde/lokale skills | `~/.openclaw/skills`            |
| 5   | Gebundelde skills     | meegeleverd met de installatie   |
| 6   | Extra skillmappen     | `skills.load.extraDirs` (config) |

Als een skillnaam conflicteert, wint de bron met de hoogste prioriteit.

## Per-agent versus gedeelde skills

In **multi-agent**-opstellingen heeft elke agent zijn eigen werkruimte:

| Bereik               | Pad                                         | Zichtbaar voor              |
| -------------------- | ------------------------------------------- | --------------------------- |
| Per-agent            | `<workspace>/skills`                        | Alleen die agent            |
| Project-agent        | `<workspace>/.agents/skills`                | Alleen de agent van die werkruimte |
| Persoonlijke agent   | `~/.agents/skills`                          | Alle agents op die machine  |
| Gedeeld beheerd/lokaal | `~/.openclaw/skills`                      | Alle agents op die machine  |
| Gedeelde extra dirs  | `skills.load.extraDirs` (laagste prioriteit) | Alle agents op die machine  |

Dezelfde naam op meerdere plaatsen → hoogste bron wint. Werkruimte wint van
project-agent, wint van persoonlijke agent, wint van beheerd/lokaal, wint
van gebundeld, wint van extra dirs.

## Agent-allowlists voor skills

Skill**locatie** en skill**zichtbaarheid** zijn afzonderlijke controles.
Locatie/prioriteit bepaalt welke kopie van een skill met dezelfde naam wint;
agent-allowlists bepalen welke skills een agent daadwerkelijk kan gebruiken.

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
    - Een niet-lege lijst `agents.list[].skills` is de **definitieve** set voor die
      agent — deze wordt niet samengevoegd met defaults.
    - De effectieve allowlist geldt voor promptopbouw, ontdekking van skill
      slash-commands, sandbox-synchronisatie en skill-snapshots.
  </Accordion>
</AccordionGroup>

## Plugins en skills

Plugins kunnen hun eigen skills meeleveren door `skills`-directories te vermelden in
`openclaw.plugin.json` (paden relatief aan de pluginroot). Plugin-skills
laden wanneer de Plugin is ingeschakeld. Dit is de juiste plek voor toolspecifieke
bedieningsgidsen die te lang zijn voor de toolbeschrijving maar beschikbaar
moeten zijn wanneer de Plugin is geïnstalleerd — de browserplugin levert bijvoorbeeld
een `browser-automation`-skill voor meerstaps browserbesturing.

Plugin-skilldirectories worden samengevoegd in hetzelfde pad met lage prioriteit als
`skills.load.extraDirs`, dus een gelijknamige gebundelde, beheerde, agent- of
werkruimte-skill overschrijft ze. Je kunt ze afschermen via
`metadata.openclaw.requires.config` op de configuratie-entry van de Plugin.

Zie [Plugins](/nl/tools/plugin) voor ontdekking/configuratie en [Tools](/nl/tools) voor
het tooloppervlak dat deze skills aanleren.

## Skill Workshop

De optionele, experimentele **Skill Workshop**-Plugin kan werkruimte-skills maken of bijwerken
op basis van herbruikbare procedures die tijdens agentwerk zijn waargenomen. Deze
is standaard uitgeschakeld en moet expliciet worden ingeschakeld via
`plugins.entries.skill-workshop`.

Skill Workshop schrijft alleen naar `<workspace>/skills`, scant gegenereerde
inhoud, ondersteunt goedkeuring in afwachting of automatische veilige schrijfacties, plaatst
onveilige voorstellen in quarantaine en ververst de skill-snapshot na succesvolle
schrijfacties zodat nieuwe skills beschikbaar worden zonder een Gateway-herstart.

Gebruik het voor correcties zoals _"controleer de volgende keer GIF-attributie"_ of
zwaarbevochten workflows zoals media-QA-checklists. Begin met goedkeuring in
afwachting; gebruik automatische schrijfacties alleen in vertrouwde werkruimtes na beoordeling
van de voorstellen. Volledige gids: [Skill Workshop-Plugin](/nl/plugins/skill-workshop).

## ClawHub (installeren en synchroniseren)

[ClawHub](https://clawhub.ai) is het openbare skillsregister voor OpenClaw.
Gebruik native `openclaw skills`-commando's voor ontdekken/installeren/bijwerken, of de
afzonderlijke `clawhub` CLI voor publicatie-/synchronisatieworkflows. Volledige gids:
[ClawHub](/nl/tools/clawhub).

| Actie                              | Commando                               |
| ---------------------------------- | -------------------------------------- |
| Een skill in de werkruimte installeren | `openclaw skills install <skill-slug>` |
| Alle geïnstalleerde skills bijwerken | `openclaw skills update --all`        |
| Synchroniseren (scannen + updates publiceren) | `clawhub sync --all`          |

Native `openclaw skills install` installeert in de actieve werkruimte-
`skills/`-directory. De afzonderlijke `clawhub` CLI installeert ook in
`./skills` onder je huidige werkdirectory (of valt terug op de
geconfigureerde OpenClaw-werkruimte). OpenClaw pikt dat op als
`<workspace>/skills` in de volgende sessie.
Geconfigureerde skillroots ondersteunen ook één groeperingsniveau, zoals
`skills/<group>/<skill>/SKILL.md`, zodat gerelateerde skills van derden onder
een gedeelde map kunnen worden bewaard zonder brede recursieve scanning.

ClawHub-skillpagina's tonen de nieuwste status van de beveiligingsscan vóór installatie,
met scanner-detailpagina's voor VirusTotal, ClawScan en statische analyse.
`openclaw skills install <slug>` blijft alleen het installatiepad; uitgevers
herstellen fout-positieven via het ClawHub-dashboard of
`clawhub skill rescan <slug>`.

## Beveiliging

<Warning>
Behandel skills van derden als **niet-vertrouwde code**. Lees ze voordat je ze inschakelt.
Geef de voorkeur aan sandbox-runs voor niet-vertrouwde invoer en risicovolle tools. Zie
[Sandboxing](/nl/gateway/sandboxing) voor de agent-side controles.
</Warning>

- Ontdekking van werkruimte- en extra-dir-skills accepteert alleen skillroots en `SKILL.md`-bestanden waarvan de opgeloste realpath binnen de geconfigureerde root blijft.
- Door Gateway ondersteunde installatie van skillafhankelijkheden (`skills.install`, onboarding en de Skills-instellingen-UI) voert de ingebouwde scanner voor gevaarlijke code uit voordat installermetadata wordt uitgevoerd. `critical`-bevindingen blokkeren standaard, tenzij de aanroeper expliciet de gevaarlijke override instelt; verdachte bevindingen waarschuwen nog steeds alleen.
- `openclaw skills install <slug>` is anders — het downloadt een ClawHub-skillmap naar de werkruimte en gebruikt het installermetadata-pad hierboven niet.
- `skills.entries.*.env` en `skills.entries.*.apiKey` injecteren geheimen in het **host**proces voor die agentbeurt (niet de sandbox). Houd geheimen uit prompts en logs.

Voor een breder dreigingsmodel en checklists, zie [Beveiliging](/nl/gateway/security).

## SKILL.md-indeling

`SKILL.md` moet ten minste bevatten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw volgt de AgentSkills-specificatie voor layout/intentie. De parser die
door de ingebedde agent wordt gebruikt, ondersteunt alleen **single-line** frontmatter-sleutels;
`metadata` moet een **single-line JSON object** zijn. Gebruik `{baseDir}` in
instructies om naar het pad van de skillmap te verwijzen.

### Optionele frontmatter-sleutels

<ParamField path="homepage" type="string">
  URL die als "Website" wordt getoond in de macOS Skills-UI. Ook ondersteund via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Wanneer `true`, wordt de skill als gebruikers-slash-command beschikbaar gemaakt.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wanneer `true`, wordt de skill uitgesloten van de modelprompt (nog steeds beschikbaar via gebruikersaanroep).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Wanneer ingesteld op `tool`, omzeilt het slash-command het model en dispatcht het direct naar een tool.
</ParamField>
<ParamField path="command-tool" type="string">
  Toolnaam om aan te roepen wanneer `command-dispatch: tool` is ingesteld.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Voor tool-dispatch stuurt dit de raw args-string door naar de tool (geen core parsing). De tool wordt aangeroepen met `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filters tijdens laden)

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
  Optionele emoji die door de macOS Skills-UI wordt gebruikt.
</ParamField>
<ParamField path="homepage" type="string">
  Optionele URL die als "Website" wordt getoond in de macOS Skills-UI.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Optionele lijst met platforms. Indien ingesteld, komt de skill alleen in aanmerking op die OS'en.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Elk moet bestaan op `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Ten minste één moet bestaan op `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env-var moet bestaan of in config worden opgegeven.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lijst met `openclaw.json`-paden die truthy moeten zijn.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Env-varnaam die is gekoppeld aan `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Optionele installatiespecificaties die door de macOS Skills-UI worden gebruikt (brew/node/go/uv/download).
</ParamField>

Als er geen `metadata.openclaw` aanwezig is, komt de skill altijd in aanmerking (tenzij
uitgeschakeld in config of geblokkeerd door `skills.allowBundled` voor gebundelde skills).

<Note>
Legacy `metadata.clawdbot`-blokken worden nog steeds geaccepteerd wanneer
`metadata.openclaw` ontbreekt, zodat oudere geïnstalleerde skills hun
afhankelijkheidsgates en installertips behouden. Nieuwe en bijgewerkte skills moeten
`metadata.openclaw` gebruiken.
</Note>

### Sandbox-notities

- `requires.bins` wordt op de **host** gecontroleerd tijdens het laden van de skill.
- Als een agent in een sandbox draait, moet de binary ook **binnen de container** bestaan. Installeer deze via `agents.defaults.sandbox.docker.setupCommand` (of een aangepaste image). `setupCommand` wordt eenmaal uitgevoerd nadat de container is gemaakt. Package-installaties vereisen ook netwerk-egress, een schrijfbaar rootbestandssysteem en een rootgebruiker in de sandbox.
- Voorbeeld: de `summarize`-skill (`skills/summarize/SKILL.md`) heeft de `summarize` CLI nodig in de sandboxcontainer om daar te draaien.

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
    - Als er meerdere installatieprogramma's worden vermeld, kiest de Gateway één voorkeursoptie (brew indien beschikbaar, anders node).
    - Als alle installatieprogramma's `download` zijn, vermeldt OpenClaw elke vermelding zodat je de beschikbare artefacten kunt zien.
    - Installatiespecificaties kunnen `os: ["darwin"|"linux"|"win32"]` bevatten om opties per platform te filteren.
    - Node-installaties respecteren `skills.install.nodeManager` in `openclaw.json` (standaard: npm; opties: npm/pnpm/yarn/bun). Dit beïnvloedt alleen skill-installaties; de Gateway-runtime moet nog steeds Node zijn — Bun wordt niet aanbevolen voor WhatsApp/Telegram.
    - Door de Gateway ondersteunde selectie van installatieprogramma's is voorkeursgestuurd: wanneer installatiespecificaties verschillende soorten combineren, geeft OpenClaw de voorkeur aan Homebrew wanneer `skills.install.preferBrew` is ingeschakeld en `brew` bestaat, daarna `uv`, daarna de geconfigureerde node-manager, daarna andere fallbacks zoals `go` of `download`.
    - Als elke installatiespecificatie `download` is, toont OpenClaw alle downloadopties in plaats van ze samen te vouwen tot één voorkeursinstallatieprogramma.

  </Accordion>
  <Accordion title="Details per installatieprogramma">
    - **Go-installaties:** als `go` ontbreekt en `brew` beschikbaar is, installeert de gateway eerst Go via Homebrew en stelt waar mogelijk `GOBIN` in op de `bin` van Homebrew.
    - **Downloadinstallaties:** `url` (vereist), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (standaard: automatisch wanneer een archief wordt gedetecteerd), `stripComponents`, `targetDir` (standaard: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Configuratie-overschrijvingen

Gebundelde en beheerde Skills kunnen worden in- of uitgeschakeld en van env-waarden worden voorzien
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
  `skills.entries.coding-agent.enabled: true` in voordat je deze aan agents blootstelt,
  en zorg er vervolgens voor dat een van `claude`, `codex`, `opencode` of `pi` is geïnstalleerd en
  geauthenticeerd voor zijn eigen CLI.
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
  Optionele allowlist alleen voor **gebundelde** Skills. Indien ingesteld, komen alleen gebundelde Skills in de lijst in aanmerking (beheerde/workspace-Skills worden niet beïnvloed).
</ParamField>

Als de skillnaam koppeltekens bevat, zet de sleutel dan tussen aanhalingstekens (JSON5 staat aangehaalde
sleutels toe). Configuratiesleutels komen standaard overeen met de **skillnaam** — als een skill
`metadata.openclaw.skillKey` definieert, gebruik dan die sleutel onder `skills.entries`.

<Note>
Voor standaard afbeeldingsgeneratie/-bewerking binnen OpenClaw gebruik je de kern-tool
`image_generate` met `agents.defaults.imageGenerationModel` in plaats
van een gebundelde skill. Skill-voorbeelden hier zijn voor aangepaste workflows of workflows van derden.
Voor native afbeeldingsanalyse gebruik je de `image`-tool met
`agents.defaults.imageModel`. Als je `openai/*`, `google/*`,
`fal/*` of een ander providerspecifiek afbeeldingsmodel kiest, voeg dan ook de
auth/API-sleutel van die provider toe.
</Note>

## Omgevingsinjectie

Wanneer een agent-run start, doet OpenClaw het volgende:

1. Leest skillmetadata.
2. Past `skills.entries.<key>.env` en `skills.entries.<key>.apiKey` toe op `process.env`.
3. Bouwt de systeemprompt met **in aanmerking komende** Skills.
4. Herstelt de oorspronkelijke omgeving nadat de run is beëindigd.

Omgevingsinjectie is **beperkt tot de agent-run**, niet tot een globale shellomgeving.

Voor de gebundelde `claude-cli`-backend materialiseert OpenClaw ook dezelfde
in aanmerking komende snapshot als een tijdelijke Claude Code-Plugin en geeft deze door met
`--plugin-dir`. Claude Code kan dan zijn native skill-resolver gebruiken terwijl
OpenClaw nog steeds eigenaar blijft van voorrang, allowlists per agent, gating en
`skills.entries.*` env/API-sleutelinjectie. Andere CLI-backends gebruiken alleen de
promptcatalogus.

## Snapshots en verversen

OpenClaw maakt een snapshot van de in aanmerking komende Skills **wanneer een sessie start** en
hergebruikt die lijst voor volgende beurten in dezelfde sessie. Wijzigingen aan
Skills of configuratie worden van kracht bij de volgende nieuwe sessie.

Skills kunnen midden in een sessie in twee gevallen worden ververst:

- De Skills-watcher is ingeschakeld.
- Er verschijnt een nieuwe in aanmerking komende externe node.

Zie dit als een **hot reload**: de ververste lijst wordt opgepikt bij de
volgende agentbeurt. Als de effectieve allowlist voor agentskills voor die
sessie verandert, ververst OpenClaw de snapshot zodat zichtbare Skills afgestemd blijven
op de huidige agent.

### Skills-watcher

Standaard bewaakt OpenClaw skillmappen en verhoogt het de skill-snapshot
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

Als de Gateway op Linux draait maar een **macOS-node** is verbonden met
`system.run` toegestaan (beveiliging voor Exec-goedkeuringen niet ingesteld op `deny`),
kan OpenClaw macOS-only Skills als in aanmerking komend behandelen wanneer de vereiste
binaries op die node aanwezig zijn. De agent moet die Skills uitvoeren
via de `exec`-tool met `host=node`.

Dit is afhankelijk van de node die zijn opdracht­ondersteuning rapporteert en van een bin-probe
via `system.which` of `system.run`. Offline nodes maken
remote-only Skills **niet** zichtbaar. Als een verbonden node niet meer reageert op bin-probes,
wist OpenClaw zijn gecachte bin-matches zodat agents geen
Skills meer zien die daar momenteel niet kunnen draaien.

## Tokenimpact

Wanneer Skills in aanmerking komen, injecteert OpenClaw een compacte XML-lijst met beschikbare
Skills in de systeemprompt (via `formatSkillsForPrompt` in
`pi-coding-agent`). De kosten zijn deterministisch:

- **Basisoverhead** (alleen wanneer ≥1 skill): 195 tekens.
- **Per skill:** 97 tekens + de lengte van de XML-geëscapete `<name>`-, `<description>`- en `<location>`-waarden.

Formule (tekens):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-escaping breidt `& < > " '` uit naar entiteiten (`&amp;`, `&lt;`, enz.),
waardoor de lengte toeneemt. Tokenaantallen verschillen per modeltokenizer. Een ruwe
OpenAI-achtige schatting is ~4 tekens/token, dus **97 tekens ≈ 24 tokens** per
skill plus je daadwerkelijke veldlengtes.

## Levenscyclus van beheerde Skills

OpenClaw levert een basisset Skills als **gebundelde Skills** met de
installatie (npm-pakket of OpenClaw.app). `~/.openclaw/skills` bestaat voor
lokale overschrijvingen — bijvoorbeeld het vastzetten of patchen van een skill zonder
de gebundelde kopie te wijzigen. Workspace-Skills zijn eigendom van de gebruiker en overschrijven
beide bij naamconflicten.

## Op zoek naar meer Skills?

Blader door [https://clawhub.ai](https://clawhub.ai). Volledig configuratie-
schema: [Skills-configuratie](/nl/tools/skills-config).

## Gerelateerd

- [ClawHub](/nl/tools/clawhub) — openbaar Skills-register
- [Skills maken](/nl/tools/creating-skills) — aangepaste Skills bouwen
- [Plugins](/nl/tools/plugin) — overzicht van het Plugin-systeem
- [Skill Workshop-Plugin](/nl/plugins/skill-workshop) — Skills genereren uit agentwerk
- [Skills-configuratie](/nl/tools/skills-config) — referentie voor skillconfiguratie
- [Slash-opdrachten](/nl/tools/slash-commands) — alle beschikbare slash-opdrachten
