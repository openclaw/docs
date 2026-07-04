---
read_when:
    - Ti serve il comportamento dettagliato per openclaw onboard
    - Stai eseguendo il debug dei risultati dell’onboarding o integrando client di onboarding
sidebarTitle: CLI reference
summary: Riferimento completo per il flusso di configurazione della CLI, la configurazione di autenticazione/modello, gli output e i componenti interni
title: Riferimento alla configurazione della CLI
x-i18n:
    generated_at: "2026-07-04T06:38:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Questa pagina è il riferimento completo per `openclaw onboard`.
Per la guida breve, consulta [Onboarding (CLI)](/it/start/wizard).

## Cosa fa la procedura guidata

La modalità locale (predefinita) ti guida attraverso:

- Configurazione del modello e dell'autenticazione (OAuth dell'abbonamento OpenAI Code, Anthropic Claude CLI o chiave API, più opzioni MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Posizione dell'area di lavoro e file di bootstrap
- Impostazioni del Gateway (porta, bind, autenticazione, Tailscale)
- Canali e provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage e altri plugin di canale inclusi)
- Installazione del demone (LaunchAgent, unità utente systemd o attività pianificata nativa di Windows con fallback alla cartella Esecuzione automatica)
- Controllo di integrità
- Configurazione di Skills

La modalità remota configura questa macchina per connettersi a un gateway altrove.
Non installa né modifica nulla sull'host remoto.

## Dettagli del flusso locale

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se `~/.openclaw/openclaw.json` esiste, scegli Mantieni, Modifica o Reimposta.
    - Rieseguire la procedura guidata non cancella nulla a meno che tu non scelga esplicitamente Reimposta (o passi `--reset`).
    - CLI `--reset` usa come valore predefinito `config+creds+sessions`; usa `--reset-scope full` per rimuovere anche l'area di lavoro.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si interrompe e ti chiede di eseguire `openclaw doctor` prima di continuare.
    - La reimpostazione usa `trash` e offre ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reimpostazione completa (rimuove anche l'area di lavoro)

  </Step>
  <Step title="Modello e autenticazione">
    - La matrice completa delle opzioni è in [Opzioni di autenticazione e modello](#auth-and-model-options).

  </Step>
  <Step title="Area di lavoro">
    - Predefinita `~/.openclaw/workspace` (configurabile).
    - Inizializza i file dell'area di lavoro necessari per il rituale di bootstrap al primo avvio.
    - Layout dell'area di lavoro: [Area di lavoro dell'agente](/it/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Chiede porta, bind, modalità di autenticazione ed esposizione Tailscale.
    - Consigliato: mantieni abilitata l'autenticazione con token anche per loopback, così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/archivia token in testo in chiaro** (predefinito)
      - **Usa SecretRef** (opt-in)
    - In modalità password, la configurazione interattiva supporta anche archiviazione in testo in chiaro o SecretRef.
    - Percorso SecretRef token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile d'ambiente non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'autenticazione solo se ti fidi completamente di ogni processo locale.
    - I bind non loopback richiedono comunque autenticazione.

  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): accesso QR facoltativo
    - [Telegram](/it/channels/telegram): token del bot
    - [Discord](/it/channels/discord): token del bot
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + audience del webhook
    - [Mattermost](/it/channels/mattermost): token del bot + URL di base
    - [Signal](/it/channels/signal): installazione facoltativa di `signal-cli` + configurazione dell'account
    - [iMessage](/it/channels/imessage): percorso CLI `imsg` + accesso al DB Messaggi; usa un wrapper SSH quando il Gateway viene eseguito fuori dal Mac
    - Sicurezza DM: il valore predefinito è l'associazione. Il primo DM invia un codice; approva tramite
      `openclaw pairing approve <channel> <code>` oppure usa allowlist.
  </Step>
  <Step title="Installazione del demone">
    - macOS: LaunchAgent
      - Richiede una sessione utente attiva; per headless, usa un LaunchDaemon personalizzato (non distribuito).
    - Linux e Windows tramite WSL2: unità utente systemd
      - La procedura guidata tenta `loginctl enable-linger <user>` così il gateway resta attivo dopo il logout.
      - Potrebbe chiedere sudo (scrive in `/var/lib/systemd/linger`); prova prima senza sudo.
    - Windows nativo: prima Attività pianificata
      - Se la creazione dell'attività viene negata, OpenClaw ripiega su un elemento di accesso per utente nella cartella Esecuzione automatica e avvia subito il gateway.
      - Le Attività pianificate restano preferite perché forniscono uno stato del supervisore migliore.
    - Selezione runtime: Node (consigliato; richiesto per WhatsApp e Telegram). Bun non è consigliato.

  </Step>
  <Step title="Controllo di integrità">
    - Avvia il gateway (se necessario) ed esegue `openclaw health`.
    - `openclaw status --deep` aggiunge il probe di integrità del gateway live all'output di stato, inclusi i probe dei canali quando supportati.

  </Step>
  <Step title="Skills">
    - Legge le skill disponibili e verifica i requisiti.
    - Ti consente di scegliere il gestore Node: npm, pnpm o bun.
    - Installa le dipendenze facoltative per le skill incluse attendibili quando il programma di installazione richiesto
      è disponibile.
    - Salta i programmi di installazione Homebrew, uv e Go non disponibili, poi raggruppa le skill interessate
      con indicazioni per la configurazione manuale. Esegui `openclaw doctor` dopo aver installato
      i prerequisiti mancanti.

  </Step>
  <Step title="Fine">
    - Riepilogo e passaggi successivi, incluse le opzioni app per iOS, Android e macOS.

  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, la procedura guidata stampa le istruzioni di port forwarding SSH per la Control UI invece di aprire un browser.
Se gli asset della Control UI mancano, la procedura guidata tenta di compilarli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze della UI).
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
- Suggerimenti per il rilevamento:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Opzioni di autenticazione e modello

<AccordionGroup>
  <Accordion title="Chiave API Anthropic">
    Usa `ANTHROPIC_API_KEY` se presente o chiede una chiave, poi la salva per l'uso del demone.
  </Accordion>
  <Accordion title="Abbonamento OpenAI Code (OAuth)">
    Flusso browser; incolla `code#state`.

    Imposta `agents.defaults.model` su `openai/gpt-5.5` tramite il runtime Codex quando il modello non è impostato o appartiene già alla famiglia OpenAI.

  </Accordion>
  <Accordion title="Abbonamento OpenAI Code (associazione dispositivo)">
    Flusso di associazione browser con un codice dispositivo a breve durata.

    Imposta `agents.defaults.model` su `openai/gpt-5.5` tramite il runtime Codex quando il modello non è impostato o appartiene già alla famiglia OpenAI.

  </Accordion>
  <Accordion title="Chiave API OpenAI">
    Usa `OPENAI_API_KEY` se presente o chiede una chiave, poi archivia la credenziale nei profili di autenticazione.

    Imposta `agents.defaults.model` su `openai/gpt-5.5` quando il modello non è impostato, è `openai/*` o sono riferimenti a modelli Codex legacy.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Accesso tramite browser per account SuperGrok o X Premium idonei. Questo è il
    percorso xAI consigliato per la maggior parte degli utenti. OpenClaw archivia il profilo
    di autenticazione risultante per i modelli Grok, Grok `web_search`, `x_search` e `code_execution`.
  </Accordion>
  <Accordion title="xAI (Grok) codice dispositivo">
    Accesso tramite browser adatto al remoto con un codice breve invece di una callback
    localhost. Usalo da host SSH, Docker o VPS.
  </Accordion>
  <Accordion title="xAI (Grok) chiave API">
    Chiede `XAI_API_KEY` e configura xAI come provider di modelli. Usalo
    quando vuoi una chiave API della Console xAI invece dell'OAuth dell'abbonamento.
  </Accordion>
  <Accordion title="OpenCode">
    Chiede `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) e ti consente di scegliere il catalogo Zen o Go.
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
    Chiede ID account, ID gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configurazione viene scritta automaticamente. Il valore predefinito hosted è `MiniMax-M3`; la configurazione con chiave API usa
    `minimax/...`, mentre la configurazione OAuth usa `minimax-portal/...`.
    Maggiori dettagli: [MiniMax](/it/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint Cina o globali.
    Standard attualmente include `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    Maggiori dettagli: [StepFun](/it/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatibile con Anthropic)">
    Chiede `SYNTHETIC_API_KEY`.
    Maggiori dettagli: [Synthetic](/it/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (cloud e modelli aperti locali)">
    Chiede prima `Cloud + Local`, `Cloud only` o `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Le modalità supportate da host chiedono l'URL di base (predefinito `http://127.0.0.1:11434`), rilevano i modelli disponibili e suggeriscono valori predefiniti.
    `Cloud + Local` verifica anche se quell'host Ollama ha effettuato l'accesso per l'accesso cloud.
    Maggiori dettagli: [Ollama](/it/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    Le configurazioni Moonshot (Kimi K2) e Kimi Coding vengono scritte automaticamente.
    Maggiori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot).
  </Accordion>
  <Accordion title="Provider personalizzato">
    Funziona con endpoint compatibili con OpenAI e compatibili con Anthropic.

    L'onboarding interattivo supporta le stesse scelte di archiviazione delle chiavi API degli altri flussi di chiave API dei provider:
    - **Incolla ora la chiave API** (testo in chiaro)
    - **Usa riferimento segreto** (riferimento env o riferimento provider configurato, con validazione preflight)

    Flag non interattivi:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facoltativo; ripiega su `CUSTOM_API_KEY`)
    - `--custom-provider-id` (facoltativo)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (facoltativo; predefinito `openai`)
    - `--custom-image-input` / `--custom-text-input` (facoltativo; sovrascrive la capacità di input del modello dedotta)

  </Accordion>
  <Accordion title="Salta">
    Lascia l'autenticazione non configurata.
  </Accordion>
</AccordionGroup>

Comportamento del modello:

- Scegli il modello predefinito dalle opzioni rilevate oppure inserisci manualmente provider e modello.
- L'onboarding del provider personalizzato deduce il supporto per immagini per gli ID modello comuni e chiede solo quando il nome del modello è sconosciuto.
- Quando l'onboarding parte da una scelta di autenticazione del provider, il selettore di modello preferisce
  automaticamente quel provider. Per Volcengine e BytePlus, la stessa preferenza
  corrisponde anche alle loro varianti di piano coding (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se quel filtro per provider preferito fosse vuoto, il selettore ripiega sul
  catalogo completo invece di non mostrare alcun modello.
- La procedura guidata esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'autenticazione.

Percorsi di credenziali e profili:

- Profili di autenticazione (chiavi API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importazione OAuth legacy: `~/.openclaw/credentials/oauth.json`

Modalità di archiviazione delle credenziali:

- Il comportamento di onboarding predefinito persiste le chiavi API come valori in testo normale nei profili di autenticazione.
- `--secret-input-mode ref` abilita la modalità di riferimento invece dell'archiviazione della chiave in testo normale.
  Nella configurazione interattiva, puoi scegliere:
  - riferimento a variabile d'ambiente (ad esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - riferimento a provider configurato (`file` o `exec`) con alias del provider + id
- La modalità di riferimento interattiva esegue una rapida validazione preliminare prima del salvataggio.
  - Riferimenti env: valida il nome della variabile + valore non vuoto nell'ambiente di onboarding corrente.
  - Riferimenti provider: valida la configurazione del provider e risolve l'id richiesto.
  - Se la validazione preliminare non riesce, l'onboarding mostra l'errore e ti consente di riprovare.
- In modalità non interattiva, `--secret-input-mode ref` è supportato solo da env.
  - Imposta la variabile d'ambiente del provider nell'ambiente del processo di onboarding.
  - I flag di chiave inline (ad esempio `--openai-api-key`) richiedono che quella variabile d'ambiente sia impostata; altrimenti l'onboarding fallisce rapidamente.
  - Per provider personalizzati, la modalità non interattiva `ref` archivia `models.providers.<id>.apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In quel caso di provider personalizzato, `--custom-api-key` richiede che `CUSTOM_API_KEY` sia impostata; altrimenti l'onboarding fallisce rapidamente.
- Le credenziali di autenticazione del Gateway supportano scelte in testo normale e SecretRef nella configurazione interattiva:
  - Modalità token: **Genera/archivia token in testo normale** (predefinita) o **Usa SecretRef**.
  - Modalità password: testo normale o SecretRef.
- Percorso SecretRef token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
- Le configurazioni esistenti in testo normale continuano a funzionare senza modifiche.

<Note>
Suggerimento per headless e server: completa OAuth su una macchina con un browser, poi copia
l'`auth-profiles.json` di quell'agente (ad esempio
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o il percorso corrispondente
`$OPENCLAW_STATE_DIR/...`) sull'host del gateway. `credentials/oauth.json`
è solo una sorgente di importazione legacy.
</Note>

## Output e dettagli interni

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando viene passato `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (se viene scelto Minimax)
- `tools.profile` (l'onboarding locale usa per impostazione predefinita `"coding"` quando non è impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (modalità, bind, autenticazione, tailscale)
- `session.dmScope` (l'onboarding locale imposta questo valore predefinito su `per-channel-peer` quando non è impostato; i valori espliciti esistenti vengono preservati)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist dei canali (Slack, Discord, Matrix, Microsoft Teams) quando accetti durante i prompt (i nomi vengono risolti in ID quando possibile)
- `skills.install.nodeManager`
  - Il flag `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque impostare `skills.install.nodeManager: "yarn"` in seguito.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` scrive `agents.list[]` e `bindings` facoltativi.

Le credenziali WhatsApp vanno in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni sono archiviate in `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alcuni canali vengono distribuiti come Plugin. Quando selezionati durante la configurazione, la procedura guidata
chiede di installare il Plugin (npm o percorso locale) prima della configurazione del canale.
</Note>

RPC della procedura guidata del Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

I client (app macOS e Control UI) possono eseguire il rendering dei passaggi senza reimplementare la logica di onboarding.

Comportamento di configurazione di Signal:

- Scarica l'asset di release appropriato
- Lo archivia in `~/.openclaw/tools/signal-cli/<version>/`
- Scrive `channels.signal.cliPath` nella configurazione
- Le build JVM richiedono Java 21
- Le build native vengono usate quando disponibili
- Windows usa WSL2 e segue il flusso signal-cli Linux dentro WSL

## Documentazione correlata

- Hub di onboarding: [Onboarding (CLI)](/it/start/wizard)
- Automazione e script: [Automazione CLI](/it/start/wizard-cli-automation)
- Riferimento dei comandi: [`openclaw onboard`](/it/cli/onboard)
