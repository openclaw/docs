---
read_when:
    - Cercare un passaggio specifico della configurazione iniziale o un’opzione
    - Automatizzare la configurazione iniziale con la modalità non interattiva
    - Risoluzione dei problemi del comportamento di configurazione iniziale
sidebarTitle: Onboarding Reference
summary: 'Riferimento completo per la configurazione iniziale della CLI: ogni passaggio, flag e campo di configurazione'
title: Riferimento per la configurazione iniziale
x-i18n:
    generated_at: "2026-04-30T09:13:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 412008af223cd14f744a0b553ab82f233eb482ca9991bd418f29b09b33d93de4
    source_path: reference/wizard.md
    workflow: 16
---

Questa è la reference completa per `openclaw onboard`.
Per una panoramica generale, consulta [Onboarding (CLI)](/it/start/wizard).

## Dettagli del flusso (modalità locale)

<Steps>
  <Step title="Rilevamento configurazione esistente">
    - Se `~/.openclaw/openclaw.json` esiste, scegli **Mantieni / Modifica / Reimposta**.
    - Rieseguire l'onboarding **non** cancella nulla, a meno che tu non scelga esplicitamente **Reimposta**
      (o passi `--reset`).
    - Il valore predefinito di CLI `--reset` è `config+creds+sessions`; usa `--reset-scope full`
      per rimuovere anche il workspace.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si interrompe e ti chiede
      di eseguire `openclaw doctor` prima di continuare.
    - La reimpostazione usa `trash` (mai `rm`) e offre questi ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reimpostazione completa (rimuove anche il workspace)

  </Step>
  <Step title="Modello/Auth">
    - **Chiave API Anthropic**: usa `ANTHROPIC_API_KEY` se presente o richiede una chiave, poi la salva per l'uso del daemon.
    - **Chiave API Anthropic**: scelta preferita per l'assistente Anthropic in onboarding/configure.
    - **setup-token Anthropic**: ancora disponibile in onboarding/configure, anche se OpenClaw ora preferisce il riutilizzo di Claude CLI quando disponibile.
    - **Abbonamento OpenAI Code (Codex) (OAuth)**: flusso browser; incolla `code#state`.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.
    - **Abbonamento OpenAI Code (Codex) (associazione dispositivo)**: flusso di associazione browser con un codice dispositivo a breve durata.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.
    - **Chiave API OpenAI**: usa `OPENAI_API_KEY` se presente o richiede una chiave, poi la archivia nei profili auth.
      - Imposta `agents.defaults.model` su `openai/gpt-5.5` quando il modello non è impostato, è `openai/*` o `openai-codex/*`.
    - **Chiave API xAI (Grok)**: richiede `XAI_API_KEY` e configura xAI come provider di modelli.
    - **OpenCode**: richiede `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, ottenibile su https://opencode.ai/auth) e ti permette di scegliere il catalogo Zen o Go.
    - **Ollama**: offre prima **Cloud + locale**, **Solo cloud** o **Solo locale**. `Cloud only` richiede `OLLAMA_API_KEY` e usa `https://ollama.com`; le modalità basate su host richiedono l'URL di base di Ollama, rilevano i modelli disponibili e scaricano automaticamente il modello locale selezionato quando necessario; `Cloud + Local` verifica anche se quell'host Ollama ha effettuato l'accesso per l'accesso cloud.
    - Maggiori dettagli: [Ollama](/it/providers/ollama)
    - **Chiave API**: archivia la chiave per te.
    - **Vercel AI Gateway (proxy multi-modello)**: richiede `AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: richiede ID account, ID Gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configurazione viene scritta automaticamente; il valore predefinito hosted è `MiniMax-M2.7`.
      La configurazione con chiave API usa `minimax/...`, mentre quella OAuth usa
      `minimax-portal/...`.
    - Maggiori dettagli: [MiniMax](/it/providers/minimax)
    - **StepFun**: la configurazione viene scritta automaticamente per StepFun standard o Step Plan sugli endpoint Cina o globali.
    - Standard attualmente include `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    - Maggiori dettagli: [StepFun](/it/providers/stepfun)
    - **Synthetic (compatibile con Anthropic)**: richiede `SYNTHETIC_API_KEY`.
    - Maggiori dettagli: [Synthetic](/it/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configurazione viene scritta automaticamente.
    - **Kimi Coding**: la configurazione viene scritta automaticamente.
    - Maggiori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot)
    - **Salta**: nessuna auth configurata per ora.
    - Scegli un modello predefinito dalle opzioni rilevate (o inserisci provider/modello manualmente). Per la migliore qualità e un rischio inferiore di prompt injection, scegli il modello più potente di ultima generazione disponibile nel tuo stack di provider.
    - L'onboarding esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'auth.
    - La modalità di archiviazione delle chiavi API usa per impostazione predefinita valori auth-profile in testo normale. Usa `--secret-input-mode ref` per archiviare invece riferimenti basati su env (per esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - I profili auth si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chiavi API + OAuth). `~/.openclaw/credentials/oauth.json` è solo per import legacy.
    - Maggiori dettagli: [/concepts/oauth](/it/concepts/oauth)
    <Note>
    Suggerimento headless/server: completa OAuth su una macchina con browser, poi copia
    `auth-profiles.json` di quell'agente (per esempio
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o il percorso corrispondente
    `$OPENCLAW_STATE_DIR/...`) sull'host del Gateway. `credentials/oauth.json`
    è solo una sorgente di import legacy.
    </Note>
  </Step>
  <Step title="Workspace">
    - Valore predefinito `~/.openclaw/workspace` (configurabile).
    - Popola i file del workspace necessari per il rituale di bootstrap dell'agente.
    - Layout completo del workspace + guida al backup: [Workspace agente](/it/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Porta, bind, modalità auth, esposizione Tailscale.
    - Raccomandazione auth: mantieni **Token** anche per loopback, così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/archivia token in testo normale** (predefinito)
      - **Usa SecretRef** (opt-in)
      - Quickstart riutilizza i SecretRef `gateway.auth.token` esistenti tra provider `env`, `file` ed `exec` per il probe di onboarding/bootstrap della dashboard.
      - Se quel SecretRef è configurato ma non può essere risolto, l'onboarding fallisce subito con un messaggio di correzione chiaro invece di degradare silenziosamente l'auth a runtime.
    - In modalità password, la configurazione interattiva supporta anche l'archiviazione in testo normale o SecretRef.
    - Percorso SecretRef token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile env non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita auth solo se ti fidi completamente di ogni processo locale.
    - I bind non loopback richiedono comunque auth.

  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): login QR opzionale.
    - [Telegram](/it/channels/telegram): token bot.
    - [Discord](/it/channels/discord): token bot.
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + audience Webhook.
    - [Mattermost](/it/channels/mattermost) (Plugin): token bot + URL di base.
    - [Signal](/it/channels/signal): installazione opzionale di `signal-cli` + configurazione account.
    - [BlueBubbles](/it/channels/bluebubbles): **consigliato per iMessage**; URL server + password + Webhook.
    - [iMessage](/it/channels/imessage): percorso CLI legacy `imsg` + accesso DB.
    - Sicurezza DM: il valore predefinito è l'associazione. Il primo DM invia un codice; approva con `openclaw pairing approve <channel> <code>` oppure usa allowlist.

  </Step>
  <Step title="Ricerca web">
    - Scegli un provider supportato come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (oppure salta).
    - I provider basati su API possono usare variabili env o configurazione esistente per una configurazione rapida; i provider senza chiave usano invece i rispettivi prerequisiti specifici.
    - Salta con `--skip-search`.
    - Configura in seguito: `openclaw configure --section web`.

  </Step>
  <Step title="Installazione daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente con accesso effettuato; per headless, usa un LaunchDaemon personalizzato (non fornito).
    - Linux (e Windows tramite WSL2): unità systemd utente
      - L'onboarding prova ad abilitare lingering tramite `loginctl enable-linger <user>` così il Gateway resta attivo dopo il logout.
      - Potrebbe richiedere sudo (scrive in `/var/lib/systemd/linger`); prova prima senza sudo.
    - **Selezione runtime:** Node (consigliato; richiesto per WhatsApp/Telegram). Bun **non è consigliato**.
    - Se l'auth token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione del daemon lo valida ma non persiste i valori del token in testo normale risolti nei metadati dell'ambiente del servizio supervisor.
    - Se l'auth token richiede un token e il SecretRef token configurato non è risolto, l'installazione del daemon viene bloccata con indicazioni operative.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l'installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.

  </Step>
  <Step title="Controllo stato">
    - Avvia il Gateway (se necessario) ed esegue `openclaw health`.
    - Suggerimento: `openclaw status --deep` aggiunge il probe live dello stato del gateway all'output di stato, inclusi i probe dei canali quando supportati (richiede un gateway raggiungibile).

  </Step>
  <Step title="Skills (consigliato)">
    - Legge le skills disponibili e verifica i requisiti.
    - Ti permette di scegliere un gestore node: **npm / pnpm** (bun non consigliato).
    - Installa dipendenze opzionali (alcune usano Homebrew su macOS).

  </Step>
  <Step title="Fine">
    - Riepilogo + passaggi successivi, incluse app iOS/Android/macOS per funzionalità aggiuntive.

  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, l'onboarding stampa istruzioni SSH di port-forward per la Control UI invece di aprire un browser.
Se gli asset della Control UI mancano, l'onboarding prova a compilarli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
</Note>

## Modalità non interattiva

Usa `--non-interactive` per automatizzare o scriptare l'onboarding:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Aggiungi `--json` per un riepilogo leggibile da macchina.

SecretRef del token Gateway in modalità non interattiva:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` e `--gateway-token-ref-env` si escludono a vicenda.

<Note>
`--json` **non** implica la modalità non interattiva. Usa `--non-interactive` (e `--workspace`) per gli script.
</Note>

Esempi di comandi specifici per provider sono disponibili in [Automazione CLI](/it/start/wizard-cli-automation#provider-specific-examples).
Usa questa pagina di riferimento per la semantica dei flag e l'ordine dei passaggi.

### Aggiungi agente (non interattivo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC della procedura guidata del Gateway

Il Gateway espone il flusso di onboarding tramite RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
I client (app macOS, Control UI) possono renderizzare i passaggi senza reimplementare la logica di onboarding.

## Configurazione Signal (signal-cli)

L'onboarding può installare `signal-cli` dalle release GitHub:

- Scarica l'asset di release appropriato.
- Lo archivia in `~/.openclaw/tools/signal-cli/<version>/`.
- Scrive `channels.signal.cliPath` nella tua configurazione.

Note:

- Le build JVM richiedono **Java 21**.
- Le build native vengono usate quando disponibili.
- Windows usa WSL2; l'installazione di signal-cli segue il flusso Linux dentro WSL.

## Cosa scrive la procedura guidata

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se è stato scelto Minimax)
- `tools.profile` (la configurazione iniziale locale usa `"coding"` come valore predefinito quando non è impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (modalità, bind, autenticazione, tailscale)
- `session.dmScope` (dettagli sul comportamento: [Riferimento alla configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Elenchi di autorizzazione dei canali (Slack/Discord/Matrix/Microsoft Teams) quando li abiliti durante i prompt (i nomi vengono risolti in ID quando possibile).
- `skills.install.nodeManager`
  - `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque usare `yarn` impostando direttamente `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` scrive `agents.list[]` e i `bindings` facoltativi.

Le credenziali di WhatsApp vanno in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni vengono archiviate in `~/.openclaw/agents/<agentId>/sessions/`.

Alcuni canali vengono distribuiti come plugin. Quando ne scegli uno durante la configurazione,
la configurazione iniziale chiederà di installarlo (npm o un percorso locale) prima che possa essere configurato.

## Documentazione correlata

- Panoramica della configurazione iniziale: [Configurazione iniziale (CLI)](/it/start/wizard)
- Configurazione iniziale dell’app macOS: [Configurazione iniziale](/it/start/onboarding)
- Riferimento della configurazione: [Configurazione del Gateway](/it/gateway/configuration)
- Provider: [WhatsApp](/it/channels/whatsapp), [Telegram](/it/channels/telegram), [Discord](/it/channels/discord), [Google Chat](/it/channels/googlechat), [Signal](/it/channels/signal), [BlueBubbles](/it/channels/bluebubbles) (iMessage), [iMessage](/it/channels/imessage) (legacy)
- Skills: [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config)
