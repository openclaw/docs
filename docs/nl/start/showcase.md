---
description: Real-world OpenClaw projects from the community
read_when:
    - Op zoek naar praktijkvoorbeelden van OpenClaw-gebruik
    - Hoogtepunten van communityprojecten bijwerken
summary: Door de gemeenschap gebouwde projecten en integraties, mogelijk gemaakt door OpenClaw
title: Etalage
x-i18n:
    generated_at: "2026-04-29T23:19:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw-projecten zijn geen speeldemo's. Mensen leveren PR-reviewloops, mobiele apps, domotica, spraaksystemen, devtools en geheugenintensieve workflows vanuit de kanalen die ze al gebruiken — chat-native builds op Telegram, WhatsApp, Discord en terminals; echte automatisering voor boeken, winkelen en support zonder op een API te wachten; en integraties met de fysieke wereld via printers, stofzuigers, camera's en huissystemen.

<Info>
**Wil je worden uitgelicht?** Deel je project in [#self-promotion op Discord](https://discord.gg/clawd) of [tag @openclaw op X](https://x.com/openclaw).
</Info>

## Video's

Begin hier als je de kortste weg wilt van "wat is dit?" naar "oké, ik snap het."

<CardGroup cols={3}>

<Card title="Volledige setup-walkthrough" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 minuten. Installeren, onboarden en van begin tot eind een eerste werkende assistent krijgen.
</Card>

<Card title="Community-showcasereel" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  Een snellere ronde langs echte projecten, surfaces en workflows die rond OpenClaw zijn gebouwd.
</Card>

<Card title="Projecten in de praktijk" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Voorbeelden uit de community, van chat-native codeerloops tot hardware en persoonlijke automatisering.
</Card>

</CardGroup>

## Vers van Discord

Recente uitschieters in coding, devtools, mobiel en chat-native productbouw.

<CardGroup cols={2}>

<Card title="PR-review naar Telegram-feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode rondt de wijziging af, opent een PR, OpenClaw reviewt de diff en antwoordt in Telegram met suggesties plus een duidelijk merge-oordeel.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR-reviewfeedback afgeleverd in Telegram" />
</Card>

<Card title="Wine Cellar Skill in minuten" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Vroeg "Robby" (@openclaw) om een lokale wijnkelder-Skill. Die vraagt om een voorbeeld-CSV-export en een opslagpad, en bouwt en test daarna de skill (962 flessen in het voorbeeld).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw bouwt een lokale wijnkelder-Skill vanuit CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Weekmenu, vaste items, bezorgslot boeken, bestelling bevestigen. Geen API's, alleen browserbesturing.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco-winkelautomatisering via chat" />
</Card>

<Card title="SNAG screenshot-naar-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Sneltoets voor een schermgebied, Gemini Vision, direct Markdown op je klembord.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-naar-markdown-tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Desktop-app om skills en opdrachten te beheren voor Agents, Claude, Codex en OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI-app" />
</Card>

<Card title="Telegram-spraakberichten (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Verpakt papla.media TTS en verstuurt resultaten als Telegram-spraakberichten (geen irritante autoplay).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram-spraakberichtoutput van TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Via Homebrew geïnstalleerde helper om lokale OpenAI Codex-sessies te tonen, inspecteren en volgen (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor op ClawHub" />
</Card>

<Card title="Bambu 3D-printerbesturing" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab-printers besturen en problemen oplossen: status, taken, camera, AMS, kalibratie en meer.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI-skill op ClawHub" />
</Card>

<Card title="Vervoer in Wenen (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Realtime vertrektijden, storingen, liftstatus en routeplanning voor het openbaar vervoer in Wenen.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien-skill op ClawHub" />
</Card>

<Card title="ParentPay-schoolmaaltijden" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Geautomatiseerd boeken van Britse schoolmaaltijden via ParentPay. Gebruikt muiscoördinaten om betrouwbaar op tabelcellen te klikken.
</Card>

<Card title="R2-upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Upload naar Cloudflare R2/S3 en genereer veilige vooraf ondertekende downloadlinks. Handig voor externe OpenClaw-instances.
</Card>

<Card title="iOS-app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Bouwde een complete iOS-app met kaarten en spraakopname, volledig via Telegram-chat naar TestFlight gedeployed.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS-app op TestFlight" />
</Card>

<Card title="Oura Ring-gezondheidsassistent" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Persoonlijke AI-gezondheidsassistent die Oura-ringdata integreert met agenda, afspraken en sportschoolschema.

  <img src="/assets/showcase/oura-health.png" alt="Oura Ring-gezondheidsassistent" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ agents onder één Gateway met een Opus 4.5-orchestrator die aan Codex-workers delegeert. Zie de [technische write-up](https://github.com/adam91holt/orchestrated-ai-articles) en [Clawdspace](https://github.com/adam91holt/clawdspace) voor agentsandboxing.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI voor Linear die integreert met agentic workflows (Claude Code, OpenClaw). Beheer issues, projecten en workflows vanuit de terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lees, verstuur en archiveer berichten via Beeper Desktop. Gebruikt de lokale MCP-API van Beeper zodat agents al je chats (iMessage, WhatsApp en meer) op één plek kunnen beheren.
</Card>

</CardGroup>

## Automatisering en workflows

Planning, browserbesturing, supportloops en de "doe de taak gewoon voor mij"-kant van het product.

<CardGroup cols={2}>

<Card title="Winix-luchtreinigerbesturing" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ontdekte en bevestigde de bediening van de luchtreiniger, waarna OpenClaw het overneemt om de luchtkwaliteit in de kamer te beheren.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix-luchtreinigerbesturing via OpenClaw" />
</Card>

<Card title="Mooie luchtcamerafoto's" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Getriggerd door een dakcamera: vraag OpenClaw om een luchtfoto te maken wanneer het er mooi uitziet. Het ontwierp een skill en maakte de foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Luchtsnapshot van dakcamera vastgelegd door OpenClaw" />
</Card>

<Card title="Visuele ochtendbriefingscène" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Een geplande prompt genereert elke ochtend één scèneafbeelding (weer, taken, datum, favoriete post of citaat) via een OpenClaw-persona.
</Card>

<Card title="Padelbaan boeken" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic-beschikbaarheidschecker plus boekings-CLI. Mis nooit meer een vrije baan.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli-screenshot" />
</Card>

<Card title="Accounting-inname" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Verzamelt PDF's uit e-mail en bereidt documenten voor een belastingadviseur voor. Maandelijkse boekhouding op autopilot.
</Card>

<Card title="Couch potato-devmodus" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Bouwde een volledige persoonlijke site opnieuw via Telegram terwijl hij Netflix keek — van Notion naar Astro, 18 posts gemigreerd, DNS naar Cloudflare. Nooit een laptop geopend.
</Card>

<Card title="Vacaturezoekagent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Doorzoekt vacatures, matcht ze met CV-trefwoorden en retourneert relevante kansen met links. Gebouwd in 30 minuten met de JSearch API.
</Card>

<Card title="Jira-skillbouwer" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw maakte verbinding met Jira en genereerde daarna direct een nieuwe skill (voordat die op ClawHub bestond).
</Card>

<Card title="Todoist-skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatiseerde Todoist-taken en liet OpenClaw de skill rechtstreeks in Telegram-chat genereren.
</Card>

<Card title="TradingView-analyse" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Logt in op TradingView via browserautomatisering, maakt screenshots van grafieken en voert op verzoek technische analyse uit. Geen API nodig — alleen browserbesturing.
</Card>

<Card title="Slack-auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Volgt een Slack-kanaal van een bedrijf, reageert behulpzaam en stuurt meldingen door naar Telegram. Loste autonoom een productiefout in een gedeployde app op zonder dat daarom werd gevraagd.
</Card>

</CardGroup>

## Kennis en geheugen

Systemen die persoonlijke of teamkennis indexeren, doorzoeken, onthouden en beredeneren.

<CardGroup cols={2}>

<Card title="xuezh Chinees leren" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Chinese leerengine met uitspraakfeedback en studiestromen via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh-uitspraakfeedback" />
</Card>

<Card title="WhatsApp-geheugenkluis" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Neemt volledige WhatsApp-exports op, transcribeert 1k+ spraakberichten, controleert kruislings met git-logs en levert gelinkte markdownrapporten op.
</Card>

<Card title="Karakeep semantisch zoeken" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Voegt vectorzoekfunctie toe aan Karakeep-bladwijzers met Qdrant plus OpenAI- of Ollama-embeddings.
</Card>

<Card title="Inside-Out-2-geheugen" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Afzonderlijke geheugenmanager die sessiebestanden omzet in herinneringen, daarna in overtuigingen en vervolgens in een evoluerend zelfmodel.
</Card>

</CardGroup>

## Spraak en telefoon

Spraakgerichte toegangspunten, telefoonbruggen en workflows met veel transcriptie.

<CardGroup cols={2}>

<Card title="Clawdia-telefoonbrug" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi-spraakassistent naar OpenClaw HTTP-brug. Bijna realtime telefoongesprekken met je agent.
</Card>

<Card title="OpenRouter-transcriptie" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Meertalige audiotranscriptie via OpenRouter (Gemini en meer). Beschikbaar op ClawHub.
</Card>

</CardGroup>

## Infrastructuur en implementatie

Packaging, implementatie en integraties die OpenClaw eenvoudiger maken om uit te voeren en uit te breiden.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw-gateway die draait op Home Assistant OS met ondersteuning voor SSH-tunnels en persistente status.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Bestuur en automatiseer Home Assistant-apparaten via natuurlijke taal.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Kant-en-klare genixificeerde OpenClaw-configuratie voor reproduceerbare implementaties.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Kalenderskill met khal en vdirsyncer. Zelfgehoste kalenderintegratie.
</Card>

</CardGroup>

## Huis en hardware

De fysieke kant van OpenClaw: huizen, sensoren, camera's, stofzuigers en andere apparaten.

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Nix-native huisautomatisering met OpenClaw als interface, plus Grafana-dashboards.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Bestuur je Roborock-robotstofzuiger via een natuurlijk gesprek.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Communityprojecten

Dingen die verder groeiden dan één workflow tot bredere producten of ecosystemen.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Volledige marktplaats voor astronomische apparatuur. Gebouwd met en rond het OpenClaw-ecosysteem.
</Card>

</CardGroup>

## Dien je project in

<Steps>
  <Step title="Share it">
    Plaats het in [#self-promotion op Discord](https://discord.gg/clawd) of [tweet @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    Vertel ons wat het doet, link naar de repo of demo, en deel een screenshot als je die hebt.
  </Step>
  <Step title="Get featured">
    We voegen opvallende projecten toe aan deze pagina.
  </Step>
</Steps>

## Gerelateerd

- [Aan de slag](/nl/start/getting-started)
- [OpenClaw](/nl/start/openclaw)
