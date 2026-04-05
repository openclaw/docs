---
read_when:
    - Consultare un passaggio o un flag specifico dell'onboarding
    - Automatizzare l'onboarding con la modalità non interattiva
    - Eseguire il debug del comportamento dell'onboarding
sidebarTitle: Onboarding Reference
summary: 'Riferimento completo per l''onboarding della CLI: ogni passaggio, flag e campo di configurazione'
title: Riferimento per l'onboarding
x-i18n:
    generated_at: "2026-04-05T14:05:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae6c76a31885c0678af2ac71254c5baf08f6de5481f85f6cfdf44d473946fdb8
    source_path: reference/wizard.md
    workflow: 15
---

# Riferimento per l'onboarding

Questo è il riferimento completo per `openclaw onboard`.
Per una panoramica di alto livello, vedi [Onboarding (CLI)](/start/wizard).

## Dettagli del flusso (modalità locale)

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se `~/.openclaw/openclaw.json` esiste, scegli **Mantieni / Modifica / Reimposta**.
    - Eseguire di nuovo l'onboarding **non** cancella nulla a meno che tu non scelga esplicitamente **Reimposta**
      (o passi `--reset`).
    - La CLI `--reset` usa per impostazione predefinita `config+creds+sessions`; usa `--reset-scope full`
      per rimuovere anche il workspace.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si interrompe e ti chiede
      di eseguire `openclaw doctor` prima di continuare.
    - La reimpostazione usa `trash` (mai `rm`) e offre questi ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reimpostazione completa (rimuove anche il workspace)
  </Step>
  <Step title="Modello/Auth">
    - **Chiave API Anthropic**: usa `ANTHROPIC_API_KEY` se presente oppure richiede una chiave, quindi la salva per l'uso del daemon.
    - **Anthropic Claude CLI**: scelta assistente Anthropic preferita in onboarding/configure. Su macOS l'onboarding controlla l'elemento Portachiavi "Claude Code-credentials" (scegli "Consenti sempre" in modo che gli avvii launchd non vengano bloccati); su Linux/Windows riutilizza `~/.claude/.credentials.json` se presente e cambia la selezione del modello in un riferimento canonico `claude-cli/claude-*`.
    - **Anthropic setup-token (legacy/manuale)**: di nuovo disponibile in onboarding/configure, ma Anthropic ha comunicato agli utenti OpenClaw che il percorso di login Claude di OpenClaw è considerato utilizzo di harness di terze parti e richiede **Extra Usage** sull'account Claude.
    - **Abbonamento OpenAI Code (Codex) (Codex CLI)**: se `~/.codex/auth.json` esiste, l'onboarding può riutilizzarlo. Le credenziali Codex CLI riutilizzate restano gestite da Codex CLI; alla scadenza OpenClaw rilegge prima quella sorgente e, quando il provider può aggiornarla, riscrive la credenziale aggiornata nello storage di Codex invece di assumerne direttamente la gestione.
    - **Abbonamento OpenAI Code (Codex) (OAuth)**: flusso nel browser; incolla `code#state`.
      - Imposta `agents.defaults.model` su `openai-codex/gpt-5.4` quando il modello non è impostato oppure è `openai/*`.
    - **Chiave API OpenAI**: usa `OPENAI_API_KEY` se presente oppure richiede una chiave, quindi la memorizza nei profili auth.
      - Imposta `agents.defaults.model` su `openai/gpt-5.4` quando il modello non è impostato, è `openai/*` o `openai-codex/*`.
    - **Chiave API xAI (Grok)**: richiede `XAI_API_KEY` e configura xAI come provider di modelli.
    - **OpenCode**: richiede `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`, ottienilo su https://opencode.ai/auth) e ti consente di scegliere il catalogo Zen o Go.
    - **Ollama**: richiede l'URL base di Ollama, offre la modalità **Cloud + Locale** o **Locale**, rileva i modelli disponibili ed esegue automaticamente il pull del modello locale selezionato quando necessario.
    - Maggiori dettagli: [Ollama](/it/providers/ollama)
    - **Chiave API**: memorizza la chiave per te.
    - **Vercel AI Gateway (proxy multi-modello)**: richiede `AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: richiede ID account, ID gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Maggiori dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configurazione viene scritta automaticamente; il valore predefinito hosted è `MiniMax-M2.7`.
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
    - **Salta**: nessuna autenticazione ancora configurata.
    - Scegli un modello predefinito tra le opzioni rilevate (oppure inserisci manualmente provider/modello). Per la migliore qualità e un rischio inferiore di prompt injection, scegli il modello più potente e di ultima generazione disponibile nel tuo stack di provider.
    - L'onboarding esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'autenticazione.
    - La modalità di archiviazione delle chiavi API usa per impostazione predefinita valori plaintext nel profilo auth. Usa `--secret-input-mode ref` per memorizzare invece riferimenti supportati da env (per esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - I profili auth si trovano in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chiavi API + OAuth). `~/.openclaw/credentials/oauth.json` è legacy e usato solo per l'importazione.
    - Maggiori dettagli: [/concepts/oauth](/it/concepts/oauth)
    <Note>
    Suggerimento per ambienti headless/server: completa OAuth su una macchina con browser, poi copia
    `auth-profiles.json` di quell'agente (per esempio
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, oppure il percorso
    corrispondente `$OPENCLAW_STATE_DIR/...`) sull'host del gateway. `credentials/oauth.json`
    è solo una sorgente legacy per l'importazione.
    </Note>
  </Step>
  <Step title="Workspace">
    - Valore predefinito `~/.openclaw/workspace` (configurabile).
    - Inizializza i file del workspace necessari per il rituale di bootstrap dell'agente.
    - Layout completo del workspace + guida al backup: [Workspace dell'agente](/it/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Porta, bind, modalità auth, esposizione tailscale.
    - Raccomandazione per l'autenticazione: mantieni **Token** anche per loopback, così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/memorizza token in plaintext** (predefinito)
      - **Usa SecretRef** (facoltativo)
      - Quickstart riutilizza i SecretRef `gateway.auth.token` esistenti nei provider `env`, `file` ed `exec` per il probe/bootstrap della dashboard durante l'onboarding.
      - Se quel SecretRef è configurato ma non può essere risolto, l'onboarding fallisce subito con un messaggio di correzione chiaro invece di degradare silenziosamente l'autenticazione a runtime.
    - In modalità password, la configurazione interattiva supporta anche l'archiviazione in plaintext o SecretRef.
    - Percorso SecretRef per token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile d'ambiente non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'autenticazione solo se ti fidi completamente di ogni processo locale.
    - I bind non loopback richiedono comunque l'autenticazione.
  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): login QR facoltativo.
    - [Telegram](/it/channels/telegram): token bot.
    - [Discord](/it/channels/discord): token bot.
    - [Google Chat](/it/channels/googlechat): JSON account di servizio + audience webhook.
    - [Mattermost](/it/channels/mattermost) (plugin): token bot + URL base.
    - [Signal](/it/channels/signal): installazione facoltativa di `signal-cli` + configurazione account.
    - [BlueBubbles](/it/channels/bluebubbles): **consigliato per iMessage**; URL server + password + webhook.
    - [iMessage](/it/channels/imessage): percorso legacy `imsg` CLI + accesso al DB.
    - Sicurezza DM: il valore predefinito è l'associazione. Il primo DM invia un codice; approvalo tramite `openclaw pairing approve <channel> <code>` oppure usa le allowlist.
  </Step>
  <Step title="Ricerca web">
    - Scegli un provider supportato come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (oppure salta).
    - I provider basati su API possono usare variabili d'ambiente o configurazione esistente per una configurazione rapida; i provider senza chiave usano invece i prerequisiti specifici del provider.
    - Salta con `--skip-search`.
    - Configura in seguito: `openclaw configure --section web`.
  </Step>
  <Step title="Installazione del daemon">
    - macOS: LaunchAgent
      - Richiede una sessione utente con login effettuato; per ambienti headless, usa un LaunchDaemon personalizzato (non fornito).
    - Linux (e Windows tramite WSL2): unità utente systemd
      - L'onboarding prova ad abilitare il lingering tramite `loginctl enable-linger <user>` così il Gateway resta attivo dopo il logout.
      - Potrebbe richiedere sudo (scrive in `/var/lib/systemd/linger`); prima prova senza sudo.
    - **Selezione runtime:** Node (consigliato; richiesto per WhatsApp/Telegram). Bun **non è consigliato**.
    - Se l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione del daemon lo convalida ma non mantiene i valori risolti del token in plaintext nei metadati dell'ambiente del servizio supervisor.
    - Se l'autenticazione token richiede un token e il SecretRef del token configurato non è risolto, l'installazione del daemon viene bloccata con indicazioni operative.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.
  </Step>
  <Step title="Controllo integrità">
    - Avvia il Gateway (se necessario) ed esegue `openclaw health`.
    - Suggerimento: `openclaw status --deep` aggiunge alla visualizzazione dello stato il probe live di integrità del gateway, inclusi i probe dei canali quando supportati (richiede un gateway raggiungibile).
  </Step>
  <Step title="Skills (consigliato)">
    - Legge le Skills disponibili e controlla i requisiti.
    - Ti consente di scegliere un gestore Node: **npm / pnpm** (bun non consigliato).
    - Installa dipendenze facoltative (alcune usano Homebrew su macOS).
  </Step>
  <Step title="Fine">
    - Riepilogo + passaggi successivi, incluse le app iOS/Android/macOS per funzionalità aggiuntive.
  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, l'onboarding stampa le istruzioni di port forwarding SSH per la UI di controllo invece di aprire un browser.
Se mancano gli asset della UI di controllo, l'onboarding tenta di compilarli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
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

Esempi di comandi specifici per provider si trovano in [Automazione CLI](/start/wizard-cli-automation#provider-specific-examples).
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

## RPC della procedura guidata del Gateway

Il Gateway espone il flusso di onboarding tramite RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
I client (app macOS, UI di controllo) possono visualizzare i passaggi senza reimplementare la logica di onboarding.

## Configurazione Signal (signal-cli)

L'onboarding può installare `signal-cli` dalle release GitHub:

- Scarica l'asset di release appropriato.
- Lo memorizza in `~/.openclaw/tools/signal-cli/<version>/`.
- Scrive `channels.signal.cliPath` nella tua configurazione.

Note:

- Le build JVM richiedono **Java 21**.
- Le build native vengono usate quando disponibili.
- Windows usa WSL2; l'installazione di signal-cli segue il flusso Linux all'interno di WSL.

## Cosa scrive la procedura guidata

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se viene scelto Minimax)
- `tools.profile` (l'onboarding locale usa `"coding"` come valore predefinito quando non impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (dettagli del comportamento: [Riferimento alla configurazione CLI](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist dei canali (Slack/Discord/Matrix/Microsoft Teams) quando scegli di abilitarle durante i prompt (i nomi vengono risolti in ID quando possibile).
- `skills.install.nodeManager`
  - `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può comunque usare `yarn` impostando direttamente `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` scrive `agents.list[]` e gli eventuali `bindings`.

Le credenziali WhatsApp vengono salvate in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni vengono archiviate in `~/.openclaw/agents/<agentId>/sessions/`.

Alcuni canali sono distribuiti come plugin. Quando ne scegli uno durante la configurazione, l'onboarding
ti chiederà di installarlo (npm o un percorso locale) prima che possa essere configurato.

## Documentazione correlata

- Panoramica dell'onboarding: [Onboarding (CLI)](/start/wizard)
- Onboarding dell'app macOS: [Onboarding](/start/onboarding)
- Riferimento della configurazione: [Configurazione del Gateway](/it/gateway/configuration)
- Provider: [WhatsApp](/it/channels/whatsapp), [Telegram](/it/channels/telegram), [Discord](/it/channels/discord), [Google Chat](/it/channels/googlechat), [Signal](/it/channels/signal), [BlueBubbles](/it/channels/bluebubbles) (iMessage), [iMessage](/it/channels/imessage) (legacy)
- Skills: [Skills](/tools/skills), [Configurazione Skills](/tools/skills-config)
