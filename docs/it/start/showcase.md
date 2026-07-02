---
description: Real-world OpenClaw projects from the community
read_when:
    - Cerchi esempi reali di utilizzo di OpenClaw
    - Aggiornamento dei progetti in evidenza della community
summary: Progetti e integrazioni creati dalla community e basati su OpenClaw
title: Vetrina
x-i18n:
    generated_at: "2026-07-02T08:26:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

I progetti OpenClaw non sono demo giocattolo. Le persone stanno distribuendo cicli di revisione PR, app mobili, automazione domestica, sistemi vocali, devtools e workflow ad alta intensità di memoria dai canali che già usano — build native per chat su Telegram, WhatsApp, Discord e terminali; automazione reale per prenotazioni, acquisti e supporto senza aspettare un'API; e integrazioni con il mondo fisico tramite stampanti, aspirapolvere, fotocamere e sistemi domestici.

<Info>
**Vuoi essere messo in evidenza?** Condividi il tuo progetto in [#self-promotion su Discord](https://discord.gg/clawd) o [tagga @openclaw su X](https://x.com/openclaw).
</Info>

## Novità da Discord

Esempi recenti in evidenza tra coding, devtools, mobile e creazione di prodotti nativi per chat.

<CardGroup cols={2}>

<Card title="Revisione PR con feedback su Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode completa la modifica, apre una PR, OpenClaw revisiona il diff e risponde su Telegram con suggerimenti e un verdetto chiaro sulla fusione.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Feedback di revisione PR OpenClaw consegnato su Telegram" />
</Card>

<Card title="Skill per cantina vini in pochi minuti" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Ha chiesto a "Robby" (@openclaw) una skill locale per cantina vini. Richiede un'esportazione CSV di esempio e un percorso di archiviazione, poi crea e testa la skill (962 bottiglie nell'esempio).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw crea una skill locale per cantina vini da CSV" />
</Card>

<Card title="Pilota automatico per la spesa Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Piano pasti settimanale, prodotti abituali, prenotazione dello slot di consegna, conferma dell'ordine. Nessuna API, solo controllo del browser.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automazione della spesa Tesco tramite chat" />
</Card>

<Card title="SNAG da screenshot a Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Scorciatoia per una regione dello schermo, visione Gemini, Markdown immediato negli appunti.

  <img src="/assets/showcase/snag.png" alt="Strumento SNAG da screenshot a markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App desktop per gestire skill e comandi tra Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="App Agents UI" />
</Card>

<Card title="Note vocali Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Avvolge il TTS di papla.media e invia i risultati come note vocali Telegram (niente fastidiosa riproduzione automatica).

  <img src="/assets/showcase/papla-tts.jpg" alt="Output di nota vocale Telegram da TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper installato con Homebrew per elencare, ispezionare e monitorare le sessioni locali di OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor su ClawHub" />
</Card>

<Card title="Controllo stampante 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controlla e risolvi problemi delle stampanti BambuLab: stato, lavori, fotocamera, AMS, calibrazione e altro.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI su ClawHub" />
</Card>

<Card title="Trasporti di Vienna (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partenze in tempo reale, interruzioni, stato degli ascensori e percorsi per il trasporto pubblico di Vienna.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien su ClawHub" />
</Card>

<Card title="Pasti scolastici ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Prenotazione automatizzata dei pasti scolastici nel Regno Unito tramite ParentPay. Usa coordinate del mouse per clic affidabili sulle celle della tabella.
</Card>

<Card title="Caricamento R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Carica su Cloudflare R2/S3 e genera link di download presigned sicuri. Utile per istanze OpenClaw remote.

  <img src="/assets/showcase/r2-upload.png" alt="Skill di caricamento R2 su ClawHub" />
</Card>

<Card title="App iOS tramite Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Ha creato un'app iOS completa con mappe e registrazione vocale, preparata per la distribuzione su App Store interamente tramite chat Telegram.
</Card>

<Card title="Assistente salute Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistente personale AI per la salute che integra i dati dell'anello Oura con calendario, appuntamenti e programma della palestra.

  <img src="/assets/showcase/oura-health.png" alt="Assistente salute Oura Ring" />
</Card>

<Card title="Kev's Dream Team (14+ agenti)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ agenti sotto un unico Gateway con un orchestratore Opus 4.5 che delega ai worker Codex. Vedi la [guida tecnica](https://github.com/adam91holt/orchestrated-ai-articles) e [Clawdspace](https://github.com/adam91holt/clawdspace) per il sandboxing degli agenti.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI per Linear che si integra con workflow agentici (Claude Code, OpenClaw). Gestisci issue, progetti e workflow dal terminale.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Leggi, invia e archivia messaggi tramite Beeper Desktop. Usa l'API MCP locale di Beeper così gli agenti possono gestire tutte le tue chat (iMessage, WhatsApp e altro) in un unico posto.
</Card>

</CardGroup>

## Automazione e workflow

Pianificazione, controllo del browser, cicli di supporto e il lato "fai semplicemente questa attività per me" del prodotto.

<CardGroup cols={2}>

<Card title="Controllo purificatore d'aria Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ha scoperto e confermato i controlli del purificatore, poi OpenClaw subentra per gestire la qualità dell'aria nella stanza.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Controllo del purificatore d'aria Winix tramite OpenClaw" />
</Card>

<Card title="Belle foto del cielo dalla fotocamera" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Attivato da una fotocamera sul tetto: chiedi a OpenClaw di scattare una foto del cielo ogni volta che sembra bello. Ha progettato una skill e ha scattato la foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Istantanea del cielo dalla fotocamera sul tetto catturata da OpenClaw" />
</Card>

<Card title="Scena visiva per briefing mattutino" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Un prompt pianificato genera ogni mattina un'immagine di scena (meteo, attività, data, post o citazione preferita) tramite una persona OpenClaw.
</Card>

<Card title="Prenotazione campo da padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Controllo disponibilità Playtomic più CLI di prenotazione. Non perdere mai più un campo disponibile.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Screenshot di padel-cli" />
</Card>

<Card title="Acquisizione documenti contabili" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Raccoglie PDF dall'email, prepara documenti per un consulente fiscale. Contabilità mensile con il pilota automatico.
</Card>

<Card title="Modalità sviluppo dal divano" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Ha ricostruito un intero sito personale tramite Telegram mentre guardava Netflix — da Notion ad Astro, 18 post migrati, DNS su Cloudflare. Non ha mai aperto un laptop.
</Card>

<Card title="Agente per ricerca lavoro" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Cerca annunci di lavoro, li confronta con le parole chiave del CV e restituisce opportunità pertinenti con link. Creato in 30 minuti usando l'API JSearch.
</Card>

<Card title="Builder di skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw si è connesso a Jira, poi ha generato al volo una nuova skill (prima che esistesse su ClawHub).
</Card>

<Card title="Skill Todoist tramite Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Ha automatizzato le attività Todoist e fatto generare la skill a OpenClaw direttamente nella chat Telegram.
</Card>

<Card title="Analisi TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Accede a TradingView tramite automazione del browser, acquisisce screenshot dei grafici ed esegue analisi tecnica su richiesta. Nessuna API necessaria — solo controllo del browser.
</Card>

<Card title="Supporto automatico Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitora un canale Slack aziendale, risponde in modo utile e inoltra notifiche a Telegram. Ha corretto autonomamente un bug di produzione in un'app distribuita senza che gli fosse chiesto.
</Card>

</CardGroup>

## Conoscenza e memoria

Sistemi che indicizzano, cercano, ricordano e ragionano su conoscenze personali o di team.

<CardGroup cols={2}>

<Card title="Apprendimento del cinese xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Motore di apprendimento del cinese con feedback sulla pronuncia e flussi di studio tramite OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Feedback sulla pronuncia xuezh" />
</Card>

<Card title="Cassaforte di memoria WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Importa esportazioni WhatsApp complete, trascrive oltre 1.000 note vocali, incrocia i dati con i log git, produce report markdown collegati.
</Card>

<Card title="Ricerca semantica Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Aggiunge ricerca vettoriale ai segnalibri Karakeep usando Qdrant più embedding OpenAI o Ollama.
</Card>

<Card title="Memoria Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Gestore di memoria separato che trasforma i file di sessione in ricordi, poi in convinzioni, poi in un modello di sé in evoluzione.
</Card>

</CardGroup>

## Voce e telefono

Punti di ingresso voice-first, bridge telefonici e workflow ad alta intensità di trascrizione.

<CardGroup cols={2}>

<Card title="Bridge telefonico Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Bridge dall'assistente vocale Vapi a OpenClaw HTTP. Telefonate quasi in tempo reale con il tuo agente.
</Card>

<Card title="Trascrizione OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Trascrizione audio multilingue tramite OpenRouter (Gemini e altro). Disponibile su ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill di trascrizione OpenRouter su ClawHub" />
</Card>

</CardGroup>

## Infrastruttura e distribuzione

Packaging, distribuzione e integrazioni che rendono OpenClaw più facile da eseguire ed estendere.

<CardGroup cols={2}>

<Card title="Add-on Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw in esecuzione su Home Assistant OS con supporto per tunnel SSH e stato persistente.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Controlla e automatizza i dispositivi Home Assistant tramite linguaggio naturale.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configurazione OpenClaw nixificata, pronta all'uso, per distribuzioni riproducibili.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill calendario che usa khal e vdirsyncer. Integrazione con calendari self-hosted.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## Casa e hardware

Il lato fisico di OpenClaw: case, sensori, videocamere, aspirapolvere e altri dispositivi.

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automazione domestica nativa per Nix con OpenClaw come interfaccia, più dashboard Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Controlla il tuo aspirapolvere robot Roborock tramite conversazione naturale.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Progetti della community

Cose che sono cresciute oltre un singolo flusso di lavoro fino a diventare prodotti o ecosistemi più ampi.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Comunità** • `marketplace` `astronomy` `webapp`

Marketplace completo per attrezzatura astronomica. Creato con e intorno all'ecosistema OpenClaw.
</Card>

</CardGroup>

## Invia il tuo progetto

<Steps>
  <Step title="Share it">
    Pubblica in [#self-promotion su Discord](https://discord.gg/clawd) o [twitta @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    Dicci cosa fa, aggiungi un link al repository o alla demo e condividi uno screenshot se ne hai uno.
  </Step>
  <Step title="Get featured">
    Aggiungeremo i progetti più notevoli a questa pagina.
  </Step>
</Steps>

## Correlati

- [Per iniziare](/it/start/getting-started)
- [OpenClaw](/it/start/openclaw)
