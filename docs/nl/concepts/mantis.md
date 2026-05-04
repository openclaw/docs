---
read_when:
    - Live visuele QA bouwen of uitvoeren voor OpenClaw-bugs
    - Voor- en naverificatie toevoegen voor een pull request
    - Discord-, Slack-, WhatsApp- of andere live-transportscenario's toevoegen
    - QA-runs debuggen waarvoor screenshots, browserautomatisering of VNC-toegang nodig zijn
summary: Mantis is het visuele end-to-end-verificatiesysteem voor het reproduceren van OpenClaw-bugs op live-transporten, het vastleggen van bewijs vóór en na, en het toevoegen van artefacten aan PR's.
title: Bidsprinkhaan
x-i18n:
    generated_at: "2026-05-04T02:23:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis is het end-to-end-verificatiesysteem van OpenClaw voor bugs die een echte
runtime, een echt transport en zichtbaar bewijs nodig hebben. Het voert een scenario uit tegen een bekende
slechte ref, legt bewijs vast, voert hetzelfde scenario uit tegen een kandidaat-ref en
publiceert de vergelijking als artefacten die een maintainer kan inspecteren vanuit een PR of
vanuit een lokale opdracht.

Mantis begint met Discord omdat Discord ons een eerste lane met hoge waarde geeft:
echte bot-authenticatie, echte guild-kanalen, reacties, threads, native opdrachten en een
browser-UI waarin mensen visueel kunnen bevestigen wat het transport liet zien.

## Doelen

- Reproduceer een bug uit een GitHub-issue of PR met dezelfde transportvorm die gebruikers
  zien.
- Leg een **vooraf**-artefact vast op de baseline-ref voordat de fix wordt toegepast.
- Leg een **achteraf**-artefact vast op de kandidaat-ref nadat de fix is toegepast.
- Gebruik waar mogelijk een deterministische oracle, zoals een Discord REST-reactie
  uitlezing of kanaaltranscriptcontrole.
- Leg screenshots vast wanneer de bug een zichtbaar UI-oppervlak heeft.
- Voer lokaal uit vanuit een door een agent aangestuurde CLI en op afstand vanuit GitHub.
- Bewaar genoeg machinestatus voor VNC-redding wanneer aanmelden, browserautomatisering of
  provider-authenticatie vastloopt.
- Plaats beknopte status in een operator-Discord-kanaal wanneer de uitvoering is geblokkeerd,
  handmatige VNC-hulp nodig heeft of klaar is.

## Niet-doelen

- Mantis is geen vervanging voor unit-tests. Een Mantis-uitvoering moet meestal een
  kleinere regressietest worden nadat de fix is begrepen.
- Mantis is niet de normale snelle CI-gate. Het is langzamer, gebruikt live-inloggegevens en
  is gereserveerd voor bugs waarbij de live-omgeving ertoe doet.
- Mantis zou voor normale werking geen mens moeten vereisen. Handmatige VNC is een reddingspad,
  niet het standaardpad.
- Mantis slaat geen ruwe geheimen op in artefacten, logs, screenshots, Markdown-
  rapporten of PR-opmerkingen.

## Eigenaarschap

Mantis leeft in de OpenClaw QA-stack.

- OpenClaw is eigenaar van de scenario-runtime, transportadapters, het bewijsschema en
  de lokale CLI onder `pnpm openclaw qa mantis`.
- QA Lab is eigenaar van de live-transportharnasonderdelen, browseropnamehelpers en
  artefactschrijvers.
- Crabbox is eigenaar van opgewarmde Linux-machines wanneer een externe VM nodig is.
- GitHub Actions is eigenaar van het externe workflow-entrypoint en artefactretentie.
- ClawSweeper is eigenaar van GitHub-commentaarrouting: maintainer-opdrachten parsen,
  de workflow dispatchen en de definitieve PR-opmerking plaatsen.
- OpenClaw-agents sturen Mantis aan via Codex wanneer een scenario agentische setup,
  debugging of rapportage van vastgelopen status nodig heeft.

Deze grens houdt transportkennis in OpenClaw, machineplanning in
Crabbox en maintainer-workflowlijm in ClawSweeper.

## Opdrachtvorm

De eerste lokale opdracht verifieert de Discord-bot, guild, kanaal, berichtverzending,
reactieverzending en artefactpad:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

De lokale vooraf- en achteraf-runner accepteert deze vorm:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

De runner maakt losgekoppelde baseline- en kandidaat-worktrees onder de output-
directory, installeert afhankelijkheden, bouwt elke ref, voert het scenario uit met
`--allow-failures` en schrijft daarna `baseline/`, `candidate/`, `comparison.json`,
en `mantis-report.md`. Voor het eerste Discord-scenario betekent een succesvolle verificatie
dat de baseline-status `fail` is en de kandidaatstatus `pass`.

De eerste VM/browser-primitieve is de desktop-smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Deze leaset of hergebruikt een Crabbox-desktopmachine, start een zichtbare browser binnen de
VNC-sessie, legt de desktop vast, haalt artefacten terug naar de lokale output-
directory en schrijft de opdracht om opnieuw te verbinden in het rapport. De opdracht gebruikt standaard
de Hetzner-provider omdat dit de eerste provider is met werkende desktop/VNC-
dekking in de Mantis-lane. Overschrijf dit met `--provider`, `--crabbox-bin` of
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` wanneer je tegen een andere Crabbox-fleet draait.

Nuttige desktop-smokevlaggen:

- `--lease-id <cbx_...>` of `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` hergebruikt een opgewarmde desktop.
- `--browser-url <url>` wijzigt de pagina die in de zichtbare browser wordt geopend.
- `--html-file <path>` rendert een repo-lokaal HTML-artefact in de zichtbare browser. Mantis gebruikt dit om de gegenereerde Discord-statusreactietijdlijn via een echte Crabbox-desktop vast te leggen.
- `--keep-lease` of `OPENCLAW_MANTIS_KEEP_VM=1` houdt een nieuw aangemaakte geslaagde lease open voor VNC-inspectie. Mislukte uitvoeringen houden de lease standaard vast wanneer er een is aangemaakt, zodat een operator opnieuw kan verbinden.
- `--class`, `--idle-timeout` en `--ttl` stemmen machinegrootte en leaselevensduur af.

De GitHub-smokeworkflow is `Mantis Discord Smoke`. De vooraf- en achteraf-GitHub-
workflow voor het eerste echte scenario is `Mantis Discord Status Reactions`. Deze
accepteert:

- `baseline_ref`: de ref waarvan wordt verwacht dat deze gedrag met alleen queued reproduceert.
- `candidate_ref`: de ref waarvan wordt verwacht dat deze `queued -> thinking -> done` toont.

Deze checkt de workflow-harness-ref uit, bouwt afzonderlijke baseline- en kandidaat-
worktrees, voert `discord-status-reactions-tool-only` uit tegen elke worktree en
uploadt `baseline/`, `candidate/`, `comparison.json` en `mantis-report.md` als
Actions-artefacten. Deze rendert ook de tijdlijn-HTML van elke lane in een Crabbox-
desktopbrowser en publiceert die VNC-screenshots naast de deterministische
tijdlijn-PNG's in de PR-opmerking. De workflow bouwt de Crabbox CLI vanuit
`openclaw/crabbox` main zodat deze de huidige desktop/browser-leasevlaggen kan gebruiken
voordat de volgende Crabbox-binaryrelease wordt uitgebracht.

Je kunt de statusreactie-uitvoering ook direct vanuit een PR-opmerking starten:

```text
@Mantis discord status reactions
```

De commentaartrigger is bewust smal. Deze draait alleen op pullrequest-
opmerkingen van gebruikers met schrijf-, maintain- of beheerdersrechten, en herkent alleen
Discord-statusreactieverzoeken. Standaard gebruikt deze de bekende slechte baseline-ref
en de huidige PR-head-SHA als kandidaat. Maintainers kunnen beide
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

## Uitvoeringslevenscyclus

1. Verkrijg inloggegevens.
2. Wijs een VM toe of hergebruik er een.
3. Bereid het desktop-/browserprofiel voor wanneer het scenario UI-bewijs nodig heeft.
4. Bereid een schone checkout voor de baseline-ref voor.
5. Installeer afhankelijkheden en bouw alleen wat het scenario nodig heeft.
6. Start een child OpenClaw Gateway met een geïsoleerde statusdirectory.
7. Configureer het live transport, de provider, het model en het browserprofiel.
8. Voer het scenario uit en leg baseline-bewijs vast.
9. Stop de Gateway en bewaar logs.
10. Bereid de kandidaat-ref voor in dezelfde VM.
11. Voer hetzelfde scenario uit en leg kandidaatbewijs vast.
12. Vergelijk de oracle-resultaten en visueel bewijs.
13. Schrijf Markdown, JSON, logs, screenshots en optionele trace-artefacten.
14. Upload GitHub Actions-artefacten.
15. Plaats een beknopte PR- of Discord-statusmelding.

Het scenario moet op twee verschillende manieren kunnen falen:

- **Bug gereproduceerd**: baseline faalde op de verwachte manier.
- **Harnasfout**: omgevingssetup, inloggegevens, Discord API, browser of
  provider faalde voordat de bug-oracle betekenisvol was.

Het eindrapport moet deze gevallen scheiden zodat maintainers een flakkerige
omgeving niet verwarren met productgedrag.

## Discord-MVP

Het eerste scenario moet Discord-statusreacties targeten in guild-kanalen waar
de bronantwoordleveringsmodus `message_tool_only` is.

Waarom dit een goede Mantis-start is:

- Het is zichtbaar in Discord als reacties op het triggerbericht.
- Het heeft een sterke REST-oracle via Discord-berichtreactiestatus.
- Het oefent een echte OpenClaw Gateway, Discord-bot-authenticatie, berichtdispatch,
  bronantwoordleveringsmodus, statusreactiestatus en modelbeurtleven cyclus.
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
levenscyclusovergang in tool-only-modus. Kandidaatbewijs moet tonen dat levenscyclus-
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

Dit configureert de SUT met always-on guild-afhandeling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` en expliciete statusreacties. De oracle
pollt het echte Discord-triggerbericht en verwacht de geobserveerde reeks
`👀 -> 🤔 -> 👍`. Artefacten omvatten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` en
`discord-status-reactions-tool-only-timeline.png`.

## Bestaande QA-onderdelen

Mantis moet voortbouwen op de bestaande private QA-stack in plaats van vanaf
nul te beginnen:

- `pnpm openclaw qa discord` voert al een live Discord-lane uit met driver- en
  SUT-bots.
- De live-transportrunner schrijft al rapporten en geobserveerdebericht-
  artefacten onder `.artifacts/qa-e2e/`.
- Convex-inloggegevensleases bieden al exclusieve toegang tot gedeelde live-
  transportinloggegevens.
- De browserbesturingsservice ondersteunt al screenshots, snapshots,
  headless beheerde profielen en externe CDP-profielen.
- QA Lab heeft al een debugger-UI en bus voor transportvormige tests.

De eerste Mantis-implementatie kan een dunne vooraf/achteraf-runner bovenop deze
onderdelen zijn, plus één visuele bewijslaag.

## Bewijsmodel

Elke uitvoering schrijft een stabiele artefactdirectory:

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
Markdown-rapport is voor PR-opmerkingen en menselijke review.

De samenvatting moet bevatten:

- geteste refs en SHA's
- transport- en scenario-id
- machineprovider en machine-id of lease-id
- inloggegevensbron zonder geheime waarden
- baseline-resultaat
- kandidaatresultaat
- of de bug op baseline is gereproduceerd
- of de kandidaat deze heeft gefixt
- artefactpaden
- opgeschoonde setup- of cleanup-problemen

Screenshots zijn bewijs, geen geheimen. Ze hebben nog steeds redactiediscipline nodig:
privékanaalnamen, gebruikersnamen of berichtinhoud kunnen verschijnen. Voor publieke PR's
hebben GitHub Actions-artefactlinks de voorkeur boven inline afbeeldingen totdat het redactieverhaal
sterker is.

## Browser en VNC

De browser-lane heeft twee modi:

- **Headless automatisering**: standaard voor CI. Chrome draait met CDP ingeschakeld, en
  Playwright of OpenClaw-browserbesturing legt screenshots vast.
- **VNC-redding**: ingeschakeld op dezelfde VM wanneer aanmelden, MFA, Discord-anti-automatisering
  of visueel debuggen een mens nodig heeft.

Het Discord-observerbrowserprofiel moet persistent genoeg zijn om te voorkomen dat
voor elke run opnieuw moet worden ingelogd, maar geisoleerd zijn van persoonlijke
browserstatus. Een profiel hoort bij de Mantis-machinepool, niet bij een
ontwikkelaarslaptop.

Wanneer Mantis vastloopt, plaatst het een Discord-statusbericht met:

- run-id
- scenario-id
- machineprovider
- artifactmap
- VNC- of noVNC-verbindingsinstructies indien beschikbaar
- korte blokkadetekst

De eerste private deployment kan deze berichten plaatsen in het bestaande
operatorkanaal en later naar een specifiek Mantis-kanaal verplaatsen.

## Machines

Mantis moet voor de eerste remote implementatie de voorkeur geven aan AWS via
Crabbox. Crabbox geeft ons voorverwarmde machines, lease-tracking, hydratatie,
logs, resultaten en opruiming. Als AWS-capaciteit te traag of niet beschikbaar
is, voeg dan een Hetzner-provider toe achter dezelfde machine-interface.

Minimale VM-vereisten:

- Linux met een desktopgeschikte Chrome- of Chromium-installatie
- CDP-toegang voor browserautomatisering
- VNC of noVNC voor herstel
- Node 22 en pnpm
- OpenClaw-checkout en dependency-cache
- Playwright Chromium-browsercache wanneer Playwright wordt gebruikt
- genoeg CPU en geheugen voor een OpenClaw Gateway, een browser en een modelrun
- uitgaande toegang tot Discord, GitHub, modelproviders en de credential broker

De VM mag geen langlevende ruwe secrets bewaren buiten de verwachte credential-
of browserprofielopslag.

## Secrets

Secrets staan in GitHub-organisatie- of repositorysecrets voor remote runs, en
in een lokaal door de operator beheerd secretbestand voor lokale runs.

Aanbevolen secretnamen:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` voor publieke GitHub-artifactuploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Op lange termijn moet de Convex-credentialpool de normale bron blijven voor live
transportcredentials. GitHub-secrets bootstrappen de broker en fallback-lanes.
De workflow voor Discord-statusreacties koppelt de Mantis Crabbox-secrets terug
naar de omgevingsvariabelen `CRABBOX_COORDINATOR` en
`CRABBOX_COORDINATOR_TOKEN` die de Crabbox CLI verwacht. De gewone
`CRABBOX_*` GitHub-secretnamen blijven geaccepteerd als compatibiliteitsfallback.

De Mantis-runner mag nooit het volgende afdrukken:

- Discord-bottokens
- provider-API-sleutels
- browsercookies
- inhoud van auth-profielen
- VNC-wachtwoorden
- ruwe credentialpayloads

Publieke artifactuploads moeten ook Discord-doelmetadata redigeren, zoals bot-,
guild-, kanaal- en bericht-id's. De GitHub-smokeworkflow schakelt
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` om deze reden in.

Als een token per ongeluk in een issue, PR, chat of log wordt geplakt, roteer
het dan nadat het nieuwe secret is opgeslagen.

## GitHub-artifacts en PR-opmerkingen

Mantis-workflows moeten de volledige bewijsbundel uploaden als een kortlevend
Actions-artifact. Wanneer de workflow wordt uitgevoerd voor een bugrapport of
fix-PR, moet deze ook de geredigeerde PNG-screenshots publiceren naar de
`qa-artifacts`-branch en een opmerking op die bug of fix-PR upserten met inline
voor/na-screenshots. Plaats het primaire bewijs niet alleen op een generieke
QA-automatiserings-PR. Ruwe logs, geobserveerde berichten en ander omvangrijk
bewijs blijven in het Actions-artifact.

Productieworkflows moeten die opmerkingen plaatsen met de Mantis GitHub App,
niet met `github-actions[bot]`. Sla de app-id en private key op als
GitHub Actions-secrets `MANTIS_GITHUB_APP_ID` en
`MANTIS_GITHUB_APP_PRIVATE_KEY`. De workflow gebruikt een verborgen marker als
upsert-sleutel, werkt die opmerking bij wanneer het token deze kan bewerken, en
maakt een nieuwe opmerking namens Mantis wanneer een oudere marker van een bot
niet kan worden bewerkt.

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

Wanneer de run mislukt omdat de harness faalde, moet de opmerking dat zeggen in
plaats van te impliceren dat de candidate faalde.

## Opmerkingen over private deployment

Een private deployment heeft mogelijk al een Mantis Discord-applicatie. Hergebruik
die applicatie in plaats van een andere app te maken wanneer deze de juiste
botrechten heeft en veilig kan worden geroteerd.

Stel het eerste operatornotificatiekanaal in via secrets of deploymentconfiguratie.
Het kan eerst naar een bestaand maintainer- of operations-kanaal wijzen en daarna
naar een specifiek Mantis-kanaal verhuizen zodra dat bestaat.

Zet geen guild-id's, kanaal-id's, bottokens, browsercookies of VNC-wachtwoorden
in dit document. Sla ze op in GitHub-secrets, de credential broker of de lokale
secretopslag van de operator.

## Een scenario toevoegen

Een Mantis-scenario moet declareren:

- id en titel
- transport
- vereiste credentials
- baselinerefbeleid
- candidaterefbeleid
- OpenClaw-configuratiepatch
- setupstappen
- stimulus
- verwachte baseline-oracle
- verwachte candidate-oracle
- visuele capturedoelen
- timeoutbudget
- opruimstappen

Scenario's moeten de voorkeur geven aan kleine, getypeerde oracles:

- Discord-reactiestatus voor reactiebugs
- Discord-berichtreferenties voor threadingbugs
- Slack-thread-ts en reactie-API-status voor Slack-bugs
- e-mailbericht-id's en headers voor e-mailbugs
- browserscreenshots wanneer de UI de enige betrouwbare observatie is

Vision-checks moeten aanvullend zijn. Als een platform-API de bug kan bewijzen,
gebruik dan de API als de pass/fail-oracle en bewaar screenshots voor menselijk
vertrouwen.

## Provideruitbreiding

Na Discord kan dezelfde runner het volgende toevoegen:

- Slack: reacties, threads, appvermeldingen, modals, bestandsuploads.
- E-mail: Gmail-auth en berichtthreading met `gog` wanneer connectors niet
  genoeg zijn.
- WhatsApp: QR-login, heridentificatie, berichtbezorging, media, reacties.
- Telegram: gating voor groepsvermeldingen, commando's, reacties waar beschikbaar.
- Matrix: versleutelde rooms, thread- of reply-relaties, hervatten na restart.

Elk transport moet een goedkoop smokescenario en een of meer bugklassescenario's
hebben. Dure visuele scenario's moeten opt-in blijven.

## Open vragen

- Welke Discord-bot moet de driver zijn en welke de SUT wanneer de bestaande
  Mantis-bot wordt hergebruikt?
- Moet de observerbrowserlogin in de eerste fase een menselijk Discord-account,
  een testaccount of alleen bot-leesbaar REST-bewijs gebruiken?
- Hoe lang moet GitHub Mantis-artifacts voor PR's bewaren?
- Wanneer moet ClawSweeper automatisch Mantis aanbevelen in plaats van te wachten
  op een maintainercommando?
- Moeten screenshots worden geredigeerd of bijgesneden voordat ze worden geupload
  voor publieke PR's?
