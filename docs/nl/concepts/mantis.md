---
read_when:
    - Live visuele QA bouwen of uitvoeren voor OpenClaw-bugs
    - Voor- en naverificatie toevoegen voor een samenvoegverzoek
    - Discord, Slack, WhatsApp of andere live-transportscenario's toevoegen
    - QA-runs debuggen waarvoor screenshots, browserautomatisering of VNC-toegang nodig zijn
summary: Mantis is het visuele end-to-end-verificatiesysteem voor het reproduceren van OpenClaw-bugs op live transporten, het vastleggen van bewijs van de situatie vóór en na, en het toevoegen van artefacten aan PR's.
title: Bidsprinkhaan
x-i18n:
    generated_at: "2026-05-03T21:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis is het OpenClaw end-to-end-verificatiesysteem voor bugs die een echte
runtime, een echt transport en zichtbaar bewijs nodig hebben. Het voert een scenario uit tegen een bekende
slechte ref, legt bewijs vast, voert hetzelfde scenario uit tegen een candidate-ref, en
publiceert de vergelijking als artifacts die een maintainer kan inspecteren vanuit een PR of
vanuit een lokale opdracht.

Mantis begint met Discord omdat Discord ons een hoogwaardige eerste lane geeft:
echte bot-authenticatie, echte guildkanalen, reacties, threads, native opdrachten en een
browser-UI waarin mensen visueel kunnen bevestigen wat het transport liet zien.

## Doelen

- Een bug uit een GitHub issue of PR reproduceren met dezelfde transportvorm die gebruikers
  zien.
- Een **voor**-artifact vastleggen op de baseline-ref voordat de fix wordt toegepast.
- Een **na**-artifact vastleggen op de candidate-ref nadat de fix is toegepast.
- Waar mogelijk een deterministische oracle gebruiken, zoals een Discord REST-reactie
  uitlezing of controle van een kanaaltranscript.
- Screenshots vastleggen wanneer de bug een zichtbaar UI-oppervlak heeft.
- Lokaal uitvoeren vanuit een door een agent bestuurde CLI en op afstand vanuit GitHub.
- Genoeg machinestatus bewaren voor VNC-redding wanneer login, browserautomatisering of
  provider-authenticatie vastloopt.
- Beknopte status naar een operator-Discordkanaal posten wanneer de run geblokkeerd is,
  handmatige VNC-hulp nodig heeft of voltooid is.

## Niet-doelen

- Mantis is geen vervanging voor unit tests. Een Mantis-run moet na begrip van de fix meestal
  een kleinere regressietest worden.
- Mantis is niet de normale snelle CI-gate. Het is langzamer, gebruikt live credentials en
  is gereserveerd voor bugs waarbij de live omgeving ertoe doet.
- Mantis zou voor normale werking geen mens moeten vereisen. Handmatige VNC is een reddingspad,
  niet het happy path.
- Mantis slaat geen ruwe secrets op in artifacts, logs, screenshots, Markdown
  rapporten of PR-comments.

## Eigenaarschap

Mantis leeft in de OpenClaw QA-stack.

- OpenClaw bezit de scenarioruntime, transportadapters, het bewijsschema en de
  lokale CLI onder `pnpm openclaw qa mantis`.
- QA Lab bezit de live transport-harnessonderdelen, browsercapture-helpers en
  artifact-writers.
- Crabbox bezit voorverwarmde Linux-machines wanneer een remote VM nodig is.
- GitHub Actions bezit het remote workflow-entrypoint en artifactretentie.
- ClawSweeper bezit GitHub-commentrouting: maintaineropdrachten parsen,
  de workflow dispatchen en de uiteindelijke PR-comment posten.
- OpenClaw agents sturen Mantis aan via Codex wanneer een scenario agentic setup,
  debugging of rapportage van vastgelopen status nodig heeft.

Deze grens houdt transportkennis in OpenClaw, machineplanning in
Crabbox en maintainer-workflowlijm in ClawSweeper.

## Commandovorm

De eerste lokale opdracht verifieert de Discord-bot, guild, kanaal, berichtverzending,
reactieverzending en artifactpad:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

De lokale voor- en na-runner accepteert deze vorm:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

De runner maakt detached baseline- en candidate-worktrees onder de outputdirectory,
installeert dependencies, bouwt elke ref, voert het scenario uit met
`--allow-failures`, en schrijft daarna `baseline/`, `candidate/`, `comparison.json`,
en `mantis-report.md`. Voor het eerste Discord-scenario betekent een succesvolle verificatie
dat de baseline-status `fail` is en de candidate-status `pass`.

De GitHub-smokeworkflow is `Mantis Discord Smoke`. De voor- en na-GitHubworkflow
voor het eerste echte scenario is `Mantis Discord Status Reactions`. Deze accepteert:

- `baseline_ref`: de ref waarvan wordt verwacht dat die queued-only-gedrag reproduceert.
- `candidate_ref`: de ref waarvan wordt verwacht dat die `queued -> thinking -> done` toont.

Deze checkt de workflow-harnessref uit, bouwt aparte baseline- en candidate-worktrees,
voert `discord-status-reactions-tool-only` uit tegen elke worktree, en
uploadt `baseline/`, `candidate/`, `comparison.json` en `mantis-report.md` als
Actions-artifacts.

Je kunt de status-reactions-run ook direct vanuit een PR-comment triggeren:

```text
@Mantis discord status reactions
```

De commenttrigger is bewust smal. Die draait alleen op pull request-comments
van gebruikers met write-, maintain- of admin-toegang, en herkent alleen
Discord status-reaction-verzoeken. Standaard gebruikt die de bekende slechte baseline-ref
en de huidige PR-head-SHA als de candidate. Maintainers kunnen beide
refs overschrijven:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper-opdrachtvoorbeelden:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

De eerste opdracht is expliciet en scenariogericht. De tweede kan later een PR
of issue koppelen aan aanbevolen Mantis-scenario's op basis van labels, gewijzigde bestanden en
ClawSweeper-reviewbevindingen.

## Runlevenscyclus

1. Credentials verkrijgen.
2. Een VM toewijzen of hergebruiken.
3. Een schone checkout voorbereiden voor de baseline-ref.
4. Dependencies installeren en alleen bouwen wat het scenario nodig heeft.
5. Een child OpenClaw Gateway starten met een geïsoleerde statusdirectory.
6. Het live transport, de provider, het model en het browserprofiel configureren.
7. Het scenario uitvoeren en baseline-bewijs vastleggen.
8. De gateway stoppen en logs bewaren.
9. De candidate-ref voorbereiden in dezelfde VM.
10. Hetzelfde scenario uitvoeren en candidate-bewijs vastleggen.
11. De oracle-resultaten en visueel bewijs vergelijken.
12. Markdown, JSON, logs, screenshots en optionele trace-artifacts schrijven.
13. GitHub Actions-artifacts uploaden.
14. Een beknopt PR- of Discord-statusbericht posten.

Het scenario moet op twee verschillende manieren kunnen falen:

- **Bug gereproduceerd**: baseline faalde op de verwachte manier.
- **Harness-fout**: omgevingssetup, credentials, Discord API, browser of
  provider faalde voordat de bug-oracle betekenisvol was.

Het eindrapport moet deze gevallen scheiden zodat maintainers een flakey
omgeving niet verwarren met productgedrag.

## Discord-MVP

Het eerste scenario moet gericht zijn op Discord-statusreacties in guildkanalen waar
de bronantwoordleveringsmodus `message_tool_only` is.

Waarom dit een goede Mantis-seed is:

- Het is zichtbaar in Discord als reacties op het triggerende bericht.
- Het heeft een sterke REST-oracle via de Discord-berichtreactiestatus.
- Het test een echte OpenClaw Gateway, Discord-bot-authenticatie, berichtdispatch,
  bronantwoordleveringsmodus, statusreactiestatus en modelturn-levenscyclus.
- Het is smal genoeg om de eerste implementatie eerlijk te houden.

Verwachte scenariovorm:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Baseline-bewijs moet de queued-bevestigingsreactie tonen maar geen
levenscyclustransitie in tool-only-modus. Candidate-bewijs moet tonen dat levenscyclus-
statusreacties draaien wanneer `messages.statusReactions.enabled` expliciet
true is.

De uitvoerbare eerste slice is het opt-in Discord live QA-scenario:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Het configureert de SUT met altijd ingeschakelde guildafhandeling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` en expliciete statusreacties. De oracle
pollt het echte Discord-triggerbericht en verwacht de geobserveerde reeks
`👀 -> 🤔 -> 👍`. Artifacts bevatten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` en
`discord-status-reactions-tool-only-timeline.png`.

## Bestaande QA-onderdelen

Mantis moet bouwen op de bestaande private QA-stack in plaats van vanaf
nul te beginnen:

- `pnpm openclaw qa discord` draait al een live Discord-lane met driver- en
  SUT-bots.
- De live transport-runner schrijft al rapporten en observed-message-
  artifacts onder `.artifacts/qa-e2e/`.
- Convex credential-leases bieden al exclusieve toegang tot gedeelde live
  transport-credentials.
- De browser control service ondersteunt al screenshots, snapshots,
  headless beheerde profielen en remote CDP-profielen.
- QA Lab heeft al een debugger-UI en bus voor transportvormige tests.

De eerste Mantis-implementatie kan een dunne voor/na-runner over deze
onderdelen zijn, plus één visuele bewijslaag.

## Bewijsmodel

Elke run schrijft een stabiele artifactdirectory:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` moet de machineleesbare source of truth zijn. Het
Markdown-rapport is voor PR-comments en menselijke review.

De samenvatting moet bevatten:

- geteste refs en SHA's
- transport en scenario-id
- machineprovider en machine-id of lease-id
- credentialbron zonder geheime waarden
- baseline-resultaat
- candidate-resultaat
- of de bug op baseline is gereproduceerd
- of de candidate dit heeft gefixt
- artifactpaden
- gesanitized setup- of cleanup-problemen

Screenshots zijn bewijs, geen secrets. Ze vereisen nog steeds redactiediscipline:
privékanaalnamen, gebruikersnamen of berichtinhoud kunnen verschijnen. Voor publieke PR's
hebben GitHub Actions-artifactlinks de voorkeur boven inline afbeeldingen totdat het redactieverhaal
sterker is.

## Browser en VNC

De browser-lane heeft twee modi:

- **Headless automation**: standaard voor CI. Chrome draait met CDP ingeschakeld, en
  Playwright of OpenClaw browser control legt screenshots vast.
- **VNC rescue**: ingeschakeld op dezelfde VM wanneer login, MFA, Discord anti-automation
  of visuele debugging een mens nodig heeft.

Het Discord-observerbrowserprofiel moet persistent genoeg zijn om te voorkomen
dat er voor elke run opnieuw moet worden ingelogd, maar geïsoleerd zijn van persoonlijke browserstatus. Een profiel
hoort bij de Mantis-machinepool, niet bij een ontwikkelaarslaptop.

Wanneer Mantis vastloopt, post het een Discord-statusbericht met:

- run-id
- scenario-id
- machineprovider
- artifactdirectory
- VNC- of noVNC-verbindingsinstructies indien beschikbaar
- korte blokkadetekst

De eerste private deployment kan deze berichten naar het bestaande operator-
kanaal posten en later naar een dedicated Mantis-kanaal verplaatsen.

## Machines

Mantis moet voor de eerste remote implementatie de voorkeur geven aan AWS via Crabbox.
Crabbox geeft ons voorverwarmde machines, leasetracking, hydration, logs, resultaten en
cleanup. Als AWS-capaciteit te traag of niet beschikbaar is, voeg dan een Hetzner-provider toe
achter dezelfde machine-interface.

Minimale VM-vereisten:

- Linux met een desktopgeschikte Chrome- of Chromium-installatie
- CDP-toegang voor browserautomatisering
- VNC of noVNC voor redding
- Node 22 en pnpm
- OpenClaw-checkout en dependency-cache
- Playwright Chromium-browsercache wanneer Playwright wordt gebruikt
- genoeg CPU en geheugen voor één OpenClaw Gateway, één browser en één modelrun
- uitgaande toegang tot Discord, GitHub, modelproviders en de credentialbroker

De VM mag geen langlevende ruwe secrets buiten de verwachte credential- of
browserprofielstores bewaren.

## Secrets

Secrets leven in GitHub-organisatie- of repositorysecrets voor remote runs, en in
een lokaal door de operator beheerd secretbestand voor lokale runs.

Aanbevolen secretnamen:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` voor openbare GitHub-artifactuploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

Op lange termijn moet de Convex-referentiegegevenspool de normale bron blijven
voor live transportreferentiegegevens. GitHub-geheimen bootstrapten de broker en
fallback-lanes.

De Mantis-runner mag nooit het volgende afdrukken:

- Discord-bottokens
- API-sleutels van providers
- browsercookies
- inhoud van auth-profielen
- VNC-wachtwoorden
- ruwe payloads met referentiegegevens

Openbare artifactuploads moeten ook Discord-doelmetadata redigeren, zoals bot-,
guild-, kanaal- en bericht-id's. De GitHub-smokeworkflow schakelt om deze reden
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` in.

Als een token per ongeluk in een issue, PR, chat of log wordt geplakt, roteer het
nadat het nieuwe geheim is opgeslagen.

## GitHub-artifacten en PR-opmerkingen

Mantis-workflows moeten de volledige bewijsbundel uploaden als een kortlevend
Actions-artifact. Wanneer de workflow wordt uitgevoerd voor een bugrapport of
fix-PR, moet deze ook de geredigeerde PNG-schermafbeeldingen publiceren naar de
`qa-artifacts`-branch en een opmerking op die bug of fix-PR upserten met inline
schermafbeeldingen voor/na. Plaats het primaire bewijs niet alleen op een
generieke QA-automatiserings-PR. Ruwe logs, waargenomen berichten en ander
omvangrijk bewijs blijven in het Actions-artifact.

Productieworkflows moeten die opmerkingen plaatsen met de Mantis GitHub App, niet
met `github-actions[bot]`. Sla de app-id en privésleutel op als
`MANTIS_GITHUB_APP_ID` en `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions-geheimen.
De workflow gebruikt een verborgen markering als upsert-sleutel, werkt die
opmerking bij wanneer het token deze kan bewerken, en maakt een nieuwe
Mantis-eigenaarsopmerking wanneer een oudere bot-eigenaarmarkering niet kan
worden bewerkt.

De PR-opmerking moet kort en visueel zijn:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Wanneer de run mislukt doordat de harness is mislukt, moet de opmerking dat
zeggen in plaats van te suggereren dat de kandidaat is mislukt.

## Notities voor privédeployment

Een privédeployment heeft mogelijk al een Mantis Discord-applicatie. Hergebruik
die applicatie in plaats van een andere app te maken wanneer deze de juiste
botmachtigingen heeft en veilig kan worden geroteerd.

Stel het initiële operatornotificatiekanaal in via geheimen of
deploymentconfiguratie. Het kan eerst naar een bestaand maintainer- of
operations-kanaal verwijzen en daarna naar een speciaal Mantis-kanaal worden
verplaatst zodra dat bestaat.

Plaats geen guild-id's, kanaal-id's, bottokens, browsercookies of
VNC-wachtwoorden in dit document. Sla ze op in GitHub-geheimen, de
referentiegegevensbroker of de lokale geheime opslag van de operator.

## Een scenario toevoegen

Een Mantis-scenario moet het volgende declareren:

- id en titel
- transport
- vereiste referentiegegevens
- baseline-refbeleid
- kandidaat-refbeleid
- OpenClaw-configpatch
- installatiestappen
- stimulus
- verwachte baseline-orakel
- verwachte kandidaat-orakel
- doelen voor visuele vastlegging
- time-outbudget
- opschoonstappen

Scenario's moeten de voorkeur geven aan kleine, getypte orakels:

- Discord-reactiestatus voor reactiefouten
- Discord-berichtreferenties voor threadingfouten
- Slack-thread-ts en reactie-API-status voor Slack-fouten
- e-mailbericht-id's en headers voor e-mailfouten
- browserschermafbeeldingen wanneer de UI het enige betrouwbare waarneembare is

Visiecontroles moeten aanvullend zijn. Als een platform-API de bug kan bewijzen,
gebruik de API dan als het slaag/faal-orakel en behoud schermafbeeldingen voor
menselijk vertrouwen.

## Provideruitbreiding

Na Discord kan dezelfde runner het volgende toevoegen:

- Slack: reacties, threads, appvermeldingen, modals, bestandsuploads.
- E-mail: Gmail-auth en berichtenthreading met `gog` waar connectors niet
  voldoende zijn.
- WhatsApp: QR-login, heridentificatie, berichtbezorging, media, reacties.
- Telegram: gating van groepsvermeldingen, opdrachten, reacties waar beschikbaar.
- Matrix: versleutelde rooms, thread- of antwoordrelaties, hervatten na herstart.

Elk transport moet één goedkope smokescenario en één of meer bugklassescenario's
hebben. Dure visuele scenario's moeten opt-in blijven.

## Open vragen

- Welke Discord-bot moet de driver zijn, en welke de SUT, wanneer de bestaande
  Mantis-bot wordt hergebruikt?
- Moet de observerbrowserlogin een menselijk Discord-account, een testaccount of
  alleen bot-leesbaar REST-bewijs gebruiken voor de eerste fase?
- Hoelang moet GitHub Mantis-artifacten voor PR's bewaren?
- Wanneer moet ClawSweeper automatisch Mantis aanbevelen in plaats van te wachten
  op een maintaineropdracht?
- Moeten schermafbeeldingen worden geredigeerd of bijgesneden vóór upload voor
  openbare PR's?
