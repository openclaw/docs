---
read_when:
    - Autonome agentworkflows instellen die zonder prompts per taak worden uitgevoerd
    - Bepalen wat de agent zelfstandig kan doen en waarvoor menselijke goedkeuring nodig is
    - Agents met meerdere programma's structureren met duidelijke grenzen en escalatieregels
summary: Definieer permanente operationele bevoegdheid voor autonome agentprogramma's
title: Doorlopende instructies
x-i18n:
    generated_at: "2026-07-12T08:35:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Doorlopende opdrachten geven je agent **permanente operationele bevoegdheid** voor gedefinieerde programma’s. In plaats van de agent voor elke taak een opdracht te geven, definieer je programma’s met een duidelijke reikwijdte, triggers en escalatieregels, waarna de agent binnen die grenzen autonoom handelt: "Jij bent verantwoordelijk voor het wekelijkse rapport. Stel het elke vrijdag samen, verstuur het en escaleer alleen als er iets niet klopt."

## Waarom doorlopende opdrachten

**Zonder doorlopende opdrachten:** je geeft de agent voor elke taak een opdracht, routinewerk wordt vergeten of vertraagd en jij wordt de bottleneck.

**Met doorlopende opdrachten:** de agent handelt autonoom binnen gedefinieerde grenzen, routinewerk gebeurt volgens planning en je wordt alleen betrokken bij uitzonderingen en goedkeuringen.

## Hoe ze werken

Doorlopende opdrachten worden gedefinieerd in de bestanden van je [agentwerkruimte](/nl/concepts/agent-workspace). De aanbevolen aanpak is om ze rechtstreeks op te nemen in `AGENTS.md` (dat bij elke sessie automatisch wordt geïnjecteerd), zodat de agent ze altijd in de context heeft. Voor grotere configuraties kun je ze ook in een speciaal bestand plaatsen, zoals `standing-orders.md`, en daar vanuit `AGENTS.md` naar verwijzen.

Elk programma specificeert:

1. **Reikwijdte** - waartoe de agent bevoegd is
2. **Triggers** - wanneer het moet worden uitgevoerd (planning, gebeurtenis of voorwaarde)
3. **Goedkeuringspoorten** - waarvoor menselijke goedkeuring vereist is voordat er wordt gehandeld
4. **Escalatieregels** - wanneer de agent moet stoppen en om hulp moet vragen

De agent laadt deze instructies tijdens elke sessie via de bootstrapbestanden van de werkruimte (zie [Agentwerkruimte](/nl/concepts/agent-workspace) voor de volledige lijst met automatisch geïnjecteerde bestanden) en voert ze uit, in combinatie met [Cron-taken](/nl/automation/cron-jobs) voor tijdgebonden uitvoering.

<Tip>
Plaats doorlopende opdrachten in `AGENTS.md` om te garanderen dat ze tijdens elke sessie worden geladen. De bootstrap van de werkruimte injecteert automatisch `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` en `MEMORY.md`, maar geen willekeurige bestanden in submappen.
</Tip>

## Opbouw van een doorlopende opdracht

```markdown
## Programma: Wekelijks statusrapport

**Bevoegdheid:** Gegevens verzamelen, rapport genereren, aan belanghebbenden leveren
**Trigger:** Elke vrijdag om 16.00 uur (afgedwongen via een Cron-taak)
**Goedkeuringspoort:** Geen voor standaardrapporten. Markeer afwijkingen voor menselijke controle.
**Escalatie:** Als een gegevensbron niet beschikbaar is of statistieken ongebruikelijk lijken (>2σ van de norm)

### Uitvoeringsstappen

1. Statistieken ophalen uit geconfigureerde bronnen
2. Vergelijken met de vorige week en doelstellingen
3. Rapport genereren in Reports/weekly/YYYY-MM-DD.md
4. Samenvatting leveren via het geconfigureerde kanaal
5. Voltooiing vastleggen in Agent/Logs/

### Wat je NIET moet doen

- Verstuur geen rapporten naar externe partijen
- Wijzig de brongegevens niet
- Sla de levering niet over als de statistieken slecht lijken; rapporteer nauwkeurig
```

## Doorlopende opdrachten plus Cron-taken

Doorlopende opdrachten definiëren **wat** de agent mag doen. [Cron-taken](/nl/automation/cron-jobs) definiëren **wanneer** dit gebeurt. Ze werken samen:

```text
Doorlopende opdracht: "Jij bent verantwoordelijk voor de dagelijkse triage van het Postvak IN"
    ↓
Cron-taak (dagelijks om 8.00 uur): "Voer de triage van het Postvak IN uit volgens de doorlopende opdrachten"
    ↓
Agent: Leest doorlopende opdrachten → voert stappen uit → rapporteert resultaten
```

De prompt van de Cron-taak moet naar de doorlopende opdracht verwijzen in plaats van deze te dupliceren:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Voer de dagelijkse triage van het Postvak IN uit volgens de doorlopende opdrachten. Controleer e-mail op nieuwe waarschuwingen. Ontleed, categoriseer en bewaar elk item. Rapporteer de samenvatting aan de eigenaar. Escaleer onbekende zaken."
```

## Voorbeelden

### Voorbeeld 1: inhoud en sociale media (wekelijkse cyclus)

```markdown
## Programma: Inhoud en sociale media

**Bevoegdheid:** Inhoud opstellen, berichten inplannen, betrokkenheidsrapporten samenstellen
**Goedkeuringspoort:** Alle berichten vereisen de eerste 30 dagen controle door de eigenaar, daarna permanente goedkeuring
**Trigger:** Wekelijkse cyclus (controle op maandag → concepten halverwege de week → briefing op vrijdag)

### Wekelijkse cyclus

- **Maandag:** Platformstatistieken en publieksbetrokkenheid beoordelen
- **Dinsdag-donderdag:** Berichten voor sociale media opstellen, bloginhoud maken
- **Vrijdag:** Wekelijkse marketingbriefing samenstellen → aan eigenaar leveren

### Inhoudsregels

- De schrijfstijl moet bij het merk passen (zie SOUL.md of de stijlgids van het merk)
- Maak in openbare inhoud nooit bekend dat je AI bent
- Neem statistieken op wanneer die beschikbaar zijn
- Richt je op waarde voor het publiek, niet op zelfpromotie
```

### Voorbeeld 2: financiële activiteiten (gebeurtenisgestuurd)

```markdown
## Programma: Financiële verwerking

**Bevoegdheid:** Transactiegegevens verwerken, rapporten genereren, samenvattingen versturen
**Goedkeuringspoort:** Geen voor analyses. Aanbevelingen vereisen goedkeuring van de eigenaar.
**Trigger:** Nieuw gegevensbestand gedetecteerd OF geplande maandelijkse cyclus

### Wanneer nieuwe gegevens binnenkomen

1. Nieuw bestand in de aangewezen invoermap detecteren
2. Alle transacties ontleden en categoriseren
3. Vergelijken met budgetdoelstellingen
4. Markeren: ongebruikelijke items, overschrijdingen van drempelwaarden, nieuwe terugkerende kosten
5. Rapport genereren in de aangewezen uitvoermap
6. Samenvatting via het geconfigureerde kanaal aan de eigenaar leveren

### Escalatieregels

- Afzonderlijk item > $500: onmiddellijke waarschuwing
- Categorie 20% boven budget: markeren in rapport
- Onherkenbare transactie: eigenaar om categorisering vragen
- Verwerking mislukt na 2 nieuwe pogingen: mislukking rapporteren, niet gokken
```

### Voorbeeld 3: bewaking en waarschuwingen (continu)

```markdown
## Programma: Systeembewaking

**Bevoegdheid:** Systeemstatus controleren, services opnieuw starten, waarschuwingen versturen
**Goedkeuringspoort:** Services automatisch opnieuw starten. Escaleren als opnieuw starten twee keer mislukt.
**Trigger:** Elke Heartbeat-cyclus

### Controles

- Eindpunten voor servicestatus reageren
- Schijfruimte boven drempelwaarde
- Openstaande taken zijn niet verouderd (>24 uur)
- Leveringskanalen zijn operationeel

### Reactiematrix

| Voorwaarde            | Actie                                  | Escaleren?                       |
| --------------------- | -------------------------------------- | -------------------------------- |
| Service niet actief   | Automatisch opnieuw starten            | Alleen als herstart 2x mislukt   |
| Schijfruimte < 10%    | Eigenaar waarschuwen                    | Ja                               |
| Verouderde taak > 24u | Eigenaar eraan herinneren               | Nee                              |
| Kanaal offline        | Vastleggen en volgende cyclus opnieuw proberen | Als het > 2 uur offline is |
```

## Patroon uitvoeren-controleren-rapporteren

Doorlopende opdrachten werken het beste in combinatie met strikte uitvoeringsdiscipline. Elke taak in een doorlopende opdracht moet deze cyclus volgen:

1. **Uitvoeren** - Voer het daadwerkelijke werk uit (bevestig de instructie niet alleen)
2. **Controleren** - Bevestig dat het resultaat correct is (bestand bestaat, bericht geleverd, gegevens ontleed)
3. **Rapporteren** - Vertel de eigenaar wat er is gedaan en wat er is gecontroleerd

```markdown
### Uitvoeringsregels

- Elke taak volgt Uitvoeren-Controleren-Rapporteren. Geen uitzonderingen.
- "Dat doe ik" is geen uitvoering. Doe het en rapporteer daarna.
- "Klaar" zonder controle is niet acceptabel. Bewijs het.
- Als de uitvoering mislukt: probeer het eenmaal opnieuw met een aangepaste aanpak.
- Als het nog steeds mislukt: rapporteer de mislukking met een diagnose. Laat een mislukking nooit onvermeld.
- Blijf nooit onbeperkt opnieuw proberen: maximaal 3 pogingen, daarna escaleren.
```

Dit patroon voorkomt de meest voorkomende foutmodus van een agent: een taak bevestigen zonder deze te voltooien.

## Architectuur met meerdere programma’s

Voor agents die meerdere aandachtsgebieden beheren, organiseer je doorlopende opdrachten als afzonderlijke programma’s met duidelijke grenzen:

```markdown
## Programma 1: [Domein A] (Wekelijks)

...

## Programma 2: [Domein B] (Maandelijks + op aanvraag)

...

## Programma 3: [Domein C] (Indien nodig)

...

## Escalatieregels (Alle programma’s)

- [Gemeenschappelijke escalatiecriteria]
- [Goedkeuringspoorten die voor alle programma’s gelden]
```

Elk programma moet het volgende hebben:

- Een eigen **triggerfrequentie** (wekelijks, maandelijks, gebeurtenisgestuurd, continu)
- Eigen **goedkeuringspoorten** (sommige programma’s vereisen meer toezicht dan andere)
- Duidelijke **grenzen** (de agent moet weten waar het ene programma eindigt en het andere begint)

## Aanbevolen werkwijzen

### Wel doen

- Begin met beperkte bevoegdheid en breid deze uit naarmate het vertrouwen groeit
- Definieer expliciete goedkeuringspoorten voor handelingen met een hoog risico
- Neem secties met "Wat je NIET moet doen" op; grenzen zijn net zo belangrijk als machtigingen
- Combineer met Cron-taken voor betrouwbare tijdgebonden uitvoering
- Controleer wekelijks de agentlogboeken om te verifiëren dat de doorlopende opdrachten worden gevolgd
- Werk doorlopende opdrachten bij naarmate je behoeften veranderen; het zijn levende documenten

### Vermijden

- Geef op de eerste dag geen brede bevoegdheid ("doe wat jij het beste vindt")
- Sla escalatieregels niet over; elk programma heeft een clausule nodig die bepaalt wanneer de agent moet stoppen en om hulp moet vragen
- Ga er niet van uit dat de agent mondelinge instructies onthoudt; zet alles in het bestand
- Meng geen aandachtsgebieden in één programma; gebruik afzonderlijke programma’s voor afzonderlijke domeinen
- Vergeet niet de uitvoering met Cron-taken af te dwingen; doorlopende opdrachten zonder triggers worden suggesties

## Gerelateerd

- [Automatisering](/nl/automation): alle automatiseringsmechanismen in één oogopslag.
- [Cron-taken](/nl/automation/cron-jobs): geplande uitvoering van doorlopende opdrachten.
- [Hooks](/nl/automation/hooks): gebeurtenisgestuurde scripts voor gebeurtenissen in de levenscyclus van agents.
- [Webhooks](/nl/automation/cron-jobs#webhooks): triggers voor inkomende HTTP-gebeurtenissen.
- [Agentwerkruimte](/nl/concepts/agent-workspace): waar doorlopende opdrachten zich bevinden, inclusief de volledige lijst met automatisch geïnjecteerde bootstrapbestanden (`AGENTS.md`, `SOUL.md`, enz.).
