---
read_when:
    - Je wilt zien welke Skills beschikbaar en klaar voor gebruik zijn
    - Je wilt ClawHub doorzoeken of Skills installeren vanuit ClawHub, Git of lokale mappen
    - U wilt een ClawHub-skill verifiëren met ClawHub
    - Je wilt ontbrekende binaire bestanden, omgevingsvariabelen of configuratie voor Skills opsporen
summary: CLI-referentie voor `openclaw skills` (zoeken/installeren/bijwerken/verifiëren/weergeven/informatie/controleren/workshop)
title: Skills
x-i18n:
    generated_at: "2026-07-12T08:47:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecteer lokale Skills, doorzoek ClawHub, installeer Skills vanuit ClawHub/Git/lokale
mappen, verifieer ClawHub-Skills en werk door ClawHub bijgehouden installaties bij.

Gerelateerd:

- Skills-systeem: [Skills](/nl/tools/skills)
- Skill Workshop: [Skill Workshop](/nl/tools/skill-workshop)
- Skills-configuratie: [Skills-configuratie](/nl/tools/skills-config)
- ClawHub-installaties: [ClawHub](/nl/clawhub/cli)

## Opdrachten

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update` en `verify` gebruiken ClawHub rechtstreeks. `install @owner/<slug>`
installeert een ClawHub-Skill, `install git:owner/repo[@ref]` kloont een Git-Skill
en `install ./path` kopieert een lokale Skill-map. Standaard richten `install`,
`update` en `verify` zich op de map `skills/` van de actieve werkruimte; met
`--global` richten ze zich op de gedeelde beheerde Skills-map. `list`/`info`/`check`
inspecteren nog steeds de lokale Skills die zichtbaar zijn voor de huidige werkruimte en configuratie.
Op werkruimten gebaseerde opdrachten bepalen de doelwerkruimte eerst via `--agent <id>`,
vervolgens via de huidige werkmap wanneer die zich in een geconfigureerde agentwerkruimte
bevindt, en daarna via de standaardagent.

Voor installaties vanuit Git en lokale mappen moet `SKILL.md` in de hoofdmap van de bron
staan. De installatieslug is afkomstig uit de frontmatterwaarde `name` van `SKILL.md`
wanneer die geldig is, en anders uit de naam van de bronmap of repository; gebruik
`--as <slug>` om deze te overschrijven. `--version` is alleen voor ClawHub. Skill-installaties
ondersteunen geen npm-pakketspecificaties of paden naar zip-/archiefbestanden, en
`openclaw skills update` werkt alleen door ClawHub bijgehouden installaties bij.

Door de Gateway ondersteunde installaties van Skill-afhankelijkheden die vanuit onboarding
of de Skills-instellingen worden geactiveerd, gebruiken in plaats daarvan het afzonderlijke
aanvraagpad `skills.install`.

Opmerkingen:

| Vlag/gedrag                      | Beschrijving                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Optionele zoekopdracht; laat deze weg om door de standaardzoekfeed van ClawHub te bladeren.                                                                                                                                                                                        |
| `search --limit <n>`             | Beperkt het aantal geretourneerde resultaten.                                                                                                                                                                                                                                      |
| `install git:owner/repo[@ref]`   | Installeert een Git-Skill. Branchverwijzingen mogen schuine strepen bevatten, zoals `git:owner/repo@feature/foo`.                                                                                                                                                                  |
| `install ./path/to/skill`        | Installeert een lokale map waarvan de hoofdmap `SKILL.md` bevat.                                                                                                                                                                                                                   |
| `install --as <slug>`            | Overschrijft de afgeleide slug voor installaties vanuit Git en lokale mappen.                                                                                                                                                                                                      |
| `install --version <version>`    | Geldt alleen voor ClawHub-Skill-verwijzingen.                                                                                                                                                                                                                                      |
| `install --force`                | Overschrijft een bestaande Skill-map in de werkruimte met dezelfde slug.                                                                                                                                                                                                           |
| `install/update --force-install` | Installeert een wachtende, door GitHub ondersteunde ClawHub-Skill voordat de scan van ClawHub is voltooid.                                                                                                                                                                         |
| `--global`                       | Richt zich op de gedeelde beheerde Skills-map; kan niet worden gecombineerd met `--agent <id>`.                                                                                                                                                                                    |
| `--agent <id>`                   | Richt zich op één geconfigureerde agentwerkruimte; overschrijft de afleiding op basis van de huidige werkmap.                                                                                                                                                                      |
| `update @owner/<slug>`           | Werkt één bijgehouden Skill bij. Voeg `--global` toe om de gedeelde beheerde Skills-map te gebruiken in plaats van de werkruimte.                                                                                                                                                   |
| `update --all`                   | Werkt bijgehouden ClawHub-installaties bij in de geselecteerde werkruimte, of in de gedeelde beheerde Skills-map met `--global`.                                                                                                                                                    |
| `verify @owner/<slug>`           | Geeft standaard de JSON-envelop `clawhub.skill.verify.v1` van ClawHub weer. Er is geen vlag `--json`, omdat JSON al de standaard is. Kale slugs worden voor compatibiliteit geaccepteerd wanneer de Skill al is geïnstalleerd of ondubbelzinnig is; verwijzingen met een eigenaar voorkomen onduidelijkheid over de uitgever. |
| Herkomst van `verify`            | Wanneer ClawHub door de server bepaalde bronherkomst retourneert, bevat de verificatie-JSON ook een aan een commit vastgezette `openclaw.verifiedSourceUrl`. Niet-beschikbare of zelf opgegeven bron-URL's blijven alleen in de onbewerkte herkomstenvelop en worden niet gepromoveerd. |
| Versieselector van `verify`      | `verify` gebruikt `.clawhub/origin.json` voor geïnstalleerde ClawHub-Skills en verifieert daardoor de geïnstalleerde versie aan de hand van het register waaruit deze afkomstig is. `--version` en `--tag` overschrijven de versieselector, maar behouden dat geïnstalleerde register wanneer herkomstmetadata aanwezig zijn. |
| `verify --card`                  | Geeft de gegenereerde Markdown van de Skill-kaart weer in plaats van JSON. Eindigt met een niet-nulstatus wanneer ClawHub `ok: false` of `decision: "fail"` retourneert; niet-ondertekende handtekeningen zijn informatief, tenzij het ClawHub-beleid verandert. |
| Vingerafdruk van de Skill-kaart  | Geïnstalleerde ClawHub-bundels kunnen een gegenereerd bestand `skill-card.md` bevatten. OpenClaw behandelt verificatie als een serverbeslissing van ClawHub en weigert een geïnstalleerde Skill niet alleen omdat die gegenereerde kaart de vingerafdruk van de bundel wijzigt. |
| `check --agent <id>`             | Controleert de werkruimte van de geselecteerde agent en rapporteert welke gereedstaande Skills daadwerkelijk zichtbaar zijn in de prompt of het opdrachtoppervlak van die agent.                                                                                                   |
| `list`                           | Standaardactie wanneer geen subopdracht is opgegeven.                                                                                                                                                                                                                              |
| Uitvoer van `list`/`info`/`check` | Opgemaakte uitvoer gaat naar stdout. Met `--json` blijft de machineleesbare nettolading op stdout voor pipes en scripts.                                                                                                                                                           |

Bij installaties en updates van community-Skills uit ClawHub wordt vóór het downloaden
de betrouwbaarheid gecontroleerd. Versiegebonden community-archiefreleases gebruiken
betrouwbaarheidsmetadata voor de exacte release. Door de resolver ondersteunde GitHub-Skills
vertrouwen op de installatieresolver van ClawHub om het scan- en gedwongen-installatiebeleid
af te dwingen voordat deze een vastgezette commit retourneert; gebruik `--force-install`
om een wachtende, door GitHub ondersteunde Skill te installeren voordat die scan is voltooid.
Schadelijke of geblokkeerde community-releases worden geweigerd. Risicovolle
community-releases vereisen beoordeling en `--acknowledge-clawhub-risk` wanneer een
niet-interactieve opdracht na die beoordeling moet doorgaan. Officiële uitgevers van
ClawHub-Skills en gebundelde OpenClaw-Skill-bronnen slaan deze vraag over
releasebetrouwbaarheid over.

## Skill Workshop

`openclaw skills workshop` beheert wachtende Skill-voorstellen in de geselecteerde
werkruimte. Voorstellen zijn pas actieve Skills nadat ze zijn toegepast. Zie
[Skill Workshop](/nl/tools/skill-workshop) voor de opslag van voorstellen,
beveiligingsmaatregelen voor ondersteunende bestanden, Gateway-methoden en het
goedkeuringsbeleid.

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Herhaalbare QA-checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Herhaalbare QA-checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicaat"
openclaw skills workshop quarantine <proposal-id> --reason "Beveiligingsbeoordeling vereist"
```

`propose-create`, `propose-update` en `revise` accepteren ook `--goal <text>`
en `--evidence <text>` om de motivatie en ondersteunende notities van het voorstel
naast de inhoud van `--proposal`/`--proposal-dir` vast te leggen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Skills](/nl/tools/skills)
