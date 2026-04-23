---
read_when:
    - Cerchi uno specifico passaggio o flag dell'onboarding
    - Automazione dell'onboarding con modalità non interattiva
    - Debug del comportamento dell'onboarding
sidebarTitle: Onboarding Reference
summary: 'Riferimento completo per l''onboarding CLI: ogni passaggio, flag e campo di configurazione'
title: Riferimento onboarding
x-i18n:
    generated_at: "2026-04-23T08:36:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51405f5d9ba3d9553662fd0a03254a709d5eb4b27339c5edfe1da1111629d0dd
    source_path: reference/wizard.md
    workflow: 15
---

# Riferimento onboarding

Questo è il riferimento completo per `openclaw onboard`.
Per una panoramica di alto livello, vedi [Onboarding (CLI)](/it/start/wizard).

## Dettagli del flusso (modalità locale)

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se `~/.openclaw/openclaw.json` esiste, scegli **Mantieni / Modifica / Reimposta**.
    - Rieseguire l'onboarding **non** cancella nulla a meno che tu non scelga esplicitamente **Reimposta**
      (oppure passi `--reset`).
    - `--reset` nella CLI usa come predefinito `config+creds+sessions`; usa `--reset-scope full`
      per rimuovere anche il workspace.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si ferma e ti chiede
      di eseguire `openclaw doctor` prima di continuare.
    - Il reset usa `trash` (mai `rm`) e offre questi ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reset completo (rimuove anche il workspace)
  </Step>
  <Step title="Modello/Auth">
    - **Chiave API Anthropic**: usa `ANTHROPIC_API_KEY` se presente oppure richiede una chiave, poi la salva per l'uso del daemon.
    - **Chiave API Anthropic**: scelta preferita dell'assistente Anthropic in onboarding/configure.
    - **Anthropic setup-token**: ancora disponibile in onboarding/configure, anche se OpenClaw ora preferisce il riuso di Claude CLI quando disponibile.
    - **Abbonamento OpenAI Code (Codex) (OAuth)**: flusso browser; incolla `code#state`.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.4` quando il modello non è impostato o è `openai/*`.
    - **Abbonamento OpenAI Code (Codex) (abbinamento dispositivo)**: flusso di pairing via browser con codice dispositivo a breve durata.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.4` quando il modello non è impostato o è `openai/*`.
    - **Chiave API OpenAI**: usa `OPENAI_API_KEY` se presente oppure richiede una chiave, poi la memorizza nei profili di autenticazione.
      - Imposta `agents.defaults.model` su `openai/gpt-5.4` quando il modello non è impostato, è `openai/*` oppure `openai-codex/*`.
    - **Chiave API xAI (Grok)**: richiede `XAI_API_KEY` e configura xAI come provider di modelli.
    - **OpenCode**: richiede `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`, ottienilo su https://opencode.ai/auth) e ti consente di scegliere il catalogo Zen o Go.
    - **Ollama**: offre prima **Cloud + Local**, **Solo Cloud** o **Solo Local**. `Solo Cloud` richiede `OLLAMA_API_KEY` e usa `https://ollama.com`; le modalità supportate dall'host richiedono l'URL base di Ollama, rilevano i modelli disponibili ed eseguono automaticamente il pull del modello locale selezionato quando necessario; `Cloud + Local` controlla anche se quell'host Ollama ha effettuato l'accesso per l'accesso cloud.
    - Maggiori dettagli: [Ollama](/it/providers/ollama)
    - **Chiave API**: memorizza la chiave per te.
    - **Vercel AI Gateway (proxy multi-modello)**: richiede `AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: richiede Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configurazione viene scritta automaticamente; il valore predefinito hosted è `MiniMax-M2.7`.
      La configurazione tramite chiave API usa `minimax/...`, mentre la configurazione OAuth usa
      `minimax-portal/...`.
    - Maggiori dettagli: [MiniMax](/it/providers/minimax)
    - **StepFun**: la configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint China o global.
    - Lo standard attualmente include `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    - Maggiori dettagli: [StepFun](/it/providers/stepfun)
    - **Synthetic (compatibile Anthropic)**: richiede `SYNTHETIC_API_KEY`.
    - Maggiori dettagli: [Synthetic](/it/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configurazione viene scritta automaticamente.
    - **Kimi Coding**: la configurazione viene scritta automaticamente.
    - Maggiori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot)
    - **Salta**: nessuna autenticazione configurata ancora.
    - Scegli un modello predefinito tra le opzioni rilevate (oppure inserisci manualmente provider/model). Per la migliore qualità e un minor rischio di prompt injection, scegli il modello più forte disponibile e di ultima generazione nel tuo stack di provider.
    - L'onboarding esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'autenticazione.
    - La modalità di archiviazione delle chiavi API usa come predefinito valori plaintext nei profili di autenticazione. Usa `--secret-input-mode ref` per memorizzare invece riferimenti basati su env (ad esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - I profili di autenticazione si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chiavi API + OAuth). `~/.openclaw/credentials/oauth.json` è solo una sorgente legacy di importazione.
    - Maggiori dettagli: [/concepts/oauth](/it/concepts/oauth)
    <Note>
    Suggerimento per ambienti headless/server: completa OAuth su una macchina con browser, poi copia
    l'`auth-profiles.json` di quell'agente (ad esempio
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o il percorso corrispondente
    `$OPENCLAW_STATE_DIR/...`) sull'host Gateway. `credentials/oauth.json`
    è solo una sorgente di importazione legacy.
    </Note>
  </Step>
  <Step title="Workspace">
    - Predefinito `~/.openclaw/workspace` (configurabile).
    - Inizializza i file del workspace necessari per il rituale di bootstrap dell'agente.
    - Layout completo del workspace + guida al backup: [Workspace dell'agente](/it/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Porta, bind, modalità auth, esposizione tailscale.
    - Raccomandazione auth: mantieni **Token** anche per loopback così i client WS locali devono autenticarsi.
    - In modalità token, il setup interattivo offre:
      - **Genera/memorizza token plaintext** (predefinito)
      - **Usa SecretRef** (opt-in)
      - Quickstart riusa SecretRef esistenti `gateway.auth.token` nei provider `env`, `file` ed `exec` per il bootstrap di probe/dashboard durante l'onboarding.
      - Se quel SecretRef è configurato ma non può essere risolto, l'onboarding fallisce subito con un messaggio di correzione chiaro invece di degradare silenziosamente l'autenticazione runtime.
    - In modalità password, il setup interattivo supporta anche l'archiviazione plaintext o SecretRef.
    - Percorso SecretRef token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile env non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'auth solo se ti fidi completamente di ogni processo locale.
    - I bind non loopback richiedono comunque autenticazione.
  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): accesso QR facoltativo.
    - [Telegram](/it/channels/telegram): token bot.
    - [Discord](/it/channels/discord): token bot.
    - [Google Chat](/it/channels/googlechat): JSON service account + audience Webhook.
    - [Mattermost](/it/channels/mattermost) (Plugin): token bot + URL base.
    - [Signal](/it/channels/signal): installazione facoltativa di `signal-cli` + configurazione account.
    - [BlueBubbles](/it/channels/bluebubbles): **consigliato per iMessage**; URL server + password + Webhook.
    - [iMessage](/it/channels/imessage): percorso legacy `imsg` CLI + accesso DB.
    - Sicurezza DM: il predefinito è pairing. Il primo DM invia un codice; approva tramite `openclaw pairing approve <channel> <code>` oppure usa allowlist.
  </Step>
  <Step title="Ricerca web">
    - Scegli un provider supportato come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (oppure salta).
    - I provider basati su API possono usare variabili env o configurazione esistente per un setup rapido; i provider senza chiave usano invece i prerequisiti specifici del provider.
    - Salta con `--skip-search`.
    - Configura più tardi: `openclaw configure --section web`.
  </Step>
  <Step title="Installazione del daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente con accesso effettuato; per headless, usa un LaunchDaemon personalizzato (non fornito).
    - Linux (e Windows via WSL2): unità systemd utente
      - L'onboarding tenta di abilitare lingering tramite `loginctl enable-linger <user>` così il Gateway resta attivo dopo il logout.
      - Può richiedere sudo (scrive in `/var/lib/systemd/linger`); prova prima senza sudo.
    - **Selezione del runtime:** Node (consigliato; richiesto per WhatsApp/Telegram). Bun **non è consigliato**.
    - Se l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione del daemon lo valida ma non mantiene i valori plaintext risolti del token nei metadati dell'ambiente del servizio supervisor.
    - Se l'autenticazione token richiede un token e il SecretRef token configurato non è risolto, l'installazione del daemon viene bloccata con indicazioni pratiche.
    - Se entrambi `gateway.auth.token` e `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l'installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.
  </Step>
  <Step title="Controllo di integrità">
    - Avvia il Gateway (se necessario) ed esegue `openclaw health`.
    - Suggerimento: `openclaw status --deep` aggiunge il probe live di integrità del Gateway all'output di stato, inclusi i probe dei canali quando supportati (richiede un Gateway raggiungibile).
  </Step>
  <Step title="Skills (consigliato)">
    - Legge le Skills disponibili e controlla i requisiti.
    - Ti consente di scegliere un gestore Node: **npm / pnpm** (bun non consigliato).
    - Installa dipendenze facoltative (alcune usano Homebrew su macOS).
  </Step>
  <Step title="Fine">
    - Riepilogo + passaggi successivi, incluse app iOS/Android/macOS per funzionalità aggiuntive.
  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, l'onboarding stampa istruzioni di port-forward SSH per la UI Control invece di aprire un browser.
Se mancano gli asset della UI Control, l'onboarding tenta di buildarli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
</Note>

## Modalità non interattiva

Usa `--non-interactive` per automatizzare o creare script dell'onboarding:

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
Usa questa pagina di riferimento per la semantica dei flag e l'ordine dei passaggi.

### Aggiungi agente (non interattivo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC della procedura guidata Gateway

Il Gateway espone il flusso di onboarding via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
I client (app macOS, UI Control) possono renderizzare i passaggi senza reimplementare la logica di onboarding.

## Configurazione Signal (`signal-cli`)

L'onboarding può installare `signal-cli` dalle release GitHub:

- Scarica l'asset di release appropriato.
- Lo memorizza in `~/.openclaw/tools/signal-cli/<version>/`.
- Scrive `channels.signal.cliPath` nella tua configurazione.

Note:

- Le build JVM richiedono **Java 21**.
- Le build native vengono usate quando disponibili.
- Windows usa WSL2; l'installazione di signal-cli segue il flusso Linux dentro WSL.

## Cosa scrive la procedura guidata

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se viene scelto MiniMax)
- `tools.profile` (l'onboarding locale usa come predefinito `"coding"` quando non impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (dettagli del comportamento: [Riferimento setup CLI](/it/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist dei canali (Slack/Discord/Matrix/Microsoft Teams) quando scegli esplicitamente di abilitarle durante i prompt (i nomi vengono risolti in ID quando possibile).
- `skills.install.nodeManager`
  - `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque usare `yarn` impostando direttamente `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` scrive `agents.list[]` e `bindings` facoltativi.

Le credenziali WhatsApp vanno sotto `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni vengono memorizzate sotto `~/.openclaw/agents/<agentId>/sessions/`.

Alcuni canali vengono distribuiti come Plugin. Quando ne scegli uno durante il setup, l'onboarding
ti chiederà di installarlo (npm o un percorso locale) prima che possa essere configurato.

## Documentazione correlata

- Panoramica onboarding: [Onboarding (CLI)](/it/start/wizard)
- Onboarding dell'app macOS: [Onboarding](/it/start/onboarding)
- Riferimento configurazione: [Configurazione del Gateway](/it/gateway/configuration)
- Provider: [WhatsApp](/it/channels/whatsapp), [Telegram](/it/channels/telegram), [Discord](/it/channels/discord), [Google Chat](/it/channels/googlechat), [Signal](/it/channels/signal), [BlueBubbles](/it/channels/bluebubbles) (iMessage), [iMessage](/it/channels/imessage) (legacy)
- Skills: [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config)
