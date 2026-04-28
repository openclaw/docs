---
read_when:
    - Cerchi un passaggio o un flag specifico dell'onboarding
    - Automatizzare l'onboarding con modalità non interattiva
    - Eseguire il debug del comportamento dell'onboarding
sidebarTitle: Onboarding Reference
summary: 'Riferimento completo per l''onboarding CLI: ogni passaggio, flag e campo di configurazione'
title: Riferimento onboarding
x-i18n:
    generated_at: "2026-04-25T18:22:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 729a12bac6b67b32ba4b2b2068a30240d2118f5afe3812c701ee65d7b7e13018
    source_path: reference/wizard.md
    workflow: 15
---

Questo è il riferimento completo per `openclaw onboard`.
Per una panoramica di alto livello, vedi [Onboarding (CLI)](/it/start/wizard).

## Dettagli del flusso (modalità locale)

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se `~/.openclaw/openclaw.json` esiste, scegli **Mantieni / Modifica / Reimposta**.
    - Rieseguire l'onboarding **non** cancella nulla a meno che tu non scelga esplicitamente **Reimposta**
      (oppure passi `--reset`).
    - `--reset` nella CLI usa come valore predefinito `config+creds+sessions`; usa `--reset-scope full`
      per rimuovere anche il workspace.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si ferma e chiede
      di eseguire `openclaw doctor` prima di continuare.
    - La reimpostazione usa `trash` (mai `rm`) e offre questi scope:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reimpostazione completa (rimuove anche il workspace)

  </Step>
  <Step title="Modello/Autenticazione">
    - **Chiave API Anthropic**: usa `ANTHROPIC_API_KEY` se presente oppure chiede una chiave, poi la salva per l'uso del daemon.
    - **Chiave API Anthropic**: scelta assistente Anthropic preferita in onboarding/configurazione.
    - **Setup-token Anthropic**: ancora disponibile in onboarding/configurazione, anche se OpenClaw ora preferisce il riuso di Claude CLI quando disponibile.
    - **Abbonamento OpenAI Code (Codex) (OAuth)**: flusso browser; incolla `code#state`.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.
    - **Abbonamento OpenAI Code (Codex) (associazione dispositivo)**: flusso di associazione nel browser con un codice dispositivo di breve durata.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.
    - **Chiave API OpenAI**: usa `OPENAI_API_KEY` se presente oppure chiede una chiave, poi la memorizza nei profili di autenticazione.
      - Imposta `agents.defaults.model` su `openai/gpt-5.5` quando il modello non è impostato, `openai/*` o `openai-codex/*`.
    - **Chiave API xAI (Grok)**: chiede `XAI_API_KEY` e configura xAI come provider di modelli.
    - **OpenCode**: chiede `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`, ottienila su https://opencode.ai/auth) e ti permette di scegliere il catalogo Zen o Go.
    - **Ollama**: offre prima **Cloud + Local**, **Solo Cloud** oppure **Solo Local**. `Solo Cloud` chiede `OLLAMA_API_KEY` e usa `https://ollama.com`; le modalità supportate dall'host chiedono l'URL base di Ollama, rilevano i modelli disponibili e scaricano automaticamente il modello locale selezionato quando necessario; `Cloud + Local` controlla anche se quell'host Ollama ha effettuato l'accesso per l'accesso cloud.
    - Maggiori dettagli: [Ollama](/it/providers/ollama)
    - **Chiave API**: memorizza la chiave per te.
    - **Vercel AI Gateway (proxy multi-modello)**: chiede `AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: chiede Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configurazione viene scritta automaticamente; il valore predefinito hosted è `MiniMax-M2.7`.
      La configurazione con chiave API usa `minimax/...`, e la configurazione OAuth usa
      `minimax-portal/...`.
    - Maggiori dettagli: [MiniMax](/it/providers/minimax)
    - **StepFun**: la configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint Cina o globali.
    - Standard include attualmente `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    - Maggiori dettagli: [StepFun](/it/providers/stepfun)
    - **Synthetic (compatibile Anthropic)**: chiede `SYNTHETIC_API_KEY`.
    - Maggiori dettagli: [Synthetic](/it/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configurazione viene scritta automaticamente.
    - **Kimi Coding**: la configurazione viene scritta automaticamente.
    - Maggiori dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot)
    - **Salta**: nessuna autenticazione ancora configurata.
    - Scegli un modello predefinito tra le opzioni rilevate (oppure inserisci manualmente provider/modello). Per la migliore qualità e un minor rischio di prompt injection, scegli il modello di ultima generazione più potente disponibile nel tuo stack di provider.
    - L'onboarding esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o privo di autenticazione.
    - La modalità di archiviazione predefinita delle chiavi API usa valori in chiaro nei profili di autenticazione. Usa `--secret-input-mode ref` per memorizzare invece riferimenti supportati da env (per esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - I profili di autenticazione si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chiavi API + OAuth). `~/.openclaw/credentials/oauth.json` è legacy e serve solo per l'importazione.
    - Maggiori dettagli: [/concepts/oauth](/it/concepts/oauth)
    <Note>
    Suggerimento per ambienti headless/server: completa OAuth su una macchina con browser, poi copia
    `auth-profiles.json` di quell'agente (per esempio
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o il percorso
    corrispondente `$OPENCLAW_STATE_DIR/...`) sull'host gateway. `credentials/oauth.json`
    è solo una sorgente legacy per l'importazione.
    </Note>
  </Step>
  <Step title="Workspace">
    - Predefinito `~/.openclaw/workspace` (configurabile).
    - Inizializza i file del workspace necessari per il rituale di bootstrap dell'agente.
    - Guida completa al layout del workspace + backup: [Workspace agente](/it/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Porta, bind, modalità di autenticazione, esposizione Tailscale.
    - Raccomandazione per l'autenticazione: mantieni **Token** anche per loopback così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/memorizza token in chiaro** (predefinito)
      - **Usa SecretRef** (opt-in)
      - Quickstart riusa i SecretRef esistenti di `gateway.auth.token` nei provider `env`, `file` ed `exec` per la probe di onboarding/bootstrap della dashboard.
      - Se quel SecretRef è configurato ma non può essere risolto, l'onboarding fallisce subito con un chiaro messaggio di correzione invece di degradare silenziosamente l'autenticazione runtime.
    - In modalità password, la configurazione interattiva supporta anche l'archiviazione in chiaro o SecretRef.
    - Percorso SecretRef del token in modalità non interattiva: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile env non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'autenticazione solo se ti fidi completamente di ogni processo locale.
    - I bind non loopback richiedono comunque autenticazione.

  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): login QR facoltativo.
    - [Telegram](/it/channels/telegram): token del bot.
    - [Discord](/it/channels/discord): token del bot.
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + audience del Webhook.
    - [Mattermost](/it/channels/mattermost) (Plugin): token del bot + URL base.
    - [Signal](/it/channels/signal): installazione facoltativa di `signal-cli` + configurazione dell'account.
    - [BlueBubbles](/it/channels/bluebubbles): **consigliato per iMessage**; URL del server + password + Webhook.
    - [iMessage](/it/channels/imessage): percorso legacy di `imsg` CLI + accesso DB.
    - Sicurezza DM: il valore predefinito è pairing. Il primo DM invia un codice; approvalo con `openclaw pairing approve <channel> <code>` oppure usa allowlist.

  </Step>
  <Step title="Ricerca web">
    - Scegli un provider supportato come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (oppure salta).
    - I provider basati su API possono usare variabili env o configurazione esistente per la configurazione rapida; i provider senza chiave usano invece i prerequisiti specifici del proprio provider.
    - Salta con `--skip-search`.
    - Configura in seguito: `openclaw configure --section web`.

  </Step>
  <Step title="Installazione del daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente con login attivo; per ambienti headless, usa un LaunchDaemon personalizzato (non fornito).
    - Linux (e Windows tramite WSL2): unit user systemd
      - L'onboarding tenta di abilitare il lingering tramite `loginctl enable-linger <user>` così Gateway resta attivo dopo il logout.
      - Può richiedere sudo (scrive in `/var/lib/systemd/linger`); prima prova senza sudo.
    - **Selezione del runtime:** Node (consigliato; richiesto per WhatsApp/Telegram). Bun **non è consigliato**.
    - Se l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione del daemon lo convalida ma non mantiene i valori di token risolti in chiaro nei metadati dell'ambiente del servizio supervisor.
    - Se l'autenticazione token richiede un token e il SecretRef del token configurato non è risolto, l'installazione del daemon viene bloccata con indicazioni operative.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.

  </Step>
  <Step title="Controllo di integrità">
    - Avvia Gateway (se necessario) ed esegue `openclaw health`.
    - Suggerimento: `openclaw status --deep` aggiunge alla visualizzazione di stato la probe live di integrità del gateway, comprese le probe dei canali quando supportate (richiede un gateway raggiungibile).

  </Step>
  <Step title="Skills (consigliato)">
    - Legge le Skills disponibili e controlla i requisiti.
    - Ti permette di scegliere un gestore Node: **npm / pnpm** (bun non consigliato).
    - Installa dipendenze facoltative (alcune usano Homebrew su macOS).

  </Step>
  <Step title="Fine">
    - Riepilogo + passaggi successivi, incluse le app iOS/Android/macOS per funzionalità aggiuntive.

  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, l'onboarding stampa le istruzioni per il port-forward SSH della Control UI invece di aprire un browser.
Se mancano le risorse della Control UI, l'onboarding prova a compilarle; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
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

Aggiungi `--json` per un riepilogo leggibile da macchina.

Gateway token SecretRef in modalità non interattiva:

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

### Aggiungere agente (modalità non interattiva)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC della procedura guidata Gateway

Gateway espone il flusso di onboarding tramite RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
I client (app macOS, Control UI) possono renderizzare i passaggi senza reimplementare la logica di onboarding.

## Configurazione Signal (signal-cli)

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
- `agents.defaults.model` / `models.providers` (se viene scelto Minimax)
- `tools.profile` (l'onboarding locale usa per impostazione predefinita `"coding"` quando non impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (dettagli del comportamento: [Riferimento configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist dei canali (Slack/Discord/Matrix/Microsoft Teams) quando scegli l'opzione durante i prompt (i nomi vengono risolti in ID quando possibile).
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
Le sessioni sono archiviate in `~/.openclaw/agents/<agentId>/sessions/`.

Alcuni canali vengono forniti come Plugin. Quando ne scegli uno durante la configurazione, l'onboarding
ti chiederà di installarlo (npm o un percorso locale) prima che possa essere configurato.

## Documentazione correlata

- Panoramica onboarding: [Onboarding (CLI)](/it/start/wizard)
- Onboarding dell'app macOS: [Onboarding](/it/start/onboarding)
- Riferimento configurazione: [Configurazione del Gateway](/it/gateway/configuration)
- Provider: [WhatsApp](/it/channels/whatsapp), [Telegram](/it/channels/telegram), [Discord](/it/channels/discord), [Google Chat](/it/channels/googlechat), [Signal](/it/channels/signal), [BlueBubbles](/it/channels/bluebubbles) (iMessage), [iMessage](/it/channels/imessage) (legacy)
- Skills: [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config)
