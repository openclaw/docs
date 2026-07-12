---
read_when:
    - Je wilt deterministische workflows met meerdere stappen en expliciete goedkeuringen
    - Je moet een workflow hervatten zonder eerdere stappen opnieuw uit te voeren
summary: Getypeerde workflowruntime voor OpenClaw met hervatbare goedkeuringspoorten.
title: Kreeft
x-i18n:
    generated_at: "2026-07-12T09:29:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster voert toolpijplijnen met meerdere stappen uit als één deterministische toolaanroep, met
expliciete goedkeuringscontrolepunten en hervattingstokens. Het bevindt zich één laag boven
losgekoppeld achtergrondwerk: voor het orkestreren van stromen over veel losgekoppelde taken,
zie [Task Flow](/nl/automation/taskflow) (`openclaw tasks flow`); voor het
activiteitenlogboek van taken, zie [Achtergrondtaken](/nl/automation/tasks).

## Waarom

Zonder Lobster vereist een taak met meerdere stappen veel heen-en-weergaande toolaanroepen, waarbij het
model elke stap orkestreert. Lobster verplaatst die orkestratie naar een getypeerde
runtime:

- **Eén aanroep in plaats van veel**: één Lobster-toolaanroep retourneert een gestructureerd
  resultaat voor de volledige pijplijn.
- **Ingebouwde goedkeuringen**: neveneffecten (verzenden, plaatsen, verwijderen) stoppen de workflow
  totdat ze expliciet zijn goedgekeurd.
- **Hervatbaar**: een gestopte workflow retourneert een token; keur goed en hervat zonder
  eerdere stappen opnieuw uit te voeren.

Lobster is een kleine, beperkte DSL en geen algemene scripttaal:
goedkeuren/hervatten is een duurzame, ingebouwde primitieve bewerking; pijplijnen zijn gegevens (eenvoudig te
loggen, vergelijken, opnieuw afspelen en beoordelen); de kleine grammatica beperkt 'creatieve' codepaden, zodat
validatie realistisch blijft; time-outs, uitvoerlimieten, sandboxcontroles en
toegestane lijsten worden afgedwongen door de runtime, niet door elk script. Elke stap kan nog steeds
elke CLI of elk script aanroepen; genereer desgewenst `.lobster`-bestanden met andere hulpmiddelen als u
een uitgebreidere auteurstaal wilt.

Zonder Lobster ziet terugkerende e-mailtriage er als volgt uit:

```text
Gebruiker: "Controleer mijn e-mail en stel antwoorden op"
→ openclaw roept gmail.list aan
→ LLM vat samen
→ Gebruiker: "stel antwoorden op voor #2 en #5"
→ LLM stelt antwoorden op
→ Gebruiker: "verzend #2"
→ openclaw roept gmail.send aan
(dagelijks herhalen, zonder geheugen van wat is getrieerd)
```

Met Lobster bestaat dezelfde taak uit één aanroep die stopt voor goedkeuring en daarna wordt hervat:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## Hoe het werkt

OpenClaw voert Lobster-workflows **in het proces** uit met het gebundelde
pakket `@clawdbot/lobster` als ingebedde runner. Er wordt geen extern `lobster`-
subproces gestart; de toolaanroep retourneert rechtstreeks een JSON-envelop. Als de
pijplijn stopt voor goedkeuring, bevat de envelop een hervattingstoken (of een korte
goedkeurings-ID), zodat u later kunt doorgaan.

## Inschakelen

Lobster is een **optionele** Plugin-tool en is niet standaard ingeschakeld. Deze wordt
gebundeld geleverd, dus er is geen afzonderlijke installatiestap nodig; sta de tool eenvoudig toe:

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Of per agent:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

<Note>
`alsoAllow` voegt `lobster` toe boven op het actieve toolprofiel zonder
andere kerntools te beperken. Gebruik `tools.allow` alleen als u in plaats daarvan een beperkende modus met een
toegestane lijst wilt.
</Note>

De tool is volledig uitgeschakeld voor toolcontexten in een sandbox.

Als u de zelfstandige Lobster CLI nodig hebt voor ontwikkeling of externe pijplijnen
(buiten de ingebedde Gateway-runner), installeert u deze vanuit de
[Lobster-repository](https://github.com/openclaw/lobster) en plaatst u `lobster` in
`PATH`.

## Patroon: kleine CLI + JSON-pijpen + goedkeuringen

Bouw kleine opdrachten die JSON gebruiken en koppel ze vervolgens tot één Lobster-aanroep.
(Onderstaande voorbeeldopdrachten kunt u vervangen door uw eigen opdrachten.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Als de pijplijn om goedkeuring vraagt, hervat u deze met het token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Voorbeeld: wijs invoeritems toe aan toolaanroepen:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## LLM-stappen met uitsluitend JSON (llm-task)

Voor een **gestructureerde LLM-stap** binnen een workflow schakelt u de optionele
`llm-task`-Plugin-tool in en roept u deze vanuit Lobster aan:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### Belangrijke beperking: ingebedde Lobster tegenover `openclaw.invoke`

De gebundelde Lobster-Plugin voert workflows **in het proces** uit binnen de Gateway.
In die ingebedde modus neemt `openclaw.invoke` niet automatisch een
Gateway-URL-/authenticatiecontext over voor geneste OpenClaw CLI-toolaanroepen.

Dit betekent dat dit patroon **momenteel niet betrouwbaar is in de ingebedde runner**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Gebruik het onderstaande voorbeeld alleen wanneer u de **zelfstandige Lobster CLI** uitvoert in een
omgeving waarin `openclaw.invoke` al is geconfigureerd met de juiste
Gateway-/authenticatiecontext.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Als u momenteel de ingebedde Lobster-Plugin gebruikt, geeft u de voorkeur aan:

- een rechtstreekse `llm-task`-toolaanroep buiten Lobster, of
- stappen zonder `openclaw.invoke` binnen de Lobster-pijplijn totdat er een ondersteunde
  ingebedde brug is toegevoegd.

Zie [LLM-taak](/nl/tools/llm-task) voor details en configuratieopties.

## Workflowbestanden (.lobster)

Lobster kan YAML-/JSON-workflowbestanden uitvoeren met de velden `name`, `args`, `steps`, `env`,
`condition` en `approval`. Stel `pipeline` in op het bestandspad in de toolaanroep.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Opmerkingen:

- `stdin: $step.stdout` en `stdin: $step.json` geven de uitvoer van een eerdere stap door.
- `condition` (of `when`) kan stappen afhankelijk maken van `$step.approved`.

## Toolparameters

### `run`

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Voer een workflowbestand uit met argumenten:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| Veld             | Standaardwaarde | Opmerkingen                                                                                                  |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | vereist         | Ingesloten pijplijntekenreeks of een pad dat eindigt op `.lobster`/`.yaml`/`.yml`/`.json` voor een workflowbestand. |
| `cwd`            | Gateway-cwd     | Relatieve werkmap; moet binnen de werkmap van de Gateway worden omgezet (absolute paden worden geweigerd).   |
| `timeoutMs`      | `20000`         | Breekt de uitvoering af als deze waarde wordt overschreden.                                                  |
| `maxStdoutBytes` | `512000`        | Breekt de uitvoering af als vastgelegde standaarduitvoer of standaardfoutuitvoer deze grootte overschrijdt. |
| `argsJson`       | -               | JSON-tekenreeks met argumenten voor een workflowbestand (genegeerd voor ingesloten pijplijnen).              |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` accepteert `token` (het volledige hervattingstoken uit `requiresApproval`)
of `approvalId` (de korte ID uit hetzelfde object); gebruik wat de gestopte
uitvoering heeft geretourneerd. `approve` is vereist.

### Beheerde Task Flow-modus

Door `flowControllerId` en `flowGoal` door te geven bij `run` (of `flowId` en
`flowExpectedRevision` bij `resume`), wordt de aanroep via de beheerde
[Task Flow](/nl/automation/taskflow)-API van de Plugin-runtime uitgevoerd in plaats van een
kale envelop te retourneren: OpenClaw maakt een duurzame stroomrecord aan of hervat deze, past de
Lobster-envelop erop toe (`waiting` bij goedkeuring, `succeeded`/`failed` bij
voltooiing) en retourneert `{ ok, envelope, flow, mutation }`. Deze modus vereist
een gekoppelde Task Flow-runtime en is bedoeld voor Plugin-/controllercode die
duurzame stroomstatus nodig heeft tijdens herstarts van de Gateway, niet voor normaal ad-hocgebruik door agents.

## Uitvoerenvelop

Lobster retourneert een JSON-envelop met een van drie statussen:

- `ok` - met succes voltooid
- `needs_approval` - gepauzeerd; `requiresApproval` bevat een `resumeToken` en een
  korte `approvalId`, die beide de uitvoering kunnen hervatten
- `cancelled` - expliciet geweigerd of geannuleerd

De tool stelt de envelop beschikbaar in zowel `content` (opgemaakte JSON) als `details`
(ruw object).

## Goedkeuringen

Als `requiresApproval` aanwezig is, bekijkt u de vraag en beslist u:

- `approve: true` - hervat en ga door met neveneffecten
- `approve: false` - annuleer en voltooi de workflow

Gebruik `approve --preview-from-stdin --limit N` om een JSON-voorbeeld aan
goedkeuringsverzoeken toe te voegen zonder aangepaste jq-/heredoc-koppeling. De hervattingsstatus wordt opgeslagen als
kleine JSON-bestanden in de Lobster-statusmap (standaard `~/.lobster/state`,
te overschrijven met `LOBSTER_STATE_DIR`); het token zelf bevat alleen een
verwijzing naar die status, niet de volledige pijplijnstatus.

## OpenProse

OpenProse werkt goed samen met Lobster: gebruik `/prose` om voorbereiding met meerdere agents te
orkestreren en voer daarna een Lobster-pijplijn uit voor deterministische goedkeuringen. Als een Prose-
programma Lobster nodig heeft, staat u de `lobster`-tool voor subagents toe via
`tools.subagents.tools`. Zie [OpenProse](/nl/prose).

## Veiligheid

- **Alleen lokaal en in het proces** - workflows worden uitgevoerd binnen het Gateway-proces; de
  Plugin zelf voert geen netwerkaanroepen uit.
- **Geen geheimen** - Lobster beheert geen OAuth; het roept OpenClaw-tools aan die
  dat wel doen.
- **Sandboxbewust** - uitgeschakeld wanneer de toolcontext zich in een sandbox bevindt.
- **Versterkt** - time-outs en uitvoerlimieten worden door de ingebedde runner afgedwongen.

## Probleemoplossing

| Fout                                                          | Oorzaak/oplossing                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | De pijplijn heeft `timeoutMs` overschreden. Verhoog de waarde of splits de pijplijn. |
| `lobster stdout exceeded maxStdoutBytes` (of `stderr`)        | De vastgelegde uitvoer heeft de limiet overschreden. Verhoog `maxStdoutBytes` of verminder de uitvoer. |
| `run --args-json must be valid JSON`                          | Het parseren van `argsJson` (uitvoeringen van workflowbestanden) is mislukt. Corrigeer de JSON-tekenreeks. |
| `lobster runtime failed` (of een ander `runtime_error`-bericht) | De ingebedde runtime heeft een foutenvelop geretourneerd. Controleer de Gateway-logboeken voor details. |

## Meer informatie

- [Plugins](/nl/tools/plugin)
- [Plugin-tools maken](/nl/plugins/building-plugins#registering-agent-tools)

## Casestudy: communityworkflows

Een openbaar voorbeeld: een ‘tweede brein’-CLI met Lobster-pijplijnen die drie Markdown-kluizen beheren (persoonlijk, partner, gedeeld). De CLI genereert JSON voor statistieken, inboxoverzichten en scans op verouderde inhoud; Lobster koppelt deze opdrachten tot werkstromen zoals `weekly-review`, `inbox-triage`, `memory-consolidation` en `shared-task-sync`, elk met goedkeuringsmomenten. AI neemt, indien beschikbaar, beslissingen (categorisering) en valt anders terug op deterministische regels.

- Discussie: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repository: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Gerelateerd

- [Automatisering](/nl/automation) - alle automatiseringsmechanismen
- [Overzicht van hulpprogramma's](/nl/tools) - alle beschikbare agenthulpprogramma's
