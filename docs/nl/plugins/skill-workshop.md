---
read_when:
    - Je wilt dat agenten correcties of herbruikbare procedures omzetten in werkruimte-Skills
    - Je configureert procedureel vaardigheidsgeheugen
    - Je debugt het gedrag van de tool skill_workshop
    - Je beslist of je automatische Skills-aanmaak wilt inschakelen
summary: Experimentele vastlegging van herbruikbare procedures als werkruimte-Skills met beoordeling, goedkeuring, quarantaine en live vernieuwing van skills
title: Skill-workshop-Plugin
x-i18n:
    generated_at: "2026-05-07T13:24:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop is **experimenteel**. Het is standaard uitgeschakeld, de vastleggingsheuristieken en beoordelaarsprompts kunnen tussen releases veranderen, en automatische schrijfacties mogen alleen worden gebruikt in vertrouwde werkruimten nadat de uitvoer in pending-modus eerst is beoordeeld.

Skill Workshop is procedureel geheugen voor werkruimte-Skills. Hiermee kan een agent herbruikbare workflows, gebruikerscorrecties, moeizaam gevonden oplossingen en terugkerende valkuilen omzetten in `SKILL.md`-bestanden onder:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Dit verschilt van langetermijngeheugen:

- **Geheugen** slaat feiten, voorkeuren, entiteiten en eerdere context op.
- **Skills** slaan herbruikbare procedures op die de agent bij toekomstige taken moet volgen.
- **Skill Workshop** is de brug van een nuttige beurt naar een duurzame werkruimte-Skill, met veiligheidscontroles en optionele goedkeuring.

Skill Workshop is nuttig wanneer de agent een procedure leert, zoals:

- hoe extern verkregen geanimeerde GIF-assets te valideren
- hoe screenshot-assets te vervangen en afmetingen te verifiëren
- hoe een repospecifiek QA-scenario uit te voeren
- hoe een terugkerende providerfout te debuggen
- hoe een verouderde lokale workflownotitie te herstellen

Het is niet bedoeld voor:

- feiten zoals "de gebruiker houdt van blauw"
- breed autobiografisch geheugen
- ruwe transcriptarchivering
- geheimen, referenties of verborgen prompttekst
- eenmalige instructies die zich niet zullen herhalen

## Standaardstatus

De meegeleverde plugin is **experimenteel** en **standaard uitgeschakeld**, tenzij deze expliciet is ingeschakeld in `plugins.entries.skill-workshop`.

Het pluginmanifest stelt `enabledByDefault: true` niet in. De standaardwaarde `enabled: true` binnen het pluginconfiguratieschema geldt pas nadat de pluginvermelding al is geselecteerd en geladen.

Experimenteel betekent:

- de plugin wordt voldoende ondersteund voor opt-in testen en dogfooding
- voorstelopslag, beoordelaarsdrempels en vastleggingsheuristieken kunnen evolueren
- goedkeuring in pending-status is de aanbevolen startmodus
- automatisch toepassen is bedoeld voor vertrouwde persoonlijke of werkruimte-instellingen, niet voor gedeelde of vijandige omgevingen met veel invoer

## Inschakelen

Minimale veilige configuratie:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Met deze configuratie:

- is de tool `skill_workshop` beschikbaar
- worden expliciete herbruikbare correcties in de wachtrij gezet als pending-voorstellen
- kunnen beoordelaarspasses op basis van drempels Skill-updates voorstellen
- wordt er geen Skill-bestand geschreven totdat een pending-voorstel wordt toegepast

Gebruik automatische schrijfacties alleen in vertrouwde werkruimten:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` gebruikt nog steeds dezelfde scanner en hetzelfde quarantainepad. Het past geen voorstellen toe met kritieke bevindingen.

## Configuratie

| Sleutel              | Standaard   | Bereik / waarden                            | Betekenis                                                           |
| -------------------- | ----------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Schakelt de plugin in nadat de pluginvermelding is geladen.         |
| `autoCapture`        | `true`      | boolean                                     | Schakelt vastlegging/beoordeling na de beurt in bij geslaagde agentbeurten. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Zet voorstellen in de wachtrij of schrijf veilige voorstellen automatisch. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Kiest expliciete correctievastlegging, LLM-beoordelaar, beide of geen van beide. |
| `reviewInterval`     | `15`        | `1..200`                                    | Voer de beoordelaar uit na zoveel geslaagde beurten.                |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Voer de beoordelaar uit na zoveel waargenomen toolaanroepen.        |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Time-out voor de ingebedde beoordelaarsrun.                         |
| `maxPending`         | `50`        | `1..200`                                    | Maximaal aantal pending-/quarantainevoorstellen dat per werkruimte wordt bewaard. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Maximale grootte van gegenereerd Skill-/ondersteuningsbestand.      |

Aanbevolen profielen:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Vastleggingspaden

Skill Workshop heeft drie vastleggingspaden.

### Toolsuggesties

Het model kan `skill_workshop` direct aanroepen wanneer het een herbruikbare procedure ziet of wanneer de gebruiker vraagt om een Skill op te slaan of bij te werken.

Dit is het meest expliciete pad en werkt zelfs met `autoCapture: false`.

### Heuristische vastlegging

Wanneer `autoCapture` is ingeschakeld en `reviewMode` `heuristic` of `hybrid` is, scant de plugin geslaagde beurten op expliciete correctiezinnen van gebruikers:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

De heuristiek maakt een voorstel op basis van de nieuwste overeenkomende gebruikersinstructie. Deze gebruikt onderwerpaanwijzingen om Skill-namen te kiezen voor veelvoorkomende workflows:

- geanimeerde GIF-taken -> `animated-gif-workflow`
- screenshot- of assettaken -> `screenshot-asset-workflow`
- QA- of scenariotaken -> `qa-scenario-workflow`
- GitHub PR-taken -> `github-pr-workflow`
- fallback -> `learned-workflows`

Heuristische vastlegging is bewust smal. Het is bedoeld voor duidelijke correcties en herhaalbare procesnotities, niet voor algemene transcriptsamenvatting.

### LLM-beoordelaar

Wanneer `autoCapture` is ingeschakeld en `reviewMode` `llm` of `hybrid` is, voert de plugin een compacte ingebedde beoordelaar uit nadat drempels zijn bereikt.

De beoordelaar ontvangt:

- de recente transcripttekst, beperkt tot de laatste 12.000 tekens
- maximaal 12 bestaande werkruimte-Skills
- maximaal 2.000 tekens uit elke bestaande Skill
- instructies uitsluitend in JSON

De beoordelaar heeft geen tools:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

De beoordelaar retourneert óf `{ "action": "none" }` óf één voorstel. Het veld `action` is `create`, `append` of `replace` - geef de voorkeur aan `append`/`replace` wanneer er al een relevante Skill bestaat; gebruik `create` alleen wanneer geen bestaande Skill past.

Voorbeeld van `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` voegt `section` + `body` toe. `replace` vervangt `oldText` door `newText` in de genoemde Skill.

## Levenscyclus van voorstellen

Elke gegenereerde update wordt een voorstel met:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- optioneel `agentId`
- optioneel `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` of `reviewer`
- `status`
- `change`
- optioneel `scanFindings`
- optioneel `quarantineReason`

Voorstelstatussen:

- `pending` - wacht op goedkeuring
- `applied` - geschreven naar `<workspace>/skills`
- `rejected` - afgewezen door operator/model
- `quarantined` - geblokkeerd door kritieke scannerbevindingen

Status wordt per werkruimte opgeslagen onder de Gateway-statusmap:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Wachtende en in quarantaine geplaatste voorstellen worden ontdubbeld op skillnaam en wijzigingspayload. De opslag bewaart de nieuwste wachtende/in quarantaine geplaatste voorstellen tot maximaal `maxPending`.

## Toolreferentie

De Plugin registreert één agenttool:

```text
skill_workshop
```

### `status`

Tel voorstellen per status voor de actieve werkruimte.

```json
{ "action": "status" }
```

Resultaatvorm:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Geef wachtende voorstellen weer.

```json
{ "action": "list_pending" }
```

Om een andere status weer te geven:

```json
{ "action": "list_pending", "status": "applied" }
```

Geldige `status`-waarden:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Geef in quarantaine geplaatste voorstellen weer.

```json
{ "action": "list_quarantine" }
```

Gebruik dit wanneer automatische vastlegging niets lijkt te doen en de logs
`skill-workshop: quarantined <skill>` vermelden.

### `inspect`

Haal een voorstel op op id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Maak een voorstel. Met `approvalPolicy: "pending"` (standaard) wordt dit in de wachtrij gezet in plaats van geschreven.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Onmiddellijk schrijven aanvragen in automatische modus (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Met `approvalPolicy: "pending"` zet `apply: true` het voorstel nog steeds in de wachtrij. Beoordeel het en gebruik daarna
de actie `apply` na goedkeuring.

  </Accordion>

  <Accordion title="Wachtend afdwingen onder automatisch beleid (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Toevoegen aan een benoemde sectie">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Exacte tekst vervangen">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Pas een wachtend voorstel toe.

Met `approvalPolicy: "pending"` vraagt deze actie om goedkeuring van de operator voordat de
werkruimte-skill wordt geschreven.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` weigert in quarantaine geplaatste voorstellen:

```text
quarantined proposal cannot be applied
```

### `reject`

Markeer een voorstel als afgewezen.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Schrijf een ondersteunend bestand binnen een bestaande of voorgestelde skillmap.

Toegestane ondersteunende mappen op het hoogste niveau:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Voorbeeld:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Supportbestanden zijn werkruimte-gebonden, worden op pad gecontroleerd, zijn door
`maxSkillBytes` begrensd in bytes, worden gescand en atomair geschreven.

## Skill-schrijfacties

Skill Workshop schrijft alleen onder:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skillnamen worden genormaliseerd:

- naar kleine letters omgezet
- reeksen die niet `[a-z0-9_-]` zijn, worden `-`
- niet-alfanumerieke tekens aan het begin/einde worden verwijderd
- maximale lengte is 80 tekens
- uiteindelijke naam moet overeenkomen met `[a-z0-9][a-z0-9_-]{1,79}`

Voor `create`:

- als de skill niet bestaat, schrijft Skill Workshop een nieuwe `SKILL.md`
- als deze al bestaat, voegt Skill Workshop de body toe aan `## Workflow`

Voor `append`:

- als de skill bestaat, voegt Skill Workshop toe aan de gevraagde sectie
- als deze niet bestaat, maakt Skill Workshop een minimale skill en voegt daarna toe

Voor `replace`:

- de skill moet al bestaan
- `oldText` moet exact aanwezig zijn
- alleen de eerste exacte overeenkomst wordt vervangen

Alle schrijfacciones zijn atomair en verversen de in-memory skills-snapshot onmiddellijk, zodat
de nieuwe of bijgewerkte skill zichtbaar kan worden zonder een Gateway-herstart.

## Veiligheidsmodel

Skill Workshop heeft een veiligheidsscanner voor gegenereerde `SKILL.md`-inhoud en supportbestanden.

Kritieke bevindingen plaatsen voorstellen in quarantaine:

| Regel-id                               | Blokkeert inhoud die...                                              |
| -------------------------------------- | -------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | de agent vertelt eerdere/hogere instructies te negeren               |
| `prompt-injection-system`              | verwijst naar systeemprompts, ontwikkelaarsberichten of verborgen instructies |
| `prompt-injection-tool`                | aanmoedigt om tooltoestemming/-goedkeuring te omzeilen               |
| `shell-pipe-to-shell`                  | `curl`/`wget` bevat die naar `sh`, `bash` of `zsh` worden gepiped     |
| `secret-exfiltration`                  | env-/process-env-gegevens via het netwerk lijkt te versturen         |

Waarschuwingsbevindingen blijven behouden maar blokkeren op zichzelf niet:

| Regel-id             | Waarschuwt bij...                 |
| -------------------- | --------------------------------- |
| `destructive-delete` | brede opdrachten in `rm -rf`-stijl |
| `unsafe-permissions` | permissiegebruik in `chmod 777`-stijl |

Voorstellen in quarantaine:

- behouden `scanFindings`
- behouden `quarantineReason`
- verschijnen in `list_quarantine`
- kunnen niet via `apply` worden toegepast

Om te herstellen van een voorstel in quarantaine, maak je een nieuw veilig voorstel waarbij de
onveilige inhoud is verwijderd. Bewerk de store-JSON niet handmatig.

## Promptrichtlijnen

Wanneer ingeschakeld, injecteert Skill Workshop een korte promptsectie die de agent vertelt
`skill_workshop` te gebruiken voor duurzame procedurele herinnering.

De richtlijn benadrukt:

- procedures, geen feiten/voorkeuren
- correcties van gebruikers
- niet voor de hand liggende succesvolle procedures
- terugkerende valkuilen
- reparatie van verouderde/dunne/verkeerde skills via append/replace
- herbruikbare procedure opslaan na lange tool-lussen of moeilijke fixes
- korte imperatieve skilltekst
- geen transcriptdumps

De schrijfmodustekst verandert met `approvalPolicy`:

- pending-modus: suggesties in de wachtrij zetten; gebruik `apply` na expliciete goedkeuring
- auto-modus: veilige werkruimte-skillupdates toepassen, tenzij `apply: false` ze in plaats daarvan in de wachtrij zet

## Kosten en runtimegedrag

Heuristische vastlegging roept geen model aan.

LLM-review gebruikt een ingebedde run op het actieve/standaard agentmodel. Deze is
drempelgebaseerd, zodat hij standaard niet bij elke beurt draait.

De reviewer:

- gebruikt dezelfde geconfigureerde provider-/modelcontext wanneer beschikbaar
- valt terug op runtime-agentstandaarden
- heeft `reviewTimeoutMs`
- gebruikt lichte bootstrapcontext
- heeft geen tools
- schrijft niets rechtstreeks
- kan alleen een voorstel uitgeven dat via de normale scanner- en
  goedkeurings-/quarantaineflow loopt

Als de reviewer faalt, een time-out krijgt of ongeldige JSON retourneert, logt de plugin een
waarschuwings-/debugbericht en slaat die reviewpass over.

## Gebruikspatronen

Gebruik Skill Workshop wanneer de gebruiker zegt:

- "volgende keer, doe X"
- "voortaan, geef de voorkeur aan Y"
- "zorg dat je Z verifieert"
- "sla dit op als workflow"
- "dit duurde even; onthoud het proces"
- "werk de lokale skill hiervoor bij"

Goede skilltekst:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Slechte skilltekst:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Redenen waarom de slechte versie niet moet worden opgeslagen:

- transcriptvormig
- niet imperatief
- bevat ruisende eenmalige details
- vertelt de volgende agent niet wat te doen

## Debuggen

Controleer of de plugin is geladen:

```bash
openclaw plugins list --enabled
```

Controleer voorstelcounts vanuit een agent-/toolcontext:

```json
{ "action": "status" }
```

Inspecteer wachtende voorstellen:

```json
{ "action": "list_pending" }
```

Inspecteer voorstellen in quarantaine:

```json
{ "action": "list_quarantine" }
```

Veelvoorkomende symptomen:

| Symptoom                              | Waarschijnlijke oorzaak                                                             | Controle                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tool is niet beschikbaar              | Plugin-entry is niet ingeschakeld                                                   | `plugins.entries.skill-workshop.enabled` en `openclaw plugins list`  |
| Er verschijnt geen automatisch voorstel | `autoCapture: false`, `reviewMode: "off"` of drempels niet gehaald                 | Configuratie, voorstelstatus, Gateway-logs                           |
| Heuristiek heeft niets vastgelegd     | Gebruikersformulering kwam niet overeen met correctiepatronen                       | Gebruik expliciet `skill_workshop.suggest` of schakel LLM-reviewer in |
| Reviewer heeft geen voorstel gemaakt  | Reviewer retourneerde `none`, ongeldige JSON of kreeg een time-out                  | Gateway-logs, `reviewTimeoutMs`, drempels                            |
| Voorstel wordt niet toegepast         | `approvalPolicy: "pending"`                                                         | `list_pending`, daarna `apply`                                       |
| Voorstel verdween uit pending         | Dubbel voorstel hergebruikt, pruning door max pending, of toegepast/geweigerd/in quarantaine gezet | `status`, `list_pending` met statusfilters, `list_quarantine`        |
| Skillbestand bestaat maar model mist het | Skills-snapshot is niet ververst of skill-gating sluit het uit                     | `openclaw skills`-status en geschiktheid van werkruimte-skill         |

Relevante logs:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA-scenario's

Repo-ondersteunde QA-scenario's:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Voer de deterministische dekking uit:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Voer reviewerdekking uit:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Het reviewerscenario is bewust apart, omdat het
`reviewMode: "llm"` inschakelt en de ingebedde reviewerpass uitvoert.

## Wanneer auto apply niet moet worden ingeschakeld

Vermijd `approvalPolicy: "auto"` wanneer:

- de werkruimte gevoelige procedures bevat
- de agent aan niet-vertrouwde input werkt
- skills binnen een breed team worden gedeeld
- je prompts of scannerregels nog aan het afstemmen bent
- het model vaak vijandige web-/e-mailinhoud verwerkt

Gebruik eerst pending-modus. Schakel pas over naar auto-modus nadat je het soort
skills hebt beoordeeld dat de agent in die werkruimte voorstelt.

## Gerelateerde docs

- [Skills](/nl/tools/skills)
- [Plugins](/nl/tools/plugin)
- [Testen](/nl/reference/test)
