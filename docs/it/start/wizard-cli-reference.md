---
read_when:
    - È necessario un comportamento dettagliato per un passaggio specifico di `openclaw onboard`
    - Si stanno eseguendo il debug dei risultati dell'onboarding o integrando client di onboarding
sidebarTitle: CLI reference
summary: 'Comportamento passo passo di `openclaw onboard`: cosa fa ogni passaggio, la configurazione che scrive e i meccanismi interni'
title: Riferimento per la configurazione della CLI
x-i18n:
    generated_at: "2026-07-16T15:06:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Questa pagina descrive dettagliatamente il comportamento, gli output e il funzionamento interno dell'onboarding.
Per una procedura guidata, vedere [Onboarding (CLI)](/it/start/wizard). Per il riferimento completo
ai flag della CLI (ogni `--flag`, esempi non interattivi, comandi specifici
dei provider), vedere [`openclaw onboard`](/it/cli/onboard).

## Funzioni della procedura guidata

La modalità locale (predefinita) guida attraverso:

- Configurazione del modello e dell'autenticazione (Anthropic, OAuth dell'abbonamento OpenAI Code, xAI, OpenCode, endpoint personalizzati e altri flussi di autenticazione gestiti dai provider)
- Posizione dello spazio di lavoro e file di bootstrap
- Impostazioni del Gateway (porta, binding, autenticazione, Tailscale)
- Canali e provider (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e altri canali inclusi o forniti tramite plugin)
- Provider di ricerca web (facoltativo)
- Installazione del daemon (LaunchAgent, unità utente systemd oppure attività pianificata nativa di Windows con ripiego sulla cartella Startup)
- Controllo di integrità
- Configurazione delle Skills

La modalità remota configura questa macchina per connettersi a un Gateway situato altrove. Non
installa né modifica nulla sull'host remoto.

## Dettagli del flusso locale

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se esiste `~/.openclaw/openclaw.json`, scegliere **Mantieni i valori correnti**, **Rivedi e aggiorna** oppure **Reimposta prima della configurazione**.
    - Eseguire nuovamente la procedura guidata non elimina nulla, a meno che non si scelga esplicitamente Reimposta (o si passi `--reset`).
    - Il valore predefinito di `--reset` della CLI è `config+creds+sessions`; usare `--reset-scope full` per rimuovere anche lo spazio di lavoro.
    - Se la configurazione non è valida o contiene chiavi obsolete, la procedura guidata si interrompe e richiede di eseguire `openclaw doctor` prima di continuare.
    - La reimpostazione sposta lo stato nel Cestino (senza mai eliminarlo direttamente) e offre i seguenti ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reimpostazione completa (rimuove anche lo spazio di lavoro)

  </Step>
  <Step title="Modello e autenticazione">
    - La matrice completa delle opzioni è disponibile in [Opzioni di autenticazione e modello](#auth-and-model-options).

  </Step>
  <Step title="Spazio di lavoro">
    - Valore predefinito `~/.openclaw/workspace` (configurabile).
    - Crea i file dello spazio di lavoro necessari per il bootstrap della prima esecuzione.
    - Struttura dello spazio di lavoro: [Spazio di lavoro dell'agente](/it/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Richiede porta, binding, modalità di autenticazione ed esposizione tramite Tailscale.
    - Consigliato: mantenere abilitata l'autenticazione tramite token anche per il loopback, affinché i client WS locali debbano autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/memorizza token in testo normale** (impostazione predefinita)
      - **Usa SecretRef** (facoltativo)
    - In modalità password, la configurazione interattiva supporta anche la memorizzazione in testo normale o tramite SecretRef.
    - Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile di ambiente non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilitare l'autenticazione solo se ogni processo locale è considerato completamente attendibile.
    - I binding non loopback richiedono comunque l'autenticazione.

  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): accesso facoltativo tramite codice QR
    - [Telegram](/it/channels/telegram): token del bot
    - [Discord](/it/channels/discord): token del bot
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + destinatario del Webhook
    - [Mattermost](/it/channels/mattermost): token del bot + URL di base
    - [Signal](/it/channels/signal): installazione facoltativa di `signal-cli` + configurazione dell'account
    - [iMessage](/it/channels/imessage): percorso della CLI `imsg` + accesso al database Messages; usare un wrapper SSH quando il Gateway viene eseguito al di fuori del Mac
    - Sicurezza dei messaggi diretti: l'impostazione predefinita è l'associazione. Il primo messaggio diretto invia un codice; approvarlo tramite
      `openclaw pairing approve <channel> <code>` oppure usare elenchi di elementi consentiti.
  </Step>
  <Step title="Ricerca web">
    - Scegliere un provider (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) oppure saltare il passaggio.
    - Saltare questo passaggio con `--skip-search`; riconfigurarlo successivamente con `openclaw configure --section web`.

  </Step>
  <Step title="Installazione del daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente con accesso effettuato; per un sistema headless, usare un LaunchDaemon personalizzato (non incluso).
    - Linux e Windows tramite WSL2: unità utente systemd
      - La procedura guidata tenta di eseguire `loginctl enable-linger <user>`, affinché il Gateway rimanga attivo dopo la disconnessione.
      - Potrebbe richiedere sudo (scrive `/var/lib/systemd/linger`); viene prima effettuato un tentativo senza sudo.
    - Windows nativo: prima l'attività pianificata
      - Se la creazione dell'attività viene negata, OpenClaw ripiega su un elemento di accesso nella cartella Startup per utente e avvia immediatamente il Gateway.
      - Le attività pianificate rimangono l'opzione preferita perché forniscono uno stato migliore del supervisore.
    - Selezione del runtime: Node è obbligatorio perché l'archivio canonico dello stato di runtime di OpenClaw usa `node:sqlite`.

  </Step>
  <Step title="Controllo di integrità">
    - Avvia il Gateway (se necessario) ed esegue `openclaw health`.
    - `openclaw status --deep` aggiunge all'output di stato il controllo di integrità del Gateway attivo, inclusi i controlli dei canali quando supportati.

  </Step>
  <Step title="Skills">
    - Legge le Skills disponibili e ne verifica i requisiti.
    - Consente di scegliere il gestore Node: npm, pnpm o bun.
    - Installa le dipendenze facoltative per le Skills incluse e attendibili quando il programma
      di installazione richiesto è disponibile.
    - Salta i programmi di installazione non disponibili di Homebrew, uv e Go, quindi raggruppa le
      Skills interessate fornendo istruzioni per la configurazione manuale. Eseguire `openclaw doctor` dopo aver installato
      i prerequisiti mancanti.

  </Step>
  <Step title="Completamento">
    - Riepilogo e passaggi successivi, incluse le opzioni per le app iOS, Android e macOS.

  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna interfaccia grafica, la procedura guidata mostra le istruzioni per l'inoltro della porta SSH della Control UI invece di aprire un browser.
Se le risorse della Control UI sono mancanti, la procedura guidata tenta di compilarle; il ripiego è `pnpm ui:build` (installa automaticamente le dipendenze dell'interfaccia utente).
</Note>

## Dettagli della modalità remota

La modalità remota configura questa macchina per connettersi a un Gateway situato altrove. Non
installa né modifica nulla sull'host remoto.

Impostazioni configurate:

- URL del Gateway remoto (`ws://...` o `wss://...`)
- Token, password o nessuna autenticazione, in conformità con la configurazione del Gateway remoto

<Steps>
  <Step title="Rilevamento (facoltativo)">
    Se `dns-sd` (macOS) o `avahi-browse` (Linux) è disponibile, l'onboarding
    propone di cercare beacon del Gateway tramite Bonjour/mDNS prima di passare
    all'inserimento manuale dell'URL. Quando configurato, viene tentato anche il rilevamento DNS-SD
    su rete geografica. Documentazione: [Rilevamento del Gateway](/it/gateway/discovery), [Bonjour](/it/gateway/bonjour).
  </Step>
  <Step title="Metodo di connessione">
    Quando viene selezionato un beacon, scegliere WebSocket diretto o un tunnel SSH:
    - **Diretto**: si connette tramite `wss://` e richiede di considerare attendibile l'impronta digitale TLS
      rilevata (associazione basata sulla fiducia al primo utilizzo; viene associata solo se accettata).
    - **Tunnel SSH**: mostra un comando `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      da eseguire prima, quindi si connette all'endpoint del tunnel locale.
  </Step>
  <Step title="Autenticazione">
    Scegliere token (consigliato), password o nessuna autenticazione, quindi eventualmente memorizzare la credenziale
    come SecretRef anziché in testo normale.
  </Step>
</Steps>

<Note>
Se il Gateway è limitato al loopback e non è rilevabile, usare manualmente un tunnel SSH o una tailnet.
Il valore `ws://` in testo normale è accettato per loopback, indirizzi IP privati letterali, `.local` e URL Tailnet `*.ts.net`; gli altri nomi DNS privati richiedono `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Opzioni di autenticazione e modello

Se un passaggio di configurazione del provider non riesce durante l'onboarding interattivo (ad esempio, un'opzione di riutilizzo della CLI
senza un accesso locale), la procedura guidata mostra l'errore e torna alla selezione del provider
anziché terminare. Le esecuzioni esplicite di `--auth-choice` continuano a interrompersi immediatamente per l'automazione.

<AccordionGroup>
  <Accordion title="Chiave API Anthropic">
    Usa `ANTHROPIC_API_KEY` se presente oppure richiede una chiave, quindi la salva per l'uso da parte del daemon.
  </Accordion>
  <Accordion title="CLI Anthropic Claude">
    Percorso locale preferito durante l'onboarding o la configurazione interattiva; riutilizza un accesso esistente della CLI Claude quando disponibile.
  </Accordion>
  <Accordion title="Abbonamento OpenAI Code (OAuth)">
    Flusso tramite browser; incollare `code#state`.

    In una nuova configurazione priva di un modello principale, imposta `agents.defaults.model` su
    `openai/gpt-5.6-sol` tramite il runtime Codex.

  </Accordion>
  <Accordion title="Abbonamento OpenAI Code (associazione dispositivo)">
    Flusso di associazione tramite browser con un codice dispositivo di breve durata.

    In una nuova configurazione priva di un modello principale, imposta `agents.defaults.model` su
    `openai/gpt-5.6-sol` tramite il runtime Codex.

  </Accordion>
  <Accordion title="Chiave API OpenAI">
    Usa `OPENAI_API_KEY` se presente oppure richiede una chiave, quindi memorizza la credenziale nei profili di autenticazione.

    In una nuova configurazione priva di un modello principale, imposta `agents.defaults.model` su
    `openai/gpt-5.6`; l'ID semplice del modello per l'API diretta viene risolto al livello Sol.

    L'aggiunta o la nuova autenticazione di OpenAI conserva l'eventuale modello principale esplicito
    esistente, incluso `openai/gpt-5.5`. Se l'account non espone GPT-5.6,
    selezionare esplicitamente `openai/gpt-5.5`; OpenClaw non effettua automaticamente il downgrade.

  </Accordion>
  <Accordion title="OAuth xAI (Grok)">
    Accesso tramite browser per gli account SuperGrok o X Premium idonei. Questo è il
    percorso xAI consigliato per la maggior parte degli utenti. OpenClaw memorizza il profilo di
    autenticazione risultante per i modelli Grok, Grok `web_search`, `x_search` e `code_execution`.
  </Accordion>
  <Accordion title="Codice dispositivo xAI (Grok)">
    Accesso tramite browser adatto agli ambienti remoti, con un breve codice anziché un callback
    localhost. Utilizzarlo da host SSH, Docker o VPS.
  </Accordion>
  <Accordion title="Chiave API xAI (Grok)">
    Richiede `XAI_API_KEY` e configura xAI come provider di modelli. Utilizzare questa opzione
    quando si desidera una chiave API di xAI Console anziché l'OAuth dell'abbonamento.
  </Accordion>
  <Accordion title="OpenCode">
    Richiede `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) e consente di scegliere il catalogo Zen o Go (una chiave API copre entrambi).
    URL di configurazione: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chiave API (generica)">
    Memorizza la chiave.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Richiede `AI_GATEWAY_API_KEY`.
    Ulteriori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Richiede l'ID account, l'ID del gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Ulteriori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configurazione viene scritta automaticamente. Il valore predefinito per il servizio in hosting è `MiniMax-M3`; la configurazione con chiave API utilizza
    `minimax/...`, mentre quella OAuth utilizza `minimax-portal/...`.
    Ulteriori dettagli: [MiniMax](/it/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configurazione viene scritta automaticamente per StepFun standard o Step Plan sugli endpoint cinesi o globali.
    Attualmente la versione standard include `step-3.5-flash`, mentre Step Plan include anche `step-3.5-flash-2603`.
    Ulteriori dettagli: [StepFun](/it/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatibile con Anthropic)">
    Richiede `SYNTHETIC_API_KEY`.
    Ulteriori dettagli: [Synthetic](/it/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelli aperti cloud e locali)">
    Richiede prima `Cloud + Local`, `Cloud only` o `Local only`.
    `Cloud only` utilizza `OLLAMA_API_KEY` con `https://ollama.com`.
    Le modalità basate su host richiedono l'URL di base (valore predefinito `http://127.0.0.1:11434`), rilevano i modelli disponibili e suggeriscono i valori predefiniti.
    `Cloud + Local` verifica inoltre se l'host Ollama ha effettuato l'accesso per l'accesso al cloud.
    Ulteriori dettagli: [Ollama](/it/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    Le configurazioni di Moonshot (Kimi K2) e Kimi Coding vengono scritte automaticamente.
    Ulteriori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot).
  </Accordion>
  <Accordion title="Provider personalizzato">
    Funziona con endpoint compatibili con OpenAI, OpenAI Responses e Anthropic.

    L'onboarding interattivo supporta le stesse opzioni di memorizzazione della chiave API degli altri flussi di chiavi API dei provider:
    - **Incolla subito la chiave API** (testo non crittografato)
    - **Usa un riferimento al segreto** (riferimento a variabile d'ambiente o a un provider configurato, con convalida preliminare)

    L'onboarding deduce il supporto delle immagini per gli ID comuni dei modelli di visione (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral e simili) e pone la domanda solo quando il nome del modello è sconosciuto.

    Flag non interattivi:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facoltativo; ripiega su `CUSTOM_API_KEY`)
    - `--custom-provider-id` (facoltativo)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (facoltativo; valore predefinito `openai`)
    - `--custom-image-input` / `--custom-text-input` (facoltativo; sostituisce la capacità di input del modello dedotta)

  </Accordion>
  <Accordion title="Salta">
    Lascia l'autenticazione non configurata.
  </Accordion>
</AccordionGroup>

Comportamento del modello:

- Selezionare il modello predefinito tra le opzioni rilevate oppure inserire manualmente provider e modello.
- Quando l'onboarding inizia dalla scelta dell'autenticazione di un provider, il selettore dei modelli preferisce
  automaticamente tale provider. Per Volcengine e BytePlus, la stessa preferenza
  corrisponde anche alle rispettive varianti del piano di coding (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se il filtro per il provider preferito non producesse risultati, il selettore ripiega
  sull'intero catalogo anziché non mostrare alcun modello.
- La procedura guidata esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o privo di autenticazione.

Percorsi delle credenziali e dei profili:

- Profili di autenticazione (chiavi API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importazione OAuth precedente: `~/.openclaw/credentials/oauth.json`

Modalità di memorizzazione delle credenziali:

- Il comportamento predefinito dell'onboarding salva le chiavi API come valori in testo non crittografato nei profili di autenticazione.
- `--secret-input-mode ref` abilita la modalità di riferimento anziché la memorizzazione della chiave in testo non crittografato.
  Nella configurazione interattiva è possibile scegliere:
  - un riferimento a una variabile d'ambiente (ad esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - un riferimento a un provider configurato (`file` o `exec`) con alias + ID del provider
- La modalità di riferimento interattiva esegue una rapida convalida preliminare prima del salvataggio.
  - Riferimenti a variabili d'ambiente: convalida il nome della variabile e la presenza di un valore non vuoto nell'ambiente di onboarding corrente.
  - Riferimenti ai provider: convalida la configurazione del provider e risolve l'ID richiesto.
  - Se la convalida preliminare non riesce, l'onboarding mostra l'errore e consente di riprovare.
- In modalità non interattiva, `--secret-input-mode ref` è supportato solo da una variabile d'ambiente.
  - Impostare la variabile d'ambiente del provider nell'ambiente del processo di onboarding.
  - I flag con chiave incorporata (ad esempio `--openai-api-key`) richiedono che tale variabile d'ambiente sia impostata; in caso contrario, l'onboarding non riesce immediatamente.
  - Per i provider personalizzati, la modalità non interattiva `ref` memorizza `models.providers.<id>.apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In questo caso di provider personalizzato, `--custom-api-key` richiede che `CUSTOM_API_KEY` sia impostato; in caso contrario, l'onboarding non riesce immediatamente.
- Le credenziali di autenticazione del Gateway supportano le opzioni testo non crittografato e SecretRef nella configurazione interattiva:
  - Modalità token: **Genera/memorizza token in testo non crittografato** (valore predefinito) oppure **Usa SecretRef**.
  - Modalità password: testo non crittografato o SecretRef.
- Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
- Le configurazioni esistenti in testo non crittografato continuano a funzionare senza modifiche.

<Note>
Suggerimento per ambienti headless e server: completare l'OAuth su un computer dotato di browser, quindi copiare
il file `auth-profiles.json` dell'agente (ad esempio
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oppure il percorso
`$OPENCLAW_STATE_DIR/...` corrispondente) nell'host del Gateway. `credentials/oauth.json`
è soltanto una fonte di importazione precedente.
</Note>

## Output e dettagli interni

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando viene passato `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (se viene scelto Minimax)
- `tools.profile` (l'onboarding locale usa per impostazione predefinita `"coding"` quando non è impostato; i valori espliciti esistenti vengono mantenuti)
- `gateway.*` (modalità, binding, autenticazione, Tailscale)
- `session.dmScope` (l'onboarding locale usa per impostazione predefinita `per-channel-peer` quando non è impostato; i valori espliciti esistenti vengono mantenuti)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Elenchi di elementi consentiti dei canali (Discord, iMessage, Signal, Slack, Telegram, WhatsApp) quando si acconsente durante le richieste; Discord e Slack risolvono inoltre i nomi inseriti nei rispettivi ID
- `skills.install.nodeManager`
  - Il flag `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque impostare `skills.install.nodeManager: "yarn"` in seguito.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` scrive `agents.list[]` e, facoltativamente, `bindings`.

Le credenziali di WhatsApp vengono salvate in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni attive e le trascrizioni vengono memorizzate in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. La directory
`~/.openclaw/agents/<agentId>/sessions/` viene utilizzata per gli input delle migrazioni precedenti
e per gli artefatti di archivio/assistenza.

<Note>
Alcuni canali vengono distribuiti come Plugin. Se vengono selezionati durante la configurazione, la procedura guidata
richiede di installare il Plugin (npm o percorso locale) prima della configurazione del canale.
</Note>

## Configurazione non interattiva

`--non-interactive` richiede `--accept-risk` (conferma che gli agenti sono
potenti e che l'accesso completo al sistema comporta rischi):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Riferimento completo dei flag ed esempi specifici per provider: [`openclaw onboard`](/it/cli/onboard), [Automazione CLI](/it/start/wizard-cli-automation).

## RPC della procedura guidata del Gateway

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

I client (app macOS e interfaccia di controllo) possono visualizzare i passaggi senza reimplementare la logica di onboarding.

## Comportamento della configurazione di Signal

- Scarica l'artefatto di rilascio appropriato dalle release GitHub ufficiali di `signal-cli` (build nativa, solo Linux x86-64)
- Sulle altre piattaforme (macOS, Linux non x64), esegue invece l'installazione tramite Homebrew
- Memorizza l'installazione dell'artefatto di rilascio in `~/.openclaw/tools/signal-cli/<version>/`
- Scrive `channels.signal.cliPath` nella configurazione
- Windows nativo non è ancora supportato; eseguire l'onboarding in WSL2 per ottenere il percorso di installazione Linux

## Documentazione correlata

- Hub dell'onboarding: [Onboarding (CLI)](/it/start/wizard)
- Automazione e script: [Automazione CLI](/it/start/wizard-cli-automation)
- Riferimento del comando: [`openclaw onboard`](/it/cli/onboard)
