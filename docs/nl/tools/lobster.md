---
read_when:
    - Je wilt deterministische workflows met meerdere stappen en expliciete goedkeuringen
    - Je moet een workflow hervatten zonder eerdere stappen opnieuw uit te voeren
summary: Getypeerde workflowruntime voor OpenClaw met hervatbare goedkeuringsgates.
title: Kreeft
x-i18n:
    generated_at: "2026-05-07T13:27:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster is een workflowshell waarmee OpenClaw meerstaps toolreeksen kan uitvoeren als één enkele, deterministische bewerking met expliciete goedkeuringscontrolepunten.

Lobster is één authoring-laag boven losgekoppeld achtergrondwerk. Zie [Task Flow](/nl/automation/taskflow) (`openclaw tasks flow`) voor floworkestratie boven afzonderlijke taken. Zie [`openclaw tasks`](/nl/automation/tasks) voor het activiteitenlogboek van taken.

## Hook

Je assistant kan de tools bouwen die zichzelf beheren. Vraag om een workflow en 30 minuten later heb je een CLI plus pipelines die als één aanroep draaien. Lobster is het ontbrekende stuk: deterministische pipelines, expliciete goedkeuringen en hervatbare status.

## Waarom

Tegenwoordig vereisen complexe workflows veel heen-en-weer toolaanroepen. Elke aanroep kost tokens, en de LLM moet elke stap orkestreren. Lobster verplaatst die orkestratie naar een typed runtime:

- **Eén aanroep in plaats van veel**: OpenClaw voert één Lobster-toolangeroep uit en krijgt een gestructureerd resultaat.
- **Goedkeuringen ingebouwd**: Neveneffecten (e-mail verzenden, opmerking plaatsen) pauzeren de workflow tot ze expliciet zijn goedgekeurd.
- **Hervatbaar**: Gepauzeerde workflows retourneren een token; keur goed en hervat zonder alles opnieuw uit te voeren.

## Waarom een DSL in plaats van gewone programma's?

Lobster is bewust klein. Het doel is niet "een nieuwe taal", maar een voorspelbare, AI-vriendelijke pipelinespecificatie met eersteklas goedkeuringen en hervattokens.

- **Goedkeuren/hervatten is ingebouwd**: Een normaal programma kan een mens om invoer vragen, maar het kan niet _pauzeren en hervatten_ met een duurzame token zonder dat je die runtime zelf bedenkt.
- **Determinisme + controleerbaarheid**: Pipelines zijn data, dus ze zijn eenvoudig te loggen, diffen, opnieuw af te spelen en te beoordelen.
- **Beperkt oppervlak voor AI**: Een kleine grammatica + JSON-piping vermindert "creatieve" codepaden en maakt validatie realistisch.
- **Veiligheidsbeleid ingebakken**: Time-outs, outputlimieten, sandboxcontroles en allowlists worden afgedwongen door de runtime, niet door elk script.
- **Nog steeds programmeerbaar**: Elke stap kan elke CLI of elk script aanroepen. Als je JS/TS wilt, genereer dan `.lobster`-bestanden vanuit code.

## Hoe het werkt

OpenClaw voert Lobster-workflows **in-process** uit met een embedded runner. Er wordt geen extern CLI-subproces gestart; de workflowengine draait binnen het Gateway-proces en retourneert direct een JSON-envelope.
Als de pipeline pauzeert voor goedkeuring, retourneert de tool een `resumeToken` zodat je later kunt doorgaan.

## Patroon: kleine CLI + JSON-pipes + goedkeuringen

Bouw kleine commando's die JSON spreken en koppel ze daarna in één Lobster-aanroep. (Voorbeeldcommandonamen hieronder - vervang ze door je eigen namen.)

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

Als de pipeline om goedkeuring vraagt, hervat je met de token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI triggert de workflow; Lobster voert de stappen uit. Goedkeuringspoorten houden neveneffecten expliciet en controleerbaar.

Voorbeeld: invoeritems omzetten naar toolaanroepen:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON-only LLM-stappen (llm-task)

Voor workflows die een **gestructureerde LLM-stap** nodig hebben, schakel je de optionele
`llm-task` plugin-tool in en roep je die aan vanuit Lobster. Zo blijft de workflow
deterministisch terwijl je toch kunt classificeren/samenvatten/opstellen met een model.

Schakel de tool in:

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

### Belangrijke beperking: embedded Lobster versus `openclaw.invoke`

De gebundelde Lobster-plugin voert workflows **in-process** uit binnen de gateway. In die embedded modus erft `openclaw.invoke` **niet** automatisch een gateway-URL/authcontext voor geneste OpenClaw CLI-toolangeroepen.

Dat betekent dat dit patroon **momenteel niet betrouwbaar is in de embedded runner**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Gebruik het onderstaande voorbeeld alleen wanneer je de **zelfstandige Lobster CLI** uitvoert in een omgeving waarin `openclaw.invoke` al is geconfigureerd met de juiste gateway/authcontext.

Gebruik het in een zelfstandige Lobster CLI-pipeline:

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

Als je vandaag de embedded Lobster-plugin gebruikt, geef dan de voorkeur aan:

- een directe `llm-task`-toolaanroep buiten Lobster, of
- niet-`openclaw.invoke`-stappen binnen de Lobster-pipeline totdat een ondersteunde embedded bridge is toegevoegd.

Zie [LLM Task](/nl/tools/llm-task) voor details en configuratieopties.

## Workflowbestanden (.lobster)

Lobster kan YAML/JSON-workflowbestanden uitvoeren met de velden `name`, `args`, `steps`, `env`, `condition` en `approval`. Stel in OpenClaw-toolangeroepen `pipeline` in op het bestandspad.

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

Notities:

- `stdin: $step.stdout` en `stdin: $step.json` geven de output van een eerdere stap door.
- `condition` (of `when`) kan stappen poorten op `$step.approved`.

## Lobster installeren

Gebundelde Lobster-workflows draaien in-process; er is geen afzonderlijke `lobster`-binary vereist. De embedded runner wordt meegeleverd met de Lobster-plugin.

Als je de zelfstandige Lobster CLI nodig hebt voor ontwikkeling of externe pipelines, installeer die dan vanuit de [Lobster-repo](https://github.com/openclaw/lobster) en zorg dat `lobster` op `PATH` staat.

## De tool inschakelen

Lobster is een **optionele** plugin-tool (standaard niet ingeschakeld).

Aanbevolen (additief, veilig):

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

Gebruik liever geen `tools.allow: ["lobster"]`, tenzij je bewust in restrictieve allowlist-modus wilt draaien.

<Note>
Allowlists zijn opt-in voor optionele plugins. `alsoAllow` schakelt alleen de genoemde optionele plugin-tools in en behoudt de normale kernset tools. Gebruik `tools.allow` met de gewenste kerntools of groepen om kerntools te beperken.
</Note>

## Voorbeeld: e-mailtriage

Zonder Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Met Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Retourneert een JSON-envelope (ingekort):

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

Gebruiker keurt goed → hervatten:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Eén workflow. Deterministisch. Veilig.

## Toolparameters

### `run`

Voer een pipeline uit in toolmodus.

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

### `resume`

Ga door met een gepauzeerde workflow na goedkeuring.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Optionele invoer

- `cwd`: Relatieve werkmap voor de pipeline (moet binnen de werkmap van de gateway blijven).
- `timeoutMs`: Breek de workflow af als deze deze duur overschrijdt (standaard: 20000).
- `maxStdoutBytes`: Breek de workflow af als de output deze grootte overschrijdt (standaard: 512000).
- `argsJson`: JSON-string die wordt doorgegeven aan `lobster run --args-json` (alleen workflowbestanden).

## Output-envelope

Lobster retourneert een JSON-envelope met een van drie statussen:

- `ok` → succesvol voltooid
- `needs_approval` → gepauzeerd; `requiresApproval.resumeToken` is vereist om te hervatten
- `cancelled` → expliciet geweigerd of geannuleerd

De tool toont de envelope in zowel `content` (mooie JSON) als `details` (ruw object).

## Goedkeuringen

Als `requiresApproval` aanwezig is, inspecteer dan de prompt en beslis:

- `approve: true` → hervat en ga door met neveneffecten
- `approve: false` → annuleer en rond de workflow af

Gebruik `approve --preview-from-stdin --limit N` om een JSON-preview aan goedkeuringsverzoeken toe te voegen zonder aangepaste jq/heredoc-lijm. Hervattokens zijn nu compact: Lobster slaat de hervatstatus van workflows op onder zijn statusmap en geeft een kleine tokensleutel terug.

## OpenProse

OpenProse past goed bij Lobster: gebruik `/prose` om voorbereiding met meerdere agents te orkestreren en voer daarna een Lobster-pipeline uit voor deterministische goedkeuringen. Als een Prose-programma Lobster nodig heeft, sta de `lobster`-tool voor subagents toe via `tools.subagents.tools`. Zie [OpenProse](/nl/prose).

## Veiligheid

- **Alleen lokaal in-process** - workflows worden uitgevoerd binnen het Gateway-proces; geen netwerkoproepen vanuit de plugin zelf.
- **Geen secrets** - Lobster beheert geen OAuth; het roept OpenClaw-tools aan die dat doen.
- **Sandbox-bewust** - uitgeschakeld wanneer de toolcontext in een sandbox draait.
- **Verhard** - time-outs en outputlimieten worden afgedwongen door de embedded runner.

## Probleemoplossing

- **`lobster timed out`** → verhoog `timeoutMs` of splits een lange pipeline.
- **`lobster output exceeded maxStdoutBytes`** → verhoog `maxStdoutBytes` of verklein de output.
- **`lobster returned invalid JSON`** → zorg dat de pipeline in toolmodus draait en alleen JSON afdrukt.
- **`lobster failed`** → controleer de gatewaylogs voor foutdetails van de embedded runner.

## Meer informatie

- [Plugins](/nl/tools/plugin)
- [Plugin-toolauthoring](/nl/plugins/building-plugins#registering-agent-tools)

## Casestudy: communityworkflows

Eén openbaar voorbeeld: een "second brain"-CLI + Lobster-pipelines die drie Markdown-vaults beheren (persoonlijk, partner, gedeeld). De CLI geeft JSON uit voor statistieken, inboxvermeldingen en scans op verouderde items; Lobster koppelt die commando's tot workflows zoals `weekly-review`, `inbox-triage`, `memory-consolidation` en `shared-task-sync`, elk met goedkeuringspoorten. AI verzorgt beoordeling (categorisatie) wanneer beschikbaar en valt terug op deterministische regels wanneer dat niet zo is.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Gerelateerd

- [Automation & Tasks](/nl/automation) - Lobster-workflows plannen
- [Automation Overview](/nl/automation) - alle automatiseringsmechanismen
- [Tools Overview](/nl/tools) - alle beschikbare agent-tools
