---
read_when:
    - Skills toevoegen of wijzigen
    - Skill-toegangscontrole, toelatingslijsten of laadregels wijzigen
    - Inzicht in de voorrang van Skills en snapshotgedrag
sidebarTitle: Skills
summary: 'Skills: beheerd versus werkruimte, gate-regels, agent-allowlists en configuratiekoppeling'
title: Skills
x-i18n:
    generated_at: "2026-04-29T23:26:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f744f5e961f872cae02aa0ed77e0bbba35e4715f5762ac45ce190b74b2fd8c5e
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw gebruikt **[AgentSkills](https://agentskills.io)-compatibele** Skill-mappen om de agent te leren hoe tools te gebruiken. Elke Skill is een map die een `SKILL.md` bevat met YAML-frontmatter en instructies. OpenClaw laadt gebundelde Skills plus optionele lokale overschrijvingen, en filtert ze tijdens het laden op basis van omgeving, configuratie en aanwezigheid van binaries.

## Locaties en voorrang

OpenClaw laadt Skills uit deze bronnen, **hoogste voorrang eerst**:

| #   | Bron                  | Pad                              |
| --- | --------------------- | -------------------------------- |
| 1   | Workspace-Skills      | `<workspace>/skills`             |
| 2   | Project-agent-Skills  | `<workspace>/.agents/skills`     |
| 3   | Persoonlijke agent-Skills | `~/.agents/skills`           |
| 4   | Beheerde/lokale Skills | `~/.openclaw/skills`            |
| 5   | Gebundelde Skills     | meegeleverd met de installatie   |
| 6   | Extra Skill-mappen    | `skills.load.extraDirs` (config) |

Als een Skill-naam conflicteert, wint de hoogste bron.

## Per-agent versus gedeelde Skills

In **multi-agent**-opstellingen heeft elke agent een eigen workspace:

| Bereik               | Pad                                         | Zichtbaar voor              |
| -------------------- | ------------------------------------------- | --------------------------- |
| Per-agent            | `<workspace>/skills`                        | Alleen die agent            |
| Project-agent        | `<workspace>/.agents/skills`                | Alleen de agent van die workspace |
| Persoonlijke agent   | `~/.agents/skills`                          | Alle agents op die machine  |
| Gedeeld beheerd/lokaal | `~/.openclaw/skills`                      | Alle agents op die machine  |
| Gedeelde extra mappen | `skills.load.extraDirs` (laagste voorrang) | Alle agents op die machine  |

Dezelfde naam op meerdere plaatsen → hoogste bron wint. Workspace wint van
project-agent, wint van persoonlijke agent, wint van beheerd/lokaal, wint van gebundeld,
wint van extra mappen.

## Skill-allowlists voor agents

Skill-**locatie** en Skill-**zichtbaarheid** zijn afzonderlijke controles.
Locatie/voorrang bepaalt welke kopie van een gelijknamige Skill wint; agent-allowlists
bepalen welke Skills een agent daadwerkelijk kan gebruiken.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // erft github, weather
      { id: "docs", skills: ["docs-search"] }, // vervangt standaardwaarden
      { id: "locked-down", skills: [] }, // geen Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist-regels">
    - Laat `agents.defaults.skills` weg voor standaard onbeperkte Skills.
    - Laat `agents.list[].skills` weg om `agents.defaults.skills` te erven.
    - Stel `agents.list[].skills: []` in voor geen Skills.
    - Een niet-lege `agents.list[].skills`-lijst is de **definitieve** set voor die
      agent — deze wordt niet samengevoegd met standaardwaarden.
    - De effectieve allowlist wordt toegepast op promptopbouw, ontdekking van Skill-slashcommando's, sandbox-synchronisatie en Skill-snapshots.

  </Accordion>
</AccordionGroup>

## Plugins en Skills

Plugins kunnen hun eigen Skills meeleveren door `skills`-mappen te vermelden in
`openclaw.plugin.json` (paden relatief aan de Plugin-root). Plugin-Skills
worden geladen wanneer de Plugin is ingeschakeld. Dit is de juiste plaats voor toolspecifieke
bedieningsgidsen die te lang zijn voor de toolbeschrijving maar beschikbaar moeten zijn
wanneer de Plugin is geïnstalleerd — de browser-Plugin levert bijvoorbeeld een
`browser-automation`-Skill voor browserbesturing in meerdere stappen.

Plugin-Skill-mappen worden samengevoegd in hetzelfde pad met lage voorrang als
`skills.load.extraDirs`, dus een gelijknamige gebundelde, beheerde, agent- of
workspace-Skill overschrijft ze. U kunt ze afschermen via
`metadata.openclaw.requires.config` op de configuratie-entry van de Plugin.

Zie [Plugins](/nl/tools/plugin) voor ontdekking/configuratie en [Tools](/nl/tools) voor
het tooloppervlak dat deze Skills aanleren.

## Skill Workshop

De optionele, experimentele **Skill Workshop**-Plugin kan
workspace-Skills maken of bijwerken op basis van herbruikbare procedures die tijdens agentwerk worden waargenomen. Deze
is standaard uitgeschakeld en moet expliciet worden ingeschakeld via
`plugins.entries.skill-workshop`.

Skill Workshop schrijft alleen naar `<workspace>/skills`, scant gegenereerde
inhoud, ondersteunt wachtende goedkeuring of automatische veilige schrijfacties, plaatst
onveilige voorstellen in quarantaine en ververst de Skill-snapshot na succesvolle
schrijfacties, zodat nieuwe Skills beschikbaar worden zonder een Gateway-herstart.

Gebruik dit voor correcties zoals _"controleer de volgende keer GIF-attributie"_ of
moeizaam verworven workflows zoals checklists voor media-QA. Begin met wachtende
goedkeuring; gebruik automatische schrijfacties alleen in vertrouwde workspaces nadat u
de voorstellen hebt beoordeeld. Volledige gids: [Skill Workshop-Plugin](/nl/plugins/skill-workshop).

## ClawHub (installeren en synchroniseren)

[ClawHub](https://clawhub.ai) is het openbare Skills-register voor OpenClaw.
Gebruik native `openclaw skills`-commando's voor ontdekken/installeren/bijwerken, of de
afzonderlijke `clawhub` CLI voor publicatie-/synchronisatieworkflows. Volledige gids:
[ClawHub](/nl/tools/clawhub).

| Actie                              | Commando                               |
| ---------------------------------- | -------------------------------------- |
| Een Skill in de workspace installeren | `openclaw skills install <skill-slug>` |
| Alle geïnstalleerde Skills bijwerken | `openclaw skills update --all`         |
| Synchroniseren (scannen + updates publiceren) | `clawhub sync --all`             |

Native `openclaw skills install` installeert in de actieve workspace-
`skills/`-map. De afzonderlijke `clawhub` CLI installeert ook in
`./skills` onder uw huidige werkmap (of valt terug op de
geconfigureerde OpenClaw-workspace). OpenClaw pikt dat op als
`<workspace>/skills` in de volgende sessie.

ClawHub-Skill-pagina's tonen vóór installatie de nieuwste status van de beveiligingsscan,
met scandetailpagina's voor VirusTotal, ClawScan en statische analyse.
`openclaw skills install <slug>` blijft alleen het installatiepad; uitgevers
herstellen fout-positieven via het ClawHub-dashboard of
`clawhub skill rescan <slug>`.

## Beveiliging

<Warning>
Behandel Skills van derden als **niet-vertrouwde code**. Lees ze voordat u ze inschakelt.
Gebruik bij voorkeur sandbox-runs voor niet-vertrouwde invoer en risicovolle tools. Zie
[Sandboxing](/nl/gateway/sandboxing) voor de agent-side controles.
</Warning>

- Workspace- en extra-map-Skill-ontdekking accepteert alleen Skill-roots en `SKILL.md`-bestanden waarvan het opgeloste realpath binnen de geconfigureerde root blijft.
- Door Gateway ondersteunde installaties van Skill-afhankelijkheden (`skills.install`, onboarding en de Skills-instellingen-UI) voeren de ingebouwde gevaarlijke-code-scanner uit voordat installatiemetadata worden uitgevoerd. `critical`-bevindingen blokkeren standaard, tenzij de aanroeper expliciet de gevaarlijke overschrijving instelt; verdachte bevindingen blijven alleen waarschuwen.
- `openclaw skills install <slug>` is anders — het downloadt een ClawHub-Skill-map naar de workspace en gebruikt niet het installatiemetadata-pad hierboven.
- `skills.entries.*.env` en `skills.entries.*.apiKey` injecteren geheimen in het **host**-proces voor die agentbeurt (niet de sandbox). Houd geheimen uit prompts en logs.

Voor een breder dreigingsmodel en checklists, zie [Security](/nl/gateway/security).

## SKILL.md-indeling

`SKILL.md` moet ten minste bevatten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw volgt de AgentSkills-specificatie voor lay-out/intentie. De parser die
door de ingebedde agent wordt gebruikt, ondersteunt alleen **enkelregelige** frontmatter-sleutels;
`metadata` moet een **enkelregelig JSON-object** zijn. Gebruik `{baseDir}` in
instructies om naar het pad van de Skill-map te verwijzen.

### Optionele frontmatter-sleutels

<ParamField path="homepage" type="string">
  URL die als "Website" wordt getoond in de macOS Skills-UI. Ook ondersteund via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Wanneer `true`, wordt de Skill als gebruikers-slashcommando beschikbaar gemaakt.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wanneer `true`, wordt de Skill uitgesloten van de modelprompt (nog steeds beschikbaar via gebruikersaanroep).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Wanneer ingesteld op `tool`, omzeilt het slashcommando het model en wordt het rechtstreeks naar een tool verstuurd.
</ParamField>
<ParamField path="command-tool" type="string">
  Toolnaam om aan te roepen wanneer `command-dispatch: tool` is ingesteld.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Voor tool-dispatch stuurt dit de ruwe argumentstring door naar de tool (geen core-parsing). De tool wordt aangeroepen met `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Afscherming (filters tijdens laden)

OpenClaw filtert Skills tijdens het laden met `metadata` (enkelregelige JSON):

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
  Wanneer `true`, neem de Skill altijd op (sla andere gates over).
</ParamField>
<ParamField path="emoji" type="string">
  Optionele emoji die door de macOS Skills-UI wordt gebruikt.
</ParamField>
<ParamField path="homepage" type="string">
  Optionele URL die als "Website" wordt getoond in de macOS Skills-UI.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Optionele lijst met platforms. Als deze is ingesteld, komt de Skill alleen in aanmerking op die OS'en.
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
  Optionele installatiespecificaties die door de macOS Skills-UI worden gebruikt (brew/node/go/uv/download).
</ParamField>

Als er geen `metadata.openclaw` aanwezig is, komt de Skill altijd in aanmerking (tenzij
uitgeschakeld in configuratie of geblokkeerd door `skills.allowBundled` voor gebundelde Skills).

<Note>
Legacy `metadata.clawdbot`-blokken worden nog steeds geaccepteerd wanneer
`metadata.openclaw` afwezig is, zodat oudere geïnstalleerde Skills hun
afhankelijkheidsgates en installatiehints behouden. Nieuwe en bijgewerkte Skills moeten
`metadata.openclaw` gebruiken.
</Note>

### Sandbox-opmerkingen

- `requires.bins` wordt op de **host** gecontroleerd tijdens het laden van de Skill.
- Als een agent in een sandbox draait, moet de binary ook **in de container** bestaan. Installeer deze via `agents.defaults.sandbox.docker.setupCommand` (of een aangepaste image). `setupCommand` wordt eenmaal uitgevoerd nadat de container is gemaakt. Pakketinstallaties vereisen ook netwerk-egress, een beschrijfbaar root-FS en een rootgebruiker in de sandbox.
- Voorbeeld: de `summarize`-Skill (`skills/summarize/SKILL.md`) heeft de `summarize` CLI in de sandboxcontainer nodig om daar te kunnen draaien.

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
  <Accordion title="Selectieregels voor installers">
    - Als meerdere installers worden vermeld, kiest de gateway één voorkeursoptie (brew indien beschikbaar, anders node).
    - Als alle installers `download` zijn, vermeldt OpenClaw elke vermelding zodat je de beschikbare artefacten kunt zien.
    - Installerspecificaties kunnen `os: ["darwin"|"linux"|"win32"]` bevatten om opties op platform te filteren.
    - Node-installaties respecteren `skills.install.nodeManager` in `openclaw.json` (standaard: npm; opties: npm/pnpm/yarn/bun). Dit heeft alleen invloed op skill-installaties; de Gateway-runtime moet nog steeds Node zijn — Bun wordt niet aanbevolen voor WhatsApp/Telegram.
    - Door Gateway ondersteunde installerselectie is voorkeursgestuurd: wanneer installatiespecificaties types mengen, geeft OpenClaw de voorkeur aan Homebrew wanneer `skills.install.preferBrew` is ingeschakeld en `brew` bestaat, daarna `uv`, daarna de geconfigureerde node-manager, daarna andere fallbacks zoals `go` of `download`.
    - Als elke installatiespecificatie `download` is, toont OpenClaw alle downloadopties in plaats van ze samen te voegen tot één voorkeursinstaller.

  </Accordion>
  <Accordion title="Details per installer">
    - **Go-installaties:** als `go` ontbreekt en `brew` beschikbaar is, installeert de gateway eerst Go via Homebrew en stelt waar mogelijk `GOBIN` in op de `bin` van Homebrew.
    - **Downloadinstallaties:** `url` (vereist), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (standaard: automatisch wanneer archief wordt gedetecteerd), `stripComponents`, `targetDir` (standaard: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Configuratie-overschrijvingen

Gebundelde en beheerde skills kunnen worden in- of uitgeschakeld en van env-waarden worden voorzien
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
  en zorg er daarna voor dat een van `claude`, `codex`, `opencode` of `pi` is geïnstalleerd en
  geauthenticeerd voor zijn eigen CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Gemak voor skills die `metadata.openclaw.primaryEnv` declareren. Ondersteunt platte tekst of SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Alleen geïnjecteerd als de variabele nog niet in het proces is ingesteld.
</ParamField>
<ParamField path="config" type="object">
  Optionele container voor aangepaste velden per skill. Aangepaste sleutels moeten hier staan.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Optionele allowlist alleen voor **gebundelde** skills. Indien ingesteld, komen alleen gebundelde skills in de lijst in aanmerking (beheerde/workspace-skills blijven onaangetast).
</ParamField>

Als de skillnaam koppeltekens bevat, zet de sleutel dan tussen aanhalingstekens (JSON5 staat aangehaalde
sleutels toe). Configuratiesleutels komen standaard overeen met de **skillnaam** — als een skill
`metadata.openclaw.skillKey` definieert, gebruik dan die sleutel onder `skills.entries`.

<Note>
Gebruik voor standaard afbeeldingsgeneratie/-bewerking binnen OpenClaw de core
`image_generate`-tool met `agents.defaults.imageGenerationModel` in plaats
van een gebundelde skill. De skillvoorbeelden hier zijn voor aangepaste of externe
workflows. Gebruik voor native afbeeldingsanalyse de `image`-tool met
`agents.defaults.imageModel`. Als je `openai/*`, `google/*`,
`fal/*` of een ander provider-specifiek afbeeldingsmodel kiest, voeg dan ook de
auth/API-sleutel van die provider toe.
</Note>

## Omgevingsinjectie

Wanneer een agent-run start, doet OpenClaw het volgende:

1. Leest skillmetadata.
2. Past `skills.entries.<key>.env` en `skills.entries.<key>.apiKey` toe op `process.env`.
3. Bouwt de systeemprompt met **in aanmerking komende** skills.
4. Herstelt de oorspronkelijke omgeving nadat de run eindigt.

Omgevingsinjectie is **beperkt tot de agent-run**, niet tot een globale shellomgeving.

Voor de gebundelde `claude-cli`-backend materialiseert OpenClaw dezelfde
in aanmerking komende snapshot ook als tijdelijke Claude Code-plugin en geeft die door met
`--plugin-dir`. Claude Code kan daarna zijn native skillresolver gebruiken terwijl
OpenClaw nog steeds eigenaar blijft van prioriteit, allowlists per agent, gating en
env/API-sleutelinjectie via `skills.entries.*`. Andere CLI-backends gebruiken alleen de
promptcatalogus.

## Snapshots en vernieuwen

OpenClaw maakt een snapshot van de in aanmerking komende skills **wanneer een sessie start** en
hergebruikt die lijst voor volgende beurten in dezelfde sessie. Wijzigingen aan
skills of configuratie worden van kracht bij de volgende nieuwe sessie.

Skills kunnen midden in een sessie in twee gevallen worden vernieuwd:

- De skills-watcher is ingeschakeld.
- Er verschijnt een nieuw in aanmerking komend extern knooppunt.

Zie dit als een **hot reload**: de vernieuwde lijst wordt opgepakt bij de
volgende agentbeurt. Als de effectieve agent-skill-allowlist voor die
sessie verandert, vernieuwt OpenClaw de snapshot zodat zichtbare skills afgestemd blijven
op de huidige agent.

### Skills-watcher

Standaard bewaakt OpenClaw skillmappen en verhoogt de skills-snapshot
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

### Externe macOS-knooppunten (Linux-gateway)

Als de Gateway op Linux draait maar een **macOS-knooppunt** is verbonden met
`system.run` toegestaan (Exec-goedkeuringsbeveiliging niet ingesteld op `deny`),
kan OpenClaw macOS-only skills als in aanmerking komend behandelen wanneer de vereiste
binaries op dat knooppunt aanwezig zijn. De agent moet die skills uitvoeren
via de `exec`-tool met `host=node`.

Dit is afhankelijk van het knooppunt dat zijn commandondersteuning rapporteert en van een bin-probe
via `system.which` of `system.run`. Offline knooppunten maken
remote-only skills **niet** zichtbaar. Als een verbonden knooppunt stopt met reageren op bin-
probes, wist OpenClaw zijn gecachte bin-matches zodat agents geen
skills meer zien die daar momenteel niet kunnen draaien.

## Tokenimpact

Wanneer skills in aanmerking komen, injecteert OpenClaw een compacte XML-lijst met beschikbare
skills in de systeemprompt (via `formatSkillsForPrompt` in
`pi-coding-agent`). De kosten zijn deterministisch:

- **Basisoverhead** (alleen wanneer ≥1 skill): 195 tekens.
- **Per skill:** 97 tekens + de lengte van de XML-escaped `<name>`-, `<description>`- en `<location>`-waarden.

Formule (tekens):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-escaping breidt `& < > " '` uit naar entities (`&amp;`, `&lt;`, enz.),
waardoor de lengte toeneemt. Tokenaantallen verschillen per modeltokenizer. Een grove
OpenAI-achtige schatting is ~4 tekens/token, dus **97 tekens ≈ 24 tokens** per
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
- [Plugins](/nl/tools/plugin) — overzicht van het pluginsysteem
- [Skill Workshop-plugin](/nl/plugins/skill-workshop) — skills genereren uit agentwerk
- [Skills-configuratie](/nl/tools/skills-config) — referentie voor skillconfiguratie
- [Slash-commando's](/nl/tools/slash-commands) — alle beschikbare slash-commando's
