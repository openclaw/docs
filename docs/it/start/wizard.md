---
read_when:
    - Eseguire o configurare l’onboarding della CLI
    - Configurazione di una nuova macchina
sidebarTitle: 'Onboarding: CLI'
summary: 'Configurazione iniziale della CLI: configurazione guidata per Gateway, area di lavoro, canali e Skills'
title: Configurazione iniziale (CLI)
x-i18n:
    generated_at: "2026-04-30T09:14:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding è il modo **consigliato** per configurare OpenClaw su macOS,
Linux o Windows (tramite WSL2; fortemente consigliato).
Configura un Gateway locale o una connessione a un Gateway remoto, oltre a canali, Skills
e impostazioni predefinite dello spazio di lavoro in un unico flusso guidato.

```bash
openclaw onboard
```

<Info>
Prima chat più rapida: apri la Control UI (non serve configurare alcun canale). Esegui
`openclaw dashboard` e chatta nel browser. Documentazione: [Dashboard](/it/web/dashboard).
</Info>

Per riconfigurare in seguito:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` non implica la modalità non interattiva. Per gli script, usa `--non-interactive`.
</Note>

<Tip>
CLI onboarding include un passaggio di ricerca web in cui puoi scegliere un provider
come Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG o Tavily. Alcuni provider richiedono una
chiave API, mentre altri non richiedono chiavi. Puoi configurarlo anche in seguito con
`openclaw configure --section web`. Documentazione: [Strumenti web](/it/tools/web).
</Tip>

## Avvio rapido e avanzato

L’onboarding inizia con **Avvio rapido** (impostazioni predefinite) o **Avanzato** (controllo completo).

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway locale (loopback)
    - Spazio di lavoro predefinito (o spazio di lavoro esistente)
    - Porta del Gateway **18789**
    - Autenticazione del Gateway **Token** (generato automaticamente, anche su loopback)
    - Criterio strumenti predefinito per le nuove configurazioni locali: `tools.profile: "coding"` (il profilo esplicito esistente viene conservato)
    - Impostazione predefinita di isolamento dei DM: l’onboarding locale scrive `session.dmScope: "per-channel-peer"` quando non è impostato. Dettagli: [Riferimento configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals)
    - Esposizione Tailscale **disattivata**
    - I DM di Telegram + WhatsApp usano per impostazione predefinita la **lista consentita** (ti verrà chiesto il tuo numero di telefono)

  </Tab>
  <Tab title="Advanced (full control)">
    - Espone ogni passaggio (modalità, spazio di lavoro, Gateway, canali, daemon, Skills).

  </Tab>
</Tabs>

## Cosa configura l’onboarding

La **modalità locale (predefinita)** ti guida attraverso questi passaggi:

1. **Modello/Auth** — scegli qualsiasi provider/flusso di autenticazione supportato (chiave API, OAuth o autenticazione manuale specifica del provider), incluso Provider personalizzato
   (compatibile con OpenAI, compatibile con Anthropic o rilevamento automatico sconosciuto). Scegli un modello predefinito.
   Nota di sicurezza: se questo agente eseguirà strumenti o elaborerà contenuti di webhook/hook, preferisci il modello di ultima generazione più potente disponibile e mantieni rigoroso il criterio degli strumenti. I livelli più deboli/vecchi sono più facili da sottoporre a prompt injection.
   Per esecuzioni non interattive, `--secret-input-mode ref` archivia nei profili di autenticazione riferimenti basati su variabili d’ambiente invece di valori di chiavi API in chiaro.
   Nella modalità `ref` non interattiva, la variabile d’ambiente del provider deve essere impostata; passare flag di chiave inline senza quella variabile d’ambiente causa un errore immediato.
   Nelle esecuzioni interattive, scegliere la modalità riferimento segreto ti consente di puntare a una variabile d’ambiente o a un riferimento provider configurato (`file` o `exec`), con una rapida validazione preliminare prima del salvataggio.
   Per Anthropic, onboarding/configure interattivo offre **Anthropic Claude CLI** come percorso locale preferito e **chiave API Anthropic** come percorso consigliato per la produzione. Anche Anthropic setup-token resta disponibile come percorso supportato di autenticazione tramite token.
2. **Spazio di lavoro** — posizione dei file dell’agente (predefinita `~/.openclaw/workspace`). Inizializza i file di bootstrap.
3. **Gateway** — porta, indirizzo di bind, modalità di autenticazione, esposizione Tailscale.
   In modalità token interattiva, scegli l’archiviazione predefinita del token in chiaro oppure abilita SecretRef.
   Percorso SecretRef del token non interattivo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canali** — canali di chat integrati e inclusi come BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e altri.
5. **Daemon** — installa un LaunchAgent (macOS), un’unità utente systemd (Linux/WSL2) o un’attività pianificata nativa di Windows con fallback alla cartella Startup per utente.
   Se l’autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, l’installazione del daemon lo valida ma non mantiene il token risolto nei metadati dell’ambiente del servizio supervisore.
   Se l’autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, l’installazione del daemon viene bloccata con indicazioni operative.
   Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l’installazione del daemon viene bloccata finché la modalità non viene impostata esplicitamente.
6. **Controllo di integrità** — avvia il Gateway e verifica che sia in esecuzione.
7. **Skills** — installa Skills consigliate e dipendenze facoltative.

<Note>
Eseguire di nuovo l’onboarding **non** cancella nulla, a meno che tu non scelga esplicitamente **Reimposta** (o passi `--reset`).
CLI `--reset` si applica per impostazione predefinita a configurazione, credenziali e sessioni; usa `--reset-scope full` per includere lo spazio di lavoro.
Se la configurazione non è valida o contiene chiavi legacy, l’onboarding ti chiede prima di eseguire `openclaw doctor`.
</Note>

La **modalità remota** configura solo il client locale per connettersi a un Gateway altrove.
Non installa né modifica nulla sull’host remoto.

## Aggiungere un altro agente

Usa `openclaw agents add <name>` per creare un agente separato con il proprio spazio di lavoro,
le proprie sessioni e i propri profili di autenticazione. L’esecuzione senza `--workspace` avvia l’onboarding.

Cosa imposta:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Note:

- Gli spazi di lavoro predefiniti seguono `~/.openclaw/workspace-<agentId>`.
- Aggiungi `bindings` per instradare i messaggi in ingresso (l’onboarding può farlo).
- Flag non interattivi: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Riferimento completo

Per dettagli passo per passo e output di configurazione, vedi
[Riferimento configurazione CLI](/it/start/wizard-cli-reference).
Per esempi non interattivi, vedi [Automazione CLI](/it/start/wizard-cli-automation).
Per il riferimento tecnico più approfondito, inclusi i dettagli RPC, vedi
[Riferimento onboarding](/it/reference/wizard).

## Documentazione correlata

- Riferimento comandi CLI: [`openclaw onboard`](/it/cli/onboard)
- Panoramica dell’onboarding: [Panoramica dell’onboarding](/it/start/onboarding-overview)
- Onboarding dell’app macOS: [Onboarding](/it/start/onboarding)
- Rituale di primo avvio dell’agente: [Bootstrap dell’agente](/it/start/bootstrapping)
