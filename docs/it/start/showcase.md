---
read_when:
    - Cerchi esempi reali di utilizzo di OpenClaw
    - Stai aggiornando i progetti in evidenza della community
summary: Progetti e integrazioni creati dalla community e basati su OpenClaw
title: Vetrina
x-i18n:
    generated_at: "2026-04-05T14:05:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2917e9a476ef527ddb3e51c610bbafbd145e705c9cc29f191639fb63d238ef70
    source_path: start/showcase.md
    workflow: 15
---

# Vetrina

Progetti reali della community. Scopri cosa stanno costruendo le persone con OpenClaw.

<Info>
**Vuoi essere messo in evidenza?** Condividi il tuo progetto in [#self-promotion su Discord](https://discord.gg/clawd) o [tagga @openclaw su X](https://x.com/openclaw).
</Info>

## 🎥 OpenClaw in azione

Guida completa alla configurazione (28 min) di VelvetShark.

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
    title="OpenClaw: l'IA self-hosted che Siri avrebbe dovuto essere (configurazione completa)"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[Guarda su YouTube](https://www.youtube.com/watch?v=SaWSPZoPX34)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
    title="Video vetrina di OpenClaw"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[Guarda su YouTube](https://www.youtube.com/watch?v=mMSKQvlmFuQ)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
    title="Vetrina della community OpenClaw"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[Guarda su YouTube](https://www.youtube.com/watch?v=5kkIJNUGFho)

## 🆕 Novità da Discord

<CardGroup cols={2}>

<Card title="Revisione PR → Feedback su Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode completa la modifica → apre una PR → OpenClaw esamina il diff e risponde su Telegram con “suggerimenti minori” più un chiaro verdetto di merge (incluse le correzioni critiche da applicare prima).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Feedback di revisione PR di OpenClaw consegnato su Telegram" />
</Card>

<Card title="Skill cantina vini in pochi minuti" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Ha chiesto a “Robby” (@openclaw) una skill locale per la cantina vini. Richiede un CSV di esportazione di esempio + dove salvarlo, poi crea/testa rapidamente la skill (962 bottiglie nell'esempio).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw che crea una skill locale per cantina vini da CSV" />
</Card>

<Card title="Pilota automatico per spesa Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Piano pasti settimanale → articoli abituali → prenota fascia di consegna → conferma ordine. Nessuna API, solo controllo del browser.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automazione della spesa Tesco tramite chat" />
</Card>

<Card title="SNAG da screenshot a Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Tasto rapido su un'area dello schermo → Gemini vision → Markdown istantaneo negli appunti.

  <img src="/assets/showcase/snag.png" alt="Strumento SNAG da screenshot a Markdown" />
</Card>

<Card title="Interfaccia Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App desktop per gestire skills/comandi tra Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="App Agents UI" />
</Card>

<Card title="Messaggi vocali Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Incorpora il TTS di papla.media e invia i risultati come messaggi vocali Telegram (senza fastidioso autoplay).

  <img src="/assets/showcase/papla-tts.jpg" alt="Output di messaggio vocale Telegram da TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper installabile con Homebrew per elencare/ispezionare/monitorare le sessioni locali di OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor su ClawHub" />
</Card>

<Card title="Controllo stampante 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controlla e diagnostica le stampanti BambuLab: stato, lavori, fotocamera, AMS, calibrazione e altro.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI su ClawHub" />
</Card>

<Card title="Trasporti di Vienna (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partenze in tempo reale, interruzioni, stato degli ascensori e instradamento per il trasporto pubblico di Vienna.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien su ClawHub" />
</Card>

<Card title="Pasti scolastici ParentPay" icon="utensils" href="#">
  **@George5562** • `automation` `browser` `parenting`

Prenotazione automatizzata dei pasti scolastici nel Regno Unito tramite ParentPay. Usa coordinate del mouse per clic affidabili sulle celle della tabella.
</Card>

<Card title="Upload R2 (Inviami i miei file)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Carica su Cloudflare R2/S3 e genera link di download presigned sicuri. Perfetto per istanze OpenClaw remote.
</Card>

<Card title="App iOS tramite Telegram" icon="mobile" href="#">
  **@coard** • `ios` `xcode` `testflight`

Ha creato un'app iOS completa con mappe e registrazione vocale, distribuita su TestFlight interamente tramite chat Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="App iOS su TestFlight" />
</Card>

<Card title="Assistente salute con Oura Ring" icon="heart-pulse" href="#">
  **@AS** • `health` `oura` `calendar`

Assistente sanitario personale basato su IA che integra i dati di Oura ring con calendario, appuntamenti e programma della palestra.

  <img src="/assets/showcase/oura-health.png" alt="Assistente salute con Oura ring" />
</Card>
<Card title="Il Dream Team di Kev (14+ agenti)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

14+ agenti sotto un unico gateway con orchestratore Opus 4.5 che delega a worker Codex. [Approfondimento tecnico](https://github.com/adam91holt/orchestrated-ai-articles) completo che copre la rosa del Dream Team, selezione dei modelli, sandboxing, webhook, heartbeat e flussi di delega. [Clawdspace](https://github.com/adam91holt/clawdspace) per il sandboxing degli agenti. [Post del blog](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI per Linear che si integra con flussi di lavoro agentici (Claude Code, OpenClaw). Gestisci issue, progetti e workflow dal terminale. Prima PR esterna unita!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Leggi, invia e archivia messaggi tramite Beeper Desktop. Usa l'API MCP locale di Beeper così gli agenti possono gestire tutte le tue chat (iMessage, WhatsApp, ecc.) in un unico posto.
</Card>

</CardGroup>

## 🤖 Automazione e workflow

<CardGroup cols={2}>

<Card title="Controllo purificatore d'aria Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ha scoperto e confermato i controlli del purificatore, poi OpenClaw prende il controllo per gestire la qualità dell'aria nella stanza.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Controllo del purificatore d'aria Winix tramite OpenClaw" />
</Card>

<Card title="Belle foto del cielo con la videocamera" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Attivato da una videocamera sul tetto: chiedi a OpenClaw di scattare una foto del cielo ogni volta che sembra bello — ha progettato una skill e scattato la foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Istante del cielo da videocamera sul tetto catturato da OpenClaw" />
</Card>

<Card title="Scena visiva per briefing mattutino" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Un prompt pianificato genera ogni mattina una singola immagine di "scena" (meteo, attività, data, post/citazione preferiti) tramite una persona OpenClaw.
</Card>

<Card title="Prenotazione campo da padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Verifica disponibilità Playtomic + CLI di prenotazione. Non perdere mai più un campo libero.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="Screenshot di padel-cli" />
</Card>

<Card title="Raccolta documenti contabili" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`
  
  Raccoglie PDF dalle email, prepara i documenti per il consulente fiscale. Contabilità mensile in autopilota.
</Card>

<Card title="Modalità sviluppatore dal divano" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Ha ricostruito l'intero sito personale via Telegram mentre guardava Netflix — Notion → Astro, 18 post migrati, DNS su Cloudflare. Non ha mai aperto un portatile.
</Card>

<Card title="Agente per ricerca lavoro" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Cerca offerte di lavoro, le confronta con le parole chiave del CV e restituisce opportunità pertinenti con link. Creato in 30 minuti usando l'API JSearch.
</Card>

<Card title="Generatore di skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw si è collegato a Jira, poi ha generato una nuova skill al volo (prima che esistesse su ClawHub).
</Card>

<Card title="Skill Todoist tramite Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Ha automatizzato le attività Todoist e fatto generare a OpenClaw la skill direttamente nella chat Telegram.
</Card>

<Card title="Analisi TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Accede a TradingView tramite automazione del browser, cattura screenshot dei grafici ed esegue analisi tecnica su richiesta. Nessuna API necessaria: solo controllo del browser.
</Card>

<Card title="Supporto automatico su Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitora il canale Slack aziendale, risponde in modo utile e inoltra notifiche a Telegram. Ha corretto autonomamente un bug di produzione in un'app distribuita senza che gli fosse stato chiesto.
</Card>

</CardGroup>

## 🧠 Conoscenza e memoria

<CardGroup cols={2}>

<Card title="Apprendimento del cinese xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Motore per l'apprendimento del cinese con feedback sulla pronuncia e flussi di studio tramite OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Feedback sulla pronuncia di xuezh" />
</Card>

<Card title="Vault della memoria WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`
  
  Acquisisce esportazioni complete di WhatsApp, trascrive oltre 1.000 messaggi vocali, confronta con log git e produce report markdown collegati.
</Card>

<Card title="Ricerca semantica Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Aggiunge la ricerca vettoriale ai segnalibri Karakeep usando embedding Qdrant + OpenAI/Ollama.
</Card>

<Card title="Memoria di Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`
  
  Gestore di memoria separato che trasforma i file di sessione in ricordi → convinzioni → modello del sé in evoluzione.
</Card>

</CardGroup>

## 🎙️ Voce e telefono

<CardGroup cols={2}>

<Card title="Bridge telefonico Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Bridge HTTP tra assistente vocale Vapi e OpenClaw. Chiamate telefoniche quasi in tempo reale con il tuo agente.
</Card>

<Card title="Trascrizione OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Trascrizione audio multilingue tramite OpenRouter (Gemini, ecc.). Disponibile su ClawHub.
</Card>

</CardGroup>

## 🏗️ Infrastruttura e distribuzione

<CardGroup cols={2}>

<Card title="Add-on Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway OpenClaw in esecuzione su Home Assistant OS con supporto per tunnel SSH e stato persistente.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Controlla e automatizza i dispositivi Home Assistant tramite linguaggio naturale.
</Card>

<Card title="Pacchettizzazione Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Configurazione OpenClaw nixified pronta all'uso per distribuzioni riproducibili.
</Card>

<Card title="Calendario CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill calendario che usa khal/vdirsyncer. Integrazione calendario self-hosted.
</Card>

</CardGroup>

## 🏠 Casa e hardware

<CardGroup cols={2}>

<Card title="Automazione GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Automazione domestica nativa Nix con OpenClaw come interfaccia, più splendide dashboard Grafana.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="Dashboard Grafana di GoHome" />
</Card>

<Card title="Aspirapolvere Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Controlla il tuo aspirapolvere robot Roborock tramite conversazione naturale.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Stato di Roborock" />
</Card>

</CardGroup>

## 🌟 Progetti della community

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`
  
  Marketplace completo per attrezzatura astronomica. Creato con/attorno all'ecosistema OpenClaw.
</Card>

</CardGroup>

---

## Invia il tuo progetto

Hai qualcosa da condividere? Saremo felici di metterlo in evidenza!

<Steps>
  <Step title="Condividilo">
    Pubblica in [#self-promotion su Discord](https://discord.gg/clawd) o [tagga @openclaw su X](https://x.com/openclaw)
  </Step>
  <Step title="Includi i dettagli">
    Dicci cosa fa, aggiungi il link al repository/demo, condividi uno screenshot se ne hai uno
  </Step>
  <Step title="Ottieni visibilità">
    Aggiungeremo i progetti più interessanti a questa pagina
  </Step>
</Steps>
