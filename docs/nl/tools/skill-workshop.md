---
read_when:
    - Je wilt dat de agent vanuit de chat een skill maakt of bijwerkt
    - Je moet een gegenereerd concept van een skill beoordelen, toepassen, afwijzen of in quarantaine plaatsen
    - Je configureert goedkeuring, autonomie, opslag of limieten voor Skill Workshop
sidebarTitle: Skill Workshop
summary: Werkruimte-Skills maken en bijwerken via beoordeling in Skill Workshop
title: Skillworkshop
x-i18n:
    generated_at: "2026-07-12T09:30:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop is het beheerde traject van OpenClaw voor het maken en bijwerken van
Skills in de werkruimte. Agents en operators schrijven via dit traject nooit rechtstreeks
naar `SKILL.md` — ze maken een **voorstel** (een concept in afwachting met inhoud,
doelbinding, scannerstatus, hashes en terugdraaimetadata) dat pas een actieve
Skill wordt wanneer het wordt toegepast.

Skill Workshop schrijft uitsluitend Skills in de werkruimte. Het raakt nooit gebundelde,
Plugin-, ClawHub-, extra-root-, beheerde, persoonlijke agent- of systeem-Skills aan.

## Hoe het werkt

- **Eerst een voorstel:** gegenereerde inhoud wordt opgeslagen als `PROPOSAL.md`, niet als
  `SKILL.md`.
- **Toepassen is de enige actieve schrijfbewerking:** maken, bijwerken en herzien wijzigen
  actieve Skills nooit.
- **Beperkt tot de werkruimte:** nieuwe Skills zijn gericht op de hoofdmap `skills/` van de werkruimte; bijwerken
  is alleen toegestaan voor beschrijfbare Skills in de werkruimte.
- **Niet overschrijven:** maken mislukt als de doel-Skill al bestaat.
- **Gebonden aan hash:** bijwerkvoorstellen worden gebonden aan de huidige hash van het doel en worden
  `stale` als de actieve Skill vóór het toepassen verandert.
- **Afgeschermd door scanner:** vóór het schrijven voert toepassen de beveiligingsscanner opnieuw uit.
- **Herstelbaar:** toepassen schrijft terugdraaimetadata voordat actieve bestanden worden gewijzigd.
- **Consistente interfaces:** chat, CLI en Gateway roepen allemaal dezelfde service aan.

## Levenscyclus

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Alleen een voorstel met de status `pending` kan worden herzien, toegepast, afgewezen of in quarantaine geplaatst.

## Levenscyclusbeheer

De Gateway houdt het totale gebruik van Skills bij in de gedeelde statusdatabase. Eenmaal per
dag beoordeelt deze Skills die door Skill Workshop zijn gemaakt en toegepast. Skills die langer dan
30 dagen niet zijn gebruikt, worden `stale`; na 90 dagen worden ze `archived` en
niet opgenomen in nieuwe momentopnamen van agent-Skills. Bestanden van gearchiveerde Skills blijven op
schijf ongewijzigd. Handmatig gemaakte Skills worden nooit beheerd; alleen Skills die via voorstellen
van Skill Workshop zijn gemaakt, vallen onder levenscyclusbeheer.

Vastgezette Skills slaan levenscyclusovergangen over. Een verouderde Skill wordt weer `active`
nadat deze is gebruikt en de volgende opruimronde is uitgevoerd. Gearchiveerde Skills keren alleen terug via
expliciet herstel:

Levenscyclusovergangen en herstel gelden voor nieuwe sessies; actieve sessies behouden
hun huidige momentopname van Skills.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Alle curatoropdrachten accepteren `--json`. De status rapporteert ook deterministische kandidaten
voor overlap, uitsluitend als suggesties; Skills worden nooit samengevoegd en er wordt nooit een model aangeroepen.

## Chat

Vraag de agent om de gewenste Skill; deze roept `skill_workshop` aan en retourneert een
voorstel-id.

### Leren van recent werk

Gebruik `/learn` om het huidige gesprek of benoemde bronnen om te zetten in één
door standaarden gestuurd Skill-voorstel:

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

Zonder verzoek vraagt `/learn` de agent om de herbruikbare werkwijze uit
het huidige gesprek te destilleren. Met een verzoek behandelt de agent paden, URL's, geplakte
notities en verwijzingen naar gesprekken als bronnen, met inachtneming van vereisten voor focus, bereik en
naamgeving. De agent verzamelt de bronnen met de bestaande hulpmiddelen en roept vervolgens
`skill_workshop` aan met `action: "create"`.

Het resulterende voorstel blijft `pending`; `/learn` past het nooit toe. Controleer en
pas het toe via de normale goedkeuringsprocedure of met `openclaw skills workshop`.

Maken:

```text
Maak een Skill met de naam morning-catchup die mijn maandagse inboxroutine uitvoert.
```

Een bestaande Skill in de werkruimte bijwerken:

```text
Werk trip-planning bij zodat ook stoelplattegronden worden gecontroleerd voordat er wordt geboekt.
```

Een voorstel in afwachting iteratief aanpassen:

```text
Toon me het voorstel morning-catchup.
Herzie het zodat ook alles wordt gemarkeerd dat als urgent is aangeduid.
Pas het voorstel morning-catchup toe.
```

Door agents geïnitieerde acties `apply`, `reject` en `quarantine` tonen standaard een
goedkeuringsprompt. Stel `skills.workshop.approvalPolicy` in op `"auto"` om deze over te slaan in
vertrouwde omgevingen.

De prompt vermeldt het voorstel-id en de doel-Skill en toont de beschrijving van het voorstel,
het aantal ondersteuningsbestanden en de grootte van de hoofdtekst. Goedkeuringsverzoeken zijn zo begrensd
dat ze vóór de bewakingstime-out van het agenthulpmiddel worden afgerond. Als vóór het verlopen van
de prompt geen beslissing binnenkomt, wordt de levenscyclusactie niet uitgevoerd: het voorstel blijft in afwachting
en ongewijzigd. Beslis later in de gebruikersinterface van Skill Workshop of voer
`openclaw skills workshop apply|reject|quarantine <proposal-id>` uit. Agents mogen
een verlopen levenscyclusactie niet herhaaldelijk opnieuw proberen.

## CLI

```bash
# Maken
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Dagelijkse inhaalronde voor de inbox: triëren, archiveren, uitlichten, concepten opstellen, plannen" \
  --proposal ./PROPOSAL.md

# Een bestaande Skill in de werkruimte bijwerken
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Weergeven en inspecteren
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Herzien vóór goedkeuring
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Afronden
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicaat"
openclaw skills workshop quarantine <proposal-id> --reason "Beveiligingscontrole vereist"
```

Elke subopdracht accepteert `--agent <id>` (doelwerkruimte; standaard eerst afgeleid van
de huidige werkmap en daarna de standaardagent) en `--json` (gestructureerde uitvoer).
`propose-create`, `propose-update` en `revise` accepteren ook `--goal <text>` en
`--evidence <text>` om de context van het voorstel naast `--proposal` vast te leggen.

## Voorstelinhoud

Zolang het voorstel in afwachting is, wordt het opgeslagen als `PROPOSAL.md` met frontmatter
die alleen voor voorstellen geldt:

```markdown
---
name: "morning-catchup"
description: "Dagelijkse inhaalronde voor de inbox: triëren, archiveren, uitlichten, concepten opstellen, plannen"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Bij het toepassen schrijft Skill Workshop de actieve `SKILL.md` en verwijdert het
de velden die alleen voor voorstellen gelden: `status`, voorstel-`version` en voorstel-`date`.

## Ondersteuningsbestanden

Gebruik `--proposal-dir` wanneer de voorgestelde Skill naast
`PROPOSAL.md` bestanden nodig heeft:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Vrijdagse afsluiting: statistieken, hoogtepunten, drie belangrijkste punten voor volgende week" \
  --proposal-dir ./weekly-update-proposal
```

De map moet `PROPOSAL.md` bevatten. Ondersteuningsbestanden moeten zich bevinden onder
`assets/`, `examples/`, `references/`, `scripts/` of `templates/`. Skill
Workshop scant en hasht ze, slaat ze samen met het voorstel op en schrijft ze pas
naast de actieve `SKILL.md` wanneer het voorstel wordt toegepast.

Afgewezen paden voor ondersteuningsbestanden: absolute paden, verborgen padsegmenten, padtraversal,
overlappende paden, uitvoerbare bestanden, tekst die niet UTF-8 is, nullbytes
en paden buiten de standaardmappen voor ondersteuning.

## Agenthulpmiddel

Het model gebruikt `skill_workshop` met één verplichte `action`:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Andere parameters zijn van toepassing afhankelijk van de actie:

| Parameter                  | Gebruikt door                                         | Opmerkingen                                                                   |
| -------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Vereist voor `create`; anders wordt een voorstel in afwachting op naam gevonden |
| `description`              | `create`, `update`, `revise`                         | Maximaal 160 bytes                                                            |
| `skill_name`               | `update`                                             | Naam of sleutel van een bestaande Skill                                       |
| `proposal_content`         | `create`, `update`, `revise`                         | Opgeslagen als `PROPOSAL.md`; begrensd door `skills.workshop.maxSkillBytes`   |
| `support_files`            | `create`, `update`, `revise`                         | Matrix van `{ path, content }`                                                 |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Context in vrije tekst                                                        |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Doelvoorstel                                                                  |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Optioneel                                                                     |
| `query`, `status`, `limit` | `list`                                               | Filteren/pagineren; `limit` maximaal 50, standaard 20                          |

Agents moeten `skill_workshop` gebruiken voor gegenereerd werk aan Skills. Ze mogen
geen voorstelbestanden maken of wijzigen via `write`, `edit`, `exec`, shellopdrachten
of rechtstreekse bestandssysteembewerkingen.

<Note>
`skill_workshop` is een ingebouwd agenthulpmiddel en is opgenomen in
`tools.profile: "coding"`. Als een strenger beleid het verbergt, voeg dan
`skill_workshop` toe aan de actieve lijst `tools.allow`, of gebruik
`tools.alsoAllow: ["skill_workshop"]` wanneer het bereik een profiel gebruikt zonder een
expliciete `tools.allow`. In sandbox uitgevoerde sessies maken het hostzijdige
Skill Workshop-hulpmiddel niet aan; voer beoordelingsacties voor voorstellen daarom uit vanuit een normale
hostzijdige agentsessie of via de CLI.
</Note>

## Voorgestelde Skills

OpenClaw detecteert duurzame instructies zoals “de volgende keer”, “onthoud dat” en reactieve correcties
wanneer een interactieve beurt eindigt, ook bij mislukte beurten. Bij de volgende beurt biedt de agent aan
om de meest recent gedetecteerde werkwijze via `skill_workshop` op te slaan; de gebruiker beslist of er een
voorstel wordt gemaakt. Deze ingebouwde suggestie maakt of wijzigt uit zichzelf geen Skill. Schakel
`skills.workshop.autonomous.enabled` in om in plaats daarvan rechtstreeks voorstellen in afwachting te maken.

## Goedkeuring en autonomie

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Instelling                  | Standaard    | Effect                                                                                                                                                                          |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`      | Maakt rechtstreeks voorstellen in afwachting in plaats van bij de volgende beurt de meest recent gedetecteerde werkwijze aan te bieden.                                        |
| `allowSymlinkTargetWrites` | `false`      | Staat toe dat toepassen via symbolische koppelingen naar Skills in de werkruimte schrijft wanneer het werkelijke doel is opgenomen in `skills.load.allowSymlinkTargets`.       |
| `approvalPolicy`           | `"pending"`  | `"pending"` vereist een goedkeuringsprompt vóór door agents geïnitieerde acties `apply`, `reject` of `quarantine`. `"auto"` slaat de prompt over (de agent moet de actie nog steeds aanroepen). |
| `maxPending`               | `50`         | Begrenst voorstellen in afwachting en in quarantaine per werkruimte (1-200).                                                                                                   |
| `maxSkillBytes`            | `40000`      | Begrenst de grootte van de hoofdtekst van het voorstel in bytes (1024-200000).                                                                                                 |

Autonome vastlegging herkent prospectieve regels (bijvoorbeeld “vanaf nu”) en reactieve
correcties (bijvoorbeeld “dat is niet wat ik vroeg”). Nieuwe instructies worden per onderwerp gegroepeerd in maximaal
drie voorstellen per beurt, overeenkomsten in woordgebruik worden doorgestuurd naar bestaande beschrijfbare Skills in de werkruimte en
een eigen voorstel in afwachting wordt herzien wanneer een andere correctie op dezelfde Skill is gericht.

Voorstelbeschrijvingen zijn altijd begrensd op 160 bytes, onafhankelijk van
`maxSkillBytes`.

## Gateway-methoden

| Methode                            | Bereik           |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` is alleen beschikbaar via de Gateway (zonder equivalent in de CLI of agenttool): de methode
stuurt vrije revisie-instructies door naar de chatsessie van de verantwoordelijke agent,
in plaats van `PROPOSAL.md` rechtstreeks te vervangen. Dit is bedoeld voor gebruikersinterfaces die de agent vragen
om een revisie uit te voeren in plaats van letterlijk nieuwe inhoud in te dienen.

## Opslag

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

Standaardmap voor statusgegevens: `~/.openclaw`.

- `proposal.json`: canonieke registratierecord van het voorstel.
- `proposals.json`: snelle lijstindex, opnieuw op te bouwen vanuit de voorstelmappen.
- `PROPOSAL.md`: Skills-voorstel in afwachting.
- `rollback.json`: herstelmetadata die wordt geschreven voordat wijzigingen op actieve bestanden worden toegepast.

## Limieten

| Limiet                          | Waarde                                                                      |
| ------------------------------- | --------------------------------------------------------------------------- |
| Beschrijving                    | 160 bytes                                                                   |
| Voorsteltekst                   | `skills.workshop.maxSkillBytes` (standaard 40.000; harde bovengrens 1 MiB) |
| Ondersteunende bestanden        | 64 per voorstel                                                             |
| Grootte ondersteunend bestand   | Elk 256 KiB, in totaal 2 MiB                                                |
| Openstaande + geïsoleerde voorstellen | `skills.workshop.maxPending` per werkruimte (standaard 50)            |

## Probleemoplossing

| Probleem                                       | Oplossing                                                                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Kort `description` in tot maximaal 160 bytes.                                                                                                                                                            |
| `Skill proposal content is too large`          | Kort de voorsteltekst in of verhoog `skills.workshop.maxSkillBytes`.                                                                                                                                     |
| `Target skill changed after proposal creation` | Herzie het voorstel op basis van het huidige doel of maak een nieuw voorstel.                                                                                                                            |
| `Proposal scan failed`                         | Inspecteer de bevindingen van de scanner en herzie of isoleer vervolgens het voorstel.                                                                                                                    |
| `untrusted symlink target`                     | Configureer `skills.load.allowSymlinkTargets` en schakel `skills.workshop.allowSymlinkTargetWrites` alleen in voor bewust gedeelde hoofdmappen van Skills.                                                |
| `Support file paths must be under one of...`   | Verplaats ondersteunende bestanden naar `assets/`, `examples/`, `references/`, `scripts/` of `templates/`.                                                                                               |
| Voorstel verschijnt niet in de lijst           | Controleer de geselecteerde `--agent`-werkruimte en `OPENCLAW_STATE_DIR`.                                                                                                                                |
| Agent kan `skill_workshop` niet aanroepen      | Controleer het actieve toolbeleid en de uitvoeringsmodus. `coding` bevat de tool; beperkende beleidsregels voor `tools.allow` moeten deze expliciet vermelden en uitvoeringen in een sandbox moeten een normale agentssessie aan de hostzijde of de CLI gebruiken. |

### Diagnose van toolbeleid

Wanneer autonome vastlegging is ingeschakeld, voert `openclaw doctor` de controle
`core/doctor/skill-workshop-tool-policy` uit voor de standaardagent. Als het beleid
`skill_workshop` verbergt, vermeldt de waarschuwing de eerste uitsluitende configuratielaag en
de exacte wijziging aan `allow` of `alsoAllow` die nodig is. Oudere draaiboeken gebruiken mogelijk nog
`openclaw plugins inspect skill-workshop`; die opdracht legt nu uit dat Skill
Workshop ingebouwd is en toont, indien van toepassing, dezelfde beleidstip.

## Gerelateerd

- [Skills](/nl/tools/skills) voor laadvolgorde, prioriteit en zichtbaarheid
- [Skills maken](/nl/tools/creating-skills) voor de basisprincipes van een handmatig geschreven `SKILL.md`
- [Skills-configuratie](/nl/tools/skills-config) voor het volledige `skills.workshop`-schema
- [Skills-CLI](/nl/cli/skills) voor `openclaw skills`-opdrachten
