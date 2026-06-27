---
description: Real-world OpenClaw projects from the community
read_when:
    - Cerchi esempi reali di utilizzo di OpenClaw
    - Aggiornamento dei progetti in evidenza della community
summary: Progetti e integrazioni creati dalla community e basati su OpenClaw
title: Vetrina
x-i18n:
    generated_at: "2026-06-27T18:17:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

I progetti OpenClaw non sono demo giocattolo. Le persone stanno distribuendo loop di revisione PR, app mobili, automazione domestica, sistemi vocali, devtools e workflow ad alto uso di memoria dai canali che usano gia — build native per chat su Telegram, WhatsApp, Discord e terminali; automazione reale per prenotazioni, acquisti e supporto senza aspettare un'API; e integrazioni con il mondo fisico tramite stampanti, aspirapolvere, videocamere e sistemi domestici.

<Info>
**Vuoi essere messo in evidenza?** Condividi il tuo progetto in [#self-promotion su Discord](https://discord.gg/clawd) o [tagga @openclaw su X](https://x.com/openclaw).
</Info>

## Novita da Discord

Progetti recenti in evidenza tra coding, devtools, mobile e creazione di prodotti nativi per chat.

<CardGroup cols={2}>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode completa la modifica, apre una PR, OpenClaw revisiona il diff e risponde in Telegram con suggerimenti e un chiaro verdetto di merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Ha chiesto a "Robby" (@openclaw) una skill locale per la cantina dei vini. Richiede un export CSV di esempio e un percorso di archiviazione, poi crea e testa la skill (962 bottiglie nell'esempio).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Piano pasti settimanale, acquisti abituali, prenotazione dello slot di consegna, conferma dell'ordine. Nessuna API, solo controllo del browser.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Scorciatoia per una regione dello schermo, visione Gemini, Markdown immediato negli appunti.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App desktop per gestire skills e comandi tra Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Integra papla.media TTS e invia i risultati come note vocali Telegram (senza fastidioso autoplay).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper installato con Homebrew per elencare, ispezionare e monitorare sessioni locali di OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controlla e risolvi problemi delle stampanti BambuLab: stato, job, videocamera, AMS, calibrazione e altro.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partenze in tempo reale, disservizi, stato degli ascensori e routing per il trasporto pubblico di Vienna.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Prenotazione automatizzata dei pasti scolastici nel Regno Unito tramite ParentPay. Usa le coordinate del mouse per clic affidabili sulle celle delle tabelle.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Carica su Cloudflare R2/S3 e genera link di download presigned sicuri. Utile per istanze OpenClaw remote.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Ha creato un'app iOS completa con mappe e registrazione vocale, distribuita su TestFlight interamente via chat Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS app on TestFlight" />
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistente sanitario AI personale che integra i dati dell'anello Oura con calendario, appuntamenti e programma della palestra.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Oltre 14 agent sotto un unico gateway con un orchestratore Opus 4.5 che delega a worker Codex. Consulta l'[approfondimento tecnico](https://github.com/adam91holt/orchestrated-ai-articles) e [Clawdspace](https://github.com/adam91holt/clawdspace) per il sandboxing degli agent.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI per Linear che si integra con workflow agentici (Claude Code, OpenClaw). Gestisci issue, progetti e workflow dal terminale.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Leggi, invia e archivia messaggi tramite Beeper Desktop. Usa l'API MCP locale di Beeper cosi gli agent possono gestire tutte le tue chat (iMessage, WhatsApp e altro) in un unico posto.
</Card>

</CardGroup>

## Automazione e workflow

Pianificazione, controllo del browser, loop di supporto e il lato "fai semplicemente il task per me" del prodotto.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ha scoperto e confermato i controlli del purificatore, poi OpenClaw subentra per gestire la qualita dell'aria della stanza.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Attivato da una videocamera sul tetto: chiedi a OpenClaw di scattare una foto del cielo ogni volta che sembra bello. Ha progettato una skill e ha scattato la foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Un prompt pianificato genera ogni mattina un'immagine di scena (meteo, task, data, post o citazione preferiti) tramite una persona OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Controllo disponibilita Playtomic piu CLI di prenotazione. Non perdere mai piu un campo libero.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Raccoglie PDF dalle email, prepara documenti per un consulente fiscale. Contabilita mensile in autopilot.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Ha ricostruito un intero sito personale via Telegram mentre guardava Netflix — da Notion ad Astro, 18 post migrati, DNS su Cloudflare. Non ha mai aperto un laptop.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Cerca annunci di lavoro, li confronta con le parole chiave del CV e restituisce opportunita pertinenti con link. Creato in 30 minuti usando l'API JSearch.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw si e connesso a Jira, poi ha generato al volo una nuova skill (prima che esistesse su ClawHub).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Ha automatizzato i task Todoist e fatto generare a OpenClaw la skill direttamente nella chat Telegram.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Accede a TradingView tramite automazione del browser, cattura screenshot dei grafici ed esegue analisi tecnica su richiesta. Nessuna API necessaria — solo controllo del browser.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitora un canale Slack aziendale, risponde in modo utile e inoltra notifiche a Telegram. Ha corretto autonomamente un bug di produzione in un'app distribuita senza che gli venisse chiesto.
</Card>

</CardGroup>

## Conoscenza e memoria

Sistemi che indicizzano, cercano, ricordano e ragionano su conoscenza personale o di team.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Motore di apprendimento del cinese con feedback sulla pronuncia e flussi di studio tramite OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Ingerisce export WhatsApp completi, trascrive oltre 1.000 note vocali, effettua controlli incrociati con i log git e produce report Markdown collegati.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Aggiunge ricerca vettoriale ai segnalibri Karakeep usando Qdrant piu embedding OpenAI o Ollama.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Gestore di memoria separato che trasforma i file di sessione in ricordi, poi in convinzioni, poi in un modello di se in evoluzione.
</Card>

</CardGroup>

## Voce e telefono

Punti di ingresso speech-first, bridge telefonici e workflow ad alta intensita di trascrizione.

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Assistente vocale Vapi verso bridge HTTP OpenClaw. Chiamate telefoniche quasi in tempo reale con il tuo agent.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Trascrizione audio multilingue tramite OpenRouter (Gemini e altro). Disponibile su ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Infrastruttura e distribuzione

Packaging, distribuzione e integrazioni che rendono OpenClaw piu facile da eseguire ed estendere.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw gateway in esecuzione su Home Assistant OS con supporto per tunnel SSH e stato persistente.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Controlla e automatizza dispositivi Home Assistant tramite linguaggio naturale.

  <img src="/assets/showcase/homeassistant.png" alt="Skill Home Assistant su ClawHub" />
</Card>

<Card title="Packaging Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configurazione OpenClaw nixified con tutto incluso per deployment riproducibili.
</Card>

<Card title="Calendario CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill di calendario che usa khal e vdirsyncer. Integrazione con calendario self-hosted.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill calendario CalDAV su ClawHub" />
</Card>

</CardGroup>

## Casa e hardware

Il lato fisico di OpenClaw: case, sensori, videocamere, aspirapolvere e altri dispositivi.

<CardGroup cols={2}>

<Card title="Automazione GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automazione domestica Nix-native con OpenClaw come interfaccia, più dashboard Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Dashboard Grafana GoHome" />
</Card>

<Card title="Aspirapolvere Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Controlla il tuo robot aspirapolvere Roborock tramite conversazione naturale.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Stato Roborock" />
</Card>

</CardGroup>

## Progetti della community

Cose che sono cresciute oltre un singolo workflow fino a diventare prodotti o ecosistemi più ampi.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Marketplace completo per attrezzatura astronomica. Creato con e attorno all'ecosistema OpenClaw.
</Card>

</CardGroup>

## Invia il tuo progetto

<Steps>
  <Step title="Condividilo">
    Pubblica in [#self-promotion su Discord](https://discord.gg/clawd) o [tweet @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Includi dettagli">
    Dicci cosa fa, aggiungi un link al repository o alla demo e condividi uno screenshot se ne hai uno.
  </Step>
  <Step title="Fatti mettere in evidenza">
    Aggiungeremo i progetti migliori a questa pagina.
  </Step>
</Steps>

## Correlati

- [Primi passi](/it/start/getting-started)
- [OpenClaw](/it/start/openclaw)
