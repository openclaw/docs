---
read_when:
    - Autonome agentworkflows instellen die zonder prompts per taak worden uitgevoerd
    - Bepalen wat de agent zelfstandig kan doen en waarvoor menselijke goedkeuring nodig is
    - Multi-programma-agents structureren met duidelijke grenzen en escalatieregels
summary: Definieer permanente operationele bevoegdheid voor autonome agentprogramma's
title: Vaste instructies
x-i18n:
    generated_at: "2026-05-06T09:02:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04e871bbd3f51b50ce162576936d4b37acbdc5a94edcd73e390adc784465aa4
    source_path: automation/standing-orders.md
    workflow: 16
---

Vaste opdrachten geven je agent **permanente operationele bevoegdheid** voor gedefinieerde programma's. In plaats van telkens afzonderlijke taakopdrachten te geven, definieer je programma's met een duidelijke scope, triggers en escalatieregels - en de agent voert ze autonoom uit binnen die grenzen.

Dit is het verschil tussen je assistent elke vrijdag vertellen "stuur het wekelijkse rapport" en vaste bevoegdheid geven: "Jij beheert het wekelijkse rapport. Stel het elke vrijdag samen, verstuur het en escaleer alleen als er iets verkeerd lijkt."

## Waarom vaste opdrachten

**Zonder vaste opdrachten:**

- Je moet de agent voor elke taak prompten
- De agent blijft inactief tussen verzoeken
- Routinematig werk wordt vergeten of vertraagd
- Jij wordt de bottleneck

**Met vaste opdrachten:**

- De agent voert autonoom uit binnen gedefinieerde grenzen
- Routinematig werk gebeurt volgens planning zonder prompting
- Je wordt alleen betrokken bij uitzonderingen en goedkeuringen
- De agent vult inactieve tijd productief

## Hoe ze werken

Vaste opdrachten worden gedefinieerd in de bestanden van je [agentwerkruimte](/nl/concepts/agent-workspace). De aanbevolen aanpak is om ze direct op te nemen in `AGENTS.md` (dat elke sessie automatisch wordt geïnjecteerd), zodat de agent ze altijd in context heeft. Voor grotere configuraties kun je ze ook in een speciaal bestand plaatsen, zoals `standing-orders.md`, en daarnaar verwijzen vanuit `AGENTS.md`.

Elk programma specificeert:

1. **Scope** - wat de agent mag doen
2. **Triggers** - wanneer er moet worden uitgevoerd (planning, gebeurtenis of voorwaarde)
3. **Goedkeuringspoorten** - waarvoor menselijke goedkeuring nodig is voordat er wordt gehandeld
4. **Escalatieregels** - wanneer er moet worden gestopt en om hulp moet worden gevraagd

De agent laadt deze instructies elke sessie via de bootstrapbestanden van de werkruimte (zie [Agentwerkruimte](/nl/concepts/agent-workspace) voor de volledige lijst met automatisch geïnjecteerde bestanden) en voert ze uit, gecombineerd met [Cron jobs](/nl/automation/cron-jobs) voor tijdgebaseerde afdwinging.

<Tip>
Plaats vaste opdrachten in `AGENTS.md` om te garanderen dat ze elke sessie worden geladen. De werkruimtebootstrap injecteert automatisch `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` en `MEMORY.md` - maar geen willekeurige bestanden in submappen.
</Tip>

## Anatomie van een vaste opdracht

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad - report accurately
```

## Vaste opdrachten plus Cron jobs

Vaste opdrachten definiëren **wat** de agent mag doen. [Cron jobs](/nl/automation/cron-jobs) definiëren **wanneer** het gebeurt. Ze werken samen:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

De prompt van de Cron job moet naar de vaste opdracht verwijzen in plaats van deze te dupliceren:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Voorbeelden

### Voorbeeld 1: content en sociale media (wekelijkse cyclus)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday-Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Voorbeeld 2: financiële werkzaamheden (gebeurtenisgestuurd)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When new data arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Voorbeeld 3: monitoring en waarschuwingen (continu)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Patroon uitvoeren-verifiëren-rapporteren

Vaste opdrachten werken het best wanneer ze worden gecombineerd met strikte uitvoeringsdiscipline. Elke taak in een vaste opdracht moet deze lus volgen:

1. **Uitvoeren** - Doe het daadwerkelijke werk (erken de instructie niet alleen)
2. **Verifiëren** - Bevestig dat het resultaat correct is (bestand bestaat, bericht afgeleverd, data geparset)
3. **Rapporteren** - Vertel de eigenaar wat is gedaan en wat is geverifieerd

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Dit patroon voorkomt de meest voorkomende faalmodus van agents: een taak erkennen zonder deze af te ronden.

## Multiprogramma-architectuur

Voor agents die meerdere aandachtsgebieden beheren, organiseer je vaste opdrachten als afzonderlijke programma's met duidelijke grenzen:

```markdown
## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

Elk programma moet hebben:

- Een eigen **triggercadans** (wekelijks, maandelijks, gebeurtenisgestuurd, continu)
- Eigen **goedkeuringspoorten** (sommige programma's hebben meer toezicht nodig dan andere)
- Duidelijke **grenzen** (de agent moet weten waar het ene programma eindigt en het andere begint)

## Best practices

### Doen

- Begin met beperkte bevoegdheid en breid uit naarmate het vertrouwen groeit
- Definieer expliciete goedkeuringspoorten voor risicovolle acties
- Neem secties "Wat NIET te doen" op - grenzen zijn net zo belangrijk als machtigingen
- Combineer met Cron jobs voor betrouwbare tijdgebaseerde uitvoering
- Bekijk agentlogs wekelijks om te controleren of vaste opdrachten worden gevolgd
- Werk vaste opdrachten bij naarmate je behoeften veranderen - het zijn levende documenten

### Vermijden

- Op dag één brede bevoegdheid geven ("doe wat jij het beste vindt")
- Escalatieregels overslaan - elk programma heeft een clausule nodig voor "wanneer stoppen en vragen"
- Aannemen dat de agent mondelinge instructies onthoudt - zet alles in het bestand
- Aandachtsgebieden mengen in één programma - afzonderlijke programma's voor afzonderlijke domeinen
- Vergeten af te dwingen met Cron jobs - vaste opdrachten zonder triggers worden suggesties

## Gerelateerd

- [Automatisering en taken](/nl/automation): alle automatiseringsmechanismen in één overzicht.
- [Cron jobs](/nl/automation/cron-jobs): planningsafdwinging voor vaste opdrachten.
- [Hooks](/nl/automation/hooks): gebeurtenisgestuurde scripts voor levenscyclusgebeurtenissen van agents.
- [Webhooks](/nl/automation/cron-jobs#webhooks): inkomende HTTP-gebeurtenistriggers.
- [Agentwerkruimte](/nl/concepts/agent-workspace): waar vaste opdrachten staan, inclusief de volledige lijst met automatisch geïnjecteerde bootstrapbestanden (`AGENTS.md`, `SOUL.md`, enz.).
