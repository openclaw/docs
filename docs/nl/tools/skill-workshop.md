---
read_when:
    - Je wilt dat de agent vanuit de chat een skill maakt of bijwerkt
    - Je moet een gegenereerde skill-conceptversie beoordelen, toepassen, afwijzen of in quarantaine plaatsen
    - Je configureert goedkeuring, autonomie, opslag of limieten voor Skill Workshop
sidebarTitle: Skill Workshop
summary: Maak werkruimte-Skills aan en werk ze bij via beoordeling in Skill Workshop
title: Skill-workshop
x-i18n:
    generated_at: "2026-06-27T18:29:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop is OpenClaw's beheerste pad voor het maken en bijwerken van workspace-skills.

Agents en operators schrijven via dit pad niet rechtstreeks actieve `SKILL.md`-bestanden. Ze maken eerst een **voorstel**. Een voorstel is een concept in behandeling met de voorgestelde skill-inhoud, doelbinding, scannerstatus, hashes, metadata van ondersteuningsbestanden en rollback-metadata. Het wordt pas een live skill wanneer het wordt toegepast.

Skill Workshop schrijft alleen workspace-skills. Het wijzigt geen gebundelde, plugin-, ClawHub-, extra-root-, beheerde, personal-agent- of systeemskills.

## Hoe het werkt

- **Eerst een voorstel:** gegenereerde skill-inhoud wordt opgeslagen als `PROPOSAL.md`, niet als `SKILL.md`.
- **Toepassen is de enige live schrijfopdracht:** maken, bijwerken en herzien wijzigen geen actieve skills.
- **Beperkt tot de workspace:** aanmaken richt zich op de workspace-root `skills/`. Updates zijn alleen toegestaan voor schrijfbare workspace-skills.
- **Niet overschrijven:** aanmaken mislukt als de doel-skill al bestaat.
- **Hashgebonden:** updatevoorstellen binden aan de huidige doelhash en worden verouderd als de live skill verandert voordat het voorstel wordt toegepast.
- **Scanner-gated:** toepassen voert vóór het schrijven opnieuw scans uit.
- **Herstelbaar:** toepassen schrijft rollback-metadata voordat live bestanden worden gewijzigd.
- **Consistente oppervlakken:** chat, CLI en Gateway roepen allemaal dezelfde Skill Workshop-service aan.

## Levenscyclus

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Alleen `pending`-voorstellen kunnen worden herzien, toegepast, afgewezen of in quarantaine geplaatst.

## Chat

Vraag de agent om de gewenste skill. De agent roept `skill_workshop` aan en retourneert een voorstel-id.

Aanmaken:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

Een bestaande workspace-skill bijwerken:

```text
Update trip-planning to also check seat maps before booking.
```

Itereren op een voorstel in behandeling:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

Standaard tonen door agents geïnitieerde `apply`, `reject` en `quarantine` een goedkeuringsprompt voordat ze worden uitgevoerd. Stel `skills.workshop.approvalPolicy` in op `"auto"` om de prompt over te slaan voor vertrouwde omgevingen.

## CLI

Maak een nieuw skillvoorstel:

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

Maak een updatevoorstel voor een bestaande workspace-skill:

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

Weergeven en inspecteren:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

Herzien vóór goedkeuring:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

Het voorstel afronden:

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Voorstelinhoud

Zolang het voorstel in behandeling is, wordt het opgeslagen als `PROPOSAL.md` met frontmatter die alleen voor voorstellen geldt:

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Bij toepassen schrijft Skill Workshop de actieve `SKILL.md` en verwijdert het velden die alleen voor voorstellen gelden: `status`, voorstel-`version` en voorstel-`date`.

## Ondersteuningsbestanden

Gebruik `--proposal-dir` wanneer de voorgestelde skill bestanden naast `PROPOSAL.md` nodig heeft:

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

De map moet `PROPOSAL.md` bevatten. Ondersteuningsbestanden moeten onder staan:

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

Skill Workshop scant, hasht en bewaart ondersteuningsbestanden met het voorstel. Ze worden pas bij toepassen naast de live `SKILL.md` geschreven.

Afgewezen paden voor ondersteuningsbestanden omvatten absolute paden, verborgen padsegmenten, path traversal, overlappende paden, uitvoerbare bestanden uit voorstelmappen, niet-UTF-8-tekst, null-bytes en bestanden buiten de standaardmappen voor ondersteuning.

## Agent-tool

Het model gebruikt `skill_workshop`:

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

Agents moeten `skill_workshop` gebruiken voor gegenereerd skillwerk. Ze mogen geen voorstelbestanden maken of wijzigen via `write`, `edit`, `exec`, shellopdrachten of directe bestandssysteembewerkingen.

<Note>
`skill_workshop` is een ingebouwde agent-tool en is opgenomen in `tools.profile: "coding"`. Als een strikter beleid deze verbergt, voeg dan `skill_workshop` toe aan de actieve `tools.allow`-lijst, of gebruik `tools.alsoAllow: ["skill_workshop"]` wanneer de scope een profiel gebruikt zonder expliciete `tools.allow`. Sandbox-runs construeren de host-side Skill Workshop-tool niet, dus voer beoordelingsacties voor voorstellen uit vanuit een normale host-side agentsessie of de CLI.
</Note>

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

- `autonomous.enabled`: staat OpenClaw toe om voorstellen in behandeling te maken op basis van duurzame gesprekssignalen na succesvolle beurten. Standaard: `false`.
- `allowSymlinkTargetWrites`: staat toepassen toe om door workspace-skill-symlinks heen te schrijven waarvan het echte doel is opgenomen in `skills.load.allowSymlinkTargets`. Standaard: `false`.
- `approvalPolicy: "pending"`: vereist een goedkeuringsprompt vóór door agents geïnitieerde `apply`, `reject` of `quarantine`.
- `approvalPolicy: "auto"`: slaat die goedkeuringsprompt over. De agent moet de actie nog steeds aanroepen.
- `maxPending`: beperkt voorstellen in behandeling en in quarantaine per workspace.
- `maxSkillBytes`: beperkt de grootte van de voorstelbody. Standaard: `40000`.

Voorstelbeschrijvingen zijn altijd beperkt tot 160 bytes.

## Gateway-methoden

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

Alleen-lezen-methoden vereisen `operator.read`. Muterende methoden vereisen `operator.admin`.

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

- `proposal.json`: canoniek voorstelrecord.
- `proposals.json`: snelle lijstindex, opnieuw op te bouwen vanuit voorstelmappen.
- `PROPOSAL.md`: skillvoorstel in behandeling.
- `rollback.json`: herstelmetadata die wordt geschreven voordat toepassen live bestanden wijzigt.

## Limieten

- Beschrijving: 160 bytes.
- Voorstelbody: `skills.workshop.maxSkillBytes` (standaard 40.000).
- Ondersteuningsbestanden: 64 per voorstel.
- Grootte van ondersteuningsbestand: elk 256 KB, totaal 2 MB.
- Voorstellen in behandeling en in quarantaine: `skills.workshop.maxPending` per workspace (standaard 50).

## Probleemoplossing

| Probleem                                        | Oplossing                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Verkort `description` tot 160 bytes of minder.                                                                                                                                                                 |
| `Skill proposal content is too large`          | Verkort de voorstelbody of verhoog `skills.workshop.maxSkillBytes`.                                                                                                                                         |
| `Target skill changed after proposal creation` | Herzie het voorstel tegen het huidige doel, of maak een nieuw voorstel.                                                                                                                                   |
| `Proposal scan failed`                         | Inspecteer scannerbevindingen en herzie het voorstel daarna of plaats het in quarantaine.                                                                                                                                           |
| `untrusted symlink target`                     | Configureer `skills.load.allowSymlinkTargets` en schakel `skills.workshop.allowSymlinkTargetWrites` alleen in voor bewust gedeelde skillroots.                                                                  |
| `Support file paths must be under one of...`   | Verplaats ondersteuningsbestanden onder `assets/`, `examples/`, `references/`, `scripts/` of `templates/`.                                                                                                                |
| Voorstel wordt niet in de lijst weergegeven    | Controleer de geselecteerde `--agent`-workspace en `OPENCLAW_STATE_DIR`.                                                                                                                                            |
| Agent kan `skill_workshop` niet aanroepen      | Controleer het actieve toolbeleid en de runmodus. `coding` bevat de tool; beperkende `tools.allow`-beleidsregels moeten deze expliciet vermelden, en sandbox-runs moeten een normale host-side agentsessie of de CLI gebruiken. |

## Gerelateerd

- [Skills](/nl/tools/skills) voor laadvolgorde, prioriteit en zichtbaarheid
- [Skills maken](/nl/tools/creating-skills) voor de basis van handgeschreven `SKILL.md`
- [Skills-configuratie](/nl/tools/skills-config) voor het volledige `skills.workshop`-schema
- [Skills-CLI](/nl/cli/skills) voor `openclaw skills`-opdrachten
