---
read_when:
    - Ti serve il comportamento dettagliato di openclaw onboard
    - Stai eseguendo il debug dei risultati di onboarding o integrando client di onboarding
sidebarTitle: CLI reference
summary: Riferimento completo per il flusso di configurazione della CLI, la configurazione di autenticazione/modello, gli output e i dettagli interni
title: Riferimento alla configurazione della CLI
x-i18n:
    generated_at: "2026-06-30T22:21:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Questa pagina è il riferimento completo per `openclaw onboard`.
Per la guida breve, vedi [Onboarding (CLI)](/it/start/wizard).

## Cosa fa la procedura guidata

La modalità locale (predefinita) ti guida attraverso:

- Configurazione del modello e dell'autenticazione (OAuth per abbonamento OpenAI Code, CLI Anthropic Claude o chiave API, più opzioni MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Posizione del workspace e file di bootstrap
- Impostazioni del Gateway (porta, bind, autenticazione, tailscale)
- Canali e provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage e altri Plugin di canale inclusi)
- Installazione del daemon (LaunchAgent, unità utente systemd o attività pianificata nativa di Windows con fallback alla cartella Esecuzione automatica)
- Controllo di integrità
- Configurazione di Skills

La modalità remota configura questa macchina per connettersi a un Gateway altrove.
Non installa né modifica nulla sull'host remoto.

## Dettagli del flusso locale

<Steps>
  <Step title="Existing config detection">
    - Se `~/.openclaw/openclaw.json` esiste, scegli Mantieni, Modifica o Reimposta.
    - Eseguire di nuovo la procedura guidata non cancella nulla, a meno che tu non scelga esplicitamente Reimposta (o passi `--reset`).
    - CLI `--reset` usa come predefinito `config+creds+sessions`; usa `--reset-scope full` per rimuovere anche il workspace.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si interrompe e ti chiede di eseguire `openclaw doctor` prima di continuare.
    - La reimpostazione usa `trash` e offre questi ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reimpostazione completa (rimuove anche il workspace)

  </Step>
  <Step title="Model and auth">
    - La matrice completa delle opzioni è in [Opzioni di autenticazione e modello](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Predefinito `~/.openclaw/workspace` (configurabile).
    - Inizializza i file del workspace necessari per il rituale di bootstrap al primo avvio.
    - Layout del workspace: [Workspace dell'agente](/it/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Richiede porta, bind, modalità di autenticazione ed esposizione tailscale.
    - Consigliato: mantieni abilitata l'autenticazione tramite token anche per loopback, così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/memorizza token in testo normale** (predefinito)
      - **Usa SecretRef** (opt-in)
    - In modalità password, la configurazione interattiva supporta anche la memorizzazione in testo normale o SecretRef.
    - Percorso SecretRef token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile d'ambiente non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'autenticazione solo se ti fidi pienamente di ogni processo locale.
    - I bind non loopback richiedono comunque l'autenticazione.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/it/channels/whatsapp): accesso QR opzionale
    - [Telegram](/it/channels/telegram): token del bot
    - [Discord](/it/channels/discord): token del bot
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + audience del Webhook
    - [Mattermost](/it/channels/mattermost): token del bot + URL di base
    - [Signal](/it/channels/signal): installazione opzionale di `signal-cli` + configurazione dell'account
    - [iMessage](/it/channels/imessage): percorso della CLI `imsg` + accesso al DB di Messaggi; usa un wrapper SSH quando il Gateway viene eseguito fuori dal Mac
    - Sicurezza dei DM: l'impostazione predefinita è l'abbinamento. Il primo DM invia un codice; approva tramite
      `openclaw pairing approve <channel> <code>` oppure usa liste consentite.
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - Richiede una sessione utente con accesso effettuato; per sistemi headless, usa un LaunchDaemon personalizzato (non fornito).
    - Linux e Windows tramite WSL2: unità utente systemd
      - La procedura guidata prova `loginctl enable-linger <user>` così il Gateway resta attivo dopo il logout.
      - Può richiedere sudo (scrive in `/var/lib/systemd/linger`); prima prova senza sudo.
    - Windows nativo: prima Attività pianificata
      - Se la creazione dell'attività viene negata, OpenClaw passa a un elemento di accesso per utente nella cartella Esecuzione automatica e avvia subito il Gateway.
      - Le Attività pianificate restano preferibili perché offrono uno stato di supervisione migliore.
    - Selezione del runtime: Node (consigliato; richiesto per WhatsApp e Telegram). Bun non è consigliato.

  </Step>
  <Step title="Health check">
    - Avvia il Gateway (se necessario) ed esegue `openclaw health`.
    - `openclaw status --deep` aggiunge il probe di integrità del Gateway live all'output di stato, inclusi i probe dei canali quando supportati.

  </Step>
  <Step title="Skills">
    - Legge le Skills disponibili e controlla i requisiti.
    - Ti permette di scegliere il gestore Node: npm, pnpm o bun.
    - Installa dipendenze opzionali (alcune usano Homebrew su macOS).

  </Step>
  <Step title="Finish">
    - Riepilogo e passaggi successivi, incluse le opzioni per app iOS, Android e macOS.

  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, la procedura guidata stampa istruzioni di port forwarding SSH per la Control UI invece di aprire un browser.
Se gli asset della Control UI mancano, la procedura guidata prova a compilarli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze della UI).
</Note>

## Dettagli della modalità remota

La modalità remota configura questa macchina per connettersi a un Gateway altrove.

<Info>
La modalità remota non installa né modifica nulla sull'host remoto.
</Info>

Cosa imposti:

- URL del Gateway remoto (`ws://...`)
- Token se l'autenticazione del Gateway remoto è richiesta (consigliato)

<Note>
- Se il Gateway è solo loopback, usa tunneling SSH o una tailnet.
- Suggerimenti di rilevamento:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opzioni di autenticazione e modello

<AccordionGroup>
  <Accordion title="Anthropic API key">
    Usa `ANTHROPIC_API_KEY` se presente o richiede una chiave, quindi la salva per l'uso del daemon.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Flusso browser; incolla `code#state`.

    Imposta `agents.defaults.model` su `openai/gpt-5.5` tramite il runtime Codex quando il modello non è impostato o appartiene già alla famiglia OpenAI.

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    Flusso di abbinamento browser con un codice dispositivo di breve durata.

    Imposta `agents.defaults.model` su `openai/gpt-5.5` tramite il runtime Codex quando il modello non è impostato o appartiene già alla famiglia OpenAI.

  </Accordion>
  <Accordion title="OpenAI API key">
    Usa `OPENAI_API_KEY` se presente o richiede una chiave, quindi archivia la credenziale nei profili di autenticazione.

    Imposta `agents.defaults.model` su `openai/gpt-5.5` quando il modello non è impostato, è `openai/*` o usa riferimenti di modello Codex legacy.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Accesso tramite browser per account SuperGrok o X Premium idonei. Questo è il
    percorso xAI consigliato per la maggior parte degli utenti. OpenClaw archivia il profilo di
    autenticazione risultante per i modelli Grok, Grok `web_search`, `x_search` e `code_execution`.
  </Accordion>
  <Accordion title="xAI (Grok) device code">
    Accesso tramite browser adatto agli ambienti remoti con un codice breve invece di un callback
    localhost. Usalo da host SSH, Docker o VPS.
  </Accordion>
  <Accordion title="xAI (Grok) API key">
    Richiede `XAI_API_KEY` e configura xAI come provider di modelli. Usalo
    quando vuoi una chiave API di xAI Console invece dell'OAuth da abbonamento.
  </Accordion>
  <Accordion title="OpenCode">
    Richiede `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) e ti permette di scegliere il catalogo Zen o Go.
    URL di configurazione: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (generic)">
    Archivia la chiave per te.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Richiede `AI_GATEWAY_API_KEY`.
    Maggiori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Richiede ID account, ID Gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configurazione viene scritta automaticamente. Il valore predefinito hosted è `MiniMax-M3`; la configurazione con chiave API usa
    `minimax/...`, mentre la configurazione OAuth usa `minimax-portal/...`.
    Maggiori dettagli: [MiniMax](/it/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint cinesi o globali.
    Standard attualmente include `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    Maggiori dettagli: [StepFun](/it/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    Richiede `SYNTHETIC_API_KEY`.
    Maggiori dettagli: [Synthetic](/it/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    Prima richiede `Cloud + Local`, `Cloud only` o `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Le modalità basate su host richiedono l'URL di base (predefinito `http://127.0.0.1:11434`), rilevano i modelli disponibili e suggeriscono valori predefiniti.
    `Cloud + Local` controlla anche se quell'host Ollama ha effettuato l'accesso per l'accesso cloud.
    Maggiori dettagli: [Ollama](/it/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Le configurazioni Moonshot (Kimi K2) e Kimi Coding vengono scritte automaticamente.
    Maggiori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot).
  </Accordion>
  <Accordion title="Custom provider">
    Funziona con endpoint compatibili con OpenAI e compatibili con Anthropic.

    L'onboarding interattivo supporta le stesse scelte di archiviazione della chiave API degli altri flussi con chiave API dei provider:
    - **Incolla ora la chiave API** (testo normale)
    - **Usa riferimento segreto** (riferimento env o riferimento provider configurato, con validazione preliminare)

    Flag non interattivi:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opzionale; fallback a `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opzionale)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opzionale; predefinito `openai`)
    - `--custom-image-input` / `--custom-text-input` (opzionale; sovrascrive la capacità di input del modello inferita)

  </Accordion>
  <Accordion title="Skip">
    Lascia l'autenticazione non configurata.
  </Accordion>
</AccordionGroup>

Comportamento del modello:

- Scegli il modello predefinito dalle opzioni rilevate oppure inserisci manualmente provider e modello.
- L'onboarding per provider personalizzato deduce il supporto alle immagini per gli ID modello comuni e chiede solo quando il nome del modello è sconosciuto.
- Quando l'onboarding parte da una scelta di autenticazione del provider, il selettore del modello preferisce
  automaticamente quel provider. Per Volcengine e BytePlus, la stessa preferenza
  corrisponde anche alle loro varianti di piano coding (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se quel filtro del provider preferito fosse vuoto, il selettore torna al
  catalogo completo invece di non mostrare alcun modello.
- La procedura guidata esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'autenticazione.

Percorsi di credenziali e profili:

- Profili di autenticazione (chiavi API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importazione OAuth legacy: `~/.openclaw/credentials/oauth.json`

Modalità di archiviazione delle credenziali:

- Il comportamento predefinito dell'onboarding persiste le chiavi API come valori in testo in chiaro nei profili di autenticazione.
- `--secret-input-mode ref` abilita la modalità di riferimento invece dell'archiviazione della chiave in testo in chiaro.
  Nella configurazione interattiva, puoi scegliere:
  - riferimento a variabile d'ambiente (per esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - riferimento a provider configurato (`file` o `exec`) con alias provider + id
- La modalità di riferimento interattiva esegue una rapida validazione preliminare prima del salvataggio.
  - Riferimenti env: valida il nome della variabile + il valore non vuoto nell'ambiente di onboarding corrente.
  - Riferimenti provider: valida la configurazione del provider e risolve l'id richiesto.
  - Se la verifica preliminare fallisce, l'onboarding mostra l'errore e ti consente di riprovare.
- In modalità non interattiva, `--secret-input-mode ref` è supportata solo da env.
  - Imposta la variabile d'ambiente del provider nell'ambiente di processo dell'onboarding.
  - I flag chiave inline (per esempio `--openai-api-key`) richiedono che tale variabile d'ambiente sia impostata; altrimenti l'onboarding fallisce subito.
  - Per provider personalizzati, la modalità non interattiva `ref` archivia `models.providers.<id>.apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In quel caso di provider personalizzato, `--custom-api-key` richiede che `CUSTOM_API_KEY` sia impostata; altrimenti l'onboarding fallisce subito.
- Le credenziali di autenticazione Gateway supportano scelte in testo in chiaro e SecretRef nella configurazione interattiva:
  - Modalità token: **Genera/archivia token in testo in chiaro** (predefinita) o **Usa SecretRef**.
  - Modalità password: testo in chiaro o SecretRef.
- Percorso SecretRef token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
- Le configurazioni esistenti in testo in chiaro continuano a funzionare senza modifiche.

<Note>
Suggerimento per headless e server: completa OAuth su una macchina con un browser, quindi copia
l'`auth-profiles.json` di quell'agente (per esempio
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, oppure il percorso
`$OPENCLAW_STATE_DIR/...` corrispondente) sull'host gateway. `credentials/oauth.json`
è solo una fonte di importazione legacy.
</Note>

## Output e dettagli interni

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando viene passato `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (se viene scelto Minimax)
- `tools.profile` (l'onboarding locale usa per impostazione predefinita `"coding"` quando non impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (modalità, bind, autenticazione, tailscale)
- `session.dmScope` (l'onboarding locale lo imposta per impostazione predefinita su `per-channel-peer` quando non impostato; i valori espliciti esistenti vengono preservati)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlists dei canali (Slack, Discord, Matrix, Microsoft Teams) quando acconsenti durante i prompt (i nomi vengono risolti in ID quando possibile)
- `skills.install.nodeManager`
  - Il flag `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque impostare `skills.install.nodeManager: "yarn"` in seguito.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` scrive `agents.list[]` e `bindings` opzionali.

Le credenziali WhatsApp vanno sotto `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni sono archiviate sotto `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alcuni canali vengono distribuiti come plugin. Quando selezionati durante la configurazione, la procedura guidata
richiede di installare il Plugin (npm o percorso locale) prima della configurazione del canale.
</Note>

RPC della procedura guidata Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

I client (app macOS e Control UI) possono renderizzare i passaggi senza reimplementare la logica di onboarding.

Comportamento della configurazione di Signal:

- Scarica l'asset di rilascio appropriato
- Lo archivia sotto `~/.openclaw/tools/signal-cli/<version>/`
- Scrive `channels.signal.cliPath` nella configurazione
- Le build JVM richiedono Java 21
- Le build native vengono usate quando disponibili
- Windows usa WSL2 e segue il flusso Linux di signal-cli all'interno di WSL

## Documentazione correlata

- Hub di onboarding: [Onboarding (CLI)](/it/start/wizard)
- Automazione e script: [Automazione CLI](/it/start/wizard-cli-automation)
- Riferimento dei comandi: [`openclaw onboard`](/it/cli/onboard)
