---
read_when:
    - Cercare un passaggio o un flag specifico della procedura di configurazione iniziale
    - Automatizzare la configurazione iniziale con la modalità non interattiva
    - Debug del comportamento di onboarding
sidebarTitle: Onboarding Reference
summary: 'Riferimento completo per la configurazione iniziale tramite CLI: ogni passaggio, flag e campo di configurazione'
title: Riferimento per l'onboarding
x-i18n:
    generated_at: "2026-05-06T09:08:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce0ddb07600ef4f84c44734176e42eb6beaa00fede0be156f3bdd2ec1c0111bb
    source_path: reference/wizard.md
    workflow: 16
---

Questo è il riferimento completo per `openclaw onboard`.
Per una panoramica generale, vedi [Onboarding (CLI)](/it/start/wizard).

## Dettagli del flusso (modalità locale)

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se `~/.openclaw/openclaw.json` esiste, scegli **Mantieni / Modifica / Reimposta**.
    - Rieseguire l’onboarding **non** cancella nulla, a meno che tu non scelga esplicitamente **Reimposta**
      (o passi `--reset`).
    - CLI `--reset` usa come predefinito `config+creds+sessions`; usa `--reset-scope full`
      per rimuovere anche il workspace.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si ferma e ti chiede
      di eseguire `openclaw doctor` prima di continuare.
    - Il ripristino usa `trash` (mai `rm`) e offre questi ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Ripristino completo (rimuove anche il workspace)

  </Step>
  <Step title="Modello/Auth">
    - **Chiave API Anthropic**: usa `ANTHROPIC_API_KEY` se presente oppure richiede una chiave, poi la salva per l’uso da parte del daemon.
    - **Chiave API Anthropic**: scelta preferita dell’assistente Anthropic in onboarding/configure.
    - **Setup-token Anthropic**: ancora disponibile in onboarding/configure, anche se OpenClaw ora preferisce il riuso della Claude CLI quando disponibile.
    - **Abbonamento OpenAI Code (Codex) (OAuth)**: flusso nel browser; incolla il `code#state`.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.
    - **Abbonamento OpenAI Code (Codex) (associazione dispositivo)**: flusso di associazione nel browser con un codice dispositivo di breve durata.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.
    - **Chiave API OpenAI**: usa `OPENAI_API_KEY` se presente oppure richiede una chiave, poi la archivia nei profili di autenticazione.
      - Imposta `agents.defaults.model` su `openai/gpt-5.5` quando il modello non è impostato, `openai/*`, o `openai-codex/*`.
    - **Chiave API xAI (Grok)**: richiede `XAI_API_KEY` e configura xAI come provider di modelli.
    - **OpenCode**: richiede `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, ottienila su https://opencode.ai/auth) e ti consente di scegliere il catalogo Zen o Go.
    - **Ollama**: propone prima **Cloud + Locale**, **Solo cloud** o **Solo locale**. `Cloud only` richiede `OLLAMA_API_KEY` e usa `https://ollama.com`; le modalità basate su host richiedono l’URL di base di Ollama, rilevano i modelli disponibili ed eseguono automaticamente il pull del modello locale selezionato quando necessario; `Cloud + Local` verifica anche se quell’host Ollama ha effettuato l’accesso per l’accesso cloud.
    - Maggiori dettagli: [Ollama](/it/providers/ollama)
    - **Chiave API**: archivia la chiave per te.
    - **Vercel AI Gateway (proxy multi-modello)**: richiede `AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: richiede Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configurazione viene scritta automaticamente; il predefinito hosted è `MiniMax-M2.7`.
      La configurazione con chiave API usa `minimax/...`, mentre la configurazione OAuth usa
      `minimax-portal/...`.
    - Maggiori dettagli: [MiniMax](/it/providers/minimax)
    - **StepFun**: la configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint cinesi o globali.
    - Standard attualmente include `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    - Maggiori dettagli: [StepFun](/it/providers/stepfun)
    - **Synthetic (compatibile con Anthropic)**: richiede `SYNTHETIC_API_KEY`.
    - Maggiori dettagli: [Synthetic](/it/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configurazione viene scritta automaticamente.
    - **Kimi Coding**: la configurazione viene scritta automaticamente.
    - Maggiori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot)
    - **Salta**: nessuna autenticazione configurata per ora.
    - Scegli un modello predefinito tra le opzioni rilevate (o inserisci manualmente provider/modello). Per la massima qualità e un rischio inferiore di prompt injection, scegli il modello di ultima generazione più potente disponibile nel tuo stack di provider.
    - L’onboarding esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l’autenticazione.
    - La modalità di archiviazione della chiave API usa come predefiniti valori del profilo di autenticazione in testo semplice. Usa `--secret-input-mode ref` per archiviare invece riferimenti basati su env (per esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - I profili di autenticazione si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chiavi API + OAuth). `~/.openclaw/credentials/oauth.json` è solo importazione legacy.
    - Maggiori dettagli: [/concepts/oauth](/it/concepts/oauth)
    <Note>
    Suggerimento headless/server: completa OAuth su una macchina con un browser, poi copia
    l’`auth-profiles.json` di quell’agente (per esempio
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o il percorso corrispondente
    `$OPENCLAW_STATE_DIR/...`) sull’host del Gateway. `credentials/oauth.json`
    è solo una sorgente di importazione legacy.
    </Note>
  </Step>
  <Step title="Workspace">
    - Predefinito `~/.openclaw/workspace` (configurabile).
    - Inizializza i file del workspace necessari per il rituale di bootstrap dell’agente.
    - Layout completo del workspace + guida al backup: [Workspace dell’agente](/it/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Porta, bind, modalità di autenticazione, esposizione Tailscale.
    - Raccomandazione per l’autenticazione: mantieni **Token** anche per loopback, così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/archivia token in testo semplice** (predefinito)
      - **Usa SecretRef** (opzionale)
      - Quickstart riusa SecretRef `gateway.auth.token` esistenti tra provider `env`, `file` ed `exec` per il probe di onboarding/bootstrap della dashboard.
      - Se quel SecretRef è configurato ma non può essere risolto, l’onboarding fallisce subito con un messaggio di correzione chiaro invece di degradare silenziosamente l’autenticazione runtime.
    - In modalità password, la configurazione interattiva supporta anche l’archiviazione in testo semplice o SecretRef.
    - Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile env non vuota nell’ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l’autenticazione solo se ti fidi completamente di ogni processo locale.
    - I bind non-loopback richiedono comunque autenticazione.

  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): login QR opzionale.
    - [Telegram](/it/channels/telegram): token bot.
    - [Discord](/it/channels/discord): token bot.
    - [Google Chat](/it/channels/googlechat): JSON account di servizio + pubblico del Webhook.
    - [Mattermost](/it/channels/mattermost) (plugin): token bot + URL di base.
    - [Signal](/it/channels/signal): installazione opzionale di `signal-cli` + configurazione account.
    - [BlueBubbles](/it/channels/bluebubbles): **consigliato per iMessage**; URL server + password + Webhook.
    - [iMessage](/it/channels/imessage): percorso CLI legacy `imsg` + accesso al DB.
    - Sicurezza dei DM: il predefinito è l’associazione. Il primo DM invia un codice; approvalo con `openclaw pairing approve <channel> <code>` o usa allowlist.

  </Step>
  <Step title="Ricerca web">
    - Scegli un provider supportato come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (oppure salta).
    - I provider basati su API possono usare variabili env o una configurazione esistente per una configurazione rapida; i provider senza chiave usano invece i propri prerequisiti specifici.
    - Salta con `--skip-search`.
    - Configura in seguito: `openclaw configure --section web`.

  </Step>
  <Step title="Installazione del daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente con login effettuato; per headless, usa un LaunchDaemon personalizzato (non distribuito).
    - Linux (e Windows tramite WSL2): unità utente systemd
      - L’onboarding tenta di abilitare il lingering tramite `loginctl enable-linger <user>` così il Gateway resta attivo dopo il logout.
      - Potrebbe richiedere sudo (scrive `/var/lib/systemd/linger`); prova prima senza sudo.
    - **Selezione runtime:** Node (consigliato; richiesto per WhatsApp/Telegram). Bun è **sconsigliato**.
    - Se l’autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l’installazione del daemon lo valida ma non salva i valori del token in testo semplice risolti nei metadati dell’ambiente del servizio supervisor.
    - Se l’autenticazione token richiede un token e il SecretRef del token configurato non è risolto, l’installazione del daemon viene bloccata con indicazioni utilizzabili.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l’installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.

  </Step>
  <Step title="Controllo di integrità">
    - Avvia il Gateway (se necessario) ed esegue `openclaw health`.
    - Suggerimento: `openclaw status --deep` aggiunge il probe di integrità live del Gateway all’output di stato, inclusi i probe dei canali quando supportati (richiede un Gateway raggiungibile).

  </Step>
  <Step title="Skills (consigliato)">
    - Legge le skill disponibili e verifica i requisiti.
    - Ti consente di scegliere un gestore Node: **npm / pnpm** (bun sconsigliato).
    - Installa dipendenze opzionali (alcune usano Homebrew su macOS).

  </Step>
  <Step title="Fine">
    - Riepilogo + passaggi successivi, incluse le app iOS/Android/macOS per funzionalità extra.

  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, l’onboarding stampa le istruzioni di port forwarding SSH per la Control UI invece di aprire un browser.
Se gli asset della Control UI mancano, l’onboarding tenta di compilarli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
</Note>

## Modalità non interattiva

Usa `--non-interactive` per automatizzare o eseguire via script l’onboarding:

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

Esempi di comandi specifici per provider si trovano in [Automazione CLI](/it/start/wizard-cli-automation#provider-specific-examples).
Usa questa pagina di riferimento per la semantica dei flag e l’ordine dei passaggi.

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

L’onboarding può installare `signal-cli` dalle release GitHub:

- Scarica l’asset di release appropriato.
- Lo archivia in `~/.openclaw/tools/signal-cli/<version>/`.
- Scrive `channels.signal.cliPath` nella tua configurazione.

Note:

- Le build JVM richiedono **Java 21**.
- Le build native vengono usate quando disponibili.
- Windows usa WSL2; l’installazione di signal-cli segue il flusso Linux dentro WSL.

## Cosa scrive la procedura guidata

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se è stato scelto Minimax)
- `tools.profile` (la configurazione iniziale locale usa `"coding"` come valore predefinito quando non impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (modalità, bind, auth, tailscale)
- `session.dmScope` (dettagli sul comportamento: [Riferimento alla configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Elenchi consentiti dei canali (Slack/Discord/Matrix/Microsoft Teams) quando li abiliti durante i prompt (i nomi vengono risolti in ID quando possibile).
- `skills.install.nodeManager`
  - `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque usare `yarn` impostando direttamente `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` scrive `agents.list[]` e `bindings` opzionali.

Le credenziali WhatsApp vanno in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni sono archiviate in `~/.openclaw/agents/<agentId>/sessions/`.

Alcuni canali vengono distribuiti come Plugin. Quando ne scegli uno durante la configurazione iniziale, l'onboarding
chiederà di installarlo (npm o un percorso locale) prima che possa essere configurato.

## Documenti correlati

- Panoramica della configurazione iniziale: [Configurazione iniziale (CLI)](/it/start/wizard)
- Configurazione iniziale dell'app macOS: [Configurazione iniziale](/it/start/onboarding)
- Riferimento di configurazione: [Configurazione Gateway](/it/gateway/configuration)
- Provider: [WhatsApp](/it/channels/whatsapp), [Telegram](/it/channels/telegram), [Discord](/it/channels/discord), [Google Chat](/it/channels/googlechat), [Signal](/it/channels/signal), [BlueBubbles](/it/channels/bluebubbles) (iMessage), [iMessage](/it/channels/imessage) (legacy)
- Skills: [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config)
