---
read_when:
    - Skills toevoegen of wijzigen
    - Wijzigingen in de gating, toelatingslijsten of laadregels voor Skills
    - Inzicht in de prioriteit van Skills en het gedrag van momentopnamen
sidebarTitle: Skills
summary: Skills leren je agent hoe deze tools gebruikt. Ontdek hoe ze worden geladen, hoe prioriteit werkt en hoe je gating, toelatingslijsten en omgevingsinjectie configureert.
title: Skills
x-i18n:
    generated_at: "2026-07-12T09:24:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills zijn Markdown-instructiebestanden die de agent leren hoe en wanneer deze
tools moet gebruiken. Elke Skill bevindt zich in een map met een `SKILL.md`-bestand met YAML-
frontmatter en een Markdown-hoofdtekst. OpenClaw laadt gebundelde Skills plus eventuele lokale
overschrijvingen en filtert ze tijdens het laden op basis van de omgeving, configuratie en
aanwezige binaire bestanden.

<CardGroup cols={2}>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Bouw en test een aangepaste Skill vanaf nul.
  </Card>
  <Card title="Skill Workshop" href="/nl/tools/skill-workshop" icon="flask">
    Beoordeel en keur door de agent opgestelde Skill-voorstellen goed.
  </Card>
  <Card title="Skills-configuratie" href="/nl/tools/skills-config" icon="gear">
    Volledig configuratieschema voor `skills.*` en toelatingslijsten voor agents.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Bekijk en installeer Skills uit de community.
  </Card>
</CardGroup>

## Laadvolgorde

OpenClaw laadt uit deze bronnen, **met de hoogste prioriteit eerst**. Wanneer dezelfde
Skill-naam op meerdere plaatsen voorkomt, heeft de bron met de hoogste prioriteit voorrang.

| Prioriteit    | Bron                           | Pad                                     |
| ------------- | ------------------------------ | --------------------------------------- |
| 1 — hoogste   | Skills in de werkruimte        | `<workspace>/skills`                    |
| 2             | Projectagentskills             | `<workspace>/.agents/skills`            |
| 3             | Persoonlijke agentskills       | `~/.agents/skills`                      |
| 4             | Beheerde / lokale Skills       | `~/.openclaw/skills`                    |
| 5             | Gebundelde Skills              | meegeleverd met de installatie          |
| 6 — laagste   | Extra mappen                   | `skills.load.extraDirs` + Plugin-Skills |

Hoofdmappen voor Skills ondersteunen gegroepeerde indelingen. OpenClaw ontdekt een Skill wanneer
`SKILL.md` ergens onder een geconfigureerde hoofdmap staat (tot maximaal 6 niveaus diep):

```text
<workspace>/skills/research/SKILL.md          ✓ gevonden als "research"
<workspace>/skills/personal/research/SKILL.md ✓ ook gevonden als "research"
```

Het mappad dient alleen voor ordening. De naam en slash-opdracht van de Skill
komen uit het frontmatterveld `name` (of uit de mapnaam wanneer `name`
ontbreekt). Toelatingslijsten voor agents (hieronder) komen eveneens overeen op basis van deze `name`.

<Note>
  De ingebouwde map `$CODEX_HOME/skills` van Codex CLI is **geen** hoofdmap voor
  OpenClaw-Skills. Gebruik `openclaw migrate plan codex` om die Skills te inventariseren en vervolgens
  `openclaw migrate codex` om ze naar je OpenClaw-werkruimte te kopiëren.
</Note>

## Door een Node gehoste Skills

Een verbonden headless Node kan Skills publiceren die in de actieve OpenClaw-
Skills-map zijn geïnstalleerd (standaard `~/.openclaw/skills`; overschrijvingen via de profielomgeving
zijn van toepassing). Ze verschijnen in de normale lijst met agentskills zolang de Node verbonden is
en verdwijnen wanneer de verbinding wordt verbroken. Bij een naamconflict behoudt een lokale Skill of Gateway-Skill
zijn naam; de Node-Skill krijgt een deterministische naam met een Node-voorvoegsel.
Voor door een Node gehoste v1-Skills moet de mapnaam overeenkomen met het frontmatterveld `name`
van de Skill.

De Skill-vermelding bevat de locator van de Node. De bestanden, relatieve verwijzingen en
binaire bestanden bevinden zich op de Node; laad de Skill daarom en voer deze uit met
`exec host=node node=<node-id>`. Start de Node-host opnieuw nadat je de Skill-
bestanden hebt gewijzigd. Zie [Nodes](/nl/nodes#node-hosted-skills) voor koppeling en uitschakelopties.

## Skills per agent versus gedeelde Skills

In configuraties met meerdere agents heeft elke agent een eigen werkruimte. Gebruik het pad dat
overeenkomt met de gewenste zichtbaarheid:

| Bereik             | Pad                          | Zichtbaar voor                         |
| ------------------ | ---------------------------- | -------------------------------------- |
| Per agent          | `<workspace>/skills`         | Alleen die agent                       |
| Projectagent       | `<workspace>/.agents/skills` | Alleen de agent van die werkruimte     |
| Persoonlijke agent | `~/.agents/skills`           | Alle agents op deze machine            |
| Gedeeld beheerd    | `~/.openclaw/skills`         | Alle agents op deze machine            |
| Extra mappen       | `skills.load.extraDirs`      | Alle agents op deze machine            |

## Toelatingslijsten voor agents

De **locatie** van een Skill (prioriteit) en de **zichtbaarheid** van een Skill (welke agent deze kan gebruiken)
zijn afzonderlijke instellingen. Gebruik toelatingslijsten om te beperken welke Skills een agent ziet,
ongeacht waar ze vandaan worden geladen.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // gedeelde basisset
    },
    list: [
      { id: "writer" }, // neemt github en weather over
      { id: "docs", skills: ["docs-search"] }, // vervangt de standaardwaarden volledig
      { id: "locked-down", skills: [] }, // geen Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Regels voor toelatingslijsten">
    - Laat `agents.defaults.skills` weg om standaard geen beperkingen voor Skills toe te passen.
    - Laat `agents.list[].skills` weg om `agents.defaults.skills` over te nemen.
    - Stel `agents.list[].skills: []` in om geen Skills beschikbaar te maken voor die agent.
    - Een niet-lege lijst `agents.list[].skills` is de **definitieve** verzameling — deze wordt niet
      samengevoegd met de standaardwaarden.
    - De effectieve toelatingslijst geldt voor het opbouwen van prompts, het ontdekken van slash-opdrachten,
      sandbox-synchronisatie en snapshots van Skills.
    - Dit is geen autorisatiegrens voor de hostshell. Als dezelfde agent
      `exec` kan gebruiken, beperk die shell dan afzonderlijk met sandboxing, isolatie
      per OS-gebruiker, weigerings-/toelatingslijsten voor uitvoering en inloggegevens per resource.
  </Accordion>
</AccordionGroup>

## Plugins en Skills

Plugins kunnen hun eigen Skills meeleveren door `skills`-mappen op te nemen in
`openclaw.plugin.json` (paden relatief ten opzichte van de hoofdmap van de Plugin). Plugin-Skills worden geladen
wanneer de Plugin is ingeschakeld — de browser-Plugin levert bijvoorbeeld een
Skill `browser-automation` voor browserbesturing in meerdere stappen.

Mappen met Plugin-Skills worden samengevoegd op hetzelfde lage prioriteitsniveau als
`skills.load.extraDirs`, zodat een gebundelde, beheerde, agent- of werkruimte-Skill
met dezelfde naam voorrang krijgt. Bepaal of een Plugin-Skill zelf in aanmerking komt via
`metadata.openclaw.requires` in de frontmatter, net als bij elke andere Skill.

Zie [Plugins](/nl/tools/plugin) en [Tools](/nl/tools) voor het volledige Pluginsysteem.

## Skill Workshop

[Skill Workshop](/nl/tools/skill-workshop) is een wachtrij met voorstellen tussen de agent
en je actieve Skill-bestanden. Wanneer de agent herbruikbaar werk herkent, stelt deze een
voorstel op in plaats van rechtstreeks naar `SKILL.md` te schrijven. Je beoordeelt en keurt
het voorstel goed voordat er iets verandert.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Zie [Skill Workshop](/nl/tools/skill-workshop) voor de volledige levenscyclus, CLI-
referentie en configuratie.

## Installeren vanuit ClawHub

[ClawHub](https://clawhub.ai) is het openbare register voor Skills. Gebruik
`openclaw skills`-opdrachten voor installatie en updates, of de `clawhub`-CLI voor
publicatie en synchronisatie.

| Actie                                      | Opdracht                                               |
| ------------------------------------------ | ------------------------------------------------------ |
| Een Skill in de werkruimte installeren     | `openclaw skills install @owner/<slug>`                |
| Vanuit een Git-repository installeren      | `openclaw skills install git:owner/repo@ref`           |
| Een lokale Skill-map installeren           | `openclaw skills install ./path/to/skill --as my-tool` |
| Voor alle lokale agents installeren        | `openclaw skills install @owner/<slug> --global`       |
| Alle Skills in de werkruimte bijwerken     | `openclaw skills update --all`                         |
| Een gedeelde beheerde Skill bijwerken      | `openclaw skills update @owner/<slug> --global`        |
| Alle gedeelde beheerde Skills bijwerken    | `openclaw skills update --all --global`                |
| Het vertrouwensprofiel van een Skill verifiëren | `openclaw skills verify @owner/<slug>`             |
| De gegenereerde Skill Card weergeven       | `openclaw skills verify @owner/<slug> --card`          |
| Publiceren / synchroniseren via ClawHub-CLI | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Installatiedetails">
    `openclaw skills install` installeert standaard in de map `skills/` van de actieve werkruimte.
    Voeg `--global` toe om te installeren in de gedeelde map
    `~/.openclaw/skills`, die zichtbaar is voor alle lokale agents tenzij toelatingslijsten voor agents
    dit beperken.

    Bij installaties vanuit Git en lokale bronnen wordt `SKILL.md` in de hoofdmap van de bron verwacht. De slug wordt
    overgenomen uit `name` in de frontmatter van `SKILL.md` wanneer deze geldig is en valt anders terug op de
    naam van de map of repository. Gebruik `--as <slug>` om dit te overschrijven.
    `openclaw skills update` houdt alleen ClawHub-installaties bij — installeer Git- of
    lokale bronnen opnieuw om ze te vernieuwen.

  </Accordion>
  <Accordion title="Verificatie en beveiligingsscans">
    `openclaw skills verify @owner/<slug>` vraagt ClawHub om het
    vertrouwensprofiel `clawhub.skill.verify.v1` van de Skill. Geïnstalleerde ClawHub-Skills worden geverifieerd
    aan de hand van de versie en het register die in `.clawhub/origin.json` zijn vastgelegd.
    Kale slugs blijven geaccepteerd voor bestaande geïnstalleerde of eenduidige Skills, maar
    verwijzingen met een eigenaar voorkomen onduidelijkheid over de uitgever.

    ClawHub-pagina's voor Skills tonen vóór installatie de status van de meest recente beveiligingsscan,
    met detailpagina's voor VirusTotal, ClawScan en statische analyse. De
    opdracht eindigt met een niet-nulcode wanneer ClawHub de verificatie als mislukt markeert. Uitgevers
    kunnen fout-positieve resultaten herstellen via het ClawHub-dashboard of
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installaties uit privéarchieven">
    Gateway-clients die levering buiten ClawHub nodig hebben, kunnen een ziparchief met een Skill klaarzetten
    met `skills.upload.begin`, `skills.upload.chunk` en `skills.upload.commit`,
    en dit vervolgens installeren met `skills.install({ source: "upload", ... })`. Dit pad is
    standaard uitgeschakeld en vereist `skills.install.allowUploadedArchives: true` in
    `openclaw.json`. Voor normale ClawHub-installaties is die instelling nooit nodig.
  </Accordion>
</AccordionGroup>

## Beveiliging

<Warning>
  Behandel Skills van derden als **niet-vertrouwde code**. Lees ze voordat je ze inschakelt.
  Geef voor niet-vertrouwde invoer en risicovolle tools de voorkeur aan uitvoeringen in een sandbox. Zie
  [Sandboxing](/nl/gateway/sandboxing) voor instellingen aan de agentzijde.
</Warning>

<AccordionGroup>
  <Accordion title="Padbeperking">
    Bij het ontdekken van Skills in werkruimten, projectagents en extra mappen worden alleen hoofd-
    mappen voor Skills geaccepteerd waarvan het opgeloste realpath binnen de geconfigureerde hoofdmap blijft, tenzij
    `skills.load.allowSymlinkTargets` een doelhoofdmap expliciet vertrouwt.
    Skill Workshop schrijft alleen via die vertrouwde doelen wanneer
    `skills.workshop.allowSymlinkTargetWrites` is ingeschakeld.
    Beheerde `~/.openclaw/skills` en persoonlijke `~/.agents/skills` mogen
    via symbolische koppelingen verbonden Skill-mappen bevatten, maar het realpath van elk `SKILL.md` moet nog steeds
    binnen de opgeloste Skill-map blijven.
  </Accordion>
  <Accordion title="Installatiebeleid voor operators">
    Configureer `security.installPolicy` om een vertrouwde lokale beleidsopdracht uit te voeren
    voordat installaties van Skills doorgaan. Het beleid ontvangt metadata en het klaargezette
    bronpad, is van toepassing op ClawHub-, upload-, Git-, lokale, update- en
    afhankelijkheidsinstallatiepaden en weigert standaard wanneer de opdracht geen
    geldige beslissing kan retourneren.
  </Accordion>
  <Accordion title="Bereik van geheiminjectie">
    `skills.entries.*.env` en `skills.entries.*.apiKey` injecteren geheimen alleen voor die agentbeurt in het
    **hostproces** — niet in de sandbox. Houd
    geheimen buiten prompts en logboeken.
  </Accordion>
</AccordionGroup>

Zie [Beveiliging](/nl/gateway/security) voor het bredere dreigingsmodel en
beveiligingschecklists.

## Indeling van SKILL.md

Elke Skill heeft minimaal een `name` en `description` in de frontmatter nodig:

```markdown
---
name: image-lab
description: Afbeeldingen genereren of bewerken via een door een provider ondersteunde afbeeldingsworkflow
---

Wanneer de gebruiker vraagt om een afbeelding te genereren, gebruik je de tool `image_generate`...
```

<Note>
  OpenClaw volgt de [AgentSkills](https://agentskills.io)-specificatie. Frontmatter
  wordt eerst als YAML geparseerd; als dat mislukt, wordt teruggevallen op een
  parser die alleen één regel ondersteunt. Geneste `metadata`-blokken (inclusief
  YAML-toewijzingen van meerdere regels) worden afgevlakt tot een JSON-tekenreeks
  en opnieuw geparseerd als JSON5, zodat de blokvorm onder [Toelatingscriteria](#gating)
  werkt. Gebruik `{baseDir}` in de hoofdtekst om naar het pad van de Skills-map
  te verwijzen.
</Note>

### Optionele frontmatter-sleutels

<ParamField path="homepage" type="string">
  URL die als "Website" wordt weergegeven in de macOS-interface voor Skills. Wordt ook
  ondersteund via `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Als dit `true` is, wordt de skill beschikbaar gesteld als een door de gebruiker
  aanroepbare slash-opdracht.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Als dit `true` is, houdt OpenClaw de instructies van de skill buiten de normale
  prompt van de agent. De skill blijft beschikbaar als slash-opdracht wanneer
  `user-invocable` ook `true` is.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Wanneer dit is ingesteld op `tool`, omzeilt de slash-opdracht het model en
  wordt deze rechtstreeks naar een geregistreerde tool gestuurd.
</ParamField>

<ParamField path="command-tool" type="string">
  Naam van de tool die moet worden aangeroepen wanneer `command-dispatch: tool`
  is ingesteld.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Voor verzending naar een tool wordt de onbewerkte argumenttekenreeks zonder
  verwerking door de kern doorgestuurd naar de tool. De tool ontvangt
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Toelatingscriteria

OpenClaw filtert skills tijdens het laden met `metadata.openclaw` (een
JSON5-object dat in de frontmatter is opgenomen; zie de opmerking over parseren
hierboven). Een skill zonder `metadata.openclaw`-blok komt altijd in aanmerking,
tenzij deze expliciet is uitgeschakeld.

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
  Als dit `true` is, wordt de skill altijd opgenomen en worden alle andere
  toelatingscriteria overgeslagen.
</ParamField>

<ParamField path="emoji" type="string">
  Optionele emoji die wordt weergegeven in de macOS-interface voor Skills.
</ParamField>

<ParamField path="homepage" type="string">
  Optionele URL die als "Website" wordt weergegeven in de macOS-interface voor Skills.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Platformfilter. Wanneer dit is ingesteld, komt de skill alleen in aanmerking
  op een vermeld besturingssysteem.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Elk binair bestand moet aanwezig zijn in `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Ten minste één binair bestand moet aanwezig zijn in `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Elke omgevingsvariabele moet in het proces aanwezig zijn of via de configuratie
  worden aangeleverd.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Elk `openclaw.json`-pad moet een waarheidswaarde hebben.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Naam van de omgevingsvariabele die is gekoppeld aan
  `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Optionele installatiespecificaties die door de macOS-interface voor Skills worden
  gebruikt (brew / node / go / uv / download).
</ParamField>

<Note>
  Verouderde `metadata.clawdbot`-blokken worden nog steeds geaccepteerd wanneer
  `metadata.openclaw` ontbreekt, zodat oudere geïnstalleerde skills hun
  afhankelijkheidscontroles en installatietips behouden. Nieuwe skills moeten
  `metadata.openclaw` gebruiken.
</Note>

### Installatiespecificaties

Installatiespecificaties vertellen de macOS-interface voor Skills hoe een
afhankelijkheid moet worden geïnstalleerd:

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
    - Wanneer meerdere installatieprogramma's zijn vermeld, kiest de Gateway één
      voorkeursoptie (brew indien beschikbaar, anders node).
    - Als alle installatieprogramma's `download` zijn, vermeldt OpenClaw elk item,
      zodat u alle beschikbare artefacten kunt zien.
    - Specificaties kunnen `os: ["darwin"|"linux"|"win32"]` bevatten om op
      platform te filteren.
    - Node-installaties respecteren `skills.install.nodeManager` in
      `openclaw.json` (standaard: npm; opties: npm / pnpm / yarn / bun). Dit is
      alleen van invloed op de installatie van skills; de runtime van de Gateway
      moet nog steeds Node zijn.
    - Installatievoorkeur van de Gateway: Homebrew → uv → geconfigureerde
      nodebeheerder → go → download.
  </Accordion>
  <Accordion title="Details per installatieprogramma">
    - **Homebrew:** OpenClaw installeert Homebrew niet automatisch en vertaalt
      brew-formules niet naar opdrachten voor systeempakketten. In
      Linux-containers zonder `brew` worden installatieprogramma's die alleen
      brew ondersteunen verborgen; gebruik een aangepaste image of installeer
      de afhankelijkheid handmatig.
    - **Go:** OpenClaw vereist Go 1.21 of nieuwer voor automatische installatie
      van skills. Als `go` ontbreekt en Homebrew beschikbaar is, installeert
      OpenClaw eerst Go via Homebrew; op Linux zonder Homebrew kan het in plaats
      daarvan `apt-get` als root of via `sudo` zonder wachtwoord gebruiken
      wanneer de vernieuwde kandidaat `golang-go` aan de minimumversie voldoet.
      De daadwerkelijke `go install` voor de afhankelijkheid gebruikt altijd
      een speciale door OpenClaw beheerde map voor binaire bestanden (de
      `bin`-map van Homebrew bij een nieuwe installatie, anders `~/.local/bin`)
      in plaats van uw geconfigureerde `GOBIN` — uw eigen omgevingsvariabelen
      `GOBIN`, `GOPATH` en `GOTOOLCHAIN` worden gelezen, maar nooit overschreven.
    - **Download:** `url` (verplicht), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (standaard: automatisch wanneer een archief wordt gedetecteerd),
      `stripComponents`, `targetDir` (standaard:
      `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Opmerkingen over sandboxing">
    `requires.bins` wordt tijdens het laden van de skill op de **host**
    gecontroleerd. Als een agent in een sandbox wordt uitgevoerd, moet het
    binaire bestand ook **in de container** aanwezig zijn. Installeer het via
    `agents.defaults.sandbox.docker.setupCommand` of een aangepaste image.
    `setupCommand` wordt eenmaal na het maken van de container uitgevoerd en
    vereist uitgaand netwerkverkeer, een beschrijfbaar rootbestandssysteem en
    een rootgebruiker in de sandbox.
  </Accordion>
</AccordionGroup>

## Configuratieoverschrijvingen

Schakel meegeleverde of beheerde skills in of uit en configureer ze onder
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
  `false` schakelt de skill uit, zelfs wanneer deze is meegeleverd of
  geïnstalleerd. De meegeleverde skill `coding-agent` is optioneel — stel
  `skills.entries.coding-agent.enabled: true` in en zorg ervoor dat `claude`,
  `codex`, `opencode` of een andere ondersteunde CLI is geïnstalleerd en
  geauthenticeerd.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Gemaksveld voor skills die `metadata.openclaw.primaryEnv` declareren.
  Ondersteunt een tekenreeks met platte tekst of een SecretRef-object.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Omgevingsvariabelen die voor de uitvoering van de agent worden geïnjecteerd.
  Ze worden alleen geïnjecteerd wanneer de variabele nog niet in het proces is
  ingesteld.
</ParamField>

<ParamField path="config" type="object">
  Optionele verzameling voor aangepaste configuratievelden per skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Optionele toelatingslijst, uitsluitend voor **meegeleverde** skills. Wanneer
  deze is ingesteld, komen alleen meegeleverde skills in de lijst in aanmerking.
  Beheerde skills en skills uit de werkruimte worden niet beïnvloed.
</ParamField>

<Note>
  Configuratiesleutels komen standaard overeen met de **naam van de skill**. Als
  een skill `metadata.openclaw.skillKey` definieert, gebruikt u in plaats
  daarvan die sleutel onder `skills.entries`. Zet namen met koppeltekens tussen
  aanhalingstekens: JSON5 staat sleutels tussen aanhalingstekens toe.
</Note>

## Injectie van omgevingsvariabelen

Wanneer een agentuitvoering begint, voert OpenClaw het volgende uit:

<Steps>
  <Step title="Leest metadata van skills">
    OpenClaw bepaalt de effectieve lijst met skills voor de agent en past
    toelatingscriteria, toelatingslijsten en configuratieoverschrijvingen toe.
  </Step>
  <Step title="Injecteert omgevingsvariabelen en API-sleutels">
    `skills.entries.<key>.env` en `skills.entries.<key>.apiKey` worden voor de
    duur van de uitvoering toegepast op `process.env`.
  </Step>
  <Step title="Bouwt de systeemprompt">
    In aanmerking komende skills worden samengevoegd tot een compact XML-blok
    en in de systeemprompt geïnjecteerd.
  </Step>
  <Step title="Herstelt de omgeving">
    Nadat de uitvoering is beëindigd, wordt de oorspronkelijke omgeving
    hersteld.
  </Step>
</Steps>

<Warning>
  De injectie van omgevingsvariabelen is beperkt tot de uitvoering van de agent
  op de **host**, niet tot de sandbox. In een sandbox hebben `env` en `apiKey`
  geen effect. Zie
  [Configuratie van Skills](/nl/tools/skills-config#sandboxed-skills-and-env-vars)
  voor informatie over het doorgeven van geheimen aan uitvoeringen in een sandbox.
</Warning>

Voor de meegeleverde `claude-cli`-backend materialiseert OpenClaw dezelfde
momentopname van in aanmerking komende skills ook als een tijdelijke Claude
Code-plugin en geeft deze door via `--plugin-dir`. Andere CLI-backends gebruiken
alleen de promptcatalogus.

## Momentopnamen en vernieuwen

OpenClaw maakt een momentopname van in aanmerking komende skills **wanneer een
sessie begint** en hergebruikt die lijst voor alle volgende beurten in de
sessie. Wijzigingen in skills of configuratie worden van kracht in de volgende
nieuwe sessie.

Skills worden tijdens een sessie in twee gevallen vernieuwd:

- De bewaking van skills detecteert een wijziging in `SKILL.md`.
- Er maakt verbinding met een nieuwe in aanmerking komende externe node.

De vernieuwde lijst wordt bij de volgende agentbeurt gebruikt. Als de effectieve
toelatingslijst van de agent verandert, vernieuwt OpenClaw de momentopname om
de zichtbare skills daarmee in overeenstemming te houden.

<AccordionGroup>
  <Accordion title="Bewaking van Skills">
    OpenClaw bewaakt standaard de mappen met skills en werkt de momentopname bij
    wanneer `SKILL.md`-bestanden veranderen. Configureer dit onder `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    Gebruik `allowSymlinkTargets` voor opzettelijke indelingen met symbolische
    koppelingen waarbij een symbolische koppeling naar de hoofdmap van een skill
    buiten de geconfigureerde hoofdmap verwijst, bijvoorbeeld
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Schakel `skills.workshop.allowSymlinkTargetWrites` alleen in wanneer Skill
    Workshop voorstellen ook via die vertrouwde paden met symbolische
    koppelingen moet toepassen.

  </Accordion>
  <Accordion title="Externe macOS-nodes (Linux-Gateway)">
    Als de Gateway op Linux draait, maar er een **macOS-node** is verbonden
    waarop `system.run` is toegestaan, kan OpenClaw skills die alleen voor macOS
    zijn bedoeld als geschikt beschouwen wanneer de vereiste binaire bestanden
    op die node aanwezig zijn. De agent moet die skills uitvoeren via de tool
    `exec` met `host=node`.

    Offline nodes maken skills die alleen extern beschikbaar zijn **niet**
    zichtbaar. Als een node niet meer reageert op controles van binaire
    bestanden, wist OpenClaw de overeenkomsten uit de cache.

  </Accordion>
</AccordionGroup>

## Impact op tokens

Wanneer skills in aanmerking komen, injecteert OpenClaw een compact XML-blok in
de systeemprompt. De kosten zijn deterministisch en nemen lineair toe per skill:

- **Basisoverhead** (alleen wanneer 1 of meer skills in aanmerking komen): een
  vast blok met inleidende tekst plus de wrapper `<available_skills>`.
- **Per skill:** circa 97 tekens + de lengtes van uw velden `name`,
  `description` en `location`.
- XML-escaping zet `& < > " '` om in entiteiten, waardoor per voorkomen enkele
  tekens worden toegevoegd.
- Bij circa 4 tekens per token geldt: 97 tekens ≈ 24 tokens per skill, vóór de
  lengtes van de velden.

Als het gerenderde blok het geconfigureerde promptbudget zou overschrijden
(`skills.limits.maxSkillsPromptChars`), behoudt OpenClaw eerst zoveel mogelijk
Skills-identiteiten (naam, locatie en versie) als in de compacte indeling zonder
beschrijvingen passen. Vervolgens gebruikt het het resterende budget voor
ingekorte beschrijvingen. Als er geen budget voor beschrijvingen overblijft,
worden beschrijvingen weggelaten. De prompt bevat een opmerking die verwijst
naar `openclaw skills check` wanneer compacte opmaak of het inkorten van de lijst
vereist is.

Houd beschrijvingen kort en informatief om de promptoverhead te minimaliseren.

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Skills maken" href="/nl/tools/creating-skills" icon="hammer">
    Stapsgewijze handleiding voor het opstellen van een aangepaste Skill.
  </Card>
  <Card title="Skillworkshop" href="/nl/tools/skill-workshop" icon="flask">
    Wachtrij met voorstellen voor door agents opgestelde Skills.
  </Card>
  <Card title="Skills-configuratie" href="/nl/tools/skills-config" icon="gear">
    Volledig `skills.*`-configuratieschema en toelatingslijsten voor agents.
  </Card>
  <Card title="Slash-opdrachten" href="/nl/tools/slash-commands" icon="terminal">
    Hoe slash-opdrachten voor Skills worden geregistreerd en gerouteerd.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Blader door Skills en publiceer ze in het openbare register.
  </Card>
  <Card title="Plugins" href="/nl/tools/plugin" icon="plug">
    Plugins kunnen Skills meeleveren naast de hulpmiddelen die ze documenteren.
  </Card>
</CardGroup>
