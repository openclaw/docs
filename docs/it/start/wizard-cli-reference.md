---
read_when:
    - Ti serve il comportamento dettagliato di openclaw onboard
    - Stai eseguendo il debug dei risultati dell'onboarding o integrando client di onboarding
sidebarTitle: CLI reference
summary: Riferimento completo per il flusso di configurazione della CLI, la configurazione di autenticazione/modelli, gli output e i meccanismi interni
title: Riferimento per la configurazione della CLI
x-i18n:
    generated_at: "2026-04-30T09:14:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Questa pagina è il riferimento completo per `openclaw onboard`.
Per la guida breve, consulta [Onboarding (CLI)](/it/start/wizard).

## Cosa fa la procedura guidata

La modalità locale (predefinita) ti guida attraverso:

- Configurazione del modello e dell'autenticazione (OAuth dell'abbonamento OpenAI Code, CLI Anthropic Claude o chiave API, più opzioni MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Posizione dello spazio di lavoro e file di bootstrap
- Impostazioni del Gateway (porta, bind, autenticazione, Tailscale)
- Canali e provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles e altri plugin di canale inclusi)
- Installazione del daemon (LaunchAgent, unità utente systemd o attività pianificata nativa di Windows con fallback alla cartella di Avvio)
- Controllo di integrità
- Configurazione delle Skills

La modalità remota configura questa macchina per connettersi a un gateway altrove.
Non installa né modifica nulla sull'host remoto.

## Dettagli del flusso locale

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se `~/.openclaw/openclaw.json` esiste, scegli Mantieni, Modifica o Reimposta.
    - Rieseguire la procedura guidata non cancella nulla, a meno che tu non scelga esplicitamente Reimposta (o passi `--reset`).
    - CLI `--reset` usa per impostazione predefinita `config+creds+sessions`; usa `--reset-scope full` per rimuovere anche lo spazio di lavoro.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si ferma e ti chiede di eseguire `openclaw doctor` prima di continuare.
    - La reimpostazione usa `trash` e offre gli ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reimpostazione completa (rimuove anche lo spazio di lavoro)

  </Step>
  <Step title="Modello e autenticazione">
    - La matrice completa delle opzioni è in [Opzioni di autenticazione e modello](#auth-and-model-options).

  </Step>
  <Step title="Spazio di lavoro">
    - Predefinito `~/.openclaw/workspace` (configurabile).
    - Inizializza i file dello spazio di lavoro necessari per il rituale di bootstrap al primo avvio.
    - Layout dello spazio di lavoro: [Spazio di lavoro dell'agente](/it/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Richiede porta, bind, modalità di autenticazione ed esposizione Tailscale.
    - Consigliato: mantieni l'autenticazione tramite token abilitata anche per loopback, così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/archivia token in testo semplice** (predefinito)
      - **Usa SecretRef** (opt-in)
    - In modalità password, la configurazione interattiva supporta anche archiviazione in testo semplice o SecretRef.
    - Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile d'ambiente non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'autenticazione solo se ti fidi completamente di ogni processo locale.
    - I bind non loopback richiedono comunque l'autenticazione.

  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): accesso QR opzionale
    - [Telegram](/it/channels/telegram): token del bot
    - [Discord](/it/channels/discord): token del bot
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + audience del webhook
    - [Mattermost](/it/channels/mattermost): token del bot + URL base
    - [Signal](/it/channels/signal): installazione opzionale di `signal-cli` + configurazione dell'account
    - [BlueBubbles](/it/channels/bluebubbles): consigliato per iMessage; URL del server + password + webhook
    - [iMessage](/it/channels/imessage): percorso legacy della CLI `imsg` + accesso al DB
    - Sicurezza DM: l'impostazione predefinita è l'abbinamento. Il primo DM invia un codice; approva tramite
      `openclaw pairing approve <channel> <code>` oppure usa allowlist.
  </Step>
  <Step title="Installazione del daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente con login effettuato; per ambienti headless, usa un LaunchDaemon personalizzato (non fornito).
    - Linux e Windows tramite WSL2: unità utente systemd
      - La procedura guidata tenta `loginctl enable-linger <user>` in modo che il gateway resti attivo dopo il logout.
      - Potrebbe richiedere sudo (scrive in `/var/lib/systemd/linger`); prova prima senza sudo.
    - Windows nativo: prima attività pianificata
      - Se la creazione dell'attività viene negata, OpenClaw ripiega su un elemento di accesso nella cartella di Avvio per utente e avvia immediatamente il gateway.
      - Le attività pianificate restano preferite perché forniscono uno stato di supervisione migliore.
    - Selezione del runtime: Node (consigliato; richiesto per WhatsApp e Telegram). Bun non è consigliato.

  </Step>
  <Step title="Controllo di integrità">
    - Avvia il gateway (se necessario) ed esegue `openclaw health`.
    - `openclaw status --deep` aggiunge il probe di integrità del gateway live all'output di stato, inclusi i probe dei canali quando supportati.

  </Step>
  <Step title="Skills">
    - Legge le skills disponibili e controlla i requisiti.
    - Ti consente di scegliere il gestore Node: npm, pnpm o bun.
    - Installa dipendenze opzionali (alcune usano Homebrew su macOS).

  </Step>
  <Step title="Fine">
    - Riepilogo e passaggi successivi, incluse le opzioni per le app iOS, Android e macOS.

  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, la procedura guidata stampa le istruzioni di port forwarding SSH per la Control UI invece di aprire un browser.
Se gli asset della Control UI mancano, la procedura guidata tenta di crearli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
</Note>

## Dettagli della modalità remota

La modalità remota configura questa macchina per connettersi a un gateway altrove.

<Info>
La modalità remota non installa né modifica nulla sull'host remoto.
</Info>

Cosa imposti:

- URL del gateway remoto (`ws://...`)
- Token se l'autenticazione del gateway remoto è richiesta (consigliato)

<Note>
- Se il gateway è solo loopback, usa tunneling SSH o una tailnet.
- Suggerimenti di discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opzioni di autenticazione e modello

<AccordionGroup>
  <Accordion title="Chiave API Anthropic">
    Usa `ANTHROPIC_API_KEY` se presente oppure richiede una chiave, poi la salva per l'uso da parte del daemon.
  </Accordion>
  <Accordion title="Abbonamento OpenAI Code (OAuth)">
    Flusso browser; incolla `code#state`.

    Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.

  </Accordion>
  <Accordion title="Abbonamento OpenAI Code (abbinamento dispositivo)">
    Flusso di abbinamento browser con un codice dispositivo di breve durata.

    Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.

  </Accordion>
  <Accordion title="Chiave API OpenAI">
    Usa `OPENAI_API_KEY` se presente oppure richiede una chiave, poi archivia la credenziale nei profili di autenticazione.

    Imposta `agents.defaults.model` su `openai/gpt-5.5` quando il modello non è impostato, è `openai/*` o `openai-codex/*`.

  </Accordion>
  <Accordion title="Chiave API xAI (Grok)">
    Richiede `XAI_API_KEY` e configura xAI come provider di modelli.
  </Accordion>
  <Accordion title="OpenCode">
    Richiede `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) e ti consente di scegliere il catalogo Zen o Go.
    URL di configurazione: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chiave API (generica)">
    Archivia la chiave per te.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Richiede `AI_GATEWAY_API_KEY`.
    Maggiori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Richiede ID account, ID gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configurazione viene scritta automaticamente. Il valore predefinito hosted è `MiniMax-M2.7`; la configurazione con chiave API usa
    `minimax/...`, mentre la configurazione OAuth usa `minimax-portal/...`.
    Maggiori dettagli: [MiniMax](/it/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint cinesi o globali.
    Standard attualmente include `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    Maggiori dettagli: [StepFun](/it/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatibile con Anthropic)">
    Richiede `SYNTHETIC_API_KEY`.
    Maggiori dettagli: [Synthetic](/it/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud e modelli aperti locali)">
    Richiede prima `Cloud + Local`, `Cloud only` o `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Le modalità supportate da host richiedono l'URL base (predefinito `http://127.0.0.1:11434`), rilevano i modelli disponibili e suggeriscono valori predefiniti.
    `Cloud + Local` controlla anche se quell'host Ollama ha effettuato l'accesso per l'accesso cloud.
    Maggiori dettagli: [Ollama](/it/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    Le configurazioni Moonshot (Kimi K2) e Kimi Coding vengono scritte automaticamente.
    Maggiori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot).
  </Accordion>
  <Accordion title="Provider personalizzato">
    Funziona con endpoint compatibili con OpenAI e compatibili con Anthropic.

    L'onboarding interattivo supporta le stesse scelte di archiviazione della chiave API degli altri flussi con chiave API del provider:
    - **Incolla ora la chiave API** (testo semplice)
    - **Usa riferimento segreto** (riferimento env o riferimento provider configurato, con validazione preflight)

    Flag non interattivi:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opzionale; ripiega su `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opzionale)
    - `--custom-compatibility <openai|anthropic>` (opzionale; predefinito `openai`)
    - `--custom-image-input` / `--custom-text-input` (opzionale; sovrascrive la capacità di input del modello dedotta)

  </Accordion>
  <Accordion title="Salta">
    Lascia l'autenticazione non configurata.
  </Accordion>
</AccordionGroup>

Comportamento del modello:

- Scegli il modello predefinito dalle opzioni rilevate oppure inserisci manualmente provider e modello.
- L'onboarding del provider personalizzato deduce il supporto alle immagini per gli ID modello comuni e chiede solo quando il nome del modello è sconosciuto.
- Quando l'onboarding parte da una scelta di autenticazione provider, il selettore del modello preferisce
  automaticamente quel provider. Per Volcengine e BytePlus, la stessa preferenza
  corrisponde anche alle loro varianti coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se quel filtro del provider preferito risultasse vuoto, il selettore ripiega sul
  catalogo completo invece di non mostrare alcun modello.
- La procedura guidata esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'autenticazione.

Percorsi di credenziali e profili:

- Profili di autenticazione (chiavi API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importazione OAuth legacy: `~/.openclaw/credentials/oauth.json`

Modalità di archiviazione delle credenziali:

- Il comportamento predefinito dell'onboarding persiste le chiavi API come valori in testo semplice nei profili di autenticazione.
- `--secret-input-mode ref` abilita la modalità riferimento invece dell'archiviazione della chiave in testo semplice.
  Nella configurazione interattiva, puoi scegliere:
  - riferimento a variabile d'ambiente (per esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - riferimento a provider configurato (`file` o `exec`) con alias provider + id
- La modalità riferimento interattiva esegue una rapida validazione preflight prima del salvataggio.
  - Riferimenti env: valida il nome della variabile + valore non vuoto nell'ambiente di onboarding corrente.
  - Riferimenti provider: valida la configurazione del provider e risolve l'id richiesto.
  - Se il preflight fallisce, l'onboarding mostra l'errore e ti consente di riprovare.
- In modalità non interattiva, `--secret-input-mode ref` è supportata solo da env.
  - Imposta la variabile d'ambiente del provider nell'ambiente del processo di onboarding.
  - I flag di chiave inline (per esempio `--openai-api-key`) richiedono che quella variabile d'ambiente sia impostata; altrimenti l'onboarding fallisce rapidamente.
  - Per i provider personalizzati, la modalità `ref` non interattiva archivia `models.providers.<id>.apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In quel caso di provider personalizzato, `--custom-api-key` richiede che `CUSTOM_API_KEY` sia impostata; altrimenti l'onboarding fallisce rapidamente.
- Le credenziali di autenticazione del Gateway supportano scelte in testo semplice e SecretRef nella configurazione interattiva:
  - Modalità token: **Genera/archivia token in testo semplice** (predefinito) o **Usa SecretRef**.
  - Modalità password: testo semplice o SecretRef.
- Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
- Le configurazioni in testo semplice esistenti continuano a funzionare senza modifiche.

<Note>
Suggerimento per headless e server: completa OAuth su una macchina con un browser, quindi copia
l'`auth-profiles.json` di quell'agente (ad esempio
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o il percorso corrispondente
`$OPENCLAW_STATE_DIR/...`) sull'host del Gateway. `credentials/oauth.json`
è solo una sorgente di importazione legacy.
</Note>

## Output e dettagli interni

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando viene passato `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (se è stato scelto Minimax)
- `tools.profile` (l'onboarding locale usa `"coding"` come predefinito quando non impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (modalità, bind, autenticazione, tailscale)
- `session.dmScope` (l'onboarding locale imposta questo valore su `per-channel-peer` quando non impostato; i valori espliciti esistenti vengono preservati)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Elenchi consentiti dei canali (Slack, Discord, Matrix, Microsoft Teams) quando scegli di abilitarli durante i prompt (i nomi vengono risolti in ID quando possibile)
- `skills.install.nodeManager`
  - Il flag `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque impostare `skills.install.nodeManager: "yarn"` in seguito.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` scrive `agents.list[]` e `bindings` opzionali.

Le credenziali WhatsApp vanno in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni sono archiviate in `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alcuni canali vengono distribuiti come plugin. Quando vengono selezionati durante la configurazione, la procedura guidata
richiede di installare il plugin (npm o percorso locale) prima della configurazione del canale.
</Note>

RPC della procedura guidata del Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

I client (app macOS e UI di controllo) possono visualizzare i passaggi senza reimplementare la logica di onboarding.

Comportamento della configurazione di Signal:

- Scarica l'asset della release appropriato
- Lo archivia in `~/.openclaw/tools/signal-cli/<version>/`
- Scrive `channels.signal.cliPath` nella configurazione
- Le build JVM richiedono Java 21
- Le build native vengono usate quando disponibili
- Windows usa WSL2 e segue il flusso signal-cli di Linux all'interno di WSL

## Documenti correlati

- Hub di onboarding: [Onboarding (CLI)](/it/start/wizard)
- Automazione e script: [Automazione CLI](/it/start/wizard-cli-automation)
- Riferimento dei comandi: [`openclaw onboard`](/it/cli/onboard)
