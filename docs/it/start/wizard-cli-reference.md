---
read_when:
    - Ti serve il comportamento dettagliato di `openclaw onboard`
    - Stai eseguendo il debug dei risultati dell'onboarding o integrando client di onboarding
sidebarTitle: CLI reference
summary: Riferimento completo per il flusso di configurazione CLI, configurazione auth/modello, output e componenti interni
title: Riferimento della configurazione CLI
x-i18n:
    generated_at: "2026-04-25T18:23:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967fd6734d8facaa732b40567c33e48434208bf861d102adc8a4ee042f13041
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Questa pagina è il riferimento completo per `openclaw onboard`.
Per la guida breve, vedi [Onboarding (CLI)](/it/start/wizard).

## Cosa fa il wizard

La modalità locale (predefinita) ti guida attraverso:

- Configurazione del modello e dell'autenticazione (OAuth dell'abbonamento OpenAI Code, Anthropic Claude CLI o chiave API, più opzioni MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Posizione del workspace e file di bootstrap
- Impostazioni del Gateway (porta, bind, auth, Tailscale)
- Canali e provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles e altri Plugin di canale bundled)
- Installazione del daemon (LaunchAgent, unità systemd utente o attività pianificata nativa di Windows con fallback alla cartella Startup)
- Controllo di integrità
- Configurazione delle Skills

La modalità remota configura questa macchina per connettersi a un Gateway altrove.
Non installa né modifica nulla sull'host remoto.

## Dettagli del flusso locale

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se esiste `~/.openclaw/openclaw.json`, scegli Mantieni, Modifica o Reimposta.
    - Rieseguire il wizard non cancella nulla a meno che tu non scelga esplicitamente Reimposta (o passi `--reset`).
    - La CLI `--reset` usa per impostazione predefinita `config+creds+sessions`; usa `--reset-scope full` per rimuovere anche il workspace.
    - Se la configurazione non è valida o contiene chiavi legacy, il wizard si ferma e ti chiede di eseguire `openclaw doctor` prima di continuare.
    - La reimpostazione usa `trash` e offre questi ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reimpostazione completa (rimuove anche il workspace)

  </Step>
  <Step title="Modello e autenticazione">
    - La matrice completa delle opzioni è in [Opzioni di autenticazione e modello](#auth-and-model-options).

  </Step>
  <Step title="Workspace">
    - Predefinito `~/.openclaw/workspace` (configurabile).
    - Inizializza i file del workspace necessari per il rituale di bootstrap della prima esecuzione.
    - Layout del workspace: [Workspace dell'agente](/it/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Richiede porta, bind, modalità auth ed esposizione Tailscale.
    - Consigliato: mantieni abilitata l'autenticazione con token anche per loopback, così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/memorizza token in chiaro** (predefinito)
      - **Usa SecretRef** (opt-in)
    - In modalità password, la configurazione interattiva supporta anch'essa l'archiviazione in chiaro o SecretRef.
    - Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile env non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'autenticazione solo se ti fidi completamente di ogni processo locale.
    - I bind non-loopback richiedono comunque autenticazione.

  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): login QR opzionale
    - [Telegram](/it/channels/telegram): token del bot
    - [Discord](/it/channels/discord): token del bot
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + audience del Webhook
    - [Mattermost](/it/channels/mattermost): token del bot + URL base
    - [Signal](/it/channels/signal): installazione opzionale di `signal-cli` + configurazione dell'account
    - [BlueBubbles](/it/channels/bluebubbles): consigliato per iMessage; URL del server + password + Webhook
    - [iMessage](/it/channels/imessage): percorso CLI legacy `imsg` + accesso al DB
    - Sicurezza DM: il valore predefinito è l'abbinamento. Il primo DM invia un codice; approva tramite
      `openclaw pairing approve <channel> <code>` oppure usa allowlist.
  </Step>
  <Step title="Installazione del daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente con accesso eseguito; per ambienti headless usa un LaunchDaemon personalizzato (non fornito).
    - Linux e Windows tramite WSL2: unità systemd utente
      - Il wizard tenta `loginctl enable-linger <user>` così il Gateway resta attivo dopo il logout.
      - Può richiedere sudo (scrive in `/var/lib/systemd/linger`); prova prima senza sudo.
    - Windows nativo: prima Scheduled Task
      - Se la creazione del task viene negata, OpenClaw ripiega su un elemento di login per utente nella cartella Startup e avvia immediatamente il Gateway.
      - Le Scheduled Task restano preferibili perché forniscono uno stato del supervisore migliore.
    - Selezione del runtime: Node (consigliato; richiesto per WhatsApp e Telegram). Bun non è consigliato.

  </Step>
  <Step title="Controllo di integrità">
    - Avvia il Gateway (se necessario) ed esegue `openclaw health`.
    - `openclaw status --deep` aggiunge la probe di integrità del Gateway live all'output di stato, incluse le probe dei canali quando supportate.

  </Step>
  <Step title="Skills">
    - Legge le Skills disponibili e verifica i requisiti.
    - Ti permette di scegliere il gestore Node: npm, pnpm o bun.
    - Installa dipendenze facoltative (alcune usano Homebrew su macOS).

  </Step>
  <Step title="Fine">
    - Riepilogo e passaggi successivi, incluse le opzioni per le app iOS, Android e macOS.

  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, il wizard stampa istruzioni di port forwarding SSH per la Control UI invece di aprire un browser.
Se mancano le risorse della Control UI, il wizard tenta di compilarle; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
</Note>

## Dettagli della modalità remota

La modalità remota configura questa macchina per connettersi a un Gateway altrove.

<Info>
La modalità remota non installa né modifica nulla sull'host remoto.
</Info>

Cosa imposti:

- URL del Gateway remoto (`ws://...`)
- Token se è richiesta l'autenticazione del Gateway remoto (consigliato)

<Note>
- Se il Gateway è solo loopback, usa tunneling SSH o una tailnet.
- Suggerimenti di discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opzioni di autenticazione e modello

<AccordionGroup>
  <Accordion title="Chiave API Anthropic">
    Usa `ANTHROPIC_API_KEY` se presente oppure richiede una chiave, poi la salva per l'uso del daemon.
  </Accordion>
  <Accordion title="Abbonamento OpenAI Code (OAuth)">
    Flusso via browser; incolla `code#state`.

    Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o è già della famiglia OpenAI.

  </Accordion>
  <Accordion title="Abbonamento OpenAI Code (pairing del dispositivo)">
    Flusso di pairing via browser con un codice dispositivo a breve durata.

    Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o è già della famiglia OpenAI.

  </Accordion>
  <Accordion title="Chiave API OpenAI">
    Usa `OPENAI_API_KEY` se presente oppure richiede una chiave, poi memorizza la credenziale nei profili di autenticazione.

    Imposta `agents.defaults.model` su `openai/gpt-5.5` quando il modello non è impostato, è `openai/*` o `openai-codex/*`.

  </Accordion>
  <Accordion title="Chiave API xAI (Grok)">
    Richiede `XAI_API_KEY` e configura xAI come provider di modelli.
  </Accordion>
  <Accordion title="OpenCode">
    Richiede `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) e ti permette di scegliere il catalogo Zen o Go.
    URL di configurazione: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chiave API (generica)">
    Salva la chiave per te.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Richiede `AI_GATEWAY_API_KEY`.
    Maggiori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Richiede account ID, gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configurazione viene scritta automaticamente. Il valore predefinito hosted è `MiniMax-M2.7`; la configurazione con chiave API usa
    `minimax/...`, e la configurazione OAuth usa `minimax-portal/...`.
    Maggiori dettagli: [MiniMax](/it/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint Cina o globali.
    Standard attualmente include `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    Maggiori dettagli: [StepFun](/it/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatibile Anthropic)">
    Richiede `SYNTHETIC_API_KEY`.
    Maggiori dettagli: [Synthetic](/it/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelli aperti cloud e locali)">
    Prima richiede `Cloud + Local`, `Cloud only` oppure `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Le modalità supportate dall'host richiedono l'URL base (predefinito `http://127.0.0.1:11434`), rilevano i modelli disponibili e suggeriscono i valori predefiniti.
    `Cloud + Local` verifica anche se quell'host Ollama ha effettuato l'accesso per l'accesso cloud.
    Maggiori dettagli: [Ollama](/it/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    Le configurazioni Moonshot (Kimi K2) e Kimi Coding vengono scritte automaticamente.
    Maggiori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot).
  </Accordion>
  <Accordion title="Provider personalizzato">
    Funziona con endpoint compatibili con OpenAI e compatibili con Anthropic.

    L'onboarding interattivo supporta le stesse scelte di archiviazione della chiave API degli altri flussi provider con chiave API:
    - **Incolla ora la chiave API** (in chiaro)
    - **Usa riferimento secret** (riferimento env o provider configurato, con validazione preflight)

    Flag non interattivi:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opzionale; usa `CUSTOM_API_KEY` come fallback)
    - `--custom-provider-id` (opzionale)
    - `--custom-compatibility <openai|anthropic>` (opzionale; predefinito `openai`)

  </Accordion>
  <Accordion title="Salta">
    Lascia l'autenticazione non configurata.
  </Accordion>
</AccordionGroup>

Comportamento del modello:

- Scegli il modello predefinito dalle opzioni rilevate, oppure inserisci provider e modello manualmente.
- Quando l'onboarding parte da una scelta di autenticazione del provider, il selettore del modello preferisce
  automaticamente quel provider. Per Volcengine e BytePlus, la stessa preferenza
  corrisponde anche alle rispettive varianti coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se quel filtro del provider preferito sarebbe vuoto, il selettore torna al
  catalogo completo invece di non mostrare modelli.
- Il wizard esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'autenticazione.

Percorsi di credenziali e profili:

- Profili di autenticazione (chiavi API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importazione OAuth legacy: `~/.openclaw/credentials/oauth.json`

Modalità di archiviazione delle credenziali:

- Il comportamento predefinito dell'onboarding salva le chiavi API come valori in chiaro nei profili di autenticazione.
- `--secret-input-mode ref` abilita la modalità riferimento invece dell'archiviazione in chiaro della chiave.
  Nella configurazione interattiva puoi scegliere:
  - riferimento a variabile env (per esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - riferimento a provider configurato (`file` o `exec`) con alias + id del provider
- La modalità riferimento interattiva esegue una rapida validazione preflight prima del salvataggio.
  - Riferimenti env: valida il nome della variabile + valore non vuoto nell'ambiente di onboarding corrente.
  - Riferimenti provider: valida la configurazione del provider e risolve l'id richiesto.
  - Se il preflight fallisce, l'onboarding mostra l'errore e ti permette di riprovare.
- In modalità non interattiva, `--secret-input-mode ref` è supportato solo tramite env.
  - Imposta la variabile env del provider nell'ambiente del processo di onboarding.
  - I flag della chiave inline (per esempio `--openai-api-key`) richiedono che quella variabile env sia impostata; altrimenti l'onboarding fallisce immediatamente.
  - Per i provider personalizzati, la modalità `ref` non interattiva memorizza `models.providers.<id>.apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In quel caso di provider personalizzato, `--custom-api-key` richiede che `CUSTOM_API_KEY` sia impostata; altrimenti l'onboarding fallisce immediatamente.
- Le credenziali auth del Gateway supportano scelte in chiaro e SecretRef nella configurazione interattiva:
  - Modalità token: **Genera/memorizza token in chiaro** (predefinito) oppure **Usa SecretRef**.
  - Modalità password: in chiaro o SecretRef.
- Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
- Le configurazioni esistenti in chiaro continuano a funzionare senza modifiche.

<Note>
Suggerimento per ambienti headless e server: completa OAuth su una macchina con browser, poi copia
l'`auth-profiles.json` di quell'agente (per esempio
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, oppure il corrispondente
percorso `$OPENCLAW_STATE_DIR/...`) sull'host Gateway. `credentials/oauth.json`
è solo una sorgente di importazione legacy.
</Note>

## Output e componenti interni

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando viene passato `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (se viene scelto MiniMax)
- `tools.profile` (l'onboarding locale usa per impostazione predefinita `"coding"` quando non è impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (modalità, bind, auth, Tailscale)
- `session.dmScope` (l'onboarding locale imposta come predefinito `per-channel-peer` quando non è impostato; i valori espliciti esistenti vengono preservati)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist dei canali (Slack, Discord, Matrix, Microsoft Teams) quando scegli di abilitarle durante i prompt (i nomi vengono risolti in ID quando possibile)
- `skills.install.nodeManager`
  - Il flag `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque impostare in seguito `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` scrive `agents.list[]` e `bindings` opzionali.

Le credenziali WhatsApp vengono salvate in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni vengono archiviate in `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alcuni canali vengono distribuiti come Plugin. Quando vengono selezionati durante la configurazione, il wizard
richiede di installare il Plugin (npm o percorso locale) prima della configurazione del canale.
</Note>

RPC del wizard Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

I client (app macOS e Control UI) possono visualizzare i passaggi senza reimplementare la logica di onboarding.

Comportamento della configurazione di Signal:

- Scarica la release asset appropriata
- La salva in `~/.openclaw/tools/signal-cli/<version>/`
- Scrive `channels.signal.cliPath` nella configurazione
- Le build JVM richiedono Java 21
- Le build native vengono usate quando disponibili
- Windows usa WSL2 e segue il flusso Linux `signal-cli` all'interno di WSL

## Documentazione correlata

- Hub dell'onboarding: [Onboarding (CLI)](/it/start/wizard)
- Automazione e script: [Automazione CLI](/it/start/wizard-cli-automation)
- Riferimento ai comandi: [`openclaw onboard`](/it/cli/onboard)
