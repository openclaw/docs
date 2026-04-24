---
read_when:
    - Hai bisogno del comportamento dettagliato di openclaw onboard
    - Stai eseguendo il debug dei risultati dell'onboarding o integrando client di onboarding
sidebarTitle: CLI reference
summary: Riferimento completo del flusso di setup CLI, della configurazione auth/modello, degli output e degli aspetti interni
title: Riferimento della configurazione CLI
x-i18n:
    generated_at: "2026-04-24T09:03:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Questa pagina è il riferimento completo per `openclaw onboard`.
Per la guida breve, vedi [Onboarding (CLI)](/it/start/wizard).

## Cosa fa il wizard

La modalità locale (predefinita) ti guida attraverso:

- Configurazione di modello e auth (OpenAI Code subscription OAuth, Anthropic Claude CLI o chiave API, più opzioni MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Posizione dello spazio di lavoro e file bootstrap
- Impostazioni del Gateway (porta, bind, auth, tailscale)
- Canali e provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles e altri plugin di canale bundled)
- Installazione del demone (LaunchAgent, unit systemd utente o Scheduled Task nativo Windows con fallback cartella Startup)
- Controllo di salute
- Configurazione delle Skills

La modalità remota configura questa macchina per connettersi a un gateway altrove.
Non installa né modifica nulla sull'host remoto.

## Dettagli del flusso locale

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se esiste `~/.openclaw/openclaw.json`, scegli Keep, Modify oppure Reset.
    - Rieseguire il wizard non cancella nulla a meno che tu non scelga esplicitamente Reset (o passi `--reset`).
    - `--reset` da CLI usa come predefinito `config+creds+sessions`; usa `--reset-scope full` per rimuovere anche lo spazio di lavoro.
    - Se la configurazione non è valida o contiene chiavi legacy, il wizard si ferma e ti chiede di eseguire `openclaw doctor` prima di continuare.
    - Il reset usa `trash` e offre gli ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reset completo (rimuove anche lo spazio di lavoro)
  </Step>
  <Step title="Modello e auth">
    - La matrice completa delle opzioni è in [Opzioni auth e modello](#auth-and-model-options).
  </Step>
  <Step title="Spazio di lavoro">
    - Predefinito `~/.openclaw/workspace` (configurabile).
    - Inizializza i file dello spazio di lavoro necessari per il rituale bootstrap del primo avvio.
    - Layout dello spazio di lavoro: [Spazio di lavoro dell'agente](/it/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Chiede porta, bind, modalità auth ed esposizione tailscale.
    - Consigliato: mantieni abilitata l'auth con token anche per loopback così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Generate/store plaintext token** (predefinito)
      - **Use SecretRef** (opt-in)
    - In modalità password, la configurazione interattiva supporta anche archiviazione plaintext o SecretRef.
    - Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile env non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'auth solo se ti fidi completamente di ogni processo locale.
    - I bind non-loopback richiedono comunque auth.
  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): login QR facoltativo
    - [Telegram](/it/channels/telegram): token bot
    - [Discord](/it/channels/discord): token bot
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + audience webhook
    - [Mattermost](/it/channels/mattermost): token bot + URL base
    - [Signal](/it/channels/signal): installazione facoltativa di `signal-cli` + configurazione account
    - [BlueBubbles](/it/channels/bluebubbles): consigliato per iMessage; URL server + password + webhook
    - [iMessage](/it/channels/imessage): percorso legacy CLI `imsg` + accesso DB
    - Sicurezza DM: il valore predefinito è pairing. Il primo DM invia un codice; approva con
      `openclaw pairing approve <channel> <code>` oppure usa allowlist.
  </Step>
  <Step title="Installazione del demone">
    - macOS: LaunchAgent
      - Richiede una sessione utente con login; per headless, usa un LaunchDaemon personalizzato (non distribuito).
    - Linux e Windows tramite WSL2: unit systemd utente
      - Il wizard tenta `loginctl enable-linger <user>` così il gateway resta attivo dopo il logout.
      - Potrebbe richiedere sudo (scrive in `/var/lib/systemd/linger`); prova prima senza sudo.
    - Windows nativo: prima Scheduled Task
      - Se la creazione del task viene negata, OpenClaw usa come fallback una login item per utente nella cartella Startup e avvia immediatamente il gateway.
      - Gli Scheduled Task restano preferiti perché forniscono uno stato del supervisore migliore.
    - Selezione runtime: Node (consigliato; richiesto per WhatsApp e Telegram). Bun non è consigliato.
  </Step>
  <Step title="Controllo di salute">
    - Avvia il gateway (se necessario) ed esegue `openclaw health`.
    - `openclaw status --deep` aggiunge il probe live di salute del gateway all'output di stato, inclusi i probe dei canali quando supportati.
  </Step>
  <Step title="Skills">
    - Legge le Skills disponibili e controlla i requisiti.
    - Ti consente di scegliere il node manager: npm, pnpm oppure bun.
    - Installa dipendenze facoltative (alcune usano Homebrew su macOS).
  </Step>
  <Step title="Fine">
    - Riepilogo e passaggi successivi, incluse opzioni per app iOS, Android e macOS.
  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, il wizard stampa istruzioni di port-forward SSH per la Control UI invece di aprire un browser.
Se gli asset della Control UI mancano, il wizard tenta di costruirli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
</Note>

## Dettagli della modalità remota

La modalità remota configura questa macchina per connettersi a un gateway altrove.

<Info>
La modalità remota non installa né modifica nulla sull'host remoto.
</Info>

Cosa imposti:

- URL del gateway remoto (`ws://...`)
- Token se il gateway remoto richiede auth (consigliato)

<Note>
- Se il gateway è solo loopback, usa tunneling SSH o una tailnet.
- Suggerimenti di discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opzioni auth e modello

<AccordionGroup>
  <Accordion title="Chiave API Anthropic">
    Usa `ANTHROPIC_API_KEY` se presente oppure chiede una chiave, poi la salva per l'uso del demone.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Flusso browser; incolla `code#state`.

    Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.

  </Accordion>
  <Accordion title="OpenAI Code subscription (pairing del dispositivo)">
    Flusso di pairing via browser con un codice dispositivo a breve durata.

    Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.

  </Accordion>
  <Accordion title="Chiave API OpenAI">
    Usa `OPENAI_API_KEY` se presente oppure chiede una chiave, poi archivia la credenziale nei profili auth.

    Imposta `agents.defaults.model` su `openai/gpt-5.4` quando il modello non è impostato, è `openai/*` oppure `openai-codex/*`.

  </Accordion>
  <Accordion title="Chiave API xAI (Grok)">
    Chiede `XAI_API_KEY` e configura xAI come provider di modelli.
  </Accordion>
  <Accordion title="OpenCode">
    Chiede `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`) e ti consente di scegliere il catalogo Zen o Go.
    URL di configurazione: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chiave API (generica)">
    Archivia la chiave per te.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Chiede `AI_GATEWAY_API_KEY`.
    Maggiori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Chiede account ID, gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configurazione viene scritta automaticamente. Il valore predefinito hosted è `MiniMax-M2.7`; la configurazione con chiave API usa
    `minimax/...`, e la configurazione OAuth usa `minimax-portal/...`.
    Maggiori dettagli: [MiniMax](/it/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint Cina o globali.
    Lo standard attualmente include `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    Maggiori dettagli: [StepFun](/it/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatibile con Anthropic)">
    Chiede `SYNTHETIC_API_KEY`.
    Maggiori dettagli: [Synthetic](/it/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud e modelli locali aperti)">
    Chiede prima `Cloud + Local`, `Cloud only` oppure `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Le modalità supportate da host chiedono l'URL base (predefinito `http://127.0.0.1:11434`), rilevano i modelli disponibili e suggeriscono i valori predefiniti.
    `Cloud + Local` controlla anche se quell'host Ollama è autenticato per l'accesso cloud.
    Maggiori dettagli: [Ollama](/it/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    Le configurazioni Moonshot (Kimi K2) e Kimi Coding vengono scritte automaticamente.
    Maggiori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot).
  </Accordion>
  <Accordion title="Provider personalizzato">
    Funziona con endpoint compatibili con OpenAI e compatibili con Anthropic.

    L'onboarding interattivo supporta le stesse scelte di archiviazione della chiave API delle altre configurazioni provider:
    - **Paste API key now** (plaintext)
    - **Use secret reference** (ref env o provider ref configurato, con validazione preflight)

    Flag non interattivi:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facoltativo; usa come fallback `CUSTOM_API_KEY`)
    - `--custom-provider-id` (facoltativo)
    - `--custom-compatibility <openai|anthropic>` (facoltativo; predefinito `openai`)

  </Accordion>
  <Accordion title="Salta">
    Lascia l'auth non configurata.
  </Accordion>
</AccordionGroup>

Comportamento del modello:

- Scegli il modello predefinito dalle opzioni rilevate oppure inserisci manualmente provider e modello.
- Quando l'onboarding parte da una scelta auth del provider, il selettore del modello preferisce
  automaticamente quel provider. Per Volcengine e BytePlus, la stessa preferenza
  corrisponde anche alle loro varianti coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se quel filtro preferito per provider sarebbe vuoto, il selettore usa come fallback
  l'intero catalogo invece di non mostrare modelli.
- Il wizard esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'auth.

Percorsi di credenziali e profili:

- Profili auth (chiavi API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import OAuth legacy: `~/.openclaw/credentials/oauth.json`

Modalità di archiviazione delle credenziali:

- Il comportamento predefinito dell'onboarding persiste le chiavi API come valori plaintext nei profili auth.
- `--secret-input-mode ref` abilita la modalità reference invece dell'archiviazione plaintext della chiave.
  Nella configurazione interattiva puoi scegliere:
  - riferimento a variabile di ambiente (ad esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - riferimento a provider configurato (`file` oppure `exec`) con alias del provider + id
- La modalità reference interattiva esegue una rapida validazione preflight prima del salvataggio.
  - Ref env: convalida il nome della variabile + il valore non vuoto nell'ambiente corrente dell'onboarding.
  - Ref provider: convalida la configurazione del provider e risolve l'id richiesto.
  - Se il preflight fallisce, l'onboarding mostra l'errore e ti consente di riprovare.
- In modalità non interattiva, `--secret-input-mode ref` è supportata solo da env.
  - Imposta la variabile env del provider nell'ambiente del processo di onboarding.
  - I flag di chiave inline (ad esempio `--openai-api-key`) richiedono che quella variabile env sia impostata; altrimenti l'onboarding fallisce immediatamente.
  - Per i provider personalizzati, la modalità `ref` non interattiva archivia `models.providers.<id>.apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In quel caso di provider personalizzato, `--custom-api-key` richiede che `CUSTOM_API_KEY` sia impostata; altrimenti l'onboarding fallisce immediatamente.
- Le credenziali auth del Gateway supportano scelte plaintext e SecretRef nella configurazione interattiva:
  - Modalità token: **Generate/store plaintext token** (predefinito) oppure **Use SecretRef**.
  - Modalità password: plaintext oppure SecretRef.
- Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
- Le configurazioni plaintext esistenti continuano a funzionare senza modifiche.

<Note>
Suggerimento per headless e server: completa OAuth su una macchina con browser, poi copia
l'`auth-profiles.json` di quell'agente (ad esempio
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, oppure il percorso corrispondente
`$OPENCLAW_STATE_DIR/...`) sull'host del gateway. `credentials/oauth.json`
è solo una sorgente legacy di importazione.
</Note>

## Output e aspetti interni

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se è stato scelto Minimax)
- `tools.profile` (l'onboarding locale imposta come predefinito `"coding"` quando non è impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (l'onboarding locale imposta questo come `per-channel-peer` quando non è impostato; i valori espliciti esistenti vengono preservati)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist dei canali (Slack, Discord, Matrix, Microsoft Teams) quando fai opt-in durante i prompt (i nomi vengono risolti in ID quando possibile)
- `skills.install.nodeManager`
  - Il flag `setup --node-manager` accetta `npm`, `pnpm` oppure `bun`.
  - La configurazione manuale può comunque impostare successivamente `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` scrive `agents.list[]` e `bindings` facoltativi.

Le credenziali WhatsApp vengono archiviate sotto `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni sono archiviate sotto `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alcuni canali vengono distribuiti come plugin. Quando selezionati durante il setup, il wizard
chiede di installare il plugin (npm o percorso locale) prima della configurazione del canale.
</Note>

RPC del wizard del Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

I client (app macOS e Control UI) possono renderizzare i passaggi senza reimplementare la logica di onboarding.

Comportamento della configurazione Signal:

- Scarica l'asset di release appropriato
- Lo archivia sotto `~/.openclaw/tools/signal-cli/<version>/`
- Scrive `channels.signal.cliPath` nella configurazione
- Le build JVM richiedono Java 21
- Le build native vengono usate quando disponibili
- Windows usa WSL2 e segue il flusso Linux di signal-cli all'interno di WSL

## Documentazione correlata

- Hub onboarding: [Onboarding (CLI)](/it/start/wizard)
- Automazione e script: [Automazione CLI](/it/start/wizard-cli-automation)
- Riferimento comandi: [`openclaw onboard`](/it/cli/onboard)
