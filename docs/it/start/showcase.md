---
description: Real-world OpenClaw projects from the community
read_when:
    - Cerchi esempi reali di utilizzo di OpenClaw
    - Aggiornamento dei progetti in evidenza della community
summary: Progetti e integrazioni creati dalla community e basati su OpenClaw
title: Showcase
x-i18n:
    generated_at: "2026-04-24T09:03:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 15
---

I progetti OpenClaw non sono demo giocattolo. Le persone stanno realizzando loop di revisione PR, app mobili, automazione domestica, sistemi vocali, devtool e flussi di lavoro ricchi di memoria dai canali che già usano — build chat-native su Telegram, WhatsApp, Discord e terminali; automazione reale per prenotazioni, acquisti e supporto senza aspettare un'API; e integrazioni con il mondo fisico con stampanti, aspirapolvere, telecamere e sistemi domestici.

<Info>
**Vuoi essere messo in evidenza?** Condividi il tuo progetto in [#self-promotion su Discord](https://discord.gg/clawd) oppure [tagga @openclaw su X](https://x.com/openclaw).
</Info>

## Video

Inizia da qui se vuoi il percorso più breve da "che cos'è?" a "ok, ho capito."

<CardGroup cols={3}>

<Card title="Guida completa alla configurazione" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 minuti. Installa, completa l'onboarding e arriva a un primo assistente funzionante end-to-end.
</Card>

<Card title="Showcase della community" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  Un passaggio più rapido attraverso progetti reali, superfici e flussi di lavoro costruiti attorno a OpenClaw.
</Card>

<Card title="Progetti nel mondo reale" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Esempi dalla community, dai loop di coding chat-native fino all'hardware e all'automazione personale.
</Card>

</CardGroup>

## Appena arrivati da Discord

Elementi di spicco recenti tra coding, devtool, mobile e creazione di prodotti chat-native.

<CardGroup cols={2}>

<Card title="Da revisione PR a feedback su Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode completa la modifica, apre una PR, OpenClaw rivede il diff e risponde su Telegram con suggerimenti più un chiaro verdetto di merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Feedback di revisione PR di OpenClaw consegnato su Telegram" />
</Card>

<Card title="Skill per cantina vini in pochi minuti" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Ha chiesto a "Robby" (@openclaw) una skill locale per la cantina vini. Richiede un CSV di esempio esportato e un percorso di archiviazione, poi costruisce e testa la skill (962 bottiglie nell'esempio).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw costruisce una skill locale per cantina vini da CSV" />
</Card>

<Card title="Pilota automatico della spesa Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Piano pasti settimanale, articoli abituali, prenotazione fascia di consegna, conferma ordine. Nessuna API, solo controllo del browser.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automazione della spesa Tesco via chat" />
</Card>

<Card title="SNAG da screenshot a Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Tasto rapido su un'area dello schermo, vision di Gemini, Markdown istantaneo negli appunti.

  <img src="/assets/showcase/snag.png" alt="Strumento SNAG da screenshot a markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App desktop per gestire Skills e comandi tra Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="App Agents UI" />
</Card>

<Card title="Messaggi vocali Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Avvolge il TTS di papla.media e invia i risultati come messaggi vocali Telegram (senza autoplay fastidioso).

  <img src="/assets/showcase/papla-tts.jpg" alt="Output di messaggio vocale Telegram da TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper installabile con Homebrew per elencare, ispezionare e osservare sessioni locali di OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor su ClawHub" />
</Card>

<Card title="Controllo stampante 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controlla e risolve problemi delle stampanti BambuLab: stato, job, telecamera, AMS, calibrazione e altro.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI su ClawHub" />
</Card>

<Card title="Trasporto di Vienna (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partenze in tempo reale, interruzioni, stato degli ascensori e instradamento per il trasporto pubblico di Vienna.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien" />
</Card>

<Card title="Pasti scolastici ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Prenotazione automatizzata dei pasti scolastici nel Regno Unito tramite ParentPay. Usa coordinate del mouse per clic affidabili sulle celle della tabella.
</Card>

<Card title="Upload R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Carica su Cloudflare R2/S3 e genera link di download presigned sicuri. Utile per istanze OpenClaw remote.
</Card>

<Card title="App iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Ha creato un'app iOS completa con mappe e registrazione vocale, distribuita su TestFlight interamente tramite chat Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="App iOS su TestFlight" />
</Card>

<Card title="Assistente salute Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistente personale AI per la salute che integra dati Oura ring con calendario, appuntamenti e programma palestra.

  <img src="/assets/showcase/oura-health.png" alt="Assistente salute Oura ring" />
</Card>

<Card title="Kev's Dream Team (14+ agenti)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Più di 14 agenti sotto un unico gateway con un orchestratore Opus 4.5 che delega a worker Codex. Vedi la [descrizione tecnica](https://github.com/adam91holt/orchestrated-ai-articles) e [Clawdspace](https://github.com/adam91holt/clawdspace) per il sandboxing degli agenti.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI per Linear che si integra con flussi di lavoro agentici (Claude Code, OpenClaw). Gestisci issue, progetti e workflow dal terminale.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Leggi, invia e archivia messaggi tramite Beeper Desktop. Usa l'API MCP locale di Beeper così gli agenti possono gestire tutte le tue chat (iMessage, WhatsApp e altro) in un unico posto.
</Card>

</CardGroup>

## Automazione e flussi di lavoro

Pianificazione, controllo del browser, loop di supporto e il lato "fai il compito per me" del prodotto.

<CardGroup cols={2}>

<Card title="Controllo purificatore d'aria Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ha individuato e confermato i controlli del purificatore, poi OpenClaw prende il controllo per gestire la qualità dell'aria della stanza.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Controllo del purificatore d'aria Winix tramite OpenClaw" />
</Card>

<Card title="Belle foto del cielo dalla telecamera" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Attivato da una telecamera sul tetto: chiedi a OpenClaw di scattare una foto del cielo ogni volta che appare bello. Ha progettato una skill e scattato la foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Istantanea del cielo dalla telecamera sul tetto catturata da OpenClaw" />
</Card>

<Card title="Scena di briefing mattutino visivo" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Un prompt pianificato genera ogni mattina un'immagine di scena (meteo, attività, data, post o citazione preferita) tramite una persona OpenClaw.
</Card>

<Card title="Prenotazione campo da padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Controllo disponibilità Playtomic più CLI di prenotazione. Non perdere mai più un campo libero.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Screenshot di padel-cli" />
</Card>

<Card title="Acquisizione contabilità" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Raccoglie PDF dalle email, prepara i documenti per un consulente fiscale. Contabilità mensile in autopilota.
</Card>

<Card title="Modalità sviluppatore dal divano" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Ha ricostruito un intero sito personale via Telegram mentre guardava Netflix — da Notion a Astro, 18 post migrati, DNS su Cloudflare. Non ha mai aperto un laptop.
</Card>

<Card title="Agente per la ricerca di lavoro" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Cerca annunci di lavoro, li confronta con parole chiave del CV e restituisce opportunità rilevanti con link. Creato in 30 minuti usando l'API JSearch.
</Card>

<Card title="Costruttore di skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw si è collegato a Jira, poi ha generato una nuova skill al volo (prima che esistesse su ClawHub).
</Card>

<Card title="Skill Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Ha automatizzato attività Todoist e fatto generare a OpenClaw la skill direttamente nella chat Telegram.
</Card>

<Card title="Analisi TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Accede a TradingView tramite automazione del browser, cattura screenshot dei grafici ed esegue analisi tecnica su richiesta. Nessuna API necessaria — solo controllo del browser.
</Card>

<Card title="Supporto automatico su Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Osserva un canale Slack aziendale, risponde in modo utile e inoltra notifiche a Telegram. Ha corretto autonomamente un bug di produzione in un'app distribuita senza che nessuno glielo chiedesse.
</Card>

</CardGroup>

## Conoscenza e memory

Sistemi che indicizzano, cercano, ricordano e ragionano su conoscenza personale o di team.

<CardGroup cols={2}>

<Card title="xuezh apprendimento del cinese" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Motore per l'apprendimento del cinese con feedback sulla pronuncia e flussi di studio tramite OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Feedback sulla pronuncia di xuezh" />
</Card>

<Card title="Vault di memory WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Importa esportazioni complete di WhatsApp, trascrive più di 1.000 note vocali, le confronta con i log git e produce report markdown collegati.
</Card>

<Card title="Ricerca semantica Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Aggiunge ricerca vettoriale ai segnalibri Karakeep usando Qdrant più embedding OpenAI o Ollama.
</Card>

<Card title="Memory Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Gestore di memory separato che trasforma i file di sessione in ricordi, poi in convinzioni, poi in un modello del sé in evoluzione.
</Card>

</CardGroup>

## Voce e telefono

Punti di ingresso speech-first, bridge telefonici e flussi di lavoro ricchi di trascrizione.

<CardGroup cols={2}>

<Card title="Bridge telefonico Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Bridge HTTP da assistente vocale Vapi a OpenClaw. Telefonate quasi in tempo reale con il tuo agente.
</Card>

<Card title="Trascrizione OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Trascrizione audio multilingue tramite OpenRouter (Gemini e altro). Disponibile su ClawHub.
</Card>

</CardGroup>

## Infrastruttura e distribuzione

Packaging, distribuzione e integrazioni che rendono OpenClaw più facile da eseguire ed estendere.

<CardGroup cols={2}>

<Card title="Add-on Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw in esecuzione su Home Assistant OS con supporto per tunnel SSH e stato persistente.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Controlla e automatizza i dispositivi Home Assistant tramite linguaggio naturale.
</Card>

<Card title="Packaging Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configurazione OpenClaw in stile nix con tutto incluso per distribuzioni riproducibili.
</Card>

<Card title="Calendario CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Skill calendario che usa khal e vdirsyncer. Integrazione con calendario self-hosted.
</Card>

</CardGroup>

## Casa e hardware

Il lato fisico di OpenClaw: case, sensori, telecamere, aspirapolvere e altri dispositivi.

<CardGroup cols={2}>

<Card title="Automazione GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automazione domestica nativa Nix con OpenClaw come interfaccia, più dashboard Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Dashboard Grafana di GoHome" />
</Card>

<Card title="Aspirapolvere Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Controlla il tuo robot aspirapolvere Roborock tramite conversazione naturale.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Stato di Roborock" />
</Card>

</CardGroup>

## Progetti della community

Cose che sono cresciute oltre un singolo flusso di lavoro fino a diventare prodotti o ecosistemi più ampi.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Marketplace completo di attrezzatura astronomica. Costruito con e attorno all'ecosistema OpenClaw.
</Card>

</CardGroup>

## Invia il tuo progetto

<Steps>
  <Step title="Condividilo">
    Pubblica in [#self-promotion su Discord](https://discord.gg/clawd) oppure [twitta a @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Includi i dettagli">
    Dicci cosa fa, inserisci un link al repository o alla demo e condividi uno screenshot se ne hai uno.
  </Step>
  <Step title="Ottieni visibilità">
    Aggiungeremo i progetti più interessanti a questa pagina.
  </Step>
</Steps>

## Correlati

- [Getting started](/it/start/getting-started)
- [OpenClaw](/it/start/openclaw)
