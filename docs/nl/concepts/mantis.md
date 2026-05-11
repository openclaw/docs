---
read_when:
    - Live visuele QA voor OpenClaw-bugs bouwen of uitvoeren
    - Voor- en naverificatie toevoegen voor een pull request
    - Discord, Slack, WhatsApp of andere live-transportscenario's toevoegen
    - Foutopsporing in QA-uitvoeringen die screenshots, browserautomatisering of VNC-toegang vereisen
summary: Mantis is het visuele end-to-end-verificatiesysteem voor het reproduceren van OpenClaw-bugs op live transporten, het vastleggen van bewijs vóór en na, en het toevoegen van artefacten aan PR's.
title: Bidsprinkhaan
x-i18n:
    generated_at: "2026-05-11T20:28:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis is het OpenClaw end-to-endverificatiesysteem voor bugs die een echte
runtime, een echt transport en zichtbaar bewijs nodig hebben. Het voert een
scenario uit tegen een bekende foute ref, legt bewijs vast, voert hetzelfde
scenario uit tegen een kandidaat-ref en publiceert de vergelijking als artefacten
die een maintainer vanuit een PR of vanuit een lokale opdracht kan inspecteren.

Mantis begint met Discord omdat Discord ons een eerste lane met hoge waarde geeft:
echte bot-auth, echte guild-kanalen, reacties, threads, native opdrachten en een
browser-UI waarin mensen visueel kunnen bevestigen wat het transport liet zien.

## Doelen

- Reproduceer een bug uit een GitHub-issue of PR met dezelfde transportvorm die gebruikers
  zien.
- Leg een **voor**-artefact vast op de baseline-ref voordat de fix wordt toegepast.
- Leg een **na**-artefact vast op de kandidaat-ref nadat de fix is toegepast.
- Gebruik waar mogelijk een deterministische oracle, zoals een Discord REST-reactie
  lezen of een kanaaltranscriptcontrole.
- Leg screenshots vast wanneer de bug een zichtbaar UI-oppervlak heeft.
- Draai lokaal vanuit een door een agent bestuurde CLI en op afstand vanuit GitHub.
- Bewaar genoeg machinestatus voor VNC-redding wanneer login, browserautomatisering of
  provider-auth vastloopt.
- Plaats beknopte status in een operator-Discord-kanaal wanneer de run is geblokkeerd,
  handmatige VNC-hulp nodig heeft of klaar is.

## Niet-doelen

- Mantis is geen vervanging voor unittests. Een Mantis-run moet meestal een kleinere
  regressietest worden nadat de fix is begrepen.
- Mantis is niet de normale snelle CI-gate. Het is trager, gebruikt live-referenties en
  is gereserveerd voor bugs waarbij de live-omgeving ertoe doet.
- Mantis zou voor normale werking geen mens nodig moeten hebben. Handmatige VNC is een
  reddingspad, niet het standaardpad.
- Mantis slaat geen ruwe geheimen op in artefacten, logs, screenshots, Markdown-
  rapporten of PR-reacties.

## Eigenaarschap

Mantis leeft in de OpenClaw QA-stack.

- OpenClaw is eigenaar van de scenarioruntime, transportadapters, het bewijsschema en
  de lokale CLI onder `pnpm openclaw qa mantis`.
- QA Lab is eigenaar van de live-transportharnasdelen, browsercapturehelpers en
  artefactschrijvers.
- Crabbox is eigenaar van opgewarmde Linux-machines wanneer een externe VM nodig is.
- GitHub Actions is eigenaar van het externe workflow-entrypoint en artefactretentie.
- ClawSweeper is eigenaar van GitHub-reactierouting: maintaineropdrachten parsen,
  de workflow dispatchen en de uiteindelijke PR-reactie plaatsen.
- OpenClaw-agenten sturen Mantis via Codex aan wanneer een scenario agentic setup,
  debugging of vastgelopen-statusrapportage nodig heeft.

Deze grens houdt transportkennis in OpenClaw, machineplanning in
Crabbox en maintainer-workflowlijm in ClawSweeper.

## Commandovorm

De eerste lokale opdracht verifieert de Discord-bot, guild, kanaal, berichtverzending,
reactieverzending en artefactpad:

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
directory, installeert afhankelijkheden, bouwt elke ref, voert het scenario uit met
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

Dat scenario plaatst een ouderbericht met de driver-bot, maakt een echte Discord-
thread, roept OpenClaw's `message.thread-reply`-actie aan met een repo-lokale
`filePath` en pollt daarna de thread voor het SUT-antwoord en de bijlagebestandsnaam. Het
baseline-screenshot toont het antwoord zonder bijlage; het kandidaat-screenshot
toont de verwachte `mantis-thread-report.md`-bijlage.

De eerste VM/browser-primitief is de desktop-smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Het least of hergebruikt een Crabbox-desktopmachine, start een zichtbare browser binnen de
VNC-sessie, legt de desktop vast, haalt artefacten terug naar de lokale output-
directory en schrijft de reconnect-opdracht in het rapport. De opdracht gebruikt standaard
de Hetzner-provider omdat dit de eerste provider is met werkende desktop/VNC-
dekking in de Mantis-lane. Overschrijf dit met `--provider`, `--crabbox-bin` of
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` wanneer je tegen een andere Crabbox-vloot draait.

Nuttige desktop-smokevlaggen:

- `--lease-id <cbx_...>` of `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` hergebruikt een opgewarmde desktop.
- `--browser-url <url>` wijzigt de pagina die in de zichtbare browser wordt geopend.
- `--html-file <path>` rendert een repo-lokaal HTML-artefact in de zichtbare browser. Mantis gebruikt dit om de gegenereerde Discord-status-reactietijdlijn vast te leggen via een echte Crabbox-desktop.
- `--browser-profile-dir <remote-path>` hergebruikt een externe Chrome user-data-dir zodat een persistente Mantis-desktop tussen runs ingelogd kan blijven. Gebruik dit voor het langlevende Discord Web-viewerprofiel.
- `--browser-profile-archive-env <name>` herstelt een base64 `.tgz`-Chrome user-data-dir-archief vanuit de genoemde omgevingsvariabele voordat de browser wordt gestart. Gebruik dit voor ingelogde getuigen zoals Discord Web. De standaard-env-var is `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` bepaalt de lengte van de MP4-capture. Gebruik een langere duur voor trage ingelogde webapps die tijd nodig hebben om tot rust te komen.
- `--keep-lease` of `OPENCLAW_MANTIS_KEEP_VM=1` houdt een nieuw aangemaakte geslaagde lease open voor VNC-inspectie. Mislukte runs houden de lease standaard vast wanneer er een is aangemaakt, zodat een operator opnieuw kan verbinden.
- `--class`, `--idle-timeout` en `--ttl` stemmen machinegrootte en leaseduur af.

Voor Discord Web-bewijs gebruikt Mantis een speciaal vieweraccount in plaats van een
bot-token. Het live Discord API-scenario blijft de oracle: het maakt de echte
thread, verzendt de SUT `thread-reply` en controleert de bijlage via Discord
REST. Wanneer `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` is ingesteld, schrijft het scenario ook
een Discord Web-URL-artefact. Wanneer `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` is
ingesteld, laat het die thread lang genoeg beschikbaar zodat een ingelogde browser deze kan openen
en opnemen.

De GitHub-workflow opent de kandidaat-thread-URL in Discord Web, legt een
screenshot vast, neemt een MP4 op en genereert een bijgesneden GIF-preview wanneer Crabbox-
mediatooling beschikbaar is. Geef de voorkeur aan een persistent viewerprofielpad dat is geconfigureerd
via `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, omdat volledige Chrome-profielarchieven
GitHub's limiet voor geheimengrootte kunnen overschrijden. Voor kleine/bootstrapprofielen
kan de workflow ook een base64 `.tgz`-archief herstellen vanuit
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Als geen van beide profielbronnen is
geconfigureerd, publiceert de workflow nog steeds de deterministische baseline/kandidaat-
bijlagescreenshots en logt een melding dat de ingelogde Discord Web-getuige
is overgeslagen.

De eerste volledige desktoptransport-primitief is de Slack-desktop-smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Het least of hergebruikt een Crabbox-desktopmachine, synchroniseert de huidige checkout naar
de VM, draait `pnpm openclaw qa slack` binnen die VM, opent Slack Web in de VNC-
browser, legt de zichtbare desktop vast en kopieert zowel de Slack QA-artefacten als
het VNC-screenshot terug naar de lokale output-directory. Dit is de eerste Mantis-
vorm waarbij de SUT OpenClaw-Gateway en de browser allebei binnen dezelfde Linux-
desktop-VM leven.

Met `--gateway-setup` bereidt de opdracht een persistente wegwerp-OpenClaw-
home voor op `$HOME/.openclaw-mantis/slack-openclaw`, patcht Slack Socket Mode-
configuratie voor het geselecteerde kanaal, start `openclaw gateway run` op poort
`38973` en houdt Chrome draaiend in de VNC-sessie. Dit is de modus "laat me een
Linux-desktop met Slack en een draaiende claw achter"; de bot-naar-bot Slack QA-lane
blijft de standaard wanneer `--gateway-setup` wordt weggelaten.

Vereiste invoer voor `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` voor de externe modellane. Als lokaal alleen
  `OPENAI_API_KEY` is ingesteld, mapt Mantis die naar `OPENCLAW_LIVE_OPENAI_KEY`
  voordat Crabbox wordt aangeroepen, zodat Crabbox's `OPENCLAW_*`-env-forwarding deze
  de VM in kan dragen.

Met `--gateway-setup --credential-source convex` least Mantis de Slack SUT-
referentie uit de gedeelde pool voordat de VM wordt gemaakt en forwardt de geleasede
kanaal-id, Socket Mode-app-token en bot-token als de `OPENCLAW_MANTIS_SLACK_*`-
runtime-env binnen de desktop. Dat houdt GitHub-workflows dun: ze hebben alleen
het Convex-brokergeheim nodig, geen ruwe Slack-bot- of app-tokens.

Nuttige Slack-desktopvlaggen:

- `--lease-id <cbx_...>` draait opnieuw tegen een machine waarop een operator al via VNC bij Slack Web is ingelogd.
- `--gateway-setup` start een persistente OpenClaw Slack-Gateway in de VM in plaats van alleen de bot-naar-bot QA-lane te draaien.
- `--keep-lease` houdt de Gateway-VM open voor VNC-inspectie na succes; `--no-keep-lease` stopt deze na het verzamelen van artefacten.
- `--slack-url <url>` opent een specifieke Slack Web-URL. Zonder deze vlag leidt Mantis `https://app.slack.com/client/<team>/<channel>` af uit Slack `auth.test` wanneer het SUT-bot-token beschikbaar is.
- `--slack-channel-id <id>` bepaalt de Slack-kanaal-allowlist die door Gateway-setup wordt gebruikt.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` bepaalt het persistente Chrome-profiel binnen de VM. De standaardwaarde is `$HOME/.config/openclaw-mantis/slack-chrome-profile`, zodat een handmatige Slack Web-login herhalingen op dezelfde lease overleeft.
- `--credential-source convex --credential-role ci` gebruikt de gedeelde referentiepool in plaats van directe Slack-env-tokens.
- `--provider-mode`, `--model`, `--alt-model` en `--fast` worden doorgegeven aan de Slack-live-lane.

De GitHub-smokeworkflow is `Mantis Discord Smoke`. De voor- en na-GitHub-
workflow voor het eerste echte scenario is `Mantis Discord Status Reactions`. Deze
accepteert:

- `baseline_ref`: de ref waarvan wordt verwacht dat die queued-only-gedrag reproduceert.
- `candidate_ref`: de ref waarvan wordt verwacht dat die `queued -> thinking -> done` toont.

Deze checkt de workflow-harnasref uit, bouwt afzonderlijke baseline- en kandidaat-
worktrees, draait `discord-status-reactions-tool-only` tegen elke worktree en
uploadt `baseline/`, `candidate/`, `comparison.json` en `mantis-report.md` als
Actions-artefacten. Ook rendert deze de tijdlijn-HTML van elke lane in een Crabbox-
desktopbrowser en publiceert die VNC-screenshots naast de deterministische
tijdlijn-PNG's in de PR-reactie. Dezelfde PR-reactie embedt lichte
op beweging bijgesneden GIF-previews die door `crabbox media preview` zijn gegenereerd, linkt naar de
bijbehorende op beweging bijgesneden MP4-clips en bewaart de volledige desktop-MP4-bestanden voor diepe
inspectie. Screenshots blijven inline voor snelle review. De workflow bouwt de
Crabbox CLI vanuit
`openclaw/crabbox` main zodat deze de huidige desktop/browser-leasevlaggen kan gebruiken
voordat de volgende Crabbox-binaryrelease wordt gesneden.

`Mantis Scenario` is het generieke handmatige entrypoint. Het neemt een `scenario_id`,
`candidate_ref`, optionele `baseline_ref` en optionele `pr_number`, en dispatcht daarna
de scenario-eigen workflow. De wrapper is bewust dun:
scenarioworkflows blijven eigenaar van hun transportsetup, referenties, VM-klasse,
verwachte oracle en artefactmanifest.

`Mantis Slack Desktop Smoke` is de eerste Slack-VM-workflow. Deze checkt de
vertrouwde kandidaat-ref uit in een aparte worktree, leaset een Crabbox Linux-desktop,
voert `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` uit tegen die
kandidaat, opent Slack Web in de VNC-browser, neemt de desktop op, genereert een
op beweging ingekorte preview met `crabbox media preview`, uploadt de volledige
artifact-map en plaatst optioneel de inline bewijscomment op de doel-PR.
Standaard gebruikt deze AWS voor de desktoplease en biedt een handmatige providerinvoer,
zodat operators kunnen overschakelen naar Hetzner wanneer AWS-capaciteit traag of
niet beschikbaar is. Gebruik deze lane wanneer je "een Linux-desktop met Slack en
een draaiende claw" wilt in plaats van alleen een bot-naar-bot Slack-transcript.

`Mantis Telegram Live` wikkelt de bestaande Telegram live-QA-lane in dezelfde
PR-bewijspijplijn. Deze checkt de vertrouwde kandidaat-ref uit in een aparte
worktree, voert `pnpm openclaw qa telegram --credential-source convex
--credential-role ci` uit, schrijft een `mantis-evidence.json`-manifest vanuit de
Telegram-QA-samenvatting en het observed-message-artifact, rendert de geredigeerde
transcript-HTML via een Crabbox-desktopbrowser, genereert een op beweging ingekorte GIF
met `crabbox media preview` en plaatst de inline PR-bewijscomment wanneer een
PR-nummer beschikbaar is. Deze lane is transcript-visueel in plaats van ingelogd
Telegram Web-bewijs: de Telegram Bot API geeft stabiel bewijs van live berichten, maar
Telegram Web-inlogstatus is niet vereist voor normale Mantis-automatisering.

`Mantis Telegram Desktop Proof` is de agentische native Telegram Desktop
voor/na-wrapper. Een maintainer kan deze activeren vanuit een PR-comment met
`@Mantis telegram desktop proof`, vanuit de Actions-UI met vrije instructies, of
via de generieke `Mantis Scenario`-dispatcher. De workflow geeft de PR, baseline-ref,
kandidaat-ref en maintainerinstructies door aan Codex. De agent leest de PR,
bepaalt welk Telegram-zichtbaar gedrag de wijziging bewijst, voert de real-user
Crabbox Telegram Desktop proof-lane uit voor baseline en kandidaat, itereert tot
de native GIF's bruikbaar zijn, schrijft gekoppelde `motionPreview`-artifacts naar
`mantis-evidence.json`, uploadt de bundel en plaatst een PR-bewijstabel met 2 kolommen
wanneer een PR-nummer beschikbaar is.

Gebruik voor human-in-the-loop Telegram-desktopsetup de scenariobouwer:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

De bouwer leaset of hergebruikt een Crabbox-desktop, installeert de native Linux
Telegram Desktop-binary, herstelt optioneel een gebruikerssessie-archief, configureert
OpenClaw met het geleasede Telegram SUT-bottoken, start `openclaw gateway run`
op poort `38974`, plaatst een driver-botgereedheidsbericht in de geleasede privé-groep
en legt daarna een screenshot en MP4 vast van de zichtbare VNC-desktop. Een bottoken
logt nooit in op Telegram Desktop; het configureert alleen OpenClaw. De desktopviewer
is een afzonderlijke Telegram-gebruikerssessie die wordt hersteld vanuit
`--telegram-profile-archive-env <name>` of handmatig via VNC wordt gemaakt en in leven
wordt gehouden met `--keep-lease`.

Nuttige Telegram-desktopbouwerflags:

- `--lease-id <cbx_...>` draait opnieuw tegen een VM waarop een operator al is ingelogd bij Telegram Desktop.
- `--telegram-profile-archive-env <name>` leest een base64 `.tgz` Telegram Desktop-profielarchief uit die env-var en herstelt het vóór het starten.
- `--telegram-profile-dir <remote-path>` bepaalt de externe Telegram Desktop-profielmap. De standaardwaarde is `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` installeert en opent Telegram Desktop zonder OpenClaw te configureren.
- `--credential-source convex --credential-role ci` gebruikt de gedeelde credentialbroker in plaats van directe Telegram-env-tokens.

Elk PR-publicatiescenario schrijft `mantis-evidence.json` naast het rapport.
Dit schema is de overdracht tussen scenariocode en GitHub-comments:

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

Artifact-`path`-waarden zijn relatief ten opzichte van de manifestmap. `targetPath`-
waarden zijn relatieve paden onder de publicatiemap van de `qa-artifacts`-branch.
De publisher weigert path traversal en slaat vermeldingen over die zijn gemarkeerd met
`"required": false` wanneer optionele previews of video's niet beschikbaar zijn.

Ondersteunde artifactsoorten:

- `timeline`: deterministische scenarioscreenshot, meestal voor/na.
- `desktopScreenshot`: VNC-/browserdesktopscreenshot.
- `motionPreview`: inline geanimeerde GIF die uit de desktopopname wordt gegenereerd.
- `motionClip`: op beweging ingekorte MP4 die statische aanloop en staart verwijdert.
- `fullVideo`: volledige MP4-opname voor diepgaande inspectie.
- `metadata`: JSON-/log-sidecar.
- `report`: Markdown-rapport.

De herbruikbare publisher is `scripts/mantis/publish-pr-evidence.mjs`. Workflows
roepen deze aan met het manifest, de doel-PR, de `qa-artifacts`-doelroot, commentmarker,
Actions-artifact-URL, run-URL en aanvraagbron. Deze kopieert gedeclareerde artifacts
naar de `qa-artifacts`-branch, bouwt een samenvatting-eerst PR-comment met inline
afbeeldingen/previews en gelinkte video's, en werkt daarna de bestaande markercomment
bij of maakt er een aan.

Je kunt de status-reactions-run ook rechtstreeks activeren vanuit een PR-comment:

```text
@Mantis discord status reactions
```

De commenttrigger is bewust smal. Deze draait alleen op pull request-comments
van gebruikers met schrijf-, maintain- of adminrechten en herkent alleen
Discord-statusreactieverzoeken. Standaard gebruikt deze de bekende slechte baseline-ref
en de huidige PR-head-SHA als kandidaat. Maintainers kunnen beide refs overschrijven:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live-QA kan ook vanuit een PR-comment worden geactiveerd:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Standaard gebruikt deze de huidige PR-head-SHA als kandidaat en draait
`telegram-status-command`. Maintainers kunnen `candidate=...`,
`provider=aws|hetzner` en `lease=<cbx_...>` overschrijven wanneer ze een specifieke
ref of een voorverwarmde Crabbox-desktop nodig hebben.

ClawSweeper-commandovoorbeelden:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

De eerste opdracht is expliciet en scenariogericht. De tweede kan later een PR
of issue koppelen aan aanbevolen Mantis-scenario's op basis van labels, gewijzigde
bestanden en ClawSweeper-reviewbevindingen.

## Run-levenscyclus

1. Verkrijg credentials.
2. Wijs een VM toe of hergebruik er een.
3. Bereid het desktop-/browserprofiel voor wanneer het scenario UI-bewijs nodig heeft.
4. Bereid een schone checkout voor de baseline-ref voor.
5. Installeer afhankelijkheden en bouw alleen wat het scenario nodig heeft.
6. Start een onderliggende OpenClaw Gateway met een geïsoleerde statusmap.
7. Configureer het live transport, de provider, het model en het browserprofiel.
8. Draai het scenario en leg baseline-bewijs vast.
9. Stop de gateway en bewaar logs.
10. Bereid de kandidaat-ref in dezelfde VM voor.
11. Draai hetzelfde scenario en leg kandidaatbewijs vast.
12. Vergelijk de oracle-resultaten en visueel bewijs.
13. Schrijf Markdown, JSON, logs, screenshots en optionele trace-artifacts.
14. Upload GitHub Actions-artifacts.
15. Plaats een beknopt PR- of Discord-statusbericht.

Het scenario moet op twee verschillende manieren kunnen falen:

- **Bug gereproduceerd**: baseline faalde op de verwachte manier.
- **Harness-fout**: omgevingssetup, credentials, Discord API, browser of
  provider faalde voordat de bug-oracle betekenisvol was.

Het eindrapport moet deze gevallen scheiden, zodat maintainers een instabiele
omgeving niet verwarren met productgedrag.

## Discord-MVP

Het eerste scenario moet gericht zijn op Discord-statusreacties in guildkanalen waar
de bronantwoordleveringsmodus `message_tool_only` is.

Waarom dit een goede Mantis-seed is:

- Het is zichtbaar in Discord als reacties op het triggerbericht.
- Het heeft een sterke REST-oracle via de Discord-berichtreactiestatus.
- Het oefent een echte OpenClaw Gateway, Discord-botauthenticatie, berichtdispatch,
  bronantwoordleveringsmodus, statusreactiestatus en modelbeurtlevenscyclus.
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

Baseline-bewijs moet de queued-acknowledgementreactie tonen, maar geen
levenscyclustransitie in tool-only-modus. Kandidaatbewijs moet tonen dat
levenscyclusstatusreacties lopen wanneer `messages.statusReactions.enabled`
expliciet `true` is.

De uitvoerbare eerste slice is het opt-in Discord live-QA-scenario:

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
pollt het echte Discord-triggerbericht en verwacht de waargenomen reeks
`👀 -> 🤔 -> 👍`. Artifacts omvatten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` en
`discord-status-reactions-tool-only-timeline.png`.

## Bestaande QA-onderdelen

Mantis moet voortbouwen op de bestaande private QA-stack in plaats van vanaf
nul te beginnen:

- `pnpm openclaw qa discord` draait al een live Discord-lane met driver- en
  SUT-bots.
- De live transportrunner schrijft al rapporten en observed-message-artifacts
  onder `.artifacts/qa-e2e/`.
- Convex-credentialleases bieden al exclusieve toegang tot gedeelde live
  transportcredentials.
- De browserbesturingsservice ondersteunt al screenshots, snapshots,
  headless beheerde profielen en externe CDP-profielen.
- QA Lab heeft al een debugger-UI en bus voor transportvormige tests.

De eerste Mantis-implementatie kan een dunne voor/na-runner over deze onderdelen
zijn, plus één laag voor visueel bewijs.

## Bewijsmodel

Elke run schrijft een stabiele artifact-map:

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
Markdown-rapport is voor PR-comments en menselijke review.

De samenvatting moet bevatten:

- geteste refs en SHA's
- transport- en scenario-id
- machineprovider en machine-id of lease-id
- credentialbron zonder geheime waarden
- baseline-resultaat
- kandidaatresultaat
- of de bug op baseline werd gereproduceerd
- of de kandidaat deze heeft opgelost
- artifact-paden
- opgeschoonde setup- of cleanup-problemen

Screenshots zijn bewijs, geen geheimen. Ze vereisen nog steeds discipline bij redactie:
privékanaalnamen, gebruikersnamen of berichtinhoud kunnen zichtbaar zijn. Geef voor openbare PR's
de voorkeur aan GitHub Actions-artefactlinks boven inline-afbeeldingen totdat de redactiemethode
sterker is.

## Browser en VNC

De browserbaan heeft twee modi:

- **Headless automatisering**: standaard voor CI. Chrome draait met CDP ingeschakeld, en
  Playwright of OpenClaw-browserbesturing legt screenshots vast.
- **VNC-redding**: ingeschakeld op dezelfde VM wanneer login, MFA, Discord-anti-automatisering,
  of visuele debugging een mens vereist.

Het browserprofiel van de Discord-observer moet persistent genoeg zijn om te voorkomen
dat er voor elke run moet worden ingelogd, maar geïsoleerd van persoonlijke browserstatus. Een profiel
hoort bij de Mantis-machinepool, niet bij een ontwikkelaarslaptop.

Wanneer Mantis vastloopt, plaatst het een Discord-statusbericht met:

- run-id
- scenario-id
- machineprovider
- artefactmap
- VNC- of noVNC-verbindingsinstructies indien beschikbaar
- korte blokkadetekst

De eerste privé-implementatie kan deze berichten in het bestaande operatorkanaal
plaatsen en later naar een speciaal Mantis-kanaal verplaatsen.

## Machines

Mantis moet voor de eerste externe implementatie de voorkeur geven aan AWS via Crabbox.
Crabbox biedt ons voorverwarmde machines, lease-tracking, hydratie, logs, resultaten en
opschoning. Als AWS-capaciteit te traag of niet beschikbaar is, voeg dan een Hetzner-provider toe
achter dezelfde machine-interface.

Minimale VM-vereisten:

- Linux met een desktopgeschikte Chrome- of Chromium-installatie
- CDP-toegang voor browserautomatisering
- VNC of noVNC voor redding
- Node 22 en pnpm
- OpenClaw-checkout en dependencycache
- Playwright Chromium-browsercache wanneer Playwright wordt gebruikt
- genoeg CPU en geheugen voor één OpenClaw Gateway, één browser en één modelrun
- uitgaande toegang tot Discord, GitHub, modelproviders en de credentialbroker

De VM mag geen langlevende ruwe geheimen bewaren buiten de verwachte credential- of
browserprofielopslag.

## Geheimen

Geheimen leven in GitHub-organisatie- of repositorygeheimen voor externe runs, en in
een lokaal, door de operator beheerd geheimenbestand voor lokale runs.

Aanbevolen geheimnamen:

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
transportcredentials. GitHub-geheimen bootstrappen de broker en fallbackbanen.
De workflow voor Discord-statusreacties koppelt de Mantis Crabbox-geheimen terug naar
de omgevingsvariabelen `CRABBOX_COORDINATOR` en `CRABBOX_COORDINATOR_TOKEN`
die de Crabbox-CLI verwacht. De gewone GitHub-geheimnamen `CRABBOX_*` blijven
geaccepteerd als compatibiliteitsfallback.

De Mantis-runner mag nooit het volgende afdrukken:

- Discord-bottokens
- provider-API-sleutels
- browsercookies
- inhoud van auth-profielen
- VNC-wachtwoorden
- ruwe credentialpayloads

Openbare artefactuploads moeten ook Discord-doelmetadata redigeren, zoals bot-,
guild-, kanaal- en bericht-id's. De GitHub-smokeworkflow schakelt
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` om deze reden in.

Als een token per ongeluk in een issue, PR, chat of log wordt geplakt, roteer het dan
nadat het nieuwe geheim is opgeslagen.

## GitHub-artefacten en PR-opmerkingen

Mantis-workflows moeten de volledige bewijsbundel uploaden als een kortlevend Actions-artefact.
Wanneer de workflow wordt uitgevoerd voor een bugrapport of fix-PR, moet deze ook
de geredigeerde PNG-screenshots publiceren naar de branch `qa-artifacts` en een
opmerking op die bug of fix-PR upserten met inline voor/na-screenshots. Plaats het
primaire bewijs niet alleen op een generieke QA-automatiserings-PR. Ruwe logs, geobserveerde
berichten en ander omvangrijk bewijs blijven in het Actions-artefact.

Productieworkflows moeten die opmerkingen plaatsen met de Mantis GitHub App, niet
met `github-actions[bot]`. Sla de app-id en privésleutel op als
GitHub Actions-geheimen `MANTIS_GITHUB_APP_ID` en `MANTIS_GITHUB_APP_PRIVATE_KEY`.
De workflow gebruikt een verborgen marker als upsert-sleutel, werkt die
opmerking bij wanneer het token deze kan bewerken, en maakt een nieuwe opmerking in eigendom van Mantis
wanneer een oudere bot-eigen marker niet kan worden bewerkt.

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

Wanneer de run faalt omdat de harness is mislukt, moet de opmerking dat zeggen
in plaats van te suggereren dat de kandidaat is mislukt.

## Notities voor privé-implementatie

Een privé-implementatie heeft mogelijk al een Mantis Discord-applicatie. Hergebruik die
applicatie in plaats van een andere app te maken wanneer deze de juiste botmachtigingen
heeft en veilig kan worden geroteerd.

Stel het initiële operatornotificatiekanaal in via geheimen of implementatieconfiguratie.
Het kan eerst verwijzen naar een bestaand maintainer- of operations-kanaal,
en daarna verhuizen naar een speciaal Mantis-kanaal zodra dat bestaat.

Plaats geen guild-id's, kanaal-id's, bottokens, browsercookies of VNC-wachtwoorden
in dit document. Sla ze op in GitHub-geheimen, de credentialbroker of de
lokale geheimenopslag van de operator.

## Een scenario toevoegen

Een Mantis-scenario moet declareren:

- id en titel
- transport
- vereiste credentials
- beleid voor baseline-ref
- beleid voor kandidaat-ref
- OpenClaw-configuratiepatch
- instellingsstappen
- stimulus
- verwachte baseline-oracle
- verwachte kandidaat-oracle
- visuele vastlegdoelen
- time-outbudget
- opschoningsstappen

Scenario's moeten de voorkeur geven aan kleine, getypte oracles:

- Discord-reactiestatus voor reactiebugs
- Discord-berichtreferenties voor threadingbugs
- Slack-thread-ts en reactie-API-status voor Slack-bugs
- e-mailbericht-id's en headers voor e-mailbugs
- browserscreenshots wanneer UI de enige betrouwbare observatie is

Vision-controles moeten additief zijn. Als een platform-API de bug kan bewijzen, gebruik dan de
API als de pass/fail-oracle en behoud screenshots voor menselijk vertrouwen.

## Provideruitbreiding

Na Discord kan dezelfde runner het volgende toevoegen:

- Slack: reacties, threads, appvermeldingen, modals, bestandsuploads.
- E-mail: Gmail-auth en berichtthreading met `gog` waar connectors niet
  genoeg zijn.
- WhatsApp: QR-login, heridentificatie, berichtbezorging, media, reacties.
- Telegram: gating voor groepsvermeldingen, commando's, reacties waar beschikbaar.
- Matrix: versleutelde rooms, thread- of antwoordrelaties, hervatten na herstart.

Elk transport moet één goedkope smokescenario en één of meer bugklassescenario's hebben.
Dure visuele scenario's moeten opt-in blijven.

## Open vragen

- Welke Discord-bot moet de driver zijn, en welke de SUT, wanneer de
  bestaande Mantis-bot wordt hergebruikt?
- Moet de observer-browserlogin een menselijk Discord-account gebruiken, een testaccount,
  of alleen bot-leesbaar REST-bewijs voor de eerste fase?
- Hoe lang moet GitHub Mantis-artefacten voor PR's bewaren?
- Wanneer moet ClawSweeper automatisch Mantis aanbevelen in plaats van te wachten op een
  maintainercommando?
- Moeten screenshots worden geredigeerd of bijgesneden vóór upload voor openbare PR's?
