---
read_when:
    - Live visuele QA bouwen of uitvoeren voor OpenClaw-bugs
    - Verificatie vóór en na toevoegen voor een pullrequest
    - Discord-, Slack-, WhatsApp- of andere realtime-transportscenario's toevoegen
    - Debuggen van QA-runs waarvoor schermafbeeldingen, browserautomatisering of VNC-toegang nodig zijn
summary: Mantis is het visuele end-to-end-verificatiesysteem voor het reproduceren van OpenClaw-bugs op live transporten, het vastleggen van bewijs vóór en na, en het toevoegen van artefacten aan PR's.
title: Bidsprinkhaan
x-i18n:
    generated_at: "2026-05-10T19:31:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis is het end-to-end verificatiesysteem van OpenClaw voor bugs die een echte
runtime, een echt transport en zichtbaar bewijs nodig hebben. Het voert een
scenario uit tegen een bekende slechte ref, legt bewijs vast, voert hetzelfde
scenario uit tegen een kandidaat-ref en publiceert de vergelijking als artifacts
die een maintainer kan inspecteren vanuit een PR of vanuit een lokale opdracht.

Mantis begint met Discord omdat Discord ons een eerste lane met hoge waarde
geeft: echte bot-authenticatie, echte guildkanalen, reacties, threads, native
opdrachten en een browser-UI waarin mensen visueel kunnen bevestigen wat het
transport liet zien.

## Doelen

- Een bug uit een GitHub-issue of PR reproduceren met dezelfde transportvorm die
  gebruikers zien.
- Een **voor**-artifact vastleggen op de baseline-ref voordat de fix wordt
  toegepast.
- Een **na**-artifact vastleggen op de kandidaat-ref nadat de fix is toegepast.
- Waar mogelijk een deterministische oracle gebruiken, zoals het lezen van een
  Discord REST-reactie of een controle van het kanaaltranscript.
- Schermafbeeldingen vastleggen wanneer de bug een zichtbaar UI-oppervlak heeft.
- Lokaal uitvoeren vanuit een door een agent bestuurde CLI en extern vanuit
  GitHub.
- Genoeg machinestatus bewaren voor VNC-redding wanneer login,
  browserautomatisering of provider-authenticatie vastloopt.
- Beknopte status posten naar een operator-Discord-kanaal wanneer de run is
  geblokkeerd, handmatige VNC-hulp nodig heeft of klaar is.

## Niet-doelen

- Mantis is geen vervanging voor unittests. Een Mantis-run zou meestal een
  kleinere regressietest moeten worden nadat de fix is begrepen.
- Mantis is niet de normale snelle CI-gate. Het is langzamer, gebruikt live
  credentials en is gereserveerd voor bugs waarbij de live omgeving ertoe doet.
- Mantis zou geen mens nodig moeten hebben voor normale werking. Handmatige VNC
  is een reddingspad, niet het happy path.
- Mantis slaat geen ruwe geheimen op in artifacts, logs, schermafbeeldingen,
  Markdown-rapporten of PR-comments.

## Eigenaarschap

Mantis leeft in de OpenClaw QA-stack.

- OpenClaw is eigenaar van de scenarioruntime, transportadapters, het
  bewijsschema en de lokale CLI onder `pnpm openclaw qa mantis`.
- QA Lab is eigenaar van de live transportharnas-onderdelen,
  browsercapture-helpers en artifact-writers.
- Crabbox is eigenaar van opgewarmde Linux-machines wanneer een externe VM nodig
  is.
- GitHub Actions is eigenaar van het externe workflow-entrypoint en
  artifactretentie.
- ClawSweeper is eigenaar van GitHub-commentrouting: maintaineropdrachten parsen,
  de workflow dispatchen en de uiteindelijke PR-comment posten.
- OpenClaw-agents sturen Mantis via Codex aan wanneer een scenario agentische
  setup, debugging of rapportage van vastgelopen status nodig heeft.

Deze grens houdt transportkennis in OpenClaw, machineplanning in Crabbox en
maintainer-workflowlijm in ClawSweeper.

## Commandostructuur

De eerste lokale opdracht verifieert de Discord-bot, guild, kanaal, berichtsend,
reactiesend en artifactpad:

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
`--allow-failures` en schrijft daarna `baseline/`, `candidate/`,
`comparison.json` en `mantis-report.md`. Voor het eerste Discord-scenario
betekent een succesvolle verificatie dat de baseline-status `fail` is en de
kandidaatstatus `pass`.

De tweede Discord-voor/na-probe richt zich op threadbijlagen:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Dat scenario post een bovenliggend bericht met de driver-bot, maakt een echte
Discord-thread, roept OpenClaw's `message.thread-reply`-actie aan met een
repo-lokaal `filePath` en pollt daarna de thread voor het SUT-antwoord en de
bijlagenaam. De baseline-schermafbeelding toont het antwoord zonder bijlage; de
kandidaat-schermafbeelding toont de verwachte `mantis-thread-report.md`-bijlage.

De eerste VM/browser-primitief is de desktop-smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Deze least of hergebruikt een Crabbox-desktopmachine, start een zichtbare
browser in de VNC-sessie, legt de desktop vast, haalt artifacts terug naar de
lokale outputmap en schrijft de reconnect-opdracht in het rapport. De opdracht
gebruikt standaard de Hetzner-provider omdat dit de eerste provider is met
werkende desktop/VNC-dekking in de Mantis-lane. Overschrijf dit met `--provider`,
`--crabbox-bin` of `OPENCLAW_MANTIS_CRABBOX_PROVIDER` wanneer je tegen een andere
Crabbox-fleet draait.

Handige desktop-smoke-vlaggen:

- `--lease-id <cbx_...>` of `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` hergebruikt een opgewarmde desktop.
- `--browser-url <url>` wijzigt de pagina die in de zichtbare browser wordt geopend.
- `--html-file <path>` rendert een repo-lokaal HTML-artifact in de zichtbare browser. Mantis gebruikt dit om de gegenereerde Discord-statusreactietijdlijn via een echte Crabbox-desktop vast te leggen.
- `--browser-profile-dir <remote-path>` hergebruikt een externe Chrome-user-data-dir zodat een persistente Mantis-desktop tussen runs ingelogd kan blijven. Gebruik dit voor het langlevende Discord Web-viewerprofiel.
- `--browser-profile-archive-env <name>` herstelt een base64 `.tgz` Chrome-user-data-dir-archief vanuit de genoemde omgevingsvariabele voordat de browser wordt gestart. Gebruik dit voor ingelogde getuigen zoals Discord Web. De standaard env var is `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` bepaalt de lengte van de MP4-opname. Gebruik een langere duur voor trage ingelogde webapps die tijd nodig hebben om stabiel te worden.
- `--keep-lease` of `OPENCLAW_MANTIS_KEEP_VM=1` houdt een nieuw gemaakte geslaagde lease open voor VNC-inspectie. Mislukte runs houden de lease standaard open wanneer er een is gemaakt, zodat een operator opnieuw verbinding kan maken.
- `--class`, `--idle-timeout` en `--ttl` stemmen machinegrootte en leaselevensduur af.

Voor Discord Web-bewijs gebruikt Mantis een dedicated vieweraccount in plaats
van een bot-token. Het live Discord API-scenario blijft de oracle: het maakt de
echte thread, verzendt de SUT `thread-reply` en controleert de bijlage via
Discord REST. Wanneer `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` is ingesteld,
schrijft het scenario ook een Discord Web-URL-artifact. Wanneer
`OPENCLAW_QA_DISCORD_KEEP_THREADS=1` is ingesteld, laat het die thread lang
genoeg beschikbaar zodat een ingelogde browser deze kan openen en opnemen.

De GitHub-workflow opent de kandidaat-thread-URL in Discord Web, maakt een
schermafbeelding, neemt een MP4 op en genereert een bijgesneden GIF-preview
wanneer Crabbox-mediatooling beschikbaar is. Geef de voorkeur aan een persistent
viewerprofielpad dat is geconfigureerd via
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, omdat volledige Chrome-profielarchieven
groter kunnen worden dan GitHub's limiet voor geheimgrootte. Voor kleine/bootstrap-
profielen kan de workflow ook een base64 `.tgz`-archief herstellen vanuit
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Als geen van beide profielbronnen
is geconfigureerd, publiceert de workflow nog steeds de deterministische
baseline-/kandidaat-bijlagschermafbeeldingen en logt een melding dat de
ingelogde Discord Web-getuige is overgeslagen.

De eerste volledige desktoptransport-primitief is de Slack desktop-smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Deze least of hergebruikt een Crabbox-desktopmachine, synchroniseert de huidige
checkout naar de VM, draait `pnpm openclaw qa slack` binnen die VM, opent Slack
Web in de VNC-browser, legt de zichtbare desktop vast en kopieert zowel de Slack
QA-artifacts als de VNC-schermafbeelding terug naar de lokale outputmap. Dit is
de eerste Mantis-vorm waarbij de SUT OpenClaw Gateway en de browser beide in
dezelfde Linux-desktop-VM leven.

Met `--gateway-setup` bereidt de opdracht een persistente disposable OpenClaw-home
voor op `$HOME/.openclaw-mantis/slack-openclaw`, patcht Slack Socket Mode-configuratie
voor het geselecteerde kanaal, start `openclaw gateway run` op poort `38973` en
houdt Chrome actief in de VNC-sessie. Dit is de modus "laat mij een Linux-desktop
met Slack en een draaiende claw achter"; de bot-naar-bot Slack QA-lane blijft de
standaard wanneer `--gateway-setup` wordt weggelaten.

Vereiste invoer voor `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` voor de externe modellane. Als lokaal alleen
  `OPENAI_API_KEY` is ingesteld, mappt Mantis deze naar `OPENCLAW_LIVE_OPENAI_KEY`
  voordat Crabbox wordt aangeroepen, zodat Crabbox's `OPENCLAW_*` env-forwarding
  deze de VM in kan dragen.

Met `--gateway-setup --credential-source convex` least Mantis de Slack SUT-
credential uit de gedeelde pool voordat de VM wordt gemaakt en forwardt de
geleasede kanaal-id, Socket Mode-app-token en bot-token als de
`OPENCLAW_MANTIS_SLACK_*` runtime-env binnen de desktop. Dat houdt GitHub-
workflows dun: ze hebben alleen het Convex-brokergeheim nodig, niet ruwe Slack-
bot- of app-tokens.

Handige Slack-desktop-vlaggen:

- `--lease-id <cbx_...>` draait opnieuw tegen een machine waarop een operator al via VNC bij Slack Web is ingelogd.
- `--gateway-setup` start een persistente OpenClaw Slack Gateway in de VM in plaats van alleen de bot-naar-bot QA-lane te draaien.
- `--keep-lease` houdt de Gateway-VM open voor VNC-inspectie na succes; `--no-keep-lease` stopt deze na het verzamelen van artifacts.
- `--slack-url <url>` opent een specifieke Slack Web-URL. Zonder deze vlag leidt Mantis `https://app.slack.com/client/<team>/<channel>` af uit Slack `auth.test` wanneer het SUT-bot-token beschikbaar is.
- `--slack-channel-id <id>` beheert de Slack-kanaal-allowlist die door Gateway-setup wordt gebruikt.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` beheert het persistente Chrome-profiel binnen de VM. De standaardwaarde is `$HOME/.config/openclaw-mantis/slack-chrome-profile`, zodat een handmatige Slack Web-login herhalingsruns op dezelfde lease overleeft.
- `--credential-source convex --credential-role ci` gebruikt de gedeelde credentialpool in plaats van directe Slack-env-tokens.
- `--provider-mode`, `--model`, `--alt-model` en `--fast` worden doorgegeven aan de Slack-live-lane.

De GitHub-smoke-workflow is `Mantis Discord Smoke`. De voor- en na-GitHub-workflow
voor het eerste echte scenario is `Mantis Discord Status Reactions`. Deze
accepteert:

- `baseline_ref`: de ref waarvan wordt verwacht dat deze queued-only-gedrag reproduceert.
- `candidate_ref`: de ref waarvan wordt verwacht dat deze `queued -> thinking -> done` laat zien.

Deze checkt de workflowharnas-ref uit, bouwt afzonderlijke baseline- en
kandidaat-worktrees, voert `discord-status-reactions-tool-only` tegen elke
worktree uit en uploadt `baseline/`, `candidate/`, `comparison.json` en
`mantis-report.md` als Actions-artifacts. De workflow rendert ook de tijdlijn-
HTML van elke lane in een Crabbox-desktopbrowser en publiceert die VNC-
schermafbeeldingen naast de deterministische tijdlijn-PNG's in de PR-comment.
Dezelfde PR-comment embedt lichte, op beweging bijgesneden GIF-previews die door
`crabbox media preview` zijn gegenereerd, linkt naar de bijbehorende op beweging
bijgesneden MP4-clips en bewaart de volledige desktop-MP4-bestanden voor
diepgaande inspectie. Schermafbeeldingen blijven inline voor snelle review. De
workflow bouwt de Crabbox CLI vanaf
`openclaw/crabbox` main zodat deze de huidige desktop-/browser-leasevlaggen kan
gebruiken voordat de volgende Crabbox-binaryrelease wordt uitgebracht.

`Mantis Scenario` is het generieke handmatige entrypoint. Het neemt een
`scenario_id`, `candidate_ref`, optionele `baseline_ref` en optionele
`pr_number`, en dispatcht daarna de scenario-eigen workflow. De wrapper is
bewust dun: scenarioworkflows blijven eigenaar van hun transportsetup,
credentials, VM-klasse, verwachte oracle en artifactmanifest.

`Mantis Slack Desktop Smoke` is de eerste Slack-VM-workflow. Deze checkt de
vertrouwde kandidaat-ref uit in een aparte worktree, leaset een Crabbox Linux-desktop,
voert `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` uit tegen die
kandidaat, opent Slack Web in de VNC-browser, neemt de desktop op, genereert een
bewegingsgesnoeide preview met `crabbox media preview`, uploadt de volledige
artifact-directory en plaatst optioneel de inline bewijsreactie op de doel-PR.
Standaard gebruikt deze lane AWS voor de desktoplease en biedt hij een handmatige
provider-invoer zodat operators kunnen overschakelen naar Hetzner wanneer
AWS-capaciteit traag of niet beschikbaar is. Gebruik deze lane wanneer je "een
Linux-desktop met Slack en een draaiende claw" wilt in plaats van alleen een
bot-naar-bot-Slack-transcript.

`Mantis Telegram Live` verpakt de bestaande Telegram live QA-lane in dezelfde
PR-bewijspipeline. Deze checkt de vertrouwde kandidaat-ref uit in een aparte
worktree, voert `pnpm openclaw qa telegram --credential-source convex
--credential-role ci` uit, schrijft een `mantis-evidence.json`-manifest op basis
van de Telegram QA-samenvatting en het observed-message-artifact, rendert de
geredigeerde transcript-HTML via een Crabbox-desktopbrowser, genereert een
bewegingsgesnoeide GIF met `crabbox media preview` en plaatst de inline
PR-bewijsreactie wanneer er een PR-nummer beschikbaar is. Deze lane is
transcript-visueel in plaats van bewijs met ingelogde Telegram Web: de Telegram
Bot API biedt stabiel bewijs van live berichten, maar een Telegram Web-inlogstatus
is niet vereist voor normale Mantis-automatisering.

Gebruik voor human-in-the-loop Telegram-desktopsetup de scenario-builder:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

De builder leaset of hergebruikt een Crabbox-desktop, installeert de native
Linux Telegram Desktop-binary, herstelt optioneel een archief met een
gebruikerssessie, configureert OpenClaw met de geleasete Telegram SUT-bottoken,
start `openclaw gateway run` op poort `38974`, plaatst een gereedheidsbericht van
de driver-bot in de geleasete privégroep en legt vervolgens een screenshot en MP4
vast vanaf de zichtbare VNC-desktop. Een bottoken logt nooit in bij Telegram
Desktop; deze configureert alleen OpenClaw. De desktopviewer is een afzonderlijke
Telegram-gebruikerssessie die wordt hersteld vanuit
`--telegram-profile-archive-env <name>` of handmatig via VNC wordt aangemaakt en
met `--keep-lease` actief wordt gehouden.

Nuttige Telegram-desktopbuilder-flags:

- `--lease-id <cbx_...>` voert opnieuw uit tegen een VM waarop een operator al bij Telegram Desktop heeft ingelogd.
- `--telegram-profile-archive-env <name>` leest een base64 `.tgz` Telegram Desktop-profielarchief uit die env-var en herstelt dit vóór het starten.
- `--telegram-profile-dir <remote-path>` bepaalt de externe Telegram Desktop-profieldirectory. De standaardwaarde is `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` installeert en opent Telegram Desktop zonder OpenClaw te configureren.
- `--credential-source convex --credential-role ci` gebruikt de gedeelde credential-broker in plaats van directe Telegram-env-tokens.

Elk PR-publicerend scenario schrijft `mantis-evidence.json` naast het rapport.
Dit schema is de overdracht tussen scenariocode en GitHub-reacties:

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

Artifact-`path`-waarden zijn relatief aan de manifestdirectory. `targetPath`-
waarden zijn relatieve paden onder de publicatiedirectory van de `qa-artifacts`-
branch. De publisher wijst path traversal af en slaat items over die zijn
gemarkeerd met `"required": false` wanneer optionele previews of video's niet
beschikbaar zijn.

Ondersteunde artifact-soorten:

- `timeline`: deterministische scenarioscreenshot, meestal voor/na.
- `desktopScreenshot`: VNC-/browser-desktopscreenshot.
- `motionPreview`: inline geanimeerde GIF die uit de desktopopname is gegenereerd.
- `motionClip`: bewegingsgesnoeide MP4 die statische aanloop en staart verwijdert.
- `fullVideo`: volledige MP4-opname voor diepgaande inspectie.
- `metadata`: JSON-/log-sidecar.
- `report`: Markdown-rapport.

De herbruikbare publisher is `scripts/mantis/publish-pr-evidence.mjs`. Workflows
roepen deze aan met het manifest, de doel-PR, de doelroot van `qa-artifacts`, de
comment marker, Actions-artifact-URL, run-URL en request source. Deze kopieert
gedeclareerde artifacts naar de `qa-artifacts`-branch, bouwt een PR-reactie met
samenvatting eerst met inline afbeeldingen/previews en gelinkte video's, en werkt
vervolgens de bestaande markerreactie bij of maakt er een aan.

Je kunt de status-reactions-run ook rechtstreeks vanuit een PR-reactie triggeren:

```text
@Mantis discord status reactions
```

De reactietrigger is bewust smal. Deze draait alleen op pull request-reacties van
gebruikers met write-, maintain- of admin-toegang, en herkent alleen Discord
status-reaction-requests. Standaard gebruikt deze de bekende slechte baseline-ref
en de huidige PR-head-SHA als kandidaat. Maintainers kunnen beide refs overschrijven:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA kan ook vanuit een PR-reactie worden getriggerd:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Standaard gebruikt deze de huidige PR-head-SHA als kandidaat en draait
`telegram-status-command`. Maintainers kunnen `candidate=...`,
`provider=aws|hetzner` en `lease=<cbx_...>` overschrijven wanneer ze een specifieke
ref of een voorverwarmde Crabbox-desktop nodig hebben.

Voorbeelden van ClawSweeper-commando's:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Het eerste commando is expliciet en scenario-gericht. Het tweede kan later een PR
of issue mappen naar aanbevolen Mantis-scenario's op basis van labels, gewijzigde
bestanden en bevindingen uit ClawSweeper-reviews.

## Runlevenscyclus

1. Verkrijg credentials.
2. Wijs een VM toe of hergebruik er een.
3. Bereid het desktop-/browserprofiel voor wanneer het scenario UI-bewijs nodig heeft.
4. Bereid een schone checkout voor de baseline-ref voor.
5. Installeer dependencies en bouw alleen wat het scenario nodig heeft.
6. Start een child OpenClaw Gateway met een geïsoleerde statusdirectory.
7. Configureer het live transport, de provider, het model en het browserprofiel.
8. Draai het scenario en leg baseline-bewijs vast.
9. Stop de Gateway en bewaar logs.
10. Bereid de kandidaat-ref voor in dezelfde VM.
11. Draai hetzelfde scenario en leg kandidaatbewijs vast.
12. Vergelijk de orakelresultaten en het visuele bewijs.
13. Schrijf Markdown, JSON, logs, screenshots en optionele trace-artifacts.
14. Upload GitHub Actions-artifacts.
15. Plaats een beknopte PR- of Discord-statusmelding.

Het scenario moet op twee verschillende manieren kunnen falen:

- **Bug gereproduceerd**: de baseline faalde op de verwachte manier.
- **Harness-fout**: omgevingssetup, credentials, Discord API, browser of
  provider faalde voordat het bugorakel betekenisvol was.

Het eindrapport moet deze gevallen scheiden, zodat maintainers een instabiele
omgeving niet verwarren met productgedrag.

## Discord-MVP

Het eerste scenario moet gericht zijn op Discord-statusreacties in guildkanalen
waar de bronantwoordmodus `message_tool_only` is.

Waarom dit een goede Mantis-seed is:

- Het is zichtbaar in Discord als reacties op het triggerende bericht.
- Het heeft een sterk REST-orakel via de reactiestatus van Discord-berichten.
- Het oefent een echte OpenClaw Gateway, Discord-bot-auth, berichtdispatch,
  bronantwoordmodus, statusreactiestatus en modelturn-levenscyclus.
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
levenscyclustransitie in tool-only-modus. Kandidaatbewijs moet tonen dat
levenscyclus-statusreacties draaien wanneer `messages.statusReactions.enabled`
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

Dit configureert de SUT met altijd-aan guildafhandeling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` en expliciete statusreacties. Het orakel
pollt het echte triggerende Discord-bericht en verwacht de geobserveerde reeks
`👀 -> 🤔 -> 👍`. Artifacts bevatten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` en
`discord-status-reactions-tool-only-timeline.png`.

## Bestaande QA-onderdelen

Mantis moet voortbouwen op de bestaande private QA-stack in plaats van vanaf nul
te beginnen:

- `pnpm openclaw qa discord` draait al een live Discord-lane met driver- en SUT-bots.
- De live transportrunner schrijft al rapporten en observed-message-artifacts onder `.artifacts/qa-e2e/`.
- Convex-credentialleases bieden al exclusieve toegang tot gedeelde live transport-credentials.
- De browserbesturingsservice ondersteunt al screenshots, snapshots, headless beheerde profielen en externe CDP-profielen.
- QA Lab heeft al een debugger-UI en bus voor transport-vormige tests.

De eerste Mantis-implementatie kan een dunne before/after-runner over deze
onderdelen zijn, plus één visuele bewijslaag.

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
Markdown-rapport is voor PR-reacties en menselijke review.

De samenvatting moet bevatten:

- geteste refs en SHA's
- transport en scenario-id
- machineprovider en machine-id of lease-id
- credential source zonder geheime waarden
- baseline-resultaat
- kandidaatresultaat
- of de bug op baseline is gereproduceerd
- of de kandidaat deze heeft opgelost
- artifact-paden
- opgeschoonde setup- of cleanup-issues

Screenshots zijn bewijs, geen geheimen. Ze vereisen nog steeds discipline bij
redactie: private kanaalnamen, gebruikersnamen of berichtinhoud kunnen
verschijnen. Geef voor publieke PR's de voorkeur aan GitHub Actions-artifactlinks
boven inline afbeeldingen totdat het redactieverhaal sterker is.

## Browser en VNC

De browser-lane heeft twee modi:

- **Headless automatisering**: standaard voor CI. Chrome draait met CDP ingeschakeld, en
  Playwright of OpenClaw-browserbesturing legt screenshots vast.
- **VNC-redding**: ingeschakeld op dezelfde VM wanneer login, MFA, Discord-anti-automatisering
  of visuele debugging een mens nodig heeft.

Het Discord-observerbrowserprofiel moet persistent genoeg zijn om niet voor elke
run opnieuw te hoeven inloggen, maar geïsoleerd van persoonlijke browserstatus.
Een profiel hoort bij de Mantis-machinepool, niet bij een laptop van een
ontwikkelaar.

Wanneer Mantis vastloopt, plaatst het een Discord-statusmelding met:

- run-id
- scenario-id
- machineprovider
- artifactmap
- VNC- of noVNC-verbindingsinstructies indien beschikbaar
- korte blokkadetekst

De eerste private deployment kan deze berichten in het bestaande operatorkanaal plaatsen en later naar een speciaal Mantis-kanaal verhuizen.

## Machines

Mantis moet voor de eerste remote implementatie AWS via Crabbox verkiezen. Crabbox geeft ons opgewarmde machines, lease-tracking, hydratatie, logs, resultaten en opschoning. Als AWS-capaciteit te traag of niet beschikbaar is, voeg dan een Hetzner-provider toe achter dezelfde machine-interface.

Minimale VM-vereisten:

- Linux met een Chrome- of Chromium-installatie die geschikt is voor desktopgebruik
- CDP-toegang voor browserautomatisering
- VNC of noVNC voor noodherstel
- Node 22 en pnpm
- OpenClaw-checkout en afhankelijkheidscache
- Playwright Chromium-browsercache wanneer Playwright wordt gebruikt
- genoeg CPU en geheugen voor één OpenClaw Gateway, één browser en één modelrun
- uitgaande toegang tot Discord, GitHub, modelproviders en de credential-broker

De VM mag geen langlevende ruwe geheimen bewaren buiten de verwachte opslaglocaties voor credentials of browserprofielen.

## Geheimen

Geheimen staan in GitHub-organisatie- of repositorygeheimen voor remote runs, en in een lokaal, door de operator beheerd geheimenbestand voor lokale runs.

Aanbevolen geheime namen:

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

Op lange termijn moet de Convex-credentialpool de normale bron blijven voor live transportcredentials. GitHub-geheimen bootstrappen de broker en fallback-lanes. De Discord status-reacties-workflow koppelt de Mantis Crabbox-geheimen terug naar de omgevingsvariabelen `CRABBOX_COORDINATOR` en `CRABBOX_COORDINATOR_TOKEN` die de Crabbox CLI verwacht. De gewone GitHub-geheimnamen `CRABBOX_*` blijven geaccepteerd als compatibiliteitsfallback.

De Mantis-runner mag nooit afdrukken:

- Discord-bottokens
- provider-API-sleutels
- browsercookies
- inhoud van auth-profielen
- VNC-wachtwoorden
- ruwe credential-payloads

Publieke artifactuploads moeten ook Discord-doelmetadata zoals bot-, guild-, kanaal- en bericht-id's redigeren. De GitHub-smoke-workflow schakelt om deze reden `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` in.

Als een token per ongeluk in een issue, PR, chat of log wordt geplakt, roteer het dan nadat het nieuwe geheim is opgeslagen.

## GitHub-artifacts en PR-opmerkingen

Mantis-workflows moeten de volledige bewijsbundel uploaden als een kortlevend Actions-artifact. Wanneer de workflow wordt uitgevoerd voor een bugrapport of fix-PR, moet deze ook de geredigeerde PNG-schermafbeeldingen publiceren naar de `qa-artifacts`-branch en een opmerking op die bug of fix-PR upserten met inline vóór/na-schermafbeeldingen. Plaats het primaire bewijs niet alleen op een generieke QA-automatiserings-PR. Ruwe logs, geobserveerde berichten en ander omvangrijk bewijs blijven in het Actions-artifact.

Productieworkflows moeten die opmerkingen plaatsen met de Mantis GitHub App, niet met `github-actions[bot]`. Sla de app-id en private key op als GitHub Actions-geheimen `MANTIS_GITHUB_APP_ID` en `MANTIS_GITHUB_APP_PRIVATE_KEY`. De workflow gebruikt een verborgen marker als upsert-sleutel, werkt die opmerking bij wanneer het token deze kan bewerken, en maakt een nieuwe opmerking van Mantis aan wanneer een oudere marker van een bot niet kan worden bewerkt.

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

Wanneer de run mislukt doordat de harness faalde, moet de opmerking dat zeggen in plaats van te impliceren dat de kandidaat faalde.

## Notities voor private deployment

Een private deployment heeft mogelijk al een Mantis Discord-applicatie. Hergebruik die applicatie in plaats van een andere app te maken wanneer deze de juiste botrechten heeft en veilig kan worden geroteerd.

Stel het initiële operatornotificatiekanaal in via geheimen of deploymentconfiguratie. Dit kan eerst naar een bestaand maintainer- of operations-kanaal wijzen, en daarna naar een speciaal Mantis-kanaal verhuizen zodra dat bestaat.

Plaats geen guild-id's, kanaal-id's, bottokens, browsercookies of VNC-wachtwoorden in dit document. Sla ze op in GitHub-geheimen, de credential-broker of de lokale geheimenopslag van de operator.

## Een scenario toevoegen

Een Mantis-scenario moet declareren:

- id en titel
- transport
- vereiste credentials
- baseline-refbeleid
- kandidaat-refbeleid
- OpenClaw-configuratiepatch
- setupstappen
- stimulus
- verwachte baseline-orakel
- verwachte kandidaat-orakel
- visuele capturedoelen
- timeoutbudget
- opschoningsstappen

Scenario's moeten kleine, getypeerde orakels verkiezen:

- Discord-reactiestatus voor reactiefouten
- Discord-berichtreferenties voor threadingfouten
- Slack-thread-ts en reactie-API-status voor Slack-fouten
- e-mailbericht-id's en headers voor e-mailfouten
- browserschermafbeeldingen wanneer de UI het enige betrouwbare waarneembare signaal is

Vision-controles moeten additief zijn. Als een platform-API de bug kan bewijzen, gebruik de API dan als pass/fail-orakel en bewaar schermafbeeldingen voor menselijk vertrouwen.

## Provideruitbreiding

Na Discord kan dezelfde runner toevoegen:

- Slack: reacties, threads, appvermeldingen, modals, bestandsuploads.
- E-mail: Gmail-auth en berichtenthreading met `gog` wanneer connectors niet genoeg zijn.
- WhatsApp: QR-login, heridentificatie, berichtbezorging, media, reacties.
- Telegram: gating van groepsvermeldingen, opdrachten, reacties waar beschikbaar.
- Matrix: versleutelde kamers, thread- of antwoordrelaties, hervatten na herstart.

Elk transport moet één goedkope smoke-scenario en één of meer bugklasse-scenario's hebben. Dure visuele scenario's moeten opt-in blijven.

## Open vragen

- Welke Discord-bot moet de driver zijn, en welke de SUT, wanneer de bestaande Mantis-bot wordt hergebruikt?
- Moet de observer-browserlogin in de eerste fase een menselijk Discord-account, een testaccount of alleen bot-leesbaar REST-bewijs gebruiken?
- Hoelang moet GitHub Mantis-artifacts voor PR's bewaren?
- Wanneer moet ClawSweeper automatisch Mantis aanbevelen in plaats van op een maintaineropdracht te wachten?
- Moeten schermafbeeldingen worden geredigeerd of bijgesneden vóór upload voor publieke PR's?
