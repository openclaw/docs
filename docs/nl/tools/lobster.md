---
read_when:
    - U wilt deterministische workflows met meerdere stappen en expliciete goedkeuringen
    - Je moet een workflow hervatten zonder eerdere stappen opnieuw uit te voeren
summary: Getypeerde uitvoeringsomgeving voor workflows in OpenClaw met hervatbare goedkeuringspoorten.
title: Kreeft
x-i18n:
    generated_at: "2026-05-12T01:00:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Lobster is een workflowshell waarmee OpenClaw toolreeksen met meerdere stappen kan uitvoeren als één enkele, deterministische bewerking met expliciete goedkeuringscontrolepunten.

Lobster is één auteurslaag boven losgekoppeld achtergrondwerk. Voor floworkestratie boven individuele taken, zie [Task Flow](/nl/automation/taskflow) (`openclaw tasks flow`). Voor het taakactiviteitenlogboek, zie [`openclaw tasks`](/nl/automation/tasks).

## Hook

Je assistent kan de tools bouwen die zichzelf beheren. Vraag om een workflow en 30 minuten later heb je een CLI plus pijplijnen die als één aanroep draaien. Lobster is het ontbrekende stuk: deterministische pijplijnen, expliciete goedkeuringen en hervatbare status.

## Waarom

Tegenwoordig vereisen complexe workflows veel heen-en-weer toolaanroepen. Elke aanroep kost tokens, en de LLM moet elke stap orkestreren. Lobster verplaatst die orkestratie naar een getypte runtime:

- **Eén aanroep in plaats van veel**: OpenClaw voert één Lobster-toolaanroep uit en krijgt een gestructureerd resultaat.
- **Goedkeuringen ingebouwd**: Neveneffecten (e-mail verzenden, commentaar plaatsen) onderbreken de workflow totdat ze expliciet zijn goedgekeurd.
- **Hervatbaar**: Onderbroken workflows retourneren een token; keur goed en hervat zonder alles opnieuw uit te voeren.

## Waarom een DSL in plaats van gewone programma's?

Lobster is bewust klein. Het doel is niet "een nieuwe taal", maar een voorspelbare, AI-vriendelijke pijplijnspecificatie met eersteklas goedkeuringen en hervattokens.

- **Goedkeuren/hervatten is ingebouwd**: Een normaal programma kan een mens om input vragen, maar het kan niet _pauzeren en hervatten_ met een duurzaam token zonder dat je die runtime zelf uitvindt.
- **Determinisme + controleerbaarheid**: Pijplijnen zijn data, dus ze zijn eenvoudig te loggen, te vergelijken, opnieuw af te spelen en te beoordelen.
- **Begrensd oppervlak voor AI**: Een kleine grammatica + JSON-piping vermindert "creatieve" codepaden en maakt validatie realistisch.
- **Veiligheidsbeleid ingebakken**: Time-outs, uitvoerlimieten, sandboxcontroles en allowlists worden afgedwongen door de runtime, niet door elk script.
- **Nog steeds programmeerbaar**: Elke stap kan elke CLI of elk script aanroepen. Als je JS/TS wilt, genereer dan `.lobster`-bestanden vanuit code.

## Hoe het werkt

OpenClaw voert Lobster-workflows **in-process** uit met een ingebedde runner. Er wordt geen extern CLI-subproces gestart; de workflowengine draait binnen het gatewayproces en retourneert rechtstreeks een JSON-envelope.
Als de pijplijn pauzeert voor goedkeuring, retourneert de tool een `resumeToken` zodat je later kunt doorgaan.

## Patroon: kleine CLI + JSON-pipes + goedkeuringen

Bouw kleine commando's die JSON spreken en koppel ze daarna aan elkaar tot één Lobster-aanroep. (Voorbeeldcommandonamen hieronder - vervang ze door je eigen.)

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

Als de pijplijn om goedkeuring vraagt, hervat je met het token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI activeert de workflow; Lobster voert de stappen uit. Goedkeuringspoorten houden neveneffecten expliciet en controleerbaar.

Voorbeeld: invoeritems omzetten naar toolaanroepen:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## LLM-stappen met alleen JSON (llm-task)

Voor workflows die een **gestructureerde LLM-stap** nodig hebben, schakel je de optionele
`llm-task` Plugin-tool in en roep je deze aan vanuit Lobster. Dit houdt de workflow
deterministisch, terwijl je nog steeds met een model kunt classificeren/samenvatten/opstellen.

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

### Belangrijke beperking: ingebedde Lobster versus `openclaw.invoke`

De meegeleverde Lobster-Plugin voert workflows **in-process** uit binnen de Gateway. In die ingebedde modus erft `openclaw.invoke` **niet** automatisch een Gateway-URL/auth-context voor geneste OpenClaw CLI-toolaanroepen.

Dat betekent dat dit patroon **momenteel niet betrouwbaar is in de ingebedde runner**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Gebruik het onderstaande voorbeeld alleen wanneer je de **zelfstandige Lobster CLI** uitvoert in een omgeving waarin `openclaw.invoke` al is geconfigureerd met de juiste Gateway/auth-context.

Gebruik het in een zelfstandige Lobster CLI-pijplijn:

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

Als je de ingebedde Lobster-Plugin vandaag gebruikt, geef dan de voorkeur aan:

- een rechtstreekse `llm-task`-toolaanroep buiten Lobster, of
- niet-`openclaw.invoke`-stappen binnen de Lobster-pijplijn totdat een ondersteunde ingebedde brug is toegevoegd.

Zie [LLM Task](/nl/tools/llm-task) voor details en configuratieopties.

## Workflowbestanden (.lobster)

Lobster kan YAML/JSON-workflowbestanden uitvoeren met velden `name`, `args`, `steps`, `env`, `condition` en `approval`. Stel in OpenClaw-toolaanroepen `pipeline` in op het bestandspad.

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
- `condition` (of `when`) kan stappen poorten op `$step.approved`.

## Lobster installeren

Meegeleverde Lobster-workflows draaien in-process; er is geen afzonderlijke `lobster`-binary vereist. De ingebedde runner wordt meegeleverd met de Lobster-Plugin.

Als je de zelfstandige Lobster CLI nodig hebt voor ontwikkeling of externe pijplijnen, installeer deze dan vanuit de [Lobster-repo](https://github.com/openclaw/lobster) en zorg dat `lobster` op `PATH` staat.

## De tool inschakelen

Lobster is een **optionele** Plugin-tool (niet standaard ingeschakeld).

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

Vermijd het gebruik van `tools.allow: ["lobster"]` tenzij je in restrictieve allowlist-modus wilt draaien.

<Note>
Allowlists zijn opt-in voor optionele plugins. `alsoAllow` schakelt alleen de genoemde optionele Plugin-tools in, terwijl de normale set kerntools behouden blijft. Om kerntools te beperken, gebruik je `tools.allow` met de kerntools of groepen die je wilt.
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

Retourneert een JSON-envelope (afgekapt):

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

Voer een pijplijn uit in toolmodus.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Voer een workflowbestand uit met args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Ga door met een onderbroken workflow na goedkeuring.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Optionele invoer

- `cwd`: Relatieve werkdirectory voor de pijplijn (moet binnen de werkdirectory van de Gateway blijven).
- `timeoutMs`: Breek de workflow af als deze deze duur overschrijdt (standaard: 20000).
- `maxStdoutBytes`: Breek de workflow af als de uitvoer deze grootte overschrijdt (standaard: 512000).
- `argsJson`: JSON-string doorgegeven aan `lobster run --args-json` (alleen workflowbestanden).

## Uitvoer-envelope

Lobster retourneert een JSON-envelope met een van drie statussen:

- `ok` → succesvol voltooid
- `needs_approval` → gepauzeerd; `requiresApproval.resumeToken` is vereist om te hervatten
- `cancelled` → expliciet geweigerd of geannuleerd

De tool toont de envelope zowel in `content` (mooie JSON) als in `details` (ruw object).

## Goedkeuringen

Als `requiresApproval` aanwezig is, inspecteer je de prompt en beslis je:

- `approve: true` → hervat en ga door met neveneffecten
- `approve: false` → annuleer en finaliseer de workflow

Gebruik `approve --preview-from-stdin --limit N` om een JSON-preview aan goedkeuringsverzoeken toe te voegen zonder aangepaste jq/heredoc-lijm. Hervattokens zijn nu compact: Lobster slaat de hervatstatus van workflows op onder zijn statusdirectory en geeft een kleine tokensleutel terug.

## OpenProse

OpenProse werkt goed samen met Lobster: gebruik `/prose` om voorbereiding met meerdere agents te orkestreren en voer daarna een Lobster-pijplijn uit voor deterministische goedkeuringen. Als een Prose-programma Lobster nodig heeft, sta dan de `lobster`-tool toe voor subagents via `tools.subagents.tools`. Zie [OpenProse](/nl/prose).

## Veiligheid

- **Alleen lokaal in-process** - workflows worden uitgevoerd binnen het gatewayproces; geen netwerkoproepen vanuit de Plugin zelf.
- **Geen geheimen** - Lobster beheert geen OAuth; het roept OpenClaw-tools aan die dat wel doen.
- **Sandbox-bewust** - uitgeschakeld wanneer de toolcontext in een sandbox draait.
- **Verhard** - time-outs en uitvoerlimieten worden afgedwongen door de ingebedde runner.

## Probleemoplossing

- **`lobster timed out`** → verhoog `timeoutMs` of splits een lange pijplijn.
- **`lobster output exceeded maxStdoutBytes`** → verhoog `maxStdoutBytes` of verklein de uitvoer.
- **`lobster returned invalid JSON`** → zorg dat de pijplijn in toolmodus draait en alleen JSON afdrukt.
- **`lobster failed`** → controleer Gateway-logs voor foutdetails van de ingebedde runner.

## Meer informatie

- [Plugins](/nl/tools/plugin)
- [Plugin-tooling maken](/nl/plugins/building-plugins#registering-agent-tools)

## Casestudy: communityworkflows

Een openbaar voorbeeld: een "second brain"-CLI + Lobster-pijplijnen die drie Markdown-vaults beheren (persoonlijk, partner, gedeeld). De CLI geeft JSON uit voor statistieken, inboxlijsten en scans op verouderde items; Lobster koppelt die commando's aan elkaar tot workflows zoals `weekly-review`, `inbox-triage`, `memory-consolidation` en `shared-task-sync`, elk met goedkeuringspoorten. AI handelt beoordeling af (categorisering) wanneer beschikbaar en valt terug op deterministische regels wanneer dat niet zo is.

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Gerelateerd

- [Automation](/nl/automation) - Lobster-workflows plannen
- [Automation-overzicht](/nl/automation) - alle automatiseringsmechanismen
- [Tools-overzicht](/nl/tools) - alle beschikbare agenttools
