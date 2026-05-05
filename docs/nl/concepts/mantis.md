---
read_when:
    - Bouwen of uitvoeren van live visuele QA voor OpenClaw-bugs
    - Voor- en naverificatie toevoegen aan een samenvoegverzoek
    - Discord, Slack, WhatsApp of andere live-transportscenario's toevoegen
    - QA-runs debuggen waarvoor screenshots, browserautomatisering of VNC-toegang nodig zijn
summary: Mantis is het visuele end-to-endverificatiesysteem voor het reproduceren van OpenClaw-bugs op live-transporten, het vastleggen van bewijs vóór en na de wijziging, en het toevoegen van artefacten aan PR's.
title: Bidsprinkhaan
x-i18n:
    generated_at: "2026-05-05T08:25:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis is het end-to-end verificatiesysteem van OpenClaw voor bugs die een echte
runtime, echt transport en zichtbaar bewijs nodig hebben. Het voert een scenario
uit tegen een bekende slechte ref, legt bewijs vast, voert hetzelfde scenario uit
tegen een kandidaat-ref en publiceert de vergelijking als artefacten die een
maintainer kan inspecteren vanuit een PR of vanuit een lokale opdracht.

Mantis begint met Discord omdat Discord ons een hoogwaardige eerste baan geeft:
echte bot-authenticatie, echte guild-kanalen, reacties, threads, native opdrachten
en een browser-UI waarin mensen visueel kunnen bevestigen wat het transport liet zien.

## Doelen

- Reproduceer een bug uit een GitHub-issue of PR met dezelfde transportvorm die gebruikers
  zien.
- Leg een **voor**-artefact vast op de basis-ref voordat de fix wordt toegepast.
- Leg een **na**-artefact vast op de kandidaat-ref nadat de fix is toegepast.
- Gebruik waar mogelijk een deterministische oracle, zoals het lezen van een Discord REST-reactie
  of een controle van een kanaaltranscript.
- Leg screenshots vast wanneer de bug een zichtbaar UI-oppervlak heeft.
- Draai lokaal vanuit een door een agent aangestuurde CLI en op afstand vanuit GitHub.
- Bewaar genoeg machinestatus voor VNC-redding wanneer aanmelding, browserautomatisering of
  providerauthenticatie vastloopt.
- Plaats beknopte status in een Discord-kanaal voor operators wanneer de run geblokkeerd is,
  handmatige VNC-hulp nodig heeft of is voltooid.

## Niet-doelen

- Mantis is geen vervanging voor unittests. Een Mantis-run moet meestal een
  kleinere regressietest worden nadat de fix is begrepen.
- Mantis is niet de normale snelle CI-gate. Het is trager, gebruikt live-referenties en
  is gereserveerd voor bugs waarbij de live-omgeving ertoe doet.
- Mantis mag geen mens vereisen voor normale werking. Handmatige VNC is een reddingspad,
  niet het gewenste pad.
- Mantis slaat geen ruwe geheimen op in artefacten, logs, screenshots, Markdown-
  rapporten of PR-opmerkingen.

## Eigenaarschap

Mantis leeft in de OpenClaw QA-stack.

- OpenClaw bezit de scenarioruntime, transportadapters, het bewijsschema en de
  lokale CLI onder `pnpm openclaw qa mantis`.
- QA Lab bezit de live-transportharnessonderdelen, helpers voor browservastlegging en
  artefactschrijvers.
- Crabbox bezit opgewarmde Linux-machines wanneer een externe VM nodig is.
- GitHub Actions bezit het externe workflow-invoerpunt en artefactretentie.
- ClawSweeper bezit GitHub-opmerkingsroutering: maintaineropdrachten parseren,
  de workflow dispatchen en de uiteindelijke PR-opmerking plaatsen.
- OpenClaw-agenten sturen Mantis via Codex aan wanneer een scenario agentische setup,
  debugging of rapportage van een vastgelopen status nodig heeft.

Deze grens houdt transportkennis in OpenClaw, machineplanning in
Crabbox en de lijm voor maintainerworkflows in ClawSweeper.

## Opdrachtvorm

De eerste lokale opdracht verifieert de Discord-bot, guild, kanaal, berichtverzending,
reactieverzending en het artefactpad:

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

De runner maakt losgekoppelde basis- en kandidaatworktrees aan onder de output-
directory, installeert afhankelijkheden, bouwt elke ref, voert het scenario uit met
`--allow-failures` en schrijft daarna `baseline/`, `candidate/`, `comparison.json`
en `mantis-report.md`. Voor het eerste Discord-scenario betekent een succesvolle verificatie
dat de basisstatus `fail` is en de kandidaatstatus `pass`.

De eerste VM/browser-primitief is de desktop-smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Deze least of hergebruikt een Crabbox-desktopmachine, start een zichtbare browser binnen de
VNC-sessie, legt de desktop vast, haalt artefacten terug naar de lokale output-
directory en schrijft de herverbindingsopdracht in het rapport. De opdracht gebruikt standaard
de Hetzner-provider omdat dit de eerste provider is met werkende desktop/VNC-
dekking in de Mantis-baan. Overschrijf dit met `--provider`, `--crabbox-bin` of
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` wanneer je tegen een andere Crabbox-vloot draait.

Nuttige desktop-smoke-flags:

- `--lease-id <cbx_...>` of `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` hergebruikt een opgewarmde desktop.
- `--browser-url <url>` wijzigt de pagina die in de zichtbare browser wordt geopend.
- `--html-file <path>` rendert een repo-lokaal HTML-artefact in de zichtbare browser. Mantis gebruikt dit om de gegenereerde Discord-statusreactietijdlijn vast te leggen via een echte Crabbox-desktop.
- `--keep-lease` of `OPENCLAW_MANTIS_KEEP_VM=1` houdt een nieuw aangemaakte geslaagde lease open voor VNC-inspectie. Mislukte runs houden de lease standaard open wanneer er een is aangemaakt, zodat een operator opnieuw verbinding kan maken.
- `--class`, `--idle-timeout` en `--ttl` stemmen machinegrootte en leaseduur af.

De eerste volledige desktoptransport-primitief is de Slack-desktop-smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Deze least of hergebruikt een Crabbox-desktopmachine, synchroniseert de huidige checkout naar
de VM, voert `pnpm openclaw qa slack` uit binnen die VM, opent Slack Web in de VNC-
browser, legt de zichtbare desktop vast en kopieert zowel de Slack QA-artefacten als
het VNC-screenshot terug naar de lokale outputdirectory. Dit is de eerste Mantis-
vorm waarin de SUT OpenClaw Gateway en de browser beide binnen dezelfde
Linux-desktop-VM leven.

Met `--gateway-setup` bereidt de opdracht een persistente wegwerpbare OpenClaw-
home voor op `$HOME/.openclaw-mantis/slack-openclaw`, patcht Slack Socket Mode-
configuratie voor het geselecteerde kanaal, start `openclaw gateway run` op poort
`38973` en laat Chrome draaien in de VNC-sessie. Dit is de modus "laat me een
Linux-desktop met Slack en een draaiende claw achter"; de bot-naar-bot Slack QA-baan
blijft de standaard wanneer `--gateway-setup` wordt weggelaten.

Vereiste invoer voor `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` voor de externe modelbaan. Als alleen
  `OPENAI_API_KEY` lokaal is ingesteld, wijst Mantis die toe aan `OPENCLAW_LIVE_OPENAI_KEY`
  voordat Crabbox wordt aangeroepen, zodat Crabbox' `OPENCLAW_*` env-doorsturing deze
  naar de VM kan dragen.

Nuttige Slack-desktop-flags:

- `--lease-id <cbx_...>` draait opnieuw tegen een machine waarop een operator al via VNC bij Slack Web is aangemeld.
- `--gateway-setup` start een persistente OpenClaw Slack Gateway in de VM in plaats van alleen de bot-naar-bot QA-baan te draaien.
- `--slack-url <url>` opent een specifieke Slack Web-URL. Zonder deze flag leidt Mantis `https://app.slack.com/client/<team>/<channel>` af uit Slack `auth.test` wanneer de SUT-bottoken beschikbaar is.
- `--slack-channel-id <id>` beheert de Slack-kanaaltoelatingslijst die door Gateway-setup wordt gebruikt.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` beheert het persistente Chrome-profiel binnen de VM. De standaard is `$HOME/.config/openclaw-mantis/slack-chrome-profile`, zodat een handmatige Slack Web-aanmelding herstarts op dezelfde lease overleeft.
- `--credential-source convex --credential-role ci` gebruikt de gedeelde referentiepool in plaats van directe Slack-env-tokens.
- `--provider-mode`, `--model`, `--alt-model` en `--fast` worden doorgegeven aan de Slack-livebaan.

De GitHub-smokeworkflow is `Mantis Discord Smoke`. De voor- en na-GitHub-
workflow voor het eerste echte scenario is `Mantis Discord Status Reactions`. Deze
accepteert:

- `baseline_ref`: de ref waarvan wordt verwacht dat deze alleen-wachtrijgedrag reproduceert.
- `candidate_ref`: de ref waarvan wordt verwacht dat deze `queued -> thinking -> done` toont.

Deze checkt de workflowharness-ref uit, bouwt afzonderlijke basis- en kandidaat-
worktrees, voert `discord-status-reactions-tool-only` uit tegen elke worktree en
uploadt `baseline/`, `candidate/`, `comparison.json` en `mantis-report.md` als
Actions-artefacten. De workflow rendert ook de tijdlijn-HTML van elke baan in een Crabbox-
desktopbrowser en publiceert die VNC-screenshots naast de deterministische
tijdlijn-PNG's in de PR-opmerking. Dezelfde PR-opmerking bevat lichte
bewegingsgetrimde GIF-previews die zijn gegenereerd door `crabbox media preview`, linkt naar de
bijbehorende bewegingsgetrimde MP4-clips en bewaart de volledige desktop-MP4-bestanden voor diepe
inspectie. Screenshots blijven inline voor snelle beoordeling. De workflow bouwt de
Crabbox CLI vanuit
`openclaw/crabbox` main zodat deze de huidige desktop/browser-leaseflags kan gebruiken
voordat de volgende Crabbox-binaire release wordt uitgebracht.

`Mantis Scenario` is het generieke handmatige invoerpunt. Het neemt een `scenario_id`,
`candidate_ref`, optionele `baseline_ref` en optionele `pr_number`, en
dispatcht daarna de scenario-eigen workflow. De wrapper is bewust dun:
scenarioworkflows blijven eigenaar van hun transportsetup, referenties, VM-klasse,
verwachte oracle en artefactmanifest.

`Mantis Slack Desktop Smoke` is de eerste Slack VM-workflow. Deze checkt de
vertrouwde kandidaat-ref uit in een afzonderlijke worktree, least een Crabbox Linux-desktop,
voert `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` uit tegen die
kandidaat, opent Slack Web in de VNC-browser, neemt de desktop op, genereert een
bewegingsgetrimde preview met `crabbox media preview`, uploadt de volledige artefact-
directory en plaatst optioneel de inline bewijsopmerking op de doel-PR.
Gebruik deze baan wanneer je "een Linux-desktop met Slack en een draaiende claw" wilt
in plaats van alleen een bot-naar-bot Slack-transcript.

Elk PR-publicerend scenario schrijft `mantis-evidence.json` naast het rapport.
Dit schema is de overdracht tussen scenariocode en GitHub-opmerkingen:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Artefact-`path`-waarden zijn relatief ten opzichte van de manifestdirectory. `targetPath`-
waarden zijn relatieve paden onder de publicatiedirectory van de `qa-artifacts`-branch.
De publisher weigert padtraversal en slaat items over die gemarkeerd zijn met
`"required": false` wanneer optionele previews of video's niet beschikbaar zijn.

Ondersteunde artefactsoorten:

- `timeline`: deterministisch scenarioscreenshot, meestal voor/na.
- `desktopScreenshot`: VNC/browser-desktopscreenshot.
- `motionPreview`: inline geanimeerde GIF gegenereerd uit de desktopopname.
- `motionClip`: bewegingsgetrimde MP4 die statische aanloop en staart verwijdert.
- `fullVideo`: volledige MP4-opname voor diepe inspectie.
- `metadata`: JSON/log-sidecar.
- `report`: Markdown-rapport.

De herbruikbare publisher is `scripts/mantis/publish-pr-evidence.mjs`. Workflows
roepen deze aan met het manifest, de doel-PR, de `qa-artifacts`-doelroot, commentaarmarker,
Actions-artefact-URL, run-URL en aanvraagbron. Deze kopieert gedeclareerde artefacten
naar de `qa-artifacts`-branch, bouwt een op samenvatting gerichte PR-opmerking met inline
afbeeldingen/previews en gelinkte video's, en werkt daarna de bestaande markeropmerking bij of
maakt er een aan.

Je kunt de status-reacties-run ook rechtstreeks starten vanuit een PR-opmerking:

```text
@Mantis discord status reactions
```

De opmerkingstrigger is bewust smal. Deze draait alleen op pull request-
opmerkingen van gebruikers met schrijf-, onderhouds- of beheertoegang, en herkent alleen
Discord-statusreactieverzoeken. Standaard gebruikt deze de bekende slechte basis-ref
en de huidige PR-head-SHA als kandidaat. Maintainers kunnen beide refs overschrijven:

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

## Run-levenscyclus

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
11. Voer hetzelfde scenario uit en leg kandidaat-bewijs vast.
12. Vergelijk de oracle-resultaten en het visuele bewijs.
13. Schrijf Markdown, JSON, logs, schermafbeeldingen en optionele trace-artefacten.
14. Upload GitHub Actions-artefacten.
15. Plaats een beknopt PR- of Discord-statusbericht.

Het scenario moet op twee verschillende manieren kunnen falen:

- **Bug gereproduceerd**: baseline faalde op de verwachte manier.
- **Harness-fout**: omgevingsconfiguratie, inloggegevens, Discord API, browser of
  provider faalde voordat de bug-oracle betekenisvol was.

Het eindrapport moet deze gevallen scheiden, zodat maintainers een instabiele
omgeving niet verwarren met productgedrag.

## Discord-MVP

Het eerste scenario moet zich richten op Discord-statusreacties in guildkanalen waar
de bronantwoordbezorgmodus `message_tool_only` is.

Waarom dit een goede Mantis-start is:

- Het is zichtbaar in Discord als reacties op het activerende bericht.
- Het heeft een sterke REST-oracle via de reactie-status van Discord-berichten.
- Het oefent een echte OpenClaw Gateway, Discord-bot-authenticatie, berichtverzending,
  bronantwoordbezorgmodus, statusreactiestatus en model-turn-levenscyclus.
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

Baseline-bewijs moet de wachtrij-bevestigingsreactie tonen, maar geen
levenscyclusovergang in tool-only-modus. Kandidaat-bewijs moet tonen dat levenscyclus-
statusreacties draaien wanneer `messages.statusReactions.enabled` expliciet
true is.

De uitvoerbare eerste doorsnede is het opt-in Discord live QA-scenario:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Het configureert het SUT met altijd actieve guildafhandeling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` en expliciete statusreacties. De oracle
polt het echte Discord-activeringsbericht en verwacht de waargenomen reeks
`👀 -> 🤔 -> 👍`. Artefacten omvatten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` en
`discord-status-reactions-tool-only-timeline.png`.

## Bestaande QA-onderdelen

Mantis moet voortbouwen op de bestaande private QA-stack in plaats van vanaf
nul te beginnen:

- `pnpm openclaw qa discord` draait al een live Discord-lane met driver- en
  SUT-bots.
- De live transportrunner schrijft al rapporten en waargenomen-bericht-
  artefacten onder `.artifacts/qa-e2e/`.
- Convex-inloggegevensleases bieden al exclusieve toegang tot gedeelde live
  transportinloggegevens.
- De browserbesturingsservice ondersteunt al schermafbeeldingen, snapshots,
  headless beheerde profielen en externe CDP-profielen.
- QA Lab heeft al een debugger-UI en bus voor transportvormige tests.

De eerste Mantis-implementatie kan een dunne voor/na-runner over deze
onderdelen zijn, plus één laag visueel bewijs.

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
Markdown-rapport is voor PR-opmerkingen en menselijke review.

De samenvatting moet bevatten:

- geteste refs en SHA's
- transport en scenario-id
- machineprovider en machine-id of lease-id
- bron van inloggegevens zonder geheime waarden
- baseline-resultaat
- kandidaat-resultaat
- of de bug op baseline werd gereproduceerd
- of de kandidaat deze heeft opgelost
- artefactpaden
- opgeschoonde configuratie- of opruimproblemen

Schermafbeeldingen zijn bewijs, geen secrets. Ze vereisen nog steeds redactie-
discipline: private kanaalnamen, gebruikersnamen of berichtinhoud kunnen zichtbaar zijn. Voor publieke PR's
hebben GitHub Actions-artefactlinks de voorkeur boven inline afbeeldingen totdat het redactieverhaal
sterker is.

## Browser En VNC

De browserlane heeft twee modi:

- **Headless automatisering**: standaard voor CI. Chrome draait met CDP ingeschakeld, en
  Playwright of OpenClaw-browserbesturing legt schermafbeeldingen vast.
- **VNC-redding**: ingeschakeld op dezelfde VM wanneer login, MFA, Discord-anti-automatisering
  of visueel debuggen een mens nodig heeft.

Het Discord-observerbrowserprofiel moet persistent genoeg zijn om te voorkomen dat
voor elke run moet worden ingelogd, maar geïsoleerd zijn van persoonlijke browserstatus. Een profiel
hoort bij de Mantis-machinepool, niet bij een ontwikkelaarslaptop.

Wanneer Mantis vastloopt, plaatst het een Discord-statusbericht met:

- run-id
- scenario-id
- machineprovider
- artefactdirectory
- VNC- of noVNC-verbindingsinstructies indien beschikbaar
- korte blokkadetekst

De eerste private deployment kan deze berichten plaatsen in het bestaande operator-
kanaal en later verplaatsen naar een specifiek Mantis-kanaal.

## Machines

Mantis moet voor de eerste externe implementatie de voorkeur geven aan AWS via Crabbox.
Crabbox geeft ons opgewarmde machines, leasetracking, hydratie, logs, resultaten en
opruiming. Als AWS-capaciteit te traag of niet beschikbaar is, voeg dan een Hetzner-provider
toe achter dezelfde machine-interface.

Minimale VM-vereisten:

- Linux met een desktopgeschikte Chrome- of Chromium-installatie
- CDP-toegang voor browserautomatisering
- VNC of noVNC voor redding
- Node 22 en pnpm
- OpenClaw-checkout en afhankelijkheidscache
- Playwright Chromium-browsercache wanneer Playwright wordt gebruikt
- genoeg CPU en geheugen voor één OpenClaw Gateway, één browser en één modelrun
- uitgaande toegang tot Discord, GitHub, modelproviders en de inloggegevensbroker

De VM mag geen langlevende ruwe secrets bewaren buiten de verwachte opslagplaatsen voor inloggegevens of
browserprofielen.

## Secrets

Secrets staan in GitHub-organisatie- of repository-secrets voor externe runs, en in
een lokaal door de operator beheerd secretbestand voor lokale runs.

Aanbevolen secretnamen:

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

Op lange termijn moet de Convex-inloggegevenspool de normale bron blijven voor live
transportinloggegevens. GitHub-secrets bootstrappen de broker en fallbacklanes.
De Discord-statusreacties-workflow koppelt de Mantis Crabbox-secrets terug aan
de omgevingsvariabelen `CRABBOX_COORDINATOR` en `CRABBOX_COORDINATOR_TOKEN`
die de Crabbox CLI verwacht. De gewone GitHub-secretnamen `CRABBOX_*` blijven
geaccepteerd als compatibiliteitsfallback.

De Mantis-runner mag nooit afdrukken:

- Discord-bottokens
- provider-API-sleutels
- browsercookies
- inhoud van authenticatieprofielen
- VNC-wachtwoorden
- ruwe inloggegevenspayloads

Publieke artefactuploads moeten ook Discord-doelmetadata zoals bot-, guild-,
kanaal- en bericht-id's redigeren. De GitHub-smoke-workflow schakelt
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` om deze reden in.

Als een token per ongeluk in een issue, PR, chat of log wordt geplakt, roteer het
nadat het nieuwe secret is opgeslagen.

## GitHub-artefacten En PR-opmerkingen

Mantis-workflows moeten de volledige bewijsbundel uploaden als kortlevend Actions-
artefact. Wanneer de workflow wordt uitgevoerd voor een bugrapport of fix-PR, moet deze ook
de geredigeerde PNG-schermafbeeldingen publiceren naar de `qa-artifacts`-branch en een
opmerking upserten op die bug of fix-PR met inline voor/na-schermafbeeldingen. Plaats
het primaire bewijs niet alleen op een generieke QA-automatiserings-PR. Ruwe logs, waargenomen
berichten en ander omvangrijk bewijs blijven in het Actions-artefact.

Productieworkflows moeten die opmerkingen plaatsen met de Mantis GitHub App, niet
met `github-actions[bot]`. Sla de app-id en private key op als
`MANTIS_GITHUB_APP_ID` en `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions-
secrets. De workflow gebruikt een verborgen marker als upsert-sleutel, werkt die
opmerking bij wanneer het token deze kan bewerken, en maakt een nieuwe door Mantis beheerde opmerking
wanneer een oudere bot-beheerde marker niet kan worden bewerkt.

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

Wanneer de run faalt doordat de harness faalde, moet de opmerking dat zeggen in plaats
van te impliceren dat de kandidaat faalde.

## Private Deployment-opmerkingen

Een private deployment heeft mogelijk al een Mantis Discord-applicatie. Hergebruik die
applicatie in plaats van een andere app te maken wanneer deze de juiste bot-
rechten heeft en veilig kan worden geroteerd.

Stel het initiële operator-notificatiekanaal in via secrets of deployment-
configuratie. Het kan eerst wijzen naar een bestaand maintainer- of operationeel kanaal,
en daarna verhuizen naar een specifiek Mantis-kanaal zodra dat bestaat.

Zet geen guild-id's, kanaal-id's, bottokens, browsercookies of VNC-wachtwoorden
in dit document. Sla ze op in GitHub-secrets, de inloggegevensbroker of de lokale
secretopslag van de operator.

## Een Scenario Toevoegen

Een Mantis-scenario moet declareren:

- id en titel
- transport
- vereiste inloggegevens
- baseline-refbeleid
- kandidaat-refbeleid
- OpenClaw-configuratiepatch
- configuratiestappen
- stimulus
- verwachte baseline-oracle
- verwachte kandidaat-oracle
- doelen voor visuele vastlegging
- time-outbudget
- opruimstappen

Scenario's moeten de voorkeur geven aan kleine, getypeerde oracles:

- Discord-reactiestatus voor reactiebugs
- Discord-berichtverwijzingen voor threadingbugs
- Slack-thread-ts en reactie-API-status voor Slack-bugs
- e-mailbericht-id's en headers voor e-mailbugs
- browserschermafbeeldingen wanneer UI het enige betrouwbare waarneembare signaal is

Visiecontroles moeten aanvullend zijn. Als een platform-API de bug kan bewijzen, gebruik dan de
API als de slagen/falen-oracle en behoud schermafbeeldingen voor menselijk vertrouwen.

## Provideruitbreiding

Na Discord kan dezelfde runner toevoegen:

- Slack: reacties, threads, appvermeldingen, modale vensters, bestandsuploads.
- E-mail: Gmail-authenticatie en berichtthreads met `gog` waar connectors niet
  genoeg zijn.
- WhatsApp: QR-login, heridentificatie, berichtbezorging, media, reacties.
- Telegram: gating voor groepsvermeldingen, commando's, reacties waar beschikbaar.
- Matrix: versleutelde kamers, thread- of antwoordrelaties, hervatten na herstart.

Elk transport moet één goedkoop smoke-scenario en één of meer scenario's per
foutklasse hebben. Dure visuele scenario's moeten opt-in blijven.

## Open vragen

- Welke Discord-bot moet de driver zijn en welke de SUT wanneer de
  bestaande Mantis-bot opnieuw wordt gebruikt?
- Moet de browserlogin van de observer een menselijk Discord-account, een testaccount
  of alleen door bots leesbaar REST-bewijs gebruiken voor de eerste fase?
- Hoelang moet GitHub Mantis-artefacten voor PR's bewaren?
- Wanneer moet ClawSweeper automatisch Mantis aanbevelen in plaats van te wachten op een
  maintainercommando?
- Moeten screenshots worden geredigeerd of bijgesneden vóór upload voor openbare PR's?
