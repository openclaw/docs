---
read_when:
    - Ti serve il comportamento dettagliato di openclaw onboard
    - Stai facendo debug dei risultati di onboarding o integrando client di onboarding
sidebarTitle: CLI reference
summary: Riferimento completo del flusso di setup CLI, configurazione auth/modello, output e componenti interni
title: Riferimento del setup CLI
x-i18n:
    generated_at: "2026-04-23T08:36:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60b47a3cd7eaa6e10b5e7108ba4eb331afddffa55a321eac98243611fd7e721b
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Riferimento del setup CLI

Questa pagina è il riferimento completo per `openclaw onboard`.
Per la guida breve, vedi [Onboarding (CLI)](/it/start/wizard).

## Cosa fa la procedura guidata

La modalità locale (predefinita) ti guida attraverso:

- Configurazione di modello e autenticazione (OAuth di OpenAI Code subscription, Anthropic Claude CLI o chiave API, più opzioni MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Posizione del workspace e file bootstrap
- Impostazioni del Gateway (porta, bind, autenticazione, Tailscale)
- Canali e provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles e altri plugin di canale inclusi)
- Installazione del demone (LaunchAgent, unità utente systemd o Scheduled Task nativa di Windows con fallback alla cartella Startup)
- Health check
- Configurazione delle Skills

La modalità remota configura questa macchina per connettersi a un gateway altrove.
Non installa né modifica nulla sull'host remoto.

## Dettagli del flusso locale

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se `~/.openclaw/openclaw.json` esiste, scegli tra Keep, Modify o Reset.
    - Eseguire di nuovo la procedura guidata non cancella nulla a meno che tu non scelga esplicitamente Reset (o passi `--reset`).
    - La CLI `--reset` usa come valore predefinito `config+creds+sessions`; usa `--reset-scope full` per rimuovere anche il workspace.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si ferma e ti chiede di eseguire `openclaw doctor` prima di continuare.
    - Reset usa `trash` e offre questi ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reset completo (rimuove anche il workspace)
  </Step>
  <Step title="Modello e autenticazione">
    - La matrice completa delle opzioni è in [Opzioni di autenticazione e modello](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Predefinito `~/.openclaw/workspace` (configurabile).
    - Popola i file del workspace necessari per il rituale bootstrap del primo avvio.
    - Layout del workspace: [Agent workspace](/it/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Richiede porta, bind, modalità di autenticazione ed esposizione Tailscale.
    - Consigliato: mantieni abilitata l'autenticazione token anche per loopback così i client WS locali devono autenticarsi.
    - In modalità token, il setup interattivo offre:
      - **Generate/store plaintext token** (predefinito)
      - **Use SecretRef** (opt-in)
    - In modalità password, il setup interattivo supporta anche l'archiviazione in testo semplice o SecretRef.
    - Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile env non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'autenticazione solo se ti fidi completamente di ogni processo locale.
    - I bind non loopback richiedono comunque autenticazione.
  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): login QR facoltativo
    - [Telegram](/it/channels/telegram): token bot
    - [Discord](/it/channels/discord): token bot
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + audience webhook
    - [Mattermost](/it/channels/mattermost): token bot + URL base
    - [Signal](/it/channels/signal): installazione facoltativa di `signal-cli` + configurazione account
    - [BlueBubbles](/it/channels/bluebubbles): consigliato per iMessage; URL server + password + webhook
    - [iMessage](/it/channels/imessage): percorso CLI legacy `imsg` + accesso DB
    - Sicurezza DM: il valore predefinito è pairing. Il primo DM invia un codice; approvalo tramite
      `openclaw pairing approve <channel> <code>` oppure usa allowlist.
  </Step>
  <Step title="Installazione del demone">
    - macOS: LaunchAgent
      - Richiede una sessione utente con login; per ambienti headless, usa un LaunchDaemon personalizzato (non incluso).
    - Linux e Windows tramite WSL2: unità utente systemd
      - La procedura guidata prova a eseguire `loginctl enable-linger <user>` così il gateway resta attivo dopo il logout.
      - Può richiedere sudo (scrive in `/var/lib/systemd/linger`); prima prova senza sudo.
    - Windows nativo: prima Scheduled Task
      - Se la creazione della task viene negata, OpenClaw torna a un elemento di login per utente nella cartella Startup e avvia subito il gateway.
      - Le Scheduled Task restano preferite perché forniscono uno stato del supervisore migliore.
    - Selezione runtime: Node (consigliato; richiesto per WhatsApp e Telegram). Bun non è consigliato.
  </Step>
  <Step title="Health check">
    - Avvia il gateway (se necessario) ed esegue `openclaw health`.
    - `openclaw status --deep` aggiunge all'output di stato la probe live di health del gateway, comprese le probe dei canali quando supportate.
  </Step>
  <Step title="Skills">
    - Legge le Skills disponibili e controlla i requisiti.
    - Ti permette di scegliere il gestore Node: npm, pnpm o bun.
    - Installa dipendenze facoltative (alcune usano Homebrew su macOS).
  </Step>
  <Step title="Fine">
    - Riepilogo e passaggi successivi, incluse opzioni per app iOS, Android e macOS.
  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, la procedura guidata stampa istruzioni per il port-forward SSH della Control UI invece di aprire un browser.
Se mancano gli asset della Control UI, la procedura guidata tenta di compilarli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
</Note>

## Dettagli della modalità remota

La modalità remota configura questa macchina per connettersi a un gateway altrove.

<Info>
La modalità remota non installa né modifica nulla sull'host remoto.
</Info>

Cosa imposti:

- URL del gateway remoto (`ws://...`)
- Token se il gateway remoto richiede autenticazione (consigliato)

<Note>
- Se il gateway è solo loopback, usa tunneling SSH o una tailnet.
- Suggerimenti di discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opzioni di autenticazione e modello

<AccordionGroup>
  <Accordion title="Chiave API Anthropic">
    Usa `ANTHROPIC_API_KEY` se presente oppure richiede una chiave, quindi la salva per l'uso del demone.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Flusso browser; incolla `code#state`.

    Imposta `agents.defaults.model` su `openai-codex/gpt-5.4` quando il modello non è impostato oppure è `openai/*`.

  </Accordion>
  <Accordion title="OpenAI Code subscription (pairing del dispositivo)">
    Flusso di pairing nel browser con un codice dispositivo a breve durata.

    Imposta `agents.defaults.model` su `openai-codex/gpt-5.4` quando il modello non è impostato oppure è `openai/*`.

  </Accordion>
  <Accordion title="Chiave API OpenAI">
    Usa `OPENAI_API_KEY` se presente oppure richiede una chiave, quindi memorizza la credenziale nei profili di autenticazione.

    Imposta `agents.defaults.model` su `openai/gpt-5.4` quando il modello non è impostato, è `openai/*` oppure `openai-codex/*`.

  </Accordion>
  <Accordion title="Chiave API xAI (Grok)">
    Richiede `XAI_API_KEY` e configura xAI come provider di modelli.
  </Accordion>
  <Accordion title="OpenCode">
    Richiede `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`) e ti permette di scegliere il catalogo Zen o Go.
    URL di configurazione: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chiave API (generica)">
    Memorizza la chiave per te.
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
    `minimax/...`, e la configurazione OAuth usa `minimax-portal/...`.
    Maggiori dettagli: [MiniMax](/it/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint Cina o globali.
    Standard attualmente include `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    Maggiori dettagli: [StepFun](/it/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatibile con Anthropic)">
    Richiede `SYNTHETIC_API_KEY`.
    Maggiori dettagli: [Synthetic](/it/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud e modelli aperti locali)">
    Richiede prima `Cloud + Local`, `Cloud only` oppure `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Le modalità supportate dall'host richiedono base URL (predefinito `http://127.0.0.1:11434`), individuano i modelli disponibili e suggeriscono i valori predefiniti.
    `Cloud + Local` controlla anche se quell'host Ollama ha effettuato l'accesso per l'accesso cloud.
    Maggiori dettagli: [Ollama](/it/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    Le configurazioni Moonshot (Kimi K2) e Kimi Coding vengono scritte automaticamente.
    Maggiori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot).
  </Accordion>
  <Accordion title="Provider personalizzato">
    Funziona con endpoint compatibili con OpenAI e compatibili con Anthropic.

    L'onboarding interattivo supporta le stesse opzioni di archiviazione delle chiavi API degli altri flussi con chiave API del provider:
    - **Paste API key now** (testo semplice)
    - **Use secret reference** (riferimento env o riferimento provider configurato, con validazione preliminare)

    Flag non interattivi:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facoltativo; usa come fallback `CUSTOM_API_KEY`)
    - `--custom-provider-id` (facoltativo)
    - `--custom-compatibility <openai|anthropic>` (facoltativo; predefinito `openai`)

  </Accordion>
  <Accordion title="Salta">
    Lascia l'autenticazione non configurata.
  </Accordion>
</AccordionGroup>

Comportamento del modello:

- Scegli il modello predefinito dalle opzioni rilevate, oppure inserisci manualmente provider e modello.
- Quando l'onboarding parte da una scelta di autenticazione del provider, il model picker preferisce
  automaticamente quel provider. Per Volcengine e BytePlus, la stessa preferenza
  corrisponde anche alle loro varianti coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se quel filtro del provider preferito sarebbe vuoto, il picker torna all'intero catalogo invece di non mostrare modelli.
- La procedura guidata esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'autenticazione.

Percorsi di credenziali e profili:

- Profili di autenticazione (chiavi API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import OAuth legacy: `~/.openclaw/credentials/oauth.json`

Modalità di archiviazione delle credenziali:

- Il comportamento predefinito dell'onboarding mantiene le chiavi API come valori in testo semplice nei profili di autenticazione.
- `--secret-input-mode ref` abilita la modalità di riferimento invece dell'archiviazione in testo semplice delle chiavi.
  Nel setup interattivo, puoi scegliere tra:
  - riferimento a variabile d'ambiente (per esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - riferimento a provider configurato (`file` o `exec`) con alias provider + id
- La modalità interattiva di riferimento esegue una validazione preliminare rapida prima del salvataggio.
  - Riferimenti env: valida il nome della variabile + il valore non vuoto nell'ambiente corrente di onboarding.
  - Riferimenti provider: valida la configurazione del provider e risolve l'id richiesto.
  - Se il preflight fallisce, l'onboarding mostra l'errore e ti permette di riprovare.
- In modalità non interattiva, `--secret-input-mode ref` è supportata solo da env.
  - Imposta la variabile env del provider nell'ambiente del processo di onboarding.
  - I flag di chiave inline (per esempio `--openai-api-key`) richiedono che quella variabile env sia impostata; altrimenti l'onboarding fallisce immediatamente.
  - Per i provider personalizzati, la modalità non interattiva `ref` memorizza `models.providers.<id>.apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In quel caso del provider personalizzato, `--custom-api-key` richiede che `CUSTOM_API_KEY` sia impostato; altrimenti l'onboarding fallisce immediatamente.
- Le credenziali di autenticazione del Gateway supportano scelte in testo semplice e SecretRef nel setup interattivo:
  - Modalità token: **Generate/store plaintext token** (predefinita) oppure **Use SecretRef**.
  - Modalità password: testo semplice oppure SecretRef.
- Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
- Le configurazioni esistenti in testo semplice continuano a funzionare senza modifiche.

<Note>
Suggerimento per ambienti headless e server: completa OAuth su una macchina con browser, poi copia
l'`auth-profiles.json` di quell'agente (per esempio
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, oppure il percorso corrispondente
`$OPENCLAW_STATE_DIR/...`) sull'host del gateway. `credentials/oauth.json`
è solo una sorgente legacy per l'import.
</Note>

## Output e componenti interni

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se viene scelto Minimax)
- `tools.profile` (l'onboarding locale usa come valore predefinito `"coding"` quando non impostato; i valori espliciti esistenti vengono conservati)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (l'onboarding locale usa come valore predefinito `per-channel-peer` quando non impostato; i valori espliciti esistenti vengono conservati)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist dei canali (Slack, Discord, Matrix, Microsoft Teams) quando scegli l'opt-in durante i prompt (i nomi vengono risolti in ID quando possibile)
- `skills.install.nodeManager`
  - Il flag `setup --node-manager` accetta `npm`, `pnpm` oppure `bun`.
  - La configurazione manuale può comunque impostare più tardi `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` scrive `agents.list[]` e `bindings` facoltativi.

Le credenziali WhatsApp vengono salvate in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni vengono salvate in `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alcuni canali vengono distribuiti come plugin. Quando vengono selezionati durante il setup, la procedura guidata
richiede di installare il plugin (npm o percorso locale) prima della configurazione del canale.
</Note>

RPC della procedura guidata del Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

I client (app macOS e Control UI) possono renderizzare i passaggi senza reimplementare la logica di onboarding.

Comportamento del setup Signal:

- Scarica l'asset di release appropriato
- Lo salva in `~/.openclaw/tools/signal-cli/<version>/`
- Scrive `channels.signal.cliPath` nella configurazione
- Le build JVM richiedono Java 21
- Le build native vengono usate quando disponibili
- Windows usa WSL2 e segue il flusso Linux di signal-cli dentro WSL

## Documentazione correlata

- Hub onboarding: [Onboarding (CLI)](/it/start/wizard)
- Automazione e script: [CLI Automation](/it/start/wizard-cli-automation)
- Riferimento comandi: [`openclaw onboard`](/it/cli/onboard)
