---
description: Real-world OpenClaw projects from the community
read_when:
    - Op zoek naar praktijkvoorbeelden van het gebruik van OpenClaw
    - Hoogtepunten van communityprojecten bijwerken
summary: Door de community gebouwde projecten en integraties die worden aangedreven door OpenClaw
title: Uitgelicht
x-i18n:
    generated_at: "2026-07-12T09:26:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Door de community gebouwde OpenClaw-projecten: PR-beoordelingscycli, mobiele apps, huisautomatisering, spraaksystemen, ontwikkelaarstools en geheugenworkflows, chatgericht gebouwd voor Telegram, WhatsApp, Discord en terminals.

<Info>
**Wil je uitgelicht worden?** Deel je project in [#self-promotion op Discord](https://discord.gg/clawd) of [tag @openclaw op X](https://x.com/openclaw).
</Info>

## Vers van Discord

Recente uitschieters op het gebied van programmeren, ontwikkelaarstools, mobiel en het bouwen van chatgerichte producten.

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Zeg tegen je agent „implementeer deze HTML” en ontvang binnen ongeveer een seconde een openbare URL. Pagina's verlopen automatisch na een uur — geen server, geen configuratie, geen registratie.
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Plak een willekeurige URL en ontvang een oordeel. Meer dan 2,5 miljoen frauduleuze domeinen uit 38 feeds (PhishTank, OpenPhish, CERT.PL en meer), lokaal vergeleken zodat de browsegeschiedenis de machine nooit verlaat.
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Een drietal voor productwerk: [Socratische dialoog](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) onderwerpt een vraag aan een kritisch onderzoek voordat die wordt beantwoord, [Kano-modelstrateeg](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) deelt functies in op basis van welke hun plek verdienen en [Leesbare agentuitvoer](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) herschrijft agentuitvoer in duidelijke taal.
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Voorkomt dat orchestrators niets doen terwijl subagents werken: een asynchroon callbackmechanisme waarbij resultaten in een postvak terechtkomen in plaats van de bovenliggende agent te blokkeren.
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Houdt OpenClaw bruikbaar op machines met 2–4 GB: controleert het vrije geheugen en beperkt zware functies voordat de machine wisselgeheugen gaat gebruiken. [Bron op GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Tokenkostentracker van een NVIDIA-engineer met volwaardige ondersteuning voor OpenClaw: zie precies waar je agentuitgaven naartoe gaan, per model en per sessie.
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Beschrijf een diagram in de chat en ontvang een programmatisch gegenereerde Excalidraw-schets.
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

Liet OpenClaw zijn eigen querytool voor Google Analytics bouwen en verpakte en publiceerde die vervolgens op ClawHub.
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Benchmarkt modellen voor 59 agentrollen om de vraag „welke LLM voor mijn GPU?” te beantwoorden. Een favoriet binnen de community voor het kiezen van lokale modellen.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Provideronafhankelijke nummergeneratie: plan het nummer, structureer songteksten en verbeter summiere resultaten in plaats van één enkele prompt te gebruiken. Bevat een [MiniMax-variant](https://clawhub.ai/luischarro/music-craft-minimax) met controle over BPM, toonsoort, structuur en mash-ups.
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode voltooit de wijziging en opent een PR; OpenClaw beoordeelt de diff en reageert in Telegram met suggesties en een duidelijk oordeel over samenvoegen.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Vroeg „Robby” (@openclaw) om een lokale wijnkelder-Skill. Deze vraagt om een CSV-voorbeeldexport en een opslagpad en bouwt en test vervolgens de Skill (962 flessen in het voorbeeld).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Wekelijks maaltijdplan, vaste boodschappen, bezorgmoment reserveren, bestelling bevestigen. Geen API's, alleen browserbesturing.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Selecteer met een sneltoets een schermgebied, gebruik Gemini Vision en krijg direct Markdown op je klembord.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Desktop-app om Skills en opdrachten te beheren voor Agents, Claude, Codex en OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Verpakt TTS van papla.media en verzendt de resultaten als Telegram-spraakberichten (zonder hinderlijk automatisch afspelen).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Via Homebrew geïnstalleerd hulpprogramma om lokale OpenAI Codex-sessies weer te geven, te inspecteren en te volgen (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Bestuur BambuLab-printers en los problemen ermee op: status, taken, camera, AMS, kalibratie en meer.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Actuele vertrektijden, verstoringen, liftstatus en routeplanning voor het openbaar vervoer in Wenen.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Geautomatiseerde reservering van Britse schoolmaaltijden via ParentPay. Gebruikt muiscoördinaten om betrouwbaar op tabelcellen te klikken.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Upload naar Cloudflare R2/S3 en genereer veilige vooraf ondertekende downloadlinks. Nuttig voor externe OpenClaw-instanties.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Bouwde volledig via een Telegram-chat een complete iOS-app met kaarten en spraakopname, gereedgemaakt voor distributie in de App Store.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Persoonlijke AI-gezondheidsassistent die gegevens van de Oura Ring integreert met de agenda, afspraken en het sportschema.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Meer dan 14 agents onder één Gateway, met een Opus 4.5-orchestrator die taken delegeert aan Codex-workers. Bekijk de [technische toelichting](https://github.com/adam91holt/orchestrated-ai-articles) en [Clawdspace](https://github.com/adam91holt/clawdspace) voor sandboxing van agents.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI voor Linear die integreert met agentgerichte workflows (Claude Code, OpenClaw). Beheer issues, projecten en workflows vanuit de terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lees, verzend en archiveer berichten via Beeper Desktop. Gebruikt de lokale MCP-API van Beeper, zodat agents al je chats (iMessage, WhatsApp en meer) op één plek kunnen beheren.
</Card>

</CardGroup>

## Automatisering en workflows

Planning, browserbesturing, ondersteuningscycli en de kant van het product die neerkomt op „voer de taak gewoon voor me uit”.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ontdekte en bevestigde de bedieningselementen van de luchtreiniger, waarna OpenClaw het beheer van de luchtkwaliteit in de kamer overneemt.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Geactiveerd door een dakcamera: vraag OpenClaw om een foto van de lucht te maken wanneer die er mooi uitziet. Het ontwierp een Skill en maakte de foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Een geplande prompt genereert elke ochtend via een OpenClaw-persona één scèneafbeelding (weer, taken, datum, favoriete publicatie of citaat).
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Beschikbaarheidscontrole voor Playtomic plus een CLI voor reserveringen. Mis nooit meer een vrije baan.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Verzamelt pdf's uit e-mail en bereidt documenten voor een belastingadviseur voor. Maandelijkse boekhouding op de automatische piloot.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Bouwde tijdens het kijken naar Netflix via Telegram een volledige persoonlijke website opnieuw — van Notion naar Astro, 18 berichten gemigreerd en DNS naar Cloudflare. Heeft geen laptop geopend.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Doorzoekt vacatures, vergelijkt ze met trefwoorden uit een cv en retourneert relevante mogelijkheden met links. In 30 minuten gebouwd met de JSearch-API.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw maakte verbinding met Jira en genereerde vervolgens direct een nieuwe skill (voordat die op ClawHub bestond).
</Card>

<Card title="Todoist-skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatiseerde Todoist-taken en liet OpenClaw de skill rechtstreeks in een Telegram-chat genereren.
</Card>

<Card title="TradingView-analyse" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Meldt zich via browserautomatisering aan bij TradingView, maakt schermafbeeldingen van grafieken en voert op verzoek technische analyses uit. Geen API nodig — alleen browserbesturing.
</Card>

<Card title="Auto-onderhandeling ($4.200 bespaard)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

Liet OpenClaw los op autodealers: het verzorgde de volledige onderhandeling en kreeg $4.200 van de prijs af.
</Card>

<Card title="Automatisch inchecken voor vluchten" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Vindt de eerstvolgende vlucht in e-mail, doorloopt het online incheckproces en kiest een stoel bij het raam — geen app van de luchtvaartmaatschappij nodig.
</Card>

<Card title="Verzekeringsclaim indienen" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Diende autonoom een verzekeringsclaim in en plande de vervolgafspraak.
</Card>

<Card title="Idealista-vastgoedskill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

Idealista API-CLI voor zoekopdrachten en waardebepalingen van vastgoed, verpakt als skill zodat de agent vanuit de chat naar woningen kan zoeken.
</Card>

<Card title="Backoffice voor hoveniersbedrijf" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Houdt Gmail in de gaten voor werkopdrachten, analyseert via Telegram verstuurde foto's van objecten, schrijft meerbladige offerte-pdf's in LaTeX en factureert via Xero.
</Card>

<Card title="Automatische ondersteuning via Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Houdt een Slack-kanaal van een bedrijf in de gaten, geeft behulpzame antwoorden en stuurt meldingen door naar Telegram. Loste autonoom en zonder opdracht een productiefout op in een geïmplementeerde app.
</Card>

</CardGroup>

## Kennis en geheugen

Systemen die persoonlijke kennis of teamkennis indexeren, doorzoeken, onthouden en beredeneren.

<CardGroup cols={2}>

<Card title="Chinees leren met xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Leersysteem voor Chinees met feedback op de uitspraak en leertrajecten via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Feedback van xuezh op de uitspraak" />
</Card>

<Card title="Analysepijplijn voor X-berichten" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Verzamelde 4 miljoen berichten van 100 toonaangevende X-accounts en verwerkte die tot een doorzoekbare analysepijplijn.
</Card>

<Card title="Laboratoriumuitslagen naar Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Ordende jaren aan laboratoriumuitslagen van bloedonderzoek in een gestructureerde Notion-database.
</Card>

<Card title="Obsidian als tweede brein" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Assistent voor dagelijks gebruik op WhatsApp, waarbij al het geheugen als Markdown wordt opgeslagen in een versiebeheerde Obsidian-kluis: calorieën en trainingen bijhouden, takenlijsten en persoonlijke administratie.
</Card>

<Card title="Bot voor familiegeschiedenis" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Neemt deel aan een Telegram-groepschat van een familie, documenteert verhalen van meer dan 50 familieleden en stelt goed geïnformeerde vervolgvragen — met antwoorden in het Nepalees voor moedertaalsprekers.
</Card>

<Card title="WhatsApp-geheugenkluis" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Verwerkt volledige WhatsApp-exports, transcribeert meer dan duizend spraakberichten, vergelijkt die met Git-logboeken en produceert onderling gekoppelde Markdown-rapporten.
</Card>

<Card title="Semantisch zoeken in Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Voegt vectorzoeken toe aan Karakeep-bladwijzers met Qdrant en embeddings van OpenAI of Ollama.
</Card>

<Card title="Inside-Out-2-geheugen" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Afzonderlijke geheugenbeheerder die sessiebestanden omzet in herinneringen, vervolgens in overtuigingen en daarna in een evoluerend zelfmodel.
</Card>

</CardGroup>

## Spraak en telefoon

Spraakgerichte toegangspunten, telefoonbruggen en workflows waarin transcriptie een belangrijke rol speelt.

<CardGroup cols={2}>

<Card title="Spraakbediening met één tik via Pebble Ring" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Eén tik op een Pebble Ring start een spraakgesprek met OpenClaw — toegang tot de agent vanaf een draagbaar apparaat.
</Card>

<Card title="Mediastudio voor makers" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Een volledige mediastudio in de chat: tekst-naar-spraak, transcriptie en browserautomatisering, gekoppeld aan Codex 5.2 en MiniMax.
</Card>

<Card title="Walkietalkie via de actieknop" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

De actieknop van de iPhone is gekoppeld aan OpenClaw: druk, praat en de agent praat terug als een walkietalkie.
</Card>

<Card title="Clawdia-telefoonbrug" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

HTTP-brug tussen de Vapi-spraakassistent en OpenClaw. Bijna realtime telefoongesprekken met je agent.
</Card>

<Card title="Transcriptie via OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Meertalige audiotranscriptie via OpenRouter (Gemini en meer). Beschikbaar op ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter-transcriptieskill op ClawHub" />
</Card>

</CardGroup>

## Infrastructuur en implementatie

Verpakking, implementatie en integraties die het eenvoudiger maken om OpenClaw uit te voeren en uit te breiden.

<CardGroup cols={2}>

<Card title="Home Assistant-add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw Gateway die draait op Home Assistant OS, met ondersteuning voor SSH-tunnels en permanente statusopslag.
</Card>

<Card title="Home Assistant-skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Bestuur en automatiseer Home Assistant-apparaten via natuurlijke taal.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant-skill op ClawHub" />
</Card>

<Card title="Menubalkbeheerder voor macOS" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Systeemeigen Swift-menubalkapp die de agentstatus toont en snelle bediening biedt.
</Card>

<Card title="Nix-verpakking" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Complete, met Nix opgebouwde OpenClaw-configuratie voor reproduceerbare implementaties.
</Card>

<Card title="CalDAV-agenda" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Agendaskill die khal en vdirsyncer gebruikt. Zelfgehoste agenda-integratie.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV-agendaskill op ClawHub" />
</Card>

</CardGroup>

## Huis en hardware

De fysieke kant van OpenClaw: woningen, sensoren, camera's, stofzuigers en andere apparaten.

<CardGroup cols={2}>

<Card title="Zelfgebouwde HomePod-skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw vond de HomePods op het lokale netwerk en schreef zelf een skill om ze te bedienen.
</Card>

<Card title="Holografische kubusinterface van $35" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Een goedkope holografische kubus als het fysieke gezicht van de agent op het bureau.
</Card>

<Card title="GoHome-automatisering" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Systeemeigen Nix-woningautomatisering met OpenClaw als interface, plus Grafana-dashboards.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana-dashboard" />
</Card>

<Card title="Roborock-stofzuiger" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Bedien je Roborock-robotstofzuiger via een gesprek in natuurlijke taal.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock-status" />
</Card>

</CardGroup>

## Communityprojecten

Projecten die uitgroeiden van één workflow tot bredere producten of ecosystemen.

<CardGroup cols={2}>

<Card title="StarSwap-marktplaats" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Volledige marktplaats voor astronomieapparatuur. Gebouwd met en rond het OpenClaw-ecosysteem.
</Card>

<Card title="Clinch-protocol voor onderhandelingen tussen agents" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Open onderhandelingen tussen agents: je agent onderhandelt met andere nodes over deals, planningen en dienstverleningsovereenkomsten en ondertekent het resultaat cryptografisch — jij hoeft het alleen goed te keuren of af te wijzen.
</Card>

</CardGroup>

## Dien je project in

<Steps>
  <Step title="Deel het">
    Plaats het in [#self-promotion op Discord](https://discord.gg/clawd) of [tweet naar @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Voeg details toe">
    Vertel ons wat het doet, voeg een koppeling naar de repository of demo toe en deel een schermafbeelding als je die hebt.
  </Step>
  <Step title="Word uitgelicht">
    We voegen opvallende projecten toe aan deze pagina.
  </Step>
</Steps>

## Gerelateerd

- [Aan de slag](/nl/start/getting-started)
- [OpenClaw](/nl/start/openclaw)
- [Volledig X-overzicht op openclaw.ai](https://openclaw.ai/showcase/)
