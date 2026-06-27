---
read_when:
    - OpenClaw-bugs bouwen of live visuele QA uitvoeren
    - Voor- en naverificatie toevoegen voor een pull request
    - Live-transportscenario's voor Discord, Slack, WhatsApp of andere diensten toevoegen
    - QA-runs debuggen waarvoor screenshots, browserautomatisering of VNC-toegang nodig zijn
summary: Mantis is het visuele end-to-end-verificatiesysteem voor het reproduceren van OpenClaw-bugs op live-transporten, het vastleggen van voor- en na-bewijs en het koppelen van artefacten aan PR's.
title: Mantis
x-i18n:
    generated_at: "2026-06-27T17:26:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis is het end-to-end-verificatiesysteem van OpenClaw voor bugs die een echte
runtime, een echt transport en zichtbaar bewijs nodig hebben. Het voert een scenario uit tegen een bekende
slechte ref, legt bewijs vast, voert hetzelfde scenario uit tegen een kandidaat-ref en
publiceert de vergelijking als artifacts die een maintainer vanuit een PR of
via een lokale opdracht kan inspecteren.

Mantis begint met Discord omdat Discord ons een waardevolle eerste lane geeft:
echte bot-auth, echte guild-kanalen, reacties, threads, native commands en een
browser-UI waarin mensen visueel kunnen bevestigen wat het transport liet zien.

## Doelen

- Reproduceer een bug uit een GitHub-issue of PR met dezelfde transportvorm die gebruikers
  zien.
- Leg een **voor**-artifact vast op de baseline-ref voordat de fix wordt toegepast.
- Leg een **na**-artifact vast op de kandidaat-ref nadat de fix is toegepast.
- Gebruik waar mogelijk een deterministische oracle, zoals een Discord REST-reactie-
  uitlezing of kanaaltranscriptcontrole.
- Leg screenshots vast wanneer de bug een zichtbaar UI-oppervlak heeft.
- Voer lokaal uit vanuit een door een agent bestuurde CLI en op afstand vanuit GitHub.
- Bewaar genoeg machinestatus voor VNC-redding wanneer login, browserautomatisering of
  provider-auth vastloopt.
- Plaats beknopte status in een operator-Discord-kanaal wanneer de run is geblokkeerd,
  handmatige VNC-hulp nodig heeft of klaar is.

## Niet-doelen

- Mantis is geen vervanging voor unit tests. Een Mantis-run moet meestal een
  kleinere regressietest worden zodra de fix is begrepen.
- Mantis is niet de normale snelle CI-gate. Het is trager, gebruikt live-referenties en
  is gereserveerd voor bugs waarbij de live-omgeving ertoe doet.
- Mantis mag geen mens vereisen voor normaal gebruik. Handmatige VNC is een reddingspad,
  niet het standaardpad.
- Mantis slaat geen ruwe geheimen op in artifacts, logs, screenshots, Markdown-
  rapporten of PR-comments.

## Eigenaarschap

Mantis leeft in de OpenClaw-QA-stack.

- OpenClaw is eigenaar van de scenarioruntime, transportadapters, bewijsschema en
  lokale CLI onder `pnpm openclaw qa mantis`.
- QA Lab is eigenaar van de live-transportharnasonderdelen, browsercapturehelpers en
  artifact-writers.
- Crabbox is eigenaar van opgewarmde Linux-machines wanneer een externe VM nodig is.
- GitHub Actions is eigenaar van het externe workflow-entrypoint en artifactretentie.
- ClawSweeper is eigenaar van GitHub-commentrouting: maintainer-commands parsen,
  de workflow dispatchen en de uiteindelijke PR-comment plaatsen.
- OpenClaw-agents sturen Mantis via Codex wanneer een scenario agentic setup,
  debugging of stuck-state-rapportage nodig heeft.

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

De runner maakt detached baseline- en kandidaat-worktrees onder de output-
directory, installeert dependencies, bouwt elke ref, voert het scenario uit met
`--allow-failures` en schrijft daarna `baseline/`, `candidate/`, `comparison.json`
en `mantis-report.md`. Voor het eerste Discord-scenario betekent een geslaagde
verificatie dat de baseline-status `fail` is en de kandidaat-status `pass`.

De tweede Discord-voor/na-probe richt zich op thread-bijlagen:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Dat scenario plaatst een bovenliggend bericht met de driver-bot, maakt een echte Discord-
thread, roept OpenClaw's `message.thread-reply`-actie aan met een repo-lokale
`filePath` en pollt daarna de thread op het SUT-antwoord en de bijlagebestandsnaam. Het
baseline-screenshot toont het antwoord zonder bijlage; het kandidaat-screenshot
toont de verwachte `mantis-thread-report.md`-bijlage.

De eerste VM/browser-primitive is de desktop-smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Deze least of hergebruikt een Crabbox-desktopmachine, start een zichtbare browser binnen de
VNC-sessie, legt de desktop vast, haalt artifacts terug naar de lokale output-
directory en schrijft de reconnect-opdracht in het rapport. De opdracht gebruikt standaard
de Hetzner-provider omdat dit de eerste provider is met werkende desktop/VNC-
dekking in de Mantis-lane. Overschrijf dit met `--provider`, `--crabbox-bin` of
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` wanneer je tegen een andere Crabbox-fleet draait.

Handige desktop-smoke-vlaggen:

- `--lease-id <cbx_...>` of `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` hergebruikt een opgewarmde desktop.
- `--browser-url <url>` wijzigt de pagina die in de zichtbare browser wordt geopend.
- `--html-file <path>` rendert een repo-lokaal HTML-artifact in de zichtbare browser. Mantis gebruikt dit om de gegenereerde Discord-statusreactietijdlijn via een echte Crabbox-desktop vast te leggen.
- `--browser-profile-dir <remote-path>` hergebruikt een externe Chrome-user-data-dir zodat een persistente Mantis-desktop tussen runs ingelogd kan blijven. Gebruik dit voor het langlevende Discord Web-viewerprofiel.
- `--browser-profile-archive-env <name>` herstelt een base64 `.tgz` Chrome-user-data-dir-archief uit de genoemde omgevingsvariabele voordat de browser wordt gestart. Gebruik dit voor ingelogde witnesses zoals Discord Web. De standaard-env-var is `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` bepaalt de MP4-capturelengte. Gebruik een langere duur voor trage ingelogde webapps die tijd nodig hebben om stabiel te worden.
- `--keep-lease` of `OPENCLAW_MANTIS_KEEP_VM=1` houdt een nieuw aangemaakte geslaagde lease open voor VNC-inspectie. Mislukte runs houden de lease standaard open wanneer er een is aangemaakt zodat een operator opnieuw kan verbinden.
- `--class`, `--idle-timeout` en `--ttl` tunen machinegrootte en levensduur van de lease.

Voor Discord Web-bewijs gebruikt Mantis een speciaal vieweraccount in plaats van een
bot-token. Het live Discord API-scenario blijft de oracle: het maakt de echte
thread, verzendt de SUT `thread-reply` en controleert de bijlage via Discord
REST. Wanneer `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` is ingesteld, schrijft het scenario ook
een Discord Web-URL-artifact. Wanneer `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` is
ingesteld, laat het die thread lang genoeg beschikbaar zodat een ingelogde browser hem kan openen
en opnemen.

De GitHub-workflow opent de kandidaat-thread-URL in Discord Web, legt een
screenshot vast, neemt een MP4 op en genereert een ingekorte GIF-preview wanneer Crabbox-
mediatooling beschikbaar is. Geef de voorkeur aan een persistent viewerprofielpad dat is geconfigureerd
via `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, omdat volledige Chrome-profiel-
archieven groter kunnen worden dan GitHub's limiet voor secret-grootte. Voor kleine/bootstrapprofielen
kan de workflow ook een base64 `.tgz`-archief herstellen uit
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Als geen van beide profielbronnen is
geconfigureerd, publiceert de workflow nog steeds de deterministische baseline/kandidaat-
bijlagescreenshots en logt een notice dat de ingelogde Discord Web-witness
is overgeslagen.

De eerste volledige desktop-transportprimitive is de Slack-desktop-smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Deze least of hergebruikt een Crabbox-desktopmachine, synchroniseert de huidige checkout naar
de VM, voert `pnpm openclaw qa slack` binnen die VM uit, opent Slack Web in de VNC-
browser, legt de zichtbare desktop vast en kopieert zowel de Slack-QA-artifacts als
het VNC-screenshot terug naar de lokale outputdirectory. Dit is de eerste Mantis-
vorm waarbij de SUT OpenClaw-gateway en de browser allebei binnen dezelfde
Linux-desktop-VM leven.

Met `--gateway-setup` bereidt de opdracht een persistente disposable OpenClaw-
home voor op `$HOME/.openclaw-mantis/slack-openclaw`, patcht Slack Socket Mode-
configuratie voor het geselecteerde kanaal, start `openclaw gateway run` op poort
`38973` en houdt Chrome actief in de VNC-sessie. Dit is de modus "laat mij een
Linux-desktop met Slack en een claw draaien"; de bot-naar-bot Slack-QA-lane
blijft de standaard wanneer `--gateway-setup` wordt weggelaten.

Vereiste inputs voor `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` voor de externe modellane. Als alleen
  `OPENAI_API_KEY` lokaal is ingesteld, mapt Mantis die naar `OPENCLAW_LIVE_OPENAI_KEY`
  voordat Crabbox wordt aangeroepen, zodat Crabbox's `OPENCLAW_*`-env-forwarding hem
  naar de VM kan meenemen.

Met `--gateway-setup --credential-source convex` least Mantis de Slack SUT-
referentie uit de gedeelde pool voordat de VM wordt aangemaakt en forwardt het geleasete
kanaal-id, Socket Mode-app-token en bot-token als de `OPENCLAW_MANTIS_SLACK_*`-
runtime-env binnen de desktop. Dat houdt GitHub-workflows dun: ze hebben alleen
het Convex-brokersecret nodig, niet ruwe Slack-bot- of app-tokens.

Handige Slack-desktop-vlaggen:

- `--lease-id <cbx_...>` voert opnieuw uit tegen een machine waarop een operator al via VNC bij Slack Web heeft ingelogd.
- `--gateway-setup` start een persistente OpenClaw Slack-gateway in de VM in plaats van alleen de bot-naar-bot-QA-lane uit te voeren.
- `--keep-lease` houdt de gateway-VM open voor VNC-inspectie na succes; `--no-keep-lease` stopt hem na het verzamelen van artifacts.
- `--slack-url <url>` opent een specifieke Slack Web-URL. Zonder deze optie leidt Mantis `https://app.slack.com/client/<team>/<channel>` af uit Slack `auth.test` wanneer het SUT-bot-token beschikbaar is.
- `--slack-channel-id <id>` bepaalt de Slack-kanaalallowlist die door gateway-setup wordt gebruikt.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` bepaalt het persistente Chrome-profiel binnen de VM. De standaard is `$HOME/.config/openclaw-mantis/slack-chrome-profile`, zodat een handmatige Slack Web-login reruns op dezelfde lease overleeft.
- `--credential-source convex --credential-role ci` gebruikt de gedeelde referentiepool in plaats van directe Slack-env-tokens.
- `--provider-mode`, `--model`, `--alt-model` en `--fast` worden doorgegeven aan de Slack-live-lane.

Approval checkpoint-runs renderen Slack API-berichtsnapshots naar checkpoint-PNG's
voor CI-veilig visueel bewijs. `slack-desktop-smoke.png` is alleen bewijs van Slack Web
wanneer de lease een warm browserprofiel gebruikt dat al is ingelogd.

De GitHub-smoke-workflow is `Mantis Discord Smoke`. De voor- en na-GitHub-
workflow voor het eerste echte scenario is `Mantis Discord Status Reactions`. Deze
accepteert:

- `baseline_ref`: de ref die naar verwachting queued-only-gedrag reproduceert.
- `candidate_ref`: de ref die naar verwachting `queued -> thinking -> done` toont.

Deze checkt de workflow-harness-ref uit, bouwt afzonderlijke baseline- en kandidaat-
worktrees, voert `discord-status-reactions-tool-only` tegen elke worktree uit en
uploadt `baseline/`, `candidate/`, `comparison.json` en `mantis-report.md` als
Actions-artifacts. Deze rendert ook de tijdlijn-HTML van elke lane in een Crabbox-
desktopbrowser en publiceert die VNC-screenshots naast de deterministische
tijdlijn-PNG's in de PR-comment. Dezelfde PR-comment embedt lichte
motion-trimmed GIF-previews die door `crabbox media preview` zijn gegenereerd, linkt naar de
bijbehorende motion-trimmed MP4-clips en bewaart de volledige desktop-MP4-bestanden voor diepe
inspectie. Screenshots blijven inline voor snelle review. De workflow bouwt de
Crabbox CLI vanaf
`openclaw/crabbox` main zodat deze de huidige desktop/browser-leasevlaggen kan gebruiken
voordat de volgende Crabbox-binaryrelease wordt uitgebracht.

`Mantis Scenario` is het generieke handmatige toegangspunt. Het neemt een `scenario_id`,
`candidate_ref`, optionele `baseline_ref` en optionele `pr_number`, en
stuurt daarna de workflow aan die eigendom is van het scenario. De wrapper is bewust dun:
scenarioworkflows blijven eigenaar van hun transportconfiguratie, referenties, VM-klasse,
verwachte oracle en artifact-manifest.

`Mantis Slack Desktop Smoke` is de eerste Slack VM-workflow. Deze checkt de
vertrouwde kandidaat-ref uit in een aparte worktree, least een Crabbox Linux-desktop,
voert `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` uit tegen die
kandidaat, opent Slack Web in de VNC-browser, neemt de desktop op, genereert een
bewegingsgetrimde preview met `crabbox media preview`, uploadt de volledige artifact-
directory en plaatst optioneel de inline evidence-opmerking op de doel-PR.
De standaard is AWS voor de desktoplease en er is een handmatige providerinvoer zodat
operators kunnen overschakelen naar Hetzner wanneer AWS-capaciteit traag of niet
beschikbaar is. Gebruik deze lane wanneer je "een Linux-desktop met Slack en een
draaiende claw" wilt in plaats van alleen een bot-naar-bot Slack-transcript.

`Mantis Telegram Live` verpakt de bestaande Telegram live QA-lane in dezelfde PR-
evidencepipeline. Deze checkt de vertrouwde kandidaat-ref uit in een aparte
worktree, voert `pnpm openclaw qa telegram --credential-source convex
--credential-role ci` uit, schrijft een `mantis-evidence.json`-manifest vanuit de
Telegram QA-samenvatting, `qa-evidence.json` en rapportartifacts, rendert de
geredigeerde evidence-HTML via een Crabbox desktopbrowser, genereert een
bewegingsgetrimde GIF met `crabbox media preview` en plaatst de inline PR-
evidence-opmerking wanneer een PR-nummer beschikbaar is. Deze lane is visuele
QA-evidence in plaats van bewijs via ingelogde Telegram Web: de Telegram Bot API
geeft stabiele live berichtevidence, maar Telegram Web-loginstatus is niet nodig
voor normale Mantis-automatisering.

`Mantis Telegram Desktop Proof` is de agentic native Telegram Desktop
voor/na-wrapper. Een maintainer kan deze activeren vanuit een PR-opmerking met
`@openclaw-mantis telegram desktop proof`, vanuit de Actions-UI met vrije
instructies, of via de generieke `Mantis Scenario`-dispatcher. De workflow geeft
de PR, baseline-ref, kandidaat-ref en maintainerinstructies door aan Codex.
De agent leest de PR, bepaalt welk Telegram-zichtbaar gedrag de wijziging bewijst,
voert de real-user Crabbox Telegram Desktop proof-lane uit voor baseline en
kandidaat, itereert totdat de native GIFs bruikbaar zijn, schrijft gekoppelde
`motionPreview`-artifacts naar `mantis-evidence.json`, uploadt de bundel en
plaatst een PR-evidencetabel met 2 kolommen wanneer een PR-nummer beschikbaar is.

Gebruik voor human-in-the-loop Telegram-desktopconfiguratie de scenariobouwer:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

De bouwer least of hergebruikt een Crabbox-desktop, installeert de native Linux
Telegram Desktop-binary, herstelt optioneel een gebruikerssessiearchief, configureert
OpenClaw met het geleasede Telegram SUT-bottoken, start `openclaw gateway run`
op poort `38974`, plaatst een gereedheidsbericht van de driver-bot in de geleasede
privégroep en legt daarna een screenshot en MP4 vast van de zichtbare VNC-desktop.
Een bottoken logt Telegram Desktop nooit in; het configureert alleen OpenClaw. De
desktopviewer is een aparte Telegram-gebruikerssessie die wordt hersteld vanuit
`--telegram-profile-archive-env <name>` of handmatig via VNC wordt gemaakt en met
`--keep-lease` actief wordt gehouden.

Nuttige Telegram-desktopbouwerflags:

- `--lease-id <cbx_...>` draait opnieuw tegen een VM waarop een operator al is ingelogd bij Telegram Desktop.
- `--telegram-profile-archive-env <name>` leest een base64 `.tgz` Telegram Desktop-profielarchief uit die env var en herstelt het voor het starten.
- `--telegram-profile-dir <remote-path>` beheert de externe Telegram Desktop-profieldirectory. De standaard is `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` installeert en opent Telegram Desktop zonder OpenClaw te configureren.
- `--credential-source convex --credential-role ci` gebruikt de gedeelde credentialbroker in plaats van directe Telegram-env-tokens.

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
waarden zijn relatieve paden onder de geconfigureerde Mantis R2/S3-artifactprefix. De
publisher weigert path traversal en slaat vermeldingen over die zijn gemarkeerd met
`"required": false` wanneer optionele previews of videos niet beschikbaar zijn.

Ondersteunde artifactsoorten:

- `timeline`: deterministische scenarioscreenshot, meestal voor/na.
- `desktopScreenshot`: VNC-/browserdesktopscreenshot.
- `motionPreview`: inline geanimeerde GIF die is gegenereerd uit de desktopopname.
- `motionClip`: bewegingsgetrimde MP4 die statische aanloop en staart verwijdert.
- `fullVideo`: volledige MP4-opname voor diepgaande inspectie.
- `metadata`: JSON-/log-sidecar.
- `report`: Markdown-rapport.

De herbruikbare publisher is `scripts/mantis/publish-pr-evidence.mjs`. Workflows
roepen deze aan met het manifest, de doel-PR, de doelroot voor artifacts, commentaarmarker,
Actions-artifact-URL, run-URL en aanvraagbron. Deze uploadt gedeclareerde artifacts
naar de geconfigureerde Mantis R2/S3-bucket, bouwt een samenvatting-eerst PR-opmerking
met inline afbeeldingen/previews en gelinkte videos, en werkt daarna de bestaande
markeropmerking bij of maakt er een aan. De workflows publiceren naar
`openclaw-crabbox-artifacts` met publieke URLs onder `https://artifacts.openclaw.ai`.
Ze leveren bucket-, regio- en publieke URL-waarden rechtstreeks. De herbruikbare
publisher vereist:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

Je kunt de status-reactions-run ook rechtstreeks vanuit een PR-opmerking activeren:

```text
@openclaw-mantis discord status reactions
```

De commentaartrigger is bewust smal. Deze draait alleen op pull request-
opmerkingen van gebruikers met schrijf-, maintain- of beheerdersrechten, en herkent
alleen Discord status-reaction-aanvragen. Standaard gebruikt deze de bekende slechte
baseline-ref en de huidige PR head SHA als kandidaat. Maintainers kunnen beide
refs overschrijven:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA kan ook vanuit een PR-opmerking worden geactiveerd:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Standaard gebruikt deze de huidige PR head SHA als kandidaat en draait
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

## Runlevenscyclus

1. Verkrijg referenties.
2. Wijs een VM toe of hergebruik er een.
3. Bereid het desktop-/browserprofiel voor wanneer het scenario UI-evidence nodig heeft.
4. Bereid een schone checkout voor de baseline-ref voor.
5. Installeer afhankelijkheden en bouw alleen wat het scenario nodig heeft.
6. Start een onderliggende OpenClaw Gateway met een geïsoleerde statusdirectory.
7. Configureer het live transport, de provider, het model en het browserprofiel.
8. Draai het scenario en leg baseline-evidence vast.
9. Stop de gateway en bewaar logs.
10. Bereid de kandidaat-ref in dezelfde VM voor.
11. Draai hetzelfde scenario en leg kandidaat-evidence vast.
12. Vergelijk de oracle-resultaten en visuele evidence.
13. Schrijf Markdown, JSON, logs, screenshots en optionele trace-artifacts.
14. Upload GitHub Actions-artifacts.
15. Plaats een beknopt PR- of Discord-statusbericht.

Het scenario moet op twee verschillende manieren kunnen falen:

- **Bug gereproduceerd**: baseline faalde op de verwachte manier.
- **Harnessfout**: omgevingsconfiguratie, referenties, Discord API, browser of
  provider faalde voordat de bug-oracle betekenisvol was.

Het eindrapport moet deze gevallen scheiden zodat maintainers een instabiele
omgeving niet verwarren met productgedrag.

## Discord MVP

Het eerste scenario moet gericht zijn op Discord-statusreacties in guild-kanalen
waar de bronantwoordbezorgmodus `message_tool_only` is.

Waarom dit een goede Mantis-start is:

- Het is zichtbaar in Discord als reacties op het triggerbericht.
- Het heeft een sterke REST-oracle via de reactiestatus van Discord-berichten.
- Het oefent een echte OpenClaw Gateway, Discord-botauthenticatie, berichtdispatch,
  bronantwoordbezorgmodus, statusreactiestatus en modelturn-levenscyclus.
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

Baseline-evidence moet de queued-bevestigingsreactie tonen, maar geen
levenscyclustransitie in tool-only-modus. Kandidaat-evidence moet levenscyclus-
statusreacties tonen wanneer `messages.statusReactions.enabled` expliciet
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

Het configureert de SUT met altijd-aan guild-afhandeling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` en expliciete statusreacties. De oracle
pollt het echte Discord-triggerbericht en verwacht de waargenomen reeks
`👀 -> 🤔 -> 👍`. Artifacts omvatten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` en
`discord-status-reactions-tool-only-timeline.png`.

## Bestaande QA-onderdelen

Mantis moet voortbouwen op de bestaande private QA-stack in plaats van vanaf nul
te beginnen:

- `pnpm openclaw qa discord` draait al een live Discord-lane met driver- en
  SUT-bots.
- De live transportrunner schrijft al rapporten, QA-evidence en
  transportspecifieke artifacts onder `.artifacts/qa-e2e/`.
- Convex-credentialleases bieden al exclusieve toegang tot gedeelde live
  transportreferenties.
- De browserbeheerservice ondersteunt al screenshots, snapshots, headless
  beheerde profielen en externe CDP-profielen.
- QA Lab heeft al een debugger-UI en bus voor transportvormige tests.

De eerste Mantis-implementatie kan een dunne voor/na-runner over deze onderdelen
zijn, plus één visuele evidence-laag.

## Evidencemodel

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

`mantis-summary.json` moet de machineleesbare bron van waarheid zijn. Het
Markdown-rapport is voor PR-opmerkingen en menselijke beoordeling.

De samenvatting moet bevatten:

- geteste refs en SHA's
- transport en scenario-id
- machineprovider en machine-id of lease-id
- referentiebron zonder geheime waarden
- basislijnresultaat
- kandidaatresultaat
- of de bug op de basislijn is gereproduceerd
- of de kandidaat deze heeft opgelost
- artefactpaden
- opgeschoonde installatie- of opruimingsproblemen

Schermafbeeldingen zijn bewijs, geen geheimen. Ze vereisen nog steeds
redactiediscipline: privékanaalnamen, gebruikersnamen of berichtinhoud kunnen
verschijnen. Voor openbare PR's hebben GitHub Actions-artefactlinks de voorkeur
boven inline-afbeeldingen totdat het redactieverhaal sterker is.

## Browser en VNC

De browserlane heeft twee modi:

- **Headless automatisering**: standaard voor CI. Chrome draait met CDP
  ingeschakeld, en Playwright of OpenClaw-browserbesturing legt
  schermafbeeldingen vast.
- **VNC-redding**: ingeschakeld op dezelfde VM wanneer login, MFA,
  Discord-anti-automatisering of visuele debugging een mens nodig heeft.

Het browserprofiel van de Discord-observer moet persistent genoeg zijn om niet
voor elke run te hoeven inloggen, maar geïsoleerd zijn van persoonlijke
browserstatus. Een profiel hoort bij de Mantis-machinepool, niet bij een laptop
van een ontwikkelaar.

Wanneer Mantis vastloopt, plaatst het een Discord-statusbericht met:

- run-id
- scenario-id
- machineprovider
- artefactmap
- VNC- of noVNC-verbindingsinstructies indien beschikbaar
- korte blokkadetekst

De eerste private deployment kan deze berichten in het bestaande operatorkanaal
plaatsen en later naar een dedicated Mantis-kanaal verplaatsen.

## Machines

Mantis moet voor de eerste externe implementatie AWS via Crabbox verkiezen.
Crabbox geeft ons voorverwarmde machines, lease-tracking, hydratie, logs,
resultaten en opruiming. Als AWS-capaciteit te traag of niet beschikbaar is,
voeg dan een Hetzner-provider toe achter dezelfde machine-interface.

Minimale VM-vereisten:

- Linux met een desktopgeschikte Chrome- of Chromium-installatie
- CDP-toegang voor browserautomatisering
- VNC of noVNC voor redding
- Node 22 en pnpm
- OpenClaw-checkout en dependencycache
- Playwright Chromium-browsercache wanneer Playwright wordt gebruikt
- genoeg CPU en geheugen voor één OpenClaw Gateway, één browser en één modelrun
- uitgaande toegang tot Discord, GitHub, modelproviders en de referentiebroker

De VM mag geen langlevende ruwe geheimen bewaren buiten de verwachte
referentie- of browserprofielstores.

## Geheimen

Geheimen leven in GitHub-organisatie- of repositorygeheimen voor externe runs,
en in een lokaal, door de operator beheerd geheimenbestand voor lokale runs.

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

Op lange termijn moet de Convex-referentiepool de normale bron blijven voor
live transportreferenties. GitHub-geheimen bootstrappen de broker en
fallbacklanes. De Discord-statusreacties-workflow koppelt de Mantis
Crabbox-geheimen terug aan de omgevingsvariabelen `CRABBOX_COORDINATOR` en
`CRABBOX_COORDINATOR_TOKEN` die de Crabbox CLI verwacht. De gewone
GitHub-geheimnamen `CRABBOX_*` blijven geaccepteerd als
compatibiliteitsfallback.

De Mantis-runner mag nooit afdrukken:

- Discord-bottokens
- provider-API-sleutels
- browsercookies
- inhoud van auth-profielen
- VNC-wachtwoorden
- ruwe referentiepayloads

Openbare artefactuploads moeten ook Discord-doelmetadata zoals bot-, guild-,
kanaal- en bericht-id's redigeren. De GitHub-smokeworkflow schakelt om deze
reden `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` in.

Als een token per ongeluk in een issue, PR, chat of log wordt geplakt, roteer
het nadat het nieuwe geheim is opgeslagen.

## GitHub-artefacten en PR-opmerkingen

Mantis-workflows moeten de volledige bewijsbundel uploaden als een kortlevend
Actions-artefact. Wanneer de workflow wordt uitgevoerd voor een bugrapport of
fix-PR, moet deze ook geredigeerde inline-media publiceren naar de
geconfigureerde Mantis R2/S3-bucket en een opmerking op die bug of fix-PR
upserten met inline voor/na-schermafbeeldingen. Plaats het primaire bewijs niet
alleen op een generieke QA-automatiserings-PR. Ruwe logs, waargenomen berichten
en ander omvangrijk bewijs blijven in het Actions-artefact.

Productieworkflows moeten die opmerkingen plaatsen met de Mantis GitHub App, niet
met `github-actions[bot]`. Sla de app-id en privésleutel op als
GitHub Actions-geheimen `MANTIS_GITHUB_APP_ID` en
`MANTIS_GITHUB_APP_PRIVATE_KEY`. De workflow gebruikt een verborgen marker als
upsert-sleutel, werkt die opmerking bij wanneer het token deze kan bewerken, en
maakt een nieuwe door Mantis beheerde opmerking wanneer een oudere, door een bot
beheerde marker niet kan worden bewerkt.

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

Wanneer de run mislukt omdat de harness is mislukt, moet de opmerking dat zeggen
in plaats van te impliceren dat de kandidaat is mislukt.

## Notities voor private deployment

Een private deployment heeft mogelijk al een Mantis Discord-applicatie. Hergebruik
die applicatie in plaats van een andere app te maken wanneer deze de juiste
botmachtigingen heeft en veilig kan worden geroteerd.

Stel het eerste operatornotificatiekanaal in via geheimen of
deploymentconfiguratie. Het kan eerst naar een bestaand maintainer- of
operations-kanaal wijzen en daarna naar een dedicated Mantis-kanaal verhuizen
zodra dat bestaat.

Plaats geen guild-id's, kanaal-id's, bottokens, browsercookies of VNC-wachtwoorden
in dit document. Sla ze op in GitHub-geheimen, de referentiebroker of de lokale
geheimenstore van de operator.

## Een scenario toevoegen

Een Mantis-scenario moet declareren:

- id en titel
- transport
- vereiste referenties
- beleid voor basislijn-ref
- beleid voor kandidaat-ref
- OpenClaw-configpatch
- installatiestappen
- stimulus
- verwachte basislijn-orakel
- verwachte kandidaat-orakel
- doelen voor visuele vastlegging
- time-outbudget
- opruimingsstappen

Scenario's moeten kleine, getypeerde orakels verkiezen:

- Discord-reactiestatus voor reactiebugs
- Discord-berichtreferenties voor threadbugs
- Slack-thread-ts en reactie-API-status voor Slack-bugs
- e-mailbericht-id's en headers voor e-mailbugs
- browserschermafbeeldingen wanneer UI het enige betrouwbare waarneembare is

Vision-controles moeten aanvullend zijn. Als een platform-API de bug kan
bewijzen, gebruik de API dan als pass/fail-orakel en bewaar schermafbeeldingen
voor menselijk vertrouwen.

## Provideruitbreiding

Na Discord kan dezelfde runner toevoegen:

- Slack: reacties, threads, app-vermeldingen, modals, bestandsuploads.
- E-mail: Gmail-auth en berichtthreading met `gog` waar connectors niet genoeg
  zijn.
- WhatsApp: QR-login, heridentificatie, berichtbezorging, media, reacties.
- Telegram: gating voor groepsvermeldingen, opdrachten, reacties waar
  beschikbaar.
- Matrix: versleutelde rooms, thread- of reply-relaties, hervatten na herstart.

Elk transport moet één goedkope smoke-scenario en één of meer
bugklasse-scenario's hebben. Dure visuele scenario's moeten opt-in blijven.

## Open vragen

- Welke Discord-bot moet de driver zijn, en welke de SUT, wanneer de bestaande
  Mantis-bot wordt hergebruikt?
- Moet de observer-browserlogin een menselijk Discord-account, een testaccount
  of alleen door bots leesbaar REST-bewijs gebruiken voor de eerste fase?
- Hoe lang moet GitHub Mantis-artefacten voor PR's bewaren?
- Wanneer moet ClawSweeper automatisch Mantis aanbevelen in plaats van te wachten
  op een maintaineropdracht?
- Moeten schermafbeeldingen worden geredigeerd of bijgesneden vóór upload voor
  openbare PR's?
