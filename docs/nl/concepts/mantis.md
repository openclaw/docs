---
read_when:
    - Live visuele QA bouwen of uitvoeren voor OpenClaw-bugs
    - Voor- en naverificatie toevoegen voor een pullverzoek
    - Discord-, Slack-, WhatsApp- of andere live-transportscenario's toevoegen
    - QA-uitvoeringen debuggen die schermafbeeldingen, browserautomatisering of VNC-toegang vereisen
summary: Mantis is het visuele end-to-end-verificatiesysteem voor het reproduceren van OpenClaw-bugs op live-transporten, het vastleggen van bewijs vóór en na, en het toevoegen van artefacten aan PR's.
title: Bidsprinkhaan
x-i18n:
    generated_at: "2026-05-05T11:16:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f845ad3f19b88a9a398b43bd8bdfda8c7c2043733e30e7fcef1bf6ee0343c65
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis is het end-to-end-verificatiesysteem van OpenClaw voor bugs die een echte
runtime, een echte transportlaag en zichtbaar bewijs nodig hebben. Het voert een scenario uit tegen een bekende
slechte ref, legt bewijs vast, voert hetzelfde scenario uit tegen een kandidaat-ref en
publiceert de vergelijking als artifacts die een maintainer kan inspecteren vanuit een PR of
vanuit een lokale opdracht.

Mantis begint met Discord omdat Discord ons een eerste lane met hoge waarde geeft:
echte bot-authenticatie, echte guild-kanalen, reacties, threads, native opdrachten en een
browser-UI waarin mensen visueel kunnen bevestigen wat de transportlaag liet zien.

## Doelen

- Reproduceer een bug uit een GitHub-issue of PR met dezelfde transportvorm die gebruikers
  zien.
- Leg een **voor**-artifact vast op de baseline-ref voordat de fix wordt toegepast.
- Leg een **na**-artifact vast op de kandidaat-ref nadat de fix is toegepast.
- Gebruik waar mogelijk een deterministische oracle, zoals een Discord REST-reactie
  uitlezen of een kanaaltranscript controleren.
- Leg screenshots vast wanneer de bug een zichtbaar UI-oppervlak heeft.
- Draai lokaal vanuit een door een agent beheerde CLI en op afstand vanuit GitHub.
- Bewaar genoeg machinestatus voor VNC-redding wanneer inloggen, browserautomatisering of
  providerauthenticatie vastloopt.
- Plaats een beknopte status in een Discord-operator-kanaal wanneer de run is geblokkeerd,
  handmatige VNC-hulp nodig heeft of klaar is.

## Niet-doelen

- Mantis is geen vervanging voor unit tests. Een Mantis-run zou meestal een
  kleinere regressietest moeten worden nadat de fix is begrepen.
- Mantis is niet de normale snelle CI-gate. Het is langzamer, gebruikt live-inloggegevens en
  is gereserveerd voor bugs waarbij de live-omgeving ertoe doet.
- Mantis zou voor normaal gebruik geen mens moeten vereisen. Handmatige VNC is een reddingspad,
  niet het standaardpad.
- Mantis slaat geen ruwe geheimen op in artifacts, logs, screenshots, Markdown-
  rapporten of PR-opmerkingen.

## Eigenaarschap

Mantis leeft in de OpenClaw QA-stack.

- OpenClaw is eigenaar van de scenario-runtime, transportadapters, het bewijsschema en de
  lokale CLI onder `pnpm openclaw qa mantis`.
- QA Lab is eigenaar van de live-transportharness-onderdelen, browser-capturehelpers en
  artifact-writers.
- Crabbox is eigenaar van opgewarmde Linux-machines wanneer een externe VM nodig is.
- GitHub Actions is eigenaar van het externe workflow-entrypoint en artifactretentie.
- ClawSweeper is eigenaar van GitHub-commentaarrouting: maintainer-opdrachten parsen,
  de workflow dispatchen en de uiteindelijke PR-opmerking plaatsen.
- OpenClaw-agenten sturen Mantis aan via Codex wanneer een scenario agentic setup,
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

De runner maakt losgekoppelde baseline- en kandidaat-worktrees onder de output-
directory, installeert dependencies, bouwt elke ref, voert het scenario uit met
`--allow-failures` en schrijft daarna `baseline/`, `candidate/`, `comparison.json`,
en `mantis-report.md`. Voor het eerste Discord-scenario betekent een geslaagde verificatie
dat de baseline-status `fail` is en de kandidaat-status `pass`.

De eerste VM/browser-primitief is de desktop-smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Deze leaset of hergebruikt een Crabbox-desktopmachine, start een zichtbare browser binnen de
VNC-sessie, legt de desktop vast, haalt artifacts terug naar de lokale output-
directory en schrijft de herverbindingsopdracht in het rapport. De opdracht gebruikt standaard
de Hetzner-provider omdat dit de eerste provider is met werkende desktop/VNC-
dekking in de Mantis-lane. Overschrijf dit met `--provider`, `--crabbox-bin` of
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` wanneer je tegen een andere Crabbox-fleet draait.

Handige desktop-smoke-flags:

- `--lease-id <cbx_...>` of `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` hergebruikt een opgewarmde desktop.
- `--browser-url <url>` wijzigt de pagina die in de zichtbare browser wordt geopend.
- `--html-file <path>` rendert een repo-lokaal HTML-artifact in de zichtbare browser. Mantis gebruikt dit om de gegenereerde Discord-statusreactietijdlijn vast te leggen via een echte Crabbox-desktop.
- `--keep-lease` of `OPENCLAW_MANTIS_KEEP_VM=1` houdt een nieuw aangemaakte geslaagde lease open voor VNC-inspectie. Mislukte runs houden de lease standaard vast wanneer er een is aangemaakt, zodat een operator opnieuw kan verbinden.
- `--class`, `--idle-timeout` en `--ttl` stemmen machinegrootte en leaselevensduur af.

De eerste volledige desktop-transportprimitief is de Slack-desktop-smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Deze leaset of hergebruikt een Crabbox-desktopmachine, synchroniseert de huidige checkout naar
de VM, voert `pnpm openclaw qa slack` uit binnen die VM, opent Slack Web in de VNC-
browser, legt de zichtbare desktop vast en kopieert zowel de Slack QA-artifacts als
de VNC-screenshot terug naar de lokale output-directory. Dit is de eerste Mantis-
vorm waarbij de SUT OpenClaw Gateway en de browser allebei binnen dezelfde
Linux-desktop-VM leven.

Met `--gateway-setup` bereidt de opdracht een persistente wegwerp-OpenClaw-
home voor op `$HOME/.openclaw-mantis/slack-openclaw`, patcht Slack Socket Mode-
configuratie voor het geselecteerde kanaal, start `openclaw gateway run` op poort
`38973` en houdt Chrome draaiend in de VNC-sessie. Dit is de modus "laat me een
Linux-desktop met Slack en een claw draaiend achter"; de bot-naar-bot Slack QA-lane
blijft de standaard wanneer `--gateway-setup` wordt weggelaten.

Vereiste invoer voor `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` voor de externe model-lane. Als alleen
  `OPENAI_API_KEY` lokaal is ingesteld, koppelt Mantis dit aan `OPENCLAW_LIVE_OPENAI_KEY`
  voordat Crabbox wordt aangeroepen, zodat Crabbox's `OPENCLAW_*` env-forwarding dit
  naar de VM kan meenemen.

Met `--gateway-setup --credential-source convex` leaset Mantis de Slack SUT-
inloggegevens uit de gedeelde pool voordat de VM wordt gemaakt en forwardt het geleasede
kanaal-id, Socket Mode-app-token en bot-token als de `OPENCLAW_MANTIS_SLACK_*`
runtime-env binnen de desktop. Dat houdt GitHub-workflows slank: ze hebben alleen
het Convex-brokergeheim nodig, geen ruwe Slack-bot- of app-tokens.

Handige Slack-desktop-flags:

- `--lease-id <cbx_...>` draait opnieuw tegen een machine waarop een operator al via VNC bij Slack Web is ingelogd.
- `--gateway-setup` start een persistente OpenClaw Slack-Gateway in de VM in plaats van alleen de bot-naar-bot QA-lane te draaien.
- `--keep-lease` houdt de Gateway-VM open voor VNC-inspectie na succes; `--no-keep-lease` stopt deze na het verzamelen van artifacts.
- `--slack-url <url>` opent een specifieke Slack Web-URL. Zonder deze flag leidt Mantis `https://app.slack.com/client/<team>/<channel>` af uit Slack `auth.test` wanneer het SUT-bot-token beschikbaar is.
- `--slack-channel-id <id>` bestuurt de Slack-kanaal-allowlist die door Gateway-setup wordt gebruikt.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` bestuurt het persistente Chrome-profiel binnen de VM. De standaard is `$HOME/.config/openclaw-mantis/slack-chrome-profile`, zodat een handmatige Slack Web-login herstarts op dezelfde lease overleeft.
- `--credential-source convex --credential-role ci` gebruikt de gedeelde credentialpool in plaats van directe Slack-env-tokens.
- `--provider-mode`, `--model`, `--alt-model` en `--fast` worden doorgegeven aan de Slack live-lane.

De GitHub-smoke-workflow is `Mantis Discord Smoke`. De voor- en na-GitHub-
workflow voor het eerste echte scenario is `Mantis Discord Status Reactions`. Deze
accepteert:

- `baseline_ref`: de ref waarvan wordt verwacht dat deze queued-only-gedrag reproduceert.
- `candidate_ref`: de ref waarvan wordt verwacht dat deze `queued -> thinking -> done` toont.

Deze checkt de workflow-harness-ref uit, bouwt afzonderlijke baseline- en kandidaat-
worktrees, voert `discord-status-reactions-tool-only` uit tegen elke worktree en
uploadt `baseline/`, `candidate/`, `comparison.json` en `mantis-report.md` als
Actions-artifacts. Deze rendert ook de tijdlijn-HTML van elke lane in een Crabbox-
desktopbrowser en publiceert die VNC-screenshots naast de deterministische
tijdlijn-PNG's in de PR-opmerking. Dezelfde PR-opmerking embedt lichte
bewegingsgetrimde GIF-previews die door `crabbox media preview` zijn gegenereerd, linkt naar de
bijbehorende bewegingsgetrimde MP4-clips en bewaart de volledige desktop-MP4-bestanden voor grondige
inspectie. Screenshots blijven inline voor snelle review. De workflow bouwt de
Crabbox CLI vanaf
`openclaw/crabbox` main zodat deze de huidige desktop/browser-leaseflags kan gebruiken
voordat de volgende Crabbox-binaryrelease wordt uitgebracht.

`Mantis Scenario` is het generieke handmatige entrypoint. Het neemt een `scenario_id`,
`candidate_ref`, optionele `baseline_ref` en optionele `pr_number` en
dispatcht daarna de scenario-owned workflow. De wrapper is bewust dun:
scenario-workflows blijven eigenaar van hun transportsetup, inloggegevens, VM-klasse,
verwachte oracle en artifactmanifest.

`Mantis Slack Desktop Smoke` is de eerste Slack-VM-workflow. Deze checkt de
vertrouwde kandidaat-ref uit in een afzonderlijke worktree, leaset een Crabbox Linux-desktop,
voert `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` uit tegen die
kandidaat, opent Slack Web in de VNC-browser, neemt de desktop op, genereert een
bewegingsgetrimde preview met `crabbox media preview`, uploadt de volledige artifact-
directory en plaatst optioneel de inline bewijsopmerking op de doel-PR.
Deze gebruikt standaard AWS voor de desktoplease en biedt een handmatige providerinvoer zodat
operators kunnen overschakelen naar Hetzner wanneer AWS-capaciteit traag of niet beschikbaar is. Gebruik
deze lane wanneer je "een Linux-desktop met Slack en een claw draaiend" wilt in plaats
van alleen een bot-naar-bot Slack-transcript.

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

Artifact-`path`-waarden zijn relatief ten opzichte van de manifestdirectory. `targetPath`-
waarden zijn relatieve paden onder de publish-directory van de `qa-artifacts`-branch.
De publisher wijst path traversal af en slaat items over die zijn gemarkeerd met
`"required": false` wanneer optionele previews of video's niet beschikbaar zijn.

Ondersteunde artifactsoorten:

- `timeline`: deterministische scenarioscreenshot, meestal voor/na.
- `desktopScreenshot`: VNC/browser-desktopscreenshot.
- `motionPreview`: inline geanimeerde GIF gegenereerd uit de desktopopname.
- `motionClip`: bewegingsgetrimde MP4 die statische aanloop en staart verwijdert.
- `fullVideo`: volledige MP4-opname voor grondige inspectie.
- `metadata`: JSON/log-sidecar.
- `report`: Markdown-rapport.

De herbruikbare publisher is `scripts/mantis/publish-pr-evidence.mjs`. Werkstromen
roepen deze aan met het manifest, doel-PR, doelroot `qa-artifacts`, commentaarmarkering,
Actions-artifact-URL, run-URL en aanvraagbron. Deze kopieert gedeclareerde artifacts
naar de branch `qa-artifacts`, bouwt een PR-opmerking die met de samenvatting begint met inline
afbeeldingen/voorvertoningen en gekoppelde video's, en werkt daarna de bestaande markeropmerking bij of
maakt er een aan.

Je kunt de status-reactions-run ook rechtstreeks vanuit een PR-opmerking starten:

```text
@Mantis discord status reactions
```

De commentaartrigger is bewust smal. Deze draait alleen op pull request-
opmerkingen van gebruikers met schrijf-, onderhouds- of beheerderstoegang, en herkent alleen
Discord status-reaction-verzoeken. Standaard gebruikt deze de bekende slechte baseline-ref
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

## Runlevenscyclus

1. Verkrijg credentials.
2. Wijs een VM toe of hergebruik er een.
3. Bereid het desktop-/browserprofiel voor wanneer het scenario UI-bewijs nodig heeft.
4. Bereid een schone checkout voor de baseline-ref voor.
5. Installeer dependencies en bouw alleen wat het scenario nodig heeft.
6. Start een onderliggende OpenClaw Gateway met een geisoleerde state-directory.
7. Configureer het live transport, de provider, het model en het browserprofiel.
8. Voer het scenario uit en leg baseline-bewijs vast.
9. Stop de gateway en bewaar logs.
10. Bereid de kandidaat-ref in dezelfde VM voor.
11. Voer hetzelfde scenario uit en leg kandidaatbewijs vast.
12. Vergelijk de oracle-resultaten en het visuele bewijs.
13. Schrijf Markdown, JSON, logs, screenshots en optionele trace-artifacts.
14. Upload GitHub Actions-artifacts.
15. Plaats een beknopt PR- of Discord-statusbericht.

Het scenario moet op twee verschillende manieren kunnen falen:

- **Bug gereproduceerd**: baseline faalde op de verwachte manier.
- **Harnessfout**: omgevingsconfiguratie, credentials, Discord-API, browser of
  provider faalde voordat de bug-oracle betekenisvol was.

Het eindrapport moet deze gevallen scheiden, zodat maintainers een instabiele
omgeving niet verwarren met productgedrag.

## Discord-MVP

Het eerste scenario moet Discord-statusreacties targeten in guild-kanalen waar
de aflevermodus voor bronantwoorden `message_tool_only` is.

Waarom dit een goede Mantis-seed is:

- Het is zichtbaar in Discord als reacties op het triggerende bericht.
- Het heeft een sterke REST-oracle via de reactiestatus van Discord-berichten.
- Het oefent een echte OpenClaw Gateway, Discord-botauthenticatie, berichtdispatch,
  aflevermodus voor bronantwoorden, statusreactiestatus en de levenscyclus van modelbeurten.
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

Baseline-bewijs moet de queued acknowledgement-reactie tonen, maar geen
levenscyclustransitie in tool-only-modus. Kandidaatbewijs moet tonen dat levenscyclus-
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

Het configureert de SUT met altijd-aan guildafhandeling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` en expliciete statusreacties. De oracle
pollt het echte triggerende Discord-bericht en verwacht de waargenomen reeks
`👀 -> 🤔 -> 👍`. Artifacts omvatten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` en
`discord-status-reactions-tool-only-timeline.png`.

## Bestaande QA-onderdelen

Mantis moet voortbouwen op de bestaande private QA-stack in plaats van vanaf
nul te beginnen:

- `pnpm openclaw qa discord` draait al een live Discord-lane met driver- en
  SUT-bots.
- De live transportrunner schrijft al rapporten en observed-message-
  artifacts onder `.artifacts/qa-e2e/`.
- Convex-credentialleases bieden al exclusieve toegang tot gedeelde live
  transportcredentials.
- De browserbesturingsservice ondersteunt al screenshots, snapshots,
  headless beheerde profielen en externe CDP-profielen.
- QA Lab heeft al een debugger-UI en bus voor transportvormige tests.

De eerste Mantis-implementatie kan een dunne voor/na-runner over deze
onderdelen zijn, plus een laag voor visueel bewijs.

## Bewijsmodel

Elke run schrijft een stabiele artifact-directory:

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
- credentialbron zonder geheime waarden
- baseline-resultaat
- kandidaatresultaat
- of de bug op baseline werd gereproduceerd
- of de kandidaat deze heeft opgelost
- artifact-paden
- opgeschoonde setup- of cleanup-problemen

Screenshots zijn bewijs, geen geheimen. Ze vereisen nog steeds redactiediscipline:
privekanaalnamen, gebruikersnamen of berichtinhoud kunnen verschijnen. Voor openbare PR's,
geef de voorkeur aan GitHub Actions-artifactlinks boven inline afbeeldingen totdat het redactieverhaal
sterker is.

## Browser en VNC

De browser-lane heeft twee modi:

- **Headless automatisering**: standaard voor CI. Chrome draait met CDP ingeschakeld, en
  Playwright of OpenClaw-browserbesturing legt screenshots vast.
- **VNC-redding**: ingeschakeld op dezelfde VM wanneer login, MFA, Discord-anti-automatisering
  of visueel debuggen een mens nodig heeft.

Het Discord-observerbrowserprofiel moet persistent genoeg zijn om te voorkomen dat
voor elke run moet worden ingelogd, maar geisoleerd van persoonlijke browserstate. Een profiel
hoort bij de Mantis-machinepool, niet bij een ontwikkelaarslaptop.

Wanneer Mantis vastloopt, plaatst het een Discord-statusbericht met:

- run-id
- scenario-id
- machineprovider
- artifact-directory
- VNC- of noVNC-verbindingsinstructies indien beschikbaar
- korte blokkadetekst

De eerste private deployment kan deze berichten in het bestaande operator-
kanaal plaatsen en later naar een dedicated Mantis-kanaal verplaatsen.

## Machines

Mantis moet voor de eerste remote implementatie de voorkeur geven aan AWS via Crabbox.
Crabbox geeft ons opgewarmde machines, leasetracking, hydratatie, logs, resultaten en
cleanup. Als AWS-capaciteit te traag of niet beschikbaar is, voeg dan een Hetzner-provider
toe achter dezelfde machine-interface.

Minimale VM-vereisten:

- Linux met een desktopgeschikte Chrome- of Chromium-installatie
- CDP-toegang voor browserautomatisering
- VNC of noVNC voor redding
- Node 22 en pnpm
- OpenClaw-checkout en dependencycache
- Playwright Chromium-browsercache wanneer Playwright wordt gebruikt
- genoeg CPU en geheugen voor een OpenClaw Gateway, een browser en een modelrun
- uitgaande toegang tot Discord, GitHub, modelproviders en de credentialbroker

De VM mag geen langlevende ruwe geheimen bewaren buiten de verwachte credential- of
browserprofielstores.

## Geheimen

Geheimen staan in GitHub-organisatie- of repositorygeheimen voor remote runs, en in
een lokaal door de operator beheerd geheimenbestand voor lokale runs.

Aanbevolen geheime namen:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` voor openbare GitHub-artifactuploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Op lange termijn moet de Convex-credentialpool de normale bron blijven voor live
transportcredentials. GitHub-geheimen bootstrappen de broker en fallback-lanes.
De Discord-status-reactions-workflow koppelt de Mantis Crabbox-geheimen terug naar
de omgevingsvariabelen `CRABBOX_COORDINATOR` en `CRABBOX_COORDINATOR_TOKEN`
die de Crabbox-CLI verwacht. De gewone GitHub-geheimnamen `CRABBOX_*` blijven
geaccepteerd als compatibiliteitsfallback.

De Mantis-runner mag nooit afdrukken:

- Discord-bottokens
- provider-API-sleutels
- browsercookies
- inhoud van auth-profielen
- VNC-wachtwoorden
- ruwe credentialpayloads

Openbare artifactuploads moeten ook Discord-doelmetadata zoals bot-,
guild-, kanaal- en bericht-id's redigeren. De GitHub-smokeworkflow schakelt
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` om deze reden in.

Als een token per ongeluk in een issue, PR, chat of log wordt geplakt, roteer het
nadat het nieuwe geheim is opgeslagen.

## GitHub-artifacts en PR-opmerkingen

Mantis-workflows moeten de volledige bewijsbundel uploaden als een kortlevend Actions-
artifact. Wanneer de workflow wordt uitgevoerd voor een bugrapport of fix-PR, moet deze ook
de geredigeerde PNG-screenshots naar de branch `qa-artifacts` publiceren en een
opmerking op die bug- of fix-PR upserten met inline voor/na-screenshots. Plaats
het primaire bewijs niet alleen op een generieke QA-automatiserings-PR. Ruwe logs, waargenomen
berichten en ander omvangrijk bewijs blijven in het Actions-artifact.

Productieworkflows moeten die opmerkingen plaatsen met de Mantis GitHub App, niet
met `github-actions[bot]`. Sla de app-id en private key op als
GitHub Actions-geheimen `MANTIS_GITHUB_APP_ID` en `MANTIS_GITHUB_APP_PRIVATE_KEY`.
De workflow gebruikt een verborgen marker als upsert-sleutel, werkt die
opmerking bij wanneer het token deze kan bewerken, en maakt een nieuwe Mantis-owned opmerking aan wanneer
een oudere bot-owned marker niet kan worden bewerkt.

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

Wanneer de run faalt omdat de harness faalde, moet de opmerking dat zeggen in plaats
van te impliceren dat de kandidaat faalde.

## Private deployment-notities

Een private deployment kan al een Mantis Discord-applicatie hebben. Hergebruik die
applicatie in plaats van een andere app te maken wanneer deze de juiste bot-
machtigingen heeft en veilig kan worden geroteerd.

Stel het initiele operator-notificatiekanaal in via geheimen of deployment-
configuratie. Het kan eerst naar een bestaand maintainer- of operations-kanaal
wijzen, en daarna naar een dedicated Mantis-kanaal verhuizen zodra dat bestaat.

Zet geen guild-id's, kanaal-id's, bottokens, browsercookies of VNC-wachtwoorden
in dit document. Sla ze op in GitHub-geheimen, de credentialbroker of de
lokale geheime opslag van de operator.

## Een scenario toevoegen

Een Mantis-scenario moet declareren:

- id en titel
- transport
- vereiste referenties
- basislijnreferentiebeleid
- kandidaatreferentiebeleid
- OpenClaw-configuratiepatch
- installatiestappen
- stimulus
- verwachte basislijn-orakel
- verwachte kandidaat-orakel
- doelen voor visuele vastlegging
- time-outbudget
- opschoonstappen

Scenario's moeten de voorkeur geven aan kleine, getypeerde orakels:

- Discord-reactiestatus voor reactiefouten
- Discord-berichtverwijzingen voor threadingfouten
- Slack-thread-ts en reactie-API-status voor Slack-fouten
- e-mailbericht-id's en headers voor e-mailfouten
- browserschermafbeeldingen wanneer de UI de enige betrouwbare waarneembare uitkomst is

Vision-controles moeten aanvullend zijn. Als een platform-API de fout kan bewijzen, gebruik dan de
API als het slaag/faal-orakel en bewaar schermafbeeldingen voor menselijk vertrouwen.

## Provideruitbreiding

Na Discord kan dezelfde runner toevoegen:

- Slack: reacties, threads, app-vermeldingen, modals, bestandsuploads.
- E-mail: Gmail-authenticatie en berichtthreading met `gog` waar connectoren niet
  genoeg zijn.
- WhatsApp: QR-login, heridentificatie, berichtbezorging, media, reacties.
- Telegram: gating van groepsvermeldingen, opdrachten, reacties waar beschikbaar.
- Matrix: versleutelde kamers, thread- of antwoordrelaties, hervatten na herstart.

Elk transport moet één goedkoop smokescenario en één of meer foutklasse-
scenario's hebben. Dure visuele scenario's moeten opt-in blijven.

## Open vragen

- Welke Discord-bot moet de driver zijn, en welke moet de SUT zijn, wanneer de
  bestaande Mantis-bot wordt hergebruikt?
- Moet de observer-browserlogin een menselijk Discord-account, een testaccount
  of alleen via bots leesbaar REST-bewijs gebruiken voor de eerste fase?
- Hoe lang moet GitHub Mantis-artefacten voor PR's bewaren?
- Wanneer moet ClawSweeper automatisch Mantis aanbevelen in plaats van te wachten op een
  maintaineropdracht?
- Moeten schermafbeeldingen worden geredigeerd of bijgesneden voordat ze worden geüpload voor openbare PR's?
