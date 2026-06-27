---
description: Real-world OpenClaw projects from the community
read_when:
    - Op zoek naar echte gebruiksvoorbeelden van OpenClaw
    - Hoogtepunten van communityprojecten bijwerken
summary: Door de community gemaakte projecten en integraties, mogelijk gemaakt door OpenClaw
title: Uitgelicht
x-i18n:
    generated_at: "2026-06-27T18:22:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw-projecten zijn geen speelse demo's. Mensen leveren PR-reviewloops, mobiele apps, domotica, spraaksystemen, devtools en geheugenzware workflows vanuit de kanalen die ze al gebruiken — chat-native builds op Telegram, WhatsApp, Discord en terminals; echte automatisering voor boekingen, winkelen en support zonder op een API te wachten; en integraties met de fysieke wereld via printers, stofzuigers, camera's en thuissystemen.

<Info>
**Wil je worden uitgelicht?** Deel je project in [#self-promotion op Discord](https://discord.gg/clawd) of [tag @openclaw op X](https://x.com/openclaw).
</Info>

## Vers van Discord

Recente uitschieters in programmeren, devtools, mobiele en chat-native productontwikkeling.

<CardGroup cols={2}>

<Card title="PR-review naar Telegram-feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode rondt de wijziging af, opent een PR, OpenClaw beoordeelt de diff en antwoordt in Telegram met suggesties plus een duidelijk merge-oordeel.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR-reviewfeedback geleverd in Telegram" />
</Card>

<Card title="Wijnkelder-Skill in minuten" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Vroeg "Robby" (@openclaw) om een lokale wijnkelder-Skill. Die vraagt om een voorbeeld-CSV-export en een opslagpad, en bouwt en test daarna de skill (962 flessen in het voorbeeld).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw bouwt een lokale wijnkelder-Skill vanuit CSV" />
</Card>

<Card title="Tesco Shop-autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Wekelijks maaltijdplan, vaste boodschappen, bezorgmoment boeken, bestelling bevestigen. Geen API's, alleen browserbesturing.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco Shop-automatisering via chat" />
</Card>

<Card title="SNAG screenshot-naar-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Sneltoets voor een schermgebied, Gemini Vision, direct Markdown op je klembord.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-naar-Markdown-tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Desktop-app om Skills en opdrachten te beheren in Agents, Claude, Codex en OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI-app" />
</Card>

<Card title="Telegram-spraakberichten (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Verpakt papla.media TTS en stuurt resultaten als Telegram-spraakberichten (geen irritante autoplay).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram-spraakberichtoutput van TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Via Homebrew geïnstalleerde helper om lokale OpenAI Codex-sessies te tonen, inspecteren en volgen (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor op ClawHub" />
</Card>

<Card title="Bambu 3D-printerbesturing" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab-printers besturen en problemen oplossen: status, taken, camera, AMS, kalibratie en meer.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI-Skill op ClawHub" />
</Card>

<Card title="Vervoer in Wenen (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Realtime vertrektijden, storingen, liftstatus en routes voor het openbaar vervoer in Wenen.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien-Skill op ClawHub" />
</Card>

<Card title="ParentPay-schoolmaaltijden" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Geautomatiseerde boeking van schoolmaaltijden in het VK via ParentPay. Gebruikt muiscoördinaten om betrouwbaar op tabelcellen te klikken.
</Card>

<Card title="R2-upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Upload naar Cloudflare R2/S3 en genereer veilige vooraf ondertekende downloadlinks. Handig voor externe OpenClaw-instanties.

  <img src="/assets/showcase/r2-upload.png" alt="R2-upload-Skill op ClawHub" />
</Card>

<Card title="iOS-app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Bouwde een complete iOS-app met kaarten en spraakopname, volledig via Telegram-chat uitgerold naar TestFlight.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS-app op TestFlight" />
</Card>

<Card title="Oura Ring-gezondheidsassistent" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Persoonlijke AI-gezondheidsassistent die Oura Ring-gegevens integreert met agenda, afspraken en sportschoolschema.

  <img src="/assets/showcase/oura-health.png" alt="Oura Ring-gezondheidsassistent" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ agents onder één Gateway met een Opus 4.5-orchestrator die aan Codex-workers delegeert. Zie de [technische write-up](https://github.com/adam91holt/orchestrated-ai-articles) en [Clawdspace](https://github.com/adam91holt/clawdspace) voor agentsandboxing.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI voor Linear die integreert met agentische workflows (Claude Code, OpenClaw). Beheer issues, projecten en workflows vanuit de terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lees, verstuur en archiveer berichten via Beeper Desktop. Gebruikt de lokale Beeper MCP API zodat agents al je chats (iMessage, WhatsApp en meer) op één plek kunnen beheren.
</Card>

</CardGroup>

## Automatisering en workflows

Planning, browserbesturing, supportloops en de "doe de taak gewoon voor mij"-kant van het product.

<CardGroup cols={2}>

<Card title="Besturing van Winix-luchtreiniger" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ontdekte en bevestigde de bediening van de luchtreiniger, waarna OpenClaw het overneemt om de luchtkwaliteit in de kamer te beheren.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Besturing van Winix-luchtreiniger via OpenClaw" />
</Card>

<Card title="Mooie-luchtcamerabeelden" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Geactiveerd door een dakcamera: vraag OpenClaw om een luchtfoto te maken wanneer het er mooi uitziet. Het ontwierp een skill en maakte de opname.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Luchtmomentopname van dakcamera vastgelegd door OpenClaw" />
</Card>

<Card title="Visuele ochtendbriefingscene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Een geplande prompt genereert elke ochtend één scenebeeld (weer, taken, datum, favoriete post of quote) via een OpenClaw-persona.
</Card>

<Card title="Padelbaan boeken" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic-beschikbaarheidschecker plus boekings-CLI. Mis nooit meer een vrije baan.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli-screenshot" />
</Card>

<Card title="Boekhoudkundige intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Verzamelt PDF's uit e-mail en bereidt documenten voor een belastingadviseur voor. Maandelijkse boekhouding op autopilot.
</Card>

<Card title="Bankhang-devmodus" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Bouwde een volledige persoonlijke site opnieuw via Telegram terwijl hij Netflix keek — van Notion naar Astro, 18 posts gemigreerd, DNS naar Cloudflare. Nooit een laptop geopend.
</Card>

<Card title="Vacaturezoekagent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Doorzoekt vacatures, matcht tegen cv-trefwoorden en geeft relevante kansen met links terug. Gebouwd in 30 minuten met de JSearch API.
</Card>

<Card title="Jira-Skillbouwer" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw maakte verbinding met Jira en genereerde daarna direct een nieuwe skill (voordat die op ClawHub bestond).
</Card>

<Card title="Todoist-Skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatiseerde Todoist-taken en liet OpenClaw de skill rechtstreeks in Telegram-chat genereren.
</Card>

<Card title="TradingView-analyse" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Logt in op TradingView via browserautomatisering, maakt screenshots van grafieken en voert technische analyse op aanvraag uit. Geen API nodig — alleen browserbesturing.
</Card>

<Card title="Slack-auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Volgt een bedrijfs-Slack-kanaal, reageert behulpzaam en stuurt meldingen door naar Telegram. Loste autonoom een productiefout op in een uitgerolde app zonder dat erom werd gevraagd.
</Card>

</CardGroup>

## Kennis en geheugen

Systemen die persoonlijke of teamkennis indexeren, doorzoeken, onthouden en erover redeneren.

<CardGroup cols={2}>

<Card title="xuezh Chinees leren" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Chinese leermachine met uitspraakfeedback en studieflows via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh-uitspraakfeedback" />
</Card>

<Card title="WhatsApp-geheugenkluis" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Neemt volledige WhatsApp-exports op, transcribeert 1k+ spraakberichten, controleert met git-logs en produceert gekoppelde Markdown-rapporten.
</Card>

<Card title="Karakeep semantische zoekfunctie" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Voegt vectorzoekfunctie toe aan Karakeep-bladwijzers met Qdrant plus OpenAI- of Ollama-embeddings.
</Card>

<Card title="Inside-Out-2-geheugen" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Afzonderlijke geheugenmanager die sessiebestanden omzet in herinneringen, daarna in overtuigingen en vervolgens in een evoluerend zelfmodel.
</Card>

</CardGroup>

## Spraak en telefoon

Spraakgerichte ingangspunten, telefoonbruggen en transcriptiezware workflows.

<CardGroup cols={2}>

<Card title="Clawdia-telefoonbrug" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi-spraakassistent naar OpenClaw HTTP-brug. Bijna realtime telefoongesprekken met je agent.
</Card>

<Card title="OpenRouter-transcriptie" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Meertalige audiotranscriptie via OpenRouter (Gemini en meer). Beschikbaar op ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter-transcriptie-Skill op ClawHub" />
</Card>

</CardGroup>

## Infrastructuur en uitrol

Verpakking, uitrol en integraties die OpenClaw gemakkelijker maken om te draaien en uit te breiden.

<CardGroup cols={2}>

<Card title="Home Assistant-add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw gateway draaiend op Home Assistant OS met ondersteuning voor SSH-tunnels en persistente status.
</Card>

<Card title="Home Assistant-skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Bedien en automatiseer Home Assistant-apparaten via natuurlijke taal.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant-skill op ClawHub" />
</Card>

<Card title="Nix-packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Volledig uitgeruste genixificeerde OpenClaw-configuratie voor reproduceerbare deployments.
</Card>

<Card title="CalDAV-agenda" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Agendaskill met khal en vdirsyncer. Zelfgehoste agenda-integratie.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV-agendaskill op ClawHub" />
</Card>

</CardGroup>

## Huis en hardware

De fysieke kant van OpenClaw: huizen, sensoren, camera's, stofzuigers en andere apparaten.

<CardGroup cols={2}>

<Card title="GoHome-automatisering" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Nix-native woningautomatisering met OpenClaw als interface, plus Grafana-dashboards.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana-dashboard" />
</Card>

<Card title="Roborock-stofzuiger" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Bedien je Roborock-robotstofzuiger via een natuurlijk gesprek.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock-status" />
</Card>

</CardGroup>

## Communityprojecten

Dingen die verder groeiden dan één enkele workflow tot bredere producten of ecosystemen.

<CardGroup cols={2}>

<Card title="StarSwap-marktplaats" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Volledige marktplaats voor astronomieapparatuur. Gebouwd met en rond het OpenClaw-ecosysteem.
</Card>

</CardGroup>

## Dien je project in

<Steps>
  <Step title="Deel het">
    Plaats het in [#self-promotion op Discord](https://discord.gg/clawd) of [tweet @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Voeg details toe">
    Vertel ons wat het doet, link naar de repo of demo en deel een screenshot als je die hebt.
  </Step>
  <Step title="Word uitgelicht">
    We voegen opvallende projecten toe aan deze pagina.
  </Step>
</Steps>

## Gerelateerd

- [Aan de slag](/nl/start/getting-started)
- [OpenClaw](/nl/start/openclaw)
