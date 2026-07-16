---
read_when:
    - Ricerca di un passaggio o di un flag specifico della procedura di onboarding
    - Automazione dell'onboarding con la modalità non interattiva
    - Debug del comportamento di onboarding
sidebarTitle: Onboarding Reference
summary: 'Riferimento completo per l''onboarding tramite CLI: ogni passaggio, flag e campo di configurazione'
title: Riferimento per la configurazione iniziale
x-i18n:
    generated_at: "2026-07-16T15:03:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

Questa è la documentazione di riferimento completa per `openclaw onboard`.
Per una panoramica generale, consultare [Onboarding (CLI)](/it/start/wizard). Per il comportamento e gli output
passo per passo, consultare [Riferimento alla configurazione tramite CLI](/it/start/wizard-cli-reference).

## Dettagli del flusso (modalità locale)

<Steps>
  <Step title="Reimpostazione (facoltativa)">
    - `--reset` reimposta lo stato prima dell'esecuzione della configurazione; senza questa opzione, ripetendo l'onboarding
      la configurazione esistente viene mantenuta e riutilizzata come impostazione predefinita.
    - `--reset-scope` controlla ciò che `--reset` rimuove: `config` (solo il file di configurazione),
      `config+creds+sessions` (impostazione predefinita) oppure `full` (rimuove anche lo
      spazio di lavoro).
    - Se il file di configurazione non è valido, l'onboarding si interrompe e indica di eseguire prima
      `openclaw doctor`, quindi di ripetere la configurazione.
    - La reimpostazione sposta lo stato nel Cestino (senza mai eliminarlo direttamente).

  </Step>
  <Step title="Accettazione dei rischi">
    - Alla prima esecuzione (o a ogni esecuzione precedente all'impostazione di `wizard.securityAcknowledgedAt`)
      viene chiesto di confermare di comprendere che gli agenti sono potenti e che l'accesso
      completo al sistema comporta rischi.
    - `--non-interactive` richiede esplicitamente `--accept-risk`; in sua assenza,
      l'onboarding termina con un errore anziché mostrare una richiesta.
    - Nelle esecuzioni interattive viene mostrata una richiesta di conferma anziché il flag; se si rifiuta,
      la configurazione viene annullata.

  </Step>
  <Step title="Modello/Autenticazione">
    - **Chiave API Anthropic**: usa `ANTHROPIC_API_KEY` se presente oppure richiede una chiave, quindi la salva per l'uso da parte del daemon.
    - **CLI Anthropic Claude**: percorso locale preferito quando esiste già un accesso tramite la CLI Claude; OpenClaw supporta comunque come alternativa l'autenticazione Anthropic tramite token di configurazione.
    - **Abbonamento OpenAI Code (Codex) (OAuth)**: flusso tramite browser; incollare `code#state`.
      - In una nuova configurazione senza un modello principale, imposta `agents.defaults.model` su `openai/gpt-5.6-sol` tramite il runtime Codex.
    - **Abbonamento OpenAI Code (Codex) (associazione del dispositivo)**: flusso di associazione tramite browser con un codice dispositivo di breve durata.
      - In una nuova configurazione senza un modello principale, imposta `agents.defaults.model` su `openai/gpt-5.6-sol` tramite il runtime Codex.
    - **Chiave API OpenAI**: usa `OPENAI_API_KEY` se presente oppure richiede una chiave, quindi la archivia nei profili di autenticazione.
      - In una nuova configurazione senza un modello principale, imposta `agents.defaults.model` su `openai/gpt-5.6`; l'ID del modello API diretto senza qualificatori viene risolto nel livello Sol.
    - L'aggiunta o la riautenticazione di OpenAI mantiene un modello principale esplicito esistente, incluso `openai/gpt-5.5`. Se l'account non espone GPT-5.6, selezionare esplicitamente `openai/gpt-5.5`; OpenClaw non esegue automaticamente il downgrade del modello.
    - **OAuth xAI**: accesso tramite browser con codice dispositivo senza richiedere un callback localhost, pertanto funziona anche tramite SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Chiave API xAI**: richiede `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` continua a funzionare come alias di compatibilità esclusivamente manuale per lo stesso flusso OAuth xAI con codice dispositivo; usare `xai-oauth` per i nuovi script.
    - **OpenCode**: richiede `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`, disponibile all'indirizzo https://opencode.ai/auth) e consente di scegliere il catalogo Zen o Go.
    - **Ollama**: propone inizialmente **Cloud + locale**, **Solo cloud** o **Solo locale**. `Cloud only` richiede `OLLAMA_API_KEY` e usa `https://ollama.com`; le modalità basate sull'host richiedono l'URL di base di Ollama (impostazione predefinita `http://127.0.0.1:11434`), rilevano i modelli disponibili ed eseguono automaticamente il pull del modello locale selezionato quando necessario; `Cloud + Local` verifica inoltre se l'accesso a tale host Ollama è stato effettuato per l'accesso al cloud.
    - Ulteriori dettagli: [Ollama](/it/providers/ollama)
    - **Chiave API**: archivia la chiave.
    - **Vercel AI Gateway (proxy multimodello)**: richiede `AI_GATEWAY_API_KEY`.
    - Ulteriori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: richiede l'ID account, l'ID Gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Ulteriori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configurazione viene scritta automaticamente; l'impostazione predefinita in hosting è `MiniMax-M3`.
      La configurazione con chiave API usa `minimax/...`, mentre quella OAuth usa
      `minimax-portal/...`.
    - Ulteriori dettagli: [MiniMax](/it/providers/minimax)
    - **StepFun**: la configurazione viene scritta automaticamente per StepFun standard o Step Plan sugli endpoint cinesi o globali.
    - Attualmente, l'impostazione predefinita della versione standard è `step-3.5-flash`; Step Plan include anche `step-3.5-flash-2603`.
    - Ulteriori dettagli: [StepFun](/it/providers/stepfun)
    - **Synthetic (compatibile con Anthropic)**: richiede `SYNTHETIC_API_KEY`.
    - Ulteriori dettagli: [Synthetic](/it/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configurazione viene scritta automaticamente.
    - **Kimi Coding**: la configurazione viene scritta automaticamente.
    - Ulteriori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot)
    - **Provider personalizzato**: funziona con endpoint compatibili con OpenAI, OpenAI Responses o Anthropic. Flag non interattivi: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (facoltativo; ripiega su `CUSTOM_API_KEY`), `--custom-provider-id` (facoltativo; derivato automaticamente dall'URL di base), `--custom-compatibility openai|openai-responses|anthropic` (impostazione predefinita `openai`), `--custom-image-input` / `--custom-text-input` (sostituiscono il rilevamento dedotto del modello di visione).
    - **Ignora**: per il momento non viene configurata alcuna autenticazione.
    - Selezionare un modello predefinito tra le opzioni rilevate (oppure inserire manualmente provider/modello). Per ottenere la migliore qualità e ridurre il rischio di prompt injection, scegliere il modello più potente di ultima generazione disponibile nello stack del provider.
    - L'onboarding esegue una verifica del modello e mostra un avviso se il modello configurato è sconosciuto o privo di autenticazione.
    - La modalità di archiviazione predefinita delle chiavi API usa valori in testo non cifrato nei profili di autenticazione. Usare `--secret-input-mode ref` per archiviare invece riferimenti basati su variabili d'ambiente (ad esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); la variabile d'ambiente indicata deve essere già impostata, altrimenti l'onboarding termina immediatamente con un errore.
    - I profili di autenticazione si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chiavi API + OAuth). `~/.openclaw/credentials/oauth.json` è destinato esclusivamente all'importazione legacy.
    - Ulteriori dettagli: [OAuth](/it/concepts/oauth)
    <Note>
    Suggerimento per server/sistemi headless: completare OAuth su una macchina dotata di browser, quindi copiare
    il file `auth-profiles.json` dell'agente (ad esempio
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` oppure il percorso
    `$OPENCLAW_STATE_DIR/...` corrispondente) nell'host del Gateway. `credentials/oauth.json`
    è soltanto un'origine di importazione legacy.
    </Note>
  </Step>
  <Step title="Spazio di lavoro">
    - Valore predefinito `~/.openclaw/workspace` (configurabile).
    - Crea i file dello spazio di lavoro necessari per la procedura di bootstrap dell'agente.
    - Struttura completa dello spazio di lavoro e guida al backup: [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Porta (impostazione predefinita **18789**), associazione, modalità di autenticazione, esposizione tramite Tailscale.
    - Raccomandazione per l'autenticazione: mantenere **Token** anche per il loopback, affinché i client WS locali debbano autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/archivia token in testo non cifrato** (impostazione predefinita)
      - **Usa SecretRef** (facoltativo)
      - L'avvio rapido riutilizza i SecretRef `gateway.auth.token` esistenti tra i provider `env`, `file` e `exec` per il controllo durante l'onboarding e il bootstrap della dashboard.
      - Se tale SecretRef è configurato ma non può essere risolto, l'onboarding termina anticipatamente con un chiaro messaggio di correzione anziché degradare silenziosamente l'autenticazione in fase di esecuzione.
    - In modalità password, la configurazione interattiva supporta anche l'archiviazione in testo non cifrato o tramite SecretRef.
    - Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile d'ambiente non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilitare l'autenticazione solo se si considera completamente attendibile ogni processo locale.
    - Le associazioni non loopback richiedono comunque l'autenticazione.

  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): accesso facoltativo tramite codice QR.
    - [Telegram](/it/channels/telegram): token del bot.
    - [Discord](/it/channels/discord): token del bot.
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + destinatario del Webhook.
    - [Mattermost](/it/channels/mattermost) (plugin): token del bot + URL di base.
    - [Signal](/it/channels/signal) (plugin): installazione facoltativa di `signal-cli` + configurazione dell'account.
    - [iMessage](/it/channels/imessage): percorso della CLI `imsg` + accesso al database Messaggi; usare un wrapper SSH quando il Gateway viene eseguito su un sistema diverso da Mac.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack e altri canali sono distribuiti come
      plugin che l'onboarding può installare automaticamente. Catalogo completo: [Canali](/it/channels).
    - Sicurezza dei messaggi diretti: l'impostazione predefinita è l'associazione. Il primo messaggio diretto invia un codice; approvarlo tramite `openclaw pairing approve <channel> <code>` oppure usare elenchi di elementi consentiti.

  </Step>
  <Step title="Ricerca web">
    - Selezionare un provider supportato, ad esempio Brave, Codex (Hosted Search), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG o Tavily (oppure ignorare).
    - Per una configurazione rapida, i provider basati su API possono usare variabili d'ambiente o la configurazione esistente; i provider senza chiave usano invece i propri prerequisiti specifici.
    - Ignorare con `--skip-search`.
    - Configurare in seguito: `openclaw configure --section web`.

  </Step>
  <Step title="Installazione del daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente attiva; per i sistemi headless, usare un LaunchDaemon personalizzato (non distribuito).
    - Linux (e Windows tramite WSL2): unità utente systemd
      - L'onboarding tenta di abilitare la permanenza tramite `loginctl enable-linger <user>`, in modo che il Gateway rimanga attivo dopo la disconnessione.
      - Può richiedere sudo (scrive `/var/lib/systemd/linger`); inizialmente tenta senza sudo.
    - Windows nativo: prima un'Attività pianificata; se la creazione dell'attività viene negata, OpenClaw ripiega su un elemento di accesso nella cartella Esecuzione automatica per utente e avvia immediatamente il Gateway.
    - **Selezione del runtime:** Node è obbligatorio perché l'archivio canonico dello stato di runtime usa `node:sqlite`. Durante la riparazione, i servizi Bun legacy vengono migrati a Node.
    - Se l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito tramite SecretRef, l'installazione del daemon lo convalida, ma non salva i valori risolti del token in testo non cifrato nei metadati dell'ambiente del servizio del supervisore.
    - Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non può essere risolto, l'installazione del daemon viene bloccata con indicazioni utili.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.

  </Step>
  <Step title="Controllo dello stato">
    - Avvia il Gateway (se necessario) ed esegue `openclaw health`.
    - Suggerimento: `openclaw status --deep` aggiunge all'output dello stato la verifica in tempo reale dello stato del Gateway, incluse le verifiche dei canali quando supportate (richiede un Gateway raggiungibile).

  </Step>
  <Step title="Skills (consigliate)">
    - Legge le skill disponibili e ne verifica i requisiti.
    - Consente di scegliere un gestore di Node: **npm / pnpm / bun**.
    - Installa automaticamente le dipendenze facoltative per le skill integrate attendibili (alcune usano Homebrew su macOS).
    - Ignora le skill il cui prerequisito di installazione Homebrew, uv o Go non è disponibile, le raggruppa insieme alle istruzioni per la configurazione manuale e rimanda a `openclaw doctor` una volta installato il prerequisito.

  </Step>
  <Step title="Completamento">
    - Riepilogo + passaggi successivi, inclusa la richiesta **Come si desidera far nascere l'agente?** per Terminale, Browser o in seguito.

  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, l'onboarding mostra le istruzioni per l'inoltro della porta SSH per la Control UI anziché aprire un browser.
Se le risorse della Control UI sono mancanti, l'onboarding tenta di compilarle; l'alternativa è `pnpm ui:build` (installa automaticamente le dipendenze dell'interfaccia utente).
</Note>

## Modalità non interattiva

Usare `--non-interactive --accept-risk` per automatizzare o integrare l'onboarding in uno script (il
flag costituisce la conferma obbligatoria di accettazione del rischio; senza di esso,
l'onboarding termina con un errore):

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Aggiungere `--json` per ottenere un riepilogo leggibile automaticamente.

SecretRef del token del Gateway in modalità non interattiva:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` e `--gateway-token-ref-env` si escludono a vicenda.

<Note>
`--json` **non** implica la modalità non interattiva. Usare `--non-interactive --accept-risk` (e `--workspace`) per gli script.
</Note>

Gli esempi di comandi specifici per provider sono disponibili in [Automazione della CLI](/it/start/wizard-cli-automation#provider-specific-examples).
Usare questa pagina di riferimento per la semantica dei flag e l'ordine dei passaggi.

### Aggiunta di un agente (non interattiva)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` è un ID agente riservato e non può essere usato per `openclaw agents add`.

## RPC della procedura guidata del Gateway

Il Gateway espone il flusso di onboarding tramite RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
I client (app macOS, Control UI) possono visualizzare i passaggi senza reimplementare la logica di onboarding.

## Configurazione di Signal (signal-cli)

L'onboarding rileva se `signal-cli` è presente in `PATH` e, se manca, propone di installarlo:

- Linux x86-64: scarica la build nativa GraalVM ufficiale dalle release GitHub di `signal-cli` e la archivia in `~/.openclaw/tools/signal-cli/<version>/`.
- macOS e altre architetture: esegue invece l'installazione tramite Homebrew.
- Windows nativo: non ancora supportato; eseguire l'onboarding all'interno di WSL2 per usare il percorso di installazione Linux.
- In entrambi i casi, scrive `channels.signal.cliPath` nella configurazione.

## Contenuto scritto dalla procedura guidata

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando viene passato `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (se viene scelto Minimax)
- `tools.profile` (se non è impostato, il valore predefinito dell'onboarding locale è `"coding"`; i valori espliciti esistenti vengono mantenuti)
- `gateway.*` (modalità, associazione, autenticazione, Tailscale)
- `session.dmScope` (se non è impostato, l'onboarding locale imposta il valore predefinito su `"per-channel-peer"`; i valori espliciti esistenti vengono mantenuti. Dettagli: [Riferimento per la configurazione tramite CLI](/it/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Elenchi di elementi consentiti per i messaggi diretti dei canali quando si acconsente durante le richieste relative ai canali. Discord, Matrix, Microsoft Teams e Slack risolvono i nomi in ID quando possibile; gli altri canali accettano direttamente gli ID (ad esempio, ID numerici dei mittenti Telegram o numeri di telefono WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque usare `yarn` impostando direttamente `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` scrive `agents.list[]` e, facoltativamente, `bindings`.

Le credenziali WhatsApp vengono archiviate in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni attive e le trascrizioni vengono archiviate in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. La directory
`~/.openclaw/agents/<agentId>/sessions/` viene usata per gli input delle migrazioni
legacy e per gli artefatti di archiviazione/supporto.

Alcuni canali vengono distribuiti come Plugin. Quando se ne seleziona uno durante la configurazione, l'onboarding
richiede di installarlo (tramite npm o da un percorso locale) prima di poterlo configurare.

## Documentazione correlata

- Panoramica dell'onboarding: [Onboarding (CLI)](/it/start/wizard)
- Riferimento per la configurazione tramite CLI: [Riferimento per la configurazione tramite CLI](/it/start/wizard-cli-reference)
- Onboarding dell'app macOS: [Onboarding](/it/start/onboarding)
- Riferimento per la configurazione: [Configurazione del Gateway](/it/gateway/configuration)
- Provider: [WhatsApp](/it/channels/whatsapp), [Telegram](/it/channels/telegram), [Discord](/it/channels/discord), [Google Chat](/it/channels/googlechat), [Signal](/it/channels/signal), [iMessage](/it/channels/imessage)
- Skills: [Skills](/it/tools/skills), [Configurazione delle Skills](/it/tools/skills-config)
