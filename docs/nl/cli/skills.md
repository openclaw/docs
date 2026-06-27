---
read_when:
    - Je wilt zien welke Skills beschikbaar zijn en klaar zijn om uit te voeren
    - Je wilt ClawHub doorzoeken of Skills installeren vanuit ClawHub, Git of lokale mappen
    - Je wilt een ClawHub-skill verifiëren met ClawHub
    - Je wilt ontbrekende binaries/env/config voor Skills debuggen
summary: CLI-referentie voor `openclaw skills` (zoeken/installeren/bijwerken/verifiëren/lijst/info/controleren/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:23:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecteer lokale Skills, zoek in ClawHub, installeer Skills vanuit ClawHub/Git/lokale
mappen, verifieer ClawHub-Skills en werk door ClawHub gevolgde installaties bij.

Gerelateerd:

- Skillssysteem: [Skills](/nl/tools/skills)
- Skillworkshop: [Skillworkshop](/nl/tools/skill-workshop)
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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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
installeert een ClawHub-Skill, `install git:owner/repo[@ref]` kloont een Git-Skill en
`install ./path` kopieert een lokale Skill-map. Standaard richten `install`, `update`
en `verify` zich op de actieve workspace-map `skills/`; met `--global`
richten ze zich op de gedeelde beheerde Skills-map. `list`/`info`/`check` blijven
de lokale Skills inspecteren die zichtbaar zijn voor de huidige workspace en configuratie.
Op workspace gebaseerde opdrachten bepalen de doelworkspace via `--agent <id>`, daarna
de huidige werkmap wanneer die zich binnen een geconfigureerde agent-workspace bevindt,
en daarna de standaardagent.

Git- en lokale-mapinstallaties verwachten `SKILL.md` in de bronroot. De
installatieslug komt uit de frontmatterwaarde `name` in `SKILL.md` wanneer die geldig is, daarna uit de
bronmap- of repositorynaam; gebruik `--as <slug>` om deze te overschrijven. `--version`
is alleen voor ClawHub. Skill-installaties ondersteunen geen npm-pakketspecificaties of zip-/archiefpaden,
en `openclaw skills update` werkt alleen door ClawHub gevolgde installaties bij.

Door Gateway ondersteunde installaties van Skill-afhankelijkheden die vanuit onboarding of Skills-instellingen
worden geactiveerd, gebruiken in plaats daarvan het afzonderlijke aanvraagpad `skills.install`.

Opmerkingen:

- `search [query...]` accepteert een optionele query; laat deze weg om door de standaard
  ClawHub-zoekfeed te bladeren.
- `search --limit <n>` begrenst het aantal teruggegeven resultaten.
- `install git:owner/repo[@ref]` installeert een Git-Skill. Branchrefs mogen
  schuine strepen bevatten, zoals `git:owner/repo@feature/foo`.
- `install ./path/to/skill` installeert een lokale map waarvan de root
  `SKILL.md` bevat.
- `install --as <slug>` overschrijft de afgeleide slug voor Git- en lokale-mapinstallaties.
- `install --version <version>` is alleen van toepassing op ClawHub-Skillrefs.
- `install --force` overschrijft een bestaande workspace-Skillmap voor dezelfde
  slug.
- Installaties en updates van community-ClawHub-Skills controleren vertrouwen vóór het downloaden.
  Community-archiefreleases met versie gebruiken vertrouwensmetadata voor de exacte release.
  Door een resolver ondersteunde GitHub-Skills vertrouwen op de installatieresolver van ClawHub om
  scan- en geforceerde-installatiebeleid af te dwingen voordat deze een vastgezette commit teruggeeft. Kwaadaardige of
  geblokkeerde community-releases worden geweigerd. Risicovolle community-releases vereisen
  beoordeling en `--acknowledge-clawhub-risk` wanneer een niet-interactieve opdracht na
  die beoordeling moet doorgaan. Officiële ClawHub-Skill-uitgevers en gebundelde
  OpenClaw-Skillbronnen slaan deze release-vertrouwensprompt over.
- `--global` richt zich op de gedeelde beheerde Skills-map en kan niet worden gecombineerd
  met `--agent <id>`.
- `--agent <id>` richt zich op één geconfigureerde agent-workspace en overschrijft afleiding uit de
  huidige werkmap.
- `update @owner/<slug>` werkt één gevolgde Skill bij. Voeg `--global` toe om
  de gedeelde beheerde Skills-map te gebruiken in plaats van de workspace.
- `update --all` werkt gevolgde ClawHub-installaties bij in de geselecteerde workspace, of
  in de gedeelde beheerde Skills-map wanneer gecombineerd met `--global`.
- `verify @owner/<slug>` print standaard de JSON-envelope `clawhub.skill.verify.v1`
  van ClawHub. Er is geen vlag `--json`, omdat JSON al de
  standaard is. Kale slugs blijven om compatibiliteit geaccepteerd wanneer de Skill
  al is geïnstalleerd of ondubbelzinnig is, maar refs met eigenaar vermijden
  onduidelijkheid over de uitgever.
- Wanneer ClawHub door de server bepaalde bronherkomst teruggeeft, bevat verificatie-JSON ook
  een commit-vastgezette `openclaw.verifiedSourceUrl`. Niet-beschikbare of
  zelfverklaarde bron-URL's blijven alleen in de ruwe herkomst-envelope en worden niet
  gepromoveerd.
- `verify` gebruikt `.clawhub/origin.json` voor geïnstalleerde ClawHub-Skills, zodat het
  de geïnstalleerde versie verifieert tegen het register waaruit die kwam. `--version`
  en `--tag` overschrijven de versieselector, maar behouden dat geïnstalleerde register
  wanneer herkomstmetadata bestaat.
- `verify --card` print de gegenereerde Skill Card-Markdown in plaats van JSON. De
  opdracht sluit af met een niet-nulwaarde wanneer ClawHub `ok: false` of `decision: "fail"` teruggeeft;
  niet-ondertekende handtekeningen zijn informatief tenzij het ClawHub-beleid verandert.
- Geïnstalleerde ClawHub-bundels kunnen een gegenereerde `skill-card.md` bevatten. OpenClaw
  behandelt verificatie als een ClawHub-serverbeslissing en weigert een
  geïnstalleerde Skill niet alleen omdat die gegenereerde kaart de bundelvingerafdruk
  wijzigt.
- `check --agent <id>` controleert de workspace van de geselecteerde agent en rapporteert welke
  gereedstaande Skills daadwerkelijk zichtbaar zijn voor de prompt of opdrachtinterface van die agent.
- `list` is de standaardactie wanneer er geen subopdracht is opgegeven.
- `list`, `info` en `check` schrijven hun gerenderde uitvoer naar stdout. Met
  `--json` betekent dit dat de machineleesbare payload op stdout blijft voor pipes
  en scripts.

## Skillworkshop

`openclaw skills workshop` beheert wachtende Skill-voorstellen in de geselecteerde
workspace. Voorstellen zijn geen actieve Skills totdat ze zijn toegepast. Zie
[Skillworkshop](/nl/tools/skill-workshop) voor opslag van voorstellen,
beveiligingen voor ondersteuningsbestanden, Gateway-methoden en goedkeuringsbeleid.

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Skills](/nl/tools/skills)
