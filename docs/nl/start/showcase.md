---
description: Real-world OpenClaw projects from the community
read_when:
    - Op zoek naar echte OpenClaw-gebruiksvoorbeelden
    - Communityproject-highlights bijwerken
summary: Community-gebouwde projecten en integraties aangedreven door OpenClaw
title: Etalage
x-i18n:
    generated_at: "2026-07-02T08:35:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw-projecten zijn geen speelgoed-demo's. Mensen gebruiken ze om PR-reviewlussen, mobiele apps, domotica, spraaksystemen, devtools en geheugenintensieve workflows te leveren vanuit de kanalen die ze al gebruiken — chat-native builds op Telegram, WhatsApp, Discord en terminals; echte automatisering voor boeken, winkelen en support zonder op een API te wachten; en integraties met de fysieke wereld via printers, stofzuigers, camera's en woningsystemen.

<Info>
**Wil je uitgelicht worden?** Deel je project in [#self-promotion op Discord](https://discord.gg/clawd) of [tag @openclaw op X](https://x.com/openclaw).
</Info>

## Nieuw van Discord

Recente uitblinkers in coderen, devtools, mobiele apps en chat-native productontwikkeling.

<CardGroup cols={2}>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode rondt de wijziging af, opent een PR, OpenClaw reviewt de diff en antwoordt in Telegram met suggesties plus een duidelijk merge-oordeel.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Vroeg "Robby" (@openclaw) om een lokale wijnkelder-Skill. Die vraagt om een voorbeeldexport als CSV en een opslagpad, en bouwt en test vervolgens de Skill (962 flessen in het voorbeeld).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Wekelijks maaltijdplan, vaste boodschappen, bezorgmoment boeken, bestelling bevestigen. Geen API's, alleen browserbesturing.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Sneltoets voor een schermgebied, Gemini Vision, direct Markdown op je klembord.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Desktop-app om Skills en opdrachten te beheren in Agents, Claude, Codex en OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Verpakt papla.media-TTS en verstuurt resultaten als Telegram-spraakberichten (zonder vervelende autoplay).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Via Homebrew geïnstalleerde helper om lokale OpenAI Codex-sessies weer te geven, te inspecteren en te volgen (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Bedien en los problemen op met BambuLab-printers: status, taken, camera, AMS, kalibratie en meer.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Realtime vertrektijden, storingen, liftstatus en routes voor het openbaar vervoer in Wenen.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Geautomatiseerd boeken van schoolmaaltijden in het Verenigd Koninkrijk via ParentPay. Gebruikt muiscoördinaten om betrouwbaar op tabelcellen te klikken.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Upload naar Cloudflare R2/S3 en genereer veilige vooraf ondertekende downloadlinks. Handig voor externe OpenClaw-instances.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Bouwde een complete iOS-app met kaarten en spraakopname, volledig via Telegram-chat voorbereid voor distributie in de App Store.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Persoonlijke AI-gezondheidsassistent die Oura Ring-gegevens integreert met agenda, afspraken en sportschoolschema.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Meer dan 14 agents onder één Gateway, met een Opus 4.5-orchestrator die delegeert aan Codex-workers. Zie de [technische uitwerking](https://github.com/adam91holt/orchestrated-ai-articles) en [Clawdspace](https://github.com/adam91holt/clawdspace) voor agent-sandboxing.
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

Planning, browserbesturing, supportlussen en de "doe de taak gewoon voor mij"-kant van het product.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ontdekte en bevestigde de bediening van de luchtreiniger, waarna OpenClaw het overneemt om de luchtkwaliteit in de kamer te beheren.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Geactiveerd door een dakcamera: vraag OpenClaw een foto van de lucht te maken wanneer die er mooi uitziet. Het ontwierp een Skill en maakte de foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Een geplande prompt genereert elke ochtend één scèneafbeelding (weer, taken, datum, favoriete post of citaat) via een OpenClaw-persona.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic-beschikbaarheidschecker plus boekings-CLI. Mis nooit meer een vrije baan.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Verzamelt pdf's uit e-mail en bereidt documenten voor een belastingadviseur voor. Maandelijkse boekhouding op autopilot.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Bouwde een volledige persoonlijke site opnieuw via Telegram terwijl hij Netflix keek — van Notion naar Astro, 18 posts gemigreerd, DNS naar Cloudflare. Nooit een laptop geopend.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Doorzoekt vacatures, matcht ze met CV-trefwoorden en retourneert relevante kansen met links. Gebouwd in 30 minuten met de JSearch-API.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw maakte verbinding met Jira en genereerde vervolgens direct een nieuwe Skill (voordat die op ClawHub bestond).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatiseerde Todoist-taken en liet OpenClaw de Skill rechtstreeks in Telegram-chat genereren.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Logt in bij TradingView via browserautomatisering, maakt screenshots van grafieken en voert op verzoek technische analyse uit. Geen API nodig — alleen browserbesturing.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Volgt een bedrijfs-Slack-kanaal, reageert behulpzaam en stuurt meldingen door naar Telegram. Loste autonoom een productiefout in een uitgerolde app op zonder dat daarom werd gevraagd.
</Card>

</CardGroup>

## Kennis en geheugen

Systemen die persoonlijke of teamkennis indexeren, doorzoeken, onthouden en erover redeneren.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Chinese leerengine met uitspraakfeedback en studieflows via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Neemt volledige WhatsApp-exports op, transcribeert meer dan 1.000 spraakberichten, controleert ze kruislings met git-logs en produceert gekoppelde Markdown-rapporten.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Voegt vectorzoekfunctie toe aan Karakeep-bladwijzers met Qdrant plus OpenAI- of Ollama-embeddings.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Afzonderlijke geheugenmanager die sessiebestanden omzet in herinneringen, daarna in overtuigingen en vervolgens in een evoluerend zelfmodel.
</Card>

</CardGroup>

## Spraak en telefoon

Speech-first ingangspunten, telefoonbruggen en transcriptie-intensieve workflows.

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi-spraakassistent naar OpenClaw HTTP-brug. Bijna realtime telefoongesprekken met je agent.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Meertalige audiotranscriptie via OpenRouter (Gemini en meer). Beschikbaar op ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Infrastructuur en deployment

Packaging, deployment en integraties die OpenClaw makkelijker te draaien en uit te breiden maken.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw-Gateway draait op Home Assistant OS met SSH-tunnelondersteuning en persistente state.
</Card>

<Card title="Home Assistant-vaardigheid" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Bedien en automatiseer Home Assistant-apparaten via natuurlijke taal.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant-vaardigheid op ClawHub" />
</Card>

<Card title="Nix-verpakking" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Complete genixificeerde OpenClaw-configuratie voor reproduceerbare deployments.
</Card>

<Card title="CalDAV-agenda" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Agenda-vaardigheid met khal en vdirsyncer. Zelfgehoste agenda-integratie.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV-agendavaardigheid op ClawHub" />
</Card>

</CardGroup>

## Huis en hardware

De fysieke kant van OpenClaw: huizen, sensoren, camera's, stofzuigers en andere apparaten.

<CardGroup cols={2}>

<Card title="GoHome-automatisering" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Nix-native huisautomatisering met OpenClaw als interface, plus Grafana-dashboards.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana-dashboard" />
</Card>

<Card title="Roborock-stofzuiger" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Bedien je Roborock-robotstofzuiger via een natuurlijk gesprek.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock-status" />
</Card>

</CardGroup>

## Communityprojecten

Dingen die uitgroeiden van één workflow tot bredere producten of ecosystemen.

<CardGroup cols={2}>

<Card title="StarSwap-marktplaats" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Volwaardige marktplaats voor astronomie-apparatuur. Gebouwd met en rond het OpenClaw-ecosysteem.
</Card>

</CardGroup>

## Dien je project in

<Steps>
  <Step title="Deel het">
    Plaats een bericht in [#self-promotion op Discord](https://discord.gg/clawd) of [tweet @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Voeg details toe">
    Vertel ons wat het doet, link naar de repo of demo, en deel een screenshot als je die hebt.
  </Step>
  <Step title="Word uitgelicht">
    We voegen opvallende projecten toe aan deze pagina.
  </Step>
</Steps>

## Gerelateerd

- [Aan de slag](/nl/start/getting-started)
- [OpenClaw](/nl/start/openclaw)
