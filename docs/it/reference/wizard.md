---
read_when:
    - Cerchi uno specifico passaggio o flag dell'onboarding
    - Vuoi automatizzare l'onboarding con la modalità non interattiva
    - Stai eseguendo il debug del comportamento dell'onboarding
sidebarTitle: Onboarding Reference
summary: 'Riferimento completo per l''onboarding CLI: ogni passaggio, flag e campo di configurazione'
title: Riferimento dell'onboarding
x-i18n:
    generated_at: "2026-04-07T08:17:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a142b9ec4323fabb9982d05b64375d2b4a4007dffc910acbee3a38ff871a7236
    source_path: reference/wizard.md
    workflow: 15
---

# Riferimento dell'onboarding

Questo è il riferimento completo per `openclaw onboard`.
Per una panoramica di alto livello, vedi [Onboarding (CLI)](/it/start/wizard).

## Dettagli del flusso (modalità locale)

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se `~/.openclaw/openclaw.json` esiste, scegli **Mantieni / Modifica / Reimposta**.
    - Rieseguire l'onboarding **non** cancella nulla a meno che tu non scelga esplicitamente **Reimposta**
      (o passi `--reset`).
    - `--reset` nella CLI usa come valore predefinito `config+creds+sessions`; usa `--reset-scope full`
      per rimuovere anche il workspace.
    - Se la configurazione non è valida o contiene chiavi legacy, il wizard si interrompe e ti chiede
      di eseguire `openclaw doctor` prima di continuare.
    - La reimpostazione usa `trash` (mai `rm`) e offre questi ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reimpostazione completa (rimuove anche il workspace)
  </Step>
  <Step title="Modello/Auth">
    - **Chiave API Anthropic**: usa `ANTHROPIC_API_KEY` se presente oppure richiede una chiave, poi la salva per l'uso da parte del daemon.
    - **Chiave API Anthropic**: scelta assistente Anthropic preferita in onboarding/configure.
    - **Setup-token Anthropic**: ancora disponibile in onboarding/configure, anche se OpenClaw ora preferisce il riuso di Claude CLI quando disponibile.
    - **Abbonamento OpenAI Code (Codex) (Codex CLI)**: se esiste `~/.codex/auth.json`, l'onboarding può riutilizzarlo. Le credenziali Codex CLI riutilizzate restano gestite da Codex CLI; alla scadenza OpenClaw rilegge prima quella sorgente e, quando il provider può aggiornarla, riscrive la credenziale aggiornata nello storage Codex invece di assumerne direttamente la gestione.
    - **Abbonamento OpenAI Code (Codex) (OAuth)**: flusso browser; incolla `code#state`.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.4` quando il modello non è impostato oppure è `openai/*`.
    - **Chiave API OpenAI**: usa `OPENAI_API_KEY` se presente oppure richiede una chiave, poi la archivia nei profili auth.
      - Imposta `agents.defaults.model` su `openai/gpt-5.4` quando il modello non è impostato, è `openai/*` oppure `openai-codex/*`.
    - **Chiave API xAI (Grok)**: richiede `XAI_API_KEY` e configura xAI come provider di modelli.
    - **OpenCode**: richiede `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, ottenibile da https://opencode.ai/auth) e ti permette di scegliere il catalogo Zen o Go.
    - **Ollama**: richiede l'URL di base di Ollama, offre la modalità **Cloud + Local** o **Local**, rileva i modelli disponibili ed esegue automaticamente il pull del modello locale selezionato quando necessario.
    - Maggiori dettagli: [Ollama](/it/providers/ollama)
    - **Chiave API**: archivia la chiave per te.
    - **Vercel AI Gateway (proxy multi-modello)**: richiede `AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: richiede Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configurazione viene scritta automaticamente; il valore predefinito hosted è `MiniMax-M2.7`.
      La configurazione con chiave API usa `minimax/...`, e la configurazione OAuth usa
      `minimax-portal/...`.
    - Maggiori dettagli: [MiniMax](/it/providers/minimax)
    - **StepFun**: la configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint Cina o globali.
    - Lo standard include attualmente `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    - Maggiori dettagli: [StepFun](/it/providers/stepfun)
    - **Synthetic (compatibile con Anthropic)**: richiede `SYNTHETIC_API_KEY`.
    - Maggiori dettagli: [Synthetic](/it/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configurazione viene scritta automaticamente.
    - **Kimi Coding**: la configurazione viene scritta automaticamente.
    - Maggiori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot)
    - **Salta**: nessuna autenticazione ancora configurata.
    - Scegli un modello predefinito tra le opzioni rilevate (oppure inserisci manualmente provider/model). Per la migliore qualità e un rischio minore di prompt injection, scegli il modello più potente e di ultima generazione disponibile nel tuo stack provider.
    - L'onboarding esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'autenticazione.
    - La modalità di archiviazione predefinita delle chiavi API usa valori in chiaro nei profili auth. Usa `--secret-input-mode ref` per archiviare invece riferimenti basati su env (per esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - I profili auth si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chiavi API + OAuth). `~/.openclaw/credentials/oauth.json` è legacy e serve solo per l'importazione.
    - Maggiori dettagli: [/concepts/oauth](/it/concepts/oauth)
    <Note>
    Suggerimento per ambienti headless/server: completa OAuth su una macchina con browser, poi copia
    l'`auth-profiles.json` di quell'agente (per esempio
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o il percorso corrispondente
    `$OPENCLAW_STATE_DIR/...`) sull'host gateway. `credentials/oauth.json`
    è solo una sorgente legacy di importazione.
    </Note>
  </Step>
  <Step title="Workspace">
    - Valore predefinito `~/.openclaw/workspace` (configurabile).
    - Inizializza i file workspace necessari per il rituale di bootstrap dell'agente.
    - Layout completo del workspace + guida ai backup: [Workspace dell'agente](/it/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Porta, bind, modalità auth, esposizione Tailscale.
    - Raccomandazione auth: mantieni **Token** anche per loopback così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/archivia token in chiaro** (predefinito)
      - **Usa SecretRef** (opt-in)
      - Quickstart riutilizza i SecretRef esistenti di `gateway.auth.token` nei provider `env`, `file` ed `exec` per probe di onboarding/bootstrap della dashboard.
      - Se quel SecretRef è configurato ma non può essere risolto, l'onboarding fallisce subito con un chiaro messaggio di correzione invece di degradare silenziosamente l'auth runtime.
    - In modalità password, anche la configurazione interattiva supporta l'archiviazione in chiaro o SecretRef.
    - Percorso SecretRef del token in modalità non interattiva: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile env non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disattiva l'autenticazione solo se ti fidi completamente di ogni processo locale.
    - I bind non-loopback richiedono comunque l'autenticazione.
  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): login QR facoltativo.
    - [Telegram](/it/channels/telegram): token bot.
    - [Discord](/it/channels/discord): token bot.
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + audience del webhook.
    - [Mattermost](/it/channels/mattermost) (plugin): token bot + URL di base.
    - [Signal](/it/channels/signal): installazione facoltativa di `signal-cli` + configurazione account.
    - [BlueBubbles](/it/channels/bluebubbles): **consigliato per iMessage**; URL server + password + webhook.
    - [iMessage](/it/channels/imessage): percorso legacy `imsg` CLI + accesso al DB.
    - Sicurezza DM: il valore predefinito è pairing. Il primo DM invia un codice; approvalo con `openclaw pairing approve <channel> <code>` oppure usa allowlist.
  </Step>
  <Step title="Ricerca web">
    - Scegli un provider supportato come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (oppure salta).
    - I provider basati su API possono usare variabili env o configurazione esistente per una configurazione rapida; i provider senza chiave usano invece i prerequisiti specifici del provider.
    - Salta con `--skip-search`.
    - Configura in seguito: `openclaw configure --section web`.
  </Step>
  <Step title="Installazione del daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente connessa; per ambienti headless, usa un LaunchDaemon personalizzato (non distribuito).
    - Linux (e Windows tramite WSL2): unità systemd utente
      - L'onboarding tenta di abilitare lingering tramite `loginctl enable-linger <user>` così il Gateway resta attivo dopo il logout.
      - Può richiedere sudo (scrive in `/var/lib/systemd/linger`); prova prima senza sudo.
    - **Selezione del runtime:** Node (consigliato; richiesto per WhatsApp/Telegram). Bun **non è consigliato**.
    - Se l'auth token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione del daemon lo valida ma non persiste valori di token risolti in chiaro nei metadati dell'ambiente del servizio supervisor.
    - Se l'auth token richiede un token e il SecretRef token configurato non è risolto, l'installazione del daemon viene bloccata con indicazioni operative.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.
  </Step>
  <Step title="Controllo integrità">
    - Avvia il Gateway (se necessario) ed esegue `openclaw health`.
    - Suggerimento: `openclaw status --deep` aggiunge la probe live di integrità del gateway all'output di stato, incluse probe dei canali quando supportate (richiede un gateway raggiungibile).
  </Step>
  <Step title="Skills (consigliato)">
    - Legge le Skills disponibili e controlla i requisiti.
    - Ti consente di scegliere un gestore Node: **npm / pnpm** (bun non consigliato).
    - Installa dipendenze facoltative (alcune usano Homebrew su macOS).
  </Step>
  <Step title="Fine">
    - Riepilogo + passaggi successivi, incluse app iOS/Android/macOS per funzionalità extra.
  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, l'onboarding stampa le istruzioni di port forwarding SSH per la Control UI invece di aprire un browser.
Se mancano gli asset della Control UI, l'onboarding tenta di compilarli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
</Note>

## Modalità non interattiva

Usa `--non-interactive` per automatizzare o creare script per l'onboarding:

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

Aggiungi `--json` per un riepilogo leggibile dalla macchina.

SecretRef del token gateway in modalità non interattiva:

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

Gli esempi di comandi specifici per provider si trovano in [Automazione CLI](/it/start/wizard-cli-automation#provider-specific-examples).
Usa questa pagina di riferimento per la semantica dei flag e l'ordine dei passaggi.

### Aggiungere un agente (non interattivo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC del wizard del gateway

Il Gateway espone il flusso di onboarding tramite RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
I client (app macOS, Control UI) possono visualizzare i passaggi senza reimplementare la logica di onboarding.

## Configurazione Signal (`signal-cli`)

L'onboarding può installare `signal-cli` dalle release GitHub:

- Scarica l'asset di release appropriato.
- Lo archivia in `~/.openclaw/tools/signal-cli/<version>/`.
- Scrive `channels.signal.cliPath` nella tua configurazione.

Note:

- Le build JVM richiedono **Java 21**.
- Le build native vengono usate quando disponibili.
- Windows usa WSL2; l'installazione di signal-cli segue il flusso Linux dentro WSL.

## Cosa scrive il wizard

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se viene scelto Minimax)
- `tools.profile` (l'onboarding locale usa come predefinito `"coding"` quando non impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (dettagli del comportamento: [Riferimento della configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist dei canali (Slack/Discord/Matrix/Microsoft Teams) quando aderisci durante i prompt (i nomi vengono risolti in ID quando possibile).
- `skills.install.nodeManager`
  - `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque usare `yarn` impostando direttamente `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` scrive `agents.list[]` e `bindings` facoltativi.

Le credenziali WhatsApp vengono salvate in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni vengono archiviate in `~/.openclaw/agents/<agentId>/sessions/`.

Alcuni canali sono distribuiti come plugin. Quando ne scegli uno durante la configurazione, l'onboarding
ti chiederà di installarlo (npm o percorso locale) prima che possa essere configurato.

## Documentazione correlata

- Panoramica dell'onboarding: [Onboarding (CLI)](/it/start/wizard)
- Onboarding dell'app macOS: [Onboarding](/it/start/onboarding)
- Riferimento della configurazione: [Configurazione del gateway](/it/gateway/configuration)
- Provider: [WhatsApp](/it/channels/whatsapp), [Telegram](/it/channels/telegram), [Discord](/it/channels/discord), [Google Chat](/it/channels/googlechat), [Signal](/it/channels/signal), [BlueBubbles](/it/channels/bluebubbles) (iMessage), [iMessage](/it/channels/imessage) (legacy)
- Skills: [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config)
