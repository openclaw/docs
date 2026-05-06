---
read_when:
    - Live visuele QA bouwen of uitvoeren voor OpenClaw-fouten
    - Voor- en naverificatie toevoegen voor een pull-aanvraag
    - Discord, Slack, WhatsApp of andere live-transportscenario's toevoegen
    - QA-runs debuggen die screenshots, browserautomatisering of VNC-toegang vereisen
summary: Mantis is het visuele end-to-end-verificatiesysteem voor het reproduceren van OpenClaw-bugs op live transporten, het vastleggen van bewijs van vóór en na, en het bijvoegen van artefacten aan PR's.
title: Bidsprinkhaan
x-i18n:
    generated_at: "2026-05-06T09:08:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis is het end-to-end-verificatiesysteem van OpenClaw voor bugs die een echte
runtime, een echt transport en zichtbaar bewijs nodig hebben. Het voert een
scenario uit tegen een bekende defecte ref, legt bewijs vast, voert hetzelfde
scenario uit tegen een kandidaat-ref en publiceert de vergelijking als
artefacten die een maintainer vanuit een PR of een lokale opdracht kan
inspecteren.

Mantis begint met Discord omdat Discord ons een eerste lane met hoge waarde
geeft: echte bot-authenticatie, echte guild-kanalen, reacties, threads, native
opdrachten en een browser-UI waarin mensen visueel kunnen bevestigen wat het
transport liet zien.

## Doelen

- Een bug uit een GitHub-issue of PR reproduceren met dezelfde transportvorm die gebruikers
  zien.
- Een **voor**-artefact vastleggen op de baseline-ref voordat de fix wordt toegepast.
- Een **na**-artefact vastleggen op de kandidaat-ref nadat de fix is toegepast.
- Waar mogelijk een deterministische oracle gebruiken, zoals het uitlezen van een Discord REST-reactie
  of een controle van het kanaaltranscript.
- Schermafbeeldingen vastleggen wanneer de bug een zichtbaar UI-oppervlak heeft.
- Lokaal uitvoeren vanuit een door een agent bestuurde CLI en extern vanuit GitHub.
- Genoeg machinestatus bewaren voor VNC-redding wanneer login, browserautomatisering of
  provider-authenticatie vastloopt.
- Beknopte status posten naar een Discord-kanaal voor operators wanneer de run geblokkeerd is,
  handmatige VNC-hulp nodig heeft of klaar is.

## Niet-doelen

- Mantis is geen vervanging voor unit tests. Een Mantis-run hoort meestal een
  kleinere regressietest te worden nadat de fix is begrepen.
- Mantis is niet de normale snelle CI-gate. Het is trager, gebruikt live-referenties en
  is gereserveerd voor bugs waarbij de live-omgeving ertoe doet.
- Mantis hoort voor normaal gebruik geen mens nodig te hebben. Handmatige VNC is een reddingspad,
  niet het standaardpad.
- Mantis slaat geen ruwe secrets op in artefacten, logs, schermafbeeldingen, Markdown-
  rapporten of PR-opmerkingen.

## Eigenaarschap

Mantis bevindt zich in de OpenClaw QA-stack.

- OpenClaw beheert de scenarioruntime, transportadapters, het bewijsschema en
  de lokale CLI onder `pnpm openclaw qa mantis`.
- QA Lab beheert de live-transport-harnessonderdelen, browser-capturehulpen en
  artefactschrijvers.
- Crabbox beheert voorverwarmde Linux-machines wanneer een externe VM nodig is.
- GitHub Actions beheert het externe workflow-entrypoint en artefactretentie.
- ClawSweeper beheert de routing van GitHub-opmerkingen: maintaineropdrachten parsen,
  de workflow dispatchen en de uiteindelijke PR-opmerking posten.
- OpenClaw-agenten sturen Mantis aan via Codex wanneer een scenario agentische setup,
  debugging of vastgelopen-statusrapportage nodig heeft.

Deze grens houdt transportkennis in OpenClaw, machineplanning in
Crabbox en maintainer-workflowlijm in ClawSweeper.

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

De runner maakt losgekoppelde baseline- en kandidaat-worktrees onder de uitvoer-
map, installeert dependencies, bouwt elke ref, voert het scenario uit met
`--allow-failures` en schrijft daarna `baseline/`, `candidate/`, `comparison.json`
en `mantis-report.md`. Voor het eerste Discord-scenario betekent een succesvolle
verificatie dat de baselinestatus `fail` is en de kandidaatstatus `pass`.

De tweede Discord-voor/na-probe richt zich op threadbijlagen:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Dat scenario post een bovenliggend bericht met de driverbot, maakt een echte Discord-
thread, roept OpenClaws `message.thread-reply`-actie aan met een repo-lokale
`filePath` en pollt vervolgens de thread op het SUT-antwoord en de bijlagenaam. De
baseline-schermafbeelding toont het antwoord zonder bijlage; de kandidaat-
schermafbeelding toont de verwachte `mantis-thread-report.md`-bijlage.

De eerste VM/browser-primitief is de desktop-smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Deze least of hergebruikt een Crabbox-desktopmachine, start een zichtbare browser binnen de
VNC-sessie, legt de desktop vast, haalt artefacten terug naar de lokale uitvoer-
map en schrijft de reconnectopdracht in het rapport. De opdracht gebruikt standaard
de Hetzner-provider omdat dit de eerste provider is met werkende desktop/VNC-
dekking in de Mantis-lane. Overschrijf dit met `--provider`, `--crabbox-bin` of
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` wanneer je tegen een andere Crabbox-fleet draait.

Nuttige desktop-smoke-flags:

- `--lease-id <cbx_...>` of `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` hergebruikt een voorverwarmde desktop.
- `--browser-url <url>` wijzigt de pagina die in de zichtbare browser wordt geopend.
- `--html-file <path>` rendert een repo-lokaal HTML-artefact in de zichtbare browser. Mantis gebruikt dit om de gegenereerde Discord-statusreactietijdlijn vast te leggen via een echte Crabbox-desktop.
- `--browser-profile-dir <remote-path>` hergebruikt een externe Chrome user-data-dir zodat een persistente Mantis-desktop tussen runs ingelogd kan blijven. Gebruik dit voor het langlevende Discord Web-viewerprofiel.
- `--browser-profile-archive-env <name>` herstelt een base64 `.tgz` Chrome user-data-dir-archief uit de genoemde omgevingsvariabele voordat de browser wordt gestart. Gebruik dit voor ingelogde getuigen zoals Discord Web. De standaard env-var is `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` bepaalt de lengte van de MP4-opname. Gebruik een langere duur voor trage ingelogde webapps die tijd nodig hebben om tot rust te komen.
- `--keep-lease` of `OPENCLAW_MANTIS_KEEP_VM=1` houdt een nieuw aangemaakte geslaagde lease open voor VNC-inspectie. Mislukte runs houden de lease standaard open wanneer er een is aangemaakt, zodat een operator opnieuw kan verbinden.
- `--class`, `--idle-timeout` en `--ttl` stemmen machinegrootte en leaselevensduur af.

Voor Discord Web-bewijs gebruikt Mantis een speciaal vieweraccount in plaats van een
bottoken. Het live Discord API-scenario blijft de oracle: het maakt de echte
thread, stuurt de SUT `thread-reply` en controleert de bijlage via Discord
REST. Wanneer `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` is ingesteld, schrijft het scenario ook
een Discord Web-URL-artefact. Wanneer `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` is
ingesteld, laat het die thread lang genoeg beschikbaar zodat een ingelogde browser deze kan openen
en opnemen.

De GitHub-workflow opent de kandidaat-thread-URL in Discord Web, legt een
schermafbeelding vast, neemt een MP4 op en genereert een bijgesneden GIF-preview wanneer Crabbox-
mediatooling beschikbaar is. Geef de voorkeur aan een persistent viewerprofielpad dat is geconfigureerd
via `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, omdat volledige Chrome-profiel-
archieven groter kunnen worden dan de secret-groottelimiet van GitHub. Voor kleine/bootstrapprofielen
kan de workflow ook een base64 `.tgz`-archief herstellen uit
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Als geen van beide profielbronnen is
geconfigureerd, publiceert de workflow nog steeds de deterministische baseline/kandidaat-
bijlagschermafbeeldingen en logt hij een melding dat de ingelogde Discord Web-getuige
is overgeslagen.

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
de VNC-schermafbeelding terug naar de lokale uitvoermap. Dit is de eerste Mantis-
vorm waarbij de SUT OpenClaw Gateway en de browser allebei binnen dezelfde
Linux-desktop-VM draaien.

Met `--gateway-setup` bereidt de opdracht een persistente wegwerp-OpenClaw-
home voor op `$HOME/.openclaw-mantis/slack-openclaw`, patcht Slack Socket Mode-
configuratie voor het geselecteerde kanaal, start `openclaw gateway run` op poort
`38973` en houdt Chrome actief in de VNC-sessie. Dit is de modus "laat me een
Linux-desktop met Slack en een actieve claw achter"; de bot-naar-bot Slack QA-lane
blijft de standaard wanneer `--gateway-setup` wordt weggelaten.

Vereiste invoer voor `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` voor de externe modellane. Als lokaal alleen
  `OPENAI_API_KEY` is ingesteld, mappt Mantis die naar `OPENCLAW_LIVE_OPENAI_KEY`
  voordat Crabbox wordt aangeroepen, zodat Crabbox' `OPENCLAW_*` env-forwarding deze
  de VM in kan dragen.

Met `--gateway-setup --credential-source convex` least Mantis de Slack SUT-
referentie uit de gedeelde pool voordat de VM wordt aangemaakt en stuurt het de geleasede
kanaal-id, Socket Mode-apptoken en bottoken door als de `OPENCLAW_MANTIS_SLACK_*`-
runtime-env binnen de desktop. Dat houdt GitHub-workflows dun: ze hebben alleen
de Convex-brokersecret nodig, geen ruwe Slack-bot- of apptokens.

Nuttige Slack-desktopflags:

- `--lease-id <cbx_...>` draait opnieuw tegen een machine waarop een operator al via VNC is ingelogd op Slack Web.
- `--gateway-setup` start een persistente OpenClaw Slack-Gateway in de VM in plaats van alleen de bot-naar-bot QA-lane uit te voeren.
- `--keep-lease` houdt de Gateway-VM open voor VNC-inspectie na succes; `--no-keep-lease` stopt deze na het verzamelen van artefacten.
- `--slack-url <url>` opent een specifieke Slack Web-URL. Zonder deze flag leidt Mantis `https://app.slack.com/client/<team>/<channel>` af uit Slack `auth.test` wanneer de SUT-bottoken beschikbaar is.
- `--slack-channel-id <id>` bepaalt de Slack-kanaalallowlist die door Gateway-setup wordt gebruikt.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` bepaalt het persistente Chrome-profiel binnen de VM. De standaard is `$HOME/.config/openclaw-mantis/slack-chrome-profile`, zodat een handmatige Slack Web-login herhalingen op dezelfde lease overleeft.
- `--credential-source convex --credential-role ci` gebruikt de gedeelde referentiepool in plaats van directe Slack-env-tokens.
- `--provider-mode`, `--model`, `--alt-model` en `--fast` worden doorgegeven aan de Slack-live-lane.

De GitHub-smoke-workflow is `Mantis Discord Smoke`. De voor- en na-GitHub-
workflow voor het eerste echte scenario is `Mantis Discord Status Reactions`. Deze
accepteert:

- `baseline_ref`: de ref waarvan wordt verwacht dat deze queued-only-gedrag reproduceert.
- `candidate_ref`: de ref waarvan wordt verwacht dat deze `queued -> thinking -> done` toont.

Hij checkt de workflow-harness-ref uit, bouwt afzonderlijke baseline- en kandidaat-
worktrees, voert `discord-status-reactions-tool-only` uit tegen elke worktree en
uploadt `baseline/`, `candidate/`, `comparison.json` en `mantis-report.md` als
Actions-artefacten. Hij rendert ook de tijdlijn-HTML van elke lane in een Crabbox-
desktopbrowser en publiceert die VNC-schermafbeeldingen naast de deterministische
tijdlijn-PNG's in de PR-opmerking. Dezelfde PR-opmerking embedt lichte
op beweging bijgesneden GIF-previews die zijn gegenereerd door `crabbox media preview`, linkt naar de
bijbehorende op beweging bijgesneden MP4-clips en bewaart de volledige desktop-MP4-bestanden voor diepe
inspectie. Schermafbeeldingen blijven inline voor snelle review. De workflow bouwt de
Crabbox CLI vanaf
`openclaw/crabbox` main zodat hij de huidige desktop/browser-leaseflags kan gebruiken
voordat de volgende Crabbox-binaryrelease wordt gemaakt.

`Mantis Scenario` is het generieke handmatige entrypoint. Het neemt een `scenario_id`,
`candidate_ref`, optionele `baseline_ref` en optionele `pr_number` en
dispatcht vervolgens de scenario-eigen workflow. De wrapper is bewust dun:
scenarioworkflows blijven eigenaar van hun transportsetup, referenties, VM-klasse,
verwachte oracle en artefactmanifest.

`Mantis Slack Desktop Smoke` is de eerste Slack-VM-workflow. Deze checkt de
vertrouwde candidate-ref uit in een aparte worktree, least een Crabbox Linux-desktop,
voert `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` uit tegen die
candidate, opent Slack Web in de VNC-browser, neemt de desktop op, genereert een
op beweging getrimde preview met `crabbox media preview`, uploadt de volledige
artefactdirectory en plaatst optioneel de inline bewijsopmerking op de doel-PR.
Standaard gebruikt deze AWS voor de desktoplease en biedt een handmatige providerinvoer
zodat operators kunnen overschakelen naar Hetzner wanneer AWS-capaciteit traag of
niet beschikbaar is. Gebruik deze lane wanneer je "een Linux-desktop met Slack en
een draaiende claw" wilt in plaats van alleen een bot-naar-bot Slack-transcript.

Elk PR-publicatiescenario schrijft `mantis-evidence.json` naast het rapport.
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

Artefactwaarden voor `path` zijn relatief ten opzichte van de manifestdirectory.
Waarden voor `targetPath` zijn relatieve paden onder de publicatiedirectory van
de `qa-artifacts`-branch. De publisher weigert path traversal en slaat items over
die zijn gemarkeerd met `"required": false` wanneer optionele previews of video's
niet beschikbaar zijn.

Ondersteunde artefactsoorten:

- `timeline`: deterministische scenarioscreenshot, meestal voor/na.
- `desktopScreenshot`: VNC-/browserdesktopscreenshot.
- `motionPreview`: inline geanimeerde GIF die uit de desktopopname wordt gegenereerd.
- `motionClip`: op beweging getrimde MP4 die statische inloop en uitloop verwijdert.
- `fullVideo`: volledige MP4-opname voor diepgaande inspectie.
- `metadata`: JSON-/log-sidecar.
- `report`: Markdown-rapport.

De herbruikbare publisher is `scripts/mantis/publish-pr-evidence.mjs`. Workflows
roepen deze aan met het manifest, de doel-PR, de doelroot voor `qa-artifacts`, de
opmerkingmarker, Actions-artefact-URL, run-URL en aanvraagbron. Deze kopieert
gedeclareerde artefacten naar de `qa-artifacts`-branch, bouwt een PR-opmerking met
de samenvatting eerst, met inline afbeeldingen/previews en gelinkte video's, en
werkt daarna de bestaande markeropmerking bij of maakt er een aan.

Je kunt de status-reactions-run ook direct starten vanuit een PR-opmerking:

```text
@Mantis discord status reactions
```

De opmerkingtrigger is bewust smal. Deze draait alleen op pullrequestopmerkingen
van gebruikers met schrijf-, maintainer- of beheerdersrechten en herkent alleen
Discord status-reaction-verzoeken. Standaard gebruikt deze de bekende slechte
baseline-ref en de huidige PR-head-SHA als candidate. Maintainers kunnen beide
refs overschrijven:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Voorbeelden van ClawSweeper-opdrachten:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

De eerste opdracht is expliciet en scenariogericht. De tweede kan later een PR
of issue koppelen aan aanbevolen Mantis-scenario's op basis van labels, gewijzigde
bestanden en bevindingen uit ClawSweeper-reviews.

## Uitvoeringslevenscyclus

1. Verkrijg referenties.
2. Wijs een VM toe of hergebruik er een.
3. Bereid het desktop-/browserprofiel voor wanneer het scenario UI-bewijs nodig heeft.
4. Bereid een schone checkout voor de baseline-ref voor.
5. Installeer afhankelijkheden en bouw alleen wat het scenario nodig heeft.
6. Start een child OpenClaw Gateway met een geïsoleerde statusdirectory.
7. Configureer de live-transportlaag, provider, model en het browserprofiel.
8. Voer het scenario uit en leg baseline-bewijs vast.
9. Stop de Gateway en bewaar logs.
10. Bereid de candidate-ref in dezelfde VM voor.
11. Voer hetzelfde scenario uit en leg candidate-bewijs vast.
12. Vergelijk de oracle-resultaten en het visuele bewijs.
13. Schrijf Markdown, JSON, logs, screenshots en optionele trace-artefacten.
14. Upload GitHub Actions-artefacten.
15. Plaats een beknopt PR- of Discord-statusbericht.

Het scenario moet op twee verschillende manieren kunnen falen:

- **Bug gereproduceerd**: baseline faalde op de verwachte manier.
- **Harness-fout**: omgevingssetup, referenties, Discord-API, browser of provider
  faalde voordat de bug-oracle betekenisvol was.

Het eindrapport moet deze gevallen scheiden zodat maintainers een instabiele
omgeving niet verwarren met productgedrag.

## Discord-MVP

Het eerste scenario moet gericht zijn op Discord-statusreacties in guildkanalen
waar de reply-bezorgmodus van de bron `message_tool_only` is.

Waarom dit een goede Mantis-seed is:

- Het is zichtbaar in Discord als reacties op het activerende bericht.
- Het heeft een sterke REST-oracle via de reactiestatus van Discord-berichten.
- Het test een echte OpenClaw Gateway, Discord-botauthenticatie, berichtdispatch,
  reply-bezorgmodus van de bron, statusreactiestatus en model-turn-levenscyclus.
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
levenscyclustransitie in tool-only-modus. Candidate-bewijs moet tonen dat
levenscyclusstatusreacties lopen wanneer `messages.statusReactions.enabled`
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

Dit configureert de SUT met altijd actieve guildafhandeling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` en expliciete statusreacties. De oracle
pollt het echte activerende Discord-bericht en verwacht de waargenomen reeks
`👀 -> 🤔 -> 👍`. Artefacten omvatten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` en
`discord-status-reactions-tool-only-timeline.png`.

## Bestaande QA-onderdelen

Mantis moet voortbouwen op de bestaande private QA-stack in plaats van vanaf nul
te beginnen:

- `pnpm openclaw qa discord` draait al een live Discord-lane met driver- en SUT-bots.
- De live-transportrunner schrijft al rapporten en observed-message-artefacten
  onder `.artifacts/qa-e2e/`.
- Convex-referentieleases bieden al exclusieve toegang tot gedeelde live-transportreferenties.
- De browserbesturingsservice ondersteunt al screenshots, snapshots, headless
  beheerde profielen en externe CDP-profielen.
- QA Lab heeft al een debugger-UI en bus voor transportvormig testen.

De eerste Mantis-implementatie kan een dunne voor/na-runner over deze onderdelen
zijn, plus één visuele bewijslaag.

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
Markdown-rapport is bedoeld voor PR-opmerkingen en menselijke review.

De samenvatting moet bevatten:

- geteste refs en SHA's
- transport- en scenario-id
- machineprovider en machine-id of lease-id
- referentiebron zonder geheime waarden
- baseline-resultaat
- candidate-resultaat
- of de bug op baseline is gereproduceerd
- of de candidate het heeft opgelost
- artefactpaden
- opgeschoonde setup- of opruimproblemen

Screenshots zijn bewijs, geen geheimen. Ze vragen nog steeds om discipline bij
redactie: private kanaalnamen, gebruikersnamen of berichtinhoud kunnen zichtbaar
zijn. Voor publieke PR's hebben GitHub Actions-artefactlinks de voorkeur boven
inline afbeeldingen totdat het redactieverhaal sterker is.

## Browser en VNC

De browserlane heeft twee modi:

- **Headless automatisering**: standaard voor CI. Chrome draait met CDP
  ingeschakeld, en Playwright of OpenClaw-browserbesturing legt screenshots vast.
- **VNC-redding**: ingeschakeld op dezelfde VM wanneer login, MFA, Discord
  anti-automatisering of visuele debugging een mens nodig heeft.

Het Discord-observerbrowserprofiel moet persistent genoeg zijn om niet bij elke
run in te loggen, maar geïsoleerd van persoonlijke browserstatus. Een profiel
hoort bij de Mantis-machinepool, niet bij een ontwikkelaarslaptop.

Wanneer Mantis vastloopt, plaatst het een Discord-statusbericht met:

- run-id
- scenario-id
- machineprovider
- artefactdirectory
- VNC- of noVNC-verbindingsinstructies indien beschikbaar
- korte blokkadetekst

De eerste private deployment kan deze berichten in het bestaande operatorkanaal
plaatsen en later naar een speciaal Mantis-kanaal verplaatsen.

## Machines

Mantis moet voor de eerste externe implementatie de voorkeur geven aan AWS via
Crabbox. Crabbox geeft ons opgewarmde machines, leasetracking, hydratatie, logs,
resultaten en opruiming. Als AWS-capaciteit te traag of niet beschikbaar is, voeg
dan een Hetzner-provider toe achter dezelfde machine-interface.

Minimale VM-vereisten:

- Linux met een desktopgeschikte Chrome- of Chromium-installatie
- CDP-toegang voor browserautomatisering
- VNC of noVNC voor redding
- Node 22 en pnpm
- OpenClaw-checkout en afhankelijkhedencache
- Playwright Chromium-browsercache wanneer Playwright wordt gebruikt
- voldoende CPU en geheugen voor één OpenClaw Gateway, één browser en één modelrun
- uitgaande toegang tot Discord, GitHub, modelproviders en de referentiebroker

De VM mag geen langlevende ruwe geheimen bewaren buiten de verwachte referentie-
of browserprofielstores.

## Geheimen

Geheimen staan in GitHub-organisatie- of repositorygeheimen voor externe runs,
en in een lokaal door de operator beheerd geheimenbestand voor lokale runs.

Aanbevolen geheimnamen:

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
live-transportreferenties. GitHub-geheimen bootstrappen de broker en fallbacklanes.
De Discord status-reactions-workflow mapt de Mantis Crabbox-geheimen terug naar
de omgevingsvariabelen `CRABBOX_COORDINATOR` en `CRABBOX_COORDINATOR_TOKEN`
die de Crabbox CLI verwacht. De gewone GitHub-geheimnamen `CRABBOX_*` blijven
geaccepteerd als compatibiliteitsfallback.

De Mantis-runner mag nooit het volgende afdrukken:

- Discord-bottokens
- provider-API-sleutels
- browsercookies
- inhoud van authprofielen
- VNC-wachtwoorden
- ruwe referentiepayloads

Publieke artefactuploads moeten ook Discord-doelmetadata redigeren, zoals bot-,
guild-, kanaal- en bericht-id's. De GitHub-smokeworkflow schakelt om deze reden
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` in.

Als een token per ongeluk in een issue, PR, chat of log wordt geplakt, roteer het
nadat het nieuwe geheim is opgeslagen.

## GitHub-artefacten en PR-opmerkingen

Mantis-workflows moeten de volledige bewijsbundel uploaden als een kortlevend Actions-artefact. Wanneer de workflow wordt uitgevoerd voor een bugrapport of fix-PR, moet deze ook de geredigeerde PNG-schermafbeeldingen publiceren naar de `qa-artifacts`-branch en een reactie op die bug of fix-PR upserten met inline voor/na-schermafbeeldingen. Plaats het primaire bewijs niet alleen op een generieke QA-automatiserings-PR. Ruwe logs, waargenomen berichten en ander omvangrijk bewijs blijven in het Actions-artefact.

Productieworkflows moeten die reacties plaatsen met de Mantis GitHub App, niet met `github-actions[bot]`. Sla de app-id en privésleutel op als de GitHub Actions-secrets `MANTIS_GITHUB_APP_ID` en `MANTIS_GITHUB_APP_PRIVATE_KEY`. De workflow gebruikt een verborgen marker als de upsert-sleutel, werkt die reactie bij wanneer het token deze kan bewerken, en maakt een nieuwe reactie van Mantis aan wanneer een oudere marker van een bot niet kan worden bewerkt.

De PR-reactie moet kort en visueel zijn:

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

Wanneer de run mislukt omdat de harness is mislukt, moet de reactie dat zeggen in plaats van te impliceren dat de candidate is mislukt.

## Privé-implementatienotities

Een privé-implementatie heeft mogelijk al een Mantis Discord-applicatie. Hergebruik die applicatie in plaats van een andere app aan te maken wanneer deze de juiste botmachtigingen heeft en veilig kan worden geroteerd.

Stel het initiële kanaal voor operatormeldingen in via secrets of implementatieconfiguratie. Dit kan eerst verwijzen naar een bestaand maintainer- of operatiekanaal en later worden verplaatst naar een specifiek Mantis-kanaal zodra dat bestaat.

Plaats geen guild-id's, kanaal-id's, bottokens, browsercookies of VNC-wachtwoorden in dit document. Sla ze op in GitHub-secrets, de credential broker of de lokale geheime opslag van de operator.

## Een scenario toevoegen

Een Mantis-scenario moet het volgende declareren:

- id en titel
- transport
- vereiste referenties
- baseline-refbeleid
- candidate-refbeleid
- OpenClaw-configuratiepatch
- setupstappen
- stimulus
- verwachte baseline-oracle
- verwachte candidate-oracle
- doelen voor visuele vastlegging
- time-outbudget
- opruimstappen

Scenario's moeten de voorkeur geven aan kleine, getypte oracles:

- Discord-reactiestatus voor reactiefouten
- Discord-berichtreferenties voor threadingfouten
- Slack-thread-ts en reactie-API-status voor Slack-fouten
- e-mailbericht-id's en headers voor e-mailfouten
- browserschermafbeeldingen wanneer UI het enige betrouwbare waarneembare signaal is

Vision-controles moeten additief zijn. Als een platform-API de bug kan bewijzen, gebruik dan de API als pass/fail-oracle en behoud schermafbeeldingen voor menselijk vertrouwen.

## Provideruitbreiding

Na Discord kan dezelfde runner het volgende toevoegen:

- Slack: reacties, threads, appvermeldingen, modals, bestandsuploads.
- E-mail: Gmail-authenticatie en berichtthreading met `gog` waar connectors niet genoeg zijn.
- WhatsApp: QR-login, heridentificatie, berichtbezorging, media, reacties.
- Telegram: gating van groepsvermeldingen, commando's, reacties waar beschikbaar.
- Matrix: versleutelde rooms, thread- of antwoordrelaties, hervatten na herstart.

Elk transport moet één goedkope smoke-scenario en één of meer bugklasse-scenario's hebben. Dure visuele scenario's moeten opt-in blijven.

## Open vragen

- Welke Discord-bot moet de driver zijn en welke de SUT wanneer de bestaande Mantis-bot wordt hergebruikt?
- Moet de observer-browserlogin een menselijk Discord-account, een testaccount of alleen botleesbaar REST-bewijs gebruiken voor de eerste fase?
- Hoelang moet GitHub Mantis-artefacten voor PR's bewaren?
- Wanneer moet ClawSweeper automatisch Mantis aanbevelen in plaats van op een maintainercommando te wachten?
- Moeten schermafbeeldingen worden geredigeerd of bijgesneden vóór upload voor openbare PR's?
