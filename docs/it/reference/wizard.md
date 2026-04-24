---
read_when:
    - Ricerca di un passaggio o flag specifico dell'onboarding
    - Automazione dell'onboarding con modalità non interattiva
    - Debug del comportamento dell'onboarding
sidebarTitle: Onboarding Reference
summary: 'Riferimento completo per l''onboarding CLI: ogni passaggio, flag e campo di configurazione'
title: Riferimento onboarding
x-i18n:
    generated_at: "2026-04-24T09:02:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

Questo è il riferimento completo per `openclaw onboard`.
Per una panoramica di alto livello, vedi [Onboarding (CLI)](/it/start/wizard).

## Dettagli del flusso (modalità locale)

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se `~/.openclaw/openclaw.json` esiste, scegli **Keep / Modify / Reset**.
    - Eseguire di nuovo l'onboarding **non** cancella nulla a meno che tu non scelga esplicitamente **Reset**
      (oppure passi `--reset`).
    - La CLI `--reset` usa come predefinito `config+creds+sessions`; usa `--reset-scope full`
      per rimuovere anche il workspace.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si interrompe e ti chiede
      di eseguire `openclaw doctor` prima di continuare.
    - Reset usa `trash` (mai `rm`) e offre questi ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reset completo (rimuove anche il workspace)
  </Step>
  <Step title="Model/Auth">
    - **Chiave API Anthropic**: usa `ANTHROPIC_API_KEY` se presente oppure richiede una chiave, quindi la salva per l'uso daemon.
    - **Chiave API Anthropic**: scelta preferita dell'assistente Anthropic in onboarding/configure.
    - **Anthropic setup-token**: ancora disponibile in onboarding/configure, anche se OpenClaw ora preferisce il riuso di Claude CLI quando disponibile.
    - **Abbonamento OpenAI Code (Codex) (OAuth)**: flusso browser; incolla `code#state`.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.
    - **Abbonamento OpenAI Code (Codex) (device pairing)**: flusso di pairing via browser con un codice dispositivo a breve durata.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.
    - **Chiave API OpenAI**: usa `OPENAI_API_KEY` se presente oppure richiede una chiave, quindi la archivia nei profili auth.
      - Imposta `agents.defaults.model` su `openai/gpt-5.4` quando il modello non è impostato, è `openai/*` oppure `openai-codex/*`.
    - **Chiave API xAI (Grok)**: richiede `XAI_API_KEY` e configura xAI come provider di modelli.
    - **OpenCode**: richiede `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, ottienila da https://opencode.ai/auth) e ti consente di scegliere il catalogo Zen o Go.
    - **Ollama**: offre prima **Cloud + Local**, **Cloud only** oppure **Local only**. `Cloud only` richiede `OLLAMA_API_KEY` e usa `https://ollama.com`; le modalità supportate dall'host richiedono la base URL di Ollama, rilevano i modelli disponibili e scaricano automaticamente il modello locale selezionato quando necessario; `Cloud + Local` controlla anche se quell'host Ollama ha effettuato l'accesso per l'accesso cloud.
    - Maggiori dettagli: [Ollama](/it/providers/ollama)
    - **Chiave API**: salva la chiave per te.
    - **Vercel AI Gateway (proxy multi-modello)**: richiede `AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: richiede Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configurazione viene scritta automaticamente; il valore predefinito ospitato è `MiniMax-M2.7`.
      La configurazione con chiave API usa `minimax/...`, e la configurazione OAuth usa
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
    - **Skip**: nessuna autenticazione configurata per ora.
    - Scegli un modello predefinito tra le opzioni rilevate (oppure inserisci manualmente provider/model). Per la migliore qualità e un rischio minore di prompt injection, scegli il modello più forte di ultima generazione disponibile nel tuo stack provider.
    - L'onboarding esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o se manca l'auth.
    - La modalità di archiviazione delle chiavi API usa come predefinito valori plaintext nei profili auth. Usa `--secret-input-mode ref` per archiviare invece riferimenti supportati da env (ad esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - I profili auth si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chiavi API + OAuth). `~/.openclaw/credentials/oauth.json` è legacy e serve solo per l'importazione.
    - Maggiori dettagli: [/concepts/oauth](/it/concepts/oauth)
    <Note>
    Suggerimento per ambienti headless/server: completa OAuth su una macchina con browser, poi copia
    il file `auth-profiles.json` di quell'agente (ad esempio
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o il percorso
    corrispondente `$OPENCLAW_STATE_DIR/...`) sull'host del gateway. `credentials/oauth.json`
    è solo una sorgente legacy per l'importazione.
    </Note>
  </Step>
  <Step title="Workspace">
    - Predefinito `~/.openclaw/workspace` (configurabile).
    - Inizializza i file del workspace necessari per il rituale bootstrap dell'agente.
    - Layout completo del workspace + guida al backup: [Workspace dell'agente](/it/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Porta, bind, modalità auth, esposizione tailscale.
    - Raccomandazione auth: mantieni **Token** anche per loopback così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/archivia token plaintext** (predefinito)
      - **Usa SecretRef** (opt-in)
      - Quickstart riusa i SecretRef esistenti di `gateway.auth.token` tra provider `env`, `file` ed `exec` per la probe/bootstrap della dashboard durante l'onboarding.
      - Se quel SecretRef è configurato ma non può essere risolto, l'onboarding fallisce subito con un messaggio di correzione chiaro invece di degradare silenziosamente l'auth runtime.
    - In modalità password, la configurazione interattiva supporta anche l'archiviazione plaintext o SecretRef.
    - Percorso SecretRef del token in modalità non interattiva: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile env non vuota nell'ambiente di processo dell'onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'auth solo se ti fidi completamente di ogni processo locale.
    - I bind non-loopback richiedono comunque auth.
  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): login QR facoltativo.
    - [Telegram](/it/channels/telegram): token del bot.
    - [Discord](/it/channels/discord): token del bot.
    - [Google Chat](/it/channels/googlechat): JSON dell'account di servizio + audience webhook.
    - [Mattermost](/it/channels/mattermost) (Plugin): token del bot + base URL.
    - [Signal](/it/channels/signal): installazione facoltativa di `signal-cli` + configurazione dell'account.
    - [BlueBubbles](/it/channels/bluebubbles): **consigliato per iMessage**; URL del server + password + webhook.
    - [iMessage](/it/channels/imessage): percorso CLI `imsg` legacy + accesso al DB.
    - Sicurezza DM: il valore predefinito è pairing. La prima DM invia un codice; approvalo tramite `openclaw pairing approve <channel> <code>` oppure usa allowlist.
  </Step>
  <Step title="Ricerca web">
    - Scegli un provider supportato come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (oppure salta).
    - I provider supportati da API possono usare variabili env o configurazione esistente per una configurazione rapida; i provider senza chiave usano i prerequisiti specifici del proprio provider.
    - Salta con `--skip-search`.
    - Configura in seguito: `openclaw configure --section web`.
  </Step>
  <Step title="Installazione del daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente connessa; per ambienti headless usa un LaunchDaemon personalizzato (non incluso).
    - Linux (e Windows tramite WSL2): unit systemd utente
      - L'onboarding tenta di abilitare il lingering tramite `loginctl enable-linger <user>` così il Gateway resta attivo dopo il logout.
      - Può richiedere sudo (scrive in `/var/lib/systemd/linger`); prova prima senza sudo.
    - **Selezione del runtime:** Node (consigliato; richiesto per WhatsApp/Telegram). Bun **non è consigliato**.
    - Se l'auth token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione del daemon lo convalida ma non rende persistenti i valori plaintext del token risolto nei metadati dell'ambiente del supervisore di servizio.
    - Se l'auth token richiede un token e il SecretRef del token configurato non è risolto, l'installazione del daemon viene bloccata con indicazioni operative.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l'installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.
  </Step>
  <Step title="Health check">
    - Avvia il Gateway (se necessario) ed esegue `openclaw health`.
    - Suggerimento: `openclaw status --deep` aggiunge la probe di stato live del gateway all'output di stato, incluse le probe dei canali quando supportate (richiede un gateway raggiungibile).
  </Step>
  <Step title="Skills (consigliato)">
    - Legge le Skills disponibili e controlla i requisiti.
    - Ti permette di scegliere un gestore Node: **npm / pnpm** (bun non è consigliato).
    - Installa dipendenze facoltative (alcune usano Homebrew su macOS).
  </Step>
  <Step title="Fine">
    - Riepilogo + passaggi successivi, incluse app iOS/Android/macOS per funzionalità extra.
  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, l'onboarding stampa istruzioni di port-forward SSH per la UI di controllo invece di aprire un browser.
Se gli asset della UI di controllo mancano, l'onboarding tenta di costruirli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
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

Aggiungi `--json` per un riepilogo leggibile dalla macchina.

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

Gli esempi di comandi specifici del provider si trovano in [Automazione CLI](/it/start/wizard-cli-automation#provider-specific-examples).
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

## RPC wizard del Gateway

Il Gateway espone il flusso di onboarding tramite RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
I client (app macOS, UI di controllo) possono renderizzare i passaggi senza dover reimplementare la logica di onboarding.

## Configurazione di Signal (signal-cli)

L'onboarding può installare `signal-cli` dalle release GitHub:

- Scarica l'asset release appropriato.
- Lo archivia in `~/.openclaw/tools/signal-cli/<version>/`.
- Scrive `channels.signal.cliPath` nella tua configurazione.

Note:

- Le build JVM richiedono **Java 21**.
- Le build native vengono usate quando disponibili.
- Windows usa WSL2; l'installazione di signal-cli segue il flusso Linux all'interno di WSL.

## Cosa scrive la procedura guidata

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se viene scelto Minimax)
- `tools.profile` (l'onboarding locale usa come predefinito `"coding"` quando non impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (dettagli del comportamento: [Riferimento CLI Setup](/it/start/wizard-cli-reference#outputs-and-internals))
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

Le credenziali WhatsApp vengono salvate sotto `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni sono archiviate sotto `~/.openclaw/agents/<agentId>/sessions/`.

Alcuni canali vengono distribuiti come Plugin. Quando ne scegli uno durante la configurazione, l'onboarding
ti chiederà di installarlo (npm o percorso locale) prima che possa essere configurato.

## Documentazione correlata

- Panoramica onboarding: [Onboarding (CLI)](/it/start/wizard)
- Onboarding dell'app macOS: [Onboarding](/it/start/onboarding)
- Riferimento della configurazione: [Configurazione del Gateway](/it/gateway/configuration)
- Provider: [WhatsApp](/it/channels/whatsapp), [Telegram](/it/channels/telegram), [Discord](/it/channels/discord), [Google Chat](/it/channels/googlechat), [Signal](/it/channels/signal), [BlueBubbles](/it/channels/bluebubbles) (iMessage), [iMessage](/it/channels/imessage) (legacy)
- Skills: [Skills](/it/tools/skills), [Configurazione delle Skills](/it/tools/skills-config)
