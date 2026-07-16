---
read_when:
    - Je wilt dat de agent vanuit de chat een skill maakt of bijwerkt
    - Je moet een gegenereerd skillconcept beoordelen, toepassen, afwijzen of in quarantaine plaatsen
    - Je configureert goedkeuring, autonomie, opslag of limieten voor Skill Workshop
    - Je wilt weten waar voorstellen voor zelfleren worden beoordeeld
sidebarTitle: Skill Workshop
summary: Workspace-Skills maken en bijwerken via beoordeling in Skill Workshop
title: Skillworkshop
x-i18n:
    generated_at: "2026-07-16T16:36:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop is het beheerde traject van OpenClaw voor het maken en bijwerken van workspace-
skills. Agents en operators schrijven via dit traject nooit rechtstreeks naar `SKILL.md`
— ze maken een **voorstel** (concept in afwachting met inhoud, doelbinding,
scannerstatus, hashes en rollbackmetadata) dat pas een actieve skill wordt
wanneer het wordt toegepast.

Skill Workshop schrijft uitsluitend workspace-skills. Het wijzigt nooit gebundelde,
Plugin-, ClawHub-, extra-root-, beheerde, persoonlijke-agent- of systeemskills.

## Hoe het werkt

- **Eerst een voorstel:** gegenereerde inhoud wordt opgeslagen als `PROPOSAL.md`, niet als
  `SKILL.md`.
- **Toepassen is de enige actieve schrijfbewerking:** maken, bijwerken en herzien wijzigen
  actieve skills nooit.
- **Beperkt tot de workspace:** nieuwe skills richten zich op de `skills/`-root van de workspace; updates
  zijn alleen toegestaan voor beschrijfbare workspace-skills.
- **Niet overschrijven:** maken mislukt als de doelskill al bestaat.
- **Aan hash gebonden:** updatevoorstellen worden aan de huidige doelhash gebonden en worden
  `stale` als de actieve skill vóór het toepassen verandert.
- **Afgeschermd door scanner:** vóór het schrijven voert toepassen de beveiligingsscanner opnieuw uit.
- **Herstelbaar:** toepassen schrijft rollbackmetadata voordat actieve bestanden worden gewijzigd.
- **Consistente interfaces:** chat, CLI en Gateway roepen allemaal dezelfde service aan.

## Levenscyclus

```text
maken/bijwerken -> in afwachting
herzien          -> in afwachting
toepassen        -> toegepast
afwijzen         -> afgewezen
in quarantaine   -> in quarantaine
doelwijziging    -> verouderd
```

Alleen een `pending` voorstel kan worden herzien, toegepast, afgewezen of in quarantaine geplaatst.

## Beheer van de levenscyclus

De Gateway houdt het totale skillgebruik bij in de gedeelde statusdatabase. Eén keer
per dag beoordeelt deze skills die door Skill Workshop zijn gemaakt en toegepast. Skills die
langer dan 30 dagen niet zijn gebruikt, worden `stale`; na 90 dagen worden ze `archived` en
worden ze niet opgenomen in nieuwe skillsnapshots van agents. Gearchiveerde skillbestanden blijven
ongewijzigd op schijf staan. Handmatig gemaakte skills worden nooit beheerd; alleen skills die via
voorstellen van Skill Workshop zijn gemaakt, vallen onder levenscyclusbeheer.

Vastgezette skills omzeilen levenscyclusovergangen. Een verouderde skill keert terug naar `active`
nadat deze is gebruikt en de volgende controle wordt uitgevoerd. Gearchiveerde skills keren alleen terug via
expliciet herstel:

Levenscyclusovergangen en herstelbewerkingen gelden voor nieuwe sessies; actieve sessies behouden
hun huidige skillsnapshot.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Alle curatoropdrachten accepteren `--json`. De status meldt ook deterministische
overlapkandidaten, uitsluitend als suggesties; deze voegt nooit skills samen en roept geen model aan.

## Chat

Vraag de agent om de gewenste skill; deze roept `skill_workshop` aan en retourneert een
voorstel-id.

### Leren van recent werk

Gebruik `/learn` om de huidige conversatie of genoemde bronnen om te zetten in één
door standaarden geleid skillvoorstel:

```text
/learn
/learn docs/runbook.md en https://example.com/guide; richt je op herstel
```

Zonder verzoek vraagt `/learn` de agent om de herbruikbare workflow uit
de huidige conversatie te destilleren. Met een verzoek behandelt de agent paden, URL's, geplakte
notities en verwijzingen naar conversaties als bronnen, met inachtneming van vereisten voor focus,
bereik en naamgeving. De agent verzamelt de bronnen met zijn bestaande tools en roept vervolgens
`skill_workshop` aan met `action: "create"`.

Het resulterende voorstel blijft `pending`; `/learn` past het nooit toe. Beoordeel
en pas het toe via de normale goedkeuringsstroom of met `openclaw skills workshop`.

Maken:

```text
Maak een skill met de naam morning-catchup die mijn inboxroutine op maandag uitvoert.
```

Een bestaande workspace-skill bijwerken:

```text
Werk trip-planning bij zodat ook stoelplattegronden worden gecontroleerd vóór het boeken.
```

Een voorstel in afwachting verder uitwerken:

```text
Toon me het voorstel morning-catchup.
Herzie het zodat ook alles wordt gemarkeerd dat als urgent is aangeduid.
Pas het voorstel morning-catchup toe.
```

Door agents geïnitieerde `apply`, `reject` en `quarantine` worden standaard zonder een aanvullende
goedkeuringsvraag uitgevoerd. Stel `skills.workshop.approvalPolicy` in op `"pending"`
om goedkeuring door een operator te vereisen vóór deze acties.

Wanneer goedkeuring vereist is, vermeldt de vraag het voorstel-id en de doelskill
en toont deze de beschrijving van het voorstel, het aantal ondersteuningsbestanden en de omvang van de hoofdtekst.
Goedkeuringsverzoeken zijn begrensd zodat ze worden afgerond voordat de watchdog van de agenttool ingrijpt. Als er
geen beslissing binnenkomt voordat de vraag verloopt, wordt de levenscyclusactie niet uitgevoerd:
het voorstel blijft in afwachting en ongewijzigd. Beslis later in de Skill Workshop-UI of voer
`openclaw skills workshop apply|reject|quarantine <proposal-id>` uit. Agents mogen
een verlopen levenscyclusactie niet herhaaldelijk opnieuw proberen.

## CLI

```bash
# Maken
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Dagelijks de inbox bijwerken: triëren, archiveren, uitlichten, concepten maken, plannen" \
  --proposal ./PROPOSAL.md

# Een bestaande workspace-skill bijwerken
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

Elke subopdracht accepteert `--agent <id>` (doelworkspace; standaard
afgeleid van de huidige werkmap en daarna van de standaardagent) en `--json` (gestructureerde uitvoer).
`propose-create`, `propose-update` en `revise` accepteren ook `--goal <text>` en
`--evidence <text>` om de context van het voorstel naast `--proposal` vast te leggen.

## Inhoud van voorstellen

Zolang het voorstel in afwachting is, wordt het opgeslagen als `PROPOSAL.md` met uitsluitend voor
voorstellen bestemde frontmatter:

```markdown
---
name: "morning-catchup"
description: "Dagelijks de inbox bijwerken: triëren, archiveren, uitlichten, concepten maken, plannen"
status: voorstel
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Bij het toepassen schrijft Skill Workshop de actieve `SKILL.md` en verwijdert het
de uitsluitend voor voorstellen bestemde velden: `status`, voorstel-`version` en voorstel-`date`.

## Ondersteuningsbestanden

Gebruik `--proposal-dir` wanneer de voorgestelde skill bestanden naast
`PROPOSAL.md` nodig heeft:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Vrijdagse afsluiting: statistieken, hoogtepunten, de drie belangrijkste punten van volgende week" \
  --proposal-dir ./weekly-update-proposal
```

De map moet `PROPOSAL.md` bevatten. Ondersteuningsbestanden moeten zich bevinden onder
`assets/`, `examples/`, `references/`, `scripts/` of `templates/`. Skill
Workshop scant, hasht en bewaart ze samen met het voorstel en schrijft ze pas
bij het toepassen naast de actieve `SKILL.md`.

Geweigerde paden van ondersteuningsbestanden: absolute paden, verborgen padsegmenten,
padtraversal, overlappende paden, uitvoerbare bestanden, tekst die niet UTF-8 is, nullbytes
en paden buiten de standaardmappen voor ondersteuningsbestanden.

## Agenttool

Het model gebruikt `skill_workshop` met één verplichte `action`:
`create | update | revise | list | inspect | apply | reject | quarantine`.
Andere parameters zijn afhankelijk van de actie:

| Parameter                  | Gebruikt door                                         | Opmerkingen                                                          |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Vereist voor `create`; zoekt anders een voorstel in afwachting op naam op |
| `description`              | `create`, `update`, `revise`                         | Maximaal 160 bytes                                                    |
| `skill_name`               | `update`                                             | Naam of sleutel van bestaande skill                                  |
| `proposal_content`         | `create`, `update`, `revise`                         | Opgeslagen als `PROPOSAL.md`; begrensd door `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                         | Array van `{ path, content }`                                         |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Vrijetekstcontext                                                     |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Doelvoorstel                                                          |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Optioneel                                                             |
| `query`, `status`, `limit` | `list`                                               | Filteren/pagineren; `limit` maximaal 50, standaard 20     |

Agents moeten `skill_workshop` gebruiken voor gegenereerd skillwerk. Ze mogen
geen voorstelbestanden maken of wijzigen via `write`, `edit`, `exec`, shell-
opdrachten of rechtstreekse bestandssysteembewerkingen.

<Note>
`skill_workshop` is een ingebouwde agenttool en is opgenomen in
`tools.profile: "coding"`. Als een strenger beleid deze verbergt, voeg je
`skill_workshop` toe aan de actieve lijst `tools.allow`, of gebruik je
`tools.alsoAllow: ["skill_workshop"]` wanneer het bereik een profiel zonder expliciete
`tools.allow` gebruikt. In sandbox uitgevoerde processen maken de host-side
Skill Workshop-tool niet aan; voer acties voor het beoordelen van voorstellen daarom uit vanuit een normale host-side
agentsessie of via de CLI.
</Note>

## Voorgestelde skills

OpenClaw detecteert duurzame instructies zoals „de volgende keer”, „onthoud dat” en reactieve correcties
wanneer een interactieve beurt eindigt, ook bij mislukte beurten. Tijdens de volgende beurt biedt de agent aan
om de meest recent gedetecteerde workflow via `skill_workshop` op te slaan; de gebruiker beslist of er een
voorstel wordt gemaakt. Deze ingebouwde suggestie maakt of wijzigt zelf geen skill. Schakel
`skills.workshop.autonomous.enabled` in om in plaats daarvan rechtstreeks voorstellen in afwachting te maken. In de Control
UI biedt het tabblad Workshop dezelfde instelling als de schakelaar **Zelflerend** in de paginakop en
als inschakelknop op het lege voorstelbord.

### Eerdere sessies scannen

De Control UI kan ouder werk beoordelen zonder autonoom zelfleren in te schakelen.
Open **Plugins → Workshop** en selecteer **Skillideeën zoeken**. De scan begint met
de nieuwste geschikte sessies en beoordeelt een begrensd venster met substantieel werk.
Cron-, Heartbeat-, hook-, subagent-, ACP-, Plugin-eigen en interne beoordelingssessies
worden overgeslagen, evenals conversaties met minder dan zes modelbeurten.

De beoordelaar gebruikt het geconfigureerde model van de geselecteerde agent en ontvangt een
op geheimen geschoonde transcriptbundel met begrensde omvang. Dezelfde voorzichtige
maatstaf als bij ervaringsbeoordeling wordt toegepast: een concreet herstelpatroon of een stabiele procedure die
minstens twee toekomstige model- of toolaanroepen zou voorkomen. Routinematig werk en eenmalige
feiten horen geen voorstel op te leveren.

Eén scan kan maximaal drie voorstellen in afwachting maken of herzien. De scan kan geen
actieve skill toepassen, afwijzen, in quarantaine plaatsen of bewerken. Workshop toont de cumulatieve dekking,
bijvoorbeeld **20 sessies beoordeeld · 18 juni–vandaag · 2 ideeën gevonden**. Selecteer
**Eerder werk scannen** om verder te gaan vanaf de opgeslagen cursor van de oudste sessie. Nadat
de beschikbare geschiedenis is uitgeput, wordt de actie **Nieuw werk scannen**.

Historische beoordeling gebeurt handmatig, zelfs wanneer
`skills.workshop.autonomous.enabled` `false` is. Elke klik start een modeluitvoering,
dus de prijzen en voorwaarden voor gegevensverwerking van de provider zijn van toepassing. De cursor en dekkingsaantallen
worden opgeslagen in de gedeelde OpenClaw-statusdatabase; transcriptinhoud wordt niet
naar de scanstatus gekopieerd.

Als autonoom vastleggen is ingeschakeld, kan OpenClaw ook een conservatieve beoordeling uitvoeren na succesvol,
omvangrijk werk en nadat het volledige agentsysteem inactief is geworden. Die geïsoleerde beoordeling kan maximaal
één voorstel in behandeling maken of herzien. Deze kan geen live skill bijwerken of een
voorstel toepassen, afwijzen of in quarantaine plaatsen, zelfs niet wanneer `approvalPolicy` `"auto"` is.

Zie [Zelflerend vermogen](/tools/self-learning) voor details over inschakeling, geschiktheid, privacy en kosten,
de voorsteldrempel en probleemoplossing.

## Goedkeuring en autonomie

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Instelling                 | Standaard | Effect                                                                                                                                                              |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`  | Maakt voorstellen in behandeling op basis van expliciete correcties en, na een periode van inactiviteit, omvangrijk voltooid werk met herbruikbaar herstel of betekenisvolle besparingen bij retourverwerking. |
| `allowSymlinkTargetWrites` | `false`  | Staat toe dat toepassen via symlinks van workspace-skills schrijft waarvan het werkelijke doel in `skills.load.allowSymlinkTargets` staat vermeld.                                                 |
| `approvalPolicy`           | `"auto"` | `"auto"` slaat een extra prompt over voor door de agent geïnitieerde `apply`, `reject` of `quarantine` (de agent moet de actie nog steeds aanroepen). `"pending"` vereist goedkeuring. |
| `maxPending`               | `50`     | Begrenst voorstellen in behandeling en in quarantaine per workspace (1-200).                                                                                                       |
| `maxSkillBytes`            | `40000`  | Begrenst de grootte van de voorsteltekst in bytes (1024-200000).                                                                                                                     |

Autonoom vastleggen herkent toekomstige regels (bijvoorbeeld: „vanaf nu”) en reactieve
correcties (bijvoorbeeld: „dat is niet wat ik vroeg”). Het groepeert nieuwe instructies per onderwerp in maximaal
drie voorstellen per beurt, routeert overeenkomsten in woordgebruik naar bestaande beschrijfbare workspace-skills en
herziet zijn eigen voorstel in behandeling wanneer een andere correctie op dezelfde skill is gericht.

Voor succesvol omvangrijk werk zonder expliciete correctie bepaalt een geïsoleerde uitvoering van het geselecteerde
model of het voltooide traject aan de conservatieve voorsteldrempel voldoet. Het
voorgrondmodel krijgt vóór het antwoorden geen opdracht om te leren. De achtergrondbeoordelaar behoudt de
voorgronduitvoering als herkomst van het voorstel, heeft geen toegang tot algemene agenttools en kan geen
levenscyclusbeslissingen nemen. De beoordeling start alleen wanneer de voorgrondruntime zowel het exact bepaalde model
rapporteert als dat `skill_workshop` daadwerkelijk beschikbaar was. Een restrictief of onbekend toolbeleid
sluit daarom bij twijfel af en maakt geen voorstel.

Zie [Zelflerend vermogen](/tools/self-learning) voor het volledige autonome beoordelingsgedrag en
veiligheidsmodel.

Voorstelbeschrijvingen zijn altijd beperkt tot 160 bytes, onafhankelijk van
`maxSkillBytes`.

## Gateway-methoden

| Methode                            | Bereik            |
| ---------------------------------- | ----------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
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

`requestRevision` is alleen voor de Gateway (zonder equivalent in de CLI of agenttool): deze
stuurt revisie-instructies in vrije tekst door naar de chatsessie van de verantwoordelijke agent
in plaats van `PROPOSAL.md` rechtstreeks te vervangen, voor UI's die de agent vragen om
te herzien in plaats van letterlijk nieuwe inhoud in te dienen.

`historyStatus` en `historyScan` zijn ondersteuningsmethoden voor de Control UI. `historyScan`
accepteert `direction: "older" | "newer"`; resultaten blijven altijd voorstellen
in behandeling.

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

Standaardstatusmap: `~/.openclaw`.

- `proposal.json`: canonieke voorstelrecord.
- `proposals.json`: snelle lijstindex, opnieuw op te bouwen vanuit voorstelmappen.
- `PROPOSAL.md`: skillvoorstel in behandeling.
- `rollback.json`: herstelmetadata die wordt geschreven voordat toepassen live bestanden wijzigt.

## Limieten

| Limiet                          | Waarde                                                               |
| ------------------------------- | -------------------------------------------------------------------- |
| Beschrijving                    | 160 bytes                                                            |
| Voorsteltekst                   | `skills.workshop.maxSkillBytes` (standaard 40,000; absolute bovengrens 1 MiB) |
| Ondersteunende bestanden        | 64 per voorstel                                                      |
| Grootte ondersteunend bestand   | Elk 256 KiB, in totaal 2 MiB                                         |
| Voorstellen in behandeling + in quarantaine | `skills.workshop.maxPending` per workspace (standaard 50)              |

## Probleemoplossing

| Probleem                                       | Oplossing                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Kort `description` in tot 160 bytes of minder.                                                                                                                                                                 |
| `Skill proposal content is too large`          | Kort de voorsteltekst in of verhoog `skills.workshop.maxSkillBytes`.                                                                                                                                         |
| `Target skill changed after proposal creation` | Herzie het voorstel op basis van het huidige doel of maak een nieuw voorstel.                                                                                                                                   |
| `Proposal scan failed`                         | Controleer de bevindingen van de scanner en herzie het voorstel vervolgens of plaats het in quarantaine.                                                                                                                                           |
| `untrusted symlink target`                     | Configureer `skills.load.allowSymlinkTargets` en schakel `skills.workshop.allowSymlinkTargetWrites` alleen in voor bewust gedeelde hoofdmappen van skills.                                                                  |
| `Support file paths must be under one of...`   | Verplaats ondersteunende bestanden naar `assets/`, `examples/`, `references/`, `scripts/` of `templates/`.                                                                                                                |
| Voorstel verschijnt niet in de lijst           | Controleer de geselecteerde `--agent`-workspace en `OPENCLAW_STATE_DIR`.                                                                                                                                            |
| Agent kan `skill_workshop` niet aanroepen             | Controleer het actieve toolbeleid en de uitvoeringsmodus. `coding` bevat de tool; restrictieve `tools.allow`-beleidsregels moeten deze expliciet vermelden en uitvoeringen in een sandbox moeten een normale agentensessie aan de hostzijde of de CLI gebruiken. |

### Diagnose van toolbeleid

Wanneer autonoom vastleggen is ingeschakeld, voert `openclaw doctor` de
`core/doctor/skill-workshop-tool-policy`-controle uit voor de standaardagent. Als het beleid
`skill_workshop` verbergt, noemt de waarschuwing de eerste uitsluitende configuratielaag en
de exacte wijziging in `allow` of `alsoAllow` die moet worden aangebracht. Oudere runbooks gebruiken mogelijk nog
`openclaw plugins inspect skill-workshop`; die opdracht legt nu uit dat Skill
Workshop is ingebouwd en geeft dezelfde beleidshint weer wanneer die van toepassing is.

## Gerelateerd

- [Skills](/nl/tools/skills) voor laadvolgorde, prioriteit en zichtbaarheid
- [Zelflerend vermogen](/tools/self-learning) voor conservatieve skillvoorstellen na een uitvoering
- [Skills maken](/nl/tools/creating-skills) voor de basisbeginselen van handmatig geschreven `SKILL.md`
- [Skills-configuratie](/nl/tools/skills-config) voor het volledige `skills.workshop`-schema
- [Skills-CLI](/nl/cli/skills) voor `openclaw skills`-opdrachten
