---
read_when:
    - Live visuele QA voor OpenClaw-bugs bouwen of uitvoeren
    - Voor- en naverificatie toevoegen voor een pull-aanvraag
    - Discord-, Slack-, WhatsApp- of andere live-transportscenario's toevoegen
    - QA-runs debuggen waarvoor schermafbeeldingen, browserautomatisering of VNC-toegang nodig zijn
summary: Mantis is het visuele end-to-end-verificatiesysteem voor het reproduceren van OpenClaw-fouten op live-transporten, het vastleggen van bewijs van vóór en na, en het toevoegen van artefacten aan PR's.
title: Bidsprinkhaan
x-i18n:
    generated_at: "2026-05-04T07:03:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis is het OpenClaw end-to-end-verificatiesysteem voor bugs die een echte
runtime, een echte transportlaag en zichtbaar bewijs nodig hebben. Het voert een scenario uit tegen een bekende
slechte ref, legt bewijs vast, voert hetzelfde scenario uit tegen een kandidaat-ref en
publiceert de vergelijking als artifacts die een maintainer kan inspecteren vanuit een PR of
vanuit een lokaal commando.

Mantis begint met Discord omdat Discord ons een eerste lane met hoge waarde geeft:
echte botauthenticatie, echte guild-kanalen, reacties, threads, native commando's en een
browser-UI waarin mensen visueel kunnen bevestigen wat de transportlaag liet zien.

## Doelen

- Reproduceer een bug uit een GitHub-issue of PR met dezelfde transportvorm die gebruikers
  zien.
- Leg een **voor**-artifact vast op de baseline-ref voordat de fix wordt toegepast.
- Leg een **na**-artifact vast op de kandidaat-ref nadat de fix is toegepast.
- Gebruik waar mogelijk een deterministische oracle, zoals een Discord REST-reactie
  uitlezen of een kanaaltranscriptcontrole.
- Leg screenshots vast wanneer de bug een zichtbaar UI-oppervlak heeft.
- Voer lokaal uit vanuit een door een agent bestuurde CLI en op afstand vanuit GitHub.
- Bewaar genoeg machinetoestand voor VNC-redding wanneer inloggen, browserautomatisering of
  providerauthenticatie vastloopt.
- Plaats beknopte status in een operator-Discord-kanaal wanneer de run geblokkeerd is,
  handmatige VNC-hulp nodig heeft of klaar is.

## Niet-doelen

- Mantis is geen vervanging voor unit tests. Een Mantis-run moet meestal een
  kleinere regressietest worden nadat de fix is begrepen.
- Mantis is niet de normale snelle CI-gate. Het is trager, gebruikt live credentials en
  is gereserveerd voor bugs waarbij de live omgeving ertoe doet.
- Mantis zou voor normale werking geen mens moeten vereisen. Handmatige VNC is een reddingspad,
  niet het standaardpad.
- Mantis slaat geen ruwe secrets op in artifacts, logs, screenshots, Markdown-
  rapporten of PR-opmerkingen.

## Eigenaarschap

Mantis leeft in de OpenClaw QA-stack.

- OpenClaw is eigenaar van de scenarioruntime, transportadapters, het bewijsschema en
  de lokale CLI onder `pnpm openclaw qa mantis`.
- QA Lab is eigenaar van de live transport-harnessonderdelen, browser-capturehelpers en
  artifact-writers.
- Crabbox is eigenaar van opgewarmde Linux-machines wanneer een externe VM nodig is.
- GitHub Actions is eigenaar van het externe workflow-entrypoint en artifactretentie.
- ClawSweeper is eigenaar van GitHub-commentaarrouting: maintainercommando's parsen,
  de workflow dispatchen en de definitieve PR-opmerking plaatsen.
- OpenClaw-agents sturen Mantis aan via Codex wanneer een scenario agentische setup,
  debugging of rapportage van vastgelopen toestand nodig heeft.

Deze grens houdt transportkennis in OpenClaw, machineplanning in
Crabbox en maintainer-workflowlijm in ClawSweeper.

## Commandovorm

Het eerste lokale commando verifieert de Discord-bot, guild, kanaal, berichtverzending,
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

De runner maakt detached baseline- en kandidaat-worktrees onder de outputmap,
installeert dependencies, bouwt elke ref, voert het scenario uit met
`--allow-failures` en schrijft daarna `baseline/`, `candidate/`, `comparison.json`
en `mantis-report.md`. Voor het eerste Discord-scenario betekent een succesvolle verificatie
dat de baselinestatus `fail` is en de kandidaatstatus `pass`.

De eerste VM/browser-primitive is de desktop-smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Deze least of hergebruikt een Crabbox-desktopmachine, start een zichtbare browser binnen de
VNC-sessie, legt de desktop vast, haalt artifacts terug naar de lokale outputmap
en schrijft het reconnect-commando in het rapport. Het commando gebruikt standaard
de Hetzner-provider omdat dit de eerste provider is met werkende desktop/VNC-
dekking in de Mantis-lane. Overschrijf dit met `--provider`, `--crabbox-bin` of
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` wanneer je tegen een andere Crabbox-fleet draait.

Nuttige desktop-smoke-flags:

- `--lease-id <cbx_...>` of `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` hergebruikt een opgewarmde desktop.
- `--browser-url <url>` wijzigt de pagina die in de zichtbare browser wordt geopend.
- `--html-file <path>` rendert een repo-lokaal HTML-artifact in de zichtbare browser. Mantis gebruikt dit om de gegenereerde Discord status-reactietijdlijn via een echte Crabbox-desktop vast te leggen.
- `--keep-lease` of `OPENCLAW_MANTIS_KEEP_VM=1` houdt een nieuw gemaakte geslaagde lease open voor VNC-inspectie. Mislukte runs houden de lease standaard open wanneer er een is gemaakt, zodat een operator opnieuw kan verbinden.
- `--class`, `--idle-timeout` en `--ttl` stemmen machinegrootte en leaselevensduur af.

De eerste volledige desktoptransport-primitive is de Slack desktop-smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Deze least of hergebruikt een Crabbox-desktopmachine, synchroniseert de huidige checkout naar
de VM, draait `pnpm openclaw qa slack` binnen die VM, opent Slack Web in de VNC-
browser, legt de zichtbare desktop vast en kopieert zowel de Slack QA-artifacts als
de VNC-screenshot terug naar de lokale outputmap. Dit is de eerste Mantis-
vorm waarin de SUT OpenClaw Gateway en de browser allebei binnen dezelfde
Linux-desktop-VM leven.

Met `--gateway-setup` bereidt het commando een persistente wegwerpbare OpenClaw-
home voor op `$HOME/.openclaw-mantis/slack-openclaw`, patcht Slack Socket Mode-
configuratie voor het geselecteerde kanaal, start `openclaw gateway run` op poort
`38973` en houdt Chrome actief in de VNC-sessie. Dit is de modus "laat me een
Linux-desktop achter met Slack en een actieve claw"; de bot-naar-bot Slack QA-lane
blijft de standaard wanneer `--gateway-setup` wordt weggelaten.

Vereiste invoer voor `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` voor de externe modellane. Als alleen
  `OPENAI_API_KEY` lokaal is ingesteld, mappt Mantis die naar `OPENCLAW_LIVE_OPENAI_KEY`
  voordat Crabbox wordt aangeroepen, zodat Crabbox' `OPENCLAW_*` env-forwarding deze
  de VM in kan dragen.

Nuttige Slack desktop-flags:

- `--lease-id <cbx_...>` draait opnieuw tegen een machine waarop een operator al via VNC bij Slack Web heeft ingelogd.
- `--gateway-setup` start een persistente OpenClaw Slack Gateway in de VM in plaats van alleen de bot-naar-bot QA-lane uit te voeren.
- `--slack-url <url>` opent een specifieke Slack Web-URL. Zonder deze flag leidt Mantis `https://app.slack.com/client/<team>/<channel>` af uit Slack `auth.test` wanneer de SUT-bottoken beschikbaar is.
- `--slack-channel-id <id>` bepaalt de Slack-kanaal-allowlist die gatewaysetup gebruikt.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` bepaalt het persistente Chrome-profiel binnen de VM. De standaard is `$HOME/.config/openclaw-mantis/slack-chrome-profile`, zodat een handmatige Slack Web-login herstarts op dezelfde lease overleeft.
- `--credential-source convex --credential-role ci` gebruikt de gedeelde credentialpool in plaats van directe Slack-envtokens.
- `--provider-mode`, `--model`, `--alt-model` en `--fast` worden doorgegeven aan de Slack live-lane.

De GitHub-smokeworkflow is `Mantis Discord Smoke`. De voor- en na-GitHub-
workflow voor het eerste echte scenario is `Mantis Discord Status Reactions`. Deze
accepteert:

- `baseline_ref`: de ref waarvan wordt verwacht dat die queued-only-gedrag reproduceert.
- `candidate_ref`: de ref waarvan wordt verwacht dat die `queued -> thinking -> done` toont.

Deze checkt de workflow-harnessref uit, bouwt aparte baseline- en kandidaat-
worktrees, draait `discord-status-reactions-tool-only` tegen elke worktree en
uploadt `baseline/`, `candidate/`, `comparison.json` en `mantis-report.md` als
Actions-artifacts. Deze rendert ook de tijdlijn-HTML van elke lane in een Crabbox-
desktopbrowser en publiceert die VNC-screenshots naast de deterministische
tijdlijn-PNG's in de PR-opmerking. De workflow bouwt de Crabbox CLI vanuit
`openclaw/crabbox` main zodat deze de huidige desktop/browser-leaseflags kan gebruiken
voordat de volgende Crabbox-binaryrelease wordt gemaakt.

Je kunt de status-reacties-run ook direct vanuit een PR-opmerking starten:

```text
@Mantis discord status reactions
```

De commentaartrigger is bewust smal. Deze draait alleen op pull request-
opmerkingen van gebruikers met schrijf-, maintain- of admin-toegang, en herkent alleen
Discord status-reactieverzoeken. Standaard gebruikt deze de bekende slechte baseline-ref
en de huidige PR-head-SHA als kandidaat. Maintainers kunnen beide refs overschrijven:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper-commandovoorbeelden:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Het eerste commando is expliciet en scenariogericht. Het tweede kan later een PR
of issue mappen naar aanbevolen Mantis-scenario's op basis van labels, gewijzigde bestanden en
ClawSweeper-reviewbevindingen.

## Runlevenscyclus

1. Verkrijg credentials.
2. Wijs een VM toe of hergebruik er een.
3. Bereid het desktop/browserprofiel voor wanneer het scenario UI-bewijs nodig heeft.
4. Bereid een schone checkout voor de baseline-ref voor.
5. Installeer dependencies en bouw alleen wat het scenario nodig heeft.
6. Start een child OpenClaw Gateway met een geïsoleerde state-directory.
7. Configureer de live transportlaag, provider, model en browserprofiel.
8. Voer het scenario uit en leg baseline-bewijs vast.
9. Stop de Gateway en bewaar logs.
10. Bereid de kandidaat-ref in dezelfde VM voor.
11. Voer hetzelfde scenario uit en leg kandidaatbewijs vast.
12. Vergelijk de oracle-resultaten en visueel bewijs.
13. Schrijf Markdown, JSON, logs, screenshots en optionele trace-artifacts.
14. Upload GitHub Actions-artifacts.
15. Plaats een beknopt PR- of Discord-statusbericht.

Het scenario moet op twee verschillende manieren kunnen falen:

- **Bug gereproduceerd**: baseline faalde op de verwachte manier.
- **Harnessfout**: omgevingssetup, credentials, Discord API, browser of
  provider faalde voordat de bug-oracle betekenisvol was.

Het eindrapport moet deze gevallen scheiden, zodat maintainers een flakende
omgeving niet verwarren met productgedrag.

## Discord-MVP

Het eerste scenario moet gericht zijn op Discord-statusreacties in guild-kanalen waar
de bronantwoordbezorgmodus `message_tool_only` is.

Waarom dit een goede Mantis-seed is:

- Het is zichtbaar in Discord als reacties op het triggerbericht.
- Het heeft een sterke REST-oracle via Discord-berichtreactiestatus.
- Het oefent een echte OpenClaw Gateway, Discord-botauthenticatie, berichtdispatch,
  bronantwoordbezorgmodus, statusreactiestatus en modelbeurtlevenscyclus.
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

Baseline-bewijs moet de queued-bevestigingsreactie tonen, maar geen
levenscyclustransitie in tool-only-modus. Kandidaatbewijs moet tonen dat lifecycle-
statusreacties draaien wanneer `messages.statusReactions.enabled` expliciet
`true` is.

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

Het configureert de SUT met altijd actieve guild-verwerking, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` en expliciete statusreacties. De oracle
pollt het echte Discord-triggerbericht en verwacht de waargenomen reeks
`👀 -> 🤔 -> 👍`. Artefacten omvatten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` en
`discord-status-reactions-tool-only-timeline.png`.

## Bestaande QA-onderdelen

Mantis moet voortbouwen op de bestaande private QA-stack in plaats van vanaf
nul te beginnen:

- `pnpm openclaw qa discord` voert al een live Discord-lane uit met driver- en
  SUT-bots.
- De live-transportrunner schrijft al rapporten en waargenomen-berichtartefacten
  onder `.artifacts/qa-e2e/`.
- Convex-referentieleases bieden al exclusieve toegang tot gedeelde live
  transportreferenties.
- De browserbesturingsservice ondersteunt al screenshots, snapshots,
  headless beheerde profielen en remote CDP-profielen.
- QA Lab heeft al een debugger-UI en bus voor transportvormige tests.

De eerste Mantis-implementatie kan een dunne before/after-runner over deze
onderdelen zijn, plus één visuele bewijslaag.

## Bewijsmodel

Elke run schrijft een stabiele artefactdirectory:

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

`mantis-summary.json` moet de machineleesbare bron van waarheid zijn. Het
Markdown-rapport is voor PR-opmerkingen en menselijke beoordeling.

De samenvatting moet bevatten:

- geteste refs en SHA's
- transport- en scenario-id
- machineprovider en machine-id of lease-id
- referentiebron zonder geheime waarden
- baseline-resultaat
- kandidaatresultaat
- of de bug op de baseline werd gereproduceerd
- of de kandidaat deze heeft opgelost
- artefactpaden
- opgeschoonde setup- of cleanup-problemen

Screenshots zijn bewijs, geen geheimen. Ze vereisen nog steeds discipline voor
redactie: private kanaalnamen, gebruikersnamen of berichtinhoud kunnen zichtbaar
zijn. Geef voor publieke PR's de voorkeur aan GitHub Actions-artefactlinks boven
inline afbeeldingen totdat het redactieverhaal sterker is.

## Browser en VNC

De browser-lane heeft twee modi:

- **Headless automatisering**: standaard voor CI. Chrome draait met CDP
  ingeschakeld, en Playwright of OpenClaw-browserbesturing legt screenshots vast.
- **VNC-redding**: ingeschakeld op dezelfde VM wanneer login, MFA,
  Discord-anti-automatisering of visuele debugging een mens nodig heeft.

Het Discord-observerbrowserprofiel moet persistent genoeg zijn om niet bij elke
run in te hoeven loggen, maar geïsoleerd zijn van persoonlijke browserstatus. Een
profiel hoort bij de Mantis-machinepool, niet bij een ontwikkelaarslaptop.

Wanneer Mantis vastloopt, plaatst het een Discord-statusbericht met:

- run-id
- scenario-id
- machineprovider
- artefactdirectory
- VNC- of noVNC-verbindingsinstructies indien beschikbaar
- korte blokkadetekst

De eerste private deployment kan deze berichten naar het bestaande
operatorkanaal posten en later naar een speciaal Mantis-kanaal verplaatsen.

## Machines

Mantis moet voor de eerste remote implementatie de voorkeur geven aan AWS via
Crabbox. Crabbox geeft ons opgewarmde machines, lease-tracking, hydratatie,
logs, resultaten en cleanup. Als AWS-capaciteit te traag of niet beschikbaar is,
voeg dan een Hetzner-provider toe achter dezelfde machine-interface.

Minimale VM-vereisten:

- Linux met een desktopgeschikte Chrome- of Chromium-installatie
- CDP-toegang voor browserautomatisering
- VNC of noVNC voor redding
- Node 22 en pnpm
- OpenClaw-checkout en dependency-cache
- Playwright Chromium-browsercache wanneer Playwright wordt gebruikt
- genoeg CPU en geheugen voor één OpenClaw Gateway, één browser en één modelrun
- uitgaande toegang tot Discord, GitHub, modelproviders en de referentiebroker

De VM mag geen langlevende ruwe geheimen bewaren buiten de verwachte opslag voor
referenties of browserprofielen.

## Geheimen

Geheimen staan in GitHub-organisatie- of repositorygeheimen voor remote runs, en
in een lokaal door de operator beheerd geheimenbestand voor lokale runs.

Aanbevolen geheime namen:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` voor publieke GitHub-artefactuploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Op lange termijn moet de Convex-referentiepool de normale bron blijven voor
live transportreferenties. GitHub-geheimen bootstrappen de broker en fallback-
lanes. De Discord-statusreacties-workflow koppelt de Mantis Crabbox-geheimen
terug naar de omgevingsvariabelen `CRABBOX_COORDINATOR` en
`CRABBOX_COORDINATOR_TOKEN` die de Crabbox CLI verwacht. De gewone
GitHub-geheimnamen `CRABBOX_*` blijven geaccepteerd als compatibiliteitsfallback.

De Mantis-runner mag nooit afdrukken:

- Discord-bottokens
- provider-API-sleutels
- browsercookies
- inhoud van auth-profielen
- VNC-wachtwoorden
- ruwe referentiepayloads

Publieke artefactuploads moeten ook Discord-doelmetadata zoals bot-, guild-,
kanaal- en bericht-id's redigeren. De GitHub-smoke-workflow schakelt
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` om deze reden in.

Als een token per ongeluk in een issue, PR, chat of log wordt geplakt, roteer het
nadat het nieuwe geheim is opgeslagen.

## GitHub-artefacten en PR-opmerkingen

Mantis-workflows moeten de volledige bewijsbundel uploaden als een kortlevend
Actions-artefact. Wanneer de workflow wordt uitgevoerd voor een bugrapport of
fix-PR, moet deze ook de geredigeerde PNG-screenshots publiceren naar de
`qa-artifacts`-branch en een opmerking op die bug of fix-PR upserten met inline
before/after-screenshots. Plaats het primaire bewijs niet alleen op een generieke
QA-automatiserings-PR. Ruwe logs, waargenomen berichten en ander omvangrijk
bewijs blijven in het Actions-artefact.

Productieworkflows moeten die opmerkingen plaatsen met de Mantis GitHub App, niet
met `github-actions[bot]`. Sla de app-id en private key op als
`MANTIS_GITHUB_APP_ID` en `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions-
geheimen. De workflow gebruikt een verborgen marker als upsert-sleutel, werkt
die opmerking bij wanneer het token deze kan bewerken, en maakt een nieuwe
Mantis-eigendom opmerking wanneer een oudere bot-eigendom marker niet kan worden
bewerkt.

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

Wanneer de run faalt omdat de harness faalde, moet de opmerking dat zeggen in
plaats van te impliceren dat de kandidaat faalde.

## Private deploymentnotities

Een private deployment heeft mogelijk al een Mantis Discord-applicatie. Hergebruik
die applicatie in plaats van een andere app te maken wanneer deze de juiste
botrechten heeft en veilig kan worden geroteerd.

Stel het initiële operatornotificatiekanaal in via geheimen of
deploymentconfiguratie. Het kan eerst naar een bestaand maintainer- of
operations-kanaal wijzen en daarna naar een speciaal Mantis-kanaal verhuizen
zodra dat bestaat.

Plaats geen guild-id's, kanaal-id's, bottokens, browsercookies of
VNC-wachtwoorden in dit document. Sla ze op in GitHub-geheimen, de
referentiebroker of de lokale geheimenopslag van de operator.

## Een scenario toevoegen

Een Mantis-scenario moet declareren:

- id en titel
- transport
- vereiste referenties
- baseline-refbeleid
- kandidaat-refbeleid
- OpenClaw-configpatch
- setup-stappen
- stimulus
- verwachte baseline-oracle
- verwachte kandidaat-oracle
- visuele vastlegdoelen
- timeoutbudget
- cleanup-stappen

Scenario's moeten de voorkeur geven aan kleine, getypeerde oracles:

- Discord-reactiestatus voor reactiefouten
- Discord-berichtreferenties voor threadingfouten
- Slack-thread-ts en reactie-API-status voor Slack-fouten
- e-mailbericht-id's en headers voor e-mailfouten
- browserscreenshots wanneer de UI het enige betrouwbare waarneembare element is

Vision-controles moeten additief zijn. Als een platform-API de bug kan bewijzen,
gebruik de API dan als de pass/fail-oracle en bewaar screenshots voor menselijk
vertrouwen.

## Provideruitbreiding

Na Discord kan dezelfde runner toevoegen:

- Slack: reacties, threads, appvermeldingen, modals, bestandsuploads.
- E-mail: Gmail-auth en berichtthreading met `gog` waar connectors niet genoeg
  zijn.
- WhatsApp: QR-login, heridentificatie, berichtbezorging, media, reacties.
- Telegram: gating voor groepsvermeldingen, opdrachten, reacties waar
  beschikbaar.
- Matrix: versleutelde rooms, thread- of antwoordrelaties, hervatten na herstart.

Elk transport moet één goedkoop smoke-scenario en één of meer bugklasse-
scenario's hebben. Dure visuele scenario's moeten opt-in blijven.

## Open vragen

- Welke Discord-bot moet de driver zijn, en welke de SUT, wanneer de bestaande
  Mantis-bot wordt hergebruikt?
- Moet de observerbrowserlogin een menselijk Discord-account, een testaccount of
  alleen botleesbaar REST-bewijs gebruiken voor de eerste fase?
- Hoe lang moet GitHub Mantis-artefacten voor PR's bewaren?
- Wanneer moet ClawSweeper automatisch Mantis aanbevelen in plaats van te wachten
  op een maintaineropdracht?
- Moeten screenshots worden geredigeerd of bijgesneden voordat ze voor publieke
  PR's worden geüpload?
