---
read_when:
    - Je wilt dat agenten correcties of herbruikbare procedures omzetten in werkruimte-Skills
    - Je configureert procedureel vaardigheidsgeheugen
    - Je debugt het gedrag van de skill_workshop-tool
    - Je bepaalt of je automatische aanmaak van Skills wilt inschakelen
summary: Experimentele vastlegging van herbruikbare procedures als werkruimte-Skills met beoordeling, goedkeuring, quarantaine en directe Skills-vernieuwing
title: Skill-workshop-Plugin
x-i18n:
    generated_at: "2026-04-29T23:07:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop is **experimenteel**. Het is standaard uitgeschakeld, de capture-heuristieken en reviewer-prompts kunnen tussen releases veranderen, en automatische schrijfacties moeten alleen worden gebruikt in vertrouwde workspaces nadat de uitvoer in pending-modus eerst is beoordeeld.

Skill Workshop is procedureel geheugen voor workspace-Skills. Het laat een agent herbruikbare workflows, gebruikerscorrecties, moeizaam gevonden oplossingen en terugkerende valkuilen omzetten in `SKILL.md`-bestanden onder:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Dit verschilt van langetermijngeheugen:

- **Memory** bewaart feiten, voorkeuren, entiteiten en eerdere context.
- **Skills** bewaren herbruikbare procedures die de agent bij toekomstige taken moet volgen.
- **Skill Workshop** is de brug van een nuttige beurt naar een duurzame workspace-Skill, met veiligheidscontroles en optionele goedkeuring.

Skill Workshop is nuttig wanneer de agent een procedure leert zoals:

- hoe extern verkregen geanimeerde GIF-assets te valideren
- hoe screenshot-assets te vervangen en afmetingen te verifiëren
- hoe een repo-specifiek QA-scenario uit te voeren
- hoe een terugkerende providerfout te debuggen
- hoe een verouderde lokale workflownotitie te herstellen

Het is niet bedoeld voor:

- feiten zoals “de gebruiker houdt van blauw”
- brede autobiografische herinneringen
- ruwe transcriptarchivering
- secrets, inloggegevens of verborgen prompttekst
- eenmalige instructies die zich niet zullen herhalen

## Standaardstatus

De gebundelde plugin is **experimenteel** en **standaard uitgeschakeld**, tenzij deze expliciet is ingeschakeld in `plugins.entries.skill-workshop`.

Het pluginmanifest stelt `enabledByDefault: true` niet in. De standaardwaarde `enabled: true` binnen het configuratieschema van de plugin geldt alleen nadat de pluginvermelding al is geselecteerd en geladen.

Experimenteel betekent:

- de plugin wordt voldoende ondersteund voor opt-in testen en dogfooding
- opslag van voorstellen, reviewer-drempels en capture-heuristieken kunnen evolueren
- goedkeuring in pending-modus is de aanbevolen startmodus
- automatisch toepassen is voor vertrouwde persoonlijke/workspace-setups, niet voor gedeelde of vijandige omgevingen met veel invoer

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
- worden expliciete herbruikbare correcties in de wachtrij gezet als pending voorstellen
- kunnen reviewer-runs op basis van drempels Skill-updates voorstellen
- wordt er geen Skill-bestand geschreven totdat een pending voorstel wordt toegepast

Gebruik automatische schrijfacties alleen in vertrouwde workspaces:

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

`approvalPolicy: "auto"` gebruikt nog steeds dezelfde scanner en quarantaineroute. Het past geen voorstellen toe met kritieke bevindingen.

## Configuratie

| Sleutel              | Standaard   | Bereik / waarden                            | Betekenis                                                            |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Schakelt de plugin in nadat de pluginvermelding is geladen.          |
| `autoCapture`        | `true`      | boolean                                     | Schakelt capture/review na de beurt in bij geslaagde agentbeurten.   |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Zet voorstellen in de wachtrij of schrijft veilige voorstellen automatisch. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Kiest expliciete capture van correcties, LLM-reviewer, beide of geen van beide. |
| `reviewInterval`     | `15`        | `1..200`                                    | Voer de reviewer uit na zoveel geslaagde beurten.                    |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Voer de reviewer uit na zoveel waargenomen toolaanroepen.            |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Timeout voor de ingebedde reviewer-run.                              |
| `maxPending`         | `50`        | `1..200`                                    | Maximaal aantal pending/gequarantaineerde voorstellen dat per workspace wordt bewaard. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Maximale grootte van gegenereerd Skill-/ondersteuningsbestand.       |

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

## Capture-routes

Skill Workshop heeft drie capture-routes.

### Toolsuggesties

Het model kan `skill_workshop` rechtstreeks aanroepen wanneer het een herbruikbare procedure ziet of wanneer de gebruiker vraagt een Skill op te slaan/bij te werken.

Dit is de meest expliciete route en werkt zelfs met `autoCapture: false`.

### Heuristische capture

Wanneer `autoCapture` is ingeschakeld en `reviewMode` `heuristic` of `hybrid` is, scant de plugin geslaagde beurten op expliciete gebruikerscorrecties:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

De heuristiek maakt een voorstel op basis van de meest recente overeenkomende gebruikersinstructie. Ze gebruikt onderwerphints om Skill-namen te kiezen voor veelvoorkomende workflows:

- geanimeerde GIF-taken -> `animated-gif-workflow`
- screenshot- of asset-taken -> `screenshot-asset-workflow`
- QA- of scenariotaken -> `qa-scenario-workflow`
- GitHub PR-taken -> `github-pr-workflow`
- fallback -> `learned-workflows`

Heuristische capture is bewust smal. Het is bedoeld voor duidelijke correcties en herhaalbare procesnotities, niet voor algemene transcriptsamenvatting.

### LLM-reviewer

Wanneer `autoCapture` is ingeschakeld en `reviewMode` `llm` of `hybrid` is, voert de plugin een compacte ingebedde reviewer uit nadat drempels zijn bereikt.

De reviewer ontvangt:

- de recente transcripttekst, beperkt tot de laatste 12.000 tekens
- maximaal 12 bestaande workspace-Skills
- maximaal 2.000 tekens uit elke bestaande Skill
- instructies die alleen JSON toestaan

De reviewer heeft geen tools:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

De reviewer retourneert ofwel `{ "action": "none" }` of één voorstel. Het veld `action` is `create`, `append` of `replace` — geef de voorkeur aan `append`/`replace` wanneer er al een relevante Skill bestaat; gebruik `create` alleen wanneer geen bestaande Skill past.

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

Wachtende en in quarantaine geplaatste voorstellen worden gededupliceerd op skillnaam en wijzigingspayload. De opslag bewaart de nieuwste wachtende/in quarantaine geplaatste voorstellen tot maximaal `maxPending`.

## Toolreferentie

De plugin registreert één agenttool:

```text
skill_workshop
```

### `status`

Tel voorstellen per status voor de actieve werkruimte.

```json
{ "action": "status" }
```

Resultaatstructuur:

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

Maak een lijst van wachtende voorstellen.

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

Maak een lijst van in quarantaine geplaatste voorstellen.

```json
{ "action": "list_quarantine" }
```

Gebruik dit wanneer automatische vastlegging niets lijkt te doen en de logboeken
`skill-workshop: quarantined <skill>` vermelden.

### `inspect`

Haal een voorstel op aan de hand van de id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Maak een voorstel aan. Met `approvalPolicy: "pending"` (standaard) wordt dit in de wachtrij geplaatst in plaats van geschreven.

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
  <Accordion title="Force a safe write (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

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

  <Accordion title="Append to a named section">

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

  <Accordion title="Replace exact text">

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

Toegestane ondersteuningsmappen op het hoogste niveau:

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

Ondersteuningsbestanden zijn werkruimte-gebonden, pad-gecontroleerd, byte-beperkt door
`maxSkillBytes`, gescand en atomair geschreven.

## Skill-schrijfacties

Skill Workshop schrijft alleen onder:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill-namen worden genormaliseerd:

- omgezet naar kleine letters
- reeksen die niet `[a-z0-9_-]` zijn worden `-`
- niet-alfanumerieke tekens aan het begin/einde worden verwijderd
- maximale lengte is 80 tekens
- uiteindelijke naam moet overeenkomen met `[a-z0-9][a-z0-9_-]{1,79}`

Voor `create`:

- als de skill niet bestaat, schrijft Skill Workshop een nieuwe `SKILL.md`
- als deze al bestaat, voegt Skill Workshop de body toe aan `## Workflow`

Voor `append`:

- als de skill bestaat, voegt Skill Workshop toe aan de aangevraagde sectie
- als deze niet bestaat, maakt Skill Workshop een minimale skill en voegt daarna toe

Voor `replace`:

- de skill moet al bestaan
- `oldText` moet exact aanwezig zijn
- alleen de eerste exacte overeenkomst wordt vervangen

Alle schrijfacties zijn atomair en verversen de in-memory skills-snapshot meteen, zodat
de nieuwe of bijgewerkte skill zichtbaar kan worden zonder een Gateway-herstart.

## Veiligheidsmodel

Skill Workshop heeft een veiligheidsscanner voor gegenereerde `SKILL.md`-inhoud en
ondersteuningsbestanden.

Kritieke bevindingen plaatsen voorstellen in quarantaine:

| Regel-id                               | Blokkeert inhoud die...                                              |
| -------------------------------------- | -------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | de agent vertelt eerdere/hogere instructies te negeren               |
| `prompt-injection-system`              | verwijst naar systeemprompts, ontwikkelaarsberichten of verborgen instructies |
| `prompt-injection-tool`                | aanmoedigt om tooltoestemming/-goedkeuring te omzeilen               |
| `shell-pipe-to-shell`                  | `curl`/`wget` bevat die naar `sh`, `bash` of `zsh` wordt gepiped     |
| `secret-exfiltration`                  | env-/proces-env-gegevens over het netwerk lijkt te verzenden         |

Waarschuwingsbevindingen blijven behouden, maar blokkeren op zichzelf niet:

| Regel-id             | Waarschuwt bij...                    |
| -------------------- | ------------------------------------ |
| `destructive-delete` | brede opdrachten in `rm -rf`-stijl   |
| `unsafe-permissions` | permissiegebruik in `chmod 777`-stijl |

Voorstellen in quarantaine:

- behouden `scanFindings`
- behouden `quarantineReason`
- verschijnen in `list_quarantine`
- kunnen niet worden toegepast via `apply`

Om te herstellen van een voorstel in quarantaine, maak je een nieuw veilig voorstel met de
onveilige inhoud verwijderd. Bewerk de store-JSON niet handmatig.

## Promptrichtlijnen

Wanneer ingeschakeld, injecteert Skill Workshop een korte promptsectie die de agent vertelt
`skill_workshop` te gebruiken voor duurzame procedurele herinnering.

De richtlijnen benadrukken:

- procedures, geen feiten/voorkeuren
- correcties van gebruikers
- niet-voor-de-hand-liggende succesvolle procedures
- terugkerende valkuilen
- reparatie van verouderde/dunne/onjuiste skills via append/replace
- herbruikbare procedure opslaan na lange tool-lussen of moeilijke fixes
- korte imperatieve skill-tekst
- geen transcriptdumps

De tekst voor schrijfmodus verandert met `approvalPolicy`:

- pending-modus: suggesties in de wachtrij zetten; alleen toepassen na expliciete goedkeuring
- auto-modus: veilige updates van werkruimte-skills toepassen wanneer ze duidelijk herbruikbaar zijn

## Kosten en runtimegedrag

Heuristische capture roept geen model aan.

LLM-review gebruikt een ingebedde run op het actieve/standaard agentmodel. Deze is
drempelgebaseerd, zodat deze standaard niet bij elke beurt draait.

De reviewer:

- gebruikt waar beschikbaar dezelfde geconfigureerde provider-/modelcontext
- valt terug op runtime-standaarden van de agent
- heeft `reviewTimeoutMs`
- gebruikt lichte bootstrapcontext
- heeft geen tools
- schrijft niets direct
- kan alleen een voorstel uitsturen dat door de normale scanner en het
  goedkeurings-/quarantainepad gaat

Als de reviewer faalt, een time-out krijgt of ongeldige JSON teruggeeft, logt de Plugin een
waarschuwings-/debugbericht en slaat die reviewpass over.

## Bedieningspatronen

Gebruik Skill Workshop wanneer de gebruiker zegt:

- “volgende keer, doe X”
- “vanaf nu, geef de voorkeur aan Y”
- “zorg dat je Z verifieert”
- “sla dit op als workflow”
- “dit duurde even; onthoud het proces”
- “werk de lokale skill hiervoor bij”

Goede skill-tekst:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Slechte skill-tekst:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Redenen waarom de slechte versie niet moet worden opgeslagen:

- transcriptvormig
- niet imperatief
- bevat ruisachtige eenmalige details
- vertelt de volgende agent niet wat te doen

## Debuggen

Controleer of de Plugin is geladen:

```bash
openclaw plugins list --enabled
```

Controleer aantallen voorstellen vanuit een agent-/toolcontext:

```json
{ "action": "status" }
```

Inspecteer openstaande voorstellen:

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
| Tool is niet beschikbaar              | Plugin-vermelding is niet ingeschakeld                                              | `plugins.entries.skill-workshop.enabled` en `openclaw plugins list`  |
| Er verschijnt geen automatisch voorstel | `autoCapture: false`, `reviewMode: "off"` of drempels niet gehaald                 | Configuratie, voorstelstatus, Gateway-logs                           |
| Heuristiek heeft niet gecaptured      | Formulering van gebruiker kwam niet overeen met correctiepatronen                   | Gebruik expliciet `skill_workshop.suggest` of schakel LLM-reviewer in |
| Reviewer heeft geen voorstel gemaakt  | Reviewer gaf `none`, ongeldige JSON terug of kreeg een time-out                     | Gateway-logs, `reviewTimeoutMs`, drempels                            |
| Voorstel wordt niet toegepast         | `approvalPolicy: "pending"`                                                         | `list_pending`, daarna `apply`                                       |
| Voorstel is verdwenen uit pending     | Dubbel voorstel hergebruikt, max-pending pruning, of toegepast/geweigerd/in quarantaine geplaatst | `status`, `list_pending` met statusfilters, `list_quarantine`        |
| Skill-bestand bestaat maar model mist het | Skill-snapshot niet ververst of skill-gating sluit het uit                        | `openclaw skills`-status en geschiktheid van werkruimte-skill        |

Relevante logs:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA-scenario's

Repo-backed QA-scenario's:

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

Het reviewerscenario is bewust afzonderlijk omdat het
`reviewMode: "llm"` inschakelt en de ingebedde reviewerpass uitvoert.

## Wanneer auto-apply niet in te schakelen

Vermijd `approvalPolicy: "auto"` wanneer:

- de werkruimte gevoelige procedures bevat
- de agent aan niet-vertrouwde invoer werkt
- skills worden gedeeld binnen een breed team
- je prompts of scannerregels nog aan het afstemmen bent
- het model vaak vijandige web-/e-mailinhoud verwerkt

Gebruik eerst pending-modus. Schakel pas over naar auto-modus nadat je het soort
skills hebt beoordeeld dat de agent in die werkruimte voorstelt.

## Gerelateerde docs

- [Skills](/nl/tools/skills)
- [Plugins](/nl/tools/plugin)
- [Testen](/nl/reference/test)
