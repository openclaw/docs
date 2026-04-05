---
read_when:
    - Hai bisogno del comportamento dettagliato di `openclaw onboard`
    - Stai eseguendo il debug dei risultati di onboarding o integrando client di onboarding
sidebarTitle: CLI reference
summary: Riferimento completo per il flusso di configurazione della CLI, configurazione di auth/modelli, output e aspetti interni
title: Riferimento per la configurazione della CLI
x-i18n:
    generated_at: "2026-04-05T14:05:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ec4e685e3237e450d11c45826c2bb34b82c0bba1162335f8fbb07f51ba00a70
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Riferimento per la configurazione della CLI

Questa pagina è il riferimento completo per `openclaw onboard`.
Per la guida breve, vedi [Onboarding (CLI)](/start/wizard).

## Cosa fa la procedura guidata

La modalità locale (predefinita) ti guida attraverso:

- Configurazione del modello e dell'autenticazione (OAuth dell'abbonamento OpenAI Code, Anthropic Claude CLI o chiave API, oltre alle opzioni MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Posizione del workspace e file bootstrap
- Impostazioni del gateway (porta, bind, auth, tailscale)
- Canali e provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles e altri plugin di canale inclusi)
- Installazione del daemon (LaunchAgent, unità utente systemd o attività pianificata nativa di Windows con fallback nella cartella Startup)
- Controllo di integrità
- Configurazione delle Skills

La modalità remota configura questa macchina per connettersi a un gateway altrove.
Non installa né modifica nulla sull'host remoto.

## Dettagli del flusso locale

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se esiste `~/.openclaw/openclaw.json`, scegli Mantieni, Modifica o Reimposta.
    - Rieseguire la procedura guidata non cancella nulla a meno che tu non scelga esplicitamente Reimposta (o passi `--reset`).
    - La CLI `--reset` usa come impostazione predefinita `config+creds+sessions`; usa `--reset-scope full` per rimuovere anche il workspace.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si interrompe e ti chiede di eseguire `openclaw doctor` prima di continuare.
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
    - Inizializza i file del workspace necessari per il rituale bootstrap della prima esecuzione.
    - Layout del workspace: [Workspace dell'agente](/it/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Chiede porta, bind, modalità auth ed esposizione tailscale.
    - Consigliato: lasciare abilitata l'autenticazione tramite token anche per loopback, così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/memorizza token in chiaro** (predefinito)
      - **Usa SecretRef** (facoltativo)
    - In modalità password, la configurazione interattiva supporta anche l'archiviazione in chiaro o SecretRef.
    - Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile d'ambiente non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'auth solo se ti fidi completamente di ogni processo locale.
    - I bind non loopback richiedono comunque l'auth.
  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): login QR facoltativo
    - [Telegram](/it/channels/telegram): token bot
    - [Discord](/it/channels/discord): token bot
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + audience del webhook
    - [Mattermost](/it/channels/mattermost): token bot + URL di base
    - [Signal](/it/channels/signal): installazione facoltativa di `signal-cli` + configurazione dell'account
    - [BlueBubbles](/it/channels/bluebubbles): consigliato per iMessage; URL del server + password + webhook
    - [iMessage](/it/channels/imessage): percorso legacy della CLI `imsg` + accesso al DB
    - Sicurezza dei DM: il valore predefinito è l'associazione. Il primo DM invia un codice; approvalo con
      `openclaw pairing approve <channel> <code>` oppure usa allowlist.
  </Step>
  <Step title="Installazione del daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente con accesso effettuato; per ambienti headless, usa un LaunchDaemon personalizzato (non fornito).
    - Linux e Windows tramite WSL2: unità utente systemd
      - La procedura guidata prova a eseguire `loginctl enable-linger <user>` così il gateway resta attivo dopo il logout.
      - Potrebbe richiedere sudo (scrive in `/var/lib/systemd/linger`); prova prima senza sudo.
    - Windows nativo: prima Attività pianificata
      - Se la creazione dell'attività viene negata, OpenClaw usa come fallback un elemento di accesso per utente nella cartella Startup e avvia immediatamente il gateway.
      - Le Attività pianificate restano preferibili perché forniscono uno stato del supervisore migliore.
    - Selezione del runtime: Node (consigliato; richiesto per WhatsApp e Telegram). Bun non è consigliato.
  </Step>
  <Step title="Controllo di integrità">
    - Avvia il gateway (se necessario) ed esegue `openclaw health`.
    - `openclaw status --deep` aggiunge il probe di integrità live del gateway all'output di stato, inclusi i probe dei canali quando supportati.
  </Step>
  <Step title="Skills">
    - Legge le Skills disponibili e controlla i requisiti.
    - Ti permette di scegliere il gestore Node: npm, pnpm o bun.
    - Installa dipendenze facoltative (alcune usano Homebrew su macOS).
  </Step>
  <Step title="Fine">
    - Riepilogo e passaggi successivi, incluse le opzioni per le app iOS, Android e macOS.
  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, la procedura guidata stampa le istruzioni per il port forwarding SSH per la Control UI invece di aprire un browser.
Se le risorse della Control UI non sono presenti, la procedura guidata prova a compilarle; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze della UI).
</Note>

## Dettagli della modalità remota

La modalità remota configura questa macchina per connettersi a un gateway altrove.

<Info>
La modalità remota non installa né modifica nulla sull'host remoto.
</Info>

Cosa configuri:

- URL del gateway remoto (`ws://...`)
- Token se è richiesta l'auth del gateway remoto (consigliato)

<Note>
- Se il gateway è solo loopback, usa un tunnel SSH o una tailnet.
- Suggerimenti per il rilevamento:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opzioni di autenticazione e modello

<AccordionGroup>
  <Accordion title="Chiave API Anthropic">
    Usa `ANTHROPIC_API_KEY` se presente oppure chiede una chiave, poi la salva per l'uso da parte del daemon.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    Riutilizza un login locale di Claude CLI sull'host del gateway e cambia la selezione del modello
    a un riferimento canonico `claude-cli/claude-*`.

    Questo è un percorso di fallback locale disponibile in `openclaw onboard` e
    `openclaw configure`. Per la produzione, preferisci una chiave API Anthropic.

    - macOS: controlla l'elemento del Portachiavi "Claude Code-credentials"
    - Linux e Windows: riutilizza `~/.claude/.credentials.json` se presente

    Su macOS, scegli "Always Allow" in modo che gli avvii tramite launchd non vengano bloccati.

  </Accordion>
  <Accordion title="Abbonamento OpenAI Code (riutilizzo di Codex CLI)">
    Se esiste `~/.codex/auth.json`, la procedura guidata può riutilizzarlo.
    Le credenziali di Codex CLI riutilizzate restano gestite da Codex CLI; alla scadenza OpenClaw
    rilegge prima quella sorgente e, quando il provider può aggiornarla, scrive
    la credenziale aggiornata di nuovo nell'archiviazione di Codex invece di assumerne
    direttamente il controllo.
  </Accordion>
  <Accordion title="Abbonamento OpenAI Code (OAuth)">
    Flusso nel browser; incolla `code#state`.

    Imposta `agents.defaults.model` su `openai-codex/gpt-5.4` quando il modello non è impostato oppure è `openai/*`.

  </Accordion>
  <Accordion title="Chiave API OpenAI">
    Usa `OPENAI_API_KEY` se presente oppure chiede una chiave, poi archivia la credenziale nei profili auth.

    Imposta `agents.defaults.model` su `openai/gpt-5.4` quando il modello non è impostato, è `openai/*` o `openai-codex/*`.

  </Accordion>
  <Accordion title="Chiave API xAI (Grok)">
    Chiede `XAI_API_KEY` e configura xAI come provider di modelli.
  </Accordion>
  <Accordion title="OpenCode">
    Chiede `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) e ti permette di scegliere il catalogo Zen o Go.
    URL di configurazione: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chiave API (generica)">
    Memorizza la chiave per te.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Chiede `AI_GATEWAY_API_KEY`.
    Più dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Chiede ID account, ID gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Più dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configurazione viene scritta automaticamente. Il valore hosted predefinito è `MiniMax-M2.7`; la configurazione con chiave API usa
    `minimax/...`, mentre la configurazione OAuth usa `minimax-portal/...`.
    Più dettagli: [MiniMax](/it/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint Cina o globali.
    Standard attualmente include `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    Più dettagli: [StepFun](/it/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatibile con Anthropic)">
    Chiede `SYNTHETIC_API_KEY`.
    Più dettagli: [Synthetic](/it/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud e modelli aperti locali)">
    Chiede l'URL di base (predefinito `http://127.0.0.1:11434`), poi offre modalità Cloud + Locale o Locale.
    Rileva i modelli disponibili e suggerisce quelli predefiniti.
    Più dettagli: [Ollama](/it/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    Le configurazioni di Moonshot (Kimi K2) e Kimi Coding vengono scritte automaticamente.
    Più dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot).
  </Accordion>
  <Accordion title="Provider personalizzato">
    Funziona con endpoint compatibili con OpenAI e compatibili con Anthropic.

    L'onboarding interattivo supporta le stesse scelte di archiviazione della chiave API degli altri flussi con chiave API del provider:
    - **Incolla ora la chiave API** (in chiaro)
    - **Usa riferimento segreto** (riferimento env o provider configurato, con validazione preliminare)

    Flag non interattivi:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facoltativo; usa `CUSTOM_API_KEY` come fallback)
    - `--custom-provider-id` (facoltativo)
    - `--custom-compatibility <openai|anthropic>` (facoltativo; predefinito `openai`)

  </Accordion>
  <Accordion title="Salta">
    Lascia l'auth non configurata.
  </Accordion>
</AccordionGroup>

Comportamento del modello:

- Scegli il modello predefinito tra le opzioni rilevate, oppure inserisci manualmente provider e modello.
- Quando l'onboarding parte da una scelta di auth del provider, il selettore dei modelli preferisce
  automaticamente quel provider. Per Volcengine e BytePlus, la stessa preferenza
  corrisponde anche alle rispettive varianti del piano coding (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se quel filtro del provider preferito sarebbe vuoto, il selettore torna
  al catalogo completo invece di non mostrare alcun modello.
- La procedura guidata esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'auth.

Percorsi di credenziali e profili:

- Profili auth (chiavi API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importazione OAuth legacy: `~/.openclaw/credentials/oauth.json`

Modalità di archiviazione delle credenziali:

- Il comportamento predefinito dell'onboarding salva le chiavi API come valori in chiaro nei profili auth.
- `--secret-input-mode ref` abilita la modalità riferimento invece dell'archiviazione della chiave in chiaro.
  Nella configurazione interattiva, puoi scegliere:
  - riferimento a variabile d'ambiente (ad esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - riferimento a provider configurato (`file` o `exec`) con alias del provider + id
- La modalità riferimento interattiva esegue una rapida validazione preliminare prima del salvataggio.
  - Riferimenti env: valida il nome della variabile e il valore non vuoto nell'ambiente corrente di onboarding.
  - Riferimenti provider: valida la configurazione del provider e risolve l'id richiesto.
  - Se la validazione preliminare fallisce, l'onboarding mostra l'errore e ti consente di riprovare.
- In modalità non interattiva, `--secret-input-mode ref` è supportato solo con env.
  - Imposta la variabile d'ambiente del provider nell'ambiente del processo di onboarding.
  - I flag con chiavi inline (ad esempio `--openai-api-key`) richiedono che la variabile env sia impostata; in caso contrario l'onboarding fallisce subito.
  - Per i provider personalizzati, la modalità non interattiva `ref` memorizza `models.providers.<id>.apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In quel caso del provider personalizzato, `--custom-api-key` richiede che `CUSTOM_API_KEY` sia impostata; in caso contrario l'onboarding fallisce subito.
- Le credenziali auth del gateway supportano scelte in chiaro e SecretRef nella configurazione interattiva:
  - Modalità token: **Genera/memorizza token in chiaro** (predefinito) oppure **Usa SecretRef**.
  - Modalità password: in chiaro oppure SecretRef.
- Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
- Le configurazioni in chiaro esistenti continuano a funzionare senza modifiche.

<Note>
Suggerimento per ambienti headless e server: completa OAuth su una macchina con browser, poi copia
l'`auth-profiles.json` di quell'agente (ad esempio
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, oppure il corrispondente
percorso `$OPENCLAW_STATE_DIR/...`) sull'host del gateway. `credentials/oauth.json`
è solo una sorgente di importazione legacy.
</Note>

## Output e aspetti interni

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se è stato scelto Minimax)
- `tools.profile` (l'onboarding locale usa come predefinito `"coding"` quando non impostato; i valori espliciti esistenti vengono mantenuti)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (l'onboarding locale imposta questo valore su `per-channel-peer` quando non impostato; i valori espliciti esistenti vengono mantenuti)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist dei canali (Slack, Discord, Matrix, Microsoft Teams) quando scegli di attivarle durante i prompt (i nomi vengono risolti in ID quando possibile)
- `skills.install.nodeManager`
  - Il flag `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque impostare successivamente `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` scrive `agents.list[]` e `bindings` facoltativi.

Le credenziali WhatsApp vanno in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni sono memorizzate in `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alcuni canali sono distribuiti come plugin. Quando vengono selezionati durante la configurazione, la procedura guidata
chiede di installare il plugin (npm o percorso locale) prima della configurazione del canale.
</Note>

RPC della procedura guidata del gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

I client (app macOS e Control UI) possono visualizzare i passaggi senza reimplementare la logica di onboarding.

Comportamento della configurazione di Signal:

- Scarica la release asset appropriata
- La memorizza in `~/.openclaw/tools/signal-cli/<version>/`
- Scrive `channels.signal.cliPath` nella configurazione
- Le build JVM richiedono Java 21
- Le build native vengono usate quando disponibili
- Windows usa WSL2 e segue il flusso Linux di signal-cli all'interno di WSL

## Documentazione correlata

- Hub di onboarding: [Onboarding (CLI)](/start/wizard)
- Automazione e script: [Automazione CLI](/start/wizard-cli-automation)
- Riferimento dei comandi: [`openclaw onboard`](/cli/onboard)
