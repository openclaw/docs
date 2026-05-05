---
read_when:
    - Live visuele QA voor OpenClaw-bugs bouwen of uitvoeren
    - Voor- en naverificatie toevoegen voor een pull-aanvraag
    - Discord, Slack, WhatsApp of andere live-transportscenario's toevoegen
    - QA-runs debuggen waarvoor screenshots, browserautomatisering of VNC-toegang nodig zijn
summary: Mantis is het visuele end-to-end-verificatiesysteem voor het reproduceren van OpenClaw-bugs op live-transporten, het vastleggen van bewijs van vóór en na de wijziging en het toevoegen van artefacten aan PR's.
title: Bidsprinkhaan
x-i18n:
    generated_at: "2026-05-05T06:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis is het OpenClaw end-to-endverificatiesysteem voor bugs die een echte
runtime, een echt transport en zichtbaar bewijs nodig hebben. Het voert een
scenario uit tegen een bekende slechte ref, legt bewijs vast, voert hetzelfde
scenario uit tegen een kandidaat-ref, en publiceert de vergelijking als artifacts
die een maintainer vanuit een PR of een lokale opdracht kan inspecteren.

Mantis begint met Discord omdat Discord ons een waardevolle eerste lane geeft:
echte bot-authenticatie, echte guild-kanalen, reacties, threads, native
opdrachten en een browser-UI waarin mensen visueel kunnen bevestigen wat het
transport liet zien.

## Doelen

- Reproduceer een bug uit een GitHub-issue of PR met dezelfde transportvorm die
  gebruikers zien.
- Leg een **voor**-artifact vast op de baseline-ref voordat de fix wordt
  toegepast.
- Leg een **na**-artifact vast op de kandidaat-ref nadat de fix is toegepast.
- Gebruik waar mogelijk een deterministische oracle, zoals het lezen van een
  Discord REST-reactie of een controle van een kanaaltranscript.
- Leg screenshots vast wanneer de bug een zichtbaar UI-oppervlak heeft.
- Voer lokaal uit vanuit een agent-gestuurde CLI en op afstand vanuit GitHub.
- Bewaar genoeg machinetoestand voor VNC-redding wanneer inloggen,
  browserautomatisering of provider-authenticatie vastloopt.
- Plaats beknopte status in een operator-Discord-kanaal wanneer de run is
  geblokkeerd, handmatige VNC-hulp nodig heeft, of klaar is.

## Niet-doelen

- Mantis is geen vervanging voor unit-tests. Een Mantis-run moet meestal een
  kleinere regressietest worden nadat de fix is begrepen.
- Mantis is niet de normale snelle CI-gate. Het is trager, gebruikt live
  inloggegevens en is gereserveerd voor bugs waarbij de live-omgeving ertoe doet.
- Mantis moet voor normale werking geen mens vereisen. Handmatige VNC is een
  reddingspad, niet het standaardpad.
- Mantis slaat geen ruwe geheimen op in artifacts, logs, screenshots,
  Markdown-rapporten of PR-opmerkingen.

## Eigenaarschap

Mantis leeft in de OpenClaw QA-stack.

- OpenClaw bezit de scenarioruntime, transportadapters, bewijsschema en lokale
  CLI onder `pnpm openclaw qa mantis`.
- QA Lab bezit de live transport-harnasonderdelen, browser-capturehelpers en
  artifact-schrijvers.
- Crabbox bezit opgewarmde Linux-machines wanneer een externe VM nodig is.
- GitHub Actions bezit het remote workflow-entrypoint en artifact-retentie.
- ClawSweeper bezit GitHub-opmerkingsroutering: maintainer-opdrachten parsen,
  de workflow dispatchen en de uiteindelijke PR-opmerking plaatsen.
- OpenClaw-agenten sturen Mantis via Codex aan wanneer een scenario agentische
  setup, debugging of vastgelopen-toestandsrapportage nodig heeft.

Deze grens houdt transportkennis in OpenClaw, machineplanning in Crabbox en
maintainer-workflowlijm in ClawSweeper.

## Commandovorm

De eerste lokale opdracht verifieert de Discord-bot, guild, kanaal, bericht
versturen, reactie versturen en artifact-pad:

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

De runner maakt losgekoppelde baseline- en kandidaat-worktrees onder de
uitvoermap, installeert afhankelijkheden, bouwt elke ref, voert het scenario uit
met `--allow-failures`, en schrijft daarna `baseline/`, `candidate/`,
`comparison.json` en `mantis-report.md`. Voor het eerste Discord-scenario
betekent een succesvolle verificatie dat de baseline-status `fail` is en de
kandidaatstatus `pass`.

De eerste VM/browser-primitieve is de desktop-smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Die leaset of hergebruikt een Crabbox-desktopmachine, start een zichtbare browser
binnen de VNC-sessie, legt de desktop vast, haalt artifacts terug naar de lokale
uitvoermap, en schrijft de reconnect-opdracht in het rapport. De opdracht
gebruikt standaard de Hetzner-provider omdat dit de eerste provider is met
werkende desktop/VNC-dekking in de Mantis-lane. Overschrijf dit met `--provider`,
`--crabbox-bin` of `OPENCLAW_MANTIS_CRABBOX_PROVIDER` wanneer je tegen een andere
Crabbox-vloot uitvoert.

Nuttige desktop-smokevlaggen:

- `--lease-id <cbx_...>` of `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` hergebruikt een opgewarmde desktop.
- `--browser-url <url>` wijzigt de pagina die in de zichtbare browser wordt geopend.
- `--html-file <path>` rendert een repo-lokaal HTML-artifact in de zichtbare browser. Mantis gebruikt dit om de gegenereerde Discord-statusreactietijdlijn via een echte Crabbox-desktop vast te leggen.
- `--keep-lease` of `OPENCLAW_MANTIS_KEEP_VM=1` houdt een nieuw aangemaakte geslaagde lease open voor VNC-inspectie. Mislukte runs houden de lease standaard wanneer er een is aangemaakt, zodat een operator opnieuw kan verbinden.
- `--class`, `--idle-timeout` en `--ttl` stemmen machinegrootte en leaselevensduur af.

De eerste volledige desktop-transportprimitieve is de Slack-desktop-smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Die leaset of hergebruikt een Crabbox-desktopmachine, synchroniseert de huidige
checkout naar de VM, voert `pnpm openclaw qa slack` uit binnen die VM, opent Slack
Web in de VNC-browser, legt de zichtbare desktop vast, en kopieert zowel de Slack
QA-artifacts als de VNC-screenshot terug naar de lokale uitvoermap. Dit is de
eerste Mantis-vorm waarbij de SUT OpenClaw Gateway en de browser beide binnen
dezelfde Linux-desktop-VM leven.

Met `--gateway-setup` bereidt de opdracht een persistente wegwerp-OpenClaw-home
voor op `$HOME/.openclaw-mantis/slack-openclaw`, patcht Slack Socket
Mode-configuratie voor het geselecteerde kanaal, start `openclaw gateway run` op
poort `38973`, en houdt Chrome actief in de VNC-sessie. Dit is de modus "laat me
een Linux-desktop met Slack en een draaiende claw achter"; de bot-naar-bot
Slack QA-lane blijft de standaard wanneer `--gateway-setup` wordt weggelaten.

Vereiste invoer voor `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` voor de remote model-lane. Als lokaal alleen
  `OPENAI_API_KEY` is ingesteld, koppelt Mantis die aan `OPENCLAW_LIVE_OPENAI_KEY`
  voordat Crabbox wordt aangeroepen, zodat Crabbox' `OPENCLAW_*` env-forwarding
  die de VM in kan dragen.

Nuttige Slack-desktopvlaggen:

- `--lease-id <cbx_...>` voert opnieuw uit tegen een machine waarop een operator al via VNC is ingelogd op Slack Web.
- `--gateway-setup` start een persistente OpenClaw Slack Gateway in de VM in plaats van alleen de bot-naar-bot QA-lane uit te voeren.
- `--slack-url <url>` opent een specifieke Slack Web-URL. Zonder deze vlag leidt Mantis `https://app.slack.com/client/<team>/<channel>` af van Slack `auth.test` wanneer de SUT-bottoken beschikbaar is.
- `--slack-channel-id <id>` bepaalt de Slack-kanaalallowlist die door Gateway-setup wordt gebruikt.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` bepaalt het persistente Chrome-profiel binnen de VM. De standaard is `$HOME/.config/openclaw-mantis/slack-chrome-profile`, zodat een handmatige Slack Web-login herstarts op dezelfde lease overleeft.
- `--credential-source convex --credential-role ci` gebruikt de gedeelde inloggegevenspool in plaats van directe Slack-env-tokens.
- `--provider-mode`, `--model`, `--alt-model` en `--fast` worden doorgegeven aan de Slack live-lane.

De GitHub-smokeworkflow is `Mantis Discord Smoke`. De voor- en na-GitHub-workflow
voor het eerste echte scenario is `Mantis Discord Status Reactions`. Die
accepteert:

- `baseline_ref`: de ref waarvan wordt verwacht dat die queued-only-gedrag reproduceert.
- `candidate_ref`: de ref waarvan wordt verwacht dat die `queued -> thinking -> done` laat zien.

Die checkt de workflow-harnas-ref uit, bouwt aparte baseline- en
kandidaat-worktrees, voert `discord-status-reactions-tool-only` uit tegen elke
worktree, en uploadt `baseline/`, `candidate/`, `comparison.json` en
`mantis-report.md` als Actions-artifacts. Die rendert ook de tijdlijn-HTML van
elke lane in een Crabbox-desktopbrowser en publiceert die VNC-screenshots naast
de deterministische tijdlijn-PNG's in de PR-opmerking. Dezelfde PR-opmerking
linkt naar de desktop-MP4-opnames die tijdens de VNC-browserrender zijn
vastgelegd, terwijl de screenshots inline blijven voor snelle review. De
workflow bouwt de Crabbox-CLI vanuit `openclaw/crabbox` main zodat die de huidige
desktop/browser-leasevlaggen kan gebruiken voordat de volgende Crabbox-binary
release wordt gesneden.

Je kunt de status-reacties-run ook rechtstreeks vanuit een PR-opmerking starten:

```text
@Mantis discord status reactions
```

De opmerkingstrigger is bewust smal. Die draait alleen op pull
request-opmerkingen van gebruikers met write-, maintain- of admin-toegang, en
herkent alleen Discord-statusreactieverzoeken. Standaard gebruikt die de bekende
slechte baseline-ref en de huidige PR-head-SHA als kandidaat. Maintainers kunnen
beide refs overschrijven:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Voorbeelden van ClawSweeper-opdrachten:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

De eerste opdracht is expliciet en scenariogericht. De tweede kan later een PR of
issue koppelen aan aanbevolen Mantis-scenario's op basis van labels, gewijzigde
bestanden en ClawSweeper-reviewbevindingen.

## Run-levenscyclus

1. Verkrijg inloggegevens.
2. Wijs een VM toe of hergebruik er een.
3. Bereid het desktop/browser-profiel voor wanneer het scenario UI-bewijs nodig heeft.
4. Bereid een schone checkout voor de baseline-ref voor.
5. Installeer afhankelijkheden en bouw alleen wat het scenario nodig heeft.
6. Start een child OpenClaw Gateway met een geïsoleerde toestandsmap.
7. Configureer het live transport, de provider, het model en het browserprofiel.
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
- **Harnasfout**: omgevingssetup, inloggegevens, Discord API, browser of
  provider faalde voordat de bug-oracle betekenisvol was.

Het eindrapport moet deze gevallen scheiden zodat maintainers een onbetrouwbare
omgeving niet verwarren met productgedrag.

## Discord-MVP

Het eerste scenario moet gericht zijn op Discord-statusreacties in guild-kanalen
waarbij de bronantwoordaflevermodus `message_tool_only` is.

Waarom het een goede Mantis-seed is:

- Het is zichtbaar in Discord als reacties op het triggerende bericht.
- Het heeft een sterke REST-oracle via de reactietoestand van Discord-berichten.
- Het oefent een echte OpenClaw Gateway, Discord-bot-authenticatie,
  berichtdispatch, bronantwoordaflevermodus, statusreactietoestand en
  model-turnlevenscyclus.
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
levenscyclusovergang in tool-only-modus. Kandidaatbewijs moet tonen dat
levenscyclusstatusreacties draaien wanneer `messages.statusReactions.enabled`
expliciet `true` is.

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

Dit configureert de SUT met altijd ingeschakelde guild-afhandeling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, en expliciete statusreacties. De oracle
pollt het echte Discord-triggerbericht en verwacht de waargenomen reeks
`👀 -> 🤔 -> 👍`. Artefacten omvatten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`, en
`discord-status-reactions-tool-only-timeline.png`.

## Bestaande QA-onderdelen

Mantis moet voortbouwen op de bestaande private QA-stack in plaats van vanaf
nul te beginnen:

- `pnpm openclaw qa discord` voert al een live Discord-lane uit met driver- en
  SUT-bots.
- De live-transportrunner schrijft al rapporten en waargenomen berichtartefacten
  onder `.artifacts/qa-e2e/`.
- Convex-credentialleases bieden al exclusieve toegang tot gedeelde live
  transportcredentials.
- De browserbesturingsservice ondersteunt al screenshots, snapshots,
  beheerde headless profielen, en externe CDP-profielen.
- QA Lab heeft al een debugger-UI en bus voor transportvormige tests.

De eerste Mantis-implementatie kan een dunne voor/na-runner zijn boven op deze
onderdelen, plus een laag voor visueel bewijs.

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

`mantis-summary.json` moet de machinaal leesbare bron van waarheid zijn. Het
Markdown-rapport is voor PR-opmerkingen en menselijke beoordeling.

De samenvatting moet bevatten:

- geteste refs en SHA's
- transport- en scenario-id
- machineprovider en machine-id of lease-id
- credentialbron zonder geheime waarden
- baseline-resultaat
- kandidaatresultaat
- of de bug op de baseline is gereproduceerd
- of de kandidaat deze heeft opgelost
- artefactpaden
- opgeschoonde setup- of cleanup-problemen

Screenshots zijn bewijs, geen geheimen. Ze vereisen nog steeds discipline rond
redactie: private kanaalnamen, gebruikersnamen, of berichtinhoud kunnen zichtbaar
zijn. Geef voor openbare PR's de voorkeur aan GitHub Actions-artefactlinks boven
inline afbeeldingen totdat het redactieverhaal sterker is.

## Browser En VNC

De browser-lane heeft twee modi:

- **Headless automatisering**: standaard voor CI. Chrome draait met CDP
  ingeschakeld, en Playwright of OpenClaw-browserbesturing legt screenshots vast.
- **VNC-redding**: ingeschakeld op dezelfde VM wanneer login, MFA, Discord
  anti-automatisering, of visuele debugging een mens vereist.

Het Discord-observerbrowserprofiel moet persistent genoeg zijn om niet voor elke
run opnieuw in te loggen, maar geïsoleerd zijn van persoonlijke browserstatus. Een
profiel hoort bij de Mantis-machinepool, niet bij een ontwikkelaarslaptop.

Wanneer Mantis vastloopt, plaatst het een Discord-statusbericht met:

- run-id
- scenario-id
- machineprovider
- artefactdirectory
- VNC- of noVNC-verbindingsinstructies indien beschikbaar
- korte blokkadetekst

De eerste private deployment kan deze berichten in het bestaande operatorkanaal
plaatsen en later verplaatsen naar een speciaal Mantis-kanaal.

## Machines

Mantis moet voor de eerste externe implementatie de voorkeur geven aan AWS via
Crabbox. Crabbox geeft ons opgewarmde machines, leasetracking, hydratatie, logs,
resultaten, en cleanup. Als AWS-capaciteit te traag of niet beschikbaar is, voeg
dan een Hetzner-provider toe achter dezelfde machine-interface.

Minimale VM-vereisten:

- Linux met een desktopgeschikte Chrome- of Chromium-installatie
- CDP-toegang voor browserautomatisering
- VNC of noVNC voor redding
- Node 22 en pnpm
- OpenClaw-checkout en dependencycache
- Playwright Chromium-browsercache wanneer Playwright wordt gebruikt
- genoeg CPU en geheugen voor één OpenClaw Gateway, één browser, en één modelrun
- uitgaande toegang tot Discord, GitHub, modelproviders, en de credentialbroker

De VM mag geen langlevende ruwe geheimen buiten de verwachte credential- of
browserprofielopslag bewaren.

## Geheimen

Geheimen staan in GitHub-organisatie- of repositorygeheimen voor externe runs, en
in een lokaal, door de operator beheerd geheimenbestand voor lokale runs.

Aanbevolen geheime namen:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` voor openbare GitHub-artefactuploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Op lange termijn moet de Convex-credentialpool de normale bron blijven voor live
transportcredentials. GitHub-geheimen bootstrappen de broker en fallback-lanes.
De Discord-statusreacties-workflow koppelt de Mantis Crabbox-geheimen terug aan
de omgevingsvariabelen `CRABBOX_COORDINATOR` en `CRABBOX_COORDINATOR_TOKEN`
die de Crabbox CLI verwacht. De gewone GitHub-geheimnamen `CRABBOX_*` blijven
geaccepteerd als compatibiliteitsfallback.

De Mantis-runner mag nooit afdrukken:

- Discord-bottokens
- provider-API-sleutels
- browsercookies
- inhoud van auth-profielen
- VNC-wachtwoorden
- ruwe credentialpayloads

Openbare artefactuploads moeten ook Discord-doelmetadata redigeren, zoals bot-,
guild-, kanaal-, en bericht-id's. De GitHub-smoke-workflow schakelt om deze reden
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` in.

Als een token per ongeluk in een issue, PR, chat, of log wordt geplakt, roteer het
nadat het nieuwe geheim is opgeslagen.

## GitHub-artefacten En PR-opmerkingen

Mantis-workflows moeten de volledige bewijsbundel uploaden als een kortlevend
Actions-artefact. Wanneer de workflow wordt uitgevoerd voor een bugrapport of
fix-PR, moet deze ook de geredigeerde PNG-screenshots publiceren naar de
`qa-artifacts`-branch en een opmerking op die bug of fix-PR upserten met inline
voor/na-screenshots. Plaats het primaire bewijs niet alleen op een generieke
QA-automatiserings-PR. Ruwe logs, waargenomen berichten, en ander omvangrijk
bewijs blijven in het Actions-artefact.

Productieworkflows moeten die opmerkingen plaatsen met de Mantis GitHub App, niet
met `github-actions[bot]`. Sla de app-id en private key op als
`MANTIS_GITHUB_APP_ID` en `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions-geheimen.
De workflow gebruikt een verborgen marker als upsert-sleutel, werkt die opmerking
bij wanneer het token deze kan bewerken, en maakt een nieuwe Mantis-eigen
opmerking aan wanneer een oudere bot-eigen marker niet kan worden bewerkt.

De PR-opmerking moet kort en visueel zijn:

```md
Mantis Discord-statusreacties-QA

Samenvatting: Mantis heeft de gerapporteerde Discord-statusreactiebug opnieuw
uitgevoerd tegen de bekende slechte baseline en de kandidaatfix. De baseline
reproduceerde de bug, terwijl de kandidaat de verwachte reeks in wachtrij -> denkt -> klaar liet zien.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artefact: <artifact link>
- Baseline: `<status>` op `<sha>`
- Kandidaat: `<status>` op `<sha>`

| Baseline            | Kandidaat           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Wanneer de run faalt omdat de harness faalde, moet de opmerking dat zeggen in
plaats van te suggereren dat de kandidaat faalde.

## Private Deployment-opmerkingen

Een private deployment heeft mogelijk al een Mantis Discord-applicatie. Hergebruik
die applicatie in plaats van een andere app aan te maken wanneer deze de juiste
botmachtigingen heeft en veilig kan worden geroteerd.

Stel het initiële operator-notificatiekanaal in via geheimen of
deploymentconfiguratie. Het kan eerst naar een bestaand maintainer- of
operations-kanaal wijzen, en daarna naar een speciaal Mantis-kanaal zodra dat
bestaat.

Zet geen guild-id's, kanaal-id's, bottokens, browsercookies, of VNC-wachtwoorden
in dit document. Sla ze op in GitHub-geheimen, de credentialbroker, of de lokale
geheimenopslag van de operator.

## Een Scenario Toevoegen

Een Mantis-scenario moet declareren:

- id en titel
- transport
- vereiste credentials
- baseline-refbeleid
- kandidaat-refbeleid
- OpenClaw-configpatch
- setupstappen
- stimulus
- verwachte baseline-oracle
- verwachte kandidaat-oracle
- doelen voor visuele vastlegging
- timeoutbudget
- cleanupstappen

Scenario's moeten de voorkeur geven aan kleine, getypeerde oracles:

- Discord-reactiestatus voor reactiebugs
- Discord-berichtreferenties voor threadingbugs
- Slack-thread-ts en reactie-API-status voor Slack-bugs
- e-mailbericht-id's en headers voor e-mailbugs
- browserscreenshots wanneer UI de enige betrouwbare observatie is

Vision-controles moeten aanvullend zijn. Als een platform-API de bug kan bewijzen,
gebruik de API dan als pass/fail-oracle en behoud screenshots voor menselijk
vertrouwen.

## Provideruitbreiding

Na Discord kan dezelfde runner toevoegen:

- Slack: reacties, threads, appvermeldingen, modals, bestandsuploads.
- E-mail: Gmail-auth en berichtthreading met `gog` waar connectors niet genoeg
  zijn.
- WhatsApp: QR-login, heridentificatie, berichtbezorging, media, reacties.
- Telegram: gating van groepsvermeldingen, commando's, reacties waar beschikbaar.
- Matrix: versleutelde rooms, thread- of reply-relaties, hervatten na herstart.

Elk transport moet één goedkope smoke-scenario en één of meer bugklasse-scenario's
hebben. Dure visuele scenario's moeten opt-in blijven.

## Open Vragen

- Welke Discord-bot moet de driver zijn, en welke de SUT, wanneer de bestaande
  Mantis-bot wordt hergebruikt?
- Moet de observerbrowserlogin een menselijk Discord-account, een testaccount, of
  alleen bot-leesbaar REST-bewijs gebruiken voor de eerste fase?
- Hoe lang moet GitHub Mantis-artefacten voor PR's bewaren?
- Wanneer moet ClawSweeper automatisch Mantis aanbevelen in plaats van op een
  maintainercommando te wachten?
- Moeten screenshots worden geredigeerd of bijgesneden vóór upload voor openbare
  PR's?
