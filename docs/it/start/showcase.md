---
description: Real-world OpenClaw projects from the community
read_when:
    - Alla ricerca di esempi reali di utilizzo di OpenClaw
    - Aggiornamento dei progetti in evidenza della community
summary: Progetti e integrazioni realizzati dalla community e basati su OpenClaw
title: Vetrina
x-i18n:
    generated_at: "2026-07-12T07:34:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Progetti OpenClaw creati dalla community: cicli di revisione delle PR, app mobili, domotica, sistemi vocali, strumenti di sviluppo e flussi di lavoro per la memoria, realizzati in modo nativo per la chat su Telegram, WhatsApp, Discord e terminali.

<Info>
**Vuoi essere incluso?** Condividi il tuo progetto in [#self-promotion su Discord](https://discord.gg/clawd) oppure [tagga @openclaw su X](https://x.com/openclaw).
</Info>

## Novità da Discord

Progetti recenti di spicco nella programmazione, negli strumenti di sviluppo, nelle app mobili e nella creazione di prodotti nativi per la chat.

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Di' al tuo agente "distribuisci questo HTML" e ricevi un URL pubblico in circa un secondo. Le pagine scadono automaticamente dopo un'ora: nessun server, nessuna configurazione, nessuna registrazione.
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Incolla un URL qualsiasi e ottieni un verdetto. Oltre 2,5 milioni di domini fraudolenti provenienti da 38 fonti (PhishTank, OpenPhish, CERT.PL e altre), confrontati localmente affinché la cronologia di navigazione non lasci mai il dispositivo.
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Un trio per il lavoro sui prodotti: [Dialogo socratico](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) esamina criticamente una domanda prima di rispondere, [Stratega del modello Kano](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) classifica le funzionalità in base a quelle che meritano il proprio posto e [Output leggibile dell'agente](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) riscrive l'output dell'agente in un linguaggio semplice.
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Impedisce agli orchestratori di rimanere inattivi mentre i sottoagenti lavorano: un meccanismo di callback asincrono in cui i risultati vengono depositati in una casella di posta anziché bloccare l'agente principale.
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

Mantiene OpenClaw utilizzabile su dispositivi con 2-4 GB di memoria: controlla la memoria libera e riduce le funzionalità più pesanti prima che il sistema inizi a usare lo swap. [Codice sorgente su GitHub](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Strumento di monitoraggio dei costi dei token creato da un ingegnere NVIDIA, con supporto completo per OpenClaw: mostra esattamente dove confluisce la spesa del tuo agente, per modello e per sessione.
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Descrivi un diagramma in chat e ricevi uno schizzo Excalidraw generato mediante codice.
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

Ha fatto creare a OpenClaw il proprio strumento di interrogazione di Google Analytics, quindi lo ha impacchettato e pubblicato su ClawHub.
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

Confronta i modelli in 59 ruoli per agenti per rispondere alla domanda "quale LLM usare per la mia GPU?". Uno dei preferiti della community per scegliere modelli locali.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Generazione di brani indipendente dal provider: pianifica il brano, struttura il testo e rielabora i risultati incompleti invece di affidarsi a un unico prompt. Include una [variante MiniMax](https://clawhub.ai/luischarro/music-craft-minimax) con controllo di BPM, tonalità, struttura e mashup.
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode completa la modifica e apre una PR; OpenClaw esamina le differenze e risponde su Telegram con suggerimenti e un chiaro verdetto sull'unione.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Ha chiesto a "Robby" (@openclaw) una skill locale per la cantina dei vini. Richiede un'esportazione CSV di esempio e un percorso di archiviazione, quindi crea e verifica la skill (962 bottiglie nell'esempio).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Piano settimanale dei pasti, prodotti abituali, prenotazione della fascia di consegna e conferma dell'ordine. Nessuna API, solo controllo del browser.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Seleziona una regione dello schermo con una scorciatoia, la analizza con la visione di Gemini e inserisce immediatamente il Markdown negli appunti.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App desktop per gestire Skills e comandi tra Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Integra la sintesi vocale di papla.media e invia i risultati come messaggi vocali di Telegram, senza fastidiosa riproduzione automatica.

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Strumento di supporto installato tramite Homebrew per elencare, esaminare e monitorare le sessioni locali di OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controlla e risolvi i problemi delle stampanti BambuLab: stato, processi, fotocamera, AMS, calibrazione e altro ancora.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partenze in tempo reale, interruzioni, stato degli ascensori e pianificazione degli itinerari per il trasporto pubblico di Vienna.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Prenotazione automatizzata dei pasti scolastici nel Regno Unito tramite ParentPay. Utilizza le coordinate del mouse per fare clic in modo affidabile sulle celle della tabella.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Carica file su Cloudflare R2/S3 e genera collegamenti di download prefirmati e sicuri. Utile per le istanze OpenClaw remote.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Ha creato un'app iOS completa con mappe e registrazione vocale, preparata per la distribuzione sull'App Store interamente tramite una chat di Telegram.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistente sanitario personale basato sull'IA che integra i dati dell'anello Oura con calendario, appuntamenti e programma della palestra.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Oltre 14 agenti sotto un unico Gateway, con un orchestratore Opus 4.5 che delega il lavoro ad agenti Codex. Consulta l'[approfondimento tecnico](https://github.com/adam91holt/orchestrated-ai-articles) e [Clawdspace](https://github.com/adam91holt/clawdspace) per l'isolamento degli agenti.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI per Linear che si integra con i flussi di lavoro basati su agenti (Claude Code, OpenClaw). Gestisci segnalazioni, progetti e flussi di lavoro dal terminale.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Legge, invia e archivia messaggi tramite Beeper Desktop. Utilizza l'API MCP locale di Beeper affinché gli agenti possano gestire tutte le tue chat (iMessage, WhatsApp e altre) in un unico posto.
</Card>

</CardGroup>

## Automazione e flussi di lavoro

Pianificazione, controllo del browser, cicli di assistenza e l'aspetto del prodotto dedicato al "fai semplicemente il lavoro al posto mio".

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ha individuato e confermato i controlli del purificatore; OpenClaw interviene quindi per gestire la qualità dell'aria nella stanza.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Attivata da una fotocamera sul tetto: chiedi a OpenClaw di scattare una foto del cielo ogni volta che appare suggestivo. Ha progettato una skill e realizzato lo scatto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Un prompt pianificato genera ogni mattina l'immagine di una scena (meteo, attività, data, post o citazione preferiti) tramite un personaggio di OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Strumento di verifica della disponibilità su Playtomic e CLI per le prenotazioni. Non perdere mai più un campo libero.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Raccoglie i PDF dalle email e prepara i documenti per un consulente fiscale. Contabilità mensile con il pilota automatico.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Ha ricostruito un intero sito personale tramite Telegram mentre guardava Netflix: migrazione da Notion ad Astro, 18 post trasferiti e DNS spostato su Cloudflare. Senza mai aprire un portatile.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Cerca annunci di lavoro, li confronta con le parole chiave del CV e restituisce le opportunità pertinenti con i relativi collegamenti. Creato in 30 minuti utilizzando l'API JSearch.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw si è connesso a Jira, quindi ha generato al volo una nuova skill (prima che esistesse su ClawHub).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Ha automatizzato le attività di Todoist e fatto generare a OpenClaw la skill direttamente nella chat di Telegram.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Accede a TradingView tramite automazione del browser, acquisisce schermate dei grafici ed esegue analisi tecniche su richiesta. Non serve alcuna API: basta il controllo del browser.
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

Ha lasciato OpenClaw libero di trattare con i concessionari: ha gestito la negoziazione avanti e indietro e ridotto il prezzo di 4.200 dollari.
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

Trova il prossimo volo nelle email, completa il check-in online e sceglie un posto vicino al finestrino, senza richiedere l'app della compagnia aerea.
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Ha presentato autonomamente una richiesta di risarcimento assicurativo e programmato l'appuntamento di controllo.
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

CLI per l'API di Idealista dedicata a ricerche e valutazioni immobiliari, integrata come skill affinché l'agente possa cercare casa tramite chat.
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Monitora Gmail per gli ordini di lavoro, analizza le foto delle proprietà inviate tramite Telegram, crea PDF di preventivi multipagina in LaTeX ed emette fatture tramite Xero.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitora un canale Slack aziendale, risponde in modo utile e inoltra le notifiche a Telegram. Ha corretto autonomamente un bug di produzione in un'app distribuita senza che gli fosse richiesto.
</Card>

</CardGroup>

## Conoscenza e memoria

Sistemi che indicizzano, cercano, ricordano e ragionano sulla conoscenza personale o del team.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Motore per l'apprendimento del cinese con feedback sulla pronuncia e percorsi di studio tramite OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Ha raccolto 4 milioni di post da 100 tra i principali account X e li ha trasformati in una pipeline di analisi interrogabile.
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Ha organizzato anni di risultati di analisi del sangue in un database strutturato di Notion.
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Assistente di uso quotidiano su WhatsApp, con tutta la memoria archiviata in formato Markdown in un vault Obsidian sottoposto a controllo di versione: monitoraggio delle calorie e degli allenamenti, elenchi di attività e gestione delle incombenze quotidiane.
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Vive in una chat di gruppo familiare su Telegram, documenta le storie di oltre 50 parenti e pone domande di approfondimento pertinenti, rispondendo in nepalese ai madrelingua.
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Comunità** • `memory` `transcription` `indexing`

Acquisisce esportazioni complete di WhatsApp, trascrive oltre mille note vocali, esegue verifiche incrociate con i log di Git e produce report Markdown collegati.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Aggiunge la ricerca vettoriale ai segnalibri di Karakeep usando Qdrant insieme agli embedding di OpenAI o Ollama.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Comunità** • `memory` `beliefs` `self-model`

Gestore della memoria separato che trasforma i file delle sessioni in ricordi, poi in convinzioni e infine in un modello di sé in continua evoluzione.
</Card>

</CardGroup>

## Voce e telefono

Punti di accesso incentrati sulla voce, collegamenti telefonici e flussi di lavoro con un uso intensivo della trascrizione.

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Un solo tocco su un Pebble Ring avvia una conversazione vocale con OpenClaw, consentendo di accedere all'agente da un dispositivo indossabile.
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Uno studio multimediale completo nella chat: sintesi vocale, trascrizione e automazione del browser collegate a Codex 5.2 e MiniMax.
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

Il tasto Azione dell'iPhone collegato a OpenClaw: premilo, parla e l'agente risponde come un walkie-talkie.
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Collegamento tra l'assistente vocale Vapi e OpenClaw tramite HTTP. Chiamate telefoniche con il proprio agente quasi in tempo reale.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Trascrizione audio multilingue tramite OpenRouter (Gemini e altri). Disponibile su ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Infrastruttura e distribuzione

Pacchettizzazione, distribuzione e integrazioni che semplificano l'esecuzione e l'estensione di OpenClaw.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw in esecuzione su Home Assistant OS con supporto per tunnel SSH e stato persistente.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Controlla e automatizza i dispositivi Home Assistant tramite il linguaggio naturale.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

App nativa in Swift per la barra dei menu che mostra lo stato dell'agente e offre controlli rapidi.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configurazione OpenClaw basata su Nix e completa di tutto il necessario per distribuzioni riproducibili.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill per il calendario che utilizza khal e vdirsyncer. Integrazione con calendari ospitati autonomamente.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## Casa e hardware

Il lato di OpenClaw che interagisce con il mondo fisico: abitazioni, sensori, telecamere, aspirapolvere e altri dispositivi.

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw ha trovato gli HomePod sulla rete locale e ha creato autonomamente una skill per controllarli.
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Un economico cubo olografico usato come volto fisico dell'agente sulla scrivania.
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automazione domestica nativa per Nix con OpenClaw come interfaccia, insieme a dashboard Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Controlla il robot aspirapolvere Roborock tramite una conversazione naturale.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Progetti della comunità

Progetti che si sono evoluti oltre un singolo flusso di lavoro, diventando prodotti o ecosistemi più ampi.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Comunità** • `marketplace` `astronomy` `webapp`

Un marketplace completo per attrezzature astronomiche, realizzato con e attorno all'ecosistema OpenClaw.
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Negoziazione aperta tra agenti: il tuo agente tratta accordi, appuntamenti e contratti di servizio con altri Node e firma crittograficamente il risultato; tu devi solo approvare o rifiutare.
</Card>

</CardGroup>

## Invia il tuo progetto

<Steps>
  <Step title="Share it">
    Pubblicalo in [#self-promotion su Discord](https://discord.gg/clawd) oppure [menziona @openclaw su X](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    Spiegaci cosa fa, aggiungi un collegamento al repository o alla demo e condividi una schermata, se ne hai una.
  </Step>
  <Step title="Get featured">
    Aggiungeremo a questa pagina i progetti più interessanti.
  </Step>
</Steps>

## Contenuti correlati

- [Primi passi](/it/start/getting-started)
- [OpenClaw](/it/start/openclaw)
- [Rassegna completa su X in openclaw.ai](https://openclaw.ai/showcase/)
